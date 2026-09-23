import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  MapPin,
  Plus,
  Save,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Compass,
  Map,
  Layers,
  Waypoints,
  Activity,
  MousePointerClick,
  Info,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { hasPermission } from "@/lib/auth-shared";
import { getRoutes, createRoute, createStop, analyzeRouteOverlap } from "@/lib/routes-gis-fns";

export const Route = createFileRoute("/network/planner")({
  beforeLoad: ({ context }) => {
    if (!context.user || !hasPermission(context.user.role, "routes.manage")) {
      throw new Error("Forbidden");
    }
  },
  head: () => ({
    meta: [
      { title: "Route Planner — TransitOS" },
      { name: "description", content: "Design new Salem corridors, draw points and analyze overlap." },
    ],
  }),
  component: RoutePlannerPage,
});

interface LocalStop {
  name: string;
  lat: number;
  lng: number;
  sequence: number;
}

function RoutePlannerPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Form states
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [durationMin, setDurationMin] = useState("35");
  const [direction, setDirection] = useState("UP");
  const [color, setColor] = useState("#F59E0B"); // default Orange for proposed
  const [status, setStatus] = useState("proposed");
  const [peakFreq, setPeakFreq] = useState("15");
  const [offPeakFreq, setOffPeakFreq] = useState("30");

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnCoords, setDrawnCoords] = useState<[number, number][]>([]); // GeoJSON: [lng, lat]
  const [localStops, setLocalStops] = useState<LocalStop[]>([]);

  // Stop Form Input State (for marking coordinates as stops)
  const [stopNameInput, setStopNameInput] = useState("");
  const [selectedCoordIndex, setSelectedCoordIndex] = useState<number | null>(null);

  // Fetch Existing Active Routes for Map Reference & Overlap
  const { data: activeRoutes = [] } = useQuery<any[]>({
    queryKey: ["active-routes-planner"],
    queryFn: () => getRoutes({ status: "active" }) as any,
  });

  // Overlap Analysis Mutation (runs on coordinate changes or button click)
  const analyzeMutation = useMutation({
    mutationFn: async () => {
      if (drawnCoords.length < 2) return [];
      const geojson = {
        type: "LineString",
        coordinates: drawnCoords,
      };
      return await analyzeRouteOverlap(geojson);
    },
    onSuccess: (data) => {
      toast.success("Corridor overlap analysis completed.");
    },
  });

  // Calculate proposed route length in Km
  const calculateDistanceKm = () => {
    if (drawnCoords.length < 2) return "0.00";
    let distMeters = 0;
    const R = 6371e3; // Earth radius

    for (let i = 0; i < drawnCoords.length - 1; i++) {
      const start = drawnCoords[i]!;
      const end = drawnCoords[i + 1]!;
      const lat1 = (start[1] * Math.PI) / 180;
      const lat2 = (end[1] * Math.PI) / 180;
      const deltaLat = ((end[1] - start[1]) * Math.PI) / 180;
      const deltaLng = ((end[0] - start[0]) * Math.PI) / 180;

      const a =
        Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      distMeters += R * c;
    }
    return (distMeters / 1000).toFixed(2);
  };

  const calculatedLength = calculateDistanceKm();

  // Leaflet states
  const [L, setL] = useState<any>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const existingRoutesGroupRef = useRef<any>(null);
  const proposedRoutePolylineRef = useRef<any>(null);
  const proposedOverlapPolylineRef = useRef<any>(null);
  const stopMarkersGroupRef = useRef<any>(null);
  const clickMarkersGroupRef = useRef<any>(null);

  // Dynamic Leaflet Import
  useEffect(() => {
    if (typeof window !== "undefined") {
      import("leaflet").then((mod) => {
        setL(mod.default);
      });
    }
  }, []);

  // Map Initialization
  useEffect(() => {
    if (!L || !mapRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapRef.current).setView([11.6673, 78.1424], 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      mapInstanceRef.current = map;
      existingRoutesGroupRef.current = L.featureGroup().addTo(map);
      proposedRoutePolylineRef.current = L.polyline([], {
        color: color,
        weight: 6,
        opacity: 0.9,
      }).addTo(map);
      proposedOverlapPolylineRef.current = L.polyline([], {
        color: "#DC2626", // Red for overlaps
        weight: 8,
        opacity: 0.8,
        dashArray: "10, 10",
      }).addTo(map);
      stopMarkersGroupRef.current = L.featureGroup().addTo(map);
      clickMarkersGroupRef.current = L.featureGroup().addTo(map);

      // Handle map clicks in drawing mode
      map.on("click", (e: any) => {
        // Need to access ref because map is initialized once
        const drawing = mapRef.current?.getAttribute("data-drawing") === "true";
        if (drawing) {
          const lat = e.latlng.lat;
          const lng = e.latlng.lng;
          setDrawnCoords((prev) => [...prev, [lng, lat]]);
        }
      });
    }
  }, [L]);

  // Update data-drawing attribute on div for click handler
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setAttribute("data-drawing", String(isDrawing));
    }
  }, [isDrawing]);

  // Map updates based on drawing & route states
  useEffect(() => {
    if (!L || !mapInstanceRef.current) return;

    const map = mapInstanceRef.current;

    // 1. Draw existing active routes in light gray
    existingRoutesGroupRef.current.clearLayers();
    activeRoutes.forEach((r: any) => {
      if (r.geometryGeojson?.coordinates?.length > 1) {
        const latlngs = r.geometryGeojson.coordinates.map((c: any) => [c[1], c[0]]);
        const polyline = L.polyline(latlngs, {
          color: r.color || "#9CA3AF",
          weight: 3,
          opacity: 0.35,
        });
        polyline.bindPopup(`<b>${r.code}</b>: ${r.name}`);
        polyline.addTo(existingRoutesGroupRef.current);
      }
    });

    // 2. Draw proposed route polyline
    const latlngs = drawnCoords.map((c) => [c[1], c[0]]);
    proposedRoutePolylineRef.current.setLatLngs(latlngs);
    proposedRoutePolylineRef.current.setStyle({ color: color });

    // 3. Draw click vertices
    clickMarkersGroupRef.current.clearLayers();
    drawnCoords.forEach((c, idx) => {
      const isStop = localStops.some((s) => s.lat === c[1] && s.lng === c[0]);
      const vertexMarker = L.circleMarker([c[1], c[0]], {
        radius: isStop ? 8 : 5,
        fillColor: isStop ? "#FFFFFF" : color,
        color: isStop ? color : "#FFFFFF",
        weight: 2,
        opacity: 1,
        fillOpacity: 1,
      });

      vertexMarker.bindPopup(`
        <div class="space-y-1 text-xs">
          <p><b>Vertex ${idx + 1}</b></p>
          <p>${c[1].toFixed(5)}, ${c[0].toFixed(5)}</p>
          ${isStop ? `<p class="text-primary"><b>Stop Node</b></p>` : ""}
        </div>
      `);
      vertexMarker.addTo(clickMarkersGroupRef.current);
    });

    // 4. Highlight Overlap Segments
    proposedOverlapPolylineRef.current.setLatLngs([]);
    const overlapRes = analyzeMutation.data || [];
    const overlapCoords: [number, number][] = [];

    overlapRes.forEach((res: any) => {
      res.overlapCoordinates.forEach((c: any) => {
        overlapCoords.push([c[1], c[0]]);
      });
    });

    if (overlapCoords.length > 0) {
      proposedOverlapPolylineRef.current.setLatLngs(overlapCoords);
    }

    // 5. Draw Stop Markers
    stopMarkersGroupRef.current.clearLayers();
    localStops.forEach((stop) => {
      const markerIcon = L.divIcon({
        html: `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 4px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: white; font-size: 9px; font-weight: bold;">${stop.sequence}</div>`,
        className: "custom-stop-marker-planner",
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

      const marker = L.marker([stop.lat, stop.lng], { icon: markerIcon });
      marker.bindPopup(`<b>Stop ${stop.sequence}: ${stop.name}</b>`);
      marker.addTo(stopMarkersGroupRef.current);
    });
  }, [L, activeRoutes, drawnCoords, color, localStops, analyzeMutation.data]);

  // Route saving mutation
  const saveRouteMutation = useMutation({
    mutationFn: async () => {
      if (!code) throw new Error("Route code is required");
      if (!name) throw new Error("Route name is required");
      if (drawnCoords.length < 2) throw new Error("Please draw at least 2 points on the map");

      // 1. Create Route
      const newRoute: any = await createRoute({
        code,
        name,
        origin: origin || (localStops[0]?.name) || "Salem Origin",
        destination: destination || (localStops[localStops.length - 1]?.name) || "Salem Destination",
        lengthKm: calculatedLength,
        durationMin: Number(durationMin),
        direction,
        color,
        status,
        peakFrequency: Number(peakFreq),
        offPeakFrequency: Number(offPeakFreq),
        geometryGeojson: {
          type: "LineString",
          coordinates: drawnCoords,
        },
      });

      // 2. Create associated stops
      for (const stop of localStops) {
        await createStop({
          routeId: newRoute.id,
          name: stop.name,
          sequence: stop.sequence,
          latitude: String(stop.lat),
          longitude: String(stop.lng),
        });
      }

      return newRoute;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routes"] });
      toast.success(`Proposed Route ${code} successfully saved to database.`);
      navigate({ to: "/network/routes" });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to save route");
    },
  });

  const handleMarkAsStop = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCoordIndex === null) return;
    const coord = drawnCoords[selectedCoordIndex]!;

    const newStop: LocalStop = {
      name: stopNameInput,
      lat: coord[1],
      lng: coord[0],
      sequence: localStops.length + 1,
    };

    setLocalStops((prev) => [...prev, newStop]);
    setStopNameInput("");
    setSelectedCoordIndex(null);
    toast.success(`Marked Vertex ${selectedCoordIndex + 1} as Stop: "${stopNameInput}"`);
  };

  const handleClearDraw = () => {
    setDrawnCoords([]);
    setLocalStops([]);
    analyzeMutation.reset();
    toast.info("Drawn corridor cleared");
  };

  // Severity Recommendation engine
  const getRecommendation = (results: any[]) => {
    const maxOverlap = results.reduce((max, r) => Math.max(max, r.overlapPercentage), 0);
    if (maxOverlap > 40) {
      return {
        severity: "HIGH",
        color: "text-destructive border-destructive/20 bg-destructive/5",
        text: "High corridor overlap detected. This proposed route conflicts heavily with existing routes.",
      };
    } else if (maxOverlap > 10) {
      return {
        severity: "MEDIUM",
        color: "text-warning border-warning/20 bg-warning/5",
        text: "Moderate corridor overlap detected. Consider modifying the proposed corridor.",
      };
    } else {
      return {
        severity: "LOW",
        color: "text-success border-success/20 bg-success/5",
        text: "Minimal corridor overlap. The proposed corridor is mostly independent.",
      };
    }
  };

  const overlapList = analyzeMutation.data || [];
  const recommendation = getRecommendation(overlapList);

  return (
    <AppShell
      title="Route Planner"
      subtitle="Interactive corridor sketching, stop sequencing and topological overlap calculations."
      actions={
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex text-xs">
            <Link to="/network/routes">
              <Map className="mr-1.5 size-3.5 text-primary" />
              Route Network
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex text-xs">
            <Link to="/scheduling/optimizer">
              <Sparkles className="mr-1.5 size-3.5 text-primary" />
              Schedule Optimizer
            </Link>
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
        {/* Left Column: Form & Analytics */}
        <div className="space-y-6">
          {/* Metadata Section */}
          <section className="glass-panel p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 border-b border-border/60 pb-2.5">
              <Compass className="size-4 text-primary" /> Corridor Specifications
            </h3>

            <div className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="code" className="text-xs">Route Code</Label>
                  <Input
                    id="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. Route 106"
                    className="font-mono text-xs font-bold text-primary bg-background/60"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="direction" className="text-xs">Direction</Label>
                  <Select value={direction} onValueChange={setDirection}>
                    <SelectTrigger id="direction" className="text-xs font-mono bg-background/60">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UP">UP Direction</SelectItem>
                      <SelectItem value="DOWN">DOWN Direction</SelectItem>
                      <SelectItem value="CIRCULAR">CIRCULAR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs">Route Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Gugai - Alagapuram Loop"
                  className="text-xs bg-background/60"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="origin">Origin (Auto)</Label>
                  <Input
                    id="origin"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    placeholder={localStops[0]?.name || "First Stop Node"}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="destination">Destination (Auto)</Label>
                  <Input
                    id="destination"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder={localStops[localStops.length - 1]?.name || "Last Stop Node"}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="length">Length (Km)</Label>
                  <Input id="length" value={calculatedLength} readOnly className="bg-muted font-mono" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="duration">Est. Min</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={durationMin}
                    onChange={(e) => setDurationMin(e.target.value)}
                    className="font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="h-9 p-0.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="peak">Peak Freq (min)</Label>
                  <Input
                    id="peak"
                    type="number"
                    value={peakFreq}
                    onChange={(e) => setPeakFreq(e.target.value)}
                    className="font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="offpeak">Off-Peak (min)</Label>
                  <Input
                    id="offpeak"
                    type="number"
                    value={offPeakFreq}
                    onChange={(e) => setOffPeakFreq(e.target.value)}
                    className="font-mono"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Overlap Results Panel */}
          {drawnCoords.length >= 2 && (
            <section className="panel p-4 space-y-3">
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Waypoints className="size-4 text-primary" /> Route Overlap Analysis
                </h3>
                <Button size="sm" onClick={() => analyzeMutation.mutate()} disabled={analyzeMutation.isPending}>
                  {analyzeMutation.isPending ? "Analyzing..." : "Analyze Overlap"}
                </Button>
              </div>

              {analyzeMutation.data ? (
                overlapList.length === 0 ? (
                  <div className="flex items-center gap-2 rounded-lg border border-success/20 bg-success/5 px-4 py-3 text-xs font-semibold text-success">
                    <CheckCircle2 className="size-4" /> Minimal corridor overlap. Proposed corridor is independent.
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className={`flex items-start gap-2.5 rounded-lg border px-4 py-3 text-xs font-medium ${recommendation.color}`}>
                      <AlertTriangle className="size-4 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-bold">Severity: {recommendation.severity}</p>
                        <p className="font-normal mt-0.5">{recommendation.text}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {overlapList.map((res: any) => (
                        <div key={res.routeId} className="flex justify-between items-center text-xs p-2 rounded bg-secondary/10 border">
                          <div>
                            <span className="font-semibold text-foreground">{res.routeCode}</span>
                            <span className="text-muted-foreground ml-1 font-normal">({res.routeName})</span>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold font-mono text-primary">{res.overlapDistanceKm} km</p>
                            <p className="text-[10px] text-muted-foreground">{res.overlapPercentage}% overlap</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              ) : (
                <div className="p-4 text-center text-xs text-muted-foreground border border-dashed rounded-md">
                  Click "Analyze Overlap" to calculate segment proximity.
                </div>
              )}
            </section>
          )}

          {/* Action Row */}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={handleClearDraw} disabled={drawnCoords.length === 0}>
              <Trash2 className="size-4 mr-1.5" /> Clear Path
            </Button>
            <Button
              className="flex-1"
              disabled={drawnCoords.length < 2 || saveRouteMutation.isPending}
              onClick={() => saveRouteMutation.mutate()}
            >
              <Save className="size-4 mr-1.5" /> Save Corridor
            </Button>
          </div>
        </div>

        {/* Right Column: Interactive Map & Stops Drawer */}
        <div className="space-y-6">
          <section className="panel overflow-hidden flex flex-col h-[600px]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 bg-secondary/15">
              <div className="flex items-center gap-2">
                <Map className="size-4 text-primary" />
                <span className="text-sm font-semibold">Corridor Sketching Canvas</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={isDrawing ? "destructive" : "default"}
                  onClick={() => setIsDrawing(!isDrawing)}
                >
                  {isDrawing ? "Pause Drawing Mode" : "Enable Map Click Drawing"}
                </Button>
                <Badge variant="outline">OSM tiles</Badge>
              </div>
            </div>

            <div className="flex-1 relative z-0">
              <div ref={mapRef} className="h-full w-full bg-accent/20"></div>

              {isDrawing && (
                <div className="absolute top-3 left-12 bg-background/95 border border-primary/30 p-2.5 rounded-lg shadow-lg max-w-[280px] z-[1000] text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-primary">
                    <MousePointerClick className="size-3.5" />
                    <span>Drawing Mode Active</span>
                  </div>
                  <p className="text-muted-foreground font-normal">
                    Click coordinates on the map to add proposed corridor vertex points.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Drawn Points & Stops Marking Panel */}
          {drawnCoords.length > 0 && (
            <section className="panel p-4 space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2 border-b pb-2">
                <MapPin className="size-4 text-primary" /> Drawn Vertices & Stops Mapping
              </h3>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Vertices List */}
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase text-muted-foreground">Corridor Vertices</p>
                  <div className="max-h-[220px] overflow-y-auto space-y-1 border rounded-md p-1.5 bg-background/50">
                    {drawnCoords.map((c, idx) => {
                      const isStop = localStops.some((s) => s.lat === c[1] && s.lng === c[0]);
                      return (
                        <div key={idx} className="flex justify-between items-center text-xs p-1.5 rounded border border-transparent hover:bg-secondary">
                          <span className="font-mono">
                            Point {idx + 1}: {c[1].toFixed(5)}, {c[0].toFixed(5)}
                          </span>
                          <div className="flex gap-2">
                            {isStop ? (
                              <Badge variant="secondary" className="text-[9px] uppercase font-bold py-0.5">Stop Node</Badge>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 py-0 px-2 text-[10px]"
                                onClick={() => setSelectedCoordIndex(idx)}
                              >
                                Mark as Stop
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Stop Nodes Registry */}
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase text-muted-foreground">Sequenced Stops</p>
                  <div className="max-h-[220px] overflow-y-auto space-y-1 border rounded-md p-1.5 bg-background/50">
                    {localStops.length === 0 ? (
                      <div className="py-10 text-center text-xs text-muted-foreground">No stops defined. Mark a vertex as stop.</div>
                    ) : (
                      localStops.map((stop) => (
                        <div key={stop.sequence} className="flex justify-between items-center text-xs p-1.5 rounded bg-primary/5 border border-primary/10">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-primary font-mono">{stop.sequence}</span>
                            <span className="font-semibold">{stop.name}</span>
                          </div>
                          <span className="font-mono text-[10px] text-muted-foreground">
                            ({stop.lat.toFixed(4)}, {stop.lng.toFixed(4)})
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>

      {/* DIALOG FOR MARKING VERTEX AS STOP */}
      <Dialog open={selectedCoordIndex !== null} onOpenChange={(val) => { if (!val) setSelectedCoordIndex(null); }}>
        <DialogContent className="sm:max-w-[360px]">
          <form onSubmit={handleMarkAsStop}>
            <DialogHeader>
              <DialogTitle>Mark Coordinate as Stop</DialogTitle>
              <DialogDescription>
                Assign a Stop Node Name to Vertex {selectedCoordIndex !== null ? selectedCoordIndex + 1 : ""}.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-1">
              <Label htmlFor="stopNameInput">Stop Location Name</Label>
              <Input
                id="stopNameInput"
                value={stopNameInput}
                onChange={(e) => setStopNameInput(e.target.value)}
                placeholder="e.g. Old Bypass Junction"
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSelectedCoordIndex(null)}>
                Cancel
              </Button>
              <Button type="submit">Assign Stop</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
