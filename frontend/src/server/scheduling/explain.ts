import { CandidateSet } from "./candidate-generation";
import { Trip, OptimizerInput } from "./types";

function formatMinutesToTime(totalMin: number): string {
  const hh = Math.floor(totalMin / 60);
  const mm = totalMin % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export function generateExplanations(
  unassignedTripIds: string[],
  input: OptimizerInput,
  candidatesMap: Map<string, CandidateSet>
): { tripId: string; tripCode: string; reason: string }[] {
  return unassignedTripIds.map((tripId) => {
    const trip = input.trips.find((t) => t.id === tripId)!;
    const cand = candidatesMap.get(tripId);

    let reason = "Insufficient resources due to timeline overlap with active duties.";

    if (!cand) {
      return {
        tripId,
        tripCode: trip.tripCode,
        reason: "No resource candidates resolved for this date.",
      };
    }

    const { compatibleBuses, compatibleDrivers, compatibleConductors } = cand;

    // 1. Total resource shortages
    if (compatibleBuses.length === 0) {
      reason = "No active buses available in the fleet registry.";
    } else if (compatibleDrivers.length === 0) {
      reason = "No active drivers available. Check for expired licenses or status locks.";
    } else if (compatibleConductors.length === 0) {
      reason = "No active conductors available in the crew registry.";
    } else {
      // 2. Dynamic availability bottleneck analysis
      const departureStr = formatMinutesToTime(trip.startTime);
      const arrivalStr = formatMinutesToTime(trip.endTime);

      // Check if drivers are resting
      const driversUnderRest = input.drivers.filter(
        (d) => d.status === "available" && d.restUntil > trip.startTime
      );
      
      const allDriversResting = driversUnderRest.length === input.drivers.length;
      const licenseCategoryMismatches = compatibleDrivers.filter(d => {
        // Find if category is incompat
        const hpvDrivers = input.drivers.filter(drv => drv.licenseCategory?.includes("Heavy") || drv.licenseCategory?.includes("HPV"));
        return hpvDrivers.length === 0;
      });

      if (driversUnderRest.length > 0 && compatibleDrivers.every((d) => d.restUntil > trip.startTime)) {
        const nextAvailableRest = Math.min(...compatibleDrivers.map((d) => d.restUntil));
        reason = `No driver available. Drivers exist, but they are under mandatory rest until ${formatMinutesToTime(
          nextAvailableRest
        )}.`;
      } else {
        // Check turnaround transitions
        const potentialDuties = input.trips.filter(
          (t) => t.id !== trip.id && t.serviceDate === trip.serviceDate && t.endTime > trip.startTime - input.configuration.MIN_TURNAROUND_MINUTES
        );

        if (potentialDuties.length > 0) {
          reason = `Buses exist, but turnaround transitions from their previous routes require a ${input.configuration.MIN_TURNAROUND_MINUTES}-minute buffer.`;
        } else {
          reason = `No compatible bus or crew segment was free between ${departureStr} and ${arrivalStr}.`;
        }
      }
    }

    return {
      tripId,
      tripCode: trip.tripCode,
      reason,
    };
  });
}
