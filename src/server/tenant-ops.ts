import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "./db";
import {
  tenants,
  buses,
  crew,
  routes,
  stops,
  trips,
  duties,
  dutyTrips,
  users,
  auditLogs,
} from "./db/schema";
import {
  requireAuth,
  requirePermission,
  SALEM_TENANT_ID,
  CHENNAI_MTC_TENANT_ID,
  createAndSetSessionCookie,
  DEMO_ACCOUNTS,
  SessionPayload,
} from "./auth";
import {
  FALLBACK_BUSES,
  FALLBACK_CREW,
  FALLBACK_ROUTES,
  FALLBACK_STOPS,
  FALLBACK_TRIPS,
  FALLBACK_DUTIES,
} from "./db/fallback-data";

export async function getTenantsImpl() {
  const currentUser = await requireAuth();

  try {
    const dbTenants = await db.select().from(tenants);
    if (dbTenants && dbTenants.length > 0) {
      return dbTenants;
    }
  } catch (err) {
    // Database connection may be offline or in fallback mode
  }

  return [
    {
      id: CHENNAI_MTC_TENANT_ID,
      name: "Chennai Metropolitan Transport Corporation",
      slug: "chennai-mtc",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: SALEM_TENANT_ID,
      name: "Salem Transport Corporation",
      slug: "salem-transport",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
}

export async function createTenantImpl(data: {
  name: string;
  code: string;
  region: string;
  fleetSize?: number;
}) {
  const currentUser = await requireAuth();
  await requirePermission(currentUser.role, "organization.manage");

  if (!data.name || !data.name.trim()) {
    throw new Error("Corporation name is required");
  }
  if (!data.code || !data.code.trim()) {
    throw new Error("Corporation short code is required");
  }

  const cleanName = data.name.trim();
  const cleanCode = data.code.trim().toUpperCase();
  const slug = cleanName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const tenantId = crypto.randomUUID();
  const fleetCount = Math.max(4, Math.min(60, Number(data.fleetSize) || 12));

  // 1. Insert into Database
  let createdTenant: any = null;
  try {
    const [inserted] = await db
      .insert(tenants)
      .values({
        id: tenantId,
        name: cleanName,
        slug,
      })
      .returning();
    createdTenant = inserted;

    // 2. Seed starter buses
    const starterBuses = [];
    for (let i = 1; i <= Math.min(fleetCount, 8); i++) {
      const fleetNum = `${cleanCode}-${String(i).padStart(3, "0")}`;
      const regNum = `TN-XX-N-${1000 + i}`;
      const [b] = await db
        .insert(buses)
        .values({
          tenantId,
          registrationNumber: regNum,
          fleetNumber: fleetNum,
          depot: `${cleanName} Central Depot`,
          busType: "Ashok Leyland 210 HP BS-VI Viking",
          capacity: 48,
          status: "available",
          availableFrom: 330,
        })
        .returning();
      if (b) starterBuses.push(b);
    }

    // 3. Seed starter crew
    const starterCrew = [];
    const crewRoles = ["driver", "conductor", "driver", "conductor"];
    const crewNames = [
      "K. Murugesan",
      "V. Sundaram",
      "R. Palanisamy",
      "M. Selvaraj",
    ];
    for (let i = 0; i < crewRoles.length; i++) {
      const empId = `${cleanCode}-EMP-${String(i + 1).padStart(3, "0")}`;
      const [c] = await db
        .insert(crew)
        .values({
          tenantId,
          employeeId: empId,
          name: crewNames[i]!,
          role: crewRoles[i]!,
          depot: `${cleanName} Central Depot`,
          status: "available",
          availableFrom: 330,
          restUntil: 330,
          licenseCategory:
            crewRoles[i] === "driver"
              ? "Heavy Passenger Vehicle (HPV) / PSV Badge"
              : null,
        })
        .returning();
      if (c) starterCrew.push(c);
    }

    // 4. Seed 2 starter corridors
    const [route1] = await db
      .insert(routes)
      .values({
        tenantId,
        code: `${cleanCode}-1`,
        name: `${cleanName} Express Line 1`,
        origin: `${cleanName} Bus Terminal`,
        destination: "City Junction Hub",
        lengthKm: "12.50",
        durationMin: 35,
        direction: "UP",
        status: "active",
        color: "#2563EB",
        peakFrequency: 15,
        offPeakFrequency: 30,
      })
      .returning();

    const [route2] = await db
      .insert(routes)
      .values({
        tenantId,
        code: `${cleanCode}-2`,
        name: `${cleanName} Cross-City Line 2`,
        origin: "North Suburb Terminus",
        destination: "South Industrial Estate",
        lengthKm: "16.80",
        durationMin: 45,
        direction: "UP",
        status: "active",
        color: "#059669",
        peakFrequency: 20,
        offPeakFrequency: 40,
      })
      .returning();

    // 5. Seed stops for routes
    if (route1) {
      const stopNames = [
        `${cleanName} Bus Terminal`,
        "Government Hospital",
        "Town Market Roundana",
        "Collectorate Complex",
        "City Junction Hub",
      ];
      for (let sIdx = 0; sIdx < stopNames.length; sIdx++) {
        await db.insert(stops).values({
          tenantId,
          routeId: route1.id,
          name: stopNames[sIdx]!,
          sequence: sIdx + 1,
          latitude: "11.6643",
          longitude: "78.1460",
        });
      }

      // Seed 4 trips for route 1
      for (let tIdx = 0; tIdx < 4; tIdx++) {
        const startMin = 360 + tIdx * 60;
        await db.insert(trips).values({
          tenantId,
          routeId: route1.id,
          tripCode: `TR-${cleanCode}-${101 + tIdx}`,
          direction: tIdx % 2 === 0 ? "OUTBOUND" : "RETURN",
          startTime: startMin,
          endTime: startMin + 35,
          durationMin: 35,
          distanceKm: "12.50",
          origin: `${cleanName} Bus Terminal`,
          destination: "City Junction Hub",
          status: "scheduled",
          serviceDate: "25 Aug 2026",
          plannedStart: startMin,
          plannedEnd: startMin + 35,
          plannedDuration: 35,
        });
      }
    }

    if (route2) {
      const stopNames = [
        "North Suburb Terminus",
        "Industrial Bypass",
        "Tech Park Gate 1",
        "South Industrial Estate",
      ];
      for (let sIdx = 0; sIdx < stopNames.length; sIdx++) {
        await db.insert(stops).values({
          tenantId,
          routeId: route2.id,
          name: stopNames[sIdx]!,
          sequence: sIdx + 1,
          latitude: "11.6700",
          longitude: "78.1500",
        });
      }
    }

    // 6. Audit log
    await db.insert(auditLogs).values({
      tenantId,
      userId: currentUser.id,
      email: currentUser.email,
      action: "TENANT_REGISTERED",
      details: `Registered corporation ${cleanName} (${cleanCode}) with ${starterBuses.length} buses and ${starterCrew.length} crew.`,
    });
  } catch (err: any) {
    console.warn("Database error creating tenant, using fallback registration:", err);
  }

  // Also seed fallback in-memory records so views work regardless of DB status
  for (let i = 1; i <= Math.min(fleetCount, 8); i++) {
    const fleetNum = `${cleanCode}-${String(i).padStart(3, "0")}`;
    const regNum = `TN-XX-N-${1000 + i}`;
    FALLBACK_BUSES.push({
      id: `bus-${tenantId}-${i}`,
      tenantId,
      registrationNumber: regNum,
      fleetNumber: fleetNum,
      depot: `${cleanName} Central Depot`,
      status: "available",
      busType: "Ashok Leyland 210 HP BS-VI Viking",
      capacity: 48,
      availableFrom: 330,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  const crewRoles = ["driver", "conductor", "driver", "conductor"];
  const crewNames = [
    "K. Murugesan",
    "V. Sundaram",
    "R. Palanisamy",
    "M. Selvaraj",
  ];
  for (let i = 0; i < crewRoles.length; i++) {
    const empId = `${cleanCode}-EMP-${String(i + 1).padStart(3, "0")}`;
    FALLBACK_CREW.push({
      id: `crew-${tenantId}-${i + 1}`,
      tenantId,
      employeeId: empId,
      name: crewNames[i]!,
      role: crewRoles[i]!,
      status: "available",
      depot: `${cleanName} Central Depot`,
      availableFrom: 330,
      restUntil: 330,
      licenseCategory:
        crewRoles[i] === "driver"
          ? "Heavy Passenger Vehicle (HPV) / PSV Badge"
          : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  const r1Id = `route-${tenantId}-1`;
  FALLBACK_ROUTES.push({
    id: r1Id,
    tenantId,
    code: `${cleanCode}-1`,
    name: `${cleanName} Express Line 1`,
    origin: `${cleanName} Bus Terminal`,
    destination: "City Junction Hub",
    direction: "UP",
    lengthKm: "12.50",
    distanceKm: "12.50",
    durationMin: 35,
    runtimeMinutes: 35,
    geometryGeojson: null,
    polyline: null,
    status: "active",
    color: "#2563EB",
    peakFrequency: 15,
    offPeakFrequency: 30,
    stopsCount: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const stopNames = [
    `${cleanName} Bus Terminal`,
    "Government Hospital",
    "Town Market Roundana",
    "Collectorate Complex",
    "City Junction Hub",
  ];
  stopNames.forEach((name, sIdx) => {
    FALLBACK_STOPS.push({
      id: `stop-${tenantId}-1-${sIdx + 1}`,
      tenantId,
      routeId: r1Id,
      name,
      code: name,
      sequence: sIdx + 1,
      sequenceOrder: sIdx + 1,
      latitude: "11.6643",
      longitude: "78.1460",
      isTimepoint: true,
    });
  });

  for (let tIdx = 0; tIdx < 4; tIdx++) {
    const startMin = 360 + tIdx * 60;
    FALLBACK_TRIPS.push({
      id: `trip-${tenantId}-1-${tIdx + 1}`,
      tenantId,
      routeId: r1Id,
      tripCode: `TR-${cleanCode}-${101 + tIdx}`,
      tripNumber: `TR-${cleanCode}-${101 + tIdx}`,
      direction: tIdx % 2 === 0 ? "OUTBOUND" : "RETURN",
      startTime: startMin,
      endTime: startMin + 35,
      startMinutes: startMin,
      endMinutes: startMin + 35,
      durationMin: 35,
      distanceKm: "12.50",
      origin: `${cleanName} Bus Terminal`,
      destination: "City Junction Hub",
      status: "scheduled",
      serviceDate: "25 Aug 2026",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  return {
    id: createdTenant?.id || tenantId,
    name: cleanName,
    slug,
    code: cleanCode,
    region: data.region || "Tamil Nadu Transit Division",
    fleetSize: fleetCount,
  };
}

export async function deleteTenantImpl(tenantId: string) {
  const currentUser = await requireAuth();
  await requirePermission(currentUser.role, "organization.manage");

  if (!tenantId) {
    throw new Error("Tenant ID is required");
  }

  // Protect canonical system tenants
  if (
    tenantId === SALEM_TENANT_ID ||
    tenantId === CHENNAI_MTC_TENANT_ID
  ) {
    throw new Error("Protected municipal corporation: Default system tenants cannot be removed.");
  }

  // 1. Delete from database (cascades foreign keys)
  try {
    await db.delete(tenants).where(eq(tenants.id, tenantId));
  } catch (err: any) {
    console.warn("Database error deleting tenant:", err);
  }

  // 2. Remove from fallback datasets
  for (let i = FALLBACK_BUSES.length - 1; i >= 0; i--) {
    if (FALLBACK_BUSES[i]!.tenantId === tenantId) FALLBACK_BUSES.splice(i, 1);
  }
  for (let i = FALLBACK_CREW.length - 1; i >= 0; i--) {
    if (FALLBACK_CREW[i]!.tenantId === tenantId) FALLBACK_CREW.splice(i, 1);
  }
  for (let i = FALLBACK_ROUTES.length - 1; i >= 0; i--) {
    if (FALLBACK_ROUTES[i]!.tenantId === tenantId) FALLBACK_ROUTES.splice(i, 1);
  }
  for (let i = FALLBACK_STOPS.length - 1; i >= 0; i--) {
    if (FALLBACK_STOPS[i]!.tenantId === tenantId) FALLBACK_STOPS.splice(i, 1);
  }
  for (let i = FALLBACK_TRIPS.length - 1; i >= 0; i--) {
    if (FALLBACK_TRIPS[i]!.tenantId === tenantId) FALLBACK_TRIPS.splice(i, 1);
  }
  for (let i = FALLBACK_DUTIES.length - 1; i >= 0; i--) {
    if (FALLBACK_DUTIES[i]!.tenantId === tenantId) FALLBACK_DUTIES.splice(i, 1);
  }

  // 3. Audit log
  try {
    await db.insert(auditLogs).values({
      tenantId: SALEM_TENANT_ID,
      userId: currentUser.id,
      email: currentUser.email,
      action: "TENANT_DELETED",
      details: `Removed corporation tenant ID: ${tenantId}`,
    });
  } catch {}

  return { success: true, deletedTenantId: tenantId };
}

export interface OnboardTenantInput {
  name: string;
  code: string;
  region?: string;
  depotName?: string;
  adminName: string;
  email: string;
  password: string;
  dataset?: {
    routes?: Array<{
      code: string;
      name: string;
      origin?: string;
      destination?: string;
      lengthKm?: number | string;
      durationMin?: number;
      peakFrequency?: number;
      offPeakFrequency?: number;
      color?: string;
    }>;
    buses?: Array<{
      registrationNumber: string;
      fleetNumber?: string;
      depot?: string;
      busType?: string;
      capacity?: number;
    }>;
    crew?: Array<{
      employeeId: string;
      name: string;
      role: "driver" | "conductor" | string;
      depot?: string;
      licenseCategory?: string;
    }>;
    trips?: Array<{
      routeCode?: string;
      tripCode?: string;
      direction?: string;
      startTime?: number;
      endTime?: number;
      durationMin?: number;
      origin?: string;
      destination?: string;
    }>;
  };
}

export async function onboardTenantAndSignupImpl(data: OnboardTenantInput) {
  if (!data.name || !data.name.trim()) {
    throw new Error("Corporation name is required");
  }
  if (!data.code || !data.code.trim()) {
    throw new Error("Corporation short code is required");
  }
  if (!data.adminName || !data.adminName.trim()) {
    throw new Error("Administrator name is required");
  }
  if (!data.email || !data.email.trim()) {
    throw new Error("Administrator email address is required");
  }
  if (!data.password || data.password.length < 6) {
    throw new Error("Password must be at least 6 characters in length");
  }

  const cleanName = data.name.trim();
  const cleanCode = data.code.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
  const cleanAdminName = data.adminName.trim();
  const cleanEmail = data.email.trim().toLowerCase();
  const depotName =
    data.depotName?.trim() || `${cleanName} Central Operations Depot`;
  const slug = cleanName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  // 1. Verify email uniqueness
  try {
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, cleanEmail),
    });
    if (existingUser) {
      throw new Error(
        "An account with this email address is already registered. Please sign in instead.",
      );
    }
  } catch (err: any) {
    if (err?.message?.includes("already registered")) {
      throw err;
    }
  }

  if (DEMO_ACCOUNTS[cleanEmail]) {
    throw new Error(
      "This email address is reserved by system demonstration accounts. Please choose a different work email.",
    );
  }

  const tenantId = crypto.randomUUID();
  const userId = crypto.randomUUID();
  const passwordHash = bcrypt.hashSync(data.password, 10);

  // 2. Insert Tenant & Admin User into DB
  try {
    await db.insert(tenants).values({
      id: tenantId,
      name: cleanName,
      slug,
    });

    await db.insert(users).values({
      id: userId,
      tenantId,
      email: cleanEmail,
      passwordHash,
      name: cleanAdminName,
      role: "ORGANIZATION_ADMIN",
    });
  } catch (err: any) {
    console.warn("Database notice during tenant/user creation:", err);
  }

  // 3. Fallback memory account registration
  DEMO_ACCOUNTS[cleanEmail] = {
    id: userId,
    email: cleanEmail,
    name: cleanAdminName,
    role: "ORGANIZATION_ADMIN",
    tenantId,
    tenantName: cleanName,
    tenantSlug: slug,
    depotName,
  };

  // 4. Ingest or Seed Routes & Stops
  const incomingRoutes = data.dataset?.routes || [];
  const routeIdMap = new Map<string, string>(); // code -> routeId

  if (incomingRoutes.length > 0) {
    for (let i = 0; i < incomingRoutes.length; i++) {
      const r = incomingRoutes[i]!;
      const rCode = r.code?.trim() || `${cleanCode}-${i + 1}`;
      const rName = r.name?.trim() || `${cleanName} Route ${rCode}`;
      const rOrigin = r.origin?.trim() || `${cleanName} Terminal`;
      const rDest = r.destination?.trim() || "City Center Terminal";
      const lengthKm = (Number(r.lengthKm) || 12.5).toFixed(2);
      const durationMin = Math.max(10, Math.min(180, Number(r.durationMin) || 35));
      const peakFreq = Math.max(5, Math.min(60, Number(r.peakFrequency) || 15));
      const offPeakFreq = Math.max(10, Math.min(120, Number(r.offPeakFrequency) || 30));
      const color = r.color || (i % 2 === 0 ? "#2563EB" : "#059669");
      const rId = crypto.randomUUID();
      routeIdMap.set(rCode, rId);

      try {
        await db.insert(routes).values({
          id: rId,
          tenantId,
          code: rCode,
          name: rName,
          origin: rOrigin,
          destination: rDest,
          lengthKm,
          durationMin,
          direction: "UP",
          status: "active",
          color,
          peakFrequency: peakFreq,
          offPeakFrequency: offPeakFreq,
        });

        // Generate 5 stops along corridor
        const stopNames = [
          rOrigin,
          `${rOrigin} Junction`,
          `${cleanName} Commercial Hub`,
          "Collectorate Circle",
          rDest,
        ];
        for (let s = 0; s < stopNames.length; s++) {
          await db.insert(stops).values({
            tenantId,
            routeId: rId,
            name: stopNames[s]!,
            sequence: s + 1,
            latitude: (11.664 + s * 0.008).toFixed(6),
            longitude: (78.146 + s * 0.008).toFixed(6),
          });
        }
      } catch (err: any) {
        console.warn("DB notice during route insertion:", err);
      }

      // Memory fallback route
      FALLBACK_ROUTES.push({
        id: rId,
        tenantId,
        code: rCode,
        name: rName,
        origin: rOrigin,
        destination: rDest,
        direction: "UP",
        lengthKm,
        distanceKm: lengthKm,
        durationMin,
        runtimeMinutes: durationMin,
        geometryGeojson: null,
        polyline: null,
        status: "active",
        color,
        peakFrequency: peakFreq,
        offPeakFrequency: offPeakFreq,
        stopsCount: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const stopNames = [
        rOrigin,
        `${rOrigin} Junction`,
        `${cleanName} Commercial Hub`,
        "Collectorate Circle",
        rDest,
      ];
      stopNames.forEach((sName, sIdx) => {
        FALLBACK_STOPS.push({
          id: `stop-${rId}-${sIdx + 1}`,
          tenantId,
          routeId: rId,
          name: sName,
          code: sName,
          sequence: sIdx + 1,
          sequenceOrder: sIdx + 1,
          latitude: (11.664 + sIdx * 0.008).toFixed(6),
          longitude: (78.146 + sIdx * 0.008).toFixed(6),
          isTimepoint: true,
        });
      });
    }
  } else {
    // Seed 2 default routes
    const defaultCorridors = [
      {
        code: `${cleanCode}-01`,
        name: `${cleanName} Main Line 1`,
        origin: `${cleanName} Central Bus Station`,
        destination: "Railway Junction Hub",
        lengthKm: "14.20",
        durationMin: 38,
        color: "#2563EB",
      },
      {
        code: `${cleanCode}-02`,
        name: `${cleanName} Cross-City Corridor 2`,
        origin: "North Ring Road Terminal",
        destination: "South Industrial Estate",
        lengthKm: "18.50",
        durationMin: 45,
        color: "#059669",
      },
    ];

    for (let i = 0; i < defaultCorridors.length; i++) {
      const c = defaultCorridors[i]!;
      const rId = crypto.randomUUID();
      routeIdMap.set(c.code, rId);

      try {
        await db.insert(routes).values({
          id: rId,
          tenantId,
          code: c.code,
          name: c.name,
          origin: c.origin,
          destination: c.destination,
          lengthKm: c.lengthKm,
          durationMin: c.durationMin,
          direction: "UP",
          status: "active",
          color: c.color,
          peakFrequency: 15,
          offPeakFrequency: 30,
        });
      } catch {}

      FALLBACK_ROUTES.push({
        id: rId,
        tenantId,
        code: c.code,
        name: c.name,
        origin: c.origin,
        destination: c.destination,
        direction: "UP",
        lengthKm: c.lengthKm,
        distanceKm: c.lengthKm,
        durationMin: c.durationMin,
        runtimeMinutes: c.durationMin,
        geometryGeojson: null,
        polyline: null,
        status: "active",
        color: c.color,
        peakFrequency: 15,
        offPeakFrequency: 30,
        stopsCount: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }

  // 5. Ingest or Seed Fleet Buses
  const incomingBuses = data.dataset?.buses || [];
  if (incomingBuses.length > 0) {
    for (let i = 0; i < incomingBuses.length; i++) {
      const b = incomingBuses[i]!;
      const reg =
        b.registrationNumber?.trim() || `TN-XX-${cleanCode}-${1000 + i}`;
      const fleetNum =
        b.fleetNumber?.trim() || `${cleanCode}-${String(i + 1).padStart(3, "0")}`;
      const bType =
        b.busType?.trim() || "Ashok Leyland 210 HP BS-VI Viking";
      const bCap = Number(b.capacity) || 48;
      const bDepot = b.depot?.trim() || depotName;
      const bId = crypto.randomUUID();

      try {
        await db.insert(buses).values({
          id: bId,
          tenantId,
          registrationNumber: reg,
          fleetNumber: fleetNum,
          depot: bDepot,
          busType: bType,
          capacity: bCap,
          status: "available",
          availableFrom: 330,
        });
      } catch {}

      FALLBACK_BUSES.push({
        id: bId,
        tenantId,
        registrationNumber: reg,
        fleetNumber: fleetNum,
        depot: bDepot,
        status: "available",
        busType: bType,
        capacity: bCap,
        availableFrom: 330,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  } else {
    // Seed 8 starter buses
    for (let i = 1; i <= 8; i++) {
      const bId = crypto.randomUUID();
      const reg = `TN-XX-${cleanCode}-${1000 + i}`;
      const fleetNum = `${cleanCode}-${String(i).padStart(3, "0")}`;
      const bType =
        i % 3 === 0
          ? "Tata Marcopolo Low-Floor BS-VI"
          : "Ashok Leyland 210 HP BS-VI Viking";
      const bCap = i % 3 === 0 ? 54 : 48;

      try {
        await db.insert(buses).values({
          id: bId,
          tenantId,
          registrationNumber: reg,
          fleetNumber: fleetNum,
          depot: depotName,
          busType: bType,
          capacity: bCap,
          status: "available",
          availableFrom: 330,
        });
      } catch {}

      FALLBACK_BUSES.push({
        id: bId,
        tenantId,
        registrationNumber: reg,
        fleetNumber: fleetNum,
        depot: depotName,
        status: "available",
        busType: bType,
        capacity: bCap,
        availableFrom: 330,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }

  // 6. Ingest or Seed Crew Members
  const incomingCrew = data.dataset?.crew || [];
  if (incomingCrew.length > 0) {
    for (let i = 0; i < incomingCrew.length; i++) {
      const c = incomingCrew[i]!;
      const empId =
        c.employeeId?.trim() || `${cleanCode}-EMP-${String(i + 1).padStart(3, "0")}`;
      const cName = c.name?.trim() || `Staff Member ${i + 1}`;
      const cRole =
        c.role?.toLowerCase() === "conductor" ? "conductor" : "driver";
      const cDepot = c.depot?.trim() || depotName;
      const lic =
        c.licenseCategory?.trim() ||
        (cRole === "driver"
          ? "Heavy Passenger Vehicle (HPV) / PSV Badge"
          : null);
      const cId = crypto.randomUUID();

      try {
        await db.insert(crew).values({
          id: cId,
          tenantId,
          employeeId: empId,
          name: cName,
          role: cRole,
          depot: cDepot,
          status: "available",
          availableFrom: 330,
          restUntil: 330,
          licenseCategory: lic,
        });
      } catch {}

      FALLBACK_CREW.push({
        id: cId,
        tenantId,
        employeeId: empId,
        name: cName,
        role: cRole,
        status: "available",
        depot: cDepot,
        availableFrom: 330,
        restUntil: 330,
        licenseCategory: lic,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  } else {
    // Seed 8 crew members (4 drivers, 4 conductors)
    const starterCrewList = [
      { name: "P. Rengarajan", role: "driver" },
      { name: "S. Muthukrishnan", role: "conductor" },
      { name: "V. Govindasamy", role: "driver" },
      { name: "A. Soundararajan", role: "conductor" },
      { name: "M. Jayachandran", role: "driver" },
      { name: "K. Rajendran", role: "conductor" },
      { name: "T. Thirunavukkarasu", role: "driver" },
      { name: "N. Selvamani", role: "conductor" },
    ];

    for (let i = 0; i < starterCrewList.length; i++) {
      const sc = starterCrewList[i]!;
      const cId = crypto.randomUUID();
      const empId = `${cleanCode}-EMP-${String(i + 1).padStart(3, "0")}`;
      const lic =
        sc.role === "driver"
          ? "Heavy Passenger Vehicle (HPV) / PSV Badge"
          : null;

      try {
        await db.insert(crew).values({
          id: cId,
          tenantId,
          employeeId: empId,
          name: sc.name,
          role: sc.role,
          depot: depotName,
          status: "available",
          availableFrom: 330,
          restUntil: 330,
          licenseCategory: lic,
        });
      } catch {}

      FALLBACK_CREW.push({
        id: cId,
        tenantId,
        employeeId: empId,
        name: sc.name,
        role: sc.role,
        status: "available",
        depot: depotName,
        availableFrom: 330,
        restUntil: 330,
        licenseCategory: lic,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }

  // 7. Ingest or Seed Trips
  const incomingTrips = data.dataset?.trips || [];
  const primaryRouteId =
    Array.from(routeIdMap.values())[0] ||
    FALLBACK_ROUTES.find((r) => r.tenantId === tenantId)?.id ||
    "route-1";

  if (incomingTrips.length > 0) {
    for (let i = 0; i < incomingTrips.length; i++) {
      const t = incomingTrips[i]!;
      const rId =
        (t.routeCode && routeIdMap.get(t.routeCode)) || primaryRouteId;
      const tripCode =
        t.tripCode?.trim() || `TR-${cleanCode}-${101 + i}`;
      const dir =
        t.direction?.toUpperCase() === "RETURN" ? "RETURN" : "OUTBOUND";
      const startTime = Number(t.startTime) || 360 + (i % 8) * 45;
      const dur = Number(t.durationMin) || 35;
      const endTime = Number(t.endTime) || startTime + dur;
      const origin = t.origin || `${cleanName} Bus Terminal`;
      const dest = t.destination || "City Junction Hub";
      const tId = crypto.randomUUID();

      try {
        await db.insert(trips).values({
          id: tId,
          tenantId,
          routeId: rId,
          tripCode,
          direction: dir,
          startTime,
          endTime,
          durationMin: dur,
          distanceKm: "12.50",
          origin,
          destination: dest,
          status: "scheduled",
          serviceDate: "25 Aug 2026",
          plannedStart: startTime,
          plannedEnd: endTime,
          plannedDuration: dur,
        });
      } catch {}

      FALLBACK_TRIPS.push({
        id: tId,
        tenantId,
        routeId: rId,
        tripCode,
        tripNumber: tripCode,
        direction: dir,
        startTime,
        endTime,
        startMinutes: startTime,
        endMinutes: endTime,
        durationMin: dur,
        distanceKm: "12.50",
        origin,
        destination: dest,
        status: "scheduled",
        serviceDate: "25 Aug 2026",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  } else {
    // Seed 8 trips
    for (let i = 0; i < 8; i++) {
      const tId = crypto.randomUUID();
      const tripCode = `TR-${cleanCode}-${101 + i}`;
      const startMin = 360 + i * 45;
      const dur = 35;
      const endMin = startMin + dur;
      const dir = i % 2 === 0 ? "OUTBOUND" : "RETURN";

      try {
        await db.insert(trips).values({
          id: tId,
          tenantId,
          routeId: primaryRouteId,
          tripCode,
          direction: dir,
          startTime: startMin,
          endTime: endMin,
          durationMin: dur,
          distanceKm: "12.50",
          origin: `${cleanName} Central Bus Station`,
          destination: "Railway Junction Hub",
          status: "scheduled",
          serviceDate: "25 Aug 2026",
          plannedStart: startMin,
          plannedEnd: endMin,
          plannedDuration: dur,
        });
      } catch {}

      FALLBACK_TRIPS.push({
        id: tId,
        tenantId,
        routeId: primaryRouteId,
        tripCode,
        tripNumber: tripCode,
        direction: dir,
        startTime: startMin,
        endTime: endMin,
        startMinutes: startMin,
        endMinutes: endMin,
        durationMin: dur,
        distanceKm: "12.50",
        origin: `${cleanName} Central Bus Station`,
        destination: "Railway Junction Hub",
        status: "scheduled",
        serviceDate: "25 Aug 2026",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }

  // 8. Audit log registration
  try {
    await db.insert(auditLogs).values({
      tenantId,
      userId,
      email: cleanEmail,
      action: "CORP_ONBOARDED",
      details: `Onboarded corporation ${cleanName} (${cleanCode}) with admin ${cleanAdminName}.`,
    });
  } catch {}

  // 9. Sign and set session cookie
  const payload: SessionPayload = {
    userId,
    tenantId,
    role: "ORGANIZATION_ADMIN",
    email: cleanEmail,
    name: cleanAdminName,
  };
  createAndSetSessionCookie(payload);

  return {
    success: true,
    tenantId,
    tenantName: cleanName,
    tenantSlug: slug,
    user: {
      id: userId,
      email: cleanEmail,
      name: cleanAdminName,
      role: "ORGANIZATION_ADMIN",
      tenantId,
      tenantName: cleanName,
      tenantSlug: slug,
      depotName,
    },
  };
}
