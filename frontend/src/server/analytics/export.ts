import { eq } from "drizzle-orm";
import { db } from "../db";
import { auditLogs } from "../db/schema";
import { requireAuth } from "../auth";
import {
  getPlanVsActualImpl,
  getRouteAnalyticsImpl,
  getFleetAnalyticsImpl,
  getIncidentAnalyticsImpl,
  getRecoveryAnalyticsImpl,
} from "./queries";

export async function exportAnalyticsCsvImpl(type: string): Promise<string> {
  const currentUser = await requireAuth();
  const tenantId = currentUser.tenantId;

  let headers: string[] = [];
  let rows: string[][] = [];

  if (type === "plan-vs-actual") {
    headers = [
      "Trip Code",
      "Route Code",
      "Direction",
      "Planned Start",
      "Actual Start",
      "Planned End",
      "Actual End",
      "Departure Variance",
      "Status",
      "Cancellation Reason",
    ];
    const data = await getPlanVsActualImpl({});
    rows = data.map((t) => [
      t.tripCode,
      t.routeCode,
      t.direction,
      t.plannedStart,
      t.actualStart,
      t.plannedEnd,
      t.actualEnd,
      t.departureVariance,
      t.status,
      t.cancellationReason,
    ]);
  } else if (type === "routes") {
    headers = [
      "Route Code",
      "Route Name",
      "Trips Scheduled",
      "Trips Completed",
      "Trips Cancelled",
      "Completion Rate %",
      "On-Time Rate %",
      "Avg Delay (mins)",
    ];
    const data = await getRouteAnalyticsImpl({});
    rows = data.map((r) => [
      r.routeCode,
      r.routeName,
      String(r.tripsScheduled),
      String(r.tripsCompleted),
      String(r.tripsCancelled),
      `${r.completionRate}%`,
      `${r.onTimeRate}%`,
      `${r.averageDelay}m`,
    ]);
  } else if (type === "fleet") {
    headers = [
      "Registration Number",
      "Depot",
      "Status",
      "Trips Operated",
      "Operating Hours",
      "Utilization Rate %",
      "Breakdowns",
    ];
    const data = await getFleetAnalyticsImpl({});
    rows = data.map((b) => [
      b.registrationNumber,
      b.depot,
      b.status,
      String(b.tripsOperated),
      `${b.operatedHours}h`,
      `${b.utilizationRate}%`,
      String(b.breakdownsCount),
    ]);
  } else if (type === "incidents") {
    headers = [
      "Total Incidents",
      "Recovery Success Rate %",
      "Avg Recovery Time (mins)",
    ];
    const data = await getIncidentAnalyticsImpl();
    rows = [[
      String(data.totalIncidents),
      `${data.recoverySuccessRate}%`,
      `${data.averageRecoveryTimeMins}m`,
    ]];
  } else if (type === "recovery") {
    headers = [
      "Run ID",
      "Service Date",
      "Status",
      "Incident Type",
      "Trips Affected",
      "Trips Recovered",
      "Trips Unassigned",
    ];
    const data = await getRecoveryAnalyticsImpl();
    rows = data.map((r) => [
      r.runId,
      r.serviceDate,
      r.status,
      r.incidentType,
      String(r.tripsAffected),
      String(r.tripsRecovered),
      String(r.tripsUnassigned),
    ]);
  } else {
    throw new Error("Invalid CSV export type requested.");
  }

  // Generate CSV String buffer
  const headerLine = headers.join(",");
  const dataLines = rows.map((r) =>
    r.map((val) => `"${val.replace(/"/g, '""')}"`).join(",")
  );
  const csvBuffer = [headerLine, ...dataLines].join("\n");

  // Log ANALTICS_EXPORT action in Drizzle transaction!
  await db.insert(auditLogs).values({
    tenantId,
    userId: currentUser.id,
    email: currentUser.email,
    action: "ANALYTICS_EXPORT",
    details: `Exported operational analytics as CSV (Type: ${type}, Rows count: ${rows.length})`,
  });

  return csvBuffer;
}
