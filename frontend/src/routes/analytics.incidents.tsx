import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, AlertTriangle } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getIncidentAnalytics, getRecoveryAnalytics } from "@/lib/analytics-fns";

export const Route = createFileRoute("/analytics/incidents")({
  component: IncidentsAnalyticsPage,
});

function IncidentsAnalyticsPage() {
  // Queries
  const { data: incidentStats = {} as any, isLoading: statsLoading } = useQuery({
    queryKey: ["incidents-analytics-details"],
    queryFn: () => getIncidentAnalytics(),
  });

  const { data: recoveryStats = [], isLoading: runsLoading } = useQuery({
    queryKey: ["recovery-runs-details"],
    queryFn: () => getRecoveryAnalytics(),
  });

  return (
    <AppShell
      title="Disruption & Recovery Analytics"
      subtitle="Examine logged incidents frequency, recovery success rate, and re-optimization performance."
      actions={
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/analytics"><ArrowLeft className="mr-2 size-3.5" /> Back</Link>
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Incident Summary Card */}
        <section className="panel p-5 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <AlertTriangle className="size-4 text-primary" /> Incident Hotspots & Types
          </h3>

          {statsLoading ? (
            <div className="text-xs text-muted-foreground py-10 text-center">Loading summaries...</div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 border rounded bg-secondary/5 space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Total Incidents Reported:</span>
                  <span className="font-bold text-foreground font-mono">{incidentStats.totalIncidents}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Recovery Success Rate:</span>
                  <span className="font-bold text-success font-mono">{incidentStats.recoverySuccessRate}%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Avg Solve Runtime:</span>
                  <span className="font-bold text-primary font-mono">{incidentStats.averageRecoveryTimeMins}s</span>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <p className="font-semibold">Incidents by Type:</p>
                <div className="space-y-1.5 font-mono">
                  {incidentStats.typesSummary?.map((t: any) => (
                    <div key={t.type} className="flex justify-between py-1 border-b">
                      <span>{t.type}</span>
                      <span className="font-bold">{t.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Recovery Runs log table */}
        <section className="panel p-5 lg:col-span-2 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Disruption Re-optimization Solver Log
          </h3>

          {runsLoading ? (
            <div className="py-20 text-center text-xs text-muted-foreground">Loading solver logs...</div>
          ) : recoveryStats.length === 0 ? (
            <div className="py-20 text-center text-xs text-muted-foreground italic">No recovery runs recorded.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service Date</TableHead>
                  <TableHead>Incident Type</TableHead>
                  <TableHead className="text-right">Trips Affected</TableHead>
                  <TableHead className="text-right">Recovered</TableHead>
                  <TableHead className="text-right">Unassigned</TableHead>
                  <TableHead className="text-right">Recovery Success</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recoveryStats.map((r: any) => {
                  const successRate = r.tripsAffected > 0 ? Math.round((r.tripsRecovered / r.tripsAffected) * 100) : 100;
                  return (
                    <TableRow key={r.runId}>
                      <TableCell className="text-xs font-mono">{r.serviceDate}</TableCell>
                      <TableCell className="text-xs uppercase font-mono">{r.incidentType}</TableCell>
                      <TableCell className="text-right text-xs font-mono">{r.tripsAffected}</TableCell>
                      <TableCell className="text-right text-xs font-mono text-success">{r.tripsRecovered}</TableCell>
                      <TableCell className="text-right text-xs font-mono text-destructive">{r.tripsUnassigned}</TableCell>
                      <TableCell className="text-right text-xs font-mono font-bold">{successRate}%</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </section>
      </div>
    </AppShell>
  );
}
