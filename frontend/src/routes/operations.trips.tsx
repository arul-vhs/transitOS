import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
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
  Settings,
  Sparkles,
  Ban,
  Calendar,
  Clock,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
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
import { getTrips, createTrip, cancelTrip, generateTrips } from "@/lib/scheduling-fns";
import { formatMinutesToTime } from "@/lib/utils";

export const Route = createFileRoute("/operations/trips")({
  beforeLoad: ({ context }) => {
    if (!context.user || !hasPermission(context.user.role, "schedule.view")) {
      throw new Error("Forbidden");
    }
  },
  head: () => ({
    meta: [
      { title: "Trip Management — TransitOS" },
      { name: "description", content: "Timetable registers and frequency-based generators." },
    ],
  }),
  component: TripsPage,
});

const DEFAULT_DATE = "25 Aug 2026";

function parseTimeToMinutes(timeStr: string): number {
  const [hStr, mStr] = timeStr.split(":");
  return Number(hStr || 0) * 60 + Number(mStr || 0);
}

function TripsPage() {
  const queryClient = useQueryClient();
  const context = RootRoute.useRouteContext();
  const user = context?.user;
  const canModify = hasPermission(user?.role || "", "schedule.modify");

  // Filters State
  const [serviceDate, setServiceDate] = useState(DEFAULT_DATE);
  const [routeId, setRouteId] = useState("all");
  const [status, setStatus] = useState("all");
  const [direction, setDirection] = useState("all");

  // Dialog States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);

  // Form States (Single Trip)
  const [formRouteId, setFormRouteId] = useState("");
  const [formStartTime, setFormStartTime] = useState("06:00");
  const [formServiceDate, setFormServiceDate] = useState(DEFAULT_DATE);
  const [formDirection, setFormDirection] = useState("OUTBOUND");

  // Form States (Timetable Generator)
  const [genRouteId, setGenRouteId] = useState("");
  const [genStartTime, setGenStartTime] = useState("06:00");
  const [genEndTime, setGenEndTime] = useState("10:00");
  const [genFrequency, setGenFrequency] = useState("30");
  const [genDirection, setGenDirection] = useState("OUTBOUND");

  // 1. Fetch Routes for Dropdowns
  const { data: routesList = [] } = useQuery({
    queryKey: ["active-routes-trips"],
    queryFn: () => getRoutes({ status: "active" }),
  });

  // Automatically select first route in forms on open
  useEffect(() => {
    if (routesList.length > 0) {
      if (!formRouteId) setFormRouteId(routesList[0].id);
      if (!genRouteId) setGenRouteId(routesList[0].id);
    }
  }, [routesList]);

  // 2. Fetch Trips List
  const { data: tripsList = [], isLoading } = useQuery({
    queryKey: ["trips", serviceDate, routeId, status, direction],
    queryFn: () =>
      getTrips({
        serviceDate,
        routeId,
        status,
        direction,
      }),
  });

  // Mutations
  const createTripMutation = useMutation({
    mutationFn: createTrip,
    onSuccess: (newT) => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      toast.success(`Trip ${newT.tripCode} created successfully.`);
      setIsCreateOpen(false);
      setFormStartTime("06:00");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create trip");
    },
  });

  const generateTripsMutation = useMutation({
    mutationFn: generateTrips,
    onSuccess: (tripsArray) => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      toast.success(`Generated ${tripsArray.length} trips successfully.`);
      setIsGeneratorOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to generate trips");
    },
  });

  const cancelTripMutation = useMutation({
    mutationFn: cancelTrip,
    onSuccess: (updatedT) => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      toast.success(`Trip ${updatedT.tripCode} cancelled successfully.`);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to cancel trip");
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTripMutation.mutate({
      routeId: formRouteId,
      startTime: parseTimeToMinutes(formStartTime),
      serviceDate: formServiceDate,
      direction: formDirection,
      status: "planned",
    });
  };

  const handleGeneratorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generateTripsMutation.mutate({
      routeId: genRouteId,
      serviceDate, // uses the active serviceDate filter
      startTime: parseTimeToMinutes(genStartTime),
      endTime: parseTimeToMinutes(genEndTime),
      frequency: Number(genFrequency),
      direction: genDirection,
    });
  };

  return (
    <AppShell
      title="Trip Management"
      subtitle="Timetable corridors, scheduled trips, and automatic schedule generators."
      actions={
        canModify ? (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsGeneratorOpen(true)}
              className="bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary"
            >
              <Sparkles className="mr-2 size-4" />
              Generate Timetable
            </Button>
            <Button size="sm" onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 size-4" />
              Create Trip
            </Button>
          </div>
        ) : undefined
      }
    >
      <div className="space-y-6">
        {/* 1. Filter Bar */}
        <div className="panel p-4 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-1 flex-wrap gap-3 items-center min-w-[280px]">
            {/* Service Date Input */}
            <div className="flex items-center gap-2">
              <Calendar className="size-4 text-muted-foreground shrink-0" />
              <Input
                type="text"
                placeholder="25 Aug 2026"
                value={serviceDate}
                onChange={(e) => setServiceDate(e.target.value)}
                className="w-[140px] bg-background/50 h-9 text-sm"
              />
            </div>

            {/* Route Select */}
            <div className="flex items-center gap-2">
              <Compass className="size-4 text-muted-foreground shrink-0" />
              <Select value={routeId} onValueChange={setRouteId}>
                <SelectTrigger className="w-[180px] bg-background/50">
                  <SelectValue placeholder="All Routes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Corridors</SelectItem>
                  {routesList.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.code} · {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Select */}
            <div className="flex items-center gap-2">
              <Filter className="size-4 text-muted-foreground shrink-0" />
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-[130px] bg-background/50">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Direction Select */}
            <div className="flex items-center gap-2">
              <Select value={direction} onValueChange={setDirection}>
                <SelectTrigger className="w-[140px] bg-background/50">
                  <SelectValue placeholder="Direction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Directions</SelectItem>
                  <SelectItem value="OUTBOUND">Outbound</SelectItem>
                  <SelectItem value="INBOUND">Inbound</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* 2. Main Trips Table */}
        <section className="panel overflow-hidden">
          {isLoading ? (
            <div className="py-20 text-center text-xs text-muted-foreground">Loading scheduled trips...</div>
          ) : tripsList.length === 0 ? (
            <div className="py-20 text-center text-xs text-muted-foreground">
              No trips scheduled for this date matching the filters. Click "Generate Timetable" to populate.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Trip Code</TableHead>
                  <TableHead>Route Code</TableHead>
                  <TableHead>Route Name</TableHead>
                  <TableHead className="w-[120px]">Direction</TableHead>
                  <TableHead className="w-[100px]">Start Time</TableHead>
                  <TableHead className="w-[100px]">End Time</TableHead>
                  <TableHead className="w-[100px]">Duration</TableHead>
                  <TableHead className="w-[100px]">Distance</TableHead>
                  <TableHead className="w-[110px]">Status</TableHead>
                  {canModify && <TableHead className="w-[80px] text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {tripsList.map((t) => (
                  <TableRow key={t.id} className={t.status === "cancelled" ? "opacity-60 bg-muted/5" : ""}>
                    <TableCell className="font-mono font-bold text-primary">{t.tripCode}</TableCell>
                    <TableCell className="font-semibold text-xs">{t.routeCode}</TableCell>
                    <TableCell className="text-sm font-medium">{t.routeName}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[9px] uppercase font-bold px-1.5 h-5">
                        {t.direction}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono font-semibold">{formatMinutesToTime(t.startTime)}</TableCell>
                    <TableCell className="font-mono text-muted-foreground">{formatMinutesToTime(t.endTime)}</TableCell>
                    <TableCell className="font-mono text-xs">{t.durationMin} min</TableCell>
                    <TableCell className="font-mono text-xs">{t.distanceKm} km</TableCell>
                    <TableCell>
                      <Badge
                        variant={t.status === "cancelled" ? "destructive" : t.status === "planned" ? "secondary" : "default"}
                        className="text-[9px] uppercase font-bold py-0.5"
                      >
                        {t.status}
                      </Badge>
                    </TableCell>
                    {canModify && (
                      <TableCell className="text-right">
                        {t.status !== "cancelled" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              if (confirm(`Cancel trip ${t.tripCode}?`)) {
                                cancelTripMutation.mutate(t.id);
                              }
                            }}
                          >
                            <Ban className="size-3.5" />
                            <span className="sr-only">Cancel Trip</span>
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </section>
      </div>

      {/* CREATE SINGLE TRIP DIALOG */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <form onSubmit={handleCreateSubmit}>
            <DialogHeader>
              <DialogTitle>Create Scheduled Trip</DialogTitle>
              <DialogDescription>
                Schedule an individual trip. Code, duration and endpoints are auto-resolved from route geometries.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="route" className="text-right">Route</Label>
                <Select value={formRouteId} onValueChange={setFormRouteId}>
                  <SelectTrigger id="route" className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {routesList.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.code} · {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="start" className="text-right">Start Time</Label>
                <Input
                  id="start"
                  type="time"
                  value={formStartTime}
                  onChange={(e) => setFormStartTime(e.target.value)}
                  className="col-span-3 font-mono"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right text-xs">Service Date</Label>
                <Input
                  id="date"
                  value={formServiceDate}
                  onChange={(e) => setFormServiceDate(e.target.value)}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="directionForm" className="text-right">Direction</Label>
                <Select value={formDirection} onValueChange={setFormDirection}>
                  <SelectTrigger id="directionForm" className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OUTBOUND">OUTBOUND</SelectItem>
                    <SelectItem value="INBOUND">INBOUND</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createTripMutation.isPending}>
                {createTripMutation.isPending ? "Creating..." : "Save Trip"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* TIMETABLE GENERATOR DIALOG */}
      <Dialog open={isGeneratorOpen} onOpenChange={setIsGeneratorOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <form onSubmit={handleGeneratorSubmit}>
            <DialogHeader>
              <DialogTitle>Generate Route Timetable</DialogTitle>
              <DialogDescription>
                Generate multiple sequential trips for date <b>{serviceDate}</b> at a custom frequency interval.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="genRoute" className="text-right">Route</Label>
                <Select value={genRouteId} onValueChange={setGenRouteId}>
                  <SelectTrigger id="genRoute" className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {routesList.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.code} · {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="genStart" className="text-right text-xs">Start Limit</Label>
                <Input
                  id="genStart"
                  type="time"
                  value={genStartTime}
                  onChange={(e) => setGenStartTime(e.target.value)}
                  className="col-span-3 font-mono"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="genEnd" className="text-right text-xs">End Limit</Label>
                <Input
                  id="genEnd"
                  type="time"
                  value={genEndTime}
                  onChange={(e) => setGenEndTime(e.target.value)}
                  className="col-span-3 font-mono"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="genFreq" className="text-right text-xs">Freq (min)</Label>
                <Input
                  id="genFreq"
                  type="number"
                  min="5"
                  value={genFrequency}
                  onChange={(e) => setGenFrequency(e.target.value)}
                  className="col-span-3 font-mono"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="genDirection" className="text-right">Direction</Label>
                <Select value={genDirection} onValueChange={setGenDirection}>
                  <SelectTrigger id="genDirection" className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OUTBOUND">OUTBOUND</SelectItem>
                    <SelectItem value="INBOUND">INBOUND</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsGeneratorOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={generateTripsMutation.isPending}>
                {generateTripsMutation.isPending ? "Generating..." : "Generate Timetable"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
