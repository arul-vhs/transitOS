import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Users,
  Search,
  Plus,
  Edit2,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
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
import { Route as RootRoute } from "@/routes/__root";
import { hasPermission } from "@/lib/auth-shared";
import {
  getDrivers,
  createCrewMember,
  updateCrewMember,
  updateCrewStatus,
} from "@/lib/fleet-crew";

export const Route = createFileRoute("/crew/drivers")({
  beforeLoad: ({ context }) => {
    if (!context.user || !hasPermission(context.user.role, "crew.view")) {
      throw new Error("Forbidden");
    }
  },
  head: () => ({
    meta: [
      { title: "Driver Roster: TransitOS" },
      {
        name: "description",
        content: "Driver registry, depot allocation, and shift availability status.",
      },
    ],
  }),
  component: DriversPage,
});

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "available":
      return "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10";
    case "assigned":
      return "border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/10";
    case "resting":
      return "border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10";
    case "leave":
      return "border-muted-foreground/30 text-muted-foreground bg-muted/20";
    default:
      return "border-border text-muted-foreground bg-muted/20";
  }
}

interface DriverItem {
  id: string;
  name: string;
  employeeId?: string;
  depot: string;
  status: string;
  licenseCategory?: string | null;
  licenseExpiry?: string | null;
  availableFrom?: number;
  restUntil?: number;
}

