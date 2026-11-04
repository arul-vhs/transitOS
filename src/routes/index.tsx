import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  Bus,
  Users,
  CalendarClock,
  ArrowRight,
  Route as RouteIcon,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  Check,
  ShieldAlert,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getBuses, getDrivers, getConductors } from "@/lib/fleet-crew";
import { getRoutes } from "@/lib/routes-gis-fns";
import { getTrips, getDuties } from "@/lib/scheduling-fns";
import { useActiveTenant } from "@/lib/tenant-context";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Operations Hub: TransitOS" },
      {
        name: "description",
        content: "Transport operations dashboard: today's trips, bus fleet, crew availability, and scheduling status.",
      },
    ],
  }),
  component: Dashboard,
});

const TODAY_DATE = "25 Aug 2026";

function formatMinutesToTimeString(min: number): string {
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function Dashboard() {
  const { currentTenant, currentDepot } = useActiveTenant();

  // 1. Fetch Buses
  const { data: busesList = [] } = useQuery({
    queryKey: ["buses-dashboard"],
    queryFn: () => getBuses(),
  });

  // 2. Fetch Drivers & Conductors
  const { data: driversList = [] } = useQuery({
    queryKey: ["drivers-dashboard"],
    queryFn: () => getDrivers(),
  });

  const { data: conductorsList = [] } = useQuery({
    queryKey: ["conductors-dashboard"],
    queryFn: () => getConductors(),
  });

  // 3. Fetch Routes
  const { data: routesList = [] } = useQuery({
    queryKey: ["routes-dashboard"],
    queryFn: () => getRoutes(),
  });

  // 4. Fetch Trips
  const { data: tripsList = [] } = useQuery({
    queryKey: ["trips-dashboard", TODAY_DATE],
    queryFn: () => getTrips({ serviceDate: TODAY_DATE }),
  });

  // 5. Fetch Duties (resolve bus and staff assignments)
  const { data: dutiesList = [] } = useQuery({
    queryKey: ["duties-dashboard", TODAY_DATE],
    queryFn: () => getDuties({ serviceDate: TODAY_DATE }),
  });

  // Trip to Assignment mapping
  const tripAssignmentMap = useMemo(() => {
    const map = new Map<
      string,
      {
        busId?: string | null;
        driverId?: string | null;
        conductorId?: string | null;
        busReg: string;
        driverName: string;
        conductorName: string;
      }
    >();

    dutiesList.forEach((duty) => {
      duty.trips?.forEach((t: { id: string }) => {
        const bus = busesList.find((b) => b.id === duty.busId);
        const driver = driversList.find((d) => d.id === duty.driverId);
        const conductor = conductorsList.find((c) => c.id === duty.conductorId);

        map.set(t.id, {
          busId: duty.busId,
          driverId: duty.driverId,
          conductorId: duty.conductorId,
          busReg: bus ? `${bus.registrationNumber} (${bus.fleetNumber || "Bus"})` : "Unassigned",
          driverName: driver ? driver.name : "Unassigned",
          conductorName: conductor ? conductor.name : "Unassigned",
        });
      });
    });

    return map;
  }, [dutiesList, busesList, driversList, conductorsList]);

  // Conflict Detection: check overlapping trips for same bus or driver
  const conflictsCount = useMemo(() => {
    let count = 0;
    for (let i = 0; i < tripsList.length; i++) {
      const tripA = tripsList[i];
      const assignA = tripAssignmentMap.get(tripA.id);
      if (!assignA) continue;

      for (let j = i + 1; j < tripsList.length; j++) {
        const tripB = tripsList[j];
        const assignB = tripAssignmentMap.get(tripB.id);
        if (!assignB) continue;

        const overlaps =
          tripA.startTime < tripB.endTime && tripB.startTime < tripA.endTime;

        if (overlaps) {
          if (
            (assignA.busId && assignB.busId && assignA.busId === assignB.busId) ||
            (assignA.driverId && assignB.driverId && assignA.driverId === assignB.driverId)
          ) {
            count++;
          }
        }
      }
    }
    return count;
  }, [tripsList, tripAssignmentMap]);

  // Operational metrics
  const totalTrips = tripsList.length;
  const availableBuses = busesList.filter((b) => b.status === "available").length;
  const scheduledBuses = new Set(dutiesList.map((d) => d.busId).filter(Boolean)).size;
  const availableDrivers = driversList.filter((d) => d.status === "available").length;
  const availableConductors = conductorsList.filter((c) => c.status === "available").length;

  const unassignedTrips = tripsList.filter(
    (t) =>
      !tripAssignmentMap.get(t.id) ||
      tripAssignmentMap.get(t.id)?.busReg === "Unassigned" ||
      tripAssignmentMap.get(t.id)?.driverName === "Unassigned",
  ).length;

  const maintenanceBuses = busesList.filter(
    (b) => b.status === "maintenance" || b.status === "breakdown",
  ).length;

  return (
    <AppShell
      title="Transport Operations Hub"
      subtitle={`${currentTenant.name} · ${currentDepot} · ${TODAY_DATE}`}
      actions={
        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="text-xs rounded-md border-border hover:bg-muted font-medium"
          >
            <Link to="/operations/trips">
              <CalendarClock className="mr-1.5 size-3.5 text-primary" />
              Schedules
            </Link>
          </Button>
          <Button
            asChild
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-md shadow-xs cursor-pointer"
          >
            <Link to="/operations/today">
              <RouteIcon className="mr-1.5 size-3.5" />
              Live Dispatch
            </Link>
          </Button>
        </div>
      }
    >
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* END-TO-END OPERATIONAL SEQUENCE PIPELINE */}
        <section className="rounded-lg border border-border/80 bg-card p-5 space-y-3.5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
            <div>
              <h2 className="text-sm font-bold tracking-tight text-foreground flex items-center gap-2">
                <span>Operational Lifecycle Pipeline</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Standard end-to-end transport sequence: Setup → Routes → Buses → Staff → Scheduling → Operations
              </p>
            </div>
            <Badge
              variant="outline"
              className="text-[10px] font-mono border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/10 rounded w-fit"
            >
              System Ready
            </Badge>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            {/* Step 1: Setup */}
            <Link
              to="/settings"
              className="p-3 rounded-md border border-border/70 bg-muted/20 hover:border-blue-500/50 hover:bg-muted/40 transition-colors group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex size-5 items-center justify-center rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold font-mono">
                    <Check className="size-3" />
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground">Step 1</span>
                </div>
                <p className="font-bold text-xs text-foreground mt-2 group-hover:text-primary transition-colors">
                  Transport Setup
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                  {currentDepot}
                </p>
              </div>
              <div className="mt-2.5 pt-1.5 border-t border-border/60 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                Depot Configured
              </div>
            </Link>

            {/* Step 2: Routes */}
            <Link
              to="/network/routes"
              className="p-3 rounded-md border border-border/70 bg-muted/20 hover:border-blue-500/50 hover:bg-muted/40 transition-colors group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex size-5 items-center justify-center rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold font-mono">
                    <Check className="size-3" />
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground">Step 2</span>
                </div>
                <p className="font-bold text-xs text-foreground mt-2 group-hover:text-primary transition-colors">
                  Routes & Network
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {routesList.length || 8} Corridors
                </p>
              </div>
              <div className="mt-2.5 pt-1.5 border-t border-border/60 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                Stops Mapped
              </div>
            </Link>

            {/* Step 3: Buses */}
            <Link
              to="/fleet/buses"
              className="p-3 rounded-md border border-border/70 bg-muted/20 hover:border-blue-500/50 hover:bg-muted/40 transition-colors group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex size-5 items-center justify-center rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold font-mono">
                    <Check className="size-3" />
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground">Step 3</span>
                </div>
                <p className="font-bold text-xs text-foreground mt-2 group-hover:text-primary transition-colors">
                  Bus Fleet
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {busesList.length || 24} Vehicles
                </p>
              </div>
              <div className="mt-2.5 pt-1.5 border-t border-border/60 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                {availableBuses} Available
              </div>
            </Link>

            {/* Step 4: Staff */}
            <Link
              to="/crew/drivers"
              className="p-3 rounded-md border border-border/70 bg-muted/20 hover:border-blue-500/50 hover:bg-muted/40 transition-colors group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex size-5 items-center justify-center rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold font-mono">
                    <Check className="size-3" />
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground">Step 4</span>
                </div>
                <p className="font-bold text-xs text-foreground mt-2 group-hover:text-primary transition-colors">
                  Staff & Crew
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {driversList.length + conductorsList.length || 48} Crew Members
                </p>
              </div>
              <div className="mt-2.5 pt-1.5 border-t border-border/60 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                Roster Enrolled
              </div>
            </Link>

            {/* Step 5: Scheduling */}
            <Link
              to="/operations/trips"
              className={`p-3 rounded-md border transition-colors group flex flex-col justify-between ${
                unassignedTrips > 0 || conflictsCount > 0
                  ? "border-amber-500/50 bg-amber-500/5 hover:border-amber-500"
                  : "border-border/70 bg-muted/20 hover:border-blue-500/50 hover:bg-muted/40"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span
                    className={`flex size-5 items-center justify-center rounded text-[10px] font-bold font-mono ${
                      unassignedTrips > 0 || conflictsCount > 0
                        ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                        : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {unassignedTrips > 0 || conflictsCount > 0 ? "!" : <Check className="size-3" />}
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground">Step 5</span>
                </div>
                <p className="font-bold text-xs text-foreground mt-2 group-hover:text-primary transition-colors">
                  Scheduling
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {totalTrips} Trips Today
                </p>
              </div>
              <div
                className={`mt-2.5 pt-1.5 border-t border-border/60 text-[10px] font-medium ${
                  unassignedTrips > 0
                    ? "text-amber-600 dark:text-amber-400 font-bold"
                    : "text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {unassignedTrips > 0 ? `${unassignedTrips} Unassigned` : "Timetable Ready"}
              </div>
            </Link>

            {/* Step 6: Daily Operations */}
            <Link
              to="/operations/today"
              className="p-3 rounded-md border border-border/70 bg-muted/20 hover:border-blue-500/50 hover:bg-muted/40 transition-colors group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex size-5 items-center justify-center rounded bg-blue-500/15 text-blue-600 dark:text-blue-400 text-[10px] font-bold font-mono">
                    <RouteIcon className="size-3" />
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground">Step 6</span>
                </div>
                <p className="font-bold text-xs text-foreground mt-2 group-hover:text-primary transition-colors">
                  Daily Operations
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Live Dispatch
                </p>
              </div>
              <div className="mt-2.5 pt-1.5 border-t border-border/60 text-[10px] font-medium text-blue-600 dark:text-blue-400 flex items-center justify-between">
                <span>View Road Board</span>
                <ArrowRight className="size-3" />
              </div>
            </Link>
          </div>
        </section>

        {/* 7 PRIORITIZED OPERATIONAL CARDS */}
        <div className="grid gap-3.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
          {/* 1. Today's Trips */}
          <Link
            to="/operations/trips"
            className="rounded-lg border border-border/80 bg-card p-3.5 flex flex-col justify-between hover:border-blue-500/50 transition-colors shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Today's Trips
              </span>
              <CalendarClock className="size-3.5 text-primary" />
            </div>
            <p className="text-2xl font-extrabold tracking-tight mt-1 text-foreground">
              {totalTrips}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Scheduled timetable</p>
          </Link>

          {/* 2. Scheduled Buses */}
          <Link
            to="/fleet/buses"
            className="rounded-lg border border-border/80 bg-card p-3.5 flex flex-col justify-between hover:border-blue-500/50 transition-colors shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Scheduled Buses
              </span>
              <Bus className="size-3.5 text-blue-500" />
            </div>
            <p className="text-2xl font-extrabold tracking-tight mt-1 text-blue-600 dark:text-blue-400">
              {scheduledBuses}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Active on road</p>
          </Link>

          {/* 3. Available Buses */}
          <Link
            to="/fleet/buses"
            className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3.5 flex flex-col justify-between hover:border-emerald-500/50 transition-colors shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Available Buses
              </span>
              <span className="size-2 rounded bg-emerald-500"></span>
            </div>
            <p className="text-2xl font-extrabold tracking-tight mt-1 text-emerald-600 dark:text-emerald-400">
              {availableBuses}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Free at depot</p>
          </Link>

          {/* 4. Available Drivers */}
          <Link
            to="/crew/drivers"
            className="rounded-lg border border-border/80 bg-card p-3.5 flex flex-col justify-between hover:border-blue-500/50 transition-colors shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Available Drivers
              </span>
              <Users className="size-3.5 text-primary" />
            </div>
            <p className="text-2xl font-extrabold tracking-tight mt-1 text-foreground">
              {availableDrivers}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Satisfied rest</p>
          </Link>

          {/* 5. Available Conductors */}
          <Link
            to="/crew/conductors"
            className="rounded-lg border border-border/80 bg-card p-3.5 flex flex-col justify-between hover:border-blue-500/50 transition-colors shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Available Conductors
              </span>
              <Users className="size-3.5 text-muted-foreground" />
            </div>
            <p className="text-2xl font-extrabold tracking-tight mt-1 text-foreground">
              {availableConductors}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Ready for duty</p>
          </Link>

          {/* 6. Unassigned Trips */}
          <Link
            to="/operations/trips"
            className={`rounded-lg border p-3.5 flex flex-col justify-between transition-colors shadow-xs ${
              unassignedTrips > 0
                ? "border-amber-500/30 bg-amber-500/5 hover:border-amber-500"
                : "border-border/80 bg-card"
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider ${
                  unassignedTrips > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"
                }`}
              >
                Unassigned Trips
              </span>
              <Clock
                className={`size-3.5 ${unassignedTrips > 0 ? "text-amber-500" : "text-muted-foreground"}`}
              />
            </div>
            <p
              className={`text-2xl font-extrabold tracking-tight mt-1 ${
                unassignedTrips > 0 ? "text-amber-600 dark:text-amber-400" : "text-foreground"
              }`}
            >
              {unassignedTrips}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {unassignedTrips > 0 ? "Needs bus or staff" : "All trips covered"}
            </p>
          </Link>

          {/* 7. Scheduling Conflicts */}
          <Link
            to="/operations/trips"
            className={`rounded-lg border p-3.5 flex flex-col justify-between transition-colors shadow-xs ${
              conflictsCount > 0
                ? "border-rose-500/30 bg-rose-500/5 hover:border-rose-500"
                : "border-border/80 bg-card"
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider ${
                  conflictsCount > 0 ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground"
                }`}
              >
                Conflicts
              </span>
              <AlertTriangle
                className={`size-3.5 ${conflictsCount > 0 ? "text-rose-500" : "text-muted-foreground"}`}
              />
            </div>
            <p
              className={`text-2xl font-extrabold tracking-tight mt-1 ${
                conflictsCount > 0 ? "text-rose-600 dark:text-rose-400" : "text-foreground"
              }`}
            >
              {conflictsCount}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {conflictsCount > 0 ? "Overlapping trips" : "Zero conflicts"}
            </p>
          </Link>
        </div>

        {/* OPERATIONAL ALERTS NOTICES (If any) */}
        {(unassignedTrips > 0 || maintenanceBuses > 0 || conflictsCount > 0) && (
          <div className="space-y-2">
            {conflictsCount > 0 && (
              <div className="rounded-md border border-rose-500/30 bg-rose-500/10 p-3.5 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="size-4 text-rose-600 dark:text-rose-400 shrink-0" />
                  <span className="font-semibold text-rose-900 dark:text-rose-200">
                    {conflictsCount} timetable scheduling conflicts detected: overlapping trip timings require reassignment.
                  </span>
                </div>
                <Button
                  asChild
                  size="sm"
                  className="h-7 text-xs bg-rose-600 hover:bg-rose-700 text-white rounded-md shrink-0"
                >
                  <Link to="/operations/trips">Resolve Conflicts</Link>
                </Button>
              </div>
            )}

            {unassignedTrips > 0 && (
              <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3.5 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <Clock className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span className="font-semibold text-amber-900 dark:text-amber-200">
                    {unassignedTrips} scheduled trips currently have unassigned buses or staff.
                  </span>
                </div>
                <Button
                  asChild
                  size="sm"
                  className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white rounded-md shrink-0"
                >
                  <Link to="/operations/trips">Assign Resources</Link>
                </Button>
              </div>
            )}
          </div>
        )}

        {/* TODAY'S TIMETABLE PREVIEW */}
        <div className="rounded-lg border border-border/80 bg-card overflow-hidden shadow-xs">
          <div className="p-4 border-b border-border/60 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Today's Scheduled Runs ({TODAY_DATE})
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Upcoming departures across Salem municipal corridors.
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="text-xs rounded-md border-border hover:bg-muted font-medium"
            >
              <Link to="/operations/trips">
                <span>View Full Timetable</span>
                <ArrowRight className="ml-1.5 size-3.5" />
              </Link>
            </Button>
          </div>

          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-[110px] text-xs font-bold text-foreground">Trip Code</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Corridor</TableHead>
                <TableHead className="w-[130px] text-xs font-bold text-foreground">Timings</TableHead>
                <TableHead className="w-[100px] text-xs font-bold text-foreground">Direction</TableHead>
                <TableHead className="w-[160px] text-xs font-bold text-foreground">Bus</TableHead>
                <TableHead className="w-[150px] text-xs font-bold text-foreground">Driver</TableHead>
                <TableHead className="w-[110px] text-xs font-bold text-foreground">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tripsList.slice(0, 8).map((trip) => {
                const assign = tripAssignmentMap.get(trip.id);
                const isUnassigned = !assign || assign.busReg === "Unassigned" || assign.driverName === "Unassigned";

                return (
                  <TableRow key={trip.id}>
                    <TableCell className="font-mono text-xs font-bold text-foreground">
                      {trip.tripCode}
                    </TableCell>
                    <TableCell className="text-xs">
                      <p className="font-semibold text-foreground truncate max-w-[220px]">
                        {trip.routeName || trip.routeCode || "Route Corridor"}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {trip.origin} → {trip.destination}
                      </p>
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      <span className="font-bold text-foreground">
                        {formatMinutesToTimeString(trip.startTime)}
                      </span>
                      <span className="text-muted-foreground mx-1">-</span>
                      <span className="text-muted-foreground">
                        {formatMinutesToTimeString(trip.endTime)}
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
                        <span className="font-medium text-foreground">{assign.busReg}</span>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400 font-medium">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">
                      {assign && assign.driverName !== "Unassigned" ? (
                        <span className="font-medium text-foreground">{assign.driverName}</span>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400 font-medium">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isUnassigned ? (
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
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppShell>
  );
}
