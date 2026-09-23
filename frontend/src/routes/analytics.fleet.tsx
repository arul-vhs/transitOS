import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Bus as BusIcon, Download } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getFleetAnalytics } from "@/lib/analytics-fns";

export const Route = createFileRoute("/analytics/fleet")({
  component: FleetAnalyticsPage,
});

function FleetAnalyticsPage() {
  const [depotFilter, setDepotFilter] = useState<string>("all");

  // Query
  const { data: fleetStats = [], isLoading } = useQuery({
    queryKey: ["fleet-analytics-data", depotFilter],
    queryFn: () =>
      getFleetAnalytics(depotFilter === "all" ? undefined : { depot: depotFilter }),
  });

  const filteredStats = fleetStats.filter(
    (b) => depotFilter === "all" || b.depot === depotFilter
  );

  return (
    <AppShell
      title="Fleet Utilization & Maintenance Analytics"
      subtitle="Examine operating hours, maintenance timelines, breakdowns, and active utilization per bus."
      actions={
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/analytics"><ArrowLeft className="mr-2 size-3.5" /> Back</Link>
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Filters Panel */}
        <section className="panel p-4 flex gap-4 items-end max-w-sm">
          <div className="space-y-1 flex-1">
            <span className="text-xs font-semibold text-muted-foreground">Filter Depot</span>
            <Select value={depotFilter} onValueChange={setDepotFilter}>
              <SelectTrigger className="bg-background/50 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Depots</SelectItem>
                <SelectItem value="Central Depot">Central Depot</SelectItem>
                <SelectItem value="North Depot">North Depot</SelectItem>
                <SelectItem value="West Depot">West Depot</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </section>

        {/* Fleet Table */}
        <section className="panel p-5 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <BusIcon className="size-4 text-primary" /> Active Bus Performance & Utilization Metrics
          </h3>

          {isLoading ? (
            <div className="py-20 text-center text-xs text-muted-foreground">Loading vehicle utilization...</div>
          ) : filteredStats.length === 0 ? (
            <div className="py-20 text-center text-xs text-muted-foreground italic">No fleet records matching depot filter.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Registration Number</TableHead>
                  <TableHead>Depot</TableHead>
                  <TableHead>Current Status</TableHead>
                  <TableHead className="text-right">Trips Operated</TableHead>
                  <TableHead className="text-right">Operating Hours</TableHead>
                  <TableHead className="text-right text-primary font-bold">Utilization Rate</TableHead>
                  <TableHead className="text-right">Breakdowns Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStats.map((b: any) => (
                  <TableRow key={b.busId}>
                    <TableCell className="font-bold text-xs">{b.registrationNumber}</TableCell>
                    <TableCell className="text-xs">{b.depot}</TableCell>
                    <TableCell className="text-xs uppercase font-mono">{b.status}</TableCell>
                    <TableCell className="text-right text-xs font-mono">{b.tripsOperated}</TableCell>
                    <TableCell className="text-right text-xs font-mono">{b.operatedHours} hrs</TableCell>
                    <TableCell className="text-right text-xs font-mono font-bold text-primary">{b.utilizationRate}%</TableCell>
                    <TableCell className="text-right text-xs font-mono text-destructive">{b.breakdownsCount}</TableCell>
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
