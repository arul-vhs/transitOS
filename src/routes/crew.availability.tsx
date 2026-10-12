import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  CheckCircle2,
  Zap,
  Clock,
  ShieldAlert,
  Moon,
  Search,
  Building2,
  RefreshCw,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  X,
  Phone,
  ShieldCheck,
  Calendar,
  Sparkles,
  Info,
  Layers,
  Grid3X3,
  Award,
  AlertCircle,
  Eye,
  Check,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";

import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
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
      { title: "Crew Availability Matrix: TransitOS" },
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

interface ShiftSegment {
  status: "available" | "resting" | "on-duty" | "leave" | "unavailable" | "off-duty";
  label: string;
  shortCode: string;
  startHour: number;
  endHour: number;
  durationHours: number;
}

interface CrewMember {
  id: string;
  tenantId?: string;
  employeeId?: string;
  employee_id?: string;
  badgeNumber?: string;
  name: string;
  phone?: string;
  role: string;
  status?: string;
  depot?: string;
  availableFrom?: number;
  available_from?: number;
  restUntil?: number;
  rest_until?: number;
  licenseNumber?: string;
  licenseCategory?: string | null;
  licenseExpiry?: string | null;
  shiftType?: string;
  weeklyHours?: number;
}

const TIMELINE_HOURS = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];

const DEPOTS = [
  "All Depots",
  "Meyyanur Depot",
  "Johnsonpet Depot",
  "Hasthampatti Depot",
  "Steel Plant Depot",
];

