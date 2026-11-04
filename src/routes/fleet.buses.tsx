import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Bus,
  Search,
  Plus,
  Edit2,
  Wrench,
  CheckCircle2,
  ArrowRight,
  Filter,
  Check,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { TransitTable, ColumnDef } from "@/components/ui/transit-table";
import { useActiveTenant } from "@/lib/tenant-context";
import { Play, Sparkles } from "lucide-react";
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
import { Route as RootRoute } from "@/routes/__root";
import { hasPermission } from "@/lib/auth-shared";
import {
  getBuses,
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
      { title: "Bus Fleet Register: TransitOS" },
      {
        name: "description",
        content: "Fleet inventory, depot assignments, and vehicle operational status.",
      },
    ],
  }),
  component: BusesPage,
});

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "available":
      return "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10";
    case "assigned":
    case "in-service":
      return "border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/10";
    case "maintenance":
      return "border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10";
    case "breakdown":
      return "border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/10";
    default:
      return "border-border text-muted-foreground bg-muted/20";
  }
}

interface BusItem {
  id: string;
  registrationNumber: string;
  fleetNumber?: string;
  busType?: string;
  capacity?: number;
  depot: string;
  status: string;
  availableFrom?: number;
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

  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBusId, setEditingBusId] = useState<string | null>(null);

  // Form values
  const [regNum, setRegNum] = useState("");
  const [fleetNum, setFleetNum] = useState("");
  const [busType, setBusType] = useState("Ashok Leyland 210 HP BS-VI Viking");
  const [capacity, setCapacity] = useState("48");
  const [depot, setDepot] = useState("Meyyanur Depot");
  const [status, setStatus] = useState("available");

  // Query Buses
  const { data: busesList = [], isLoading } = useQuery<BusItem[]>({
    queryKey: ["buses", statusFilter, depotFilter, search],
    queryFn: () =>
      getBuses({
        status: statusFilter,
        depot: depotFilter,
        search,
      }) as Promise<BusItem[]>,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: createBus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buses"] });
      toast.success("Bus registered successfully.");
      setIsFormOpen(false);
      resetForm();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to register bus.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateBus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buses"] });
      toast.success("Bus details updated.");
      setIsFormOpen(false);
      resetForm();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update bus.");
    },
  });

  const statusMutation = useMutation({
    mutationFn: updateBusStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buses"] });
      toast.success("Bus operational status updated.");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update status.");
    },
  });

  const resetForm = () => {
    setEditingBusId(null);
    setRegNum("");
    setFleetNum("");
    setBusType("Ashok Leyland 210 HP BS-VI Viking");
    setCapacity("48");
    setDepot("Meyyanur Depot");
    setStatus("available");
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleOpenEdit = (bus: BusItem) => {
    setEditingBusId(bus.id);
    setRegNum(bus.registrationNumber);
    setFleetNum(bus.fleetNumber || "");
    setBusType(bus.busType || "Ashok Leyland 210 HP BS-VI Viking");
    setCapacity(String(bus.capacity || 48));
    setDepot(bus.depot);
    setStatus(bus.status);
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regNum.trim()) {
      toast.error("Registration number is required.");
      return;
    }

    if (editingBusId) {
      updateMutation.mutate({
        id: editingBusId,
        data: {
          registrationNumber: regNum.trim(),
          fleetNumber: fleetNum.trim() || regNum.trim(),
          busType,
          capacity: Number(capacity) || 48,
          depot,
          status,
        },
      });
    } else {
      createMutation.mutate({
        registrationNumber: regNum.trim(),
        fleetNumber: fleetNum.trim() || regNum.trim(),
        busType,
        capacity: Number(capacity) || 48,
        depot,
        status,
      });
    }
  };

  // Operational metrics
  const totalBuses = busesList.length;
  const availableBuses = busesList.filter((b) => b.status === "available").length;
  const inServiceBuses = busesList.filter(
    (b) => b.status === "in-service" || b.status === "assigned",
  ).length;
  const maintenanceBuses = busesList.filter(
    (b) => b.status === "maintenance" || b.status === "breakdown",
  ).length;


  const columns: ColumnDef<BusItem>[] = [
    {
      header: "Registration Number",
      accessorKey: "registrationNumber",
      cell: (bus) => (
        <span className="font-mono text-xs font-bold text-foreground">
          {bus.registrationNumber}
        </span>
      ),
    },
    {
      header: "Fleet Unit",
      accessorKey: "fleetNumber",
      cell: (bus) => (
        <span className="font-mono text-xs text-muted-foreground">
          {bus.fleetNumber || bus.registrationNumber}
        </span>
      ),
    },
    {
      header: "Operating Depot",
      accessorKey: "depot",
      cell: (bus) => (
        <span className="text-xs font-medium text-foreground">
          {bus.depot}
        </span>
      ),
    },
    {
      header: "Vehicle Model / Type",
      accessorKey: "busType",
      cell: (bus) => (
        <span className="text-xs text-muted-foreground">
          {bus.busType || "Standard Leyland BS-VI"}
        </span>
      ),
    },
    {
      header: "Capacity",
      accessorKey: "capacity",
      cell: (bus) => (
        <span className="text-xs text-muted-foreground font-mono">
          {bus.capacity || 48} seats
        </span>
      ),
    },
    {
      header: "Operational Status",
      accessorKey: "status",
      cell: (bus) => (
        canManage ? (
          <div onClick={(e) => e.stopPropagation()}>
            <Select
              value={bus.status}
              onValueChange={(val) => statusMutation.mutate({ id: bus.id, status: val })}
            >
              <SelectTrigger className={`h-7 w-[125px] text-[11px] rounded font-medium ${getStatusBadgeClass(bus.status)}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="in-service">In Service</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="breakdown">Breakdown</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ) : (
          <Badge variant="outline" className={`text-[10px] rounded ${getStatusBadgeClass(bus.status)}`}>
            {bus.status}
          </Badge>
        )
      ),
    },
    {
      header: "Actions",
      className: "text-right",
      cell: (bus) => (
        canManage ? (
          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleOpenEdit(bus)}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground rounded-md"
            >
              <Edit2 className="size-3.5 mr-1" />
              Edit
            </Button>
          </div>
        ) : null
      ),
    },
  ];

  const depotOptions = [
    { label: "All Depots", value: "all" },
    ...currentTenant.depots.map((d) => ({
      label: d.name,
      value: d.name,
    })),
  ];

  return (
    <AppShell
      title="Bus Fleet Management"
      subtitle="Vehicle inventory, depot allocation, and vehicle operational status."
      actions={
        canManage ? (
          <Button
            size="sm"
            onClick={handleOpenCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-md shadow-xs cursor-pointer"
          >
            <Plus className="mr-1.5 size-3.5" />
            Add Bus
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* End-to-End Workflow Progress Banner */}
        <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex size-7 items-center justify-center rounded-md bg-blue-600 text-white text-xs font-bold font-mono">
              3
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Bus Fleet (Step 3 of 6)
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Verify available buses across active operating depots for the scheduled service date.
              </p>
            </div>
          </div>
          <Button
            asChild
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-md shadow-xs shrink-0"
          >
            <Link to="/crew/drivers">
              <span>Next: Review Staff & Crew</span>
              <ArrowRight className="ml-1.5 size-3.5" />
            </Link>
          </Button>
        </div>

        {/* 1. Clear 4-KPI Metric Grid */}
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-border/80 bg-card p-4 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Total Fleet
              </span>
              <Bus className="size-4 text-primary" />
            </div>
            <p className="text-3xl font-extrabold tracking-tight mt-1 text-foreground">
              {totalBuses}
            </p>
            <p className="text-[11px] text-muted-foreground truncate">{currentTenant.name}</p>
          </div>

          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Available
              </span>
              <CheckCircle2 className="size-4 text-emerald-500" />
            </div>
            <p className="text-3xl font-extrabold tracking-tight mt-1 text-emerald-600 dark:text-emerald-400">
              {availableBuses}
            </p>
            <p className="text-[11px] text-muted-foreground">Ready for dispatch</p>
          </div>

          <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                In Service / Assigned
              </span>
              <span className="size-2 rounded bg-blue-500"></span>
            </div>
            <p className="text-3xl font-extrabold tracking-tight mt-1 text-blue-600 dark:text-blue-400">
              {inServiceBuses}
            </p>
            <p className="text-[11px] text-muted-foreground">Assigned to daily trips</p>
          </div>

          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                Maintenance & Workshop
              </span>
              <Wrench className="size-4 text-amber-500" />
            </div>
            <p className="text-3xl font-extrabold tracking-tight mt-1 text-amber-600 dark:text-amber-400">
              {maintenanceBuses}
            </p>
            <p className="text-[11px] text-muted-foreground">Workshop repairs</p>
          </div>
        </div>

        {/* 2. Search & Filter Bar */}
        <div className="rounded-lg border border-border/80 bg-card p-4 flex flex-wrap gap-3 items-center justify-between shadow-xs">
          <div className="flex flex-1 flex-wrap gap-2.5 items-center min-w-[280px]">
            <div className="relative flex-1 max-w-xs min-w-[180px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Search registration or fleet number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-xs rounded-md"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px] h-8 text-xs rounded-md">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="in-service">In Service</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="breakdown">Breakdown</SelectItem>
              </SelectContent>
            </Select>

            <Select value={depotFilter} onValueChange={setDepotFilter}>
              <SelectTrigger className="w-[170px] h-8 text-xs rounded-md">
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

          <span className="text-xs text-muted-foreground">
            Total: <span className="font-bold text-foreground">{busesList.length}</span> buses
          </span>
        </div>

        {/* 3. Fleet Register Table */}
        <div className="rounded-lg border border-border/80 bg-card overflow-hidden shadow-xs">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="text-xs font-bold text-foreground">Reg Number</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Fleet Unit</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Home Depot</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Vehicle Model / Type</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Capacity</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Operational Status</TableHead>
                {canManage && <TableHead className="text-right text-xs font-bold text-foreground">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-xs text-muted-foreground">
                    Loading bus register...
                  </TableCell>
                </TableRow>
              ) : busesList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-xs text-muted-foreground">
                    No buses matching filter criteria.
                  </TableCell>
                </TableRow>
              ) : (
                busesList.map((bus) => (
                  <TableRow key={bus.id}>
                    <TableCell className="font-mono text-xs font-bold text-foreground">
                      {bus.registrationNumber}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {bus.fleetNumber || bus.registrationNumber}
                    </TableCell>
                    <TableCell className="text-xs font-medium text-foreground">
                      {bus.depot}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {bus.busType || "Standard Single Decker"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {bus.capacity || 48} seats
                    </TableCell>
                    <TableCell>
                      {canManage ? (
                        <Select
                          value={bus.status}
                          onValueChange={(val) => statusMutation.mutate({ id: bus.id, status: val })}
                        >
                          <SelectTrigger className={`h-7 w-[125px] text-[11px] rounded font-medium ${getStatusBadgeClass(bus.status)}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="available">Available</SelectItem>
                            <SelectItem value="assigned">Assigned</SelectItem>
                            <SelectItem value="in-service">In Service</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                            <SelectItem value="breakdown">Breakdown</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant="outline" className={`text-[10px] rounded ${getStatusBadgeClass(bus.status)}`}>
                          {bus.status}
                        </Badge>
                      )}
                    </TableCell>
                    {canManage && (
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(bus)}
                          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground rounded-md"
                        >
                          <Edit2 className="size-3.5 mr-1" />
                          Edit
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* 4. Modal: Add / Edit Bus */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="sm:max-w-md rounded-lg">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-foreground">
                {editingBusId ? "Edit Bus Details" : "Register New Bus"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Provide vehicle registration and operating depot assignment.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-3.5 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Registration Number</Label>
                  <Input
                    placeholder="e.g. TN-30-N-0412"
                    value={regNum}
                    onChange={(e) => setRegNum(e.target.value)}
                    className="h-8.5 text-xs font-mono uppercase rounded-md"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Fleet Unit Code</Label>
                  <Input
                    placeholder="e.g. SLM-MY-101"
                    value={fleetNum}
                    onChange={(e) => setFleetNum(e.target.value)}
                    className="h-8.5 text-xs font-mono uppercase rounded-md"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Vehicle Model / Type</Label>
                <Select value={busType} onValueChange={setBusType}>
                  <SelectTrigger className="h-8.5 text-xs rounded-md">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ashok Leyland 210 HP BS-VI Viking">Ashok Leyland 210 HP BS-VI Viking</SelectItem>
                    <SelectItem value="Ashok Leyland Semi-Low Floor SLF">Ashok Leyland Semi-Low Floor SLF</SelectItem>
                    <SelectItem value="Tata Marcopolo Starbus Ultra">Tata Marcopolo Starbus Ultra</SelectItem>
                    <SelectItem value="Ashok Leyland Suburban Liner">Ashok Leyland Suburban Liner</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Operating Depot</Label>
                  <Select value={depot} onValueChange={setDepot}>
                    <SelectTrigger className="h-8.5 text-xs rounded-md">
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
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Seating Capacity</Label>
                  <Input
                    type="number"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    className="h-8.5 text-xs rounded-md"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Operational Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="h-8.5 text-xs rounded-md">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available (Ready for service)</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="in-service">In Service</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="breakdown">Breakdown</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFormOpen(false)}
                  className="text-xs rounded-md"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-md"
                >
                  {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save Bus"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
