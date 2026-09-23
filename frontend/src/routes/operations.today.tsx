import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
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
  Clock,
  Radio,
  Sparkles,
  Zap,
  TrendingUp,
  ShieldCheck,
  Filter,
  RefreshCw,
  Eye,
  AlertOctagon,
  ArrowUpRight,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { hasPermission } from "@/lib/auth-shared";
import { getTrips, getDuties, validateDuty } from "@/lib/scheduling-fns";
import { getIncidents } from "@/lib/rescheduling-fns";
import { cn, formatMinutesToTime } from "@/lib/utils";

export const Route = createFileRoute("/operations/today")({
  beforeLoad: ({ context }) => {
    if (!context.user || !hasPermission(context.user.role, "schedule.view")) {
      throw new Error("Forbidden");
    }
  },
  head: () => ({
    meta: [
      { title: "Today's Operations — TransitOS" },
      { name: "description", content: "Live operational duty board, fleet telemetry, and dispatch monitoring." },
    ],
  }),
  component: OperationsTodayPage,
});

const SERVICE_DATE = "25 Aug 2026";

function OperationsTodayPage() {
  const [filterTab, setFilterTab] = useState<"all" | "active" | "issues">("all");

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
        } catch {
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

  // Assigned Drivers/Crew count
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

  // Unassigned Trips
  const assignedTripIds = new Set<string>();
  dutiesList.forEach((d) => {
    if (d.trips) {
      d.trips.forEach((t: any) => assignedTripIds.add(t.id));
    }
  });
  const unassignedTrips = tripsList.filter((t) => !assignedTripIds.has(t.id));
  const unassignedTripsCount = unassignedTrips.length;

  // Validation Issues count
  let totalValidationIssues = 0;
  Object.values(dutyValidations).forEach((v) => {
    totalValidationIssues += v.issues.length;
  });

  const loading = tripsLoading || dutiesLoading;

  // Filter duties
  const filteredDuties = dutiesList.filter((d) => {
    if (filterTab === "issues") {
      const val = dutyValidations[d.id];
      return val && !val.isValid;
    }
    if (filterTab === "active") {
      return d.status === "published" || d.status === "assigned";
    }
    return true;
  });

  return (
    <AppShell
      title="Active Operations Board"
      subtitle={`Real-time dispatch board, crew shift trackers, and corridor service compliance for ${SERVICE_DATE}.`}
      actions={
        <div className="flex items-center gap-2.5">
          <Button asChild size="sm" variant="outline" className="text-xs h-8 border-border/80 bg-card/60">
            <Link to="/operations/incidents">
              <AlertTriangle className="size-3.5 mr-1.5 text-warning" />
              Disruptions ({incidentsList.length})
            </Link>
          </Button>
          <Button asChild size="sm" className="text-xs h-8 bg-primary text-primary-foreground font-semibold shadow-md shadow-primary/20">
            <Link to="/operations/duties">
              <Sparkles className="size-3.5 mr-1.5" />
              Duty Studio
            </Link>
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* 1. TELEMETRY STATS GRID */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <MetricTile
            icon={CalendarClock}
            label="Service Trips"
            value={loading ? "..." : totalTrips}
            badge="Scheduled"
            badgeColor="bg-primary/10 text-primary border-primary/20"
          />
          <MetricTile
            icon={ListTodo}
            label="Active Duties"
            value={loading ? "..." : totalDuties}
            badge="On Roster"
            badgeColor="bg-secondary text-secondary-foreground"
          />
          <MetricTile
            icon={BusIcon}
            label="Dispatched Buses"
            value={loading ? "..." : assignedBuses}
            badge="On Road"
            badgeColor="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
          />
          <MetricTile
            icon={Users}
            label="Active Crew"
            value={loading ? "..." : assignedDriversCount}
            badge="On Shift"
            badgeColor="bg-info/10 text-info border-info/20"
          />
          <MetricTile
            icon={FileText}
            label="Unassigned Trips"
            value={loading ? "..." : unassignedTripsCount}
            badge={unassignedTripsCount > 0 ? "Pending" : "Complete"}
            badgeColor={unassignedTripsCount > 0 ? "bg-warning/10 text-warning border-warning/30" : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"}
          />
          <MetricTile
            icon={AlertTriangle}
            label="Compliance Alerts"
            value={loading ? "..." : totalValidationIssues}
            badge={totalValidationIssues > 0 ? "Action Req" : "Compliant"}
            badgeColor={totalValidationIssues > 0 ? "bg-destructive/10 text-destructive border-destructive/30" : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"}
            isDestructive={totalValidationIssues > 0}
          />
        </div>

        {/* 2. MAIN SPLIT SECTION: DUTIES BOARD & LIVE INCIDENTS RADAR */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Active Duties Feed */}
          <section className="glass-panel p-5 lg:col-span-8 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary">
                  <ListTodo className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight text-foreground">Live Duty Dispatch Board</h3>
                  <p className="text-[11px] text-muted-foreground">Monitors departure blocks, driver sign-ons, and vehicle assignments</p>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center rounded-lg border border-border/70 p-0.5 bg-secondary/30">
                <button
                  type="button"
                  onClick={() => setFilterTab("all")}
                  className={cn(
                    "px-2.5 py-1 text-xs font-semibold rounded-md transition-all",
                    filterTab === "all" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  All ({dutiesList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTab("active")}
                  className={cn(
                    "px-2.5 py-1 text-xs font-semibold rounded-md transition-all",
                    filterTab === "active" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Published
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTab("issues")}
                  className={cn(
                    "px-2.5 py-1 text-xs font-semibold rounded-md transition-all",
                    filterTab === "issues" ? "bg-destructive/15 text-destructive shadow-xs" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Alerts ({totalValidationIssues})
                </button>
              </div>
            </div>

            {loading ? (
              <div className="py-24 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
                <RefreshCw className="size-5 animate-spin text-primary" />
                <span>Synchronizing operational duty states...</span>
              </div>
            ) : filteredDuties.length === 0 ? (
              <div className="py-20 text-center text-xs text-muted-foreground flex flex-col items-center justify-center">
                <CalendarClock className="size-8 text-muted-foreground/50 mb-2" />
                <p className="font-semibold text-foreground">No duties matching current filter</p>
                <p className="text-[11px] text-muted-foreground mt-1">Switch filter or open Duty Builder to schedule duties.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
                {filteredDuties.map((d) => {
                  const val = dutyValidations[d.id] || { isValid: true, issues: [] };
                  const tripCount = d.trips?.length || 0;

                  return (
                    <div
                      key={d.id}
                      className={cn(
                        "p-4 rounded-xl border transition-all duration-150 flex flex-col gap-3 bg-card/60 hover:border-primary/40",
                        !val.isValid ? "border-destructive/40 bg-destructive/5" : "border-border/70"
                      )}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono font-bold text-sm text-foreground">{d.dutyCode}</span>
                          <Badge variant="outline" className="font-mono text-[10px] uppercase font-semibold">
                            {d.dutyType}
                          </Badge>
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-[10px] font-bold uppercase",
                              d.status === "published" ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : ""
                            )}
                          >
                            {d.status}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-3 text-xs">
                          <span className="font-mono font-semibold text-foreground flex items-center gap-1">
                            <Clock className="size-3 text-primary" />
                            {formatMinutesToTime(d.startTime)} – {formatMinutesToTime(d.endTime)}
                          </span>
                          <Button asChild size="sm" variant="ghost" className="h-7 text-xs px-2 text-primary hover:bg-primary/10">
                            <Link to="/operations/duties">
                              Edit <ArrowUpRight className="size-3 ml-0.5" />
                            </Link>
                          </Button>
                        </div>
                      </div>

                      {/* Bus and Crew summary */}
                      <div className="grid gap-2 sm:grid-cols-2 text-xs pt-1 border-t border-border/40">
                        <div className="flex items-center gap-2">
                          <div className="size-6 rounded-md bg-secondary flex items-center justify-center text-muted-foreground">
                            <BusIcon className="size-3.5" />
                          </div>
                          <div>
                            <span className="text-[10px] uppercase text-muted-foreground font-semibold">Vehicle:</span>
                            <p className="font-mono font-bold text-foreground text-xs">{d.busRegNumber || "Unassigned"}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="size-6 rounded-md bg-secondary flex items-center justify-center text-muted-foreground">
                            <Users className="size-3.5" />
                          </div>
                          <div>
                            <span className="text-[10px] uppercase text-muted-foreground font-semibold">Rostered Crew:</span>
                            <p className="font-medium text-foreground text-xs">
                              {d.driverName ? `${d.driverName} (D)` : "No Driver"}
                              {d.conductorName ? ` · ${d.conductorName} (C)` : ""}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Trips Progress Bar */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex justify-between text-[11px] text-muted-foreground">
                          <span>Trips Progress: <strong>{tripCount} corridor departures</strong></span>
                          <span className="font-mono text-primary font-semibold">100% Scheduled</span>
                        </div>
                        <Progress value={100} className="h-1.5 bg-secondary" />
                      </div>

                      {/* Issues Alert if any */}
                      {!val.isValid ? (
                        <div className="p-2 rounded-lg bg-destructive/10 text-destructive text-[11px] flex items-center gap-2">
                          <AlertTriangle className="size-3.5 shrink-0" />
                          <span>{val.issues[0] || "Duty rule conflict detected"}</span>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* RIGHT RADAR: LIVE DISRUPTIONS & ACTIONS */}
          <section className="glass-panel p-5 lg:col-span-4 space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <div className="grid size-7 place-items-center rounded-lg bg-warning/10 text-warning">
                    <Radio className="size-4 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold tracking-tight text-foreground">Disruption Radar</h3>
                    <p className="text-[11px] text-muted-foreground">Real-time incident feed</p>
                  </div>
                </div>
                <Badge variant="outline" className="border-warning/30 text-warning bg-warning/5 text-xs font-mono">
                  {incidentsList.length} Logged
                </Badge>
              </div>

              {incidentsList.length === 0 ? (
                <div className="p-6 rounded-xl border border-dashed border-border/70 text-center text-xs text-muted-foreground bg-background/30">
                  <CheckCircle2 className="size-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                  <p className="font-semibold text-foreground">Zero Active Disruptions</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">All scheduled corridors operating within normal headway bounds.</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {incidentsList.map((inc: any) => (
                    <div
                      key={inc.id}
                      className="p-3 rounded-lg border border-border/70 bg-card/60 text-xs space-y-1.5 hover:border-warning/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground font-mono text-xs">{inc.type}</span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[9px] uppercase font-mono font-bold",
                            inc.severity === "critical"
                              ? "border-destructive/40 text-destructive bg-destructive/5"
                              : "border-warning/40 text-warning bg-warning/5"
                          )}
                        >
                          {inc.severity}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-tight">
                        {inc.description || "Operational disruption reported on vehicle/crew."}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/40 font-mono">
                        <span>Time: {formatMinutesToTime(inc.startTime)}</span>
                        <Link to="/operations/incidents" className="text-primary font-bold hover:underline">
                          Inspect ➔
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Dispatch Action Box */}
            <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-primary">
                <Zap className="size-4" />
                <span>Dispatcher Quick Access</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Need to re-route or generate algorithmic recovery proposals? Access the Disruption Recovery Engine.
              </p>
              <Button asChild size="sm" className="w-full text-xs font-semibold bg-primary text-primary-foreground">
                <Link to="/operations/incidents">Open Disruption Recovery</Link>
              </Button>
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}

function MetricTile({
  icon: Icon,
  label,
  value,
  badge,
  badgeColor,
  isDestructive,
}: {
  icon: any;
  label: string;
  value: string | number;
  badge?: string;
  badgeColor?: string;
  isDestructive?: boolean;
}) {
  return (
    <div
      className={cn(
        "glass-card p-4 rounded-xl border flex flex-col justify-between transition-all",
        isDestructive ? "border-destructive/40 bg-destructive/5" : "border-border/70"
      )}
    >
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
        <Icon className={cn("size-4", isDestructive ? "text-destructive" : "text-primary")} />
      </div>

      <div className="mt-2 flex items-baseline justify-between">
        <span className={cn("text-2xl font-bold font-mono", isDestructive ? "text-destructive" : "text-foreground")}>
          {value}
        </span>
        {badge ? (
          <span className={cn("rounded-full border px-1.5 py-0.2 text-[9px] font-mono font-bold", badgeColor)}>
            {badge}
          </span>
        ) : null}
      </div>
    </div>
  );
}
