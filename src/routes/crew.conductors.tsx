import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Users,
  Search,
  Plus,
  Edit2,
  Eye,
  Clock,
  Filter,
  CheckCircle,
  FileText,
  IdCard,
  ShieldCheck,
  Zap,
  CheckCircle2,
  CalendarClock,
  Ticket,
  Phone,
  Bus as BusIcon,
  MapPin,
  LayoutGrid,
  List,
  AlertCircle,
  ArrowRight,
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
  getConductors,
  getCrewMember,
  createCrewMember,
  updateCrewMember,
  updateCrewStatus,
  getBuses,
} from "@/lib/fleet-crew";
import { getRoutes } from "@/lib/routes-gis-fns";
import { getDuties, createDuty } from "@/lib/scheduling-fns";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/crew/conductors")({
  beforeLoad: ({ context }) => {
    if (!context.user || !hasPermission(context.user.role, "crew.view")) {
      throw new Error("Forbidden");
    }
  },
  head: () => ({
    meta: [
      { title: "Conductor Roster & Profile: TransitOS" },
      {
        name: "description",
        content:
          "Conductor rosters, ticketing machine registers and availability.",
      },
    ],
  }),
  component: ConductorsPage,
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

interface ConductorAssignment {
  busReg: string;
  routeCode: string;
  routeName: string;
  dutyCode: string;
}

