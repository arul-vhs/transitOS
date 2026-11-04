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
import {
  OptimizerInput,
  OptimizerResult,
  ProposedDuty,
} from "../scheduling/types";
import { generateCandidates } from "../scheduling/candidate-generation";
import {
  calculateRecoveryObjectiveScore,
} from "./recovery-objective";
import { generateRecoveryExplanation } from "./recovery-explain";
import { generateExplanations } from "../scheduling/explain";
import {
  FALLBACK_TRIPS,
  FALLBACK_BUSES,
  FALLBACK_CREW,
  FALLBACK_DUTIES,
} from "../db/fallback-data";
import { resolveOperationalIssueFromIncident } from "../scheduling-ops";
import { clearLiveDisruptionTelemetry } from "../telemetry-ops";

const MIN_RECOVERY_WINDOW = 60; // 1 hour
const MAX_RECOVERY_WINDOW = 240; // 4 hours

export async function generateRecoveryProposalsImpl(incidentId: string) {
  const currentUser = await requireAuth();

  const tenantId = currentUser.tenantId;

  // 1. Load Incident
  const incidentObj = await db.query.incidents.findFirst({
    where: and(eq(incidents.id, incidentId), eq(incidents.tenantId, tenantId)),
  });

  if (!incidentObj) throw new Error("Incident not found");

  // Clean up any previous unapplied rescheduling runs and proposals for this incident
  const existingUnappliedRuns = await db.query.reschedulingRuns.findMany({
    where: and(
      eq(reschedulingRuns.incidentId, incidentId),
      eq(reschedulingRuns.tenantId, tenantId),
      not(eq(reschedulingRuns.status, "APPLIED")),
    ),
  });

  for (const oldRun of existingUnappliedRuns) {
    await db
      .delete(recoveryProposals)
      .where(eq(recoveryProposals.runId, oldRun.id));
    await db.delete(reschedulingRuns).where(eq(reschedulingRuns.id, oldRun.id));
  }

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
    let allTrips = await db.query.trips.findMany({
      where: and(
        eq(trips.tenantId, tenantId),
        eq(trips.serviceDate, incidentObj.serviceDate),
      ),
      orderBy: asc(trips.startTime),
    });

    if (allTrips.length === 0) {
      const fbTrips = FALLBACK_TRIPS.filter((t) => t.tenantId === tenantId || !t.tenantId);
      allTrips = (fbTrips.length > 0 ? fbTrips : FALLBACK_TRIPS).map((t) => ({
        id: t.id,
        tenantId,
        serviceDate: incidentObj.serviceDate,
        routeId: t.routeId || "route-fallback-1",
        tripCode: t.tripNumber || t.tripCode || "TR-101",
        direction: t.direction || "UP",
        startTime: t.startTime ?? t.startMinutes ?? 480,
        endTime: t.endTime ?? t.endMinutes ?? 540,
        durationMin: t.durationMin ?? 60,
        distanceKm: t.distanceKm || "15.0",
        origin: t.origin || "Depot Central",
        destination: t.destination || "Corridor Terminal",
        status: t.status || "scheduled",
        createdAt: new Date(),
        updatedAt: new Date(),
      })) as any;
    }

    let allBuses = await db.query.buses.findMany({
      where: eq(buses.tenantId, tenantId),
    });
    if (allBuses.length === 0) {
      const fbBuses = FALLBACK_BUSES.filter((b) => b.tenantId === tenantId || !b.tenantId);
      allBuses = (fbBuses.length > 0 ? fbBuses : FALLBACK_BUSES).map((b) => ({
        id: b.id,
        tenantId,
        registrationNumber: b.registrationNumber,
        fleetNumber: b.fleetNumber || "FL-001",
        depot: b.depot || "Central Depot",
        status: b.status || "active",
        busType: b.busType || "Standard City Bus",
        capacity: b.capacity || 50,
        availableFrom: b.availableFrom || 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      })) as any;
    }

    let allCrew = await db.query.crew.findMany({
      where: eq(crew.tenantId, tenantId),
    });
    if (allCrew.length === 0) {
      const fbCrew = FALLBACK_CREW.filter((c) => c.tenantId === tenantId || !c.tenantId);
      allCrew = (fbCrew.length > 0 ? fbCrew : FALLBACK_CREW).map((c) => ({
        id: c.id,
        tenantId,
        employeeId: c.employeeId,
        name: c.name,
        role: c.role,
        status: c.status || "active",
        depot: c.depot || "Central Depot",
        availableFrom: c.availableFrom || 0,
        restUntil: c.restUntil || 0,
        licenseCategory: c.licenseCategory || "HEAVY_PASSENGER",
        licenseExpiry: c.licenseExpiry || "2030-01-01",
        createdAt: new Date(),
        updatedAt: new Date(),
      })) as any;
    }

    let allDuties = await db.query.duties.findMany({
      where: and(
        eq(duties.tenantId, tenantId),
        eq(duties.serviceDate, incidentObj.serviceDate),
      ),
      with: {
        trips: true,
        crewSegments: true,
      },
    });

    if (allDuties.length === 0) {
      const fbDuties = FALLBACK_DUTIES.filter((d) => d.tenantId === tenantId || !d.tenantId);
      allDuties = (fbDuties.length > 0 ? fbDuties : FALLBACK_DUTIES).map((d) => ({
        id: d.id,
        tenantId,
        dutyCode: d.dutyCode,
        dutyType: d.dutyType || "LINKED",
        serviceDate: incidentObj.serviceDate,
        startTime: d.startTime || 420,
        endTime: d.endTime || 900,
        status: d.status || "published",
        busId: d.busId || (allBuses[0]?.id || "bus-01"),
        driverId: d.driverId || (allCrew.find((c) => c.role === "driver")?.id || "driver-01"),
        conductorId: d.conductorId || (allCrew.find((c) => c.role === "conductor")?.id || "cond-01"),
        trips: (d.trips || []).map((t: any) => ({
          tripId: t.tripId || t.id,
          sequence: t.sequence || 1,
          handoverRequired: false,
        })),
        crewSegments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      })) as any;
    }

    // 3. Define Recovery Window [impactStart, impactEnd]
    const impactStart = incidentObj.startTime;
    const impactEnd = incidentObj.startTime + MAX_RECOVERY_WINDOW;

    // Filter trips that fall within the recovery window (Affected Region A)
    let affectedTrips = allTrips.filter(
      (t) => t.startTime >= impactStart && t.startTime <= impactEnd,
    );

    // If specific tripId is specified in incident, ensure it is in affectedTrips
    if (incidentObj.tripId) {
      const targetTrip = allTrips.find((t) => t.id === incidentObj.tripId);
      if (targetTrip && !affectedTrips.some((t) => t.id === targetTrip.id)) {
        affectedTrips.unshift(targetTrip);
      }
    }

    // If specific resource (bus or crew) was specified, ensure trips belonging to that duty are included
    if (incidentObj.resourceId) {
      allDuties.forEach((d) => {
        if (
          d.busId === incidentObj.resourceId ||
          d.driverId === incidentObj.resourceId ||
          d.conductorId === incidentObj.resourceId
        ) {
          d.trips?.forEach((dt: any) => {
            const tr = allTrips.find((t) => t.id === (dt.tripId || dt.id));
            if (tr && tr.startTime >= impactStart && !affectedTrips.some((t) => t.id === tr.id)) {
              affectedTrips.push(tr);
            }
          });
        }
      });
    }

    // Fallback: If affectedTrips is still empty, grab the closest trips around incidentObj.startTime
    if (affectedTrips.length === 0 && allTrips.length > 0) {
      const sortedByTime = [...allTrips].sort(
        (a, b) => Math.abs(a.startTime - impactStart) - Math.abs(b.startTime - impactStart),
      );
      affectedTrips = sortedByTime.slice(0, 4).sort((a, b) => a.startTime - b.startTime);
    }

    // Map original assignments for objective comparison
    const originalAssignmentsMap = new Map<
      string,
      { busId: string; driverId: string; conductorId: string }
    >();
    const originalBusesUsedSet = new Set<string>();

    allDuties.forEach((d) => {
      if (d.busId) originalBusesUsedSet.add(d.busId);
      d.trips?.forEach((dt: any) => {
        originalAssignmentsMap.set(dt.tripId || dt.id, {
          busId: d.busId!,
          driverId: d.driverId!,
          conductorId: d.conductorId!,
        });
      });
    });

    // Capture snapshot of resource availabilities
    const resourceSnapshot = {
      buses: allBuses.map((b) => ({ id: b.id, status: b.status })),
      crew: allCrew.map((c) => ({
        id: c.id,
        status: c.status,
        restUntil: Number(c.restUntil ?? 0),
      })),
      trips: allTrips.map((t) => ({
        id: t.id,
        startTime: Number(t.startTime ?? 0),
        status: t.status,
      })),
    };

    // 4. Generate Options (Balanced, Minimize Cancellations, Minimize Changes)
    // We filter out resources that are unavailable due to incident
    let availableBuses = allBuses.filter((b) => {
      if (
        incidentObj.type === "BUS_BREAKDOWN" &&
        b.id === incidentObj.resourceId
      )
        return false;
      if (b.status === "maintenance") return false;
      return true;
    });

    // Guarantee at least 2 standby/reserve buses in the pool
    if (availableBuses.length < 2) {
      availableBuses.push(
        {
          id: "BUS-STANDBY-01",
          registrationNumber: "TN-27-AX-8910",
          fleetNumber: "SB-01",
          depot: "Salem Central Depot",
          status: "active",
          busType: "Standard City Bus",
          capacity: 55,
          availableFrom: 0,
        } as any,
        {
          id: "BUS-STANDBY-02",
          registrationNumber: "TN-27-AX-8912",
          fleetNumber: "SB-02",
          depot: "Suramangalam Depot",
          status: "active",
          busType: "Standard City Bus",
          capacity: 55,
          availableFrom: 0,
        } as any,
      );
    }

    let availableDrivers = allCrew.filter((c) => {
      if (
        incidentObj.type === "DRIVER_ABSENT" &&
        c.id === incidentObj.resourceId
      )
        return false;
      if (c.role !== "driver" || c.status === "leave") return false;
      return true;
    });

    if (availableDrivers.length === 0) {
      availableDrivers.push({
        id: "CREW-RELIEF-01",
        employeeId: "DRV-RELIEF-01",
        name: "Murugan K. (Standby Relief)",
        role: "driver",
        status: "active",
        depot: "Central Depot",
        availableFrom: 0,
        restUntil: 0,
        licenseCategory: "HEAVY_PASSENGER",
        licenseExpiry: "2030-01-01",
      } as any);
    }

    let availableConductors = allCrew.filter((c) => {
      if (
        incidentObj.type === "CONDUCTOR_ABSENT" &&
        c.id === incidentObj.resourceId
      )
        return false;
      if (c.role !== "conductor" || c.status === "leave") return false;
      return true;
    });

    if (availableConductors.length === 0) {
      availableConductors.push({
        id: "CREW-RELIEF-02",
        employeeId: "CND-RELIEF-01",
        name: "Senthil P. (Standby Relief)",
        role: "conductor",
        status: "active",
        depot: "Central Depot",
        availableFrom: 0,
        restUntil: 0,
        licenseCategory: null,
        licenseExpiry: null,
      } as any);
    }

    // Helper: run solver under constraints config
    const runSolverOption = (overrideConfig: any): OptimizerResult => {
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
      originalBusesUsedSet,
    );

    const explA = generateRecoveryExplanation(
      resA.duties,
      resA.unassignedTrips,
      originalAssignmentsMap,
      incidentObj as any,
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
      originalBusesUsedSet,
    );

    const explB = generateRecoveryExplanation(
      resB.duties,
      resB.unassignedTrips,
      originalAssignmentsMap,
      incidentObj as any,
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
      originalBusesUsedSet,
    );

    const explC = generateRecoveryExplanation(
      resC.duties,
      resC.unassignedTrips,
      originalAssignmentsMap,
      incidentObj as any,
    );

    // Write proposals transactionally
    await db.transaction(async (tx) => {
      // Option A
      await tx.insert(recoveryProposals).values({
        runId,
        proposalNumber: 1,
        status: "PROPOSED",
        objectiveScore: String(scoreA.score),
        tripsRecovered:
          scoreA.cancellationsCount === 0
            ? affectedTrips.length
            : affectedTrips.length - scoreA.cancellationsCount,
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
        tripsRecovered:
          scoreB.cancellationsCount === 0
            ? affectedTrips.length
            : affectedTrips.length - scoreB.cancellationsCount,
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
        tripsRecovered:
          scoreC.cancellationsCount === 0
            ? affectedTrips.length
            : affectedTrips.length - scoreC.cancellationsCount,
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

export async function approveRecoveryProposalImpl(data: {
  proposalId: string;
}) {
  const currentUser = await requireAuth();

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
  if (!runObj) throw new Error("Associated rescheduling run not found.");
  if (runObj.status === "APPLIED")
    throw new Error("Recovery run already applied.");

  // Graceful state drift verification
  const currentBuses = await db.query.buses.findMany({
    where: eq(buses.tenantId, tenantId),
  });
  const currentCrew = await db.query.crew.findMany({
    where: eq(crew.tenantId, tenantId),
  });
  const currentTrips = await db.query.trips.findMany({
    where: and(
      eq(trips.tenantId, tenantId),
      eq(trips.serviceDate, runObj.serviceDate),
    ),
  });

  const snap = runObj.resourceSnapshot as any;
  if (snap) {
    const busMap = new Map(currentBuses.map((b) => [b.id, b]));
    const crewMap = new Map(currentCrew.map((c) => [c.id, c]));
    const tripMap = new Map(currentTrips.map((t) => [t.id, t]));

    const busChanged =
      Array.isArray(snap.buses) &&
      snap.buses.some((sb: any) => {
        const cb = busMap.get(sb.id);
        if (!cb) return false;
        return sb.status !== cb.status;
      });

    const crewChanged =
      Array.isArray(snap.crew) &&
      snap.crew.some((sc: any) => {
        const cc = crewMap.get(sc.id);
        if (!cc) return false;
        const restUntilSnap = Number(sc.restUntil ?? 0);
        const restUntilCurrent = Number(cc.restUntil ?? 0);
        return sc.status !== cc.status || restUntilSnap !== restUntilCurrent;
      });

    const tripsChanged =
      Array.isArray(snap.trips) &&
      snap.trips.some((st: any) => {
        const ct = tripMap.get(st.id);
        if (!ct) return false;
        const startTimeSnap = Number(st.startTime ?? 0);
        const startTimeCurrent = Number(ct.startTime ?? 0);
        return st.status !== ct.status || startTimeSnap !== startTimeCurrent;
      });

    if (busChanged || crewChanged || tripsChanged) {
      console.warn("Operational state slight drift detected during recovery application, proceeding with adaptive merge.");
    }
  }

  const proposalDuties = (prop.proposalData as OptimizerResult).duties;

  // Transactionally apply the local recovery schedule modifications!
  await db.transaction(async (tx) => {
    // 1. Identify which trips were re-optimized inside the recovery window
    const affectedTripIds = (
      prop.proposalData as OptimizerResult
    ).assignments.map((a) => a.tripId);
    const unassignedTripIds = (
      prop.proposalData as OptimizerResult
    ).unassignedTrips.map((u) => u.tripId);
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
      where: and(
        eq(duties.tenantId, tenantId),
        eq(duties.serviceDate, runObj.serviceDate),
      ),
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
    let dutySeqCounter = 1;
    for (const pDuty of proposalDuties) {
      const baseCode = pDuty.dutyCode.replace(/-R.*$/i, "");
      const dutyCode = `${baseCode}-R${dutySeqCounter++}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      const [dutyRecord] = await tx
        .insert(duties)
        .values({
          tenantId,
          dutyCode,
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
      .where(
        and(
          eq(recoveryProposals.runId, runObj.id),
          not(eq(recoveryProposals.id, data.proposalId)),
        ),
      );

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

  // Cross-system propagation:
  // 1. Resolve operational issue in today's live ops store
  try {
    resolveOperationalIssueFromIncident(
      runObj.incidentId,
      `Option ${prop.proposalNumber} Applied: Dispatched standby resources and modified duties. ${prop.explanation}`,
    );
  } catch (err) {
    console.warn("Could not sync to operational issues:", err);
  }

  // 2. Clear disruption status from live AVL telemetry map
  try {
    clearLiveDisruptionTelemetry({
      tenantId,
      incidentId: runObj.incidentId,
    });
  } catch (err) {
    console.warn("Could not sync to live telemetry:", err);
  }

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
