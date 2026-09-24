import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarClock,
  User,
  ShieldAlert,
  CheckCircle,
  Clock,
  Users,
  ShieldCheck,
  Zap,
  Activity,
  Layers,
  Sparkles,
  Info,
  Search,
  Building2,
  Filter,
  RefreshCw,
} from "lucide-react";
import { useState, useMemo } from "react";

import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { hasPermission } from "@/lib/auth-shared";
import { getCrewAvailability } from "@/lib/fleet-crew";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/crew/availability")({
  beforeLoad: ({ context }) => {
    if (!context.user || !hasPermission(context.user.role, "crew.view")) {
      throw new Error("Forbidden");
    }
  },
  head: () => ({
    meta: [
      { title: "Crew Availability Matrix — TransitOS" },
      { name: "description", content: "Visual crew availability, shift waves and rest timelines." },
    ],
  }),
  component: CrewAvailabilityPage,
});

interface HourStatus {
  status: "available" | "resting" | "on-duty" | "leave" | "unavailable" | "off-duty";
  label: string;
  shortCode: string;
}

function getHourStatus(member: any, hour: number): HourStatus {
  const currentMinutes = hour * 60;
  const availableFrom = member.availableFrom ?? member.available_from ?? 330;
  const restUntil = member.restUntil ?? member.rest_until ?? 330;
  const status = (member.status || "available").toLowerCase();

  if (status === "leave") {
    return { status: "leave", label: "Approved Leave", shortCode: "L" };
  }
  if (status === "unavailable") {
    return { status: "unavailable", label: "Unavailable / Suspended", shortCode: "U" };
  }

  // Mandatory post-duty recovery / rest
  if (status === "resting") {
    if (currentMinutes < restUntil) {
      return { status: "resting", label: "Mandatory Rest (MVA 8-Hour Rule)", shortCode: "R" };
    }
  }

  // Active route shift assignment
  if (status === "on-duty" || status === "assigned") {
    // Active scheduled duty shift typically spans 8 hours from shift start
    if (currentMinutes >= availableFrom && currentMinutes < availableFrom + 480) {
      return { status: "on-duty", label: "On Duty (Route Shift Assigned)", shortCode: "D" };
    }
    if (currentMinutes >= availableFrom + 480) {
      return { status: "resting", label: "Mandatory Post-Shift Rest", shortCode: "R" };
    }
  }

  // Pre-shift off duty hours (e.g. before 05:30 AM)
  if (currentMinutes < availableFrom) {
    return { status: "off-duty", label: "Off Duty (Before Shift Call)", shortCode: "OFF" };
  }

  return { status: "available", label: "Available for Dispatch", shortCode: "A" };
}

function getHourColor(status: string) {
  switch (status) {
    case "available":
      return "bg-emerald-500/85 hover:bg-emerald-500 text-white font-semibold shadow-2xs";
    case "resting":
      return "bg-amber-500/85 hover:bg-amber-500 text-white font-semibold shadow-2xs";
    case "on-duty":
      return "bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-2xs";
    case "leave":
      return "bg-destructive/20 text-destructive border border-destructive/30";
    case "unavailable":
      return "bg-muted text-muted-foreground/60";
    case "off-duty":
      return "bg-secondary/40 text-muted-foreground/40";
    default:
      return "bg-background";
  }
}

const TIMELINE_HOURS = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];

const DEPOTS = [
  "All Depots",
  "Meyyanur Depot",
  "Johnsonpet Depot",
  "Hasthampatti Depot",
  "Steel Plant Depot",
];

