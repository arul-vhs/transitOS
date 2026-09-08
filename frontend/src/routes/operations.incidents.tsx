import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowRight,
  Bus as BusIcon,
  CheckCircle2,
  CircleAlert,
  Info,
  Loader2,
  Sparkles,
  Users,
  Calendar,
  Settings,
  Plus,
  TrendingUp,
  MapPin,
  GitCommit,
  Check,
  Radio,
  Clock,
  ShieldAlert,
  ArrowDown,
  Zap,
  Activity,
  Flame,
  CheckCircle,
  HelpCircle,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
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
import { getTrips } from "@/lib/scheduling-fns";
import { getRoutes } from "@/lib/routes-gis-fns";
import {
  createIncident,
  getIncidents,
  getIncidentDetails,
  resolveIncident,
  generateRecoveryProposals,
  approveRecoveryProposal,
} from "@/lib/rescheduling-fns";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/operations/incidents")({
  beforeLoad: ({ context }) => {
    if (!context.user || !hasPermission(context.user.role, "schedule.view")) {
      throw new Error("Forbidden");
    }
  },
  head: () => ({
    meta: [
      { title: "Disruption Recovery Manager — TransitOS" },
      {
        name: "description",
        content: "Track live operational incidents, analyze impacts, and apply re-optimized recovery schedules.",
      },
    ],
  }),
  component: IncidentsPage,
});

const DEFAULT_DATE = "25 Aug 2026";

