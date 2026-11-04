import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Briefcase,
  CalendarClock,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Bus as BusIcon,
  Users,
  Eye,
  Edit2,
  Trash2,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Layers,
  AlertTriangle,
  UserCheck,
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
  SheetDescription,
} from "@/components/ui/sheet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { hasPermission } from "@/lib/auth-shared";
import { getBuses, getDrivers, getConductors } from "@/lib/fleet-crew";
import {
  getDuties,
  getDuty,
  createDuty,
  updateDuty,
  deleteDuty,
  validateDuty,
} from "@/lib/scheduling-fns";
import { getRoutes } from "@/lib/routes-gis-fns";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/operations/duty-roster")({
  beforeLoad: ({ context }) => {
    if (!context.user || !hasPermission(context.user.role, "schedule.view")) {
      throw new Error("Forbidden");
    }
  },
  head: () => ({
    meta: [
      { title: "Duties Roster & Management: TransitOS" },
      {
        name: "description",
        content:
          "Operational vehicle duties, crew pairings, trip link chains, and rest break compliance.",
      },
    ],
  }),
  component: DutiesManagementPage,
});

// Helper: current system date formatted dynamically
function getSystemDateFormatted(): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${day} ${monthNames[now.getMonth()]} ${now.getFullYear()}`;
}

// 12-hour time formatter
function formatMinutesTo12Hour(totalMin: number | null | undefined): string {
  if (totalMin === null || totalMin === undefined || isNaN(Number(totalMin))) {
    return "--:-- --";
  }
  const mins = Math.max(0, Math.floor(Number(totalMin)));
  let hh = Math.floor(mins / 60) % 24;
  const mm = mins % 60;
  const period = hh >= 12 ? "PM" : "AM";
  if (hh === 0) hh = 12;
  else if (hh > 12) hh -= 12;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")} ${period}`;
}

// 12-hour time parser
function parse12HourToMinutes(timeStr?: string, period: "AM" | "PM" = "AM"): number {
  if (!timeStr) return period === "PM" ? 14 * 60 : 6 * 60;
  const parts = timeStr.trim().split(":");
  let hours = parseInt(parts[0] || "6", 10);
  const minutes = parseInt(parts[1] || "0", 10);

  if (isNaN(hours)) hours = 6;
  const safeMinutes = isNaN(minutes) ? 0 : Math.min(Math.max(minutes, 0), 59);

  if (period === "AM") {
    if (hours === 12) hours = 0;
    else if (hours > 12) hours = hours % 12;
  } else {
    if (hours < 12) hours += 12;
  }

  return hours * 60 + safeMinutes;
}

function formatMinutesTo12HourParts(mins: number): {
  timeStr: string;
  period: "AM" | "PM";
} {
  const safeMin = Math.max(0, mins || 0);
  let hh = Math.floor(safeMin / 60) % 24;
  const mm = safeMin % 60;
  const period: "AM" | "PM" = hh >= 12 ? "PM" : "AM";
  if (hh === 0) hh = 12;
  else if (hh > 12) hh -= 12;
  return {
    timeStr: `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`,
    period,
  };
}

interface TripLinkItem {
  id: string;
  tripCode: string;
  routeCode?: string;
  routeName?: string;
  startTime: number;
  endTime: number;
}

interface DutyDetailItem {
  id: string;
  dutyCode: string;
  dutyType: string;
  serviceDate: string;
  startTime: number;
  endTime: number;
  status: string;
  busId?: string | null;
  busRegNumber?: string | null;
  busModel?: string | null;
  busDepot?: string | null;
  driverId?: string | null;
  driverName?: string | null;
  driverBadge?: string | null;
  conductorId?: string | null;
  conductorName?: string | null;
  conductorBadge?: string | null;
  trips?: TripLinkItem[];
  crewSegments?: {
    id: string;
    driverId?: string;
    driverName?: string;
    conductorId?: string;
    conductorName?: string;
    startTime: number;
    endTime: number;
  }[];
}