function DriversPage() {
  const queryClient = useQueryClient();
  const context = RootRoute.useRouteContext();
  const user = context?.user;
  const canManage = hasPermission(user?.role || "", "crew.manage");

  // Filters state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [depotFilter, setDepotFilter] = useState("all");

  // Dialog state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDriverId, setEditingDriverId] = useState<string | null>(null);

  // Form values
  const [name, setName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [depot, setDepot] = useState("Meyyanur Depot");
  const [status, setStatus] = useState("available");
  const [licenseCategory, setLicenseCategory] = useState(
    "Heavy Passenger Vehicle (HPV) / PSV Badge",
  );

  // Query Drivers
  const { data: driversList = [], isLoading } = useQuery<DriverItem[]>({
    queryKey: ["drivers", statusFilter, depotFilter, search],
    queryFn: () =>
      getDrivers({
        status: statusFilter,
        depot: depotFilter,
        search,
      }) as Promise<DriverItem[]>,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: createCrewMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      toast.success("Driver enrolled successfully.");
      setIsFormOpen(false);
      resetForm();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to enroll driver.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateCrewMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      toast.success("Driver profile updated.");
      setIsFormOpen(false);
      resetForm();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update driver.");
    },
  });

  const statusMutation = useMutation({
    mutationFn: updateCrewStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      toast.success("Driver availability status updated.");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update status.");
    },
  });

  const resetForm = () => {
    setEditingDriverId(null);
    setName("");
    setEmployeeId("");
    setDepot("Meyyanur Depot");
    setStatus("available");
    setLicenseCategory("Heavy Passenger Vehicle (HPV) / PSV Badge");
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleOpenEdit = (driver: DriverItem) => {
    setEditingDriverId(driver.id);
    setName(driver.name);
    setEmployeeId(driver.employeeId || "");
    setDepot(driver.depot);
    setStatus(driver.status);
    setLicenseCategory(
      driver.licenseCategory || "Heavy Passenger Vehicle (HPV) / PSV Badge",
    );
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Driver name is required.");
      return;
    }

    if (editingDriverId) {
      updateMutation.mutate({
        id: editingDriverId,
        data: {
          name: name.trim(),
          employeeId: employeeId.trim() || undefined,
          depot,
          status,
          role: "driver",
          licenseCategory,
        },
      });
    } else {
      createMutation.mutate({
        name: name.trim(),
        employeeId: employeeId.trim() || `TNSTC-SLM-DR-${Date.now().toString().slice(-3)}`,
        depot,
        status,
        role: "driver",
        licenseCategory,
      });
    }
  };

  // Metrics
  const totalDrivers = driversList.length;
  const availableDrivers = driversList.filter((d) => d.status === "available").length;
  const assignedDrivers = driversList.filter((d) => d.status === "assigned").length;
  const restingDrivers = driversList.filter(
    (d) => d.status === "resting" || d.status === "leave",
  ).length;

  return (
    <AppShell
      title="Driver Roster & Staff"
      subtitle="Driver directory, operating depot allocation, and shift availability status."
      actions={
        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="text-xs rounded-md border-border hover:bg-muted font-medium"
          >
            <Link to="/crew/conductors">
              <span>View Conductors</span>
            </Link>
          </Button>
          {canManage && (
            <Button
              size="sm"
              onClick={handleOpenCreate}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-md shadow-xs cursor-pointer"
            >
              <Plus className="mr-1.5 size-3.5" />
              Add Driver
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* End-to-End Workflow Progress Banner */}
        <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex size-7 items-center justify-center rounded-md bg-blue-600 text-white text-xs font-bold font-mono">
              4
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Staff & Crew Roster (Step 4 of 6)
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Ensure licensed drivers and conductors are on roster before scheduling daily trips.
              </p>
            </div>
          </div>
          <Button
            asChild
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-md shadow-xs shrink-0"
          >
            <Link to="/operations/trips">
              <span>Next: Timetable & Scheduling</span>
              <ArrowRight className="ml-1.5 size-3.5" />
            </Link>
          </Button>
        </div>

        {/* 1. Clear 4-KPI Metric Grid */}
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-border/80 bg-card p-4 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Total Drivers
              </span>
              <Users className="size-4 text-primary" />
            </div>
            <p className="text-3xl font-extrabold tracking-tight mt-1 text-foreground">
              {totalDrivers}
            </p>
            <p className="text-[11px] text-muted-foreground">Salem Division</p>
          </div>

          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Available to Drive
              </span>
              <CheckCircle2 className="size-4 text-emerald-500" />
            </div>
            <p className="text-3xl font-extrabold tracking-tight mt-1 text-emerald-600 dark:text-emerald-400">
              {availableDrivers}
            </p>
            <p className="text-[11px] text-muted-foreground">Rest period satisfied</p>
          </div>

          <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                On Duty / Assigned
              </span>
              <span className="size-2 rounded bg-blue-500"></span>
            </div>
            <p className="text-3xl font-extrabold tracking-tight mt-1 text-blue-600 dark:text-blue-400">
              {assignedDrivers}
            </p>
            <p className="text-[11px] text-muted-foreground">Assigned to daily shifts</p>
          </div>

          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                Resting / On Leave
              </span>
              <Clock className="size-4 text-amber-500" />
            </div>
            <p className="text-3xl font-extrabold tracking-tight mt-1 text-amber-600 dark:text-amber-400">
              {restingDrivers}
            </p>
            <p className="text-[11px] text-muted-foreground">Off duty</p>
          </div>
        </div>

        {/* 2. Filter Bar */}
        <div className="rounded-lg border border-border/80 bg-card p-4 flex flex-wrap gap-3 items-center justify-between shadow-xs">
          <div className="flex flex-1 flex-wrap gap-2.5 items-center min-w-[280px]">
            <div className="relative flex-1 max-w-xs min-w-[180px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Search driver name or employee ID..."
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
                <SelectItem value="resting">Resting</SelectItem>
                <SelectItem value="leave">On Leave</SelectItem>
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
            Total: <span className="font-bold text-foreground">{driversList.length}</span> drivers
          </span>
        </div>

        {/* 3. Driver Directory Table */}
        <div className="rounded-lg border border-border/80 bg-card overflow-hidden shadow-xs">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="text-xs font-bold text-foreground">Employee ID</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Driver Name</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Reporting Depot</TableHead>
                <TableHead className="text-xs font-bold text-foreground">License Badge</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Availability Status</TableHead>
                {canManage && <TableHead className="text-right text-xs font-bold text-foreground">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-xs text-muted-foreground">
                    Loading driver roster...
                  </TableCell>
                </TableRow>
              ) : driversList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-xs text-muted-foreground">
                    No drivers matching filter criteria.
                  </TableCell>
                </TableRow>
              ) : (
                driversList.map((driver) => (
                  <TableRow key={driver.id}>
                    <TableCell className="font-mono text-xs font-bold text-foreground">
                      {driver.employeeId || "TNSTC-DR"}
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-foreground">
                      {driver.name}
                    </TableCell>
                    <TableCell className="text-xs font-medium text-foreground">
                      {driver.depot}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="size-3.5 text-primary shrink-0" />
                        <span className="truncate max-w-[200px]">
                          {driver.licenseCategory || "Heavy Passenger Vehicle (HPV)"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {canManage ? (
                        <Select
                          value={driver.status}
                          onValueChange={(val) => statusMutation.mutate({ id: driver.id, status: val })}
                        >
                          <SelectTrigger className={`h-7 w-[125px] text-[11px] rounded font-medium ${getStatusBadgeClass(driver.status)}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="available">Available</SelectItem>
                            <SelectItem value="assigned">Assigned</SelectItem>
                            <SelectItem value="resting">Resting</SelectItem>
                            <SelectItem value="leave">On Leave</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant="outline" className={`text-[10px] rounded ${getStatusBadgeClass(driver.status)}`}>
                          {driver.status}
                        </Badge>
                      )}
                    </TableCell>
                    {canManage && (
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(driver)}
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

        {/* 4. Modal: Add / Edit Driver */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="sm:max-w-md rounded-lg">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-foreground">
                {editingDriverId ? "Edit Driver Profile" : "Enroll Driver"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Provide employee credentials and operating depot assignment.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-3.5 py-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Driver Full Name</Label>
                <Input
                  placeholder="e.g. Murugesan K."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-8.5 text-xs rounded-md"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Employee ID / Token</Label>
                  <Input
                    placeholder="e.g. TNSTC-SLM-DR-025"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className="h-8.5 text-xs font-mono uppercase rounded-md"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Reporting Depot</Label>
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
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">License Badge Category</Label>
                <Input
                  value={licenseCategory}
                  onChange={(e) => setLicenseCategory(e.target.value)}
                  className="h-8.5 text-xs rounded-md"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Availability Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="h-8.5 text-xs rounded-md">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available (Ready for duty)</SelectItem>
                    <SelectItem value="assigned">Assigned to shift</SelectItem>
                    <SelectItem value="resting">Resting</SelectItem>
                    <SelectItem value="leave">On Leave</SelectItem>
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
                  {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save Driver"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
