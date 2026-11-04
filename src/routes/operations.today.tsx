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
  Calendar,
  MapPin,
  Check,
  AlertOctagon,
  ArrowRight,
  Plus,
  ShieldCheck,
  Info,
  ChevronRight,
  ShieldAlert,
  XCircle,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { TransitTable, ColumnDef } from "@/components/ui/transit-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { hasPermission } from "@/lib/auth-shared";
import {
  getLiveTrackingAssignments,
  getOperationalIssues,
  reportOperationalProblem,
  approveIssueRecommendation,
  rejectIssueRecommendation,
  ProblemCategory,
  OperationalIssue,
  SolutionOption,
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
          "Operational monitoring of current bus, driver, and conductor assignments with intelligent conflict investigation and resolution.",
      },
    ],
  }),
  component: OperationsTodayPage,
});

const DEFAULT_SERVICE_DATE = "25 Aug 2026";

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
  conflicts: any[];
}

function OperationsTodayPage() {
  const queryClient = useQueryClient();
  const [serviceDate] = useState(DEFAULT_SERVICE_DATE);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [routeFilter, setRouteFilter] = useState<string>("all");
  const [issuesTab, setIssuesTab] = useState<
    "needs_review" | "manual" | "resolved" | "all"
  >("needs_review");

  // Problem Reporting Dialog state
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportCategory, setReportCategory] =
    useState<ProblemCategory>("BUS_BREAKDOWN");
  const [reportTripId, setReportTripId] = useState<string>("");
  const [reportDescription, setReportDescription] = useState<string>("");

  // Slide-over Review Drawer state
  const [reviewSheetOpen, setReviewSheetOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<OperationalIssue | null>(
    null,
  );
  const [selectedSolutionId, setSelectedSolutionId] = useState<string>("");
  const [dispatchNotes, setDispatchNotes] = useState<string>("");

  // 1. Fetch Live Tracking Assignments
  const {
    data: liveData,
    isLoading: loadingAssignments,
    isRefetching: refetchingAssignments,
    refetch: refetchAssignments,
  } = useQuery({
    queryKey: ["live-tracking-assignments", serviceDate],
    queryFn: () => getLiveTrackingAssignments({ serviceDate }),
    refetchInterval: 30000,
  });

  const assignments: LiveTrackingAssignment[] = useMemo(
    () => (liveData?.assignments as LiveTrackingAssignment[]) || [],
    [liveData?.assignments],
  );

  // 2. Fetch Operational Issues & Diagnostic Recommendations
  const {
    data: issuesData,
    isLoading: loadingIssues,
    refetch: refetchIssues,
  } = useQuery({
    queryKey: ["operational-issues", serviceDate],
    queryFn: () => getOperationalIssues({ serviceDate }),
    refetchInterval: 15000,
  });

  const issues: OperationalIssue[] = useMemo(
    () => issuesData?.issues || [],
    [issuesData?.issues],
  );

  const issuesSummary = issuesData?.summary || {
    total: 0,
    active: 0,
    awaitingApproval: 0,
    awaitingManual: 0,
    resolved: 0,
  };

  // 3. Report Problem Mutation
  const reportMutation = useMutation({
    mutationFn: async () => {
      if (!reportDescription.trim()) {
        throw new Error("Please describe the operational problem.");
      }
      return await reportOperationalProblem({
        tripId: reportTripId || undefined,
        category: reportCategory,
        description: reportDescription.trim(),
        serviceDate,
      });
    },
    onSuccess: (res) => {
      toast.success(
        res.message || "Problem logged. Intelligent investigation complete.",
      );
      queryClient.invalidateQueries({
        queryKey: ["operational-issues"],
      });
      queryClient.invalidateQueries({
        queryKey: ["live-tracking-assignments"],
      });
      setReportDialogOpen(false);
      setReportDescription("");
      setReportTripId("");

      // Immediately open the investigation drawer for admin approval
      if (res.issue) {
        setSelectedIssue(res.issue);
        setSelectedSolutionId(res.issue.bestSolution?.id || "");
        setDispatchNotes("");
        setReviewSheetOpen(true);
      }
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to log operational problem.");
    },
  });

  // 4. Approve Recommendation Mutation
  const approveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedIssue) throw new Error("No issue selected");
      return await approveIssueRecommendation({
        issueId: selectedIssue.id,
        solutionId: selectedSolutionId || undefined,
        dispatchNotes: dispatchNotes.trim() || undefined,
      });
    },
    onSuccess: (res) => {
      toast.success(
        res.message ||
          "Recommendation approved. Backend assignments updated and revalidated.",
      );
      queryClient.invalidateQueries({
        queryKey: ["operational-issues"],
      });
      queryClient.invalidateQueries({
        queryKey: ["live-tracking-assignments"],
      });
      setReviewSheetOpen(false);
      setSelectedIssue(null);
      setSelectedSolutionId("");
      setDispatchNotes("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to approve recommendation.");
    },
  });

  // 5. Reject Recommendation Mutation
  const rejectMutation = useMutation({
    mutationFn: async () => {
      if (!selectedIssue) throw new Error("No issue selected");
      return await rejectIssueRecommendation({
        issueId: selectedIssue.id,
        reason: dispatchNotes.trim() || "Manual intervention requested by supervisor",
      });
    },
    onSuccess: (res) => {
      toast.warning(
        res.message || "Recommendation rejected. Flagged for manual intervention.",
      );
      queryClient.invalidateQueries({
        queryKey: ["operational-issues"],
      });
      setReviewSheetOpen(false);
      setSelectedIssue(null);
      setSelectedSolutionId("");
      setDispatchNotes("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update issue status.");
    },
  });

  // Open Problem Report Dialog (optionally preselecting a trip)
  const handleOpenReportDialog = (trip?: LiveTrackingAssignment) => {
    if (trip) {
      setReportTripId(trip.tripId);
      if (trip.busStatus === "breakdown" || trip.busStatus === "maintenance") {
        setReportCategory("BUS_BREAKDOWN");
      } else if (trip.driverStatus === "leave") {
        setReportCategory("DRIVER_UNAVAILABLE");
      } else if (trip.conductorStatus === "leave") {
        setReportCategory("CONDUCTOR_ABSENT");
      } else if (trip.conflicts.length > 0) {
        setReportCategory("SCHEDULING_OVERLAP");
      } else {
        setReportCategory("BUS_BREAKDOWN");
      }
    } else {
      setReportTripId(assignments[0]?.tripId || "");
      setReportCategory("BUS_BREAKDOWN");
    }
    setReportDescription("");
    setReportDialogOpen(true);
  };

  // Open Issue Review Drawer
  const handleOpenReview = (issue: OperationalIssue) => {
    setSelectedIssue(issue);
    setSelectedSolutionId(issue.bestSolution?.id || "");
    setDispatchNotes("");
    setReviewSheetOpen(true);
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

  // Client-side filtering for Assignments TransitTable
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

  // Filtered Operational Issues based on tab
  const filteredIssues = useMemo(() => {
    switch (issuesTab) {
      case "needs_review":
        return issues.filter(
          (i) =>
            i.lifecycleStatus === "RECOMMENDATION_READY" ||
            i.lifecycleStatus === "AWAITING_APPROVAL" ||
            i.lifecycleStatus === "REPORTED",
        );
      case "manual":
        return issues.filter(
          (i) => i.lifecycleStatus === "AWAITING_MANUAL_INTERVENTION",
        );
      case "resolved":
        return issues.filter((i) => i.lifecycleStatus === "RESOLVED");
      case "all":
      default:
        return issues;
    }
  }, [issues, issuesTab]);

  // Active solution currently selected in drawer
  const currentActiveSolution: SolutionOption | null = useMemo(() => {
    if (!selectedIssue) return null;
    const all = [
      selectedIssue.bestSolution,
      ...selectedIssue.alternativeSolutions,
    ].filter(Boolean) as SolutionOption[];
    return all.find((s) => s.id === selectedSolutionId) || selectedIssue.bestSolution;
  }, [selectedIssue, selectedSolutionId]);

  // Table Column Definitions for Area 1
  const assignmentColumns: ColumnDef<LiveTrackingAssignment>[] = [
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
            {item.busType} · {item.busDepot}
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
              "Fare Roster"
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
      header: "Operational Status",
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
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs px-2.5 rounded-md border-border hover:bg-muted font-medium text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenReportDialog(item);
            }}
          >
            <AlertTriangle className="size-3 mr-1 text-amber-600" />
            Report Issue
          </Button>
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
            onClick={() => {
              refetchAssignments();
              refetchIssues();
            }}
            disabled={loadingAssignments || refetchingAssignments}
            className="h-8 text-xs px-2.5 rounded-md border-border bg-card hover:bg-muted font-medium text-foreground"
          >
            <RefreshCw
              className={cn(
                "size-3.5 mr-1.5",
                refetchingAssignments && "animate-spin",
              )}
            />
            Sync
          </Button>
          <Button
            size="sm"
            onClick={() => handleOpenReportDialog()}
            className="h-8 text-xs px-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-xs flex items-center gap-1.5"
          >
            <Plus className="size-3.5" />
            Report Problem
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* ======================================================== */}
        {/* AREA 2: OPERATIONAL ISSUES & CONFLICT MANAGEMENT */}
        {/* ======================================================== */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-foreground tracking-tight">
                  Operational Issues & Problem Resolution
                </h2>
                {issuesSummary.active > 0 ? (
                  <Badge
                    variant="outline"
                    className="text-[11px] font-bold px-2 py-0 border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-md"
                  >
                    {issuesSummary.active} Active
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="text-[11px] font-medium px-2 py-0 border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-md"
                  >
                    All Clear
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Reported problems and automatically detected conflicts with
                intelligent 8-point diagnostic investigations and ranked
                solutions.
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center p-1 bg-muted/60 rounded-lg border border-border/60 text-xs">
              <button
                type="button"
                onClick={() => setIssuesTab("needs_review")}
                className={cn(
                  "px-3 py-1 rounded-md font-semibold transition-all flex items-center gap-1.5",
                  issuesTab === "needs_review"
                    ? "bg-card text-foreground shadow-xs border border-border/80"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span>Needs Review</span>
                <span className="font-mono text-[10px] px-1 py-0 bg-amber-500/20 text-amber-700 dark:text-amber-300 rounded-md">
                  {issuesSummary.awaitingApproval}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setIssuesTab("manual")}
                className={cn(
                  "px-3 py-1 rounded-md font-medium transition-all flex items-center gap-1.5",
                  issuesTab === "manual"
                    ? "bg-card text-foreground shadow-xs border border-border/80"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span>Awaiting Manual</span>
                <span className="font-mono text-[10px] px-1 py-0 bg-muted text-muted-foreground rounded-md">
                  {issuesSummary.awaitingManual}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setIssuesTab("resolved")}
                className={cn(
                  "px-3 py-1 rounded-md font-medium transition-all flex items-center gap-1.5",
                  issuesTab === "resolved"
                    ? "bg-card text-foreground shadow-xs border border-border/80"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span>Resolved History</span>
                <span className="font-mono text-[10px] px-1 py-0 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 rounded-md">
                  {issuesSummary.resolved}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setIssuesTab("all")}
                className={cn(
                  "px-3 py-1 rounded-md font-medium transition-all",
                  issuesTab === "all"
                    ? "bg-card text-foreground shadow-xs border border-border/80"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                All ({issuesSummary.total})
              </button>
            </div>
          </div>

          {/* Issue Cards Grid */}
          {loadingIssues ? (
            <div className="py-12 rounded-lg border border-border/80 bg-card flex flex-col items-center justify-center gap-2 text-muted-foreground text-xs">
              <RefreshCw className="size-5 animate-spin text-blue-600" />
              <span>Scanning schedules and investigating conflicts...</span>
            </div>
          ) : filteredIssues.length === 0 ? (
            <div className="rounded-lg border border-border/80 bg-card p-8 text-center space-y-2">
              <div className="size-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="size-5" />
              </div>
              <h3 className="text-sm font-bold text-foreground">
                No Operational Issues in Selected View
              </h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                {issuesTab === "needs_review"
                  ? "All corridor trips have feasible, validated vehicle and crew assignments with zero active conflicts."
                  : issuesTab === "manual"
                    ? "Zero issues currently require manual supervisor intervention."
                    : "No issue records match the selected filter."}
              </p>
            </div>
          ) : (
            <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredIssues.map((issue) => (
                <div
                  key={issue.id}
                  className={cn(
                    "rounded-lg border p-4 space-y-3 shadow-xs flex flex-col justify-between transition-all",
                    issue.lifecycleStatus === "RESOLVED"
                      ? "border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/10"
                      : issue.lifecycleStatus ===
                          "AWAITING_MANUAL_INTERVENTION"
                        ? "border-rose-500/30 bg-rose-500/5 dark:bg-rose-950/10"
                        : "border-border/80 bg-card hover:border-blue-400/80",
                  )}
                >
                  <div className="space-y-2.5">
                    {/* Card Top Badges */}
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[9px] font-bold uppercase rounded-md px-1.5 py-0.5",
                            issue.category === "BUS_BREAKDOWN" ||
                              issue.category === "SCHEDULING_OVERLAP"
                              ? "border-rose-500/40 text-rose-700 dark:text-rose-400 bg-rose-500/10"
                              : "border-amber-500/40 text-amber-700 dark:text-amber-400 bg-amber-500/10",
                          )}
                        >
                          {issue.category.replace(/_/g, " ")}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-[9px] font-mono text-muted-foreground border-border bg-muted/40 rounded-md"
                        >
                          {issue.source === "ADMIN_REPORTED"
                            ? "Admin Reported"
                            : "System Detected"}
                        </Badge>
                      </div>

                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[9px] font-semibold rounded-md",
                          issue.lifecycleStatus === "RESOLVED"
                            ? "border-emerald-500/40 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10"
                            : issue.lifecycleStatus ===
                                "AWAITING_MANUAL_INTERVENTION"
                              ? "border-rose-500/40 text-rose-700 dark:text-rose-400 bg-rose-500/10"
                              : "border-blue-500/40 text-blue-700 dark:text-blue-400 bg-blue-500/10",
                        )}
                      >
                        {issue.lifecycleStatus.replace(/_/g, " ")}
                      </Badge>
                    </div>

                    {/* Affected Trip Context */}
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-foreground font-mono">
                        <span>{issue.tripCode}</span>
                        <span>·</span>
                        <span className="text-blue-600 dark:text-blue-400">
                          {issue.routeCode}
                        </span>
                        <span className="font-sans font-medium text-muted-foreground truncate max-w-[150px]">
                          ({issue.routeName})
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                        {issue.description}
                      </p>
                    </div>

                    {/* System Recommendation Preview */}
                    {issue.bestSolution ? (
                      <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-2 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                            <ShieldCheck className="size-3 text-emerald-600 dark:text-emerald-400" />
                            Recommended Solution
                          </span>
                          <span className="font-mono text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                            {issue.bestSolution.suitabilityScore}/100 Match
                          </span>
                        </div>
                        <p className="text-[11px] font-medium text-foreground">
                          {issue.bestSolution.replacementBusReg ||
                            issue.bestSolution.replacementDriverName ||
                            issue.bestSolution.replacementConductorName ||
                            issue.bestSolution.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {issue.bestSolution.depot} ·{" "}
                          {issue.bestSolution.repositioningMinutes}m
                          repositioning · 0 cascading conflicts
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-2 text-xs">
                        <span className="text-[10px] font-bold uppercase text-amber-800 dark:text-amber-300 flex items-center gap-1">
                          <AlertTriangle className="size-3 text-amber-600" />
                          Manual Intervention Required
                        </span>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Standard depot pool exhausted. Dispatch standby unit.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Card Action */}
                  <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(issue.reportedAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <Button
                      size="sm"
                      className="h-7 text-xs px-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-xs flex items-center gap-1"
                      onClick={() => handleOpenReview(issue)}
                    >
                      <span>Review Diagnostic</span>
                      <ChevronRight className="size-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ======================================================== */}
        {/* AREA 1: CURRENT VEHICLE & CREW ASSIGNMENTS TABLE */}
        {/* ======================================================== */}
        <section className="space-y-3 pt-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-foreground tracking-tight">
                Current Vehicle & Crew Assignments
              </h2>
              <p className="text-xs text-muted-foreground">
                Operational roster for scheduled trips on {serviceDate}.
              </p>
            </div>
          </div>

          <TransitTable
            data={filteredAssignments}
            columns={assignmentColumns}
            isLoading={loadingAssignments}
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
                options: [
                  { label: "All Corridors", value: "all" },
                  ...routeOptions,
                ],
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
                          handleOpenReportDialog(item);
                        }}
                      >
                        Investigate Conflict
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

                <div className="pt-2 flex justify-end gap-2">
                  <Button
                    size="sm"
                    className="h-8 text-xs px-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-xs"
                    onClick={() => {
                      onClose();
                      handleOpenReportDialog(item);
                    }}
                  >
                    <AlertTriangle className="size-3 mr-1.5" />
                    Report Issue on this Trip
                  </Button>
                </div>
              </div>
            )}
          />
        </section>
      </div>

      {/* ======================================================== */}
      {/* REPORT AN OPERATIONAL PROBLEM DIALOG */}
      {/* ======================================================== */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="max-w-md rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-foreground">
              <AlertTriangle className="size-4 text-blue-600" />
              <span>Report Operational Problem</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Describe the problem in plain language. TransitOS will
              investigate affected schedules, calculate candidate suitability,
              and formulate ranked solutions.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-1 text-xs">
            {/* Category Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Problem Category
              </label>
              <select
                value={reportCategory}
                onChange={(e) =>
                  setReportCategory(e.target.value as ProblemCategory)
                }
                className="w-full h-8 text-xs px-2.5 rounded-md border border-border bg-card text-foreground focus:outline-hidden focus:ring-1 focus:ring-blue-600"
              >
                <option value="BUS_BREAKDOWN">
                  Bus Breakdown (Mechanical Failure)
                </option>
                <option value="DRIVER_UNAVAILABLE">
                  Driver Unavailable (Sick / Absent)
                </option>
                <option value="CONDUCTOR_ABSENT">
                  Conductor Absent (Roster Gap)
                </option>
                <option value="TRIP_DELAY">Trip Delayed in Traffic</option>
                <option value="SCHEDULING_OVERLAP">
                  Scheduling Conflict / Double Booking
                </option>
                <option value="CANNOT_REACH_ON_TIME">
                  Cannot Reach Terminus on Time
                </option>
                <option value="OPERATIONAL_DISRUPTION">
                  Other Operational Disruption
                </option>
              </select>
            </div>

            {/* Affected Trip Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Affected Trip Departure
              </label>
              <select
                value={reportTripId}
                onChange={(e) => setReportTripId(e.target.value)}
                className="w-full h-8 text-xs px-2.5 rounded-md border border-border bg-card text-foreground focus:outline-hidden focus:ring-1 focus:ring-blue-600"
              >
                {assignments.map((a) => (
                  <option key={a.tripId} value={a.tripId}>
                    {a.tripCode} ({formatMinutesToTime(a.startTime)} -{" "}
                    {a.routeCode}: {a.busRegNumber})
                  </option>
                ))}
              </select>
            </div>

            {/* Plain-Language Description */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Describe the Operational Problem
              </label>
              <Textarea
                rows={3}
                placeholder="e.g. Bus engine overheating at Tambaram terminal. Radiator coolant leak confirmed by mechanic."
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                className="text-xs rounded-md"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border/50">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs h-8 rounded-md"
              onClick={() => setReportDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={!reportDescription.trim() || reportMutation.isPending}
              className="text-xs h-8 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-xs"
              onClick={() => reportMutation.mutate()}
            >
              {reportMutation.isPending ? (
                <>
                  <RefreshCw className="size-3 mr-1.5 animate-spin" />
                  Investigating Data...
                </>
              ) : (
                "Investigate & Find Solution"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ======================================================== */}
      {/* SLIDE-OVER REVIEW DRAWER: 8-POINT DIAGNOSTIC & SOLUTIONS */}
      {/* ======================================================== */}
      <Sheet open={reviewSheetOpen} onOpenChange={setReviewSheetOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-xl md:max-w-2xl overflow-y-auto p-6 space-y-6"
        >
          {selectedIssue ? (
            <div className="space-y-6">
              <SheetHeader className="space-y-2 border-b border-border/60 pb-4">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <Badge
                    variant="outline"
                    className="text-[10px] font-bold uppercase border-blue-500/40 text-blue-700 dark:text-blue-300 bg-blue-500/10 rounded-md"
                  >
                    {selectedIssue.category.replace(/_/g, " ")}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] font-bold rounded-md",
                      selectedIssue.lifecycleStatus === "RESOLVED"
                        ? "border-emerald-500/40 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10"
                        : selectedIssue.lifecycleStatus ===
                            "AWAITING_MANUAL_INTERVENTION"
                          ? "border-rose-500/40 text-rose-700 dark:text-rose-400 bg-rose-500/10"
                          : "border-amber-500/40 text-amber-700 dark:text-amber-400 bg-amber-500/10",
                    )}
                  >
                    Status: {selectedIssue.lifecycleStatus.replace(/_/g, " ")}
                  </Badge>
                </div>
                <SheetTitle className="text-base font-bold text-foreground">
                  Conflict Diagnostic: Trip {selectedIssue.tripCode}
                </SheetTitle>
                <SheetDescription className="text-xs text-muted-foreground">
                  {selectedIssue.routeCode} · {selectedIssue.routeName} ·
                  Reported on {selectedIssue.serviceDate}
                </SheetDescription>
              </SheetHeader>

              {/* 8-POINT PLAIN LANGUAGE INVESTIGATION REPORT */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Info className="size-3.5 text-blue-600" />
                  <span>TransitOS 8-Point Operational Investigation</span>
                </h3>

                <div className="grid gap-2.5 text-xs">
                  {/* Point 1 */}
                  <div className="rounded-lg border border-border/70 bg-card p-3 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground">
                      1. What exactly happened?
                    </span>
                    <p className="text-foreground leading-relaxed">
                      {selectedIssue.diagnostic.whatHappened}
                    </p>
                  </div>

                  {/* Point 2 */}
                  <div className="rounded-lg border border-border/70 bg-card p-3 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground">
                      2. Which route or trip is affected?
                    </span>
                    <p className="text-foreground leading-relaxed">
                      {selectedIssue.diagnostic.affectedRouteTrips}
                    </p>
                  </div>

                  {/* Point 3 */}
                  <div className="rounded-lg border border-border/70 bg-card p-3 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground">
                      3. Which bus, driver or conductor is involved?
                    </span>
                    <p className="text-foreground leading-relaxed">
                      {selectedIssue.diagnostic.involvedResources}
                    </p>
                  </div>

                  {/* Point 4 */}
                  <div className="rounded-lg border border-border/70 bg-card p-3 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-rose-600 dark:text-rose-400">
                      4. Why is the current assignment invalid?
                    </span>
                    <p className="text-foreground leading-relaxed">
                      {selectedIssue.diagnostic.whyInvalid}
                    </p>
                  </div>

                  {/* Point 5 */}
                  <div className="rounded-lg border border-border/70 bg-card p-3 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400">
                      5. What are the operational consequences?
                    </span>
                    <p className="text-foreground leading-relaxed">
                      {selectedIssue.diagnostic.operationalConsequences}
                    </p>
                  </div>

                  {/* Point 6 */}
                  <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/5 p-3 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400">
                      6. What solution does the system recommend?
                    </span>
                    <p className="text-foreground leading-relaxed font-medium">
                      {selectedIssue.diagnostic.recommendedSolution}
                    </p>
                  </div>

                  {/* Point 7 */}
                  <div className="rounded-lg border border-border/70 bg-card p-3 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground">
                      7. Why is that solution better?
                    </span>
                    <p className="text-foreground leading-relaxed">
                      {selectedIssue.diagnostic.whyBetter}
                    </p>
                  </div>

                  {/* Point 8 */}
                  <div className="rounded-lg border border-border/70 bg-card p-3 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground">
                      8. Are there any remaining risks or unresolved issues?
                    </span>
                    <p className="text-foreground leading-relaxed">
                      {selectedIssue.diagnostic.remainingRisks}
                    </p>
                  </div>
                </div>
              </div>

              {/* RANKED SOLUTIONS & SELECTION */}
              {selectedIssue.bestSolution ? (
                <div className="space-y-3 pt-2 border-t border-border/60">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Ranked Feasible Solutions
                    </h3>
                    <span className="text-[10px] text-muted-foreground">
                      {selectedIssue.alternativeSolutions.length + 1} options
                      evaluated
                    </span>
                  </div>

                  {/* Option Switcher Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedSolutionId(selectedIssue.bestSolution!.id)
                      }
                      className={cn(
                        "p-2.5 rounded-lg border text-left transition-all relative",
                        selectedSolutionId === selectedIssue.bestSolution.id
                          ? "border-emerald-600 bg-emerald-500/10 ring-1 ring-emerald-600 shadow-xs"
                          : "border-border/80 bg-card hover:bg-muted/50",
                      )}
                    >
                      <Badge
                        variant="outline"
                        className="text-[9px] px-1 py-0 mb-1 border-emerald-500/50 bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold rounded-md"
                      >
                        Rank 1 (Best)
                      </Badge>
                      <p className="text-xs font-bold text-foreground truncate">
                        {selectedIssue.bestSolution.replacementBusReg ||
                          selectedIssue.bestSolution.replacementDriverName ||
                          selectedIssue.bestSolution.replacementConductorName}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-mono">
                        {selectedIssue.bestSolution.suitabilityScore}/100 Match
                      </p>
                    </button>

                    {selectedIssue.alternativeSolutions.map((alt, idx) => (
                      <button
                        key={alt.id}
                        type="button"
                        onClick={() => setSelectedSolutionId(alt.id)}
                        className={cn(
                          "p-2.5 rounded-lg border text-left transition-all",
                          selectedSolutionId === alt.id
                            ? "border-blue-600 bg-blue-500/10 ring-1 ring-blue-600 shadow-xs"
                            : "border-border/80 bg-card hover:bg-muted/50",
                        )}
                      >
                        <Badge
                          variant="outline"
                          className="text-[9px] px-1 py-0 mb-1 border-blue-500/40 text-blue-700 dark:text-blue-300 rounded-md"
                        >
                          Rank {alt.rank} (Alt {idx + 1})
                        </Badge>
                        <p className="text-xs font-bold text-foreground truncate">
                          {alt.replacementBusReg ||
                            alt.replacementDriverName ||
                            alt.replacementConductorName}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          {alt.suitabilityScore}/100 Match
                        </p>
                      </button>
                    ))}
                  </div>

                  {/* Detailed Selected Solution Card */}
                  {currentActiveSolution ? (
                    <div className="rounded-lg border border-border/80 bg-muted/20 p-3.5 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground">
                          {currentActiveSolution.title}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[10px] font-mono border-emerald-500/40 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 rounded-md"
                        >
                          Suitability: {currentActiveSolution.suitabilityScore}
                          /100
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                        <div>
                          <span className="block text-[10px] uppercase">
                            Home Depot:
                          </span>
                          <span className="font-semibold text-foreground">
                            {currentActiveSolution.depot}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] uppercase">
                            Repositioning Deadhead:
                          </span>
                          <span className="font-semibold text-foreground">
                            {currentActiveSolution.repositioningMinutes} mins
                          </span>
                        </div>
                      </div>

                      <p className="text-[11px] text-muted-foreground leading-relaxed pt-1">
                        <span className="font-semibold text-foreground">
                          Reason:{" "}
                        </span>
                        {currentActiveSolution.reason}
                      </p>

                      <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-2 text-[11px] text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                        <ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>{currentActiveSolution.impactSummary}</span>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-xs space-y-1.5">
                  <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold">
                    <XCircle className="size-4" />
                    <span>No Automated Feasible Replacement Found</span>
                  </div>
                  <p className="text-muted-foreground">
                    All depot reserve units have overlapping assignments or
                    unmet rest buffers. Manual supervisor intervention required
                    (deploy standby vehicle or adjust trip timing).
                  </p>
                </div>
              )}

              {/* ACTION FOOTER */}
              <div className="pt-3 border-t border-border/70 space-y-3">
                {selectedIssue.lifecycleStatus === "RESOLVED" ? (
                  <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 flex items-center gap-2.5 text-emerald-900 dark:text-emerald-200 text-xs">
                    <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div>
                      <p className="font-bold">
                        Issue Resolved & Timetable Feasibility Guaranteed
                      </p>
                      <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
                        Approved by {selectedIssue.resolvedBy || "Administrator"}{" "}
                        on{" "}
                        {new Date(
                          selectedIssue.resolvedAt || "",
                        ).toLocaleString()}
                        .
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Dispatch Notes / Audit Justification (Optional)
                      </label>
                      <Input
                        placeholder="e.g. Approved primary standby bus from Broadway depot"
                        value={dispatchNotes}
                        onChange={(e) => setDispatchNotes(e.target.value)}
                        className="h-8 text-xs rounded-md"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={rejectMutation.isPending}
                        className="text-xs h-8 rounded-md border-border text-rose-600 hover:text-rose-700 hover:bg-rose-500/10"
                        onClick={() => rejectMutation.mutate()}
                      >
                        Reject Recommendation
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        disabled={
                          !currentActiveSolution || approveMutation.isPending
                        }
                        className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-md shadow-xs flex items-center gap-1.5"
                        onClick={() => approveMutation.mutate()}
                      >
                        {approveMutation.isPending ? (
                          <>
                            <RefreshCw className="size-3 animate-spin" />
                            Updating Schedule...
                          </>
                        ) : (
                          <>
                            <Check className="size-3.5" />
                            Approve Solution
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </AppShell>
  );
}
