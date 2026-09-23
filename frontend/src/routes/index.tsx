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
      title="Operations Dashboard"
      subtitle={`${orgName} · ${depotName} · ${SCHEDULE_DATE}`}
      actions={
        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="outline" className="text-xs">
            <Link to="/operations/trips">
              <RouteIcon className="mr-1.5 size-3.5 text-primary" />
              Timetable
            </Link>
          </Button>
          <Button asChild size="sm" className="bg-primary text-primary-foreground text-xs shadow-xs">
            <Link to="/scheduling/optimizer">
              <Sparkles className="mr-1.5 size-3.5 text-amber-300" />
              Launch AI Optimizer
            </Link>
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* RECOMMENDED OPERATIONAL WORKFLOW BANNER */}
        <section className="glass-panel p-5 space-y-4 border-primary/30 relative overflow-hidden bg-gradient-to-r from-primary/5 via-background to-primary/5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="grid size-8 place-items-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                <Workflow className="size-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold tracking-tight text-foreground flex items-center gap-2">
                  <span>Daily Transit Operational Workflow</span>
                  <Badge variant="outline" className="border-primary/30 text-primary text-[10px] font-mono">
                    Recommended Steps
                  </Badge>
                </h2>
                <p className="text-xs text-muted-foreground">
                  New to TransitOS? Follow these 4 steps in order to plan, optimize, and dispatch your transit service.
                </p>
              </div>
            </div>

            <Button asChild variant="outline" size="sm" className="text-xs h-7 gap-1">
              <Link to="/scheduling/optimizer">
                <span>Start AI Optimization</span>
                <ArrowRight className="size-3" />
              </Link>
            </Button>
          </div>

          {/* 4 Interactive Step Cards */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* Step 1 */}
            <Link
              to="/network/routes"
              className="p-3.5 rounded-xl border border-border/70 bg-card/60 hover:border-primary/50 hover:bg-muted/50 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="font-mono text-[10px] uppercase font-bold text-primary bg-primary/10">
                    Step 1
                  </Badge>
                  <span className="text-[10px] font-mono text-muted-foreground">{totalRoutes} Routes</span>
                </div>
                <h3 className="font-bold text-xs text-foreground group-hover:text-primary transition-colors mt-2">
                  Network & Fleet
                </h3>
                <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
                  Setup corridors, stops, vehicle registrations ({totalBuses} buses) and crew rosters ({totalCrew} crew).
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-border/50 flex items-center justify-between text-[11px] text-primary font-medium">
                <span>Review Network</span>
                <ArrowRight className="size-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Step 2 */}
            <Link
              to="/operations/trips"
              className="p-3.5 rounded-xl border border-border/70 bg-card/60 hover:border-primary/50 hover:bg-muted/50 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="font-mono text-[10px] uppercase font-bold text-info bg-info/10">
                    Step 2
                  </Badge>
                  <span className="text-[10px] font-mono text-muted-foreground">{totalTrips} Planned</span>
                </div>
                <h3 className="font-bold text-xs text-foreground group-hover:text-primary transition-colors mt-2">
                  Trip Timetable
                </h3>
                <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
                  Define departures or click "Generate Timetable" to batch create trips at 15 or 30-min intervals.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-border/50 flex items-center justify-between text-[11px] text-info font-medium">
                <span>Manage Timetable</span>
                <ArrowRight className="size-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Step 3 */}
            <Link
              to="/scheduling/optimizer"
              className="p-3.5 rounded-xl border border-primary/40 bg-primary/5 hover:border-primary hover:bg-primary/10 transition-all group flex flex-col justify-between ring-1 ring-primary/20"
            >
              <div>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="font-mono text-[10px] uppercase font-bold text-amber-500 bg-amber-500/10">
                    Step 3 · Core AI
                  </Badge>
                  <Sparkles className="size-3.5 text-amber-400" />
                </div>
                <h3 className="font-bold text-xs text-foreground group-hover:text-primary transition-colors mt-2">
                  Google OR-Tools AI
                </h3>
                <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
                  Run the solver to link trips into optimal shifts (duties), minimizing empty deadhead and bus count.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-border/50 flex items-center justify-between text-[11px] text-primary font-bold">
                <span>Run Optimizer</span>
                <ArrowRight className="size-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Step 4 */}
            <Link
              to="/operations/duties"
              className="p-3.5 rounded-xl border border-border/70 bg-card/60 hover:border-primary/50 hover:bg-muted/50 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="font-mono text-[10px] uppercase font-bold text-emerald-500 bg-emerald-500/10">
                    Step 4
                  </Badge>
                  <span className="text-[10px] font-mono text-muted-foreground">Live Dispatch</span>
                </div>
                <h3 className="font-bold text-xs text-foreground group-hover:text-primary transition-colors mt-2">
                  Duty Builder & Radar
                </h3>
                <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
                  Inspect driver shifts, make manual changes, and simulate breakdown recovery if disruptions strike.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-border/50 flex items-center justify-between text-[11px] text-emerald-500 font-medium">
                <span>Open Duty Builder</span>
                <ArrowRight className="size-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        </section>

        {/* METRIC TILES */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Tile icon={Bus} label="Fleet Inventory" value={totalBuses} hint="depot registered buses" to="/fleet/buses" />
          <Tile icon={Users} label="Active Crew" value={totalCrew} hint="drivers & conductors available" to="/crew/drivers" />
          <Tile icon={Map} label="Corridor Routes" value={totalRoutes} hint="active transit lines" to="/network/routes" />
          <Tile icon={Zap} label="Daily Trips" value={totalTrips} hint="scheduled departures" to="/operations/trips" />
        </div>

        {/* PILLARS / MODULE SHOWCASE */}
        <div className="grid gap-4 md:grid-cols-3">
          {PILLARS.map((p) => (
            <Link
              key={p.title}
              to={p.to}
              className="panel p-5 hover:border-primary/50 hover:shadow-md transition-all group block cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <p.icon className="size-4 text-primary" />
                  <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">{p.title}</span>
                </div>
                <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary text-[10px] font-mono">
                  {p.badge}
                </Badge>
              </div>
              <p className="mt-3 text-xs text-muted-foreground leading-relaxed">{p.text}</p>
              <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-primary">
                <span>Open module</span>
                <ArrowRight className="size-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

function Tile({
  icon: Icon,
  label,
  value,
  hint,
  to,
}: {
  icon: typeof Bus;
  label: string;
  value: number;
  hint: string;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="panel p-4 block hover:border-primary/50 hover:shadow-md hover:scale-[1.02] transition-all group cursor-pointer"
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground group-hover:text-primary transition-colors">{label}</p>
        <div className="flex items-center gap-1">
          <Icon className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
          <ArrowRight className="size-3 text-muted-foreground/40 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>
      <p className="mt-2 font-mono text-3xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </Link>
  );
}
