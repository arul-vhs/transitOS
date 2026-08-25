import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Bus, Map, Shield, Users, Zap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BUSES, CONDUCTORS, CORPORATION, DEPOT, DRIVERS, ROUTES, SCHEDULE_DATE } from "@/lib/transit/data";
import { getBuses, getCrewAvailability } from "@/lib/fleet-crew";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TransitOS Dashboard — Salem Transport Corporation" },
      {
        name: "description",
        content:
          "Operations overview for Salem Central Depot: fleet, crew, routes and automated schedule generation.",
      },
      { property: "og:title", content: "TransitOS Dashboard — Salem Transport Corporation" },
      {
        property: "og:description",
        content: "Operations overview for Salem Central Depot: fleet, crew, routes and automated schedule generation.",
      },
    ],
  }),
  component: Dashboard,
});

const PILLARS = [
  {
    title: "AUTOMATED",
    icon: Zap,
    text: "Feasible bus and crew duties generated in one click from depot resources.",
  },
  {
    title: "INTELLIGENT",
    icon: Shield,
    text: "Duty overlap, rest, turnaround and linked-duty constraints enforced by the engine.",
  },
  {
    title: "DYNAMIC",
    icon: ArrowRight,
    text: "Breakdowns repaired with minimum disruption — unaffected duties stay frozen.",
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

  return (
    <AppShell
      title="Operations Dashboard"
      subtitle={`${orgName} · ${depotName} · ${SCHEDULE_DATE}`}
      actions={
        <Button asChild size="sm">
          <Link to="/scheduling/optimizer">Open Schedule Optimizer</Link>
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Tile icon={Bus} label="Fleet" value={buses.length || BUSES.length} hint="buses at depot" />
          <Tile icon={Users} label="Crew" value={crewList.length || (DRIVERS.length + CONDUCTORS.length)} hint="drivers & conductors" />
          <Tile icon={Map} label="Routes" value={ROUTES.length} hint="active corridors" />
          <Tile icon={Zap} label="Planned Trips" value={36} hint="for the service day" />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {PILLARS.map((p) => (
            <div key={p.title} className="panel p-5">
              <div className="flex items-center gap-2">
                <p.icon className="size-4 text-primary" />
                <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary">
                  {p.title}
                </Badge>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{p.text}</p>
            </div>
          ))}
        </div>

        <div className="panel flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <h2 className="text-sm font-semibold">Demo modules</h2>
            <p className="text-sm text-muted-foreground">
              Schedule Optimizer and Route Network are fully functional in this build.
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/network/routes">Route Network</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/scheduling/optimizer">Schedule Optimizer</Link>
            </Button>
          </div>
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
}: {
  icon: typeof Bus;
  label: string;
  value: number;
  hint: string;
}) {
  return (
    <div className="panel p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <p className="mt-2 font-mono text-3xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
