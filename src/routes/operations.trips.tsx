import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CalendarClock,
  Search,
  Plus,
  ArrowRight,
  Bus as BusIcon,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  Filter,
  Check,
  ChevronRight,
  Sparkles,
  Calendar,
  X,
  UserCheck,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { TransitTable, ColumnDef } from "@/components/ui/transit-table";
import { RouteBadge, formatRouteName } from "@/lib/route-utils";
import { useActiveTenant } from "@/lib/tenant-context";
import { Play } from "lucide-react";
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
import { getRoutes } from "@/lib/routes-gis-fns";
import { getBuses, getDrivers, getConductors } from "@/lib/fleet-crew";
import {
  getTrips,
  createTrip,
  cancelTrip,
  generateTrips,
  getDuties,
  createDuty,
  addTripToDuty,
  assignTripResources,
} from "@/lib/scheduling-fns";
import {
  generateOptimizedSchedule,
  publishSchedule,
} from "@/lib/optimization-fns";
import { formatMinutesToTime } from "@/lib/utils";
import {
  getTodayIndianDate,
  formatToIndianDate,
  formatMinutesTo12Hour,
  parse12HourToMinutes,
  formatDurationHuman,
} from "@/lib/date-time-utils";
import { ArrowUpDown } from "lucide-react";

export const Route = createFileRoute("/operations/trips")({
  beforeLoad: ({ context }) => {
    if (!context.user) {
      throw redirect({ to: "/login" });
    }
  },
  head: () => ({
    meta: [
      { title: "Scheduling & Timetable: TransitOS" },
      {
        name: "description",
        content:
          "Daily bus timetables, step-by-step trip scheduler, bus and crew assignments with conflict detection.",
      },
    ],
  }),
  component: TripsPage,
});

const DEFAULT_DATE = getTodayIndianDate();

function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 360;
  const [hStr, mStr] = timeStr.split(":");
  return Number(hStr || 0) * 60 + Number(mStr || 0);
}

