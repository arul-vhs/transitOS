import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Wrench,
  AlertTriangle,
  CheckCircle,
  Plus,
  Bus,
  Search,
  ArrowRight,
} from "lucide-react";

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

export const Route = createFileRoute("/fleet/maintenance")({
  beforeLoad: ({ context }) => {
    if (!context.user || !hasPermission(context.user.role, "fleet.view")) {
      throw new Error("Forbidden");
    }
  },
  head: () => ({
    meta: [
      { title: "Fleet Maintenance — TransitOS" },
      { name: "description", content: "Scheduled servicing, docking and defect tracking." },
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["buses-maintenance"] });
      queryClient.invalidateQueries({ queryKey: ["buses"] });
      if (variables.status === "maintenance") {
        toast.success("Bus successfully sent to maintenance docking.");
        setIsScheduleOpen(false);
      } else {
        toast.success("Bus successfully returned to available service.");
      }
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update bus maintenance status");
    },
  });

  return (
    <AppShell
      title="Maintenance Register"
      subtitle="Track active service docking, defect reports and depot inspection status."
      actions={
        canManage ? (
          <Button size="sm" onClick={() => setIsScheduleOpen(true)}>
            <Plus className="mr-2 size-4" />
            Dock Vehicle
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-6">
        {/* Count overview */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="panel p-4 flex flex-col justify-between border-l-4 border-l-warning">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">In Docking (Maintenance)</p>
            <p className="text-2xl font-bold mt-2 text-warning">{busesInMaintenance.length}</p>
          </div>
          <div className="panel p-4 flex flex-col justify-between border-l-4 border-l-destructive">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Maintenance Required (Defects)</p>
            <p className="text-2xl font-bold mt-2 text-destructive">{busesRequiringMaintenance.length}</p>
          </div>
          <div className="panel p-4 flex flex-col justify-between border-l-4 border-l-success">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Available Fleet</p>
            <p className="text-2xl font-bold mt-2 text-success">{availableBuses.length}</p>
          </div>
        </div>

        {/* Active Maintenance Table */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Wrench className="size-4 text-warning animate-spin-slow" />
            Currently Docked for Servicing ({busesInMaintenance.length})
          </h2>
          <div className="panel overflow-hidden">
            {isLoading ? (
              <div className="py-8 text-center text-muted-foreground">Loading maintenance database...</div>
            ) : busesInMaintenance.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No vehicles are currently docked for maintenance.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Fleet Number</TableHead>
                    <TableHead>Registration</TableHead>
                    <TableHead>Bus Type</TableHead>
                    <TableHead>Depot</TableHead>
                    <TableHead>Status</TableHead>
                    {canManage && <TableHead className="w-[180px] text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {busesInMaintenance.map((bus) => (
                    <TableRow key={bus.id}>
                      <TableCell className="font-semibold text-primary">{bus.fleetNumber}</TableCell>
                      <TableCell className="font-mono text-sm">{bus.registrationNumber}</TableCell>
                      <TableCell className="text-sm">{bus.busType}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{bus.depot}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                          Maintenance
                        </Badge>
                      </TableCell>
                      {canManage && (
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 border-success/30 hover:bg-success/10 hover:text-success"
                            onClick={() =>
                              statusMutation.mutate({ id: bus.id, status: "available" })
                            }
                            disabled={statusMutation.isPending}
                          >
                            <CheckCircle className="mr-1.5 size-3.5" />
                            Release to Service
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>

        {/* Defect Alerts / Breakdowns */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-4" />
            Vehicles Reporting Defects / Breakdowns ({busesRequiringMaintenance.length})
          </h2>
          <div className="panel overflow-hidden">
            {isLoading ? (
              <div className="py-8 text-center text-muted-foreground">Loading maintenance database...</div>
            ) : busesRequiringMaintenance.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No active breakdown or defect alarms reported.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Fleet Number</TableHead>
                    <TableHead>Registration</TableHead>
                    <TableHead>Bus Type</TableHead>
                    <TableHead>Depot</TableHead>
                    <TableHead>Current Status</TableHead>
                    {canManage && <TableHead className="w-[180px] text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {busesRequiringMaintenance.map((bus) => (
                    <TableRow key={bus.id}>
                      <TableCell className="font-semibold text-destructive">{bus.fleetNumber}</TableCell>
                      <TableCell className="font-mono text-sm">{bus.registrationNumber}</TableCell>
                      <TableCell className="text-sm">{bus.busType}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{bus.depot}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 animate-pulse">
                          Breakdown
                        </Badge>
                      </TableCell>
                      {canManage && (
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 border-warning/30 hover:bg-warning/10 hover:text-warning"
                            onClick={() =>
                              statusMutation.mutate({ id: bus.id, status: "maintenance" })
                            }
                            disabled={statusMutation.isPending}
                          >
                            <ArrowRight className="mr-1.5 size-3.5" />
                            Dock for Repair
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </div>

      {/* DOCK VEHICLE DIALOG */}
      <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Dock Vehicle for Maintenance</DialogTitle>
            <DialogDescription>
              Select an available bus from the depot fleet register to move into servicing status.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search active fleet vehicles..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-background/50"
              />
            </div>
            <div className="max-h-[220px] overflow-y-auto border rounded-md">
              {filteredAvailableBuses.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  No active fleet vehicles match your search.
                </div>
              ) : (
                <div className="divide-y">
                  {filteredAvailableBuses.map((bus) => (
                    <div
                      key={bus.id}
                      className="flex items-center justify-between p-2.5 hover:bg-secondary/40 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-semibold text-primary">{bus.fleetNumber}</p>
                        <p className="text-xs font-mono text-muted-foreground">
                          {bus.registrationNumber} · {bus.busType}
                        </p>
                      </div>
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() =>
                          statusMutation.mutate({ id: bus.id, status: "maintenance" })
                        }
                        disabled={statusMutation.isPending}
                      >
                        <Bus className="mr-1 size-3" />
                        Dock
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsScheduleOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