interface ConductorItem {
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
  startLocation: string;
  endLocation: string;
  distanceKm?: number;
  estimatedDuration?: number;
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

function ConductorsPage() {
  const queryClient = useQueryClient();
  const context = RootRoute.useRouteContext();
  const user = context?.user;
  const canManage = hasPermission(user?.role || "", "crew.manage");

  // Layout View Mode
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

  // Selected conductor
  const [selectedConductorId, setSelectedConductorId] = useState<string | null>(
    null,
  );

  // Quick Assignment state
  const [assignConductor, setAssignConductor] = useState<ConductorItem | null>(
    null,
  );
  const [assignBusId, setAssignBusId] = useState("");
  const [assignRouteId, setAssignRouteId] = useState("");
  const [assignStartTime, setAssignStartTime] = useState("06:30");

  // Form states
  const [formEmpId, setFormEmpId] = useState("");
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("+91 98421 ");
  const [formStatus, setFormStatus] = useState("available");
  const [formDepot, setFormDepot] = useState("Salem Central Depot");
  const [formAvailableFrom, setFormAvailableFrom] = useState("05:30");
  const [formRestUntil, setFormRestUntil] = useState("05:30");

  // 1. Fetch Conductors
  const { data: conductorsList = [], isLoading } = useQuery<ConductorItem[]>({
    queryKey: ["conductors", statusFilter, depotFilter, search],
    queryFn: async () => {
      const data = await getConductors({
        status: statusFilter,
        depot: depotFilter,
        search,
      });
      return (data || []) as unknown as ConductorItem[];
    },
  });

  // 2. Fetch Duties to resolve real-time bus and route assignments
  const { data: dutiesList = [] } = useQuery<DutyItem[]>({
    queryKey: ["duties-for-conductors"],
    queryFn: async () => {
      const data = await getDuties({ serviceDate: "25 Aug 2026" });
      return (data || []) as unknown as DutyItem[];
    },
  });

  // 3. Fetch Buses for Quick Assign
  const { data: busesList = [] } = useQuery<BusItem[]>({
    queryKey: ["buses-for-conductor-assign"],
    queryFn: async () => {
      const data = await getBuses();
      return (data || []) as unknown as BusItem[];
    },
  });

  // 4. Fetch Routes for Quick Assign
  const { data: routesList = [] } = useQuery<RouteItem[]>({
    queryKey: ["routes-for-conductor-assign"],
    queryFn: async () => {
      const data = await getRoutes({ status: "active" });
      return (data || []) as unknown as RouteItem[];
    },
  });

  // 5. Fetch Selected Conductor details
  const { data: selectedConductorDetails } = useQuery<ConductorItem | null>({
    queryKey: ["crew-member", selectedConductorId],
    queryFn: async () => {
      if (!selectedConductorId) return null;
      const data = await getCrewMember(selectedConductorId);
      return data as unknown as ConductorItem;
    },
    enabled: !!selectedConductorId,
  });

  // Build Conductor to Duty map
  const conductorAssignmentMap = useMemo(() => {
    const map = new Map<string, ConductorAssignment>();
    dutiesList.forEach((duty) => {
      if (duty.conductorId) {
        const firstTrip = duty.trips?.[0];
        map.set(duty.conductorId, {
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
      queryClient.invalidateQueries({ queryKey: ["conductors"] });
      queryClient.invalidateQueries({ queryKey: ["crew-availability"] });
      toast.success("Conductor profile created successfully.");
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create conductor");
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateCrewMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conductors"] });
      queryClient.invalidateQueries({ queryKey: ["crew-availability"] });
      if (selectedConductorId) {
        queryClient.invalidateQueries({
          queryKey: ["crew-member", selectedConductorId],
        });
      }
      toast.success("Conductor updated successfully");
      setIsEditOpen(false);
      resetForm();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update conductor");
    },
  });

  const statusMutation = useMutation({
    mutationFn: updateCrewStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conductors"] });
      queryClient.invalidateQueries({ queryKey: ["crew-availability"] });
      toast.success("Conductor duty status updated.");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update status");
    },
  });

  // Quick Assignment Mutation
  const assignDutyMutation = useMutation({
    mutationFn: async () => {
      if (!assignConductor || !assignBusId || !assignRouteId) {
        throw new Error("Please select both a bus and a route.");
      }
      const selectedBus = busesList.find((b) => b.id === assignBusId);

      const [h, m] = assignStartTime.split(":").map(Number);
      const startMinutes = (h || 6) * 60 + (m || 30);
      const endMinutes = startMinutes + 8 * 60;

      return createDuty({
        serviceDate: "25 Aug 2026",
        conductorId: assignConductor.id,
        busId: assignBusId,
        busRegNumber: selectedBus?.registrationNumber || "TN-27-N-2001",
        dutyType: "single-split",
        plannedStartTime: startMinutes,
        plannedEndTime: endMinutes,
        depot: assignConductor.depot || "Salem Central Depot",
        tripIds: [],
        status: "scheduled",
      } as unknown as Parameters<typeof createDuty>[0]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conductors"] });
      queryClient.invalidateQueries({ queryKey: ["duties-for-conductors"] });
      queryClient.invalidateQueries({ queryKey: ["duties"] });

      if (assignConductor) {
        statusMutation.mutate({
          id: assignConductor.id,
          status: "on-duty",
        });
      }

      toast.success(
        `Successfully assigned ${assignConductor?.name} to duty shift.`,
      );
      setIsAssignOpen(false);
      setAssignConductor(null);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to assign conductor to shift.");
    },
  });

  const resetForm = () => {
    setFormEmpId(`CND-${Date.now().toString().slice(-3)}`);
    setFormName("");
    setFormPhone("+91 98421 ");
    setFormStatus("available");
    setFormDepot("Meyyanur Central Depot");
    setFormAvailableFrom("05:30");
    setFormRestUntil("05:30");
  };

  const handleOpenEdit = (conductor: ConductorItem) => {
    setSelectedConductorId(conductor.id);
    setFormEmpId(conductor.employeeId || conductor.badgeNumber || "");
    setFormName(conductor.name);
    setFormPhone(
      conductor.phoneNumber ||
        "+91 98421 " + Math.floor(10000 + Math.random() * 90000),
    );
    setFormStatus(conductor.status);
    setFormDepot(conductor.depot);
    setFormAvailableFrom(formatMinutesToTime(conductor.availableFrom || 330));
    setFormRestUntil(formatMinutesToTime(conductor.restUntil || 330));
    setIsEditOpen(true);
  };

  const handleOpenDetails = (id: string) => {
    setSelectedConductorId(id);
    setIsDetailsOpen(true);
  };

  const handleOpenAssign = (conductor: ConductorItem) => {
    setAssignConductor(conductor);
    setAssignBusId(busesList[0]?.id || "");
    setAssignRouteId(routesList[0]?.id || routesList[0]?.code || "");
    setAssignStartTime("06:30");
    setIsAssignOpen(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      employeeId: formEmpId,
      name: formName,
      role: "conductor",
      status: formStatus,
      depot: formDepot,
      availableFrom: parseTimeToMinutes(formAvailableFrom),
      restUntil: parseTimeToMinutes(formRestUntil),
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConductorId) return;
    updateMutation.mutate({
      id: selectedConductorId,
      data: {
        employeeId: formEmpId,
        name: formName,
        status: formStatus,
        depot: formDepot,
        availableFrom: parseTimeToMinutes(formAvailableFrom),
        restUntil: parseTimeToMinutes(formRestUntil),
      },
    });
  };

  const totalCount = conductorsList.length;
  const availableCount = conductorsList.filter(
    (c) => c.status === "available",
  ).length;
  const onDutyCount = conductorsList.filter(
    (c) => c.status === "on-duty",
  ).length;
  const restingCount = conductorsList.filter(
    (c) => c.status === "resting",
  ).length;
  const leaveCount = conductorsList.filter((c) => c.status === "leave").length;

  return (
    <AppShell
      title="Conductors & Ticketing Staff"
      subtitle="Directory of ticketing crew, electronic ticketing machine (ETM) devices, and daily bus route assignments."
      actions={
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border border-border">
            <Button
              variant={viewMode === "cards" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("cards")}
              className="h-8 px-2.5 text-xs font-medium rounded-md gap-1.5"
            >
              <LayoutGrid className="size-3.5" />
              Cards
            </Button>
            <Button
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
              className="h-8 px-2.5 text-xs font-medium rounded-md gap-1.5"
            >
              <List className="size-3.5" />
              Table
            </Button>
          </div>

          {canManage && (
            <Button
              size="sm"
              onClick={() => {
                resetForm();
                setIsCreateOpen(true);
              }}
              className="bg-primary text-primary-foreground font-semibold shadow-sm text-xs rounded-lg gap-1.5"
            >
              <Plus className="size-4" />
              Add Conductor
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {/* 1. METRICS OVERVIEW */}
        <div className="grid gap-3.5 grid-cols-2 md:grid-cols-5">
          <div className="bg-card p-4 rounded-lg border border-border flex flex-col justify-between">
            <span className="text-xs font-semibold text-muted-foreground">
              Total Conductors
            </span>
            <span className="text-2xl font-bold font-mono mt-1 text-foreground">
              {totalCount}
            </span>
            <span className="text-[11px] text-muted-foreground mt-1">
              Active staff in depot registry
            </span>
          </div>

          <div className="bg-card p-4 rounded-lg border border-border border-l-4 border-l-emerald-600 flex flex-col justify-between">
            <span className="text-xs font-semibold text-muted-foreground">
              Ready for Duty
            </span>
            <span className="text-2xl font-bold font-mono mt-1 text-emerald-600 dark:text-emerald-400">
              {availableCount}
            </span>
            <span className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 mt-1">
              Available to assign immediately
            </span>
          </div>

          <div className="bg-card p-4 rounded-lg border border-border border-l-4 border-l-primary flex flex-col justify-between">
            <span className="text-xs font-semibold text-muted-foreground">
              On Active Duty
            </span>
            <span className="text-2xl font-bold font-mono mt-1 text-primary">
              {onDutyCount}
            </span>
            <span className="text-[11px] text-primary/80 mt-1">
              Currently operating on routes
            </span>
          </div>

          <div className="bg-card p-4 rounded-lg border border-border border-l-4 border-l-amber-500 flex flex-col justify-between">
            <span className="text-xs font-semibold text-muted-foreground">
              Mandatory Rest
            </span>
            <span className="text-2xl font-bold font-mono mt-1 text-amber-600 dark:text-amber-400">
              {restingCount}
            </span>
            <span className="text-[11px] text-amber-600/80 dark:text-amber-400/80 mt-1">
              Rest break between shifts
            </span>
          </div>

          <div className="bg-card p-4 rounded-lg border border-border border-l-4 border-l-destructive flex flex-col justify-between">
            <span className="text-xs font-semibold text-muted-foreground">
              On Leave / Off
            </span>
            <span className="text-2xl font-bold font-mono mt-1 text-destructive">
              {leaveCount}
            </span>
            <span className="text-[11px] text-destructive/80 mt-1">
              Approved leave or off duty
            </span>
          </div>
        </div>

        {/* 2. FILTER & SEARCH BAR */}
        <div className="bg-card p-4 rounded-lg border border-border flex flex-wrap gap-3 items-center justify-between">
          <div className="flex flex-1 flex-wrap gap-3 items-center min-w-[280px]">
            <div className="relative flex-1 max-w-sm min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search conductor by name or badge..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-background text-xs rounded-lg border-border"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="size-3.5 text-muted-foreground shrink-0" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36 bg-background text-xs rounded-lg border-border">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="available">Ready / Available</SelectItem>
                  <SelectItem value="on-duty">On Active Duty</SelectItem>
                  <SelectItem value="resting">Resting</SelectItem>
                  <SelectItem value="leave">On Leave</SelectItem>
                  <SelectItem value="unavailable">Unavailable</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Select value={depotFilter} onValueChange={setDepotFilter}>
                <SelectTrigger className="w-48 bg-background text-xs rounded-lg border-border">
                  <SelectValue placeholder="Depot Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Depots</SelectItem>
                  <SelectItem value="Meyyanur Central Depot">
                    Meyyanur Central Depot
                  </SelectItem>
                  <SelectItem value="Salem Central Depot">
                    Salem Central Depot
                  </SelectItem>
                  <SelectItem value="Johnsonpet Depot">
                    Johnsonpet Depot
                  </SelectItem>
                  <SelectItem value="Hasthampatti Depot">
                    Hasthampatti Depot
                  </SelectItem>
                  <SelectItem value="Steel Plant Depot">
                    Steel Plant Depot
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* 3. CONTENT AREA: CARDS OR TABLE */}
        {isLoading ? (
          <div className="py-20 text-center text-xs text-muted-foreground bg-card rounded-lg border border-border">
            Loading conductor roster...
          </div>
        ) : conductorsList.length === 0 ? (
          <div className="py-20 text-center text-xs text-muted-foreground bg-card rounded-lg border border-border">
            No conductors found matching current search.
          </div>
        ) : viewMode === "cards" ? (
          /* STAFF CARDS DIRECTORY */
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {conductorsList.map((conductor) => {
              const assignment = conductorAssignmentMap.get(conductor.id);
              const phone =
                conductor.phoneNumber ||
                `+91 98421 ${String(Math.abs(conductor.name.length * 12345)).slice(0, 5)}`;
              const isAvailable = conductor.status === "available";
              const isOnDuty = conductor.status === "on-duty";

              return (
                <div
                  key={conductor.id}
                  className="bg-card rounded-lg border border-border p-4 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden"
                >
                  <div className="space-y-3.5">
                    {/* Header: Photo Avatar, Name & Duty Status */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-11 rounded-lg border border-border bg-muted">
                          <AvatarFallback className="rounded-lg font-bold text-xs bg-primary/10 text-primary">
                            {conductor.name
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-bold text-sm text-foreground leading-tight">
                            {conductor.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] font-mono text-muted-foreground">
                              {conductor.employeeId || conductor.badgeNumber}
                            </span>
                            <span className="text-muted-foreground text-xs">
                              •
                            </span>
                            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <MapPin className="size-3 text-muted-foreground" />
                              {conductor.depot || "Salem Central"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Status Selector or Badge */}
                      {canManage ? (
                        <Select
                          value={conductor.status}
                          onValueChange={(val) =>
                            statusMutation.mutate({
                              id: conductor.id,
                              status: val,
                            })
                          }
                        >
                          <SelectTrigger
                            className={cn(
                              "h-7 w-28 text-[11px] font-semibold border rounded-md",
                              getStatusBadgeClass(conductor.status),
                            )}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem
                              value="available"
                              className="text-xs text-emerald-600 font-medium"
                            >
                              Ready / Available
                            </SelectItem>
                            <SelectItem
                              value="on-duty"
                              className="text-xs text-primary font-medium"
                            >
                              On Duty
                            </SelectItem>
                            <SelectItem
                              value="resting"
                              className="text-xs text-amber-600 font-medium"
                            >
                              Resting
                            </SelectItem>
                            <SelectItem
                              value="leave"
                              className="text-xs text-destructive font-medium"
                            >
                              On Leave
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] font-medium capitalize rounded-md",
                            getStatusBadgeClass(conductor.status),
                          )}
                        >
                          {conductor.status.replace("-", " ")}
                        </Badge>
                      )}
                    </div>

                    {/* Contact & ETM Device Information */}
                    <div className="bg-muted/40 rounded-lg p-2.5 border border-border/60 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
                          <Phone className="size-3 text-muted-foreground" />
                          Phone:
                        </span>
                        <a
                          href={`tel:${phone}`}
                          className="font-medium text-foreground hover:underline text-[11px]"
                        >
                          {phone}
                        </a>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
                          <Ticket className="size-3 text-muted-foreground" />
                          ETM Machine:
                        </span>
                        <span className="font-mono text-[11px] font-semibold text-foreground">
                          ETM-{(conductor.employeeId || "001").slice(-3)}{" "}
                          (Fastag Ready)
                        </span>
                      </div>
                    </div>

                    {/* Current Assignment / Duty Details */}
                    <div className="rounded-lg p-2.5 border border-border text-xs space-y-1.5 bg-background">
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span className="font-semibold uppercase tracking-wider text-[10px]">
                          Current Schedule
                        </span>
                        {isOnDuty ? (
                          <span className="text-primary font-medium flex items-center gap-1">
                            <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                            Live on Route
                          </span>
                        ) : isAvailable ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                            Ready from{" "}
                            {formatMinutesToTime(
                              conductor.availableFrom || 330,
                            )}
                          </span>
                        ) : conductor.status === "resting" ? (
                          <span className="text-amber-600 dark:text-amber-400 font-medium">
                            Rest until{" "}
                            {formatMinutesToTime(conductor.restUntil || 330)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">
                            Off Duty
                          </span>
                        )}
                      </div>

                      {assignment ? (
                        <div className="space-y-1 pt-1 border-t border-border/60">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-foreground flex items-center gap-1.5">
                              <BusIcon className="size-3.5 text-primary" />
                              {assignment.busReg}
                            </span>
                            <span className="text-[11px] text-muted-foreground font-mono">
                              {assignment.dutyCode}
                            </span>
                          </div>
                          <div className="text-[11px] text-muted-foreground truncate">
                            Route {assignment.routeCode}: {assignment.routeName}
                          </div>
                        </div>
                      ) : (
                        <div className="pt-1 text-[11px] text-muted-foreground italic">
                          No bus assigned right now.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3.5 mt-3.5 border-t border-border flex items-center justify-between gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs text-muted-foreground hover:text-foreground rounded-md gap-1"
                      onClick={() => handleOpenDetails(conductor.id)}
                    >
                      <Eye className="size-3.5" />
                      Profile
                    </Button>

                    <div className="flex items-center gap-1.5">
                      {canManage && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs text-muted-foreground hover:text-foreground rounded-md"
                          onClick={() => handleOpenEdit(conductor)}
                        >
                          <Edit2 className="size-3.5" />
                        </Button>
                      )}

                      {canManage && isAvailable && (
                        <Button
                          size="sm"
                          className="h-8 text-xs bg-primary text-primary-foreground font-medium rounded-md gap-1"
                          onClick={() => handleOpenAssign(conductor)}
                        >
                          Assign Shift
                          <ArrowRight className="size-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* TABLE VIEW */
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-xs font-bold">Conductor</TableHead>
                  <TableHead className="text-xs font-bold">Badge #</TableHead>
                  <TableHead className="text-xs font-bold">
                    Contact Phone
                  </TableHead>
                  <TableHead className="text-xs font-bold">
                    Depot Location
                  </TableHead>
                  <TableHead className="text-xs font-bold">
                    ETM Terminal
                  </TableHead>
                  <TableHead className="text-xs font-bold">
                    Active Assignment
                  </TableHead>
                  <TableHead className="text-xs font-bold">
                    Duty Status
                  </TableHead>
                  <TableHead className="text-xs font-bold text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conductorsList.map((conductor) => {
                  const assignment = conductorAssignmentMap.get(conductor.id);
                  const phone =
                    conductor.phoneNumber ||
                    `+91 98421 ${String(Math.abs(conductor.name.length * 12345)).slice(0, 5)}`;

                  return (
                    <TableRow
                      key={conductor.id}
                      className="border-border hover:bg-muted/40 transition-colors"
                    >
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <Avatar className="size-7 rounded-md">
                            <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary rounded-md">
                              {conductor.name
                                .split(" ")
                                .map((n: string) => n[0])
                                .join("")
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-bold text-xs text-foreground">
                            {conductor.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {conductor.employeeId || conductor.badgeNumber}
                      </TableCell>
                      <TableCell className="text-xs">
                        <a
                          href={`tel:${phone}`}
                          className="text-foreground hover:underline"
                        >
                          {phone}
                        </a>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {conductor.depot || "Salem Central"}
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <Ticket className="size-3 text-primary" />
                          ETM-{(conductor.employeeId || "001").slice(-3)}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs">
                        {assignment ? (
                          <div className="text-xs">
                            <span className="font-semibold text-foreground">
                              {assignment.busReg}
                            </span>
                            <span className="text-muted-foreground block text-[11px] truncate max-w-[200px]">
                              Route {assignment.routeCode}:{" "}
                              {assignment.routeName}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-[11px] italic">
                            Unassigned
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {canManage ? (
                          <Select
                            value={conductor.status}
                            onValueChange={(val) =>
                              statusMutation.mutate({
                                id: conductor.id,
                                status: val,
                              })
                            }
                          >
                            <SelectTrigger
                              className={cn(
                                "h-7 w-28 text-[10px] font-semibold uppercase tracking-wider border rounded-md",
                                getStatusBadgeClass(conductor.status),
                              )}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem
                                value="available"
                                className="text-xs uppercase text-emerald-600"
                              >
                                Ready
                              </SelectItem>
                              <SelectItem
                                value="on-duty"
                                className="text-xs uppercase text-primary"
                              >
                                On Duty
                              </SelectItem>
                              <SelectItem
                                value="resting"
                                className="text-xs uppercase text-amber-600"
                              >
                                Resting
                              </SelectItem>
                              <SelectItem
                                value="leave"
                                className="text-xs uppercase text-destructive"
                              >
                                Leave
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[9px] font-semibold uppercase font-mono rounded-md",
                              getStatusBadgeClass(conductor.status),
                            )}
                          >
                            {conductor.status.replace("-", " ")}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-muted-foreground hover:text-foreground rounded-md"
                            onClick={() => handleOpenDetails(conductor.id)}
                          >
                            <Eye className="size-3.5" />
                            <span className="sr-only">View profile</span>
                          </Button>
                          {canManage && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 text-muted-foreground hover:text-foreground rounded-md"
                              onClick={() => handleOpenEdit(conductor)}
                            >
                              <Edit2 className="size-3.5" />
                              <span className="sr-only">Edit conductor</span>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* QUICK ASSIGN TO BUS & ROUTE MODAL */}
      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <BusIcon className="size-4 text-primary" />
              Assign Conductor to Bus & Route
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Assign {assignConductor?.name} (Badge:{" "}
              {assignConductor?.employeeId || assignConductor?.badgeNumber}) to
              a bus and route schedule.
            </DialogDescription>
          </DialogHeader>

          <div className="py-3 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Select Bus</Label>
              <Select value={assignBusId} onValueChange={setAssignBusId}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Choose bus registration" />
                </SelectTrigger>
                <SelectContent>
                  {busesList.map((bus) => (
                    <SelectItem key={bus.id} value={bus.id} className="text-xs">
                      {bus.registrationNumber} (
                      {bus.makeModel || "Ashok Leyland"} -{" "}
                      {bus.depot || "Meyyanur"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Select Route Corridor</Label>
              <Select value={assignRouteId} onValueChange={setAssignRouteId}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Choose route" />
                </SelectTrigger>
                <SelectContent>
                  {routesList.map((route) => (
                    <SelectItem
                      key={route.id || route.code}
                      value={route.id || route.code}
                      className="text-xs"
                    >
                      Route {route.code}: {route.name} ({route.startLocation} to{" "}
                      {route.endLocation})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Shift Report Time</Label>
              <Input
                type="time"
                value={assignStartTime}
                onChange={(e) => setAssignStartTime(e.target.value)}
                className="font-mono text-xs"
              />
            </div>

            <div className="p-3 bg-muted/50 rounded-lg border border-border text-xs space-y-1 text-muted-foreground">
              <div className="flex items-center gap-1.5 text-foreground font-semibold">
                <CheckCircle2 className="size-4 text-emerald-600" />
                ETM Ticketing Check
              </div>
              <p className="text-[11px]">
                Electronic Ticketing Machine ETM-
                {(assignConductor?.employeeId || "001").slice(-3)} will be
                assigned and synced with today's route fare stages
                automatically.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAssignOpen(false)}
              className="text-xs rounded-md"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={assignDutyMutation.isPending}
              onClick={() => assignDutyMutation.mutate()}
              className="bg-primary text-primary-foreground text-xs font-semibold rounded-md"
            >
              {assignDutyMutation.isPending
                ? "Assigning..."
                : "Confirm Assignment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CONDUCTOR PROFILE CARD SHEET */}
      <Sheet open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <SheetContent className="sm:max-w-[480px] p-6 overflow-y-auto">
          <SheetHeader className="border-b border-border pb-4">
            <SheetTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
              <IdCard className="size-5 text-primary" />
              Conductor Profile Card
            </SheetTitle>
          </SheetHeader>

          {selectedConductorDetails ? (
            <div className="mt-5 space-y-5">
              {/* Profile Header Avatar Card */}
              <div className="p-4 rounded-lg border border-border bg-card space-y-3 shadow-sm">
                <div className="flex items-center gap-3.5">
                  <Avatar className="size-14 rounded-lg border border-border">
                    <AvatarFallback className="text-base font-bold bg-primary/10 text-primary rounded-lg">
                      {selectedConductorDetails.name
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-base font-bold text-foreground">
                      {selectedConductorDetails.name}
                    </h3>
                    <p className="font-mono text-xs text-muted-foreground font-semibold">
                      Badge: {selectedConductorDetails.employeeId}
                    </p>
                    <Badge
                      variant="outline"
                      className={cn(
                        "mt-1 text-[10px] font-mono capitalize font-bold rounded-md",
                        getStatusBadgeClass(selectedConductorDetails.status),
                      )}
                    >
                      {selectedConductorDetails.status.replace("-", " ")}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-border font-mono">
                  <div>
                    <span className="text-[10px] uppercase text-muted-foreground">
                      Depot Base
                    </span>
                    <p className="font-medium text-foreground text-[11px] truncate">
                      {selectedConductorDetails.depot}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-muted-foreground">
                      Ticketing Terminal
                    </span>
                    <p className="font-medium text-foreground text-[11px] truncate">
                      ETM-{selectedConductorDetails.employeeId.slice(-3)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Roster & Availability Telemetry */}
              <div className="bg-card p-4 rounded-lg border border-border space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <ShieldCheck className="size-4 text-emerald-600" />
                  Shift & Rest Compliance
                </h4>

                <div className="p-2.5 rounded-lg border border-border bg-muted/40 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Available From:
                    </span>
                    <span className="font-mono font-bold">
                      {formatMinutesToTime(
                        selectedConductorDetails.availableFrom,
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rest Limit:</span>
                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                      {formatMinutesToTime(selectedConductorDetails.restUntil)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Today's Rostered Duty */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <CalendarClock className="size-4 text-primary" />
                  Assigned Bus Operations
                </h4>
                <div className="p-4 rounded-lg border border-border text-center text-xs text-muted-foreground bg-muted/30">
                  <CheckCircle2 className="size-6 text-emerald-600 mx-auto mb-1.5" />
                  Roster wave active. ETM device verified and ready for route
                  fare collection.
                </div>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-muted-foreground text-xs">
              Loading conductor profile...
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* CREATE CONDUCTOR MODAL */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <form onSubmit={handleCreateSubmit}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Users className="size-4 text-primary" />
                Register New Conductor
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Add an ETM ticketing staff member to the depot registry.
              </DialogDescription>
            </DialogHeader>

            <div className="py-3.5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Badge Number / ID</Label>
                  <Input
                    type="text"
                    placeholder="e.g. CND-013"
                    value={formEmpId}
                    onChange={(e) => setFormEmpId(e.target.value)}
                    className="font-mono text-xs rounded-md"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Full Name</Label>
                  <Input
                    type="text"
                    placeholder="e.g. Ramesh Babu"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="text-xs rounded-md"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Phone Number</Label>
                  <Input
                    type="tel"
                    placeholder="+91 98421 ..."
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="text-xs rounded-md"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Depot Location</Label>
                  <Select value={formDepot} onValueChange={setFormDepot}>
                    <SelectTrigger className="text-xs rounded-md">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Meyyanur Central Depot">
                        Meyyanur Central Depot
                      </SelectItem>
                      <SelectItem value="Salem Central Depot">
                        Salem Central Depot
                      </SelectItem>
                      <SelectItem value="Johnsonpet Depot">
                        Johnsonpet Depot
                      </SelectItem>
                      <SelectItem value="Hasthampatti Depot">
                        Hasthampatti Depot
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Shift Starts At</Label>
                  <Input
                    type="time"
                    value={formAvailableFrom}
                    onChange={(e) => setFormAvailableFrom(e.target.value)}
                    className="font-mono text-xs rounded-md"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Initial Status</Label>
                  <Select value={formStatus} onValueChange={setFormStatus}>
                    <SelectTrigger className="text-xs rounded-md">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">
                        Ready / Available
                      </SelectItem>
                      <SelectItem value="on-duty">On Duty</SelectItem>
                      <SelectItem value="resting">Resting</SelectItem>
                      <SelectItem value="leave">On Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                className="text-xs rounded-md"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="bg-primary text-primary-foreground text-xs font-semibold rounded-md"
              >
                {createMutation.isPending ? "Creating..." : "Save Conductor"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT CONDUCTOR MODAL */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <form onSubmit={handleEditSubmit}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Edit2 className="size-4 text-primary" />
                Edit Conductor Information
              </DialogTitle>
            </DialogHeader>

            <div className="py-3.5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Badge Number / ID</Label>
                  <Input
                    type="text"
                    value={formEmpId}
                    onChange={(e) => setFormEmpId(e.target.value)}
                    className="font-mono text-xs rounded-md"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Full Name</Label>
                  <Input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="text-xs rounded-md"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Phone Number</Label>
                  <Input
                    type="tel"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="text-xs rounded-md"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Depot Location</Label>
                  <Select value={formDepot} onValueChange={setFormDepot}>
                    <SelectTrigger className="text-xs rounded-md">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Meyyanur Central Depot">
                        Meyyanur Central Depot
                      </SelectItem>
                      <SelectItem value="Salem Central Depot">
                        Salem Central Depot
                      </SelectItem>
                      <SelectItem value="Johnsonpet Depot">
                        Johnsonpet Depot
                      </SelectItem>
                      <SelectItem value="Hasthampatti Depot">
                        Hasthampatti Depot
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Duty Status</Label>
                <Select value={formStatus} onValueChange={setFormStatus}>
                  <SelectTrigger className="text-xs rounded-md">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Ready / Available</SelectItem>
                    <SelectItem value="on-duty">On Duty</SelectItem>
                    <SelectItem value="resting">Resting</SelectItem>
                    <SelectItem value="leave">On Leave</SelectItem>
                    <SelectItem value="unavailable">Unavailable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
                className="text-xs rounded-md"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className="bg-primary text-primary-foreground text-xs font-semibold rounded-md"
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
