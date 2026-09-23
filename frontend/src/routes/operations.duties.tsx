import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CalendarClock,
  Plus,
  Compass,
  ArrowUpDown,
  Filter,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ListTodo,
  Bus as BusIcon,
  Users,
  Clock,
  HelpCircle,
  Link as LinkIcon,
  Unlink,
  Calendar,
  X,
  FilePlus,
  RefreshCw,
  Search,
  ShieldCheck,
  Zap,
  Layers,
  Sparkles,
  UserCog,
  Check,
  Sliders,
  Route as RouteIcon,
  Map,
  Workflow,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Route as RootRoute } from "@/routes/__root";
import { hasPermission } from "@/lib/auth-shared";
import { getBuses, getDrivers, getConductors } from "@/lib/fleet-crew";
import {
  getTrips,
  getDuties,
  getDuty,
  createDuty,
  updateDuty,
  deleteDuty,
  addTripToDuty,
  removeTripFromDuty,
  createCrewHandover,
  clearHandoverSegments,
  validateDuty,
} from "@/lib/scheduling-fns";
import { cn, formatMinutesToTime } from "@/lib/utils";

export const Route = createFileRoute("/operations/duties")({
  beforeLoad: ({ context }) => {
    if (!context.user || !hasPermission(context.user.role, "schedule.view")) {
      throw new Error("Forbidden");
    }
  },
  head: () => ({
    meta: [
      { title: "Duty Builder & Editor — TransitOS" },
      { name: "description", content: "Assemble, validate, and dispatch vehicle duties and crew shifts." },
    ],
  }),
  component: DutiesPage,
});

const DEFAULT_DATE = "25 Aug 2026";

function parseTimeToMinutes(timeStr: string): number {
  const [hStr, mStr] = timeStr.split(":");
  return Number(hStr || 0) * 60 + Number(mStr || 0);
}

