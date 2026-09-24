import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Bus,
  Map,
  Shield,
  Users,
  Zap,
  Sparkles,
  CalendarClock,
  Route as RouteIcon,
  AlertTriangle,
  Workflow,
  PlayCircle,
  CheckCircle2,
  HelpCircle,
  Layers,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BUSES, CONDUCTORS, CORPORATION, DEPOT, DRIVERS, ROUTES, SCHEDULE_DATE } from "@/lib/transit/data";
import { getBuses, getCrewAvailability } from "@/lib/fleet-crew";
import { getRoutes } from "@/lib/routes-gis-fns";
import { getTrips } from "@/lib/scheduling-fns";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TransitOS Dashboard — Salem Transport Corporation" },
      {
        name: "description",
        content:
          "Operations overview for Salem City corridors: fleet, crew, routes and automated schedule generation.",
      },
      { property: "og:title", content: "TransitOS Dashboard — Salem Transport Corporation" },
      {
        property: "og:description",
        content: "Operations overview for Salem City corridors: fleet, crew, routes and automated schedule generation.",
      },
    ],
  }),
  component: Dashboard,
});

const PILLARS = [
  {
    title: "1. SCHEDULE OPTIMIZER",
    icon: Sparkles,
    badge: "Google OR-Tools",
    text: "Solves vehicle & crew pairing mathematically. Eliminates continuous driving violations & reduces deadhead.",
    to: "/scheduling/optimizer",
  },
  {
    title: "2. DUTY BUILDER",
    icon: CalendarClock,
    badge: "Labor Compliance",
    text: "Assemble linked or unlinked shifts with drag-and-drop ease, verified against Motor Vehicle Act rest windows.",
    to: "/operations/duties",
  },
  {
    title: "3. DISRUPTION RADAR",
    icon: AlertTriangle,
    badge: "Live Recovery",
    text: "When breakdowns happen, calculates optimal vehicle swaps & short-turns with minimal passenger wait impact.",
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
  const totalCrew = crewList.length || (DRIVERS.length + CONDUCTORS.length);
  const totalRoutes = routesList.length || ROUTES.length;
  const totalTrips = tripsList.length || 40;

  return (
    <AppShell
      title="Operations Command Center"
      subtitle={`${orgName} · ${depotName} · ${SCHEDULE_DATE}`}
      actions={
        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="outline" className="text-xs rounded-xl border-indigo-500/30 text-indigo-600 dark:text-indigo-400 bg-indigo-500/5 hover:bg-indigo-500/15">
            <Link to="/simulation">
              <PlayCircle className="mr-1.5 size-3.5 text-indigo-500 animate-pulse" />
              Live Simulator
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="text-xs rounded-xl border-border/80 hover:bg-muted/60">
            <Link to="/operations/trips">
              <RouteIcon className="mr-1.5 size-3.5 text-primary" />
              Bus Timetable
            </Link>
          </Button>
          <Button asChild size="sm" className="bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-500/20 cursor-pointer">
            <Link to="/scheduling/optimizer">
              <Sparkles className="mr-1.5 size-3.5 text-amber-300" />
              Run AI Optimizer
            </Link>
          </Button>
        </div>
      }
    >
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* WELCOME HERO CARD (APPLE-CLEAN + SEMRUSH CLARITY) */}
        <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 p-6 sm:p-8 shadow-xl shadow-primary/5">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="max-w-2xl space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Sparkles className="size-3.5 text-primary" />
                <span>Salem City Bus Operations Platform</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Welcome to TransitOS
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your end-to-end intelligent transit network. Track live buses, plan daily departures, generate legal driver shifts with Google AI, and resolve disruptions in seconds.
              </p>
            </div>

            {/* Quick Action Chips */}
            <div className="flex flex-wrap gap-2 md:justify-end">
              <Button asChild size="sm" className="rounded-xl text-xs gap-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold shadow-md shadow-indigo-500/25">
                <Link to="/simulation">
                  <PlayCircle className="size-3.5" />
                  <span>Launch Simulator</span>
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="rounded-xl text-xs gap-1.5 border-border/80 hover:border-primary/40 bg-card">
                <Link to="/fleet/buses">
                  <Bus className="size-3.5 text-emerald-500" />
                  <span>24 Buses Fleet</span>
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="rounded-xl text-xs gap-1.5 border-border/80 hover:border-primary/40 bg-card">
                <Link to="/crew/drivers">
                  <Users className="size-3.5 text-violet-500" />
                  <span>48 Drivers & Crew</span>
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="rounded-xl text-xs gap-1.5 border-border/80 hover:border-primary/40 bg-card">
                <Link to="/network/routes">
                  <Map className="size-3.5 text-cyan-500" />
                  <span>8 Corridors</span>
                </Link>
              </Button>
              <Button asChild size="sm" className="rounded-xl text-xs gap-1.5 bg-primary text-primary-foreground font-semibold shadow-xs">
                <Link to="/scheduling/optimizer">
                  <Zap className="size-3.5 text-amber-300" />
                  <span>1-Click AI Solver</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* INTERACTIVE SIMULATION DECK FEATURE BANNER */}
        <div className="relative overflow-hidden rounded-3xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/20 via-purple-950/10 to-card p-6 shadow-xl shadow-indigo-500/5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 text-[10px] font-mono font-bold uppercase tracking-wider">
                  <PlayCircle className="mr-1 size-3 animate-pulse" />
                  Interactive Simulation Deck
                </Badge>
                <Badge variant="outline" className="text-[10px] font-mono border-border text-muted-foreground">
                  Time Scrubber 05:30 - 23:00
                </Badge>
                <Badge variant="outline" className="text-[10px] font-mono border-border text-muted-foreground">
                  Live Disruption Injector
                </Badge>
                <Badge variant="outline" className="text-[10px] font-mono border-border text-muted-foreground">
                  Speed 1x to 60x
                </Badge>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                Understand TransitOS in Action with Live Simulation
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Watch 7 buses drive Salem corridors in real time. Scrub through dawn launch to night shift, test what happens when an engine breaks down at Five Roads, trigger instant standby bus auto-recovery, and see Google OR-Tools AI optimization live.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Button asChild size="lg" className="rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold shadow-lg shadow-indigo-500/30">
                <Link to="/simulation">
                  <PlayCircle className="mr-2 size-4.5" />
                  <span>Launch Simulation Deck</span>
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* VIBRANT SEMRUSH-STYLE KPI TILES */}
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
            color="violet"
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

        {/* 4-STEP OPERATIONAL PIPELINE (LAYMAN-FRIENDLY WIZARD) */}
        <section className="rounded-3xl border border-border/80 bg-card/60 p-6 space-y-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
            <div>
              <h2 className="text-base font-bold tracking-tight text-foreground flex items-center gap-2">
                <Workflow className="size-4 text-primary" />
                <span>How Transit Operations Work (Simple 4-Step Process)</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Everything connects in a simple chain: register your buses ➔ set the departure times ➔ let AI build driver shifts ➔ track live on-road buses.
              </p>
            </div>
            <Button asChild variant="ghost" size="sm" className="text-xs text-primary font-semibold">
              <Link to="/scheduling/optimizer">
                <span>Fast-Forward to AI Optimizer</span>
                <ArrowRight className="size-3 ml-1" />
              </Link>
            </Button>
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            {/* Step 1 */}
            <Link
              to="/network/routes"
              className="p-4 rounded-2xl border border-border/70 bg-card hover:border-primary/50 hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center justify-center size-6 rounded-full bg-primary/10 text-primary text-xs font-bold font-mono">
                    1
                  </span>
                  <Badge variant="outline" className="text-[10px] font-mono border-border text-muted-foreground">
                    {totalRoutes} Routes
                  </Badge>
                </div>
                <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors mt-2.5">
                  1. Routes & Fleet
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  View Salem's 8 transit corridors and verify available buses and drivers across the 4 city depots.
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
              className="p-4 rounded-2xl border border-border/70 bg-card hover:border-info/50 hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center justify-center size-6 rounded-full bg-info/10 text-info text-xs font-bold font-mono">
                    2
                  </span>
                  <Badge variant="outline" className="text-[10px] font-mono border-border text-muted-foreground">
                    {totalTrips} Trips
                  </Badge>
                </div>
                <h3 className="font-bold text-sm text-foreground group-hover:text-info transition-colors mt-2.5">
                  2. Departure Timetable
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Generate trips at 15 or 30-min intervals. See departure times, distances, and peak hours.
                </p>
              </div>
              <div className="mt-4 pt-2.5 border-t border-border/60 flex items-center justify-between text-xs text-info font-semibold">
                <span>Open Timetable</span>
                <ArrowRight className="size-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Step 3 */}
            <Link
              to="/scheduling/optimizer"
              className="p-4 rounded-2xl border border-primary/40 bg-gradient-to-b from-primary/10 to-primary/5 hover:border-primary hover:shadow-lg transition-all group flex flex-col justify-between ring-1 ring-primary/25"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center justify-center size-6 rounded-full bg-primary text-white text-xs font-bold font-mono">
                    3
                  </span>
                  <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] font-mono font-bold">
                    AI Solver
                  </Badge>
                </div>
                <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors mt-2.5">
                  3. AI Auto-Scheduler
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Click 1 button to let Google OR-Tools assemble all trips into legal, fuel-saving driver shifts.
                </p>
              </div>
              <div className="mt-4 pt-2.5 border-t border-border/60 flex items-center justify-between text-xs text-primary font-bold">
                <span>Run AI Optimizer</span>
                <ArrowRight className="size-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Step 4 */}
            <Link
              to="/operations/duties"
              className="p-4 rounded-2xl border border-border/70 bg-card hover:border-emerald-500/50 hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center justify-center size-6 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-bold font-mono">
                    4
                  </span>
                  <Badge variant="outline" className="text-[10px] font-mono border-border text-muted-foreground">
                    Live Dispatch
                  </Badge>
                </div>
                <h3 className="font-bold text-sm text-foreground group-hover:text-emerald-500 transition-colors mt-2.5">
                  4. Driver Shifts & Radar
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Assign drivers to buses, check rest compliance, and use the Radar to handle breakdowns instantly.
                </p>
              </div>
              <div className="mt-4 pt-2.5 border-t border-border/60 flex items-center justify-between text-xs text-emerald-500 font-semibold">
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
              className="rounded-3xl border border-border/80 bg-card p-6 hover:border-primary/50 hover:shadow-xl hover:-translate-y-1 transition-all group block cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="grid size-9 place-items-center rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                    <p.icon className="size-4.5" />
                  </div>
                  <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{p.title}</span>
                </div>
                <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary text-[10px] font-mono">
                  {p.badge}
                </Badge>
              </div>
              <p className="mt-3.5 text-xs text-muted-foreground leading-relaxed">{p.text}</p>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-primary">
                <span>Explore tool</span>
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
  color: "emerald" | "violet" | "cyan" | "amber";
  label: string;
  value: number;
  badge: string;
  hint: string;
  to: string;
}) {
  const colorMap = {
    emerald: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    violet: "bg-violet-500/10 text-violet-600 border-violet-500/20",
    cyan: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
    amber: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  };

  return (
    <Link
      to={to}
      className="rounded-3xl border border-border/80 bg-card p-5 hover:border-primary/40 hover:shadow-lg hover:-translate-y-1 transition-all group block cursor-pointer"
    >
      <div className="flex items-center justify-between">
        <div className={`grid size-10 place-items-center rounded-2xl border ${colorMap[color]}`}>
          <Icon className="size-5" />
        </div>
        <span className="rounded-full bg-muted/60 px-2 py-0.5 text-[10px] font-mono font-medium text-muted-foreground">
          {badge}
        </span>
      </div>
      <div className="mt-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-3xl font-extrabold tracking-tight text-foreground mt-0.5">{value}</p>
        <p className="text-xs text-muted-foreground mt-1 truncate">{hint}</p>
      </div>
    </Link>
  );
}

