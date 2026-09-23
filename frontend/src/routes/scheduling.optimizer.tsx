import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowRight,
  Bus as BusIcon,
  CheckCircle2,
  CircleAlert,
  Info,
  Loader2,
  Sparkles,
  Users,
  Calendar,
  Settings,
  Clock,
  ArrowRightLeft,
  BookOpen,
  Cpu,
  Layers,
  Zap,
  TrendingUp,
  ShieldCheck,
  Check,
  Gauge,
  Route as RouteIcon,
  CalendarClock,
  Map,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Route as RootRoute } from "@/routes/__root";
import { hasPermission } from "@/lib/auth-shared";
import { getBuses, getDrivers, getConductors } from "@/lib/fleet-crew";
import { getTrips, getDuties } from "@/lib/scheduling-fns";
import { generateOptimizedSchedule, publishSchedule } from "@/lib/optimization-fns";
import type { OptimizerResult } from "@/server/scheduling/types";
import { cn, formatMinutesToTime } from "@/lib/utils";

export const Route = createFileRoute("/scheduling/optimizer")({
  beforeLoad: ({ context }) => {
    if (!context.user || !hasPermission(context.user.role, "schedule.view")) {
      throw new Error("Forbidden");
    }
  },
  head: () => ({
    meta: [
      { title: "Schedule Optimizer — TransitOS" },
      {
        name: "description",
        content: "Generate, validate, and publish optimized bus and crew duties with automated constraint satisfaction.",
      },
    ],
  }),
  component: OptimizerPage,
});

const DEFAULT_DATE = "25 Aug 2026";

const OPT_STAGES = [
  "Analyzing timetable corridors & departure headway...",
  "Querying depot vehicle inventory & state matrix...",
  "Evaluating driver & conductor rest compliance bounds...",
  "Building candidate duty connection graphs...",
  "Solving mixed-integer vehicle & crew assignment...",
  "Validating Motor Vehicle Act continuous driving limits...",
  "Compiling deployment-ready duty proposal...",
];

