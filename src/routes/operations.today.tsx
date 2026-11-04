import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import {
  Bus,
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Wrench,
  ShieldAlert,
  Calendar,
  MapPin,
  Search,
  Check,
  AlertOctagon,
  ArrowRight,
  ShieldCheck,
  Filter,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { TransitTable, ColumnDef } from "@/components/ui/transit-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { hasPermission } from "@/lib/auth-shared";
import {
  getLiveTrackingAssignments,
  getFeasibleReplacements,
  resolveAssignmentConflict,
} from "@/lib/scheduling-fns";
import { cn, formatMinutesToTime } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/operations/today")({
  beforeLoad: ({ context }) => {
    if (!context.user || !hasPermission(context.user.role, "schedule.view")) {
      throw new Error("Forbidden");
    }
  },
  head: () => ({
    meta: [
      { title: "Live Tracking: TransitOS" },
      {
        name: "description",
        content:
          "Operational view of current bus, driver, and conductor assignments with conflict management.",
      },
    ],
  }),
  component: OperationsTodayPage,
});

const DEFAULT_SERVICE_DATE = "25 Aug 2026";

interface AssignmentConflict {
  id: string;
  tripId: string;
  tripCode: string;
  dutyId?: string | undefined;
  dutyCode?: string | undefined;
  type:
    | "BUS_OVERLAP"
    | "DRIVER_OVERLAP"
    | "CONDUCTOR_OVERLAP"
    | "BUS_UNAVAILABLE"
    | "DRIVER_UNAVAILABLE"
    | "CONDUCTOR_UNAVAILABLE"
    | "TIMING_INFEASIBLE";
  resourceType: "bus" | "driver" | "conductor" | "timing";
  resourceId?: string | undefined;
  resourceName: string;
  description: string;
  severity: "critical" | "warning";
  conflictingTripCode?: string | undefined;
  conflictingDutyCode?: string | undefined;
}

interface LiveTrackingAssignment {
  id: string;
  tripId: string;
  tripCode: string;
  routeId: string;
  routeCode: string;
  routeName: string;
  origin: string;
  destination: string;
  direction: string;
  startTime: number;
  endTime: number;
  durationMin: number;
  serviceDate: string;
  dutyId: string | null;
  dutyCode: string | null;
  busId: string | null;
  busRegNumber: string;
  busType: string;
  busStatus: string;
  busDepot: string;
  driverId: string | null;
  driverName: string;
  driverStatus: string;
  conductorId: string | null;
  conductorName: string;
  conductorStatus: string;
  status: "active" | "scheduled" | "conflicted" | "unassigned";
  conflicts: AssignmentConflict[];
}