function DutiesManagementPage() {
  const queryClient = useQueryClient();
  const currentDate = useMemo(() => getSystemDateFormatted(), []);

  // Filter State
  const [selectedDate, setSelectedDate] = useState<string>("25 Aug 2026");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal / Sheet State
  const [viewDutyId, setViewDutyId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingDuty, setEditingDuty] = useState<DutyDetailItem | null>(null);

  // Form State (Create / Edit)
  const [formDutyCode, setFormDutyCode] = useState("");
  const [formDutyType, setFormDutyType] = useState<string>("LINKED");
  const [formServiceDate, setFormServiceDate] = useState(currentDate);
  const [formBusId, setFormBusId] = useState<string>("");
  const [formDriverId, setFormDriverId] = useState<string>("");
  const [formConductorId, setFormConductorId] = useState<string>("");
  const [formStartTime, setFormStartTime] = useState("06:00");
  const [formStartPeriod, setFormStartPeriod] = useState<"AM" | "PM">("AM");
  const [formEndTime, setFormEndTime] = useState("02:00");
  const [formEndPeriod, setFormEndPeriod] = useState<"AM" | "PM">("PM");
  const [formStatus, setFormStatus] = useState("scheduled");

  // 1. Fetch Duties
  const {
    data: dutiesList = [],
    isLoading: isDutiesLoading,
    refetch,
  } = useQuery<DutyDetailItem[]>({
    queryKey: ["duties-roster", selectedDate, statusFilter],
    queryFn: async () => {
      const filters: { serviceDate?: string; status?: string } = {};
      if (selectedDate) filters.serviceDate = selectedDate;
      if (statusFilter !== "all") filters.status = statusFilter;
      const data = await getDuties(filters);
      return (data || []) as unknown as DutyDetailItem[];
    },
  });

  // 2. Fetch Selected Duty Details
  const { data: activeDutyDetails } = useQuery<DutyDetailItem | null>({
    queryKey: ["duty-roster-detail", viewDutyId],
    queryFn: async () => {
      if (!viewDutyId) return null;
      const data = await getDuty(viewDutyId);
      return data as unknown as DutyDetailItem;
    },
    enabled: !!viewDutyId,
  });

  // 3. Validation for selected duty
  const { data: activeValidation } = useQuery({
    queryKey: ["duty-roster-validation", viewDutyId],
    queryFn: async () => {
      if (!viewDutyId) return { isValid: true, issues: [] };
      return await validateDuty({ dutyId: viewDutyId });
    },
    enabled: !!viewDutyId,
  });

  // 4. Fetch Supporting Roster Entities
  const { data: busesList = [] } = useQuery({
    queryKey: ["buses-for-duties"],
    queryFn: () => getBuses(),
  });
  const { data: driversList = [] } = useQuery({
    queryKey: ["drivers-for-duties"],
    queryFn: () => getDrivers(),
  });
  const { data: conductorsList = [] } = useQuery({
    queryKey: ["conductors-for-duties"],
    queryFn: () => getConductors(),
  });
  const { data: routesList = [] } = useQuery({
    queryKey: ["routes-for-duties"],
    queryFn: () => getRoutes({ status: "active" }),
  });

  // Filtered Duties List
  const filteredDuties = useMemo(() => {
    return dutiesList.filter((d) => {
      if (typeFilter !== "all" && d.dutyType !== typeFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const codeMatch = (d.dutyCode || "").toLowerCase().includes(q);
      const busMatch = (d.busRegNumber || "").toLowerCase().includes(q);
      const driverMatch = (d.driverName || "").toLowerCase().includes(q);
      const conductorMatch = (d.conductorName || "").toLowerCase().includes(q);
      return codeMatch || busMatch || driverMatch || conductorMatch;
    });
  }, [dutiesList, typeFilter, searchQuery]);

  // Telemetry KPIs
  const totalCount = dutiesList.length;
  const fullyMannedCount = dutiesList.filter(
    (d) => d.driverId && d.conductorId,
  ).length;
  const busAssignedCount = dutiesList.filter((d) => d.busId).length;
  const uncrewedCount = dutiesList.filter(
    (d) => !d.driverId && !d.conductorId,
  ).length;
  const activeCount = dutiesList.filter(
    (d) => d.status === "active" || d.status === "published",
  ).length;

  // Mutations
  const createDutyMutation = useMutation({
    mutationFn: async () => {
      if (!formDutyCode.trim()) throw new Error("Duty code is required.");
      if (!formServiceDate.trim()) throw new Error("Service date is required.");

      const startMin = parse12HourToMinutes(formStartTime, formStartPeriod);
      const endMin = parse12HourToMinutes(formEndTime, formEndPeriod);

      const newD = (await createDuty({
        dutyCode: formDutyCode.trim(),
        dutyType: formDutyType,
        serviceDate: formServiceDate.trim(),
        busId: formBusId || null,
        driverId: formDriverId || null,
        conductorId: formConductorId || null,
        startTime: startMin,
        endTime: endMin,
        status: formStatus || "scheduled",
      })) as { id?: string; dutyCode?: string };

      if (newD?.id) {
        await updateDuty({
          id: newD.id,
          data: {
            dutyCode: formDutyCode.trim(),
            dutyType: formDutyType,
            serviceDate: formServiceDate.trim(),
            busId: formBusId || null,
            driverId: formDriverId || null,
            conductorId: formConductorId || null,
            status: formStatus || "scheduled",
          },
        });
      }

      return newD;
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["duties-roster"] });
      queryClient.invalidateQueries({ queryKey: ["duties"] });
      toast.success(`Duty ${res?.dutyCode || formDutyCode} created successfully.`);
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create duty.");
    },
  });

  const updateDutyMutation = useMutation({
    mutationFn: async () => {
      if (!editingDuty) throw new Error("No duty selected for update.");
      if (!formDutyCode.trim()) throw new Error("Duty code is required.");

      await updateDuty({
        id: editingDuty.id,
        data: {
          dutyCode: formDutyCode.trim(),
          dutyType: formDutyType,
          serviceDate: formServiceDate.trim(),
          status: formStatus,
          busId: formBusId || null,
          driverId: formDriverId || null,
          conductorId: formConductorId || null,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["duties-roster"] });
      queryClient.invalidateQueries({ queryKey: ["duties"] });
      if (editingDuty?.id) {
        queryClient.invalidateQueries({
          queryKey: ["duty-roster-detail", editingDuty.id],
        });
      }
      toast.success("Duty shift updated successfully.");
      setIsEditOpen(false);
      setEditingDuty(null);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update duty.");
    },
  });

  const deleteDutyMutation = useMutation({
    mutationFn: async (id: string) => {
      return await deleteDuty(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["duties-roster"] });
      queryClient.invalidateQueries({ queryKey: ["duties"] });
      toast.success("Duty deleted successfully.");
      if (viewDutyId) setViewDutyId(null);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to delete duty.");
    },
  });

  const resetForm = () => {
    setFormDutyCode("");
    setFormDutyType("LINKED");
    setFormServiceDate(currentDate);
    setFormBusId("");
    setFormDriverId("");
    setFormConductorId("");
    setFormStartTime("06:00");
    setFormStartPeriod("AM");
    setFormEndTime("02:00");
    setFormEndPeriod("PM");
    setFormStatus("scheduled");
  };

  const handleOpenCreate = () => {
    resetForm();
    // Auto-generate sample code
    const r = routesList[0]?.code || "01";
    setFormDutyCode(`DTY-${r}-0600-${Date.now().toString().slice(-3)}`);
    setFormBusId(busesList[0]?.id || "");
    setFormDriverId(driversList[0]?.id || "");
    setFormConductorId(conductorsList[0]?.id || "");
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (duty: DutyDetailItem) => {
    setEditingDuty(duty);
    setFormDutyCode(duty.dutyCode);
    setFormDutyType(duty.dutyType || "LINKED");
    setFormServiceDate(duty.serviceDate || currentDate);
    setFormBusId(duty.busId || "");
    setFormDriverId(duty.driverId || "");
    setFormConductorId(duty.conductorId || "");
    setFormStatus(duty.status || "scheduled");

    const startParts = formatMinutesTo12HourParts(duty.startTime || 360);
    setFormStartTime(startParts.timeStr);
    setFormStartPeriod(startParts.period);

    const endParts = formatMinutesTo12HourParts(duty.endTime || 840);
    setFormEndTime(endParts.timeStr);
    setFormEndPeriod(endParts.period);

    setIsEditOpen(true);
  };

  const autoGenerateDutyCode = () => {
    const r = routesList[0]?.code || "01";
    const startMin = parse12HourToMinutes(formStartTime, formStartPeriod);
    const hh = String(Math.floor(startMin / 60)).padStart(2, "0");
    const mm = String(startMin % 60).padStart(2, "0");
    const code = `DTY-${r}-${hh}${mm}-${Date.now().toString().slice(-3)}`;
    setFormDutyCode(code);
  };

  return (
    <AppShell
      title="Duties & Crew Rosters"
      subtitle="Operational master roster of vehicle duties, crew pairings, trip link chains, and rest break compliance."
      actions={
        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="text-xs h-8 border-border hover:bg-muted rounded-md hidden sm:inline-flex"
          >
            <Link to="/scheduling/optimizer">
              <Sparkles className="size-3.5 mr-1.5 text-primary" />
              Auto-Assign Roster
            </Link>
          </Button>
          <Button
            size="sm"
            onClick={handleOpenCreate}
            className="text-xs h-8 bg-primary text-primary-foreground font-semibold rounded-md shadow-xs cursor-pointer"
          >
            <Plus className="size-3.5 mr-1.5" />
            New Duty
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* 1. TELEMETRY KPI TILES */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card className="rounded-lg border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Total Duties
              </CardTitle>
              <Briefcase className="size-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">{totalCount}</div>
              <p className="text-[11px] text-muted-foreground mt-1">
                For {selectedDate || "selected date"}
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-lg border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Fully Crewed
              </CardTitle>
              <CheckCircle2 className="size-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono text-emerald-600">
                {fullyMannedCount}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Driver and Conductor paired
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-lg border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Vehicle Assigned
              </CardTitle>
              <BusIcon className="size-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">{busAssignedCount}</div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Bus plate linked to duty
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-lg border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Pending Crew
              </CardTitle>
              <AlertTriangle className="size-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono text-amber-600">
                {uncrewedCount}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Awaiting crew dispatch
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-lg border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Active / Dispatched
              </CardTitle>
              <ShieldCheck className="size-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">{activeCount}</div>
              <p className="text-[11px] text-muted-foreground mt-1">
                On road or scheduled
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 2. FILTER & ACTION ROW */}
        <div className="p-4 rounded-lg border border-border bg-card space-y-3">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 min-w-[240px] max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Search duty code, bus plate, crew..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 text-xs font-mono h-8 rounded-md"
              />
            </div>

            {/* Quick Date Switcher */}
            <div className="flex items-center gap-2">
              <Calendar className="size-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground">
                Date:
              </span>
              <Input
                type="text"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                placeholder="25 Aug 2026"
                className="w-32 text-xs font-mono h-8 rounded-md"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDate(currentDate)}
                className="text-[11px] h-8 px-2 rounded-md"
                title="Switch to dynamic current system date"
              >
                Today
              </Button>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32 text-xs h-8 rounded-md">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All Statuses</SelectItem>
                  <SelectItem value="scheduled" className="text-xs">Scheduled</SelectItem>
                  <SelectItem value="active" className="text-xs">Active</SelectItem>
                  <SelectItem value="assigned" className="text-xs">Assigned</SelectItem>
                  <SelectItem value="draft" className="text-xs">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Duty Type Filter */}
            <div className="flex items-center gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-32 text-xs h-8 rounded-md">
                  <SelectValue placeholder="Duty Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All Types</SelectItem>
                  <SelectItem value="LINKED" className="text-xs">LINKED</SelectItem>
                  <SelectItem value="UNLINKED" className="text-xs">UNLINKED</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="text-xs h-8 rounded-md"
            >
              <RefreshCw className="size-3.5 mr-1" />
              Refresh
            </Button>
          </div>
        </div>

        {/* 3. DUTIES MASTER TABLE */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="text-xs font-bold text-foreground">
                  Duty Code & Type
                </TableHead>
                <TableHead className="text-xs font-bold text-foreground">
                  Service Date
                </TableHead>
                <TableHead className="text-xs font-bold text-foreground">
                  Bus Registration
                </TableHead>
                <TableHead className="text-xs font-bold text-foreground">
                  Assigned Driver
                </TableHead>
                <TableHead className="text-xs font-bold text-foreground">
                  Assigned Conductor
                </TableHead>
                <TableHead className="text-xs font-bold text-foreground">
                  Shift Timing (12h)
                </TableHead>
                <TableHead className="text-xs font-bold text-foreground">
                  Linked Trips
                </TableHead>
                <TableHead className="text-xs font-bold text-foreground">
                  Status
                </TableHead>
                <TableHead className="text-xs font-bold text-foreground text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isDutiesLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="h-32 text-center text-xs text-muted-foreground"
                  >
                    Loading operational duties...
                  </TableCell>
                </TableRow>
              ) : filteredDuties.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="h-32 text-center text-xs text-muted-foreground"
                  >
                    No duties found for the selected criteria. Click "New Duty"
                    to create one.
                  </TableCell>
                </TableRow>
              ) : (
                filteredDuties.map((duty) => {
                  const shiftDurationHours =
                    duty.endTime && duty.startTime && duty.endTime > duty.startTime
                      ? Math.round(((duty.endTime - duty.startTime) / 60) * 10) /
                        10
                      : 8;

                  return (
                    <TableRow key={duty.id} className="hover:bg-muted/40">
                      <TableCell className="font-mono text-xs font-bold">
                        <div className="flex items-center gap-1.5">
                          <span>{duty.dutyCode}</span>
                          <Badge
                            variant="outline"
                            className="text-[10px] uppercase font-mono px-1 py-0"
                          >
                            {duty.dutyType || "LINKED"}
                          </Badge>
                        </div>
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {duty.serviceDate}
                      </TableCell>

                      <TableCell className="text-xs">
                        {duty.busRegNumber ? (
                          <div className="flex items-center gap-1.5 font-mono font-medium">
                            <BusIcon className="size-3 text-muted-foreground" />
                            {duty.busRegNumber}
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic text-xs">
                            Unassigned
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="text-xs">
                        {duty.driverName ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="size-5 rounded-md border border-border">
                              <AvatarFallback className="text-[10px] font-bold">
                                {duty.driverName.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{duty.driverName}</span>
                          </div>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="text-[10px] font-normal text-muted-foreground"
                          >
                            Unassigned
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-xs">
                        {duty.conductorName ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="size-5 rounded-md border border-border">
                              <AvatarFallback className="text-[10px] font-bold">
                                {duty.conductorName.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">
                              {duty.conductorName}
                            </span>
                          </div>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="text-[10px] font-normal text-muted-foreground"
                          >
                            Unassigned
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-xs font-mono">
                        <div>
                          {formatMinutesTo12Hour(duty.startTime || 360)} -{" "}
                          {formatMinutesTo12Hour(duty.endTime || 840)}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {shiftDurationHours} hrs shift
                        </div>
                      </TableCell>

                      <TableCell className="text-xs">
                        <div className="flex items-center gap-1.5">
                          <Layers className="size-3 text-muted-foreground" />
                          <span className="font-mono font-semibold">
                            {duty.trips?.length || 0}
                          </span>
                          <span className="text-muted-foreground text-[11px]">
                            trips
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="text-xs">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] font-medium capitalize",
                            duty.status === "active" || duty.status === "published"
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                              : duty.status === "scheduled" ||
                                  duty.status === "assigned"
                                ? "bg-primary/10 text-primary border-primary/30"
                                : "bg-muted text-muted-foreground",
                          )}
                        >
                          {duty.status || "scheduled"}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setViewDutyId(duty.id)}
                            className="size-7 rounded-md"
                            title="View Duty Details"
                          >
                            <Eye className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEdit(duty)}
                            className="size-7 rounded-md"
                            title="Edit Duty"
                          >
                            <Edit2 className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Delete duty ${duty.dutyCode}? This action cannot be undone.`,
                                )
                              ) {
                                deleteDutyMutation.mutate(duty.id);
                              }
                            }}
                            className="size-7 rounded-md text-destructive hover:bg-destructive/10"
                            title="Delete Duty"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* 4. DUTY DETAILS SHEET / DRAWER */}
      <Sheet open={!!viewDutyId} onOpenChange={(open) => !open && setViewDutyId(null)}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader className="pb-3 border-b border-border">
            <SheetTitle className="text-base font-bold flex items-center gap-2">
              <Briefcase className="size-4 text-primary" />
              Duty Details: {activeDutyDetails?.dutyCode || "..."}
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              Roster specifications, assigned crew, vehicle, and trip sequence.
            </SheetDescription>
          </SheetHeader>

          {activeDutyDetails ? (
            <div className="py-4 space-y-5 text-xs">
              {/* Summary Overview */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-muted/40 rounded-lg border border-border">
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Service Date
                  </span>
                  <span className="font-mono font-medium">
                    {activeDutyDetails.serviceDate}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Duty Type
                  </span>
                  <Badge variant="outline" className="text-[10px] font-mono mt-0.5">
                    {activeDutyDetails.dutyType || "LINKED"}
                  </Badge>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Shift Timing (12h)
                  </span>
                  <span className="font-mono font-medium">
                    {formatMinutesTo12Hour(activeDutyDetails.startTime)} -{" "}
                    {formatMinutesTo12Hour(activeDutyDetails.endTime)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Operational Status
                  </span>
                  <Badge variant="outline" className="text-[10px] font-medium capitalize mt-0.5">
                    {activeDutyDetails.status || "scheduled"}
                  </Badge>
                </div>
              </div>

              {/* Bus & Crew Pairings */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Assigned Assets & Crew
                </h4>
                <div className="p-3 border border-border rounded-lg bg-card space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <BusIcon className="size-3.5 text-primary" />
                      Vehicle Plate:
                    </span>
                    <span className="font-mono font-semibold">
                      {activeDutyDetails.busRegNumber || "Unassigned"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Users className="size-3.5 text-primary" />
                      Driver:
                    </span>
                    <span className="font-medium">
                      {activeDutyDetails.driverName || "Unassigned"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <UserCheck className="size-3.5 text-primary" />
                      Conductor:
                    </span>
                    <span className="font-medium">
                      {activeDutyDetails.conductorName || "Unassigned"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Linked Trips Sequence */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Linked Trip Chain ({activeDutyDetails.trips?.length || 0})
                  </h4>
                  <Link
                    to="/operations/trips"
                    className="text-[11px] text-primary hover:underline flex items-center gap-1"
                  >
                    View Timetable
                    <ArrowRight className="size-3" />
                  </Link>
                </div>

                {activeDutyDetails.trips && activeDutyDetails.trips.length > 0 ? (
                  <div className="space-y-2">
                    {activeDutyDetails.trips.map((t, idx) => (
                      <div
                        key={t.id}
                        className="p-2.5 rounded-lg border border-border bg-card flex items-center justify-between"
                      >
                        <div>
                          <div className="font-mono font-bold text-xs flex items-center gap-1.5">
                            <span>#{idx + 1}</span>
                            <span>{t.tripCode}</span>
                            {t.routeCode && (
                              <Badge
                                variant="outline"
                                className="text-[10px] font-mono px-1 py-0"
                              >
                                Route {t.routeCode}
                              </Badge>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                            {t.routeName || "Scheduled Corridor Run"}
                          </p>
                        </div>
                        <div className="text-right font-mono text-xs">
                          {formatMinutesTo12Hour(t.startTime)}
                          <span className="text-[10px] text-muted-foreground block">
                            to {formatMinutesTo12Hour(t.endTime)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="p-3 bg-muted/40 rounded-lg text-muted-foreground italic text-center">
                    No trips currently chained to this duty. Use Schedules &
                    Trips or the Optimizer to chain trips.
                  </p>
                )}
              </div>

              {/* Validation Status */}
              <div className="p-3 bg-muted/40 rounded-lg border border-border space-y-1.5">
                <div className="flex items-center gap-1.5 font-semibold text-foreground">
                  <ShieldCheck className="size-4 text-emerald-600" />
                  Regulatory Rest & Compliance
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {activeValidation?.isValid
                    ? "Duty complies with maximum driving hours and mandatory rest period constraints."
                    : "Duty warnings detected. Please review shift lengths and rest intervals."}
                </p>
              </div>
            </div>
          ) : (
            <p className="py-8 text-center text-muted-foreground">
              Loading duty details...
            </p>
          )}
        </SheetContent>
      </Sheet>

      {/* 5. CREATE / EDIT DUTY DIALOG */}
      <Dialog
        open={isCreateOpen || isEditOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false);
            setIsEditOpen(false);
            setEditingDuty(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Briefcase className="size-4 text-primary" />
              {isEditOpen ? `Edit Duty: ${editingDuty?.dutyCode}` : "Create New Duty"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Configure duty identification, service date, vehicle plate, crew,
              and shift timings.
            </DialogDescription>
          </DialogHeader>

          <div className="py-3 space-y-3.5 text-xs">
            {/* Duty Code */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Duty Code</Label>
                <button
                  type="button"
                  onClick={autoGenerateDutyCode}
                  className="text-[11px] text-primary hover:underline cursor-pointer"
                >
                  Generate Code
                </button>
              </div>
              <Input
                placeholder="e.g. DTY-01-0600"
                value={formDutyCode}
                onChange={(e) => setFormDutyCode(e.target.value)}
                className="font-mono text-xs rounded-md"
              />
            </div>

            {/* Service Date & Duty Type */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Service Date</Label>
                <Input
                  placeholder="e.g. 04 Nov 2026"
                  value={formServiceDate}
                  onChange={(e) => setFormServiceDate(e.target.value)}
                  className="font-mono text-xs rounded-md"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Duty Type</Label>
                <Select value={formDutyType} onValueChange={setFormDutyType}>
                  <SelectTrigger className="text-xs rounded-md">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LINKED" className="text-xs">
                      LINKED (Single Bus)
                    </SelectItem>
                    <SelectItem value="UNLINKED" className="text-xs">
                      UNLINKED (Multi-bus)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Bus Select */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Assigned Bus</Label>
              <Select value={formBusId} onValueChange={setFormBusId}>
                <SelectTrigger className="text-xs rounded-md">
                  <SelectValue placeholder="Select Bus" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="" className="text-xs">-- Unassigned --</SelectItem>
                  {busesList.map((b: any) => (
                    <SelectItem key={b.id} value={b.id} className="text-xs">
                      {b.registrationNumber} ({b.makeModel || "Bus"} - {b.depot || "Depot"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Driver Select */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Assigned Driver</Label>
              <Select value={formDriverId} onValueChange={setFormDriverId}>
                <SelectTrigger className="text-xs rounded-md">
                  <SelectValue placeholder="Select Driver" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="" className="text-xs">-- Unassigned --</SelectItem>
                  {driversList.map((d: any) => (
                    <SelectItem key={d.id} value={d.id} className="text-xs">
                      {d.name} ({d.badgeNumber || d.employeeId || "Driver"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Conductor Select */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Assigned Conductor</Label>
              <Select value={formConductorId} onValueChange={setFormConductorId}>
                <SelectTrigger className="text-xs rounded-md">
                  <SelectValue placeholder="Select Conductor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="" className="text-xs">-- Unassigned --</SelectItem>
                  {conductorsList.map((c: any) => (
                    <SelectItem key={c.id} value={c.id} className="text-xs">
                      {c.name} ({c.badgeNumber || c.employeeId || "Conductor"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Shift Start Time (12h format + AM/PM) */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Shift Start Time (12h)</Label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="06:00"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="pl-8 font-mono text-xs rounded-md"
                  />
                </div>
                <Select
                  value={formStartPeriod}
                  onValueChange={(val: "AM" | "PM") => setFormStartPeriod(val)}
                >
                  <SelectTrigger className="w-24 text-xs font-semibold rounded-md">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AM" className="text-xs font-mono font-medium">AM</SelectItem>
                    <SelectItem value="PM" className="text-xs font-mono font-medium">PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Shift End Time (12h format + AM/PM) */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Shift End Time (12h)</Label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="02:00"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="pl-8 font-mono text-xs rounded-md"
                  />
                </div>
                <Select
                  value={formEndPeriod}
                  onValueChange={(val: "AM" | "PM") => setFormEndPeriod(val)}
                >
                  <SelectTrigger className="w-24 text-xs font-semibold rounded-md">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AM" className="text-xs font-mono font-medium">AM</SelectItem>
                    <SelectItem value="PM" className="text-xs font-mono font-medium">PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Status */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Status</Label>
              <Select value={formStatus} onValueChange={setFormStatus}>
                <SelectTrigger className="text-xs rounded-md">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled" className="text-xs">Scheduled</SelectItem>
                  <SelectItem value="active" className="text-xs">Active</SelectItem>
                  <SelectItem value="assigned" className="text-xs">Assigned</SelectItem>
                  <SelectItem value="draft" className="text-xs">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsCreateOpen(false);
                setIsEditOpen(false);
                setEditingDuty(null);
              }}
              className="text-xs rounded-md"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={
                createDutyMutation.isPending || updateDutyMutation.isPending
              }
              onClick={() => {
                if (isEditOpen) {
                  updateDutyMutation.mutate();
                } else {
                  createDutyMutation.mutate();
                }
              }}
              className="bg-primary text-primary-foreground text-xs font-semibold rounded-md"
            >
              {createDutyMutation.isPending || updateDutyMutation.isPending
                ? "Saving..."
                : isEditOpen
                  ? "Update Duty"
                  : "Create Duty"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
