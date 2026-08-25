import { ProposedDuty, OptimizerInput } from "./types";

export function calculateObjectiveScore(
  duties: ProposedDuty[],
  unassignedTripsCount: number,
  input: OptimizerInput
): number {
  const cfg = input.configuration;

  // 1. Unassigned trips penalty (highest priority)
  const unassignedPenalty = unassignedTripsCount * cfg.UNASSIGNED_TRIP_PENALTY;

  // 2. Bus usage cost
  const busesUsed = new Set(duties.map((d) => d.busId)).size;
  const busCost = busesUsed * cfg.BUS_USAGE_WEIGHT;

  // 3. Duties count cost
  const dutyCost = duties.length * cfg.DUTY_COUNT_WEIGHT;

  // 4. Crew handovers penalty (for unlinked segments)
  let handoversCount = 0;
  duties.forEach((d) => {
    if (d.dutyType === "UNLINKED" && d.crewSegments.length > 1) {
      handoversCount += d.crewSegments.length - 1;
    }
  });
  const handoverCost = handoversCount * cfg.HANDOVER_WEIGHT;

  // 5. Idle time penalty (gaps between consecutive trips in each duty)
  let totalIdleTime = 0;
  duties.forEach((d) => {
    // Find gaps between consecutive trips in sequence
    // Note: trips inside d.trips are ordered by sequence/startTime
    for (let i = 0; i < d.trips.length - 1; i++) {
      const tripIdA = d.trips[i]!.tripId;
      const tripIdB = d.trips[i + 1]!.tripId;
      const tripA = input.trips.find((t) => t.id === tripIdA);
      const tripB = input.trips.find((t) => t.id === tripIdB);
      if (tripA && tripB) {
        const gap = tripB.startTime - tripA.endTime;
        if (gap > 0) {
          totalIdleTime += gap;
        }
      }
    }
  });
  const idleCost = totalIdleTime * cfg.IDLE_TIME_WEIGHT;

  // 6. Duty fragmentation penalty
  // A duty is considered fragmented if it contains only 1 trip (inefficient block)
  let fragmentationScore = 0;
  duties.forEach((d) => {
    if (d.trips.length === 1) {
      fragmentationScore += 1;
    }
  });
  const fragmentationCost = fragmentationScore * cfg.FRAGMENTATION_WEIGHT;

  // 7. Cross-Depot assignments penalty
  // Home depot alignment for bus & crew: if driver and bus depots do not match
  let crossDepotCount = 0;
  duties.forEach((d) => {
    const bus = input.buses.find((b) => b.id === d.busId);
    if (!bus) return;

    if (d.dutyType === "LINKED") {
      if (d.driverId) {
        const dr = input.drivers.find((driver) => driver.id === d.driverId);
        if (dr && dr.depot !== bus.depot) {
          crossDepotCount += 1;
        }
      }
      if (d.conductorId) {
        const cond = input.conductors.find((c) => c.id === d.conductorId);
        if (cond && cond.depot !== bus.depot) {
          crossDepotCount += 1;
        }
      }
    } else {
      // UNLINKED handovers: check segments
      d.crewSegments.forEach((seg) => {
        if (seg.driverId) {
          const dr = input.drivers.find((driver) => driver.id === seg.driverId);
          if (dr && dr.depot !== bus.depot) {
            crossDepotCount += 1;
          }
        }
        if (seg.conductorId) {
          const cond = input.conductors.find((c) => c.id === seg.conductorId);
          if (cond && cond.depot !== bus.depot) {
            crossDepotCount += 1;
          }
        }
      });
    }
  });
  const crossDepotCost = crossDepotCount * cfg.CROSS_DEPOT_PENALTY;

  // Return weighted objective score (lower is better for costs, but we normalize score as a positive penalty sum)
  return (
    unassignedPenalty +
    busCost +
    dutyCost +
    handoverCost +
    idleCost +
    fragmentationCost +
    crossDepotCost
  );
}

export function calculateQualityScore(result: {
  tripsCovered: number;
  tripsUnassigned: number;
  busesUsed: number;
  dutiesCreated: number;
  handovers: number;
}): number {
  // Compute normalized schedule quality score out of 100
  // Weighting metrics:
  // - Trip Coverage: 60% of score
  // - Bus Efficiency: 20% of score (fewer buses is better, target bus ratio is 2 trips/bus)
  // - Crew Handover penalty: 10% of score (less handovers is better)
  // - Fragmentation penalty: 10% of score (more trips per duty is better)
  const totalTrips = result.tripsCovered + result.tripsUnassigned;
  if (totalTrips === 0) return 100;

  const coverageRatio = result.tripsCovered / totalTrips;
  const coverageScore = coverageRatio * 60;

  // Bus efficiency: target at least 2 trips per bus
  let busScore = 20;
  if (result.busesUsed > 0) {
    const ratio = result.tripsCovered / result.busesUsed;
    if (ratio < 2) {
      busScore = (ratio / 2) * 20;
    }
  } else {
    busScore = 0;
  }

  // Handover penalty: lose 2.5 points per handover, capped at 10 points
  const handoverPenalty = Math.min(10, result.handovers * 2.5);
  const handoverScore = 10 - handoverPenalty;

  // Duty efficiency: average trips per duty (target 2.5+ trips/duty)
  let dutyScore = 10;
  if (result.dutiesCreated > 0) {
    const avg = result.tripsCovered / result.dutiesCreated;
    if (avg < 2.5) {
      dutyScore = (avg / 2.5) * 10;
    }
  } else {
    dutyScore = 0;
  }

  const rawScore = coverageScore + busScore + handoverScore + dutyScore;
  return Math.max(0, Math.min(100, Math.round(rawScore)));
}
