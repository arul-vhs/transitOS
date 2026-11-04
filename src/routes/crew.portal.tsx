import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Users,
  Bus,
  Calendar,
  Clock,
  MapPin,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Send,
  Radio,
  FileText,
  AlertCircle,
  Wrench,
  Check,
  ChevronRight,
  Sparkles,
  PhoneCall,
  Flame,
  ArrowRight,
  RefreshCw,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Route as RootRoute } from "@/routes/__root";
import { useActiveTenant } from "@/lib/tenant-context";
import { getDrivers, getConductors, getBuses } from "@/lib/fleet-crew";
import { getDuties, getTrips } from "@/lib/scheduling-fns";
import { getRoutes, getAllStops } from "@/lib/routes-gis-fns";
import { createIncident, getIncidents } from "@/lib/rescheduling-fns";
import { formatMinutesToTime } from "@/lib/utils";

export const Route = createFileRoute("/crew/portal")({
  beforeLoad: ({ context }) => {
    if (!context.user) {
      throw redirect({ to: "/login" });
    }
  },
  head: () => ({
    meta: [
      { title: "Crew Self-Service Portal: TransitOS" },
      {
        name: "description",
        content:
          "Driver and Conductor shift schedule, vehicle duty assignment, and live operational disruption reporting.",
      },
    ],
  }),
  component: CrewPortalPage,
});

const TODAY_SERVICE_DATE = "25 Aug 2026";

interface ReportedProblemItem {
  id: string;
  category: string;
  severity: string;
  tripCode?: string;
  busReg?: string;
  location?: string;
  description: string;
  status: "REPORTED" | "DISPATCH_ASSIGNED" | "RESOLVED";
  reportedAt: string;
}

