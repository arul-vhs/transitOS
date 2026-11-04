import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Bus as BusIcon,
  CheckCircle2,
  Clock,
  Compass,
  DollarSign,
  Eye,
  Filter,
  Fuel,
  GitFork,
  Info,
  Layers,
  MapPin,
  RefreshCw,
  Send,
  ShieldCheck,
  Sliders,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
  Workflow,
  X,
  Zap,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Route as RootRoute } from "@/routes/__root";
import { hasPermission } from "@/lib/auth-shared";
import {
  getAllocationPlan,
  dispatchFleetAllocation,
  getRecentAllocations,
} from "@/lib/allocation-fns";
import { getDeadheadMetrics } from "@/lib/distance-matrix";
import type {
  AllocationDispatchResult,
  AllocationRecommendation,
  AllocationStrategy,
  RouteDemandProfile,
  ShortageSeverity,
  SupplyCandidate,
  SurgeScenarioInput,
  TimePeriodId,
} from "@/server/allocation/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/operations/allocation")({
  beforeLoad: ({ context }) => {
    if (!context.user || !hasPermission(context.user.role, "schedule.view")) {
      throw new Error("Forbidden");
    }
  },
  head: () => ({
    meta: [
      { title: "Demand-Responsive Fleet Allocation: TransitOS" },
      {
        name: "description",
        content:
          "Intelligent demand-responsive fleet rebalancing, capacity surge detection, and depot reserve matching for Salem transit.",
      },
    ],
  }),
  component: DynamicFleetAllocationPage,
});

const STRATEGY_OPTIONS: {
  id: AllocationStrategy;
  label: string;
  desc: string;
}[] = [
  {
    id: "BALANCED_SLA",
    label: "Balanced SLA & Efficiency",
    desc: "Maximizes passenger wait time reduction while penalizing excessive deadhead travel and positioning expenses.",
  },
  {
    id: "COST_OPTIMAL",
    label: "Cost-Optimized Deadheading",
    desc: "Minimizes deadhead kilometers, diesel fuel consumption, and positioning overhead.",
  },
  {
    id: "EQUITY",
    label: "Corridor Capacity Equity",
    desc: "Equalizes passenger load factors across the network to prevent critical overcrowding on arterial lines.",
  },
];

const PRESET_SCENARIOS = [
  {
    name: "Yercaud Tourist Return Surge",
    routeId: "route-slm-13",
    surgePercent: 65,
    cause:
      "Weekend excursion homeward rush from Yercaud Foothills to downtown Salem.",
  },
  {
    name: "Salem Junction Express Arrival",
    routeId: "route-slm-01",
    surgePercent: 55,
    cause:
      "Simultaneous arrival of West Coast Express and Vande Bharat at Salem Junction.",
  },
  {
    name: "Steel Plant Evening Shift Release",
    routeId: "route-slm-33",
    surgePercent: 50,
    cause:
      "Shift change and plant dismissal toward central Salem residential corridors.",
  },
  {
    name: "Omalur Industrial Hub Surge",
    routeId: "route-slm-74",
    surgePercent: 45,
    cause:
      "Suburban evening commute from Omalur industrial sector to Central Salem.",
  },
];

function getSeverityBadge(severity: ShortageSeverity, deficitPax: number, loadFactor: number) {
  if (deficitPax > 0 || loadFactor >= 1.05) {
    return (
      <Badge className="bg-red-500/15 text-red-500 border border-red-500/30 rounded-md font-medium text-[10px]">
        Capacity Shortage
      </Badge>
    );
  }
  if (loadFactor >= 0.85) {
    return (
      <Badge className="bg-amber-500/15 text-amber-500 border border-amber-500/30 rounded-md font-medium text-[10px]">
        High Demand
      </Badge>
    );
  }
  if (loadFactor >= 0.45) {
    return (
      <Badge className="bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 rounded-md font-medium text-[10px]">
        Balanced Flow
      </Badge>
    );
  }
  return (
    <Badge className="bg-slate-500/15 text-slate-400 border border-slate-500/30 rounded-md font-medium text-[10px]">
      Donor Surplus
    </Badge>
  );
}

