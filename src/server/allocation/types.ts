export type TimePeriodId =
  | "MORNING_PEAK"
  | "MIDDAY_OFFPEAK"
  | "EVENING_PEAK"
  | "NIGHT_LULL"
  | "LIVE_SURGE";

export type ShortageSeverity =
  | "CRITICAL"
  | "HIGH"
  | "MODERATE"
  | "OPTIMAL"
  | "SURPLUS";

export type AllocationStrategy = "BALANCED_SLA" | "COST_OPTIMAL" | "EQUITY";

export interface TimePeriodDef {
  id: TimePeriodId;
  label: string;
  startHour: number;
  endHour: number;
  description: string;
}

export interface RouteDemandProfile {
  routeId: string;
  code: string;
  name: string;
  origin: string;
  destination: string;
  lengthKm: number;
  durationMin: number;
  timePeriod: string;
  baselineDemandPaxPerHour: number;
  sensedDemandPaxPerHour: number;
  surgePercentage: number; // e.g. 35.5 (%)
  scheduledHeadwayMin: number;
  scheduledTripsPerHour: number;
  busCapacity: number; // avg pax capacity
  scheduledCapacityPaxPerHour: number;
  loadFactor: number; // sensedDemand / scheduledCapacity (e.g. 1.25 = 125%)
  passengerWaitTimeMin: number; // headway / 2 * max(1, loadFactor)
  shortageSeverity: ShortageSeverity;
  capacityDeficitPaxPerHour: number; // max(0, sensed - capacity)
  additionalBusesNeeded: number;
  activeBusesCount: number;
  eligibleAsDonor: boolean;
  minRequiredBuses: number;
}

export interface SupplyCandidate {
  busId: string;
  fleetNumber: string;
  registrationNumber: string;
  busType: string;
  capacity: number;
  sourceType: "DEPOT_RESERVE" | "DONOR_ROUTE";
  depot: string;
  donorRouteId?: string;
  donorRouteCode?: string;
  driverId?: string;
  driverName?: string;
  driverEmployeeId?: string;
  conductorId?: string;
  conductorName?: string;
  conductorEmployeeId?: string;
  remainingShiftHours: number;
  availableFromMinutes: number;
}

export interface AllocationRecommendation {
  id: string;
  targetRouteId: string;
  targetRouteCode: string;
  targetRouteName: string;
  supply: SupplyCandidate;
  deadheadKm: number;
  deadheadMinutes: number;
  estimatedCost: number; // in currency units (e.g. fuel + driver overtime)
  headwayBeforeMin: number;
  headwayAfterMin: number;
  waitTimeBeforeMin: number;
  waitTimeAfterMin: number;
  waitTimeReductionMin: number;
  loadFactorBefore: number;
  loadFactorAfter: number;
  passengersRelievedPerHour: number;
  benefitScore: number;
  strategy: AllocationStrategy;
  status: "RECOMMENDED" | "DISPATCHED" | "REJECTED" | "PENDING";
  reason: string;
}

export interface AllocationPlan {
  id: string;
  timestamp: string;
  serviceDate: string;
  timePeriod: string;
  strategy: AllocationStrategy;
  totalSurgeDemandPaxPerHour: number;
  deficitRoutesCount: number;
  busesAllocated: number;
  totalDeadheadKm: number;
  totalOperatingCost: number;
  avgWaitTimeReductionMin: number;
  networkLoadFactorBefore: number;
  networkLoadFactorAfter: number;
  recommendations: AllocationRecommendation[];
  routeProfiles: RouteDemandProfile[];
  availableFleetPool?: SupplyCandidate[];
}

export interface SurgeScenarioInput {
  routeId: string;
  surgePercent: number; // e.g. 40 (%)
  cause: string;
}

export interface AllocationDispatchResult {
  success: boolean;
  allocationId: string;
  dutyCode?: string;
  departureTime12?: string;
  expectedArrivalTime12?: string;
  busId?: string;
  busRegistration?: string;
  busType?: string;
  driverName?: string;
  driverEmployeeId?: string;
  conductorName?: string;
  conductorEmployeeId?: string;
  sourceDepot?: string;
  targetRouteCode?: string;
  targetRouteName?: string;
  deadheadMinutes?: number;
  deadheadKm?: number;
  estimatedCost?: number;
  headwayBeforeMin?: number;
  headwayAfterMin?: number;
  waitTimeBeforeMin?: number;
  waitTimeAfterMin?: number;
  waitTimeReductionMin?: number;
  loadFactorBefore?: number;
  loadFactorAfter?: number;
  message?: string;
}