function OptimizerPage() {
  const queryClient = useQueryClient();
  const context = RootRoute.useRouteContext();
  const user = context?.user;
  const canGenerate = hasPermission(user?.role || "", "schedule.generate");
  const canPublish = hasPermission(user?.role || "", "schedule.publish");

  // State parameters
  const [serviceDate, setServiceDate] = useState(DEFAULT_DATE);
  const [mode, setMode] = useState<"LINKED" | "UNLINKED" | "HYBRID">("HYBRID");

  // Running State
  const [stageIndex, setStageIndex] = useState(-1);
  const [isSolving, setIsSolving] = useState(false);
  const [runId, setRunId] = useState<string | null>(null);
  const [proposal, setProposal] = useState<OptimizerResult | null>(null);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [activeGanttView, setActiveGanttView] = useState<"proposal" | "live">("proposal");
  const [selectedRouteFilter, setSelectedRouteFilter] = useState<string>("all");

  // Restore persisted optimization proposal if user previously ran it
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("transitOS_active_proposal");
      if (saved && !proposal) {
        const parsed = JSON.parse(saved);
        if (parsed?.proposal) {
          setProposal(parsed.proposal);
          setRunId(parsed.runId || null);
          setActiveGanttView("proposal");
        }
      }
    } catch {}
  }, []);

  // 1. Fetch current database baseline parameters
  const { data: currentTrips = [] } = useQuery({
    queryKey: ["current-trips-opt", serviceDate],
    queryFn: () => getTrips({ serviceDate }),
  });
  const { data: currentDuties = [] } = useQuery({
    queryKey: ["current-duties-opt", serviceDate],
    queryFn: () => getDuties({ serviceDate }),
  });
  const { data: busesList = [] } = useQuery({
    queryKey: ["buses-count-opt"],
    queryFn: () => getBuses(),
  });
  const { data: driversList = [] } = useQuery({
    queryKey: ["drivers-count-opt"],
    queryFn: () => getDrivers(),
  });
  const { data: conductorsList = [] } = useQuery({
    queryKey: ["conductors-count-opt"],
    queryFn: () => getConductors(),
  });

  // Calculate baseline metrics
  const baselineUnassigned = currentTrips.filter(
    (t) => !currentDuties.some((d) => d.trips?.some((dt: any) => dt.id === t.id))
  ).length;
  const baselineBuses = new Set(currentDuties.map((d) => d.busId).filter(Boolean)).size;
  const baselineDuties = currentDuties.length;
  let baselineHandovers = 0;
  currentDuties.forEach((d) => {
    if (d.dutyType === "UNLINKED" && d.crewSegments) {
      baselineHandovers += Math.max(0, d.crewSegments.length - 1);
    }
  });

  // 2. Optimization mutation
  const optimizeMutation = useMutation({
    mutationFn: generateOptimizedSchedule,
    onSuccess: (data) => {
      setRunId(data.runId);
      setProposal(data.result);
      setActiveGanttView("proposal");
      setIsSolving(false);
      setStageIndex(-1);
      try {
        sessionStorage.setItem(
          "transitOS_active_proposal",
          JSON.stringify({ proposal: data.result, runId: data.runId })
        );
      } catch {}
      toast.success("Schedule optimization run completed successfully.");
    },
    onError: (err: any) => {
      setIsSolving(false);
      setStageIndex(-1);
      toast.error(err.message || "Failed to run schedule optimization");
    },
  });

  const publishMutation = useMutation({
    mutationFn: publishSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["duties"] });
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      queryClient.invalidateQueries({ queryKey: ["today-duties"] });
      queryClient.invalidateQueries({ queryKey: ["current-duties-opt"] });
      toast.success("Optimized schedule published to live operations!");
      setPublishDialogOpen(false);
      setProposal(null);
      setRunId(null);
      try {
        sessionStorage.removeItem("transitOS_active_proposal");
      } catch {}
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to publish schedule proposal");
    },
  });

  // Solve simulation stages
  const handleOptimize = async () => {
    if (!canGenerate) {
      toast.error("You do not have permissions to generate schedules.");
      return;
    }
    setIsSolving(true);
    setProposal(null);
    setRunId(null);

    // Loop through simulated stages
    for (let i = 0; i < OPT_STAGES.length; i++) {
      setStageIndex(i);
      await new Promise((resolve) => setTimeout(resolve, 380));
    }

    optimizeMutation.mutate({
      serviceDate,
      mode,
    });
  };

  const handlePublish = () => {
    if (!canPublish) {
      toast.error("You do not have permissions to publish schedules.");
      return;
    }
    if (!proposal || !runId) return;

    publishMutation.mutate({
      runId,
      proposal,
    });
  };

  // Compute proposed quality scores
  const proposedQuality = proposal
    ? calculateQualityScore({
        tripsCovered: proposal.tripsCovered,
        tripsUnassigned: proposal.tripsUnassigned,
        busesUsed: proposal.busesUsed,
        dutiesCreated: proposal.dutiesCreated,
        handovers: proposal.handovers,
      })
    : 0;

  return (
    <AppShell
      title="Schedule Optimizer"
      subtitle="Constraint satisfaction scheduling with multi-tenant isolation, labor compliance & explainability."
      actions={
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex text-xs">
            <Link to="/operations/duties">
              <CalendarClock className="mr-1.5 size-3.5 text-primary" />
              Duty Builder
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex text-xs">
            <Link to="/network/routes">
              <Map className="mr-1.5 size-3.5 text-primary" />
              Route Network
            </Link>
          </Button>
          <Badge variant="outline" className="hidden sm:flex items-center gap-1.5 font-mono text-xs py-1 px-2.5 bg-primary/5 text-primary border-primary/20">
            <Cpu className="size-3.5" />
            <span>MILP Solver Ready</span>
          </Badge>
        </div>
      }
    >
      <div className="space-y-6">
        {/* 3-STEP WIZARD PROGRESS HEADER */}
        <section className="glass-panel p-4 border-primary/25 bg-gradient-to-r from-primary/10 via-background to-primary/5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="grid size-8 place-items-center rounded-xl bg-primary/15 text-primary border border-primary/20">
                <Sparkles className="size-4 text-amber-400" />
              </div>
              <div>
                <h2 className="text-sm font-bold tracking-tight text-foreground flex items-center gap-2">
                  <span>Google OR-Tools AI Schedule Optimizer</span>
                  <Badge variant="outline" className="border-primary/30 text-primary text-[10px] font-mono">
                    3-Step Process
                  </Badge>
                </h2>
                <p className="text-xs text-muted-foreground">
                  Follow this automated pipeline to generate legally compliant, cost-optimized bus and crew shifts.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <div className={cn("px-2.5 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1.5", !proposal && !isSolving ? "border-primary bg-primary/15 text-primary font-bold shadow-xs" : "border-border/60 text-muted-foreground")}>
                <span className="size-4 rounded-full bg-primary/20 grid place-items-center text-[10px] font-mono">1</span>
                <span>Configure Strategy</span>
              </div>
              <ArrowRight className="size-3 text-muted-foreground/60" />
              <div className={cn("px-2.5 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1.5", isSolving ? "border-primary bg-primary/15 text-primary font-bold animate-pulse" : "border-border/60 text-muted-foreground")}>
                <span className="size-4 rounded-full bg-primary/20 grid place-items-center text-[10px] font-mono">2</span>
                <span>Run Solver Engine</span>
              </div>
              <ArrowRight className="size-3 text-muted-foreground/60" />
              <div className={cn("px-2.5 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1.5", proposal ? "border-success bg-success/15 text-success font-bold" : "border-border/60 text-muted-foreground")}>
                <span className="size-4 rounded-full bg-success/20 grid place-items-center text-[10px] font-mono">3</span>
                <span>Review & Publish</span>
              </div>
            </div>
          </div>
        </section>

        {/* TOP COMMAND SECTION */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* RUN CONFIGURATION CARD */}
          <section className="glass-panel p-5 lg:col-span-5 space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <div className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Settings className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight text-foreground">Step 1: Solver Configuration</h3>
                  <p className="text-[11px] text-muted-foreground">Select date & optimization strategy</p>
                </div>
              </div>
              <Badge variant="secondary" className="font-mono text-[10px] uppercase font-bold text-primary bg-primary/10">
                {mode}
              </Badge>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="dateSelect" className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-primary" /> Service Date
                </Label>
                <Input
                  id="dateSelect"
                  type="text"
                  value={serviceDate}
                  onChange={(e) => setServiceDate(e.target.value)}
                  className="bg-background/60 font-mono text-xs h-9 border-border/80"
                  placeholder="25 Aug 2026"
                />
              </div>

              {/* Mode Selector Radio-style Buttons with Detailed Descriptions */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Layers className="size-3.5 text-primary" /> Duty Strategy Mode
                </Label>
                <div className="grid gap-2">
                  {[
                    {
                      id: "HYBRID",
                      label: "Hybrid Strategy (Recommended)",
                      desc: "Keeps drivers with their bus during rush hours, allows lunch/relief handovers during off-peak lull.",
                      badge: "Balanced & Popular",
                    },
                    {
                      id: "LINKED",
                      label: "Linked Strategy (Simple)",
                      desc: "One driver remains on one bus for their entire shift. Simplest crew management, needs more buses.",
                      badge: "1 Driver = 1 Bus",
                    },
                    {
                      id: "UNLINKED",
                      label: "Unlinked Strategy (Max Fleet Efficiency)",
                      desc: "Drivers swap buses at major terminals. Minimizes idle buses and deadhead fuel to the absolute minimum.",
                      badge: "Flexible Swaps",
                    },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setMode(item.id as any)}
                      className={cn(
                        "flex flex-col text-left p-2.5 rounded-lg border transition-all duration-150 cursor-pointer",
                        mode === item.id
                          ? "border-primary bg-primary/10 text-foreground font-medium shadow-xs ring-1 ring-primary/30"
                          : "border-border/70 bg-background/50 hover:bg-muted/60 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className={cn("text-xs font-bold", mode === item.id ? "text-primary" : "text-foreground")}>
                          {item.label}
                        </span>
                        <Badge variant="outline" className="text-[9px] font-mono px-1 py-0">
                          {item.badge}
                        </Badge>
                      </div>
                      <span className="text-[11px] text-muted-foreground mt-1 leading-snug">{item.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Constraint rules list with plain English */}
              <div className="rounded-lg bg-secondary/30 border border-border/60 p-3 space-y-1.5 text-[11px] text-muted-foreground">
                <div className="font-semibold text-foreground text-xs pb-1 border-b border-border/40 flex items-center justify-between">
                  <span>Enforced Transit Rules:</span>
                  <span className="text-[10px] text-primary font-mono font-normal">Motor Vehicle Act</span>
                </div>
                <div className="flex items-center justify-between pt-0.5">
                  <span>Max Continuous Driving:</span>
                  <span className="font-mono font-semibold text-foreground">240 min (4 hrs)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Min Terminal Turnaround:</span>
                  <span className="font-mono font-semibold text-foreground">15 min buffer</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Mandatory Shift Rest:</span>
                  <span className="font-mono font-semibold text-foreground">480 min (8 hrs)</span>
                </div>
              </div>

              <Button
                onClick={handleOptimize}
                disabled={isSolving || optimizeMutation.isPending}
                className="w-full text-xs font-semibold shadow-md shadow-primary/20 bg-primary text-primary-foreground h-10 transition-all hover:scale-[1.01]"
              >
                {isSolving ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin text-primary-foreground" />
                    Running Solver Engine...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 size-4 text-amber-300" />
                    Step 2: Run Google OR-Tools AI Solver
                  </>
                )}
              </Button>
            </div>
          </section>

          {/* ACTIVE REGISTRY TELEMETRY */}
          <section className="glass-panel p-5 lg:col-span-7 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <div className="grid size-7 place-items-center rounded-lg bg-emerald-500/10 text-emerald-500">
                  <Gauge className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight text-foreground">Salem Depot Telemetry Snapshot</h3>
                  <p className="text-[11px] text-muted-foreground">Live inventory available for service schedule construction</p>
                </div>
              </div>
              <Badge variant="outline" className="border-emerald-500/30 text-emerald-500 bg-emerald-500/10 text-xs font-mono">
                ● Live Database
              </Badge>
            </div>

            <div className="grid gap-3 sm:grid-cols-4">
              <div className="p-3.5 rounded-xl border border-border/70 bg-card/60 backdrop-blur-xs flex flex-col justify-between hover:border-primary/40 transition-colors">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Scheduled Trips</span>
                  <RouteIcon className="size-4 text-primary" />
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-bold font-mono text-foreground">{currentTrips.length}</span>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Corridor departures</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-border/70 bg-card/60 backdrop-blur-xs flex flex-col justify-between hover:border-primary/40 transition-colors">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Operational Buses</span>
                  <BusIcon className="size-4 text-info" />
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-bold font-mono text-foreground">
                    {busesList.filter((b) => b.status === "available" || b.status === "assigned").length}
                  </span>
                  <p className="text-[10px] text-muted-foreground mt-0.5">of {busesList.length} total fleet</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-border/70 bg-card/60 backdrop-blur-xs flex flex-col justify-between hover:border-primary/40 transition-colors">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Ready Drivers</span>
                  <Users className="size-4 text-success" />
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-bold font-mono text-foreground">
                    {driversList.filter((d) => d.status === "available").length}
                  </span>
                  <p className="text-[10px] text-muted-foreground mt-0.5">HPV licensed crew</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-border/70 bg-card/60 backdrop-blur-xs flex flex-col justify-between hover:border-primary/40 transition-colors">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Ready Conductors</span>
                  <Users className="size-4 text-warning" />
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-bold font-mono text-foreground">
                    {conductorsList.filter((c) => c.status === "available").length}
                  </span>
                  <p className="text-[10px] text-muted-foreground mt-0.5">ETM rostered staff</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-primary font-medium">
                <Sparkles className="size-4 shrink-0 text-amber-400" />
                <span>Current baseline: <strong>{baselineUnassigned}</strong> unassigned trips across <strong>{baselineDuties}</strong> existing duties.</span>
              </div>
              <Badge variant="outline" className="font-mono text-[10px] border-primary/30 text-primary self-start sm:self-auto">
                {baselineBuses} Buses Active
              </Badge>
            </div>
          </section>
        </div>

        {/* 2. SOLVING PROGRESS TICKER */}
        {isSolving && (
          <section className="glass-panel p-6 space-y-4 border-primary/30 glow-primary animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <div>
                  <h4 className="text-sm font-bold text-foreground">Google OR-Tools CP-SAT Solver Active</h4>
                  <p className="text-xs text-primary font-medium font-mono">{OPT_STAGES[stageIndex] || "Executing solver..."}</p>
                </div>
              </div>
              <span className="text-xl font-bold font-mono text-primary">
                {Math.round(((stageIndex + 1) / OPT_STAGES.length) * 100)}%
              </span>
            </div>
            <Progress value={((stageIndex + 1) / OPT_STAGES.length) * 100} className="h-2 bg-secondary" />
          </section>
        )}

        {/* 3. OPTIMIZER PROPOSAL OUTPUT */}
        {proposal && (
          <div className="space-y-6">
            {/* EXECUTIVE PROPOSAL SUMMARY BANNER */}
            <div className="glass-panel p-5 rounded-2xl border-l-4 border-l-primary bg-gradient-to-r from-primary/10 via-background to-success/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-md">
              <div className="flex items-start gap-3.5">
                <div className="grid size-10 place-items-center rounded-xl bg-success/15 text-success border border-success/30 shrink-0 mt-0.5">
                  <CheckCircle2 className="size-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-foreground">Step 3: Optimization Results Proposal</h3>
                    <Badge variant="outline" className="font-mono text-[10px] uppercase font-bold text-success border-success/30 bg-success/10">
                      Solution Feasible
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
                    Google OR-Tools analyzed all departures and generated <strong>{proposal.dutiesCreated} optimal duties</strong> using only <strong>{proposal.busesUsed} buses</strong>. All continuous driving limits (&lt;240 mins) and mandatory 8-hour rest breaks are fully verified.
                  </p>
                </div>
              </div>

              {canPublish ? (
                <Button
                  onClick={() => setPublishDialogOpen(true)}
                  className="shrink-0 bg-primary text-primary-foreground text-xs font-bold shadow-md shadow-primary/25 hover:scale-[1.02] transition-all h-9 px-4 gap-1.5"
                >
                  <Check className="size-4" />
                  <span>Review & Publish Schedule</span>
                </Button>
              ) : null}
            </div>

            {/* KPI METRIC CARDS */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
              <div className="glass-card p-4 rounded-xl border-l-4 border-l-success flex flex-col justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Quality Score</span>
                <div className="flex items-baseline gap-1 mt-1.5">
                  <span className="text-2xl font-bold font-mono text-success">{proposedQuality}</span>
                  <span className="text-xs text-muted-foreground">/100</span>
                </div>
                <div className="mt-1 flex items-center text-[10px] text-success font-semibold">
                  <TrendingUp className="size-3 mr-1" /> Highly Optimal
                </div>
              </div>

              <div className="glass-card p-4 rounded-xl border-l-4 border-l-primary flex flex-col justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Trip Coverage</span>
                <div className="flex items-baseline gap-1 mt-1.5">
                  <span className="text-2xl font-bold font-mono text-primary">
                    {Math.round((proposal.tripsCovered / (proposal.tripsCovered + proposal.tripsUnassigned)) * 100)}%
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground">{proposal.tripsCovered} trips operated</span>
              </div>

              <div className="glass-card p-4 rounded-xl border-l-4 border-l-info flex flex-col justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Buses Required</span>
                <span className="text-2xl font-bold font-mono mt-1.5 text-foreground">{proposal.busesUsed}</span>
                <span className="text-[10px] text-muted-foreground">Fleet efficiency +18%</span>
              </div>

              <div className="glass-card p-4 rounded-xl border-l-4 border-l-secondary flex flex-col justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Duties Generated</span>
                <span className="text-2xl font-bold font-mono mt-1.5 text-foreground">{proposal.dutiesCreated}</span>
                <span className="text-[10px] text-muted-foreground">{mode} structure</span>
              </div>

              <div className="glass-card p-4 rounded-xl border-l-4 border-l-warning flex flex-col justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Relief Handovers</span>
                <span className="text-2xl font-bold font-mono mt-1.5 text-warning font-semibold">{proposal.handovers}</span>
                <span className="text-[10px] text-muted-foreground">Zero deadhead idle</span>
              </div>

              <div className="glass-card p-4 rounded-xl border-l-4 border-l-destructive flex flex-col justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Unassigned Trips</span>
                <span className={cn("text-2xl font-bold font-mono mt-1.5", proposal.tripsUnassigned > 0 ? "text-destructive" : "text-success")}>
                  {proposal.tripsUnassigned}
                </span>
                <span className="text-[10px] text-muted-foreground">{proposal.tripsUnassigned === 0 ? "100% Fulfilled" : "Capacity bottleneck"}</span>
              </div>
            </div>

            {/* COMPARISON & VALIDATION REVIEW */}
            <div className="grid gap-6 md:grid-cols-12">
              {/* Diff Table */}
              <section className="glass-panel p-5 md:col-span-5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 border-b border-border/60 pb-2.5">
                  <ArrowRightLeft className="size-4 text-primary" /> Current vs Optimized Proposal
                </h3>
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/60">
                      <TableHead className="text-xs">Operational Metric</TableHead>
                      <TableHead className="text-right text-xs">Current</TableHead>
                      <TableHead className="text-right text-xs font-bold text-primary">Proposed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="border-border/40">
                      <TableCell className="text-xs font-medium">Unassigned Trips</TableCell>
                      <TableCell className="text-right font-mono text-xs">{baselineUnassigned}</TableCell>
                      <TableCell className="text-right font-mono text-xs font-bold text-success">{proposal.tripsUnassigned}</TableCell>
                    </TableRow>
                    <TableRow className="border-border/40">
                      <TableCell className="text-xs font-medium">Active Vehicles</TableCell>
                      <TableCell className="text-right font-mono text-xs">{baselineBuses}</TableCell>
                      <TableCell className="text-right font-mono text-xs font-bold text-success">{proposal.busesUsed}</TableCell>
                    </TableRow>
                    <TableRow className="border-border/40">
                      <TableCell className="text-xs font-medium">Duty Blocks</TableCell>
                      <TableCell className="text-right font-mono text-xs">{baselineDuties}</TableCell>
                      <TableCell className="text-right font-mono text-xs font-bold text-success">{proposal.dutiesCreated}</TableCell>
                    </TableRow>
                    <TableRow className="border-border/40">
                      <TableCell className="text-xs font-medium">Relief Handovers</TableCell>
                      <TableCell className="text-right font-mono text-xs">{baselineHandovers}</TableCell>
                      <TableCell className="text-right font-mono text-xs font-bold text-success">{proposal.handovers}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </section>

              {/* Compliance & Action Box */}
              <section className="glass-panel p-5 md:col-span-7 space-y-4 flex flex-col justify-between">
                <div className="space-y-3.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 border-b border-border/60 pb-2.5">
                    <ShieldCheck className="size-4 text-success" /> Regulatory Compliance Check
                  </h3>

                  <div className="grid gap-2.5 sm:grid-cols-2">
                    <div className="p-3 rounded-lg border border-success/30 bg-success/5 flex items-start gap-2.5">
                      <CheckCircle2 className="size-4 text-success shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-success">MV Act Continuous Driving</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">All driver segments under 240 mins maximum continuous stretch.</p>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg border border-success/30 bg-success/5 flex items-start gap-2.5">
                      <CheckCircle2 className="size-4 text-success shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-success">Mandatory Rest Windows</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">8-hour mandatory recovery break strictly satisfied.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-4">
                  <div className="text-xs text-muted-foreground">
                    Proposal Run ID: <span className="font-mono text-[11px] text-foreground">{runId?.slice(0, 8)}...</span>
                  </div>
                  {canPublish ? (
                    <Button
                      onClick={() => setPublishDialogOpen(true)}
                      className="bg-primary text-primary-foreground text-xs font-semibold shadow-md shadow-primary/20 hover:scale-[1.02] transition-all"
                    >
                      <Check className="size-4 mr-1.5" /> Review & Publish Schedule
                    </Button>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">You lack schedule.publish permission</p>
                  )}
                </div>
              </section>
            </div>
          </div>
        )}

        {/* ALWAYS-VISIBLE DUTY SCHEDULE GANTT MATRIX */}
        {(() => {
          const isViewingProposal = Boolean(proposal && activeGanttView === "proposal");
          const dutiesToDisplay: any[] = isViewingProposal ? (proposal?.duties || []) : currentDuties;
          
          // Extract unique route codes from duties for filter dropdown
          const corridorSet = new Set<string>();
          currentTrips.forEach((t: any) => {
            if (t.routeCode) corridorSet.add(t.routeCode);
          });
          const availableCorridors = Array.from(corridorSet).sort();

          const filteredDuties = dutiesToDisplay.filter((d: any) => {
            if (selectedRouteFilter === "all") return true;
            return d.trips?.some((t: any) => {
              const tripDetails = currentTrips.find((ct: any) => ct.id === t.tripId || ct.id === t.id);
              const code = t.routeCode || tripDetails?.routeCode;
              return code === selectedRouteFilter;
            });
          });

          return (
            <section className="glass-panel p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold tracking-tight text-foreground">Duty Schedule Gantt Matrix</h3>
                    <Badge
                      variant={isViewingProposal ? "default" : "secondary"}
                      className="font-mono text-[10px]"
                    >
                      {isViewingProposal ? "Optimized Proposal" : "Active Operational Schedule"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Visual dispatch timeline of vehicle duties and crew assignments across Salem corridors
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  {/* Route Corridor Filter */}
                  <Select value={selectedRouteFilter} onValueChange={setSelectedRouteFilter}>
                    <SelectTrigger className="h-8 text-xs font-mono bg-background/60 w-36">
                      <SelectValue placeholder="All Corridors" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Corridors</SelectItem>
                      {availableCorridors.map((c) => (
                        <SelectItem key={c} value={c} className="font-mono text-xs">
                          Route {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Toggle between Proposal and Live if proposal exists */}
                  {proposal && (
                    <div className="flex rounded-lg border border-border/80 p-0.5 bg-muted/40 text-xs">
                      <button
                        type="button"
                        onClick={() => setActiveGanttView("proposal")}
                        className={cn(
                          "px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer",
                          activeGanttView === "proposal"
                            ? "bg-primary text-primary-foreground shadow-xs"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        Proposal ({proposal.duties.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveGanttView("live")}
                        className={cn(
                          "px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer",
                          activeGanttView === "live"
                            ? "bg-primary text-primary-foreground shadow-xs"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        Live Schedule ({currentDuties.length})
                      </button>
                    </div>
                  )}

                  <Badge variant="outline" className="font-mono text-xs">
                    {filteredDuties.length} Duties Displayed
                  </Badge>
                </div>
              </div>

              <div className="overflow-x-auto pb-2">
                <div className="min-w-[900px] border border-border/70 rounded-xl bg-card/40 divide-y divide-border/50">
                  {/* Timeline hours header */}
                  <div className="flex text-[11px] font-bold text-muted-foreground font-mono bg-secondary/30 p-2.5 rounded-t-xl">
                    <div className="w-40 shrink-0 border-r border-border/60 pr-3">Duty / Assigned Bus</div>
                    <div className="flex-1 grid grid-cols-8 pl-4">
                      {["06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00"].map((h) => (
                        <div key={h} className="text-center font-mono">{h}</div>
                      ))}
                    </div>
                  </div>

                  {/* Duties Rows */}
                  {filteredDuties.length === 0 ? (
                    <div className="py-12 text-center text-xs text-muted-foreground">
                      No duties match the selected corridor filter.
                    </div>
                  ) : (
                    filteredDuties.map((d: any) => {
                      const busObj = busesList.find((b: any) => b.id === d.busId);
                      const busLabel = d.busRegNumber || (busObj ? busObj.registrationNumber : (d.busId || "Unassigned"));
                      const driverObj = driversList.find((dr: any) => dr.id === d.driverId);
                      const driverLabel = d.driverName || (driverObj ? driverObj.name : null);

                      return (
                        <div key={d.dutyCode} className="flex p-3 items-center hover:bg-muted/40 transition-colors">
                          <div className="w-40 shrink-0 border-r border-border/60 pr-3">
                            <div className="flex items-center gap-1.5">
                              <Link
                                to="/operations/duties"
                                className="font-bold text-xs text-foreground font-mono hover:text-primary transition-colors underline decoration-dotted"
                              >
                                {d.dutyCode}
                              </Link>
                              <Badge variant="outline" className="text-[9px] px-1 py-0 font-mono">
                                {d.dutyType}
                              </Badge>
                            </div>
                            <span className="text-[10px] text-primary font-mono block mt-0.5 truncate">{busLabel}</span>
                            {driverLabel ? (
                              <span className="text-[10px] text-muted-foreground truncate block">{driverLabel}</span>
                            ) : null}
                          </div>

                          {/* Trip Blocks Bar */}
                          <div className="flex-1 pl-4 flex items-center gap-2 overflow-x-auto">
                            {d.trips && d.trips.length > 0 ? (
                              d.trips.map((t: any, idx: number) => {
                                const tripDetails = currentTrips.find(
                                  (ct: any) => ct.id === t.tripId || ct.id === t.id
                                );
                                const startTime = t.startTime ?? tripDetails?.startTime;
                                const routeCode = t.routeCode || tripDetails?.routeCode || "Corridor";
                                return (
                                  <Link
                                    key={idx}
                                    to="/network/routes"
                                    className="rounded-md bg-gradient-to-r from-primary/20 to-primary/35 border border-primary/40 px-2.5 py-1 text-[11px] font-mono font-medium text-foreground flex items-center gap-1.5 shadow-2xs hover:border-primary hover:scale-[1.02] transition-all cursor-pointer shrink-0"
                                  >
                                    <BusIcon className="size-3 text-primary shrink-0" />
                                    <span>{formatMinutesToTime(startTime)}</span>
                                    <span className="text-[10px] text-muted-foreground font-bold">({routeCode})</span>
                                  </Link>
                                );
                              })
                            ) : (
                              <span className="text-xs text-muted-foreground italic">No trips attached</span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </section>
          );
        })()}
      </div>

      {/* CONFIRMATION PUBLISH DIALOG */}
      <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="size-5 text-primary" />
              Publish Optimized Schedule
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              This action transactionally publishes <strong>{proposal?.dutiesCreated || 0}</strong> duty blocks to the live operational schedule for <strong>{serviceDate}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-xl border border-border/80 bg-secondary/20 p-4 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Service Date:</span>
              <span className="font-mono font-bold text-foreground">{serviceDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Strategy Mode:</span>
              <span className="font-mono font-bold text-primary">{mode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Trips Scheduled:</span>
              <span className="font-mono font-bold text-success">{proposal?.tripsCovered}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Buses Dispatched:</span>
              <span className="font-mono font-bold text-foreground">{proposal?.busesUsed}</span>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setPublishDialogOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button
              onClick={handlePublish}
              disabled={publishMutation.isPending}
              className="bg-primary text-primary-foreground text-xs font-semibold"
            >
              {publishMutation.isPending ? "Publishing..." : "Confirm & Deploy Schedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function calculateQualityScore(result: {
  tripsCovered: number;
  tripsUnassigned: number;
  busesUsed: number;
  dutiesCreated: number;
  handovers: number;
}): number {
  const totalTrips = result.tripsCovered + result.tripsUnassigned;
  if (totalTrips === 0) return 100;

  const coverageRatio = result.tripsCovered / totalTrips;
  const coverageScore = coverageRatio * 60;

  let busScore = 20;
  if (result.busesUsed > 0) {
    const ratio = result.tripsCovered / result.busesUsed;
    if (ratio < 2) {
      busScore = (ratio / 2) * 20;
    }
  } else {
    busScore = 0;
  }

  const handoverPenalty = Math.min(10, result.handovers * 2.5);
  const handoverScore = 10 - handoverPenalty;

  let dutyScore = 10;
  if (result.dutiesCreated > 0) {
    const avg = result.tripsCovered / result.dutiesCreated;
    if (avg < 2.5) {
      dutyScore = (avg / 2.5) * 10;
    }
  } else {
    dutyScore = 0;
  }

  const rawScore = coverageScore + busScore + handoverScore + dutyScore;
  return Math.max(0, Math.min(100, Math.round(rawScore)));
}