function DutiesPage() {
  const queryClient = useQueryClient();
  const context = RootRoute.useRouteContext();
  const user = context?.user;
  const canModify = hasPermission(user?.role || "", "schedule.modify");

  // Filter & Search state
  const [serviceDate, setServiceDate] = useState(DEFAULT_DATE);
  const [statusFilter, setStatusFilter] = useState("all");
  const [dutySearch, setDutySearch] = useState("");
  const [unassignedSearch, setUnassignedSearch] = useState("");

  // Selected Duty in Visual Editor
  const [selectedDutyId, setSelectedDutyId] = useState<string | null>(null);

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isHandoverOpen, setIsHandoverOpen] = useState(false);

  // Form states (Duty)
  const [formDutyCode, setFormDutyCode] = useState("");
  const [formDutyType, setFormDutyType] = useState<"LINKED" | "UNLINKED">("LINKED");

  // Form states (Crew Handover Segment)
  const [handoverDriverId, setHandoverDriverId] = useState("");
  const [handoverConductorId, setHandoverConductorId] = useState("");
  const [handoverStartTime, setHandoverStartTime] = useState("06:00");
  const [handoverEndTime, setHandoverEndTime] = useState("09:00");

  // 1. Fetch active buses, drivers, conductors for dropdowns
  const { data: busesList = [] } = useQuery({
    queryKey: ["active-buses-select"],
    queryFn: () => getBuses(),
  });
  const { data: driversList = [] } = useQuery({
    queryKey: ["active-drivers-select"],
    queryFn: () => getDrivers(),
  });
  const { data: conductorsList = [] } = useQuery({
    queryKey: ["active-conductors-select"],
    queryFn: () => getConductors(),
  });

  // 2. Fetch Duties list
  const { data: dutiesList = [], isLoading: dutiesLoading } = useQuery({
    queryKey: ["duties", serviceDate, statusFilter],
    queryFn: () => getDuties({ serviceDate, status: statusFilter }),
  });

  // Auto-select first duty when list changes if none selected
  useEffect(() => {
    if (dutiesList.length > 0 && !selectedDutyId) {
      setSelectedDutyId(dutiesList[0].id);
    }
  }, [dutiesList, selectedDutyId]);

  // 3. Fetch Selected Duty Detailed View
  const { data: selectedDuty = null } = useQuery({
    queryKey: ["duty-details", selectedDutyId],
    queryFn: () => getDuty(selectedDutyId!),
    enabled: !!selectedDutyId,
  });

  // 4. Fetch All Today's Trips (to list unassigned ones to add)
  const { data: allTripsList = [] } = useQuery({
    queryKey: ["all-trips-duties", serviceDate],
    queryFn: () => getTrips({ serviceDate }),
  });

  // 5. Run validation on selected duty
  const { data: validation = { isValid: true, issues: [] } } = useQuery({
    queryKey: ["duty-validation", selectedDutyId, selectedDuty],
    queryFn: () => validateDuty({ dutyId: selectedDutyId! }),
    enabled: !!selectedDutyId,
  });

  // Resolve unassigned trips for dropdown/panel selection
  const assignedTripIds = new Set<string>();
  dutiesList.forEach((d) => {
    if (d.trips) {
      d.trips.forEach((t: any) => assignedTripIds.add(t.id));
    }
  });
  const unassignedTrips = allTripsList.filter(
    (t) => !assignedTripIds.has(t.id) && t.status !== "cancelled"
  );

  const filteredUnassignedTrips = unassignedTrips.filter((t) => {
    if (!unassignedSearch) return true;
    const matchRoute = (t.routeCode || "").toLowerCase().includes(unassignedSearch.toLowerCase());
    const matchTime = formatMinutesToTime(t.startTime).includes(unassignedSearch);
    return matchRoute || matchTime;
  });

  // Filtered duties
  const filteredDuties = dutiesList.filter((d) => {
    if (!dutySearch) return true;
    const matchCode = (d.dutyCode || "").toLowerCase().includes(dutySearch.toLowerCase());
    const matchBus = (d.busRegNumber || "").toLowerCase().includes(dutySearch.toLowerCase());
    return matchCode || matchBus;
  });

  // Set default crew values for handover form
  useEffect(() => {
    if (driversList.length > 0 && !handoverDriverId) {
      setHandoverDriverId(driversList[0].id);
    }
    if (conductorsList.length > 0 && !handoverConductorId) {
      setHandoverConductorId(conductorsList[0].id);
    }
  }, [driversList, conductorsList]);

  // Mutations
  const createDutyMutation = useMutation({
    mutationFn: createDuty,
    onSuccess: (newD) => {
      queryClient.invalidateQueries({ queryKey: ["duties"] });
      toast.success(`Duty ${newD.dutyCode} created successfully.`);
      setIsCreateOpen(false);
      setSelectedDutyId(newD.id);
      setFormDutyCode("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create duty");
    },
  });

  const updateDutyMutation = useMutation({
    mutationFn: updateDuty,
    onSuccess: (updatedD) => {
      queryClient.invalidateQueries({ queryKey: ["duties"] });
      queryClient.invalidateQueries({ queryKey: ["duty-details", updatedD.id] });
      toast.success(`Duty ${updatedD.dutyCode} updated successfully.`);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update duty");
    },
  });

  const deleteDutyMutation = useMutation({
    mutationFn: deleteDuty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["duties"] });
      toast.success("Duty deleted successfully.");
      setSelectedDutyId(null);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete duty");
    },
  });

  const addTripMutation = useMutation({
    mutationFn: addTripToDuty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["duties"] });
      queryClient.invalidateQueries({ queryKey: ["duty-details", selectedDutyId] });
      toast.success("Trip added to duty.");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to add trip");
    },
  });

  const removeTripMutation = useMutation({
    mutationFn: removeTripFromDuty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["duties"] });
      queryClient.invalidateQueries({ queryKey: ["duty-details", selectedDutyId] });
      toast.success("Trip removed from duty.");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to remove trip");
    },
  });

  const handoverMutation = useMutation({
    mutationFn: createCrewHandover,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["duties"] });
      queryClient.invalidateQueries({ queryKey: ["duty-details", selectedDutyId] });
      toast.success("Crew handover segment added.");
      setIsHandoverOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to add handover");
    },
  });

  const clearHandoversMutation = useMutation({
    mutationFn: clearHandoverSegments,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["duties"] });
      queryClient.invalidateQueries({ queryKey: ["duty-details", selectedDutyId] });
      toast.success("Handover segments cleared.");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to clear handovers");
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createDutyMutation.mutate({
      dutyCode: formDutyCode,
      dutyType: formDutyType,
      serviceDate,
    });
  };

  const handleHandoverSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handoverMutation.mutate({
      dutyId: selectedDutyId!,
      driverId: handoverDriverId,
      conductorId: handoverConductorId,
      startTime: parseTimeToMinutes(handoverStartTime),
      endTime: parseTimeToMinutes(handoverEndTime),
    });
  };

  const handleFieldChange = (field: string, val: string | null) => {
    if (!selectedDuty) return;
    const updateData = {
      dutyCode: selectedDuty.dutyCode,
      dutyType: selectedDuty.dutyType,
      serviceDate: selectedDuty.serviceDate,
      status: selectedDuty.status,
      busId: selectedDuty.busId,
      driverId: selectedDuty.driverId,
      conductorId: selectedDuty.conductorId,
    };

    if (field === "busId") updateData.busId = val || null;
    if (field === "driverId") updateData.driverId = val || null;
    if (field === "conductorId") updateData.conductorId = val || null;
    if (field === "status") updateData.status = val || "draft";
    if (field === "dutyType") updateData.dutyType = val || "LINKED";

    updateDutyMutation.mutate({
      id: selectedDutyId!,
      data: updateData,
    });
  };

  return (
    <AppShell
      title="Duty Builder & Editor"
      subtitle="Interactive duty composition studio, crew handover timelines, and Motor Vehicle Act compliance analyzer."
      actions={
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex text-xs">
            <Link to="/scheduling/optimizer">
              <Sparkles className="mr-1.5 size-3.5 text-primary" />
              Schedule Optimizer
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex text-xs">
            <Link to="/network/routes">
              <Map className="mr-1.5 size-3.5 text-primary" />
              Route Network
            </Link>
          </Button>
          {canModify && (
            <Button
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              className="bg-primary text-primary-foreground font-semibold shadow-md shadow-primary/20 text-xs hover:scale-[1.02] transition-all"
            >
              <Plus className="mr-1.5 size-4" />
              Create Duty Block
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {/* TOP FILTER BAR */}
        <div className="glass-panel p-4 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-1 flex-wrap gap-3 items-center min-w-[280px]">
            {/* Service Date Input */}
            <div className="flex items-center gap-2">
              <Calendar className="size-4 text-primary shrink-0" />
              <Input
                type="text"
                placeholder="25 Aug 2026"
                value={serviceDate}
                onChange={(e) => setServiceDate(e.target.value)}
                className="w-36 bg-background/60 h-9 text-xs font-mono border-border/80"
              />
            </div>

            {/* Status Select */}
            <div className="flex items-center gap-2">
              <Filter className="size-4 text-muted-foreground shrink-0" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40 bg-background/60 h-9 text-xs border-border/80">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Duty Search */}
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search duties or buses..."
                value={dutySearch}
                onChange={(e) => setDutySearch(e.target.value)}
                className="pl-8 bg-background/60 h-9 text-xs border-border/80"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs border-primary/30 text-primary bg-primary/5">
              {dutiesList.length} Duties Total
            </Badge>
            <Badge variant="outline" className="font-mono text-xs border-warning/30 text-warning bg-warning/5">
              {unassignedTrips.length} Unassigned Trips
            </Badge>
          </div>
        </div>

        {/* 3-STEP VISUAL WORKFLOW BANNER */}
        <div className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 via-background to-primary/5 p-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="grid size-7 place-items-center rounded-lg bg-primary/15 text-primary">
              <Workflow className="size-4" />
            </div>
            <div>
              <span className="font-bold text-foreground">How Duty Builder Works: </span>
              <span className="text-muted-foreground">Follow the 3 numbered columns below to assemble driver shifts and attach trips.</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-medium bg-card/60 px-3 py-1.5 rounded-lg border border-border/60">
            <span className="font-bold text-primary">Step 1:</span> Choose Duty
            <ArrowRight className="size-3 text-muted-foreground" />
            <span className="font-bold text-primary">Step 2:</span> Assign Resources
            <ArrowRight className="size-3 text-muted-foreground" />
            <span className="font-bold text-primary">Step 3:</span> Add Trips
          </div>
        </div>

        {/* 3-COLUMN WORKSPACE: DUTY LIST | VISUAL CANVAS | UNASSIGNED POOL */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* LEFT COLUMN: DUTIES ROSTER */}
          <div className="glass-panel p-3.5 lg:col-span-3 space-y-3 flex flex-col h-[740px]">
            <div className="flex items-center justify-between px-1 border-b border-border/50 pb-2">
              <div className="flex items-center gap-1.5">
                <Badge variant="secondary" className="font-mono text-[9px] font-bold text-primary bg-primary/15 px-1 py-0">
                  Step 1
                </Badge>
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Select Duty ({filteredDuties.length})
                </h3>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono border-border/80">
                {serviceDate}
              </Badge>
            </div>

            {dutiesLoading ? (
              <div className="py-24 text-center text-xs text-muted-foreground flex-1 flex flex-col items-center justify-center gap-2">
                <RefreshCw className="size-5 animate-spin text-primary" />
                <span>Loading duty blocks...</span>
              </div>
            ) : filteredDuties.length === 0 ? (
              <div className="py-20 text-center text-xs text-muted-foreground flex-1 flex flex-col items-center justify-center p-4">
                <CalendarClock className="size-8 text-muted-foreground/50 mb-2" />
                <p className="font-medium text-foreground">No duties found</p>
                <p className="text-[11px] text-muted-foreground mt-1">Create a duty block or adjust filters.</p>
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto flex-1 pr-1">
                {filteredDuties.map((d) => {
                  const isSelected = selectedDutyId === d.id;
                  const tripCount = d.trips?.length || 0;

                  return (
                    <button
                      key={d.id}
                      onClick={() => setSelectedDutyId(d.id)}
                      className={cn(
                        "w-full text-left p-3 rounded-xl border transition-all duration-150 flex flex-col gap-2 cursor-pointer",
                        isSelected
                          ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary/30"
                          : "border-border/70 bg-card/60 hover:bg-muted/60 hover:border-border"
                      )}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className={cn("font-bold text-sm font-mono", isSelected ? "text-primary" : "text-foreground")}>
                            {d.dutyCode}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {tripCount} {tripCount === 1 ? "trip" : "trips"}
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[9px] font-mono px-1.5 py-0 uppercase font-bold",
                            d.dutyType === "LINKED" ? "border-primary/40 text-primary bg-primary/5" : "border-info/40 text-info bg-info/5"
                          )}
                        >
                          {d.dutyType}
                        </Badge>
                      </div>

                      <div className="text-[11px] text-muted-foreground space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 font-mono text-[10px]">
                            <Clock className="size-3 text-muted-foreground" />
                            {formatMinutesToTime(d.startTime)} – {formatMinutesToTime(d.endTime)}
                          </span>
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-[9px] uppercase font-bold px-1.5 py-0",
                              d.status === "published" ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : ""
                            )}
                          >
                            {d.status}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="truncate max-w-[140px] font-mono text-foreground/80">
                            {d.busRegNumber || "No Bus Assigned"}
                          </span>
                          <span className="text-muted-foreground truncate">{d.driverName || "No Driver"}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* MIDDLE COLUMN: VISUAL DUTY EDITOR CANVAS */}
          <div className="glass-panel p-5 lg:col-span-6 space-y-6 flex flex-col h-[740px] overflow-y-auto">
            {selectedDuty ? (
              <div className="space-y-6 flex-1">
                {/* Duty Header & Quick Actions */}
                <div className="flex items-start justify-between border-b border-border/70 pb-4">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Badge variant="secondary" className="font-mono text-[9px] font-bold text-primary bg-primary/15 px-1 py-0">
                        Step 2
                      </Badge>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Assign Vehicle & Crew Resources
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-xl font-bold tracking-tight text-foreground font-mono">{selectedDuty.dutyCode}</h2>
                      <Badge
                        variant="outline"
                        className={cn(
                          "font-mono text-xs uppercase font-semibold",
                          selectedDuty.dutyType === "LINKED" ? "border-primary/40 text-primary" : "border-info/40 text-info"
                        )}
                      >
                        {selectedDuty.dutyType}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "font-bold text-xs uppercase",
                          selectedDuty.status === "published" ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : ""
                        )}
                      >
                        {selectedDuty.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                      <span>Date: <strong className="text-foreground">{selectedDuty.serviceDate}</strong></span>
                      <span>·</span>
                      <span>Span: <strong className="font-mono text-foreground">{formatMinutesToTime(selectedDuty.startTime)} - {formatMinutesToTime(selectedDuty.endTime)}</strong></span>
                    </p>
                  </div>

                  {canModify && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10 h-8 w-8 rounded-lg"
                      onClick={() => {
                        if (confirm(`Permanently delete duty ${selectedDuty.dutyCode}?`)) {
                          deleteDutyMutation.mutate(selectedDuty.id);
                        }
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>

                {/* COMPLIANCE ALERT RADAR */}
                <div
                  className={cn(
                    "p-3.5 rounded-xl border flex items-start gap-3 transition-all",
                    validation.isValid
                      ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300"
                      : "border-destructive/30 bg-destructive/5 text-destructive"
                  )}
                >
                  {validation.isValid ? (
                    <CheckCircle2 className="size-5 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="size-5 text-destructive shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 text-xs">
                    <p className="font-bold">
                      {validation.isValid ? "MV Act Compliance Satisfied" : "Labor & Turnaround Compliance Alerts"}
                    </p>
                    {validation.issues && validation.issues.length > 0 ? (
                      <ul className="list-disc pl-4 mt-1 space-y-0.5 text-[11px]">
                        {validation.issues.map((iss: string, i: number) => (
                          <li key={i}>{iss}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        No continuous driving violations or turnaround buffer overlaps detected.
                      </p>
                    )}
                  </div>
                </div>

                {/* RESOURCE ASSIGNMENT FORM */}
                <div className="grid gap-3 sm:grid-cols-3">
                  {/* Bus Select */}
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                      <BusIcon className="size-3 text-primary" /> Assigned Vehicle
                    </Label>
                    <Select
                      value={selectedDuty.busId || "none"}
                      onValueChange={(val) => handleFieldChange("busId", val === "none" ? null : val)}
                      disabled={!canModify}
                    >
                      <SelectTrigger className="h-9 text-xs bg-background/60 font-mono">
                        <SelectValue placeholder="Select Bus" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-- Unassigned --</SelectItem>
                        {busesList.map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.registrationNumber} ({b.fleetNumber || b.busType})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Driver Select */}
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                      <UserCog className="size-3 text-success" /> Primary Driver
                    </Label>
                    <Select
                      value={selectedDuty.driverId || "none"}
                      onValueChange={(val) => handleFieldChange("driverId", val === "none" ? null : val)}
                      disabled={!canModify}
                    >
                      <SelectTrigger className="h-9 text-xs bg-background/60 font-mono">
                        <SelectValue placeholder="Select Driver" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-- Unassigned --</SelectItem>
                        {driversList.map((dr) => (
                          <SelectItem key={dr.id} value={dr.id}>
                            {dr.name} ({dr.employeeId})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Conductor Select */}
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                      <Users className="size-3 text-warning" /> Primary Conductor
                    </Label>
                    <Select
                      value={selectedDuty.conductorId || "none"}
                      onValueChange={(val) => handleFieldChange("conductorId", val === "none" ? null : val)}
                      disabled={!canModify}
                    >
                      <SelectTrigger className="h-9 text-xs bg-background/60 font-mono">
                        <SelectValue placeholder="Select Conductor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-- Unassigned --</SelectItem>
                        {conductorsList.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name} ({c.employeeId})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* DUTY TRIPS TIMELINE CANVAS */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <RouteIcon className="size-3.5 text-primary" /> Trip Sequence ({selectedDuty.trips?.length || 0})
                    </h3>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      Total Driving: <strong>{formatMinutesToTime(selectedDuty.endTime - selectedDuty.startTime)}</strong>
                    </span>
                  </div>

                  <div className="space-y-2 border border-border/70 rounded-xl p-3 bg-card/40">
                    {selectedDuty.trips && selectedDuty.trips.length > 0 ? (
                      selectedDuty.trips.map((t: any, idx: number) => (
                        <div
                          key={t.id}
                          className="flex items-center justify-between p-2.5 rounded-lg border border-border/60 bg-background/70 hover:border-primary/40 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="size-6 rounded-full bg-primary/10 text-primary font-bold text-xs grid place-items-center font-mono">
                              {idx + 1}
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs font-mono">{formatMinutesToTime(t.startTime)}</span>
                                <ArrowRight className="size-3 text-muted-foreground" />
                                <span className="font-bold text-xs font-mono">{formatMinutesToTime(t.endTime || t.startTime + 45)}</span>
                                <Badge variant="secondary" className="text-[10px] font-mono">
                                  {t.routeCode || "Corridor"}
                                </Badge>
                              </div>
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                {t.origin || "Terminal A"} ➔ {t.destination || "Terminal B"}
                              </p>
                            </div>
                          </div>

                          {canModify && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeTripMutation.mutate({ dutyId: selectedDuty.id, tripId: t.id })}
                              className="size-7 text-destructive hover:bg-destructive/10 rounded-md"
                            >
                              <X className="size-3.5" />
                            </Button>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="py-12 text-center text-xs text-muted-foreground">
                        <RouteIcon className="size-6 mx-auto mb-1.5 text-muted-foreground/50" />
                        No trips attached yet. Click <strong>+ Add</strong> on any trip from the unassigned pool on the right.
                      </div>
                    )}
                  </div>
                </div>

                {/* CREW HANDOVER SEGMENTS (FOR UNLINKED OR RELIEF) */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Users className="size-3.5 text-warning" /> Relief & Handover Segments ({selectedDuty.crewSegments?.length || 0})
                    </h3>
                    {canModify && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsHandoverOpen(true)}
                        className="h-7 text-xs"
                      >
                        <Plus className="mr-1 size-3" /> Add Handover
                      </Button>
                    )}
                  </div>

                  {selectedDuty.crewSegments && selectedDuty.crewSegments.length > 0 ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {selectedDuty.crewSegments.map((seg: any) => (
                        <div key={seg.id} className="p-3 rounded-lg border border-border/70 bg-card/60 text-xs space-y-1">
                          <div className="flex justify-between font-mono text-[11px] text-primary font-bold">
                            <span>{formatMinutesToTime(seg.startTime)} – {formatMinutesToTime(seg.endTime)}</span>
                            <Badge variant="outline" className="text-[9px]">Relief</Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            Driver: <strong>{seg.driverName || "Assigned"}</strong>
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            Conductor: <strong>{seg.conductorName || "Assigned"}</strong>
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg border border-dashed border-border/70 text-center text-[11px] text-muted-foreground bg-background/30">
                      Standard linked shift — single driver throughout the block.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-28 text-center text-muted-foreground flex-1 flex flex-col items-center justify-center p-6 space-y-3">
                <div className="size-14 rounded-2xl bg-primary/10 text-primary grid place-items-center mb-1 border border-primary/20">
                  <CalendarClock className="size-7" />
                </div>
                <h4 className="text-base font-bold text-foreground">Step 2: Select a Duty Block</h4>
                <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
                  Click any duty from <strong>Step 1</strong> on the left, or create a new shift to assign buses, drivers, and attach departures.
                </p>
                {canModify && (
                  <Button size="sm" onClick={() => setIsCreateOpen(true)} className="text-xs mt-2 bg-primary text-primary-foreground gap-1.5 shadow-sm">
                    <Plus className="size-3.5" /> Create New Duty Block
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: UNASSIGNED TRIPS POOL */}
          <div className="glass-panel p-3.5 lg:col-span-3 space-y-3 flex flex-col h-[740px]">
            <div className="flex items-center justify-between px-1 border-b border-border/50 pb-2">
              <div className="flex items-center gap-1.5">
                <Badge variant="secondary" className="font-mono text-[9px] font-bold text-warning bg-warning/15 px-1 py-0">
                  Step 3
                </Badge>
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Add Trips ({filteredUnassignedTrips.length})
                </h3>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono border-border/80">
                {allTripsList.length} Total
              </Badge>
            </div>

            {/* Search Input for Trips Pool */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Filter by time or route..."
                value={unassignedSearch}
                onChange={(e) => setUnassignedSearch(e.target.value)}
                className="pl-7 bg-background/60 h-8 text-[11px] border-border/70"
              />
            </div>

            {filteredUnassignedTrips.length === 0 ? (
              <div className="py-24 text-center text-xs text-muted-foreground flex-1 flex flex-col items-center justify-center p-4">
                <CheckCircle2 className="size-8 text-emerald-500/60 mb-2" />
                <p className="font-semibold text-foreground">All Trips Assigned</p>
                <p className="text-[11px] text-muted-foreground mt-1">Zero unassigned departures in this service wave.</p>
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto flex-1 pr-1">
                {filteredUnassignedTrips.map((t) => (
                  <div
                    key={t.id}
                    className="p-2.5 rounded-lg border border-border/70 bg-card/60 hover:border-primary/40 transition-colors flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs font-mono text-foreground">{formatMinutesToTime(t.startTime)}</span>
                        <Badge variant="secondary" className="text-[9px] font-mono px-1 py-0">
                          {t.routeCode || "Route"}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                        {t.origin || "Origin"} ➔ {t.destination || "Dest"}
                      </p>
                    </div>

                    {selectedDuty && canModify ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addTripMutation.mutate({ dutyId: selectedDuty.id, tripId: t.id })}
                        className="h-7 px-2 text-[11px] shrink-0 font-medium hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
                      >
                        <Plus className="size-3 mr-1" /> Add
                      </Button>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CREATE DUTY MODAL */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <form onSubmit={handleCreateSubmit}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Plus className="size-4 text-primary" />
                Create New Duty Block
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Initialize an operational duty schedule block for {serviceDate}.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="dutyCode" className="text-xs">Duty Identifier / Code</Label>
                <Input
                  id="dutyCode"
                  type="text"
                  placeholder="e.g. SLM-DUTY-101"
                  value={formDutyCode}
                  onChange={(e) => setFormDutyCode(e.target.value)}
                  className="font-mono text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Duty Strategy</Label>
                <Select value={formDutyType} onValueChange={(val: any) => setFormDutyType(val)}>
                  <SelectTrigger className="text-xs font-mono">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LINKED">LINKED (Single dedicated crew)</SelectItem>
                    <SelectItem value="UNLINKED">UNLINKED (Relief handovers permitted)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" disabled={createDutyMutation.isPending} className="bg-primary text-primary-foreground text-xs">
                {createDutyMutation.isPending ? "Creating..." : "Create Duty"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ADD HANDOVER MODAL */}
      <Dialog open={isHandoverOpen} onOpenChange={setIsHandoverOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <form onSubmit={handleHandoverSubmit}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Users className="size-4 text-warning" />
                Add Crew Relief Handover
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Specify time segment and relief crew for duty {selectedDuty?.dutyCode}.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Relief Driver</Label>
                  <Select value={handoverDriverId} onValueChange={setHandoverDriverId}>
                    <SelectTrigger className="text-xs font-mono">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {driversList.map((dr) => (
                        <SelectItem key={dr.id} value={dr.id}>{dr.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Relief Conductor</Label>
                  <Select value={handoverConductorId} onValueChange={setHandoverConductorId}>
                    <SelectTrigger className="text-xs font-mono">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {conductorsList.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Start Time</Label>
                  <Input
                    type="time"
                    value={handoverStartTime}
                    onChange={(e) => setHandoverStartTime(e.target.value)}
                    className="font-mono text-xs"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">End Time</Label>
                  <Input
                    type="time"
                    value={handoverEndTime}
                    onChange={(e) => setHandoverEndTime(e.target.value)}
                    className="font-mono text-xs"
                    required
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsHandoverOpen(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" disabled={handoverMutation.isPending} className="bg-primary text-primary-foreground text-xs">
                {handoverMutation.isPending ? "Adding..." : "Add Handover"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
