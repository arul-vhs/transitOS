import { ProposedDuty } from "../scheduling/types";

export const RECOVERY_CONFIG = {
  UNASSIGNED_TRIP_PENALTY: 1000,
  CANCELLATION_WEIGHT: 800,
  DELAY_WEIGHT: 2,
  NEW_BUS_WEIGHT: 150,
  CREW_CHANGE_WEIGHT: 100,
  HANDOVER_WEIGHT: 50,
  DISRUPTION_WEIGHT: 40,
};

export function calculateRecoveryObjectiveScore(
  proposedDuties: ProposedDuty[],
  unassignedTripsCount: number,
  originalAssignmentsMap: Map<string, { busId: string; driverId: string; conductorId: string }>,
  originalBusesUsedSet: Set<string>
): {
  score: number;
  delayMinutes: number;
  cancellationsCount: number;
  newBusesCount: number;
  crewChangesCount: number;
  handoversCount: number;
} {
  const cfg = RECOVERY_CONFIG;

  // 1. Unassigned / Cancellations Penalty
  const cancellationsCount = unassignedTripsCount;
  const cancellationPenalty = cancellationsCount * cfg.CANCELLATION_WEIGHT;

  // 2. Additional Buses Penalty
  const proposedBusesUsed = new Set(proposedDuties.map((d) => d.busId));
  let newBusesCount = 0;
  proposedBusesUsed.forEach((busId) => {
    if (!originalBusesUsedSet.has(busId)) {
      newBusesCount += 1;
    }
  });
  const newBusPenalty = newBusesCount * cfg.NEW_BUS_WEIGHT;

  // 3. Crew Changes & Disruption Penalty
  let crewChangesCount = 0;
  let disruptionPenalty = 0;

  proposedDuties.forEach((d) => {
    d.trips.forEach((t) => {
      const orig = originalAssignmentsMap.get(t.tripId);
      if (orig) {
        // Find driver/conductor for this trip segment
        let currentDriverId = d.driverId;
        let currentConductorId = d.conductorId;

        if (d.dutyType === "UNLINKED") {
          const seg = d.crewSegments.find(
            (s) => t.sequence >= s.sequence // simplistically map segments by sequence bounds
          );
          if (seg) {
            currentDriverId = seg.driverId;
            currentConductorId = seg.conductorId;
          }
        }

        const busChanged = orig.busId !== d.busId;
        const driverChanged = orig.driverId !== currentDriverId;
        const conductorChanged = orig.conductorId !== currentConductorId;

        if (busChanged) {
          disruptionPenalty += cfg.DISRUPTION_WEIGHT;
        }

        if (driverChanged || conductorChanged) {
          crewChangesCount += 1;
          disruptionPenalty += cfg.CREW_CHANGE_WEIGHT;
        }
      }
    });
  });

  // 4. Handovers Count
  let handoversCount = 0;
  proposedDuties.forEach((d) => {
    if (d.dutyType === "UNLINKED" && d.crewSegments.length > 1) {
      handoversCount += d.crewSegments.length - 1;
    }
  });
  const handoverPenalty = handoversCount * cfg.HANDOVER_WEIGHT;

  // 5. Passengers delayMinutes (e.g. simulated from delayed arrivals)
  // Let's assume we maintain small delayed gaps if turnaround spacing was compressed
  let delayMinutes = 0;
  proposedDuties.forEach((d) => {
    // Sum delays (simulated based on turnaround compression below 10 mins)
    for (let i = 0; i < d.trips.length - 1; i++) {
      const gap = d.trips[i+1]!.sequence - d.trips[i]!.sequence; // simplified gap
      if (gap < 0) {
        delayMinutes += Math.abs(gap);
      }
    }
  });
  const delayPenalty = delayMinutes * cfg.DELAY_WEIGHT;

  const totalScore =
    cancellationPenalty +
    newBusPenalty +
    disruptionPenalty +
    handoverPenalty +
    delayPenalty;

  return {
    score: Math.round(totalScore),
    delayMinutes,
    cancellationsCount,
    newBusesCount,
    crewChangesCount,
    handoversCount,
  };
}
