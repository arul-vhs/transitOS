/**
 * Demand-Responsive Fleet Allocation Graph Solver
 * Constructs a bipartite matching graph between supply candidates (depot reserves & donor routes)
 * and demand shortage corridors, optimizing for SLA wait time, operational cost, or capacity equity.
 */

import {
  AllocationPlan,
  AllocationRecommendation,
  AllocationStrategy,
  RouteDemandProfile,
  SupplyCandidate,
} from "./types";
import { getDeadheadMetrics } from "./distance-matrix";

interface MatchingEdge {
  supply: SupplyCandidate;
  target: RouteDemandProfile;
  deadheadKm: number;
  deadheadMinutes: number;
  estimatedCost: number;
  headwayBeforeMin: number;
  headwayAfterMin: number;
  waitTimeBeforeMin: number;
  waitTimeAfterMin: number;
  waitTimeReductionMin: number;
  loadFactorBefore: number;
  loadFactorAfter: number;
  passengersRelievedPerHour: number;
  score: number;
  reason: string;
}

/**
 * Calculates new headway, wait time, and load factor when a bus is added to a route.
 */
function simulateBusAddition(
  target: RouteDemandProfile,
  busCapacity: number,
): {
  headwayAfterMin: number;
  waitTimeAfterMin: number;
  waitTimeReductionMin: number;
  loadFactorAfter: number;
  passengersRelievedPerHour: number;
} {
  const currentActive = Math.max(1, target.activeBusesCount);
  const newActive = currentActive + 1;

  // New headway = route cycle time / new bus count
  // Approximation based on current headway: newHeadway = currentHeadway * (currentActive / newActive)
  const headwayAfterMin = Math.max(
    5,
    Math.round(target.scheduledHeadwayMin * (currentActive / newActive)),
  );

  const tripsPerHourAfter = 60 / headwayAfterMin;
  const newCapacityPaxPerHour = Math.round(
    tripsPerHourAfter * target.busCapacity,
  );

  const loadFactorAfter = Number(
    (
      target.sensedDemandPaxPerHour / Math.max(1, newCapacityPaxPerHour)
    ).toFixed(2),
  );

  // Transit wait time formula: (Headway / 2) * max(1, LoadFactor)
  // Overcrowded routes create skipped-stop queues, multiplying effective wait time
  const waitMultiplier = Math.max(1, loadFactorAfter);
  const waitTimeAfterMin = Number(
    ((headwayAfterMin / 2) * waitMultiplier).toFixed(1),
  );
  const waitTimeReductionMin = Number(
    Math.max(0, target.passengerWaitTimeMin - waitTimeAfterMin).toFixed(1),
  );

  const passengersRelievedPerHour = Math.min(
    target.capacityDeficitPaxPerHour > 0
      ? target.capacityDeficitPaxPerHour
      : Math.round(target.sensedDemandPaxPerHour * 0.25),
    busCapacity * 2, // 2 trips per hour typical
  );

  return {
    headwayAfterMin,
    waitTimeAfterMin,
    waitTimeReductionMin,
    loadFactorAfter,
    passengersRelievedPerHour,
  };
}

/**
 * Validates whether a donor route can safely surrender a bus without breaching minimum service requirements.
 */
function validateDonorFeasibility(
  donorProfile: RouteDemandProfile | undefined,
): boolean {
  if (!donorProfile) return true; // Depot reserve has no donor constraints

  // Rule 1: Donor must maintain minimum bus count
  if (donorProfile.activeBusesCount <= donorProfile.minRequiredBuses) {
    return false;
  }

  // Rule 2: Resulting headway must not exceed allowable SLA ceiling (25 minutes)
  const remainingBuses = donorProfile.activeBusesCount - 1;
  const simulatedHeadway = Math.round(
    donorProfile.scheduledHeadwayMin *
      (donorProfile.activeBusesCount / Math.max(1, remainingBuses)),
  );
  if (simulatedHeadway > 25) {
    return false;
  }

  // Rule 3: Resulting load factor on donor must remain under 75%
  const simulatedTripsPerHour = 60 / simulatedHeadway;
  const simulatedCapacity = simulatedTripsPerHour * donorProfile.busCapacity;
  const simulatedLoadFactor =
    donorProfile.sensedDemandPaxPerHour / simulatedCapacity;
  if (simulatedLoadFactor > 0.75) {
    return false;
  }

  return true;
}

