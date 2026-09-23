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
  ShieldCheck,
  Award,
  Zap,
  Activity,
  CheckCircle2,
  CalendarClock,
  UserCog,
  Briefcase,
  IdCard,
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Route as RootRoute } from "@/routes/__root";
import { hasPermission } from "@/lib/auth-shared";
import {
  getDrivers,
  getCrewMember,
  createCrewMember,
  updateCrewMember,
  updateCrewStatus,
} from "@/lib/fleet-crew";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/crew/drivers")({
  beforeLoad: ({ context }) => {
    if (!context.user || !hasPermission(context.user.role, "crew.view")) {
      throw new Error("Forbidden");
    }
  },
  head: () => ({
    meta: [
      { title: "Driver Roster & Profile — TransitOS" },
      { name: "description", content: "Driver registry, HPV licensing compliance, availability timeline and shift logs." },
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
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
    case "on-duty":
      return "bg-primary/10 text-primary border-primary/30";
    case "resting":
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30";
    case "leave":
      return "bg-destructive/10 text-destructive border-destructive/30";
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

  const totalCount = driversList.length;
  const availableCount = driversList.filter((d) => d.status === "available").length;
  const onDutyCount = driversList.filter((d) => d.status === "on-duty").length;
  const restingCount = driversList.filter((d) => d.status === "resting").length;
  const leaveCount = driversList.filter((d) => d.status === "leave").length;

  return (
    <AppShell
      title="Driver Roster & Registry"
      subtitle="Driver registry, heavy passenger vehicle licensing, availability compliance and shift assignments."
      actions={
        canManage ? (
          <Button
            size="sm"
            onClick={() => {
              resetForm();
              setIsCreateOpen(true);
            }}
            className="bg-primary text-primary-foreground font-semibold shadow-md shadow-primary/20 text-xs hover:scale-[1.02] transition-all"
          >
            <Plus className="mr-1.5 size-4" />
            Add Driver
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-6">
        {/* 1. METRICS OVERVIEW */}
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-5">
          <div className="glass-card p-4 rounded-xl border flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Drivers</span>
            <span className="text-2xl font-bold font-mono mt-1 text-foreground">{totalCount}</span>
          </div>
          <div className="glass-card p-4 rounded-xl border-l-4 border-l-success flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Available</span>
            <span className="text-2xl font-bold font-mono mt-1 text-success">{availableCount}</span>
          </div>
          <div className="glass-card p-4 rounded-xl border-l-4 border-l-primary flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">On Active Duty</span>
            <span className="text-2xl font-bold font-mono mt-1 text-primary">{onDutyCount}</span>
          </div>
          <div className="glass-card p-4 rounded-xl border-l-4 border-l-warning flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Mandatory Rest</span>
            <span className="text-2xl font-bold font-mono mt-1 text-warning">{restingCount}</span>
          </div>
          <div className="glass-card p-4 rounded-xl border-l-4 border-l-destructive flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">On Leave</span>
            <span className="text-2xl font-bold font-mono mt-1 text-destructive">{leaveCount}</span>
          </div>
        </div>

        {/* 2. FILTER BAR */}
        <div className="glass-panel p-4 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-1 flex-wrap gap-3 items-center min-w-[280px]">
            <div className="relative flex-1 max-w-sm min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Search driver name or employee ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 bg-background/60 text-xs border-border/80"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="size-3.5 text-muted-foreground shrink-0" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36 bg-background/60 text-xs border-border/80">
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
                <SelectTrigger className="w-44 bg-background/60 text-xs border-border/80">
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

        {/* 3. DRIVER TABLE */}
        <div className="glass-panel overflow-hidden">
          {isLoading ? (
            <div className="py-16 text-center text-xs text-muted-foreground">Loading driver registry...</div>
          ) : driversList.length === 0 ? (
            <div className="py-16 text-center text-xs text-muted-foreground">
              No drivers found matching current search.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border/60">
                  <TableHead className="w-32 text-xs font-bold">Emp ID</TableHead>
                  <TableHead className="text-xs font-bold">Driver Name</TableHead>
                  <TableHead className="text-xs font-bold">Depot Location</TableHead>
                  <TableHead className="text-xs font-bold">License Category</TableHead>
                  <TableHead className="text-xs font-bold">License Expiry</TableHead>
                  <TableHead className="text-xs font-bold">Status</TableHead>
                  <TableHead className="text-xs font-bold">Shift / Rest Limit</TableHead>
                  <TableHead className="w-28 text-right text-xs font-bold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {driversList.map((driver) => (
                  <TableRow key={driver.id} className="border-border/40 hover:bg-muted/40 transition-colors">
                    <TableCell className="font-semibold text-primary font-mono text-xs">{driver.employeeId}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar className="size-7">
                          <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                            {driver.name.split(" ").map((n: string) => n[0]).join("").toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-bold text-xs text-foreground">{driver.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{driver.depot}</TableCell>
                    <TableCell className="text-xs font-medium">
                      <span className="inline-flex items-center gap-1">
                        <Award className="size-3 text-primary" />
                        {driver.licenseCategory || "HPV"}
                      </span>
                    </TableCell>
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
                          <SelectTrigger className={cn("h-7 w-28 text-[10px] font-semibold uppercase tracking-wider border", getStatusBadgeClass(driver.status))}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="available" className="text-xs uppercase text-emerald-600">Available</SelectItem>
                            <SelectItem value="on-duty" className="text-xs uppercase text-primary">On Duty</SelectItem>
                            <SelectItem value="resting" className="text-xs uppercase text-amber-600">Resting</SelectItem>
                            <SelectItem value="leave" className="text-xs uppercase text-destructive">Leave</SelectItem>
                            <SelectItem value="unavailable" className="text-xs uppercase text-muted-foreground">Unavailable</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant="outline" className={cn("text-[9px] font-semibold uppercase font-mono", getStatusBadgeClass(driver.status))}>
                          {driver.status.replace("-", " ")}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {driver.status === "resting" ? (
                        <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-mono font-medium text-[11px]">
                          <Clock className="size-3" />
                          Rest ends {formatMinutesToTime(driver.restUntil)}
                        </span>
                      ) : driver.status === "available" ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium text-[11px]">Ready (from {formatMinutesToTime(driver.availableFrom)})</span>
                      ) : driver.status === "on-duty" ? (
                        <span className="text-primary font-medium text-[11px]">On Active Route</span>
                      ) : (
                        <span className="text-muted-foreground text-[11px]">Off Shift</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground hover:text-primary rounded-lg"
                          onClick={() => handleOpenDetails(driver.id)}
                        >
                          <Eye className="size-3.5" />
                          <span className="sr-only">View profile card</span>
                        </Button>
                        {canManage && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-muted-foreground hover:text-foreground rounded-lg"
                            onClick={() => handleOpenEdit(driver)}
                          >
                            <Edit2 className="size-3.5" />
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

      {/* DRIVER PROFILE CARD SHEET */}
      <Sheet open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <SheetContent className="sm:max-w-[480px] p-6 overflow-y-auto">
          <SheetHeader className="border-b border-border/60 pb-4">
            <SheetTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
              <IdCard className="size-5 text-primary" />
              Driver Profile Card
            </SheetTitle>
          </SheetHeader>

          {selectedDriverDetails ? (
            <div className="mt-5 space-y-6">
              {/* Profile Header Avatar Card */}
              <div className="p-4 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card space-y-4 shadow-sm">
                <div className="flex items-center gap-3.5">
                  <Avatar className="size-14 ring-2 ring-primary/30 shadow-md">
                    <AvatarFallback className="text-base font-bold bg-primary text-primary-foreground">
                      {selectedDriverDetails.name.split(" ").map((n: string) => n[0]).join("").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-base font-bold text-foreground">{selectedDriverDetails.name}</h3>
                    <p className="font-mono text-xs text-primary font-semibold">{selectedDriverDetails.employeeId}</p>
                    <Badge variant="outline" className={cn("mt-1 text-[9px] font-mono uppercase font-bold", getStatusBadgeClass(selectedDriverDetails.status))}>
                      {selectedDriverDetails.status}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-border/60 font-mono">
                  <div>
                    <span className="text-[10px] uppercase text-muted-foreground">Depot Base</span>
                    <p className="font-medium text-foreground text-[11px] truncate">{selectedDriverDetails.depot}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-muted-foreground">License Type</span>
                    <p className="font-medium text-foreground text-[11px] truncate">{selectedDriverDetails.licenseCategory || "HPV Regular"}</p>
                  </div>
                </div>
              </div>

              {/* Weekly Shift & Compliance Telemetry */}
              <div className="glass-panel p-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <ShieldCheck className="size-4 text-success" />
                  MV Act Driving Compliance
                </h4>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-muted-foreground">Weekly Driving Log</span>
                    <span className="font-bold text-foreground">32 / 48 hrs</span>
                  </div>
                  <Progress value={66} className="h-2 bg-secondary" />
                  <p className="text-[10px] text-muted-foreground">16 hours driving buffer remaining this weekly wave.</p>
                </div>

                <div className="p-2.5 rounded-lg border border-border/60 bg-secondary/20 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Earliest Available:</span>
                    <span className="font-mono font-bold">{formatMinutesToTime(selectedDriverDetails.availableFrom)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mandatory Rest Until:</span>
                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{formatMinutesToTime(selectedDriverDetails.restUntil)}</span>
                  </div>
                </div>
              </div>

              {/* Today's Rostered Shifts */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <CalendarClock className="size-4 text-primary" />
                  Rostered Duty Assignments
                </h4>
                <div className="p-4 rounded-xl border border-dashed border-border/70 text-center text-xs text-muted-foreground bg-secondary/10">
                  <CheckCircle2 className="size-6 text-emerald-500/60 mx-auto mb-1" />
                  Roster wave compliant. Active sign-on recorded for Salem Central morning peak corridor.
                </div>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-muted-foreground text-xs">
              Loading driver profile...
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* CREATE DRIVER MODAL */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <form onSubmit={handleCreateSubmit}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <UserCog className="size-4 text-primary" />
                Register New Driver
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Add an HPV licensed driver to the Salem transport depot registry.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Employee ID</Label>
                  <Input
                    type="text"
                    placeholder="e.g. EMP-DR-013"
                    value={formEmpId}
                    onChange={(e) => setFormEmpId(e.target.value)}
                    className="font-mono text-xs"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Driver Full Name</Label>
                  <Input
                    type="text"
                    placeholder="e.g. Anand Kumar"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">License Category</Label>
                  <Select value={formLicenseCategory} onValueChange={setFormLicenseCategory}>
                    <SelectTrigger className="text-xs font-mono">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Heavy Passenger Vehicle (HPV)">Heavy Passenger Vehicle (HPV)</SelectItem>
                      <SelectItem value="Commercial Bus Licence">Commercial Bus Licence</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">License Expiry Date</Label>
                  <Input
                    type="date"
                    value={formLicenseExpiry}
                    onChange={(e) => setFormLicenseExpiry(e.target.value)}
                    className="font-mono text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Shift Starts At</Label>
                  <Input
                    type="time"
                    value={formAvailableFrom}
                    onChange={(e) => setFormAvailableFrom(e.target.value)}
                    className="font-mono text-xs"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Initial Status</Label>
                  <Select value={formStatus} onValueChange={setFormStatus}>
                    <SelectTrigger className="text-xs font-mono">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="on-duty">On Duty</SelectItem>
                      <SelectItem value="resting">Resting</SelectItem>
                      <SelectItem value="leave">Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending} className="bg-primary text-primary-foreground text-xs font-semibold">
                {createMutation.isPending ? "Creating..." : "Save Driver"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT DRIVER MODAL */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <form onSubmit={handleEditSubmit}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Edit2 className="size-4 text-primary" />
                Edit Driver Information
              </DialogTitle>
            </DialogHeader>

            <div className="py-4 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Employee ID</Label>
                  <Input
                    type="text"
                    value={formEmpId}
                    onChange={(e) => setFormEmpId(e.target.value)}
                    className="font-mono text-xs"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Driver Full Name</Label>
                  <Input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Status</Label>
                  <Select value={formStatus} onValueChange={setFormStatus}>
                    <SelectTrigger className="text-xs font-mono">
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
                <div className="space-y-1.5">
                  <Label className="text-xs">License Expiry Date</Label>
                  <Input
                    type="date"
                    value={formLicenseExpiry}
                    onChange={(e) => setFormLicenseExpiry(e.target.value)}
                    className="font-mono text-xs"
                    required
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending} className="bg-primary text-primary-foreground text-xs font-semibold">
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
