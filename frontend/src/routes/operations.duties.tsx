import { createFileRoute } from "@tanstack/react-router";
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
import { getTrips, getDuties, getDuty, createDuty, updateDuty, deleteDuty, addTripToDuty, removeTripFromDuty, createCrewHandover, clearHandoverSegments, validateDuty } from "@/lib/scheduling-fns";

export const Route = createFileRoute("/operations/duties")({
  beforeLoad: ({ context }) => {
    if (!context.user || !hasPermission(context.user.role, "schedule.view")) {
      throw new Error("Forbidden");
    }
  },
  head: () => ({
    meta: [
      { title: "Duty Builder — TransitOS" },
      { name: "description", content: "Linked and unlinked duty blocks with crew handovers." },
    ],
  }),
  component: DutiesPage,
});

const DEFAULT_DATE = "25 Aug 2026";

function formatMinutesToTime(totalMin: number): string {
  const hh = Math.floor(totalMin / 60);
  const mm = totalMin % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function parseTimeToMinutes(timeStr: string): number {
  const [hStr, mStr] = timeStr.split(":");
  return Number(hStr || 0) * 60 + Number(mStr || 0);
}

function DutiesPage() {
  const queryClient = useQueryClient();
  const context = RootRoute.useRouteContext();
  const user = context?.user;
  const canModify = hasPermission(user?.role || "", "schedule.modify");

  // Filter state
  const [serviceDate, setServiceDate] = useState(DEFAULT_DATE);
  const [statusFilter, setStatusFilter] = useState("all");

  // Selected Duty in Visual Editor
  const [selectedDutyId, setSelectedDutyId] = useState<string | null>(null);

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isHandoverOpen, setIsHandoverOpen] = useState(false);

  // Form states (Duty)
  const [formDutyCode, setFormDutyCode] = useState("");
  const [formDutyType, setFormDutyType] = useState("LINKED");

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

  // Resolve unassigned trips for dropdown selection
  const assignedTripIds = new Set<string>();
  dutiesList.forEach((d) => {
    if (d.trips) {
      d.trips.forEach((t: any) => assignedTripIds.add(t.id));
    }
  });
  const unassignedTrips = allTripsList.filter((t) => !assignedTripIds.has(t.id) && t.status !== "cancelled");

  // Selectable dropdown trip
  const [selectedTripToAdd, setSelectedTripToAdd] = useState("");
  useEffect(() => {
    if (unassignedTrips.length > 0) {
      setSelectedTripToAdd(unassignedTrips[0].id);
    } else {
      setSelectedTripToAdd("");
    }
  }, [unassignedTrips]);

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

  // Triggers updates for select dropdown fields (bus, driver, conductor, status)
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
      title="Duty Builder"
      subtitle="Visual scheduler, crew handover segments, and turnaround buffer validators."
      actions={
        canModify ? (
          <Button size="sm" onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 size-4" />
            Create Duty Block
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-6">
        {/* 1. Top Controls */}
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

            {/* Status Select */}
            <div className="flex items-center gap-2">
              <Filter className="size-4 text-muted-foreground shrink-0" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px] bg-background/50">
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
          </div>
        </div>

        {/* 2. Main Work Area: Duties list sidebar + Visual Editor */}
        <div className="grid gap-6 lg:grid-cols-4">
          {/* Sidebar: Duties List */}
          <div className="panel p-3 lg:col-span-1 space-y-3 flex flex-col h-[650px]">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
              Duties Register
            </h3>

            {dutiesLoading ? (
              <div className="py-20 text-center text-xs text-muted-foreground flex-1">Loading duties...</div>
            ) : dutiesList.length === 0 ? (
              <div className="py-20 text-center text-xs text-muted-foreground flex-1">
                No duties built. Create one to begin scheduling.
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto flex-1 pr-1">
                {dutiesList.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDutyId(d.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all flex flex-col gap-1.5 ${
                      selectedDutyId === d.id
                        ? "border-primary bg-primary/5 hover:bg-primary/8 text-primary"
                        : "border-border bg-background/50 hover:bg-background/80"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-sm text-foreground">{d.dutyCode}</span>
                      <Badge variant="outline" className="text-[9px] font-mono px-1">
                        {d.dutyType}
                      </Badge>
                    </div>
                    <div className="text-[11px] text-muted-foreground space-y-0.5">
                      <p>
                        Time: <b>{formatMinutesToTime(d.startTime)} - {formatMinutesToTime(d.endTime)}</b>
                      </p>
                      <p>Bus: <b>{d.busRegNumber || "None"}</b></p>
                      <p>Status: <span className="uppercase text-[9px] font-bold">{d.status}</span></p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Main Visual Editor */}
          <div className="lg:col-span-3 space-y-6">
            {selectedDuty ? (
              <div className="space-y-6">
                {/* Duty Configuration Panel */}
                <section className="panel p-5 space-y-4">
                  <div className="flex justify-between items-start border-b pb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-foreground">{selectedDuty.dutyCode}</h2>
                        <Badge variant="outline">{selectedDuty.dutyType}</Badge>
                        <Badge variant={selectedDuty.status === "published" ? "default" : "secondary"}>
                          {selectedDuty.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Service Date: {selectedDuty.serviceDate} · Start Time: {formatMinutesToTime(selectedDuty.startTime)} · End Time: {formatMinutesToTime(selectedDuty.endTime)}
                      </p>
                    </div>
                    {canModify && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10 h-8 w-8"
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

                  {/* Operational Resource Assignment form */}
                  <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 items-end">
                    {/* Bus Select */}
                    <div className="space-y-1.5">
                      <Label htmlFor="busSelect" className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <BusIcon className="size-3.5" /> Bus Assignment
                      </Label>
                      <Select
                        disabled={!canModify}
                        value={selectedDuty.busId || "none"}
                        onValueChange={(val) => handleFieldChange("busId", val === "none" ? null : val)}
                      >
                        <SelectTrigger id="busSelect" className="h-9 bg-background/50">
                          <SelectValue placeholder="Unassigned" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Unassigned</SelectItem>
                          {busesList.map((b) => (
                            <SelectItem key={b.id} value={b.id}>
                              {b.registrationNumber} ({b.busType})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Duty Type Select */}
                    <div className="space-y-1.5">
                      <Label htmlFor="typeSelect" className="text-xs text-muted-foreground flex items-center gap-1.5">
                        {selectedDuty.dutyType === "LINKED" ? (
                          <LinkIcon className="size-3.5" />
                        ) : (
                          <Unlink className="size-3.5" />
                        )}
                        Duty Configuration
                      </Label>
                      <Select
                        disabled={!canModify}
                        value={selectedDuty.dutyType}
                        onValueChange={(val) => handleFieldChange("dutyType", val)}
                      >
                        <SelectTrigger id="typeSelect" className="h-9 bg-background/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LINKED">Linked Crew</SelectItem>
                          <SelectItem value="UNLINKED">Unlinked Handovers</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Status Select */}
                    <div className="space-y-1.5">
                      <Label htmlFor="statusSelect" className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Settings className="size-3.5" /> Block Status
                      </Label>
                      <Select
                        disabled={!canModify}
                        value={selectedDuty.status}
                        onValueChange={(val) => handleFieldChange("status", val)}
                      >
                        <SelectTrigger id="statusSelect" className="h-9 bg-background/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="assigned">Assigned</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Linked Crew Form Block (only for LINKED) */}
                  {selectedDuty.dutyType === "LINKED" && (
                    <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-dashed">
                      {/* Driver Select */}
                      <div className="space-y-1.5">
                        <Label htmlFor="driverSelect" className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Users className="size-3.5" /> Linked Driver
                        </Label>
                        <Select
                          disabled={!canModify}
                          value={selectedDuty.driverId || "none"}
                          onValueChange={(val) => handleFieldChange("driverId", val === "none" ? null : val)}
                        >
                          <SelectTrigger id="driverSelect" className="h-9 bg-background/50">
                            <SelectValue placeholder="Unassigned" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Unassigned</SelectItem>
                            {driversList.map((d) => (
                              <SelectItem key={d.id} value={d.id}>
                                {d.name} ({d.employeeId})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Conductor Select */}
                      <div className="space-y-1.5">
                        <Label htmlFor="conductorSelect" className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Users className="size-3.5" /> Linked Conductor
                        </Label>
                        <Select
                          disabled={!canModify}
                          value={selectedDuty.conductorId || "none"}
                          onValueChange={(val) => handleFieldChange("conductorId", val === "none" ? null : val)}
                        >
                          <SelectTrigger id="conductorSelect" className="h-9 bg-background/50">
                            <SelectValue placeholder="Unassigned" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Unassigned</SelectItem>
                            {conductorsList.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.name} ({c.employeeId})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </section>

                {/* Duty Trips Sequenced Timeline */}
                <section className="panel p-5 space-y-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <Clock className="size-4 text-primary shrink-0" /> Assigned Corridors Timeline
                    </h3>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {selectedDuty.trips?.length || 0} Trips Blocked
                    </span>
                  </div>

                  {selectedDuty.trips?.length === 0 ? (
                    <div className="py-8 text-center text-xs text-muted-foreground border border-dashed rounded-lg bg-background/20">
                      No trips assigned to this duty yet. Add trips below.
                    </div>
                  ) : (
                    <div className="space-y-3 relative before:absolute before:left-5 before:top-4 before:bottom-4 before:w-[2px] before:bg-border">
                      {selectedDuty.trips.map((t: any, index: number) => (
                        <div key={t.id} className="flex gap-4 items-start relative pl-10">
                          {/* Sequenced circle marker */}
                          <div className="absolute left-0 size-10 rounded-full border bg-card flex items-center justify-center text-xs font-bold text-primary shrink-0 shadow-sm z-10">
                            {t.sequence}
                          </div>

                          {/* Trip Card details */}
                          <div className="flex-1 p-3 rounded-lg border bg-background/40 hover:bg-background/80 transition-all flex justify-between items-center gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-foreground">{t.tripCode}</span>
                                <Badge variant="outline" className="text-[9px] uppercase font-bold px-1.5 h-5">
                                  {t.routeCode}
                                </Badge>
                              </div>
                              <p className="text-[10px] text-muted-foreground">
                                {t.routeName}
                              </p>
                              {/* Display turnaround buffer note if not the last trip */}
                              {index < selectedDuty.trips.length - 1 && (
                                <p className="text-[10px] font-medium text-primary mt-1.5 flex items-center gap-1">
                                  <Clock className="size-3" /> Turnaround:{" "}
                                  {selectedDuty.trips[index + 1].startTime - t.endTime}m
                                </p>
                              )}
                            </div>
                            <div className="text-right shrink-0 flex items-center gap-4">
                              <div>
                                <p className="font-mono font-bold text-sm">
                                  {formatMinutesToTime(t.startTime)} - {formatMinutesToTime(t.endTime)}
                                </p>
                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                  {t.endTime - t.startTime}m duration
                                </p>
                              </div>
                              {canModify && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                  onClick={() => {
                                    removeTripMutation.mutate({ dutyId: selectedDutyId!, tripId: t.id });
                                  }}
                                >
                                  <X className="size-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Trip Form Selector */}
                  {canModify && unassignedTrips.length > 0 && (
                    <div className="flex gap-3 pt-3 border-t border-dashed items-end">
                      <div className="flex-1 space-y-1.5">
                        <Label htmlFor="tripSelectAdd" className="text-xs text-muted-foreground">
                          Assign Unscheduled Corridor Trip
                        </Label>
                        <Select value={selectedTripToAdd} onValueChange={setSelectedTripToAdd}>
                          <SelectTrigger id="tripSelectAdd" className="h-9 bg-background/50">
                            <SelectValue placeholder="Select Trip to assign..." />
                          </SelectTrigger>
                          <SelectContent>
                            {unassignedTrips.map((t) => (
                              <SelectItem key={t.id} value={t.id}>
                                {t.tripCode} ({t.routeCode} · {formatMinutesToTime(t.startTime)} - {formatMinutesToTime(t.endTime)})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        disabled={!selectedTripToAdd || addTripMutation.isPending}
                        onClick={() => {
                          addTripMutation.mutate({ dutyId: selectedDutyId!, tripId: selectedTripToAdd });
                        }}
                      >
                        <FilePlus className="size-4 mr-2" /> Assign Trip
                      </Button>
                    </div>
                  )}
                </section>

                {/* Unlinked Handovers Crew Segment Management (Only for UNLINKED) */}
                {selectedDuty.dutyType === "UNLINKED" && (
                  <section className="panel p-5 space-y-4">
                    <div className="flex justify-between items-center border-b pb-2">
                      <h3 className="text-sm font-semibold flex items-center gap-2">
                        <Unlink className="size-4 text-warning shrink-0" /> Crew Handover Segments
                      </h3>
                      {canModify && selectedDuty.crewSegments?.length > 0 && (
                        <Button
                          variant="ghost"
                          size="xs"
                          className="text-destructive h-7 hover:bg-destructive/10"
                          onClick={() => {
                            if (confirm("Reset all handover segments?")) {
                              clearHandoversMutation.mutate(selectedDutyId!);
                            }
                          }}
                        >
                          Clear Segments
                        </Button>
                      )}
                    </div>

                    {selectedDuty.crewSegments?.length === 0 ? (
                      <div className="py-8 text-center text-xs text-muted-foreground border border-dashed rounded-lg bg-background/20">
                        No crew segments set up for this unlinked duty. Add crew below to manage handovers.
                      </div>
                    ) : (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {selectedDuty.crewSegments.map((seg: any) => (
                          <div key={seg.id} className="p-3 border rounded bg-background/30 flex flex-col justify-between gap-2">
                            <div className="flex justify-between items-center border-b pb-1.5">
                              <span className="font-bold text-xs">Segment {seg.sequence}</span>
                              <Badge variant="outline" className="text-[10px] font-mono h-5">
                                {formatMinutesToTime(seg.startTime)} - {formatMinutesToTime(seg.endTime)}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground space-y-1">
                              <p className="flex items-center gap-1.5">
                                <Users className="size-3.5 text-primary" /> Driver:{" "}
                                <span className="font-semibold text-foreground">
                                  {driversList.find((d) => d.id === seg.driverId)?.name || "Unassigned"}
                                </span>
                              </p>
                              <p className="flex items-center gap-1.5">
                                <Users className="size-3.5 text-primary" /> Conductor:{" "}
                                <span className="font-semibold text-foreground">
                                  {conductorsList.find((c) => c.id === seg.conductorId)?.name || "Unassigned"}
                                </span>
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {canModify && (
                      <div className="pt-3 border-t border-dashed flex justify-end">
                        <Button size="sm" variant="outline" onClick={() => setIsHandoverOpen(true)}>
                          <Plus className="size-4 mr-2" /> Configure Handover Segment
                        </Button>
                      </div>
                    )}
                  </section>
                )}

                {/* Real-time Explainable Validation Panel */}
                <section
                  className={`panel p-5 border-l-4 ${
                    validation.isValid ? "border-l-success bg-success/5" : "border-l-destructive bg-destructive/5"
                  }`}
                >
                  <div className="flex items-center gap-2 border-b pb-2 mb-3">
                    {validation.isValid ? (
                      <>
                        <CheckCircle2 className="size-5 text-success shrink-0" />
                        <h3 className="text-sm font-semibold text-success">Valid Operational Duty Block</h3>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="size-5 text-destructive shrink-0" />
                        <h3 className="text-sm font-semibold text-destructive">
                          Validation Conflicts Detected ({validation.issues.length})
                        </h3>
                      </>
                    )}
                  </div>

                  {validation.isValid ? (
                    <p className="text-xs text-success/90 font-medium">
                      All criteria passed. This duty complies with turnaround buffers, daily work limits, crew rest intervals, and vehicle overlaps.
                    </p>
                  ) : (
                    <ul className="space-y-2 text-xs text-destructive/90 font-medium list-disc list-inside">
                      {validation.issues.map((issue, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {issue}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>
            ) : (
              <div className="panel p-20 text-center text-xs text-muted-foreground">
                Select a duty from the left register to build its scheduled timeline.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CREATE DUTY DIALOG */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <form onSubmit={handleCreateSubmit}>
            <DialogHeader>
              <DialogTitle>Create Duty Block</DialogTitle>
              <DialogDescription>
                Establish a new operational duty code. Timeline boundaries automatically adjust as trips are assigned.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="code" className="text-right">Code</Label>
                <Input
                  id="code"
                  placeholder="e.g. L-105"
                  value={formDutyCode}
                  onChange={(e) => setFormDutyCode(e.target.value)}
                  className="col-span-3 uppercase"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">Crew Type</Label>
                <Select value={formDutyType} onValueChange={setFormDutyType}>
                  <SelectTrigger id="type" className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LINKED">Linked Crew</SelectItem>
                    <SelectItem value="UNLINKED">Unlinked Handovers</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createDutyMutation.isPending}>
                {createDutyMutation.isPending ? "Creating..." : "Save Duty"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ADD CREW HANDOVER SEGMENT DIALOG */}
      <Dialog open={isHandoverOpen} onOpenChange={setIsHandoverOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <form onSubmit={handleHandoverSubmit}>
            <DialogHeader>
              <DialogTitle>Configure Handover Crew Segment</DialogTitle>
              <DialogDescription>
                Assign driver and conductor for a specific time range of this unlinked duty.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="segDriver" className="text-right text-xs">Driver</Label>
                <Select value={handoverDriverId} onValueChange={setHandoverDriverId}>
                  <SelectTrigger id="segDriver" className="col-span-3">
                    <SelectValue placeholder="Select Driver..." />
                  </SelectTrigger>
                  <SelectContent>
                    {driversList.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name} ({d.employeeId})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="segConductor" className="text-right text-xs">Conductor</Label>
                <Select value={handoverConductorId} onValueChange={setHandoverConductorId}>
                  <SelectTrigger id="segConductor" className="col-span-3">
                    <SelectValue placeholder="Select Conductor..." />
                  </SelectTrigger>
                  <SelectContent>
                    {conductorsList.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} ({c.employeeId})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="segStart" className="text-right text-xs">Start Time</Label>
                <Input
                  id="segStart"
                  type="time"
                  value={handoverStartTime}
                  onChange={(e) => setFormStartTime(e.target.value) || setHandoverStartTime(e.target.value)}
                  className="col-span-3 font-mono"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="segEnd" className="text-right text-xs">End Time</Label>
                <Input
                  id="segEnd"
                  type="time"
                  value={handoverEndTime}
                  onChange={(e) => setHandoverEndTime(e.target.value)}
                  className="col-span-3 font-mono"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsHandoverOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Crew Segment</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
