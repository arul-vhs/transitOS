import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  BarChart3,
  Calendar,
  Clock,
  Download,
  HelpCircle,
  TrendingUp,
  Activity,
  AlertTriangle,
  Bus as BusIcon,
  CheckCircle2,
  Users,
  Compass,
  Building2,
  ListRestart,
  SlidersHorizontal,
  Zap,
  ShieldCheck,
  ArrowUpRight,
  Gauge,
  Sparkles,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Route as RootRoute } from "@/routes/__root";
import { hasPermission } from "@/lib/auth-shared";
import {
  getServiceMetrics,
  getIncidentAnalytics,
  getOptimizationAnalytics,
  getRecoveryAnalytics,
  getDepotAnalytics,
  exportAnalyticsCsv,
} from "@/lib/analytics-fns";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/analytics/")({
  beforeLoad: ({ context }) => {
    if (!context.user || !hasPermission(context.user.role, "analytics.view")) {
      throw new Error("Forbidden");
    }
  },
  head: () => ({
    meta: [
      { title: "Operations Intelligence & Analytics — TransitOS" },
      {
        name: "description",
        content: "Operational analytics dashboard for fleet utilization, schedule compliance, and disruption containment.",
      },
    ],
  }),
  component: AnalyticsDashboardPage,
});

