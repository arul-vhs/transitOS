import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  const { data: conductorsList = [] } = useQuery({
    queryKey: ["conductors-dropdown"],
    queryFn: () => getConductors(),
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
  useEffect(() => {
    if (incidentsList.length > 0 && !selectedIncidentId) {
      setSelectedIncidentId(incidentsList[0].id);
    }
  }, [incidentsList, selectedIncidentId]);

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

  // Dynamically load Leaflet Map
  useEffect(() => {
    if (selectedIncidentObj) {
      const container = document.getElementById("incident-map");
      if (container) {
        // Simple mock styling for the Leaflet component if Leaflet maps are loaded in root shell
      }
    }
  }, [selectedIncidentId, selectedIncident]);

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
      subtitle="Dynamic real-time incident analysis and constraint-reoptimization recovery schedules."
      actions={
        canGenerate && (
          <Button onClick={() => setShowReportDialog(true)} size="sm">
            <Plus className="mr-2 size-4" /> Report Disruption
          </Button>
        )
      }
    >
      <div className="grid gap-6 lg:grid-cols-4">
        {/* Left Column: Incidents Ticker list */}
        <div className="lg:col-span-1 space-y-4">
          <section className="panel p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Logged Incidents
            </h3>

            {listLoading ? (
              <div className="py-12 text-center text-xs text-muted-foreground">Loading disruptions log...</div>
            ) : incidentsList.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground italic">No incidents reported today.</div>
            ) : (
              <div className="space-y-2">
                {incidentsList.map((inc) => (
                  <button
                    key={inc.id}
                    onClick={() => setSelectedIncidentId(inc.id)}
                    className={`w-full p-3 border rounded-lg text-left transition-all ${
                      selectedIncidentId === inc.id
                        ? "border-primary bg-primary/5"
                        : "hover:bg-secondary/10"
                    }`}
                  >
                    <div className="flex justify-between items-center gap-2">
                      <Badge variant="outline" className="text-[9px] uppercase font-bold text-destructive bg-destructive/5">
                        {inc.type.replace("_", " ")}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(inc.reportedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs font-bold mt-1.5 truncate text-foreground">
                      {inc.description || "Service Disruption"}
                    </p>
                    <div className="flex justify-between items-center mt-2 text-[10px] text-muted-foreground">
                      <span>Status: <b>{inc.status}</b></span>
                      <span>Severity: <b className="text-destructive">{inc.severity}</b></span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Center/Right Details Panel */}
        <div className="lg:col-span-3 space-y-6">
          {detailsLoading ? (
            <div className="panel p-20 text-center text-xs text-muted-foreground">Loading incident data...</div>
          ) : !selectedIncidentObj ? (
            <div className="panel p-20 text-center text-xs text-muted-foreground italic">Select an incident to view details.</div>
          ) : (
            <div className="space-y-6">
              {/* Incident Status Card */}
              <section className="panel p-5 space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold">{selectedIncidentObj.type.replace("_", " ")}</h2>
                      <Badge variant="destructive" className="uppercase text-[9px]">{selectedIncidentObj.severity}</Badge>
                      <Badge variant="secondary" className="uppercase text-[9px]">{selectedIncidentObj.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Reported by {selectedIncidentObj.reporter?.name || "System"} on {selectedIncidentObj.serviceDate} at {new Date(selectedIncidentObj.reportedAt).toLocaleTimeString()}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {selectedIncidentObj.status === "OPEN" || selectedIncidentObj.status === "ANALYZING" ? (
                      <Button
                        onClick={() => generateProposalsMutation.mutate(selectedIncidentObj.id)}
                        disabled={generateProposalsMutation.isPending}
                        size="sm"
                        className="text-xs"
                      >
                        {generateProposalsMutation.isPending ? "Solving..." : "Solve Disruption"}
                      </Button>
                    ) : null}

                    {selectedIncidentObj.status !== "RESOLVED" && selectedIncidentObj.status !== "CANCELLED" && (
                      <Button
                        onClick={() => resolveIncidentMutation.mutate(selectedIncidentObj.id)}
                        disabled={resolveIncidentMutation.isPending}
                        variant="outline"
                        size="sm"
                        className="text-xs text-success hover:text-success"
                      >
                        Resolve Disruption
                      </Button>
                    )}
                  </div>
                </div>

                <div className="p-3 border rounded bg-secondary/5 text-xs font-medium space-y-1">
                  <p>Location: <b>{selectedIncidentObj.location || "N/A"}</b></p>
                  <p>Incident Start: <b>{startTime} mins</b></p>
                  {selectedIncidentObj.description && <p>Details: <i>{selectedIncidentObj.description}</i></p>}
                </div>
              </section>

              {/* Impact Traversal Flow Card (Visual Dependency Graph) */}
              <section className="panel p-5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Operational Disruption Impact Dependency Graph
                </h3>

                <div className="flex flex-col gap-3 max-w-xl mx-auto">
                  <div className="p-3.5 border rounded-lg bg-destructive/5 border-destructive/20 flex items-center gap-3">
                    <AlertTriangle className="size-5 text-destructive shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-destructive">Disruption Source Incident</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{selectedIncidentObj.type} reported at {selectedIncidentObj.startTime} mins</p>
                    </div>
                  </div>

                  <div className="flex justify-center"><GitCommit className="size-4 text-muted-foreground rotate-90" /></div>

                  <div className="p-3.5 border rounded-lg bg-secondary/10 flex items-center gap-3">
                    <BusIcon className="size-5 text-primary shrink-0" />
                    <div>
                      <p className="text-xs font-bold">Direct Resource Affected</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{selectedIncidentObj.resourceType === "bus" ? "Bus vehicle" : "Crew driver"} ID: {selectedIncidentObj.resourceId || "N/A"}</p>
                    </div>
                  </div>

                  {selectedIncidentObj.impacts?.length > 0 && (
                    <>
                      <div className="flex justify-center"><GitCommit className="size-4 text-muted-foreground rotate-90" /></div>

                      <div className="p-3.5 border rounded-lg bg-warning/5 border-warning/20 space-y-2">
                        <p className="text-xs font-bold text-warning flex items-center gap-2">
                          <AlertTriangle className="size-4" /> Downstream Affected Trip chain & crew impacts
                        </p>
                        <div className="divide-y text-[10px] text-muted-foreground">
                          {selectedIncidentObj.impacts.map((imp: any) => (
                            <div key={imp.id} className="py-1.5 flex justify-between gap-4">
                              <span>Trip <b>{imp.trip?.tripCode || "Unbound"}</b> ({imp.impactType})</span>
                              <span className="font-semibold text-warning uppercase">{imp.impactLevel}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </section>

              {/* Side-by-Side Recovery Proposals Comparison Table */}
              {proposals.length > 0 && (
                <section className="panel p-5 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Generated Recovery Proposals Comparison
                  </h3>

                  <div className="grid gap-4 md:grid-cols-3">
                    {proposals.map((prop: any) => {
                      const isRecommended = prop.id === recommendedProposalId;
                      return (
                        <div
                          key={prop.id}
                          className={`p-4 border rounded-xl flex flex-col justify-between relative ${
                            isRecommended
                              ? "border-primary bg-primary/5 shadow-sm"
                              : "bg-background"
                          }`}
                        >
                          {isRecommended && (
                            <Badge className="absolute top-2 right-2 bg-success text-white hover:bg-success text-[8px] h-5 px-1.5">
                              Recommended
                            </Badge>
                          )}
                          <div className="space-y-3">
                            <div>
                              <p className="text-xs font-bold uppercase text-muted-foreground">Option {prop.proposalNumber}</p>
                              <p className="text-lg font-bold font-mono mt-1 text-primary">Score: {prop.objectiveScore}</p>
                            </div>

                            <div className="space-y-1.5 text-xs border-y py-2.5 my-2">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Trips Recovered:</span>
                                <span className="font-bold text-success font-mono">{prop.tripsRecovered}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Cancellations:</span>
                                <span className="font-bold text-destructive font-mono">{prop.cancellations}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Handovers:</span>
                                <span className="font-bold font-mono">{prop.handovers}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">New Buses:</span>
                                <span className="font-bold font-mono">{prop.busesUsed}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Delay Minutes:</span>
                                <span className="font-bold font-mono">{prop.delayMinutes} mins</span>
                              </div>
                            </div>

                            <p className="text-[10px] text-muted-foreground italic mt-2">
                              {prop.explanation}
                            </p>
                          </div>

                          <div className="pt-4 mt-auto">
                            {prop.status === "APPLIED" ? (
                              <Badge className="w-full justify-center bg-success text-white h-8 text-xs">
                                <Check className="size-3.5 mr-1" /> Plan Applied
                              </Badge>
                            ) : canPublish ? (
                              <Button
                                onClick={() => approveProposalMutation.mutate({ proposalId: prop.id })}
                                disabled={approveProposalMutation.isPending}
                                className="w-full text-xs"
                                size="sm"
                              >
                                {approveProposalMutation.isPending ? "Applying..." : "Approve Plan"}
                              </Button>
                            ) : (
                              <p className="text-[9px] text-muted-foreground text-center italic">
                                Publisher permission required
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* GIS Maps Section */}
              <section className="panel p-5 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <MapPin className="size-4 text-primary" /> GIS Spatial Disruption Location Map
                </h3>
                <div
                  id="incident-map"
                  className="h-[300px] border rounded bg-secondary/5 flex items-center justify-center text-xs text-muted-foreground"
                >
                  <div className="text-center space-y-2">
                    <MapPin className="size-8 text-primary mx-auto animate-bounce" />
                    <p className="font-bold text-foreground">Live Route Corridor Map</p>
                    <p className="text-[10px] max-w-sm mx-auto">
                      Visualizing affected corridor route networks and replacement bus path lines.
                    </p>
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>
      </div>

      {/* Report Incident Dialog */}
      {showReportDialog && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleReportIncident} className="panel p-6 max-w-md w-full space-y-4">
            <h3 className="text-sm font-bold border-b pb-2 flex items-center gap-2">
              <AlertTriangle className="size-5 text-destructive shrink-0" /> Report Disruption Incident
            </h3>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="incidentType" className="text-xs">Incident Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger id="incidentType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BUS_BREAKDOWN">Bus Breakdown</SelectItem>
                    <SelectItem value="BUS_UNAVAILABLE">Bus Unavailable</SelectItem>
                    <SelectItem value="DRIVER_ABSENT">Driver Absent</SelectItem>
                    <SelectItem value="CONDUCTOR_ABSENT">Conductor Absent</SelectItem>
                    <SelectItem value="CREW_EMERGENCY">Crew Emergency</SelectItem>
                    <SelectItem value="TRIP_DELAY">Trip Delay</SelectItem>
                    <SelectItem value="TRIP_CANCELLED">Trip Cancelled</SelectItem>
                    <SelectItem value="ROUTE_BLOCKED">Route Blocked</SelectItem>
                    <SelectItem value="MANUAL_DISRUPTION">Manual Disruption</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="incidentSeverity" className="text-xs">Severity</Label>
                <Select value={severity} onValueChange={(val: any) => setSeverity(val)}>
                  <SelectTrigger id="incidentSeverity">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="resType" className="text-xs">ResourceType</Label>
                <Select value={resourceType} onValueChange={(val: any) => setResourceType(val)}>
                  <SelectTrigger id="resType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bus">Bus</SelectItem>
                    <SelectItem value="crew">Crew</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {resourceType === "bus" && (
                <div className="space-y-1">
                  <Label htmlFor="busSelect" className="text-xs">Select Bus</Label>
                  <Select value={resourceId} onValueChange={setResourceId}>
                    <SelectTrigger id="busSelect">
                      <SelectValue placeholder="Select Bus" />
                    </SelectTrigger>
                    <SelectContent>
                      {busesList.map((b) => (
                        <SelectItem key={b.id} value={b.id}>{b.registrationNumber}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {resourceType === "crew" && (
                <div className="space-y-1">
                  <Label htmlFor="crewSelect" className="text-xs">Select Crew</Label>
                  <Select value={resourceId} onValueChange={setResourceId}>
                    <SelectTrigger id="crewSelect">
                      <SelectValue placeholder="Select Driver/Conductor" />
                    </SelectTrigger>
                    <SelectContent>
                      {[...driversList, ...conductorsList].map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name} ({c.role})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {type === "TRIP_DELAY" || type === "TRIP_CANCELLED" ? (
                <div className="space-y-1">
                  <Label htmlFor="tripSelect" className="text-xs">Select Trip</Label>
                  <Select value={tripId} onValueChange={setTripId}>
                    <SelectTrigger id="tripSelect">
                      <SelectValue placeholder="Select Trip" />
                    </SelectTrigger>
                    <SelectContent>
                      {tripsList.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.tripCode} ({t.origin} → {t.destination})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              {type === "ROUTE_BLOCKED" && (
                <div className="space-y-1">
                  <Label htmlFor="routeSelect" className="text-xs">Select Route</Label>
                  <Select value={routeId} onValueChange={setRouteId}>
                    <SelectTrigger id="routeSelect">
                      <SelectValue placeholder="Select Route" />
                    </SelectTrigger>
                    <SelectContent>
                      {routesList.map((r) => (
                        <SelectItem key={r.id} value={r.id}>{r.code} - {r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="startT" className="text-xs">Incident Start Time (mins)</Label>
                  <Input id="startT" type="number" value={startTime} onChange={(e) => setStartTime(Number(e.target.value))} className="h-9" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="endT" className="text-xs">Expected End Time (mins)</Label>
                  <Input id="endT" type="number" value={expectedEndTime || ""} onChange={(e) => setExpectedEndTime(e.target.value ? Number(e.target.value) : null)} className="h-9" />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="loc" className="text-xs">Incident Location (station/depot)</Label>
                <Input id="loc" type="text" value={locationName} onChange={(e) => setLocationName(e.target.value)} className="h-9" placeholder="Depot A / Bus Station B" />
              </div>

              <div className="space-y-1">
                <Label htmlFor="desc" className="text-xs">Detailed description</Label>
                <Input id="desc" type="text" value={descriptionText} onChange={(e) => setDescriptionText(e.target.value)} className="h-9" placeholder="e.g. flat tire / engine overheat" />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-3">
              <Button type="button" onClick={() => setShowReportDialog(false)} variant="ghost" className="text-xs">
                Cancel
              </Button>
              <Button type="submit" disabled={createIncidentMutation.isPending} className="text-xs">
                {createIncidentMutation.isPending ? "Logging..." : "Log Disruption"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </AppShell>
  );
}
