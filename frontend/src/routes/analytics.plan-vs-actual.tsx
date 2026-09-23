import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  Download,
  Calendar,
  Filter,
  ArrowLeft,
  Search,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { getPlanVsActual, exportAnalyticsCsv } from "@/lib/analytics-fns";
import { getRoutes } from "@/lib/routes-gis-fns";
import { getBuses } from "@/lib/fleet-crew";

export const Route = createFileRoute("/analytics/plan-vs-actual")({
  component: PlanVsActualPage,
});

function PlanVsActualPage() {
  const [serviceDate, setServiceDate] = useState("25 Aug 2026");
  const [routeId, setRouteId] = useState<string>("all");
  const [busId, setBusId] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");

  // Queries
  const { data: pvsList = [], isLoading: listLoading } = useQuery({
    queryKey: ["plan-vs-actual-data", routeId, busId, status, serviceDate],
    queryFn: () =>
      getPlanVsActual({
        routeId: routeId === "all" ? undefined : routeId,
        busId: busId === "all" ? undefined : busId,
        status: status === "all" ? undefined : status,
        serviceDate,
      }),
  });

  const { data: routesList = [] } = useQuery<any[]>({
    queryKey: ["routes-filters"],
    queryFn: () => getRoutes() as any,
  });

  const { data: busesList = [] } = useQuery<any[]>({
    queryKey: ["buses-filters"],
    queryFn: () => getBuses() as any,
  });

  // CSV export mutation
  const exportCsvMutation = useMutation({
    mutationFn: exportAnalyticsCsv,
    onSuccess: (csvBuffer) => {
      const blob = new Blob([csvBuffer], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `plan_vs_actual_report_${serviceDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Plan vs Actual CSV report exported.");
    },
  });

  return (
    <AppShell
      title="Plan vs Actual Analytics"
      subtitle="Track planned departures, actual timestamps, and variances with visual statuses."
      actions={
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/analytics"><ArrowLeft className="mr-2 size-3.5" /> Back</Link>
          </Button>

          <Button
            onClick={() => exportCsvMutation.mutate("plan-vs-actual")}
            disabled={exportCsvMutation.isPending}
            size="sm"
          >
            <Download className="mr-2 size-3.5" /> Export CSV
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Filters Panel */}
        <section className="panel p-4 grid gap-4 sm:grid-cols-4 items-end">
          <div className="space-y-1">
            <Label className="text-xs">Service Date</Label>
            <Select value={serviceDate} onValueChange={setServiceDate}>
              <SelectTrigger className="bg-background/50 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25 Aug 2026">25 Aug 2026</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Route Corridor</Label>
            <Select value={routeId} onValueChange={setRouteId}>
              <SelectTrigger className="bg-background/50 h-9">
                <SelectValue placeholder="All Routes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Routes</SelectItem>
                {routesList.map((r) => (
                  <SelectItem key={r.id} value={r.id}>{r.code}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Vehicle Bus</Label>
            <Select value={busId} onValueChange={setBusId}>
              <SelectTrigger className="bg-background/50 h-9">
                <SelectValue placeholder="All Buses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Buses</SelectItem>
                {busesList.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.registrationNumber}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">State Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="bg-background/50 h-9">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">COMPLETED</SelectItem>
                <SelectItem value="recovered">RECOVERED</SelectItem>
                <SelectItem value="scheduled">SCHEDULED</SelectItem>
                <SelectItem value="cancelled">CANCELLED</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </section>

        {/* Tabular data */}
        <section className="panel p-5 space-y-4">
          {listLoading ? (
            <div className="py-20 text-center text-xs text-muted-foreground">Loading plan vs actual logs...</div>
          ) : pvsList.length === 0 ? (
            <div className="py-20 text-center text-xs text-muted-foreground italic">No matching operational records found.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Trip Code</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Dir</TableHead>
                    <TableHead>Planned Start</TableHead>
                    <TableHead>Actual Start</TableHead>
                    <TableHead>Variance</TableHead>
                    <TableHead>Planned End</TableHead>
                    <TableHead>Actual End</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pvsList.map((t: any) => {
                    const varNum = parseInt(t.departureVariance);
                    const varColor =
                      isNaN(varNum)
                        ? "text-muted-foreground"
                        : varNum > 5
                        ? "text-destructive font-bold"
                        : varNum < 0
                        ? "text-success font-semibold"
                        : "text-muted-foreground";

                    return (
                      <TableRow key={t.tripId}>
                        <TableCell className="font-bold text-xs">{t.tripCode}</TableCell>
                        <TableCell className="text-xs">{t.routeCode}</TableCell>
                        <TableCell className="text-[10px] uppercase font-mono">{t.direction}</TableCell>
                        <TableCell className="text-xs font-mono">{t.plannedStart}</TableCell>
                        <TableCell className="text-xs font-mono">{t.actualStart}</TableCell>
                        <TableCell className={`text-xs font-mono ${varColor}`}>{t.departureVariance}</TableCell>
                        <TableCell className="text-xs font-mono">{t.plannedEnd}</TableCell>
                        <TableCell className="text-xs font-mono">{t.actualEnd}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              t.status === "COMPLETED"
                                ? "default"
                                : t.status === "RECOVERED"
                                ? "secondary"
                                : t.status === "CANCELLED"
                                ? "destructive"
                                : "outline"
                            }
                            className="text-[9px] uppercase px-1 py-0 h-5"
                          >
                            {t.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-[10px] text-muted-foreground max-w-[120px] truncate">
                          {t.cancellationReason}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
