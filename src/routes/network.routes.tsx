import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
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
} from "@/lib/routes-gis-fns";

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
        content: "Bus corridor directory, terminal stops, journey runtimes and distance metrics.",
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

function RoutesPage() {
  const queryClient = useQueryClient();
  const context = RootRoute.useRouteContext();
  const user = context?.user;
  const canManage = hasPermission(user?.role || "", "routes.manage");

  // Filter state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Selection for Stop Sequence Sheet
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [isStopsSheetOpen, setIsStopsSheetOpen] = useState(false);

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRouteId, setEditingRouteId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [lengthKm, setLengthKm] = useState("10.00");
  const [durationMin, setDurationMin] = useState("30");
  const [peakFreq, setPeakFreq] = useState("15");

  // New Stop Form State
  const [isAddStopOpen, setIsAddStopOpen] = useState(false);
  const [newStopName, setNewStopName] = useState("");

  // Query Routes List
  const { data: routesList = [], isLoading } = useQuery<RouteItem[]>({
    queryKey: ["routes", statusFilter, search],
    queryFn: async () => {
      const data = await getRoutes({
        status: statusFilter,
        search,
      });
      return (data || []) as unknown as RouteItem[];
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

  // Mutations
  const createMutation = useMutation({
    mutationFn: createRoute,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routes"] });
      toast.success("Bus route created successfully.");
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
      if (selectedRouteId) {
        queryClient.invalidateQueries({ queryKey: ["route", selectedRouteId] });
        queryClient.invalidateQueries({ queryKey: ["routes"] });
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
      if (selectedRouteId) {
        queryClient.invalidateQueries({ queryKey: ["route", selectedRouteId] });
        queryClient.invalidateQueries({ queryKey: ["routes"] });
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
    setIsFormOpen(true);
  };

  const handleOpenStops = (routeId: string) => {
    setSelectedRouteId(routeId);
    setIsStopsSheetOpen(true);
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
          origin: origin.trim(),
          destination: destination.trim(),
          lengthKm: lengthKm.trim(),
          durationMin: parseInt(durationMin, 10) || 30,
          peakFrequency: parseInt(peakFreq, 10) || 15,
        },
      });
    } else {
      createMutation.mutate({
        code: code.trim(),
        name: name.trim(),
        origin: origin.trim() || "Town Bus Stand",
        destination: destination.trim() || "Terminus",
        lengthKm: lengthKm.trim(),
        durationMin: parseInt(durationMin, 10) || 30,
        direction: "UP",
        status: "active",
        peakFrequency: parseInt(peakFreq, 10) || 15,
        offPeakFrequency: 30,
      });
    }
  };

  const handleAddStopSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRouteId || !newStopName.trim()) return;
    const existingStops = selectedRouteDetails?.stops || [];
    const nextSeq = existingStops.length + 1;

    createStopMutation.mutate({
      routeId: selectedRouteId,
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
  const totalStops = routesList.reduce(
    (acc, r) => acc + (r.stopsCount || 0),
    0,
  );
  const highFrequencyCount = routesList.filter(
    (r) => (r.peakFrequency || 30) <= 15,
  ).length;

  return (
    <AppShell
      title="Routes & Network Corridors"
      subtitle="Bus corridor network, intermediate stops, journey runtimes, and terminal locations."
      actions={
        canManage ? (
          <Button
            size="sm"
            onClick={handleOpenCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-md shadow-xs cursor-pointer"
          >
            <Plus className="mr-1.5 size-3.5" />
            Add Route
          </Button>
        ) : undefined
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
                Review active Salem corridors and bus stop sequences. Once routes are verified, check bus fleet.
              </p>
            </div>
          </div>
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
                Bus Stops Configured
              </span>
              <MapPin className="size-4 text-blue-500" />
            </div>
            <p className="text-3xl font-extrabold tracking-tight mt-1 text-blue-600 dark:text-blue-400">
              {totalStops || 54}
            </p>
            <p className="text-[11px] text-muted-foreground">Terminals & waypoints</p>
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

        {/* 2. Filter Bar */}
        <div className="rounded-lg border border-border/80 bg-card p-4 flex flex-wrap gap-3 items-center justify-between shadow-xs">
          <div className="flex flex-1 flex-wrap gap-2.5 items-center min-w-[280px]">
            <div className="relative flex-1 max-w-xs min-w-[180px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Search route code or terminal..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-xs rounded-md"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px] h-8 text-xs rounded-md">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Corridors</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <span className="text-xs text-muted-foreground">
            Total: <span className="font-bold text-foreground">{routesList.length}</span> routes
          </span>
        </div>

        {/* 3. Routes Table */}
        <div className="rounded-lg border border-border/80 bg-card overflow-hidden shadow-xs">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-[120px] text-xs font-bold text-foreground">Route No</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Corridor Terminals</TableHead>
                <TableHead className="w-[150px] text-xs font-bold text-foreground">Distance / Runtime</TableHead>
                <TableHead className="w-[110px] text-xs font-bold text-foreground">Stops</TableHead>
                <TableHead className="w-[140px] text-xs font-bold text-foreground">Peak Frequency</TableHead>
                <TableHead className="w-[100px] text-xs font-bold text-foreground">Status</TableHead>
                <TableHead className="w-[200px] text-right text-xs font-bold text-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-xs text-muted-foreground">
                    Loading route network...
                  </TableCell>
                </TableRow>
              ) : routesList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-xs text-muted-foreground">
                    No routes found matching filter.
                  </TableCell>
                </TableRow>
              ) : (
                routesList.map((route) => (
                  <TableRow key={route.id}>
                    <TableCell className="font-mono text-xs font-bold text-foreground">
                      {route.code}
                    </TableCell>
                    <TableCell className="text-xs">
                      <p className="font-semibold text-foreground">{route.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {route.origin || "Origin"} ⇄ {route.destination || "Destination"}
                      </p>
                    </TableCell>
                    <TableCell className="text-xs">
                      <span className="font-bold text-foreground">{route.lengthKm} km</span>
                      <span className="text-muted-foreground mx-1">·</span>
                      <span className="text-muted-foreground">{route.durationMin} mins</span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <button
                        onClick={() => handleOpenStops(route.id)}
                        className="inline-flex items-center gap-1 text-primary hover:underline font-medium cursor-pointer"
                      >
                        <MapPin className="size-3" />
                        <span>{route.stopsCount || 6} stops</span>
                      </button>
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      Every {route.peakFrequency || 15}m
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="text-[10px] border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 rounded"
                      >
                        {route.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
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
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* 4. Sheet: Intermediate Bus Stops Drawer */}
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
                  onClick={() => setIsAddStopOpen(true)}
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

        {/* 5. Modal: Add / Edit Route */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="sm:max-w-md rounded-lg">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-foreground">
                {editingRouteId ? "Edit Route Corridor" : "Add New Bus Route"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Configure route corridor terminals, length, and runtime duration.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-3.5 py-2">
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
                <Label className="text-xs font-semibold">Corridor Description</Label>
                <Input
                  placeholder="e.g. Town Bus Stand ⇄ Omalur Bus Stand"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-8.5 text-xs rounded-md"
                  required
                />
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
                  {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save Route"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* 6. Modal: Add Stop */}
        <Dialog open={isAddStopOpen} onOpenChange={setIsAddStopOpen}>
          <DialogContent className="sm:max-w-xs rounded-lg">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-foreground">
                Add Intermediate Stop
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Enter stop or waypoint name.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleAddStopSubmit} className="space-y-3 py-2">
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