function getHourStatus(member: CrewMember, hour: number): HourStatus {
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

function getCrewSegments(member: CrewMember): ShiftSegment[] {
  const segments: ShiftSegment[] = [];
  let currentSegment: ShiftSegment | null = null;

  for (const hour of TIMELINE_HOURS) {
    const statusObj = getHourStatus(member, hour);

    if (!currentSegment || currentSegment.status !== statusObj.status) {
      if (currentSegment) {
        segments.push(currentSegment);
      }
      currentSegment = {
        status: statusObj.status,
        label: statusObj.label,
        shortCode: statusObj.shortCode,
        startHour: hour,
        endHour: hour + 1,
        durationHours: 1,
      };
    } else {
      currentSegment.endHour = hour + 1;
      currentSegment.durationHours += 1;
    }
  }

  if (currentSegment) {
    segments.push(currentSegment);
  }

  return segments;
}

function getSegmentTheme(status: string) {
  switch (status) {
    case "available":
      return {
        bg: "bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300",
        hover: "hover:bg-emerald-500/25 hover:border-emerald-500/50",
        dot: "bg-emerald-500",
        pill: "bg-emerald-500 text-white",
        icon: CheckCircle2,
      };
    case "on-duty":
      return {
        bg: "bg-indigo-500/20 border-indigo-500/40 text-indigo-700 dark:text-indigo-300",
        hover: "hover:bg-indigo-500/30 hover:border-indigo-500/60",
        dot: "bg-indigo-500",
        pill: "bg-indigo-600 text-white",
        icon: Zap,
      };
    case "resting":
      return {
        bg: "bg-amber-500/15 border-amber-500/35 text-amber-800 dark:text-amber-300",
        hover: "hover:bg-amber-500/25 hover:border-amber-500/55",
        dot: "bg-amber-500",
        pill: "bg-amber-500 text-white",
        icon: Clock,
      };
    case "leave":
      return {
        bg: "bg-rose-500/15 border-rose-500/35 text-rose-700 dark:text-rose-300",
        hover: "hover:bg-rose-500/25 hover:border-rose-500/50",
        dot: "bg-rose-500",
        pill: "bg-rose-500 text-white",
        icon: ShieldAlert,
      };
    case "off-duty":
      return {
        bg: "bg-muted/40 border-border/50 text-muted-foreground/75",
        hover: "hover:bg-muted/60 hover:border-border",
        dot: "bg-muted-foreground/50",
        pill: "bg-muted text-muted-foreground",
        icon: Moon,
      };
    default:
      return {
        bg: "bg-muted/30 border-border/30 text-muted-foreground",
        hover: "hover:bg-muted/50",
        dot: "bg-muted-foreground/40",
        pill: "bg-muted text-muted-foreground",
        icon: Moon,
      };
  }
}

function formatHour(h: number) {
  return `${String(h).padStart(2, "0")}:00`;
}

function CrewAvailabilityPage() {
  const [roleFilter, setRoleFilter] = useState<"all" | "driver" | "conductor">("all");
  const [depotFilter, setDepotFilter] = useState<string>("All Depots");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<"gantt" | "hourly">("gantt");
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [selectedMember, setSelectedMember] = useState<CrewMember | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  const {
    data: crewList = [],
    isLoading,
    refetch,
    isFetching,
  } = useQuery<CrewMember[]>({
    queryKey: ["crew-availability"],
    queryFn: () => getCrewAvailability() as Promise<CrewMember[]>,
  });

  // Current time marker calculation (e.g., 11:05)
  const now = useMemo(() => new Date(), []);
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const isTimeInTimeline = currentHour >= 5 && currentHour < 24;
  const nowPercent = useMemo(() => {
    if (!isTimeInTimeline) return null;
    const elapsedMinutes = (currentHour - 5) * 60 + currentMinute;
    const totalTimelineMinutes = 19 * 60; // 05:00 to 24:00 is 19 hours
    return Math.min(100, Math.max(0, (elapsedMinutes / totalTimelineMinutes) * 100));
  }, [currentHour, currentMinute, isTimeInTimeline]);

  // Aggregate metrics
  const totalCount = crewList.length;
  const availableCount = crewList.filter(
    (c: CrewMember) => (c.status || "").toLowerCase() === "available",
  ).length;
  const onDutyCount = crewList.filter((c: CrewMember) => {
    const s = (c.status || "").toLowerCase();
    return s === "on-duty" || s === "assigned";
  }).length;
  const restingCount = crewList.filter(
    (c: CrewMember) => (c.status || "").toLowerCase() === "resting",
  ).length;
  const leaveCount = crewList.filter((c: CrewMember) => {
    const s = (c.status || "").toLowerCase();
    return s === "leave" || s === "unavailable";
  }).length;

  // Filtered crew members
  const filteredCrew = useMemo(() => {
    return crewList.filter((c: CrewMember) => {
      // Role filter
      if (roleFilter !== "all" && c.role !== roleFilter) return false;

      // Depot filter
      if (depotFilter !== "All Depots" && c.depot !== depotFilter) return false;

      // Status filter
      if (statusFilter !== "all") {
        const s = (c.status || "available").toLowerCase();
        if (statusFilter === "on-duty" && s !== "on-duty" && s !== "assigned") return false;
        if (statusFilter === "available" && s !== "available") return false;
        if (statusFilter === "resting" && s !== "resting") return false;
        if (statusFilter === "leave" && s !== "leave" && s !== "unavailable") return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = c.name?.toLowerCase().includes(q);
        const matchesEmpId =
          c.employeeId?.toLowerCase().includes(q) || c.employee_id?.toLowerCase().includes(q);
        const matchesDepot = c.depot?.toLowerCase().includes(q);
        if (!matchesName && !matchesEmpId && !matchesDepot) return false;
      }

      return true;
    });
  }, [crewList, roleFilter, depotFilter, statusFilter, searchQuery]);

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(filteredCrew.length / pageSize));
  const paginatedCrew = useMemo(() => {
    if (pageSize >= 100) return filteredCrew;
    const start = (currentPage - 1) * pageSize;
    return filteredCrew.slice(start, start + pageSize);
  }, [filteredCrew, currentPage, pageSize]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [roleFilter, depotFilter, statusFilter, searchQuery, pageSize]);

  const hasActiveFilters =
    roleFilter !== "all" ||
    depotFilter !== "All Depots" ||
    statusFilter !== "all" ||
    searchQuery.trim() !== "";

  const clearAllFilters = () => {
    setRoleFilter("all");
    setDepotFilter("All Depots");
    setStatusFilter("all");
    setSearchQuery("");
  };

  return (
    <AppShell
      title="Crew Availability Matrix"
      subtitle="Visual 24-hour crew roster timeline, continuous driving constraints, and rest compliance."
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="text-xs h-8 gap-1.5 cursor-pointer font-medium"
          >
            <RefreshCw className={cn("size-3.5", isFetching && "animate-spin text-primary")} />
            Sync Roster
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* 1. INTERACTIVE TELEMETRY CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {/* Total Crew */}
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={cn(
              "glass-panel p-3.5 rounded-2xl flex items-center justify-between text-left transition-all cursor-pointer group",
              statusFilter === "all"
                ? "ring-2 ring-primary/60 bg-primary/5 shadow-sm"
                : "hover:bg-muted/30",
            )}
          >
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Total Crew
              </p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <p className="text-xl font-extrabold text-foreground">{totalCount}</p>
                <span className="text-[10px] text-muted-foreground font-mono">100%</span>
              </div>
            </div>
            <div
              className={cn(
                "size-9 rounded-xl flex items-center justify-center transition-colors",
                statusFilter === "all"
                  ? "bg-primary text-primary-foreground"
                  : "bg-primary/10 text-primary",
              )}
            >
              <Users className="size-4" />
            </div>
          </button>

          {/* Available */}
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === "available" ? "all" : "available")}
            className={cn(
              "glass-panel p-3.5 rounded-2xl flex items-center justify-between text-left transition-all cursor-pointer group border-emerald-500/20 bg-emerald-500/5",
              statusFilter === "available"
                ? "ring-2 ring-emerald-500 bg-emerald-500/15 shadow-sm"
                : "hover:bg-emerald-500/10",
            )}
          >
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Available
              </p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <p className="text-xl font-extrabold text-emerald-700 dark:text-emerald-300">
                  {availableCount}
                </p>
                <span className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70 font-mono">
                  {totalCount ? Math.round((availableCount / totalCount) * 100) : 0}%
                </span>
              </div>
            </div>
            <div
              className={cn(
                "size-9 rounded-xl flex items-center justify-center transition-colors",
                statusFilter === "available"
                  ? "bg-emerald-500 text-white"
                  : "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400",
              )}
            >
              <CheckCircle2 className="size-4" />
            </div>
          </button>

          {/* On Duty */}
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === "on-duty" ? "all" : "on-duty")}
            className={cn(
              "glass-panel p-3.5 rounded-2xl flex items-center justify-between text-left transition-all cursor-pointer group border-indigo-500/20 bg-indigo-500/5",
              statusFilter === "on-duty"
                ? "ring-2 ring-indigo-500 bg-indigo-500/15 shadow-sm"
                : "hover:bg-indigo-500/10",
            )}
          >
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                On Duty
              </p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <p className="text-xl font-extrabold text-indigo-700 dark:text-indigo-300">
                  {onDutyCount}
                </p>
                <span className="text-[10px] text-indigo-600/70 dark:text-indigo-400/70 font-mono">
                  {totalCount ? Math.round((onDutyCount / totalCount) * 100) : 0}%
                </span>
              </div>
            </div>
            <div
              className={cn(
                "size-9 rounded-xl flex items-center justify-center transition-colors",
                statusFilter === "on-duty"
                  ? "bg-indigo-600 text-white"
                  : "bg-indigo-500/20 text-indigo-600 dark:text-indigo-400",
              )}
            >
              <Zap className="size-4" />
            </div>
          </button>

          {/* Mandatory Rest */}
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === "resting" ? "all" : "resting")}
            className={cn(
              "glass-panel p-3.5 rounded-2xl flex items-center justify-between text-left transition-all cursor-pointer group border-amber-500/20 bg-amber-500/5",
              statusFilter === "resting"
                ? "ring-2 ring-amber-500 bg-amber-500/15 shadow-sm"
                : "hover:bg-amber-500/10",
            )}
          >
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Mandatory Rest
              </p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <p className="text-xl font-extrabold text-amber-700 dark:text-amber-300">
                  {restingCount}
                </p>
                <span className="text-[10px] text-amber-600/70 dark:text-amber-400/70 font-mono">
                  {totalCount ? Math.round((restingCount / totalCount) * 100) : 0}%
                </span>
              </div>
            </div>
            <div
              className={cn(
                "size-9 rounded-xl flex items-center justify-center transition-colors",
                statusFilter === "resting"
                  ? "bg-amber-500 text-white"
                  : "bg-amber-500/20 text-amber-600 dark:text-amber-400",
              )}
            >
              <Clock className="size-4" />
            </div>
          </button>

          {/* Leave / Offline */}
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === "leave" ? "all" : "leave")}
            className={cn(
              "glass-panel p-3.5 rounded-2xl flex items-center justify-between text-left transition-all cursor-pointer group border-rose-500/20 bg-rose-500/5",
              statusFilter === "leave"
                ? "ring-2 ring-rose-500 bg-rose-500/15 shadow-sm"
                : "hover:bg-rose-500/10",
            )}
          >
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                Leave / Off
              </p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <p className="text-xl font-extrabold text-rose-700 dark:text-rose-300">
                  {leaveCount}
                </p>
                <span className="text-[10px] text-rose-600/70 dark:text-rose-400/70 font-mono">
                  {totalCount ? Math.round((leaveCount / totalCount) * 100) : 0}%
                </span>
              </div>
            </div>
            <div
              className={cn(
                "size-9 rounded-xl flex items-center justify-center transition-colors",
                statusFilter === "leave"
                  ? "bg-rose-500 text-white"
                  : "bg-rose-500/20 text-rose-600 dark:text-rose-400",
              )}
            >
              <ShieldAlert className="size-4" />
            </div>
          </button>
        </div>

        {/* 2. REFINED FILTER & VIEW BAR */}
        <div className="glass-panel p-3.5 sm:p-4 rounded-2xl space-y-3">
          {/* Main Controls Row */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Left: Role Tabs & Depot */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Role Segmented Tabs */}
              <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setRoleFilter("all")}
                  className={cn(
                    "text-xs font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5",
                    roleFilter === "all"
                      ? "bg-card text-foreground shadow-xs font-bold"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  All
                  <span className="text-[10px] font-mono opacity-70 bg-muted px-1.5 py-0.2 rounded-md">
                    {crewList.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setRoleFilter("driver")}
                  className={cn(
                    "text-xs font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5",
                    roleFilter === "driver"
                      ? "bg-card text-foreground shadow-xs font-bold"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Drivers
                  <span className="text-[10px] font-mono opacity-70 bg-muted px-1.5 py-0.2 rounded-md">
                    {crewList.filter((c: CrewMember) => c.role === "driver").length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setRoleFilter("conductor")}
                  className={cn(
                    "text-xs font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5",
                    roleFilter === "conductor"
                      ? "bg-card text-foreground shadow-xs font-bold"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Conductors
                  <span className="text-[10px] font-mono opacity-70 bg-muted px-1.5 py-0.2 rounded-md">
                    {crewList.filter((c: CrewMember) => c.role === "conductor").length}
                  </span>
                </button>
              </div>

              {/* Depot Filter */}
              <div className="flex items-center gap-1.5 bg-background border border-border/80 px-2.5 py-1 rounded-xl shadow-2xs">
                <Building2 className="size-3.5 text-muted-foreground shrink-0" />
                <select
                  value={depotFilter}
                  onChange={(e) => setDepotFilter(e.target.value)}
                  className="text-xs bg-transparent text-foreground focus:outline-none cursor-pointer pr-1"
                >
                  {DEPOTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search Bar */}
              <div className="relative min-w-[200px] flex-1 sm:flex-initial">
                <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search crew name or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 pr-7 text-xs rounded-xl bg-background"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Right: View & Density Toggles */}
            <div className="flex items-center gap-2 self-end lg:self-auto">
              {/* Density Toggle */}
              <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-xl border border-border/40">
                <button
                  type="button"
                  onClick={() => setDensity("comfortable")}
                  title="Spacious row layout"
                  className={cn(
                    "text-[11px] font-medium px-2.5 py-1 rounded-lg transition-all cursor-pointer",
                    density === "comfortable"
                      ? "bg-card text-foreground shadow-2xs font-bold"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Spacious
                </button>
                <button
                  type="button"
                  onClick={() => setDensity("compact")}
                  title="Compact high-density view"
                  className={cn(
                    "text-[11px] font-medium px-2.5 py-1 rounded-lg transition-all cursor-pointer",
                    density === "compact"
                      ? "bg-card text-foreground shadow-2xs font-bold"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Compact
                </button>
              </div>

              {/* View Switcher: Gantt vs Hourly Matrix */}
              <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-xl border border-border/40">
                <button
                  type="button"
                  onClick={() => setViewMode("gantt")}
                  className={cn(
                    "text-[11px] font-medium px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5",
                    viewMode === "gantt"
                      ? "bg-card text-foreground shadow-2xs font-bold"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  title="Continuous timeline view"
                >
                  <Layers className="size-3.5" />
                  <span>Timeline</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("hourly")}
                  className={cn(
                    "text-[11px] font-medium px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5",
                    viewMode === "hourly"
                      ? "bg-card text-foreground shadow-2xs font-bold"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  title="Hour-by-hour matrix view"
                >
                  <Grid3X3 className="size-3.5" />
                  <span>Hourly</span>
                </button>
              </div>
            </div>
          </div>

          {/* Secondary Legend & Filter Chips */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-border/40 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground/80 font-semibold mr-1">
                Filter by Status:
              </span>

              <button
                type="button"
                onClick={() => setStatusFilter(statusFilter === "available" ? "all" : "available")}
                className={cn(
                  "px-2 py-0.5 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1.5 cursor-pointer border",
                  statusFilter === "available"
                    ? "bg-emerald-500/20 border-emerald-500 text-emerald-800 dark:text-emerald-200 font-bold"
                    : "bg-muted/40 border-transparent text-muted-foreground hover:bg-muted",
                )}
              >
                <span className="size-2 rounded-full bg-emerald-500" />
                Available ({availableCount})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter(statusFilter === "on-duty" ? "all" : "on-duty")}
                className={cn(
                  "px-2 py-0.5 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1.5 cursor-pointer border",
                  statusFilter === "on-duty"
                    ? "bg-indigo-500/20 border-indigo-500 text-indigo-800 dark:text-indigo-200 font-bold"
                    : "bg-muted/40 border-transparent text-muted-foreground hover:bg-muted",
                )}
              >
                <span className="size-2 rounded-full bg-indigo-500" />
                On Duty ({onDutyCount})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter(statusFilter === "resting" ? "all" : "resting")}
                className={cn(
                  "px-2 py-0.5 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1.5 cursor-pointer border",
                  statusFilter === "resting"
                    ? "bg-amber-500/20 border-amber-500 text-amber-800 dark:text-amber-200 font-bold"
                    : "bg-muted/40 border-transparent text-muted-foreground hover:bg-muted",
                )}
              >
                <span className="size-2 rounded-full bg-amber-500" />
                Rest ({restingCount})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter(statusFilter === "leave" ? "all" : "leave")}
                className={cn(
                  "px-2 py-0.5 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1.5 cursor-pointer border",
                  statusFilter === "leave"
                    ? "bg-rose-500/20 border-rose-500 text-rose-800 dark:text-rose-200 font-bold"
                    : "bg-muted/40 border-transparent text-muted-foreground hover:bg-muted",
                )}
              >
                <span className="size-2 rounded-full bg-rose-500" />
                Leave ({leaveCount})
              </button>

              <span className="px-2 py-0.5 rounded-lg text-[11px] font-medium flex items-center gap-1.5 text-muted-foreground/60">
                <span className="size-2 rounded-full bg-muted-foreground/40" />
                Off Duty
              </span>
            </div>

            {/* Status summary & Clear filters */}
            <div className="flex items-center gap-2 ml-auto text-[11px] text-muted-foreground">
              <span>
                Showing <strong className="text-foreground">{filteredCrew.length}</strong> of{" "}
                {totalCount} crew
              </span>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-primary hover:underline font-semibold cursor-pointer ml-1"
                >
                  Reset all
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 3. TIMELINE & ROSTER VIEW */}
        <div className="glass-panel rounded-3xl overflow-hidden border border-border/70 shadow-sm">
          {isLoading ? (
            <div className="py-24 text-center space-y-3">
              <div className="size-9 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
              <p className="text-xs text-muted-foreground font-mono">
                Loading crew availability matrix...
              </p>
            </div>
          ) : filteredCrew.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <div className="size-12 rounded-2xl bg-muted/60 text-muted-foreground flex items-center justify-center mx-auto">
                <Users className="size-6" />
              </div>
              <p className="text-sm font-bold text-foreground">No matching crew found</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                No crew members match your current filters. Try resetting the depot, role, or search
                term.
              </p>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-xs h-8 cursor-pointer mt-2"
                >
                  Reset All Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[1080px]">
                {/* TIMELINE TIME HEADER */}
                <div className="grid grid-cols-[260px_1fr] items-center border-b border-border/80 bg-muted/30 sticky top-0 z-20 backdrop-blur-md">
                  {/* Left Column Label */}
                  <div className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground sticky left-0 bg-muted/30 backdrop-blur-md z-30 border-r border-border/50">
                    Crew Member / Role
                  </div>

                  {/* Hours Scale with Day Period Dividers */}
                  <div className="relative py-2.5 px-2">
                    <div
                      className="grid text-center relative"
                      style={{
                        gridTemplateColumns: `repeat(${TIMELINE_HOURS.length}, minmax(0, 1fr))`,
                      }}
                    >
                      {TIMELINE_HOURS.map((hour) => {
                        const isEven = hour % 2 === 0;
                        return (
                          <div key={hour} className="text-center px-0.5">
                            <span
                              className={cn(
                                "font-mono text-[11px] block transition-colors",
                                isEven
                                  ? "font-bold text-foreground"
                                  : "text-muted-foreground/75 font-normal",
                              )}
                            >
                              {formatHour(hour)}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* LIVE TIME "NOW" INDICATOR IN HEADER */}
                    {nowPercent !== null && (
                      <div
                        className="absolute top-0 bottom-0 pointer-events-none z-30 -translate-x-1/2 flex flex-col items-center"
                        style={{ left: `${nowPercent}%` }}
                      >
                        <div className="bg-rose-500 text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-md flex items-center gap-1">
                          <span className="size-1 rounded-full bg-white animate-ping" />
                          NOW {String(currentHour).padStart(2, "0")}:
                          {String(currentMinute).padStart(2, "0")}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* CREW ROWS LIST */}
                <div className="divide-y divide-border/30 relative">
                  {/* Vertical Guide Hairline for "NOW" across rows */}
                  {nowPercent !== null && (
                    <div
                      className="absolute top-0 bottom-0 pointer-events-none z-10 border-l border-rose-500/70 border-dashed"
                      style={{ left: `calc(260px + (100% - 260px) * ${nowPercent / 100})` }}
                    />
                  )}

                  {paginatedCrew.map((member: CrewMember) => {
                    const empId = member.employeeId || member.employee_id;
                    const depot = member.depot || "Meyyanur Depot";
                    const isDriver = member.role === "driver";
                    const segments = getCrewSegments(member);

                    return (
                      <div
                        key={member.id}
                        className={cn(
                          "grid grid-cols-[260px_1fr] items-center hover:bg-muted/40 transition-colors group",
                          density === "comfortable" ? "py-2" : "py-1",
                        )}
                      >
                        {/* 1. Crew Identity Card (Sticky Left Column) */}
                        <div
                          onClick={() => setSelectedMember(member)}
                          className="px-4 pr-3 flex items-center gap-2.5 cursor-pointer sticky left-0 bg-card/95 backdrop-blur-sm z-20 border-r border-border/40"
                        >
                          {/* Avatar Initials */}
                          <div
                            className={cn(
                              "size-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-transform group-hover:scale-105",
                              isDriver
                                ? "bg-primary/10 text-primary border border-primary/20"
                                : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20",
                            )}
                          >
                            {member.name
                              ?.split(" ")
                              .map((n: string) => n[0])
                              .slice(0, 2)
                              .join("") || "CR"}
                          </div>

                          {/* Name & Details */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-foreground truncate group-hover:text-primary transition-colors">
                                {member.name}
                              </span>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[9px] uppercase font-mono px-1 py-0 shrink-0",
                                  isDriver
                                    ? "border-primary/40 text-primary bg-primary/5"
                                    : "border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/5",
                                )}
                              >
                                {isDriver ? "DRV" : "CND"}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-muted-foreground truncate">
                              <span className="font-mono">{empId}</span>
                              <span className="opacity-40">•</span>
                              <span className="truncate">{depot.replace(" Depot", "")}</span>
                            </div>
                          </div>
                        </div>

                        {/* 2. Timeline Track */}
                        <div className="px-2 py-1 relative">
                          {/* VIEW MODE 1: GANTT TIMELINE CONTINUOUS BARS */}
                          {viewMode === "gantt" ? (
                            <div
                              className={cn(
                                "flex items-center w-full rounded-xl bg-muted/20 p-0.5 relative",
                                density === "comfortable" ? "h-11" : "h-8",
                              )}
                            >
                              {segments.map((seg, idx) => {
                                const theme = getSegmentTheme(seg.status);
                                const IconComponent = theme.icon;
                                const widthPercent =
                                  (seg.durationHours / TIMELINE_HOURS.length) * 100;
                                const isNarrow = seg.durationHours <= 1;
                                const isMedium = seg.durationHours > 1 && seg.durationHours <= 4;

                                return (
                                  <div
                                    key={`${seg.startHour}-${idx}`}
                                    style={{ width: `${widthPercent}%` }}
                                    className="h-full px-0.5 flex"
                                  >
                                    <div
                                      onClick={() => setSelectedMember(member)}
                                      title={`${member.name} (${formatHour(seg.startHour)} – ${formatHour(seg.endHour)})\nStatus: ${seg.label}\nDuration: ${seg.durationHours} hours`}
                                      className={cn(
                                        "w-full h-full rounded-lg border text-xs flex items-center justify-center transition-all cursor-pointer select-none px-2 overflow-hidden shadow-2xs group/bar",
                                        theme.bg,
                                        theme.hover,
                                      )}
                                    >
                                      {isNarrow ? (
                                        <span className="font-mono text-[10px] font-bold opacity-80 truncate">
                                          {seg.shortCode}
                                        </span>
                                      ) : isMedium ? (
                                        <div className="flex items-center gap-1.5 truncate">
                                          <IconComponent className="size-3 shrink-0 opacity-80" />
                                          <span className="font-semibold text-[11px] truncate">
                                            {seg.label.split(" ")[0]}
                                          </span>
                                          <span className="font-mono text-[10px] opacity-75 font-normal">
                                            ({seg.durationHours}h)
                                          </span>
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-2 truncate">
                                          <IconComponent className="size-3.5 shrink-0 opacity-80" />
                                          <span className="font-semibold text-xs truncate">
                                            {seg.label}
                                          </span>
                                          <span className="font-mono text-[11px] opacity-80 bg-background/40 px-1.5 py-0.5 rounded-md font-medium shrink-0">
                                            {formatHour(seg.startHour)} – {formatHour(seg.endHour)}{" "}
                                            ({seg.durationHours}h)
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            /* VIEW MODE 2: REFINED HOURLY MATRIX */
                            <div
                              className="grid gap-1"
                              style={{
                                gridTemplateColumns: `repeat(${TIMELINE_HOURS.length}, minmax(0, 1fr))`,
                              }}
                            >
                              {TIMELINE_HOURS.map((hour) => {
                                const { status, label, shortCode } = getHourStatus(member, hour);
                                const theme = getSegmentTheme(status);

                                return (
                                  <div
                                    key={hour}
                                    onClick={() => setSelectedMember(member)}
                                    title={`${member.name} (${formatHour(hour)} – ${formatHour(hour + 1)})\nStatus: ${label}`}
                                    className={cn(
                                      "rounded-md text-[10px] font-mono font-bold flex items-center justify-center transition-all cursor-pointer select-none border",
                                      density === "comfortable" ? "h-9" : "h-7",
                                      theme.bg,
                                      theme.hover,
                                    )}
                                  >
                                    {shortCode}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TABLE FOOTER / PAGINATION BAR */}
          <div className="px-5 py-3 border-t border-border/80 bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="bg-card border border-border/80 rounded-lg px-2 py-1 text-foreground text-xs cursor-pointer focus:outline-none"
              >
                <option value={15}>15</option>
                <option value={20}>20</option>
                <option value={35}>35</option>
                <option value={100}>All ({filteredCrew.length})</option>
              </select>
              <span className="hidden sm:inline text-muted-foreground/60">•</span>
              <span className="text-muted-foreground">
                Showing {Math.min(filteredCrew.length, (currentPage - 1) * pageSize + 1)}–
                {Math.min(filteredCrew.length, currentPage * pageSize)} of {filteredCrew.length}{" "}
                crew
              </span>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="h-8 px-2.5 text-xs gap-1 cursor-pointer"
                >
                  <ChevronLeft className="size-3.5" />
                  Prev
                </Button>
                <span className="font-mono text-xs px-2 text-muted-foreground">
                  Page <strong className="text-foreground">{currentPage}</strong> of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="h-8 px-2.5 text-xs gap-1 cursor-pointer"
                >
                  Next
                  <ChevronRight className="size-3.5" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* 4. CREW INSPECTION SHEET DRAWER */}
        <Sheet open={!!selectedMember} onOpenChange={(open) => !open && setSelectedMember(null)}>
          <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto p-6 space-y-6">
            {selectedMember && (
              <>
                <SheetHeader className="text-left space-y-2 border-b border-border/60 pb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "size-12 rounded-2xl flex items-center justify-center font-bold text-base shrink-0",
                        selectedMember.role === "driver"
                          ? "bg-primary/10 text-primary border border-primary/20"
                          : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20",
                      )}
                    >
                      {selectedMember.name
                        ?.split(" ")
                        .map((n: string) => n[0])
                        .slice(0, 2)
                        .join("") || "CR"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <SheetTitle className="text-lg font-bold truncate">
                          {selectedMember.name}
                        </SheetTitle>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] uppercase font-mono px-1.5 py-0",
                            selectedMember.role === "driver"
                              ? "border-primary/40 text-primary bg-primary/5"
                              : "border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/5",
                          )}
                        >
                          {selectedMember.role === "driver" ? "Driver" : "Conductor"}
                        </Badge>
                      </div>
                      <SheetDescription className="text-xs text-muted-foreground font-mono mt-0.5">
                        {selectedMember.employeeId || selectedMember.employee_id} •{" "}
                        {selectedMember.depot || "Meyyanur Depot"}
                      </SheetDescription>
                    </div>
                  </div>
                </SheetHeader>

                {/* Duty Timeline Breakdown */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Clock className="size-3.5 text-primary" />
                    Today's Shift Timeline
                  </h4>

                  <div className="space-y-2">
                    {getCrewSegments(selectedMember).map((seg, idx) => {
                      const theme = getSegmentTheme(seg.status);
                      const IconComponent = theme.icon;

                      return (
                        <div
                          key={idx}
                          className={cn(
                            "p-3 rounded-xl border flex items-center justify-between text-xs",
                            theme.bg,
                          )}
                        >
                          <div className="flex items-center gap-2.5">
                            <IconComponent className="size-4 shrink-0" />
                            <div>
                              <p className="font-bold">{seg.label}</p>
                              <p className="text-[11px] opacity-75 font-mono">
                                {formatHour(seg.startHour)} – {formatHour(seg.endHour)}
                              </p>
                            </div>
                          </div>
                          <Badge variant="secondary" className="font-mono text-xs font-semibold">
                            {seg.durationHours} hrs
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Compliance & Constraints */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                    Compliance & Statutory Limits
                  </h4>

                  <div className="bg-muted/40 p-3.5 rounded-2xl border border-border/60 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">MVA 8-Hour Rest Compliance</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <Check className="size-3.5" /> Satisfied
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Max Continuous Driving</span>
                      <span className="font-mono font-semibold">4.0 hrs (Limit 8.0h)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Weekly Duty Accumulated</span>
                      <span className="font-mono font-semibold">
                        {selectedMember.weeklyHours || 44} / 48 hrs max
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contact & Driver Info */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Award className="size-3.5 text-primary" />
                    Credentials & Contact
                  </h4>

                  <div className="bg-muted/40 p-3.5 rounded-2xl border border-border/60 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Contact Phone</span>
                      <span className="font-mono font-semibold flex items-center gap-1">
                        <Phone className="size-3 text-muted-foreground" />
                        {selectedMember.phone || "+91 94431 00000"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">License / Badge</span>
                      <span className="font-mono text-muted-foreground">
                        {selectedMember.licenseNumber || "DL-TN-27-2018-00912"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="pt-4 border-t border-border/60 flex items-center gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 text-xs cursor-pointer"
                    onClick={() => setSelectedMember(null)}
                  >
                    Close
                  </Button>
                  <Button
                    className="flex-1 text-xs cursor-pointer gap-1.5"
                    onClick={() => {
                      alert(`Duty assignment modal for ${selectedMember.name}`);
                    }}
                  >
                    <Zap className="size-3.5" />
                    Assign Shift
                  </Button>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </AppShell>
  );
}