function OperationsTodayPage() {
  const queryClient = useQueryClient();
  const [serviceDate] = useState(DEFAULT_SERVICE_DATE);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [routeFilter, setRouteFilter] = useState<string>("all");

  // Conflict Resolution Dialog state
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [selectedConflictTrip, setSelectedConflictTrip] =
    useState<LiveTrackingAssignment | null>(null);
  const [selectedReplacementType, setSelectedReplacementType] = useState<
    "bus" | "driver" | "conductor"
  >("bus");
  const [selectedReplacementId, setSelectedReplacementId] =
    useState<string>("");
  const [reassignmentReason, setReassignmentReason] = useState<string>("");

  // 1. Fetch Live Tracking Assignments & Conflicts
  const {
    data: liveData,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["live-tracking-assignments", serviceDate],
    queryFn: () => getLiveTrackingAssignments({ serviceDate }),
    refetchInterval: 30000,
  });

  const assignments = useMemo(
    () => liveData?.assignments || [],
    [liveData?.assignments],
  );
  const conflicts = useMemo(
    () => liveData?.conflicts || [],
    [liveData?.conflicts],
  );
  const summary = liveData?.summary || {
    totalTrips: assignments.length,
    activeAssignments: 0,
    conflictedAssignments: 0,
    unassignedTrips: 0,
    availableBuses: 0,
    availableDrivers: 0,
    availableConductors: 0,
  };

  // 2. Fetch Feasible Candidates when dialog is open
  const { data: candidatesData, isLoading: loadingCandidates } = useQuery({
    queryKey: [
      "feasible-replacements",
      selectedConflictTrip?.tripId,
      selectedReplacementType,
      serviceDate,
    ],
    queryFn: () => {
      if (!selectedConflictTrip) return null;
      return getFeasibleReplacements({
        tripId: selectedConflictTrip.tripId,
        replacementType: selectedReplacementType,
        serviceDate,
      });
    },
    enabled: resolveDialogOpen && Boolean(selectedConflictTrip),
  });

  const candidates = candidatesData?.candidates || [];
  const feasibleCandidates = candidates.filter((c) => c.isFeasible);
  const infeasibleCandidates = candidates.filter((c) => !c.isFeasible);

  // 3. Resolve Conflict Mutation
  const resolveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedConflictTrip || !selectedReplacementId) {
        throw new Error("Please select a valid replacement resource.");
      }
      return await resolveAssignmentConflict({
        tripId: selectedConflictTrip.tripId,
        dutyId: selectedConflictTrip.dutyId || undefined,
        replacementType: selectedReplacementType,
        replacementId: selectedReplacementId,
        reason:
          reassignmentReason ||
          "Resolved via Live Tracking operational dispatch",
      });
    },
    onSuccess: (res) => {
      toast.success(res.message || "Conflict resolved successfully.");
      queryClient.invalidateQueries({
        queryKey: ["live-tracking-assignments"],
      });
      setResolveDialogOpen(false);
      setSelectedConflictTrip(null);
      setSelectedReplacementId("");
      setReassignmentReason("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to resolve conflict.");
    },
  });

  // Handler to open conflict resolution dialog
  const handleOpenResolver = (
    assignment: LiveTrackingAssignment,
    preferredType?: "bus" | "driver" | "conductor",
  ) => {
    setSelectedConflictTrip(assignment);
    // Auto-detect conflict type if available
    if (preferredType) {
      setSelectedReplacementType(preferredType);
    } else if (assignment.conflicts.length > 0) {
      const first = assignment.conflicts[0]!;
      if (
        first.type === "BUS_OVERLAP" ||
        first.type === "BUS_UNAVAILABLE" ||
        (first.type === "TIMING_INFEASIBLE" && first.resourceType === "timing")
      ) {
        setSelectedReplacementType("bus");
      } else if (
        first.type === "DRIVER_OVERLAP" ||
        first.type === "DRIVER_UNAVAILABLE"
      ) {
        setSelectedReplacementType("driver");
      } else if (
        first.type === "CONDUCTOR_OVERLAP" ||
        first.type === "CONDUCTOR_UNAVAILABLE"
      ) {
        setSelectedReplacementType("conductor");
      } else {
        setSelectedReplacementType("bus");
      }
    } else {
      setSelectedReplacementType("bus");
    }
    setSelectedReplacementId("");
    setReassignmentReason("");
    setResolveDialogOpen(true);
  };

  // Distinct Route corridors for filter dropdown
  const routeOptions = useMemo(() => {
    const map = new Map<string, string>();
    assignments.forEach((a) => {
      if (a.routeCode && !map.has(a.routeCode)) {
        map.set(a.routeCode, `${a.routeCode}: ${a.routeName}`);
      }
    });
    return Array.from(map.entries()).map(([code, label]) => ({
      value: code,
      label,
    }));
  }, [assignments]);

  // Client-side filtering for TransitTable
  const filteredAssignments = useMemo(() => {
    return assignments.filter((item) => {
      if (statusFilter !== "all") {
        if (statusFilter === "conflicted" && item.status !== "conflicted") {
          return false;
        }
        if (statusFilter === "active" && item.status !== "active") {
          return false;
        }
        if (statusFilter === "unassigned" && item.status !== "unassigned") {
          return false;
        }
      }
      if (routeFilter !== "all" && item.routeCode !== routeFilter) {
        return false;
      }
      return true;
    });
  }, [assignments, statusFilter, routeFilter]);

  // Table Column Definitions
  const columns: ColumnDef<LiveTrackingAssignment>[] = [
    {
      header: "Bus Registration",
      accessorKey: "busRegNumber",
      cell: (item) => (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "font-mono font-bold text-xs",
                item.busId ? "text-foreground" : "text-muted-foreground italic",
              )}
            >
              {item.busRegNumber}
            </span>
            {item.busStatus === "maintenance" ? (
              <Badge
                variant="outline"
                className="text-[9px] px-1 py-0 border-rose-500/40 text-rose-600 dark:text-rose-400 bg-rose-500/10 rounded-md uppercase"
              >
                Maintenance
              </Badge>
            ) : item.busStatus === "breakdown" ? (
              <Badge
                variant="outline"
                className="text-[9px] px-1 py-0 border-rose-600/40 text-rose-600 dark:text-rose-400 bg-rose-600/10 rounded-md uppercase"
              >
                Breakdown
              </Badge>
            ) : item.busId ? (
              <div className="size-1.5 rounded-md bg-emerald-500" />
            ) : null}
          </div>
          <span className="text-[10px] text-muted-foreground truncate max-w-[140px]">
            {item.busType}
          </span>
        </div>
      ),
    },
    {
      header: "Assigned Route",
      accessorKey: "routeCode",
      cell: (item) => (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5">
            <Badge
              variant="outline"
              className="text-[10px] font-mono font-bold px-1.5 py-0 bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30 rounded-md"
            >
              {item.routeCode}
            </Badge>
            <span className="text-xs font-semibold text-foreground truncate max-w-[170px]">
              {item.routeName}
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <span>{item.origin}</span>
            <ArrowRight className="size-2.5 text-muted-foreground/70" />
            <span>{item.destination}</span>
          </span>
        </div>
      ),
    },
    {
      header: "Assigned Driver",
      accessorKey: "driverName",
      cell: (item) => (
        <div className="flex flex-col gap-0.5">
          <span
            className={cn(
              "text-xs font-medium",
              item.driverId
                ? "text-foreground"
                : "text-muted-foreground italic",
            )}
          >
            {item.driverName}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {item.driverStatus === "leave" ? (
              <span className="text-rose-600 dark:text-rose-400 font-semibold">
                On Leave
              </span>
            ) : item.driverStatus === "unavailable" ? (
              <span className="text-rose-600 dark:text-rose-400 font-semibold">
                Unavailable
              </span>
            ) : (
              "Heavy Vehicle (HPV)"
            )}
          </span>
        </div>
      ),
    },
    {
      header: "Assigned Conductor",
      accessorKey: "conductorName",
      cell: (item) => (
        <div className="flex flex-col gap-0.5">
          <span
            className={cn(
              "text-xs font-medium",
              item.conductorId
                ? "text-foreground"
                : "text-muted-foreground italic",
            )}
          >
            {item.conductorName}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {item.conductorStatus === "leave" ? (
              <span className="text-rose-600 dark:text-rose-400 font-semibold">
                On Leave
              </span>
            ) : item.conductorStatus === "unavailable" ? (
              <span className="text-rose-600 dark:text-rose-400 font-semibold">
                Unavailable
              </span>
            ) : (
              "Duty Roster"
            )}
          </span>
        </div>
      ),
    },
    {
      header: "Trip & Departure",
      accessorKey: "startTime",
      cell: (item) => (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-foreground">
            <Clock className="size-3 text-muted-foreground" />
            <span>
              {formatMinutesToTime(item.startTime)} -{" "}
              {formatMinutesToTime(item.endTime)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
            <span>{item.tripCode}</span>
            <span>·</span>
            <span>{item.dutyCode || "No Duty"}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Assignment Status",
      accessorKey: "status",
      cell: (item) => {
        if (item.conflicts.length > 0) {
          return (
            <Badge
              variant="outline"
              className="text-[10px] font-bold border-amber-500/40 text-amber-700 dark:text-amber-400 bg-amber-500/10 rounded-md flex items-center gap-1"
            >
              <AlertTriangle className="size-2.5 text-amber-600 dark:text-amber-400" />
              <span>Conflict ({item.conflicts.length})</span>
            </Badge>
          );
        }
        if (item.status === "active") {
          return (
            <Badge
              variant="outline"
              className="text-[10px] font-bold border-emerald-500/40 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 rounded-md flex items-center gap-1"
            >
              <Check className="size-2.5 text-emerald-600 dark:text-emerald-400" />
              <span>Active</span>
            </Badge>
          );
        }
        return (
          <Badge
            variant="outline"
            className="text-[10px] font-medium border-border text-muted-foreground bg-muted/40 rounded-md"
          >
            Unassigned
          </Badge>
        );
      },
    },
    {
      header: "Actions",
      cell: (item) => (
        <div className="flex items-center gap-2">
          {item.conflicts.length > 0 ? (
            <Button
              size="sm"
              variant="destructive"
              className="h-7 text-xs px-2.5 rounded-md font-medium shadow-xs"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenResolver(item);
              }}
            >
              <Wrench className="size-3 mr-1" />
              Resolve
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs px-2.5 rounded-md border-border text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenResolver(item);
              }}
            >
              Reassign
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <AppShell
      title="Live Tracking"
      subtitle="Operational monitoring of assigned vehicles, drivers, conductors, and real-time conflict management."
      actions={
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="h-8 px-2.5 text-xs font-mono font-medium rounded-md border-border bg-card text-foreground flex items-center gap-1.5"
          >
            <Calendar className="size-3.5 text-muted-foreground" />
            <span>{serviceDate}</span>
          </Badge>
          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            disabled={isLoading || isRefetching}
            className="h-8 text-xs px-2.5 rounded-md border-border bg-card hover:bg-muted font-medium text-foreground"
          >
            <RefreshCw
              className={cn("size-3.5 mr-1.5", isRefetching && "animate-spin")}
            />
            Sync
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* OPERATIONAL SUMMARY STATUS TILES */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-border/80 bg-card p-3.5 flex items-center justify-between shadow-xs">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Total Trips
              </p>
              <p className="text-2xl font-bold font-mono text-foreground mt-0.5">
                {summary.totalTrips}
              </p>
            </div>
            <div className="size-9 rounded-md bg-muted flex items-center justify-center text-muted-foreground">
              <Bus className="size-4" />
            </div>
          </div>

          <div className="rounded-lg border border-border/80 bg-card p-3.5 flex items-center justify-between shadow-xs">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Active Assignments
              </p>
              <p className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                {summary.activeAssignments}
              </p>
            </div>
            <div className="size-9 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="size-4" />
            </div>
          </div>

          <div
            className={cn(
              "rounded-lg border p-3.5 flex items-center justify-between shadow-xs transition-colors",
              summary.conflictedAssignments > 0
                ? "border-amber-500/40 bg-amber-500/5 dark:bg-amber-950/20"
                : "border-border/80 bg-card",
            )}
          >
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Detected Conflicts
              </p>
              <p
                className={cn(
                  "text-2xl font-bold font-mono mt-0.5",
                  summary.conflictedAssignments > 0
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-foreground",
                )}
              >
                {summary.conflictedAssignments}
              </p>
            </div>
            <div
              className={cn(
                "size-9 rounded-md flex items-center justify-center",
                summary.conflictedAssignments > 0
                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                  : "bg-muted text-muted-foreground",
              )}
            >
              <AlertTriangle className="size-4" />
            </div>
          </div>

          <div className="rounded-lg border border-border/80 bg-card p-3.5 flex items-center justify-between shadow-xs">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Unassigned Departures
              </p>
              <p className="text-2xl font-bold font-mono text-foreground mt-0.5">
                {summary.unassignedTrips}
              </p>
            </div>
            <div className="size-9 rounded-md bg-muted flex items-center justify-center text-muted-foreground">
              <Users className="size-4" />
            </div>
          </div>
        </div>

        {/* SECTION B: CONFLICT MANAGEMENT */}
        {conflicts.length > 0 ? (
          <section className="rounded-lg border border-amber-500/30 dark:border-amber-500/20 bg-amber-500/5 dark:bg-amber-950/15 p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-500/20 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="size-7 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <AlertTriangle className="size-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-foreground tracking-tight">
                    Assignment Conflicts Detected ({conflicts.length})
                  </h2>
                  <p className="text-[11px] text-muted-foreground">
                    Directly resolve double-booked vehicles or unavailable crew
                    to maintain timetable feasibility.
                  </p>
                </div>
              </div>
              <Badge
                variant="outline"
                className="text-xs font-mono font-semibold border-amber-500/40 text-amber-700 dark:text-amber-400 bg-amber-500/10 rounded-md"
              >
                Action Required
              </Badge>
            </div>

            {/* Conflict Cards Grid */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {conflicts.map((conf) => {
                const affectedTrip = assignments.find(
                  (a) => a.tripId === conf.tripId,
                );
                return (
                  <div
                    key={conf.id}
                    className="rounded-lg border border-border/80 bg-card p-3.5 space-y-2.5 shadow-xs flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="font-mono text-xs font-bold text-foreground">
                          {conf.tripCode}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[9px] font-bold uppercase rounded-md px-1.5 py-0.5",
                            conf.severity === "critical"
                              ? "border-rose-500/40 text-rose-700 dark:text-rose-400 bg-rose-500/10"
                              : "border-amber-500/40 text-amber-700 dark:text-amber-400 bg-amber-500/10",
                          )}
                        >
                          {conf.type.replace(/_/g, " ")}
                        </Badge>
                      </div>

                      {affectedTrip ? (
                        <p className="text-[11px] font-medium text-foreground truncate">
                          {affectedTrip.routeCode}: {affectedTrip.routeName} (
                          {formatMinutesToTime(affectedTrip.startTime)} -{" "}
                          {formatMinutesToTime(affectedTrip.endTime)})
                        </p>
                      ) : null}

                      <div className="rounded-md bg-muted/40 p-2 border border-border/50 text-[11px] text-muted-foreground leading-relaxed">
                        <span className="font-semibold text-foreground">
                          {conf.resourceName}:{" "}
                        </span>
                        <span>{conf.description}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border/40 flex items-center justify-end">
                      <Button
                        size="sm"
                        className="h-7 text-xs px-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-xs"
                        onClick={() => {
                          if (affectedTrip) {
                            handleOpenResolver(
                              affectedTrip,
                              conf.resourceType === "timing"
                                ? "bus"
                                : conf.resourceType,
                            );
                          }
                        }}
                      >
                        <Wrench className="size-3 mr-1.5" />
                        Resolve Conflict
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : (
          <div className="rounded-lg border border-emerald-500/30 dark:border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-950/10 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="size-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">
                  Zero Assignment Conflicts
                </p>
                <p className="text-[11px] text-muted-foreground">
                  All corridor departures have validated, non-overlapping buses
                  and compliant crew rosters.
                </p>
              </div>
            </div>
            <Badge
              variant="outline"
              className="text-xs font-medium border-emerald-500/30 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 rounded-md"
            >
              Timetable Feasible
            </Badge>
          </div>
        )}

        {/* SECTION A: CURRENT ASSIGNMENTS TABLE */}
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-foreground tracking-tight">
                Current Vehicle & Crew Assignments
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Roster breakdown for scheduled trips on {serviceDate}.
              </p>
            </div>
          </div>

          <TransitTable
            data={filteredAssignments}
            columns={columns}
            isLoading={isLoading}
            searchPlaceholder="Search by bus reg, route, driver, conductor, or trip code..."
            searchFilter={(item, query) => {
              const q = query.toLowerCase();
              return (
                item.busRegNumber.toLowerCase().includes(q) ||
                item.routeCode.toLowerCase().includes(q) ||
                item.routeName.toLowerCase().includes(q) ||
                item.driverName.toLowerCase().includes(q) ||
                item.conductorName.toLowerCase().includes(q) ||
                item.tripCode.toLowerCase().includes(q) ||
                (item.dutyCode || "").toLowerCase().includes(q) ||
                item.origin.toLowerCase().includes(q) ||
                item.destination.toLowerCase().includes(q)
              );
            }}
            filters={[
              {
                key: "status",
                label: "Status",
                value: statusFilter,
                options: [
                  { label: "All Statuses", value: "all" },
                  { label: "Active", value: "active" },
                  { label: "Conflicted", value: "conflicted" },
                  { label: "Unassigned", value: "unassigned" },
                ],
                onChange: setStatusFilter,
              },
              {
                key: "route",
                label: "Corridor",
                value: routeFilter,
                options: [{ label: "All Corridors", value: "all" }, ...routeOptions],
                onChange: setRouteFilter,
              },
            ]}
            emptyMessage="No trip assignments found matching selected filter criteria."
            defaultPageSize={10}
            pageSizeOptions={[10, 25, 50, 100]}
            exportCsvName={`TransitOS-Live-Assignments-${serviceDate.replace(/ /g, "-")}`}
            rowDetailTitle={(item) =>
              `${item.tripCode}: ${item.routeCode} - ${item.routeName}`
            }
            rowDetailSubtitle={(item) =>
              `Departure: ${formatMinutesToTime(item.startTime)} - ${formatMinutesToTime(item.endTime)} (${item.origin} to ${item.destination})`
            }
            renderRowDetail={(item, onClose) => (
              <div className="space-y-4 py-2 text-xs">
                {/* Conflict Banner if any */}
                {item.conflicts.length > 0 ? (
                  <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3.5 space-y-2 text-amber-900 dark:text-amber-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold">
                        <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
                        <span>
                          {item.conflicts.length} Active Conflict Detected
                        </span>
                      </div>
                      <Button
                        size="sm"
                        className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-md"
                        onClick={() => {
                          onClose();
                          handleOpenResolver(item);
                        }}
                      >
                        Resolve Now
                      </Button>
                    </div>
                    {item.conflicts.map((c) => (
                      <p
                        key={c.id}
                        className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300"
                      >
                        {c.description}
                      </p>
                    ))}
                  </div>
                ) : null}

                {/* Resource Details Grid */}
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-border/80 bg-card p-3 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                      Vehicle Allocation
                    </span>
                    <p className="font-mono text-sm font-bold text-foreground">
                      {item.busRegNumber}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {item.busType}
                    </p>
                    <div className="pt-1 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <MapPin className="size-3" />
                      <span>{item.busDepot}</span>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border/80 bg-card p-3 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                      Driver Roster
                    </span>
                    <p className="text-sm font-bold text-foreground">
                      {item.driverName}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Heavy Passenger Vehicle (HPV)
                    </p>
                    <div className="pt-1 flex items-center gap-1 text-[10px]">
                      <span className="text-muted-foreground">Status:</span>
                      <span
                        className={cn(
                          "font-medium",
                          item.driverStatus === "leave"
                            ? "text-rose-600"
                            : "text-emerald-600 dark:text-emerald-400",
                        )}
                      >
                        {item.driverStatus}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border/80 bg-card p-3 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                      Conductor Roster
                    </span>
                    <p className="text-sm font-bold text-foreground">
                      {item.conductorName}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Ticket & Fare Stage
                    </p>
                    <div className="pt-1 flex items-center gap-1 text-[10px]">
                      <span className="text-muted-foreground">Status:</span>
                      <span
                        className={cn(
                          "font-medium",
                          item.conductorStatus === "leave"
                            ? "text-rose-600"
                            : "text-emerald-600 dark:text-emerald-400",
                        )}
                      >
                        {item.conductorStatus}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Timetable Details */}
                <div className="rounded-lg border border-border/80 bg-card p-3.5 space-y-2">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                    Timetable & Schedule Information
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-muted-foreground">
                        Departure
                      </span>
                      <p className="font-mono font-bold text-foreground">
                        {formatMinutesToTime(item.startTime)}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground">
                        Arrival
                      </span>
                      <p className="font-mono font-bold text-foreground">
                        {formatMinutesToTime(item.endTime)}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground">
                        Duration
                      </span>
                      <p className="font-bold text-foreground">
                        {item.durationMin} mins
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground">
                        Duty Code
                      </span>
                      <p className="font-mono font-bold text-foreground">
                        {item.dutyCode || "None"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Reassign Action in Sheet */}
                <div className="pt-2 flex justify-end gap-2">
                  <Button
                    size="sm"
                    className="h-8 text-xs px-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-xs"
                    onClick={() => {
                      onClose();
                      handleOpenResolver(item);
                    }}
                  >
                    <Wrench className="size-3 mr-1.5" />
                    Reassign Vehicle / Crew
                  </Button>
                </div>
              </div>
            )}
          />
        </section>
      </div>

      {/* CONFLICT RESOLUTION & REASSIGNMENT DIALOG */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-foreground">
              <Wrench className="size-4 text-blue-600" />
              <span>Resolve Assignment Conflict</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Select a valid replacement resource. TransitOS verifies
              availability and constraint rules to guarantee zero secondary
              conflicts.
            </DialogDescription>
          </DialogHeader>

          {selectedConflictTrip ? (
            <div className="space-y-4 py-1 text-xs">
              {/* Trip Context Card */}
              <div className="rounded-lg border border-border/80 bg-muted/30 p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-foreground">
                    {selectedConflictTrip.tripCode} (
                    {selectedConflictTrip.routeCode}:{" "}
                    {selectedConflictTrip.routeName})
                  </span>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-mono rounded-md"
                  >
                    {formatMinutesToTime(selectedConflictTrip.startTime)} -{" "}
                    {formatMinutesToTime(selectedConflictTrip.endTime)}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px] pt-1 border-t border-border/40 text-muted-foreground">
                  <div>
                    <span className="block text-[10px] text-muted-foreground/70 uppercase">
                      Current Bus:
                    </span>
                    <span className="font-mono font-semibold text-foreground">
                      {selectedConflictTrip.busRegNumber}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-muted-foreground/70 uppercase">
                      Current Driver:
                    </span>
                    <span className="font-semibold text-foreground">
                      {selectedConflictTrip.driverName}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-muted-foreground/70 uppercase">
                      Current Conductor:
                    </span>
                    <span className="font-semibold text-foreground">
                      {selectedConflictTrip.conductorName}
                    </span>
                  </div>
                </div>
              </div>

              {/* Conflict Diagnostics Banner */}
              {selectedConflictTrip.conflicts.length > 0 ? (
                <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-amber-700 dark:text-amber-400">
                    Detected Problem:
                  </span>
                  {selectedConflictTrip.conflicts.map((c) => (
                    <p
                      key={c.id}
                      className="text-[11px] text-amber-900 dark:text-amber-200"
                    >
                      {c.description}
                    </p>
                  ))}
                </div>
              ) : null}

              {/* Resource Type Switcher */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Select Resource to Reassign
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedReplacementType("bus");
                      setSelectedReplacementId("");
                    }}
                    className={cn(
                      "py-2 px-3 text-xs font-semibold rounded-md border transition-all text-center",
                      selectedReplacementType === "bus"
                        ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                        : "border-border bg-card text-foreground hover:bg-muted",
                    )}
                  >
                    Vehicle (Bus)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedReplacementType("driver");
                      setSelectedReplacementId("");
                    }}
                    className={cn(
                      "py-2 px-3 text-xs font-semibold rounded-md border transition-all text-center",
                      selectedReplacementType === "driver"
                        ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                        : "border-border bg-card text-foreground hover:bg-muted",
                    )}
                  >
                    Driver
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedReplacementType("conductor");
                      setSelectedReplacementId("");
                    }}
                    className={cn(
                      "py-2 px-3 text-xs font-semibold rounded-md border transition-all text-center",
                      selectedReplacementType === "conductor"
                        ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                        : "border-border bg-card text-foreground hover:bg-muted",
                    )}
                  >
                    Conductor
                  </button>
                </div>
              </div>

              {/* Candidates Selection List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Available Candidate Pool ({feasibleCandidates.length}{" "}
                    Eligible)
                  </label>
                  {loadingCandidates ? (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <RefreshCw className="size-3 animate-spin text-blue-600" />
                      Evaluating constraints...
                    </span>
                  ) : null}
                </div>

                {loadingCandidates ? (
                  <div className="py-8 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
                    <RefreshCw className="size-5 animate-spin text-blue-600" />
                    <span>Verifying depot availability & overlap rules...</span>
                  </div>
                ) : feasibleCandidates.length === 0 ? (
                  <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-center space-y-1.5">
                    <AlertOctagon className="size-5 text-rose-600 dark:text-rose-400 mx-auto" />
                    <p className="text-xs font-bold text-rose-700 dark:text-rose-300">
                      No Feasible Replacement Available in Depot
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      All candidate resources have scheduled overlapping runs or
                      unmet rest buffers. Operational intervention required
                      (deploy standby fleet or spare crew).
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {/* Feasible Candidates */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                        Feasible & Compliant ({feasibleCandidates.length})
                      </span>
                      {feasibleCandidates.map((cand) => (
                        <div
                          key={cand.id}
                          onClick={() => setSelectedReplacementId(cand.id)}
                          className={cn(
                            "p-2.5 rounded-md border text-xs cursor-pointer flex items-center justify-between transition-all",
                            selectedReplacementId === cand.id
                              ? "border-blue-600 bg-blue-500/10 font-semibold"
                              : "border-border/80 bg-card hover:border-blue-400 hover:bg-muted/40",
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                "size-4 rounded-md border flex items-center justify-center",
                                selectedReplacementId === cand.id
                                  ? "border-blue-600 bg-blue-600 text-white"
                                  : "border-muted-foreground/40",
                              )}
                            >
                              {selectedReplacementId === cand.id ? (
                                <Check className="size-3" />
                              ) : null}
                            </div>
                            <div>
                              <span className="font-medium text-foreground">
                                {cand.name}
                              </span>
                              {cand.secondaryCode ? (
                                <span className="ml-1.5 text-[10px] text-muted-foreground font-mono">
                                  ({cand.secondaryCode})
                                </span>
                              ) : null}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {cand.depot ? (
                              <span className="text-[10px] text-muted-foreground">
                                {cand.depot}
                              </span>
                            ) : null}
                            <Badge
                              variant="outline"
                              className="text-[9px] border-emerald-500/40 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 rounded-md font-medium"
                            >
                              Feasible
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Infeasible Candidates (clearly separated & disabled) */}
                    {infeasibleCandidates.length > 0 ? (
                      <div className="space-y-1 pt-2">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          Ineligible ({infeasibleCandidates.length})
                        </span>
                        {infeasibleCandidates.slice(0, 5).map((cand) => (
                          <div
                            key={cand.id}
                            className="p-2 rounded-md border border-border/50 bg-muted/20 text-xs flex items-center justify-between opacity-60 cursor-not-allowed"
                          >
                            <span className="text-muted-foreground">
                              {cand.name}
                            </span>
                            <span className="text-[10px] text-rose-600 dark:text-rose-400 truncate max-w-[240px]">
                              {cand.infeasibilityReason || "Unavailable"}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

              {/* Optional Reason Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Dispatch Note / Audit Reason
                </label>
                <Input
                  placeholder="e.g. Reassigned from depot spare pool to resolve overlap"
                  value={reassignmentReason}
                  onChange={(e) => setReassignmentReason(e.target.value)}
                  className="h-8 text-xs rounded-md"
                />
              </div>

              {/* Feasibility Guarantee Banner */}
              {selectedReplacementId ? (
                <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 p-2.5 flex items-center gap-2 text-emerald-800 dark:text-emerald-200">
                  <Check className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="text-[11px]">
                    Constraint Verification Passed: Selected replacement is
                    active, available, and creates zero timetable overlaps.
                  </span>
                </div>
              ) : null}
            </div>
          ) : null}

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border/50">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs h-8 rounded-md"
              onClick={() => setResolveDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={!selectedReplacementId || resolveMutation.isPending}
              className="text-xs h-8 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-xs"
              onClick={() => resolveMutation.mutate()}
            >
              {resolveMutation.isPending ? (
                <>
                  <RefreshCw className="size-3 mr-1.5 animate-spin" />
                  Applying Resolution...
                </>
              ) : (
                "Confirm & Apply Resolution"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
