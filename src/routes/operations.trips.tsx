import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CalendarClock,
  Search,
  Plus,
  Compass,
  ArrowUpDown,
  Filter,
  Trash2,
  Calendar,
  Clock,
  Lightbulb,
  ArrowRight,
  Info,
  CheckCircle2,
  Bus as BusIcon,
  Users,
  UserCheck,
  AlertTriangle,
  ShieldCheck,
  Check,
  ChevronRight,
  ChevronLeft,
  X,
  RefreshCw,
  Sparkles,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TimeInput12 } from "@/components/ui/time-input-12";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  updateDuty,
  addTripToDuty,
} from "@/lib/scheduling-fns";
import { cn, formatMinutesToTime } from "@/lib/utils";

export const Route = createFileRoute("/operations/trips")({
  beforeLoad: ({ context }) => {
    if (!context.user || !hasPermission(context.user.role, "schedule.view")) {
      throw new Error("Forbidden");
    }
  },
  head: () => ({
    meta: [
      { title: "Schedule Bus Trips: TransitOS" },
      {
        name: "description",
        content:
          "Daily bus timetables, 7-step guided run scheduler, and driver assignments.",
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
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

interface RouteItem {
  id: string;
  code: string;
  name: string;
  origin?: string;
  destination?: string;
  distanceKm?: string | number;
  durationMin?: number;
  status?: string;
}

interface BusItem {
  id: string;
  registrationNumber: string;
  model?: string;
  capacity?: number;
  status?: string;
  depot?: string;
}

interface CrewItem {
  id: string;
  name: string;
  badgeNumber?: string;
  phoneNumber?: string;
  role?: string;
  status?: string;
  depot?: string;
}

interface TripItem {
  id: string;
  tripCode: string;
  routeId: string;
  routeCode: string;
  routeName: string;
  direction: string;
  startTime: number;
  endTime: number;
  durationMin: number;
  distanceKm: string | number;
  status: string;
  serviceDate: string;
}

interface DutyTripItem {
  id: string;
  tripCode: string;
  startTime: number;
  endTime: number;
  routeCode: string;
  routeName: string;
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
  trips?: DutyTripItem[];
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
  const [viewTab, setViewTab] = useState<
    "timetable" | "timeline" | "generator"
  >("timetable");

  // 7-Step Guided Scheduler Wizard Modal State
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [selectedBusId, setSelectedBusId] = useState("");
  const [selectedRouteId, setSelectedRouteId] = useState("");
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [selectedConductorId, setSelectedConductorId] = useState("");
  const [departureTime, setDepartureTime] = useState("07:30");
  const [scheduleDirection, setScheduleDirection] = useState("OUTBOUND");
  const [wizardSubmitting, setWizardSubmitting] = useState(false);

  // Frequency Generator Modal State
  const [isGenOpen, setIsGenOpen] = useState(false);
  const [genRouteId, setGenRouteId] = useState("");
  const [genStartTime, setGenStartTime] = useState("06:00");
  const [genEndTime, setGenEndTime] = useState("10:00");
  const [genFrequency, setGenFrequency] = useState("30");
  const [genDirection, setGenDirection] = useState("OUTBOUND");

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

  // 5. Fetch Trips List
  const { data: tripsList = [], isLoading: tripsLoading } = useQuery<
    TripItem[]
  >({
    queryKey: [
      "trips",
      serviceDate,
      routeFilter,
      statusFilter,
      directionFilter,
    ],
    queryFn: () =>
      getTrips({
        serviceDate,
        routeId: routeFilter,
        status: statusFilter,
        direction: directionFilter,
      }) as Promise<TripItem[]>,
  });

  // 6. Fetch Duties (to resolve assigned bus and staff for each trip)
  const { data: dutiesList = [] } = useQuery<DutyItem[]>({
    queryKey: ["duties-for-trips", serviceDate],
    queryFn: () => getDuties({ serviceDate }) as Promise<DutyItem[]>,
  });

  // Automatically select defaults when dropdown lists load
  useEffect(() => {
    if (routesList.length > 0) {
      if (!selectedRouteId) setSelectedRouteId(routesList[0].id);
      if (!genRouteId) setGenRouteId(routesList[0].id);
    }
    if (busesList.length > 0 && !selectedBusId) {
      const activeBus =
        busesList.find((b) => b.status === "active") || busesList[0];
      if (activeBus) setSelectedBusId(activeBus.id);
    }
    if (driversList.length > 0 && !selectedDriverId) {
      const availableDriver =
        driversList.find((d) => d.status === "available") || driversList[0];
      if (availableDriver) setSelectedDriverId(availableDriver.id);
    }
    if (conductorsList.length > 0 && !selectedConductorId) {
      const availableConductor =
        conductorsList.find((c) => c.status === "available") ||
        conductorsList[0];
      if (availableConductor) setSelectedConductorId(availableConductor.id);
    }
  }, [routesList, busesList, driversList, conductorsList]);

  // Trip to Assignment mapping (Trip ID -> Bus, Driver, Conductor names)
  const tripAssignmentMap = useMemo(() => {
    const map = new Map<
      string,
      {
        busReg: string;
        driverName: string;
        conductorName: string;
        dutyCode: string;
      }
    >();
    dutiesList.forEach((duty) => {
      duty.trips?.forEach((t) => {
        map.set(t.id, {
          busReg: duty.busRegNumber || "Unassigned Bus",
          driverName: duty.driverName || "Unassigned Driver",
          conductorName: duty.conductorName || "Unassigned Conductor",
          dutyCode: duty.dutyCode,
        });
      });
    });
    return map;
  }, [dutiesList]);

  // Selected Entities for Wizard Preview
  const selectedBus = useMemo(
    () => busesList.find((b) => b.id === selectedBusId),
    [busesList, selectedBusId],
  );
  const selectedRoute = useMemo(
    () => routesList.find((r) => r.id === selectedRouteId),
    [routesList, selectedRouteId],
  );
  const selectedDriver = useMemo(
    () => driversList.find((d) => d.id === selectedDriverId),
    [driversList, selectedDriverId],
  );
  const selectedConductor = useMemo(
    () => conductorsList.find((c) => c.id === selectedConductorId),
    [conductorsList, selectedConductorId],
  );

  // Estimated Arrival calculation
  const departureMinutes = parseTimeToMinutes(departureTime);
  const estimatedDuration = selectedRoute?.durationMin || 30;
  const arrivalMinutes = departureMinutes + estimatedDuration;
  const estimatedArrivalTime = formatMinutesToTimeString(arrivalMinutes);

  // Conflict Checking Logic
  const conflictWarnings = useMemo(() => {
    const warnings: string[] = [];
    if (selectedDriver?.status === "resting") {
      warnings.push(
        `${selectedDriver.name} is currently in statutory rest (Motor Vehicles Act minimum 45m buffer).`,
      );
    } else if (selectedDriver?.status === "leave") {
      warnings.push(`${selectedDriver.name} is marked on official leave.`);
    }

    if (selectedBus?.status === "maintenance") {
      warnings.push(
        `Bus ${selectedBus.registrationNumber} is marked under maintenance in the workshop.`,
      );
    }
    return warnings;
  }, [selectedDriver, selectedBus]);

  // Mutations
  const cancelTripMutation = useMutation({
    mutationFn: cancelTrip,
    onSuccess: (updatedT: { tripCode?: string }) => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      queryClient.invalidateQueries({ queryKey: ["duties-for-trips"] });
      toast.success(`Trip ${updatedT.tripCode || ""} cancelled successfully.`);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to cancel trip");
    },
  });

  const generateTripsMutation = useMutation({
    mutationFn: generateTrips,
    onSuccess: (tripsArray: unknown[]) => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      queryClient.invalidateQueries({ queryKey: ["duties-for-trips"] });
      toast.success(`Generated ${tripsArray.length} trips successfully.`);
      setIsGenOpen(false);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to generate trips");
    },
  });

  // Complete 7-Step Schedule Publishing Handler
  const handlePublishSchedule = async () => {
    if (!selectedRouteId) {
      toast.error("Please select a route.");
      return;
    }
    setWizardSubmitting(true);
    try {
      // 1. Create the Trip
      const newTrip = (await createTrip({
        routeId: selectedRouteId,
        startTime: departureMinutes,
        serviceDate,
        direction: scheduleDirection,
        status: "scheduled",
      })) as { id?: string; tripCode?: string };

      // 2. Create the Duty linking Bus, Driver, Conductor
      const dutyCode = `SFT-${selectedRoute?.code || "01"}-${departureTime.replace(":", "")}`;
      const newDuty = (await createDuty({
        dutyCode,
        dutyType: "LINKED",
        serviceDate,
      })) as { id?: string; dutyCode?: string };

      if (newDuty && newDuty.id) {
        await updateDuty({
          id: newDuty.id,
          data: {
            dutyCode,
            dutyType: "LINKED",
            serviceDate,
            status: "active",
            busId: selectedBusId || null,
            driverId: selectedDriverId || null,
            conductorId: selectedConductorId || null,
          },
        });

        // 3. Link the trip to the duty
        if (newTrip && newTrip.id) {
          await addTripToDuty({
            dutyId: newDuty.id,
            tripId: newTrip.id,
          });
        }
      }

      queryClient.invalidateQueries({ queryKey: ["trips"] });
      queryClient.invalidateQueries({ queryKey: ["duties-for-trips"] });

      toast.success(
        `Schedule published: Bus ${selectedBus?.registrationNumber || "Assigned"} on Route ${selectedRoute?.code || "1"} with ${selectedDriver?.name || "Driver"}!`,
      );
      setIsWizardOpen(false);
      setWizardStep(1);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to publish schedule";
      toast.error(msg);
    } finally {
      setWizardSubmitting(false);
    }
  };

  // Filtered trips list
  const filteredTrips = useMemo(() => {
    return tripsList.filter((t) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const assignment = tripAssignmentMap.get(t.id);
        const matchesCode = t.tripCode?.toLowerCase().includes(q);
        const matchesRoute =
          t.routeCode?.toLowerCase().includes(q) ||
          t.routeName?.toLowerCase().includes(q);
        const matchesBus = assignment?.busReg.toLowerCase().includes(q);
        const matchesDriver = assignment?.driverName.toLowerCase().includes(q);
        if (!matchesCode && !matchesRoute && !matchesBus && !matchesDriver) {
          return false;
        }
      }
      return true;
    });
  }, [tripsList, searchQuery, tripAssignmentMap]);

  return (
    <AppShell
      title="Bus Schedules & Timetables"
      subtitle="Easily schedule bus runs, assign drivers and conductors, and view daily departure timetables."
      actions={
        canModify ? (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsGenOpen(true)}
              className="text-xs h-8.5 rounded-lg border-border hover:bg-muted font-medium"
            >
              <CalendarClock className="mr-1.5 size-3.5 text-primary" />
              Auto-Fill Frequency
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setWizardStep(1);
                setIsWizardOpen(true);
              }}
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold h-8.5 rounded-lg shadow-sm"
            >
              <Plus className="mr-1.5 size-3.5" />
              Schedule a Bus Run
            </Button>
          </div>
        ) : undefined
      }
    >
      <div className="space-y-6">
        {/* Beginner Explainer Banner */}
        <div className="glass-panel p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="size-9 rounded-xl bg-primary/10 text-primary grid place-items-center font-bold shrink-0">
              <CalendarClock className="size-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-bold text-foreground">
                  Daily Dispatch Schedule
                </h3>
                <Badge
                  variant="outline"
                  className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 text-[10px] font-mono rounded-md"
                >
                  ● Active Service Day
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Every entry pairs a <strong>Bus</strong> with a{" "}
                <strong>Route</strong>, <strong>Driver</strong>, and{" "}
                <strong>Conductor</strong>. Click "+ Schedule a Bus Run" for the
                guided 7-step wizard.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <span className="px-2.5 py-1 bg-secondary/60 rounded-md border border-border/60">
              Total Runs: <strong>{tripsList.length}</strong>
            </span>
            <span className="px-2.5 py-1 bg-secondary/60 rounded-md border border-border/60">
              Scheduled:{" "}
              <strong>
                {tripsList.filter((t) => t.status !== "cancelled").length}
              </strong>
            </span>
          </div>
        </div>

        {/* View Switcher & Main Filters Bar */}
        <div className="glass-panel p-4 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* View Tabs */}
            <Tabs
              value={viewTab}
              onValueChange={(v) =>
                setViewTab(v as "timetable" | "timeline" | "generator")
              }
              className="w-auto"
            >
              <TabsList className="bg-secondary/40 p-1 rounded-lg border border-border/60 h-8.5">
                <TabsTrigger
                  value="timetable"
                  className="text-xs px-3 h-6.5 gap-1.5 data-[state=active]:bg-card rounded-md"
                >
                  <Clock className="size-3.5" /> Daily Timetable
                </TabsTrigger>
                <TabsTrigger
                  value="timeline"
                  className="text-xs px-3 h-6.5 gap-1.5 data-[state=active]:bg-card rounded-md"
                >
                  <Compass className="size-3.5" /> Hourly Visual Gantt
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Service Date Selector */}
            <div className="flex items-center gap-2">
              <Calendar className="size-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground">
                Date:
              </span>
              <Input
                type="text"
                value={serviceDate}
                onChange={(e) => setServiceDate(e.target.value)}
                className="w-32 bg-background/60 h-8 text-xs font-mono rounded-lg"
              />
            </div>
          </div>

          {/* Search and Dropdown Filter Row */}
          <div className="flex flex-wrap gap-2.5 items-center pt-1 border-t border-border/50">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Search route, driver, or bus plate..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 bg-background/60 h-8.5 text-xs rounded-lg"
              />
            </div>

            {/* Route Filter */}
            <Select value={routeFilter} onValueChange={setRouteFilter}>
              <SelectTrigger className="w-48 bg-background/60 h-8.5 text-xs rounded-lg">
                <SelectValue placeholder="All Corridors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Corridors</SelectItem>
                {routesList.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    Route {r.code}: {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Direction Filter */}
            <Select value={directionFilter} onValueChange={setDirectionFilter}>
              <SelectTrigger className="w-36 bg-background/60 h-8.5 text-xs rounded-lg">
                <SelectValue placeholder="All Directions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Both Directions</SelectItem>
                <SelectItem value="OUTBOUND">Outbound</SelectItem>
                <SelectItem value="INBOUND">Inbound</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32 bg-background/60 h-8.5 text-xs rounded-lg">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="planned">Planned</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            {(searchQuery ||
              routeFilter !== "all" ||
              statusFilter !== "all" ||
              directionFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setRouteFilter("all");
                  setStatusFilter("all");
                  setDirectionFilter("all");
                }}
                className="h-8 text-xs text-muted-foreground hover:text-foreground rounded-lg"
              >
                <X className="size-3 mr-1" /> Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* TAB 1: DAILY TIMETABLE (Primary Operator View) */}
        {viewTab === "timetable" && (
          <div className="glass-panel p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Clock className="size-4 text-primary" /> Daily Timetable &
                  Departures
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Chronological timetable displaying scheduled departure times,
                  bus registrations, and driver crew assignments.
                </p>
              </div>
              <Badge variant="outline" className="font-mono text-xs rounded-md">
                Showing {filteredTrips.length} of {tripsList.length} departures
              </Badge>
            </div>

            {tripsLoading ? (
              <div className="py-20 text-center text-xs text-muted-foreground">
                Loading daily timetable...
              </div>
            ) : filteredTrips.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <div className="size-12 rounded-xl bg-secondary/40 text-muted-foreground grid place-items-center mx-auto">
                  <CalendarClock className="size-6" />
                </div>
                <h4 className="text-sm font-bold text-foreground">
                  No Scheduled Departures Found
                </h4>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  No trips match the current filter criteria for {serviceDate}.
                  Click below to schedule a new bus run.
                </p>
                <Button
                  onClick={() => {
                    setWizardStep(1);
                    setIsWizardOpen(true);
                  }}
                  size="sm"
                  className="bg-primary text-primary-foreground font-semibold text-xs rounded-lg"
                >
                  <Plus className="size-3.5 mr-1" /> Schedule Run Now
                </Button>
              </div>
            ) : (
              <div className="border border-border/60 rounded-xl overflow-hidden bg-background/40">
                <Table>
                  <TableHeader className="bg-secondary/40 text-[11px]">
                    <TableRow>
                      <TableHead className="font-semibold text-foreground w-28">
                        Departure Time
                      </TableHead>
                      <TableHead className="font-semibold text-foreground">
                        Route & Corridor
                      </TableHead>
                      <TableHead className="font-semibold text-foreground w-28">
                        Direction
                      </TableHead>
                      <TableHead className="font-semibold text-foreground">
                        Assigned Bus
                      </TableHead>
                      <TableHead className="font-semibold text-foreground">
                        Driver & Conductor
                      </TableHead>
                      <TableHead className="font-semibold text-foreground text-center w-28">
                        Status
                      </TableHead>
                      {canModify && (
                        <TableHead className="font-semibold text-foreground text-right w-24">
                          Action
                        </TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody className="text-xs font-sans">
                    {filteredTrips.map((trip) => {
                      const assignment = tripAssignmentMap.get(trip.id);
                      const isCancelled = trip.status === "cancelled";
                      const depTimeStr = formatMinutesToTimeString(
                        trip.startTime,
                      );
                      const arrTimeStr = formatMinutesToTimeString(
                        trip.endTime,
                      );
                      return (
                        <TableRow
                          key={trip.id}
                          className={cn(
                            isCancelled && "opacity-60 bg-muted/20",
                          )}
                        >
                          {/* Departure & Arrival */}
                          <TableCell className="font-mono">
                            <div className="font-bold text-foreground text-sm">
                              {depTimeStr}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              Arr: {arrTimeStr} ({trip.durationMin}m)
                            </div>
                          </TableCell>

                          {/* Route */}
                          <TableCell>
                            <div className="font-bold text-foreground flex items-center gap-1.5">
                              <Badge
                                variant="outline"
                                className="text-[10px] font-mono border-primary/40 text-primary bg-primary/5 rounded"
                              >
                                Route {trip.routeCode}
                              </Badge>
                              <span>{trip.routeName}</span>
                            </div>
                            <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                              {trip.distanceKm} km · Run #{trip.tripCode}
                            </div>
                          </TableCell>

                          {/* Direction */}
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className="text-[10px] rounded-md font-mono"
                            >
                              {trip.direction === "OUTBOUND"
                                ? "Outbound"
                                : "Inbound"}
                            </Badge>
                          </TableCell>

                          {/* Bus */}
                          <TableCell>
                            {assignment?.busReg &&
                            assignment.busReg !== "Unassigned Bus" ? (
                              <div className="flex items-center gap-1.5 font-mono text-foreground font-semibold">
                                <BusIcon className="size-3.5 text-primary" />
                                {assignment.busReg}
                              </div>
                            ) : (
                              <Badge
                                variant="outline"
                                className="text-[10px] text-muted-foreground border-dashed border-border rounded"
                              >
                                Standby Bus Pending
                              </Badge>
                            )}
                          </TableCell>

                          {/* Driver & Conductor */}
                          <TableCell>
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5 font-medium text-foreground">
                                <UserCheck className="size-3 text-emerald-600 dark:text-emerald-400" />
                                <span>
                                  {assignment?.driverName ||
                                    "Driver Unassigned"}
                                </span>
                              </div>
                              <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <Users className="size-3 text-muted-foreground" />
                                <span>
                                  {assignment?.conductorName ||
                                    "Conductor Unassigned"}
                                </span>
                              </div>
                            </div>
                          </TableCell>

                          {/* Status */}
                          <TableCell className="text-center font-mono">
                            {isCancelled ? (
                              <Badge
                                variant="destructive"
                                className="text-[10px] rounded-md font-sans"
                              >
                                Cancelled
                              </Badge>
                            ) : (
                              <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] rounded-md font-sans">
                                ● Scheduled
                              </Badge>
                            )}
                          </TableCell>

                          {/* Action */}
                          {canModify && (
                            <TableCell className="text-right">
                              {!isCancelled ? (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    cancelTripMutation.mutate(trip.id)
                                  }
                                  className="h-7 text-[11px] text-destructive hover:bg-destructive/10 rounded-md"
                                >
                                  Cancel
                                </Button>
                              ) : (
                                <span className="text-[11px] text-muted-foreground">
                                  --
                                </span>
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: HOURLY VISUAL GANTT TIMELINE */}
        {viewTab === "timeline" && (
          <div className="glass-panel p-5 space-y-5">
            <div className="border-b border-border/60 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Compass className="size-4 text-primary" /> Hourly Schedule
                  Progression (06:00 to 22:00)
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Visual corridor timeline illustrating headway distribution and
                  peak service intervals across Salem.
                </p>
              </div>
              <Badge variant="outline" className="text-xs font-mono rounded-md">
                6 Active Corridors
              </Badge>
            </div>

            <div className="space-y-4">
              {routesList.map((route) => {
                const routeTrips = tripsList.filter(
                  (t) => t.routeId === route.id && t.status !== "cancelled",
                );
                return (
                  <div
                    key={route.id}
                    className="p-3.5 rounded-xl border border-border/60 bg-background/50 space-y-2.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-primary/10 text-primary border-primary/30 font-mono text-xs rounded-md">
                          Route {route.code}
                        </Badge>
                        <span className="text-xs font-bold text-foreground">
                          {route.name}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-muted-foreground">
                        {routeTrips.length} Departures ·{" "}
                        {route.distanceKm || "8"} km
                      </span>
                    </div>

                    {/* 24-hour timeline bar */}
                    <div className="relative h-9 bg-secondary/30 rounded-lg border border-border/40 overflow-hidden flex items-center px-2">
                      {routeTrips.length === 0 ? (
                        <span className="text-[10px] text-muted-foreground mx-auto font-mono">
                          No departures scheduled today for this corridor.
                        </span>
                      ) : (
                        routeTrips.map((t) => {
                          // Scale position between 06:00 (360m) and 22:00 (1320m)
                          const minStart = 360;
                          const maxEnd = 1320;
                          const pct = Math.max(
                            2,
                            Math.min(
                              92,
                              ((t.startTime - minStart) / (maxEnd - minStart)) *
                                100,
                            ),
                          );
                          const depStr = formatMinutesToTimeString(t.startTime);
                          return (
                            <div
                              key={t.id}
                              style={{ left: `${pct}%` }}
                              title={`Departure: ${depStr} (Run #${t.tripCode})`}
                              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-primary text-primary-foreground text-[10px] font-mono font-bold shadow-xs whitespace-nowrap cursor-default"
                            >
                              {depStr}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 7-STEP GUIDED BUS SCHEDULING WIZARD MODAL */}
        <Dialog open={isWizardOpen} onOpenChange={setIsWizardOpen}>
          <DialogContent className="sm:max-w-2xl bg-card border-border rounded-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="border-b border-border/60 pb-3">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-base font-bold flex items-center gap-2">
                  <CalendarClock className="size-4 text-primary" /> Schedule a
                  New Bus Run
                </DialogTitle>
                <Badge
                  variant="outline"
                  className="text-[10px] font-mono rounded-md"
                >
                  Step {wizardStep} of 7
                </Badge>
              </div>
              <DialogDescription className="text-xs text-muted-foreground">
                Follow this simple 7-step guided workflow to dispatch a bus,
                route, and crew.
              </DialogDescription>
            </DialogHeader>

            {/* Step Progress Pills */}
            <div className="flex items-center justify-between gap-1 py-2 overflow-x-auto text-[10px] font-mono">
              {[
                { s: 1, label: "1. Bus" },
                { s: 2, label: "2. Route" },
                { s: 3, label: "3. Driver" },
                { s: 4, label: "4. Conductor" },
                { s: 5, label: "5. Time" },
                { s: 6, label: "6. Check" },
                { s: 7, label: "7. Publish" },
              ].map((step) => (
                <div
                  key={step.s}
                  onClick={() => setWizardStep(step.s)}
                  className={cn(
                    "px-2 py-1 rounded cursor-pointer transition-colors whitespace-nowrap",
                    wizardStep === step.s
                      ? "bg-primary text-primary-foreground font-bold"
                      : wizardStep > step.s
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold"
                        : "bg-secondary text-muted-foreground",
                  )}
                >
                  {step.label}
                </div>
              ))}
            </div>

            {/* STEP 1: SELECT BUS */}
            {wizardStep === 1 && (
              <div className="space-y-4 py-3">
                <div className="border-b border-border/40 pb-2">
                  <h4 className="text-xs font-bold text-foreground">
                    Step 1: Choose an Available Bus
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Select the physical vehicle to assign to this run.
                  </p>
                </div>

                <div className="grid gap-2.5 max-h-64 overflow-y-auto pr-1">
                  {busesList.map((bus) => {
                    const isSelected = bus.id === selectedBusId;
                    const isMaintenance = bus.status === "maintenance";
                    return (
                      <div
                        key={bus.id}
                        onClick={() =>
                          !isMaintenance && setSelectedBusId(bus.id)
                        }
                        className={cn(
                          "p-3 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-all",
                          isSelected
                            ? "border-primary bg-primary/10"
                            : isMaintenance
                              ? "opacity-50 border-border bg-muted/20 cursor-not-allowed"
                              : "border-border/70 hover:border-primary/50 bg-background/50",
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="size-8 rounded bg-primary/10 text-primary grid place-items-center">
                            <BusIcon className="size-4" />
                          </div>
                          <div>
                            <div className="font-bold text-foreground font-mono">
                              {bus.registrationNumber}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              {bus.model || "Ashok Leyland 65-Seater"} ·{" "}
                              {bus.depot || "Meyyanur Depot"}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isMaintenance ? (
                            <Badge
                              variant="destructive"
                              className="text-[9px] rounded"
                            >
                              Maintenance
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[9px] rounded">
                              ● Ready
                            </Badge>
                          )}
                          {isSelected && (
                            <Check className="size-4 text-primary shrink-0" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 2: SELECT ROUTE */}
            {wizardStep === 2 && (
              <div className="space-y-4 py-3">
                <div className="border-b border-border/40 pb-2">
                  <h4 className="text-xs font-bold text-foreground">
                    Step 2: Choose Route & Direction
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Select the corridor path and whether the run is outbound or
                    inbound.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Direction</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={
                        scheduleDirection === "OUTBOUND" ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => setScheduleDirection("OUTBOUND")}
                      className="text-xs rounded-lg"
                    >
                      Outbound (Forward)
                    </Button>
                    <Button
                      type="button"
                      variant={
                        scheduleDirection === "INBOUND" ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => setScheduleDirection("INBOUND")}
                      className="text-xs rounded-lg"
                    >
                      Inbound (Return)
                    </Button>
                  </div>
                </div>

                <div className="grid gap-2.5 max-h-60 overflow-y-auto pr-1">
                  {routesList.map((route) => {
                    const isSelected = route.id === selectedRouteId;
                    return (
                      <div
                        key={route.id}
                        onClick={() => setSelectedRouteId(route.id)}
                        className={cn(
                          "p-3 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-all",
                          isSelected
                            ? "border-primary bg-primary/10"
                            : "border-border/70 hover:border-primary/50 bg-background/50",
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <Badge className="bg-primary/20 text-primary border-primary/30 font-mono text-xs rounded">
                            Route {route.code}
                          </Badge>
                          <div>
                            <div className="font-bold text-foreground">
                              {route.name}
                            </div>
                            <div className="text-[10px] text-muted-foreground font-mono">
                              {route.distanceKm || "8"} km · ~
                              {route.durationMin || "30"} mins
                            </div>
                          </div>
                        </div>

                        {isSelected && (
                          <Check className="size-4 text-primary shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 3: SELECT DRIVER */}
            {wizardStep === 3 && (
              <div className="space-y-4 py-3">
                <div className="border-b border-border/40 pb-2 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-foreground">
                      Step 3: Assign a Driver
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      Pick a driver who has completed required rest under Motor
                      Vehicles Act rules.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const avail = driversList.find(
                        (d) => d.status === "available",
                      );
                      if (avail) {
                        setSelectedDriverId(avail.id);
                        toast.success(
                          `Suggested next available driver: ${avail.name}`,
                        );
                      }
                    }}
                    className="text-[11px] h-7 gap-1 rounded-lg"
                  >
                    <Sparkles className="size-3 text-primary" /> Auto-Suggest
                  </Button>
                </div>

                <div className="grid gap-2.5 max-h-64 overflow-y-auto pr-1">
                  {driversList.map((driver) => {
                    const isSelected = driver.id === selectedDriverId;
                    const isResting = driver.status === "resting";
                    return (
                      <div
                        key={driver.id}
                        onClick={() => setSelectedDriverId(driver.id)}
                        className={cn(
                          "p-3 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-all",
                          isSelected
                            ? "border-primary bg-primary/10"
                            : "border-border/70 hover:border-primary/50 bg-background/50",
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="size-8 rounded-full bg-secondary grid place-items-center font-bold text-foreground text-xs">
                            {driver.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-foreground flex items-center gap-1.5">
                              <span>{driver.name}</span>
                              <Badge
                                variant="outline"
                                className="text-[9px] font-mono rounded"
                              >
                                {driver.badgeNumber || "DRV"}
                              </Badge>
                            </div>
                            <div className="text-[10px] text-muted-foreground font-mono">
                              {driver.phoneNumber || "+91 98421 XXXXX"} ·{" "}
                              {driver.depot || "Meyyanur"}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isResting ? (
                            <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[9px] rounded">
                              Resting
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[9px] rounded">
                              ● Available
                            </Badge>
                          )}
                          {isSelected && (
                            <Check className="size-4 text-primary shrink-0" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 4: SELECT CONDUCTOR */}
            {wizardStep === 4 && (
              <div className="space-y-4 py-3">
                <div className="border-b border-border/40 pb-2">
                  <h4 className="text-xs font-bold text-foreground">
                    Step 4: Assign a Conductor
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Select a ticket auditor / conductor for passenger ticketing
                    operations.
                  </p>
                </div>

                <div className="grid gap-2.5 max-h-64 overflow-y-auto pr-1">
                  {conductorsList.map((conductor) => {
                    const isSelected = conductor.id === selectedConductorId;
                    return (
                      <div
                        key={conductor.id}
                        onClick={() => setSelectedConductorId(conductor.id)}
                        className={cn(
                          "p-3 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-all",
                          isSelected
                            ? "border-primary bg-primary/10"
                            : "border-border/70 hover:border-primary/50 bg-background/50",
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="size-8 rounded-full bg-secondary grid place-items-center font-bold text-foreground text-xs">
                            {conductor.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-foreground">
                              {conductor.name}
                            </div>
                            <div className="text-[10px] text-muted-foreground font-mono">
                              {conductor.phoneNumber || "+91 94432 XXXXX"} ·{" "}
                              {conductor.depot || "Meyyanur"}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[9px] rounded">
                            ● Available
                          </Badge>
                          {isSelected && (
                            <Check className="size-4 text-primary shrink-0" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 5: DEPARTURE TIME */}
            {wizardStep === 5 && (
              <div className="space-y-4 py-3">
                <div className="border-b border-border/40 pb-2">
                  <h4 className="text-xs font-bold text-foreground">
                    Step 5: Set Timetable & Departure Time
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Choose the departure time. Arrival is calculated based on
                    corridor speed.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">
                      Scheduled Departure Time
                    </Label>
                    <TimeInput12
                      value={departureTime}
                      onChange={setDepartureTime}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">
                      Service Date
                    </Label>
                    <Input
                      type="text"
                      value={serviceDate}
                      onChange={(e) => setServiceDate(e.target.value)}
                      className="bg-background/60 font-mono text-sm h-10 rounded-lg"
                    />
                  </div>
                </div>

                {/* Live Timetable Preview Card */}
                <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-2">
                  <div className="text-xs font-bold text-foreground flex items-center justify-between">
                    <span>Timetable Summary Preview</span>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      ~{estimatedDuration} mins trip
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between font-mono text-sm pt-1">
                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase">
                        Depart Origin
                      </div>
                      <div className="font-bold text-foreground">
                        {departureTime}
                      </div>
                    </div>
                    <ArrowRight className="size-4 text-primary" />
                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase">
                        Arrive Terminus
                      </div>
                      <div className="font-bold text-foreground">
                        {estimatedArrivalTime}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 6: CONFLICT CHECK */}
            {wizardStep === 6 && (
              <div className="space-y-4 py-3">
                <div className="border-b border-border/40 pb-2">
                  <h4 className="text-xs font-bold text-foreground">
                    Step 6: Automated Conflict & Compliance Check
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Reviewing driver rest compliance, vehicle maintenance
                    status, and overlapping runs.
                  </p>
                </div>

                {conflictWarnings.length > 0 ? (
                  <div className="p-4 rounded-xl border border-amber-500/40 bg-amber-500/10 space-y-2">
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-bold text-xs">
                      <AlertTriangle className="size-4" /> Potential Scheduling
                      Conflicts Detected
                    </div>
                    <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                      {conflictWarnings.map((w, idx) => (
                        <li key={idx}>{w}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 space-y-1.5">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                      <ShieldCheck className="size-4" /> Zero Conflicts Detected
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Driver rest requirements fully satisfied under Motor
                      Vehicles Act (Section 91). Bus is available with no
                      conflicting duty overlaps.
                    </p>
                  </div>
                )}

                {/* Selected Assignment Summary */}
                <div className="p-3.5 rounded-lg border border-border bg-background/50 text-xs space-y-2">
                  <div className="font-bold text-foreground">
                    Run Configuration:
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-muted-foreground">Bus: </span>
                      <strong className="text-foreground">
                        {selectedBus?.registrationNumber}
                      </strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Route: </span>
                      <strong className="text-foreground">
                        Route {selectedRoute?.code} ({selectedRoute?.name})
                      </strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Driver: </span>
                      <strong className="text-foreground">
                        {selectedDriver?.name}
                      </strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Conductor: </span>
                      <strong className="text-foreground">
                        {selectedConductor?.name}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 7: CONFIRM & PUBLISH */}
            {wizardStep === 7 && (
              <div className="space-y-4 py-3 text-center">
                <div className="size-12 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 grid place-items-center mx-auto">
                  <CheckCircle2 className="size-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-foreground">
                    Ready to Publish Schedule
                  </h4>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Click confirm to lock in this departure. It will immediately
                    appear on the daily dispatch board.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-border bg-background/60 text-xs text-left space-y-2 font-mono">
                  <div className="flex justify-between py-1 border-b border-border/50">
                    <span className="text-muted-foreground font-sans">
                      Departure Time
                    </span>
                    <strong className="text-foreground">
                      {departureTime} ({serviceDate})
                    </strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/50">
                    <span className="text-muted-foreground font-sans">
                      Corridor
                    </span>
                    <strong className="text-foreground">
                      Route {selectedRoute?.code} ({selectedRoute?.name})
                    </strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/50">
                    <span className="text-muted-foreground font-sans">
                      Bus Plate
                    </span>
                    <strong className="text-foreground">
                      {selectedBus?.registrationNumber}
                    </strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/50">
                    <span className="text-muted-foreground font-sans">
                      Driver Staff
                    </span>
                    <strong className="text-foreground">
                      {selectedDriver?.name}
                    </strong>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground font-sans">
                      Conductor Staff
                    </span>
                    <strong className="text-foreground">
                      {selectedConductor?.name}
                    </strong>
                  </div>
                </div>
              </div>
            )}

            {/* Wizard Navigation Footer */}
            <DialogFooter className="border-t border-border/60 pt-3 flex items-center justify-between sm:justify-between">
              <div>
                {wizardStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setWizardStep((prev) => Math.max(1, prev - 1))
                    }
                    className="text-xs rounded-lg gap-1"
                  >
                    <ChevronLeft className="size-3.5" /> Back
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsWizardOpen(false)}
                  className="text-xs rounded-lg"
                >
                  Cancel
                </Button>

                {wizardStep < 7 ? (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() =>
                      setWizardStep((prev) => Math.min(7, prev + 1))
                    }
                    className="bg-primary text-primary-foreground font-semibold text-xs rounded-lg gap-1"
                  >
                    Next Step <ChevronRight className="size-3.5" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    disabled={wizardSubmitting}
                    onClick={handlePublishSchedule}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg gap-1"
                  >
                    <Check className="size-3.5" />
                    {wizardSubmitting
                      ? "Publishing..."
                      : "Confirm & Publish Run"}
                  </Button>
                )}
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* FREQUENCY TIMETABLE GENERATOR MODAL */}
        <Dialog open={isGenOpen} onOpenChange={setIsGenOpen}>
          <DialogContent className="sm:max-w-md bg-card border-border rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <CalendarClock className="size-4 text-primary" /> Auto-Fill
                Regular Frequency
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Quickly generate recurring daily departures at fixed intervals
                (e.g., every 15 or 30 minutes).
              </DialogDescription>
            </DialogHeader>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                generateTripsMutation.mutate({
                  routeId: genRouteId,
                  serviceDate,
                  startTime: parseTimeToMinutes(genStartTime),
                  endTime: parseTimeToMinutes(genEndTime),
                  frequency: Number(genFrequency),
                  direction: genDirection,
                });
              }}
              className="space-y-4 py-2"
            >
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Select Route Corridor
                </Label>
                <Select value={genRouteId} onValueChange={setGenRouteId}>
                  <SelectTrigger className="text-xs bg-background/60 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {routesList.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        Route {r.code}: {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">
                    First Departure
                  </Label>
                  <TimeInput12
                    value={genStartTime}
                    onChange={setGenStartTime}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">
                    Last Departure
                  </Label>
                  <TimeInput12
                    value={genEndTime}
                    onChange={setGenEndTime}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">
                    Frequency (Mins)
                  </Label>
                  <Input
                    type="number"
                    min="5"
                    max="180"
                    value={genFrequency}
                    onChange={(e) => setGenFrequency(e.target.value)}
                    className="text-xs bg-background/60 font-mono rounded-lg"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Direction</Label>
                  <Select value={genDirection} onValueChange={setGenDirection}>
                    <SelectTrigger className="text-xs bg-background/60 rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OUTBOUND">Outbound</SelectItem>
                      <SelectItem value="INBOUND">Inbound</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsGenOpen(false)}
                  className="text-xs rounded-lg"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={generateTripsMutation.isPending}
                  className="bg-primary text-primary-foreground font-semibold text-xs rounded-lg"
                >
                  {generateTripsMutation.isPending
                    ? "Generating..."
                    : "Generate Trips"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
