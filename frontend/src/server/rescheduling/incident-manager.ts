import { eq, and, desc } from "drizzle-orm";
import { db } from "../db";
import { incidents, incidentImpacts, auditLogs, users } from "../db/schema";
import { requireAuth, requirePermission } from "../auth";
import { IncidentType, IncidentStatus } from "./types";
import { analyzeIncidentImpactImpl } from "./impact-analysis";

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
  await requirePermission(currentUser.role, "schedule.generate"); // Depot Managers or Schedulers

  const tenantId = currentUser.tenantId;

  // Insert Incident
  const [newIncident] = await db
    .insert(incidents)
    .values({
      tenantId,
      type: data.type,
      status: "OPEN",
      severity: data.severity,
      serviceDate: data.serviceDate,
      resourceType: data.resourceType,
      resourceId: data.resourceId,
      tripId: data.tripId,
      routeId: data.routeId,
      reportedBy: currentUser.id,
      startTime: data.startTime,
      expectedEndTime: data.expectedEndTime,
      location: data.location,
      description: data.description,
    })
    .returning();

  const incidentId = newIncident!.id;

  // Audit: INCIDENT_CREATED
  await db.insert(auditLogs).values({
    tenantId,
    userId: currentUser.id,
    email: currentUser.email,
    action: "INCIDENT_CREATED",
    details: `Created disruption incident of type ${data.type} (Severity: ${data.severity}) at ${data.startTime} minutes`,
  });

  // Calculate direct and downstream impacts immediately!
  const impactSummaryList = await analyzeIncidentImpactImpl(newIncident!);

  if (impactSummaryList.length > 0) {
    // Transactionally insert impacts
    await db.transaction(async (tx) => {
      for (const imp of impactSummaryList) {
        await tx.insert(incidentImpacts).values({
          incidentId,
          tripId: imp.tripId,
          dutyId: imp.dutyId,
          busId: imp.busId,
          driverId: imp.driverId,
          conductorId: imp.conductorId,
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

    // Audit: IMPACT_ANALYZED
    await db.insert(auditLogs).values({
      tenantId,
      userId: currentUser.id,
      email: currentUser.email,
      action: "IMPACT_ANALYZED",
      details: `Disruption impact analysis finished: Identified ${impactSummaryList.length} affected schedule variables`,
    });
  }

  return {
    incident: newIncident,
    impacts: impactSummaryList,
  };
}

export async function getIncidentsImpl(data: { serviceDate: string }) {
  const currentUser = await requireAuth();
  await requirePermission(currentUser.role, "schedule.view");

  const list = await db.query.incidents.findMany({
    where: and(
      eq(incidents.tenantId, currentUser.tenantId),
      eq(incidents.serviceDate, data.serviceDate)
    ),
    orderBy: desc(incidents.reportedAt),
    with: {
      reporter: {
        columns: { name: true, email: true },
      },
    },
  });

  return list;
}

export async function getIncidentDetailsImpl(incidentId: string) {
  const currentUser = await requireAuth();
  await requirePermission(currentUser.role, "schedule.view");

  const incidentObj = await db.query.incidents.findFirst({
    where: and(eq(incidents.id, incidentId), eq(incidents.tenantId, currentUser.tenantId)),
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
  await requirePermission(currentUser.role, "schedule.generate");

  const tenantId = currentUser.tenantId;

  await db
    .update(incidents)
    .set({
      status: "RESOLVED",
      resolvedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(incidents.id, incidentId), eq(incidents.tenantId, tenantId)));

  await db.insert(auditLogs).values({
    tenantId,
    userId: currentUser.id,
    email: currentUser.email,
    action: "INCIDENT_RESOLVED",
    details: `Incident ID ${incidentId} marked as RESOLVED by dispatcher`,
  });

  return { success: true };
}
