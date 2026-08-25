import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Users } from "lucide-react";

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
import { getCrewAnalytics } from "@/lib/analytics-fns";

export const Route = createFileRoute("/analytics/crew")({
  component: CrewAnalyticsPage,
});

function CrewAnalyticsPage() {
  // Query
  const { data: crewStats = [], isLoading } = useQuery({
    queryKey: ["crew-analytics-data"],
    queryFn: () => getCrewAnalytics(),
  });

  return (
    <AppShell
      title="Crew Performance & rest compliance"
      subtitle="Examine crew segments workload, handovers, and compliance intervals under strict RBAC restrictions."
      actions={
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/analytics"><ArrowLeft className="mr-2 size-3.5" /> Back</Link>
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Crew Workload Table */}
        <section className="panel p-5 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Users className="size-4 text-primary" /> Active Driver & Conductor Performance Indicators
          </h3>

          {isLoading ? (
            <div className="py-20 text-center text-xs text-muted-foreground">Loading crew analytics...</div>
          ) : crewStats.length === 0 ? (
            <div className="py-20 text-center text-xs text-muted-foreground italic">No crew workloads logged.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Crew Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Depot</TableHead>
                  <TableHead className="text-right">Duty Hours</TableHead>
                  <TableHead className="text-right">Handovers</TableHead>
                  <TableHead className="text-right text-primary font-bold">Utilization Rate</TableHead>
                  <TableHead className="text-right">Rest compliance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {crewStats.map((c: any) => (
                  <TableRow key={c.crewId}>
                    <TableCell className="font-bold text-xs">{c.name.substring(0, 1) + ". " + c.name.split(" ").slice(-1)[0]}</TableCell>
                    <TableCell className="text-xs">{c.role}</TableCell>
                    <TableCell className="text-xs">{c.depot}</TableCell>
                    <TableCell className="text-right text-xs font-mono">{c.dutyHours} hrs</TableCell>
                    <TableCell className="text-right text-xs font-mono">{c.handoversCount}</TableCell>
                    <TableCell className="text-right text-xs font-mono font-bold text-primary">{c.utilizationRate}%</TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={c.restCompliance === "COMPLIANT" ? "secondary" : "outline"}
                        className="text-[9px]"
                      >
                        {c.restCompliance}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </section>
      </div>
    </AppShell>
  );
}
