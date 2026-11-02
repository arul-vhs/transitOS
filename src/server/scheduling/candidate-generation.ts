import {
  checkBusStatus,
  checkCrewStatus,
  checkDriverLicense,
  checkLicenseCategory,
  checkCrewRest,
} from "./constraints";
import { Bus, Crew, Trip, OptimizerInput } from "./types";

export interface CandidateSet {
  tripId: string;
  compatibleBuses: Bus[];
  compatibleDrivers: Crew[];
  compatibleConductors: Crew[];
}

export function generateCandidates(input: OptimizerInput): CandidateSet[] {
  const { serviceDate, trips, buses, drivers, conductors } = input;

  // Pre-filter valid buses
  const validBuses = buses.filter(checkBusStatus);

  // Pre-filter valid crew members (status check)
  const validDrivers = drivers.filter(checkCrewStatus);
  const validConductors = conductors.filter(checkCrewStatus);

  return trips.map((trip) => {
    // 1. Buses compatible with this trip (only status check)
    const tripBuses = validBuses;

    // 2. Drivers compatible with this trip (status, license expiry, rest limits)
    const tripDrivers = validDrivers.filter((driver) => {
      // Must have valid license
      if (!checkDriverLicense(driver, serviceDate)) {
        return false;
      }
      // Must satisfy rest requirements for trip start
      if (!checkCrewRest(driver, trip.startTime)) {
        return false;
      }
      return true;
    });

    // 3. Conductors compatible with this trip (status, rest limits)
    const tripConductors = validConductors.filter((conductor) => {
      // Must satisfy rest requirements for trip start
      return checkCrewRest(conductor, trip.startTime);
    });

    return {
      tripId: trip.id,
      compatibleBuses: tripBuses,
      compatibleDrivers: tripDrivers,
      compatibleConductors: tripConductors,
    };
  });
}
