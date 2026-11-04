import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  MapPin,
  Search,
  Layers,
  Play,
  Compass,
  ArrowRight,
  Bus,
  Clock,
  RotateCcw,
  Check,
  Building2,
  ChevronRight,
  Filter,
  Eye,
  EyeOff,
  Navigation,
  Info,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useActiveTenant } from "@/lib/tenant-context";
import { useTheme } from "@/components/theme-provider";
import { getRoutes, getAllStops } from "@/lib/routes-gis-fns";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/network/map")({
  head: () => ({
    meta: [
      { title: "Transit Network GIS Map: TransitOS" },
      {
        name: "description",
        content:
          "Interactive WebGIS transit network map with multi-corridor visualization, stop topology, and corridor inspection.",
      },
    ],
  }),
  component: TransitNetworkMapPage,
});

interface RouteItem {
  id: string;
  code: string;
  name: string;
  origin: string;
  destination: string;
  direction: string;
  lengthKm: string;
  durationMin: number;
  color?: string;
  status: string;
  peakFrequency?: number;
  offPeakFrequency?: number;
  stopsCount?: number;
  geometryGeojson?: any;
}

interface StopItem {
  id: string;
  name: string;
  code?: string;
  sequence: number;
  latitude: string;
  longitude: string;
  routeId?: string;
  isTimepoint?: boolean;
  cumulativeDistanceKm?: string;
  cumulativeTimeMinutes?: number;
}

const TILE_LAYERS = {
  voyager: {
    name: "Voyager (Standard Transit)",
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap contributors',
  },
  dark: {
    name: "Dark Matter (High Contrast)",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap contributors',
  },
  osm: {
    name: "OpenStreetMap",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "&copy; OpenStreetMap contributors",
  },
};

