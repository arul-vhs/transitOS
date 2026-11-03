import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
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
  Clock,
  Filter,
  ShieldCheck,
  Award,
  Zap,
  Activity,
  CheckCircle2,
  CalendarClock,
  Briefcase,
  IdCard,
  Phone,
  LayoutGrid,
  List,
  Bus as BusIcon,
  Route as RouteIcon,
  UserCheck,
  Check,
  ChevronRight,
  Sparkles,
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Route as RootRoute } from "@/routes/__root";
import { hasPermission } from "@/lib/auth-shared";
import {
  getDrivers,
  getCrewMember,
  createCrewMember,
  updateCrewMember,
  updateCrewStatus,
  getBuses,
} from "@/lib/fleet-crew";
import { getRoutes } from "@/lib/routes-gis-fns";
import { getDuties, createDuty, updateDuty } from "@/lib/scheduling-fns";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/crew/drivers")({
  beforeLoad: ({ context }) => {
    if (!context.user || !hasPermission(context.user.role, "crew.view")) {
      throw new Error("Forbidden");
    }
  },
  head: () => ({
    meta: [
      { title: "Driver Roster & Profile: TransitOS" },
      {
        name: "description",
        content:
          "Driver registry, HPV licensing compliance, availability timeline and shift logs.",
      },
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

interface DriverAssignment {
  busReg: string;
  routeCode?: string;
  routeName?: string;
  dutyCode: string;
}

interface DriverItem {
  id: string;
  employeeId: string;
  badgeNumber?: string;
  name: string;
  role?: string;
  status: string;
  depot: string;
  availableFrom?: number;
  restUntil?: number;
  phoneNumber?: string;
  licenseCategory?: string;
  licenseExpiry?: string | Date;
}

interface BusItem {
  id: string;
  registrationNumber: string;
  fleetNumber?: string;
  busType?: string;
  makeModel?: string;
  capacity?: number;
  depot?: string;
  status?: string;
}

interface RouteItem {
  id: string;
  code: string;
  name: string;
  startLocation?: string;
  endLocation?: string;
}

interface DutyItem {
  id: string;
  dutyCode: string;
  busId?: string;
  busRegNumber?: string;
  driverId?: string;
  conductorId?: string;
  trips?: Array<{
    routeCode?: string;
    routeName?: string;
  }>;
}

function DriversPage() {
  const queryClient = useQueryClient();
  const context = RootRoute.useRouteContext();
  const user = context?.user;
  const canManage = hasPermission(user?.role || "", "crew.manage");

  // View Mode: Cards or Table
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  // Filters State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [depotFilter, setDepotFilter] = useState("all");

  // Dialog / Sheet states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);

  // Selected driver
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);

  // Quick Assignment state
  const [assignDriver, setAssignDriver] = useState<DriverItem | null>(null);
  const [assignBusId, setAssignBusId] = useState("");
  const [assignRouteId, setAssignRouteId] = useState("");
  const [assignStartTime, setAssignStartTime] = useState("06:30");

  // Form states
  const [formEmpId, setFormEmpId] = useState("");
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("+91 98421 ");
  const [formStatus, setFormStatus] = useState("available");
  const [formDepot, setFormDepot] = useState("Meyyanur Central Depot");
  const [formAvailableFrom, setFormAvailableFrom] = useState("05:30");
  const [formRestUntil, setFormRestUntil] = useState("05:30");
  const [formLicenseCategory, setFormLicenseCategory] = useState(
    "Heavy Passenger Vehicle (HPV)",
  );
  const [formLicenseExpiry, setFormLicenseExpiry] = useState("2028-12-31");

  // 1. Fetch Drivers
  const { data: driversList = [], isLoading } = useQuery<DriverItem[]>({
    queryKey: ["drivers", statusFilter, depotFilter, search],
    queryFn: async () => {
      const data = await getDrivers({
        status: statusFilter,
        depot: depotFilter,
        search,
      });
      return (data || []) as unknown as DriverItem[];
    },
  });

  // 2. Fetch Duties to resolve real-time bus and route assignments
  const { data: dutiesList = [] } = useQuery<DutyItem[]>({
    queryKey: ["duties-for-drivers"],
    queryFn: async () => {
      const data = await getDuties({ serviceDate: "25 Aug 2026" });
      return (data || []) as unknown as DutyItem[];
    },
  });

  // 3. Fetch Buses for Quick Assign
  const { data: busesList = [] } = useQuery<BusItem[]>({
    queryKey: ["buses-for-driver-assign"],
    queryFn: async () => {
      const data = await getBuses();
      return (data || []) as unknown as BusItem[];
    },
  });

  // 4. Fetch Routes for Quick Assign
  const { data: routesList = [] } = useQuery<RouteItem[]>({
    queryKey: ["routes-for-driver-assign"],
    queryFn: async () => {
      const data = await getRoutes({ status: "active" });
      return (data || []) as unknown as RouteItem[];
    },
  });

  // 5. Fetch Selected Driver details
  const { data: selectedDriverDetails } = useQuery<DriverItem | null>({
    queryKey: ["crew-member", selectedDriverId],
    queryFn: async () => {
      if (!selectedDriverId) return null;
      const data = await getCrewMember(selectedDriverId);
      return data as unknown as DriverItem;
    },
    enabled: !!selectedDriverId,
  });

  // Build Driver to Duty map
  const driverAssignmentMap = useMemo(() => {
    const map = new Map<string, DriverAssignment>();
    dutiesList.forEach((duty) => {
      if (duty.driverId) {
        const firstTrip = duty.trips?.[0];
        map.set(duty.driverId, {
          busReg: duty.busRegNumber || "Assigned Bus",
          routeCode: firstTrip?.routeCode || "1",
          routeName: firstTrip?.routeName || "Town Bus Stand - Salem Junction",
          dutyCode: duty.dutyCode,
        });
      }
    });
    return map;
  }, [dutiesList]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: createCrewMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      queryClient.invalidateQueries({ queryKey: ["crew-availability"] });
      toast.success("Driver profile created successfully.");
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create driver");
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateCrewMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      queryClient.invalidateQueries({ queryKey: ["crew-availability"] });
      if (selectedDriverId) {
        queryClient.invalidateQueries({
          queryKey: ["crew-member", selectedDriverId],
        });
      }
      toast.success("Driver updated successfully");
      setIsEditOpen(false);
      resetForm();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update driver");
    },
  });

  const statusMutation = useMutation({
    mutationFn: updateCrewStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      queryClient.invalidateQueries({ queryKey: ["crew-availability"] });
      toast.success("Driver duty status updated.");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update status");
    },
  });

  const resetForm = () => {
    setFormEmpId(`DRV-${Date.now().toString().slice(-3)}`);
    setFormName("");
    setFormPhone("+91 98421 ");
    setFormStatus("available");
    setFormDepot("Meyyanur Central Depot");
    setFormAvailableFrom("05:30");
    setFormRestUntil("05:30");
    setFormLicenseCategory("Heavy Passenger Vehicle (HPV)");
    setFormLicenseExpiry("2028-12-31");
  };

  const handleOpenEdit = (driver: DriverItem) => {
    setSelectedDriverId(driver.id);
    setFormEmpId(driver.employeeId || driver.badgeNumber || "");
    setFormName(driver.name);
    setFormStatus(driver.status);
    setFormDepot(driver.depot);
    setFormAvailableFrom(formatMinutesToTime(driver.availableFrom || 330));
    setFormRestUntil(formatMinutesToTime(driver.restUntil || 330));
    setFormLicenseCategory(
      driver.licenseCategory || "Heavy Passenger Vehicle (HPV)",
    );
    setFormLicenseExpiry(
      driver.licenseExpiry
        ? new Date(driver.licenseExpiry).toISOString().split("T")[0]!
        : "2028-12-31",
    );
    setIsEditOpen(true);
  };

  const handleOpenAssign = (driver: DriverItem) => {
    setAssignDriver(driver);
    if (busesList.length > 0 && !assignBusId) {
      setAssignBusId(busesList[0].id);
    }
    if (routesList.length > 0 && !assignRouteId) {
      setAssignRouteId(routesList[0].id);
    }
    setIsAssignOpen(true);
  };

  const handleQuickAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignDriver || !assignBusId || !assignRouteId) {
      toast.error("Please select a bus and route");
      return;
    }
    try {
      const selectedRoute = routesList.find((r) => r.id === assignRouteId);
      const dutyCode = `SFT-${selectedRoute?.code || "01"}-${assignStartTime.replace(":", "")}`;

      const newDuty = await createDuty({
        dutyCode,
        dutyType: "single-split",
        serviceDate: "25 Aug 2026",
      } as unknown as Parameters<typeof createDuty>[0]);

      if (newDuty && (newDuty as unknown as { id: string }).id) {
        await updateDuty({
          id: (newDuty as unknown as { id: string }).id,
          data: {
            dutyCode,
            dutyType: "single-split",
            serviceDate: "25 Aug 2026",
            status: "active",
            busId: assignBusId,
            driverId: assignDriver.id,
          } as unknown as Parameters<typeof updateDuty>[0]["data"],
        });
      }

      await statusMutation.mutateAsync({
        id: assignDriver.id,
        status: "on-duty",
      });

      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      queryClient.invalidateQueries({ queryKey: ["duties-for-drivers"] });
      toast.success(
        `Assigned ${assignDriver.name} to Bus on Route ${selectedRoute?.code || "1"}.`,
      );
      setIsAssignOpen(false);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to assign driver";
      toast.error(msg);
    }
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
  const availableCount = driversList.filter(
    (d) => d.status === "available",
  ).length;
  const onDutyCount = driversList.filter((d) => d.status === "on-duty").length;
  const restingCount = driversList.filter((d) => d.status === "resting").length;
  const leaveCount = driversList.filter((d) => d.status === "leave").length;

  return (
    <AppShell
      title="Driver Directory & Shifts"
      subtitle="Driver roster, contact details, live availability status, and vehicle assignments."
      actions={
        canManage ? (
          <Button
            size="sm"
            onClick={() => {
              resetForm();
              setIsCreateOpen(true);
            }}
            className="bg-primary text-primary-foreground font-semibold text-xs rounded-lg shadow-sm"
          >
            <Plus className="mr-1.5 size-3.5" />
            Add Driver
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-6">
        {/* 1. METRICS OVERVIEW */}
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-5">
          <div className="glass-card p-4 rounded-xl border flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Total Roster
            </span>
            <span className="text-2xl font-bold font-mono mt-1 text-foreground">
              {totalCount} Drivers
            </span>
          </div>
          <div className="glass-card p-4 rounded-xl border-l-4 border-l-emerald-500 flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Ready & Available
            </span>
            <span className="text-2xl font-bold font-mono mt-1 text-emerald-600 dark:text-emerald-400">
              {availableCount}
            </span>
          </div>
          <div className="glass-card p-4 rounded-xl border-l-4 border-l-primary flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              On Active Duty
            </span>
            <span className="text-2xl font-bold font-mono mt-1 text-primary">
              {onDutyCount}
            </span>
          </div>
          <div className="glass-card p-4 rounded-xl border-l-4 border-l-amber-500 flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Mandatory Rest
            </span>
            <span className="text-2xl font-bold font-mono mt-1 text-amber-600 dark:text-amber-400">
              {restingCount}
            </span>
          </div>
          <div className="glass-card p-4 rounded-xl border-l-4 border-l-destructive flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              On Leave
            </span>
            <span className="text-2xl font-bold font-mono mt-1 text-destructive">
              {leaveCount}
            </span>
          </div>
        </div>

        {/* 2. FILTER & VIEW SWITCHER BAR */}
        <div className="glass-panel p-4 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-1 flex-wrap gap-3 items-center min-w-[280px]">
            <div className="relative flex-1 max-w-sm min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Search driver by name or badge..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 bg-background/60 text-xs border-border/80 rounded-lg"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="size-3.5 text-muted-foreground shrink-0" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36 bg-background/60 text-xs border-border/80 rounded-lg">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="available">Ready / Available</SelectItem>
                  <SelectItem value="on-duty">On Active Duty</SelectItem>
                  <SelectItem value="resting">In Mandatory Rest</SelectItem>
                  <SelectItem value="leave">On Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Select value={depotFilter} onValueChange={setDepotFilter}>
                <SelectTrigger className="w-44 bg-background/60 text-xs border-border/80 rounded-lg">
                  <SelectValue placeholder="Depot" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Depots</SelectItem>
                  <SelectItem value="Meyyanur Central Depot">
                    Meyyanur Central Depot
                  </SelectItem>
                  <SelectItem value="Salem Junction Depot">
                    Salem Junction Depot
                  </SelectItem>
                  <SelectItem value="Suramangalam Depot">
                    Suramangalam Depot
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex items-center bg-secondary/50 p-1 rounded-lg border border-border/60">
            <Button
              variant={viewMode === "cards" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("cards")}
              className="h-7 text-xs px-2.5 rounded-md gap-1"
            >
              <LayoutGrid className="size-3.5" /> Staff Cards
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
              className="h-7 text-xs px-2.5 rounded-md gap-1"
            >
              <List className="size-3.5" /> Roster Table
            </Button>
          </div>
        </div>

        {/* 3A. VISUAL STAFF CARDS VIEW */}
        {viewMode === "cards" && (
          <div>
            {isLoading ? (
              <div className="py-20 text-center text-xs text-muted-foreground">
                Loading driver directory...
              </div>
            ) : driversList.length === 0 ? (
              <div className="py-16 text-center text-xs text-muted-foreground glass-panel p-8">
                No drivers match the current search filters.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {driversList.map((driver) => {
                  const assignment = driverAssignmentMap.get(driver.id);
                  const isAvailable = driver.status === "available";
                  const isOnDuty = driver.status === "on-duty";
                  const isResting = driver.status === "resting";
                  return (
                    <div
                      key={driver.id}
                      className="glass-card p-4 rounded-xl border border-border/70 hover:border-primary/40 transition-all flex flex-col justify-between space-y-3.5"
                    >
                      {/* Driver Card Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-10 border-2 border-primary/20">
                            <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                              {driver.name
                                .split(" ")
                                .map((n: string) => n[0])
                                .join("")
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="text-sm font-bold text-foreground">
                              {driver.name}
                            </h4>
                            <div className="text-[10px] font-mono text-muted-foreground flex items-center gap-1.5 mt-0.5">
                              <Badge
                                variant="outline"
                                className="text-[9px] px-1 py-0 rounded"
                              >
                                {driver.employeeId ||
                                  driver.badgeNumber ||
                                  "DRV"}
                              </Badge>
                              <span>{driver.depot || "Meyyanur Depot"}</span>
                            </div>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div>
                          {isAvailable ? (
                            <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] rounded-md">
                              ● Ready
                            </Badge>
                          ) : isOnDuty ? (
                            <Badge className="bg-primary/15 text-primary border-primary/30 text-[10px] rounded-md">
                              ● On Duty
                            </Badge>
                          ) : isResting ? (
                            <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[10px] rounded-md">
                              ● Resting
                            </Badge>
                          ) : (
                            <Badge
                              variant="secondary"
                              className="text-[10px] rounded-md"
                            >
                              Leave
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Contact & License Info */}
                      <div className="space-y-1.5 text-xs border-y border-border/50 py-2.5">
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <Phone className="size-3 text-primary" /> Phone:
                          </span>
                          <span className="font-mono text-foreground font-medium">
                            {driver.phoneNumber || "+91 98421 11001"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <Award className="size-3 text-primary" /> License:
                          </span>
                          <span className="font-mono text-foreground">
                            {driver.licenseCategory || "HPV Heavy Passenger"}
                          </span>
                        </div>
                      </div>

                      {/* Current Assignment Status */}
                      <div className="p-2.5 rounded-lg bg-secondary/30 border border-border/50 text-xs">
                        {assignment ? (
                          <div className="space-y-1">
                            <div className="text-[10px] font-bold uppercase text-primary tracking-wider">
                              Assigned Active Run:
                            </div>
                            <div className="font-semibold text-foreground flex items-center gap-1">
                              <BusIcon className="size-3 text-primary" />
                              <span>{assignment.busReg}</span>
                              <span className="text-muted-foreground">·</span>
                              <span>Route {assignment.routeCode}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between text-muted-foreground">
                            <span>No shift assigned yet</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                              Available Now
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Card Actions */}
                      <div className="flex items-center gap-2 pt-1">
                        {canManage && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenAssign(driver)}
                            className="flex-1 text-xs h-8 rounded-lg font-semibold hover:bg-primary hover:text-primary-foreground transition-all"
                          >
                            <CalendarClock className="size-3 mr-1" /> Assign
                            Shift
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenEdit(driver)}
                          className="h-8 text-xs text-muted-foreground hover:text-foreground rounded-lg"
                        >
                          <Edit2 className="size-3 mr-1" /> Edit
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 3B. TABLE VIEW */}
        {viewMode === "table" && (
          <div className="glass-panel overflow-hidden">
            {isLoading ? (
              <div className="py-16 text-center text-xs text-muted-foreground">
                Loading driver registry...
              </div>
            ) : driversList.length === 0 ? (
              <div className="py-16 text-center text-xs text-muted-foreground">
                No drivers found matching current search.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border/60 text-[11px]">
                    <TableHead className="w-24">Badge ID</TableHead>
                    <TableHead>Driver Name</TableHead>
                    <TableHead>Contact Phone</TableHead>
                    <TableHead>Home Depot</TableHead>
                    <TableHead>Assigned Vehicle & Route</TableHead>
                    <TableHead className="w-32">Duty Status</TableHead>
                    {canManage && (
                      <TableHead className="w-28 text-right">Actions</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody className="text-xs">
                  {driversList.map((driver) => {
                    const assignment = driverAssignmentMap.get(driver.id);
                    return (
                      <TableRow
                        key={driver.id}
                        className="border-border/40 hover:bg-muted/40 transition-colors"
                      >
                        <TableCell className="font-mono font-bold text-primary">
                          {driver.employeeId || driver.badgeNumber || "DRV"}
                        </TableCell>
                        <TableCell className="font-bold text-foreground">
                          {driver.name}
                        </TableCell>
                        <TableCell className="font-mono text-muted-foreground">
                          {driver.phoneNumber || "+91 98421 11001"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {driver.depot}
                        </TableCell>
                        <TableCell>
                          {assignment ? (
                            <span className="font-semibold text-foreground">
                              {assignment.busReg} (Route {assignment.routeCode})
                            </span>
                          ) : (
                            <span className="text-muted-foreground italic">
                              Ready for assignment
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={driver.status}
                            onValueChange={(val) =>
                              statusMutation.mutate({
                                id: driver.id,
                                status: val,
                              })
                            }
                          >
                            <SelectTrigger
                              className={cn(
                                "h-7 w-28 text-[10px] font-semibold uppercase tracking-wider rounded-md border",
                                getStatusBadgeClass(driver.status),
                              )}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="available">
                                Available
                              </SelectItem>
                              <SelectItem value="on-duty">On Duty</SelectItem>
                              <SelectItem value="resting">Resting</SelectItem>
                              <SelectItem value="leave">Leave</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        {canManage && (
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleOpenAssign(driver)}
                                className="h-7 text-[11px] rounded"
                              >
                                Assign
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleOpenEdit(driver)}
                                className="h-7 text-[11px] rounded"
                              >
                                Edit
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        )}

        {/* QUICK ASSIGN DRIVER TO BUS & ROUTE MODAL */}
        <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
          <DialogContent className="sm:max-w-md bg-card border-border rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <CalendarClock className="size-4 text-primary" /> Assign Driver
                to Bus & Route
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Quickly dispatch {assignDriver?.name} to an active vehicle and
                corridor.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleQuickAssignSubmit} className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Driver</Label>
                <Input
                  value={assignDriver?.name || ""}
                  disabled
                  className="text-xs bg-muted/40 font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Select Bus</Label>
                <Select value={assignBusId} onValueChange={setAssignBusId}>
                  <SelectTrigger className="text-xs bg-background/60 rounded-lg font-mono">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {busesList.map((bus) => (
                      <SelectItem key={bus.id} value={bus.id}>
                        {bus.registrationNumber} · {bus.model || "65-Seater"} (
                        {bus.depot || "Meyyanur"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Select Route Corridor
                </Label>
                <Select value={assignRouteId} onValueChange={setAssignRouteId}>
                  <SelectTrigger className="text-xs bg-background/60 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {routesList.map((route) => (
                      <SelectItem key={route.id} value={route.id}>
                        Route {route.code}: {route.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Shift Start Time
                </Label>
                <Input
                  type="time"
                  value={assignStartTime}
                  onChange={(e) => setAssignStartTime(e.target.value)}
                  className="text-xs bg-background/60 font-mono rounded-lg"
                  required
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAssignOpen(false)}
                  className="text-xs rounded-lg"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-primary text-primary-foreground font-semibold text-xs rounded-lg"
                >
                  Confirm Assignment
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* CREATE DRIVER MODAL */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="sm:max-w-md bg-card border-border rounded-xl">
            <form onSubmit={handleCreateSubmit}>
              <DialogHeader>
                <DialogTitle className="text-base font-bold flex items-center gap-2">
                  <Plus className="size-4 text-primary" /> Register New Driver
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Add a new driver to the transit authority staff roster.
                </DialogDescription>
              </DialogHeader>

              <div className="py-4 space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">
                      Employee Badge ID
                    </Label>
                    <Input
                      type="text"
                      value={formEmpId}
                      onChange={(e) => setFormEmpId(e.target.value)}
                      className="font-mono text-xs rounded-lg"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Full Name</Label>
                    <Input
                      type="text"
                      placeholder="e.g. S. Murugan"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="text-xs rounded-lg"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">
                      Contact Phone
                    </Label>
                    <Input
                      type="tel"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      className="font-mono text-xs rounded-lg"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">
                      Assigned Depot
                    </Label>
                    <Select value={formDepot} onValueChange={setFormDepot}>
                      <SelectTrigger className="text-xs rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Meyyanur Central Depot">
                          Meyyanur Central Depot
                        </SelectItem>
                        <SelectItem value="Salem Junction Depot">
                          Salem Junction Depot
                        </SelectItem>
                        <SelectItem value="Suramangalam Depot">
                          Suramangalam Depot
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">
                      License Category
                    </Label>
                    <Input
                      value={formLicenseCategory}
                      onChange={(e) => setFormLicenseCategory(e.target.value)}
                      className="text-xs rounded-lg"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">
                      License Expiry Date
                    </Label>
                    <Input
                      type="date"
                      value={formLicenseExpiry}
                      onChange={(e) => setFormLicenseExpiry(e.target.value)}
                      className="font-mono text-xs rounded-lg"
                      required
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateOpen(false)}
                  className="text-xs rounded-lg"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={createMutation.isPending}
                  className="bg-primary text-primary-foreground text-xs font-semibold rounded-lg"
                >
                  {createMutation.isPending ? "Creating..." : "Save Driver"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* EDIT DRIVER MODAL */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-md bg-card border-border rounded-xl">
            <form onSubmit={handleEditSubmit}>
              <DialogHeader>
                <DialogTitle className="text-base font-bold flex items-center gap-2">
                  <Edit2 className="size-4 text-primary" /> Edit Driver
                  Information
                </DialogTitle>
              </DialogHeader>

              <div className="py-4 space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Badge ID</Label>
                    <Input
                      value={formEmpId}
                      onChange={(e) => setFormEmpId(e.target.value)}
                      className="font-mono text-xs rounded-lg"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Full Name</Label>
                    <Input
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="text-xs rounded-lg"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Status</Label>
                    <Select value={formStatus} onValueChange={setFormStatus}>
                      <SelectTrigger className="text-xs rounded-lg font-mono">
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
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">
                      License Expiry
                    </Label>
                    <Input
                      type="date"
                      value={formLicenseExpiry}
                      onChange={(e) => setFormLicenseExpiry(e.target.value)}
                      className="font-mono text-xs rounded-lg"
                      required
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditOpen(false)}
                  className="text-xs rounded-lg"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={updateMutation.isPending}
                  className="bg-primary text-primary-foreground text-xs font-semibold rounded-lg"
                >
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
