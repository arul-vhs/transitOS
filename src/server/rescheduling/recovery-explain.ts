import { ProposedDuty } from "../scheduling/types";
import { IncidentRecord } from "./types";

export function generateRecoveryExplanation(
  proposedDuties: ProposedDuty[],
  unassignedTrips: { tripId: string; tripCode: string; reason: string }[],
  originalAssignmentsMap: Map<string, { busId: string; driverId: string; conductorId: string }>,
  incident: IncidentRecord,
): string {
  const parts: string[] = [];

  let totalReassignedTrips = 0;
  let busChangeCount = 0;
  let crewChangeCount = 0;

  proposedDuties.forEach((d) => {
    d.trips.forEach((t) => {
      const orig = originalAssignmentsMap.get(t.tripId);
      if (orig) {
        const busChanged = orig.busId !== d.busId;
        const driverChanged = orig.driverId !== d.driverId;
        if (busChanged || driverChanged) {
          totalReassignedTrips++;
          if (busChanged) busChangeCount++;
          if (driverChanged) crewChangeCount++;
        }
      }
    });
  });

  if (totalReassignedTrips > 0) {
    const summaryList: string[] = [];
    if (busChangeCount > 0) {
      summaryList.push(`reassigned ${busChangeCount} trip(s) to available reserve vehicles`);
    }
    if (crewChangeCount > 0) {
      summaryList.push(`adjusted crew pairings for ${crewChangeCount} trip(s)`);
    }
    parts.push(`Modified schedule: ${summaryList.join(" and ")}.`);
  } else {
    parts.push("Maintains existing vehicle and crew assignments for operational stability.");
  }

  if (unassignedTrips.length > 0) {
    const cancelledCodes = unassignedTrips
      .map((u) => u.tripCode)
      .slice(0, 3)
      .join(", ");
    const moreText = unassignedTrips.length > 3 ? ` +${unassignedTrips.length - 3} more` : "";
    parts.push(`${unassignedTrips.length} trip(s) cancelled (${cancelledCodes}${moreText}).`);
  } else {
    parts.push("100% service recovery achieved with 0 cancellations.");
  }

  return parts.join(" ");
}
