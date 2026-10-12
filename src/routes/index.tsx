import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Bus,
  Map,
  Users,
  AlertTriangle,
  PlayCircle,
  CalendarClock,
  ArrowRight,
  Route as RouteIcon,
  Workflow,
  Zap,
  Sliders,
  Cpu,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
      { property: "og:title", content: "TransitOS Dashboard: Salem Transport Corporation" },
      {
        property: "og:description",
        content:
          "Operations overview for Salem City corridors: fleet, crew, routes and automated schedule generation.",
      },
    ],
  }),
  component: Dashboard,
});

const PILLARS = [
  {
    title: "1. SCHEDULE OPTIMIZER",
    icon: Cpu,
    badge: "Constraint Solver",
    text: "Solves vehicle and crew duty pairing mathematically. Enforces statutory rest windows and eliminates deadhead mileage.",
    to: "/scheduling/optimizer",
  },
  {
    title: "2. DUTY BUILDER",
    icon: CalendarClock,
    badge: "Labor Compliance",
    text: "Assemble linked or unlinked shifts with drag-and-drop controls, verified against Motor Vehicle Act rest regulations.",
    to: "/operations/duties",
  },
  {
    title: "3. DISRUPTION RADAR",
    icon: AlertTriangle,
    badge: "Live Recovery",
    text: "When breakdowns happen, calculates optimal vehicle swaps and short-turns with minimal passenger wait impact.",
    to: "/operations/incidents",
  },
];

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
      title="Operations Command Center"
      subtitle={`${orgName} · ${depotName} · ${SCHEDULE_DATE}`}
      actions={
        <div className="flex items-center gap-2">
          <Button
            asChild
            size="sm"
            variant="outline"
            className="text-xs rounded-md border-slate-300 dark:border-slate-700 bg-background hover:bg-muted"
          >
            <Link to="/simulation">
              <PlayCircle className="mr-1.5 size-3.5 text-blue-600 dark:text-blue-400" />
              Live Simulator
            </Link>
          </Button>
          <Button
            asChild
            size="sm"
            variant="outline"
            className="text-xs rounded-md border-border hover:bg-muted"
          >
            <Link to="/operations/trips">
              <RouteIcon className="mr-1.5 size-3.5 text-primary" />
              Bus Timetable
            </Link>
          </Button>
          <Button
            asChild
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-xs cursor-pointer"
          >
            <Link to="/scheduling/optimizer">
              <Sliders className="mr-1.5 size-3.5" />
              Run Schedule Solver
            </Link>
          </Button>
        </div>
      }
    >
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* OPERATIONAL BANNER */}
        <div className="relative overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="max-w-2xl space-y-2">
              <div className="inline-flex items-center gap-2 rounded border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                <span>Salem City Bus Operations Platform</span>
                <span className="text-slate-400">|</span>
                <span>Active Production Depot</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                TransitOS Operations Command Center
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Centralized transit network operations. Monitor on-road fleet locations, configure daily
                departure headways, generate labor-compliant crew duty rosters via constraint optimization,
                and deploy standby units during corridor disruptions.
              </p>
            </div>

            {/* Quick Action Chips */}
            <div className="flex flex-wrap gap-2 md:justify-end">
              <Button
                asChild
                size="sm"
                className="rounded-md text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs"
              >
                <Link to="/simulation">
                  <PlayCircle className="size-3.5" />
                  <span>Launch Simulator</span>
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="rounded-md text-xs gap-1.5 border-border hover:border-primary/40 bg-card"
              >
                <Link to="/fleet/buses">
                  <Bus className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>24 Fleet Units</span>
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="rounded-md text-xs gap-1.5 border-border hover:border-primary/40 bg-card"
              >
                <Link to="/crew/drivers">
                  <Users className="size-3.5 text-blue-600 dark:text-blue-400" />
                  <span>48 Active Crew</span>
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="rounded-md text-xs gap-1.5 border-border hover:border-primary/40 bg-card"
              >
                <Link to="/network/routes">
                  <Map className="size-3.5 text-slate-600 dark:text-slate-300" />
                  <span>8 Corridors</span>
                </Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="rounded-md text-xs gap-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-semibold shadow-xs"
              >
                <Link to="/scheduling/optimizer">
                  <Sliders className="size-3.5" />
                  <span>Constraint Solver</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* INTERACTIVE SIMULATION DECK FEATURE BANNER */}
        <div className="relative overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-6 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800 text-[10px] font-mono font-bold uppercase tracking-wider rounded">
                  <PlayCircle className="mr-1 size-3" />
                  Corridor Simulator
                </Badge>
                <Badge
                  variant="outline"
                  className="text-[10px] font-mono border-border text-muted-foreground rounded"
                >
                  Time Scrubber 05:30 - 23:00
                </Badge>
                <Badge
                  variant="outline"
                  className="text-[10px] font-mono border-border text-muted-foreground rounded"
                >
                  Disruption Injection
                </Badge>
                <Badge
                  variant="outline"
                  className="text-[10px] font-mono border-border text-muted-foreground rounded"
                >
                  Speed 1x to 60x
                </Badge>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Corridor Trajectory and Operations Simulation
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Inspect 7 active buses driving Salem corridors in real time. Scrub through dawn launch to night
                shift, test what happens when an engine breakdown occurs at Five Roads, trigger automated
                standby vehicle replacement, and inspect timetable adherence.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Button
                asChild
                size="default"
                className="rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-5 h-10 shadow-xs"
              >
                <Link to="/simulation">
                  <PlayCircle className="mr-2 size-4" />
                  <span>Launch Simulation Deck</span>
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* METRIC TILES */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiTile
            icon={Bus}
            color="emerald"
            label="Bus Fleet"
            value={totalBuses}
            badge="18 In Service"
            hint="24 Ashok Leyland & Starbus registered"
            to="/fleet/buses"
          />
          <KpiTile
            icon={Users}
            color="blue"
            label="Crew & Drivers"
            value={totalCrew}
            badge="100% Compliant"
            hint="Drivers & conductors with rest limits"
            to="/crew/drivers"
          />
          <KpiTile
            icon={Map}
            color="cyan"
            label="Corridors & Routes"
            value={totalRoutes}
            badge="54 Bus Stops"
            hint="Salem Junction, Omalur, Gorimedu"
            to="/network/routes"
          />
          <KpiTile
            icon={Zap}
            color="amber"
            label="Scheduled Departures"
            value={totalTrips}
            badge="Peak & Off-Peak"
            hint="Generated daily timetable runs"
            to="/operations/trips"
          />
        </div>

        {/* 4-STEP OPERATIONAL PIPELINE */}
        <section className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
            <div>
              <h2 className="text-base font-bold tracking-tight text-foreground flex items-center gap-2">
                <Workflow className="size-4 text-primary" />
                <span>Standard Operating Workflow</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Sequential operational pipeline: register corridor geometry, set departure headways,
                solve compliant duty pairings, and monitor on-road vehicles.
              </p>
            </div>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-xs text-primary font-semibold rounded-md"
            >
              <Link to="/scheduling/optimizer">
                <span>Open Duty Solver</span>
                <ArrowRight className="size-3 ml-1" />
              </Link>
            </Button>
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            {/* Step 1 */}
            <Link
              to="/network/routes"
              className="p-4 rounded-md border border-slate-200 dark:border-slate-800 bg-card hover:border-slate-400 dark:hover:border-slate-600 transition-colors group flex flex-col justify-between"
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
                    {totalRoutes} Routes
                  </Badge>
                </div>
                <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors mt-2.5">
                  1. Routes & Fleet
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  View Salem's 8 transit corridors and verify available buses and drivers across the
                  4 city depots.
                </p>
              </div>
              <div className="mt-4 pt-2.5 border-t border-border/60 flex items-center justify-between text-xs text-primary font-semibold">
                <span>View Network</span>
                <ArrowRight className="size-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Step 2 */}
            <Link
              to="/operations/trips"
              className="p-4 rounded-md border border-slate-200 dark:border-slate-800 bg-card hover:border-slate-400 dark:hover:border-slate-600 transition-colors group flex flex-col justify-between"
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
                    {totalTrips} Trips
                  </Badge>
                </div>
                <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors mt-2.5">
                  2. Departure Timetable
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Generate trips at 15 or 30-min intervals. Inspect departure times, distances, and peak
                  hours.
                </p>
              </div>
              <div className="mt-4 pt-2.5 border-t border-border/60 flex items-center justify-between text-xs text-primary font-semibold">
                <span>Open Timetable</span>
                <ArrowRight className="size-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Step 3 */}
            <Link
              to="/scheduling/optimizer"
              className="p-4 rounded-md border border-blue-300 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 hover:border-blue-500 transition-colors group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center justify-center size-6 rounded bg-blue-600 text-white text-xs font-bold font-mono">
                    3
                  </span>
                  <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 border-blue-200 text-[10px] font-mono font-bold rounded">
                    Solver
                  </Badge>
                </div>
                <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors mt-2.5">
                  3. Duty Schedule Solver
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Formulate mathematical constraint model to assemble all trips into compliant, fuel-efficient
                  driver shifts.
                </p>
              </div>
              <div className="mt-4 pt-2.5 border-t border-blue-200 dark:border-blue-900 flex items-center justify-between text-xs text-blue-600 dark:text-blue-400 font-bold">
                <span>Run Schedule Solver</span>
                <ArrowRight className="size-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Step 4 */}
            <Link
              to="/operations/duties"
              className="p-4 rounded-md border border-slate-200 dark:border-slate-800 bg-card hover:border-slate-400 dark:hover:border-slate-600 transition-colors group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center justify-center size-6 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold font-mono">
                    4
                  </span>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-mono border-border text-muted-foreground rounded"
                  >
                    Live Dispatch
                  </Badge>
                </div>
                <h3 className="font-bold text-sm text-foreground group-hover:text-emerald-500 transition-colors mt-2.5">
                  4. Driver Shifts & Radar
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Assign drivers to vehicles, audit statutory rest compliance, and utilize the Radar to handle
                  breakdowns instantly.
                </p>
              </div>
              <div className="mt-4 pt-2.5 border-t border-border/60 flex items-center justify-between text-xs text-primary font-semibold">
                <span>Manage Shifts</span>
                <ArrowRight className="size-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        </section>

        {/* CORE ENGINES SHOWCASE */}
        <div className="grid gap-4 md:grid-cols-3">
          {PILLARS.map((p) => (
            <Link
              key={p.title}
              to={p.to}
              className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 hover:border-slate-400 dark:hover:border-slate-600 transition-colors group block cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="grid size-9 place-items-center rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <p.icon className="size-4.5" />
                  </div>
                  <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                    {p.title}
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className="border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-mono rounded"
                >
                  {p.badge}
                </Badge>
              </div>
              <p className="mt-3.5 text-xs text-muted-foreground leading-relaxed">{p.text}</p>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-primary">
                <span>Open Console</span>
                <ArrowRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
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
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    cyan: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  };

  return (
    <Link
      to={to}
      className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 hover:border-slate-400 dark:hover:border-slate-600 transition-colors group block cursor-pointer"
    >
      <div className="flex items-center justify-between">
        <div className={`grid size-10 place-items-center rounded border ${colorMap[color]}`}>
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
        <p className="text-3xl font-extrabold tracking-tight text-foreground mt-0.5">{value}</p>
        <p className="text-xs text-muted-foreground mt-1 truncate">{hint}</p>
      </div>
    </Link>
  );
}
