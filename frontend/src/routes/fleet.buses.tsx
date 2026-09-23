import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Bus,
  Search,
  Plus,
  Edit2,
  Eye,
  Settings,
  AlertTriangle,
  CheckCircle2,
  Wrench,
  Clock,
  Filter,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Route as RootRoute } from "@/routes/__root";
import { hasPermission } from "@/lib/auth-shared";
import {
  getBuses,
  getBus,
  createBus,
  updateBus,
  updateBusStatus,
} from "@/lib/fleet-crew";

export const Route = createFileRoute("/fleet/buses")({
  beforeLoad: ({ context }) => {
    if (!context.user || !hasPermission(context.user.role, "fleet.view")) {
      throw new Error("Forbidden");
    }
  },
  head: () => ({
    meta: [
      { title: "Fleet Management — TransitOS" },
      { name: "description", content: "Fleet register, availability and depot allocation." },
    ],
  }),
  component: BusesPage,
});

// Helper to convert minutes-since-midnight to time string "HH:MM"
function formatMinutesToTime(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// Helper to convert time string "HH:MM" to minutes-since-midnight
function parseTimeToMinutes(time: string): number {
  if (!time) return 330; // 05:30 default
  const [h, m] = time.split(":").map(Number);
  if (isNaN(h || 0) || isNaN(m || 0)) return 330;
  return (h || 0) * 60 + (m || 0);
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "available":
      return "bg-success/10 text-success border-success/20";
    case "assigned":
      return "bg-info/10 text-info border-info/20";
    case "in-service":
      return "bg-primary/10 text-primary border-primary/20";
    case "maintenance":
      return "bg-warning/10 text-warning border-warning/20";
    case "breakdown":
      return "bg-destructive/10 text-destructive border-destructive/20 animate-pulse";
    case "out-of-service":
      return "bg-muted text-muted-foreground border-border";
    default:
      return "bg-secondary text-secondary-foreground";
  }
}

