export type BusStatus = "available" | "in-service" | "breakdown" | "maintenance";
export type CrewRole = "driver" | "conductor";
export type CrewStatus = "available" | "on-duty" | "resting" | "unavailable";
export type DutyType = "linked" | "unlinked";
export type DutyStatus = "valid" | "conflict" | "affected" | "rescheduled";

export interface Bus {
  id: string;
  registrationNumber: string;
  depot: string;
  status: BusStatus;
  /** minutes from midnight */
  availableFrom: number;
}

export interface Crew {
  id: string;
  name: string;
  role: CrewRole;
  status: CrewStatus;
  availableFrom: number;
  restUntil: number;
}

export interface Stop {
  id: string;
  name: string;
}

export interface TransitRoute {
  id: string;
  code: string;
  name: string;
  lengthKm: number;
  stops: Stop[];
  durationMin: number;
  dailyTrips: number;
}

export interface Trip {
  id: string;
  routeId: string;
  startTime: number;
  endTime: number;
}

export interface Duty {
  id: string;
  busId: string;
  driverId: string;
  conductorId: string;
  routeId: string;
  tripId: string;
  startTime: number;
  endTime: number;
  dutyType: DutyType;
  status: DutyStatus;
  note?: string;
}

export interface Schedule {
  id: string;
  date: string;
  depot: string;
  dutyType: DutyType;
  duties: Duty[];
}

export interface Incident {
  id: string;
  kind: "bus-breakdown" | "crew-unavailable";
  resourceId: string;
  resourceLabel: string;
  time: number;
  location: string;
  affectedDutyIds: string[];
  affectedCrewCount: number;
}

export interface RescheduleAction {
  dutyId: string;
  field: "bus" | "driver" | "conductor";
  fromId: string;
  toId: string;
  fromLabel: string;
  toLabel: string;
  reasons: string[];
}

export interface RescheduleResult {
  schedule: Schedule;
  actions: RescheduleAction[];
  retainedPercent: number;
  affectedDuties: number;
  busChanges: number;
  crewChanges: number;
  restViolations: number;
  unservedTrips: number;
}

export interface ConstraintCheck {
  id: string;
  label: string;
  ok: boolean;
  detail?: string;
}
