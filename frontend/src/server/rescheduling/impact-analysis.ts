import { eq, and } from "drizzle-orm";
import { db } from "../db";
import { trips, duties, crew, buses } from "../db/schema";
import { SCHEDULING_CONFIG } from "../../lib/transit/config";

export interface ImpactSummary {
  tripId: string | null;
  dutyId: string | null;
  busId: string | null;
  driverId: string | null;
  conductorId: string | null;
  impactType: "BUS_LOST" | "CREW_LOST" | "DELAYED" | "CANCELLED" | "TURNAROUND_VIOLATION" | "CREW_REST_CONFLICT" | "UNASSIGNED";
  impactLevel: "DIRECT" | "DOWNSTREAM" | "SECONDARY";
  reason: string;
}

export async function analyzeIncidentImpactImpl(incident: {
  tenantId: string;
  type: string;
  serviceDate: string;
  resourceType: string | null;
  resourceId: string | null;
  tripId: string | null;
  routeId: string | null;
  startTime: number;
  expectedEndTime: number | null;
}): Promise<ImpactSummary[]> {
  const { tenantId, serviceDate, startTime } = incident;

  // Load all duties and trips for the day
  const dayDuties = await db.query.duties.findMany({
    where: and(eq(duties.tenantId, tenantId), eq(duties.serviceDate, serviceDate)),
    with: {
      trips: {
        with: {
          trip: true,
        },
      },
      crewSegments: true,
    },
  });

  const dayTrips = await db.query.trips.findMany({
    where: and(eq(trips.tenantId, tenantId), eq(trips.serviceDate, serviceDate)),
  });

  const impacts: ImpactSummary[] = [];

  // Helper to push unique impacts
  const addImpact = (item: ImpactSummary) => {
    const exists = impacts.some(
      (imp) =>
        imp.tripId === item.tripId &&
        imp.dutyId === item.dutyId &&
        imp.impactType === item.impactType
    );
    if (!exists) {
      impacts.push(item);
    }
  };

  // 1. BUS_BREAKDOWN or BUS_UNAVAILABLE
  if (incident.type === "BUS_BREAKDOWN" || incident.type === "BUS_UNAVAILABLE") {
    const targetBusId = incident.resourceId;
    if (targetBusId) {
      // Find all duties assigned to this bus
      const affectedDuties = dayDuties.filter((d) => d.busId === targetBusId);

      affectedDuties.forEach((d) => {
        // Find all trips in this duty starting after incident startTime
        const futureTrips = d.trips
          .map((dt) => dt.trip)
          .filter((t) => t && t.startTime >= startTime)
          .sort((a, b) => a.startTime - b.startTime);

        futureTrips.forEach((t) => {
          addImpact({
            tripId: t.id,
            dutyId: d.id,
            busId: targetBusId,
            driverId: d.driverId,
            conductorId: d.conductorId,
            impactType: "BUS_LOST",
            impactLevel: "DIRECT",
            reason: `Bus ${targetBusId} broke down/unavailable at ${startTime} minutes.`,
          });

          // Propagate downstream to crew assigned to this duty
          if (d.driverId) {
            addImpact({
              tripId: t.id,
              dutyId: d.id,
              busId: null,
              driverId: d.driverId,
              conductorId: null,
              impactType: "CREW_LOST",
              impactLevel: "DOWNSTREAM",
              reason: `Driver displaced because assigned bus is unavailable.`,
            });
          }
          if (d.conductorId) {
            addImpact({
              tripId: t.id,
              dutyId: d.id,
              busId: null,
              driverId: null,
              conductorId: d.conductorId,
              impactType: "CREW_LOST",
              impactLevel: "DOWNSTREAM",
              reason: `Conductor displaced because assigned bus is unavailable.`,
            });
          }
        });
      });
    }
  }

  // 2. DRIVER_ABSENT or CONDUCTOR_ABSENT
  if (incident.type === "DRIVER_ABSENT" || incident.type === "CONDUCTOR_ABSENT" || incident.type === "CREW_EMERGENCY") {
    const targetCrewId = incident.resourceId;
    if (targetCrewId) {
      // Find all duties/segments where this crew member is assigned
      const affectedDuties = dayDuties.filter((d) => {
        if (incident.type === "DRIVER_ABSENT" && d.driverId === targetCrewId) return true;
        if (incident.type === "CONDUCTOR_ABSENT" && d.conductorId === targetCrewId) return true;
        // Check segments
        return d.crewSegments?.some(
          (seg) =>
            (incident.type === "DRIVER_ABSENT" && seg.driverId === targetCrewId) ||
            (incident.type === "CONDUCTOR_ABSENT" && seg.conductorId === targetCrewId)
        );
      });

      affectedDuties.forEach((d) => {
        const futureTrips = d.trips
          .map((dt) => dt.trip)
          .filter((t) => t && t.startTime >= startTime);

        futureTrips.forEach((t) => {
          addImpact({
            tripId: t.id,
            dutyId: d.id,
            busId: d.busId,
            driverId: incident.type === "DRIVER_ABSENT" ? targetCrewId : null,
            conductorId: incident.type === "CONDUCTOR_ABSENT" ? targetCrewId : null,
            impactType: "CREW_LOST",
            impactLevel: "DIRECT",
            reason: `Assigned crew member absent/unavailable starting at ${startTime} minutes.`,
          });
        });
      });
    }
  }

  // 3. TRIP_DELAY
  if (incident.type === "TRIP_DELAY" && incident.tripId) {
    const delayMin = incident.startTime; // Use startTime field as the delay value or parse details
    const directTrip = dayTrips.find((t) => t.id === incident.tripId);

    if (directTrip) {
      // Find duty of this trip
      const dutyObj = dayDuties.find((d) => d.trips?.some((dt) => dt.tripId === directTrip.id));
      const dutyId = dutyObj ? dutyObj.id : null;

      addImpact({
        tripId: directTrip.id,
        dutyId,
        busId: dutyObj?.busId || null,
        driverId: dutyObj?.driverId || null,
        conductorId: dutyObj?.conductorId || null,
        impactType: "DELAYED",
        impactLevel: "DIRECT",
        reason: `Trip ${directTrip.tripCode} delayed by ${delayMin} minutes.`,
      });

      // Propagate downstream along the duty chain
      if (dutyObj) {
        const sortedTripsInDuty = [...dutyObj.trips]
          .map((dt) => dt.trip)
          .filter((t) => t)
          .sort((a, b) => a.startTime - b.startTime);

        const startIndex = sortedTripsInDuty.findIndex((t) => t.id === directTrip.id);
        let accumulatedDelay = delayMin;

        for (let i = startIndex + 1; i < sortedTripsInDuty.length; i++) {
          const prevTrip = sortedTripsInDuty[i - 1]!;
          const currentTrip = sortedTripsInDuty[i]!;

          const originalGap = currentTrip.startTime - prevTrip.endTime;
          // New arrival time of prev trip
          const newPrevArrival = prevTrip.endTime + accumulatedDelay;
          const newGap = currentTrip.startTime - newPrevArrival;

          if (newGap < 0) {
            // Overlaps, current trip must be delayed!
            accumulatedDelay = Math.abs(newGap);
            addImpact({
              tripId: currentTrip.id,
              dutyId: dutyObj.id,
              busId: dutyObj.busId,
              driverId: dutyObj.driverId,
              conductorId: dutyObj.conductorId,
              impactType: "DELAYED",
              impactLevel: "DOWNSTREAM",
              reason: `Downstream impact: Delayed by ${accumulatedDelay} mins due to previous trip delay.`,
            });
          } else if (newGap < SCHEDULING_CONFIG.MIN_TURNAROUND_MINUTES && currentTrip.routeId !== prevTrip.routeId) {
            // Turnaround buffer violation!
            addImpact({
              tripId: currentTrip.id,
              dutyId: dutyObj.id,
              busId: dutyObj.busId,
              driverId: dutyObj.driverId,
              conductorId: dutyObj.conductorId,
              impactType: "TURNAROUND_VIOLATION",
              impactLevel: "DOWNSTREAM",
              reason: `Turnaround buffer of ${SCHEDULING_CONFIG.MIN_TURNAROUND_MINUTES} mins violated between routes.`,
            });
          }
        }
      }
    }
  }

  // 4. TRIP_CANCELLED
  if (incident.type === "TRIP_CANCELLED" && incident.tripId) {
    const targetTrip = dayTrips.find((t) => t.id === incident.tripId);
    if (targetTrip) {
      const dutyObj = dayDuties.find((d) => d.trips?.some((dt) => dt.tripId === targetTrip.id));
      addImpact({
        tripId: targetTrip.id,
        dutyId: dutyObj ? dutyObj.id : null,
        busId: dutyObj?.busId || null,
        driverId: dutyObj?.driverId || null,
        conductorId: dutyObj?.conductorId || null,
        impactType: "CANCELLED",
        impactLevel: "DIRECT",
        reason: `Trip ${targetTrip.tripCode} cancelled by dispatcher.`,
      });
    }
  }

  // 5. ROUTE_BLOCKED
  if (incident.type === "ROUTE_BLOCKED" && incident.routeId) {
    const endBlockTime = incident.expectedEndTime || 1440; // Default to end of day if null
    const routeTrips = dayTrips.filter(
      (t) => t.routeId === incident.routeId && t.startTime >= startTime && t.startTime <= endBlockTime
    );

    routeTrips.forEach((t) => {
      const dutyObj = dayDuties.find((d) => d.trips?.some((dt) => dt.tripId === t.id));
      addImpact({
        tripId: t.id,
        dutyId: dutyObj ? dutyObj.id : null,
        busId: dutyObj?.busId || null,
        driverId: dutyObj?.driverId || null,
        conductorId: dutyObj?.conductorId || null,
        impactType: "CANCELLED",
        impactLevel: "DIRECT",
        reason: `Route blocked from ${startTime} to ${endBlockTime} minutes.`,
      });
    });
  }

  return impacts;
}
