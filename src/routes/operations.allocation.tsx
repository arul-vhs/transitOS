import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
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
  Fuel,
  GitFork,
  Layers,
  MapPin,
  RefreshCw,
  Send,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
  Workflow,
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
import { Route as RootRoute } from "@/routes/__root";
import { hasPermission } from "@/lib/auth-shared";
import {
  getAllocationPlan,
  dispatchFleetAllocation,
  getRecentAllocations,
} from "@/lib/allocation-fns";
import type {
  AllocationRecommendation,
  AllocationStrategy,
  ShortageSeverity,
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
      { title: "Dynamic Fleet Allocation: TransitOS" },
      {
        name: "description",
        content:
          "Demand-responsive fleet rebalancing, corridor surge detection, and depot reserve matching for Salem transit.",
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

function getSeverityBadge(severity: ShortageSeverity) {
  switch (severity) {
    case "CRITICAL":
      return (
        <Badge className="bg-red-500/15 text-red-500 border border-red-500/30 rounded-md font-medium">
          Critical Deficit
        </Badge>
      );
    case "HIGH":
      return (
        <Badge className="bg-amber-500/15 text-amber-500 border border-amber-500/30 rounded-md font-medium">
          High Shortage
        </Badge>
      );
    case "MODERATE":
      return (
        <Badge className="bg-blue-500/15 text-blue-500 border border-blue-500/30 rounded-md font-medium">
          Moderate Surge
        </Badge>
      );
    case "OPTIMAL":
      return (
        <Badge className="bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 rounded-md font-medium">
          Balanced Flow
        </Badge>
      );
    case "SURPLUS":
      return (
        <Badge className="bg-slate-500/15 text-slate-400 border border-slate-500/30 rounded-md font-medium">
          Donor Surplus
        </Badge>
      );
  }
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

  // Simulation custom input
  const [customRouteId, setCustomRouteId] = useState<string>("route-slm-01");
  const [customSurgePercent, setCustomSurgePercent] = useState<number>(35);

  // Dispatch confirmation dialog
  const [confirmingRec, setConfirmingRec] =
    useState<AllocationRecommendation | null>(null);

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
        busId: rec.supply.busId,
        busRegistration: rec.supply.registrationNumber,
        driverId: rec.supply.driverId,
        conductorId: rec.supply.conductorId,
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
    onSuccess: (res, rec) => {
      toast.success(
        `Dispatched bus ${rec.supply.registrationNumber} to Route ${rec.targetRouteCode}.`,
        {
          description: `Deadhead time: ${rec.deadheadMinutes} min from ${rec.supply.depot}. New headway: ${rec.headwayAfterMin} min.`,
        },
      );
      setConfirmingRec(null);
      queryClient.invalidateQueries({ queryKey: ["fleet-allocation-plan"] });
      queryClient.invalidateQueries({ queryKey: ["recent-fleet-allocations"] });
    },
    onError: (err: any) => {
      toast.error(`Dispatch failed: ${err.message}`);
    },
  });

  const plan = planQuery.data;

  // Chart data preparation
  const chartData = (plan?.routeProfiles || []).map((r) => ({
    name: `R-${r.code}`,
    fullRoute: `${r.code}: ${r.origin} to ${r.destination}`,
    Baseline: r.baselineDemandPaxPerHour,
    SensedDemand: r.sensedDemandPaxPerHour,
    Capacity: r.scheduledCapacityPaxPerHour,
    Deficit: r.capacityDeficitPaxPerHour,
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

  return (
    <AppShell
      title="Smart Fleet Allocation"
      subtitle="Demand-responsive capacity rebalancing, real-time surge detection, and multi-depot reserve dispatch"
    >
      <div className="space-y-6 p-4 md:p-8 max-w-7xl mx-auto">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-md text-blue-500">
                <Workflow className="h-5 w-5" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Corridor Rebalancing & Surge Controls
              </h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Dynamic capacity rebalancing, real-time surge detection, and
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
                    Hourly passenger rate comparison across active arterial
                    corridors.
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
                                Sensed Demand:{" "}
                                <span className="font-mono font-bold">
                                  {data.SensedDemand} pax/hr
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
                                  Capacity Deficit: +{data.Deficit} pax/hr
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
                      dataKey="SensedDemand"
                      fill="#f59e0b"
                      radius={[3, 3, 0, 0]}
                    />
                    <Bar
                      dataKey="Capacity"
                      fill="#2563eb"
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
                    retain ≥ 2.5 hours remaining shift time.
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

        {/* Corridor Status Table */}
        <Card className="rounded-lg border-border/70 bg-card shadow-sm">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-base font-semibold text-foreground">
              Salem Transit Corridors & Capacity Health
            </CardTitle>
            <CardDescription className="text-xs">
              Live headway, load factors, and deficit calculations across Salem
              bus routes.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 border-y border-border/60 text-muted-foreground uppercase text-[10px] tracking-wider font-medium">
                  <tr>
                    <th className="px-4 py-3">Route</th>
                    <th className="px-4 py-3">Corridor Terminals</th>
                    <th className="px-4 py-3">Length</th>
                    <th className="px-4 py-3">Headway</th>
                    <th className="px-4 py-3">Sensed Demand</th>
                    <th className="px-4 py-3">Capacity</th>
                    <th className="px-4 py-3">Load Factor</th>
                    <th className="px-4 py-3">Avg Wait</th>
                    <th className="px-4 py-3">Severity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {(plan?.routeProfiles || []).map((route) => (
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
                      </td>
                      <td className="px-4 py-3 text-muted-foreground font-mono">
                        {route.lengthKm} km ({route.durationMin}m)
                      </td>
                      <td className="px-4 py-3 font-mono text-foreground">
                        {route.scheduledHeadwayMin} min
                        <span className="text-[10px] text-muted-foreground block">
                          ({route.activeBusesCount} buses)
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono font-semibold text-foreground">
                          {route.sensedDemandPaxPerHour}
                        </span>
                        <span className="text-[10px] text-muted-foreground block">
                          {route.surgePercentage > 0
                            ? `+${route.surgePercentage}%`
                            : "Baseline"}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-muted-foreground">
                        {route.scheduledCapacityPaxPerHour} pax/hr
                      </td>
                      <td className="px-4 py-3 font-mono">
                        <span
                          className={cn(
                            "font-bold",
                            route.loadFactor > 1.05
                              ? "text-red-500"
                              : route.loadFactor > 0.85
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
                      <td className="px-4 py-3">
                        {getSeverityBadge(route.shortageSeverity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Recommended Deployments Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                Algorithm Dispatch Recommendations
              </h2>
              <p className="text-xs text-muted-foreground">
                Optimal bipartite matching results balancing depot reserve
                proximity, crew shifts, and passenger wait time relief.
              </p>
            </div>
            <Badge
              variant="outline"
              className="rounded-md text-xs font-mono w-fit"
            >
              {plan?.recommendations.length ?? 0} Feasible Proposals
            </Badge>
          </div>

          {(plan?.recommendations || []).length === 0 ? (
            <Card className="rounded-lg border-border/70 bg-card p-8 text-center">
              <ShieldCheck className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-foreground">
                Fleet Capacity Well-Balanced
              </h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1">
                No active corridor breaches SLA thresholds under the current
                time period. All route load factors remain within optimal
                operational limits.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(plan?.recommendations || []).map((rec) => (
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
                      <Badge
                        variant="outline"
                        className="rounded-md font-mono text-[10px] text-emerald-500 border-emerald-500/30"
                      >
                        Score {rec.benefitScore}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 space-y-3 flex-1 text-xs">
                    {/* Vehicle & Depot Info */}
                    <div className="p-2.5 bg-muted/40 rounded-md border border-border/60 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground flex items-center gap-1.5">
                          <BusIcon className="h-3.5 w-3.5 text-blue-500" />
                          {rec.supply.registrationNumber}
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
                          Driver: {rec.supply.driverName} (
                          {rec.supply.remainingShiftHours}h left)
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

                  <div className="p-4 pt-2 border-t border-border/50 flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground font-mono">
                      Cost: ₹{rec.estimatedCost}
                    </span>
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
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Recent Allocation History */}
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
                          {new Date(row.createdAt).toLocaleTimeString()}
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
                          <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30 rounded-md text-[10px]">
                            {row.status}
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

        {/* Dispatch Confirmation Dialog */}
        <Dialog
          open={!!confirmingRec}
          onOpenChange={(open) => !open && setConfirmingRec(null)}
        >
          <DialogContent className="rounded-lg max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <Send className="h-4 w-4 text-blue-500" />
                Confirm Dynamic Bus Dispatch
              </DialogTitle>
              <DialogDescription className="text-xs">
                Position vehicle to reinforce Route{" "}
                {confirmingRec?.targetRouteCode}.
              </DialogDescription>
            </DialogHeader>

            {confirmingRec && (
              <div className="space-y-3 py-2 text-xs">
                <div className="p-3 bg-muted/40 rounded-md border border-border/60 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vehicle:</span>
                    <span className="font-semibold text-foreground">
                      {confirmingRec.supply.registrationNumber}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Source Depot:</span>
                    <span className="font-semibold text-foreground">
                      {confirmingRec.supply.depot}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Assigned Driver:
                    </span>
                    <span className="font-semibold text-foreground">
                      {confirmingRec.supply.driverName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Estimated Deadhead:
                    </span>
                    <span className="font-mono text-foreground font-semibold">
                      {confirmingRec.deadheadMinutes} min (
                      {confirmingRec.deadheadKm} km)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Projected Headway:
                    </span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                      {confirmingRec.headwayBeforeMin} min →{" "}
                      {confirmingRec.headwayAfterMin} min
                    </span>
                  </div>
                </div>

                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  Upon dispatch, this vehicle will be marked active on Route{" "}
                  {confirmingRec.targetRouteCode}, notifying the depot master
                  and transit operations control center.
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
                  : "Confirm & Dispatch"}
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
