import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  MapPin,
  Search,
  Plus,
  Edit2,
  Trash2,
  Map as MapIcon,
  ArrowRight,
  Route as RouteIcon,
  Clock,
  CalendarClock,
  Eye,
  Check,
  Compass,
  Layers,
  Building2,
  ArrowUpDown,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { TransitTable, ColumnDef } from "@/components/ui/transit-table";
import { useActiveTenant } from "@/lib/tenant-context";
import { RouteBadge } from "@/lib/route-utils";
import { Play } from "lucide-react";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Route as RootRoute } from "@/routes/__root";
import { hasPermission } from "@/lib/auth-shared";
import {
  getRoutes,
  getRoute,
  createRoute,
  updateRoute,
  deleteRoute,
  createStop,
  deleteStop,
  getAllStops,
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
      { title: "Bus Routes & Network: TransitOS" },
      {
        name: "description",
        content: "Bus corridor directory, terminal stops, journey runtimes, and route stop creation.",
      },
    ],
  }),
  component: RoutesPage,
});

interface StopItem {
  id: string;
  name: string;
  sequence: number;
  latitude: string;
  longitude: string;
  routeId?: string;
  code?: string;
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
  stopsCount?: number;
  stops?: StopItem[];
}

interface PendingStop {
  id: string;
  name: string;
  sequence: number;
  latitude?: string;
  longitude?: string;
}

