import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  MapPin,
  Search,
  Plus,
  Edit2,
  Eye,
  Trash2,
  CheckCircle2,
  Waypoints,
  ArrowRight,
  Filter,
  Map,
  Compass,
  ArrowUpDown,
  ListOrdered,
  Activity,
  AlertTriangle,
  Route as RouteIcon,
  Sparkles,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Route as RootRoute } from "@/routes/__root";
import { hasPermission } from "@/lib/auth-shared";
import {
  getRoutes,
  getRoute,
  createRoute,
  updateRoute,
  updateRouteStatus,
  deleteRoute,
  createStop,
  updateStop,
  deleteStop,
  reorderStops,
  analyzeRouteOverlap,
} from "@/lib/routes-gis-fns";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/network/routes")({
  beforeLoad: ({ context }) => {
    if (!context.user || !hasPermission(context.user.role, "routes.view")) {
      throw new Error("Forbidden");
    }
  },
  head: () => ({
    meta: [
      { title: "Route Network — TransitOS" },
      { name: "description", content: "Explore Salem corridors, stop sequence coordinates and overlap." },
    ],
  }),
  component: RoutesPage,
});

function RoutesPage() {
  const queryClient = useQueryClient();
  const context = RootRoute.useRouteContext();
  const user = context?.user;
  const canManage = hasPermission(user?.role || "", "routes.manage");

  // Filters state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [directionFilter, setDirectionFilter] = useState("all");

  // Selection
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("map");

  // Dialog / form states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddStopOpen, setIsAddStopOpen] = useState(false);

  // Form states (Route)
  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formOrigin, setFormOrigin] = useState("");
  const [formDestination, setFormDestination] = useState("");
  const [formLengthKm, setFormLengthKm] = useState("10.00");
  const [formDurationMin, setFormDurationMin] = useState("30");
  const [formDirection, setFormDirection] = useState("UP");
  const [formColor, setFormColor] = useState("#3B82F6");
  const [formStatus, setFormStatus] = useState("draft");
  const [formPeakFreq, setFormPeakFreq] = useState("15");
  const [formOffPeakFreq, setFormOffPeakFreq] = useState("30");

  // Form states (Stop)
  const [stopName, setStopName] = useState("");
  const [stopSeq, setStopSeq] = useState("");
  const [stopLat, setStopLat] = useState("11.6673");
  const [stopLng, setStopLng] = useState("78.1424");

  // 1. Fetch Routes List
  const { data: routesList = [], isLoading } = useQuery<any[]>({
    queryKey: ["routes", statusFilter, directionFilter, search],
    queryFn: () =>
      getRoutes({
        status: statusFilter,
        direction: directionFilter,
        search,
      }) as any,
  });

  // Set default selected route on initial load if none selected
  useEffect(() => {
    if (routesList.length > 0 && !selectedRouteId) {
      setSelectedRouteId(routesList[0].id);
    }
  }, [routesList, selectedRouteId]);

  // 2. Fetch Selected Route Details
  const { data: selectedRouteDetails } = useQuery<any>({
    queryKey: ["route", selectedRouteId],
    queryFn: () => getRoute(selectedRouteId!) as any,
    enabled: !!selectedRouteId,
    placeholderData: (previousData) => previousData,
  });

  // 3. Fetch Overlap Analysis for Selected Route
  const { data: overlapResults = [], refetch: runOverlapCheck } = useQuery<any[]>({
    queryKey: ["route-overlap-analysis", selectedRouteId],
    queryFn: () => analyzeRouteOverlap(selectedRouteDetails?.geometryGeojson) as any,
    enabled: !!selectedRouteDetails?.geometryGeojson,
  });

  // Map Refs
  const [L, setL] = useState<any>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const polylineGroupRef = useRef<any>(null);
  const markerGroupRef = useRef<any>(null);

  // Dynamic Leaflet Import
  useEffect(() => {
    if (typeof window !== "undefined") {
      import("leaflet").then((mod) => {
        setL(mod.default);
      });
    }
  }, []);

  // Map Initialization & Updates
  useEffect(() => {
    if (!L || !mapRef.current) return;

    let map = mapInstanceRef.current;
    // Check if map doesn't exist or its container was remounted
    if (!map || map.getContainer() !== mapRef.current) {
      if (map) {
        try {
          map.remove();
        } catch {}
        mapInstanceRef.current = null;
      }
      if (mapRef.current) {
        delete (mapRef.current as any)._leaflet_id;
      }
      map = L.map(mapRef.current).setView([11.6673, 78.1424], 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);
      mapInstanceRef.current = map;
      polylineGroupRef.current = L.featureGroup().addTo(map);
      markerGroupRef.current = L.featureGroup().addTo(map);
    }

    if (!polylineGroupRef.current || !markerGroupRef.current) {
      polylineGroupRef.current = L.featureGroup().addTo(map);
      markerGroupRef.current = L.featureGroup().addTo(map);
    }

    polylineGroupRef.current.clearLayers();
    markerGroupRef.current.clearLayers();

    // 1. Draw all routes
    routesList.forEach((r: any) => {
      if (r.geometryGeojson?.coordinates?.length > 1) {
        const latlngs = r.geometryGeojson.coordinates
          .filter((c: any) => Array.isArray(c) && !isNaN(Number(c[0])) && !isNaN(Number(c[1])))
          .map((c: any) => [Number(c[1]), Number(c[0])]);

        if (latlngs.length > 1) {
          const active = r.id === selectedRouteId;
          const polyline = L.polyline(latlngs, {
            color: r.color || "#3B82F6",
            weight: active ? 6 : 3,
            opacity: active ? 1 : 0.4,
          });

          polyline.bindPopup(`<b>${r.code}</b><br/>${r.name}`);
          polyline.addTo(polylineGroupRef.current);
        }
      }
    });

    // 2. Draw stops for selected route as markers
    if (selectedRouteDetails?.stops) {
      selectedRouteDetails.stops.forEach((stop: any) => {
        const lat = Number(stop.latitude);
        const lng = Number(stop.longitude);
        if (!isNaN(lat) && !isNaN(lng)) {
          const markerIcon = L.divIcon({
            html: `<div style="background-color: ${selectedRouteDetails.color || "#3B82F6"}; width: 14px; height: 14px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 1px 4px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: white; font-size: 8px; font-weight: bold;">${stop.sequence}</div>`,
            className: "custom-stop-marker",
            iconSize: [14, 14],
            iconAnchor: [7, 7],
          });

          const marker = L.marker([lat, lng], {
            icon: markerIcon,
            draggable: canManage,
          });

          marker.bindPopup(`<b>Stop ${stop.sequence}: ${stop.name}</b><br/>Sequence: ${stop.sequence}<br/>Drag to move stop position`);

          if (canManage) {
            marker.on("dragend", async (event: any) => {
              const newLatLng = event.target.getLatLng();
              try {
                await updateStop({
                  id: stop.id,
                  data: {
                    name: stop.name,
                    sequence: stop.sequence,
                    latitude: String(newLatLng.lat.toFixed(6)),
                    longitude: String(newLatLng.lng.toFixed(6)),
                  },
                });
                queryClient.invalidateQueries({ queryKey: ["route", selectedRouteId] });
                toast.success(`Position of stop "${stop.name}" updated.`);
              } catch (err: any) {
                toast.error(err.message || "Failed to update stop position");
              }
            });
          }

          marker.addTo(markerGroupRef.current);
        }
      });

      // Fit bounds to selected route
      if (selectedRouteDetails.geometryGeojson?.coordinates?.length > 1) {
        try {
          const latlngs = selectedRouteDetails.geometryGeojson.coordinates
            .filter((c: any) => Array.isArray(c) && !isNaN(Number(c[0])) && !isNaN(Number(c[1])))
            .map((c: any) => [Number(c[1]), Number(c[0])]);
          if (latlngs.length > 0) {
            const bounds = L.latLngBounds(latlngs);
            if (bounds.isValid()) {
              map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
            }
          }
        } catch (err) {
          console.warn("fitBounds warning:", err);
        }
      }
    }

    // Always invalidate size in next tick
    const timer = setTimeout(() => {
      try {
        mapInstanceRef.current?.invalidateSize();
      } catch {}
    }, 100);

    return () => clearTimeout(timer);
  }, [L, routesList, selectedRouteId, selectedRouteDetails, canManage, activeTab]);

  // Mutations
  const createRouteMutation = useMutation({
    mutationFn: createRoute,
    onSuccess: (newR: any) => {
      queryClient.invalidateQueries({ queryKey: ["routes"] });
      setSelectedRouteId(newR.id);
      toast.success("Route created successfully");
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create route");
    },
  });

  const updateRouteMutation = useMutation({
    mutationFn: updateRoute,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routes"] });
      queryClient.invalidateQueries({ queryKey: ["route", selectedRouteId] });
      toast.success("Route updated successfully");
      setIsEditOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update route");
    },
  });

  const deleteRouteMutation = useMutation({
    mutationFn: deleteRoute,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routes"] });
      setSelectedRouteId(null);
      toast.success("Route archived successfully");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to archive route");
    },
  });

  const statusMutation = useMutation({
    mutationFn: updateRouteStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routes"] });
      queryClient.invalidateQueries({ queryKey: ["route", selectedRouteId] });
      toast.success("Route status updated");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update status");
    },
  });

  const createStopMutation = useMutation({
    mutationFn: createStop,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["route", selectedRouteId] });
      toast.success("Stop added successfully");
      setIsAddStopOpen(false);
      setStopName("");
      setStopSeq("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to add stop");
    },
  });

  const deleteStopMutation = useMutation({
    mutationFn: deleteStop,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["route", selectedRouteId] });
      toast.success("Stop deleted and sequence re-numbered");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete stop");
    },
  });

  const shiftStopSequenceMutation = useMutation({
    mutationFn: async (payload: { stop: any; direction: "up" | "down" }) => {
      const stopsList = selectedRouteDetails?.stops || [];
      const index = stopsList.findIndex((s: any) => s.id === payload.stop.id);
      if (index === -1) return;

      const swapIndex = payload.direction === "up" ? index - 1 : index + 1;
      if (swapIndex < 0 || swapIndex >= stopsList.length) return;

      const currentStop = stopsList[index]!;
      const targetStop = stopsList[swapIndex]!;

      // Update target stop sequence to current stop sequence
      await updateStop({
        id: targetStop.id,
        data: {
          name: targetStop.name,
          sequence: currentStop.sequence,
          latitude: targetStop.latitude,
          longitude: targetStop.longitude,
        },
      });

      // Update current stop sequence to target stop sequence
      await updateStop({
        id: currentStop.id,
        data: {
          name: currentStop.name,
          sequence: targetStop.sequence,
          latitude: currentStop.latitude,
          longitude: currentStop.longitude,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["route", selectedRouteId] });
      toast.success("Stop sequence reordered");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to shift sequence");
    },
  });

  const resetForm = () => {
    setFormCode("");
    setFormName("");
    setFormOrigin("");
    setFormDestination("");
    setFormLengthKm("10.00");
    setFormDurationMin("30");
    setFormDirection("UP");
    setFormColor("#3B82F6");
    setFormStatus("draft");
    setFormPeakFreq("15");
    setFormOffPeakFreq("30");
  };

  const handleOpenEdit = () => {
    if (!selectedRouteDetails) return;
    setFormCode(selectedRouteDetails.code);
    setFormName(selectedRouteDetails.name);
    setFormOrigin(selectedRouteDetails.origin || "");
    setFormDestination(selectedRouteDetails.destination || "");
    setFormLengthKm(selectedRouteDetails.lengthKm);
    setFormDurationMin(String(selectedRouteDetails.durationMin));
    setFormDirection(selectedRouteDetails.direction || "UP");
    setFormColor(selectedRouteDetails.color || "#3B82F6");
    setFormStatus(selectedRouteDetails.status);
    setFormPeakFreq(String(selectedRouteDetails.peakFrequency || 15));
    setFormOffPeakFreq(String(selectedRouteDetails.offPeakFrequency || 30));
    setIsEditOpen(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createRouteMutation.mutate({
      code: formCode,
      name: formName,
      origin: formOrigin,
      destination: formDestination,
      lengthKm: formLengthKm,
      durationMin: Number(formDurationMin),
      direction: formDirection,
      color: formColor,
      status: formStatus,
      peakFrequency: Number(formPeakFreq),
      offPeakFrequency: Number(formOffPeakFreq),
      geometryGeojson: {
        type: "LineString",
        coordinates: [
          [78.1424, 11.6673], // MGR Central Bus Stand default start
          [78.1573, 11.6795], // Hasthampatti Roundana end
        ],
      },
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRouteId) return;
    updateRouteMutation.mutate({
      id: selectedRouteId,
      data: {
        code: formCode,
        name: formName,
        origin: formOrigin,
        destination: formDestination,
        lengthKm: formLengthKm,
        durationMin: Number(formDurationMin),
        direction: formDirection,
        color: formColor,
        status: formStatus,
        peakFrequency: Number(formPeakFreq),
        offPeakFrequency: Number(formOffPeakFreq),
        geometryGeojson: selectedRouteDetails?.geometryGeojson,
      },
    });
  };

  const handleAddStopSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRouteId) return;
    createStopMutation.mutate({
      routeId: selectedRouteId,
      name: stopName,
      sequence: Number(stopSeq || (selectedRouteDetails?.stops?.length + 1) || 1),
      latitude: stopLat,
      longitude: stopLng,
    });
  };

  // Metrics (PostgreSQL values)
  const totalRoutes = routesList.length;
  const activeRoutes = routesList.filter((r) => r.status === "active").length;
  const draftRoutes = routesList.filter((r) => r.status === "draft").length;
  const proposedRoutes = routesList.filter((r) => r.status === "proposed").length;
  const avgLength =
    totalRoutes > 0
      ? (routesList.reduce((acc, r) => acc + Number(r.lengthKm), 0) / totalRoutes).toFixed(1)
      : "0";
  const avgDuration =
    totalRoutes > 0
      ? Math.round(routesList.reduce((acc, r) => acc + r.durationMin, 0) / totalRoutes)
      : 0;

  return (
    <AppShell
      title="Route Network"
      subtitle="Operational corridor registries, coordinate stop sequencing, and geographic maps."
      actions={
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex text-xs">
            <Link to="/network/planner">
              <RouteIcon className="mr-1.5 size-3.5 text-primary" />
              Route Planner
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex text-xs">
            <Link to="/scheduling/optimizer">
              <Sparkles className="mr-1.5 size-3.5 text-primary" />
              Schedule Optimizer
            </Link>
          </Button>
          {canManage && (
            <Button
              size="sm"
              onClick={() => {
                resetForm();
                setIsCreateOpen(true);
              }}
            >
              <Plus className="mr-2 size-4" />
              Create Route
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {/* 1. Metrics overview */}
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
          <div className="glass-card p-4 rounded-xl border flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Corridors</span>
            <span className="text-2xl font-bold font-mono mt-1 text-foreground">{totalRoutes}</span>
          </div>
          <div className="glass-card p-4 rounded-xl border-l-4 border-l-success flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Active</span>
            <span className="text-2xl font-bold font-mono mt-1 text-success">{activeRoutes}</span>
          </div>
          <div className="glass-card p-4 rounded-xl border-l-4 border-l-info flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Draft</span>
            <span className="text-2xl font-bold font-mono mt-1 text-info">{draftRoutes}</span>
          </div>
          <div className="glass-card p-4 rounded-xl border-l-4 border-l-warning flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Proposed</span>
            <span className="text-2xl font-bold font-mono mt-1 text-warning">{proposedRoutes}</span>
          </div>
          <div className="glass-card p-4 rounded-xl border-l-4 border-l-primary flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Avg Length</span>
            <span className="text-2xl font-bold font-mono mt-1 text-foreground">{avgLength} km</span>
          </div>
          <div className="glass-card p-4 rounded-xl border-l-4 border-l-secondary flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Avg Duration</span>
            <span className="text-2xl font-bold font-mono mt-1 text-foreground">{avgDuration} min</span>
          </div>
        </div>

        {/* 2. Filter Bar */}
        <div className="glass-panel p-4 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-1 flex-wrap gap-3 items-center min-w-[280px]">
            <div className="relative flex-1 max-w-sm min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Search route code, name, stops..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 bg-background/60 text-xs border-border/80"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="size-3.5 text-muted-foreground shrink-0" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36 bg-background/60 text-xs border-border/80">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="proposed">Proposed</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Select value={directionFilter} onValueChange={setDirectionFilter}>
                <SelectTrigger className="w-36 bg-background/60 text-xs border-border/80">
                  <SelectValue placeholder="Direction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Directions</SelectItem>
                  <SelectItem value="UP">Up direction</SelectItem>
                  <SelectItem value="DOWN">Down direction</SelectItem>
                  <SelectItem value="CIRCULAR">Circular</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* 3. Columns Layout: Left List, Right Tabs */}
        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          {/* Left panel: list of routes */}
          <section className="glass-panel p-3.5 h-fit space-y-3">
            <p className="px-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Corridor Registers ({routesList.length})
            </p>
            <div className="max-h-[540px] overflow-y-auto space-y-1.5 pr-1">
              {isLoading ? (
                <div className="py-10 text-center text-xs text-muted-foreground">Loading corridors...</div>
              ) : routesList.length === 0 ? (
                <div className="py-10 text-center text-xs text-muted-foreground">No corridors match filters.</div>
              ) : (
                routesList.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRouteId(r.id)}
                    className={cn(
                      "w-full rounded-xl p-3 text-left transition-all duration-150 flex items-center justify-between border cursor-pointer",
                      r.id === selectedRouteId
                        ? "bg-primary/10 border-primary shadow-xs ring-1 ring-primary/30"
                        : "hover:bg-muted/60 bg-card/50 border-border/70"
                    )}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className="size-3 rounded-full border border-white/40 shadow-xs shrink-0"
                          style={{ backgroundColor: r.color || "#3B82F6" }}
                        />
                        <span className="font-bold text-xs font-mono text-foreground">{r.code}</span>
                        <Badge variant="outline" className="text-[9px] px-1 py-0 uppercase font-mono">
                          {r.direction}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1 truncate max-w-[220px]">
                        {r.origin} ➔ {r.destination}
                      </p>
                    </div>

                    <div className="text-right text-[10px] font-mono text-muted-foreground">
                      <p>{r.lengthKm} km</p>
                      <p>{r.durationMin} min</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </section>

          {/* Right panel: Tab views */}
          <div className="space-y-4">
            {selectedRouteDetails ? (
              <>
                {/* Selected Route Header Summary */}
                <div className="panel p-4 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className="size-4 rounded-full border border-white"
                        style={{ backgroundColor: selectedRouteDetails.color || "#3B82F6" }}
                      ></span>
                      <h2 className="text-lg font-bold text-foreground">{selectedRouteDetails.code}</h2>
                      <Badge variant="secondary" className="uppercase text-[9px] h-5 px-1 font-semibold">
                        {selectedRouteDetails.direction}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{selectedRouteDetails.name}</p>
                  </div>
                  <div className="flex gap-2">
                    {canManage && (
                      <>
                        <Select
                          value={selectedRouteDetails.status}
                          onValueChange={(val) => statusMutation.mutate({ id: selectedRouteDetails.id, status: val })}
                        >
                          <SelectTrigger className="h-8 w-[120px] text-xs uppercase font-semibold bg-background/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active" className="text-xs uppercase">Active</SelectItem>
                            <SelectItem value="draft" className="text-xs uppercase">Draft</SelectItem>
                            <SelectItem value="proposed" className="text-xs uppercase">Proposed</SelectItem>
                            <SelectItem value="suspended" className="text-xs uppercase">Suspended</SelectItem>
                          </SelectContent>
                        </Select>

                        <Button size="sm" variant="outline" onClick={handleOpenEdit}>
                          <Edit2 className="size-3.5 mr-1" /> Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            if (confirm(`Archive route ${selectedRouteDetails.code}?`)) {
                              deleteRouteMutation.mutate(selectedRouteDetails.id);
                            }
                          }}
                        >
                          <Trash2 className="size-3.5 mr-1" /> Archive
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="bg-muted p-1 rounded-md">
                    <TabsTrigger value="map" className="flex items-center gap-1">
                      <Map className="size-3.5" /> Map Network
                    </TabsTrigger>
                    <TabsTrigger value="stops" className="flex items-center gap-1">
                      <ListOrdered className="size-3.5" /> Stops CRUD ({selectedRouteDetails.stops?.length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="overlap" className="flex items-center gap-1">
                      <Waypoints className="size-3.5" /> Overlap Analysis
                    </TabsTrigger>
                  </TabsList>

                  {/* Map Tab */}
                  <TabsContent value="map" forceMount className={cn("mt-4", activeTab !== "map" && "hidden")}>
                    <section className="panel overflow-hidden">
                      <div className="bg-secondary/40 px-4 py-2 text-xs text-muted-foreground flex justify-between items-center">
                        <span>Salem OpenStreetMap grid</span>
                        {canManage && <span className="text-primary font-medium">Draggable Stop Pins Mode Active</span>}
                      </div>
                      <div ref={mapRef} className="h-[400px] w-full bg-accent/20 z-0"></div>
                    </section>
                  </TabsContent>

                  {/* Stops List Tab */}
                  <TabsContent value="stops" className="mt-4 space-y-4">
                    <div className="panel p-4 space-y-4">
                      <div className="flex justify-between items-center border-b pb-2">
                        <h3 className="text-sm font-semibold flex items-center gap-2">
                          <MapPin className="size-4 text-primary" /> Stop Nodes Registry
                        </h3>
                        {canManage && (
                          <Button size="sm" onClick={() => setIsAddStopOpen(true)}>
                            <Plus className="size-3.5 mr-1" /> Add Stop Node
                          </Button>
                        )}
                      </div>

                      {selectedRouteDetails.stops?.length === 0 ? (
                        <div className="p-8 text-center text-xs text-muted-foreground border border-dashed rounded-md">
                          No stops defined for this corridor.
                        </div>
                      ) : (
                        <div className="border rounded-md overflow-hidden bg-background/50">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-[80px]">Sequence</TableHead>
                                <TableHead>Stop Name</TableHead>
                                <TableHead>Latitude</TableHead>
                                <TableHead>Longitude</TableHead>
                                {canManage && <TableHead className="w-[180px] text-right">Actions</TableHead>}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {selectedRouteDetails.stops.map((stop: any, idx: number) => (
                                <TableRow key={stop.id}>
                                  <TableCell className="font-mono font-bold text-primary">{stop.sequence}</TableCell>
                                  <TableCell className="font-semibold text-sm">{stop.name}</TableCell>
                                  <TableCell className="font-mono text-xs">{Number(stop.latitude).toFixed(6)}</TableCell>
                                  <TableCell className="font-mono text-xs">{Number(stop.longitude).toFixed(6)}</TableCell>
                                  {canManage && (
                                    <TableCell className="text-right">
                                      <div className="flex justify-end gap-1.5">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 text-muted-foreground"
                                          disabled={idx === 0}
                                          onClick={() => shiftStopSequenceMutation.mutate({ stop, direction: "up" })}
                                        >
                                          <ArrowUpDown className="size-3.5 rotate-180" />
                                          <span className="sr-only">Move Up</span>
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 text-muted-foreground"
                                          disabled={idx === selectedRouteDetails.stops.length - 1}
                                          onClick={() => shiftStopSequenceMutation.mutate({ stop, direction: "down" })}
                                        >
                                          <ArrowUpDown className="size-3.5" />
                                          <span className="sr-only">Move Down</span>
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                          onClick={() => {
                                            if (confirm(`Delete stop ${stop.name}?`)) {
                                              deleteStopMutation.mutate(stop.id);
                                            }
                                          }}
                                        >
                                          <Trash2 className="size-3.5" />
                                          <span className="sr-only">Delete Stop</span>
                                        </Button>
                                      </div>
                                    </TableCell>
                                  )}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* Overlap Tab */}
                  <TabsContent value="overlap" className="mt-4 space-y-4">
                    <section className="panel p-4 space-y-4">
                      <div className="flex justify-between items-center border-b pb-2">
                        <div>
                          <h3 className="text-sm font-semibold">Geometric Overlap Analysis</h3>
                          <p className="text-xs text-muted-foreground">
                            Calculates corridor overlap against other active corridors in this tenant registry.
                          </p>
                        </div>
                        <Button size="sm" onClick={() => runOverlapCheck()}>
                          <Activity className="size-3.5 mr-1" /> Re-Analyze
                        </Button>
                      </div>

                      {overlapResults.length === 0 ? (
                        <div className="p-8 text-center text-xs text-success border border-dashed rounded-md bg-success/5 border-success/20">
                          No overlapping segments detected. This corridor runs independently.
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="grid gap-4 sm:grid-cols-2">
                            {overlapResults.map((result: any) => (
                              <div key={result.routeId} className="panel p-3 border-l-4 space-y-2 bg-secondary/15" style={{ borderLeftColor: result.severity === "HIGH" ? "var(--color-destructive)" : result.severity === "MEDIUM" ? "var(--color-warning)" : "var(--color-success)" }}>
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="text-sm font-bold text-foreground">{result.routeCode}</p>
                                    <p className="text-xs text-muted-foreground">{result.routeName}</p>
                                  </div>
                                  <Badge className={result.severity === "HIGH" ? "bg-destructive/15 text-destructive border-destructive/25" : result.severity === "MEDIUM" ? "bg-warning/15 text-warning border-warning/25" : "bg-success/15 text-success border-success/25"}>
                                    {result.severity}
                                  </Badge>
                                </div>
                                <div className="flex justify-between text-xs pt-1">
                                  <span>Overlap length: <b>{result.overlapDistanceKm} km</b></span>
                                  <span>Overlap ratio: <b>{result.overlapPercentage}%</b></span>
                                </div>
                              </div>
                            ))}
                          </div>

                          {overlapResults.some((r: any) => r.severity === "HIGH" || r.severity === "MEDIUM") && (
                            <div className="flex items-start gap-2.5 rounded-lg border border-warning/25 bg-warning/5 px-4 py-3 text-sm text-warning font-medium">
                              <AlertTriangle className="size-4 mt-0.5 shrink-0" />
                              <div>
                                <p>Moderate/High Corridor Overlaps Detected</p>
                                <p className="text-xs text-warning/80 font-normal mt-0.5">
                                  Multiple segments of this route conflict with existing corridors. Consider adjusting the corridor coordinates or stop placements.
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </section>
                  </TabsContent>
                </Tabs>
              </>
            ) : (
              <div className="panel py-20 text-center text-muted-foreground text-sm">
                No route selected. Select a route from the sidebar registry or create a new proposed corridor.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DIALOGS FOR CREATING/EDITING ROUTES AND STOPS */}

      {/* CREATE ROUTE DIALOG */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleCreateSubmit}>
            <DialogHeader>
              <DialogTitle>Create Route Corridor</DialogTitle>
              <DialogDescription>
                Add a new transit route profile. Planners can draw the route points on the planner map afterwards.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="code" className="text-right">Route Code</Label>
                <Input
                  id="code"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  placeholder="e.g. Route 106"
                  className="col-span-3 font-semibold text-primary"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Route Name</Label>
                <Input
                  id="name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Salem Central → Hasthampatti"
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="origin" className="text-right">Origin</Label>
                <Input
                  id="origin"
                  value={formOrigin}
                  onChange={(e) => setFormOrigin(e.target.value)}
                  placeholder="Salem Central"
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="destination" className="text-right">Destination</Label>
                <Input
                  id="destination"
                  value={formDestination}
                  onChange={(e) => setFormDestination(e.target.value)}
                  placeholder="Hasthampatti"
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="length" className="text-right">Length (Km)</Label>
                <Input
                  id="length"
                  value={formLengthKm}
                  onChange={(e) => setFormLengthKm(e.target.value)}
                  className="col-span-3 font-mono"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="duration" className="text-right text-xs">Duration (Min)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formDurationMin}
                  onChange={(e) => setFormDurationMin(e.target.value)}
                  className="col-span-3 font-mono"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="direction" className="text-right">Direction</Label>
                <Select value={formDirection} onValueChange={setFormDirection}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UP">UP Direction</SelectItem>
                    <SelectItem value="DOWN">DOWN Direction</SelectItem>
                    <SelectItem value="CIRCULAR">CIRCULAR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="color" className="text-right">Map Color</Label>
                <Input
                  id="color"
                  type="color"
                  value={formColor}
                  onChange={(e) => setFormColor(e.target.value)}
                  className="col-span-3 h-9 p-0.5"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">Status</Label>
                <Select value={formStatus} onValueChange={setFormStatus}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="proposed">Proposed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createRouteMutation.isPending}>
                {createRouteMutation.isPending ? "Creating..." : "Save Route"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT ROUTE DIALOG */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleEditSubmit}>
            <DialogHeader>
              <DialogTitle>Edit Route Corridor</DialogTitle>
              <DialogDescription>
                Modify specifications of route corridor `{formCode}`.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editCode" className="text-right">Route Code</Label>
                <Input
                  id="editCode"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  className="col-span-3 font-semibold text-primary"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editName" className="text-right">Route Name</Label>
                <Input
                  id="editName"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editOrigin" className="text-right">Origin</Label>
                <Input
                  id="editOrigin"
                  value={formOrigin}
                  onChange={(e) => setFormOrigin(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editDestination" className="text-right">Destination</Label>
                <Input
                  id="editDestination"
                  value={formDestination}
                  onChange={(e) => setFormDestination(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editLength" className="text-right">Length (Km)</Label>
                <Input
                  id="editLength"
                  value={formLengthKm}
                  onChange={(e) => setFormLengthKm(e.target.value)}
                  className="col-span-3 font-mono"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editDuration" className="text-right text-xs">Duration (Min)</Label>
                <Input
                  id="editDuration"
                  type="number"
                  value={formDurationMin}
                  onChange={(e) => setFormDurationMin(e.target.value)}
                  className="col-span-3 font-mono"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editDirection" className="text-right">Direction</Label>
                <Select value={formDirection} onValueChange={setFormDirection}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UP">UP Direction</SelectItem>
                    <SelectItem value="DOWN">DOWN Direction</SelectItem>
                    <SelectItem value="CIRCULAR">CIRCULAR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editColor" className="text-right">Map Color</Label>
                <Input
                  id="editColor"
                  type="color"
                  value={formColor}
                  onChange={(e) => setFormColor(e.target.value)}
                  className="col-span-3 h-9 p-0.5"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateRouteMutation.isPending}>
                {updateRouteMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ADD STOP DIALOG */}
      <Dialog open={isAddStopOpen} onOpenChange={setIsAddStopOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleAddStopSubmit}>
            <DialogHeader>
              <DialogTitle>Add Stop Node</DialogTitle>
              <DialogDescription>
                Assign a stop location and sequencing order to route corridor `{selectedRouteDetails?.code}`.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="stopName" className="text-right">Stop Name</Label>
                <Input
                  id="stopName"
                  value={stopName}
                  onChange={(e) => setStopName(e.target.value)}
                  placeholder="e.g. Hasthampatti Circle"
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="stopSeq" className="text-right text-xs">Seq. Order</Label>
                <Input
                  id="stopSeq"
                  type="number"
                  min="1"
                  value={stopSeq}
                  onChange={(e) => setStopSeq(e.target.value)}
                  placeholder={String((selectedRouteDetails?.stops?.length || 0) + 1)}
                  className="col-span-3 font-mono"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="stopLat" className="text-right">Latitude</Label>
                <Input
                  id="stopLat"
                  value={stopLat}
                  onChange={(e) => setStopLat(e.target.value)}
                  placeholder="11.6673"
                  className="col-span-3 font-mono"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="stopLng" className="text-right">Longitude</Label>
                <Input
                  id="stopLng"
                  value={stopLng}
                  onChange={(e) => setStopLng(e.target.value)}
                  placeholder="78.1424"
                  className="col-span-3 font-mono"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddStopOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createStopMutation.isPending}>
                {createStopMutation.isPending ? "Adding..." : "Add Stop"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
