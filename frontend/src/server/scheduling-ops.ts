import { eq, and, or, like, asc, not, ne } from "drizzle-orm";
import { db } from "./db";
import { routes, stops, trips, duties, dutyTrips, dutyCrewSegments, buses, crew, auditLogs } from "./db/schema";
import { requireAuth, requirePermission } from "./auth";
import { SCHEDULING_CONFIG } from "../lib/transit/config";
import { FALLBACK_TRIPS, FALLBACK_DUTIES, FALLBACK_ROUTES } from "./db/fallback-data";

// ----------------------------------------------------
// Time Helpers
// ----------------------------------------------------

function formatMinutesToTime(totalMin: number): string {
  const hh = Math.floor(totalMin / 60);
  const mm = totalMin % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

// ----------------------------------------------------
// Trip Server Implementations
// ----------------------------------------------------

export async function getTripsImpl(filters?: {
  serviceDate?: string;
  routeId?: string;
  status?: string;
  direction?: string;
}) {
  const currentUser = await requireAuth();
  await requirePermission(currentUser.role, "schedule.view");

  try {
    let conditions = [eq(trips.tenantId, currentUser.tenantId)];

    if (filters?.serviceDate) {
      conditions.push(eq(trips.serviceDate, filters.serviceDate));
    }
    if (filters?.routeId && filters.routeId !== "all") {
      conditions.push(eq(trips.routeId, filters.routeId));
    }
    if (filters?.status && filters.status !== "all") {
      conditions.push(eq(trips.status, filters.status));
    }
    if (filters?.direction && filters.direction !== "all") {
      conditions.push(eq(trips.direction, filters.direction));
    }

    return await db
      .select({
        id: trips.id,
        tripCode: trips.tripCode,
        direction: trips.direction,
        startTime: trips.startTime,
        endTime: trips.endTime,
        durationMin: trips.durationMin,
        distanceKm: trips.distanceKm,
        origin: trips.origin,
        destination: trips.destination,
        status: trips.status,
        serviceDate: trips.serviceDate,
        routeId: trips.routeId,
        routeName: routes.name,
        routeCode: routes.code,
      })
      .from(trips)
      .innerJoin(routes, eq(trips.routeId, routes.id))
      .where(and(...conditions))
      .orderBy(trips.startTime);
  } catch (err) {
    let result = FALLBACK_TRIPS.map((t) => ({
      id: t.id,
      tripCode: t.tripNumber,
      direction: t.direction,
      startTime: t.startMinutes,
      endTime: t.endMinutes,
      durationMin: t.endMinutes - t.startMinutes,
      distanceKm: t.route?.distanceKm || "15.0",
      origin: t.route?.origin || "Salem Central",
      destination: t.route?.destination || "Omalur",
      status: t.status,
      serviceDate: filters?.serviceDate || "2026-08-25",
      routeId: t.routeId,
      routeName: t.route?.name || "Route 13: Salem to Omalur",
      routeCode: t.route?.code || "13",
    }));

    if (filters?.routeId && filters.routeId !== "all") {
      result = result.filter((t) => t.routeId === filters.routeId);
    }
    if (filters?.status && filters.status !== "all") {
      result = result.filter((t) => t.status === filters.status);
    }
    if (filters?.direction && filters.direction !== "all") {
      result = result.filter((t) => t.direction === filters.direction);
    }
    return result as any;
  }
}

export async function getTripImpl(id: string) {
  const currentUser = await requireAuth();
  await requirePermission(currentUser.role, "schedule.view");

  const trip = await db.query.trips.findFirst({
    where: and(eq(trips.id, id), eq(trips.tenantId, currentUser.tenantId)),
  });

  if (!trip) throw new Error("Trip not found");
  return trip;
}

export async function createTripImpl(data: {
  routeId: string;
  startTime: number;
  serviceDate: string;
  direction?: string;
  status?: string;
}) {
  const currentUser = await requireAuth();
  await requirePermission(currentUser.role, "schedule.modify");

  if (!data.routeId) throw new Error("Route is required");
  if (!data.serviceDate) throw new Error("Service date is required");
  if (data.startTime === undefined || data.startTime < 0) throw new Error("Start time is required");

  // Fetch active route details
  const route = await db.query.routes.findFirst({
    where: and(eq(routes.id, data.routeId), eq(routes.tenantId, currentUser.tenantId)),
  });

  if (!route) throw new Error("Selected route not found");
  if (route.status !== "active") throw new Error("Selected route is inactive");

  const duration = route.durationMin;
  const endTime = data.startTime + duration;

  // Generate unique trip code: {routeCode}-{HHMM}
  const hh = Math.floor(data.startTime / 60);
  const mm = data.startTime % 60;
  const hhmm = String(hh).padStart(2, "0") + String(mm).padStart(2, "0");
  const baseCode = `${route.code}-${hhmm}`;

  // Collision checking
  const existingTrips = await db
    .select()
    .from(trips)
    .where(
      and(
        eq(trips.tenantId, currentUser.tenantId),
        like(trips.tripCode, `${baseCode}%`)
      )
    );

  let finalCode = baseCode;
  if (existingTrips.length > 0) {
    const idx = existingTrips.length + 1;
    finalCode = `${baseCode}-${String(idx).padStart(2, "0")}`;
  }

  const [newTrip] = await db
    .insert(trips)
    .values({
      tenantId: currentUser.tenantId,
      routeId: data.routeId,
      tripCode: finalCode,
      direction: data.direction || "OUTBOUND",
      startTime: data.startTime,
      endTime,
      durationMin: duration,
      distanceKm: route.lengthKm,
      origin: route.origin || "",
      destination: route.destination || "",
      status: data.status || "planned",
      serviceDate: data.serviceDate,
    })
    .returning();

  // Audit log
  await db.insert(auditLogs).values({
    tenantId: currentUser.tenantId,
    userId: currentUser.id,
    email: currentUser.email,
    action: "TRIP_CREATED",
    details: `Created trip: ${newTrip!.tripCode} for ${newTrip!.serviceDate}`,
  });

  return newTrip;
}

export async function updateTripImpl(
  id: string,
  data: {
    startTime: number;
    serviceDate: string;
    direction?: string;
    status?: string;
  }
) {
  const currentUser = await requireAuth();
  await requirePermission(currentUser.role, "schedule.modify");

  const trip = await db.query.trips.findFirst({
    where: and(eq(trips.id, id), eq(trips.tenantId, currentUser.tenantId)),
  });

  if (!trip) throw new Error("Trip not found");

  const duration = trip.durationMin;
  const endTime = data.startTime + duration;

  const [updated] = await db
    .update(trips)
    .set({
      startTime: data.startTime,
      endTime,
      serviceDate: data.serviceDate,
      direction: data.direction,
      status: data.status,
      updatedAt: new Date(),
    })
    .where(and(eq(trips.id, id), eq(trips.tenantId, currentUser.tenantId)))
    .returning();

  // Audit log
  await db.insert(auditLogs).values({
    tenantId: currentUser.tenantId,
    userId: currentUser.id,
    email: currentUser.email,
    action: "TRIP_UPDATED",
    details: `Updated trip details: ${updated!.tripCode}`,
  });

  return updated;
}

export async function cancelTripImpl(id: string) {
  const currentUser = await requireAuth();
  await requirePermission(currentUser.role, "schedule.modify");

  const trip = await db.query.trips.findFirst({
    where: and(eq(trips.id, id), eq(trips.tenantId, currentUser.tenantId)),
  });

  if (!trip) throw new Error("Trip not found");

  const [updated] = await db
    .update(trips)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(and(eq(trips.id, id), eq(trips.tenantId, currentUser.tenantId)))
    .returning();

  // Audit log
  await db.insert(auditLogs).values({
    tenantId: currentUser.tenantId,
    userId: currentUser.id,
    email: currentUser.email,
    action: "TRIP_CANCELLED",
    details: `Cancelled trip: ${trip.tripCode}`,
  });

  return updated;
}

export async function generateTripsImpl(data: {
  routeId: string;
  serviceDate: string;
  startTime: number;
  endTime: number;
  frequency: number;
  direction?: string;
}) {
  const currentUser = await requireAuth();
  await requirePermission(currentUser.role, "schedule.modify");

  if (!data.routeId) throw new Error("Route is required");
  if (!data.serviceDate) throw new Error("Service date is required");
  if (!data.frequency || data.frequency <= 0) throw new Error("Frequency must be greater than 0");
  if (data.startTime === undefined || data.endTime === undefined || data.startTime >= data.endTime) {
    throw new Error("End time must be after start time");
  }

  let current = data.startTime;
  const createdTrips = [];

  while (current <= data.endTime) {
    const trip = await createTripImpl({
      routeId: data.routeId,
      startTime: current,
      serviceDate: data.serviceDate,
      direction: data.direction || "OUTBOUND",
      status: "planned",
    });
    createdTrips.push(trip);
    current += data.frequency;
  }

  // Audit log
  await db.insert(auditLogs).values({
    tenantId: currentUser.tenantId,
    userId: currentUser.id,
    email: currentUser.email,
    action: "TRIPS_GENERATED",
    details: `Generated ${createdTrips.length} trips on Route ID ${data.routeId} at ${data.frequency}m frequency`,
  });

  return createdTrips;
}

// ----------------------------------------------------
// Duty Server Implementations
// ----------------------------------------------------

export async function getDutiesImpl(filters?: { serviceDate?: string; status?: string }) {
  const currentUser = await requireAuth();
  await requirePermission(currentUser.role, "schedule.view");

  try {
    let conditions = [eq(duties.tenantId, currentUser.tenantId)];

    if (filters?.serviceDate) {
      conditions.push(eq(duties.serviceDate, filters.serviceDate));
    }
    if (filters?.status && filters.status !== "all") {
      conditions.push(eq(duties.status, filters.status));
    }

    const rawDuties = await db
      .select()
      .from(duties)
      .where(and(...conditions))
      .orderBy(duties.dutyCode);

    // Load associated trips & crew segments for each duty
    return await Promise.all(
      rawDuties.map(async (d) => {
        const tripsList = await db
          .select({
            id: trips.id,
            tripCode: trips.tripCode,
            startTime: trips.startTime,
            endTime: trips.endTime,
            routeCode: routes.code,
            routeName: routes.name,
            sequence: dutyTrips.sequence,
            handoverRequired: dutyTrips.handoverRequired,
          })
          .from(dutyTrips)
          .innerJoin(trips, eq(dutyTrips.tripId, trips.id))
          .innerJoin(routes, eq(trips.routeId, routes.id))
          .where(and(eq(dutyTrips.dutyId, d.id), eq(dutyTrips.tenantId, currentUser.tenantId)))
          .orderBy(asc(dutyTrips.sequence));

        const crewSegmentsList = await db
          .select({
            id: dutyCrewSegments.id,
            driverId: dutyCrewSegments.driverId,
            driverName: crew.name,
            conductorId: dutyCrewSegments.conductorId,
            startTime: dutyCrewSegments.startTime,
            endTime: dutyCrewSegments.endTime,
            sequence: dutyCrewSegments.sequence,
          })
          .from(dutyCrewSegments)
          .leftJoin(crew, eq(dutyCrewSegments.driverId, crew.id))
          .where(and(eq(dutyCrewSegments.dutyId, d.id), eq(dutyCrewSegments.tenantId, currentUser.tenantId)))
          .orderBy(asc(dutyCrewSegments.sequence));

        // Resolve base crew name details for visual grids
        let baseDriverName = "Unassigned";
        let baseConductorName = "Unassigned";
        if (d.driverId) {
          const dr = await db.query.crew.findFirst({ where: eq(crew.id, d.driverId) });
          if (dr) baseDriverName = dr.name;
        }
        if (d.conductorId) {
          const cn = await db.query.crew.findFirst({ where: eq(crew.id, d.conductorId) });
          if (cn) baseConductorName = cn.name;
        }

        let busRegNumber = "Unassigned";
        if (d.busId) {
          const b = await db.query.buses.findFirst({ where: eq(buses.id, d.busId) });
          if (b) busRegNumber = b.registrationNumber;
        }

        return {
          ...d,
          busRegNumber,
          driverName: baseDriverName,
          conductorName: baseConductorName,
          trips: tripsList,
          crewSegments: crewSegmentsList,
        };
      })
    );
  } catch (err) {
    let result = FALLBACK_DUTIES.map((d) => ({
      id: d.id,
      tenantId: d.tenantId,
      dutyCode: d.dutyNumber,
      serviceDate: filters?.serviceDate || "2026-08-25",
      busId: d.busId,
      driverId: d.driverId,
      conductorId: d.conductorId,
      startTime: d.startTime,
      endTime: d.endTime,
      spreadoverMin: d.spreadoverMinutes,
      drivingTimeMin: d.steeringMinutes,
      status: d.status,
      complianceRestOk: d.isRestCompliant,
      driverWeeklyDrivingMinutes: 1800,
      busRegNumber: d.bus?.registrationNumber || "TN-30-N-0412",
      driverName: d.driver?.name || "K. Selvam (DRV-01)",
      conductorName: d.conductor?.name || "R. Murugan (CND-01)",
      trips: (d.trips || []).map((t: any, idx: number) => ({
        id: t.id,
        tripCode: t.tripNumber,
        startTime: t.startMinutes,
        endTime: t.endMinutes,
        routeCode: t.route?.code || "13",
        routeName: t.route?.name || "Salem Central to Omalur",
        sequence: idx + 1,
        handoverRequired: false,
      })),
      crewSegments: [],
    }));

    if (filters?.status && filters.status !== "all") {
      result = result.filter((d) => d.status === filters.status);
    }
    return result as any;
  }
}

export async function getDutyImpl(id: string) {
  const currentUser = await requireAuth();
  await requirePermission(currentUser.role, "schedule.view");

  const duty = await db.query.duties.findFirst({
    where: and(eq(duties.id, id), eq(duties.tenantId, currentUser.tenantId)),
  });

  if (!duty) throw new Error("Duty not found");

  const tripsList = await db
    .select({
      id: trips.id,
      tripCode: trips.tripCode,
      startTime: trips.startTime,
      endTime: trips.endTime,
      routeCode: routes.code,
      routeName: routes.name,
      sequence: dutyTrips.sequence,
      handoverRequired: dutyTrips.handoverRequired,
    })
    .from(dutyTrips)
    .innerJoin(trips, eq(dutyTrips.tripId, trips.id))
    .innerJoin(routes, eq(trips.routeId, routes.id))
    .where(and(eq(dutyTrips.dutyId, id), eq(dutyTrips.tenantId, currentUser.tenantId)))
    .orderBy(asc(dutyTrips.sequence));

  const crewSegmentsList = await db
    .select({
      id: dutyCrewSegments.id,
      driverId: dutyCrewSegments.driverId,
      driverName: crew.name,
      conductorId: dutyCrewSegments.conductorId,
      startTime: dutyCrewSegments.startTime,
      endTime: dutyCrewSegments.endTime,
      sequence: dutyCrewSegments.sequence,
    })
    .from(dutyCrewSegments)
    .leftJoin(crew, eq(dutyCrewSegments.driverId, crew.id))
    .where(and(eq(dutyCrewSegments.dutyId, id), eq(dutyCrewSegments.tenantId, currentUser.tenantId)))
    .orderBy(asc(dutyCrewSegments.sequence));

  return {
    ...duty,
    trips: tripsList,
    crewSegments: crewSegmentsList,
  };
}

export async function createDutyImpl(data: {
  dutyCode: string;
  dutyType: string;
  serviceDate: string;
}) {
  const currentUser = await requireAuth();
  await requirePermission(currentUser.role, "schedule.modify");

  if (!data.dutyCode) throw new Error("Duty code is required");
  if (!data.serviceDate) throw new Error("Service date is required");

  // Validate unique code
  const existing = await db.query.duties.findFirst({
    where: and(eq(duties.dutyCode, data.dutyCode), eq(duties.tenantId, currentUser.tenantId)),
  });
  if (existing) {
    throw new Error(`Duty code ${data.dutyCode} already exists.`);
  }

  const [newDuty] = await db
    .insert(duties)
    .values({
      tenantId: currentUser.tenantId,
      dutyCode: data.dutyCode,
      dutyType: data.dutyType || "LINKED",
      serviceDate: data.serviceDate,
      startTime: 0,
      endTime: 0,
      status: "draft",
    })
    .returning();

  // Audit log
  await db.insert(auditLogs).values({
    tenantId: currentUser.tenantId,
    userId: currentUser.id,
    email: currentUser.email,
    action: "DUTY_CREATED",
    details: `Created duty: ${newDuty!.dutyCode} (${newDuty!.dutyType})`,
  });

  return newDuty;
}

export async function updateDutyImpl(
  id: string,
  data: {
    dutyCode: string;
    dutyType: string;
    serviceDate: string;
    status: string;
    busId?: string | null;
    driverId?: string | null;
    conductorId?: string | null;
  }
) {
  const currentUser = await requireAuth();
  await requirePermission(currentUser.role, "schedule.modify");

  const duty = await db.query.duties.findFirst({
    where: and(eq(duties.id, id), eq(duties.tenantId, currentUser.tenantId)),
  });
  if (!duty) throw new Error("Duty not found");

  if (data.dutyCode !== duty.dutyCode) {
    const existing = await db.query.duties.findFirst({
      where: and(eq(duties.dutyCode, data.dutyCode), eq(duties.tenantId, currentUser.tenantId)),
    });
    if (existing) {
      throw new Error(`Duty code ${data.dutyCode} already exists.`);
    }
  }

  // If publishing, run full validation checker
  if (data.status === "published") {
    const validation = await validateDutyImpl(id, {
      busId: data.busId || null,
      driverId: data.driverId || null,
      conductorId: data.conductorId || null,
    });
    if (!validation.isValid) {
      await db.insert(auditLogs).values({
        tenantId: currentUser.tenantId,
        userId: currentUser.id,
        email: currentUser.email,
        action: "DUTY_VALIDATION_FAILED",
        details: `Duty validation failed on publish attempt for ${duty.dutyCode}: ${validation.issues[0]}`,
      });
      throw new Error(`Validation Error: ${validation.issues.join("; ")}`);
    }
  }

  const [updated] = await db
    .update(duties)
    .set({
      dutyCode: data.dutyCode,
      dutyType: data.dutyType,
      serviceDate: data.serviceDate,
      status: data.status,
      busId: data.busId,
      driverId: data.driverId,
      conductorId: data.conductorId,
      updatedAt: new Date(),
    })
    .where(and(eq(duties.id, id), eq(duties.tenantId, currentUser.tenantId)))
    .returning();

  // Audit log
  await db.insert(auditLogs).values({
    tenantId: currentUser.tenantId,
    userId: currentUser.id,
    email: currentUser.email,
    action: "DUTY_UPDATED",
    details: `Updated duty: ${updated!.dutyCode} (status: ${updated!.status})`,
  });

  return updated;
}

export async function deleteDutyImpl(id: string) {
  const currentUser = await requireAuth();
  await requirePermission(currentUser.role, "schedule.modify");

  const duty = await db.query.duties.findFirst({
    where: and(eq(duties.id, id), eq(duties.tenantId, currentUser.tenantId)),
  });
  if (!duty) throw new Error("Duty not found");

  await db
    .delete(duties)
    .where(and(eq(duties.id, id), eq(duties.tenantId, currentUser.tenantId)));

  // Audit log
  await db.insert(auditLogs).values({
    tenantId: currentUser.tenantId,
    userId: currentUser.id,
    email: currentUser.email,
    action: "DUTY_DELETED",
    details: `Deleted duty: ${duty.dutyCode}`,
  });

  return { success: true };
}

// Recalculates start and end time parameters of a duty based on its child trips
async function recalculateDutyTimes(dutyId: string, tenantId: string) {
  const assignedTrips = await db
    .select({ startTime: trips.startTime, endTime: trips.endTime })
    .from(dutyTrips)
    .innerJoin(trips, eq(dutyTrips.tripId, trips.id))
    .where(and(eq(dutyTrips.dutyId, dutyId), eq(dutyTrips.tenantId, tenantId)))
    .orderBy(asc(trips.startTime));

  if (assignedTrips.length === 0) {
    await db
      .update(duties)
      .set({ startTime: 0, endTime: 0 })
      .where(eq(duties.id, dutyId));
    return;
  }

  const start = assignedTrips[0]!.startTime;
  const end = assignedTrips[assignedTrips.length - 1]!.endTime;

  await db
    .update(duties)
    .set({ startTime: start, endTime: end })
    .where(eq(duties.id, dutyId));
}

export async function addTripToDutyImpl(dutyId: string, tripId: string) {
  const currentUser = await requireAuth();
  await requirePermission(currentUser.role, "schedule.modify");

  const duty = await db.query.duties.findFirst({
    where: and(eq(duties.id, dutyId), eq(duties.tenantId, currentUser.tenantId)),
  });
  if (!duty) throw new Error("Duty not found");

  const trip = await db.query.trips.findFirst({
    where: and(eq(trips.id, tripId), eq(trips.tenantId, currentUser.tenantId)),
  });
  if (!trip) throw new Error("Trip not found");

  // Prevent duplicate assignment
  const existing = await db.query.dutyTrips.findFirst({
    where: and(eq(dutyTrips.dutyId, dutyId), eq(dutyTrips.tripId, tripId)),
  });
  if (existing) throw new Error("Trip already assigned to this duty");

  // Get current trips in duty to compute correct sequence
  const currentTrips = await db
    .select({ id: dutyTrips.id, startTime: trips.startTime })
    .from(dutyTrips)
    .innerJoin(trips, eq(dutyTrips.tripId, trips.id))
    .where(eq(dutyTrips.dutyId, dutyId))
    .orderBy(asc(trips.startTime));

  // Insert new trip assignment
  await db.insert(dutyTrips).values({
    tenantId: currentUser.tenantId,
    dutyId,
    tripId,
    sequence: currentTrips.length + 1,
    handoverRequired: false,
  });

  // Re-sequence all trips by startTime
  const allTrips = await db
    .select({ id: dutyTrips.id })
    .from(dutyTrips)
    .innerJoin(trips, eq(dutyTrips.tripId, trips.id))
    .where(eq(dutyTrips.dutyId, dutyId))
    .orderBy(asc(trips.startTime));

  for (let i = 0; i < allTrips.length; i++) {
    await db
      .update(dutyTrips)
      .set({ sequence: i + 1 })
      .where(eq(dutyTrips.id, allTrips[i]!.id));
  }

  await recalculateDutyTimes(dutyId, currentUser.tenantId);

  // Audit log
  await db.insert(auditLogs).values({
    tenantId: currentUser.tenantId,
    userId: currentUser.id,
    email: currentUser.email,
    action: "DUTY_UPDATED",
    details: `Assigned trip ${trip.tripCode} to duty ${duty.dutyCode}`,
  });

  return { success: true };
}

export async function removeTripFromDutyImpl(dutyId: string, tripId: string) {
  const currentUser = await requireAuth();
  await requirePermission(currentUser.role, "schedule.modify");

  const duty = await db.query.duties.findFirst({
    where: and(eq(duties.id, dutyId), eq(duties.tenantId, currentUser.tenantId)),
  });
  if (!duty) throw new Error("Duty not found");

  await db
    .delete(dutyTrips)
    .where(and(eq(dutyTrips.dutyId, dutyId), eq(dutyTrips.tripId, tripId)));

  // Re-sequence
  const allTrips = await db
    .select({ id: dutyTrips.id })
    .from(dutyTrips)
    .innerJoin(trips, eq(dutyTrips.tripId, trips.id))
    .where(eq(dutyTrips.dutyId, dutyId))
    .orderBy(asc(trips.startTime));

  for (let i = 0; i < allTrips.length; i++) {
    await db
      .update(dutyTrips)
      .set({ sequence: i + 1 })
      .where(eq(dutyTrips.id, allTrips[i]!.id));
  }

  await recalculateDutyTimes(dutyId, currentUser.tenantId);

  // Audit log
  await db.insert(auditLogs).values({
    tenantId: currentUser.tenantId,
    userId: currentUser.id,
    email: currentUser.email,
    action: "DUTY_UPDATED",
    details: `Removed trip ID ${tripId} from duty ${duty.dutyCode}`,
  });

  return { success: true };
}

export async function assignBusToDutyImpl(dutyId: string, busId: string | null) {
  const currentUser = await requireAuth();
  await requirePermission(currentUser.role, "schedule.modify");

  const duty = await db.query.duties.findFirst({
    where: and(eq(duties.id, dutyId), eq(duties.tenantId, currentUser.tenantId)),
  });
  if (!duty) throw new Error("Duty not found");

  await db
    .update(duties)
    .set({ busId, updatedAt: new Date() })
    .where(eq(duties.id, dutyId));

  // Audit log
  await db.insert(auditLogs).values({
    tenantId: currentUser.tenantId,
    userId: currentUser.id,
    email: currentUser.email,
    action: "BUS_ASSIGNED",
    details: `Assigned bus ID ${busId || "None"} to duty ${duty.dutyCode}`,
  });

  return { success: true };
}

export async function assignCrewToDutyImpl(
  dutyId: string,
  driverId: string | null,
  conductorId: string | null
) {
  const currentUser = await requireAuth();
  await requirePermission(currentUser.role, "schedule.modify");

  const duty = await db.query.duties.findFirst({
    where: and(eq(duties.id, dutyId), eq(duties.tenantId, currentUser.tenantId)),
  });
  if (!duty) throw new Error("Duty not found");

  await db
    .update(duties)
    .set({ driverId, conductorId, updatedAt: new Date() })
    .where(eq(duties.id, dutyId));

  // Audit log
  await db.insert(auditLogs).values({
    tenantId: currentUser.tenantId,
    userId: currentUser.id,
    email: currentUser.email,
    action: "CREW_ASSIGNED",
    details: `Assigned driver ID ${driverId || "None"} / conductor ID ${conductorId || "None"} to duty ${duty.dutyCode}`,
  });

  return { success: true };
}

export async function createCrewHandoverImpl(data: {
  dutyId: string;
  driverId: string;
  conductorId: string;
  startTime: number;
  endTime: number;
}) {
  const currentUser = await requireAuth();
  await requirePermission(currentUser.role, "schedule.modify");

  const duty = await db.query.duties.findFirst({
    where: and(eq(duties.id, data.dutyId), eq(duties.tenantId, currentUser.tenantId)),
  });
  if (!duty) throw new Error("Duty not found");

  const existingSegments = await db
    .select()
    .from(dutyCrewSegments)
    .where(eq(dutyCrewSegments.dutyId, data.dutyId));

  const [newSegment] = await db
    .insert(dutyCrewSegments)
    .values({
      tenantId: currentUser.tenantId,
      dutyId: data.dutyId,
      driverId: data.driverId,
      conductorId: data.conductorId,
      startTime: data.startTime,
      endTime: data.endTime,
      sequence: existingSegments.length + 1,
    })
    .returning();

  // Audit log
  await db.insert(auditLogs).values({
    tenantId: currentUser.tenantId,
    userId: currentUser.id,
    email: currentUser.email,
    action: "CREW_HANDOVER_CREATED",
    details: `Created crew handover segment for duty ${duty.dutyCode}`,
  });

  return newSegment;
}

export async function clearHandoverSegmentsImpl(dutyId: string) {
  const currentUser = await requireAuth();
  await requirePermission(currentUser.role, "schedule.modify");

  await db
    .delete(dutyCrewSegments)
    .where(and(eq(dutyCrewSegments.dutyId, dutyId), eq(dutyCrewSegments.tenantId, currentUser.tenantId)));

  return { success: true };
}

// ----------------------------------------------------
// Duty Validation Engine
// ----------------------------------------------------

export async function validateDutyImpl(
  dutyId: string,
  overrides?: {
    busId?: string | null;
    driverId?: string | null;
    conductorId?: string | null;
    dutyType?: string;
  }
) {
  const currentUser = await requireAuth();
  await requirePermission(currentUser.role, "schedule.view");

  const duty = await db.query.duties.findFirst({
    where: and(eq(duties.id, dutyId), eq(duties.tenantId, currentUser.tenantId)),
  });
  if (!duty) throw new Error("Duty not found");

  const busId = overrides?.busId !== undefined ? overrides.busId : duty.busId;
  const driverId = overrides?.driverId !== undefined ? overrides.driverId : duty.driverId;
  const conductorId = overrides?.conductorId !== undefined ? overrides.conductorId : duty.conductorId;
  const dutyType = overrides?.dutyType || duty.dutyType;

  // Load trips associated with this duty
  const assignedTrips = await db
    .select({
      id: trips.id,
      tripCode: trips.tripCode,
      startTime: trips.startTime,
      endTime: trips.endTime,
      routeId: trips.routeId,
      routeCode: routes.code,
    })
    .from(dutyTrips)
    .innerJoin(trips, eq(dutyTrips.tripId, trips.id))
    .innerJoin(routes, eq(trips.routeId, routes.id))
    .where(and(eq(dutyTrips.dutyId, dutyId), eq(dutyTrips.tenantId, currentUser.tenantId)))
    .orderBy(asc(trips.startTime));

  const issues: string[] = [];

  if (assignedTrips.length === 0) {
    return { isValid: true, issues: [] }; // Empty duty is valid by default
  }

  const dutyStart = assignedTrips[0]!.startTime;
  const dutyEnd = assignedTrips[assignedTrips.length - 1]!.endTime;

  // 1. Bus Conflict Checking
  if (busId) {
    const activeBus = await db.query.buses.findFirst({ where: eq(buses.id, busId) });
    if (activeBus && activeBus.status !== "available" && activeBus.status !== "assigned") {
      issues.push(`Bus ${activeBus.registrationNumber} is marked "${activeBus.status}" and unavailable.`);
    }

    // Check overlaps with other duties on same service day
    const otherDutiesWithBus = await db
      .select({ dutyCode: duties.dutyCode, startTime: duties.startTime, endTime: duties.endTime })
      .from(duties)
      .where(
        and(
          eq(duties.tenantId, currentUser.tenantId),
          eq(duties.serviceDate, duty.serviceDate),
          eq(duties.busId, busId),
          ne(duties.id, dutyId)
        )
      );

    for (const ob of otherDutiesWithBus) {
      if (dutyStart < ob.endTime && dutyEnd > ob.startTime) {
        issues.push(
          `Bus conflict: Already assigned to Duty ${ob.dutyCode} (${formatMinutesToTime(
            ob.startTime
          )} - ${formatMinutesToTime(ob.endTime)}).`
        );
      }
    }
  }

  // Helper function to validate crew members
  const validateCrewMember = async (crewId: string, label: "Driver" | "Conductor", cStart: number, cEnd: number) => {
    const member = await db.query.crew.findFirst({ where: eq(crew.id, crewId) });
    if (!member) return;

    if (member.status === "leave" || member.status === "unavailable") {
      issues.push(`${label} ${member.name} is on ${member.status} status and unavailable.`);
    }

    if (cStart < member.restUntil) {
      issues.push(
        `${label} ${member.name} requires rest until ${formatMinutesToTime(
          member.restUntil
        )}.`
      );
    }

    // Overlap checks with other duties (for linked duties)
    const otherCrewDuties = await db
      .select({ dutyCode: duties.dutyCode, startTime: duties.startTime, endTime: duties.endTime })
      .from(duties)
      .where(
        and(
          eq(duties.tenantId, currentUser.tenantId),
          eq(duties.serviceDate, duty.serviceDate),
          or(eq(duties.driverId, crewId), eq(duties.conductorId, crewId))!,
          ne(duties.id, dutyId)
        )
      );

    for (const od of otherCrewDuties) {
      if (cStart < od.endTime && cEnd > od.startTime) {
        issues.push(
          `${label} ${member.name} is already assigned to Duty ${od.dutyCode} (${formatMinutesToTime(
            od.startTime
          )} - ${formatMinutesToTime(od.endTime)}).`
        );
      }
    }

    // Overlap checks with crew handover segments in other unlinked duties
    const otherCrewSegments = await db
      .select({ dutyCode: duties.dutyCode, startTime: dutyCrewSegments.startTime, endTime: dutyCrewSegments.endTime })
      .from(dutyCrewSegments)
      .innerJoin(duties, eq(dutyCrewSegments.dutyId, duties.id))
      .where(
        and(
          eq(dutyCrewSegments.tenantId, currentUser.tenantId),
          eq(duties.serviceDate, duty.serviceDate),
          or(eq(dutyCrewSegments.driverId, crewId), eq(dutyCrewSegments.conductorId, crewId))!,
          ne(dutyCrewSegments.dutyId, dutyId)
        )
      );

    for (const seg of otherCrewSegments) {
      if (cStart < seg.endTime && cEnd > seg.startTime) {
        issues.push(
          `${label} ${member.name} is already assigned to handover segment in Duty ${seg.dutyCode} (${formatMinutesToTime(
            seg.startTime
          )} - ${formatMinutesToTime(seg.endTime)}).`
        );
      }
    }
  };

  // 2. Crew Validation (Linked vs Unlinked)
  if (dutyType === "LINKED") {
    if (driverId) {
      await validateCrewMember(driverId, "Driver", dutyStart, dutyEnd);
    }
    if (conductorId) {
      await validateCrewMember(conductorId, "Conductor", dutyStart, dutyEnd);
    }
  } else {
    // UNLINKED: Validate each handover crew segment
    const segments = await db
      .select()
      .from(dutyCrewSegments)
      .where(and(eq(dutyCrewSegments.dutyId, dutyId), eq(dutyCrewSegments.tenantId, currentUser.tenantId)))
      .orderBy(asc(dutyCrewSegments.sequence));

    if (segments.length === 0) {
      issues.push("Unlinked duties require crew segments configured for handovers.");
    } else {
      // Validate that crew segments cover the trips times span
      const segmentsStart = segments[0]!.startTime;
      const segmentsEnd = segments[segments.length - 1]!.endTime;

      if (segmentsStart > dutyStart || segmentsEnd < dutyEnd) {
        issues.push("Crew handover segments do not fully cover the schedule timeline of assigned trips.");
      }

      // Check gap gaps or overlaps in segments
      for (let i = 0; i < segments.length - 1; i++) {
        const segA = segments[i]!;
        const segB = segments[i + 1]!;
        if (segA.endTime !== segB.startTime) {
          issues.push(
            `Crew segments sequence gap: Segment ${segA.sequence} ends at ${formatMinutesToTime(
              segA.endTime
            )} but Segment ${segB.sequence} starts at ${formatMinutesToTime(segB.startTime)}.`
          );
        }
      }

      // Validate crew availability in each segment
      for (const seg of segments) {
        if (seg.driverId) {
          await validateCrewMember(seg.driverId, "Driver", seg.startTime, seg.endTime);
        }
        if (seg.conductorId) {
          await validateCrewMember(seg.conductorId, "Conductor", seg.startTime, seg.endTime);
        }
      }
    }
  }

  // 3. Consecutive Trips Overlap & Turnaround Buffer Checking
  for (let i = 0; i < assignedTrips.length - 1; i++) {
    const tripA = assignedTrips[i]!;
    const tripB = assignedTrips[i + 1]!;

    if (tripA.endTime > tripB.startTime) {
      issues.push(`Trip conflict: trip ${tripA.tripCode} overlaps with trip ${tripB.tripCode}.`);
    } else {
      const turnaroundGap = tripB.startTime - tripA.endTime;
      // If routes are different, enforce turnaround buffer
      if (tripA.routeId !== tripB.routeId) {
        if (turnaroundGap < SCHEDULING_CONFIG.MIN_TURNAROUND_MINUTES) {
          issues.push(
            `Turnaround violation between ${tripA.tripCode} and ${tripB.tripCode}: Only ${turnaroundGap} minutes turnaround available; minimum required is ${SCHEDULING_CONFIG.MIN_TURNAROUND_MINUTES} minutes.`
          );
        }
      }
    }
  }

  // 4. Continuous Duty Hours Limit Validation
  const dutyDuration = dutyEnd - dutyStart;
  const maxDutyMinutes = SCHEDULING_CONFIG.MAX_DUTY_HOURS * 60;
  if (dutyDuration > maxDutyMinutes) {
    issues.push(
      `Duty duration exceeds continuous work limit: Active timeline spans ${formatMinutesToTime(
        dutyDuration
      )} (Max limit allowed: ${SCHEDULING_CONFIG.MAX_DUTY_HOURS} hours).`
    );
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}
