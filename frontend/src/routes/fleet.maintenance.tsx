import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Wrench,
  AlertTriangle,
  CheckCircle,
  Plus,
  Bus as BusIcon,
  Search,
  ArrowRight,
  ShieldCheck,
  Zap,
  Activity,
  Gauge,
  RotateCcw,
  CheckCircle2,
  Calendar,
  Layers,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Route as RootRoute } from "@/routes/__root";
import { hasPermission } from "@/lib/auth-shared";
import { getBuses, updateBusStatus } from "@/lib/fleet-crew";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/fleet/maintenance")({
  beforeLoad: ({ context }) => {
    if (!context.user || !hasPermission(context.user.role, "fleet.view")) {
      throw new Error("Forbidden");
    }
  },
  head: () => ({
    meta: [
      { title: "Fleet Maintenance Bays — TransitOS" },
      { name: "description", content: "Scheduled servicing, docking bay tracking and defect remediation." },
    ],
  }),
  component: MaintenancePage,
});

function MaintenancePage() {
  const queryClient = useQueryClient();
  const context = RootRoute.useRouteContext();
  const user = context?.user;
  const canManage = hasPermission(user?.role || "", "fleet.manage");

  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedBusId, setSelectedBusId] = useState<string | null>(null);

  // 1. Fetch all buses
  const { data: busesList = [], isLoading } = useQuery({
    queryKey: ["buses-maintenance"],
    queryFn: () => getBuses(),
  });

  // Filters
  const busesInMaintenance = busesList.filter((b) => b.status === "maintenance");
  const busesRequiringMaintenance = busesList.filter((b) => b.status === "breakdown");
  const availableBuses = busesList.filter(
    (b) => b.status === "available" || b.status === "assigned" || b.status === "in-service"
  );

  // Filter available buses for the selection dialog
  const filteredAvailableBuses = availableBuses.filter(
    (b) =>
      b.registrationNumber.toLowerCase().includes(search.toLowerCase()) ||
      (b.fleetNumber || "").toLowerCase().includes(search.toLowerCase())
  );

  // Status mutation
  const statusMutation = useMutation({
    mutationFn: updateBusStatus,
    onSuccess: (_, variables: any) => {
      queryClient.invalidateQueries({ queryKey: ["buses-maintenance"] });
      queryClient.invalidateQueries({ queryKey: ["buses"] });
      const status = variables?.status || variables?.data?.status;
      if (status === "maintenance") {
        toast.success("Bus successfully sent to maintenance docking.");
        setIsScheduleOpen(false);
      } else {
        toast.success("Bus successfully returned to active service.");
      }
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update bus maintenance status");
    },
  });

  const fleetHealthPercent =
    busesList.length > 0
      ? Math.round((availableBuses.length / busesList.length) * 100)
      : 100;

  return (
    <AppShell
      title="Maintenance & Fleet Health"
      subtitle="Track active service docking, breakdown defect reports, and depot inspection readiness."
      actions={
        canManage ? (
          <Button
            size="sm"
            onClick={() => setIsScheduleOpen(true)}
            className="bg-primary text-primary-foreground text-xs font-semibold shadow-md shadow-primary/20 hover:scale-[1.02] transition-all"
          >
            <Plus className="mr-1.5 size-4" />
            Dock Vehicle in Bay
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-6">
        {/* 1. HEALTH TELEMETRY CARDS */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="glass-card p-4 rounded-xl border-l-4 border-l-primary flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] font-bold uppercase tracking-wider">Fleet Readiness</span>
              <Gauge className="size-4 text-primary" />
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-primary">{fleetHealthPercent}%</span>
              <span className="text-[10px] text-muted-foreground">operational rate</span>
            </div>
          </div>

          <div className="glass-card p-4 rounded-xl border-l-4 border-l-warning flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] font-bold uppercase tracking-wider">In Docking (Bays)</span>
              <Wrench className="size-4 text-warning" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono text-warning">{busesInMaintenance.length}</span>
              <Badge variant="outline" className="border-warning/30 text-warning bg-warning/5 text-[9px] font-mono">
                Active Bay
              </Badge>
            </div>
          </div>

          <div className="glass-card p-4 rounded-xl border-l-4 border-l-destructive flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] font-bold uppercase tracking-wider">Defects / Breakdowns</span>
              <AlertTriangle className="size-4 text-destructive" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono text-destructive">{busesRequiringMaintenance.length}</span>
              <Badge variant="outline" className="border-destructive/30 text-destructive bg-destructive/5 text-[9px] font-mono">
                Action Req
              </Badge>
            </div>
          </div>

          <div className="glass-card p-4 rounded-xl border-l-4 border-l-success flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] font-bold uppercase tracking-wider">Available Fleet</span>
              <CheckCircle2 className="size-4 text-success" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono text-success">{availableBuses.length}</span>
              <span className="text-[10px] text-muted-foreground font-mono">of {busesList.length} total</span>
            </div>
          </div>
        </div>

        {/* 2. DEFECT / BREAKDOWN SECTION */}
        {busesRequiringMaintenance.length > 0 && (
          <div className="glass-panel p-5 space-y-3 border-destructive/40 bg-destructive/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="size-4.5" />
                <h3 className="text-sm font-bold tracking-tight">Vehicles Reporting Defects or Road Breakdowns</h3>
              </div>
              <Badge variant="outline" className="border-destructive/40 text-destructive font-mono text-xs">
                {busesRequiringMaintenance.length} Grounded
              </Badge>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 pt-1">
              {busesRequiringMaintenance.map((bus) => (
                <div key={bus.id} className="p-3.5 rounded-xl border border-destructive/30 bg-card/80 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-foreground font-mono">{bus.registrationNumber}</span>
                      <Badge variant="outline" className="text-[9px] font-mono">{bus.fleetNumber}</Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{bus.busType} · {bus.depot}</p>
                  </div>
                  {canManage && (
                    <Button
                      size="sm"
                      onClick={() => statusMutation.mutate({ id: bus.id, status: "maintenance" })}
                      disabled={statusMutation.isPending}
                      className="bg-warning text-warning-foreground text-[11px] h-7 px-2.5 font-semibold"
                    >
                      <Wrench className="size-3 mr-1" /> Send to Bay
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. ACTIVE MAINTENANCE DOCKING TABLE */}
        <section className="glass-panel p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <div className="grid size-7 place-items-center rounded-lg bg-warning/10 text-warning">
                <Wrench className="size-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-tight text-foreground">Currently Docked for Servicing</h3>
                <p className="text-[11px] text-muted-foreground">Depot mechanics inspection and overhaul bay</p>
              </div>
            </div>
            <Badge variant="outline" className="font-mono text-xs">
              {busesInMaintenance.length} Vehicles In Bay
            </Badge>
          </div>

          {isLoading ? (
            <div className="py-16 text-center text-xs text-muted-foreground">Loading maintenance database...</div>
          ) : busesInMaintenance.length === 0 ? (
            <div className="py-16 text-center text-xs text-muted-foreground flex flex-col items-center justify-center">
              <ShieldCheck className="size-8 text-emerald-500/60 mb-2" />
              <p className="font-semibold text-foreground">All Bays Clear</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">No vehicles currently docked for scheduled or emergency overhaul.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border/60">
                  <TableHead className="text-xs font-bold">Fleet No</TableHead>
                  <TableHead className="text-xs font-bold">Registration</TableHead>
                  <TableHead className="text-xs font-bold">Bus Type</TableHead>
                  <TableHead className="text-xs font-bold">Depot Location</TableHead>
                  <TableHead className="text-xs font-bold">Status</TableHead>
                  {canManage && <TableHead className="text-right text-xs font-bold">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {busesInMaintenance.map((bus) => (
                  <TableRow key={bus.id} className="border-border/40 hover:bg-muted/40 transition-colors">
                    <TableCell className="font-semibold text-primary font-mono text-xs">{bus.fleetNumber}</TableCell>
                    <TableCell className="font-mono text-xs font-bold">{bus.registrationNumber}</TableCell>
                    <TableCell className="text-xs">{bus.busType}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{bus.depot}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30 text-[9px] font-mono uppercase font-bold">
                        Maintenance
                      </Badge>
                    </TableCell>
                    {canManage && (
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 font-semibold"
                          onClick={() =>
                            statusMutation.mutate({ id: bus.id, status: "available" })
                          }
                          disabled={statusMutation.isPending}
                        >
                          <CheckCircle className="mr-1 size-3.5" />
                          Release to Service
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </section>
      </div>

      {/* DOCK VEHICLE MODAL */}
      <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Wrench className="size-4 text-warning" />
              Dock Vehicle in Maintenance Bay
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Select an available bus to transition to maintenance docking status.
            </DialogDescription>
          </DialogHeader>

          <div className="py-3 space-y-3.5">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by registration or fleet number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5 max-h-56 overflow-y-auto border rounded-xl p-2 bg-secondary/10">
              {filteredAvailableBuses.map((bus) => (
                <div
                  key={bus.id}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-card border border-transparent hover:border-border transition-all"
                >
                  <div className="text-xs">
                    <span className="font-bold font-mono text-foreground">{bus.registrationNumber}</span>
                    <span className="text-[10px] text-muted-foreground ml-2 font-mono">({bus.fleetNumber || bus.busType})</span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => statusMutation.mutate({ id: bus.id, status: "maintenance" })}
                    disabled={statusMutation.isPending}
                    className="h-7 text-[11px] bg-warning text-warning-foreground font-semibold"
                  >
                    Dock
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsScheduleOpen(false)} className="text-xs">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
