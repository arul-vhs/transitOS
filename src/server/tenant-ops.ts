import { eq } from "drizzle-orm";
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
import { requireAuth, requirePermission, SALEM_TENANT_ID, CHENNAI_MTC_TENANT_ID } from "./auth";
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