function CrewAvailabilityPage() {
  const [roleFilter, setRoleFilter] = useState<"all" | "driver" | "conductor">("all");
  const [depotFilter, setDepotFilter] = useState<string>("All Depots");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const { data: crewList = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ["crew-availability"],
    queryFn: () => getCrewAvailability(),
  });

  // Filtered crew members
  const filteredCrew = useMemo(() => {
    return crewList.filter((c: any) => {
      // Role filter
      if (roleFilter !== "all" && c.role !== roleFilter) return false;

      // Depot filter
      if (depotFilter !== "All Depots" && c.depot !== depotFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = c.name?.toLowerCase().includes(q);
        const matchesEmpId = c.employeeId?.toLowerCase().includes(q) || c.employee_id?.toLowerCase().includes(q);
        const matchesDepot = c.depot?.toLowerCase().includes(q);
        if (!matchesName && !matchesEmpId && !matchesDepot) return false;
      }

      return true;
    });
  }, [crewList, roleFilter, depotFilter, searchQuery]);

  // Aggregate telemetry
  const totalCount = crewList.length;
  const availableCount = crewList.filter((c: any) => (c.status || "").toLowerCase() === "available").length;
  const onDutyCount = crewList.filter((c: any) => {
    const s = (c.status || "").toLowerCase();
    return s === "on-duty" || s === "assigned";
  }).length;
  const restingCount = crewList.filter((c: any) => (c.status || "").toLowerCase() === "resting").length;
  const leaveCount = crewList.filter((c: any) => {
    const s = (c.status || "").toLowerCase();
    return s === "leave" || s === "unavailable";
  }).length;

  return (
    <AppShell
      title="Crew Availability Matrix"
      subtitle="Visual 24-hour crew roster timeline, continuous driving constraints, and rest period compliance."
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="text-xs h-8 gap-1.5 cursor-pointer"
          >
            <RefreshCw className={cn("size-3.5", isFetching && "animate-spin")} />
            Sync Roster
          </Button>
          <Badge variant="outline" className="font-mono text-xs border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10">
            {availableCount} Available
          </Badge>
          <Badge variant="outline" className="font-mono text-xs border-primary/30 text-primary bg-primary/10">
            {onDutyCount} On Route
          </Badge>
        </div>
      }
    >
      <div className="space-y-6">
        {/* 1. METRICS OVERVIEW CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="glass-panel p-3.5 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total Crew</p>
              <p className="text-xl font-extrabold text-foreground mt-0.5">{totalCount}</p>
            </div>
            <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Users className="size-4" />
            </div>
          </div>

          <div className="glass-panel p-3.5 rounded-2xl flex items-center justify-between border-emerald-500/20 bg-emerald-500/5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Available</p>
              <p className="text-xl font-extrabold text-emerald-700 dark:text-emerald-300 mt-0.5">{availableCount}</p>
            </div>
            <div className="size-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle className="size-4" />
            </div>
          </div>

          <div className="glass-panel p-3.5 rounded-2xl flex items-center justify-between border-primary/20 bg-primary/5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">On Duty</p>
              <p className="text-xl font-extrabold text-primary mt-0.5">{onDutyCount}</p>
            </div>
            <div className="size-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
              <Zap className="size-4" />
            </div>
          </div>

          <div className="glass-panel p-3.5 rounded-2xl flex items-center justify-between border-amber-500/20 bg-amber-500/5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">Mandatory Rest</p>
              <p className="text-xl font-extrabold text-amber-700 dark:text-amber-300 mt-0.5">{restingCount}</p>
            </div>
            <div className="size-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="size-4" />
            </div>
          </div>

          <div className="glass-panel p-3.5 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Leave / Offline</p>
              <p className="text-xl font-extrabold text-foreground mt-0.5">{leaveCount}</p>
            </div>
            <div className="size-9 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center">
              <ShieldAlert className="size-4" />
            </div>
          </div>
        </div>

        {/* 2. FILTER & SEARCH CONTROL BAR */}
        <div className="glass-panel p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {/* Role Pills */}
            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl">
              <Button
                variant={roleFilter === "all" ? "default" : "ghost"}
                size="sm"
                onClick={() => setRoleFilter("all")}
                className="text-xs h-7 px-3 rounded-lg"
              >
                All ({crewList.length})
              </Button>
              <Button
                variant={roleFilter === "driver" ? "default" : "ghost"}
                size="sm"
                onClick={() => setRoleFilter("driver")}
                className="text-xs h-7 px-3 rounded-lg"
              >
                Drivers ({crewList.filter((c: any) => c.role === "driver").length})
              </Button>
              <Button
                variant={roleFilter === "conductor" ? "default" : "ghost"}
                size="sm"
                onClick={() => setRoleFilter("conductor")}
                className="text-xs h-7 px-3 rounded-lg"
              >
                Conductors ({crewList.filter((c: any) => c.role === "conductor").length})
              </Button>
            </div>

            {/* Depot Selector */}
            <div className="flex items-center gap-1.5 ml-2">
              <Building2 className="size-3.5 text-muted-foreground" />
              <select
                value={depotFilter}
                onChange={(e) => setDepotFilter(e.target.value)}
                className="text-xs h-8 rounded-lg bg-background border border-border/80 px-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                {DEPOTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Input */}
            <div className="relative w-48 sm:w-56 ml-1">
              <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search name, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-xs rounded-lg"
              />
            </div>
          </div>

          {/* Interactive Legend */}
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-emerald-500 shadow-2xs"></span> Available (A)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-primary shadow-2xs"></span> On Duty (D)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-amber-500 shadow-2xs"></span> Rest (R)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-destructive/60"></span> Leave (L)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-secondary/80"></span> Off Duty (OFF)
            </span>
          </div>
        </div>

        {/* 3. GANTT TIMELINE MATRIX */}
        <div className="glass-panel p-5 rounded-3xl overflow-x-auto">
          {isLoading ? (
            <div className="py-20 text-center space-y-2">
              <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto"></div>
              <p className="text-xs text-muted-foreground font-mono">Loading crew availability matrix...</p>
            </div>
          ) : filteredCrew.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <div className="size-12 rounded-2xl bg-muted/60 text-muted-foreground flex items-center justify-center mx-auto">
                <Users className="size-6" />
              </div>
              <p className="text-sm font-semibold text-foreground">No crew members found</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {searchQuery || depotFilter !== "All Depots"
                  ? "No crew matches your search query or depot filter. Try clearing your filters."
                  : "No crew members are currently registered in this organization."}
              </p>
              {(searchQuery || depotFilter !== "All Depots" || roleFilter !== "all") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setDepotFilter("All Depots");
                    setRoleFilter("all");
                  }}
                  className="text-xs h-8 cursor-pointer mt-2"
                >
                  Reset All Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="min-w-[1020px] space-y-3">
              {/* Hours Header Row */}
              <div className="grid grid-cols-[240px_1fr] items-center text-xs font-bold text-muted-foreground border-b border-border/60 pb-3">
                <div className="text-[11px] font-mono uppercase tracking-wider pl-2">Crew Member / Role</div>
                <div
                  className="grid gap-1.5 text-center"
                  style={{ gridTemplateColumns: `repeat(${TIMELINE_HOURS.length}, minmax(0, 1fr))` }}
                >
                  {TIMELINE_HOURS.map((h) => (
                    <div key={h} className="font-mono text-[11px] bg-muted/30 py-1 rounded-md">
                      {String(h).padStart(2, "0")}:00
                    </div>
                  ))}
                </div>
              </div>

              {/* Crew Rows */}
              <div className="space-y-1.5 divide-y divide-border/20">
                {filteredCrew.map((member: any) => {
                  const empId = member.employeeId || member.employee_id;
                  const depot = member.depot || "Meyyanur Depot";
                  const isDriver = member.role === "driver";

                  return (
                    <div
                      key={member.id}
                      className="grid grid-cols-[240px_1fr] items-center pt-2 hover:bg-muted/40 p-2 rounded-xl transition-all"
                    >
                      <div className="pr-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-foreground truncate">{member.name}</span>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[9px] uppercase font-mono px-1 py-0",
                              isDriver
                                ? "border-primary/40 text-primary bg-primary/5"
                                : "border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/5"
                            )}
                          >
                            {isDriver ? "DRV" : "CND"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-muted-foreground font-mono">{empId}</span>
                          <span className="text-[10px] text-muted-foreground/60">•</span>
                          <span className="text-[10px] text-muted-foreground truncate">{depot}</span>
                        </div>
                      </div>

                      {/* Hour Blocks */}
                      <div
                        className="grid gap-1.5"
                        style={{ gridTemplateColumns: `repeat(${TIMELINE_HOURS.length}, minmax(0, 1fr))` }}
                      >
                        {TIMELINE_HOURS.map((hour) => {
                          const { status, label, shortCode } = getHourStatus(member, hour);
                          return (
                            <div
                              key={hour}
                              title={`${member.name} (${String(hour).padStart(2, "0")}:00 - ${String(hour + 1).padStart(2, "0")}:00)\nStatus: ${label}\nDepot: ${depot}`}
                              className={cn(
                                "h-8 rounded-lg text-[10px] font-mono font-bold flex items-center justify-center transition-all cursor-pointer select-none hover:scale-105 active:scale-95",
                                getHourColor(status)
                              )}
                            >
                              {shortCode}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