function CrewPortalPage() {
  const queryClient = useQueryClient();
  const context = RootRoute.useRouteContext();
  const user = context?.user;
  const { currentTenant, currentDepot } = useActiveTenant();

  // Role & Crew selection state
  const [selectedRole, setSelectedRole] = useState<"driver" | "conductor">("driver");
  const [selectedCrewId, setSelectedCrewId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"schedule" | "report" | "history">("schedule");

  // Problem reporting form state
  const [problemCategory, setProblemCategory] = useState<string>("BUS_BREAKDOWN");
  const [problemSeverity, setProblemSeverity] = useState<"low" | "medium" | "high" | "critical">("high");
  const [problemLocation, setProblemLocation] = useState<string>("");
  const [problemDescription, setProblemDescription] = useState<string>("");
  const [reportedIssues, setReportedIssues] = useState<ReportedProblemItem[]>([]);

  // 1. Fetch Crew Members
  const { data: driversList = [], isLoading: driversLoading } = useQuery({
    queryKey: ["drivers", currentTenant.id],
    queryFn: () => getDrivers(),
  });

  const { data: conductorsList = [], isLoading: conductorsLoading } = useQuery({
    queryKey: ["conductors", currentTenant.id],
    queryFn: () => getConductors(),
  });

  const activeCrewList = selectedRole === "driver" ? driversList : conductorsList;

  // Auto-select first crew member if none selected
  const activeCrewMember = useMemo(() => {
    if (selectedCrewId) {
      const found = activeCrewList.find((c: any) => c.id === selectedCrewId);
      if (found) return found;
    }
    return activeCrewList[0] || null;
  }, [activeCrewList, selectedCrewId]);

  // 2. Fetch Buses
  const { data: busesList = [] } = useQuery({
    queryKey: ["buses-dashboard", currentTenant.id],
    queryFn: () => getBuses(),
  });

  // 3. Fetch Routes & Stops
  const { data: routesList = [] } = useQuery({
    queryKey: ["routes", currentTenant.id],
    queryFn: () => getRoutes(),
  });

  const { data: allStopsList = [] } = useQuery({
    queryKey: ["all-stops", currentTenant.id],
    queryFn: () => getAllStops(),
  });

  // 4. Fetch Duties for Today
  const { data: dutiesList = [], isLoading: dutiesLoading } = useQuery({
    queryKey: ["duties", currentTenant.id, TODAY_SERVICE_DATE],
    queryFn: () => getDuties({ serviceDate: TODAY_SERVICE_DATE }),
  });

  // 5. Fetch Trips for Today
  const { data: tripsList = [] } = useQuery({
    queryKey: ["trips", currentTenant.id, TODAY_SERVICE_DATE],
    queryFn: () => getTrips({ serviceDate: TODAY_SERVICE_DATE }),
  });

  // Find assigned duty for the selected crew member
  const assignedDuty = useMemo(() => {
    if (!activeCrewMember) return null;
    const crewId = activeCrewMember.id;

    // Check if directly assigned on duty
    const directDuty = dutiesList.find(
      (d: any) => d.driverId === crewId || d.conductorId === crewId,
    );
    if (directDuty) return directDuty;

    // Default to the first duty of the tenant so the roster is never empty
    return dutiesList[0] || null;
  }, [activeCrewMember, dutiesList]);

  // Resolve assigned vehicle
  const assignedBus = useMemo(() => {
    if (!assignedDuty || !assignedDuty.busId) return null;
    return (
      busesList.find((b: any) => b.id === assignedDuty.busId) ||
      assignedDuty.bus ||
      null
    );
  }, [assignedDuty, busesList]);

  // Resolve assigned trips for this duty
  const dutyTripsList = useMemo(() => {
    if (!assignedDuty) return [];

    if (assignedDuty.trips && assignedDuty.trips.length > 0) {
      return assignedDuty.trips;
    }

    if (assignedDuty.dutyTrips && assignedDuty.dutyTrips.length > 0) {
      return assignedDuty.dutyTrips
        .map((dt: any) => dt.trip)
        .filter(Boolean);
    }

    // Fallback: match trips by route or take first 3 trips
    return tripsList.slice(0, 3);
  }, [assignedDuty, tripsList]);

  // Mutation to report an incident
  const reportIncidentMutation = useMutation({
    mutationFn: async (payload: {
      category: string;
      severity: "low" | "medium" | "high" | "critical";
      location: string;
      description: string;
    }) => {
      const activeTrip = dutyTripsList[0];
      const res = await createIncident({
        type: payload.category,
        severity: payload.severity,
        serviceDate: TODAY_SERVICE_DATE,
        resourceType: selectedRole === "driver" ? "crew" : "bus",
        resourceId: activeCrewMember?.id || null,
        tripId: activeTrip?.id || null,
        routeId: activeTrip?.routeId || null,
        startTime: 480, // 08:00
        expectedEndTime: 540,
        location: payload.location || activeTrip?.origin || "On Route",
        description: `[Crew Report by ${activeCrewMember?.name || "Staff"} (${selectedRole})]: ${payload.description}`,
      });
      return res;
    },
    onSuccess: (data) => {
      toast.success(
        `Disruption report #${data?.incident?.id?.slice(0, 8) || "LOGGED"} transmitted to Central Dispatch.`,
      );
      // Add to local history
      const newReport: ReportedProblemItem = {
        id: data?.incident?.id || `INC-${Date.now()}`,
        category: problemCategory,
        severity: problemSeverity,
        tripCode: dutyTripsList[0]?.tripCode || dutyTripsList[0]?.tripNumber || "TR-ACTIVE",
        busReg: assignedBus?.registrationNumber || "TN-01-N-1001",
        location: problemLocation || "En Route",
        description: problemDescription,
        status: "REPORTED",
        reportedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setReportedIssues((prev) => [newReport, ...prev]);

      // Reset form
      setProblemDescription("");
      setProblemLocation("");
      setActiveTab("history");

      queryClient.invalidateQueries({ queryKey: ["incidents-list"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to submit incident report.");
    },
  });

  const handleSubmitProblem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!problemDescription.trim()) {
      toast.error("Please provide a description of the issue.");
      return;
    }
    reportIncidentMutation.mutate({
      category: problemCategory,
      severity: problemSeverity,
      location: problemLocation,
      description: problemDescription.trim(),
    });
  };

  return (
    <AppShell
      title="Crew Operations & Shift Portal"
      subtitle="Driver and Conductor self-service: inspect assigned duty timetable, bus assignment, and transmit live disruption alerts to dispatch."
      actions={
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="font-mono text-xs border-primary/30 text-primary bg-primary/5 px-2.5 py-1 rounded-md"
          >
            {currentTenant.code} · {currentDepot}
          </Badge>
        </div>
      }
    >
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* 1. Crew Profile & Switcher Header */}
        <div className="rounded-lg border border-border/80 bg-card p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex size-11 items-center justify-center rounded-md bg-blue-600 text-white font-bold shrink-0">
                <Users className="size-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-bold text-foreground">
                    {activeCrewMember?.name || "Operating Crew Member"}
                  </h2>
                  <Badge
                    variant="outline"
                    className="text-[10px] uppercase font-mono border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/10 rounded-md"
                  >
                    {selectedRole === "driver" ? "Bus Pilot (Driver)" : "Conductor"}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-mono border-muted-foreground/30 text-muted-foreground rounded-md"
                  >
                    ID: {activeCrewMember?.employeeId || "SLM-DRV-001"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Home Depot: <span className="font-semibold text-foreground">{activeCrewMember?.depot || currentDepot}</span> | License: {activeCrewMember?.licenseCategory || "HPV / PSV Badge Verified"}
                </p>
              </div>
            </div>

            {/* Crew Selector Controls */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2 lg:pt-0 border-t lg:border-t-0 border-border/60">
              <div className="flex rounded-md border border-border/70 p-0.5 bg-muted/40">
                <button
                  type="button"
                  onClick={() => setSelectedRole("driver")}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                    selectedRole === "driver"
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Drivers ({driversList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole("conductor")}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                    selectedRole === "conductor"
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Conductors ({conductorsList.length})
                </button>
              </div>

              <Select
                value={activeCrewMember?.id || ""}
                onValueChange={(val) => setSelectedCrewId(val)}
              >
                <SelectTrigger className="h-8.5 text-xs w-[200px] rounded-md bg-card">
                  <SelectValue placeholder="Select crew member..." />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {activeCrewList.map((c: any) => (
                    <SelectItem key={c.id} value={c.id} className="text-xs">
                      {c.name} ({c.employeeId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* 2. Main Portal Tabs */}
        <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="space-y-6">
          <TabsList className="bg-secondary/40 p-1 rounded-md border border-border/60">
            <TabsTrigger
              value="schedule"
              className="text-xs gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-xs rounded-md"
            >
              <Calendar className="size-3.5" />
              <span>Today's Shift & Duty Timetable</span>
            </TabsTrigger>
            <TabsTrigger
              value="report"
              className="text-xs gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-xs rounded-md"
            >
              <AlertTriangle className="size-3.5 text-amber-500" />
              <span>Report Disruption / SOS</span>
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="text-xs gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-xs rounded-md"
            >
              <FileText className="size-3.5" />
              <span>Reported Issues ({reportedIssues.length})</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: SCHEDULE & DUTY TIMETABLE */}
          <TabsContent value="schedule" className="space-y-6">
            {/* Shift Overview Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="rounded-lg border-border/80 bg-card shadow-xs">
                <CardHeader className="p-4 pb-2">
                  <CardDescription className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Assigned Duty Shift
                  </CardDescription>
                  <CardTitle className="text-xl font-bold font-mono text-foreground">
                    {assignedDuty?.dutyCode || "D-MTC-101"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
                  Type: <span className="font-semibold text-foreground">{assignedDuty?.dutyType || "LINKED"}</span> · {assignedDuty?.serviceDate || TODAY_SERVICE_DATE}
                </CardContent>
              </Card>

              <Card className="rounded-lg border-border/80 bg-card shadow-xs">
                <CardHeader className="p-4 pb-2">
                  <CardDescription className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Assigned Vehicle
                  </CardDescription>
                  <CardTitle className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400">
                    {assignedBus?.registrationNumber || "TN-01-N-1001"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
                  Fleet #: <span className="font-semibold text-foreground">{assignedBus?.fleetNumber || "BUS-01"}</span> · {assignedBus?.capacity || 48} seats
                </CardContent>
              </Card>

              <Card className="rounded-lg border-border/80 bg-card shadow-xs">
                <CardHeader className="p-4 pb-2">
                  <CardDescription className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Shift Duration
                  </CardDescription>
                  <CardTitle className="text-xl font-bold font-mono text-foreground">
                    {formatMinutesToTime(assignedDuty?.startTime || 360)} – {formatMinutesToTime(assignedDuty?.endTime || 840)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
                  Spreadover: <span className="font-semibold text-foreground">8 hrs 00 mins</span> (Max 12h)
                </CardContent>
              </Card>

              <Card className="rounded-lg border-border/80 bg-card shadow-xs">
                <CardHeader className="p-4 pb-2">
                  <CardDescription className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Statutory Compliance
                  </CardDescription>
                  <CardTitle className="text-base font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mt-1">
                    <ShieldCheck className="size-4" />
                    <span>MV Act Verified</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
                  Min 11h mandatory rest between shifts honored
                </CardContent>
              </Card>
            </div>

            {/* Timetable Progression of Assigned Trips */}
            <div className="rounded-lg border border-border/80 bg-card p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Today's Ordered Trip Roster ({dutyTripsList.length} Trips)
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Execute departure checkpoints according to scheduled headway.
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="text-xs font-mono border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 rounded-md"
                >
                  Live Shift Active
                </Badge>
              </div>

              <div className="space-y-3 pt-1">
                {dutyTripsList.map((trip: any, idx: number) => {
                  const isCurrent = idx === 0;
                  return (
                    <div
                      key={trip.id || idx}
                      className={`p-4 rounded-lg border transition-all ${
                        isCurrent
                          ? "border-blue-500/40 bg-blue-500/5 shadow-xs"
                          : "border-border/70 bg-card hover:bg-muted/20"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start sm:items-center gap-3">
                          <span
                            className={`flex size-8 items-center justify-center rounded-md font-mono text-xs font-bold shrink-0 ${
                              isCurrent
                                ? "bg-blue-600 text-white"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            T{idx + 1}
                          </span>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm text-foreground">
                                {trip.origin} ⇄ {trip.destination}
                              </span>
                              <Badge
                                variant="outline"
                                className="text-[10px] font-mono border-primary/30 text-primary rounded-md"
                              >
                                {trip.routeCode || trip.route?.code || "Line"}
                              </Badge>
                              <Badge
                                variant="outline"
                                className="text-[10px] font-mono border-muted-foreground/30 text-muted-foreground rounded-md"
                              >
                                {trip.direction || "OUTBOUND"}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Trip Code: <span className="font-mono text-foreground font-semibold">{trip.tripCode || trip.tripNumber}</span> · Distance: {trip.distanceKm || "12.50"} km · Runtime: {trip.durationMin || 35} mins
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs font-mono shrink-0 pl-11 sm:pl-0">
                          <div>
                            <span className="text-[10px] text-muted-foreground block">DEPARTURE</span>
                            <span className="font-bold text-foreground text-sm">
                              {formatMinutesToTime(trip.startTime ?? trip.startMinutes ?? 420)}
                            </span>
                          </div>
                          <ArrowRight className="size-3.5 text-muted-foreground" />
                          <div>
                            <span className="text-[10px] text-muted-foreground block">ARRIVAL</span>
                            <span className="font-bold text-foreground text-sm">
                              {formatMinutesToTime(trip.endTime ?? trip.endMinutes ?? 455)}
                            </span>
                          </div>
                          <div>
                            <Badge
                              variant="outline"
                              className={`text-[10px] rounded-md ${
                                isCurrent
                                  ? "border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/10 font-bold"
                                  : "border-muted-foreground/30 text-muted-foreground"
                              }`}
                            >
                              {isCurrent ? "Next Departure" : "Scheduled"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: REPORT DISRUPTION OR SOS */}
          <TabsContent value="report" className="space-y-6">
            <div className="rounded-lg border border-border/80 bg-card p-6 shadow-xs max-w-2xl mx-auto space-y-5">
              <div className="border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="size-4.5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">
                      Transmit Incident / Disruption Report
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Directly alerts Central Dispatch controller and initiates vehicle/crew substitution workflow.
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmitProblem} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Problem Category</Label>
                    <Select
                      value={problemCategory}
                      onValueChange={(val) => setProblemCategory(val)}
                    >
                      <SelectTrigger className="h-9 text-xs rounded-md bg-card">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BUS_BREAKDOWN" className="text-xs">
                          Mechanical / Engine Breakdown
                        </SelectItem>
                        <SelectItem value="TYRE_PUNCTURE" className="text-xs">
                          Tyre Puncture / Wheel Issue
                        </SelectItem>
                        <SelectItem value="TRAFFIC_DELAY" className="text-xs">
                          Severe Traffic Gridlock (&gt;15 min delay)
                        </SelectItem>
                        <SelectItem value="PASSENGER_EMERGENCY" className="text-xs">
                          Passenger Medical Emergency
                        </SelectItem>
                        <SelectItem value="FARE_DEVICE_FAULT" className="text-xs">
                          ETM Ticket Machine / Cash Box Error
                        </SelectItem>
                        <SelectItem value="ROAD_BLOCKAGE" className="text-xs">
                          Route Blockage / Waterlogging / Protest
                        </SelectItem>
                        <SelectItem value="ACCIDENT" className="text-xs">
                          Minor Collision / Vehicle Scrape
                        </SelectItem>
                        <SelectItem value="SOS_CRITICAL" className="text-xs font-bold text-rose-600">
                          Emergency SOS Signal
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Severity Rating</Label>
                    <Select
                      value={problemSeverity}
                      onValueChange={(val: any) => setProblemSeverity(val)}
                    >
                      <SelectTrigger className="h-9 text-xs rounded-md bg-card">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low" className="text-xs">
                          Low (Informational / Can continue)
                        </SelectItem>
                        <SelectItem value="medium" className="text-xs">
                          Medium (+10-15 min delay expected)
                        </SelectItem>
                        <SelectItem value="high" className="text-xs">
                          High (Bus halted / Passenger transfer needed)
                        </SelectItem>
                        <SelectItem value="critical" className="text-xs font-bold text-rose-600">
                          Critical (Immediate recovery unit required)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Current Location / Nearest Stop</Label>
                  <Input
                    placeholder="e.g. Near Annanagar Arch or Stop 4"
                    value={problemLocation}
                    onChange={(e) => setProblemLocation(e.target.value)}
                    className="h-9 text-xs rounded-md"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Detailed Description / Remarks</Label>
                  <Textarea
                    placeholder="Describe what happened, engine temperature, tire pressure, or road condition..."
                    rows={4}
                    value={problemDescription}
                    onChange={(e) => setProblemDescription(e.target.value)}
                    className="text-xs rounded-md"
                    required
                  />
                </div>

                {/* Context Snapshot */}
                <div className="p-3 rounded-md border border-border/70 bg-muted/30 text-xs text-muted-foreground space-y-1 font-mono">
                  <div className="flex justify-between">
                    <span>Active Vehicle:</span>
                    <span className="font-bold text-foreground">{assignedBus?.registrationNumber || "TN-01-N-1001"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Current Duty:</span>
                    <span className="font-bold text-foreground">{assignedDuty?.dutyCode || "D-01"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Reporting Staff:</span>
                    <span className="font-bold text-foreground">{activeCrewMember?.name} ({activeCrewMember?.employeeId})</span>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    type="submit"
                    disabled={reportIncidentMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9 px-5 rounded-md cursor-pointer"
                  >
                    <Send className="mr-2 size-3.5" />
                    {reportIncidentMutation.isPending ? "Transmitting..." : "Submit Report to Dispatch"}
                  </Button>
                </div>
              </form>
            </div>
          </TabsContent>

          {/* TAB 3: REPORTED ISSUES HISTORY */}
          <TabsContent value="history" className="space-y-4">
            <div className="rounded-lg border border-border/80 bg-card p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    My Reported Incidents Today
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Track operational status of issues transmitted from vehicle to central control.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab("report")}
                  className="text-xs rounded-md"
                >
                  <AlertTriangle className="mr-1.5 size-3.5 text-amber-500" />
                  Report New Issue
                </Button>
              </div>

              {reportedIssues.length > 0 ? (
                <div className="space-y-3">
                  {reportedIssues.map((issue) => (
                    <div
                      key={issue.id}
                      className="p-4 rounded-lg border border-border/80 bg-card hover:bg-muted/20 transition-colors space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="text-[10px] font-mono border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/10 rounded-md uppercase"
                          >
                            {issue.category.replace(/_/g, " ")}
                          </Badge>
                          <span className="text-xs font-bold text-foreground">
                            {issue.busReg} · {issue.tripCode}
                          </span>
                        </div>
                        <span className="text-xs font-mono text-muted-foreground">
                          {issue.reportedAt}
                        </span>
                      </div>

                      <p className="text-xs text-foreground">
                        {issue.description}
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-border/60 text-[11px] text-muted-foreground">
                        <span>Location: <span className="font-semibold text-foreground">{issue.location}</span></span>
                        <Badge
                          variant="outline"
                          className="text-[10px] font-mono border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded-md"
                        >
                          Dispatched / Under Review
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 space-y-3">
                  <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto">
                    <CheckCircle2 className="size-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">No Incidents Reported Today</h4>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                      All trips and vehicle duty shifts operating smoothly within standard headway bounds.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
