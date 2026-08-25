import { eq, and, asc, not } from "drizzle-orm";
import { db } from "../db";
import {
  tenants,
  buses,
  crew,
  routes,
  stops,
  trips,
  duties,
  dutyTrips,
  dutyCrewSegments,
  optimizationRuns,
  auditLogs,
} from "../db/schema";
import { requireAuth, requirePermission } from "../auth";
import { SCHEDULING_CONFIG } from "../../lib/transit/config";
import { solveSchedule } from "./solver";
import { OptimizerInput, OptimizerResult, ProposedDuty } from "./types";
import { validateDutyImpl } from "../scheduling-ops";

// Helper: load snapshot state of resources to detect concurrent edits
async function captureResourceSnapshot(tenantId: string, serviceDate: string) {
  const currentBuses = await db.query.buses.findMany({ where: eq(buses.tenantId, tenantId) });
  const currentCrew = await db.query.crew.findMany({ where: eq(crew.tenantId, tenantId) });
  const currentTrips = await db.query.trips.findMany({
    where: and(eq(trips.tenantId, tenantId), eq(trips.serviceDate, serviceDate)),
  });

  return {
    buses: currentBuses.map((b) => ({ id: b.id, status: b.status })),
    crew: currentCrew.map((c) => ({ id: c.id, status: c.status, restUntil: c.restUntil })),
    trips: currentTrips.map((t) => ({ id: t.id, startTime: t.startTime, status: t.status })),
  };
}

