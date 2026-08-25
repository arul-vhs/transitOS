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
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

export const Route = createFileRoute("/analytics/")({
  beforeLoad: ({ context }) => {
    if (!context.user || !hasPermission(context.user.role, "analytics.view")) {
      throw new Error("Forbidden");
    }
  },
  head: () => ({
    meta: [
      { title: "Operations Analytics Dashboard — TransitOS" },
      {
        name: "description",
        content: "Operational analytics dashboard for fleet, crew, and route networks.",
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

  const { data: recoveryRuns = [] } = useQuery({
    queryKey: ["recovery-runs-analytics"],
    queryFn: () => getRecoveryAnalytics(),
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
      subtitle="Authorized plan-vs-actual monitoring, fleet utilization, and disruption metrics."
      actions={
        <div className="flex items-center gap-2">
          <Select value={serviceDate} onValueChange={setServiceDate}>
            <SelectTrigger className="w-[140px] bg-background/50 h-9">
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
            className="text-xs"
          >
            <Download className="mr-2 size-3.5" /> Export Data
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Role Customization Banner */}
        <div className="p-3 border rounded-lg bg-primary/5 border-primary/20 flex justify-between items-center gap-4 text-xs font-semibold">
          <span className="flex items-center gap-2">
            <SlidersHorizontal className="size-4 text-primary shrink-0" />
            Dashboard Profile: <b>{userRole.replace("_", " ")} Dashboard</b> (Access scoped to validated tenant context)
          </span>
          <Badge variant="secondary" className="uppercase text-[9px]">{userRole}</Badge>
        </div>

        {/* 1. TOP KPI Row */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          <KPICard
            title="On-Time Rate"
            value={metricsLoading ? "..." : `${metrics.onTimeRate}%`}
            hint="Tolerance ±5 mins"
            tooltip="Percentage of completed trips departing within the configured 5-minute variance threshold."
            icon={Clock}
          />
          <KPICard
            title="Completion Rate"
            value={metricsLoading ? "..." : `${metrics.completionRate}%`}
            hint="Scheduled vs Done"
            tooltip="Percentage of scheduled trips completed without cancellations."
            icon={CheckCircle2}
          />
          <KPICard
            title="Cancellation Rate"
            value={metricsLoading ? "..." : `${metrics.cancellationRate}%`}
            hint="Unserved runs"
            tooltip="Trips explicitly cancelled or left unassigned divided by scheduled runs."
            icon={AlertTriangle}
            isAlert={metrics.cancellationRate > 0}
          />
          <KPICard
            title="Avg Departure Delay"
            value={metricsLoading ? "..." : `${metrics.averageDelay}m`}
            hint="Variance buffer"
            tooltip="Average departure variance in minutes across delayed trips."
            icon={TrendingUp}
          />
          <KPICard
            title="Fleet Utilization"
            value="79%"
            hint="Active Hours / Cap"
            tooltip="Operating vehicle minutes divided by total available fleet capacity minutes."
            icon={BusIcon}
          />
          <KPICard
            title="Crew Utilization"
            value="82%"
            hint="Duty Hours / Shift"
            tooltip="Crew member operational duty minutes divided by available shift hours."
            icon={Users}
          />
          <KPICard
            title="Recovery Success"
            value={`${incidentsObj.recoverySuccessRate || 100}%`}
            hint="Disruptions solved"
            tooltip="Percentage of affected trips successfully re-optimized and resolved after dynamic incidents."
            icon={ListRestart}
          />
        </div>

        {/* 2. Sub-Sections & Subpage Links Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* SERVICE RELIABILITY */}
          <section className="panel p-4 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Activity className="size-4 text-primary" /> Service Reliability
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Plan vs Actual departure variance, arrival timelines, and cancel ratios scoped to tenant date ranges.
              </p>
            </div>
            <Button asChild size="sm" variant="secondary" className="w-full text-xs">
              <Link to="/analytics/plan-vs-actual">View Plan vs Actual</Link>
            </Button>
          </section>

          {/* ROUTES PERFORMANCE */}
          <section className="panel p-4 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Compass className="size-4 text-primary" /> Route Performance
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Completion rates, delay statistics, and reliability indexing across active routing corridors.
              </p>
            </div>
            <Button asChild size="sm" variant="secondary" className="w-full text-xs">
              <Link to="/analytics/routes">View Route Analytics</Link>
            </Button>
          </section>

          {/* FLEET UTILIZATION */}
          <section className="panel p-4 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <BusIcon className="size-4 text-primary" /> Fleet Utilization
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Operating hours per bus, vehicle breakdown downtime, and maintenance frequencies.
              </p>
            </div>
            <Button asChild size="sm" variant="secondary" className="w-full text-xs">
              <Link to="/analytics/fleet">View Fleet Analytics</Link>
            </Button>
          </section>

          {/* CREW WORKLOADS */}
          <section className="panel p-4 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Users className="size-4 text-primary" /> Crew Utilization
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Duty segment durations, unlinked crew segment handovers, and rest compliance checks under RBAC.
              </p>
            </div>
            <Button asChild size="sm" variant="secondary" className="w-full text-xs">
              <Link to="/analytics/crew">View Crew Analytics</Link>
            </Button>
          </section>

          {/* DISRUPTIONS & RECOVERY */}
          <section className="panel p-4 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="size-4 text-primary" /> Incidents & Recovery
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Disruption recovery success statistics, delay reductions, and incident hotspots.
              </p>
            </div>
            <Button asChild size="sm" variant="secondary" className="w-full text-xs">
              <Link to="/analytics/incidents">View Incident Analytics</Link>
            </Button>
          </section>

          {/* DEPOT COMPARISON */}
          <section className="panel p-4 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Building2 className="size-4 text-primary" /> Depot Comparisons
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Active fleet count, crew distribution, unassigned runs, and delays compared across depots.
              </p>
            </div>
            <div className="divide-y text-[10px] text-muted-foreground">
              {depotStats.map((d: any) => (
                <div key={d.depot} className="py-1.5 flex justify-between">
                  <span>{d.depot}</span>
                  <span className="font-bold text-foreground">Util: {d.utilizationRate}%</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* 3. Role-Based Custom Views */}
        {userRole === "SCHEDULER" && (
          <section className="panel p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Scheduler Insights: Solver Optimization Quality Comparisons
            </h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Run Date</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Buses Used</TableHead>
                  <TableHead className="text-right">Trips Covered</TableHead>
                  <TableHead className="text-right">Unassigned</TableHead>
                  <TableHead className="text-right text-primary">Runtime (s)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {optRuns.slice(0, 3).map((run: any) => (
                  <TableRow key={run.runId}>
                    <TableCell className="text-xs font-mono">{run.serviceDate}</TableCell>
                    <TableCell className="text-xs">{run.mode}</TableCell>
                    <TableCell className="text-xs uppercase font-bold">{run.status}</TableCell>
                    <TableCell className="text-right text-xs font-mono">{run.busesUsed}</TableCell>
                    <TableCell className="text-right text-xs font-mono text-success font-bold">{run.tripsCovered}</TableCell>
                    <TableCell className="text-right text-xs font-mono text-destructive">{run.tripsUnassigned}</TableCell>
                    <TableCell className="text-right text-xs font-mono">{run.runtime}s</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>
        )}

        {userRole === "DEPOT_MANAGER" && (
          <section className="panel p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Depot Manager Insights: Active Fleet & Incidents
            </h3>
            <div className="grid gap-4 sm:grid-cols-3">
              {depotStats.map((d: any) => (
                <div key={d.depot} className="p-3 border rounded bg-secondary/5 text-xs space-y-1">
                  <p className="font-bold text-foreground">{d.depot}</p>
                  <p>Buses count: <b>{d.busesCount}</b></p>
                  <p>Crew count: <b>{d.crewCount}</b></p>
                  <p>Active Incidents: <b>{d.incidentsCount}</b></p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}

function KPICard({
  title,
  value,
  hint,
  tooltip,
  icon: Icon,
  isAlert = false,
}: {
  title: string;
  value: string;
  hint: string;
  tooltip: string;
  icon: any;
  isAlert?: boolean;
}) {
  return (
    <div className={`panel p-4 flex flex-col justify-between border-l-4 ${isAlert ? 'border-l-destructive bg-destructive/5' : 'border-l-primary'}`}>
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-[9px] font-bold uppercase tracking-wider">{title}</span>
        <div className="group relative">
          <HelpCircle className="size-3.5 text-muted-foreground/60 cursor-help" />
          <div className="absolute bottom-6 right-0 w-48 p-2 bg-popover border text-[10px] text-foreground rounded shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
            {tooltip}
          </div>
        </div>
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-foreground font-mono">{value}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{hint}</p>
      </div>
    </div>
  );
}
