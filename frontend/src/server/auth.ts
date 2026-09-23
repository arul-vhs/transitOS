import { getCookie, setCookie, deleteCookie } from "@tanstack/react-start/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { users, tenants, auditLogs } from "./db/schema";

const SECRET = process.env.SESSION_SECRET || "dev-session-secret-keys-for-transitos-platform-32-chars";
const COOKIE_NAME = "transitOS_session";

export interface SessionPayload {
  userId: string;
  tenantId: string;
  role: string;
  email: string;
  name: string;
}

import { ROLE_PERMISSIONS, hasPermission } from "../lib/auth-shared";

export function getSessionFromRequest(): SessionPayload | null {
  try {
    const token = getCookie(COOKIE_NAME);
    if (!token) return null;
    return jwt.verify(token, SECRET) as SessionPayload;
  } catch {
    return null;
  }
}

/**
 * Gets the currently authenticated user from the request session, and validates it against the DB.
 */
export async function getCurrentUser() {
  const session = getSessionFromRequest();
  if (!session) return null;

  // Retrieve fresh user and tenant data from database
  const user = await db.query.users.findFirst({
    where: eq(users.id, session.userId),
    with: {
      tenant: true
    }
  });

  const tenantStatus = (user.tenant as any)?.status;
  if (!user || (tenantStatus && tenantStatus !== "active")) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    tenantId: user.tenantId,
    tenantName: user.tenant.name,
    tenantSlug: user.tenant.slug,
    depotName: "Meyyanur Depot", // Default depot associated for the demo tenant
  };
}

/**
 * Enforces authentication, throwing an unauthorized error if no session is active.
 */
export async function requireAuth() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    throw new Error("Unauthorized");
  }
  return currentUser;
}

/**
 * Enforces permission verification for the authenticated user.
 */
export async function requirePermission(roleOrPermission: string, permission?: string) {
  const currentUser = await requireAuth();
  const perm = permission || roleOrPermission;
  if (!hasPermission(currentUser.role, perm)) {
    throw new Error("Forbidden");
  }
  return currentUser;
}

/**
 * Enforces and returns the authenticated user's tenant ID context.
 */
export async function requireTenant() {
  const currentUser = await requireAuth();
  return currentUser.tenantId;
}

// ----------------------------------------------------
// Server Functions for Authentication API
// ----------------------------------------------------

export async function loginFnImpl(credentials: { email: string; password?: string }) {
  const { email, password } = credentials;
  if (!email || !password) {
    throw new Error("Email and password are required.");
  }

  // 1. Find user
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
    with: {
      tenant: true
    }
  });

  if (!user) {
    // Record login failure without user id
    await db.insert(auditLogs).values({
      email,
      action: "LOGIN_FAILURE",
    });
    throw new Error("Invalid email or password.");
  }

  // 2. Check tenant status
  const tenantStatus = (user.tenant as any)?.status;
  if (tenantStatus && tenantStatus !== "active") {
    await db.insert(auditLogs).values({
      tenantId: user.tenantId,
      userId: user.id,
      email,
      action: "LOGIN_FAILURE",
    });
    throw new Error("Your organization account is inactive.");
  }

  // 3. Verify password
  const validPassword = bcrypt.compareSync(password, user.passwordHash);
  if (!validPassword) {
    await db.insert(auditLogs).values({
      tenantId: user.tenantId,
      userId: user.id,
      email,
      action: "LOGIN_FAILURE",
    });
    throw new Error("Invalid email or password.");
  }

  // 4. Log Success
  await db.insert(auditLogs).values({
    tenantId: user.tenantId,
    userId: user.id,
    email,
    action: "LOGIN_SUCCESS",
  });

  // 5. Generate Session Token
  const payload: SessionPayload = {
    userId: user.id,
    tenantId: user.tenantId,
    role: user.role,
    email: user.email,
    name: user.name,
  };
  const token = jwt.sign(payload, SECRET, { expiresIn: "24h" });

  // 6. Set HTTP-Only Cookie
  const isProd = process.env.NODE_ENV === "production";
  setCookie(COOKIE_NAME, token, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    maxAge: 86400,
    secure: isProd,
  });

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: user.tenantId,
    }
  };
}

export async function logoutFnImpl() {
  const session = getSessionFromRequest();
  if (session) {
    // Record logout audit log
    await db.insert(auditLogs).values({
      tenantId: session.tenantId,
      userId: session.userId,
      email: session.email,
      action: "LOGOUT",
    });
  }

  // Invalidate Session Cookie
  deleteCookie(COOKIE_NAME, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
  });

  return { success: true };
}

export async function getCurrentUserFnImpl() {
  return await getCurrentUser();
}
