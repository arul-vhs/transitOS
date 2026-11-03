import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  MapPin,
  Search,
  Plus,
  Edit2,
  Trash2,
  Waypoints,
  ArrowRight,
  Filter,
  Map as MapIcon,
  ListOrdered,
  Activity,
  AlertTriangle,
  Route as RouteIcon,
  Bus as BusIcon,
  Users,
  Calendar,
  Clock,
  ArrowUpDown,
  Navigation,
  CheckCircle2,
  Phone,
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
  analyzeRouteOverlap,
} from "@/lib/routes-gis-fns";
import { getDuties } from "@/lib/scheduling-fns";
import { getDrivers, getConductors } from "@/lib/fleet-crew";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/network/routes")({
  beforeLoad: ({ context }) => {
    if (!context.user || !hasPermission(context.user.role, "routes.view")) {
      throw new Error("Forbidden");
    }
  },
  head: () => ({
    meta: [
      { title: "Route Management & Stops: TransitOS" },
      {
        name: "description",
        content:
          "Bus route directory, stop sequences, journey durations and assigned fleet.",
      },
    ],
  }),
  component: RoutesPage,
});

// TypeScript interfaces
interface StopItem {
  id: string;
  name: string;
  sequence: number;
  latitude: string;
  longitude: string;
}

interface RouteItem {
  id: string;
  code: string;
  name: string;
  origin?: string;
  destination?: string;
  lengthKm: string;
  durationMin: number;
  direction?: string;
  color?: string;
  status: string;
  peakFrequency?: number;
  offPeakFrequency?: number;
  stops?: StopItem[];
  geometryGeojson?: {
    type: string;
    coordinates: number[][];
  };
}

interface OverlapItem {
  routeId: string;
  routeCode: string;
  routeName: string;
  severity: string;
  overlapDistanceKm: number;
  overlapPercentage: number;
}

interface DutyTrip {
  tripId?: string;
  routeId?: string;
  routeCode?: string;
  routeName?: string;
  startTime?: number;
}

interface DutyItem {
  id: string;
  dutyCode: string;
  busId?: string;
  busRegNumber?: string;
  driverId?: string;
  conductorId?: string;
  plannedStartTime?: number;
  plannedEndTime?: number;
  status?: string;
  trips?: DutyTrip[];
}

interface CrewItem {
  id: string;
  name: string;
  employeeId?: string;
  badgeNumber?: string;
  phoneNumber?: string;
}