function TransitNetworkMapPage() {
  const navigate = useNavigate();
  const { currentTenant } = useActiveTenant();
  const { resolvedTheme } = useTheme();

  // Queries
  const { data: routesList = [], isLoading: routesLoading } = useQuery<RouteItem[]>({
    queryKey: ["routes", currentTenant.id],
    queryFn: async () => {
      const data = await getRoutes();
      return (data || []) as unknown as RouteItem[];
    },
  });

  const { data: allStopsList = [], isLoading: stopsLoading } = useQuery<StopItem[]>({
    queryKey: ["all-stops", currentTenant.id],
    queryFn: async () => {
      const data = await getAllStops();
      return (data || []) as unknown as StopItem[];
    },
  });

  // State
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [selectedStopName, setSelectedStopName] = useState<string | null>(null);
  const [routeSearch, setRouteSearch] = useState("");
  const [stopSearch, setStopSearch] = useState("");
  const [tileStyle, setTileStyle] = useState<"voyager" | "dark" | "osm">(
    resolvedTheme === "dark" ? "dark" : "voyager",
  );
  const [showStops, setShowStops] = useState(true);
  const [sidePanelOpen, setSidePanelOpen] = useState(true);

  // Leaflet refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [L, setL] = useState<any>(null);
  const polylinesLayerGroupRef = useRef<any>(null);
  const stopsLayerGroupRef = useRef<any>(null);
  const activeTileLayerRef = useRef<any>(null);

  // Dynamic Leaflet import
  useEffect(() => {
    if (typeof window !== "undefined") {
      import("leaflet").then((mod) => {
        setL(mod.default);
      });
    }
  }, []);

  // Sync theme with default tile style if not explicitly toggled
  useEffect(() => {
    if (resolvedTheme === "dark" && tileStyle === "voyager") {
      setTileStyle("dark");
    } else if (resolvedTheme === "light" && tileStyle === "dark") {
      setTileStyle("voyager");
    }
  }, [resolvedTheme]);

  // Center Coordinates based on Tenant
  const defaultCenter = useMemo(() => {
    if (currentTenant.id.startsWith("69000000")) {
      return [13.045, 80.24] as [number, number]; // Chennai
    }
    return [11.6643, 78.146] as [number, number]; // Salem
  }, [currentTenant.id]);

  const defaultZoom = currentTenant.id.startsWith("69000000") ? 12 : 13;

  // Initialize Map
  useEffect(() => {
    if (!L || !mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: defaultZoom,
        zoomControl: false,
      });

      L.control.zoom({ position: "bottomright" }).addTo(map);

      const tileConfig = TILE_LAYERS[tileStyle];
      activeTileLayerRef.current = L.tileLayer(tileConfig.url, {
        attribution: tileConfig.attribution,
        maxZoom: 19,
      }).addTo(map);

      polylinesLayerGroupRef.current = L.layerGroup().addTo(map);
      stopsLayerGroupRef.current = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
    } else {
      mapInstanceRef.current.setView(defaultCenter, defaultZoom);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [L, defaultCenter, defaultZoom]);

  // Update Tile Layer
  useEffect(() => {
    if (!mapInstanceRef.current || !L) return;
    if (activeTileLayerRef.current) {
      mapInstanceRef.current.removeLayer(activeTileLayerRef.current);
    }
    const tileConfig = TILE_LAYERS[tileStyle];
    activeTileLayerRef.current = L.tileLayer(tileConfig.url, {
      attribution: tileConfig.attribution,
      maxZoom: 19,
    }).addTo(mapInstanceRef.current);
  }, [tileStyle, L]);

  // Filtered Routes
  const filteredRoutes = useMemo(() => {
    if (!routeSearch) return routesList;
    const q = routeSearch.toLowerCase();
    return routesList.filter(
      (r) =>
        r.code.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        r.origin.toLowerCase().includes(q) ||
        r.destination.toLowerCase().includes(q),
    );
  }, [routesList, routeSearch]);

  // Filtered Stops for Stop Finder
  const filteredStops = useMemo(() => {
    if (!stopSearch) return [];
    const q = stopSearch.toLowerCase();
    const map = new Map<string, StopItem>();
    allStopsList.forEach((s) => {
      if (s.name && s.name.toLowerCase().includes(q)) {
        if (!map.has(s.name)) map.set(s.name, s);
      }
    });
    return Array.from(map.values()).slice(0, 8);
  }, [allStopsList, stopSearch]);

  // Selected Route Details
  const selectedRoute = useMemo(() => {
    if (!selectedRouteId) return null;
    return routesList.find((r) => r.id === selectedRouteId) || null;
  }, [routesList, selectedRouteId]);

  // Stops serving Selected Route
  const selectedRouteStops = useMemo(() => {
    if (!selectedRouteId) return [];
    return allStopsList
      .filter((s) => s.routeId === selectedRouteId)
      .sort((a, b) => a.sequence - b.sequence);
  }, [allStopsList, selectedRouteId]);

  // Unique Stops for the current view
  const visibleStops = useMemo(() => {
    if (selectedRouteId) {
      return selectedRouteStops;
    }
    const stopMap = new Map<string, StopItem>();
    allStopsList.forEach((s) => {
      if (s.name && !stopMap.has(s.name)) {
        stopMap.set(s.name, s);
      }
    });
    return Array.from(stopMap.values());
  }, [allStopsList, selectedRouteId, selectedRouteStops]);

  // Draw Polylines & Stops on Map
  useEffect(() => {
    if (!L || !mapInstanceRef.current) return;
    if (!polylinesLayerGroupRef.current || !stopsLayerGroupRef.current) return;

    polylinesLayerGroupRef.current.clearLayers();
    stopsLayerGroupRef.current.clearLayers();

    // 1. Draw Routes
    const bounds = L.latLngBounds([]);
    let hasCoords = false;

    routesList.forEach((route) => {
      const isSelected = selectedRouteId === route.id;
      const isDimmed = selectedRouteId !== null && !isSelected;

      const coords: [number, number][] = [];
      if (
        route.geometryGeojson &&
        route.geometryGeojson.coordinates &&
        Array.isArray(route.geometryGeojson.coordinates)
      ) {
        route.geometryGeojson.coordinates.forEach((pt: [number, number]) => {
          // pt is [lng, lat]
          coords.push([pt[1], pt[0]]);
        });
      } else {
        // Fallback: derive from stops
        const routeStops = allStopsList
          .filter((s) => s.routeId === route.id)
          .sort((a, b) => a.sequence - b.sequence);
        routeStops.forEach((s) => {
          const lat = Number(s.latitude);
          const lng = Number(s.longitude);
          if (!isNaN(lat) && !isNaN(lng)) {
            coords.push([lat, lng]);
          }
        });
      }

      if (coords.length > 0) {
        const polyline = L.polyline(coords, {
          color: route.color || "#2563EB",
          weight: isSelected ? 6 : isDimmed ? 2 : 4,
          opacity: isSelected ? 1 : isDimmed ? 0.25 : 0.8,
          smoothFactor: 1,
        });

        polyline.on("click", () => {
          setSelectedRouteId(route.id);
          setSelectedStopName(null);
        });

        polyline.bindTooltip(
          `<div class="font-sans text-xs font-semibold px-1 py-0.5">${route.code}: ${route.name}</div>`,
          { sticky: true, className: "transit-map-tooltip" },
        );

        polylinesLayerGroupRef.current.addLayer(polyline);

        if (isSelected) {
          coords.forEach((c) => bounds.extend(c));
          hasCoords = true;
        } else if (!selectedRouteId) {
          coords.forEach((c) => bounds.extend(c));
          hasCoords = true;
        }
      }
    });

    // 2. Draw Stops
    if (showStops) {
      visibleStops.forEach((stop) => {
        const lat = Number(stop.latitude);
        const lng = Number(stop.longitude);
        if (isNaN(lat) || isNaN(lng)) return;

        const isTerm =
          stop.sequence === 1 ||
          (selectedRouteStops.length > 0 &&
            stop.sequence === selectedRouteStops.length);
        const isStopSelected = selectedStopName === stop.name;

        const marker = L.circleMarker([lat, lng], {
          radius: isStopSelected ? 9 : isTerm ? 7 : 5,
          color: isStopSelected
            ? "#F59E0B"
            : isTerm
              ? "#1E293B"
              : selectedRoute?.color || "#2563EB",
          weight: isTerm || isStopSelected ? 3 : 2,
          fillColor: isStopSelected ? "#FEF3C7" : isTerm ? "#FFFFFF" : "#FFFFFF",
          fillOpacity: 1,
        });

        marker.on("click", () => {
          setSelectedStopName(stop.name);
        });

        const servingRoutes = routesList.filter((r) =>
          allStopsList.some((s) => s.routeId === r.id && s.name === stop.name),
        );

        const routesBadgeHtml = servingRoutes
          .map(
            (r) =>
              `<span style="background:${r.color || "#2563EB"};color:white;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:bold;margin-right:4px;">${r.code}</span>`,
          )
          .join("");

        marker.bindPopup(
          `
          <div style="font-family:sans-serif;min-width:180px;padding:4px;">
            <div style="font-size:13px;font-weight:bold;color:#0F172A;margin-bottom:2px;">${stop.name}</div>
            <div style="font-size:10px;color:#64748B;font-family:monospace;margin-bottom:8px;">${stop.code || "STOP"} · [${lat.toFixed(4)}, ${lng.toFixed(4)}]</div>
            <div style="font-size:11px;font-weight:600;color:#334155;margin-bottom:4px;">Serving Lines (${servingRoutes.length}):</div>
            <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:6px;">${routesBadgeHtml || "None"}</div>
          </div>
          `,
          { className: "transit-stop-popup" },
        );

        stopsLayerGroupRef.current.addLayer(marker);
      });
    }

    if (selectedRouteId && hasCoords && bounds.isValid()) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [
    L,
    routesList,
    allStopsList,
    selectedRouteId,
    selectedStopName,
    visibleStops,
    showStops,
    selectedRoute,
    selectedRouteStops,
  ]);

  const resetView = () => {
    setSelectedRouteId(null);
    setSelectedStopName(null);
    setRouteSearch("");
    setStopSearch("");
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(defaultCenter, defaultZoom);
    }
  };

  const handleSelectStop = (stop: StopItem) => {
    setSelectedStopName(stop.name);
    setStopSearch("");
    const lat = Number(stop.latitude);
    const lng = Number(stop.longitude);
    if (mapInstanceRef.current && !isNaN(lat) && !isNaN(lng)) {
      mapInstanceRef.current.setView([lat, lng], 15);
    }
  };

  return (
    <AppShell
      title="Transit Network Map"
      subtitle={`${currentTenant.name} GIS transit infrastructure, line corridors, and stop interchanges`}
    >
      <div className="relative flex h-[calc(100vh-4rem)] w-full flex-col overflow-hidden bg-background">
        {/* Top Floating Controls Bar */}
        <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
          {/* Search & Selection Pills */}
          <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
            {/* Corridor Search */}
            <div className="relative w-64 shadow-md">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Search corridor or code..."
                value={routeSearch}
                onChange={(e) => setRouteSearch(e.target.value)}
                className="pl-8 bg-background/95 backdrop-blur-md h-9 text-xs border-border rounded-md shadow-2xs"
              />
            </div>

            {/* Stop Finder Search */}
            <div className="relative w-60 shadow-md">
              <MapPin className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Find bus stop..."
                value={stopSearch}
                onChange={(e) => setStopSearch(e.target.value)}
                className="pl-8 bg-background/95 backdrop-blur-md h-9 text-xs border-border rounded-md shadow-2xs"
              />
              {filteredStops.length > 0 && (
                <div className="absolute top-10 left-0 right-0 z-50 bg-background border border-border rounded-md shadow-lg py-1 max-h-56 overflow-auto">
                  {filteredStops.map((st) => (
                    <button
                      key={st.id}
                      onClick={() => handleSelectStop(st)}
                      className="w-full text-left px-3 py-1.5 hover:bg-muted text-xs flex items-center justify-between cursor-pointer"
                    >
                      <span className="font-medium text-foreground">{st.name}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {st.code || "BUS STOP"}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedRoute && (
              <div className="flex items-center gap-1.5 bg-background/95 backdrop-blur-md border border-border px-2.5 py-1 rounded-md shadow-sm">
                <span
                  className="size-2.5 rounded-sm"
                  style={{ backgroundColor: selectedRoute.color || "#2563EB" }}
                />
                <span className="text-xs font-semibold text-foreground">
                  {selectedRoute.code}
                </span>
                <span className="text-xs text-muted-foreground truncate max-w-[160px]">
                  {selectedRoute.origin} ⇄ {selectedRoute.destination}
                </span>
                <button
                  onClick={() => setSelectedRouteId(null)}
                  className="text-muted-foreground hover:text-foreground text-xs ml-1 font-bold cursor-pointer"
                  title="Clear Selection"
                >
                  ×
                </button>
              </div>
            )}
          </div>

          {/* Map Controls */}
          <div className="flex items-center gap-2 pointer-events-auto">
            {/* Tile Style Selector */}
            <div className="flex items-center bg-background/95 backdrop-blur-md border border-border rounded-md p-0.5 shadow-sm">
              <button
                onClick={() => setTileStyle("voyager")}
                className={cn(
                  "px-2.5 py-1 text-xs font-medium rounded cursor-pointer transition-colors",
                  tileStyle === "voyager"
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Transit
              </button>
              <button
                onClick={() => setTileStyle("dark")}
                className={cn(
                  "px-2.5 py-1 text-xs font-medium rounded cursor-pointer transition-colors",
                  tileStyle === "dark"
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Dark
              </button>
              <button
                onClick={() => setTileStyle("osm")}
                className={cn(
                  "px-2.5 py-1 text-xs font-medium rounded cursor-pointer transition-colors",
                  tileStyle === "osm"
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Street
              </button>
            </div>

            {/* Toggle Stops */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowStops((prev) => !prev)}
              className="h-8 gap-1.5 bg-background/95 backdrop-blur-md border-border text-xs rounded-md shadow-sm"
              title="Toggle Stop Markers"
            >
              {showStops ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
              <span>{showStops ? "Stops On" : "Stops Off"}</span>
            </Button>

            {/* Reset View */}
            <Button
              variant="outline"
              size="sm"
              onClick={resetView}
              className="h-8 gap-1.5 bg-background/95 backdrop-blur-md border-border text-xs rounded-md shadow-sm"
              title="Reset Map View"
            >
              <RotateCcw className="size-3.5" />
              <span>Reset</span>
            </Button>

            {/* Toggle Corridor Drawer */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSidePanelOpen((prev) => !prev)}
              className="h-8 gap-1.5 bg-background/95 backdrop-blur-md border-border text-xs rounded-md shadow-sm"
            >
              <Layers className="size-3.5 text-primary" />
              <span>{sidePanelOpen ? "Hide Panel" : "Corridors"}</span>
            </Button>
          </div>
        </div>

        {/* Map Body and Side Panel */}
        <div className="relative flex flex-1 h-full w-full">
          {/* Main Leaflet Map DOM Node */}
          <div
            ref={mapContainerRef}
            className="h-full w-full z-0 bg-muted select-none"
            style={{ outline: "none" }}
          />

          {/* Left Slide-over Corridor Inspection Drawer */}
          {sidePanelOpen && (
            <div className="absolute top-16 left-4 bottom-4 z-10 w-84 md:w-96 flex flex-col bg-background/95 backdrop-blur-md border border-border rounded-lg shadow-xl overflow-hidden transition-all">
              {/* Header */}
              <div className="p-3.5 border-b border-border bg-muted/40 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
                    {selectedRoute ? "Corridor Topology" : "Active Transit Corridors"}
                  </h3>
                  <p className="text-xs font-semibold text-foreground">
                    {selectedRoute ? selectedRoute.name : `${filteredRoutes.length} Corridors in Service`}
                  </p>
                </div>
                {selectedRoute && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedRouteId(null)}
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    View All
                  </Button>
                )}
              </div>

              {/* Panel Body */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {selectedRoute ? (
                  // Detailed Corridor Sequence & Actions
                  <div className="space-y-3.5">
                    {/* Corridor Overview Card */}
                    <div className="p-3 rounded-lg border border-border bg-card/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-flex items-center justify-center size-6 rounded font-bold text-xs text-white"
                            style={{ backgroundColor: selectedRoute.color || "#2563EB" }}
                          >
                            {selectedRoute.code}
                          </span>
                          <span className="font-bold text-xs text-foreground">
                            {selectedRoute.code}: {selectedRoute.origin} ⇄ {selectedRoute.destination}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-[10px] uppercase font-mono">
                          {selectedRoute.direction || "UP"}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/60 text-center">
                        <div className="bg-muted/40 p-1.5 rounded">
                          <p className="text-[10px] text-muted-foreground font-mono">Distance</p>
                          <p className="font-bold text-xs text-foreground">{selectedRoute.lengthKm} km</p>
                        </div>
                        <div className="bg-muted/40 p-1.5 rounded">
                          <p className="text-[10px] text-muted-foreground font-mono">Runtime</p>
                          <p className="font-bold text-xs text-foreground">{selectedRoute.durationMin} min</p>
                        </div>
                        <div className="bg-muted/40 p-1.5 rounded">
                          <p className="text-[10px] text-muted-foreground font-mono">Stops</p>
                          <p className="font-bold text-xs text-foreground">{selectedRouteStops.length || selectedRoute.stopsCount || 0}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-muted-foreground text-[11px]">Peak Frequency:</span>
                        <span className="font-semibold text-foreground text-[11px]">{selectedRoute.peakFrequency || 10} min headways</span>
                      </div>

                      {/* Launch Actions */}
                      <div className="pt-2 flex items-center gap-2 border-t border-border/60">
                        <Button
                          size="sm"
                          className="flex-1 h-8 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md cursor-pointer"
                          onClick={() => {
                            navigate({
                              to: "/simulation",
                              search: { routeId: selectedRoute.id } as any,
                            });
                          }}
                        >
                          <Play className="size-3.5 fill-current" />
                          <span>Simulation Deck</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs gap-1.5 border-border rounded-md cursor-pointer"
                          onClick={() => {
                            navigate({
                              to: "/network/planner",
                              search: { routeId: selectedRoute.id } as any,
                            });
                          }}
                        >
                          <Compass className="size-3.5 text-primary" />
                          <span>Planner</span>
                        </Button>
                      </div>
                    </div>

                    {/* Stop Sequence Timeline */}
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground font-mono px-1">
                        Stop Sequence & Interchanges
                      </p>
                      <div className="space-y-1 border-l-2 border-primary/30 ml-3 pl-3 py-1">
                        {selectedRouteStops.map((stop, idx) => {
                          const isTerminal = idx === 0 || idx === selectedRouteStops.length - 1;
                          return (
                            <div
                              key={stop.id}
                              onClick={() => handleSelectStop(stop)}
                              className="group flex items-center justify-between p-1.5 rounded-md hover:bg-muted/70 cursor-pointer transition-colors text-xs"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span
                                  className={cn(
                                    "size-2 rounded-full shrink-0 -ml-[17px]",
                                    isTerminal
                                      ? "bg-amber-500 ring-2 ring-background"
                                      : "bg-primary ring-2 ring-background",
                                  )}
                                />
                                <span className={cn("truncate", isTerminal ? "font-bold text-foreground" : "font-medium text-foreground/80")}>
                                  {stop.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono shrink-0">
                                {stop.cumulativeTimeMinutes !== undefined && (
                                  <span>+{stop.cumulativeTimeMinutes}m</span>
                                )}
                                {isTerminal && (
                                  <Badge variant="outline" className="text-[9px] px-1 py-0 rounded">
                                    Terminus
                                  </Badge>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  // List of all corridors
                  <div className="space-y-1.5">
                    {filteredRoutes.map((r) => {
                      const isSelected = selectedRouteId === r.id;
                      return (
                        <div
                          key={r.id}
                          onClick={() => setSelectedRouteId(r.id)}
                          className={cn(
                            "p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between",
                            isSelected
                              ? "border-primary bg-primary/10 shadow-xs"
                              : "border-border/80 bg-card hover:bg-muted/50",
                          )}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className="inline-flex items-center justify-center size-7 rounded font-bold text-xs text-white shrink-0 shadow-2xs"
                              style={{ backgroundColor: r.color || "#2563EB" }}
                            >
                              {r.code}
                            </span>
                            <div className="min-w-0">
                              <p className="font-semibold text-xs text-foreground truncate">
                                {r.origin} ⇄ {r.destination}
                              </p>
                              <p className="text-[10px] text-muted-foreground font-mono">
                                {r.lengthKm} km · {r.durationMin} min · {r.stopsCount || 8} stops
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="size-4 text-muted-foreground shrink-0 ml-2" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Drawer Footer */}
              <div className="p-2.5 border-t border-border bg-muted/30 text-[10px] text-muted-foreground font-mono flex items-center justify-between">
                <span>{currentTenant.code} Network GIS</span>
                <span>CUMTA / GTFS Standard</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

