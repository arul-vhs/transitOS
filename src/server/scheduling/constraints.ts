import { Bus, Crew, Trip } from "./types";

export function checkBusStatus(bus: Bus): boolean {
  const inactiveStatuses = ["maintenance", "breakdown", "out-of-service"];
  return !inactiveStatuses.includes(bus.status.toLowerCase());
}

export function checkCrewStatus(crewMember: Crew): boolean {
  const inactiveStatuses = ["leave", "unavailable"];
  return !inactiveStatuses.includes(crewMember.status.toLowerCase());
}

export function checkDriverLicense(
  driver: Crew,
  serviceDateStr: string,
): boolean {
  if (!driver.licenseExpiry) return false;

  const serviceDate = new Date(serviceDateStr);
  const expiryDate = new Date(driver.licenseExpiry);

  // Clean time components
  serviceDate.setHours(0, 0, 0, 0);
  expiryDate.setHours(0, 0, 0, 0);

  return expiryDate.getTime() >= serviceDate.getTime();
}

export function checkLicenseCategory(
  driver: Crew,
  busType: string | null,
): boolean {
  // Standard compatibility rules:
  // - Double-Decker Express requires "Heavy Passenger Vehicle (HPV)"
  // - Standard Diesel Leyland requires Commercial Bus Licence or HPV
  // - Midi Bus Feeder can use any license
  if (!busType) return true;

  const category = driver.licenseCategory || "";
  const isDoubleDecker = busType.toLowerCase().includes("double-decker");
  const isLeyland =
    busType.toLowerCase().includes("leyland") ||
    busType.toLowerCase().includes("standard");

  if (isDoubleDecker) {
    return (
      category.includes("Heavy Passenger Vehicle") || category.includes("HPV")
    );
  }

  if (isLeyland) {
    return (
      category.includes("Heavy Passenger Vehicle") ||
      category.includes("HPV") ||
      category.includes("Commercial")
    );
  }

  return true;
}

export function checkCrewRest(crewMember: Crew, startTime: number): boolean {
  return startTime >= crewMember.restUntil;
}

export function checkTurnaround(
  tripA: Trip,
  tripB: Trip,
  config: { MIN_TURNAROUND_MINUTES: number },
): { feasible: boolean; gap: number } {
  const gap = tripB.startTime - tripA.endTime;
  if (gap < 0) {
    return { feasible: false, gap };
  }

  // Inter-terminal positioning deadhead check
  const isInterTerminal =
    tripA.destination &&
    tripB.origin &&
    tripA.destination.trim().toLowerCase() !== tripB.origin.trim().toLowerCase();

  if (isInterTerminal) {
    const requiredRepositioningBuffer = Math.max(
      15,
      config.MIN_TURNAROUND_MINUTES,
    );
    if (gap < requiredRepositioningBuffer) {
      return { feasible: false, gap };
    }
  }

  // Route transition requires minimum turnaround buffer
  if (tripA.routeId !== tripB.routeId) {
    if (gap < config.MIN_TURNAROUND_MINUTES) {
      return { feasible: false, gap };
    }
  } else {
    // Same route turnaround, default is 5 mins or min turnaround
    const minBuffer = Math.min(5, config.MIN_TURNAROUND_MINUTES);
    if (gap < minBuffer) {
      return { feasible: false, gap };
    }
  }

  return { feasible: true, gap };
}

export function checkDutyDuration(
  startTime: number,
  endTime: number,
  config: { MAX_DUTY_HOURS: number },
): boolean {
  const duration = endTime - startTime;
  const maxMinutes = config.MAX_DUTY_HOURS * 60;
  return duration <= maxMinutes;
}

/**
 * Validates that continuous driving does not exceed statutory limit (240 minutes = 4 hours)
 * without an intervening mandatory rest break of at least 30 minutes.
 */
export function checkContinuousDriving(
  existingTrips: { startTime: number; endTime: number; durationMin?: number }[],
  nextTrip: { startTime: number; endTime: number; durationMin?: number },
  maxContinuousMin: number = 240,
  minMandatoryRestMin: number = 30,
): boolean {
  const nextDuration =
    nextTrip.durationMin ?? (nextTrip.endTime - nextTrip.startTime);
  let continuousDriving = nextDuration;
  let cursorStart = nextTrip.startTime;

  for (let i = existingTrips.length - 1; i >= 0; i--) {
    const prev = existingTrips[i];
    if (!prev) continue;
    const prevDuration = prev.durationMin ?? (prev.endTime - prev.startTime);
    const breakGap = cursorStart - prev.endTime;

    if (breakGap >= minMandatoryRestMin) {
      // Driver received mandatory rest break; continuous streak resets
      break;
    }
    continuousDriving += prevDuration;
    cursorStart = prev.startTime;
  }

  return continuousDriving <= maxContinuousMin;
}
