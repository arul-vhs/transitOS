import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  User,
  Search,
  Plus,
  Edit2,
  Eye,
  Calendar,
  AlertTriangle,
  CheckCircle,
  FileText,
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
  getDrivers,
  getCrewMember,
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
      { title: "Driver Registry — TransitOS" },
      { name: "description", content: "Driver roster, licensing, availability and shift logs." },
    ],
  }),
  component: DriversPage,
});

// Helpers
function formatMinutesToTime(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function parseTimeToMinutes(time: string): number {
  if (!time) return 330;
  const [h, m] = time.split(":").map(Number);
  if (isNaN(h || 0) || isNaN(m || 0)) return 330;
  return (h || 0) * 60 + (m || 0);
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "available":
      return "bg-success/10 text-success border-success/20";
    case "on-duty":
      return "bg-primary/10 text-primary border-primary/20";
    case "resting":
      return "bg-warning/10 text-warning border-warning/20";
    case "leave":
      return "bg-destructive/10 text-destructive border-destructive/20";
    case "unavailable":
      return "bg-muted text-muted-foreground border-border";
    default:
      return "bg-secondary text-secondary-foreground";
  }
}

function DriversPage() {
  const queryClient = useQueryClient();
  const context = RootRoute.useRouteContext();
  const user = context?.user;
  const canManage = hasPermission(user?.role || "", "crew.manage");

  // Filters State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [depotFilter, setDepotFilter] = useState("all");

  // Dialog / Sheet states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Selected driver
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);

  // Form states
  const [formEmpId, setFormEmpId] = useState("");
  const [formName, setFormName] = useState("");
  const [formStatus, setFormStatus] = useState("available");
  const [formDepot, setFormDepot] = useState("Salem Central Depot");
  const [formAvailableFrom, setFormAvailableFrom] = useState("05:30");
  const [formRestUntil, setFormRestUntil] = useState("05:30");
  const [formLicenseCategory, setFormLicenseCategory] = useState("Heavy Passenger Vehicle (HPV)");
  const [formLicenseExpiry, setFormLicenseExpiry] = useState("2028-12-31");

  // 1. Fetch Drivers
  const { data: driversList = [], isLoading } = useQuery({
    queryKey: ["drivers", statusFilter, depotFilter, search],
    queryFn: () =>
      getDrivers({
        status: statusFilter,
        depot: depotFilter,
        search,
      }),
  });

  // 2. Fetch Selected Driver details
  const { data: selectedDriverDetails } = useQuery({
    queryKey: ["crew-member", selectedDriverId],
    queryFn: () => getCrewMember(selectedDriverId!),
    enabled: !!selectedDriverId,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: createCrewMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      queryClient.invalidateQueries({ queryKey: ["crew-availability"] });
      toast.success("Driver created successfully");
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create driver");
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateCrewMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      queryClient.invalidateQueries({ queryKey: ["crew-availability"] });
      if (selectedDriverId) {
        queryClient.invalidateQueries({ queryKey: ["crew-member", selectedDriverId] });
      }
      toast.success("Driver updated successfully");
      setIsEditOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update driver");
    },
  });

  const statusMutation = useMutation({
    mutationFn: updateCrewStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      queryClient.invalidateQueries({ queryKey: ["crew-availability"] });
      toast.success("Driver status updated successfully");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update status");
    },
  });

  const resetForm = () => {
    setFormEmpId("");
    setFormName("");
    setFormStatus("available");
    setFormDepot("Salem Central Depot");
    setFormAvailableFrom("05:30");
    setFormRestUntil("05:30");
    setFormLicenseCategory("Heavy Passenger Vehicle (HPV)");
    setFormLicenseExpiry("2028-12-31");
  };

  const handleOpenEdit = (driver: any) => {
    setSelectedDriverId(driver.id);
    setFormEmpId(driver.employeeId);
    setFormName(driver.name);
    setFormStatus(driver.status);
    setFormDepot(driver.depot);
    setFormAvailableFrom(formatMinutesToTime(driver.availableFrom));
    setFormRestUntil(formatMinutesToTime(driver.restUntil));
    setFormLicenseCategory(driver.licenseCategory || "Heavy Passenger Vehicle (HPV)");
    setFormLicenseExpiry(
      driver.licenseExpiry ? new Date(driver.licenseExpiry).toISOString().split("T")[0]! : "2028-12-31"
    );
    setIsEditOpen(true);
  };

  const handleOpenDetails = (id: string) => {
    setSelectedDriverId(id);
    setIsDetailsOpen(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      employeeId: formEmpId,
      name: formName,
      role: "driver",
      status: formStatus,
      depot: formDepot,
      availableFrom: parseTimeToMinutes(formAvailableFrom),
      restUntil: parseTimeToMinutes(formRestUntil),
      licenseCategory: formLicenseCategory,
      licenseExpiry: new Date(formLicenseExpiry),
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriverId) return;
    updateMutation.mutate({
      id: selectedDriverId,
      data: {
        employeeId: formEmpId,
        name: formName,
        status: formStatus,
        depot: formDepot,
        availableFrom: parseTimeToMinutes(formAvailableFrom),
        restUntil: parseTimeToMinutes(formRestUntil),
        licenseCategory: formLicenseCategory,
        licenseExpiry: new Date(formLicenseExpiry),
      },
    });
  };

  // Metrics
  const totalCount = driversList.length;
  const availableCount = driversList.filter((d) => d.status === "available").length;
  const onDutyCount = driversList.filter((d) => d.status === "on-duty").length;
  const restingCount = driversList.filter((d) => d.status === "resting").length;
  const leaveCount = driversList.filter((d) => d.status === "leave" || d.status === "unavailable").length;

  return (
    <AppShell
      title="Driver Registry"
      subtitle="Manage driver credentials, licensing profiles, and active schedule status."
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
            Add Driver
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-6">
        {/* 1. Metrics Overview */}
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-5">
          <div className="panel p-4 flex flex-col justify-between">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Drivers</p>
            <p className="text-2xl font-bold mt-2 text-foreground">{totalCount}</p>
          </div>
          <div className="panel p-4 border-l-4 border-l-success flex flex-col justify-between">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Available</p>
            <p className="text-2xl font-bold mt-2 text-success">{availableCount}</p>
          </div>
          <div className="panel p-4 border-l-4 border-l-primary flex flex-col justify-between">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">On Duty</p>
            <p className="text-2xl font-bold mt-2 text-primary">{onDutyCount}</p>
          </div>
          <div className="panel p-4 border-l-4 border-l-warning flex flex-col justify-between">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Resting</p>
            <p className="text-2xl font-bold mt-2 text-warning">{restingCount}</p>
          </div>
          <div className="panel p-4 border-l-4 border-l-destructive flex flex-col justify-between">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Leave / Off</p>
            <p className="text-2xl font-bold mt-2 text-destructive">{leaveCount}</p>
          </div>
        </div>

        {/* 2. Filter Bar */}
        <div className="panel p-4 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-1 flex-wrap gap-3 items-center min-w-[280px]">
            <div className="relative flex-1 max-w-sm min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search name or employee ID..."
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
                  <SelectItem value="on-duty">On Duty</SelectItem>
                  <SelectItem value="resting">Resting</SelectItem>
                  <SelectItem value="leave">Leave</SelectItem>
                  <SelectItem value="unavailable">Unavailable</SelectItem>
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
                  <SelectItem value="Salem Central Depot">Salem Central Depot</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* 3. Driver Table Panel */}
        <div className="panel overflow-hidden">
          {isLoading ? (
            <div className="py-10 text-center text-muted-foreground">Loading driver registry...</div>
          ) : driversList.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              No drivers found. Add crew members to register drivers.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Employee ID</TableHead>
                  <TableHead>Driver Name</TableHead>
                  <TableHead>Depot</TableHead>
                  <TableHead>License Category</TableHead>
                  <TableHead>License Expiry</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Availability</TableHead>
                  <TableHead className="w-[150px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {driversList.map((driver) => (
                  <TableRow key={driver.id}>
                    <TableCell className="font-semibold text-primary">{driver.employeeId}</TableCell>
                    <TableCell className="font-medium">{driver.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{driver.depot}</TableCell>
                    <TableCell className="text-sm">{driver.licenseCategory || "-"}</TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {driver.licenseExpiry
                        ? new Date(driver.licenseExpiry).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {canManage ? (
                        <Select
                          value={driver.status}
                          onValueChange={(val) =>
                            statusMutation.mutate({ id: driver.id, status: val })
                          }
                        >
                          <SelectTrigger className={`h-7 w-[120px] text-xs font-semibold uppercase tracking-wider border ${getStatusBadgeClass(driver.status)}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="available" className="text-xs uppercase tracking-wider text-success">Available</SelectItem>
                            <SelectItem value="on-duty" className="text-xs uppercase tracking-wider text-primary">On Duty</SelectItem>
                            <SelectItem value="resting" className="text-xs uppercase tracking-wider text-warning">Resting</SelectItem>
                            <SelectItem value="leave" className="text-xs uppercase tracking-wider text-destructive">Leave</SelectItem>
                            <SelectItem value="unavailable" className="text-xs uppercase tracking-wider text-muted-foreground">Unavailable</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant="outline" className={`h-6 text-[10px] font-semibold uppercase tracking-wider border ${getStatusBadgeClass(driver.status)}`}>
                          {driver.status.replace("-", " ")}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {driver.status === "resting" ? (
                        <span className="flex items-center gap-1 text-warning font-medium">
                          <Clock className="size-3" />
                          Resting until {formatMinutesToTime(driver.restUntil)}
                        </span>
                      ) : driver.status === "available" ? (
                        <span className="text-success font-medium">Available</span>
                      ) : driver.status === "on-duty" ? (
                        <span className="text-primary font-medium">Active Duty</span>
                      ) : (
                        <span className="text-muted-foreground">Unavailable</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground"
                          onClick={() => handleOpenDetails(driver.id)}
                        >
                          <Eye className="size-4" />
                          <span className="sr-only">View details</span>
                        </Button>
                        {canManage && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground"
                            onClick={() => handleOpenEdit(driver)}
                          >
                            <Edit2 className="size-4" />
                            <span className="sr-only">Edit driver</span>
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

      {/* CREATE DRIVER DIALOG */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleCreateSubmit}>
            <DialogHeader>
              <DialogTitle>Register Driver</DialogTitle>
              <DialogDescription>
                Create a new passenger driver registry card tied to this depot context.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="empId" className="text-right">Employee ID</Label>
                <Input
                  id="empId"
                  value={formEmpId}
                  onChange={(e) => setFormEmpId(e.target.value)}
                  placeholder="EMP-DR-020"
                  className="col-span-3 font-semibold text-primary"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Driver Name</Label>
                <Input
                  id="name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Full Name"
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="licenseCat" className="text-right text-xs">License Cat.</Label>
                <Select value={formLicenseCategory} onValueChange={setFormLicenseCategory}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Heavy Passenger Vehicle (HPV)">Heavy Passenger Vehicle (HPV)</SelectItem>
                    <SelectItem value="Commercial Bus Licence">Commercial Bus Licence</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="licenseExp" className="text-right text-xs">License Expiry</Label>
                <Input
                  id="licenseExp"
                  type="date"
                  value={formLicenseExpiry}
                  onChange={(e) => setFormLicenseExpiry(e.target.value)}
                  className="col-span-3 font-mono"
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
                    <SelectItem value="Salem Central Depot">Salem Central Depot</SelectItem>
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
                    <SelectItem value="resting">Resting</SelectItem>
                    <SelectItem value="leave">Leave</SelectItem>
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
                {createMutation.isPending ? "Creating..." : "Save Driver"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT DRIVER DIALOG */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleEditSubmit}>
            <DialogHeader>
              <DialogTitle>Edit Driver Registry</DialogTitle>
              <DialogDescription>
                Modify details for Employee ID `{formEmpId}`.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editEmpId" className="text-right">Employee ID</Label>
                <Input
                  id="editEmpId"
                  value={formEmpId}
                  onChange={(e) => setFormEmpId(e.target.value)}
                  className="col-span-3 font-semibold text-primary"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editName" className="text-right">Driver Name</Label>
                <Input
                  id="editName"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editLicenseCat" className="text-right text-xs">License Cat.</Label>
                <Select value={formLicenseCategory} onValueChange={setFormLicenseCategory}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Heavy Passenger Vehicle (HPV)">Heavy Passenger Vehicle (HPV)</SelectItem>
                    <SelectItem value="Commercial Bus Licence">Commercial Bus Licence</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editLicenseExp" className="text-right text-xs">License Expiry</Label>
                <Input
                  id="editLicenseExp"
                  type="date"
                  value={formLicenseExpiry}
                  onChange={(e) => setFormLicenseExpiry(e.target.value)}
                  className="col-span-3 font-mono"
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
                    <SelectItem value="Salem Central Depot">Salem Central Depot</SelectItem>
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
                    <SelectItem value="on-duty">On Duty</SelectItem>
                    <SelectItem value="resting">Resting</SelectItem>
                    <SelectItem value="leave">Leave</SelectItem>
                    <SelectItem value="unavailable">Unavailable</SelectItem>
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
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editRestUntil" className="text-right text-xs">Rest Until</Label>
                <Input
                  id="editRestUntil"
                  type="time"
                  value={formRestUntil}
                  onChange={(e) => setFormRestUntil(e.target.value)}
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

      {/* DETAILS SHEET */}
      <Sheet open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <SheetContent className="sm:max-w-[450px]">
          <SheetHeader>
            <SheetTitle className="text-xl font-bold flex items-center gap-2">
              <User className="size-5 text-primary" />
              Driver Profile Card
            </SheetTitle>
          </SheetHeader>
          {selectedDriverDetails ? (
            <div className="mt-6 space-y-6">
              <div className="panel p-4 space-y-3 bg-secondary/20">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Driver Name</span>
                  <span className="font-bold text-foreground">{selectedDriverDetails.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Employee ID</span>
                  <span className="font-semibold text-primary">{selectedDriverDetails.employeeId}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Status</span>
                  <Badge variant="outline" className={`h-6 text-[10px] font-semibold uppercase tracking-wider border ${getStatusBadgeClass(selectedDriverDetails.status)}`}>
                    {selectedDriverDetails.status}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Depot</span>
                  <span className="text-sm font-medium">{selectedDriverDetails.depot}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Licensing Cat</span>
                  <span className="text-sm font-medium">{selectedDriverDetails.licenseCategory || "-"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Licensing Expiry</span>
                  <span className="text-sm font-mono font-medium">
                    {selectedDriverDetails.licenseExpiry
                      ? new Date(selectedDriverDetails.licenseExpiry).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "-"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Duty Starts</span>
                  <span className="text-sm font-mono">{formatMinutesToTime(selectedDriverDetails.availableFrom)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Rest Limits</span>
                  <span className="text-sm font-mono text-warning font-semibold">
                    Rest ends at {formatMinutesToTime(selectedDriverDetails.restUntil)}
                  </span>
                </div>
              </div>

              {/* Roster logs placeholders */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="size-4 text-info" />
                  Rostered Duty Wave (Today)
                </h3>
                <div className="border border-dashed border-border rounded-md p-4 text-center text-xs text-muted-foreground bg-background/50">
                  No active route wave assignment logs recorded for today.
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <FileText className="size-4 text-muted-foreground" />
                  Duty Handovers & Sign-Ons
                </h3>
                <div className="border border-dashed border-border rounded-md p-4 text-center text-xs text-muted-foreground bg-background/50">
                  No active check-in or duty handover timestamps reported.
                </div>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-muted-foreground text-sm">
              Loading driver profile details...
            </div>
          )}
        </SheetContent>
      </Sheet>
    </AppShell>
  );
}