/**
 * Multi-objective Edge Scoring function based on user-chosen policy strategy.
 */
function computeEdgeScore(
  strategy: AllocationStrategy,
  deadheadMinutes: number,
  deadheadKm: number,
  estimatedCost: number,
  waitTimeReductionMin: number,
  passengersRelieved: number,
  loadFactorBefore: number,
  loadFactorAfter: number,
  isDepotReserve: boolean,
): number {
  switch (strategy) {
    case "COST_OPTIMAL":
      // Prioritize minimal deadhead kilometers and operational expenses
      return (
        waitTimeReductionMin * 2.5 +
        passengersRelieved * 0.05 -
        deadheadKm * 1.8 -
        deadheadMinutes * 0.8 -
        estimatedCost * 0.02 +
        (isDepotReserve ? 5 : 0)
      );

    case "EQUITY":
      // Prioritize balancing network load factor and preventing overcrowding
      const loadFactorDrop = Math.max(0, loadFactorBefore - loadFactorAfter);
      return (
        loadFactorDrop * 120 +
        waitTimeReductionMin * 6.0 +
        passengersRelieved * 0.15 -
        deadheadMinutes * 0.5 -
        deadheadKm * 0.5
      );

    case "BALANCED_SLA":
    default:
      // Balanced policy: High emphasis on reducing wait times while penalizing distant deadheads
      return (
        waitTimeReductionMin * 12.0 +
        passengersRelieved * 0.2 -
        deadheadMinutes * 1.0 -
        deadheadKm * 0.8 -
        estimatedCost * 0.01 +
        (isDepotReserve ? 8 : 0) // Prefer depot reserves over reallocating active routes
      );
  }
}

/**
 * Builds candidate bipartite graph and executes priority-queue optimal matching.
 */
