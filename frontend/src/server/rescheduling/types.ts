export type IncidentType =
  | "BUS_BREAKDOWN"
  | "BUS_UNAVAILABLE"
  | "DRIVER_ABSENT"
  | "CONDUCTOR_ABSENT"
  | "CREW_EMERGENCY"
  | "TRIP_DELAY"
  | "TRIP_CANCELLED"
  | "ROUTE_BLOCKED"
  | "MANUAL_DISRUPTION";

export type IncidentStatus =
  | "OPEN"
  | "ANALYZING"
  | "RECOVERY_PROPOSED"
  | "APPROVED"
  | "APPLIED"
  | "RESOLVED"
  | "CANCELLED";

export type ImpactType =
  | "BUS_LOST"
  | "CREW_LOST"
  | "DELAYED"
  | "CANCELLED"
  | "TURNAROUND_VIOLATION"
  | "CREW_REST_CONFLICT"
  | "UNASSIGNED";

export type ImpactLevel = "DIRECT" | "DOWNSTREAM" | "SECONDARY";

export interface IncidentRecord {
  id: string;
  tenantId: string;
  type: IncidentType;
  status: IncidentStatus;
  severity: "low" | "medium" | "high" | "critical";
  serviceDate: string;
  resourceType: "bus" | "crew" | null;
  resourceId: string | null;
  tripId: string | null;
  routeId: string | null;
  reportedAt: Date;
  reportedBy: string | null;
  startTime: number;
  expectedEndTime: number | null;
  actualEndTime: number | null;
  location: string | null;
  description: string | null;
  resolvedAt: Date | null;
}

export interface IncidentImpactRecord {
  id: string;
  incidentId: string;
  tripId: string | null;
  dutyId: string | null;
  busId: string | null;
  driverId: string | null;
  conductorId: string | null;
  impactType: ImpactType;
  impactLevel: ImpactLevel;
  reason: string | null;
}

export interface ReschedulingRunRecord {
  id: string;
  tenantId: string;
  incidentId: string;
  serviceDate: string;
  status: "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED" | "EXPIRED" | "APPROVED" | "APPLIED";
  startedAt: Date;
  completedAt: Date | null;
  createdBy: string | null;
  objectiveScore: string | null;
  tripsAffected: number;
  tripsRecovered: number;
  tripsUnassigned: number;
  resourceSnapshot: any;
}

export interface RecoveryProposalRecord {
  id: string;
  runId: string;
  proposalNumber: number;
  status: "PROPOSED" | "SELECTED" | "REJECTED" | "EXPIRED" | "APPLIED";
  objectiveScore: string;
  tripsRecovered: number;
  tripsUnassigned: number;
  busesUsed: number;
  crewChanges: number;
  handovers: number;
  delayMinutes: number;
  cancellations: number;
  explanation: string | null;
  proposalData: any; // stores the proposed duties structure
  createdAt: Date;
}
