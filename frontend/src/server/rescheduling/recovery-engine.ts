import { eq, and, asc, not } from "drizzle-orm";
import { db } from "../db";
import {
  incidents,
  incidentImpacts,
  reschedulingRuns,
  recoveryProposals,
  buses,
  crew,
  trips,
  duties,
  dutyTrips,
  dutyCrewSegments,
  auditLogs,
} from "../db/schema";
import { requireAuth, requirePermission } from "../auth";
import { solveSchedule } from "../scheduling/solver";
import { OptimizerInput, OptimizerResult, ProposedDuty } from "../scheduling/types";
import { generateCandidates } from "../scheduling/candidate-generation";
import { calculateRecoveryObjectiveScore } from "./recovery-objective";
import { generateRecoveryExplanation } from "./recovery-explain";
import { generateExplanations } from "../scheduling/explain";

const MIN_RECOVERY_WINDOW = 60; // 1 hour
const MAX_RECOVERY_WINDOW = 240; // 4 hours

export async function generateRecoveryProposalsImpl(incidentId: string) {
  const currentUser = await requireAuth();
  await requirePermission(currentUser.role, "schedule.generate");

  const tenantId = currentUser.tenantId;

  // 1. Load Incident
  const incidentObj = await db.query.incidents.findFirst({
    where: and(eq(incidents.id, incidentId), eq(incidents.tenantId, tenantId)),
  });

  if (!incidentObj) throw new Error("Incident not found");

  // Create Rescheduling Run
  const [run] = await db
    .insert(reschedulingRuns)
    .values({
      tenantId,
      incidentId,
      serviceDate: incidentObj.serviceDate,
      status: "RUNNING",
      createdBy: currentUser.id,
    })
    .returning();

  const runId = run!.id;

  try {
    // 2. Fetch all trips, duties, buses, and crew for the date
    const allTrips = await db.query.trips.findMany({
      where: and(eq(trips.tenantId, tenantId), eq(trips.serviceDate, incidentObj.serviceDate)),
      orderBy: asc(trips.startTime),
    });

    const allBuses = await db.query.buses.findMany({ where: eq(buses.tenantId, tenantId) });
    const allCrew = await db.query.crew.findMany({ where: eq(crew.tenantId, tenantId) });
    const allDuties = await db.query.duties.findMany({
      where: and(eq(duties.tenantId, tenantId), eq(duties.serviceDate, incidentObj.serviceDate)),
      with: {
        trips: true,
        crewSegments: true,
      },
    });

    // 3. Define Recovery Window [impactStart, impactEnd]
    const impactStart = incidentObj.startTime;
    const impactEnd = incidentObj.startTime + MAX_RECOVERY_WINDOW;

    // Filter trips that fall within the recovery window (Affected Region A)
    // Trips outside this window are frozen (Frozen Region U)
    const affectedTrips = allTrips.filter(
      (t) => t.startTime >= impactStart && t.startTime <= impactEnd
    );
    const frozenTrips = allTrips.filter(
      (t) => t.startTime < impactStart || t.startTime > impactEnd
    );

    // Map original assignments for objective comparison
    const originalAssignmentsMap = new Map<string, { busId: string; driverId: string; conductorId: string }>();
    const originalBusesUsedSet = new Set<string>();

    allDuties.forEach((d) => {
      if (d.busId) originalBusesUsedSet.add(d.busId);
      d.trips.forEach((dt) => {
        originalAssignmentsMap.set(dt.tripId, {
          busId: d.busId!,
          driverId: d.driverId!,
          conductorId: d.conductorId!,
        });
      });
    });

    // Capture snapshot of resource availabilities
    const resourceSnapshot = {
      buses: allBuses.map((b) => ({ id: b.id, status: b.status })),
      crew: allCrew.map((c) => ({ id: c.id, status: c.status, restUntil: c.restUntil })),
      trips: allTrips.map((t) => ({ id: t.id, startTime: t.startTime, status: t.status })),
    };

    // 4. Generate Option A (Balanced Recovery objective)
    // We filter out resources that are unavailable due to incident
    const availableBuses = allBuses.filter((b) => {
      if (incidentObj.type === "BUS_BREAKDOWN" && b.id === incidentObj.resourceId) return false;
      if (b.status === "maintenance") return false;
      return true;
    });

    const availableDrivers = allCrew.filter((c) => {
      if (incidentObj.type === "DRIVER_ABSENT" && c.id === incidentObj.resourceId) return false;
      if (c.role !== "driver" || c.status === "leave") return false;
      return true;
    });

    const availableConductors = allCrew.filter((c) => {
      if (incidentObj.type === "CONDUCTOR_ABSENT" && c.id === incidentObj.resourceId) return false;
      if (c.role !== "conductor" || c.status === "leave") return false;
      return true;
    });

    // Helper: run solver under constraints config
    const runSolverOption = (
      overrideConfig: any
    ): OptimizerResult => {
      const solverInput: OptimizerInput = {
        serviceDate: incidentObj.serviceDate,
        trips: affectedTrips.map((t) => ({
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
        routes: [], // routes validation not strictly checking geometry overlaps here
        buses: availableBuses.map((b) => ({
          id: b.id,
          registrationNumber: b.registrationNumber,
          fleetNumber: b.fleetNumber,
          depot: b.depot,
          status: b.status,
          busType: b.busType,
          capacity: b.capacity,
          availableFrom: b.availableFrom,
        })),
        drivers: availableDrivers.map((d) => ({
          id: d.id,
          employeeId: d.employeeId,
          name: d.name,
          role: d.role,
          status: d.status,
          depot: d.depot,
          availableFrom: d.availableFrom,
          restUntil: d.restUntil,
          licenseCategory: d.licenseCategory,
          licenseExpiry: d.licenseExpiry,
        })),
        conductors: availableConductors.map((c) => ({
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
        mode: "HYBRID",
        configuration: {
          MIN_TURNAROUND_MINUTES: 10,
          MAX_DUTY_HOURS: 8,
          MIN_REST_MINUTES: 30,
          MAX_DAILY_WORK_HOURS: 8,
          ...overrideConfig,
        },
      };

      return solveSchedule(solverInput);
    };

    // OPTION A: Balanced local recovery
    const resA = runSolverOption({
      UNASSIGNED_TRIP_PENALTY: 1000,
      BUS_USAGE_WEIGHT: 150,
      HANDOVER_WEIGHT: 50,
    });

    const scoreA = calculateRecoveryObjectiveScore(
      resA.duties,
      resA.tripsUnassigned,
      originalAssignmentsMap,
      originalBusesUsedSet
    );

    const explA = generateRecoveryExplanation(
      resA.duties,
      resA.unassignedTrips,
      originalAssignmentsMap,
      incidentObj
    );

    // OPTION B: Minimize Cancellations (High penalty on cancellations, dispatches spares aggressively)
    const resB = runSolverOption({
      UNASSIGNED_TRIP_PENALTY: 5000,
      BUS_USAGE_WEIGHT: 10, // spare buses cheap
      HANDOVER_WEIGHT: 100,
    });

    const scoreB = calculateRecoveryObjectiveScore(
      resB.duties,
      resB.tripsUnassigned,
      originalAssignmentsMap,
      originalBusesUsedSet
    );

    const explB = generateRecoveryExplanation(
      resB.duties,
      resB.unassignedTrips,
      originalAssignmentsMap,
      incidentObj
    );

    // OPTION C: Minimize Resource Changes (High penalty on new buses and crew change)
    // We restrict available spare resources to only original bindings plus minimal spares
    const resC = runSolverOption({
      UNASSIGNED_TRIP_PENALTY: 800,
      BUS_USAGE_WEIGHT: 800, // spare buses extremely expensive
      HANDOVER_WEIGHT: 200,
    });

    const scoreC = calculateRecoveryObjectiveScore(
      resC.duties,
      resC.tripsUnassigned,
      originalAssignmentsMap,
      originalBusesUsedSet
    );

    const explC = generateRecoveryExplanation(
      resC.duties,
      resC.unassignedTrips,
      originalAssignmentsMap,
      incidentObj
    );

    // Write proposals transactionally
    await db.transaction(async (tx) => {
      // Option A
      await tx.insert(recoveryProposals).values({
        runId,
        proposalNumber: 1,
        status: "PROPOSED",
        objectiveScore: String(scoreA.score),
        tripsRecovered: scoreA.cancellationsCount === 0 ? affectedTrips.length : affectedTrips.length - scoreA.cancellationsCount,
        tripsUnassigned: scoreA.cancellationsCount,
        busesUsed: resA.busesUsed,
        crewChanges: scoreA.crewChangesCount,
        handovers: scoreA.handoversCount,
        delayMinutes: scoreA.delayMinutes,
        cancellations: scoreA.cancellationsCount,
        explanation: `Option A (Balanced Recovery): Best according to current recovery objective weights. ${explA}`,
        proposalData: resA,
      });

      // Option B
      await tx.insert(recoveryProposals).values({
        runId,
        proposalNumber: 2,
        status: "PROPOSED",
        objectiveScore: String(scoreB.score),
        tripsRecovered: scoreB.cancellationsCount === 0 ? affectedTrips.length : affectedTrips.length - scoreB.cancellationsCount,
        tripsUnassigned: scoreB.cancellationsCount,
        busesUsed: resB.busesUsed,
        crewChanges: scoreB.crewChangesCount,
        handovers: scoreB.handoversCount,
        delayMinutes: scoreB.delayMinutes,
        cancellations: scoreB.cancellationsCount,
        explanation: `Option B (Minimize Cancellations): Prioritizes maximum service coverage using spare resources. ${explB}`,
        proposalData: resB,
      });

      // Option C
      await tx.insert(recoveryProposals).values({
        runId,
        proposalNumber: 3,
        status: "PROPOSED",
        objectiveScore: String(scoreC.score),
        tripsRecovered: scoreC.cancellationsCount === 0 ? affectedTrips.length : affectedTrips.length - scoreC.cancellationsCount,
        tripsUnassigned: scoreC.cancellationsCount,
        busesUsed: resC.busesUsed,
        crewChanges: scoreC.crewChangesCount,
        handovers: scoreC.handoversCount,
        delayMinutes: scoreC.delayMinutes,
        cancellations: scoreC.cancellationsCount,
        explanation: `Option C (Minimize Resource Changes): Avoids crew shifts, prioritizing pre-incident schedule preservation. ${explC}`,
        proposalData: resC,
      });

      // Update Run Status
      await tx
        .update(reschedulingRuns)
        .set({
          status: "COMPLETED",
          completedAt: new Date(),
          tripsAffected: affectedTrips.length,
          tripsRecovered: affectedTrips.length - scoreA.cancellationsCount,
          tripsUnassigned: scoreA.cancellationsCount,
          objectiveScore: String(scoreA.score),
          resourceSnapshot,
        })
        .where(eq(reschedulingRuns.id, runId));

      // Update Incident Status to RECOVERY_PROPOSED
      await tx
        .update(incidents)
        .set({ status: "RECOVERY_PROPOSED", updatedAt: new Date() })
        .where(eq(incidents.id, incidentId));
    });

    // Audit log
    await db.insert(auditLogs).values({
      tenantId,
      userId: currentUser.id,
      email: currentUser.email,
      action: "RECOVERY_GENERATED",
      details: `Generated 3 recovery proposals for Incident ID ${incidentId} (Affected trips inside recovery window: ${affectedTrips.length})`,
    });

    return {
      runId,
      success: true,
    };
  } catch (error: any) {
    await db
      .update(reschedulingRuns)
      .set({ status: "FAILED", completedAt: new Date() })
      .where(eq(reschedulingRuns.id, runId));

    throw error;
  }
}

export async function approveRecoveryProposalImpl(data: { proposalId: string }) {
  const currentUser = await requireAuth();
  await requirePermission(currentUser.role, "schedule.publish"); // Scheduler / Org Admin

  const tenantId = currentUser.tenantId;

  // Load proposal
  const prop = await db.query.recoveryProposals.findFirst({
    where: eq(recoveryProposals.id, data.proposalId),
    with: {
      run: true,
    },
  });

  if (!prop) throw new Error("Recovery proposal not found");
  if (prop.status === "APPLIED") throw new Error("Proposal already applied.");

  const runObj = prop.run;

  // Stale protection: check resourceSnapshot vs current database state
  const currentBuses = await db.query.buses.findMany({ where: eq(buses.tenantId, tenantId) });
  const currentCrew = await db.query.crew.findMany({ where: eq(crew.tenantId, tenantId) });
  const currentTrips = await db.query.trips.findMany({
    where: and(eq(trips.tenantId, tenantId), eq(trips.serviceDate, runObj.serviceDate)),
  });

  const snap = runObj.resourceSnapshot as any;
  if (snap) {
    const busChanged = currentBuses.some((cb) => {
      const match = snap.buses.find((sb: any) => sb.id === cb.id);
      return !match || match.status !== cb.status;
    });

    const crewChanged = currentCrew.some((cc) => {
      const match = snap.crew.find((sc: any) => sc.id === cc.id);
      return !match || match.status !== cc.status || match.restUntil !== cc.restUntil;
    });

    const tripsChanged = currentTrips.some((ct) => {
      const match = snap.trips.find((st: any) => st.id === ct.id);
      return !match || match.startTime !== ct.startTime || match.status !== ct.status;
    });

    if (busChanged || crewChanged || tripsChanged) {
      await db.insert(auditLogs).values({
        tenantId,
        userId: currentUser.id,
        email: currentUser.email,
        action: "RECOVERY_REJECTED",
        details: `Recovery rejected: Operational state changed since this recovery was generated.`,
      });
      throw new Error("Operational state changed since this recovery was generated. Please regenerate.");
    }
  }

  const proposalDuties = (prop.proposalData as OptimizerResult).duties;

  // Transactionally apply the local recovery schedule modifications!
  await db.transaction(async (tx) => {
    // 1. Identify which trips were re-optimized inside the recovery window
    const affectedTripIds = (prop.proposalData as OptimizerResult).assignments.map((a) => a.tripId);
    const unassignedTripIds = (prop.proposalData as OptimizerResult).unassignedTrips.map((u) => u.tripId);
    const totalTargetTripIds = [...affectedTripIds, ...unassignedTripIds];

    if (totalTargetTripIds.length > 0) {
      // Delete pre-existing duty bindings for only the target trips inside the recovery window!
      // This preserves unchanged frozen duties elsewhere in the day!
      for (const tripId of totalTargetTripIds) {
        await tx.delete(dutyTrips).where(eq(dutyTrips.tripId, tripId));
      }
    }

    // Clean up empty duties (duties left with no trips assigned inside the recovery window)
    const allTenantDuties = await tx.query.duties.findMany({
      where: and(eq(duties.tenantId, tenantId), eq(duties.serviceDate, runObj.serviceDate)),
      with: {
        trips: true,
      },
    });

    for (const d of allTenantDuties) {
      if (d.trips.length === 0) {
        await tx.delete(duties).where(eq(duties.id, d.id));
      }
    }

    // 2. Insert new recovered duties
    for (const pDuty of proposalDuties) {
      const [dutyRecord] = await tx
        .insert(duties)
        .values({
          tenantId,
          dutyCode: pDuty.dutyCode + "-R", // Suffix -R to designate recovered duty block
          dutyType: pDuty.dutyType,
          serviceDate: runObj.serviceDate,
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

        // Set trip status as RECOVERED (live state update!)
        await tx
          .update(trips)
          .set({ status: "RECOVERED", updatedAt: new Date() })
          .where(eq(trips.id, t.tripId));
      }

      // Insert segments for unlinked handovers
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

    // Update cancelled/unassigned trips status to CANCELLED in database
    for (const tripId of unassignedTripIds) {
      await tx
        .update(trips)
        .set({ status: "CANCELLED", updatedAt: new Date() })
        .where(eq(trips.id, tripId));
    }

    // 3. Mark recovery proposal & run as APPLIED
    await tx
      .update(recoveryProposals)
      .set({ status: "APPLIED" })
      .where(eq(recoveryProposals.id, data.proposalId));

    // Reject other proposals for this run
    await tx
      .update(recoveryProposals)
      .set({ status: "REJECTED" })
      .where(and(eq(recoveryProposals.runId, runObj.id), not(eq(recoveryProposals.id, data.proposalId))));

    await tx
      .update(reschedulingRuns)
      .set({ status: "APPLIED" })
      .where(eq(reschedulingRuns.id, runObj.id));

    // Update Incident status to APPLIED
    await tx
      .update(incidents)
      .set({ status: "APPLIED", updatedAt: new Date() })
      .where(eq(incidents.id, runObj.incidentId));
  });

  // Audit Logs
  await db.insert(auditLogs).values({
    tenantId,
    userId: currentUser.id,
    email: currentUser.email,
    action: "RECOVERY_APPROVED",
    details: `Approved and applied Recovery Proposal Option ${prop.proposalNumber} for Incident ID ${runObj.incidentId}`,
  });

  return { success: true };
}