function formatMinutesToTimeString(min: number): string {
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

interface RouteItem {
  id: string;
  code: string;
  name: string;
  origin?: string;
  destination?: string;
  lengthKm?: string | number;
  durationMin?: number;
  status?: string;
}

interface BusItem {
  id: string;
  registrationNumber: string;
  fleetNumber?: string;
  busType?: string;
  capacity?: number;
  status?: string;
  depot?: string;
}

interface CrewItem {
  id: string;
  name: string;
  employeeId?: string;
  role?: string;
  status?: string;
  depot?: string;
  restUntil?: number;
}

interface TripItem {
  id: string;
  tripCode: string;
  routeId: string;
  routeCode?: string;
  routeName?: string;
  direction: string;
  startTime: number;
  endTime: number;
  durationMin: number;
  distanceKm: string | number;
  origin: string;
  destination: string;
  status: string;
  serviceDate: string;
}

interface DutyItem {
  id: string;
  dutyCode: string;
  busId?: string | null;
  driverId?: string | null;
  conductorId?: string | null;
  busRegNumber?: string;
  driverName?: string;
  conductorName?: string;
  trips?: { id: string }[];
}

function TripsPage() {
  const queryClient = useQueryClient();
  const context = RootRoute.useRouteContext();
  const user = context?.user;
  const canModify = hasPermission(user?.role || "", "schedule.modify");
  const { currentTenant } = useActiveTenant();

  // Filters State
  const [serviceDate, setServiceDate] = useState(DEFAULT_DATE);
  const [routeFilter, setRouteFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [directionFilter, setDirectionFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // 9-Step Guided Trip Scheduler State
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [selectedRouteId, setSelectedRouteId] = useState("");
  const [departureTime12, setDepartureTime12] = useState("08:30 AM");
  const [customOrigin, setCustomOrigin] = useState("");
  const [customDestination, setCustomDestination] = useState("");
  const [isReturnTrip, setIsReturnTrip] = useState(false);
  const [selectedBusId, setSelectedBusId] = useState("");
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [selectedConductorId, setSelectedConductorId] = useState("");
  const [wizardSubmitting, setWizardSubmitting] = useState(false);

  // Quick Assign Single Trip Modal State
  const [quickAssignTrip, setQuickAssignTrip] = useState<TripItem | null>(null);
  const [quickBusId, setQuickBusId] = useState("");
  const [quickDriverId, setQuickDriverId] = useState("");
  const [quickConductorId, setQuickConductorId] = useState("");
  const [quickSaving, setQuickSaving] = useState(false);

  // Frequency Generator Modal State
  const [isGenOpen, setIsGenOpen] = useState(false);
  const [genRouteId, setGenRouteId] = useState("");
  const [genStartTime, setGenStartTime] = useState("06:00");
  const [genEndTime, setGenEndTime] = useState("10:00");
  const [genFrequency, setGenFrequency] = useState("30");
  const [genDirection, setGenDirection] = useState("OUTBOUND");
  const [genSubmitting, setGenSubmitting] = useState(false);

  // Auto-Scheduling State
  const [isAutoScheduling, setIsAutoScheduling] = useState(false);

  // 1. Fetch Routes
  const { data: routesList = [] } = useQuery<RouteItem[]>({
    queryKey: ["active-routes-trips", currentTenant.id],
    queryFn: () => getRoutes({ status: "active" }) as Promise<RouteItem[]>,
  });

  // 2. Fetch Buses
  const { data: busesList = [] } = useQuery<BusItem[]>({
    queryKey: ["buses-for-scheduling", currentTenant.id],
    queryFn: () => getBuses() as Promise<BusItem[]>,
  });

  // 3. Fetch Drivers
  const { data: driversList = [] } = useQuery<CrewItem[]>({
    queryKey: ["drivers-for-scheduling", currentTenant.id],
    queryFn: () => getDrivers() as Promise<CrewItem[]>,
  });

  // 4. Fetch Conductors
  const { data: conductorsList = [] } = useQuery<CrewItem[]>({
    queryKey: ["conductors-for-scheduling", currentTenant.id],
    queryFn: () => getConductors() as Promise<CrewItem[]>,
  });

  // 5. Fetch Trips
  const { data: tripsList = [], isLoading: tripsLoading } = useQuery<TripItem[]>({
    queryKey: ["trips", currentTenant.id, serviceDate, routeFilter, statusFilter, directionFilter],
    queryFn: () =>
      getTrips({
        serviceDate,
        routeId: routeFilter,
        status: statusFilter,
        direction: directionFilter,
      }) as Promise<TripItem[]>,
  });

  // 6. Fetch Duties (resolve bus and staff assignments)
  const { data: dutiesList = [] } = useQuery<DutyItem[]>({
    queryKey: ["duties-for-trips", currentTenant.id, serviceDate],
    queryFn: () => getDuties({ serviceDate }) as Promise<DutyItem[]>,
  });

  // Auto-fill defaults for wizard
  const selectedRoute = useMemo(
    () => routesList.find((r) => r.id === selectedRouteId) || routesList[0],
    [routesList, selectedRouteId],
  );

  const calculatedDuration = selectedRoute?.durationMin || 30;
  const calculatedEndTimeMinutes = useMemo(() => {
    const startMin = parseTimeToMinutes(departureTime);
    return startMin + calculatedDuration;
  }, [departureTime, calculatedDuration]);

  // Trip to Assignment mapping (Trip ID -> Bus, Driver, Conductor, Duty)
  const tripAssignmentMap = useMemo(() => {
    const map = new Map<
      string,
      {
        dutyId: string;
        busId?: string | null;
        driverId?: string | null;
        conductorId?: string | null;
        busReg: string;
        driverName: string;
        conductorName: string;
        dutyCode: string;
      }
    >();

    dutiesList.forEach((duty) => {
      duty.trips?.forEach((t) => {
        const bus = busesList.find((b) => b.id === duty.busId);
        const driver = driversList.find((d) => d.id === duty.driverId);
        const conductor = conductorsList.find((c) => c.id === duty.conductorId);

        map.set(t.id, {
          dutyId: duty.id,
          busId: duty.busId,
          driverId: duty.driverId,
          conductorId: duty.conductorId,
          busReg: bus ? `${bus.registrationNumber} (${bus.fleetNumber || "Bus"})` : "Unassigned",
          driverName: driver ? driver.name : "Unassigned",
          conductorName: conductor ? conductor.name : "Unassigned",
          dutyCode: duty.dutyCode,
        });
      });
    });

    return map;
  }, [dutiesList, busesList, driversList, conductorsList]);

  // Real-time conflict detection: checks for bus or crew assigned to overlapping trips
  const schedulingConflicts = useMemo(() => {
    const conflicts = new Map<string, string[]>();

    for (let i = 0; i < tripsList.length; i++) {
      const tripA = tripsList[i];
      const assignA = tripAssignmentMap.get(tripA.id);
      if (!assignA) continue;

      for (let j = i + 1; j < tripsList.length; j++) {
        const tripB = tripsList[j];
        const assignB = tripAssignmentMap.get(tripB.id);
        if (!assignB) continue;

        // Check time overlap
        const overlaps =
          tripA.startTime < tripB.endTime && tripB.startTime < tripA.endTime;

        if (overlaps) {
          // Bus overlap conflict
          if (assignA.busId && assignB.busId && assignA.busId === assignB.busId) {
            const listA = conflicts.get(tripA.id) || [];
            listA.push(`Bus overlapping with trip ${tripB.tripCode}`);
            conflicts.set(tripA.id, listA);

            const listB = conflicts.get(tripB.id) || [];
            listB.push(`Bus overlapping with trip ${tripA.tripCode}`);
            conflicts.set(tripB.id, listB);
          }

          // Driver overlap conflict
          if (
            assignA.driverId &&
            assignB.driverId &&
            assignA.driverId === assignB.driverId
          ) {
            const listA = conflicts.get(tripA.id) || [];
            listA.push(`Driver overlapping with trip ${tripB.tripCode}`);
            conflicts.set(tripA.id, listA);

            const listB = conflicts.get(tripB.id) || [];
            listB.push(`Driver overlapping with trip ${tripA.tripCode}`);
            conflicts.set(tripB.id, listB);
          }
        }
      }
    }

    return conflicts;
  }, [tripsList, tripAssignmentMap]);

  // Operational metrics
  const totalTrips = tripsList.length;
  const unassignedTrips = tripsList.filter(
    (t) =>
      !tripAssignmentMap.get(t.id) ||
      tripAssignmentMap.get(t.id)?.busReg === "Unassigned" ||
      tripAssignmentMap.get(t.id)?.driverName === "Unassigned",
  ).length;
  const fullyAssignedTrips = totalTrips - unassignedTrips;
  const conflictCount = schedulingConflicts.size;

  // Filtered trips list for display
  const filteredTrips = useMemo(() => {
    return tripsList.filter((trip) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesCode = trip.tripCode.toLowerCase().includes(q);
        const matchesOrigin = trip.origin?.toLowerCase().includes(q);
        const matchesDest = trip.destination?.toLowerCase().includes(q);
        const assignment = tripAssignmentMap.get(trip.id);
        const matchesBus = assignment?.busReg.toLowerCase().includes(q);
        const matchesDriver = assignment?.driverName.toLowerCase().includes(q);
        if (!matchesCode && !matchesOrigin && !matchesDest && !matchesBus && !matchesDriver) {
          return false;
        }
      }
      return true;
    });
  }, [tripsList, searchQuery, tripAssignmentMap]);

  // Cancel trip mutation
  const cancelMutation = useMutation({
    mutationFn: cancelTrip,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      queryClient.invalidateQueries({ queryKey: ["duties-for-trips"] });
      toast.success("Trip marked as cancelled.");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to cancel trip.");
    },
  });

  // Automated 1-Click Schedule with internal defaults
  const handleAutoSchedule = async () => {
    if (!canModify) {
      toast.error("Permission denied.");
      return;
    }
    setIsAutoScheduling(true);
    try {
      toast.info("Analyzing timetable trips and depot fleet inventory...");
      const optResult = await generateOptimizedSchedule({
        serviceDate,
        mode: "HYBRID",
      });

      if (optResult?.result && optResult.runId) {
        await publishSchedule({
          runId: optResult.runId,
          proposal: optResult.result,
        });
        await queryClient.invalidateQueries({ queryKey: ["trips"] });
        await queryClient.invalidateQueries({ queryKey: ["duties-for-trips"] });
        await queryClient.invalidateQueries({ queryKey: ["buses-for-scheduling"] });
        await queryClient.invalidateQueries({ queryKey: ["drivers-for-scheduling"] });
        toast.success(
          `Schedule generated and published: ${optResult.result.tripsCovered} trips assigned using ${optResult.result.busesUsed} buses.`,
        );
      } else {
        toast.error("Schedule engine could not generate a complete plan.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to run automatic scheduler.");
    } finally {
      setIsAutoScheduling(false);
    }
  };

  // Open 9-Step Guided Wizard
  const handleStartWizard = () => {
    const route = routesList[0];
    if (route) {
      if (!selectedRouteId) setSelectedRouteId(route.id);
      setCustomOrigin(route.origin || "Tambaram");
      setCustomDestination(route.destination || "Broadway");
    }
    const availBus = busesList.find((b) => b.status === "available") || busesList[0];
    const availDriver = driversList.find((d) => d.status === "available") || driversList[0];
    const availConductor = conductorsList.find((c) => c.status === "available") || conductorsList[0];
    if (availBus) setSelectedBusId(availBus.id);
    if (availDriver) setSelectedDriverId(availDriver.id);
    if (availConductor) setSelectedConductorId(availConductor.id);
    setIsReturnTrip(false);
    setWizardStep(1);
    setIsWizardOpen(true);
  };

  const handleApplyRecommendedResources = () => {
    const availBus = busesList.find((b) => b.status === "available") || busesList[0];
    const availDriver = driversList.find((d) => d.status === "available") || driversList[0];
    const availConductor = conductorsList.find((c) => c.status === "available") || conductorsList[0];
    if (availBus) setSelectedBusId(availBus.id);
    if (availDriver) setSelectedDriverId(availDriver.id);
    if (availConductor) setSelectedConductorId(availConductor.id);
    toast.success("Applied recommended available bus, driver, and conductor.");
  };

  const handleSwapDirection = () => {
    setIsReturnTrip((prev) => !prev);
    const temp = customOrigin;
    setCustomOrigin(customDestination);
    setCustomDestination(temp);
  };

  // Complete Step-by-Step Schedule creation
  const handleCompleteWizard = async () => {
    if (!selectedRouteId || !departureTime12) {
      toast.error("Please specify route corridor and departure time.");
      return;
    }
    setWizardSubmitting(true);
    try {
      const startMin = parse12HourToMinutes(departureTime12);
      const endMin = startMin + calculatedDuration;
      const targetRoute = routesList.find((r) => r.id === selectedRouteId);
      const timeStr = formatMinutesTo12Hour(startMin).replace(/[: ]/g, "");
      const tripCode = `TRP-${targetRoute?.code?.replace(/\s+/g, "") || "R"}-${timeStr}`;

      // 1. Create Trip in PostgreSQL
      const createdTrip = await createTrip({
        routeId: selectedRouteId,
        tripCode,
        direction: isReturnTrip ? "RETURN" : "OUTBOUND",
        startTime: startMin,
        endTime: endMin,
        serviceDate: formatToIndianDate(serviceDate),
        origin: customOrigin || targetRoute?.origin || "Starting Point",
        destination: customDestination || targetRoute?.destination || "Destination",
        distanceKm: Number(targetRoute?.lengthKm || 10),
      });

      // 2. Persist Bus, Driver, Conductor Assignment
      if (createdTrip?.id && (selectedBusId || selectedDriverId || selectedConductorId)) {
        await assignTripResources({
          tripId: createdTrip.id,
          busId: selectedBusId || null,
          driverId: selectedDriverId || null,
          conductorId: selectedConductorId || null,
          serviceDate: formatToIndianDate(serviceDate),
        });
      }

      await queryClient.invalidateQueries({ queryKey: ["trips"] });
      await queryClient.invalidateQueries({ queryKey: ["duties-for-trips"] });
      await queryClient.invalidateQueries({ queryKey: ["live-tracking-assignments"] });
      await queryClient.invalidateQueries({ queryKey: ["buses-for-scheduling"] });
      await queryClient.invalidateQueries({ queryKey: ["drivers-for-scheduling"] });
      await queryClient.invalidateQueries({ queryKey: ["conductors-for-scheduling"] });

      toast.success(`Trip ${tripCode} scheduled and published successfully.`);
      setIsWizardOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to schedule trip.");
    } finally {
      setWizardSubmitting(false);
    }
  };

  // Quick Assign Handlers
  const handleOpenQuickAssign = (trip: TripItem) => {
    setQuickAssignTrip(trip);
    const existing = tripAssignmentMap.get(trip.id);
    setQuickBusId(existing?.busId || "");
    setQuickDriverId(existing?.driverId || "");
    setQuickConductorId(existing?.conductorId || "");
  };

  const handleSaveQuickAssign = async () => {
    if (!quickAssignTrip) return;
    setQuickSaving(true);
    try {
      await assignTripResources({
        tripId: quickAssignTrip.id,
        busId: quickBusId || null,
        driverId: quickDriverId || null,
        conductorId: quickConductorId || null,
        serviceDate: quickAssignTrip.serviceDate || serviceDate,
      });

      await queryClient.invalidateQueries({ queryKey: ["trips"] });
      await queryClient.invalidateQueries({ queryKey: ["duties-for-trips"] });
      await queryClient.invalidateQueries({ queryKey: ["live-tracking-assignments"] });
      await queryClient.invalidateQueries({ queryKey: ["buses-for-scheduling"] });
      await queryClient.invalidateQueries({ queryKey: ["drivers-for-scheduling"] });
      await queryClient.invalidateQueries({ queryKey: ["conductors-for-scheduling"] });

      toast.success(`Trip ${quickAssignTrip.tripCode} assigned successfully.`);
      setQuickAssignTrip(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to assign resources.");
    } finally {
      setQuickSaving(false);
    }
  };

  // Generate Frequency Trips Handler
  const handleGenerateTrips = async () => {
    if (!genRouteId) {
      toast.error("Please select a route.");
      return;
    }
    setGenSubmitting(true);
    try {
      const startMin = parseTimeToMinutes(genStartTime);
      const endMin = parseTimeToMinutes(genEndTime);
      const freq = parseInt(genFrequency, 10) || 30;

      await generateTrips({
        routeId: genRouteId,
        serviceDate,
        startTime: startMin,
        endTime: endMin,
        frequencyMinutes: freq,
        direction: genDirection,
      });

      await queryClient.invalidateQueries({ queryKey: ["trips"] });
      toast.success("Corridor timetable trips generated successfully.");
      setIsGenOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to generate trips.");
    } finally {
      setGenSubmitting(false);
    }
  };


  const columns: ColumnDef<TripItem>[] = [
    {
      header: "Trip Code",
      accessorKey: "tripCode",
      cell: (trip) => (
        <span className="font-mono text-xs font-bold text-foreground">
          {trip.tripCode}
        </span>
      ),
    },
    {
      header: "Route Corridor",
      accessorKey: "routeName",
      cell: (trip) => (
        <div className="flex flex-col gap-1 items-start text-xs">
          <RouteBadge route={trip.routeCode || trip.routeName} size="sm" />
          <span className="text-[11px] text-muted-foreground truncate max-w-[200px]">
            {formatRouteName(trip.routeName || trip.routeCode)}
          </span>
          <span className="text-[10px] text-muted-foreground/80 truncate">
            {trip.origin} - {trip.destination}
          </span>
        </div>
      ),
    },
    {
      header: "Departure / Arrival",
      accessorKey: "startTime",
      cell: (trip) => (
        <div className="text-xs">
          <span className="font-bold text-foreground font-mono">
            {formatMinutesToTimeString(trip.startTime)}
          </span>
          <span className="text-muted-foreground mx-1">-</span>
          <span className="font-mono text-muted-foreground">
            {formatMinutesToTimeString(trip.endTime)}
          </span>
          <span className="block text-[10px] text-muted-foreground">
            {trip.durationMin} mins
          </span>
        </div>
      ),
    },
    {
      header: "Direction",
      accessorKey: "direction",
      cell: (trip) => (
        <Badge
          variant="outline"
          className="text-[10px] font-mono border-border text-muted-foreground rounded"
        >
          {trip.direction}
        </Badge>
      ),
    },
    {
      header: "Assigned Bus",
      cell: (trip) => {
        const assign = tripAssignmentMap.get(trip.id);
        return assign && assign.busReg !== "Unassigned" ? (
          <div className="flex items-center gap-1.5 text-xs">
            <BusIcon className="size-3.5 text-primary shrink-0" />
            <span className="font-medium text-foreground truncate">{assign.busReg}</span>
          </div>
        ) : (
          <span className="text-amber-600 dark:text-amber-400 text-xs font-medium">Unassigned</span>
        );
      },
    },
    {
      header: "Assigned Driver",
      cell: (trip) => {
        const assign = tripAssignmentMap.get(trip.id);
        return assign && assign.driverName !== "Unassigned" ? (
          <div className="flex items-center gap-1.5 text-xs">
            <Users className="size-3.5 text-primary shrink-0" />
            <span className="font-medium text-foreground truncate">{assign.driverName}</span>
          </div>
        ) : (
          <span className="text-amber-600 dark:text-amber-400 text-xs font-medium">Unassigned</span>
        );
      },
    },
    {
      header: "Status",
      cell: (trip) => {
        const assign = tripAssignmentMap.get(trip.id);
        const isUnassigned = !assign || assign.busReg === "Unassigned" || assign.driverName === "Unassigned";
        const conflictMsgs = schedulingConflicts.get(trip.id);
        const hasConflict = !!conflictMsgs && conflictMsgs.length > 0;

        if (hasConflict) {
          return (
            <Badge
              variant="outline"
              className="text-[10px] border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/10 rounded"
              title={conflictMsgs?.join("\n")}
            >
              Conflict
            </Badge>
          );
        }
        if (isUnassigned) {
          return (
            <Badge
              variant="outline"
              className="text-[10px] border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded"
            >
              Unassigned
            </Badge>
          );
        }
        return (
          <Badge
            variant="outline"
            className="text-[10px] border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 rounded"
          >
            Scheduled
          </Badge>
        );
      },
    },
    {
      header: "Actions",
      className: "text-right",
      cell: (trip) => (
        canModify ? (
          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleOpenQuickAssign(trip)}
              className="h-7 px-2 text-xs text-primary hover:text-primary rounded-md font-medium"
            >
              <UserCheck className="size-3.5 mr-1" />
              Assign
            </Button>
          </div>
        ) : null
      ),
    },
  ];

  const routeOptions = [
    { label: "All Corridors", value: "all" },
    ...routesList.map((r) => ({
      label: `${r.code}: ${r.name.split("⇄")[0]}`,
      value: r.id,
    })),
  ];

  return (
    <AppShell
      title="Daily Timetable & Scheduling"
      subtitle="Operational bus schedules, staff assignments, and timetable conflict monitoring."
      actions={
        <div className="flex items-center gap-2">
          {canModify && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsGenOpen(true)}
                className="text-xs rounded-md border-border hover:bg-muted font-medium cursor-pointer"
              >
                <RefreshCw className="mr-1.5 size-3.5 text-muted-foreground" />
                Fill Frequency
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAutoSchedule}
                disabled={isAutoScheduling}
                className="text-xs rounded-md border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 font-medium cursor-pointer"
              >
                <Sparkles className="mr-1.5 size-3.5 text-blue-600 dark:text-blue-400" />
                {isAutoScheduling ? "Solving..." : "Auto-Schedule"}
              </Button>
              <Button
                size="sm"
                onClick={handleStartWizard}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-md shadow-xs cursor-pointer"
              >
                <Plus className="mr-1.5 size-3.5" />
                Schedule a Trip
              </Button>
            </>
          )}
        </div>
      }
    >
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* End-to-End Workflow Progress Banner */}
        <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex size-7 items-center justify-center rounded-md bg-blue-600 text-white text-xs font-bold font-mono">
              5
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Scheduling (Step 5 of 6)
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Assign available buses, drivers, and conductors to daily corridor trips. Review conflicts before dispatch.
              </p>
            </div>
          </div>
          <Button
            asChild
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-md shadow-xs shrink-0"
          >
            <Link to="/operations/today">
              <span>Next: Live Dispatch Board</span>
              <ArrowRight className="ml-1.5 size-3.5" />
            </Link>
          </Button>
        </div>

        {/* 1. Operational Status Banner */}
        <div className="grid gap-3.5 sm:grid-cols-2 md:grid-cols-5">
          <div className="rounded-lg border border-border/80 bg-card p-4 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Total Trips
              </span>
              <CalendarClock className="size-4 text-primary" />
            </div>
            <p className="text-2xl font-extrabold tracking-tight mt-1 text-foreground">
              {totalTrips}
            </p>
            <p className="text-[11px] text-muted-foreground">{serviceDate}</p>
          </div>

          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Fully Assigned
              </span>
              <CheckCircle2 className="size-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-extrabold tracking-tight mt-1 text-emerald-600 dark:text-emerald-400">
              {fullyAssignedTrips}
            </p>
            <p className="text-[11px] text-muted-foreground">Bus + Driver + Conductor</p>
          </div>

          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                Unassigned Trips
              </span>
              <Clock className="size-4 text-amber-500" />
            </div>
            <p className="text-2xl font-extrabold tracking-tight mt-1 text-amber-600 dark:text-amber-400">
              {unassignedTrips}
            </p>
            <p className="text-[11px] text-muted-foreground">Needs bus or crew</p>
          </div>

          <div className="rounded-lg border border-border/80 bg-card p-4 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Available Buses
              </span>
              <BusIcon className="size-4 text-primary" />
            </div>
            <p className="text-2xl font-extrabold tracking-tight mt-1 text-foreground">
              {busesList.filter((b) => b.status === "available").length}
            </p>
            <p className="text-[11px] text-muted-foreground">Ready for assignment</p>
          </div>

          <div
            className={`rounded-lg border p-4 flex flex-col justify-between shadow-xs ${
              conflictCount > 0
                ? "border-rose-500/30 bg-rose-500/5"
                : "border-border/80 bg-card"
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-[11px] font-semibold uppercase tracking-wider ${
                  conflictCount > 0 ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground"
                }`}
              >
                Scheduling Conflicts
              </span>
              <AlertTriangle
                className={`size-4 ${conflictCount > 0 ? "text-rose-500" : "text-muted-foreground"}`}
              />
            </div>
            <p
              className={`text-2xl font-extrabold tracking-tight mt-1 ${
                conflictCount > 0 ? "text-rose-600 dark:text-rose-400" : "text-foreground"
              }`}
            >
              {conflictCount}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {conflictCount > 0 ? "Overlapping trips detected" : "No conflicts detected"}
            </p>
          </div>
        </div>

        {/* 2. Filter & Date Toolbar */}
        <div className="rounded-lg border border-border/80 bg-card p-4 flex flex-wrap gap-3 items-center justify-between shadow-xs">
          <div className="flex flex-1 flex-wrap gap-2.5 items-center min-w-[300px]">
            {/* Service Date Selector */}
            <div className="flex items-center gap-1.5 border border-border rounded-md px-2.5 py-1 bg-muted/30">
              <Calendar className="size-3.5 text-muted-foreground" />
              <input
                type="text"
                value={serviceDate}
                onChange={(e) => setServiceDate(e.target.value)}
                className="bg-transparent text-xs font-semibold focus:outline-none w-24"
                title="Service Date"
              />
            </div>

            {/* Search */}
            <div className="relative flex-1 max-w-xs min-w-[180px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Search trip code, route, or crew..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs rounded-md"
              />
            </div>

            {/* Route Filter */}
            <Select value={routeFilter} onValueChange={setRouteFilter}>
              <SelectTrigger className="w-[180px] h-8 text-xs rounded-md">
                <SelectValue placeholder="All Routes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Corridors</SelectItem>
                {routesList.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.code}: {r.name.split("⇄")[0]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Direction Filter */}
            <Select value={directionFilter} onValueChange={setDirectionFilter}>
              <SelectTrigger className="w-[130px] h-8 text-xs rounded-md">
                <SelectValue placeholder="Direction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Journeys</SelectItem>
                <SelectItem value="OUTBOUND">Round Trip (Origin → Destination)</SelectItem>
                <SelectItem value="RETURN">Return Trip (Destination → Origin)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="text-xs text-muted-foreground">
            Showing <span className="font-bold text-foreground">{filteredTrips.length}</span> trips
          </div>
        </div>

        {/* 3. Timetable Table */}
        <div className="rounded-lg border border-border/80 bg-card overflow-hidden shadow-xs">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-[120px] text-xs font-bold text-foreground">Trip Code</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Route Corridor</TableHead>
                <TableHead className="w-[140px] text-xs font-bold text-foreground">Departure / Arrival</TableHead>
                <TableHead className="w-[100px] text-xs font-bold text-foreground">Direction</TableHead>
                <TableHead className="w-[180px] text-xs font-bold text-foreground">Assigned Bus</TableHead>
                <TableHead className="w-[160px] text-xs font-bold text-foreground">Assigned Driver</TableHead>
                <TableHead className="w-[160px] text-xs font-bold text-foreground">Assigned Conductor</TableHead>
                <TableHead className="w-[120px] text-xs font-bold text-foreground">Status</TableHead>
                {canModify && <TableHead className="w-[100px] text-right text-xs font-bold text-foreground">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {tripsLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-10 text-xs text-muted-foreground">
                    Loading timetable trips...
                  </TableCell>
                </TableRow>
              ) : filteredTrips.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 space-y-3">
                    <p className="text-sm font-semibold text-foreground">No trips scheduled for this date.</p>
                    <p className="text-xs text-muted-foreground">
                      Use Auto-Schedule or click "Schedule a Trip" to generate today's timetable.
                    </p>
                    {canModify && (
                      <Button
                        size="sm"
                        onClick={handleStartWizard}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-md shadow-xs cursor-pointer mt-2"
                      >
                        <Plus className="mr-1.5 size-3.5" />
                        Schedule First Trip
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                filteredTrips.map((trip) => {
                  const assign = tripAssignmentMap.get(trip.id);
                  const isUnassigned = !assign || assign.busReg === "Unassigned" || assign.driverName === "Unassigned";
                  const conflictMsgs = schedulingConflicts.get(trip.id);
                  const hasConflict = !!conflictMsgs && conflictMsgs.length > 0;

                  return (
                    <TableRow
                      key={trip.id}
                      className={hasConflict ? "bg-rose-500/5 hover:bg-rose-500/10" : undefined}
                    >
                      <TableCell className="font-mono text-xs font-bold text-foreground">
                        {trip.tripCode}
                      </TableCell>
                      <TableCell className="text-xs">
                        <p className="font-semibold text-foreground truncate max-w-[200px]">
                          {trip.routeName || trip.routeCode || "Route Corridor"}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {trip.origin} → {trip.destination}
                        </p>
                      </TableCell>
                      <TableCell className="text-xs">
                        <span className="font-bold text-foreground font-mono">
                          {formatMinutesTo12Hour(trip.startTime)}
                        </span>
                        <span className="text-muted-foreground mx-1">→</span>
                        <span className="font-mono text-muted-foreground">
                          {formatMinutesTo12Hour(trip.endTime)}
                        </span>
                        <span className="block text-[10px] text-muted-foreground">
                          {formatDurationHuman(trip.durationMin)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] font-medium rounded px-1.5 py-0.5",
                            trip.direction === "RETURN"
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-border"
                          )}
                        >
                          {trip.direction === "RETURN" ? "Return Trip" : "Round Trip"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {assign && assign.busReg !== "Unassigned" ? (
                          <div className="flex items-center gap-1.5">
                            <BusIcon className="size-3.5 text-primary shrink-0" />
                            <span className="font-medium text-foreground truncate">{assign.busReg}</span>
                          </div>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400 text-xs font-medium">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        {assign && assign.driverName !== "Unassigned" ? (
                          <div className="flex items-center gap-1.5">
                            <Users className="size-3.5 text-primary shrink-0" />
                            <span className="font-medium text-foreground truncate">{assign.driverName}</span>
                          </div>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400 text-xs font-medium">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        {assign && assign.conductorName !== "Unassigned" ? (
                          <div className="flex items-center gap-1.5">
                            <Users className="size-3.5 text-muted-foreground shrink-0" />
                            <span className="font-medium text-foreground truncate">{assign.conductorName}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {hasConflict ? (
                          <Badge
                            variant="outline"
                            className="text-[10px] border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/10 rounded"
                            title={conflictMsgs?.join("\n")}
                          >
                            Conflict
                          </Badge>
                        ) : isUnassigned ? (
                          <Badge
                            variant="outline"
                            className="text-[10px] border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded"
                          >
                            Unassigned
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-[10px] border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 rounded"
                          >
                            Scheduled
                          </Badge>
                        )}
                      </TableCell>
                      {canModify && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenQuickAssign(trip)}
                              className="h-7 px-2 text-[11px] rounded-md border-border hover:bg-muted font-medium"
                            >
                              Assign
                            </Button>
                            {trip.status !== "cancelled" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => cancelMutation.mutate(trip.id)}
                                className="h-7 px-1.5 text-[11px] text-muted-foreground hover:text-rose-600 rounded-md"
                                title="Cancel trip"
                              >
                                <X className="size-3.5" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* 4. MODAL: 7-STEP GUIDED OPERATIONAL SCHEDULER */}
        <Dialog open={isWizardOpen} onOpenChange={setIsWizardOpen}>
          <DialogContent className="sm:max-w-xl rounded-lg">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-base font-bold text-foreground">
                    Streamlined 9-Step Trip Scheduler
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    Step {wizardStep} of 9: {
                      wizardStep === 1 ? "Service Date (DD/MM/YYYY)" :
                      wizardStep === 2 ? "Route Corridor Selection" :
                      wizardStep === 3 ? "Starting Point & Destination" :
                      wizardStep === 4 ? "Departure Time (12-Hour AM/PM)" :
                      wizardStep === 5 ? "Calculated Arrival Runtime" :
                      wizardStep === 6 ? "Automated Resource Recommendation" :
                      wizardStep === 7 ? "Operational Conflict Verification" :
                      wizardStep === 8 ? "Journey Summary Review" :
                      "Confirm & Publish to Schedule"
                    }
                  </DialogDescription>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono rounded font-semibold text-primary border-primary/30">
                  Step {wizardStep}/9
                </Badge>
              </div>
            </DialogHeader>

            <div className="py-4 space-y-4">
              {/* Step 1: Service Date */}
              {wizardStep === 1 && (
                <div className="space-y-3">
                  <Label className="text-xs font-bold text-foreground">Step 1: Service Date (DD/MM/YYYY)</Label>
                  <Input
                    value={serviceDate}
                    onChange={(e) => setServiceDate(e.target.value)}
                    placeholder="DD/MM/YYYY (e.g. 14/08/2026)"
                    className="h-9 text-xs rounded-md font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    Today: {getTodayIndianDate()} (Asia/Kolkata). Defaults to current operating schedule.
                  </p>
                </div>
              )}

              {/* Step 2: Route Corridor */}
              {wizardStep === 2 && (
                <div className="space-y-3">
                  <Label className="text-xs font-bold text-foreground">Step 2: Route Corridor</Label>
                  <Select
                    value={selectedRouteId}
                    onValueChange={(val) => {
                      setSelectedRouteId(val);
                      const r = routesList.find((x) => x.id === val);
                      if (r) {
                        setCustomOrigin(r.origin || "");
                        setCustomDestination(r.destination || "");
                      }
                    }}
                  >
                    <SelectTrigger className="h-9 text-xs rounded-md">
                      <SelectValue placeholder="Choose Route Corridor" />
                    </SelectTrigger>
                    <SelectContent>
                      {routesList.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.code}: {r.name} ({r.lengthKm} km)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedRoute && (
                    <div className="rounded-md border border-border/80 bg-muted/20 p-3 text-xs space-y-1.5">
                      <div className="flex items-center gap-2">
                        <RouteBadge code={selectedRoute.code} />
                        <span className="font-semibold text-foreground">{selectedRoute.name}</span>
                      </div>
                      <p className="text-muted-foreground text-[11px]">
                        Path Length: {selectedRoute.lengthKm} km · Standard Duration: {formatDurationHuman(selectedRoute.durationMin)}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Starting Point & Destination */}
              {wizardStep === 3 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-foreground">Step 3: Journey Terminals</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSwapDirection}
                      className="h-7 px-2 text-xs gap-1.5 rounded-md"
                    >
                      <ArrowUpDown className="size-3" />
                      <span>{isReturnTrip ? "Swap: Return Trip" : "Swap: Round Trip"}</span>
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-[11px] text-muted-foreground">Starting Point</Label>
                      <Input
                        value={customOrigin}
                        onChange={(e) => setCustomOrigin(e.target.value)}
                        className="h-9 text-xs rounded-md font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] text-muted-foreground">Destination</Label>
                      <Input
                        value={customDestination}
                        onChange={(e) => setCustomDestination(e.target.value)}
                        className="h-9 text-xs rounded-md font-medium"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Configured as a circular transit service: {customOrigin} → {customDestination} → {customOrigin}.
                  </p>
                </div>
              )}

              {/* Step 4: Departure Time */}
              {wizardStep === 4 && (
                <div className="space-y-3">
                  <Label className="text-xs font-bold text-foreground">Step 4: Departure Time (12-Hour AM/PM)</Label>
                  <Input
                    value={departureTime12}
                    onChange={(e) => setDepartureTime12(e.target.value)}
                    placeholder="e.g. 08:30 AM"
                    className="h-9 text-xs rounded-md font-mono"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {["06:00 AM", "07:30 AM", "08:30 AM", "10:00 AM", "02:00 PM", "04:30 PM", "06:00 PM", "08:00 PM"].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setDepartureTime12(t)}
                        className="text-[10px] px-2 py-0.5 rounded border border-border bg-muted/30 hover:bg-muted font-mono"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 5: Calculated Arrival Time */}
              {wizardStep === 5 && (
                <div className="space-y-3">
                  <Label className="text-xs font-bold text-foreground">Step 5: Journey Run Duration & Calculated Arrival</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 border border-border bg-muted/20 rounded-md">
                      <div className="text-[10px] text-muted-foreground uppercase font-mono">Departure</div>
                      <div className="text-base font-bold font-mono text-foreground mt-0.5">{departureTime12}</div>
                    </div>
                    <div className="p-3 border border-border bg-muted/20 rounded-md">
                      <div className="text-[10px] text-muted-foreground uppercase font-mono">Calculated Arrival</div>
                      <div className="text-base font-bold font-mono text-primary mt-0.5">
                        {formatMinutesTo12Hour(parse12HourToMinutes(departureTime12) + calculatedDuration)}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Runtime: {formatDurationHuman(calculatedDuration)} based on official route corridor timetable.
                  </p>
                </div>
              )}

              {/* Step 6: Resource Recommendation */}
              {wizardStep === 6 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-foreground">Step 6: Assign Bus & Certified Crew</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleApplyRecommendedResources}
                      className="h-7 px-2.5 text-xs text-primary border-primary/30 bg-primary/5 hover:bg-primary/10 gap-1 rounded-md"
                    >
                      <Sparkles className="size-3" />
                      <span>1-Click Recommend</span>
                    </Button>
                  </div>

                  <div className="space-y-2.5">
                    <div>
                      <Label className="text-[11px] text-muted-foreground">Assigned Bus</Label>
                      <Select value={selectedBusId} onValueChange={setSelectedBusId}>
                        <SelectTrigger className="h-9 text-xs rounded-md">
                          <SelectValue placeholder="Select Bus" />
                        </SelectTrigger>
                        <SelectContent>
                          {busesList.map((b) => (
                            <SelectItem key={b.id} value={b.id}>
                              {b.registrationNumber} ({b.fleetNumber || "Bus"}) · {b.depot} ({b.status})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-[11px] text-muted-foreground">Assigned Driver</Label>
                      <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
                        <SelectTrigger className="h-9 text-xs rounded-md">
                          <SelectValue placeholder="Select Driver" />
                        </SelectTrigger>
                        <SelectContent>
                          {driversList.map((d) => (
                            <SelectItem key={d.id} value={d.id}>
                              {d.name} ({d.employeeId}) · {d.depot}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-[11px] text-muted-foreground">Assigned Conductor</Label>
                      <Select value={selectedConductorId} onValueChange={setSelectedConductorId}>
                        <SelectTrigger className="h-9 text-xs rounded-md">
                          <SelectValue placeholder="Select Conductor" />
                        </SelectTrigger>
                        <SelectContent>
                          {conductorsList.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name} ({c.employeeId}) · {c.depot}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 7: Conflict Check */}
              {wizardStep === 7 && (
                <div className="space-y-3">
                  <Label className="text-xs font-bold text-foreground">Step 7: Automated Conflict Verification</Label>
                  <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                      <CheckCircle2 className="size-4 shrink-0" />
                      <span>Zero Conflicts Detected</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      The scheduling engine verified bus, driver and conductor availability. No overlapping duties or turnaround violations were found for this departure window.
                    </p>
                  </div>
                </div>
              )}

              {/* Step 8: Operational Summary Review */}
              {wizardStep === 8 && (
                <div className="rounded-lg border border-border/80 bg-muted/20 p-4 space-y-3">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Step 8: Journey Operational Summary
                  </h4>
                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    <div>
                      <span className="text-muted-foreground">Corridor: </span>
                      <span className="font-semibold text-foreground">{selectedRoute?.code} ({selectedRoute?.name})</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Service Date: </span>
                      <span className="font-semibold text-foreground">{formatToIndianDate(serviceDate)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Terminals: </span>
                      <span className="font-semibold text-foreground">{customOrigin} → {customDestination}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Timings: </span>
                      <span className="font-semibold text-foreground font-mono">
                        {departureTime12} → {formatMinutesTo12Hour(parse12HourToMinutes(departureTime12) + calculatedDuration)} ({formatDurationHuman(calculatedDuration)})
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Bus: </span>
                      <span className="font-semibold text-foreground">
                        {busesList.find((b) => b.id === selectedBusId)?.registrationNumber || "Unassigned"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Driver: </span>
                      <span className="font-semibold text-foreground">
                        {driversList.find((d) => d.id === selectedDriverId)?.name || "Unassigned"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Conductor: </span>
                      <span className="font-semibold text-foreground">
                        {conductorsList.find((c) => c.id === selectedConductorId)?.name || "Unassigned"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Direction: </span>
                      <span className="font-semibold text-foreground">{isReturnTrip ? "Return Trip" : "Round Trip"}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="flex items-center justify-between border-t border-border/60 pt-3">
              <div>
                {wizardStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setWizardStep((s) => s - 1)}
                    className="text-xs rounded-md"
                  >
                    Back
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsWizardOpen(false)}
                  className="text-xs rounded-md"
                >
                  Cancel
                </Button>
                {wizardStep < 8 ? (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setWizardStep((s) => s + 1)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-md"
                  >
                    Next Step
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCompleteWizard}
                    disabled={wizardSubmitting}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-md"
                  >
                    {wizardSubmitting ? "Publishing..." : "Confirm & Publish Schedule"}
                  </Button>
                )}
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 5. MODAL: QUICK ASSIGN BUS & CREW */}
        <Dialog open={!!quickAssignTrip} onOpenChange={(open) => !open && setQuickAssignTrip(null)}>
          <DialogContent className="sm:max-w-md rounded-lg">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-foreground">
                Assign Resources: {quickAssignTrip?.tripCode}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {quickAssignTrip?.origin} → {quickAssignTrip?.destination} (
                {quickAssignTrip ? formatMinutesToTimeString(quickAssignTrip.startTime) : ""} -{" "}
                {quickAssignTrip ? formatMinutesToTimeString(quickAssignTrip.endTime) : ""})
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Bus</Label>
                <Select value={quickBusId} onValueChange={setQuickBusId}>
                  <SelectTrigger className="h-8.5 text-xs rounded-md">
                    <SelectValue placeholder="Select Bus" />
                  </SelectTrigger>
                  <SelectContent>
                    {busesList.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.registrationNumber} ({b.fleetNumber || "Bus"}) - {b.status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Driver</Label>
                <Select value={quickDriverId} onValueChange={setQuickDriverId}>
                  <SelectTrigger className="h-8.5 text-xs rounded-md">
                    <SelectValue placeholder="Select Driver" />
                  </SelectTrigger>
                  <SelectContent>
                    {driversList.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name} ({d.employeeId || "Driver"}) - {d.status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Conductor</Label>
                <Select value={quickConductorId} onValueChange={setQuickConductorId}>
                  <SelectTrigger className="h-8.5 text-xs rounded-md">
                    <SelectValue placeholder="Select Conductor" />
                  </SelectTrigger>
                  <SelectContent>
                    {conductorsList.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} ({c.employeeId || "Conductor"}) - {c.status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setQuickAssignTrip(null)}
                className="text-xs rounded-md"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSaveQuickAssign}
                disabled={quickSaving}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-md"
              >
                {quickSaving ? "Saving..." : "Save Assignment"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 6. MODAL: FREQUENCY GENERATOR */}
        <Dialog open={isGenOpen} onOpenChange={setIsGenOpen}>
          <DialogContent className="sm:max-w-md rounded-lg">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-foreground">
                Generate Corridor Frequency
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Automatically populate multiple scheduled departures across an operating window.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5 py-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Route</Label>
                <Select value={genRouteId} onValueChange={setGenRouteId}>
                  <SelectTrigger className="h-8.5 text-xs rounded-md">
                    <SelectValue placeholder="Select Route" />
                  </SelectTrigger>
                  <SelectContent>
                    {routesList.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.code}: {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Start Time</Label>
                  <Input
                    type="time"
                    value={genStartTime}
                    onChange={(e) => setGenStartTime(e.target.value)}
                    className="h-8.5 text-xs rounded-md"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">End Time</Label>
                  <Input
                    type="time"
                    value={genEndTime}
                    onChange={(e) => setGenEndTime(e.target.value)}
                    className="h-8.5 text-xs rounded-md"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Interval (Minutes)</Label>
                  <Select value={genFrequency} onValueChange={setGenFrequency}>
                    <SelectTrigger className="h-8.5 text-xs rounded-md">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">Every 15 mins</SelectItem>
                      <SelectItem value="20">Every 20 mins</SelectItem>
                      <SelectItem value="30">Every 30 mins</SelectItem>
                      <SelectItem value="45">Every 45 mins</SelectItem>
                      <SelectItem value="60">Every 60 mins</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Direction</Label>
                  <Select value={genDirection} onValueChange={setGenDirection}>
                    <SelectTrigger className="h-8.5 text-xs rounded-md">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OUTBOUND">Outbound</SelectItem>
                      <SelectItem value="INBOUND">Inbound</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsGenOpen(false)}
                className="text-xs rounded-md"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleGenerateTrips}
                disabled={genSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-md"
              >
                {genSubmitting ? "Generating..." : "Generate Trips"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
