import { eq, and, desc } from "drizzle-orm";
import { db, cleanUuid, cleanString } from "../db";
import {
  incidents,
  incidentImpacts,
  auditLogs,
  users,
  reschedulingRuns,
  trips,
  routes,
  buses,
  crew,
  duties,
} from "../db/schema";
import { requireAuth } from "../auth";
import { IncidentType, IncidentStatus } from "./types";
import { analyzeIncidentImpactImpl } from "./impact-analysis";
import { generateRecoveryProposalsImpl } from "./recovery-engine";
import {
  registerOperationalIssueFromIncident,
  resolveOperationalIssueFromIncident,
} from "../scheduling-ops";
import {
  recordLiveDisruptionTelemetry,
  clearLiveDisruptionTelemetry,
} from "../telemetry-ops";

export async function createIncidentImpl(data: {
  type: IncidentType;
  severity: "low" | "medium" | "high" | "critical";
  serviceDate: string;
  resourceType: "bus" | "crew" | null;
  resourceId: string | null;
  tripId: string | null;
  routeId: string | null;
  startTime: number;
  expectedEndTime: number | null;
  location: string | null;
  description: string | null;
}) {
  const currentUser = await requireAuth();
  const tenantId = currentUser.tenantId;

  const cleanedResourceId = cleanUuid(data.resourceId);
  const cleanedTripId = cleanUuid(data.tripId);
  const cleanedRouteId = cleanUuid(data.routeId);
  const cleanedResourceType =
    data.resourceType === "bus" || data.resourceType === "crew"
      ? data.resourceType
      : null;
  const cleanedLocation = cleanString(data.location);
  const cleanedDescription = cleanString(data.description);

  // Validate foreign keys exist in PostgreSQL to prevent FK violations
  let validTripId: string | null = null;
  let validRouteId: string | null = null;
  let validResourceId: string | null = null;
  let validReportedBy: string | null = null;

  if (cleanedTripId) {
    try {
      const tripRow = await db.query.trips.findFirst({
        where: eq(trips.id, cleanedTripId),
        columns: { id: true },
      });
      if (tripRow) validTripId = cleanedTripId;
    } catch {}
  }

  if (cleanedRouteId) {
    try {
      const routeRow = await db.query.routes.findFirst({
        where: eq(routes.id, cleanedRouteId),
        columns: { id: true },
      });
      if (routeRow) validRouteId = cleanedRouteId;
    } catch {}
  }

  if (cleanedResourceId) {
    try {
      if (cleanedResourceType === "bus") {
        const busRow = await db.query.buses.findFirst({
          where: eq(buses.id, cleanedResourceId),
          columns: { id: true },
        });
        if (busRow) validResourceId = cleanedResourceId;
      } else if (cleanedResourceType === "crew") {
        const crewRow = await db.query.crew.findFirst({
          where: eq(crew.id, cleanedResourceId),
          columns: { id: true },
        });
        if (crewRow) validResourceId = cleanedResourceId;
      }
    } catch {}
  }

  if (currentUser.id) {
    try {
      const userRow = await db.query.users.findFirst({
        where: eq(users.id, currentUser.id),
        columns: { id: true },
      });
      if (userRow) validReportedBy = currentUser.id;
    } catch {}
  }

  // Insert Incident
  const [newIncident] = await db
    .insert(incidents)
    .values({
      tenantId,
      type: data.type,
      status: "OPEN",
      severity: data.severity,
      serviceDate: data.serviceDate,
      resourceType: cleanedResourceType,
      resourceId: validResourceId,
      tripId: validTripId,
      routeId: validRouteId,
      reportedBy: validReportedBy,
      startTime: Number(data.startTime) || 0,
      expectedEndTime: data.expectedEndTime
        ? Number(data.expectedEndTime)
        : null,
      location: cleanedLocation,
      description: cleanedDescription || (data.tripId ? `Incident reported on Trip ${data.tripId}` : "Disruption reported"),
    })
    .returning();

  const incidentId = newIncident!.id;

  // Audit: INCIDENT_CREATED
  try {
    await db.insert(auditLogs).values({
      tenantId,
      userId: currentUser.id,
      email: currentUser.email,
      action: "INCIDENT_CREATED",
      details: `Created disruption incident of type ${data.type} (Severity: ${data.severity}) at ${data.startTime} minutes`,
    });
  } catch {}

  // Calculate direct and downstream impacts immediately
  let impactSummaryList: any[] = [];
  try {
    impactSummaryList = await analyzeIncidentImpactImpl(newIncident!);
  } catch (impErr) {
    console.warn("Could not calculate downstream impacts:", impErr);
  }

  if (impactSummaryList.length > 0) {
    // Transactionally insert impacts safely with foreign key validation
    try {
      await db.transaction(async (tx) => {
        for (const imp of impactSummaryList) {
          let impTripId = cleanUuid(imp.tripId);
          let impDutyId = cleanUuid(imp.dutyId);
          let impBusId = cleanUuid(imp.busId);
          let impDriverId = cleanUuid(imp.driverId);
          let impConductorId = cleanUuid(imp.conductorId);

          if (impTripId) {
            const hasTrip = await tx.query.trips.findFirst({
              where: eq(trips.id, impTripId),
              columns: { id: true },
            });
            if (!hasTrip) impTripId = null;
          }
          if (impDutyId) {
            const hasDuty = await tx.query.duties.findFirst({
              where: eq(duties.id, impDutyId),
              columns: { id: true },
            });
            if (!hasDuty) impDutyId = null;
          }
          if (impBusId) {
            const hasBus = await tx.query.buses.findFirst({
              where: eq(buses.id, impBusId),
              columns: { id: true },
            });
            if (!hasBus) impBusId = null;
          }
          if (impDriverId) {
            const hasDriver = await tx.query.crew.findFirst({
              where: eq(crew.id, impDriverId),
              columns: { id: true },
            });
            if (!hasDriver) impDriverId = null;
          }
          if (impConductorId) {
            const hasCond = await tx.query.crew.findFirst({
              where: eq(crew.id, impConductorId),
              columns: { id: true },
            });
            if (!hasCond) impConductorId = null;
          }

          await tx.insert(incidentImpacts).values({
            incidentId,
            tripId: impTripId,
            dutyId: impDutyId,
            busId: impBusId,
            driverId: impDriverId,
            conductorId: impConductorId,
            impactType: imp.impactType,
            impactLevel: imp.impactLevel,
            reason: imp.reason,
          });
        }

        // Update incident status to ANALYZING
        await tx
          .update(incidents)
          .set({ status: "ANALYZING", updatedAt: new Date() })
          .where(eq(incidents.id, incidentId));
      });
    } catch (saveImpErr) {
      console.warn("Could not save all incident impacts to DB, proceeding:", saveImpErr);
    }

    try {
      await db.insert(auditLogs).values({
        tenantId,
        userId: currentUser.id,
        email: currentUser.email,
        action: "IMPACT_ANALYZED",
        details: `Disruption impact analysis finished: Identified ${impactSummaryList.length} affected schedule variables`,
      });
    } catch {}
  }

  // Cross-system mirroring:
  // 1. Mirror into OPERATIONAL_ISSUES for /operations/today and Radio Dispatch
  try {
    registerOperationalIssueFromIncident({
      ...newIncident!,
      tripId: data.tripId,
      routeId: data.routeId,
      resourceId: data.resourceId,
      resourceType: cleanedResourceType,
      serviceDate: data.serviceDate,
      startTime: Number(data.startTime) || 0,
      description: cleanedDescription,
    });
  } catch (issueErr) {
    console.warn("Could not register operational issue:", issueErr);
  }

  // 2. Mirror into LIVE_TELEMETRY for real-time map delay/stationary tracking
  try {
    recordLiveDisruptionTelemetry({
      tenantId,
      incidentId,
      resourceType: cleanedResourceType,
      resourceId: data.resourceId,
      tripId: data.tripId,
      type: data.type,
      severity: data.severity,
      reason: data.description || `${data.type.replace(/_/g, " ")} reported`,
    });
  } catch (telemErr) {
    console.warn("Could not update live telemetry:", telemErr);
  }

  // Automatically compute and generate recovery proposals immediately!
  try {
    await generateRecoveryProposalsImpl(incidentId);
  } catch (genErr) {
    console.warn("Automatic recovery proposals generation encountered an issue:", genErr);
  }

  // Reload incident with full proposals attached
  let fullIncident: any = newIncident;
  try {
    fullIncident = await getIncidentDetailsImpl(incidentId);
  } catch {
    fullIncident = newIncident;
  }

  return {
    incident: fullIncident,
    impacts: impactSummaryList,
    run: fullIncident.reschedulingRuns?.[0] || null,
  };
}

