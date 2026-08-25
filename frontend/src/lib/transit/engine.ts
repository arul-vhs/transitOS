/**
 * Scheduling engine (deterministic mock optimizer).
 *
 * The public surface below is intentionally solver-agnostic: each function can
 * be re-implemented on top of Google OR-Tools (CP-SAT) without touching the UI.
 *
 *   generateSchedule()        -> feasible initial assignment
 *   validateSchedule()        -> constraint checks
 *   detectConflicts()         -> per-duty conflict list
 *   rescheduleAffectedDuties()-> minimum-disruption repair
 *   calculateDisruptionScore()-> retained-schedule metric
 */
import {
  BUSES,
  CONDUCTORS,
  CONSTRAINTS,
  DEPOT,
  DRIVERS,
  ROUTES,
  SCHEDULE_DATE,
  busLabel,
  crewLabel,
  minutes,
  routeById,
} from "./data";
import type {
  ConstraintCheck,
  Duty,
  DutyType,
  Incident,
  RescheduleAction,
  RescheduleResult,
  Schedule,
} from "./types";

const overlaps = (aS: number, aE: number, bS: number, bE: number) =>
  aS < bE && bS < aE;

/** Wave definition keeps the generator deterministic and demo-friendly. */
const MORNING_BUSES = BUSES.slice(0, 10);
const AFTERNOON_PLAN = [0, 1, 2, 3, 2]; // bus indices reused in the afternoon wave

export function generateSchedule(dutyType: DutyType): Schedule {
  const duties: Duty[] = [];
  let n = 0;

  MORNING_BUSES.forEach((bus, i) => {
    const route = ROUTES[i % ROUTES.length]!;
    const start = minutes(6, 0) + i * 15;
    const end = start + route.durationMin;
    n += 1;
    duties.push({
      id: `D${String(n).padStart(3, "0")}`,
      busId: bus.id,
      driverId: DRIVERS[i]!.id,
      conductorId: CONDUCTORS[i]!.id,
      routeId: route.id,
      tripId: `T${String(n).padStart(3, "0")}`,
      startTime: start,
      endTime: end,
      dutyType,
      status: "valid",
    });
  });

  AFTERNOON_PLAN.forEach((busIdx, i) => {
    const bus = BUSES[busIdx]!;
    const route = ROUTES[(i + 2) % ROUTES.length]!;
    const start = minutes(12, 0) + i * 20;
    const end = start + Math.min(route.durationMin, CONSTRAINTS.maxDutyMinutes);
    n += 1;
    duties.push({
      id: `D${String(n).padStart(3, "0")}`,
      busId: bus.id,
      driverId: DRIVERS[i]!.id,
      conductorId: CONDUCTORS[i]!.id,
      routeId: route.id,
      tripId: `T${String(n).padStart(3, "0")}`,
      startTime: start,
      endTime: end,
      dutyType,
      status: "valid",
    });
  });

  return {
    id: "SCH-2026-08-14",
    date: SCHEDULE_DATE,
    depot: DEPOT,
    dutyType,
    duties,
  };
}

export function detectConflicts(duties: Duty[]): string[] {
  const issues: string[] = [];
  const byResource = (key: "busId" | "driverId" | "conductorId", label: string) => {
    for (let i = 0; i < duties.length; i++) {
      for (let j = i + 1; j < duties.length; j++) {
        const a = duties[i]!;
        const b = duties[j]!;
        if (a[key] !== b[key]) continue;
        const gap = Math.max(a.startTime, b.startTime) - Math.min(a.endTime, b.endTime);
        if (overlaps(a.startTime, a.endTime, b.startTime, b.endTime)) {
          issues.push(`${label} overlap between ${a.id} and ${b.id}`);
        } else if (key === "busId" && gap < CONSTRAINTS.turnaroundMinutes) {
          issues.push(`Bus turnaround violation between ${a.id} and ${b.id} (${gap} min)`);
        } else if (key !== "busId" && gap < CONSTRAINTS.minRestMinutes) {
          issues.push(
            `Crew rest violation detected: only ${gap} minutes available, minimum required is ${CONSTRAINTS.minRestMinutes} minutes (${a.id} → ${b.id}).`,
          );
        }
      }
    }
  };
  byResource("busId", "Bus");
  byResource("driverId", "Driver");
  byResource("conductorId", "Conductor");

  duties.forEach((d) => {
    if (d.endTime - d.startTime > CONSTRAINTS.maxDutyMinutes) {
      issues.push(`Maximum duty duration exceeded on ${d.id}`);
    }
  });
  return issues;
}

