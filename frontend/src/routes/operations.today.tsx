import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarClock,
  Bus as BusIcon,
  Users,
  AlertTriangle,
  CheckCircle2,
  FileText,
  ListTodo,
  ArrowRight,
  UserCheck,
  Calendar,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { hasPermission } from "@/lib/auth-shared";
import { getTrips, getDuties, validateDuty } from "@/lib/scheduling-fns";
import { getIncidents } from "@/lib/rescheduling-fns";

export const Route = createFileRoute("/operations/today")({
  beforeLoad: ({ context }) => {
    if (!context.user || !hasPermission(context.user.role, "schedule.view")) {
      throw new Error("Forbidden");
    }
  },
  head: () => ({
    meta: [
      { title: "Today's Operations — TransitOS" },
      { name: "description", content: "Live duty board for the current service day." },
    ],
  }),
  component: OperationsTodayPage,
});

const SERVICE_DATE = "25 Aug 2026";

function formatMinutesToTime(totalMin: number): string {
  const hh = Math.floor(totalMin / 60);
  const mm = totalMin % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function OperationsTodayPage() {
  // 1. Fetch Today's Trips
  const { data: tripsList = [], isLoading: tripsLoading } = useQuery({
    queryKey: ["today-trips", SERVICE_DATE],
    queryFn: () => getTrips({ serviceDate: SERVICE_DATE }),
  });

  // 2. Fetch Today's Duties
  const { data: dutiesList = [], isLoading: dutiesLoading } = useQuery({
    queryKey: ["today-duties", SERVICE_DATE],
    queryFn: () => getDuties({ serviceDate: SERVICE_DATE }),
  });

  // 2b. Fetch Live Incidents
  const { data: incidentsList = [] } = useQuery({
    queryKey: ["today-incidents", SERVICE_DATE],
    queryFn: () => getIncidents({ serviceDate: SERVICE_DATE }),
  });

  // 3. Batch Validate Duties to count validation issues
  const { data: dutyValidations = {} } = useQuery({
    queryKey: ["today-duties-validations", dutiesList],
    queryFn: async () => {
      const results: Record<string, { isValid: boolean; issues: string[] }> = {};
      for (const d of dutiesList) {
        try {
          const res = await validateDuty({ dutyId: d.id });
          results[d.id] = res;
        } catch (e) {
          results[d.id] = { isValid: false, issues: ["Failed to run validation"] };
        }
      }
      return results;
    },
    enabled: dutiesList.length > 0,
  });

  // Calculate Metrics
  const totalTrips = tripsList.length;
  const totalDuties = dutiesList.length;

  // Assigned Buses count
  const assignedBuses = new Set(dutiesList.map((d) => d.busId).filter(Boolean)).size;

  // Assigned Drivers/Crew count (Linked drivers + Unlinked drivers in segments)
  const assignedDriversSet = new Set<string>();
  dutiesList.forEach((d) => {
    if (d.driverId) assignedDriversSet.add(d.driverId);
    if (d.crewSegments) {
      d.crewSegments.forEach((seg: any) => {
        if (seg.driverId) assignedDriversSet.add(seg.driverId);
      });
    }
  });
  const assignedDriversCount = assignedDriversSet.size;

  // Unassigned Trips: Trips not associated with any duty
  const assignedTripIds = new Set<string>();
  dutiesList.forEach((d) => {
    if (d.trips) {
      d.trips.forEach((t: any) => assignedTripIds.add(t.id));
    }
  });
  const unassignedTrips = tripsList.filter((t) => !assignedTripIds.has(t.id));
  const unassignedTripsCount = unassignedTrips.length;

  // Validation Issues count (sum of issues across all duties)
  let totalValidationIssues = 0;
  Object.values(dutyValidations).forEach((v) => {
    totalValidationIssues += v.issues.length;
  });

  const loading = tripsLoading || dutiesLoading;

  return (
    <AppShell
      title="Today's Operations"
      subtitle={`Live schedule monitoring, duty board, and dispatcher statistics for ${SERVICE_DATE}.`}
      actions={
        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="outline">
            <Link to="/operations/incidents">Disruption Manager</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/operations/duties">Open Duty Builder</Link>
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* 1. Metrics summary */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <Tile icon={CalendarClock} label="Today's Trips" value={loading ? "..." : totalTrips} hint="scheduled runs" />
          <Tile icon={ListTodo} label="Active Duties" value={loading ? "..." : totalDuties} hint="work blocks" />
          <Tile icon={BusIcon} label="Buses Dispatched" value={loading ? "..." : assignedBuses} hint="vehicles on road" />
          <Tile icon={Users} label="Crew Dispatched" value={loading ? "..." : assignedDriversCount} hint="drivers & conductors" />
          <Tile
            icon={FileText}
            label="Unassigned Trips"
            value={loading ? "..." : unassignedTripsCount}
            hint="needs duty binding"
            alert={unassignedTripsCount > 0}
          />
          <Tile
            icon={AlertTriangle}
            label="Validation Issues"
            value={loading ? "..." : totalValidationIssues}
            hint="conflict check"
            alert={totalValidationIssues > 0}
            isDestructive={totalValidationIssues > 0}
          />
        </div>

        {/* 2. Main Dashboard Section */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Active Duties Feed */}
          <section className="panel p-4 lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <ListTodo className="size-4 text-primary" /> Active Duties Board
              </h3>
              <Badge variant="outline" className="text-[10px] font-mono">
                {dutiesList.length} Active
              </Badge>
            </div>

            {loading ? (
              <div className="py-20 text-center text-xs text-muted-foreground">Loading operational duties...</div>
            ) : dutiesList.length === 0 ? (
              <div className="py-20 text-center text-xs text-muted-foreground">No duties constructed for today.</div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {dutiesList.map((d) => {
                  const val = dutyValidations[d.id] || { isValid: true, issues: [] };
                  return (
                    <div key={d.id} className="p-3 border rounded-lg bg-background/50 hover:bg-background/80 transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-foreground">{d.dutyCode}</span>
                          <Badge variant="outline" className="text-[9px] uppercase h-5 py-0 px-1">
                            {d.dutyType}
                          </Badge>
                          <Badge variant={d.status === "published" ? "default" : "secondary"} className="text-[9px] uppercase h-5 py-0 px-1">
                            {d.status}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-0.5">
                          <p>Span: <b>{formatMinutesToTime(d.startTime)} - {formatMinutesToTime(d.endTime)}</b></p>
                          <p>Bus: <b>{d.busRegNumber || "Unassigned"}</b></p>
                          {d.dutyType === "LINKED" ? (
                            <p>Crew: <b>{d.driverName} / {d.conductorName}</b></p>
                          ) : (
                            <p>Handovers: <b>{d.crewSegments?.length || 0} segments</b></p>
                          )}
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-end gap-2 shrink-0">
                        {val.isValid ? (
                          <span className="flex items-center gap-1.5 text-xs text-success font-medium">
                            <CheckCircle2 className="size-4 shrink-0" /> Valid
                          </span>
                        ) : (
                          <div className="text-right">
                            <span className="flex items-center gap-1.5 text-xs text-destructive font-medium justify-end">
                              <AlertTriangle className="size-4 shrink-0" /> Conflicts ({val.issues.length})
                            </span>
                            <p className="text-[10px] text-destructive/80 font-normal mt-0.5 max-w-[200px] truncate">
                              {val.issues[0]}
                            </p>
                          </div>
                        )}
                        <Button variant="ghost" size="xs" asChild className="h-7 text-xs">
                          <Link to="/operations/duties">Edit Duty <ArrowRight className="size-3 ml-1" /></Link>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Right Column Side Panels */}
          <div className="space-y-6">
            {/* Live Disruption Log */}
            <section className="panel p-4 space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <AlertTriangle className="size-4 text-destructive shrink-0" /> Live Disruption Log
                </h3>
                <Badge variant="outline" className="text-[10px] font-mono bg-destructive/5 text-destructive border-destructive/20">
                  {incidentsList.filter(i => i.status !== "RESOLVED" && i.status !== "CANCELLED").length} Active
                </Badge>
              </div>

              {incidentsList.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground italic bg-secondary/5 border border-dashed rounded">
                  No active service disruptions reported.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {incidentsList.map((inc) => (
                    <div key={inc.id} className="p-3 border rounded bg-background/50 hover:bg-background flex flex-col gap-1 text-xs">
                      <div className="flex justify-between items-center">
                        <Badge variant="outline" className="text-[9px] font-bold text-destructive bg-destructive/5 uppercase">
                          {inc.type.replace("_", " ")}
                        </Badge>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {new Date(inc.reportedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="font-semibold text-foreground mt-0.5">{inc.description || "Disruption incident reported."}</p>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-[10px] text-muted-foreground">Status: <b>{inc.status}</b></span>
                        <Button variant="ghost" size="xs" asChild className="h-6 text-[10px] px-1.5">
                          <Link to="/operations/incidents">Manage Recovery <ArrowRight className="size-3 ml-1" /></Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Unassigned Trips List */}
            <section className="panel p-4 space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <AlertTriangle className="size-4 text-warning shrink-0" /> Unassigned Trips
                </h3>
                <Badge variant="outline" className="text-[10px] font-mono bg-warning/5 text-warning border-warning/20">
                  {unassignedTripsCount} Left
                </Badge>
              </div>

              {loading ? (
                <div className="py-20 text-center text-xs text-muted-foreground">Loading unassigned trips...</div>
              ) : unassignedTripsCount === 0 ? (
                <div className="py-12 text-center text-xs text-success font-medium bg-success/5 border border-success/10 rounded-md">
                  <CheckCircle2 className="size-5 text-success mx-auto mb-2" />
                  All trips assigned to duties!
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {unassignedTrips.map((t) => (
                    <div key={t.id} className="p-2.5 border rounded bg-secondary/10 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-foreground">{t.tripCode}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{t.routeCode} ({t.origin} → {t.destination})</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-semibold text-primary">{formatMinutesToTime(t.startTime)}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{t.durationMin} mins</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Tile({
  icon: Icon,
  label,
  value,
  hint,
  alert = false,
  isDestructive = false,
}: {
  icon: any;
  label: string;
  value: string | number;
  hint: string;
  alert?: boolean;
  isDestructive?: boolean;
}) {
  return (
    <div className={`panel p-4 flex flex-col justify-between border-l-4 ${
      isDestructive
        ? "border-l-destructive bg-destructive/5"
        : alert
        ? "border-l-warning bg-warning/5"
        : "border-l-primary"
    }`}>
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-[10px] font-semibold uppercase tracking-wider">{label}</span>
        <Icon className="size-4 shrink-0" />
      </div>
      <div className="mt-2.5">
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{hint}</p>
      </div>
    </div>
  );
}
