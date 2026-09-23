export interface Trip {
  id: string;
  tripCode: string;
  routeId: string;
  direction: string;
  startTime: number;
  endTime: number;
  durationMin: number;
  distanceKm: string;
  origin: string;
  destination: string;
  status: string;
  serviceDate: string;
}

export interface Bus {
  id: string;
  registrationNumber: string;
  fleetNumber: string | null;
  depot: string;
  status: string;
  busType: string | null;
  capacity: number | null;
  availableFrom: number;
}

export interface Crew {
  id: string;
  employeeId: string;
  name: string;
  role: string; // "driver", "conductor"
  status: string;
  depot: string;
  availableFrom: number;
  restUntil: number;
  licenseCategory: string | null;
  licenseExpiry: Date | null;
}

export interface Route {
  id: string;
  code: string;
  name: string;
  lengthKm: string;
  durationMin: number;
  origin: string | null;
  destination: string | null;
}

export interface OptimizerInput {
  serviceDate: string;
  trips: Trip[];
  buses: Bus[];
  drivers: Crew[];
  conductors: Crew[];
  routes: Route[];
  mode: "LINKED" | "UNLINKED" | "HYBRID";
  configuration: {
    MIN_TURNAROUND_MINUTES: number;
    MAX_DUTY_HOURS: number;
    MIN_REST_MINUTES: number;
    MAX_DAILY_WORK_HOURS: number;
    UNASSIGNED_TRIP_PENALTY: number;
    BUS_USAGE_WEIGHT: number;
    DUTY_COUNT_WEIGHT: number;
    HANDOVER_WEIGHT: number;
    IDLE_TIME_WEIGHT: number;
    FRAGMENTATION_WEIGHT: number;
    CROSS_DEPOT_PENALTY: number;
  };
}

export interface SolverAssignment {
  tripId: string;
  busId: string;
  driverId: string;
  conductorId: string;
  handoverRequired: boolean;
}

export interface ProposedDuty {
  dutyCode: string;
  dutyType: "LINKED" | "UNLINKED";
  busId: string;
  driverId: string | null;
  conductorId: string | null;
  startTime: number;
  endTime: number;
  trips: {
    tripId: string;
    tripCode: string;
    sequence: number;
    handoverRequired: boolean;
    startTime?: number;
    endTime?: number;
    routeCode?: string;
    origin?: string;
    destination?: string;
  }[];
  crewSegments: {
    driverId: string;
    conductorId: string;
    startTime: number;
    endTime: number;
    sequence: number;
  }[];
}

export interface OptimizerResult {
  status: "FEASIBLE" | "PARTIAL" | "INFEASIBLE";
  tripsCovered: number;
  tripsUnassigned: number;
  busesUsed: number;
  driversUsed: number;
  conductorsUsed: number;
  dutiesCreated: number;
  linkedDuties: number;
  unlinkedDuties: number;
  handovers: number;
  objectiveScore: number;
  assignments: SolverAssignment[];
  duties: ProposedDuty[];
  unassignedTrips: {
    tripId: string;
    tripCode: string;
    reason: string;
  }[];
  violations: string[];
  explanations: string[];
}
