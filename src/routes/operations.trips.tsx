import { createFileRoute, Link } from "@tanstack/react-router";
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
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { TransitTable, ColumnDef } from "@/components/ui/transit-table";
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
} from "@/lib/scheduling-fns";
import {
  generateOptimizedSchedule,
  publishSchedule,
} from "@/lib/optimization-fns";
import { formatMinutesToTime } from "@/lib/utils";

export const Route = createFileRoute("/operations/trips")({
  beforeLoad: ({ context }) => {
    if (!context.user || !hasPermission(context.user.role, "schedule.view")) {
      throw new Error("Forbidden");
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

const DEFAULT_DATE = "25 Aug 2026";

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

  // Filters State
  const [serviceDate, setServiceDate] = useState(DEFAULT_DATE);
  const [routeFilter, setRouteFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [directionFilter, setDirectionFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // 7-Step Guided Trip Scheduler State
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [selectedRouteId, setSelectedRouteId] = useState("");
  const [departureTime, setDepartureTime] = useState("06:30");
  const [scheduleDirection, setScheduleDirection] = useState("OUTBOUND");
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
    queryKey: ["active-routes-trips"],
    queryFn: () => getRoutes({ status: "active" }) as Promise<RouteItem[]>,
  });

  // 2. Fetch Buses
  const { data: busesList = [] } = useQuery<BusItem[]>({
    queryKey: ["buses-for-scheduling"],
    queryFn: () => getBuses() as Promise<BusItem[]>,
  });

  // 3. Fetch Drivers
  const { data: driversList = [] } = useQuery<CrewItem[]>({
    queryKey: ["drivers-for-scheduling"],
    queryFn: () => getDrivers() as Promise<CrewItem[]>,
  });

  // 4. Fetch Conductors
  const { data: conductorsList = [] } = useQuery<CrewItem[]>({
    queryKey: ["conductors-for-scheduling"],
    queryFn: () => getConductors() as Promise<CrewItem[]>,
  });

  // 5. Fetch Trips
  const { data: tripsList = [], isLoading: tripsLoading } = useQuery<TripItem[]>({
    queryKey: ["trips", serviceDate, routeFilter, statusFilter, directionFilter],
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
    queryKey: ["duties-for-trips", serviceDate],
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

  // Open 7-Step Guided Wizard
  const handleStartWizard = () => {
    if (routesList.length > 0 && !selectedRouteId) {
      setSelectedRouteId(routesList[0].id);
    }
    if (busesList.length > 0 && !selectedBusId) {
      const avail = busesList.find((b) => b.status === "available") || busesList[0];
      setSelectedBusId(avail?.id || "");
    }
    if (driversList.length > 0 && !selectedDriverId) {
      const avail = driversList.find((d) => d.status === "available") || driversList[0];
      setSelectedDriverId(avail?.id || "");
    }
    if (conductorsList.length > 0 && !selectedConductorId) {
      const avail = conductorsList.find((c) => c.status === "available") || conductorsList[0];
      setSelectedConductorId(avail?.id || "");
    }
    setWizardStep(1);
    setIsWizardOpen(true);
  };

  // Complete Step-by-Step Schedule creation
  const handleCompleteWizard = async () => {
    if (!selectedRouteId || !departureTime) {
      toast.error("Please specify route and departure time.");
      return;
    }
    setWizardSubmitting(true);
    try {
      const startMin = parseTimeToMinutes(departureTime);
      const endMin = calculatedEndTimeMinutes;
      const targetRoute = routesList.find((r) => r.id === selectedRouteId);
      const tripCode = `${targetRoute?.code?.replace(/\s+/g, "") || "R"}-${departureTime.replace(":", "")}`;

      // 1. Create Trip
      const createdTrip = await createTrip({
        routeId: selectedRouteId,
        tripCode,
        direction: scheduleDirection,
        startTime: startMin,
        endTime: endMin,
        serviceDate,
        origin: targetRoute?.origin || "Salem Central",
        destination: targetRoute?.destination || "Terminus",
        distanceKm: Number(targetRoute?.lengthKm || 10),
      });

      // 2. If bus or crew assigned, create duty record
      if (selectedBusId || selectedDriverId || selectedConductorId) {
        const dutyCode = `D-${tripCode}`;
        const newDuty = await createDuty({
          dutyCode,
          dutyType: "LINKED",
          serviceDate,
          startTime: startMin,
          endTime: endMin,
          busId: selectedBusId || undefined,
          driverId: selectedDriverId || undefined,
          conductorId: selectedConductorId || undefined,
        });

        if (newDuty?.id && createdTrip?.id) {
          await addTripToDuty({
            dutyId: newDuty.id,
            tripId: createdTrip.id,
          });
        }
      }

      await queryClient.invalidateQueries({ queryKey: ["trips"] });
      await queryClient.invalidateQueries({ queryKey: ["duties-for-trips"] });
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
      const existing = tripAssignmentMap.get(quickAssignTrip.id);
      if (existing?.dutyId) {
        // Duty already exists; update it or create new
        const dutyCode = `D-${quickAssignTrip.tripCode}`;
        const newDuty = await createDuty({
          dutyCode,
          dutyType: "LINKED",
          serviceDate,
          startTime: quickAssignTrip.startTime,
          endTime: quickAssignTrip.endTime,
          busId: quickBusId || undefined,
          driverId: quickDriverId || undefined,
          conductorId: quickConductorId || undefined,
        });
        if (newDuty?.id) {
          await addTripToDuty({ dutyId: newDuty.id, tripId: quickAssignTrip.id });
        }
      } else {
        const dutyCode = `D-${quickAssignTrip.tripCode}`;
        const newDuty = await createDuty({
          dutyCode,
          dutyType: "LINKED",
          serviceDate,
          startTime: quickAssignTrip.startTime,
          endTime: quickAssignTrip.endTime,
          busId: quickBusId || undefined,
          driverId: quickDriverId || undefined,
          conductorId: quickConductorId || undefined,
        });
        if (newDuty?.id) {
          await addTripToDuty({ dutyId: newDuty.id, tripId: quickAssignTrip.id });
        }
      }

      await queryClient.invalidateQueries({ queryKey: ["trips"] });
      await queryClient.invalidateQueries({ queryKey: ["duties-for-trips"] });
      toast.success(`Trip ${quickAssignTrip.tripCode} assigned.`);
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
        <div className="text-xs">
          <p className="font-semibold text-foreground truncate max-w-[200px]">
            {trip.routeName || trip.routeCode || "Route Corridor"}
          </p>
          <p className="text-[11px] text-muted-foreground truncate">
            {trip.origin} → {trip.destination}
          </p>
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
              onClick={() => handleOpenAssignModal(trip.id)}
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
                <SelectItem value="all">All Directions</SelectItem>
                <SelectItem value="OUTBOUND">Outbound</SelectItem>
                <SelectItem value="INBOUND">Inbound</SelectItem>
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
                          {formatMinutesToTimeString(trip.startTime)}
                        </span>
                        <span className="text-muted-foreground mx-1">-</span>
                        <span className="font-mono text-muted-foreground">
                          {formatMinutesToTimeString(trip.endTime)}
                        </span>
                        <span className="block text-[10px] text-muted-foreground">
                          {trip.durationMin} mins
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="text-[10px] font-mono border-border text-muted-foreground rounded"
                        >
                          {trip.direction}
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
                    Step-by-Step Trip Scheduler
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    Step {wizardStep} of 7: {
                      wizardStep === 1 ? "Confirm Service Date" :
                      wizardStep === 2 ? "Select Route Corridor" :
                      wizardStep === 3 ? "Set Departure & Running Timings" :
                      wizardStep === 4 ? "Assign Available Bus" :
                      wizardStep === 5 ? "Assign Available Driver" :
                      wizardStep === 6 ? "Assign Available Conductor" :
                      "Review & Publish Schedule"
                    }
                  </DialogDescription>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono rounded">
                  {wizardStep}/7
                </Badge>
              </div>
            </DialogHeader>

            <div className="py-4 space-y-4">
              {/* Step 1: Service Date */}
              {wizardStep === 1 && (
                <div className="space-y-3">
                  <Label className="text-xs font-bold text-foreground">1. Operating Service Date</Label>
                  <Input
                    value={serviceDate}
                    onChange={(e) => setServiceDate(e.target.value)}
                    className="h-9 text-xs rounded-md"
                  />
                  <p className="text-xs text-muted-foreground">
                    The calendar date when this bus journey will be operated.
                  </p>
                </div>
              )}

              {/* Step 2: Route */}
              {wizardStep === 2 && (
                <div className="space-y-3">
                  <Label className="text-xs font-bold text-foreground">2. Select Route Corridor</Label>
                  <Select value={selectedRouteId} onValueChange={setSelectedRouteId}>
                    <SelectTrigger className="h-9 text-xs rounded-md">
                      <SelectValue placeholder="Choose Route" />
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
                    <div className="rounded-md border border-border/80 bg-muted/20 p-3 text-xs space-y-1">
                      <p className="font-semibold text-foreground">{selectedRoute.name}</p>
                      <p className="text-muted-foreground">
                        Standard Duration: {selectedRoute.durationMin} minutes | Distance: {selectedRoute.lengthKm} km
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Timings */}
              {wizardStep === 3 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-foreground">Departure Time</Label>
                      <Input
                        type="time"
                        value={departureTime}
                        onChange={(e) => setDepartureTime(e.target.value)}
                        className="h-9 text-xs rounded-md"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-foreground">Calculated Arrival</Label>
                      <Input
                        type="time"
                        disabled
                        value={formatMinutesToTimeString(calculatedEndTimeMinutes)}
                        className="h-9 text-xs rounded-md bg-muted/40 font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-foreground">Travel Direction</Label>
                    <Select value={scheduleDirection} onValueChange={setScheduleDirection}>
                      <SelectTrigger className="h-9 text-xs rounded-md">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OUTBOUND">Outbound ({selectedRoute?.origin || "Start"} → {selectedRoute?.destination || "End"})</SelectItem>
                        <SelectItem value="INBOUND">Inbound ({selectedRoute?.destination || "End"} → {selectedRoute?.origin || "Start"})</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Step 4: Bus Assignment */}
              {wizardStep === 4 && (
                <div className="space-y-3">
                  <Label className="text-xs font-bold text-foreground">4. Assign Bus</Label>
                  <Select value={selectedBusId} onValueChange={setSelectedBusId}>
                    <SelectTrigger className="h-9 text-xs rounded-md">
                      <SelectValue placeholder="Select Available Bus" />
                    </SelectTrigger>
                    <SelectContent>
                      {busesList.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.registrationNumber} ({b.fleetNumber || "Bus"}) - {b.depot} ({b.status})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Only buses currently available in depot are recommended.
                  </p>
                </div>
              )}

              {/* Step 5: Driver Assignment */}
              {wizardStep === 5 && (
                <div className="space-y-3">
                  <Label className="text-xs font-bold text-foreground">5. Assign Driver</Label>
                  <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
                    <SelectTrigger className="h-9 text-xs rounded-md">
                      <SelectValue placeholder="Select Available Driver" />
                    </SelectTrigger>
                    <SelectContent>
                      {driversList.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name} ({d.employeeId || "Driver"}) - {d.depot} ({d.status})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    The system verifies that the driver has satisfied mandatory rest periods before assignment.
                  </p>
                </div>
              )}

              {/* Step 6: Conductor Assignment */}
              {wizardStep === 6 && (
                <div className="space-y-3">
                  <Label className="text-xs font-bold text-foreground">6. Assign Conductor</Label>
                  <Select value={selectedConductorId} onValueChange={setSelectedConductorId}>
                    <SelectTrigger className="h-9 text-xs rounded-md">
                      <SelectValue placeholder="Select Available Conductor" />
                    </SelectTrigger>
                    <SelectContent>
                      {conductorsList.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} ({c.employeeId || "Conductor"}) - {c.depot} ({c.status})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Step 7: Review & Publish */}
              {wizardStep === 7 && (
                <div className="rounded-lg border border-border/80 bg-muted/20 p-4 space-y-3">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Operational Trip Summary
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Route: </span>
                      <span className="font-semibold text-foreground">{selectedRoute?.code}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Date: </span>
                      <span className="font-semibold text-foreground">{serviceDate}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Timings: </span>
                      <span className="font-semibold text-foreground font-mono">
                        {departureTime} - {formatMinutesToTimeString(calculatedEndTimeMinutes)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Direction: </span>
                      <span className="font-semibold text-foreground">{scheduleDirection}</span>
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
                {wizardStep < 7 ? (
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
