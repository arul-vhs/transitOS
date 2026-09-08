import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarClock,
  User,
  ShieldAlert,
  CheckCircle,
  Clock,
  Users,
  ShieldCheck,
  Zap,
  Activity,
  Layers,
  Sparkles,
  Info,
} from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { hasPermission } from "@/lib/auth-shared";
import { getCrewAvailability } from "@/lib/fleet-crew";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/crew/availability")({
  beforeLoad: ({ context }) => {
    if (!context.user || !hasPermission(context.user.role, "crew.view")) {
      throw new Error("Forbidden");
    }
  },
  head: () => ({
    meta: [
      { title: "Crew Availability Matrix — TransitOS" },
      { name: "description", content: "Visual crew availability, shift waves and rest timelines." },
    ],
  }),
  component: CrewAvailabilityPage,
});

interface HourStatus {
  status: "available" | "resting" | "on-duty" | "leave" | "unavailable" | "off-duty";
  label: string;
}

function getHourStatus(member: any, hour: number): HourStatus {
  const currentMinutes = hour * 60;

  if (member.status === "leave") {
    return { status: "leave", label: "Leave" };
  }
  if (member.status === "unavailable") {
    return { status: "unavailable", label: "Unavailable" };
  }

  // If resting, they are resting until `restUntil` minutes
  if (member.status === "resting") {
    if (currentMinutes < member.restUntil) {
      return { status: "resting", label: "Resting" };
    }
  }

  // If on-duty, they are busy
  if (member.status === "on-duty") {
    return { status: "on-duty", label: "On Duty" };
  }

  // Check availableFrom hours
  if (currentMinutes < member.availableFrom) {
    return { status: "off-duty", label: "Off Duty" };
  }

  return { status: "available", label: "Available" };
}

function getHourColor(status: string) {
  switch (status) {
    case "available":
      return "bg-emerald-500/80 hover:bg-emerald-500 text-white shadow-2xs";
    case "resting":
      return "bg-amber-500/80 hover:bg-amber-500 text-white shadow-2xs";
    case "on-duty":
      return "bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xs";
    case "leave":
      return "bg-destructive/20 text-destructive border border-destructive/30";
    case "unavailable":
      return "bg-muted text-muted-foreground";
    case "off-duty":
      return "bg-secondary/40 text-muted-foreground/50";
    default:
      return "bg-background";
  }
}

const TIMELINE_HOURS = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];

function CrewAvailabilityPage() {
  const [roleFilter, setRoleFilter] = useState<"all" | "driver" | "conductor">("all");

  const { data: crewList = [], isLoading } = useQuery({
    queryKey: ["crew-availability"],
    queryFn: () => getCrewAvailability(),
  });

  const filteredCrew = crewList.filter((c) => roleFilter === "all" || c.role === roleFilter);

  const availableCount = crewList.filter((c) => c.status === "available").length;
  const onDutyCount = crewList.filter((c) => c.status === "on-duty").length;
  const restingCount = crewList.filter((c) => c.status === "resting").length;

  return (
    <AppShell
      title="Crew Availability Matrix"
      subtitle="Visual 24-hour crew roster timeline, continuous driving constraints, and rest period compliance."
      actions={
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-xs border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10">
            {availableCount} Available Now
          </Badge>
          <Badge variant="outline" className="font-mono text-xs border-primary/30 text-primary bg-primary/10">
            {onDutyCount} On Route
          </Badge>
        </div>
      }
    >
      <div className="space-y-6">
        {/* 1. FILTER & LEGEND HEADER */}
        <div className="glass-panel p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant={roleFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setRoleFilter("all")}
              className="text-xs h-8"
            >
              All Crew ({crewList.length})
            </Button>
            <Button
              variant={roleFilter === "driver" ? "default" : "outline"}
              size="sm"
              onClick={() => setRoleFilter("driver")}
              className="text-xs h-8"
            >
              Drivers ({crewList.filter((c) => c.role === "driver").length})
            </Button>
            <Button
              variant={roleFilter === "conductor" ? "default" : "outline"}
              size="sm"
              onClick={() => setRoleFilter("conductor")}
              className="text-xs h-8"
            >
              Conductors ({crewList.filter((c) => c.role === "conductor").length})
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-emerald-500 shadow-2xs"></span> Available</span>
            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-primary shadow-2xs"></span> On Duty</span>
            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-amber-500 shadow-2xs"></span> Mandatory Rest</span>
            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-destructive/40"></span> Leave</span>
            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-secondary"></span> Off Duty</span>
          </div>
        </div>

        {/* 2. GANTT TIMELINE MATRIX */}
        <div className="glass-panel p-5 overflow-x-auto">
          {isLoading ? (
            <div className="py-16 text-center text-xs text-muted-foreground">Loading crew availability matrix...</div>
          ) : filteredCrew.length === 0 ? (
            <div className="py-16 text-center text-xs text-muted-foreground">No crew members registered in this category.</div>
          ) : (
            <div className="min-w-[960px] space-y-3">
              {/* Hours Header Row */}
              <div className="grid grid-cols-[200px_1fr] items-center text-xs font-bold text-muted-foreground border-b border-border/60 pb-2.5">
                <div className="text-xs font-mono uppercase tracking-wider">Crew Member</div>
                <div
                  className="grid gap-1 text-center"
                  style={{ gridTemplateColumns: `repeat(${TIMELINE_HOURS.length}, minmax(0, 1fr))` }}
                >
                  {TIMELINE_HOURS.map((h) => (
                    <div key={h} className="font-mono text-[11px]">
                      {String(h).padStart(2, "0")}:00
                    </div>
                  ))}
                </div>
              </div>

              {/* Crew Rows */}
              <div className="space-y-2 divide-y divide-border/30">
                {filteredCrew.map((member) => (
                  <div
                    key={member.id}
                    className="grid grid-cols-[200px_1fr] items-center pt-2 hover:bg-muted/30 p-1.5 rounded-lg transition-colors"
                  >
                    <div className="pr-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-foreground truncate">{member.name}</span>
                        <Badge variant="outline" className="text-[9px] uppercase font-mono px-1 py-0">
                          {member.role === "driver" ? "DRV" : "CND"}
                        </Badge>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono">{member.employeeId}</span>
                    </div>

                    {/* Hour Blocks */}
                    <div
                      className="grid gap-1"
                      style={{ gridTemplateColumns: `repeat(${TIMELINE_HOURS.length}, minmax(0, 1fr))` }}
                    >
                      {TIMELINE_HOURS.map((hour) => {
                        const { status, label } = getHourStatus(member, hour);
                        return (
                          <div
                            key={hour}
                            title={`${member.name} (${String(hour).padStart(2, "0")}:00): ${label}`}
                            className={cn(
                              "h-7 rounded-md text-[10px] font-mono font-bold flex items-center justify-center transition-all cursor-default select-none",
                              getHourColor(status)
                            )}
                          >
                            {status === "resting" ? "R" : status === "on-duty" ? "D" : ""}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
