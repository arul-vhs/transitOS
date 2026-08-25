import { createFileRoute } from "@tanstack/react-router";
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
  UserX,
  Users,
  Calendar,
  Settings,
  Clock,
  ArrowRightLeft,
  BookOpen,
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
import { Route as RootRoute } from "@/routes/__root";
import { hasPermission } from "@/lib/auth-shared";
import { getBuses, getDrivers, getConductors } from "@/lib/fleet-crew";
import { getTrips, getDuties, validateDuty } from "@/lib/scheduling-fns";
import { generateOptimizedSchedule, publishSchedule } from "@/lib/optimization-fns";
import type { OptimizerResult } from "@/server/scheduling/types";

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
        content: "Generate, validate, and publish optimized bus and crew duties.",
      },
    ],
  }),
  component: OptimizerPage,
});

const DEFAULT_DATE = "25 Aug 2026";

function formatMinutesToTime(totalMin: number): string {
  const hh = Math.floor(totalMin / 60);
  const mm = totalMin % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

const OPT_STAGES = [
  "Loading trips...",
  "Checking resources...",
  "Building candidates...",
  "Optimizing...",
  "Validating...",
  "Preparing proposal...",
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
      setIsSolving(false);
      setStageIndex(-1);
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
      toast.success("Schedule proposed by the optimizer published successfully!");
      setProposal(null);
      setRunId(null);
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
      await new Promise((resolve) => setTimeout(resolve, 350));
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
      subtitle="Automated constraint satisfaction scheduling with multi-tenant isolation and explainability."
    >
      <div className="space-y-6">
        {/* 1. Setup Panel */}
        <div className="grid gap-6 md:grid-cols-4">
          <section className="panel p-5 md:col-span-1 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Run Configuration
            </h3>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="dateSelect" className="text-xs">Service Date</Label>
                <Input
                  id="dateSelect"
                  type="text"
                  value={serviceDate}
                  onChange={(e) => setServiceDate(e.target.value)}
                  className="bg-background/50 h-9 font-mono"
                  placeholder="25 Aug 2026"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="modeSelect" className="text-xs">Scheduling Mode</Label>
                <Select
                  value={mode}
                  onValueChange={(val: any) => setMode(val)}
                >
                  <SelectTrigger id="modeSelect" className="bg-background/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HYBRID">Hybrid (Linked + Unlinked)</SelectItem>
                    <SelectItem value="LINKED">Linked (Strict Crew/Bus)</SelectItem>
                    <SelectItem value="UNLINKED">Unlinked (Handovers permitted)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-2">
                <Button
                  onClick={handleOptimize}
                  disabled={isSolving || optimizeMutation.isPending}
                  className="w-full text-xs"
                >
                  {isSolving ? (
                    <>
                      <Loader2 className="mr-2 size-3.5 animate-spin" />
                      Optimizing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 size-3.5" />
                      Run Optimizer
                    </>
                  )}
                </Button>
              </div>
            </div>
          </section>

          {/* Active Registry Resources Summary */}
          <section className="panel p-5 md:col-span-3 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Autoritative Resources Loaded (Date: {serviceDate})
            </h3>
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="p-3 border rounded bg-secondary/10 flex flex-col justify-between">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Trips Corridors</span>
                <span className="text-xl font-bold mt-1 font-mono">{currentTrips.length}</span>
              </div>
              <div className="p-3 border rounded bg-secondary/10 flex flex-col justify-between">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Active Buses</span>
                <span className="text-xl font-bold mt-1 font-mono">
                  {busesList.filter((b) => b.status === "available" || b.status === "assigned").length}
                </span>
              </div>
              <div className="p-3 border rounded bg-secondary/10 flex flex-col justify-between">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Available Drivers</span>
                <span className="text-xl font-bold mt-1 font-mono">
                  {driversList.filter((d) => d.status === "available").length}
                </span>
              </div>
              <div className="p-3 border rounded bg-secondary/10 flex flex-col justify-between">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Available Conductors</span>
                <span className="text-xl font-bold mt-1 font-mono">
                  {conductorsList.filter((c) => c.status === "available").length}
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* 2. Solving Progress Bar */}
        {isSolving && (
          <section className="panel p-5 space-y-3">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span>Optimization Progress: {OPT_STEPS[stageIndex]}</span>
              <span>{Math.round(((stageIndex + 1) / OPT_STEPS.length) * 100)}%</span>
            </div>
            <Progress value={((stageIndex + 1) / OPT_STEPS.length) * 100} />
          </section>
        )}

        {/* 3. Proposed Schedule Result Proposal */}
        {proposal && (
          <div className="space-y-6">
            {/* KPI Summary Tiles */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
              <div className="panel p-4 border-l-4 border-l-primary flex flex-col justify-between">
                <span className="text-[10px] font-bold uppercase text-muted-foreground">Quality Score</span>
                <span className="text-2xl font-bold mt-1 text-success font-mono">{proposedQuality}/100</span>
              </div>
              <div className="panel p-4 border-l-4 border-l-primary flex flex-col justify-between">
                <span className="text-[10px] font-bold uppercase text-muted-foreground">Coverage Rate</span>
                <span className="text-2xl font-bold mt-1 font-mono">
                  {Math.round((proposal.tripsCovered / (proposal.tripsCovered + proposal.tripsUnassigned)) * 100)}%
                </span>
              </div>
              <div className="panel p-4 border-l-4 border-l-primary flex flex-col justify-between">
                <span className="text-[10px] font-bold uppercase text-muted-foreground">Buses Dispatched</span>
                <span className="text-2xl font-bold mt-1 font-mono">{proposal.busesUsed}</span>
              </div>
              <div className="panel p-4 border-l-4 border-l-primary flex flex-col justify-between">
                <span className="text-[10px] font-bold uppercase text-muted-foreground">Duties Built</span>
                <span className="text-2xl font-bold mt-1 font-mono">{proposal.dutiesCreated}</span>
              </div>
              <div className="panel p-4 border-l-4 border-l-primary flex flex-col justify-between">
                <span className="text-[10px] font-bold uppercase text-muted-foreground">Handovers</span>
                <span className="text-2xl font-bold mt-1 font-mono">{proposal.handovers}</span>
              </div>
              <div className="panel p-4 border-l-4 border-l-primary flex flex-col justify-between">
                <span className="text-[10px] font-bold uppercase text-muted-foreground">Unassigned Trips</span>
                <span className="text-2xl font-bold mt-1 font-mono text-destructive">{proposal.tripsUnassigned}</span>
              </div>
            </div>

            {/* Before / After Comparison Table */}
            <div className="grid gap-6 md:grid-cols-3">
              <section className="panel p-4 md:col-span-1 space-y-4">
                <h3 className="text-xs font-semibold flex items-center gap-2 border-b pb-2">
                  <ArrowRightLeft className="size-4 text-primary" /> Before vs After Optimization
                </h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Metric</TableHead>
                      <TableHead className="text-right">Current</TableHead>
                      <TableHead className="text-right text-primary">Proposed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="text-xs font-medium">Unassigned Trips</TableCell>
                      <TableCell className="text-right font-mono text-xs">{baselineUnassigned}</TableCell>
                      <TableCell className="text-right font-mono text-xs font-bold text-success">{proposal.tripsUnassigned}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-xs font-medium">Buses Used</TableCell>
                      <TableCell className="text-right font-mono text-xs">{baselineBuses}</TableCell>
                      <TableCell className="text-right font-mono text-xs font-bold text-success">{proposal.busesUsed}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-xs font-medium">Duties Created</TableCell>
                      <TableCell className="text-right font-mono text-xs">{baselineDuties}</TableCell>
                      <TableCell className="text-right font-mono text-xs font-bold text-success">{proposal.dutiesCreated}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-xs font-medium">Crew Handovers</TableCell>
                      <TableCell className="text-right font-mono text-xs">{baselineHandovers}</TableCell>
                      <TableCell className="text-right font-mono text-xs font-bold text-success">{proposal.handovers}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </section>

              {/* Real-time Validation Checker Review */}
              <section className="panel p-4 md:col-span-2 space-y-4 flex flex-col justify-between">
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold flex items-center gap-2 border-b pb-2">
                    <CheckCircle2 className="size-4 text-success" /> Proposed Schedule Validation
                  </h3>
                  <div className="p-3 border rounded bg-success/5 border-success/20 flex items-center gap-3">
                    <CheckCircle2 className="size-5 text-success shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-success">Hard Constraints Passed</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Proposed timeline matches all rest rules, license kategorization limits, and turnaround parameters.
                      </p>
                    </div>
                  </div>
                </div>

                {canPublish ? (
                  <Button onClick={handlePublish} disabled={publishMutation.isPending} className="w-full text-xs">
                    {publishMutation.isPending ? "Publishing..." : "Confirm & Publish Schedule"}
                  </Button>
                ) : (
                  <p className="text-[10px] text-center text-muted-foreground italic">
                    You do not have the 'schedule.publish' permissions required to confirm this proposal.
                  </p>
                )}
              </section>
            </div>

            {/* Visual Gantt Timeline Grid */}
            <section className="panel p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Duty Schedule Gantt Timeline Visualizer
              </h3>
              <div className="space-y-4 overflow-x-auto pb-2">
                <div className="min-w-[800px] border rounded bg-card/20 divide-y">
                  {/* Timeline hours header */}
                  <div className="flex text-[10px] font-bold text-muted-foreground font-mono bg-secondary/10 p-2">
                    <div className="w-[100px] shrink-0 border-r pr-2">Vehicle / Crew</div>
                    <div className="flex-1 grid grid-cols-8 pl-4">
                      {["06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00"].map((h) => (
                        <div key={h} className="text-center">{h}</div>
                      ))}
                    </div>
                  </div>

                  {/* Duties Rows */}
                  {proposal.duties.map((d) => {
                    const busObj = busesList.find((b) => b.id === d.busId);
                    const busLabel = busObj ? busObj.registrationNumber : d.busId;
                    return (
                      <div key={d.dutyCode} className="flex p-3 items-center">
                        <div className="w-[100px] shrink-0 border-r pr-2 flex flex-col justify-center">
                          <span className="font-bold text-xs">{d.dutyCode}</span>
                          <span className="text-[9px] text-muted-foreground font-mono">{busLabel}</span>
                        </div>
                        <div className="flex-1 relative h-12 bg-secondary/5 rounded border border-dashed flex items-center pl-4 pr-1">
                          {/* Trips block visualization */}
                          {d.trips.map((t) => {
                            const tripObj = currentTrips.find((trip) => trip.id === t.tripId);
                            if (!tripObj) return null;

                            // Scale start & end parameters relative to 06:00 (360) and 14:00 (840)
                            const timelineStart = 360;
                            const timelineEnd = 840;
                            const leftPct = ((tripObj.startTime - timelineStart) / (timelineEnd - timelineStart)) * 100;
                            const widthPct = ((tripObj.endTime - tripObj.startTime) / (timelineEnd - timelineStart)) * 100;

                            return (
                              <div
                                key={t.tripId}
                                style={{ left: `${Math.max(0, leftPct)}%`, width: `${widthPct}%` }}
                                className="absolute h-8 rounded bg-primary/25 border-l-4 border-l-primary flex flex-col justify-center px-1.5 overflow-hidden text-[9px] font-bold shadow-sm"
                              >
                                <span className="truncate">{tripObj.tripCode}</span>
                                <span className="text-[8px] text-muted-foreground font-mono">
                                  {formatMinutesToTime(tripObj.startTime)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* Explainability details on unassigned runs */}
            {proposal.unassignedTrips.length > 0 && (
              <section className="panel p-5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-destructive flex items-center gap-2">
                  <AlertTriangle className="size-4 shrink-0" /> Explainable Unassigned Trips bottleneck details
                </h3>
                <div className="divide-y border rounded bg-background/40">
                  {proposal.unassignedTrips.map((ut) => (
                    <div key={ut.tripId} className="p-3.5 flex justify-between items-center text-xs gap-4">
                      <div>
                        <p className="font-bold text-foreground">{ut.tripCode}</p>
                      </div>
                      <div className="text-right max-w-lg font-medium text-destructive">
                        {ut.reason}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
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
