import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock, User, ShieldAlert, CheckCircle, Clock } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
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
      { title: "Crew Availability — TransitOS" },
      { name: "description", content: "Visual crew availability, shift waves and rest timelines." },
    ],
  }),
  component: CrewAvailabilityPage,
});

// Helper to check if a crew member is available at a given hour
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
      return "bg-success hover:bg-success/90 text-success-foreground";
    case "resting":
      return "bg-warning hover:bg-warning/90 text-warning-foreground text-[10px] font-bold flex items-center justify-center";
    case "on-duty":
      return "bg-primary hover:bg-primary/90 text-primary-foreground";
    case "leave":
      return "bg-destructive/20 text-destructive border border-destructive/20";
    case "unavailable":
      return "bg-muted text-muted-foreground";
    case "off-duty":
      return "bg-secondary text-secondary-foreground/40";
    default:
      return "bg-background";
  }
}

const TIMELINE_HOURS = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];

function CrewAvailabilityPage() {
  const [roleFilter, setRoleFilter] = useState<"all" | "driver" | "conductor">("all");

  const { data: crewList = [], isLoading } = useQuery({
    queryKey: ["crew-availability"],
    queryFn: () => getCrewAvailability(),
  });

  const filteredCrew = crewList.filter((c) => roleFilter === "all" || c.role === roleFilter);

  return (
    <AppShell
      title="Crew Availability"
      subtitle="Timeline register demonstrating active driver and conductor availability constraints."
    >
      <div className="space-y-6">
        {/* 1. Header Filter Actions */}
        <div className="panel p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2">
            <Button
              variant={roleFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setRoleFilter("all")}
            >
              All Crew ({crewList.length})
            </Button>
            <Button
              variant={roleFilter === "driver" ? "default" : "outline"}
              size="sm"
              onClick={() => setRoleFilter("driver")}
            >
              Drivers ({crewList.filter((c) => c.role === "driver").length})
            </Button>
            <Button
              variant={roleFilter === "conductor" ? "default" : "outline"}
              size="sm"
              onClick={() => setRoleFilter("conductor")}
            >
              Conductors ({crewList.filter((c) => c.role === "conductor").length})
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-success block"></span> Available</span>
            <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-primary block"></span> On Duty</span>
            <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-warning block"></span> Resting</span>
            <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-destructive/30 block"></span> Leave</span>
            <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-muted block"></span> Unavailable</span>
          </div>
        </div>

        {/* 2. Visual Timeline panel */}
        <div className="panel p-5 overflow-x-auto">
          {isLoading ? (
            <div className="py-10 text-center text-muted-foreground">Loading crew timeline registers...</div>
          ) : filteredCrew.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">No crew members registered.</div>
          ) : (
            <div className="min-w-[800px] space-y-4">
              {/* Hours Header Row */}
              <div className="grid grid-cols-[180px_1fr] items-center text-xs font-bold text-muted-foreground border-b pb-2">
                <div>Crew Member</div>
                <div className="grid gap-1 text-center" style={{ gridTemplateColumns: 'repeat(17, minmax(0, 1fr))' }}>
                  {TIMELINE_HOURS.map((h) => (
                    <div key={h} className="font-mono">
                      {String(h).padStart(2, "0")}
                    </div>
                  ))}
                </div>
              </div>

              {/* Crew Timeline Rows */}
              <div className="divide-y space-y-3">
                {filteredCrew.map((member) => (
                  <div key={member.id} className="grid grid-cols-[180px_1fr] items-center py-2.5">
                    <div className="pr-4">
                      <div className="font-semibold text-sm truncate flex items-center gap-1.5">
                        <User className="size-3.5 text-muted-foreground shrink-0" />
                        {member.name}
                      </div>
                      <div className="flex gap-2 items-center mt-1">
                        <span className="text-[10px] font-mono text-muted-foreground uppercase">{member.employeeId}</span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[8px] h-4 py-0 px-1 border-primary/20 bg-primary/5 uppercase text-primary shrink-0",
                            member.role === "conductor" && "border-info/20 bg-info/5 text-info"
                          )}
                        >
                          {member.role}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid gap-1 h-9" style={{ gridTemplateColumns: 'repeat(17, minmax(0, 1fr))' }}>
                      {TIMELINE_HOURS.map((hour) => {
                        const cell = getHourStatus(member, hour);
                        return (
                          <div
                            key={hour}
                            className={cn(
                              "rounded-md transition-all flex items-center justify-center text-[8px] font-bold uppercase",
                              getHourColor(cell.status)
                            )}
                            title={`${member.name} (${member.role}): ${cell.label} at ${String(hour).padStart(2, "0")}:00`}
                          >
                            {cell.status === "resting" && "REST"}
                            {cell.status === "on-duty" && "BUSY"}
                            {cell.status === "leave" && "LV"}
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
