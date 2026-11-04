import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Bus,
  Map,
  Users,
  CalendarClock,
  ArrowRight,
  Route as RouteIcon,
  CheckCircle2,
  Clock,
  PlayCircle,
  HelpCircle,
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
import {
  BUSES,
  CONDUCTORS,
  CORPORATION,
  DEPOT,
  DRIVERS,
  ROUTES,
  SCHEDULE_DATE,
} from "@/lib/transit/data";
import { getBuses, getCrewAvailability } from "@/lib/fleet-crew";
import { getRoutes } from "@/lib/routes-gis-fns";
import { getTrips } from "@/lib/scheduling-fns";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TransitOS Dashboard: Salem Transport Corporation" },
      {
        name: "description",
        content:
          "Operations overview for Salem City corridors: fleet, crew, routes and automated schedule generation.",
      },
      {
        property: "og:title",
        content: "TransitOS Dashboard: Salem Transport Corporation",
      },
      {
        property: "og:description",
        content:
          "Operations overview for Salem City corridors: fleet, crew, routes and automated schedule generation.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const context = Route.useRouteContext();
  const user = context?.user;
  const orgName = user?.tenantName || CORPORATION;
  const depotName = user?.depotName || DEPOT;

  const { data: buses = [] } = useQuery({
    queryKey: ["buses-dashboard"],
    queryFn: () => getBuses(),
  });

  const { data: crewList = [] } = useQuery({
    queryKey: ["crew-dashboard"],
    queryFn: () => getCrewAvailability(),
  });

  const { data: routesList = [] } = useQuery({
    queryKey: ["routes-dashboard"],
    queryFn: () => getRoutes(),
  });

  const { data: tripsList = [] } = useQuery({
    queryKey: ["trips-dashboard"],
    queryFn: () => getTrips({ serviceDate: SCHEDULE_DATE }),
  });

  const totalBuses = buses.length || BUSES.length;
  const totalCrew = crewList.length || DRIVERS.length + CONDUCTORS.length;
  const totalRoutes = routesList.length || ROUTES.length;
  const totalTrips = tripsList.length || 40;

  return (
    <AppShell
      title="Salem Operations Hub"
      subtitle={`${orgName} · ${depotName} · ${SCHEDULE_DATE}`}
      actions={
        <div className="flex items-center gap-2">
          <Button
            asChild
            size="sm"
            variant="outline"
            className="text-xs rounded-md border-border hover:bg-muted"
          >
            <Link to="/operations/trips">
              <CalendarClock className="mr-1.5 size-3.5 text-primary" />
              Bus Schedules
            </Link>
          </Button>
          <Button
            asChild
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-xs cursor-pointer"
          >
            <Link to="/operations/duties">
              <Users className="mr-1.5 size-3.5" />
              Assign Shifts
            </Link>
          </Button>
        </div>
      }
    >
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* WELCOME HERO */}
        <div className="relative overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div className="max-w-2xl space-y-2">
              <div className="inline-flex items-center gap-2 rounded border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                <span className="size-1.5 rounded bg-emerald-500"></span>
                <span>Active Depot: {depotName}</span>
                <span className="text-slate-400">|</span>
                <span>24 Buses Registered</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Salem Bus Transit Operations
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Welcome to your daily transit control desk. Monitor buses
                currently on the road, view daily timetable departures, and
                organize driver shifts with automatic legal rest compliance.
              </p>
            </div>

            {/* Clear Primary Actions */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <Button
                asChild
                size="default"
                className="rounded-md text-xs h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs"
              >
                <Link to="/operations/today">
                  <RouteIcon className="mr-2 size-4" />
                  <span>View Live Dispatch</span>
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="default"
                className="rounded-md text-xs h-10 px-4 border-border hover:bg-muted font-medium bg-card"
              >
                <Link to="/operations/trips">
                  <CalendarClock className="mr-2 size-4 text-primary" />
                  <span>Open Schedules</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* 4 CORE METRIC TILES */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiTile
            icon={Bus}
            color="emerald"
            label="Bus Fleet"
            value={totalBuses}
            badge="18 in Service"
            hint="24 Ashok Leyland & Starbus units"
            to="/fleet/buses"
          />
          <KpiTile
            icon={Users}
            color="blue"
            label="Crew on Roster"
            value={totalCrew}
            badge="Ready to Drive"
            hint="Licensed drivers & conductors"
            to="/crew/drivers"
          />
          <KpiTile
            icon={Map}
            color="cyan"
            label="Active Routes"
            value={totalRoutes}
            badge="54 Stops Total"
            hint="Town Bus Stand, Junction, Omalur"
            to="/network/routes"
          />
          <KpiTile
            icon={CalendarClock}
            color="amber"
            label="Daily Trips"
            value={totalTrips}
            badge="Today's Timetable"
            hint="Scheduled departure intervals"
            to="/operations/trips"
          />
        </div>

        {/* 3-STEP BEGINNER WORKFLOW */}
        <section className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
            <div>
              <h2 className="text-base font-bold tracking-tight text-foreground flex items-center gap-2">
                <span>How TransitOS Works: 3 Simple Steps</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                New to the system? Follow this straightforward sequence to set
                up and manage daily operations.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {/* Step 1 */}
            <Link
              to="/network/routes"
              className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-card hover:border-blue-400 dark:hover:border-blue-600 transition-colors group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center justify-center size-6 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold font-mono">
                    1
                  </span>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-mono border-border text-muted-foreground rounded"
                  >
                    Routes
                  </Badge>
                </div>
                <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors mt-2.5">
                  1. Routes & Bus Network
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Review the 8 Salem bus corridors, terminal stops, and verify
                  available buses at the depot.
                </p>
              </div>
              <div className="mt-4 pt-2.5 border-t border-border/60 flex items-center justify-between text-xs text-primary font-semibold">
                <span>View Route Map</span>
                <ArrowRight className="size-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Step 2 */}
            <Link
              to="/operations/trips"
              className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-card hover:border-blue-400 dark:hover:border-blue-600 transition-colors group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center justify-center size-6 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold font-mono">
                    2
                  </span>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-mono border-border text-muted-foreground rounded"
                  >
                    Timetable
                  </Badge>
                </div>
                <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors mt-2.5">
                  2. Timetable & Departures
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  See when buses need to leave each terminal. Use Auto-Fill to
                  generate trips every 15 or 30 minutes.
                </p>
              </div>
              <div className="mt-4 pt-2.5 border-t border-border/60 flex items-center justify-between text-xs text-primary font-semibold">
                <span>Open Timetable</span>
                <ArrowRight className="size-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Step 3 */}
            <Link
              to="/operations/duties"
              className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-card hover:border-blue-400 dark:hover:border-blue-600 transition-colors group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center justify-center size-6 rounded bg-blue-600 text-white text-xs font-bold font-mono">
                    3
                  </span>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-mono border-border text-muted-foreground rounded"
                  >
                    Shifts
                  </Badge>
                </div>
                <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors mt-2.5">
                  3. Assign Driver Shifts
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Pair buses and drivers with trips. The system automatically
                  ensures statutory rest intervals are met.
                </p>
              </div>
              <div className="mt-4 pt-2.5 border-t border-border/60 flex items-center justify-between text-xs text-blue-600 dark:text-blue-400 font-semibold">
                <span>Manage Shifts</span>
                <ArrowRight className="size-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        </section>

        {/* TODAY'S ACTIVE CORRIDORS OVERVIEW TABLE */}
        <section className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div>
              <h2 className="text-base font-bold tracking-tight text-foreground flex items-center gap-2">
                <RouteIcon className="size-4 text-primary" />
                <span>Salem City Bus Corridors</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Current active corridors connecting Salem railway junction, bus
                stands, and city suburbs.
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="text-xs rounded-md"
            >
              <Link to="/network/routes">View All on Map</Link>
            </Button>
          </div>

          <div className="overflow-x-auto rounded-md border border-border/70">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="w-24 font-bold text-xs">
                    Route
                  </TableHead>
                  <TableHead className="font-bold text-xs">
                    Origin & Destination
                  </TableHead>
                  <TableHead className="w-28 font-bold text-xs">
                    Distance
                  </TableHead>
                  <TableHead className="w-28 font-bold text-xs">
                    Trip Time
                  </TableHead>
                  <TableHead className="w-28 font-bold text-xs">
                    Departures
                  </TableHead>
                  <TableHead className="w-28 text-right font-bold text-xs">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ROUTES.slice(0, 5).map((route) => (
                  <TableRow key={route.id} className="hover:bg-muted/30">
                    <TableCell className="font-mono font-bold text-xs text-primary">
                      {route.code}
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-xs text-foreground">
                        {route.name}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate max-w-md">
                        Via{" "}
                        {route.stops
                          .slice(1, -1)
                          .map((s) => s.name)
                          .join(", ") || "City Center"}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {route.lengthKm} km
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <Clock className="size-3" />
                        {route.durationMin} mins
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="text-[10px] font-mono rounded"
                      >
                        {route.dailyTrips} trips/day
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7 text-primary hover:text-primary rounded-md"
                      >
                        <Link to="/operations/trips">
                          <span>View Trips</span>
                          <ArrowRight className="size-3 ml-1" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>

        {/* BEGINNER QUICK TIP & TEST RUN */}
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="grid size-9 place-items-center rounded bg-blue-600/10 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
              <HelpCircle className="size-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Need to test a scenario before dispatch?
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed max-w-2xl">
                Use the Simulation Deck to see buses driving along Salem
                corridors in real time. You can scrub through the day, test what
                happens if a breakdown occurs, and see how standby vehicles
                respond.
              </p>
            </div>
          </div>
          <Button
            asChild
            size="sm"
            variant="outline"
            className="text-xs rounded-md shrink-0 border-border bg-card hover:bg-muted"
          >
            <Link to="/simulation">
              <PlayCircle className="mr-1.5 size-3.5 text-blue-600 dark:text-blue-400" />
              Launch Simulator
            </Link>
          </Button>
        </div>
      </div>
    </AppShell>
  );
}

function KpiTile({
  icon: Icon,
  color,
  label,
  value,
  badge,
  hint,
  to,
}: {
  icon: typeof Bus;
  color: "emerald" | "blue" | "cyan" | "amber";
  label: string;
  value: number;
  badge: string;
  hint: string;
  to: string;
}) {
  const colorMap = {
    emerald:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    cyan: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
    amber:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  };

  return (
    <Link
      to={to}
      className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 hover:border-slate-400 dark:hover:border-slate-600 transition-colors group block cursor-pointer shadow-xs"
    >
      <div className="flex items-center justify-between">
        <div
          className={`grid size-10 place-items-center rounded border ${colorMap[color]}`}
        >
          <Icon className="size-5" />
        </div>
        <span className="rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-mono font-medium text-slate-600 dark:text-slate-400">
          {badge}
        </span>
      </div>
      <div className="mt-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {label}
        </p>
        <p className="text-3xl font-extrabold tracking-tight text-foreground mt-0.5">
          {value}
        </p>
        <p className="text-xs text-muted-foreground mt-1 truncate">{hint}</p>
      </div>
    </Link>
  );
}