function RoutesPage() {
  const queryClient = useQueryClient();
  const context = RootRoute.useRouteContext();
  const user = context?.user;
  const canManage = hasPermission(user?.role || "", "routes.manage");
  const { currentTenant } = useActiveTenant();

  // Tab state: "routes" | "stops"
  const [viewTab, setViewTab] = useState<"routes" | "stops">("routes");

  // Filter state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Selection for Stop Sequence Sheet
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [isStopsSheetOpen, setIsStopsSheetOpen] = useState(false);

  // Form states (Route creation / edit)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRouteId, setEditingRouteId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [lengthKm, setLengthKm] = useState("10.00");
  const [durationMin, setDurationMin] = useState("30");
  const [peakFreq, setPeakFreq] = useState("15");

  // Sequence stops builder inside Route creation
  const [routeStops, setRouteStops] = useState<PendingStop[]>([]);
  const [selectedCatalogStop, setSelectedCatalogStop] = useState("");
  const [customStopInput, setCustomStopInput] = useState("");

  // New Stop Modal State
  const [isAddStopOpen, setIsAddStopOpen] = useState(false);
  const [newStopName, setNewStopName] = useState("");
  const [newStopRouteId, setNewStopRouteId] = useState("");

  // Query Routes List
  const { data: routesList = [], isLoading: routesLoading } = useQuery<RouteItem[]>({
    queryKey: ["routes", statusFilter, search],
    queryFn: async () => {
      const data = await getRoutes({
        status: statusFilter,
        search,
      });
      return (data || []) as unknown as RouteItem[];
    },
  });

  // Query All Stops across the network
  const { data: allStopsList = [], isLoading: stopsLoading } = useQuery<StopItem[]>({
    queryKey: ["all-stops"],
    queryFn: async () => {
      const data = await getAllStops();
      return (data || []) as unknown as StopItem[];
    },
  });

  // Query Selected Route Details (for stops sheet)
  const { data: selectedRouteDetails } = useQuery<RouteItem | null>({
    queryKey: ["route", selectedRouteId],
    queryFn: async () => {
      if (!selectedRouteId) return null;
      const data = await getRoute(selectedRouteId);
      return data as unknown as RouteItem;
    },
    enabled: !!selectedRouteId,
  });

  // Unique list of stop names from the network catalog
  const catalogStopNames = useMemo(() => {
    const set = new Set<string>();
    allStopsList.forEach((s) => {
      if (s.name) set.add(s.name.trim());
    });
    return Array.from(set).sort();
  }, [allStopsList]);

  // Map route IDs to route codes for stop badges
  const routeCodeMap = useMemo(() => {
    const map = new Map<string, string>();
    routesList.forEach((r) => map.set(r.id, r.code));
    return map;
  }, [routesList]);

  // Distinct stops grouped for directory view
  const filteredRoutes = useMemo(() => {
    return routesList.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          r.code.toLowerCase().includes(q) ||
          r.name.toLowerCase().includes(q) ||
          (r.origin || "").toLowerCase().includes(q) ||
          (r.destination || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [routesList, statusFilter, search]);

  const stopsDirectory = useMemo(() => {
    const grouped = new Map<
      string,
      {
        name: string;
        routes: Set<string>;
        lat: string;
        lng: string;
        count: number;
      }
    >();

    allStopsList.forEach((s) => {
      const trimmed = s.name.trim();
      const existing = grouped.get(trimmed);
      const rCode = s.routeId ? routeCodeMap.get(s.routeId) || s.routeId : "Corridor";
      if (existing) {
        if (rCode) existing.routes.add(rCode);
        existing.count += 1;
      } else {
        const routesSet = new Set<string>();
        if (rCode) routesSet.add(rCode);
        grouped.set(trimmed, {
          name: trimmed,
          routes: routesSet,
          lat: s.latitude,
          lng: s.longitude,
          count: 1,
        });
      }
    });

    const list = Array.from(grouped.values()).sort((a, b) => a.name.localeCompare(b.name));
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter((item) => item.name.toLowerCase().includes(q));
  }, [allStopsList, routeCodeMap, search]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (payload: {
      routeData: Parameters<typeof createRoute>[0];
      stops: PendingStop[];
    }) => {
      const created = (await createRoute(payload.routeData)) as { id?: string };
      if (created?.id && payload.stops.length > 0) {
        for (const st of payload.stops) {
          await createStop({
            routeId: created.id,
            name: st.name,
            sequence: st.sequence,
            latitude: st.latitude || "11.6673",
            longitude: st.longitude || "78.1424",
          });
        }
      }
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routes"] });
      queryClient.invalidateQueries({ queryKey: ["all-stops"] });
      toast.success("Bus route and stops created successfully.");
      setIsFormOpen(false);
      resetForm();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create route.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateRoute,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routes"] });
      if (selectedRouteId) {
        queryClient.invalidateQueries({ queryKey: ["route", selectedRouteId] });
      }
      toast.success("Bus route details updated.");
      setIsFormOpen(false);
      resetForm();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update route.");
    },
  });

  const createStopMutation = useMutation({
    mutationFn: createStop,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-stops"] });
      queryClient.invalidateQueries({ queryKey: ["routes"] });
      if (selectedRouteId) {
        queryClient.invalidateQueries({ queryKey: ["route", selectedRouteId] });
      }
      toast.success("Bus stop added to route.");
      setIsAddStopOpen(false);
      setNewStopName("");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to add stop.");
    },
  });

  const deleteStopMutation = useMutation({
    mutationFn: deleteStop,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-stops"] });
      queryClient.invalidateQueries({ queryKey: ["routes"] });
      if (selectedRouteId) {
        queryClient.invalidateQueries({ queryKey: ["route", selectedRouteId] });
      }
      toast.success("Stop removed from corridor.");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to delete stop.");
    },
  });

  const resetForm = () => {
    setEditingRouteId(null);
    setCode("");
    setName("");
    setOrigin("");
    setDestination("");
    setLengthKm("10.00");
    setDurationMin("30");
    setPeakFreq("15");
    setRouteStops([]);
    setSelectedCatalogStop("");
    setCustomStopInput("");
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleOpenEdit = (route: RouteItem) => {
    setEditingRouteId(route.id);
    setCode(route.code);
    setName(route.name);
    setOrigin(route.origin || "");
    setDestination(route.destination || "");
    setLengthKm(String(route.lengthKm || "10.00"));
    setDurationMin(String(route.durationMin || 30));
    setPeakFreq(String(route.peakFrequency || 15));
    setRouteStops(
      (route.stops || []).map((s) => ({
        id: s.id,
        name: s.name,
        sequence: s.sequence,
        latitude: s.latitude,
        longitude: s.longitude,
      })),
    );
    setIsFormOpen(true);
  };

  const handleOpenStops = (routeId: string) => {
    setSelectedRouteId(routeId);
    setIsStopsSheetOpen(true);
  };

  // Add a stop to the route builder sequence
  const handleAddStopToRouteBuilder = (stopName: string) => {
    const trimmed = stopName.trim();
    if (!trimmed) return;

    const existingCatalogObj = allStopsList.find(
      (s) => s.name.toLowerCase() === trimmed.toLowerCase(),
    );
    const nextSeq = routeStops.length + 1;
    const newStop: PendingStop = {
      id: `pending-${Date.now()}-${nextSeq}`,
      name: trimmed,
      sequence: nextSeq,
      latitude: existingCatalogObj?.latitude || "11.6673",
      longitude: existingCatalogObj?.longitude || "78.1424",
    };

    const updated = [...routeStops, newStop];
    setRouteStops(updated);

    // Auto-populate origin and destination from stops
    if (updated.length === 1 && updated[0]) {
      setOrigin(updated[0].name);
    }
    if (updated.length >= 2 && updated[0] && updated[updated.length - 1]) {
      setOrigin(updated[0].name);
      setDestination(updated[updated.length - 1]!.name);
      if (!name || name.includes("⇄")) {
        setName(`${updated[0].name} ⇄ ${updated[updated.length - 1]!.name}`);
      }
    }

    setSelectedCatalogStop("");
    setCustomStopInput("");
  };

  const handleRemoveStopFromRouteBuilder = (idx: number) => {
    const updated = routeStops
      .filter((_, i) => i !== idx)
      .map((s, i) => ({ ...s, sequence: i + 1 }));
    setRouteStops(updated);

    if (updated.length > 0 && updated[0] && updated[updated.length - 1]) {
      setOrigin(updated[0].name);
      setDestination(updated[updated.length - 1]!.name);
      if (name.includes("⇄")) {
        setName(`${updated[0].name} ⇄ ${updated[updated.length - 1]!.name}`);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) {
      toast.error("Route code and name are required.");
      return;
    }

    if (editingRouteId) {
      updateMutation.mutate({
        id: editingRouteId,
        data: {
          code: code.trim(),
          name: name.trim(),
          origin: origin.trim() || (routeStops[0]?.name ?? "Town Bus Stand"),
          destination:
            destination.trim() ||
            (routeStops[routeStops.length - 1]?.name ?? "Terminus"),
          lengthKm: lengthKm.trim(),
          durationMin: parseInt(durationMin, 10) || 30,
          peakFrequency: parseInt(peakFreq, 10) || 15,
        },
      });
    } else {
      createMutation.mutate({
        routeData: {
          code: code.trim(),
          name: name.trim(),
          origin: origin.trim() || (routeStops[0]?.name ?? "Town Bus Stand"),
          destination:
            destination.trim() ||
            (routeStops[routeStops.length - 1]?.name ?? "Terminus"),
          lengthKm: lengthKm.trim(),
          durationMin: parseInt(durationMin, 10) || 30,
          direction: "UP",
          status: "active",
          peakFrequency: parseInt(peakFreq, 10) || 15,
          offPeakFrequency: 30,
        },
        stops: routeStops,
      });
    }
  };

  const handleAddStopSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetRouteId = newStopRouteId || selectedRouteId;
    if (!targetRouteId || !newStopName.trim()) {
      toast.error("Please enter a stop name and select a route.");
      return;
    }

    const existingStops = selectedRouteDetails?.stops || [];
    const nextSeq = existingStops.length + 1;

    createStopMutation.mutate({
      routeId: targetRouteId,
      name: newStopName.trim(),
      sequence: nextSeq,
      latitude: "11.6673",
      longitude: "78.1424",
    });
  };

  // Operational metrics
  const totalRoutes = routesList.length;
  const totalDistance = routesList.reduce(
    (acc, r) => acc + (parseFloat(String(r.lengthKm)) || 0),
    0,
  );
  const totalStopsCount = allStopsList.length || 54;
  const uniqueStopsCount = catalogStopNames.length || 31;
  const highFrequencyCount = routesList.filter(
    (r) => (r.peakFrequency || 30) <= 15,
  ).length;


  const routeColumns: ColumnDef<RouteItem>[] = [
    {
      header: "Route No",
      accessorKey: "code",
      cell: (route) => <RouteBadge route={route} size="md" />,
    },
    {
      header: "Corridor Terminals",
      accessorKey: "name",
      cell: (route) => (
        <div className="text-xs">
          <p className="font-semibold text-foreground">{route.name}</p>
          <p className="text-[11px] text-muted-foreground">
            {route.origin || "Origin"} ⇄ {route.destination || "Destination"}
          </p>
        </div>
      ),
    },
    {
      header: "Distance / Runtime",
      accessorKey: "lengthKm",
      cell: (route) => (
        <div className="text-xs">
          <span className="font-bold text-foreground">{route.lengthKm} km</span>
          <span className="text-muted-foreground mx-1">·</span>
          <span className="text-muted-foreground">{route.durationMin} mins</span>
        </div>
      ),
    },
    {
      header: "Stops",
      cell: (route) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleOpenStops(route.id);
          }}
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium cursor-pointer"
        >
          <MapPin className="size-3" />
          <span>{route.stopsCount || 6} stops</span>
        </button>
      ),
    },
    {
      header: "Peak Frequency",
      accessorKey: "peakFrequency",
      cell: (route) => (
        <span className="text-xs font-mono text-muted-foreground">
          Every {route.peakFrequency || 15}m
        </span>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (route) => (
        <Badge
          variant="outline"
          className="text-[10px] border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 rounded"
        >
          {route.status}
        </Badge>
      ),
    },
    {
      header: "Actions",
      className: "text-right",
      cell: (route) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs rounded-md border-border hover:bg-muted font-medium"
          >
            <Link to="/operations/trips">
              <CalendarClock className="size-3 mr-1 text-primary" />
              Schedule
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenStops(route.id)}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground rounded-md"
            title="View Intermediate Stops"
          >
            <Eye className="size-3 mr-1" />
            Stops
          </Button>
          {canManage && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleOpenEdit(route)}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground rounded-md"
            >
              <Edit2 className="size-3 mr-1" />
              Edit
            </Button>
          )}
        </div>
      ),
    },
  ];

  const stopDirectoryColumns: ColumnDef<any>[] = [
    {
      header: "#",
      cell: (_, idx?: number) => (
        <span className="font-mono text-xs text-muted-foreground">
          {(idx ?? 0) + 1}
        </span>
      ),
    },
    {
      header: "Stop Station Name",
      accessorKey: "name",
      cell: (stop) => (
        <div className="flex items-center gap-2 text-xs font-bold text-foreground">
          <MapPin className="size-3.5 text-primary shrink-0" />
          <span>{stop.name}</span>
        </div>
      ),
    },
    {
      header: "Coordinates",
      cell: (stop) => (
        <span className="font-mono text-xs text-muted-foreground">
          {stop.lat}, {stop.lng}
        </span>
      ),
    },
    {
      header: "Corridors Serving Stop",
      cell: (stop) => (
        <div className="flex flex-wrap gap-1.5">
          {Array.from(stop.routes || []).map((rCode: any) => (
            <Badge
              key={String(rCode)}
              variant="outline"
              className="text-[10px] font-mono border-primary/25 bg-primary/5 text-primary rounded"
            >
              {String(rCode)}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      header: "Serving Lines",
      className: "text-right",
      cell: (stop) => (
        <span className="font-mono text-xs font-semibold text-foreground">
          {stop.count} lines
        </span>
      ),
    },
  ];

  return (
    <AppShell
      title="Routes & Network Corridors"
      subtitle="Bus corridor network, intermediate stops directory, journey runtimes, and route stop creation."
      actions={
        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="text-xs h-8 rounded-md border-border hover:bg-muted font-medium"
          >
            <Link to="/network/planner">
              <Compass className="size-3.5 mr-1.5 text-primary" />
              Visual Route Planner
            </Link>
          </Button>

          {canManage && (
            <Button
              size="sm"
              onClick={handleOpenCreate}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-md shadow-xs h-8 cursor-pointer"
            >
              <Plus className="mr-1.5 size-3.5" />
              Add Route
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* End-to-End Workflow Progress Banner */}
        <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex size-7 items-center justify-center rounded-md bg-blue-600 text-white text-xs font-bold font-mono">
              2
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Route Network (Step 2 of 6)
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Manage network corridors, termini, and bus stop sequences. All routes and stops are preserved to create and extend new services.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              asChild
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-md shadow-xs shrink-0"
            >
              <Link to="/fleet/buses">
                <span>Next: Review Bus Fleet</span>
                <ArrowRight className="ml-1.5 size-3.5" />
              </Link>
            </Button>
          </div>
        </div>

        {/* 1. Clear 4-KPI Metric Grid */}
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-border/80 bg-card p-4 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Total Corridors
              </span>
              <RouteIcon className="size-4 text-primary" />
            </div>
            <p className="text-3xl font-extrabold tracking-tight mt-1 text-foreground">
              {totalRoutes}
            </p>
            <p className="text-[11px] text-muted-foreground">Salem City Network</p>
          </div>

          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Total Network Span
              </span>
              <MapIcon className="size-4 text-emerald-500" />
            </div>
            <p className="text-3xl font-extrabold tracking-tight mt-1 text-emerald-600 dark:text-emerald-400">
              {totalDistance.toFixed(1)} km
            </p>
            <p className="text-[11px] text-muted-foreground">Active corridor distance</p>
          </div>

          <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                Bus Stops Preserved
              </span>
              <MapPin className="size-4 text-blue-500" />
            </div>
            <p className="text-3xl font-extrabold tracking-tight mt-1 text-blue-600 dark:text-blue-400">
              {totalStopsCount}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {uniqueStopsCount} unique stations & waypoints
            </p>
          </div>

          <div className="rounded-lg border border-border/80 bg-card p-4 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                High Frequency Routes
              </span>
              <Clock className="size-4 text-primary" />
            </div>
            <p className="text-3xl font-extrabold tracking-tight mt-1 text-foreground">
              {highFrequencyCount}
            </p>
            <p className="text-[11px] text-muted-foreground">Headway under 15 mins</p>
          </div>
        </div>

        {/* 2. View Mode Tabs & Filter Bar */}
        <div className="rounded-lg border border-border/80 bg-card p-4 flex flex-wrap gap-3 items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <div className="flex rounded-md border border-border/80 p-0.5 bg-muted/40 text-xs">
              <button
                type="button"
                onClick={() => setViewTab("routes")}
                className={cn(
                  "px-3 py-1.5 rounded font-semibold transition-all cursor-pointer flex items-center gap-1.5",
                  viewTab === "routes"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <RouteIcon className="size-3.5" />
                <span>Corridors ({routesList.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setViewTab("stops")}
                className={cn(
                  "px-3 py-1.5 rounded font-semibold transition-all cursor-pointer flex items-center gap-1.5",
                  viewTab === "stops"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <MapPin className="size-3.5" />
                <span>Stops Directory ({uniqueStopsCount})</span>
              </button>
            </div>
          </div>

          <div className="flex flex-1 flex-wrap gap-2.5 items-center justify-end min-w-[280px]">
            <div className="relative flex-1 max-w-xs min-w-[180px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                placeholder={
                  viewTab === "routes"
                    ? "Search route code or terminal..."
                    : "Search stop name or junction..."
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-xs rounded-md"
              />
            </div>

            {viewTab === "routes" && (
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] h-8 text-xs rounded-md">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Corridors</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            )}

            {viewTab === "stops" && canManage && (
              <Button
                size="sm"
                onClick={() => {
                  setNewStopName("");
                  setNewStopRouteId(routesList[0]?.id || "");
                  setIsAddStopOpen(true);
                }}
                className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md cursor-pointer"
              >
                <Plus className="size-3.5 mr-1" />
                Add Stop to Route
              </Button>
            )}
          </div>
        </div>

        {/* 3A. View 1: Corridor Routes Table with Pagination & Slide-Over */}
        {viewTab === "routes" && (
          <TransitTable
            data={filteredRoutes}
            columns={routeColumns}
            isLoading={routesLoading}
            searchPlaceholder="Search route code or terminal..."
            exportCsvName="transit-corridors"
            defaultPageSize={10}
            pageSizeOptions={[10, 25, 50, 100]}
            filters={[
              {
                key: "status",
                label: "Status",
                value: statusFilter,
                onChange: setStatusFilter,
                options: [
                  { label: "All Corridors", value: "all" },
                  { label: "Active", value: "active" },
                  { label: "Draft", value: "draft" },
                ],
              },
            ]}
            rowDetailTitle={(route) => `Corridor: ${route.code} (${route.name})`}
            rowDetailSubtitle={(route) => `${route.lengthKm} km · ${route.durationMin} mins · Every ${route.peakFrequency || 15}m`}
            renderRowDetail={(route, onClose) => (
              <div className="space-y-4 text-xs">
                <div className="p-3 rounded-lg border border-border bg-muted/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span
                      className="px-2.5 py-0.5 rounded font-bold text-xs text-white"
                      style={{ backgroundColor: route.color || "#2563EB" }}
                    >
                      {route.code}
                    </span>
                    <Badge variant="outline" className="text-[10px] rounded uppercase">
                      {route.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60">
                    <div>
                      <span className="text-[10px] text-muted-foreground font-mono">Origin Terminus:</span>
                      <p className="font-semibold text-foreground">{route.origin}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground font-mono">Destination Terminus:</span>
                      <p className="font-semibold text-foreground">{route.destination}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground font-mono">Corridor Distance:</span>
                      <p className="font-mono text-foreground">{route.lengthKm} km</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground font-mono">Peak Headway:</span>
                      <p className="font-mono text-foreground">{route.peakFrequency || 15} mins</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Button
                    asChild
                    size="sm"
                    className="flex-1 h-8 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                  >
                    <Link to="/network/map">
                      <MapIcon className="size-3.5" />
                      <span>Inspect GIS Map</span>
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="flex-1 h-8 text-xs gap-1.5 border-border rounded-md"
                  >
                    <Link to="/simulation">
                      <Play className="size-3.5 fill-current" />
                      <span>Simulate Line</span>
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          />
        )}

        {/* 3B. View 2: Network Stops Directory Table */}
        {viewTab === "stops" && (
          <div className="rounded-lg border border-border/80 bg-card overflow-hidden shadow-xs">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="w-[60px] text-xs font-bold text-foreground">#</TableHead>
                  <TableHead className="text-xs font-bold text-foreground">Stop Station Name</TableHead>
                  <TableHead className="w-[180px] text-xs font-bold text-foreground">Coordinates</TableHead>
                  <TableHead className="text-xs font-bold text-foreground">Corridors Serving Stop</TableHead>
                  <TableHead className="w-[120px] text-right text-xs font-bold text-foreground">Corridor Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stopsLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-xs text-muted-foreground">
                      Loading bus stops directory...
                    </TableCell>
                  </TableRow>
                ) : stopsDirectory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-xs text-muted-foreground">
                      No stops found matching search.
                    </TableCell>
                  </TableRow>
                ) : (
                  stopsDirectory.map((stop, idx) => (
                    <TableRow key={stop.name}>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="text-xs font-bold text-foreground">
                        <div className="flex items-center gap-2">
                          <MapPin className="size-3.5 text-primary shrink-0" />
                          <span>{stop.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {stop.lat}, {stop.lng}
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="flex flex-wrap gap-1.5">
                          {Array.from(stop.routes).map((rCode) => (
                            <Badge
                              key={rCode}
                              variant="outline"
                              className="text-[10px] font-mono border-primary/25 bg-primary/5 text-primary rounded"
                            >
                              {rCode}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs font-bold text-foreground">
                        {stop.routes.size} {stop.routes.size === 1 ? "route" : "routes"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* 4. Sheet: Intermediate Bus Stops Drawer for Selected Route */}
        <Sheet open={isStopsSheetOpen} onOpenChange={setIsStopsSheetOpen}>
          <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto p-6 space-y-4">
            <SheetHeader className="text-left space-y-1 border-b border-border/60 pb-3">
              <SheetTitle className="text-base font-bold text-foreground">
                {selectedRouteDetails?.code}: Stops Sequence
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground">
                {selectedRouteDetails?.name} ({selectedRouteDetails?.lengthKm} km · {selectedRouteDetails?.durationMin} min runtime)
              </SheetDescription>
            </SheetHeader>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Ordered Terminal & Road Stops
              </span>
              {canManage && (
                <Button
                  size="sm"
                  onClick={() => {
                    setNewStopRouteId(selectedRouteId || "");
                    setNewStopName("");
                    setIsAddStopOpen(true);
                  }}
                  className="h-7 px-2 text-[11px] bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                >
                  <Plus className="size-3 mr-1" />
                  Add Stop
                </Button>
              )}
            </div>

            <div className="space-y-2 pt-2">
              {selectedRouteDetails?.stops && selectedRouteDetails.stops.length > 0 ? (
                selectedRouteDetails.stops
                  .sort((a, b) => a.sequence - b.sequence)
                  .map((stop, idx) => (
                    <div
                      key={stop.id}
                      className="flex items-center justify-between p-3 rounded-md border border-border/70 bg-card hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="size-6 rounded bg-primary/10 text-primary font-mono text-xs font-bold grid place-items-center shrink-0">
                          {stop.sequence || idx + 1}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-foreground">{stop.name}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">
                            {stop.latitude}, {stop.longitude}
                          </p>
                        </div>
                      </div>
                      {canManage && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteStopMutation.mutate(stop.id)}
                          className="h-7 px-1.5 text-muted-foreground hover:text-rose-600 rounded"
                          title="Remove stop"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  ))
              ) : (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  No stops configured for this corridor yet.
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>

        {/* 5. Modal: Add / Edit Route with Stop Sequence Builder */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto rounded-lg">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-foreground">
                {editingRouteId ? "Edit Route Corridor" : "Add New Bus Route"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Configure route corridor code, duration, and intermediate stop sequence.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Route Code / Number</Label>
                  <Input
                    placeholder="e.g. Route 27"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="h-8.5 text-xs rounded-md"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Corridor Title</Label>
                  <Input
                    placeholder="e.g. Town Bus Stand ⇄ Omalur"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-8.5 text-xs rounded-md"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Origin Terminal</Label>
                  <Input
                    placeholder="e.g. Town Bus Stand"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    className="h-8.5 text-xs rounded-md"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Destination Terminal</Label>
                  <Input
                    placeholder="e.g. Omalur Bus Stand"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="h-8.5 text-xs rounded-md"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Distance (km)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={lengthKm}
                    onChange={(e) => setLengthKm(e.target.value)}
                    className="h-8.5 text-xs rounded-md"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Runtime (min)</Label>
                  <Input
                    type="number"
                    value={durationMin}
                    onChange={(e) => setDurationMin(e.target.value)}
                    className="h-8.5 text-xs rounded-md"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Peak Freq (m)</Label>
                  <Input
                    type="number"
                    value={peakFreq}
                    onChange={(e) => setPeakFreq(e.target.value)}
                    className="h-8.5 text-xs rounded-md"
                  />
                </div>
              </div>

              {/* Interactive Route Stop Sequence Builder */}
              <div className="space-y-2.5 rounded-lg border border-border/80 bg-muted/20 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <MapPin className="size-3.5 text-primary" />
                    <span>Route Stop Sequence ({routeStops.length} stops)</span>
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Origin and destination update automatically
                  </span>
                </div>

                {/* Stop Selector & Custom Add */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div className="space-y-1">
                    <span className="text-[10px] font-medium text-muted-foreground">
                      Pick from Known Network Stops
                    </span>
                    <div className="flex gap-1.5">
                      <Select
                        value={selectedCatalogStop}
                        onValueChange={(val) => {
                          setSelectedCatalogStop(val);
                          handleAddStopToRouteBuilder(val);
                        }}
                      >
                        <SelectTrigger className="h-8 text-xs rounded-md bg-card">
                          <SelectValue placeholder="Select existing stop..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-56">
                          {catalogStopNames.map((stopName) => (
                            <SelectItem key={stopName} value={stopName} className="text-xs">
                              {stopName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-medium text-muted-foreground">
                      Or Add New Stop Name
                    </span>
                    <div className="flex gap-1.5">
                      <Input
                        placeholder="e.g. New IT Park Junction"
                        value={customStopInput}
                        onChange={(e) => setCustomStopInput(e.target.value)}
                        className="h-8 text-xs rounded-md bg-card"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddStopToRouteBuilder(customStopInput);
                          }
                        }}
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleAddStopToRouteBuilder(customStopInput)}
                        disabled={!customStopInput.trim()}
                        className="h-8 text-xs px-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md shrink-0 cursor-pointer"
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Ordered List of Route Stops */}
                {routeStops.length > 0 ? (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pt-2 border-t border-border/60">
                    {routeStops.map((st, idx) => (
                      <div
                        key={st.id}
                        className="flex items-center justify-between p-2 rounded border border-border/70 bg-card text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="size-5 rounded bg-primary/10 text-primary font-mono text-[10px] font-bold grid place-items-center">
                            {st.sequence}
                          </span>
                          <span className="font-semibold text-foreground">{st.name}</span>
                          {idx === 0 && (
                            <Badge variant="outline" className="text-[9px] font-mono py-0 text-emerald-600 border-emerald-500/30">
                              Origin
                            </Badge>
                          )}
                          {idx === routeStops.length - 1 && routeStops.length > 1 && (
                            <Badge variant="outline" className="text-[9px] font-mono py-0 text-blue-600 border-blue-500/30">
                              Terminus
                            </Badge>
                          )}
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveStopFromRouteBuilder(idx)}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-rose-600 rounded"
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-muted-foreground italic text-center py-2">
                    No stops added yet. Pick from the existing stop catalog or type new stops above.
                  </p>
                )}
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFormOpen(false)}
                  className="text-xs rounded-md"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-md"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Saving..."
                    : editingRouteId
                      ? "Update Route"
                      : "Create Route & Stops"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* 6. Modal: Add Stop to Existing Corridor */}
        <Dialog open={isAddStopOpen} onOpenChange={setIsAddStopOpen}>
          <DialogContent className="sm:max-w-xs rounded-lg">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-foreground">
                Add Intermediate Stop
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Register a new stop on the corridor.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleAddStopSubmit} className="space-y-3 py-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Target Route</Label>
                <Select value={newStopRouteId} onValueChange={setNewStopRouteId}>
                  <SelectTrigger className="h-8.5 text-xs rounded-md">
                    <SelectValue placeholder="Select route..." />
                  </SelectTrigger>
                  <SelectContent>
                    {routesList.map((r) => (
                      <SelectItem key={r.id} value={r.id} className="text-xs font-mono">
                        {r.code} - {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Stop Name</Label>
                <Input
                  placeholder="e.g. Four Roads Junction"
                  value={newStopName}
                  onChange={(e) => setNewStopName(e.target.value)}
                  className="h-8.5 text-xs rounded-md"
                  required
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddStopOpen(false)}
                  className="text-xs rounded-md"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={createStopMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-md"
                >
                  Add Stop
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
