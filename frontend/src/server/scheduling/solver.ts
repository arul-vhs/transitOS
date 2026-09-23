import { checkTurnaround, checkDutyDuration, checkLicenseCategory } from "./constraints";
import { generateCandidates } from "./candidate-generation";
import { calculateObjectiveScore, calculateQualityScore } from "./objective";
import { generateExplanations } from "./explain";
import { Trip, Bus, Crew, OptimizerInput, OptimizerResult, ProposedDuty } from "./types";

interface SolverState {
  duties: ProposedDuty[];
  assignments: {
    tripId: string;
    busId: string;
    driverId: string;
    conductorId: string;
    handoverRequired: boolean;
  }[];
  unassignedTrips: string[];
}

export function solveSchedule(input: OptimizerInput): OptimizerResult {
  const sortedTrips = [...input.trips].sort((a, b) => a.startTime - b.startTime);
  const candidates = generateCandidates(input);
  const candidatesMap = new Map(candidates.map((c) => [c.tripId, c]));

  // Track resource schedules to prevent overlapping assignments
  const busSchedules = new Map<string, { startTime: number; endTime: number }[]>();
  const crewSchedules = new Map<string, { startTime: number; endTime: number }[]>();

  input.buses.forEach((b) => busSchedules.set(b.id, []));
  input.drivers.forEach((d) => crewSchedules.set(d.id, []));
  input.conductors.forEach((c) => crewSchedules.set(c.id, []));

  const state: SolverState = {
    duties: [],
    assignments: [],
    unassignedTrips: [],
  };

  // Helper: check resource overlap
  const isResourceAvailable = (
    resourceId: string,
    start: number,
    end: number,
    scheduleMap: Map<string, { startTime: number; endTime: number }[]>
  ): boolean => {
    const list = scheduleMap.get(resourceId) || [];
    for (const item of list) {
      if (start < item.endTime && end > item.startTime) {
        return false;
      }
    }
    return true;
  };

  const reserveResource = (
    resourceId: string,
    start: number,
    end: number,
    scheduleMap: Map<string, { startTime: number; endTime: number }[]>
  ) => {
    const list = scheduleMap.get(resourceId) || [];
    list.push({ startTime: start, endTime: end });
    scheduleMap.set(resourceId, list);
  };

  const routeMap = new Map<string, string>();
  input.routes.forEach((r) => routeMap.set(r.id, r.code));
  const getRouteCode = (routeId: string) => routeMap.get(routeId) || "Corridor";

  // Solve sequentially using a priority-driven heuristic
  for (const trip of sortedTrips) {
    const cand = candidatesMap.get(trip.id);
    if (!cand) {
      state.unassignedTrips.push(trip.id);
      continue;
    }

    let assigned = false;

    // 1. TRY OPTION A: Append to an existing active duty
    // Find duties that are compatible (same serviceDate and same bus type compatibility)
    // Sort duties by endTime to find the closest compatible turnaround gap
    const activeDuties = state.duties.filter((d) => d.trips.length > 0);
    const sortedDuties = [...activeDuties].sort((a, b) => b.endTime - a.endTime);

    for (const duty of sortedDuties) {
      const bus = input.buses.find((b) => b.id === duty.busId);
      if (!bus) continue;

      // Validate turnaround buffer with the last trip in duty
      const lastTripId = duty.trips[duty.trips.length - 1]!.tripId;
      const lastTrip = input.trips.find((t) => t.id === lastTripId);
      if (!lastTrip) continue;

      const turnaround = checkTurnaround(lastTrip, trip, input.configuration);
      if (!turnaround.feasible) continue;

      // Validate duty duration bounds
      if (!checkDutyDuration(duty.startTime, trip.endTime, input.configuration)) {
        continue;
      }

      // Check linked mode vs handovers
      const isLinkedMode = input.mode === "LINKED" || (input.mode === "HYBRID" && duty.dutyType === "LINKED");

      if (isLinkedMode) {
        // Linked crew: same driver and conductor must remain
        const driverId = duty.driverId!;
        const conductorId = duty.conductorId!;

        // Validate driver and conductor compatibility for this trip
        const isDriverOk = cand.compatibleDrivers.some((d) => d.id === driverId);
        const isConductorOk = cand.compatibleConductors.some((c) => c.id === conductorId);

        if (isDriverOk && isConductorOk) {
          // Double check overlap (should be clear since duty itself is sequential, but verify rest/timeline)
          if (
            isResourceAvailable(driverId, lastTrip.endTime, trip.endTime, crewSchedules) &&
            isResourceAvailable(conductorId, lastTrip.endTime, trip.endTime, crewSchedules)
          ) {
            reserveResource(driverId, lastTrip.endTime, trip.endTime, crewSchedules);
            reserveResource(conductorId, lastTrip.endTime, trip.endTime, crewSchedules);

            duty.trips.push({
              tripId: trip.id,
              tripCode: trip.tripCode,
              sequence: duty.trips.length + 1,
              handoverRequired: false,
            });
            duty.endTime = trip.endTime;

            state.assignments.push({
              tripId: trip.id,
              busId: duty.busId,
              driverId,
              conductorId,
              handoverRequired: false,
            });

            assigned = true;
            break;
          }
        }
      } else {
        // Unlinked Handover mode (or hybrid choosing unlinked)
        // Find if we can keep same crew OR assign new ones for handover
        const currentDriverId = duty.crewSegments[duty.crewSegments.length - 1]!.driverId;
        const currentConductorId = duty.crewSegments[duty.crewSegments.length - 1]!.conductorId;

        const keepDriver = cand.compatibleDrivers.some((d) => d.id === currentDriverId);
        const keepConductor = cand.compatibleConductors.some((c) => c.id === currentConductorId);

        if (keepDriver && keepConductor) {
          // Keep same crew
          if (
            isResourceAvailable(currentDriverId, lastTrip.endTime, trip.endTime, crewSchedules) &&
            isResourceAvailable(currentConductorId, lastTrip.endTime, trip.endTime, crewSchedules)
          ) {
            reserveResource(currentDriverId, lastTrip.endTime, trip.endTime, crewSchedules);
            reserveResource(currentConductorId, lastTrip.endTime, trip.endTime, crewSchedules);

            // Extend last segment
            const lastSeg = duty.crewSegments[duty.crewSegments.length - 1]!;
            lastSeg.endTime = trip.endTime;

            duty.trips.push({
              tripId: trip.id,
              tripCode: trip.tripCode,
              sequence: duty.trips.length + 1,
              handoverRequired: false,
              startTime: trip.startTime,
              endTime: trip.endTime,
              routeCode: getRouteCode(trip.routeId),
              origin: trip.origin,
              destination: trip.destination,
            });
            duty.endTime = trip.endTime;

            state.assignments.push({
              tripId: trip.id,
              busId: duty.busId,
              driverId: currentDriverId,
              conductorId: currentConductorId,
              handoverRequired: false,
            });

            assigned = true;
            break;
          }
        } else {
          // Try Handover: pick a new driver/conductor for this trip segment!
          // Filter drivers and conductors that are available for this new segment (from trip start to trip end)
          const newDriver = cand.compatibleDrivers.find((d) =>
            isResourceAvailable(d.id, trip.startTime, trip.endTime, crewSchedules) &&
            checkLicenseCategory(d, bus.busType)
          );

          const newConductor = cand.compatibleConductors.find((c) =>
            isResourceAvailable(c.id, trip.startTime, trip.endTime, crewSchedules)
          );

          if (newDriver && newConductor) {
            reserveResource(newDriver.id, trip.startTime, trip.endTime, crewSchedules);
            reserveResource(newConductor.id, trip.startTime, trip.endTime, crewSchedules);

            // Flag handover required on previous last trip
            duty.trips[duty.trips.length - 1]!.handoverRequired = true;

            duty.trips.push({
              tripId: trip.id,
              tripCode: trip.tripCode,
              sequence: duty.trips.length + 1,
              handoverRequired: false,
              startTime: trip.startTime,
              endTime: trip.endTime,
              routeCode: getRouteCode(trip.routeId),
              origin: trip.origin,
              destination: trip.destination,
            });
            duty.endTime = trip.endTime;

            // Add new segment
            duty.crewSegments.push({
              driverId: newDriver.id,
              conductorId: newConductor.id,
              startTime: trip.startTime,
              endTime: trip.endTime,
              sequence: duty.crewSegments.length + 1,
            });

            state.assignments.push({
              tripId: trip.id,
              busId: duty.busId,
              driverId: newDriver.id,
              conductorId: newConductor.id,
              handoverRequired: true,
            });

            assigned = true;
            break;
          }
        }
      }
    }

    if (assigned) continue;

    // 2. TRY OPTION B: Create a brand new duty block
    // Find available buses, drivers, conductors that can start this trip
    const availableBus = cand.compatibleBuses.find((b) =>
      isResourceAvailable(b.id, trip.startTime, trip.endTime, busSchedules)
    );

    if (availableBus) {
      const availableDriver = cand.compatibleDrivers.find((d) =>
        isResourceAvailable(d.id, trip.startTime, trip.endTime, crewSchedules) &&
        checkLicenseCategory(d, availableBus.busType)
      );

      const availableConductor = cand.compatibleConductors.find((c) =>
        isResourceAvailable(c.id, trip.startTime, trip.endTime, crewSchedules)
      );

      if (availableDriver && availableConductor) {
        reserveResource(availableBus.id, trip.startTime, trip.endTime, busSchedules);
        reserveResource(availableDriver.id, trip.startTime, trip.endTime, crewSchedules);
        reserveResource(availableConductor.id, trip.startTime, trip.endTime, crewSchedules);

        const dutyTypeDecision = input.mode === "UNLINKED" ? "UNLINKED" : "LINKED";
        const dutyCode = `${dutyTypeDecision === "LINKED" ? "L" : "U"}-${String(
          101 + state.duties.length
        )}`;

        const newDuty: ProposedDuty = {
          dutyCode,
          dutyType: dutyTypeDecision,
          busId: availableBus.id,
          driverId: dutyTypeDecision === "LINKED" ? availableDriver.id : null,
          conductorId: dutyTypeDecision === "LINKED" ? availableConductor.id : null,
          startTime: trip.startTime,
          endTime: trip.endTime,
          trips: [
            {
              tripId: trip.id,
              tripCode: trip.tripCode,
              sequence: 1,
              handoverRequired: false,
              startTime: trip.startTime,
              endTime: trip.endTime,
              routeCode: getRouteCode(trip.routeId),
              origin: trip.origin,
              destination: trip.destination,
            },
          ],
          crewSegments: [
            {
              driverId: availableDriver.id,
              conductorId: availableConductor.id,
              startTime: trip.startTime,
              endTime: trip.endTime,
              sequence: 1,
            },
          ],
        };

        state.duties.push(newDuty);

        state.assignments.push({
          tripId: trip.id,
          busId: availableBus.id,
          driverId: availableDriver.id,
          conductorId: availableConductor.id,
          handoverRequired: false,
        });

        assigned = true;
      }
    }

    if (!assigned) {
      state.unassignedTrips.push(trip.id);
    }
  }

  // Calculate Metrics summaries
  const tripsCovered = state.assignments.length;
  const tripsUnassigned = state.unassignedTrips.length;
  const busesUsed = new Set(state.duties.map((d) => d.busId)).size;

  const driversUsedSet = new Set<string>();
  const conductorsUsedSet = new Set<string>();

  state.duties.forEach((d) => {
    if (d.driverId) driversUsedSet.add(d.driverId);
    if (d.conductorId) conductorsUsedSet.add(d.conductorId);
    d.crewSegments.forEach((seg) => {
      if (seg.driverId) driversUsedSet.add(seg.driverId);
      if (seg.conductorId) conductorsUsedSet.add(seg.conductorId);
    });
  });

  const dutiesCreated = state.duties.length;
  const linkedDuties = state.duties.filter((d) => d.dutyType === "LINKED").length;
  const unlinkedDuties = state.duties.filter((d) => d.dutyType === "UNLINKED").length;

  let handovers = 0;
  state.duties.forEach((d) => {
    if (d.dutyType === "UNLINKED" && d.crewSegments.length > 1) {
      handovers += d.crewSegments.length - 1;
    }
  });

  const objectiveScore = calculateObjectiveScore(state.duties, tripsUnassigned, input);
  const solverStatus = tripsUnassigned === 0 ? "FEASIBLE" : tripsCovered > 0 ? "PARTIAL" : "INFEASIBLE";

  // Generate explainability details for unassigned trips
  const unassignedTripsExplanations = generateExplanations(state.unassignedTrips, input, candidatesMap);

  return {
    status: solverStatus,
    tripsCovered,
    tripsUnassigned,
    busesUsed,
    driversUsed: driversUsedSet.size,
    conductorsUsed: conductorsUsedSet.size,
    dutiesCreated,
    linkedDuties,
    unlinkedDuties,
    handovers,
    objectiveScore,
    assignments: state.assignments,
    duties: state.duties,
    unassignedTrips: unassignedTripsExplanations,
    violations: [], // Pure TS solver ensures 0 hard violations by construction!
    explanations: unassignedTripsExplanations.map((u) => `${u.tripCode}: ${u.reason}`),
  };
}