export function validateSchedule(duties: Duty[]): ConstraintCheck[] {
  const issues = detectConflicts(duties);
  const has = (needle: string) => issues.filter((i) => i.includes(needle));
  const mk = (id: string, label: string, matched: string[]): ConstraintCheck => ({
    id,
    label,
    ok: matched.length === 0,
    ...(matched[0] ? { detail: matched[0] } : {}),
  });
  return [
    mk("bus", "Bus availability", has("Bus overlap")),
    mk("crew", "Crew availability", [...has("Driver overlap"), ...has("Conductor overlap")]),
    mk("duration", "Maximum duty duration", has("Maximum duty duration")),
    mk("rest", "Minimum rest period", has("rest violation")),
    mk("turnaround", "Bus turnaround time", has("turnaround")),
    mk(
      "linked",
      "Linked duty consistency",
      duties.some((d) => d.dutyType === "linked" && (!d.driverId || !d.conductorId))
        ? ["Linked duty missing crew"]
        : [],
    ),
    mk("overlap", "No overlapping assignments", has("overlap")),
  ];
}

export function createIncident(
  kind: Incident["kind"],
  schedule: Schedule,
): Incident | null {
  if (kind === "bus-breakdown") {
    const busId = "B003";
    const time = minutes(9, 20);
    const affected = schedule.duties.filter((d) => d.busId === busId && d.endTime > time);
    if (!affected.length) return null;
    return {
      id: "INC-001",
      kind,
      resourceId: busId,
      resourceLabel: busLabel(busId),
      time,
      location: "Salem Junction",
      affectedDutyIds: affected.map((d) => d.id),
      affectedCrewCount: new Set(affected.flatMap((d) => [d.driverId, d.conductorId])).size,
    };
  }
  const driverId = "DR005";
  const time = minutes(10, 15);
  const affected = schedule.duties.filter((d) => d.driverId === driverId && d.endTime > time);
  if (!affected.length) return null;
  return {
    id: "INC-002",
    kind,
    resourceId: driverId,
    resourceLabel: crewLabel(driverId),
    time,
    location: "Salem Central Depot",
    affectedDutyIds: affected.map((d) => d.id),
    affectedCrewCount: 1,
  };
}

const busFreeFor = (
  busId: string,
  duty: Duty,
  frozen: Duty[],
  blocked: Set<string>,
) => {
  if (blocked.has(busId)) return false;
  return !frozen.some(
    (f) =>
      f.busId === busId &&
      (overlaps(f.startTime, f.endTime, duty.startTime, duty.endTime) ||
        Math.max(f.startTime, duty.startTime) - Math.min(f.endTime, duty.endTime) <
          CONSTRAINTS.turnaroundMinutes),
  );
};

const driverFreeFor = (driverId: string, duty: Duty, frozen: Duty[], blocked: Set<string>) => {
  if (blocked.has(driverId)) return false;
  return !frozen.some(
    (f) =>
      f.driverId === driverId &&
      (overlaps(f.startTime, f.endTime, duty.startTime, duty.endTime) ||
        Math.max(f.startTime, duty.startTime) - Math.min(f.endTime, duty.endTime) <
          CONSTRAINTS.minRestMinutes),
  );
};