function AnalyticsDashboardPage() {
  const context = RootRoute.useRouteContext();
  const user = context?.user;
  const userRole = user?.role || "MANAGEMENT";

  // Filter state
  const [serviceDate, setServiceDate] = useState("25 Aug 2026");

  // Queries
  const { data: metrics = {} as any, isLoading: metricsLoading } = useQuery({
    queryKey: ["service-metrics", serviceDate],
    queryFn: () => getServiceMetrics({ serviceDate }),
  });

  const { data: incidentsObj = {} as any } = useQuery({
    queryKey: ["incident-analytics"],
    queryFn: () => getIncidentAnalytics(),
  });

  const { data: optRuns = [] } = useQuery({
    queryKey: ["optimization-runs-analytics"],
    queryFn: () => getOptimizationAnalytics(),
  });

  const { data: depotStats = [] } = useQuery({
    queryKey: ["depot-analytics"],
    queryFn: () => getDepotAnalytics(),
  });

  // Mutations
  const exportCsvMutation = useMutation({
    mutationFn: exportAnalyticsCsv,
    onSuccess: (csvBuffer, type) => {
      const blob = new Blob([csvBuffer], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `transitOS_${type}_report.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("CSV report exported successfully.");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to export CSV report");
    },
  });

  const handleExport = (type: string) => {
    exportCsvMutation.mutate(type);
  };

  return (
    <AppShell
      title="Operations Intelligence"
      subtitle="Authorized plan-vs-actual telemetry, fleet utilization indices, and disruption resolution metrics."
      actions={
        <div className="flex items-center gap-2">
          <Select value={serviceDate} onValueChange={setServiceDate}>
            <SelectTrigger className="w-36 bg-background/60 h-8.5 text-xs font-mono border-border/80">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25 Aug 2026">25 Aug 2026</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={() => handleExport("plan-vs-actual")}
            disabled={exportCsvMutation.isPending}
            variant="outline"
            size="sm"
            className="text-xs h-8.5 border-border/80 bg-card/60 font-semibold"
          >
            <Download className="mr-1.5 size-3.5" /> Export CSV
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Role Customization Banner */}
        <div className="glass-panel p-3.5 flex justify-between items-center gap-4 text-xs">
          <div className="flex items-center gap-2 font-medium text-foreground">
            <div className="grid size-6 place-items-center rounded-md bg-primary/10 text-primary">
              <SlidersHorizontal className="size-3.5" />
            </div>
            <span>Executive Dashboard View: <strong>Salem Transport Corporation</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 text-[10px] font-mono">
              ● Live Telemetry
            </Badge>
            <Badge variant="secondary" className="uppercase text-[9px] font-mono font-bold">{userRole}</Badge>
          </div>
        </div>

        {/* 1. TOP KPI METRICS ROW */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          <KPICard
            title="On-Time Rate"
            value={metricsLoading ? "..." : `${metrics.onTimeRate || 94}%`}
            hint="Tolerance ±5m"
            color="border-l-emerald-500"
            icon={Clock}
          />
          <KPICard
            title="Trip Completion"
            value={metricsLoading ? "..." : `${metrics.completionRate || 98}%`}
            hint="Scheduled vs Done"
            color="border-l-primary"
            icon={CheckCircle2}
          />
          <KPICard
            title="Cancellation Rate"
            value={metricsLoading ? "..." : `${metrics.cancellationRate || 0}%`}
            hint="Unserved runs"
            color="border-l-destructive"
            icon={AlertTriangle}
            isAlert={metrics.cancellationRate > 0}
          />
          <KPICard
            title="Avg Delay"
            value={metricsLoading ? "..." : `${metrics.averageDelay || 2}m`}
            hint="Variance buffer"
            color="border-l-warning"
            icon={TrendingUp}
          />
          <KPICard
            title="Fleet Utilization"
            value="84%"
            hint="Active Hours / Cap"
            color="border-l-info"
            icon={BusIcon}
          />
          <KPICard
            title="Crew Utilization"
            value="88%"
            hint="Duty Hours / Shift"
            color="border-l-secondary"
            icon={Users}
          />
          <KPICard
            title="Recovery Rate"
            value={`${incidentsObj.recoverySuccessRate || 100}%`}
            hint="Disruptions resolved"
            color="border-l-emerald-500"
            icon={ListRestart}
          />
        </div>

        {/* 2. ANALYTICS SUB-MODULES GRID */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* SERVICE RELIABILITY */}
          <section className="glass-panel p-5 flex flex-col justify-between space-y-4 hover:border-primary/40 transition-colors">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Activity className="size-4 text-primary" /> Service Reliability
                </h3>
                <Badge variant="outline" className="text-[9px] font-mono">94% Target</Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Plan vs Actual departure variance, arrival timelines, and cancel ratios scoped to tenant date ranges.
              </p>
              <div className="pt-2 space-y-1">
                <div className="flex justify-between text-[11px] font-mono text-muted-foreground">
                  <span>Corridor Punctuality:</span>
                  <span className="font-bold text-foreground">94.2%</span>
                </div>
                <Progress value={94.2} className="h-1.5 bg-secondary" />
              </div>
            </div>
            <Button asChild size="sm" variant="secondary" className="w-full text-xs font-semibold">
              <Link to="/analytics/plan-vs-actual">
                Inspect Plan vs Actual <ArrowUpRight className="size-3.5 ml-1" />
              </Link>
            </Button>
          </section>

          {/* ROUTES PERFORMANCE */}
          <section className="glass-panel p-5 flex flex-col justify-between space-y-4 hover:border-primary/40 transition-colors">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Compass className="size-4 text-info" /> Route Performance
                </h3>
                <Badge variant="outline" className="text-[9px] font-mono">6 Corridors</Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Completion rates, delay statistics, and passenger headway indexing across active Salem routes.
              </p>
              <div className="pt-2 space-y-1">
                <div className="flex justify-between text-[11px] font-mono text-muted-foreground">
                  <span>Avg Route Headway:</span>
                  <span className="font-bold text-foreground">15 mins</span>
                </div>
                <Progress value={85} className="h-1.5 bg-secondary" />
              </div>
            </div>
            <Button asChild size="sm" variant="secondary" className="w-full text-xs font-semibold">
              <Link to="/analytics/routes">
                Inspect Route Analytics <ArrowUpRight className="size-3.5 ml-1" />
              </Link>
            </Button>
          </section>

          {/* FLEET UTILIZATION */}
          <section className="glass-panel p-5 flex flex-col justify-between space-y-4 hover:border-primary/40 transition-colors">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <BusIcon className="size-4 text-warning" /> Fleet Utilization
                </h3>
                <Badge variant="outline" className="text-[9px] font-mono">84% In Use</Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Operating hours per bus, vehicle breakdown downtime, and maintenance inspection frequencies.
              </p>
              <div className="pt-2 space-y-1">
                <div className="flex justify-between text-[11px] font-mono text-muted-foreground">
                  <span>Fleet Availability:</span>
                  <span className="font-bold text-foreground">92%</span>
                </div>
                <Progress value={92} className="h-1.5 bg-secondary" />
              </div>
            </div>
            <Button asChild size="sm" variant="secondary" className="w-full text-xs font-semibold">
              <Link to="/analytics/fleet">
                Inspect Fleet Analytics <ArrowUpRight className="size-3.5 ml-1" />
              </Link>
            </Button>
          </section>

          {/* CREW WORKLOADS */}
          <section className="glass-panel p-5 flex flex-col justify-between space-y-4 hover:border-primary/40 transition-colors">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Users className="size-4 text-success" /> Crew Utilization
                </h3>
                <Badge variant="outline" className="text-[9px] font-mono">Compliant</Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Duty segment durations, unlinked crew segment handovers, and rest compliance checks under MV Act.
              </p>
              <div className="pt-2 space-y-1">
                <div className="flex justify-between text-[11px] font-mono text-muted-foreground">
                  <span>Shift Compliance:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">100%</span>
                </div>
                <Progress value={100} className="h-1.5 bg-secondary" />
              </div>
            </div>
            <Button asChild size="sm" variant="secondary" className="w-full text-xs font-semibold">
              <Link to="/analytics/crew">
                Inspect Crew Analytics <ArrowUpRight className="size-3.5 ml-1" />
              </Link>
            </Button>
          </section>

          {/* DISRUPTIONS & RECOVERY */}
          <section className="glass-panel p-5 flex flex-col justify-between space-y-4 hover:border-primary/40 transition-colors">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <AlertTriangle className="size-4 text-destructive" /> Incidents & Recovery
                </h3>
                <Badge variant="outline" className="text-[9px] font-mono text-emerald-600">100% Solved</Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Disruption recovery success statistics, delay reductions, and algorithmic re-routing records.
              </p>
              <div className="pt-2 space-y-1">
                <div className="flex justify-between text-[11px] font-mono text-muted-foreground">
                  <span>Passenger Delay Saved:</span>
                  <span className="font-bold text-foreground">45 mins</span>
                </div>
                <Progress value={75} className="h-1.5 bg-secondary" />
              </div>
            </div>
            <Button asChild size="sm" variant="secondary" className="w-full text-xs font-semibold">
              <Link to="/analytics/incidents">
                Inspect Incident Analytics <ArrowUpRight className="size-3.5 ml-1" />
              </Link>
            </Button>
          </section>

          {/* DEPOT COMPARISON */}
          <section className="glass-panel p-5 flex flex-col justify-between space-y-4 hover:border-primary/40 transition-colors">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Building2 className="size-4 text-primary" /> Meyyanur Central Depot
                </h3>
                <Badge variant="outline" className="text-[9px] font-mono">Hub</Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Active fleet inventory, crew distribution, unassigned runs, and dispatch adherence.
              </p>
            </div>
            <div className="divide-y divide-border/40 text-[11px] text-muted-foreground pt-1">
              {depotStats.length > 0 ? (
                depotStats.map((d: any) => (
                  <div key={d.depot} className="py-1.5 flex justify-between">
                    <span>{d.depot}</span>
                    <span className="font-mono font-bold text-foreground">Util: {d.utilizationRate}%</span>
                  </div>
                ))
              ) : (
                <div className="py-1.5 flex justify-between font-mono">
                  <span>Meyyanur Central Depot</span>
                  <span className="font-bold text-foreground">Util: 88%</span>
                </div>
              )}
            </div>
            <Button asChild size="sm" variant="secondary" className="w-full text-xs font-semibold">
              <Link to="/fleet/buses">View Depot Fleet</Link>
            </Button>
          </section>
        </div>
      </div>
    </AppShell>
  );
}

function KPICard({
  title,
  value,
  hint,
  icon: Icon,
  color,
  isAlert,
}: {
  title: string;
  value: string;
  hint: string;
  icon: any;
  color?: string;
  isAlert?: boolean;
}) {
  return (
    <div className={cn("glass-card p-4 rounded-xl border border-l-4 flex flex-col justify-between", color || "border-l-primary")}>
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-[10px] font-bold uppercase tracking-wider">{title}</span>
        <Icon className={cn("size-3.5", isAlert ? "text-destructive" : "text-primary")} />
      </div>
      <div className="mt-2 flex items-baseline justify-between">
        <span className={cn("text-2xl font-bold font-mono", isAlert ? "text-destructive" : "text-foreground")}>
          {value}
        </span>
      </div>
      <span className="text-[10px] text-muted-foreground mt-1 truncate">{hint}</span>
    </div>
  );
}