function formatMinutesToTime(totalMin: number): string {
  const hh = Math.floor(totalMin / 60);
  const mm = totalMin % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function IncidentsPage() {
  const queryClient = useQueryClient();
  const context = RootRoute.useRouteContext();
  const user = context?.user;
  const canGenerate = hasPermission(user?.role || "", "schedule.generate");
  const canPublish = hasPermission(user?.role || "", "schedule.publish");

  // Local state parameters
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [showReportDialog, setShowReportDialog] = useState(false);

  // Report incident form state
  const [type, setType] = useState<string>("BUS_BREAKDOWN");
  const [severity, setSeverity] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [resourceType, setResourceType] = useState<"bus" | "crew" | "none">("bus");
  const [resourceId, setResourceId] = useState<string>("");
  const [tripId, setTripId] = useState<string>("");
  const [routeId, setRouteId] = useState<string>("");
  const [startTime, setStartTime] = useState<number>(500); // minutes from midnight
  const [expectedEndTime, setExpectedEndTime] = useState<number | null>(740);
  const [locationName, setLocationName] = useState<string>("");
  const [descriptionText, setDescriptionText] = useState<string>("");

  // Queries
  const { data: incidentsList = [], isLoading: listLoading } = useQuery({
    queryKey: ["incidents-list", DEFAULT_DATE],
    queryFn: () => getIncidents({ serviceDate: DEFAULT_DATE }),
  });

  const { data: selectedIncident, isLoading: detailsLoading } = useQuery({
    queryKey: ["incident-details", selectedIncidentId],
    queryFn: () => getIncidentDetails(selectedIncidentId!),
    enabled: !!selectedIncidentId,
  });

  const { data: busesList = [] } = useQuery({
    queryKey: ["buses-dropdown"],
    queryFn: () => getBuses(),
  });
  const { data: driversList = [] } = useQuery({
    queryKey: ["drivers-dropdown"],
    queryFn: () => getDrivers(),
  });
  const { data: tripsList = [] } = useQuery({
    queryKey: ["trips-dropdown"],
    queryFn: () => getTrips({ serviceDate: DEFAULT_DATE }),
  });
  const { data: routesList = [] } = useQuery({
    queryKey: ["routes-dropdown"],
    queryFn: () => getRoutes(),
  });

  // Mutations
  const createIncidentMutation = useMutation({
    mutationFn: createIncident,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["incidents-list"] });
      queryClient.invalidateQueries({ queryKey: ["today-incidents"] });
      setSelectedIncidentId(data.incident.id);
      setShowReportDialog(false);
      toast.success("Disruption incident logged and impacts pre-analyzed.");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to log incident");
    },
  });

  const generateProposalsMutation = useMutation({
    mutationFn: generateRecoveryProposals,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incident-details", selectedIncidentId] });
      toast.success("Recovery proposals generated successfully.");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to generate recovery options");
    },
  });

  const approveProposalMutation = useMutation({
    mutationFn: approveRecoveryProposal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incident-details", selectedIncidentId] });
      queryClient.invalidateQueries({ queryKey: ["incidents-list"] });
      toast.success("Recovery action plan approved and applied transactionally!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to apply recovery proposal");
    },
  });

  const resolveIncidentMutation = useMutation({
    mutationFn: resolveIncident,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidents-list"] });
      queryClient.invalidateQueries({ queryKey: ["incident-details", selectedIncidentId] });
      toast.success("Incident status updated to RESOLVED.");
    },
  });

  // Automatically select first incident in list
  if (incidentsList.length > 0 && !selectedIncidentId) {
    setSelectedIncidentId(incidentsList[0].id);
  }

  const handleReportIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canGenerate) {
      toast.error("Permissions denied to log incidents.");
      return;
    }

    createIncidentMutation.mutate({
      type: type as any,
      severity,
      serviceDate: DEFAULT_DATE,
      resourceType: resourceType === "none" ? null : (resourceType as any),
      resourceId: resourceId || null,
      tripId: tripId || null,
      routeId: routeId || null,
      startTime: Number(startTime),
      expectedEndTime: expectedEndTime ? Number(expectedEndTime) : null,
      location: locationName || null,
      description: descriptionText || null,
    });
  };

  const activeRun = selectedIncident?.reschedulingRuns?.[0];
  const proposals = activeRun?.proposals || [];

  // Sort proposals to find recommended (lowest objectiveScore)
  const sortedProposals = [...proposals].sort(
    (a, b) => Number(a.objectiveScore) - Number(b.objectiveScore)
  );
  const recommendedProposalId = sortedProposals[0]?.id;
  const selectedIncidentObj = selectedIncident;

  return (
    <AppShell
      title="Disruption Recovery Manager"
      subtitle="Algorithmic incident triage, passenger delay containment, and automated multi-option recovery schedules."
      actions={
        canGenerate && (
          <Button
            onClick={() => setShowReportDialog(true)}
            size="sm"
            className="bg-destructive text-destructive-foreground font-semibold shadow-md shadow-destructive/20 text-xs hover:scale-[1.02] transition-all"
          >
            <Plus className="mr-1.5 size-4" /> Report Disruption
          </Button>
        )
      }
    >
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Incidents Ticker list */}
        <div className="lg:col-span-4 space-y-4">
          <section className="glass-panel p-4 space-y-3 flex flex-col h-[740px]">
            <div className="flex items-center justify-between border-b border-border/60 pb-2.5 px-1">
              <div className="flex items-center gap-2">
                <Radio className="size-4 text-destructive animate-pulse" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Active Incidents ({incidentsList.length})
                </h3>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono">
                {DEFAULT_DATE}
              </Badge>
            </div>

            {listLoading ? (
              <div className="py-20 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2 flex-1">
                <Loader2 className="size-5 animate-spin text-primary" />
                <span>Loading disruptions log...</span>
              </div>
            ) : incidentsList.length === 0 ? (
              <div className="py-20 text-center text-xs text-muted-foreground italic flex-1 flex flex-col items-center justify-center p-4">
                <CheckCircle className="size-8 text-emerald-500/60 mb-2" />
                <p className="font-semibold text-foreground">No Incidents Logged</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Click 'Report Disruption' to record an incident.</p>
              </div>
            ) : (
              <div className="space-y-2.5 overflow-y-auto flex-1 pr-1">
                {incidentsList.map((inc) => {
                  const isSelected = selectedIncidentId === inc.id;

                  return (
                    <button
                      key={inc.id}
                      onClick={() => setSelectedIncidentId(inc.id)}
                      className={cn(
                        "w-full p-3 rounded-xl border text-left transition-all duration-150 flex flex-col gap-2 cursor-pointer",
                        isSelected
                          ? "border-destructive bg-destructive/10 shadow-xs ring-1 ring-destructive/30"
                          : "border-border/70 bg-card/60 hover:bg-muted/60"
                      )}
                    >
                      <div className="flex justify-between items-center gap-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[9px] uppercase font-bold font-mono px-1.5 py-0",
                            inc.severity === "critical"
                              ? "border-destructive/40 text-destructive bg-destructive/10"
                              : "border-warning/40 text-warning bg-warning/10"
                          )}
                        >
                          {inc.type.replace("_", " ")}
                        </Badge>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {formatMinutesToTime(inc.startTime)}
                        </span>
                      </div>

                      <p className="text-xs font-bold truncate text-foreground">
                        {inc.description || "Operational disruption reported on vehicle/crew."}
                      </p>

                      <div className="flex justify-between items-center text-[10px] text-muted-foreground font-mono pt-1 border-t border-border/40">
                        <span>Status: <strong className="text-foreground uppercase">{inc.status}</strong></span>
                        <span className={cn("font-bold uppercase", inc.severity === "critical" ? "text-destructive" : "text-warning")}>
                          {inc.severity}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Center/Right Details Panel */}
        <div className="lg:col-span-8 space-y-6">
          {detailsLoading ? (
            <div className="glass-panel p-24 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
              <Loader2 className="size-6 animate-spin text-primary" />
              <span>Analyzing disruption chain...</span>
            </div>
          ) : !selectedIncidentObj ? (
            <div className="glass-panel p-24 text-center text-xs text-muted-foreground flex flex-col items-center justify-center">
              <ShieldAlert className="size-10 text-muted-foreground/40 mb-2" />
              <p className="font-semibold text-foreground">No Disruption Selected</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Select an incident from the left to inspect downline impacts.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* INCIDENT STATUS HEADER CARD */}
              <section className="glass-panel p-5 space-y-4">
                <div className="flex flex-wrap justify-between items-start gap-4 border-b border-border/60 pb-3.5">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-lg font-bold text-foreground font-mono">{selectedIncidentObj.type.replace("_", " ")}</h2>
                      <Badge
                        variant="outline"
                        className={cn(
                          "uppercase text-[9px] font-mono font-bold",
                          selectedIncidentObj.severity === "critical"
                            ? "border-destructive/40 text-destructive bg-destructive/10"
                            : "border-warning/40 text-warning bg-warning/10"
                        )}
                      >
                        {selectedIncidentObj.severity} Severity
                      </Badge>
                      <Badge variant="secondary" className="uppercase text-[9px] font-bold">
                        {selectedIncidentObj.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Logged at {formatMinutesToTime(selectedIncidentObj.startTime)} · Location: <strong className="text-foreground">{selectedIncidentObj.location || "En Route Corridor"}</strong>
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {selectedIncidentObj.status === "OPEN" || selectedIncidentObj.status === "ANALYZING" ? (
                      <Button
                        onClick={() => generateProposalsMutation.mutate(selectedIncidentObj.id)}
                        disabled={generateProposalsMutation.isPending}
                        size="sm"
                        className="bg-primary text-primary-foreground text-xs font-semibold shadow-md shadow-primary/20"
                      >
                        {generateProposalsMutation.isPending ? (
                          <>
                            <Loader2 className="mr-1.5 size-3.5 animate-spin" /> Solving...
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-1.5 size-3.5" /> Solve Disruption
                          </>
                        )}
                      </Button>
                    ) : null}

                    {selectedIncidentObj.status !== "RESOLVED" && selectedIncidentObj.status !== "CANCELLED" && (
                      <Button
                        onClick={() => resolveIncidentMutation.mutate(selectedIncidentObj.id)}
                        disabled={resolveIncidentMutation.isPending}
                        variant="outline"
                        size="sm"
                        className="text-xs text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                      >
                        <Check className="size-3.5 mr-1" /> Mark Resolved
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3 text-xs bg-secondary/30 rounded-xl p-3 border border-border/60">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Resource Affected:</span>
                    <p className="font-mono font-bold text-foreground mt-0.5">
                      {selectedIncidentObj.resourceType === "bus" ? "Bus Vehicle" : "Crew Member"} ({selectedIncidentObj.resourceId || "N/A"})
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Expected Duration:</span>
                    <p className="font-mono font-bold text-foreground mt-0.5">
                      {selectedIncidentObj.expectedEndTime ? `${selectedIncidentObj.expectedEndTime - selectedIncidentObj.startTime} mins` : "Indefinite"}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Description:</span>
                    <p className="text-muted-foreground mt-0.5 italic truncate">{selectedIncidentObj.description || "Standard delay logged"}</p>
                  </div>
                </div>
              </section>

              {/* RIPPLE EFFECT IMPACT TIMELINE */}
              <section className="glass-panel p-5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Activity className="size-4 text-warning" /> Disruption Downstream Propagation Chain
                </h3>

                <div className="flex flex-col gap-2.5 max-w-xl mx-auto py-2">
                  {/* Source Node */}
                  <div className="p-3.5 rounded-xl border border-destructive/30 bg-destructive/5 flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-destructive/10 text-destructive grid place-items-center shrink-0">
                      <Flame className="size-4.5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-destructive">Origin Incident: {selectedIncidentObj.type}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Reported at {formatMinutesToTime(selectedIncidentObj.startTime)} at {selectedIncidentObj.location || "Salem Corridor"}</p>
                    </div>
                  </div>

                  <div className="flex justify-center my-0.5">
                    <ArrowDown className="size-4 text-muted-foreground/60" />
                  </div>

                  {/* Resource Node */}
                  <div className="p-3.5 rounded-xl border border-border/70 bg-card/60 flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0">
                      <BusIcon className="size-4.5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">Direct Resource Immobilized</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Assigned duty block trips blocked from subsequent on-time departure</p>
                    </div>
                  </div>

                  {selectedIncidentObj.impacts?.length > 0 && (
                    <>
                      <div className="flex justify-center my-0.5">
                        <ArrowDown className="size-4 text-muted-foreground/60" />
                      </div>

                      <div className="p-3.5 rounded-xl border border-warning/30 bg-warning/5 space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-warning">
                          <AlertTriangle className="size-4" />
                          <span>Downstream Cascade Impact ({selectedIncidentObj.impacts.length} trips affected)</span>
                        </div>
                        <div className="divide-y divide-border/40 text-[11px] text-muted-foreground">
                          {selectedIncidentObj.impacts.map((imp: any) => (
                            <div key={imp.id} className="py-1.5 flex justify-between gap-4 font-mono">
                              <span>Trip <strong>{imp.trip?.tripCode || "Departure"}</strong> ({imp.impactType})</span>
                              <span className="font-bold text-warning uppercase text-[10px]">{imp.impactLevel}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </section>

              {/* RECOVERY PROPOSALS CARDS */}
              {proposals.length > 0 && (
                <section className="glass-panel p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-border/60 pb-3">
                    <div>
                      <h3 className="text-sm font-bold tracking-tight text-foreground">Algorithmic Recovery Options</h3>
                      <p className="text-xs text-muted-foreground">Side-by-side comparison of candidate reschedule plans</p>
                    </div>
                    <Badge variant="outline" className="font-mono text-xs text-primary border-primary/30">
                      {proposals.length} Proposals Generated
                    </Badge>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    {proposals.map((prop: any) => {
                      const isRecommended = prop.id === recommendedProposalId;
                      return (
                        <div
                          key={prop.id}
                          className={cn(
                            "p-4 rounded-xl border flex flex-col justify-between relative transition-all duration-150",
                            isRecommended
                              ? "border-emerald-500/50 bg-emerald-500/5 shadow-md shadow-emerald-500/5"
                              : "border-border/70 bg-card/60"
                          )}
                        >
                          {isRecommended && (
                            <Badge className="absolute top-2.5 right-2.5 bg-emerald-500 text-white hover:bg-emerald-500 text-[9px] font-mono font-bold px-1.5 py-0">
                              Recommended
                            </Badge>
                          )}
                          <div className="space-y-3">
                            <div>
                              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
                                Strategy Option {prop.proposalNumber}
                              </p>
                              <p className="text-xl font-bold font-mono mt-1 text-primary">
                                Score: {prop.objectiveScore}
                              </p>
                            </div>

                            <div className="space-y-1.5 text-xs border-y border-border/60 py-2.5 my-2 font-mono">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Trips Recovered:</span>
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">{prop.tripsRecovered}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Cancellations:</span>
                                <span className="font-bold text-destructive">{prop.cancellations}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Relief Handovers:</span>
                                <span className="font-bold text-foreground">{prop.handovers}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Reserve Buses:</span>
                                <span className="font-bold text-foreground">{prop.busesUsed}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Net Delay:</span>
                                <span className="font-bold text-warning">{prop.delayMinutes} min</span>
                              </div>
                            </div>

                            <p className="text-[11px] text-muted-foreground leading-relaxed italic">
                              "{prop.explanation}"
                            </p>
                          </div>

                          <div className="pt-4 mt-auto">
                            {canPublish ? (
                              <Button
                                onClick={() => approveProposalMutation.mutate({ proposalId: prop.id })}
                                disabled={approveProposalMutation.isPending}
                                className={cn(
                                  "w-full text-xs font-semibold h-8.5",
                                  isRecommended ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-500/20" : ""
                                )}
                                variant={isRecommended ? "default" : "outline"}
                              >
                                {approveProposalMutation.isPending ? "Applying..." : "Approve & Dispatch"}
                              </Button>
                            ) : (
                              <p className="text-[10px] text-center text-muted-foreground italic">
                                Lacks schedule.publish permission
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>

      {/* REPORT DISRUPTION MODAL */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="sm:max-w-[480px]">
          <form onSubmit={handleReportIncident}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <AlertTriangle className="size-4 text-destructive" />
                Report Operational Disruption
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Record an incident to compute downstream ripple effects and recovery options.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Disruption Category</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger className="text-xs font-mono">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BUS_BREAKDOWN">Bus Mechanical Breakdown</SelectItem>
                      <SelectItem value="TRAFFIC_DELAY">Heavy Corridor Traffic</SelectItem>
                      <SelectItem value="CREW_ABSENCE">Crew Medical Absence</SelectItem>
                      <SelectItem value="ACCIDENT">Corridor Collision / Blockage</SelectItem>
                      <SelectItem value="ROAD_BLOCK">Road Closure / Detour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Incident Severity</Label>
                  <Select value={severity} onValueChange={(val: any) => setSeverity(val)}>
                    <SelectTrigger className="text-xs font-mono">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low (Minor Delay)</SelectItem>
                      <SelectItem value="medium">Medium (Trip Impact)</SelectItem>
                      <SelectItem value="high">High (Corridor Blocked)</SelectItem>
                      <SelectItem value="critical">Critical (Fleet Grounded)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Location / Road Milestone</Label>
                <Input
                  type="text"
                  placeholder="e.g. Salem 4-Roads Junction"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  className="text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Impact Start Time</Label>
                  <Input
                    type="time"
                    value={formatMinutesToTime(startTime)}
                    onChange={(e) => setStartTime(parseTimeToMinutes(e.target.value))}
                    className="font-mono text-xs"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Expected Clearance Time</Label>
                  <Input
                    type="time"
                    value={formatMinutesToTime(expectedEndTime || startTime + 120)}
                    onChange={(e) => setExpectedEndTime(parseTimeToMinutes(e.target.value))}
                    className="font-mono text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Incident Notes / Details</Label>
                <Input
                  type="text"
                  placeholder="e.g. Radiator overheat; bus stopped at platform 3"
                  value={descriptionText}
                  onChange={(e) => setDescriptionText(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowReportDialog(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" disabled={createIncidentMutation.isPending} className="bg-destructive text-destructive-foreground text-xs font-semibold">
                {createIncidentMutation.isPending ? "Logging..." : "Record Disruption"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function parseTimeToMinutes(timeStr: string): number {
  const [hStr, mStr] = timeStr.split(":");
  return Number(hStr || 0) * 60 + Number(mStr || 0);
}