export async function generateOptimizedScheduleImpl(data: {
  serviceDate: string;
  mode: "LINKED" | "UNLINKED" | "HYBRID";
}) {
  const currentUser = await requireAuth();
  await requirePermission(currentUser.role, "schedule.generate");

  const tenantId = currentUser.tenantId;

  // Insert optimization run in QUEUED status
  const [run] = await db
    .insert(optimizationRuns)
    .values({
      tenantId,
      serviceDate: data.serviceDate,
      mode: data.mode,
      status: "RUNNING",
      createdBy: currentUser.id,
    })
    .returning();

  const runId = run!.id;

  try {
    // Load inputs from PostgreSQL
    const loadedTrips = await db.query.trips.findMany({
      where: and(eq(trips.tenantId, tenantId), eq(trips.serviceDate, data.serviceDate)),
      orderBy: asc(trips.startTime),
    });

    const loadedRoutes = await db.query.routes.findMany({
      where: eq(routes.tenantId, tenantId),
    });

    const loadedBuses = await db.query.buses.findMany({
      where: eq(buses.tenantId, tenantId),
    });

    const loadedCrew = await db.query.crew.findMany({
      where: eq(crew.tenantId, tenantId),
    });

    const inputSnapshot = await captureResourceSnapshot(tenantId, data.serviceDate);

    // Build solver inputs
    const input: OptimizerInput = {
      serviceDate: data.serviceDate,
      trips: loadedTrips.map((t) => ({
        id: t.id,
        tripCode: t.tripCode,
        routeId: t.routeId,
        direction: t.direction,
        startTime: t.startTime,
        endTime: t.endTime,
        durationMin: t.durationMin,
        distanceKm: t.distanceKm,
        origin: t.origin,
        destination: t.destination,
        status: t.status,
        serviceDate: t.serviceDate,
      })),
      routes: loadedRoutes.map((r) => ({
        id: r.id,
        code: r.code,
        name: r.name,
        lengthKm: r.lengthKm,
        durationMin: r.durationMin,
        origin: r.origin,
        destination: r.destination,
      })),
      buses: loadedBuses.map((b) => ({
        id: b.id,
        registrationNumber: b.registrationNumber,
        fleetNumber: b.fleetNumber,
        depot: b.depot,
        status: b.status,
        busType: b.busType,
        capacity: b.capacity,
        availableFrom: b.availableFrom,
      })),
      drivers: loadedCrew
        .filter((c) => c.role === "driver")
        .map((c) => ({
          id: c.id,
          employeeId: c.employeeId,
          name: c.name,
          role: c.role,
          status: c.status,
          depot: c.depot,
          availableFrom: c.availableFrom,
          restUntil: c.restUntil,
          licenseCategory: c.licenseCategory,
          licenseExpiry: c.licenseExpiry,
        })),
      conductors: loadedCrew
        .filter((c) => c.role === "conductor")
        .map((c) => ({
          id: c.id,
          employeeId: c.employeeId,
          name: c.name,
          role: c.role,
          status: c.status,
          depot: c.depot,
          availableFrom: c.availableFrom,
          restUntil: c.restUntil,
          licenseCategory: null,
          licenseExpiry: null,
        })),
      mode: data.mode,
      configuration: SCHEDULING_CONFIG,
    };

    // Run backtracking CP solver
    const startTime = Date.now();
    const result = solveSchedule(input);
    const duration = (Date.now() - startTime) / 1000;

    // Update Optimization Run results
    await db
      .update(optimizationRuns)
      .set({
        status: "COMPLETED",
        completedAt: new Date(),
        inputSnapshot,
        resultSummary: {
          tripsCovered: result.tripsCovered,
          tripsUnassigned: result.tripsUnassigned,
          busesUsed: result.busesUsed,
          driversUsed: result.driversUsed,
          conductorsUsed: result.conductorsUsed,
          dutiesCreated: result.dutiesCreated,
          linkedDuties: result.linkedDuties,
          unlinkedDuties: result.unlinkedDuties,
          handovers: result.handovers,
          duration,
        },
        objectiveScore: String(result.objectiveScore),
        updatedAt: new Date(),
      })
      .where(eq(optimizationRuns.id, runId));

    // Log Audit Event
    await db.insert(auditLogs).values({
      tenantId,
      userId: currentUser.id,
      email: currentUser.email,
      action: "SCHEDULE_GENERATED",
      details: `Generated schedule: Covered ${result.tripsCovered}/${result.assignments.length + result.tripsUnassigned} trips in ${duration}s`,
    });

    return {
      runId,
      result,
    };
  } catch (error: any) {
    await db
      .update(optimizationRuns)
      .set({
        status: "FAILED",
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(optimizationRuns.id, runId));

    await db.insert(auditLogs).values({
      tenantId,
      userId: currentUser.id,
      email: currentUser.email,
      action: "OPTIMIZATION_FAILED",
      details: `Optimization failed: ${error.message || "Unknown error"}`,
    });

    throw error;
  }
}

export async function getOptimizationRunImpl(runId: string) {
  const currentUser = await requireAuth();
  await requirePermission(currentUser.role, "schedule.view");

  const run = await db.query.optimizationRuns.findFirst({
    where: and(eq(optimizationRuns.id, runId), eq(optimizationRuns.tenantId, currentUser.tenantId)),
  });

  if (!run) throw new Error("Optimization run not found");
  return run;
}

export async function publishScheduleImpl(data: {
  runId: string;
  proposal: OptimizerResult;
}) {
  const currentUser = await requireAuth();
  await requirePermission(currentUser.role, "schedule.publish");

  const tenantId = currentUser.tenantId;

  // 1. Fetch current run details
  const run = await db.query.optimizationRuns.findFirst({
    where: and(eq(optimizationRuns.id, data.runId), eq(optimizationRuns.tenantId, tenantId)),
  });

  if (!run) throw new Error("Optimization run not found");
  if (run.status === "PUBLISHED") throw new Error("This optimization schedule is already published.");

  // 2. Concurrency checks: Compare snapshot to current resources state
  const currentSnapshot = await captureResourceSnapshot(tenantId, run.serviceDate);
  const snap = run.inputSnapshot as any;

  if (snap) {
    // Check if any bus status changed since solver run
    const busChanged = currentSnapshot.buses.some((cb) => {
      const match = snap.buses.find((sb: any) => sb.id === cb.id);
      return !match || match.status !== cb.status;
    });

    // Check if crew availability/rest cycles shifted
    const crewChanged = currentSnapshot.crew.some((cc) => {
      const match = snap.crew.find((sc: any) => sc.id === cc.id);
      return !match || match.status !== cc.status || match.restUntil !== cc.restUntil;
    });

    // Check if trips were changed
    const tripsChanged = currentSnapshot.trips.some((ct) => {
      const match = snap.trips.find((st: any) => st.id === ct.id);
      return !match || match.startTime !== ct.startTime || match.status !== ct.status;
    });

    if (busChanged || crewChanged || tripsChanged) {
      await db.insert(auditLogs).values({
        tenantId,
        userId: currentUser.id,
        email: currentUser.email,
        action: "SCHEDULE_REJECTED",
        details: `Publish rejected: Concurrency resource mismatch since solver started.`,
      });
      throw new Error("Schedule changed since optimization. Please regenerate.");
    }
  }

  // 3. Database transaction to persist duties, segments, and schedule trips
  await db.transaction(async (tx) => {
    // Clean out existing schedules/duties for the date to overwrite cleanly
    // (This ensures we overwrite proposed schedules cleanly on confirmation!)
    const todayDuties = await tx.query.duties.findMany({
      where: and(eq(duties.tenantId, tenantId), eq(duties.serviceDate, run.serviceDate)),
    });

    for (const d of todayDuties) {
      await tx.delete(duties).where(eq(duties.id, d.id));
    }

    // Insert new duties
    for (const pDuty of data.proposal.duties) {
      const [dutyRecord] = await tx
        .insert(duties)
        .values({
          tenantId,
          dutyCode: pDuty.dutyCode,
          dutyType: pDuty.dutyType,
          serviceDate: run.serviceDate,
          startTime: pDuty.startTime,
          endTime: pDuty.endTime,
          status: "published",
          busId: pDuty.busId,
          driverId: pDuty.driverId,
          conductorId: pDuty.conductorId,
        })
        .returning();

      // Insert duty trips
      for (const t of pDuty.trips) {
        await tx.insert(dutyTrips).values({
          tenantId,
          dutyId: dutyRecord!.id,
          tripId: t.tripId,
          sequence: t.sequence,
          handoverRequired: t.handoverRequired,
        });

        // Set trip status as scheduled
        await tx
          .update(trips)
          .set({ status: "scheduled", updatedAt: new Date() })
          .where(eq(trips.id, t.tripId));
      }

      // Insert unlinked handover crew segments
      if (pDuty.dutyType === "UNLINKED") {
        for (const seg of pDuty.crewSegments) {
          await tx.insert(dutyCrewSegments).values({
            tenantId,
            dutyId: dutyRecord!.id,
            driverId: seg.driverId,
            conductorId: seg.conductorId,
            startTime: seg.startTime,
            endTime: seg.endTime,
            sequence: seg.sequence,
          });
        }
      }
    }

    // Mark run as published
    await tx
      .update(optimizationRuns)
      .set({ status: "PUBLISHED", updatedAt: new Date() })
      .where(eq(optimizationRuns.id, data.runId));

    // Audit log
    await tx.insert(auditLogs).values({
      tenantId,
      userId: currentUser.id,
      email: currentUser.email,
      action: "SCHEDULE_PUBLISHED",
      details: `Published schedule for date: ${run.serviceDate}`,
    });
  });

  return { success: true };
}