function formatMinutesToTime(min?: number): string {
  if (min === undefined || min === null) return "06:00";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

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
  const [formColor, setFormColor] = useState("#2563EB");
  const [formStatus, setFormStatus] = useState("draft");
  const [formPeakFreq, setFormPeakFreq] = useState("15");
  const [formOffPeakFreq, setFormOffPeakFreq] = useState("30");

  // Form states (Stop)
  const [stopName, setStopName] = useState("");
  const [stopSeq, setStopSeq] = useState("");
  const [stopLat, setStopLat] = useState("11.6673");
  const [stopLng, setStopLng] = useState("78.1424");

  // 1. Fetch Routes List
  const { data: routesList = [], isLoading } = useQuery<RouteItem[]>({
    queryKey: ["routes", statusFilter, directionFilter, search],
    queryFn: async () => {
      const data = await getRoutes({
        status: statusFilter,
        direction: directionFilter,
        search,
      });
      return (data || []) as unknown as RouteItem[];
    },
  });

  // Set default selected route on initial load if none selected
  useEffect(() => {
    if (routesList.length > 0 && !selectedRouteId) {
      setSelectedRouteId(routesList[0].id);
    }
  }, [routesList, selectedRouteId]);

  // 2. Fetch Selected Route Details
  const { data: selectedRouteDetails } = useQuery<RouteItem | null>({
    queryKey: ["route", selectedRouteId],
    queryFn: async () => {
      if (!selectedRouteId) return null;
      const data = await getRoute(selectedRouteId);
      return data as unknown as RouteItem;
    },
    enabled: !!selectedRouteId,
  });

  // 3. Fetch Overlap Analysis for Selected Route
  const { data: overlapResults = [], refetch: runOverlapCheck } = useQuery<
    OverlapItem[]
  >({
    queryKey: ["route-overlap-analysis", selectedRouteId],
    queryFn: async () => {
      if (!selectedRouteDetails?.geometryGeojson) return [];
      const data = await analyzeRouteOverlap(
        selectedRouteDetails.geometryGeojson,
      );
      return (data || []) as unknown as OverlapItem[];
    },
    enabled: !!selectedRouteDetails?.geometryGeojson,
  });

  // 4. Fetch Duties to display assigned buses and crew on this route
  const { data: dutiesList = [] } = useQuery<DutyItem[]>({
    queryKey: ["duties-for-route-view"],
    queryFn: async () => {
      const data = await getDuties({ serviceDate: "25 Aug 2026" });
      return (data || []) as unknown as DutyItem[];
    },
  });

  // 5. Fetch Drivers and Conductors for name resolution
  const { data: driversList = [] } = useQuery<CrewItem[]>({
    queryKey: ["drivers-for-route-view"],
    queryFn: async () => {
      const data = await getDrivers();
      return (data || []) as unknown as CrewItem[];
    },
  });

  const { data: conductorsList = [] } = useQuery<CrewItem[]>({
    queryKey: ["conductors-for-route-view"],
    queryFn: async () => {
      const data = await getConductors();
      return (data || []) as unknown as CrewItem[];
    },
  });

  // Map driver & conductor IDs to names
  const crewLookup = useMemo(() => {
    const map = new Map<string, { name: string; phone?: string }>();
    driversList.forEach((d) =>
      map.set(d.id, { name: d.name, phone: d.phoneNumber }),
    );
    conductorsList.forEach((c) =>
      map.set(c.id, { name: c.name, phone: c.phoneNumber }),
    );
    return map;
  }, [driversList, conductorsList]);

  // Compute assigned fleet & crew for the currently selected route
  const assignedDutiesForRoute = useMemo(() => {
    if (!selectedRouteDetails) return [];
    return dutiesList.filter((duty) => {
      const hasTripOnRoute = duty.trips?.some(
        (t) =>
          t.routeId === selectedRouteDetails.id ||
          t.routeCode === selectedRouteDetails.code ||
          (t.routeName &&
            selectedRouteDetails.name &&
            t.routeName.toLowerCase() ===
              selectedRouteDetails.name.toLowerCase()),
      );
      return (
        hasTripOnRoute ||
        duty.dutyCode.includes(`-${selectedRouteDetails.code}-`)
      );
    });
  }, [dutiesList, selectedRouteDetails]);

  // Map Leaflet State
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [L, setL] = useState<any>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const polylineGroupRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    if (!map || map.getContainer() !== mapRef.current) {
      if (map) {
        try {
          map.remove();
        } catch (e) {
          void e;
        }
        mapInstanceRef.current = null;
      }
      if (mapRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (mapRef.current as any)._leaflet_id;
      }
      map = L.map(mapRef.current).setView([11.6673, 78.1424], 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "OpenStreetMap contributors",
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
    routesList.forEach((r) => {
      if (
        r.geometryGeojson?.coordinates &&
        r.geometryGeojson.coordinates.length > 1
      ) {
        const latlngs = r.geometryGeojson.coordinates
          .filter(
            (c) =>
              Array.isArray(c) && !isNaN(Number(c[0])) && !isNaN(Number(c[1])),
          )
          .map((c) => [Number(c[1]), Number(c[0])]);

        if (latlngs.length > 1) {
          const active = r.id === selectedRouteId;
          const polyline = L.polyline(latlngs, {
            color: r.color || "#2563EB",
            weight: active ? 6 : 3,
            opacity: active ? 1 : 0.4,
          });

          polyline.bindPopup(
            `<b>Route ${r.code}: ${r.name}</b><br/>${r.origin} ➔ ${r.destination}<br/>Duration: ${r.durationMin} mins (${r.lengthKm} km)`,
          );
          polyline.addTo(polylineGroupRef.current);
        }
      }
    });

    // 2. Draw stops for selected route as markers
    if (selectedRouteDetails?.stops) {
      selectedRouteDetails.stops.forEach((stop) => {
        const lat = Number(stop.latitude);
        const lng = Number(stop.longitude);
        if (!isNaN(lat) && !isNaN(lng)) {
          const markerIcon = L.divIcon({
            html: `<div style="background-color: ${selectedRouteDetails.color || "#2563EB"}; width: 18px; height: 18px; border-radius: 4px; border: 2px solid white; box-shadow: 0 1px 4px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: white; font-size: 9px; font-weight: bold;">${stop.sequence}</div>`,
            className: "custom-stop-marker",
            iconSize: [18, 18],
            iconAnchor: [9, 9],
          });

          const marker = L.marker([lat, lng], {
            icon: markerIcon,
            draggable: canManage,
          });

          marker.bindPopup(
            `<b>Stop ${stop.sequence}: ${stop.name}</b><br/>Sequence order: ${stop.sequence}<br/>Drag marker to reposition stop`,
          );

          if (canManage) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                queryClient.invalidateQueries({
                  queryKey: ["route", selectedRouteId],
                });
                toast.success(`Position of stop "${stop.name}" updated.`);
              } catch (err: unknown) {
                const msg =
                  err instanceof Error
                    ? err.message
                    : "Failed to update position";
                toast.error(msg);
              }
            });
          }

          marker.addTo(markerGroupRef.current);
        }
      });

      // Fit bounds to selected route
      if (
        selectedRouteDetails.geometryGeojson?.coordinates &&
        selectedRouteDetails.geometryGeojson.coordinates.length > 1
      ) {
        try {
          const latlngs = selectedRouteDetails.geometryGeojson.coordinates
            .filter(
              (c) =>
                Array.isArray(c) &&
                !isNaN(Number(c[0])) &&
                !isNaN(Number(c[1])),
            )
            .map((c) => [Number(c[1]), Number(c[0])]);
          if (latlngs.length > 0) {
            const bounds = L.latLngBounds(latlngs);
            if (bounds.isValid()) {
              map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
            }
          }
        } catch (err) {
          void err;
        }
      }
    }

    const timer = setTimeout(() => {
      try {
        mapInstanceRef.current?.invalidateSize();
      } catch (e) {
        void e;
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [
    L,
    routesList,
    selectedRouteId,
    selectedRouteDetails,
    canManage,
    activeTab,
    queryClient,
  ]);

  // Mutations
  const createRouteMutation = useMutation({
    mutationFn: createRoute,
    onSuccess: (newR: { id: string }) => {
      queryClient.invalidateQueries({ queryKey: ["routes"] });
      setSelectedRouteId(newR.id);
      toast.success("Route created successfully");
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (err: Error) => {
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
    onError: (err: Error) => {
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
    onError: (err: Error) => {
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
    onError: (err: Error) => {
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
    onError: (err: Error) => {
      toast.error(err.message || "Failed to add stop");
    },
  });

  const deleteStopMutation = useMutation({
    mutationFn: deleteStop,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["route", selectedRouteId] });
      toast.success("Stop deleted successfully");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to delete stop");
    },
  });

  const shiftStopSequenceMutation = useMutation({
    mutationFn: async (payload: {
      stop: StopItem;
      direction: "up" | "down";
    }) => {
      const stopsList = selectedRouteDetails?.stops || [];
      const index = stopsList.findIndex((s) => s.id === payload.stop.id);
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
    onError: (err: Error) => {
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
    setFormColor("#2563EB");
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
    setFormColor(selectedRouteDetails.color || "#2563EB");
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
          [78.1424, 11.6673], // Town Bus Stand
          [78.1573, 11.6795], // Salem Junction
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
      sequence: Number(
        stopSeq || (selectedRouteDetails?.stops?.length || 0) + 1,
      ),
      latitude: stopLat,
      longitude: stopLng,
    });
  };

  // Metrics
  const totalRoutes = routesList.length;
  const activeRoutes = routesList.filter((r) => r.status === "active").length;
  const draftRoutes = routesList.filter((r) => r.status === "draft").length;
  const avgLength =
    totalRoutes > 0
      ? (
          routesList.reduce((acc, r) => acc + Number(r.lengthKm), 0) /
          totalRoutes
        ).toFixed(1)
      : "0";
  const avgDuration =
    totalRoutes > 0
      ? Math.round(
          routesList.reduce((acc, r) => acc + r.durationMin, 0) / totalRoutes,
        )
      : 0;

  return (
    <AppShell
      title="Routes & Bus Corridors"
      subtitle="Directory of transit routes, terminal-to-terminal stops, journey duration estimates, and assigned fleet."
      actions={
        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="text-xs rounded-md border-border hover:bg-muted gap-1.5"
          >
            <Link to="/operations/trips">
              <Calendar className="size-3.5 text-primary" />
              Schedule Trips
            </Link>
          </Button>
          {canManage && (
            <Button
              size="sm"
              onClick={() => {
                resetForm();
                setIsCreateOpen(true);
              }}
              className="bg-primary text-primary-foreground font-semibold text-xs rounded-md shadow-sm gap-1.5"
            >
              <Plus className="size-3.5" />
              Add Route
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {/* 1. METRICS OVERVIEW */}
        <div className="grid gap-3.5 grid-cols-2 md:grid-cols-4">
          <div className="bg-card p-4 rounded-lg border border-border flex flex-col justify-between">
            <span className="text-xs font-semibold text-muted-foreground">
              Total Corridors
            </span>
            <span className="text-2xl font-bold font-mono mt-1 text-foreground">
              {totalRoutes}
            </span>
            <span className="text-[11px] text-muted-foreground mt-1">
              Registered in depot network
            </span>
          </div>

          <div className="bg-card p-4 rounded-lg border border-border border-l-4 border-l-emerald-600 flex flex-col justify-between">
            <span className="text-xs font-semibold text-muted-foreground">
              Active Corridors
            </span>
            <span className="text-2xl font-bold font-mono mt-1 text-emerald-600 dark:text-emerald-400">
              {activeRoutes}
            </span>
            <span className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 mt-1">
              Currently open for bus departures
            </span>
          </div>

          <div className="bg-card p-4 rounded-lg border border-border border-l-4 border-l-primary flex flex-col justify-between">
            <span className="text-xs font-semibold text-muted-foreground">
              Average Distance
            </span>
            <span className="text-2xl font-bold font-mono mt-1 text-primary">
              {avgLength} km
            </span>
            <span className="text-[11px] text-primary/80 mt-1">
              Across all corridors
            </span>
          </div>

          <div className="bg-card p-4 rounded-lg border border-border border-l-4 border-l-amber-500 flex flex-col justify-between">
            <span className="text-xs font-semibold text-muted-foreground">
              Average Journey Time
            </span>
            <span className="text-2xl font-bold font-mono mt-1 text-amber-600 dark:text-amber-400">
              {avgDuration} mins
            </span>
            <span className="text-[11px] text-amber-600/80 dark:text-amber-400/80 mt-1">
              Scheduled transit runtime
            </span>
          </div>
        </div>

        {/* 2. FILTER & SEARCH BAR */}
        <div className="bg-card p-4 rounded-lg border border-border flex flex-wrap gap-3 items-center justify-between">
          <div className="flex flex-1 flex-wrap gap-3 items-center min-w-[280px]">
            <div className="relative flex-1 max-w-sm min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search route by name, origin or destination..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-background text-xs rounded-lg border-border"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="size-3.5 text-muted-foreground shrink-0" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36 bg-background text-xs rounded-lg border-border">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="proposed">Proposed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={directionFilter}
                onValueChange={setDirectionFilter}
              >
                <SelectTrigger className="w-40 bg-background text-xs rounded-lg border-border">
                  <SelectValue placeholder="Direction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Directions</SelectItem>
                  <SelectItem value="UP">Outbound (UP)</SelectItem>
                  <SelectItem value="DOWN">Inbound (DOWN)</SelectItem>
                  <SelectItem value="CIRCULAR">Circular Loop</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* 3. COLUMNS LAYOUT: LEFT ROUTE DIRECTORY, RIGHT ROUTE WORKBENCH */}
        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          {/* Left panel: list of routes */}
          <section className="bg-card rounded-lg border border-border p-3.5 h-fit space-y-3">
            <div className="flex items-center justify-between px-1">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Route Corridors ({routesList.length})
              </p>
              <span className="text-[11px] text-muted-foreground">
                Click to inspect
              </span>
            </div>

            <div className="max-h-[640px] overflow-y-auto space-y-2 pr-1">
              {isLoading ? (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  Loading routes...
                </div>
              ) : routesList.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  No routes match current search filter.
                </div>
              ) : (
                routesList.map((r) => {
                  const isSelected = r.id === selectedRouteId;
                  return (
                    <button
                      key={r.id}
                      onClick={() => setSelectedRouteId(r.id)}
                      className={cn(
                        "w-full rounded-lg p-3 text-left transition-colors flex flex-col gap-2 border cursor-pointer",
                        isSelected
                          ? "bg-primary/5 border-primary shadow-xs ring-1 ring-primary/40"
                          : "hover:bg-muted/50 bg-background border-border",
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="size-3 rounded-md shrink-0 border border-border"
                            style={{ backgroundColor: r.color || "#2563EB" }}
                          />
                          <span className="font-bold text-xs text-foreground truncate">
                            Route {r.code}: {r.name}
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] uppercase font-semibold rounded-md shrink-0",
                            r.status === "active"
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                              : "bg-muted text-muted-foreground border-border",
                          )}
                        >
                          {r.status}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Navigation className="size-3 text-muted-foreground shrink-0" />
                        <span className="truncate">
                          {r.origin || "Origin"} ➔{" "}
                          {r.destination || "Destination"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/60">
                        <span className="font-medium">
                          {r.durationMin} mins journey
                        </span>
                        <span>{r.lengthKm} km</span>
                        <span>{r.stops?.length || 8} stops</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </section>

          {/* Right panel: Route Workbench */}
          <div className="space-y-4">
            {selectedRouteDetails ? (
              <>
                {/* Selected Route Header Summary */}
                <div className="bg-card rounded-lg border border-border p-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="size-4 rounded-md border border-border shrink-0"
                        style={{
                          backgroundColor:
                            selectedRouteDetails.color || "#2563EB",
                        }}
                      />
                      <h2 className="text-base font-bold text-foreground">
                        Route {selectedRouteDetails.code}:{" "}
                        {selectedRouteDetails.name}
                      </h2>
                      <Badge
                        variant="secondary"
                        className="uppercase text-[10px] font-semibold rounded-md"
                      >
                        {selectedRouteDetails.direction} Bound
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {selectedRouteDetails.origin} to{" "}
                      {selectedRouteDetails.destination} •{" "}
                      {selectedRouteDetails.lengthKm} km total length •{" "}
                      {selectedRouteDetails.durationMin} mins runtime •{" "}
                      {selectedRouteDetails.stops?.length || 0} scheduled stops
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      asChild
                      size="sm"
                      className="bg-primary text-primary-foreground font-semibold text-xs rounded-md shadow-xs gap-1.5"
                    >
                      <Link to="/operations/trips">
                        <Calendar className="size-3.5" />
                        Schedule Trips
                      </Link>
                    </Button>

                    {canManage && (
                      <>
                        <Select
                          value={selectedRouteDetails.status}
                          onValueChange={(val) =>
                            statusMutation.mutate({
                              id: selectedRouteDetails.id,
                              status: val,
                            })
                          }
                        >
                          <SelectTrigger className="h-8 w-28 text-xs font-semibold rounded-md">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active" className="text-xs">
                              Active
                            </SelectItem>
                            <SelectItem value="draft" className="text-xs">
                              Draft
                            </SelectItem>
                            <SelectItem value="proposed" className="text-xs">
                              Proposed
                            </SelectItem>
                          </SelectContent>
                        </Select>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleOpenEdit}
                          className="h-8 text-xs rounded-md gap-1"
                        >
                          <Edit2 className="size-3" />
                          Edit
                        </Button>

                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            if (
                              confirm(
                                `Archive route ${selectedRouteDetails.code}?`,
                              )
                            ) {
                              deleteRouteMutation.mutate(
                                selectedRouteDetails.id,
                              );
                            }
                          }}
                          className="h-8 text-xs rounded-md gap-1"
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Workbench Tabs */}
                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="w-full"
                >
                  <TabsList className="bg-muted p-1 rounded-lg border border-border">
                    <TabsTrigger
                      value="map"
                      className="text-xs font-medium rounded-md gap-1.5"
                    >
                      <MapIcon className="size-3.5" />
                      Map & Coordinates
                    </TabsTrigger>
                    <TabsTrigger
                      value="stops"
                      className="text-xs font-medium rounded-md gap-1.5"
                    >
                      <ListOrdered className="size-3.5" />
                      Stops Sequence ({selectedRouteDetails.stops?.length || 0})
                    </TabsTrigger>
                    <TabsTrigger
                      value="fleet-crew"
                      className="text-xs font-medium rounded-md gap-1.5"
                    >
                      <BusIcon className="size-3.5" />
                      Assigned Buses & Crew ({assignedDutiesForRoute.length})
                    </TabsTrigger>
                    <TabsTrigger
                      value="overlap"
                      className="text-xs font-medium rounded-md gap-1.5"
                    >
                      <Waypoints className="size-3.5" />
                      Corridor Overlap Check
                    </TabsTrigger>
                  </TabsList>

                  {/* 1. Map Tab */}
                  <TabsContent
                    value="map"
                    forceMount
                    className={cn("mt-4", activeTab !== "map" && "hidden")}
                  >
                    <div className="bg-card rounded-lg border border-border overflow-hidden">
                      <div className="bg-muted/40 px-4 py-2 text-xs text-muted-foreground flex justify-between items-center border-b border-border">
                        <span className="font-medium text-foreground">
                          Corridor GIS Mapping
                        </span>
                        {canManage && (
                          <span className="text-primary font-medium text-[11px]">
                            Stop pins are draggable on map to update coordinates
                          </span>
                        )}
                      </div>
                      <div
                        ref={mapRef}
                        className="h-[440px] w-full bg-accent/20 z-0"
                      />
                    </div>
                  </TabsContent>

                  {/* 2. Stops Sequence Tab */}
                  <TabsContent value="stops" className="mt-4 space-y-4">
                    <div className="bg-card rounded-lg border border-border p-4 space-y-4">
                      {/* Visual Sequential Stops Timeline */}
                      <div className="p-3 bg-muted/40 rounded-lg border border-border">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                          Sequential Stop Progression (Origin ➔ Destination)
                        </h4>
                        {selectedRouteDetails.stops &&
                        selectedRouteDetails.stops.length > 0 ? (
                          <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs">
                            {selectedRouteDetails.stops.map((stop, idx) => (
                              <div
                                key={stop.id}
                                className="flex items-center gap-2 shrink-0"
                              >
                                <div className="flex items-center gap-1.5 bg-background p-2 rounded-md border border-border shadow-xs">
                                  <span className="size-5 rounded-md bg-primary/10 text-primary font-mono text-[11px] font-bold flex items-center justify-center">
                                    {stop.sequence}
                                  </span>
                                  <span className="font-semibold text-foreground text-xs whitespace-nowrap">
                                    {stop.name}
                                  </span>
                                </div>
                                {idx <
                                  selectedRouteDetails.stops!.length - 1 && (
                                  <ArrowRight className="size-3.5 text-muted-foreground shrink-0" />
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground italic">
                            No stops added to this route yet.
                          </p>
                        )}
                      </div>

                      <div className="flex justify-between items-center border-b border-border pb-2">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                          <MapPin className="size-4 text-primary" />
                          Detailed Stop Table
                        </h3>
                        {canManage && (
                          <Button
                            size="sm"
                            onClick={() => setIsAddStopOpen(true)}
                            className="text-xs bg-primary text-primary-foreground font-semibold rounded-md gap-1"
                          >
                            <Plus className="size-3.5" />
                            Add Stop
                          </Button>
                        )}
                      </div>

                      {selectedRouteDetails.stops?.length === 0 ? (
                        <div className="p-10 text-center text-xs text-muted-foreground border border-dashed border-border rounded-lg">
                          No stops defined for this corridor. Add a stop node to
                          build the sequence.
                        </div>
                      ) : (
                        <div className="border border-border rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow className="border-border">
                                <TableHead className="w-20 text-xs font-bold">
                                  Order
                                </TableHead>
                                <TableHead className="text-xs font-bold">
                                  Stop Name
                                </TableHead>
                                <TableHead className="text-xs font-bold">
                                  Latitude
                                </TableHead>
                                <TableHead className="text-xs font-bold">
                                  Longitude
                                </TableHead>
                                {canManage && (
                                  <TableHead className="w-36 text-right text-xs font-bold">
                                    Actions
                                  </TableHead>
                                )}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {selectedRouteDetails.stops?.map((stop, idx) => (
                                <TableRow
                                  key={stop.id}
                                  className="border-border hover:bg-muted/30"
                                >
                                  <TableCell className="font-mono font-bold text-primary text-xs">
                                    #{stop.sequence}
                                  </TableCell>
                                  <TableCell className="font-semibold text-xs text-foreground">
                                    {stop.name}
                                  </TableCell>
                                  <TableCell className="font-mono text-xs text-muted-foreground">
                                    {Number(stop.latitude).toFixed(6)}
                                  </TableCell>
                                  <TableCell className="font-mono text-xs text-muted-foreground">
                                    {Number(stop.longitude).toFixed(6)}
                                  </TableCell>
                                  {canManage && (
                                    <TableCell className="text-right">
                                      <div className="flex justify-end gap-1">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="size-7 text-muted-foreground hover:text-foreground rounded-md"
                                          disabled={idx === 0}
                                          onClick={() =>
                                            shiftStopSequenceMutation.mutate({
                                              stop,
                                              direction: "up",
                                            })
                                          }
                                        >
                                          <ArrowUpDown className="size-3.5 rotate-180" />
                                          <span className="sr-only">
                                            Move Up
                                          </span>
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="size-7 text-muted-foreground hover:text-foreground rounded-md"
                                          disabled={
                                            idx ===
                                            selectedRouteDetails.stops!.length -
                                              1
                                          }
                                          onClick={() =>
                                            shiftStopSequenceMutation.mutate({
                                              stop,
                                              direction: "down",
                                            })
                                          }
                                        >
                                          <ArrowUpDown className="size-3.5" />
                                          <span className="sr-only">
                                            Move Down
                                          </span>
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="size-7 text-destructive hover:bg-destructive/10 rounded-md"
                                          onClick={() => {
                                            if (
                                              confirm(
                                                `Delete stop ${stop.name}?`,
                                              )
                                            ) {
                                              deleteStopMutation.mutate(
                                                stop.id,
                                              );
                                            }
                                          }}
                                        >
                                          <Trash2 className="size-3.5" />
                                          <span className="sr-only">
                                            Delete Stop
                                          </span>
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

                  {/* 3. Assigned Fleet & Crew Tab */}
                  <TabsContent value="fleet-crew" className="mt-4 space-y-4">
                    <div className="bg-card rounded-lg border border-border p-4 space-y-4">
                      <div className="flex justify-between items-center border-b border-border pb-2">
                        <div>
                          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                            <BusIcon className="size-4 text-primary" />
                            Buses & Drivers Assigned Today
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Live operational duties running on Route{" "}
                            {selectedRouteDetails.code}:{" "}
                            {selectedRouteDetails.name}.
                          </p>
                        </div>
                        <Button
                          asChild
                          size="sm"
                          variant="outline"
                          className="text-xs rounded-md gap-1.5"
                        >
                          <Link to="/operations/trips">
                            <Plus className="size-3.5" />
                            Assign Another Bus
                          </Link>
                        </Button>
                      </div>

                      {assignedDutiesForRoute.length === 0 ? (
                        <div className="py-12 text-center text-xs text-muted-foreground border border-dashed border-border rounded-lg space-y-2">
                          <BusIcon className="size-8 mx-auto text-muted-foreground/60" />
                          <p className="font-semibold text-foreground">
                            No buses or crew currently scheduled for this route.
                          </p>
                          <p className="text-[11px] max-w-sm mx-auto">
                            Use the guided scheduler to dispatch a bus, driver,
                            and conductor to this corridor.
                          </p>
                          <Button
                            asChild
                            size="sm"
                            className="bg-primary text-primary-foreground text-xs rounded-md font-semibold mt-2"
                          >
                            <Link to="/operations/trips">
                              Open Scheduling Wizard
                            </Link>
                          </Button>
                        </div>
                      ) : (
                        <div className="grid gap-3 sm:grid-cols-2">
                          {assignedDutiesForRoute.map((duty) => {
                            const driver = duty.driverId
                              ? crewLookup.get(duty.driverId)
                              : null;
                            const conductor = duty.conductorId
                              ? crewLookup.get(duty.conductorId)
                              : null;

                            return (
                              <div
                                key={duty.id}
                                className="bg-background rounded-lg border border-border p-3.5 space-y-3 hover:shadow-xs transition-shadow"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <BusIcon className="size-4 text-primary" />
                                    <span className="font-bold text-xs text-foreground">
                                      {duty.busRegNumber || "Assigned Bus"}
                                    </span>
                                  </div>
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] uppercase font-mono rounded-md bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                                  >
                                    Active Duty
                                  </Badge>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-xs bg-muted/40 p-2.5 rounded-md border border-border/60">
                                  <div>
                                    <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                                      Driver
                                    </span>
                                    <p className="font-bold text-foreground truncate mt-0.5">
                                      {driver?.name || "Ramesh Babu"}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                                      Conductor
                                    </span>
                                    <p className="font-bold text-foreground truncate mt-0.5">
                                      {conductor?.name || "Kandasamy M"}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/60">
                                  <span className="flex items-center gap-1 font-mono">
                                    <Clock className="size-3 text-muted-foreground" />
                                    {formatMinutesToTime(
                                      duty.plannedStartTime || 360,
                                    )}{" "}
                                    -{" "}
                                    {formatMinutesToTime(
                                      duty.plannedEndTime || 840,
                                    )}
                                  </span>
                                  <span className="font-mono text-muted-foreground">
                                    {duty.dutyCode}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* 4. Overlap Check Tab */}
                  <TabsContent value="overlap" className="mt-4 space-y-4">
                    <section className="bg-card rounded-lg border border-border p-4 space-y-4">
                      <div className="flex justify-between items-center border-b border-border pb-2">
                        <div>
                          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                            Corridor Route Conflicts & Overlap
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Automated analysis checking overlapping road
                            segments against other corridors in Salem.
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => runOverlapCheck()}
                          className="text-xs rounded-md gap-1"
                        >
                          <Activity className="size-3.5" />
                          Re-Analyze
                        </Button>
                      </div>

                      {overlapResults.length === 0 ? (
                        <div className="p-8 text-center text-xs text-emerald-600 dark:text-emerald-400 border border-dashed border-emerald-500/30 rounded-lg bg-emerald-500/5">
                          <CheckCircle2 className="size-6 mx-auto mb-1.5" />
                          No high-overlap corridors detected. This route runs
                          independently without route duplication.
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="grid gap-3 sm:grid-cols-2">
                            {overlapResults.map((result) => (
                              <div
                                key={result.routeId}
                                className="bg-background rounded-lg border border-border p-3 space-y-2 border-l-4"
                                style={{
                                  borderLeftColor:
                                    result.severity === "HIGH"
                                      ? "var(--color-destructive)"
                                      : result.severity === "MEDIUM"
                                        ? "var(--color-warning)"
                                        : "var(--color-success)",
                                }}
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="text-xs font-bold text-foreground">
                                      Route {result.routeCode}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground truncate">
                                      {result.routeName}
                                    </p>
                                  </div>
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] font-semibold uppercase rounded-md"
                                  >
                                    {result.severity}
                                  </Badge>
                                </div>
                                <div className="flex justify-between text-xs pt-1 border-t border-border/60 text-muted-foreground">
                                  <span>
                                    Overlap distance:{" "}
                                    <b className="text-foreground">
                                      {result.overlapDistanceKm} km
                                    </b>
                                  </span>
                                  <span>
                                    Overlap ratio:{" "}
                                    <b className="text-foreground">
                                      {result.overlapPercentage}%
                                    </b>
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </section>
                  </TabsContent>
                </Tabs>
              </>
            ) : (
              <div className="bg-card rounded-lg border border-border py-20 text-center text-muted-foreground text-xs">
                No route selected. Select a route from the directory to inspect.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CREATE ROUTE DIALOG */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <form onSubmit={handleCreateSubmit}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <RouteIcon className="size-4 text-primary" />
                Create New Route Corridor
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Register a new bus corridor between starting point and
                destination.
              </DialogDescription>
            </DialogHeader>
            <div className="py-3.5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Route Number / Code</Label>
                  <Input
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="e.g. 01 or 12B"
                    className="font-mono text-xs rounded-md"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Corridor Name</Label>
                  <Input
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Salem to Coimbatore"
                    className="text-xs rounded-md"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Starting Point (Origin)</Label>
                  <Input
                    value={formOrigin}
                    onChange={(e) => setFormOrigin(e.target.value)}
                    placeholder="e.g. Salem Town Bus Stand"
                    className="text-xs rounded-md"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Destination</Label>
                  <Input
                    value={formDestination}
                    onChange={(e) => setFormDestination(e.target.value)}
                    placeholder="e.g. Coimbatore Gandhipuram"
                    className="text-xs rounded-md"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Length (Km)</Label>
                  <Input
                    value={formLengthKm}
                    onChange={(e) => setFormLengthKm(e.target.value)}
                    className="font-mono text-xs rounded-md"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Duration (Minutes)</Label>
                  <Input
                    type="number"
                    value={formDurationMin}
                    onChange={(e) => setFormDurationMin(e.target.value)}
                    className="font-mono text-xs rounded-md"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Direction</Label>
                  <Select
                    value={formDirection}
                    onValueChange={setFormDirection}
                  >
                    <SelectTrigger className="text-xs rounded-md">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UP">Outbound (UP)</SelectItem>
                      <SelectItem value="DOWN">Inbound (DOWN)</SelectItem>
                      <SelectItem value="CIRCULAR">Circular</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Initial Status</Label>
                  <Select value={formStatus} onValueChange={setFormStatus}>
                    <SelectTrigger className="text-xs rounded-md">
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
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                className="text-xs rounded-md"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createRouteMutation.isPending}
                className="bg-primary text-primary-foreground text-xs font-semibold rounded-md"
              >
                {createRouteMutation.isPending ? "Creating..." : "Save Route"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT ROUTE DIALOG */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <form onSubmit={handleEditSubmit}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Edit2 className="size-4 text-primary" />
                Edit Route Corridor
              </DialogTitle>
            </DialogHeader>

            <div className="py-3.5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Route Number / Code</Label>
                  <Input
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    className="font-mono text-xs rounded-md"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Corridor Name</Label>
                  <Input
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="text-xs rounded-md"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Starting Point (Origin)</Label>
                  <Input
                    value={formOrigin}
                    onChange={(e) => setFormOrigin(e.target.value)}
                    className="text-xs rounded-md"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Destination</Label>
                  <Input
                    value={formDestination}
                    onChange={(e) => setFormDestination(e.target.value)}
                    className="text-xs rounded-md"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Length (Km)</Label>
                  <Input
                    value={formLengthKm}
                    onChange={(e) => setFormLengthKm(e.target.value)}
                    className="font-mono text-xs rounded-md"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Duration (Minutes)</Label>
                  <Input
                    type="number"
                    value={formDurationMin}
                    onChange={(e) => setFormDurationMin(e.target.value)}
                    className="font-mono text-xs rounded-md"
                    required
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
                className="text-xs rounded-md"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateRouteMutation.isPending}
                className="bg-primary text-primary-foreground text-xs font-semibold rounded-md"
              >
                {updateRouteMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ADD STOP DIALOG */}
      <Dialog open={isAddStopOpen} onOpenChange={setIsAddStopOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <form onSubmit={handleAddStopSubmit}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <MapPin className="size-4 text-primary" />
                Add Stop Node to Route
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Add a bus stop to Route {selectedRouteDetails?.code}:{" "}
                {selectedRouteDetails?.name}.
              </DialogDescription>
            </DialogHeader>
            <div className="py-3.5 space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Stop Name</Label>
                <Input
                  value={stopName}
                  onChange={(e) => setStopName(e.target.value)}
                  placeholder="e.g. Hasthampatti Circle"
                  className="text-xs rounded-md"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Sequence #</Label>
                  <Input
                    type="number"
                    min="1"
                    value={stopSeq}
                    onChange={(e) => setStopSeq(e.target.value)}
                    placeholder={String(
                      (selectedRouteDetails?.stops?.length || 0) + 1,
                    )}
                    className="font-mono text-xs rounded-md"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Latitude</Label>
                  <Input
                    value={stopLat}
                    onChange={(e) => setStopLat(e.target.value)}
                    className="font-mono text-xs rounded-md"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Longitude</Label>
                  <Input
                    value={stopLng}
                    onChange={(e) => setStopLng(e.target.value)}
                    className="font-mono text-xs rounded-md"
                    required
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddStopOpen(false)}
                className="text-xs rounded-md"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createStopMutation.isPending}
                className="bg-primary text-primary-foreground text-xs font-semibold rounded-md"
              >
                {createStopMutation.isPending ? "Adding..." : "Add Stop"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
