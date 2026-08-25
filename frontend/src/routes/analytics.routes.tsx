import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Compass, Download, TrendingUp } from "lucide-react";

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
import { getRouteAnalytics } from "@/lib/analytics-fns";

export const Route = createFileRoute("/analytics/routes")({
  component: RoutesAnalyticsPage,
});

function RoutesAnalyticsPage() {
  const [serviceDate, setServiceDate] = useState("25 Aug 2026");
  const [rankingFilter, setRankingFilter] = useState<string>("default");

  // Query
  const { data: routeStats = [], isLoading } = useQuery({
    queryKey: ["route-analytics-data", serviceDate],
    queryFn: () => getRouteAnalytics({ serviceDate }),
  });

  // Ranking logic
  const getSortedRoutes = () => {
    const list = [...routeStats];
    switch (rankingFilter) {
      case "most-reliable":
        return list.sort((a, b) => b.onTimeRate - a.onTimeRate);
      case "least-reliable":
        return list.sort((a, b) => a.onTimeRate - b.onTimeRate);
      case "most-delayed":
        return list.sort((a, b) => b.averageDelay - a.averageDelay);
      case "most-cancelled":
        return list.sort((a, b) => b.tripsCancelled - a.tripsCancelled);
      default:
        return list;
    }
  };

  const sortedList = getSortedRoutes();

  return (
    <AppShell
      title="Route Analytics & Performance"
      subtitle="Examine operational service quality, completion rates, and delay trends per route corridor."
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
        <section className="panel p-4 flex gap-4 items-end max-w-md">
          <div className="space-y-1 flex-1">
            <span className="text-xs font-semibold text-muted-foreground">Rank By Performance</span>
            <Select value={rankingFilter} onValueChange={setRankingFilter}>
              <SelectTrigger className="bg-background/50 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default Sort</SelectItem>
                <SelectItem value="most-reliable">Most Reliable (On-Time %)</SelectItem>
                <SelectItem value="least-reliable">Least Reliable (On-Time %)</SelectItem>
                <SelectItem value="most-delayed">Most Delayed (Avg Delay)</SelectItem>
                <SelectItem value="most-cancelled">Most Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </section>

        {/* Route Stats Table */}
        <section className="panel p-5 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Compass className="size-4 text-primary" /> Corridor Reliability Matrix
          </h3>

          {isLoading ? (
            <div className="py-20 text-center text-xs text-muted-foreground">Loading route metrics...</div>
          ) : sortedList.length === 0 ? (
            <div className="py-20 text-center text-xs text-muted-foreground italic">No route statistics for the selected service date.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Route Code</TableHead>
                  <TableHead>Route Name</TableHead>
                  <TableHead className="text-right">Trips Scheduled</TableHead>
                  <TableHead className="text-right">Completed</TableHead>
                  <TableHead className="text-right">Cancelled</TableHead>
                  <TableHead className="text-right">Completion %</TableHead>
                  <TableHead className="text-right text-primary font-bold">On-Time %</TableHead>
                  <TableHead className="text-right">Avg Delay</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedList.map((r: any) => (
                  <TableRow key={r.routeId}>
                    <TableCell className="font-bold text-xs">{r.routeCode}</TableCell>
                    <TableCell className="text-xs">{r.routeName}</TableCell>
                    <TableCell className="text-right text-xs font-mono">{r.tripsScheduled}</TableCell>
                    <TableCell className="text-right text-xs font-mono text-success">{r.tripsCompleted}</TableCell>
                    <TableCell className="text-right text-xs font-mono text-destructive">{r.tripsCancelled}</TableCell>
                    <TableCell className="text-right text-xs font-mono">{r.completionRate}%</TableCell>
                    <TableCell className="text-right text-xs font-mono font-bold text-primary">{r.onTimeRate}%</TableCell>
                    <TableCell className="text-right text-xs font-mono">{r.averageDelay} mins</TableCell>
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