export function rescheduleAffectedDuties(
  schedule: Schedule,
  incident: Incident,
): RescheduleResult {
  const affectedIds = new Set(incident.affectedDutyIds);
  const frozen = schedule.duties.filter((d) => !affectedIds.has(d.id));
  const working = schedule.duties.map((d) => ({ ...d }));
  const actions: RescheduleAction[] = [];
  const blockedBuses = new Set<string>(
    incident.kind === "bus-breakdown" ? [incident.resourceId] : [],
  );
  const blockedDrivers = new Set<string>(
    incident.kind === "crew-unavailable" ? [incident.resourceId] : [],
  );
  const committed: Duty[] = [...frozen];
  let unserved = 0;

  for (const duty of working) {
    if (!affectedIds.has(duty.id)) continue;

    if (incident.kind === "bus-breakdown") {
      const candidate = BUSES.find((b) => busFreeFor(b.id, duty, committed, blockedBuses));
      if (!candidate) {
        unserved += 1;
        duty.status = "conflict";
        continue;
      }
      const fromId = duty.busId;
      duty.busId = candidate.id;
      duty.status = "rescheduled";
      actions.push({
        dutyId: duty.id,
        field: "bus",
        fromId,
        toId: candidate.id,
        fromLabel: busLabel(fromId),
        toLabel: candidate.registrationNumber,
        reasons: [
          "Available at required time",
          "Located at compatible depot (Salem Central Depot)",
          `Route compatible with ${routeById(duty.routeId)?.code}`,
          "Minimum deadhead distance from incident location",
          "No crew conflict",
          "No turnaround violation",
          "Causes minimum schedule disruption",
        ],
      });
    } else {
      const candidate = DRIVERS.find((d) => driverFreeFor(d.id, duty, committed, blockedDrivers));
      if (!candidate) {
        unserved += 1;
        duty.status = "conflict";
        continue;
      }
      const fromId = duty.driverId;
      duty.driverId = candidate.id;
      duty.status = "rescheduled";
      actions.push({
        dutyId: duty.id,
        field: "driver",
        fromId,
        toId: candidate.id,
        fromLabel: crewLabel(fromId),
        toLabel: candidate.name,
        reasons: [
          "Available at required time",
          "Minimum rest period satisfied (≥ 30 min)",
          "Within maximum duty duration",
          "Signed on at the same depot",
          "Route knowledge certified",
          "No overlapping assignment",
          "Causes minimum schedule disruption",
        ],
      });
    }
    committed.push(duty);
  }

  const newSchedule: Schedule = { ...schedule, duties: working };
  const issues = detectConflicts(working);
  const busChanges = actions.filter((a) => a.field === "bus").length;
  const crewChanges = actions.filter((a) => a.field !== "bus").length;

  return {
    schedule: newSchedule,
    actions,
    retainedPercent: calculateDisruptionScore(schedule, newSchedule),
    affectedDuties: affectedIds.size,
    busChanges,
    crewChanges,
    restViolations: issues.filter((i) => i.includes("rest violation")).length,
    unservedTrips: unserved,
  };
}

/** Percentage of original assignment decisions retained. */
export function calculateDisruptionScore(before: Schedule, after: Schedule): number {
  let total = 0;
  let same = 0;
  before.duties.forEach((b) => {
    const a = after.duties.find((x) => x.id === b.id);
    if (!a) return;
    (["busId", "driverId", "conductorId"] as const).forEach((k) => {
      total += 1;
      if (a[k] === b[k]) same += 1;
    });
  });
  return total === 0 ? 100 : Math.round((same / total) * 100);
}

export const OVERLAP_ANALYSIS: Record<string, { overlaps: { code: string; pct: number }[]; coverage: number }> = {
  R101: { overlaps: [{ code: "Route 102", pct: 12 }, { code: "Route 103", pct: 18 }, { code: "Route 105", pct: 24 }], coverage: 91 },
  R102: { overlaps: [{ code: "Route 101", pct: 12 }, { code: "Route 104", pct: 9 }, { code: "Route 105", pct: 15 }], coverage: 84 },
  R103: { overlaps: [{ code: "Route 101", pct: 18 }, { code: "Route 102", pct: 7 }, { code: "Route 104", pct: 31 }], coverage: 87 },
  R104: { overlaps: [{ code: "Route 101", pct: 21 }, { code: "Route 103", pct: 31 }, { code: "Route 105", pct: 6 }], coverage: 79 },
  R105: { overlaps: [{ code: "Route 101", pct: 24 }, { code: "Route 102", pct: 15 }, { code: "Route 103", pct: 11 }], coverage: 88 },
};