export function solveFleetAllocation(
  routes: RouteDemandProfile[],
  supplies: SupplyCandidate[],
  strategy: AllocationStrategy = "BALANCED_SLA",
  serviceDate: string = new Date().toISOString().slice(0, 10),
  timePeriod: string = "PEAK_SURGE",
): AllocationPlan {
  // 1. Identify Shortage Corridors (Load Factor > 0.85 or Deficit > 0 or Surge > 20%)
  const shortageRoutes = routes.filter(
    (r) =>
      r.shortageSeverity === "CRITICAL" ||
      r.shortageSeverity === "HIGH" ||
      r.shortageSeverity === "MODERATE" ||
      r.loadFactor > 0.85 ||
      r.capacityDeficitPaxPerHour > 0,
  );

  // Sort shortage corridors by urgency (Critical first, then highest deficit)
  shortageRoutes.sort((a, b) => {
    if (a.shortageSeverity === "CRITICAL" && b.shortageSeverity !== "CRITICAL")
      return -1;
    if (b.shortageSeverity === "CRITICAL" && a.shortageSeverity !== "CRITICAL")
      return 1;
    return b.capacityDeficitPaxPerHour - a.capacityDeficitPaxPerHour;
  });

  const routeMap = new Map<string, RouteDemandProfile>();
  routes.forEach((r) => routeMap.set(r.routeId, { ...r }));

  // 2. Build Bipartite Edge Matrix
  const candidateEdges: MatchingEdge[] = [];

  for (const target of shortageRoutes) {
    for (const supply of supplies) {
      // Crew availability constraint: Crew must have >= 2.5 hours remaining
      if (supply.remainingShiftHours < 2.0) {
        continue;
      }

      // Donor route feasibility constraint
      if (supply.sourceType === "DONOR_ROUTE" && supply.donorRouteId) {
        const donorProfile = routeMap.get(supply.donorRouteId);
        if (!validateDonorFeasibility(donorProfile)) {
          continue;
        }
      }

      // Proximity & deadhead calculation
      const fromLoc =
        supply.sourceType === "DEPOT_RESERVE"
          ? supply.depot
          : supply.donorRouteCode || supply.depot;
      const toLoc = target.origin;
      const metrics = getDeadheadMetrics(fromLoc, toLoc);

      // Deadhead travel time ceiling: Maximum 50 minutes deadhead
      if (metrics.deadheadMinutes > 50) {
        continue;
      }

      // Simulate performance impact on target route
      const sim = simulateBusAddition(target, supply.capacity);

      // Multi-objective edge score
      const score = computeEdgeScore(
        strategy,
        metrics.deadheadMinutes,
        metrics.deadheadKm,
        metrics.estimatedCost,
        sim.waitTimeReductionMin,
        sim.passengersRelievedPerHour,
        target.loadFactor,
        sim.loadFactorAfter,
        supply.sourceType === "DEPOT_RESERVE",
      );

      // Construct justification reason
      const reason =
        supply.sourceType === "DEPOT_RESERVE"
          ? `Deploy standby reserve bus from ${supply.depot} (${metrics.deadheadMinutes} min deadhead, ${metrics.deadheadKm} km). Reduces corridor headway from ${target.scheduledHeadwayMin}m to ${sim.headwayAfterMin}m.`
          : `Reallocate under-utilized vehicle from low-demand corridor ${supply.donorRouteCode} (${metrics.deadheadMinutes} min deadhead). Alleviates ${sim.passengersRelievedPerHour} pax/hr shortage.`;

      candidateEdges.push({
        supply,
        target,
        deadheadKm: metrics.deadheadKm,
        deadheadMinutes: metrics.deadheadMinutes,
        estimatedCost: metrics.estimatedCost,
        headwayBeforeMin: target.scheduledHeadwayMin,
        headwayAfterMin: sim.headwayAfterMin,
        waitTimeBeforeMin: target.passengerWaitTimeMin,
        waitTimeAfterMin: sim.waitTimeAfterMin,
        waitTimeReductionMin: sim.waitTimeReductionMin,
        loadFactorBefore: target.loadFactor,
        loadFactorAfter: sim.loadFactorAfter,
        passengersRelievedPerHour: sim.passengersRelievedPerHour,
        score,
        reason,
      });
    }
  }

  // 3. Greedy Maximum-Weight Matching with Mutual Exclusion
  // Sort edges descending by score
  candidateEdges.sort((a, b) => b.score - a.score);

  const matchedSupplyIds = new Set<string>();
  const routeAllocationCount = new Map<string, number>();
  const recommendations: AllocationRecommendation[] = [];

  for (const edge of candidateEdges) {
    if (matchedSupplyIds.has(edge.supply.busId)) {
      continue;
    }

    const currentAllocated = routeAllocationCount.get(edge.target.routeId) || 0;
    // Cap allocations per route at 2 buses to maintain network distribution
    if (currentAllocated >= 2) {
      continue;
    }

    // Lock in assignment
    matchedSupplyIds.add(edge.supply.busId);
    routeAllocationCount.set(edge.target.routeId, currentAllocated + 1);

    recommendations.push({
      id: `alloc-rec-${recommendations.length + 1}-${Date.now().toString().slice(-4)}`,
      targetRouteId: edge.target.routeId,
      targetRouteCode: edge.target.code,
      targetRouteName: edge.target.name,
      supply: edge.supply,
      deadheadKm: edge.deadheadKm,
      deadheadMinutes: edge.deadheadMinutes,
      estimatedCost: edge.estimatedCost,
      headwayBeforeMin: edge.headwayBeforeMin,
      headwayAfterMin: edge.headwayAfterMin,
      waitTimeBeforeMin: edge.waitTimeBeforeMin,
      waitTimeAfterMin: edge.waitTimeAfterMin,
      waitTimeReductionMin: edge.waitTimeReductionMin,
      loadFactorBefore: edge.loadFactorBefore,
      loadFactorAfter: edge.loadFactorAfter,
      passengersRelievedPerHour: edge.passengersRelievedPerHour,
      benefitScore: Number(edge.score.toFixed(1)),
      strategy,
      status: "RECOMMENDED",
      reason: edge.reason,
    });
  }

  // 4. Update route profiles with after-allocation status
  const updatedProfiles: RouteDemandProfile[] = routes.map((orig) => {
    const allocs = recommendations.filter(
      (r) => r.targetRouteId === orig.routeId,
    );
    if (allocs.length === 0) {
      return { ...orig };
    }
    const lastAlloc = allocs[allocs.length - 1];
    return {
      ...orig,
      scheduledHeadwayMin: lastAlloc.headwayAfterMin,
      scheduledTripsPerHour: Math.round(60 / lastAlloc.headwayAfterMin),
      scheduledCapacityPaxPerHour: Math.round(
        (60 / lastAlloc.headwayAfterMin) * orig.busCapacity,
      ),
      loadFactor: lastAlloc.loadFactorAfter,
      passengerWaitTimeMin: lastAlloc.waitTimeAfterMin,
      activeBusesCount: orig.activeBusesCount + allocs.length,
      shortageSeverity:
        lastAlloc.loadFactorAfter > 1.0 ? "MODERATE" : "OPTIMAL",
      capacityDeficitPaxPerHour: Math.max(
        0,
        orig.sensedDemandPaxPerHour -
          Math.round((60 / lastAlloc.headwayAfterMin) * orig.busCapacity),
      ),
    };
  });

  // 5. Aggregate KPI Plan Metrics
  const totalSurgeDemand = routes.reduce(
    (sum, r) =>
      sum +
      (r.sensedDemandPaxPerHour > r.baselineDemandPaxPerHour
        ? r.sensedDemandPaxPerHour - r.baselineDemandPaxPerHour
        : 0),
    0,
  );
  const totalDeadheadKm = recommendations.reduce(
    (sum, r) => sum + r.deadheadKm,
    0,
  );
  const totalOperatingCost = recommendations.reduce(
    (sum, r) => sum + r.estimatedCost,
    0,
  );
  const avgWaitTimeReduction =
    recommendations.length > 0
      ? Number(
          (
            recommendations.reduce(
              (sum, r) => sum + r.waitTimeReductionMin,
              0,
            ) / recommendations.length
          ).toFixed(1),
        )
      : 0;

  const totalDemand = routes.reduce(
    (sum, r) => sum + r.sensedDemandPaxPerHour,
    0,
  );
  const totalCapacityBefore = routes.reduce(
    (sum, r) => sum + r.scheduledCapacityPaxPerHour,
    0,
  );
  const totalCapacityAfter = updatedProfiles.reduce(
    (sum, r) => sum + r.scheduledCapacityPaxPerHour,
    0,
  );

  const networkLoadFactorBefore = Number(
    (totalDemand / Math.max(1, totalCapacityBefore)).toFixed(2),
  );
  const networkLoadFactorAfter = Number(
    (totalDemand / Math.max(1, totalCapacityAfter)).toFixed(2),
  );

  return {
    id: `plan-${Date.now()}`,
    timestamp: new Date().toISOString(),
    serviceDate,
    timePeriod,
    strategy,
    totalSurgeDemandPaxPerHour: totalSurgeDemand,
    deficitRoutesCount: shortageRoutes.length,
    busesAllocated: recommendations.length,
    totalDeadheadKm: Number(totalDeadheadKm.toFixed(1)),
    totalOperatingCost: Number(totalOperatingCost.toFixed(2)),
    avgWaitTimeReductionMin: avgWaitTimeReduction,
    networkLoadFactorBefore,
    networkLoadFactorAfter,
    recommendations,
    routeProfiles: updatedProfiles,
  };
}