export async function getIncidentsImpl(data: { serviceDate: string }) {
  const currentUser = await requireAuth();

  const list = await db.query.incidents.findMany({
    where: and(
      eq(incidents.tenantId, currentUser.tenantId),
      eq(incidents.serviceDate, data.serviceDate),
    ),
    orderBy: desc(incidents.reportedAt),
    with: {
      reporter: {
        columns: { name: true, email: true },
      },
      reschedulingRuns: {
        orderBy: desc(reschedulingRuns.createdAt),
        with: {
          proposals: true,
        },
      },
    },
  });

  return list;
}

export async function getIncidentDetailsImpl(incidentId: string) {
  const currentUser = await requireAuth();

  const incidentObj = await db.query.incidents.findFirst({
    where: and(
      eq(incidents.id, incidentId),
      eq(incidents.tenantId, currentUser.tenantId),
    ),
    with: {
      reporter: true,
      impacts: {
        with: {
          trip: true,
          duty: true,
          bus: true,
          driver: true,
          conductor: true,
        },
      },
      reschedulingRuns: {
        orderBy: desc(reschedulingRuns.createdAt),
        with: {
          proposals: true,
        },
      },
    },
  });

  if (!incidentObj) throw new Error("Incident not found");

  return incidentObj;
}

export async function resolveIncidentImpl(incidentId: string) {
  const currentUser = await requireAuth();
  const tenantId = currentUser.tenantId;

  await db
    .update(incidents)
    .set({
      status: "RESOLVED",
      resolvedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(incidents.id, incidentId), eq(incidents.tenantId, tenantId)));

  // Cross-system mirroring:
  try {
    resolveOperationalIssueFromIncident(incidentId, "Disruption resolved by Central Dispatcher");
  } catch {}

  try {
    clearLiveDisruptionTelemetry({ tenantId, incidentId });
  } catch {}

  try {
    await db.insert(auditLogs).values({
      tenantId,
      userId: currentUser.id,
      email: currentUser.email,
      action: "INCIDENT_RESOLVED",
      details: `Incident ID ${incidentId} marked as RESOLVED by dispatcher`,
    });
  } catch {}

  return { success: true };
}