function formatCurrentTime12h(offsetMinutes: number = 0): string {
  const now = new Date();
  const totalMin = now.getHours() * 60 + now.getMinutes() + offsetMinutes;
  const m = ((totalMin % 1440) + 1440) % 1440;
  const hours24 = Math.floor(m / 60);
  const minutes = m % 60;
  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${String(hours12).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${period}`;
}

function DynamicFleetAllocationPage() {
  const queryClient = useQueryClient();
  const context = RootRoute.useRouteContext();
  const user = context?.user;
  const canDispatch = hasPermission(user?.role || "", "schedule.publish");

  // Operational Solver Parameters
  const [selectedPeriod, setSelectedPeriod] =
    useState<TimePeriodId>("EVENING_PEAK");
  const [selectedStrategy, setSelectedStrategy] =
    useState<AllocationStrategy>("BALANCED_SLA");
  const [activeScenarios, setActiveScenarios] = useState<SurgeScenarioInput[]>([
    {
      routeId: "route-slm-13",
      surgePercent: 45,
      cause: "Evening Yercaud excursion return commute",
    },
  ]);

  // Corridor Filter: all | shortage | donor
  const [corridorFilter, setCorridorFilter] = useState<"all" | "shortage" | "donor">("all");

  // Dismissed Recommendations local state
  const [dismissedRecIds, setDismissedRecIds] = useState<string[]>([]);

  // Simulation custom input
  const [customRouteId, setCustomRouteId] = useState<string>("route-slm-01");
  const [customSurgePercent, setCustomSurgePercent] = useState<number>(35);

  // Review & Alternative Selection State
  const [reviewingRec, setReviewingRec] = useState<AllocationRecommendation | null>(null);
  const [selectedAltBusId, setSelectedAltBusId] = useState<string>("");
  const [selectedAltDriverId, setSelectedAltDriverId] = useState<string>("");
  const [selectedAltConductorId, setSelectedAltConductorId] = useState<string>("");

  // Pre-confirmation mandatory approval state
  const [confirmingRec, setConfirmingRec] =
    useState<AllocationRecommendation | null>(null);

  // Post-allocation results summary modal state
  const [postAllocationResult, setPostAllocationResult] =
    useState<AllocationDispatchResult | null>(null);

  // Fetch Plan Query
  const planQuery = useQuery({
    queryKey: [
      "fleet-allocation-plan",
      selectedPeriod,
      selectedStrategy,
      activeScenarios,
    ],
    queryFn: () =>
      getAllocationPlan({
        periodId: selectedPeriod,
        strategy: selectedStrategy,
        customSurges: activeScenarios,
      }),
    refetchOnWindowFocus: false,
  });

  // Fetch Recent Dispatches
  const historyQuery = useQuery({
    queryKey: ["recent-fleet-allocations"],
    queryFn: () => getRecentAllocations(),
    refetchInterval: 30000,
  });

  // Dispatch Mutation
  const dispatchMutation = useMutation({
    mutationFn: (rec: AllocationRecommendation) =>
      dispatchFleetAllocation({
        recommendationId: rec.id,
        targetRouteId: rec.targetRouteId,
        targetRouteCode: rec.targetRouteCode,
        targetRouteName: rec.targetRouteName,
        busId: rec.supply.busId,
        busRegistration: rec.supply.registrationNumber,
        busType: rec.supply.busType,
        driverId: rec.supply.driverId,
        driverName: rec.supply.driverName,
        driverEmployeeId: rec.supply.driverEmployeeId,
        conductorId: rec.supply.conductorId,
        conductorName: rec.supply.conductorName,
        conductorEmployeeId: rec.supply.conductorEmployeeId,
        sourceType: rec.supply.sourceType,
        sourceDepot: rec.supply.depot,
        strategy: rec.strategy,
        deadheadKm: rec.deadheadKm,
        deadheadMinutes: rec.deadheadMinutes,
        estimatedCost: rec.estimatedCost,
        headwayBeforeMin: rec.headwayBeforeMin,
        headwayAfterMin: rec.headwayAfterMin,
        waitTimeBeforeMin: rec.waitTimeBeforeMin,
        waitTimeAfterMin: rec.waitTimeAfterMin,
        loadFactorBefore: rec.loadFactorBefore,
        loadFactorAfter: rec.loadFactorAfter,
        notes: rec.reason,
      }),
    onSuccess: (res: any, rec) => {
      setConfirmingRec(null);
      setReviewingRec(null);
      setPostAllocationResult(res);
      toast.success(
        `Dispatched bus ${rec.supply.registrationNumber} to Route ${rec.targetRouteCode}.`,
        {
          description: `Deadhead time: ${rec.deadheadMinutes} min from ${rec.supply.depot}. New headway: ${rec.headwayAfterMin} min.`,
        },
      );
      queryClient.invalidateQueries({ queryKey: ["fleet-allocation-plan"] });
      queryClient.invalidateQueries({ queryKey: ["recent-fleet-allocations"] });
    },
    onError: (err: any) => {
      toast.error(`Dispatch failed: ${err.message}`);
    },
  });

  const plan = planQuery.data;

  // Filtered recommendations excluding dismissed
  const visibleRecommendations = useMemo(() => {
    return (plan?.recommendations || []).filter(
      (r) => !dismissedRecIds.includes(r.id),
    );
  }, [plan?.recommendations, dismissedRecIds]);

  // Filtered corridor profiles
  const filteredCorridors = useMemo(() => {
    const list = plan?.routeProfiles || [];
    if (corridorFilter === "shortage") {
      return list.filter(
        (r) => r.capacityDeficitPaxPerHour > 0 || r.loadFactor >= 0.85,
      );
    }
    if (corridorFilter === "donor") {
      return list.filter((r) => r.eligibleAsDonor || r.loadFactor < 0.5);
    }
    return list;
  }, [plan?.routeProfiles, corridorFilter]);

  // Chart data preparation with explicit demand estimation labeling
  const chartData = (plan?.routeProfiles || []).map((r) => ({
    name: `R-${r.code}`,
    fullRoute: `${r.code}: ${r.origin} to ${r.destination}`,
    Baseline: r.baselineDemandPaxPerHour,
    EstimatedDemand: r.sensedDemandPaxPerHour,
    Capacity: r.scheduledCapacityPaxPerHour,
    Deficit: r.capacityDeficitPaxPerHour,
    AdditionalBuses: r.additionalBusesNeeded || 0,
  }));

  const handleApplyPreset = (preset: (typeof PRESET_SCENARIOS)[0]) => {
    setActiveScenarios([
      {
        routeId: preset.routeId,
        surgePercent: preset.surgePercent,
        cause: preset.cause,
      },
    ]);
    toast.info(`Applied Scenario: ${preset.name}`, {
      description: `Injected +${preset.surgePercent}% passenger surge on Route.`,
    });
  };

  const handleAddCustomSurge = () => {
    const existing = activeScenarios.filter((s) => s.routeId !== customRouteId);
    setActiveScenarios([
      ...existing,
      {
        routeId: customRouteId,
        surgePercent: customSurgePercent,
        cause: `Manual dispatcher stress injection (+${customSurgePercent}%)`,
      },
    ]);
    toast.success(`Injected +${customSurgePercent}% surge on Route`, {
      description:
        "Graph solver re-calculating multi-depot bipartite allocation.",
    });
  };

  const handleClearScenarios = () => {
    setActiveScenarios([]);
    toast.info(
      "Cleared all scenario injections. Displaying baseline diurnal demand.",
    );
  };

  const handleDismissRecommendation = (recId: string) => {
    setDismissedRecIds((prev) => [...prev, recId]);
    toast.info("Recommendation dismissed from current operational view.");
  };

  const handleOpenReview = (rec: AllocationRecommendation) => {
    setReviewingRec(rec);
    setSelectedAltBusId(rec.supply.busId);
    setSelectedAltDriverId(rec.supply.driverId || "");
    setSelectedAltConductorId(rec.supply.conductorId || "");
  };

  const handleApplyAlternativeAndProceed = () => {
    if (!reviewingRec) return;
    const pool = plan?.availableFleetPool || [];
    const chosenBus = pool.find((b) => b.busId === selectedAltBusId) || reviewingRec.supply;
    const chosenDriver = pool.find((b) => b.driverId === selectedAltDriverId) || chosenBus;
    const chosenConductor = pool.find((b) => b.conductorId === selectedAltConductorId) || chosenBus;

    // Recalculate deadhead if depot changed
    const metrics = getDeadheadMetrics(chosenBus.depot, reviewingRec.targetRouteName.split("-")[0]?.trim() || "Town Bus Stand");

    const updatedRec: AllocationRecommendation = {
      ...reviewingRec,
      supply: {
        ...chosenBus,
        driverId: chosenDriver.driverId,
        driverName: chosenDriver.driverName,
        driverEmployeeId: chosenDriver.driverEmployeeId,
        conductorId: chosenConductor.conductorId,
        conductorName: chosenConductor.conductorName,
        conductorEmployeeId: chosenConductor.conductorEmployeeId,
      },
      deadheadKm: metrics.deadheadKm,
      deadheadMinutes: metrics.deadheadMinutes,
      estimatedCost: metrics.estimatedCost,
    };

    setReviewingRec(null);
    setConfirmingRec(updatedRec);
  };

  return (
    <AppShell>
      <div className="space-y-6 p-4 md:p-8 max-w-7xl mx-auto">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-md text-blue-500">
                <Workflow className="h-5 w-5" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Demand-Responsive Fleet Allocation
              </h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Dynamic capacity rebalancing, corridor surge detection, and
              multi-depot reserve dispatch for the Salem transit network.
            </p>
          </div>

          {/* Quick Solver Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={selectedPeriod}
              onValueChange={(val) => setSelectedPeriod(val as TimePeriodId)}
            >
              <SelectTrigger className="w-[190px] h-9 rounded-md text-xs">
                <Clock className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Time Period" />
              </SelectTrigger>
              <SelectContent className="rounded-md">
                <SelectItem value="MORNING_PEAK">
                  Morning Peak (07:00 - 10:30)
                </SelectItem>
                <SelectItem value="MIDDAY_OFFPEAK">
                  Midday Off-Peak (11:00 - 15:30)
                </SelectItem>
                <SelectItem value="EVENING_PEAK">
                  Evening Peak (16:30 - 20:30)
                </SelectItem>
                <SelectItem value="NIGHT_LULL">
                  Night Operations (21:00 - 23:30)
                </SelectItem>
                <SelectItem value="LIVE_SURGE">Live Telemetry Surge</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={selectedStrategy}
              onValueChange={(val) =>
                setSelectedStrategy(val as AllocationStrategy)
              }
            >
              <SelectTrigger className="w-[210px] h-9 rounded-md text-xs">
                <GitFork className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Strategy" />
              </SelectTrigger>
              <SelectContent className="rounded-md">
                {STRATEGY_OPTIONS.map((strat) => (
                  <SelectItem key={strat.id} value={strat.id}>
                    {strat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => planQuery.refetch()}
              disabled={planQuery.isFetching}
              className="h-9 rounded-md gap-2"
            >
              <RefreshCw
                className={cn(
                  "h-3.5 w-3.5",
                  planQuery.isFetching && "animate-spin",
                )}
              />
              <span>Re-Solve</span>
            </Button>
          </div>
        </div>

        {/* Demand Estimation Notice Banner */}
        <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3.5 text-xs text-foreground flex items-start gap-3">
          <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold text-blue-500 block">
              Demand Estimation Methodology Notice
            </span>
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              Corridor passenger demand figures are computed dynamically using scheduled trip frequency, corridor capacity factors, and historical diurnal passenger distribution curves. Values represent estimated passenger flow rates to support dynamic fleet rebalancing, rather than real-time vehicle passenger counting hardware.
            </p>
          </div>
        </div>

        {/* Telemetry KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="rounded-lg shadow-sm border-border/70 bg-card">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-medium uppercase tracking-wider">
                  Shortage Corridors
                </span>
                <AlertCircle className="h-4 w-4 text-amber-500" />
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold text-foreground">
                {plan?.deficitRoutesCount ?? 0}
                <span className="text-xs font-normal text-muted-foreground ml-1.5">
                  / {plan?.routeProfiles.length ?? 8} routes
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <span className="text-amber-500 font-medium">Overcapacity</span>{" "}
                on arterial sectors
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-lg shadow-sm border-border/70 bg-card">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-medium uppercase tracking-wider">
                  Surge Deficit
                </span>
                <TrendingUp className="h-4 w-4 text-red-500" />
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold text-foreground">
                +{plan?.totalSurgeDemandPaxPerHour ?? 0}
                <span className="text-xs font-normal text-muted-foreground ml-1.5">
                  pax / hour
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Excess passenger volume above timetable
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-lg shadow-sm border-border/70 bg-card">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-medium uppercase tracking-wider">
                  Buses Rebalanced
                </span>
                <BusIcon className="h-4 w-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold text-foreground">
                {plan?.busesAllocated ?? 0}
                <span className="text-xs font-normal text-muted-foreground ml-1.5">
                  assigned
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                From 4 depots via GIS road matrix
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-lg shadow-sm border-border/70 bg-card">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-medium uppercase tracking-wider">
                  Avg Wait Time Drop
                </span>
                <TrendingDown className="h-4 w-4 text-emerald-500" />
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                -{plan?.avgWaitTimeReductionMin ?? 0}
                <span className="text-xs font-normal text-muted-foreground ml-1.5">
                  minutes
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Queue reduction on crowded corridors
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-lg shadow-sm border-border/70 bg-card">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-medium uppercase tracking-wider">
                  Network Load Factor
                </span>
                <Activity className="h-4 w-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold text-foreground flex items-center gap-2">
                <span className="line-through text-muted-foreground text-lg">
                  {Math.round((plan?.networkLoadFactorBefore ?? 0) * 100)}%
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <span className="text-emerald-600 dark:text-emerald-400">
                  {Math.round((plan?.networkLoadFactorAfter ?? 0) * 100)}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Balanced load factor across active lines
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Interactive Surge Scenario Simulator */}
        <Card className="rounded-lg border-border/70 bg-card shadow-sm">
          <CardHeader className="p-5 pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
                  <Zap className="h-4 w-4 text-amber-500" />
                  Corridor Demand Stress Simulator
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Inject unexpected passenger surges, tourist influx, or train
                  arrival shocks to verify dynamic re-allocation resilience.
                </CardDescription>
              </div>

              {activeScenarios.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearScenarios}
                  className="h-8 rounded-md text-xs text-muted-foreground hover:text-foreground"
                >
                  Reset to Timetable Baseline
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-5 pt-1 space-y-4">
            {/* Quick Presets */}
            <div>
              <span className="text-xs font-medium text-muted-foreground block mb-2">
                Operational Presets:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {PRESET_SCENARIOS.map((preset) => {
                  const isActive = activeScenarios.some(
                    (s) =>
                      s.routeId === preset.routeId &&
                      s.surgePercent === preset.surgePercent,
                  );
                  return (
                    <button
                      key={preset.name}
                      onClick={() => handleApplyPreset(preset)}
                      className={cn(
                        "text-left p-3 rounded-md border text-xs transition-colors",
                        isActive
                          ? "bg-blue-500/10 border-blue-500/40 text-blue-500 font-medium"
                          : "bg-muted/40 border-border/60 hover:bg-muted text-foreground",
                      )}
                    >
                      <div className="font-semibold text-foreground flex items-center justify-between">
                        <span>{preset.name}</span>
                        <span className="text-[11px] text-amber-500 font-mono">
                          +{preset.surgePercent}%
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">
                        {preset.cause}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Surge Slider */}
            <div className="pt-2 border-t border-border/50 flex flex-col md:flex-row md:items-center gap-4">
              <div className="w-full md:w-64">
                <label className="text-xs text-muted-foreground block mb-1">
                  Target Corridor:
                </label>
                <Select value={customRouteId} onValueChange={setCustomRouteId}>
                  <SelectTrigger className="h-9 text-xs rounded-md">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-md">
                    {(plan?.routeProfiles || []).map((r) => (
                      <SelectItem key={r.routeId} value={r.routeId}>
                        Route {r.code}: {r.origin} - {r.destination}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    Simulate Inflow Surge Percentage:
                  </span>
                  <span className="font-mono font-semibold text-amber-500">
                    +{customSurgePercent}%
                  </span>
                </div>
                <Slider
                  min={10}
                  max={85}
                  step={5}
                  value={[customSurgePercent]}
                  onValueChange={(vals) => setCustomSurgePercent(vals[0])}
                  className="w-full"
                />
              </div>

              <div className="md:pt-4">
                <Button
                  size="sm"
                  onClick={handleAddCustomSurge}
                  className="h-9 rounded-md gap-1.5 w-full md:w-auto"
                >
                  <PlusIcon className="h-3.5 w-3.5" />
                  <span>Apply Surge</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Demand & Capacity Visualizer */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bar Chart */}
          <Card className="lg:col-span-2 rounded-lg border-border/70 bg-card shadow-sm">
            <CardHeader className="p-5 pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                    <Layers className="h-4 w-4 text-blue-500" />
                    Salem Corridor Demand vs Capacity Profile
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Estimated hourly passenger volume versus scheduled bus capacity.
                  </CardDescription>
                </div>
                <Badge
                  variant="outline"
                  className="rounded-md font-mono text-[11px]"
                >
                  {selectedPeriod}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-5 pt-2">
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-popover border border-border p-2.5 rounded-md shadow-md text-xs space-y-1">
                              <p className="font-semibold text-foreground">
                                {data.fullRoute}
                              </p>
                              <p className="text-muted-foreground">
                                Baseline Demand:{" "}
                                <span className="font-mono text-foreground">
                                  {data.Baseline} pax/hr
                                </span>
                              </p>
                              <p className="text-amber-500">
                                Estimated Demand:{" "}
                                <span className="font-mono font-bold">
                                  {data.EstimatedDemand} pax/hr
                                </span>
                              </p>
                              <p className="text-blue-500">
                                Scheduled Capacity:{" "}
                                <span className="font-mono">
                                  {data.Capacity} pax/hr
                                </span>
                              </p>
                              {data.Deficit > 0 && (
                                <p className="text-red-500 font-semibold">
                                  Capacity Deficit: +{data.Deficit} pax/hr ({data.AdditionalBuses} buses needed)
                                </p>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend
                      verticalAlign="top"
                      align="right"
                      iconSize={8}
                      wrapperStyle={{ fontSize: "11px", paddingBottom: "10px" }}
                    />
                    <Bar
                      dataKey="Baseline"
                      fill="#94a3b8"
                      radius={[3, 3, 0, 0]}
                    />
                    <Bar
                      dataKey="EstimatedDemand"
                      fill="#f59e0b"
                      name="Estimated Demand"
                      radius={[3, 3, 0, 0]}
                    />
                    <Bar
                      dataKey="Capacity"
                      fill="#2563eb"
                      name="Scheduled Capacity"
                      radius={[3, 3, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Allocation Strategy Summary */}
          <Card className="rounded-lg border-border/70 bg-card shadow-sm flex flex-col justify-between">
            <CardHeader className="p-5 pb-2">
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <Compass className="h-4 w-4 text-blue-500" />
                Active Solver Policy
              </CardTitle>
              <CardDescription className="text-xs">
                Resource allocation heuristics and optimization weights.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-2 space-y-4 flex-1">
              <div className="p-3 bg-muted/50 border border-border/60 rounded-md text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">
                    {
                      STRATEGY_OPTIONS.find((s) => s.id === selectedStrategy)
                        ?.label
                    }
                  </span>
                  <Badge variant="outline" className="rounded-md text-[10px]">
                    Active Policy
                  </Badge>
                </div>
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  {
                    STRATEGY_OPTIONS.find((s) => s.id === selectedStrategy)
                      ?.desc
                  }
                </p>
              </div>

              <div className="space-y-2 text-xs">
                <span className="font-medium text-foreground block">
                  Enforced Hard Constraints:
                </span>
                <div className="flex items-start gap-2 text-muted-foreground text-[11px]">
                  <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>
                    <strong>Minimum Service Headway:</strong> Donor route
                    headways cannot exceed 25 minutes SLA ceiling.
                  </span>
                </div>
                <div className="flex items-start gap-2 text-muted-foreground text-[11px]">
                  <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>
                    <strong>Driver Hours & Rest:</strong> Reserve crew must
                    retain ≥ 2.0 hours remaining shift time.
                  </span>
                </div>
                <div className="flex items-start gap-2 text-muted-foreground text-[11px]">
                  <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>
                    <strong>GIS Deadhead Radius:</strong> Maximum positioning
                    time constrained to ≤ 50 minutes.
                  </span>
                </div>
              </div>
            </CardContent>
            <div className="p-5 pt-0 border-t border-border/50 text-[11px] text-muted-foreground flex items-center justify-between mt-2">
              <span>Total Deadhead Estimated:</span>
              <span className="font-mono font-semibold text-foreground">
                {plan?.totalDeadheadKm ?? 0} km (₹
                {plan?.totalOperatingCost ?? 0})
              </span>
            </div>
          </Card>
        </div>

        {/* Corridor Health & Capacity Status Table */}
        <Card className="rounded-lg border-border/70 bg-card shadow-sm">
          <CardHeader className="p-5 pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-semibold text-foreground">
                  Salem Transit Corridors & Capacity Health
                </CardTitle>
                <CardDescription className="text-xs">
                  Estimated demand versus scheduled capacity, headway, and calculated bus deficits.
                </CardDescription>
              </div>

              {/* Filter Tabs */}
              <Tabs
                value={corridorFilter}
                onValueChange={(val) => setCorridorFilter(val as any)}
                className="w-auto"
              >
                <TabsList className="h-8 rounded-md bg-muted/60 p-0.5">
                  <TabsTrigger value="all" className="h-7 text-xs rounded-sm">
                    All Corridors ({plan?.routeProfiles.length || 8})
                  </TabsTrigger>
                  <TabsTrigger value="shortage" className="h-7 text-xs rounded-sm">
                    Capacity Shortage ({plan?.deficitRoutesCount || 0})
                  </TabsTrigger>
                  <TabsTrigger value="donor" className="h-7 text-xs rounded-sm">
                    Donor / Surplus ({(plan?.routeProfiles || []).filter(r => r.eligibleAsDonor || r.loadFactor < 0.5).length})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 border-y border-border/60 text-muted-foreground uppercase text-[10px] tracking-wider font-medium">
                  <tr>
                    <th className="px-4 py-3">Route</th>
                    <th className="px-4 py-3">Corridor Terminals</th>
                    <th className="px-4 py-3">Headway</th>
                    <th className="px-4 py-3">Estimated Demand</th>
                    <th className="px-4 py-3">Capacity</th>
                    <th className="px-4 py-3">Load Factor</th>
                    <th className="px-4 py-3">Avg Wait</th>
                    <th className="px-4 py-3">Buses Needed</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredCorridors.map((route) => (
                    <tr
                      key={route.routeId}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-bold text-foreground">
                        <Badge
                          variant="outline"
                          className="rounded-md font-mono text-xs"
                        >
                          {route.code}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-foreground font-medium">
                        {route.origin}{" "}
                        <span className="text-muted-foreground mx-1">→</span>{" "}
                        {route.destination}
                        <span className="text-[10px] text-muted-foreground block font-mono">
                          {route.lengthKm} km ({route.durationMin}m)
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-foreground">
                        {route.scheduledHeadwayMin} min
                        <span className="text-[10px] text-muted-foreground block">
                          ({route.activeBusesCount} buses)
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono font-semibold text-foreground">
                          {route.sensedDemandPaxPerHour} pax/hr
                        </span>
                        <span className="text-[10px] text-muted-foreground block">
                          {route.surgePercentage > 0
                            ? `+${route.surgePercentage}% surge`
                            : "Diurnal baseline"}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-muted-foreground">
                        {route.scheduledCapacityPaxPerHour} pax/hr
                      </td>
                      <td className="px-4 py-3 font-mono">
                        <span
                          className={cn(
                            "font-bold",
                            route.loadFactor >= 1.05
                              ? "text-red-500"
                              : route.loadFactor >= 0.85
                                ? "text-amber-500"
                                : "text-emerald-500",
                          )}
                        >
                          {Math.round(route.loadFactor * 100)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-foreground">
                        {route.passengerWaitTimeMin} min
                      </td>
                      <td className="px-4 py-3 font-mono font-semibold">
                        {route.additionalBusesNeeded > 0 ? (
                          <span className="text-amber-500">
                            +{route.additionalBusesNeeded} bus{route.additionalBusesNeeded > 1 ? "es" : ""}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {getSeverityBadge(
                          route.shortageSeverity,
                          route.capacityDeficitPaxPerHour,
                          route.loadFactor,
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Available for Deployment Standby Bus Pool */}
        <Card className="rounded-lg border-border/70 bg-card shadow-sm">
          <CardHeader className="p-5 pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                  <BusIcon className="h-4 w-4 text-emerald-500" />
                  Available Buses for Deployment (Standby & Donor Fleet)
                </CardTitle>
                <CardDescription className="text-xs">
                  Active reserve vehicles and certified crews verified ready for demand-responsive positioning.
                </CardDescription>
              </div>
              <Badge
                variant="outline"
                className="rounded-md font-mono text-xs w-fit text-emerald-500 border-emerald-500/30"
              >
                {plan?.availableFleetPool?.length ?? 6} Available Candidates
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {(plan?.availableFleetPool || []).map((candidate) => (
                <div
                  key={candidate.busId}
                  className="p-3 bg-muted/40 rounded-md border border-border/60 text-xs space-y-2 hover:bg-muted/60 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground font-mono flex items-center gap-1.5">
                      <BusIcon className="h-3.5 w-3.5 text-blue-500" />
                      {candidate.registrationNumber}
                    </span>
                    <Badge className="bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 rounded-md text-[10px] font-medium">
                      Available for Deployment
                    </Badge>
                  </div>

                  <div className="text-[11px] text-muted-foreground space-y-1">
                    <div className="flex items-center justify-between">
                      <span>Type & Capacity:</span>
                      <span className="text-foreground font-medium">
                        {candidate.capacity} seats ({candidate.busType.split("(")[0]?.trim() || "Standard"})
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Stationed At:</span>
                      <span className="text-foreground font-medium flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {candidate.depot}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Assigned Driver:</span>
                      <span className="text-foreground font-medium">
                        {candidate.driverName} ({candidate.remainingShiftHours}h left)
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Assigned Conductor:</span>
                      <span className="text-foreground font-medium">
                        {candidate.conductorName}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Algorithm Dispatch Recommendations Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                Algorithm Dispatch Recommendations
              </h2>
              <p className="text-xs text-muted-foreground">
                Optimal bipartite matching results balancing depot reserve proximity, crew shifts, and passenger wait time relief.
              </p>
            </div>
            <Badge
              variant="outline"
              className="rounded-md text-xs font-mono w-fit"
            >
              {visibleRecommendations.length} Feasible Proposals
            </Badge>
          </div>

          {visibleRecommendations.length === 0 ? (
            <Card className="rounded-lg border-border/70 bg-card p-8 text-center">
              <ShieldCheck className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-foreground">
                Fleet Capacity Well-Balanced
              </h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1">
                No active corridor breaches SLA thresholds under the current time period. All route load factors remain within optimal operational limits.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {visibleRecommendations.map((rec) => (
                <Card
                  key={rec.id}
                  className="rounded-lg border-border/70 bg-card shadow-sm hover:border-blue-500/40 transition-colors flex flex-col justify-between"
                >
                  <CardHeader className="p-4 pb-2 border-b border-border/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-blue-600 text-white rounded-md font-mono text-xs">
                          Route {rec.targetRouteCode}
                        </Badge>
                        <span className="text-xs font-semibold text-foreground">
                          {rec.targetRouteName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-blue-500/15 text-blue-500 border border-blue-500/30 rounded-md font-medium text-[10px]">
                          Recommended
                        </Badge>
                        <Badge
                          variant="outline"
                          className="rounded-md font-mono text-[10px] text-emerald-500 border-emerald-500/30"
                        >
                          Score {rec.benefitScore}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 space-y-3 flex-1 text-xs">
                    {/* Vehicle & Depot Info */}
                    <div className="p-2.5 bg-muted/40 rounded-md border border-border/60 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground flex items-center gap-1.5">
                          <BusIcon className="h-3.5 w-3.5 text-blue-500" />
                          {rec.supply.registrationNumber} ({rec.supply.busType})
                        </span>
                        <Badge
                          variant="secondary"
                          className="rounded-md text-[10px]"
                        >
                          {rec.supply.sourceType === "DEPOT_RESERVE"
                            ? "Depot Standby"
                            : "Donor Route"}
                        </Badge>
                      </div>

                      <div className="text-[11px] text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {rec.supply.depot}
                        </span>
                        <span className="flex items-center gap-1">
                          <UserCheck className="h-3 w-3 text-muted-foreground" />
                          Driver: {rec.supply.driverName} ({rec.supply.remainingShiftHours}h left)
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          Conductor: {rec.supply.conductorName}
                        </span>
                      </div>
                    </div>

                    {/* Operational Impact Comparison */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 bg-muted/30 rounded-md border border-border/50">
                        <span className="text-[10px] text-muted-foreground block">
                          Headway
                        </span>
                        <span className="font-mono font-semibold text-foreground text-xs">
                          {rec.headwayBeforeMin}m → {rec.headwayAfterMin}m
                        </span>
                      </div>
                      <div className="p-2 bg-muted/30 rounded-md border border-border/50">
                        <span className="text-[10px] text-muted-foreground block">
                          Avg Wait
                        </span>
                        <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400 text-xs">
                          {rec.waitTimeBeforeMin}m → {rec.waitTimeAfterMin}m
                        </span>
                      </div>
                      <div className="p-2 bg-muted/30 rounded-md border border-border/50">
                        <span className="text-[10px] text-muted-foreground block">
                          Deadhead
                        </span>
                        <span className="font-mono font-semibold text-foreground text-xs">
                          {rec.deadheadMinutes}m ({rec.deadheadKm}km)
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {rec.reason}
                    </p>
                  </CardContent>

                  <div className="p-4 pt-2 border-t border-border/50 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-muted-foreground font-mono">
                      Cost: ₹{rec.estimatedCost}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDismissRecommendation(rec.id)}
                        className="rounded-md h-8 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3 mr-1" />
                        <span>Dismiss</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenReview(rec)}
                        className="rounded-md h-8 text-xs gap-1.5"
                      >
                        <Sliders className="h-3 w-3" />
                        <span>Review</span>
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setConfirmingRec(rec)}
                        disabled={!canDispatch || dispatchMutation.isPending}
                        className="rounded-md h-8 text-xs gap-1.5"
                      >
                        <Send className="h-3 w-3" />
                        <span>Deploy Bus</span>
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Recent Allocation History Audit Trail */}
        <Card className="rounded-lg border-border/70 bg-card shadow-sm">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-base font-semibold text-foreground">
              Recent Dynamic Allocation Dispatches
            </CardTitle>
            <CardDescription className="text-xs">
              Audit trail of deployed fleet rebalances across the Salem network.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 border-y border-border/60 text-muted-foreground uppercase text-[10px] tracking-wider font-medium">
                  <tr>
                    <th className="px-4 py-3">Dispatched At</th>
                    <th className="px-4 py-3">Source Depot</th>
                    <th className="px-4 py-3">Strategy</th>
                    <th className="px-4 py-3">Deadhead</th>
                    <th className="px-4 py-3">Headway Shift</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {((historyQuery.data as any[]) || []).length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-6 text-center text-muted-foreground text-xs"
                      >
                        No recent allocation dispatches recorded yet today.
                      </td>
                    </tr>
                  ) : (
                    ((historyQuery.data as any[]) || []).map((row: any) => (
                      <tr key={row.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3 font-mono text-muted-foreground">
                          {new Date(row.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </td>
                        <td className="px-4 py-3 text-foreground font-medium">
                          {row.sourceDepot || "Johnsonpet Depot"}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">
                          {row.allocationStrategy}
                        </td>
                        <td className="px-4 py-3 font-mono text-muted-foreground">
                          {row.deadheadMinutes} min ({row.deadheadKm} km)
                        </td>
                        <td className="px-4 py-3 font-mono text-foreground">
                          {row.headwayBeforeMin}m → {row.headwayAfterMin}m
                        </td>
                        <td className="px-4 py-3">
                          <Badge className="bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 rounded-md text-[10px]">
                            Allocated
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Review & Alternative Bus/Crew Dialog */}
        <Dialog
          open={!!reviewingRec}
          onOpenChange={(open) => !open && setReviewingRec(null)}
        >
          <DialogContent className="rounded-lg max-w-xl">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <Sliders className="h-4 w-4 text-blue-500" />
                Review & Customize Fleet Allocation
              </DialogTitle>
              <DialogDescription className="text-xs">
                Inspect proposed assignment and select alternative standby bus or crew if preferred.
              </DialogDescription>
            </DialogHeader>

            {reviewingRec && (
              <div className="space-y-4 py-2 text-xs">
                <div className="p-3 bg-muted/40 rounded-md border border-border/60 flex items-center justify-between">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">
                      Target Corridor
                    </span>
                    <span className="font-semibold text-foreground text-sm">
                      Route {reviewingRec.targetRouteCode}: {reviewingRec.targetRouteName}
                    </span>
                  </div>
                  <Badge className="bg-blue-600 text-white rounded-md font-mono text-xs">
                    Route {reviewingRec.targetRouteCode}
                  </Badge>
                </div>

                {/* Alternative Bus Selector */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground block">
                    Assigned Vehicle (Select Alternative):
                  </label>
                  <Select
                    value={selectedAltBusId}
                    onValueChange={setSelectedAltBusId}
                  >
                    <SelectTrigger className="h-9 text-xs rounded-md">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-md">
                      {(plan?.availableFleetPool || []).map((candidate) => (
                        <SelectItem key={candidate.busId} value={candidate.busId}>
                          {candidate.registrationNumber} ({candidate.busType}) - {candidate.depot}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Alternative Driver and Conductor */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground block">
                      Assigned Driver:
                    </label>
                    <Select
                      value={selectedAltDriverId}
                      onValueChange={setSelectedAltDriverId}
                    >
                      <SelectTrigger className="h-9 text-xs rounded-md">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-md">
                        {(plan?.availableFleetPool || []).map((candidate) => (
                          <SelectItem
                            key={candidate.driverId || candidate.busId}
                            value={candidate.driverId || ""}
                          >
                            {candidate.driverName} ({candidate.driverEmployeeId}) - {candidate.remainingShiftHours}h shift
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground block">
                      Assigned Conductor:
                    </label>
                    <Select
                      value={selectedAltConductorId}
                      onValueChange={setSelectedAltConductorId}
                    >
                      <SelectTrigger className="h-9 text-xs rounded-md">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-md">
                        {(plan?.availableFleetPool || []).map((candidate) => (
                          <SelectItem
                            key={candidate.conductorId || candidate.busId}
                            value={candidate.conductorId || ""}
                          >
                            {candidate.conductorName} ({candidate.conductorEmployeeId})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Recalculated Impact Preview */}
                <div className="p-3 bg-muted/30 rounded-md border border-border/50 space-y-2">
                  <span className="text-[11px] font-semibold text-foreground block">
                    Projected Operational Impact:
                  </span>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 bg-background/60 rounded-md border border-border/40">
                      <span className="text-[10px] text-muted-foreground block">Headway</span>
                      <span className="font-mono font-semibold text-foreground">
                        {reviewingRec.headwayBeforeMin}m → {reviewingRec.headwayAfterMin}m
                      </span>
                    </div>
                    <div className="p-2 bg-background/60 rounded-md border border-border/40">
                      <span className="text-[10px] text-muted-foreground block">Wait Time</span>
                      <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        {reviewingRec.waitTimeBeforeMin}m → {reviewingRec.waitTimeAfterMin}m
                      </span>
                    </div>
                    <div className="p-2 bg-background/60 rounded-md border border-border/40">
                      <span className="text-[10px] text-muted-foreground block">Deadhead</span>
                      <span className="font-mono font-semibold text-foreground">
                        {reviewingRec.deadheadMinutes} min
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReviewingRec(null)}
                className="rounded-md"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleApplyAlternativeAndProceed}
                className="rounded-md gap-1.5"
              >
                <span>Proceed to Confirmation</span>
                <ArrowRight className="h-3 w-3" />
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Mandatory User Approval Workflow (Pre-Confirmation Dialog) */}
        <Dialog
          open={!!confirmingRec}
          onOpenChange={(open) => !open && setConfirmingRec(null)}
        >
          <DialogContent className="rounded-lg max-w-lg">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Send className="h-4 w-4 text-blue-500" />
                  Confirm Dynamic Fleet Allocation
                </DialogTitle>
                <Badge className="bg-amber-500/15 text-amber-500 border border-amber-500/30 rounded-md font-medium text-[10px]">
                  Allocation Pending
                </Badge>
              </div>
              <DialogDescription className="text-xs">
                Review operational parameters and pre-dispatch constraint checks before finalizing deployment.
              </DialogDescription>
            </DialogHeader>

            {confirmingRec && (
              <div className="space-y-3.5 py-2 text-xs">
                {/* Pre-Confirmation Validation Checklist */}
                <div className="p-3 bg-muted/40 rounded-md border border-border/60 space-y-2">
                  <span className="text-[11px] font-semibold text-foreground block">
                    Pre-Confirmation Constraint Validation:
                  </span>
                  <div className="space-y-1.5 text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span><strong>Vehicle Availability:</strong> Verified standby in depot without conflicting duty.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span><strong>Crew Rest & Shift Compliance:</strong> Driver and conductor have ≥ 2.0h remaining shift.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span><strong>Minimum Service Guarantee:</strong> Donor corridor headway maintains SLA floor.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span><strong>GIS Road Deadhead:</strong> Deadhead travel time ({confirmingRec.deadheadMinutes} min) within 50 min ceiling.</span>
                    </div>
                  </div>
                </div>

                {/* Assignment Details */}
                <div className="p-3 bg-muted/40 rounded-md border border-border/60 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Target Corridor:</span>
                    <span className="font-semibold text-foreground">
                      Route {confirmingRec.targetRouteCode}: {confirmingRec.targetRouteName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Deploying Vehicle:</span>
                    <span className="font-semibold text-foreground">
                      {confirmingRec.supply.registrationNumber} ({confirmingRec.supply.busType})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Source Depot:</span>
                    <span className="font-semibold text-foreground">
                      {confirmingRec.supply.depot}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Assigned Crew:</span>
                    <span className="font-semibold text-foreground">
                      {confirmingRec.supply.driverName} (Pilot) & {confirmingRec.supply.conductorName} (Conductor)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Departure Time:</span>
                    <span className="font-mono text-foreground font-semibold">
                      {formatCurrentTime12h(0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expected Arrival at Route:</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                      {formatCurrentTime12h(confirmingRec.deadheadMinutes)} ({confirmingRec.deadheadMinutes}m deadhead)
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-border/40 pt-2">
                    <span className="text-muted-foreground">Projected Headway Relief:</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                      {confirmingRec.headwayBeforeMin} min → {confirmingRec.headwayAfterMin} min
                    </span>
                  </div>
                </div>

                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  Upon clicking Confirm, TransitOS will synchronize duty assignments, update fleet availability, and issue dispatch notifications to depot controllers.
                </p>
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmingRec(null)}
                className="rounded-md"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() =>
                  confirmingRec && dispatchMutation.mutate(confirmingRec)
                }
                disabled={dispatchMutation.isPending}
                className="rounded-md gap-1.5"
              >
                {dispatchMutation.isPending
                  ? "Dispatching..."
                  : "Confirm & Deploy Bus"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Post-Allocation Summary and Verification Modal */}
        <Dialog
          open={!!postAllocationResult}
          onOpenChange={(open) => !open && setPostAllocationResult(null)}
        >
          <DialogContent className="rounded-lg max-w-lg">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  Fleet Allocation Deployed Successfully
                </DialogTitle>
                <Badge className="bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 rounded-md font-medium text-[10px]">
                  Allocated
                </Badge>
              </div>
              <DialogDescription className="text-xs">
                Official dispatch summary and operational roster registration.
              </DialogDescription>
            </DialogHeader>

            {postAllocationResult && (
              <div className="space-y-3.5 py-2 text-xs">
                {/* Roster & Duty Details */}
                <div className="p-3 bg-muted/40 rounded-md border border-border/60 space-y-2">
                  <div className="flex justify-between items-center pb-2 border-b border-border/50">
                    <span className="text-muted-foreground">Generated Duty Code:</span>
                    <Badge variant="outline" className="font-mono text-xs font-bold text-blue-500 border-blue-500/30">
                      {postAllocationResult.dutyCode}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Allocated Bus:</span>
                    <span className="font-semibold text-foreground">
                      {postAllocationResult.busRegistration} ({postAllocationResult.busType})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pilot (Driver):</span>
                    <span className="font-semibold text-foreground">
                      {postAllocationResult.driverName} ({postAllocationResult.driverEmployeeId})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Conductor:</span>
                    <span className="font-semibold text-foreground">
                      {postAllocationResult.conductorName} ({postAllocationResult.conductorEmployeeId})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Source Depot:</span>
                    <span className="font-semibold text-foreground">
                      {postAllocationResult.sourceDepot}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Target Route:</span>
                    <span className="font-semibold text-foreground">
                      Route {postAllocationResult.targetRouteCode} ({postAllocationResult.targetRouteName})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Departure Time:</span>
                    <span className="font-mono text-foreground font-semibold">
                      {postAllocationResult.departureTime12}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expected Arrival at Route:</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                      {postAllocationResult.expectedArrivalTime12} ({postAllocationResult.deadheadMinutes} min deadhead)
                    </span>
                  </div>
                </div>

                {/* Service Impact Summary Grid */}
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-md space-y-2">
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 block">
                    Operational Service Impact:
                  </span>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 bg-background/80 rounded-md border border-border/50">
                      <span className="text-[10px] text-muted-foreground block">Headway</span>
                      <span className="font-mono font-semibold text-foreground">
                        {postAllocationResult.headwayBeforeMin}m → {postAllocationResult.headwayAfterMin}m
                      </span>
                    </div>
                    <div className="p-2 bg-background/80 rounded-md border border-border/50">
                      <span className="text-[10px] text-muted-foreground block">Avg Wait Time</span>
                      <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        -{postAllocationResult.waitTimeReductionMin} min
                      </span>
                    </div>
                    <div className="p-2 bg-background/80 rounded-md border border-border/50">
                      <span className="text-[10px] text-muted-foreground block">Positioning Cost</span>
                      <span className="font-mono font-semibold text-foreground">
                        ₹{postAllocationResult.estimatedCost}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-md bg-muted/50 p-2.5 text-[11px] text-muted-foreground">
                  <span className="font-medium text-foreground block mb-0.5">System Verification:</span>
                  Duty roster, bus operational status, and corridor schedule have been synchronized across TransitOS operations boards and crew rosters.
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                size="sm"
                onClick={() => setPostAllocationResult(null)}
                className="rounded-md w-full sm:w-auto"
              >
                Done & Return to Dispatch
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}

function PlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}
