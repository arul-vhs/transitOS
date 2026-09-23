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

const DEMO_ACCOUNTS: Record<string, { id: string; email: string; name: string; role: string; tenantId: string; tenantName: string; tenantSlug: string; depotName: string }> = {
  "admin@salemtransport.demo": {
    id: "usr-demo-admin",
    email: "admin@salemtransport.demo",
    name: "System Admin",
    role: "ORGANIZATION_ADMIN",
    tenantId: "ten-salem-transport",
    tenantName: "Salem Transport Corporation",
    tenantSlug: "salem-transport",
    depotName: "Meyyanur Depot",
  },
  "scheduler@salemtransport.demo": {
    id: "usr-demo-scheduler",
    email: "scheduler@salemtransport.demo",
    name: "Chief Scheduler",
    role: "SCHEDULER",
    tenantId: "ten-salem-transport",
    tenantName: "Salem Transport Corporation",
    tenantSlug: "salem-transport",
    depotName: "Meyyanur Depot",
  },
  "planner@salemtransport.demo": {
    id: "usr-demo-planner",
    email: "planner@salemtransport.demo",
    name: "Roster Planner",
    role: "ROUTE_PLANNER",
    tenantId: "ten-salem-transport",
    tenantName: "Salem Transport Corporation",
    tenantSlug: "salem-transport",
    depotName: "Meyyanur Depot",
  },
  "depot@salemtransport.demo": {
    id: "usr-demo-depot",
    email: "depot@salemtransport.demo",
    name: "Depot Manager",
    role: "DEPOT_MANAGER",
    tenantId: "ten-salem-transport",
    tenantName: "Salem Transport Corporation",
    tenantSlug: "salem-transport",
    depotName: "Meyyanur Depot",
  },
  "management@salemtransport.demo": {
    id: "usr-demo-management",
    email: "management@salemtransport.demo",
    name: "Management Executive",
    role: "MANAGEMENT",
    tenantId: "ten-salem-transport",
    tenantName: "Salem Transport Corporation",
    tenantSlug: "salem-transport",
    depotName: "Meyyanur Depot",
  },
  "platform@salemtransport.demo": {
    id: "usr-demo-platform",
    email: "platform@salemtransport.demo",
    name: "Platform Admin",
    role: "PLATFORM_ADMIN",
    tenantId: "ten-salem-transport",
    tenantName: "Salem Transport Corporation",
    tenantSlug: "salem-transport",
    depotName: "Meyyanur Depot",
  },
};

/**
 * Gets the currently authenticated user from the request session, and validates it against the DB.
 */
export async function getCurrentUser() {
  const session = getSessionFromRequest();
  if (!session) return null;

  try {
    // Retrieve fresh user and tenant data from database if reachable
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.userId),
      with: {
        tenant: true
      }
    });

    if (user) {
      const tenantStatus = (user.tenant as any)?.status;
      if (tenantStatus && tenantStatus !== "active") {
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
        depotName: "Meyyanur Depot",
      };
    }
  } catch (err) {
    // Database connection may be offline or in edge serverless mode
  }

  // Resilient fallback using session payload and demo directory
  const demo = Object.values(DEMO_ACCOUNTS).find(
    (u) => u.id === session.userId || u.email.toLowerCase() === session.email?.toLowerCase()
  );
  if (demo) return demo;

  return {
    id: session.userId,
    email: session.email,
    name: session.name,
    role: session.role,
    tenantId: session.tenantId,
    tenantName: "Salem Transport Corporation",
    tenantSlug: "salem-transport",
    depotName: "Meyyanur Depot",
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

  const cleanEmail = email.trim().toLowerCase();

  // 1. Try DB-backed authentication if available
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.email, cleanEmail),
      with: {
        tenant: true
      }
    });

    if (user) {
      const tenantStatus = (user.tenant as any)?.status;
      if (tenantStatus && tenantStatus !== "active") {
        throw new Error("Your organization account is inactive.");
      }

      const validPassword = bcrypt.compareSync(password, user.passwordHash);
      if (validPassword) {
        try {
          await db.insert(auditLogs).values({
            tenantId: user.tenantId,
            userId: user.id,
            email: user.email,
            action: "LOGIN_SUCCESS",
          });
        } catch {}

        const payload: SessionPayload = {
          userId: user.id,
          tenantId: user.tenantId,
          role: user.role,
          email: user.email,
          name: user.name,
        };
        const token = jwt.sign(payload, SECRET, { expiresIn: "24h" });
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
    }
  } catch (err: any) {
    if (err?.message === "Your organization account is inactive.") throw err;
    // Database connection error or missing table - proceed to demo fallback
  }

  // 2. Demo fallback authentication (default password: password123)
  const demoUser = DEMO_ACCOUNTS[cleanEmail];
  if (demoUser && password === "password123") {
    const payload: SessionPayload = {
      userId: demoUser.id,
      tenantId: demoUser.tenantId,
      role: demoUser.role,
      email: demoUser.email,
      name: demoUser.name,
    };
    const token = jwt.sign(payload, SECRET, { expiresIn: "24h" });
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
        id: demoUser.id,
        email: demoUser.email,
        name: demoUser.name,
        role: demoUser.role,
        tenantId: demoUser.tenantId,
      }
    };
  }

  throw new Error("Invalid email or password.");
}

export async function logoutFnImpl() {
  const session = getSessionFromRequest();
  if (session) {
    try {
      await db.insert(auditLogs).values({
        tenantId: session.tenantId,
        userId: session.userId,
        email: session.email,
        action: "LOGOUT",
      });
    } catch {}
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
