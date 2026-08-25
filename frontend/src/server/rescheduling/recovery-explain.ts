import { ProposedDuty } from "../scheduling/types";
import { IncidentRecord } from "./types";

export function generateRecoveryExplanation(
  proposedDuties: ProposedDuty[],
  unassignedTrips: { tripId: string; tripCode: string; reason: string }[],
  originalAssignmentsMap: Map<string, { busId: string; driverId: string; conductorId: string }>,
  incident: IncidentRecord
): string {
  const lines: string[] = [];

  lines.push(`Disruption Recovery action plans generated for incident type ${incident.type} on ${incident.serviceDate}.`);

  // 1. Describe reassignments
  let reassignmentsCount = 0;
  proposedDuties.forEach((d) => {
    d.trips.forEach((t) => {
      const orig = originalAssignmentsMap.get(t.tripId);
      if (orig) {
        const busChanged = orig.busId !== d.busId;
        const driverChanged = orig.driverId !== d.driverId; // simplified

        if (busChanged || driverChanged) {
          reassignmentsCount += 1;
          const resourceMsg = busChanged ? `Bus changed to ${d.busId}` : `Crew reassigned`;
          lines.push(`- Trip ${t.tripCode} re-routed: ${resourceMsg} to recover timeline from incident start.`);
        }
      }
    });
  });

  if (reassignmentsCount === 0) {
    lines.push("- Unaffected schedules isolated and preserved cleanly.");
  }

  // 2. Describe cancellations / unassigned
  if (unassignedTrips.length > 0) {
    lines.push("\nCancellations / Unrecoverable runs details:");
    unassignedTrips.forEach((ut) => {
      lines.push(`- Trip ${ut.tripCode} cancelled: ${ut.reason}`);
    });
  } else {
    lines.push("\nAll affected trips fully recovered (100% service recovery achieved).");
  }

  return lines.join("\n");
}