function BusesPage() {
  const queryClient = useQueryClient();
  const context = RootRoute.useRouteContext();
  const user = context?.user;
  const canManage = hasPermission(user?.role || "", "fleet.manage");

  // Filters state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [depotFilter, setDepotFilter] = useState("all");

  // Dialog / Sheet states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isConfirmStatusOpen, setIsConfirmStatusOpen] = useState(false);

  // Selected Bus states
  const [selectedBusId, setSelectedBusId] = useState<string | null>(null);
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    id: string;
    regNum: string;
    fleetNum: string;
    status: string;
  } | null>(null);

  // Form states
  const [formRegNum, setFormRegNum] = useState("");
  const [formFleetNum, setFormFleetNum] = useState("");
  const [formBusType, setFormBusType] = useState("Standard Single Decker");
  const [formCapacity, setFormCapacity] = useState("40");
  const [formDepot, setFormDepot] = useState("Meyyanur Depot");
  const [formStatus, setFormStatus] = useState("available");
  const [formAvailableFrom, setFormAvailableFrom] = useState("05:30");

  // 1. Fetch Buses
  const { data: busesList = [], isLoading } = useQuery({
    queryKey: ["buses", statusFilter, depotFilter, search],
    queryFn: () =>
      getBuses({
        status: statusFilter,
        depot: depotFilter,
        search,
      }),
  });

  // 2. Fetch Selected Bus Details
  const { data: selectedBusDetails } = useQuery({
    queryKey: ["bus", selectedBusId],
    queryFn: () => getBus(selectedBusId!),
    enabled: !!selectedBusId,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: createBus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buses"] });
      toast.success("Bus created successfully");
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create bus");
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateBus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buses"] });
      if (selectedBusId) {
        queryClient.invalidateQueries({ queryKey: ["bus", selectedBusId] });
      }
      toast.success("Bus updated successfully");
      setIsEditOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update bus");
    },
  });

  const statusMutation = useMutation({
    mutationFn: updateBusStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buses"] });
      if (selectedBusId) {
        queryClient.invalidateQueries({ queryKey: ["bus", selectedBusId] });
      }
      toast.success("Bus status updated successfully");
      setIsConfirmStatusOpen(false);
      setPendingStatusChange(null);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update status");
    },
  });

  // Reset form helper
  const resetForm = () => {
    setFormRegNum("");
    setFormFleetNum("");
    setFormBusType("Standard Single Decker");
    setFormCapacity("40");
    setFormDepot("Meyyanur Depot");
    setFormStatus("available");
    setFormAvailableFrom("05:30");
  };

  // Open Edit Dialog
  const handleOpenEdit = (bus: any) => {
    setSelectedBusId(bus.id);
    setFormRegNum(bus.registrationNumber);
    setFormFleetNum(bus.fleetNumber || "");
    setFormBusType(bus.busType || "Standard Single Decker");
    setFormCapacity(String(bus.capacity || 40));
    setFormDepot(bus.depot);
    setFormStatus(bus.status);
    setFormAvailableFrom(formatMinutesToTime(bus.availableFrom));
    setIsEditOpen(true);
  };

  // Open Details Drawer
  const handleOpenDetails = (busId: string) => {
    setSelectedBusId(busId);
    setIsDetailsOpen(true);
  };

  // Submit Create
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      registrationNumber: formRegNum,
      fleetNumber: formFleetNum,
      busType: formBusType,
      capacity: Number(formCapacity),
      depot: formDepot,
      status: formStatus,
      availableFrom: parseTimeToMinutes(formAvailableFrom),
    });
  };

  // Submit Edit
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBusId) return;
    updateMutation.mutate({
      id: selectedBusId,
      data: {
        registrationNumber: formRegNum,
        fleetNumber: formFleetNum,
        busType: formBusType,
        capacity: Number(formCapacity),
        depot: formDepot,
        status: formStatus,
        availableFrom: parseTimeToMinutes(formAvailableFrom),
      },
    });
  };

  // Status change dropdown handler
  const handleStatusSelect = (id: string, currentReg: string, currentFleet: string, newStatus: string) => {
    if (newStatus === "breakdown" || newStatus === "out-of-service") {
      setPendingStatusChange({ id, regNum: currentReg, fleetNum: currentFleet, status: newStatus });
      setIsConfirmStatusOpen(true);
    } else {
      statusMutation.mutate({ id, status: newStatus });
    }
  };

  // Metrics Calculation
  const totalBuses = busesList.length;
  const availableBuses = busesList.filter((b) => b.status === "available").length;
  const assignedBuses = busesList.filter((b) => b.status === "assigned").length;
  const inServiceBuses = busesList.filter((b) => b.status === "in-service").length;
  const maintenanceBuses = busesList.filter((b) => b.status === "maintenance").length;
  const breakdownBuses = busesList.filter((b) => b.status === "breakdown").length;
  const outOfServiceBuses = busesList.filter((b) => b.status === "out-of-service").length;

  return (
    <AppShell
      title="Fleet Management"
      subtitle="Manage your depot fleet registers and live bus status contexts."
      actions={
        canManage ? (
          <Button
            size="sm"
            onClick={() => {
              resetForm();
              setIsCreateOpen(true);
            }}
          >
            <Plus className="mr-2 size-4" />
            Create Bus
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-6">
        {/* 1. Metrics Grid (Apple-Style Glass Cards with Semrush Accents) */}
        <div className="grid gap-3.5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
          <div className="rounded-2xl border border-border/80 bg-card p-4 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Total Fleet</span>
              <Bus className="size-4 text-primary" />
            </div>
            <p className="text-3xl font-extrabold tracking-tight mt-2 text-foreground">{totalBuses}</p>
            <p className="text-[11px] text-muted-foreground mt-1">Salem City Fleet</p>
          </div>

          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Available</span>
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <p className="text-3xl font-extrabold tracking-tight mt-2 text-emerald-600 dark:text-emerald-400">{availableBuses}</p>
            <p className="text-[11px] text-muted-foreground mt-1">Ready to dispatch</p>
          </div>

          <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">In Service</span>
              <span className="size-2 rounded-full bg-cyan-500"></span>
            </div>
            <p className="text-3xl font-extrabold tracking-tight mt-2 text-cyan-600 dark:text-cyan-400">{inServiceBuses + assignedBuses}</p>
            <p className="text-[11px] text-muted-foreground mt-1">On road or assigned</p>
          </div>

          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Maintenance</span>
              <Wrench className="size-4 text-amber-500" />
            </div>
            <p className="text-3xl font-extrabold tracking-tight mt-2 text-amber-600 dark:text-amber-400">{maintenanceBuses}</p>
            <p className="text-[11px] text-muted-foreground mt-1">In workshop bays</p>
          </div>

          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Breakdown</span>
              <AlertTriangle className="size-4 text-rose-500" />
            </div>
            <p className="text-3xl font-extrabold tracking-tight mt-2 text-rose-600 dark:text-rose-400">{breakdownBuses}</p>
            <p className="text-[11px] text-muted-foreground mt-1">Needs recovery</p>
          </div>

          <div className="rounded-2xl border border-border/70 bg-muted/30 p-4 flex flex-col justify-between shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Standby</span>
              <span className="size-2 rounded-full bg-muted-foreground"></span>
            </div>
            <p className="text-3xl font-extrabold tracking-tight mt-2 text-muted-foreground">{outOfServiceBuses}</p>
            <p className="text-[11px] text-muted-foreground mt-1">Depot reserve</p>
          </div>
        </div>

        {/* 2. Filter Bar */}
        <div className="panel p-4 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-1 flex-wrap gap-3 items-center min-w-[280px]">
            <div className="relative flex-1 max-w-sm min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search registration or fleet number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-background/50"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="size-4 text-muted-foreground shrink-0" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] bg-background/50">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="in-service">In Service</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="breakdown">Breakdown</SelectItem>
                  <SelectItem value="out-of-service">Out of Service</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Select value={depotFilter} onValueChange={setDepotFilter}>
                <SelectTrigger className="w-[180px] bg-background/50">
                  <SelectValue placeholder="Depot" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Depots</SelectItem>
                  <SelectItem value="Meyyanur Depot">Meyyanur Depot</SelectItem>
                  <SelectItem value="Johnsonpet Depot">Johnsonpet Depot</SelectItem>
                  <SelectItem value="Hasthampatti Depot">Hasthampatti Depot</SelectItem>
                  <SelectItem value="Steel Plant Depot">Steel Plant Depot</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* 3. Bus Table panel */}
        <div className="panel overflow-hidden">
          {isLoading ? (
            <div className="py-10 text-center text-muted-foreground">Loading fleet records...</div>
          ) : busesList.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              No buses found. Add a bus to populate your fleet database.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Fleet Number</TableHead>
                  <TableHead>Registration</TableHead>
                  <TableHead>Bus Type</TableHead>
                  <TableHead className="text-right">Capacity</TableHead>
                  <TableHead>Depot</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Available From</TableHead>
                  <TableHead className="w-[200px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {busesList.map((bus) => (
                  <TableRow key={bus.id}>
                    <TableCell className="font-semibold text-primary">{bus.fleetNumber || "-"}</TableCell>
                    <TableCell className="font-mono text-sm">{bus.registrationNumber}</TableCell>
                    <TableCell className="text-sm">{bus.busType || "Standard"}</TableCell>
                    <TableCell className="text-right text-sm">{bus.capacity || 40}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{bus.depot}</TableCell>
                    <TableCell>
                      {canManage ? (
                        <Select
                          value={bus.status}
                          onValueChange={(val) =>
                            handleStatusSelect(bus.id, bus.registrationNumber, bus.fleetNumber || "", val)
                          }
                        >
                          <SelectTrigger className={`h-7 w-[130px] text-xs font-semibold uppercase tracking-wider border ${getStatusBadgeClass(bus.status)}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="available" className="text-xs uppercase tracking-wider text-success">Available</SelectItem>
                            <SelectItem value="assigned" className="text-xs uppercase tracking-wider text-info">Assigned</SelectItem>
                            <SelectItem value="in-service" className="text-xs uppercase tracking-wider text-primary">In Service</SelectItem>
                            <SelectItem value="maintenance" className="text-xs uppercase tracking-wider text-warning">Maintenance</SelectItem>
                            <SelectItem value="breakdown" className="text-xs uppercase tracking-wider text-destructive">Breakdown</SelectItem>
                            <SelectItem value="out-of-service" className="text-xs uppercase tracking-wider text-muted-foreground">Out of Service</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant="outline" className={`h-6 text-[10px] font-semibold uppercase tracking-wider border ${getStatusBadgeClass(bus.status)}`}>
                          {bus.status.replace("-", " ")}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {formatMinutesToTime(bus.availableFrom)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground"
                          onClick={() => handleOpenDetails(bus.id)}
                        >
                          <Eye className="size-4" />
                          <span className="sr-only">View Details</span>
                        </Button>
                        {canManage && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground"
                            onClick={() => handleOpenEdit(bus)}
                          >
                            <Edit2 className="size-4" />
                            <span className="sr-only">Edit Bus</span>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* dialogs & drawer components */}

      {/* CREATE BUS DIALOG */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleCreateSubmit}>
            <DialogHeader>
              <DialogTitle>Create New Bus</DialogTitle>
              <DialogDescription>
                Add a new verified passenger bus vehicle to this organization's database fleet registry.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="regNum" className="text-right">Registration</Label>
                <Input
                  id="regNum"
                  value={formRegNum}
                  onChange={(e) => setFormRegNum(e.target.value)}
                  placeholder="TN-30-AB-1234"
                  className="col-span-3 font-mono"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="fleetNum" className="text-right">Fleet No.</Label>
                <Input
                  id="fleetNum"
                  value={formFleetNum}
                  onChange={(e) => setFormFleetNum(e.target.value)}
                  placeholder="F-120"
                  className="col-span-3 font-semibold text-primary"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="busType" className="text-right">Bus Type</Label>
                <Select value={formBusType} onValueChange={setFormBusType}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Standard Single Decker">Standard Single Decker</SelectItem>
                    <SelectItem value="Minibus">Minibus</SelectItem>
                    <SelectItem value="Electric Single Decker">Electric Single Decker</SelectItem>
                    <SelectItem value="Double Decker">Double Decker</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="capacity" className="text-right">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  value={formCapacity}
                  onChange={(e) => setFormCapacity(e.target.value)}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="depot" className="text-right">Depot</Label>
                <Select value={formDepot} onValueChange={setFormDepot}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Meyyanur Depot">Meyyanur Depot</SelectItem>
                    <SelectItem value="Johnsonpet Depot">Johnsonpet Depot</SelectItem>
                    <SelectItem value="Hasthampatti Depot">Hasthampatti Depot</SelectItem>
                    <SelectItem value="Steel Plant Depot">Steel Plant Depot</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">Status</Label>
                <Select value={formStatus} onValueChange={setFormStatus}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="in-service">In Service</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="availFrom" className="text-right text-xs">Available From</Label>
                <Input
                  id="availFrom"
                  type="time"
                  value={formAvailableFrom}
                  onChange={(e) => setFormAvailableFrom(e.target.value)}
                  className="col-span-3 font-mono"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Save Bus"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT BUS DIALOG */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleEditSubmit}>
            <DialogHeader>
              <DialogTitle>Edit Bus Details</DialogTitle>
              <DialogDescription>
                Modify properties of bus vehicle `{formFleetNum}`.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editRegNum" className="text-right">Registration</Label>
                <Input
                  id="editRegNum"
                  value={formRegNum}
                  onChange={(e) => setFormRegNum(e.target.value)}
                  className="col-span-3 font-mono"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editFleetNum" className="text-right">Fleet No.</Label>
                <Input
                  id="editFleetNum"
                  value={formFleetNum}
                  onChange={(e) => setFormFleetNum(e.target.value)}
                  className="col-span-3 font-semibold text-primary"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editBusType" className="text-right">Bus Type</Label>
                <Select value={formBusType} onValueChange={setFormBusType}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Standard Single Decker">Standard Single Decker</SelectItem>
                    <SelectItem value="Minibus">Minibus</SelectItem>
                    <SelectItem value="Electric Single Decker">Electric Single Decker</SelectItem>
                    <SelectItem value="Double Decker">Double Decker</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editCapacity" className="text-right">Capacity</Label>
                <Input
                  id="editCapacity"
                  type="number"
                  min="1"
                  value={formCapacity}
                  onChange={(e) => setFormCapacity(e.target.value)}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editDepot" className="text-right">Depot</Label>
                <Select value={formDepot} onValueChange={setFormDepot}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Meyyanur Depot">Meyyanur Depot</SelectItem>
                    <SelectItem value="Johnsonpet Depot">Johnsonpet Depot</SelectItem>
                    <SelectItem value="Hasthampatti Depot">Hasthampatti Depot</SelectItem>
                    <SelectItem value="Steel Plant Depot">Steel Plant Depot</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editStatus" className="text-right">Status</Label>
                <Select value={formStatus} onValueChange={setFormStatus}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="in-service">In Service</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="breakdown">Breakdown</SelectItem>
                    <SelectItem value="out-of-service">Out of Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editAvailFrom" className="text-right text-xs">Available From</Label>
                <Input
                  id="editAvailFrom"
                  type="time"
                  value={formAvailableFrom}
                  onChange={(e) => setFormAvailableFrom(e.target.value)}
                  className="col-span-3 font-mono"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* STATUS CHANGE CONFIRMATION DIALOG */}
      <Dialog open={isConfirmStatusOpen} onOpenChange={setIsConfirmStatusOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-5" />
              Confirm Status Change
            </DialogTitle>
            <DialogDescription className="pt-2 text-foreground font-semibold">
              Mark {pendingStatusChange?.fleetNum || "bus"} ({pendingStatusChange?.regNum}) as{" "}
              <span className="capitalize text-destructive font-bold">{pendingStatusChange?.status.replace("-", " ")}</span>?
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 text-sm text-muted-foreground">
            This action will mark the vehicle as unavailable in the fleet schedule.
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setIsConfirmStatusOpen(false);
                setPendingStatusChange(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (pendingStatusChange) {
                  statusMutation.mutate({
                    id: pendingStatusChange.id,
                    status: pendingStatusChange.status,
                  });
                }
              }}
              disabled={statusMutation.isPending}
            >
              {statusMutation.isPending ? "Updating..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DETAILS SHEET */}
      <Sheet open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <SheetContent className="sm:max-w-[450px]">
          <SheetHeader>
            <SheetTitle className="text-xl font-bold flex items-center gap-2">
              <Bus className="size-5 text-primary" />
              Bus Details
            </SheetTitle>
          </SheetHeader>
          {selectedBusDetails ? (
            <div className="mt-6 space-y-6">
              {/* Properties block */}
              <div className="panel p-4 space-y-3 bg-secondary/20">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Fleet Number</span>
                  <span className="font-bold text-primary">{selectedBusDetails.fleetNumber || "-"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Registration</span>
                  <span className="font-mono text-sm font-semibold">{selectedBusDetails.registrationNumber}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Status</span>
                  <Badge variant="outline" className={`h-6 text-[10px] font-semibold uppercase tracking-wider border ${getStatusBadgeClass(selectedBusDetails.status)}`}>
                    {selectedBusDetails.status.replace("-", " ")}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Capacity</span>
                  <span className="text-sm font-semibold">{selectedBusDetails.capacity} seats</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Depot</span>
                  <span className="text-sm font-medium">{selectedBusDetails.depot}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Available From</span>
                  <span className="text-sm font-mono">{formatMinutesToTime(selectedBusDetails.availableFrom)}</span>
                </div>
              </div>

              {/* Today Duties */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-success" />
                  Today's Duties
                </h3>
                <div className="border border-dashed border-border rounded-md p-4 text-center text-xs text-muted-foreground bg-background/50">
                  No duties scheduled for the service day.
                </div>
              </div>

              {/* Maintenance placeholder */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Wrench className="size-4 text-warning" />
                  Maintenance Logs
                </h3>
                <div className="border border-dashed border-border rounded-md p-4 text-center text-xs text-muted-foreground bg-background/50">
                  No active or past maintenance reports found.
                </div>
              </div>

              {/* Assignment history */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Clock className="size-4 text-info" />
                  Assignment History
                </h3>
                <div className="border border-dashed border-border rounded-md p-4 text-center text-xs text-muted-foreground bg-background/50">
                  No past roster allocation records found.
                </div>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-muted-foreground text-sm">
              Loading bus details...
            </div>
          )}
        </SheetContent>
      </Sheet>
    </AppShell>
  );
}
