import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useRef, useEffect } from "react";
import {
  Bus,
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Wrench,
  Calendar,
  MapPin,
  Check,
  AlertOctagon,
  ArrowRight,
  Plus,
  ShieldCheck,
  Info,
  ChevronRight,
  ShieldAlert,
  Radio,
  Navigation,
  Signal,
  Eye,
  Activity,
  Filter,
  CheckCheck,
  UserCheck,
  RotateCcw,
  Smartphone,
  Send,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { ServiceDatePicker } from "@/components/ui/service-date-picker";
import { TransitTable, ColumnDef } from "@/components/ui/transit-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { hasPermission } from "@/lib/auth-shared";
import { useActiveTenant } from "@/lib/tenant-context";
import { useTheme } from "@/components/theme-provider";
import { RouteBadge, formatRouteNumber, formatRouteName } from "@/lib/route-utils";
import { getDrivers, getBuses } from "@/lib/fleet-crew";
import {
  getLiveBusTracking,
  ingestVehicleTelemetry,
  LiveTrackedBus,
} from "@/lib/telemetry-fns";
import {
  getLiveTrackingAssignments,
  getOperationalIssues,
  reportOperationalProblem,
  approveIssueRecommendation,
  rejectIssueRecommendation,
  recommendConductorForTrip,
  assignConductorToTrip,
  bulkAssignConductors,
  bulkAssignFleetAndCrew,
  retryIssueAnalysis,
  markIssueManuallyResolved,
  ProblemCategory,
  OperationalIssue,
  SolutionOption,
} from "@/lib/scheduling-fns";
import { cn, formatMinutesToTime } from "@/lib/utils";
import {
  getTodayIndianDate,
  formatToIndianDate,
  formatMinutesTo12Hour,
  formatDurationHuman,
} from "@/lib/date-time-utils";
import { toast } from "sonner";

export const Route = createFileRoute("/operations/today")({
  beforeLoad: ({ context }) => {
    if (!context.user) {
      throw redirect({ to: "/login" });
    }
  },
  head: () => ({
    meta: [
      { title: "Live Tracking: TransitOS" },
      {
        name: "description",
        content:
          "Operational monitoring of live bus tracking, vehicle assignments, conductor staffing, and automated issue resolution.",
      },
    ],
  }),
  component: OperationsTodayPage,
});

const DEFAULT_SERVICE_DATE = getTodayIndianDate();

interface LiveTrackingAssignment {
  id: string;
  tripId: string;
  tripCode: string;
  routeId: string;
  routeCode: string;
  routeName: string;
  origin: string;
  destination: string;
  direction: string;
  startTime: number;
  endTime: number;
  durationMin: number;
  serviceDate: string;
  dutyId: string | null;
  dutyCode: string | null;
  busId: string | null;
  busRegNumber: string;
  busType: string;
  busStatus: string;
  busDepot: string;
  driverId: string | null;
  driverName: string;
  driverStatus: string;
  conductorId: string | null;
  conductorName: string;
  conductorStatus: string;
  conductorAssigned?: boolean;
  driverAssigned?: boolean;
  busAssigned?: boolean;
  status: "active" | "scheduled" | "conflicted" | "unassigned";
  conflicts: any[];
}

const TILE_LAYERS = {
  standard: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
    subdomains: ["a", "b", "c"],
  },
  dark: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    attribution:
      'Tiles &copy; <a href="https://www.esri.com" target="_blank" rel="noreferrer">Esri</a>, HERE, Garmin, &copy; OpenStreetMap contributors',
  },
};

function OperationsTodayPage() {
  const queryClient = useQueryClient();
  const { currentTenant } = useActiveTenant();
  const { resolvedTheme } = useTheme();

  const [serviceDate, setServiceDate] = useState("25 Aug 2026");
  const [assignmentStatusFilter, setAssignmentStatusFilter] = useState<string>("all");
  const [assignmentDepotFilter, setAssignmentDepotFilter] = useState<string>("all");
  const [mapRouteFilter, setMapRouteFilter] = useState<string>("all");
  const [mapDepotFilter, setMapDepotFilter] = useState<string>("all");
  const [mapStatusFilter, setMapStatusFilter] = useState<string>("all");
  const [mapSearchQuery, setMapSearchQuery] = useState<string>("");
  const [isSimulatingMovements, setIsSimulatingMovements] = useState(true);

  const [issuesTab, setIssuesTab] = useState<
    "needs_review" | "manual" | "resolved" | "all"
  >("needs_review");

  // Selected Bus for Map Inspection
  const [selectedTrackedBus, setSelectedTrackedBus] = useState<LiveTrackedBus | null>(null);

  // Problem Reporting Dialog State
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportCategory, setReportCategory] = useState<ProblemCategory>("BUS_BREAKDOWN");
  const [reportTripId, setReportTripId] = useState<string>("");
  const [reportBusId, setReportBusId] = useState<string>("");
  const [reportDescription, setReportDescription] = useState<string>("");

  // Slide-over Diagnostic Review Drawer State
  const [reviewSheetOpen, setReviewSheetOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<OperationalIssue | null>(null);
  const [selectedSolutionId, setSelectedSolutionId] = useState<string>("");
  const [dispatchNotes, setDispatchNotes] = useState<string>("");
  const [resolutionActionType, setResolutionActionType] = useState<"driver" | "bus" | "recommendation">("driver");
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  const [selectedBusId, setSelectedBusId] = useState<string>("");
  const [showOnlyMovingBuses, setShowOnlyMovingBuses] = useState(false);

  // Conductor Recommendation Drawer State
  const [conductorDrawerOpen, setConductorDrawerOpen] = useState(false);
  const [selectedTripForConductor, setSelectedTripForConductor] = useState<LiveTrackingAssignment | null>(null);

  // Driver Mobile Check-in Dialog State
  const [driverCheckinOpen, setDriverCheckinOpen] = useState(false);
  const [checkinBusReg, setCheckinBusReg] = useState<string>("");
  const [transmittingGps, setTransmittingGps] = useState(false);
  const [lastTransmittedCoords, setLastTransmittedCoords] = useState<{
    lat: number;
    lng: number;
    speed: number;
    accuracy?: number;
    time: string;
  } | null>(null);

  // Manual Resolution Dialog State
  const [manualResolveDialogOpen, setManualResolveDialogOpen] = useState(false);
  const [manualResolveNotes, setManualResolveNotes] = useState("");
  const [targetManualIssueId, setTargetManualIssueId] = useState<string>("");

  // ========================================================
  // 1. DATA QUERIES
  // ========================================================

  // Fetch Live Bus Tracking Telemetry
  const {
    data: trackingData,
    isLoading: loadingTracking,
    isRefetching: refetchingTracking,
    refetch: refetchTracking,
  } = useQuery({
    queryKey: [
      "live-bus-tracking",
      currentTenant.id,
      serviceDate,
      mapDepotFilter,
      mapRouteFilter,
      mapStatusFilter,
    ],
    queryFn: () =>
      getLiveBusTracking({
        serviceDate,
        depot: mapDepotFilter !== "all" ? mapDepotFilter : undefined,
        routeCode: mapRouteFilter !== "all" ? mapRouteFilter : undefined,
        statusFilter: mapStatusFilter !== "all" ? mapStatusFilter : undefined,
      }),
    refetchInterval: isSimulatingMovements ? 3000 : false, // Smooth live movement tick every 3s
  });

  const trackedBuses: LiveTrackedBus[] = useMemo(
    () => trackingData?.buses || [],
    [trackingData?.buses],
  );

  const routesGeojson = useMemo(
    () => trackingData?.routesGeojson || [],
    [trackingData?.routesGeojson],
  );

  const trackingSummary = trackingData?.summary || {
    totalBuses: 0,
    liveTracked: 0,
    delayedBuses: 0,
    onTimeBuses: 0,
    stationaryBuses: 0,
    untrackedBuses: 0,
  };

  // Filter tracked buses for search query and moving status
  const filteredTrackedBuses = useMemo(() => {
    let result = trackedBuses;
    if (showOnlyMovingBuses) {
      result = result.filter(
        (b) =>
          b.hasActiveSos ||
          (b.speedKmH ?? 0) > 0 ||
          b.delayStatus === "ON_TIME" ||
          b.delayStatus === "DELAYED",
      );
    }
    if (!mapSearchQuery.trim()) return result;
    const q = mapSearchQuery.toLowerCase();
    return result.filter(
      (b) =>
        b.busRegNumber.toLowerCase().includes(q) ||
        (b.routeCode && b.routeCode.toLowerCase().includes(q)) ||
        (b.driverName && b.driverName.toLowerCase().includes(q)) ||
        (b.nextStopName && b.nextStopName.toLowerCase().includes(q)),
    );
  }, [trackedBuses, mapSearchQuery, showOnlyMovingBuses]);

  // Fetch available drivers & buses for supervisor reassignment
  const { data: driversList = [] } = useQuery({
    queryKey: ["drivers-list", currentTenant.id],
    queryFn: () => getDrivers(),
  });

  const { data: busesList = [] } = useQuery({
    queryKey: ["buses-list", currentTenant.id],
    queryFn: () => getBuses(),
  });

  // Fetch Live Tracking Assignments Table Data
  const {
    data: liveData,
    isLoading: loadingAssignments,
    isRefetching: refetchingAssignments,
    refetch: refetchAssignments,
  } = useQuery({
    queryKey: ["live-tracking-assignments", currentTenant.id, serviceDate],
    queryFn: () => getLiveTrackingAssignments({ serviceDate }),
    refetchInterval: 15000,
  });

  const assignments: LiveTrackingAssignment[] = useMemo(
    () => (liveData?.assignments as LiveTrackingAssignment[]) || [],
    [liveData?.assignments],
  );

  const assignmentSummary = liveData?.summary || {
    totalTrips: 0,
    activeAssignments: 0,
    conflictedAssignments: 0,
    unassignedTrips: 0,
    unassignedConductors: 0,
    unassignedDrivers: 0,
    unassignedBuses: 0,
    availableBuses: 0,
    availableDrivers: 0,
    availableConductors: 0,
  };

  // Fetch Operational Issues & Diagnostic Recommendations
  const {
    data: issuesData,
    isLoading: loadingIssues,
    refetch: refetchIssues,
  } = useQuery({
    queryKey: ["operational-issues", currentTenant.id, serviceDate],
    queryFn: () => getOperationalIssues({ serviceDate }),
    refetchInterval: 15000,
  });

  // Critical Crew SOS Issues
  const activeCrewSosIssues = useMemo(() => {
    return (issuesData?.issues || []).filter(
      (iss) =>
        (iss.category === "CREW_SOS" || iss.urgency === "CRITICAL") &&
        iss.lifecycleStatus !== "RESOLVED" &&
        iss.lifecycleStatus !== "AUTOMATICALLY_RESOLVED",
    );
  }, [issuesData?.issues]);

  const issues: OperationalIssue[] = useMemo(
    () => issuesData?.issues || [],
    [issuesData?.issues],
  );

  const issuesSummary = issuesData?.summary || {
    total: 0,
    active: 0,
    awaitingApproval: 0,
    awaitingManual: 0,
    autoResolved: 0,
    resolved: 0,
  };

  // Conductor Recommendation Query
  const {
    data: conductorRecData,
    isLoading: loadingConductorRec,
    refetch: refetchConductorRec,
  } = useQuery({
    queryKey: [
      "recommend-conductor",
      currentTenant.id,
      selectedTripForConductor?.tripId,
      serviceDate,
    ],
    queryFn: () => {
      if (!selectedTripForConductor?.tripId) return null;
      return recommendConductorForTrip({
        tripId: selectedTripForConductor.tripId,
        serviceDate,
      });
    },
    enabled: Boolean(selectedTripForConductor?.tripId && conductorDrawerOpen),
  });

  // ========================================================
  // 2. MUTATIONS
  // ========================================================

  // Report Problem Mutation
  const reportMutation = useMutation({
    mutationFn: async () => {
      if (!reportDescription.trim()) {
        throw new Error("Please describe the operational problem.");
      }
      return await reportOperationalProblem({
        tripId: reportTripId || undefined,
        busId: reportBusId || undefined,
        category: reportCategory,
        description: reportDescription.trim(),
        serviceDate,
      });
    },
    onSuccess: (res) => {
      toast.success(
        res.message || "Problem logged. Intelligent investigation complete.",
      );
      queryClient.invalidateQueries({ queryKey: ["operational-issues"] });
      queryClient.invalidateQueries({ queryKey: ["live-tracking-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["live-bus-tracking"] });
      setReportDialogOpen(false);
      setReportDescription("");
      setReportTripId("");
      setReportBusId("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to log operational problem.");
    },
  });

  // Approve Recommendation & Dispatch Mutation
  const approveMutation = useMutation({
    mutationFn: async (vars: {
      issueId: string;
      solutionId?: string;
      dispatchNotes?: string;
      overrideDriverId?: string;
      overrideBusId?: string;
      overrideConductorId?: string;
    }) => {
      return await approveIssueRecommendation(vars);
    },
    onSuccess: (res) => {
      toast.success(res.message);
      queryClient.invalidateQueries({ queryKey: ["operational-issues"] });
      queryClient.invalidateQueries({ queryKey: ["live-tracking-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["live-bus-tracking"] });
      setReviewSheetOpen(false);
      setSelectedIssue(null);
      setDispatchNotes("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to approve recommendation.");
    },
  });

  // Reject Recommendation Mutation
  const rejectMutation = useMutation({
    mutationFn: async (vars: { issueId: string; reason?: string }) => {
      return await rejectIssueRecommendation(vars);
    },
    onSuccess: (res) => {
      toast.success(res.message);
      queryClient.invalidateQueries({ queryKey: ["operational-issues"] });
      setReviewSheetOpen(false);
      setSelectedIssue(null);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to reject recommendation.");
    },
  });

  // Conductor Direct Assignment Mutation
  const assignConductorMutation = useMutation({
    mutationFn: async (vars: { tripId: string; dutyId?: string | undefined; conductorId: string }) => {
      return await assignConductorToTrip({
        ...vars,
        serviceDate,
      });
    },
    onSuccess: (res) => {
      toast.success(res.message || "Conductor successfully assigned.");
      queryClient.invalidateQueries({ queryKey: ["live-tracking-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["operational-issues"] });
      queryClient.invalidateQueries({ queryKey: ["live-bus-tracking"] });
      setConductorDrawerOpen(false);
      setSelectedTripForConductor(null);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to assign conductor.");
    },
  });

  // Bulk Conductor Assignment Mutation
  const bulkConductorMutation = useMutation({
    mutationFn: async () => {
      return await bulkAssignConductors({
        serviceDate,
        depot: mapDepotFilter !== "all" ? mapDepotFilter : undefined,
      });
    },
    onSuccess: (res) => {
      if (res.assignedCount > 0) {
        toast.success(
          `Bulk assignment completed: ${res.assignedCount} trip(s) assigned conductors without conflicts.`,
        );
      } else {
        toast.info(
          res.unassignedRemaining > 0
            ? "No additional eligible conductors available matching non-overlap constraints."
            : "All scheduled trips already have assigned conductors.",
        );
      }
      queryClient.invalidateQueries({ queryKey: ["live-tracking-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["operational-issues"] });
      queryClient.invalidateQueries({ queryKey: ["live-bus-tracking"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Bulk conductor assignment failed.");
    },
  });

  // Bulk Fleet & Crew Full Auto-Assignment Mutation
  const bulkFleetCrewMutation = useMutation({
    mutationFn: async () => {
      return await bulkAssignFleetAndCrew({
        serviceDate,
        depot: mapDepotFilter !== "all" ? mapDepotFilter : undefined,
      });
    },
    onSuccess: (res) => {
      toast.success(res.message || "Full fleet & crew auto-assignment complete.");
      queryClient.invalidateQueries({ queryKey: ["live-tracking-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["operational-issues"] });
      queryClient.invalidateQueries({ queryKey: ["live-bus-tracking"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Fleet and crew auto-assignment failed.");
    },
  });

  // Retry Issue Analysis Mutation
  const retryAnalysisMutation = useMutation({
    mutationFn: async (issueId: string) => {
      return await retryIssueAnalysis({ issueId });
    },
    onSuccess: () => {
      toast.success("Schedule engine re-analyzed operational issue.");
      queryClient.invalidateQueries({ queryKey: ["operational-issues"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Re-analysis failed.");
    },
  });

  // Mark Manually Resolved Mutation
  const markManuallyResolvedMutation = useMutation({
    mutationFn: async (vars: { issueId: string; resolutionNotes: string }) => {
      return await markIssueManuallyResolved(vars);
    },
    onSuccess: () => {
      toast.success("Issue marked as manually resolved by supervisor.");
      queryClient.invalidateQueries({ queryKey: ["operational-issues"] });
      queryClient.invalidateQueries({ queryKey: ["live-tracking-assignments"] });
      setManualResolveDialogOpen(false);
      setManualResolveNotes("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update resolution status.");
    },
  });

  // Telemetry Ingestion Mutation (Driver Mobile Web Check-in)
  const telemetryMutation = useMutation({
    mutationFn: async (input: {
      busRegNumber: string;
      latitude: number;
      longitude: number;
      speedKmH: number;
      accuracyMeters?: number;
      source: "DRIVER_MOBILE" | "AVL_GATEWAY";
    }) => {
      return await ingestVehicleTelemetry(input);
    },
    onSuccess: (res) => {
      toast.success(res.message);
      queryClient.invalidateQueries({ queryKey: ["live-bus-tracking"] });
      queryClient.invalidateQueries({ queryKey: ["live-tracking-assignments"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to ingest telemetry.");
    },
  });

  // ========================================================
  // 3. LEAFLET MAP INTEGRATION
  // ========================================================
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [L, setL] = useState<any>(null);
  const markersLayerGroupRef = useRef<any>(null);
  const polylinesLayerGroupRef = useRef<any>(null);
  const activeTileLayerRef = useRef<any>(null);

  // Dynamic Leaflet import to prevent SSR errors
  useEffect(() => {
    if (typeof window !== "undefined") {
      import("leaflet").then((mod) => {
        setL(mod.default);
      });
    }
  }, []);

  // Map Center Coordinates
  const defaultCenter = useMemo(() => {
    if (currentTenant.id.startsWith("69000000")) {
      return [13.045, 80.24] as [number, number]; // Chennai Central
    }
    return [11.6643, 78.146] as [number, number]; // Salem
  }, [currentTenant.id]);

  const defaultZoom = currentTenant.id.startsWith("69000000") ? 12 : 13;

  // Initialize Leaflet Map
  useEffect(() => {
    if (!L || !mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: defaultZoom,
        zoomControl: false,
      });

      L.control.zoom({ position: "bottomright" }).addTo(map);

      const tileConfig = resolvedTheme === "dark" ? TILE_LAYERS.dark : TILE_LAYERS.standard;
      activeTileLayerRef.current = L.tileLayer(tileConfig.url, {
        attribution: tileConfig.attribution,
        subdomains: (tileConfig as any).subdomains || ["a", "b", "c"],
        maxZoom: 19,
      }).addTo(map);

      polylinesLayerGroupRef.current = L.layerGroup().addTo(map);
      markersLayerGroupRef.current = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [L, defaultCenter, defaultZoom]);

  // Update Tile Layer on Theme Change
  useEffect(() => {
    if (!mapInstanceRef.current || !L) return;
    if (activeTileLayerRef.current) {
      mapInstanceRef.current.removeLayer(activeTileLayerRef.current);
    }
    const tileConfig = resolvedTheme === "dark" ? TILE_LAYERS.dark : TILE_LAYERS.standard;
    activeTileLayerRef.current = L.tileLayer(tileConfig.url, {
      attribution: tileConfig.attribution,
      subdomains: (tileConfig as any).subdomains || ["a", "b", "c"],
      maxZoom: 19,
    }).addTo(mapInstanceRef.current);
  }, [resolvedTheme, L]);

  // Render Route Polylines
  useEffect(() => {
    if (!mapInstanceRef.current || !L || !polylinesLayerGroupRef.current) return;
    polylinesLayerGroupRef.current.clearLayers();

    routesGeojson.forEach((r) => {
      if (mapRouteFilter !== "all" && r.routeCode !== mapRouteFilter) return;

      const latLngs = r.coordinates.map((c: [number, number]) => [c[1], c[0]]);
      if (latLngs.length > 0) {
        const polyline = L.polyline(latLngs, {
          color: r.color || "#2563eb",
          weight: 4,
          opacity: mapRouteFilter === "all" ? 0.45 : 0.85,
          dashArray: mapRouteFilter === "all" ? "6, 6" : undefined,
        });

        polyline.bindTooltip(
          `<strong>${r.routeCode}</strong>: ${r.routeName}`,
          { sticky: true, className: "text-xs font-mono" },
        );

        polyline.addTo(polylinesLayerGroupRef.current);
      }
    });
  }, [routesGeojson, mapRouteFilter, L]);

  // Render Real Bus Location Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !L || !markersLayerGroupRef.current) return;
    markersLayerGroupRef.current.clearLayers();

    filteredTrackedBuses.forEach((b) => {
      // Only plot buses with actual coordinates
      if (b.latitude === null || b.longitude === null) return;

      const isSos = Boolean(b.hasActiveSos);
      const isOnTime = !isSos && b.delayStatus === "ON_TIME";
      const isDelayed = !isSos && b.delayStatus === "DELAYED";
      const isStationary = !isSos && b.delayStatus === "STATIONARY";

      const bgClass = isSos
        ? "bg-rose-600 text-white border-rose-300 ring-2 ring-rose-500 animate-pulse font-bold"
        : isOnTime
          ? "bg-emerald-600 text-white border-emerald-400"
          : isDelayed
            ? "bg-amber-600 text-white border-amber-400"
            : isStationary
              ? "bg-blue-600 text-white border-blue-400"
              : "bg-slate-600 text-white border-slate-400";

      const pingColor = isSos
        ? "bg-rose-400"
        : isOnTime
          ? "bg-emerald-400"
          : isDelayed
            ? "bg-amber-400"
            : "bg-blue-400";

      const labelText = isSos ? "SOS" : (b.routeCode || "BUS");

      const html = `
        <div class="relative group cursor-pointer transition-transform hover:scale-110">
          ${
            b.isLive
              ? `<span class="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-sm ${pingColor} opacity-75"></span>
                  <span class="relative inline-flex rounded-sm h-2.5 w-2.5 ${pingColor}"></span>
                </span>`
              : ""
          }
          <div class="px-2 py-1 rounded-md text-[10px] font-bold font-mono shadow-md border flex items-center gap-1.5 ${bgClass}">
            <span>${labelText}</span>
            <span class="opacity-80">·</span>
            <span class="text-[9px] font-sans font-medium">${b.busRegNumber.slice(-4)}</span>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: "custom-bus-marker",
        html,
        iconSize: [68, 26],
        iconAnchor: [34, 13],
      });

      const marker = L.marker([b.latitude, b.longitude], {
        icon: customIcon,
      });

      marker.on("click", () => {
        setSelectedTrackedBus(b);
      });

      marker.bindTooltip(
        `<div class="p-1 space-y-0.5 font-sans">
          ${isSos ? '<div class="text-[10px] font-bold font-mono bg-rose-600 text-white px-1.5 py-0.5 rounded-sm uppercase inline-block mb-0.5">CRITICAL CREW SOS ACTIVE</div>' : ""}
          <div class="font-bold text-xs flex items-center gap-1.5">
            <span>${b.busRegNumber}</span>
            <span class="text-[10px] px-1 py-0 rounded bg-muted font-mono font-normal">Route ${b.routeCode}</span>
          </div>
          <div class="text-[11px] text-muted-foreground">${b.routeName || b.origin + " to " + b.destination}</div>
          <div class="text-[10px] font-mono text-emerald-600 font-semibold">${b.speedKmH} km/h · ${b.lastUpdatedAgo || "Just now"}</div>
          <div class="text-[10px] text-muted-foreground">Pilot: ${b.driverName || "Driver Assigned"}</div>
        </div>`,
        { direction: "top", offset: [0, -10] },
      );

      marker.addTo(markersLayerGroupRef.current);
    });
  }, [filteredTrackedBuses, L]);

  // Center on Selected Bus
  const handleInspectBus = (bus: LiveTrackedBus) => {
    setSelectedTrackedBus(bus);
    if (
      mapInstanceRef.current &&
      bus.latitude !== null &&
      bus.longitude !== null
    ) {
      mapInstanceRef.current.setView([bus.latitude, bus.longitude], 15, {
        animate: true,
      });
    }
  };

  // Transmit Device Geolocation (Driver Mobile Check-in)
  const handleTransmitDeviceGps = (targetBusReg: string) => {
    if (!targetBusReg) {
      toast.error("Please enter or select a vehicle registration number.");
      return;
    }
    if (typeof window === "undefined" || !navigator.geolocation) {
      toast.error("Geolocation is not supported by your current browser environment.");
      return;
    }

    setTransmittingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, speed, accuracy } = pos.coords;
        const speedKmH = speed ? Math.round(speed * 3.6) : 28; // Default urban transit speed

        telemetryMutation.mutate(
          {
            busRegNumber: targetBusReg,
            latitude,
            longitude,
            speedKmH,
            accuracyMeters: accuracy || 10,
            source: "DRIVER_MOBILE",
          },
          {
            onSuccess: () => {
              setTransmittingGps(false);
              setLastTransmittedCoords({
                lat: latitude,
                lng: longitude,
                speed: speedKmH,
                accuracy: Math.round(accuracy || 10),
                time: new Date().toLocaleTimeString(),
              });
            },
            onError: () => {
              setTransmittingGps(false);
            },
          },
        );
      },
      (err) => {
        setTransmittingGps(false);
        toast.error(`Geolocation permission denied or timed out: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  // Sample Terminal Ping (Fallback without requiring device GPS permissions)
  const handleSampleTerminalPing = (
    targetBusReg: string,
    terminal: "broadway" | "cmbt" | "siruseri",
  ) => {
    if (!targetBusReg) {
      toast.error("Please select a vehicle registration number.");
      return;
    }

    const terminals = {
      broadway: { lat: 13.088, lng: 80.285, speed: 18 },
      cmbt: { lat: 13.068, lng: 80.205, speed: 22 },
      siruseri: { lat: 12.825, lng: 80.222, speed: 36 },
    };
    const t = terminals[terminal];

    telemetryMutation.mutate(
      {
        busRegNumber: targetBusReg,
        latitude: t.lat,
        longitude: t.lng,
        speedKmH: t.speed,
        accuracyMeters: 8,
        source: "AVL_GATEWAY",
      },
      {
        onSuccess: () => {
          setLastTransmittedCoords({
            lat: t.lat,
            lng: t.lng,
            speed: t.speed,
            accuracy: 8,
            time: new Date().toLocaleTimeString(),
          });
        },
      },
    );
  };

  // Filter Issues
  const filteredIssues = useMemo(() => {
    return issues.filter((iss) => {
      if (issuesTab === "needs_review") {
        return (
          iss.lifecycleStatus === "AWAITING_APPROVAL" ||
          iss.lifecycleStatus === "RECOMMENDATION_READY"
        );
      }
      if (issuesTab === "manual") {
        return iss.lifecycleStatus === "AWAITING_MANUAL_INTERVENTION";
      }
      if (issuesTab === "resolved") {
        return (
          iss.lifecycleStatus === "RESOLVED" ||
          iss.lifecycleStatus === "AUTOMATICALLY_RESOLVED"
        );
      }
      return true;
    });
  }, [issues, issuesTab]);

  // Filter Assignments
  const filteredAssignments = useMemo(() => {
    return assignments.filter((item) => {
      // Depot Filter
      if (
        assignmentDepotFilter !== "all" &&
        item.busDepot.toLowerCase() !== assignmentDepotFilter.toLowerCase()
      ) {
        return false;
      }

      // Status Filter
      if (assignmentStatusFilter === "all") return true;
      if (assignmentStatusFilter === "staffed") {
        return (
          Boolean(item.busId) &&
          Boolean(item.driverId) &&
          Boolean(item.conductorId) &&
          (!item.conflicts || item.conflicts.length === 0)
        );
      }
      if (assignmentStatusFilter === "conflicted") {
        return item.status === "conflicted" || (item.conflicts && item.conflicts.length > 0);
      }
      if (assignmentStatusFilter === "missing_conductor") {
        return !item.conductorId || item.conductorName === "Unassigned";
      }
      if (assignmentStatusFilter === "unassigned_bus_driver") {
        return (
          !item.busId ||
          !item.driverId ||
          item.busRegNumber === "Unassigned" ||
          item.driverName === "Unassigned"
        );
      }
      return true;
    });
  }, [assignments, assignmentStatusFilter, assignmentDepotFilter]);

  // Open Issue Review Drawer
  const handleOpenReview = (issue: OperationalIssue) => {
    setSelectedIssue(issue);
    setSelectedSolutionId(issue.bestSolution?.id || "");

    if (
      issue.category === "CREW_SOS" ||
      issue.category === "DRIVER_UNAVAILABLE" ||
      issue.category === "MISSING_DRIVER"
    ) {
      setResolutionActionType("driver");
    } else if (
      issue.category === "BUS_BREAKDOWN" ||
      issue.category === "UNASSIGNED_BUS"
    ) {
      setResolutionActionType("bus");
    } else {
      setResolutionActionType("driver");
    }

    // Pre-select replacement driver: match suggested ID, name, or pick next available relief driver
    const recDriverId = issue.bestSolution?.replacementDriverId;
    const recDriverName = (issue.bestSolution?.replacementDriverName || "").toLowerCase().replace(/\s*\(.*?\)/g, "").trim();
    
    let matchedDriverId = "";
    if (recDriverId && driversList.some((d: any) => d.id === recDriverId)) {
      matchedDriverId = recDriverId;
    } else if (recDriverName) {
      const match = driversList.find((d: any) =>
        d.name?.toLowerCase().includes(recDriverName) ||
        recDriverName.includes(d.name?.toLowerCase())
      );
      if (match) matchedDriverId = match.id;
    }
    
    if (!matchedDriverId && driversList.length > 0) {
      // Pick first driver who is NOT the distressed reporting driver
      const distressedDesc = (issue.description || "").toLowerCase();
      const nonDistressed = driversList.filter((d: any) =>
        (!distressedDesc.includes(d.name?.toLowerCase() || "___")) &&
        (!distressedDesc.includes(d.employeeId?.toLowerCase() || "___"))
      );
      matchedDriverId = nonDistressed[0]?.id || driversList[0]?.id || "";
    }
    setSelectedDriverId(matchedDriverId);

    // Pre-select replacement bus: match suggested ID, registration, or pick first available standby bus
    const recBusId = issue.bestSolution?.replacementBusId;
    const recBusReg = (issue.bestSolution?.replacementBusReg || "").toLowerCase().replace(/\s*\(.*?\)/g, "").trim();

    let matchedBusId = "";
    if (recBusId && busesList.some((b: any) => b.id === recBusId)) {
      matchedBusId = recBusId;
    } else if (recBusReg) {
      const match = busesList.find((b: any) =>
        b.registrationNumber?.toLowerCase().includes(recBusReg) ||
        recBusReg.includes(b.registrationNumber?.toLowerCase())
      );
      if (match) matchedBusId = match.id;
    }

    if (!matchedBusId && busesList.length > 0) {
      matchedBusId = busesList[0]?.id || "";
    }
    setSelectedBusId(matchedBusId);

    setReviewSheetOpen(true);
  };

  // Open Conductor Drawer
  const handleOpenConductorDrawer = (assignment: LiveTrackingAssignment) => {
    setSelectedTripForConductor(assignment);
    setConductorDrawerOpen(true);
  };

  // Open Problem Report Dialog
  const handleOpenReportDialog = (assignment?: LiveTrackingAssignment) => {
    if (assignment) {
      setReportTripId(assignment.tripId);
      setReportBusId(assignment.busId || "");
      setReportDescription(
        `Operational delay or disruption reported on Trip ${assignment.tripCode} (Route ${assignment.routeCode}).`,
      );
    } else {
      setReportTripId("");
      setReportBusId("");
      setReportDescription("");
    }
    setReportDialogOpen(true);
  };

  // Available Route Codes
  const availableRouteCodes = useMemo(() => {
    const set = new Set<string>();
    routesGeojson.forEach((r) => set.add(r.routeCode));
    assignments.forEach((a) => set.add(formatRouteNumber(a.routeCode)));
    return Array.from(set).sort();
  }, [routesGeojson, assignments]);

  // Available Depots
  const availableDepots = useMemo(() => {
    const set = new Set<string>();
    assignments.forEach((a) => {
      if (a.busDepot && a.busDepot !== "Depot") set.add(a.busDepot);
    });
    return Array.from(set).sort();
  }, [assignments]);

  // ========================================================
  // 4. ASSIGNMENT TABLE COLUMNS
  // ========================================================
  const assignmentColumns: ColumnDef<LiveTrackingAssignment>[] = [
    {
      header: "Route Number",
      accessorKey: "routeCode",
      cell: (item) => (
        <div className="flex flex-col gap-1 items-start">
          <RouteBadge route={item.routeCode} size="md" />
          <span className="text-[11px] text-muted-foreground truncate max-w-[150px]">
            {formatRouteName(item.routeName)}
          </span>
        </div>
      ),
    },
    {
      header: "Trip",
      accessorKey: "tripCode",
      cell: (item) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-xs font-bold text-foreground">
            {item.tripCode}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {item.origin} to {item.destination}
          </span>
          <span className="text-[10px] font-mono text-muted-foreground/75">
            {item.dutyCode || "No Duty"}
          </span>
        </div>
      ),
    },
    {
      header: "Bus",
      accessorKey: "busRegNumber",
      cell: (item) => {
        if (!item.busId || item.busRegNumber === "Unassigned") {
          return (
            <Badge
              variant="outline"
              className="text-[10px] font-medium border-border text-muted-foreground bg-muted/30 rounded-md"
            >
              Unassigned Bus
            </Badge>
          );
        }
        return (
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-foreground">
              <Bus className="size-3 text-muted-foreground" />
              <span>{item.busRegNumber}</span>
            </div>
            <span className="text-[10px] text-muted-foreground">
              {item.busDepot} · {item.busType}
            </span>
          </div>
        );
      },
    },
    {
      header: "Driver",
      accessorKey: "driverName",
      cell: (item) => {
        if (!item.driverId || item.driverName === "Unassigned") {
          return (
            <Badge
              variant="outline"
              className="text-[10px] font-medium border-border text-muted-foreground bg-muted/30 rounded-md"
            >
              Unassigned Driver
            </Badge>
          );
        }
        return (
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
              <Users className="size-3 text-muted-foreground" />
              <span>{item.driverName}</span>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground">
              Active Roster
            </span>
          </div>
        );
      },
    },
    {
      header: "Conductor",
      accessorKey: "conductorName",
      cell: (item) => {
        if (!item.conductorId || item.conductorName === "Unassigned") {
          return (
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="text-[10px] font-bold border-amber-500/40 text-amber-700 dark:text-amber-400 bg-amber-500/10 rounded-md flex items-center gap-1"
              >
                <AlertTriangle className="size-2.5 text-amber-600 dark:text-amber-400" />
                <span>Missing Conductor</span>
              </Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenConductorDrawer(item);
                }}
                className="h-6 text-[10px] px-2 rounded-md border-blue-500/40 text-blue-700 dark:text-blue-400 hover:bg-blue-500/10 font-medium"
              >
                Assign
              </Button>
            </div>
          );
        }
        return (
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
              <UserCheck className="size-3 text-emerald-600 dark:text-emerald-400" />
              <span>{item.conductorName}</span>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground">
              Ticketing Certified
            </span>
          </div>
        );
      },
    },
    {
      header: "Departure",
      accessorKey: "startTime",
      cell: (item) => (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-foreground">
            <Clock className="size-3 text-muted-foreground" />
            <span>
              {formatMinutesTo12Hour(item.startTime)} -{" "}
              {formatMinutesTo12Hour(item.endTime)}
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground">
            {item.durationMin} mins duration
          </span>
        </div>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (item) => {
        if (item.conflicts.length > 0) {
          return (
            <Badge
              variant="outline"
              className="text-[10px] font-bold border-amber-500/40 text-amber-700 dark:text-amber-400 bg-amber-500/10 rounded-md flex items-center gap-1"
            >
              <AlertTriangle className="size-2.5 text-amber-600 dark:text-amber-400" />
              <span>Conflict ({item.conflicts.length})</span>
            </Badge>
          );
        }
        if (item.status === "active") {
          return (
            <Badge
              variant="outline"
              className="text-[10px] font-bold border-emerald-500/40 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 rounded-md flex items-center gap-1"
            >
              <Check className="size-2.5 text-emerald-600 dark:text-emerald-400" />
              <span>Active</span>
            </Badge>
          );
        }
        return (
          <Badge
            variant="outline"
            className="text-[10px] font-medium border-border text-muted-foreground bg-muted/40 rounded-md"
          >
            Unassigned
          </Badge>
        );
      },
    },
    {
      header: "Actions",
      cell: (item) => (
        <div className="flex items-center gap-1.5">
          {!item.conductorId && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs px-2.5 rounded-md border-blue-500/40 text-blue-700 dark:text-blue-300 hover:bg-blue-500/10 font-medium"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenConductorDrawer(item);
              }}
            >
              Recommend Conductor
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs px-2.5 rounded-md border-border hover:bg-muted font-medium text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenReportDialog(item);
            }}
          >
            <AlertTriangle className="size-3 mr-1 text-amber-600" />
            Report Issue
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AppShell
      title="Live Tracking"
      subtitle="Operational monitoring of live bus tracking, assignments, conductor staffing, and automated issue resolution."
      actions={
        <div className="flex items-center gap-2">
          <ServiceDatePicker value={serviceDate} onChange={setServiceDate} />
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              refetchTracking();
              refetchAssignments();
              refetchIssues();
            }}
            disabled={
              loadingAssignments ||
              refetchingAssignments ||
              loadingTracking ||
              refetchingTracking
            }
            className="h-8 text-xs px-2.5 rounded-md border-border bg-card hover:bg-muted font-medium text-foreground"
          >
            <RefreshCw
              className={cn(
                "size-3.5 mr-1.5",
                (refetchingAssignments || refetchingTracking) && "animate-spin",
              )}
            />
            Sync Feeds
          </Button>
          <Button
            size="sm"
            onClick={() => setDriverCheckinOpen(true)}
            variant="outline"
            className="h-8 text-xs px-2.5 border-border bg-card hover:bg-muted font-medium text-foreground rounded-md flex items-center gap-1.5"
          >
            <Smartphone className="size-3.5 text-blue-600" />
            Driver Mobile GPS
          </Button>
          <Button
            size="sm"
            onClick={() => handleOpenReportDialog()}
            className="h-8 text-xs px-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-xs flex items-center gap-1.5"
          >
            <Plus className="size-3.5" />
            Report Problem
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* ======================================================== */}
        {/* EMERGENCY CREW SOS ALERT BANNER */}
        {/* ======================================================== */}
        {activeCrewSosIssues.length > 0 && (
          <div className="p-4 rounded-lg border-2 border-rose-500 bg-rose-500/10 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-start gap-3">
              <div className="flex size-9 items-center justify-center rounded-md bg-rose-600 text-white shrink-0 mt-0.5 animate-pulse">
                <AlertOctagon className="size-5" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm text-rose-950 dark:text-rose-100 uppercase tracking-wide">
                    Critical Crew SOS Distress Alert ({activeCrewSosIssues.length} Active)
                  </span>
                  <Badge variant="outline" className="border-rose-500 text-rose-600 dark:text-rose-400 bg-rose-500/20 text-[10px] font-mono uppercase font-bold rounded-md">
                    Emergency Priority
                  </Badge>
                </div>
                <p className="text-xs text-rose-800 dark:text-rose-300">
                  {activeCrewSosIssues[0]?.description || "Emergency distress signal transmitted by driver on transit corridor."}
                  {" · "}
                  <span className="font-semibold text-rose-900 dark:text-rose-100">
                    Route {activeCrewSosIssues[0]?.routeCode} ({activeCrewSosIssues[0]?.routeName}) · Trip {activeCrewSosIssues[0]?.tripCode}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                onClick={() => handleOpenReview(activeCrewSosIssues[0]!)}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-md shadow-xs cursor-pointer flex items-center gap-1.5 h-8.5 px-3"
              >
                <AlertOctagon className="size-3.5" />
                <span>Respond & Reassign Driver / Fleet</span>
              </Button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SECTION A: LIVE BUS MAP */}
        {/* ======================================================== */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-foreground tracking-tight flex items-center gap-2">
                  <Activity className="size-4 text-blue-600" />
                  Live Bus Fleet Map & Telemetry
                </h2>
                <Badge
                  variant="outline"
                  className="text-[11px] font-bold px-2 py-0 border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-md flex items-center gap-1"
                >
                  <span className="size-1.5 rounded-sm bg-emerald-500 animate-pulse"></span>
                  {trackingSummary.liveTracked} Live Tracking
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Real-time AVL positioning, live corridor movement simulation, and timetable adherence.
              </p>
            </div>

            {/* Live Movement Simulation & KPI Strip */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 bg-muted/60 border border-border p-1 rounded-md">
                <Button
                  size="sm"
                  variant={isSimulatingMovements ? "default" : "outline"}
                  onClick={() => {
                    setIsSimulatingMovements((prev) => !prev);
                    toast.info(
                      !isSimulatingMovements
                        ? "Resumed live movement simulation (auto-tick every 3s)."
                        : "Paused live movement simulation."
                    );
                  }}
                  className="h-7 text-xs px-2.5 rounded-md font-medium"
                >
                  <Activity className="size-3 mr-1" />
                  {isSimulatingMovements ? "Simulation: Moving" : "Simulation: Paused"}
                </Button>
                <Button
                  size="sm"
                  variant={showOnlyMovingBuses ? "default" : "outline"}
                  onClick={() => setShowOnlyMovingBuses((prev) => !prev)}
                  className="h-7 text-xs px-2.5 rounded-md font-medium"
                  title="Toggle In-Service Moving Buses vs All Tracked Fleet"
                >
                  <Navigation className="size-3 mr-1" />
                  {showOnlyMovingBuses ? "Moving Only" : "All Vehicles"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    refetchTracking();
                    toast.success("Simulated next live telemetry tick for all corridor buses.");
                  }}
                  className="h-7 text-xs px-2 rounded-md"
                  title="Simulate Next Live Moment"
                >
                  <RefreshCw className={cn("size-3", refetchingTracking && "animate-spin")} />
                  <span className="sr-only">Step Moment</span>
                </Button>
              </div>
              <div className="px-2.5 py-1 rounded-md border border-border bg-card text-xs flex items-center gap-2">
                <span className="text-muted-foreground">Monitored:</span>
                <span className="font-mono font-bold text-foreground">
                  {trackingSummary.totalBuses}
                </span>
              </div>
              <div className="px-2.5 py-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 text-xs flex items-center gap-2">
                <span className="text-emerald-700 dark:text-emerald-400 font-medium">On-Time:</span>
                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                  {trackingSummary.onTimeBuses}
                </span>
              </div>
              <div className="px-2.5 py-1 rounded-md border border-amber-500/30 bg-amber-500/10 text-xs flex items-center gap-2">
                <span className="text-amber-700 dark:text-amber-400 font-medium">Delayed:</span>
                <span className="font-mono font-bold text-amber-700 dark:text-amber-400">
                  {trackingSummary.delayedBuses}
                </span>
              </div>
              <div className="px-2.5 py-1 rounded-md border border-blue-500/30 bg-blue-500/10 text-xs flex items-center gap-2">
                <span className="text-blue-700 dark:text-blue-400 font-medium">Stationary:</span>
                <span className="font-mono font-bold text-blue-700 dark:text-blue-400">
                  {trackingSummary.stationaryBuses}
                </span>
              </div>
              <div className="px-2.5 py-1 rounded-md border border-slate-500/30 bg-slate-500/10 text-xs flex items-center gap-2">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Untracked:</span>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                  {trackingSummary.untrackedBuses}
                </span>
              </div>
            </div>
          </div>

          {/* Map Filters & Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 p-3 rounded-lg border border-border/70 bg-card/60">
            <div>
              <Input
                placeholder="Search bus reg, route, driver..."
                value={mapSearchQuery}
                onChange={(e) => setMapSearchQuery(e.target.value)}
                className="h-8 text-xs rounded-md bg-background"
              />
            </div>
            <div>
              <Select value={mapRouteFilter} onValueChange={setMapRouteFilter}>
                <SelectTrigger className="h-8 text-xs rounded-md bg-background">
                  <SelectValue placeholder="All Corridors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Corridors ({availableRouteCodes.length})</SelectItem>
                  {availableRouteCodes.map((code) => (
                    <SelectItem key={code} value={code}>
                      Route {code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={mapDepotFilter} onValueChange={setMapDepotFilter}>
                <SelectTrigger className="h-8 text-xs rounded-md bg-background">
                  <SelectValue placeholder="All Depots" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Depots</SelectItem>
                  {availableDepots.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d} Depot
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={mapStatusFilter} onValueChange={setMapStatusFilter}>
                <SelectTrigger className="h-8 text-xs rounded-md bg-background">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="live">Live Telemetry Only</SelectItem>
                  <SelectItem value="delayed">Delayed Ahead</SelectItem>
                  <SelectItem value="on_time">On-Time</SelectItem>
                  <SelectItem value="stationary">Stationary Bottlenecks</SelectItem>
                  <SelectItem value="untracked">Untracked / Offline</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Leaflet Map & Inspection Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Main Map Box */}
            <div className="lg:col-span-2 relative h-[440px] rounded-lg border border-border/80 bg-card overflow-hidden shadow-xs">
              <div ref={mapContainerRef} className="w-full h-full z-0" />
              {loadingTracking && (
                <div className="absolute top-3 left-3 z-10 bg-card/90 backdrop-blur-xs border border-border px-2.5 py-1 rounded-md text-xs flex items-center gap-2 shadow-xs">
                  <RefreshCw className="size-3 animate-spin text-blue-600" />
                  <span>Streaming AVL telemetry...</span>
                </div>
              )}
            </div>

            {/* Bus Inspection / Sidebar Info */}
            <div className="rounded-lg border border-border/80 bg-card p-4 flex flex-col justify-between space-y-3 shadow-xs">
              {selectedTrackedBus ? (
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-border/60">
                    <div className="flex items-center gap-2">
                      <RouteBadge route={selectedTrackedBus.routeCode} size="md" />
                      <div>
                        <div className="font-bold text-sm text-foreground font-mono">
                          {selectedTrackedBus.busRegNumber}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {selectedTrackedBus.depot} Depot · {selectedTrackedBus.busType}
                        </div>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] font-bold rounded-md px-1.5 py-0.5",
                        selectedTrackedBus.delayStatus === "ON_TIME"
                          ? "border-emerald-500/40 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10"
                          : selectedTrackedBus.delayStatus === "DELAYED"
                            ? "border-amber-500/40 text-amber-700 dark:text-amber-400 bg-amber-500/10"
                            : selectedTrackedBus.delayStatus === "STATIONARY"
                              ? "border-blue-500/40 text-blue-700 dark:text-blue-400 bg-blue-500/10"
                              : "border-border text-muted-foreground bg-muted/40",
                      )}
                    >
                      {selectedTrackedBus.delayStatus.replace(/_/g, " ")}
                    </Badge>
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-[11px] text-muted-foreground font-medium">
                      Operational Trip:
                    </div>
                    <div className="p-2 rounded-md bg-muted/40 border border-border/60 space-y-1">
                      <div className="font-bold text-foreground font-mono flex items-center justify-between">
                        <span>{selectedTrackedBus.tripCode}</span>
                        <span>
                          {selectedTrackedBus.scheduledDeparture
                            ? formatMinutesTo12Hour(selectedTrackedBus.scheduledDeparture)
                            : "--"}
                          {" - "}
                          {selectedTrackedBus.scheduledArrival
                            ? formatMinutesTo12Hour(selectedTrackedBus.scheduledArrival)
                            : "--"}
                        </span>
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {selectedTrackedBus.origin} to {selectedTrackedBus.destination}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded-md border border-border/60 bg-muted/20">
                      <div className="text-[10px] text-muted-foreground">Speed & Telemetry</div>
                      <div className="font-mono font-bold text-foreground mt-0.5">
                        {selectedTrackedBus.speedKmH !== null ? `${selectedTrackedBus.speedKmH} km/h` : "No Feed"}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {selectedTrackedBus.lastUpdatedAgo || "Untracked"}
                      </div>
                    </div>
                    <div className="p-2 rounded-md border border-border/60 bg-muted/20">
                      <div className="text-[10px] text-muted-foreground">Approaching Stop</div>
                      <div className="font-medium text-foreground truncate mt-0.5">
                        {selectedTrackedBus.nextStopName || "Terminal Point"}
                      </div>
                      <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
                        {selectedTrackedBus.distanceToNextStopKm !== null
                          ? `${selectedTrackedBus.distanceToNextStopKm} km away`
                          : "--"}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-[10px] text-muted-foreground">Operating Crew:</div>
                    <div className="flex items-center justify-between text-[11px] p-2 rounded-md border border-border/60 bg-card">
                      <div>
                        <span className="text-muted-foreground">Driver: </span>
                        <span className="font-bold text-foreground">
                          {selectedTrackedBus.driverName || "Unassigned"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Conductor: </span>
                        <span className="font-bold text-foreground">
                          {selectedTrackedBus.conductorName || "Unassigned"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-2 rounded-md border border-border/80 bg-muted/20 text-[11px] text-muted-foreground">
                    <span className="font-medium text-foreground">Delay Diagnostics: </span>
                    {selectedTrackedBus.statusReason}
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setReportBusId(selectedTrackedBus.busId || "");
                      setReportTripId(selectedTrackedBus.activeTripId || "");
                      setReportDescription(
                        `Operator or supervisor flagged delay / issue on ${selectedTrackedBus.busRegNumber} (Route ${selectedTrackedBus.routeCode}).`,
                      );
                      setReportDialogOpen(true);
                    }}
                    className="w-full text-xs h-8 rounded-md border-border hover:bg-muted font-medium text-foreground"
                  >
                    <AlertTriangle className="size-3.5 mr-1.5 text-amber-600" />
                    Report Incident on this Bus
                  </Button>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 text-muted-foreground">
                  <div className="size-10 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Navigation className="size-5" />
                  </div>
                  <h3 className="text-xs font-bold text-foreground">
                    Select a Vehicle on Map
                  </h3>
                  <p className="text-[11px] max-w-xs text-muted-foreground">
                    Click any live vehicle marker on the corridor map to view speed, approaching stop distance, timetable delay, and crew staffing.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* SECTION B: CURRENT VEHICLE & CREW ASSIGNMENTS TABLE */}
        {/* ======================================================== */}
        <section className="space-y-3 pt-2">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-foreground tracking-tight flex items-center gap-2">
                  <Users className="size-4 text-emerald-600" />
                  Current Vehicle & Crew Assignments
                </h2>
                {assignmentSummary.unassignedConductors === 0 &&
                assignmentSummary.unassignedDrivers === 0 &&
                assignmentSummary.unassignedBuses === 0 ? (
                  <Badge
                    variant="outline"
                    className="text-[11px] font-bold px-2 py-0.5 border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-md flex items-center gap-1"
                  >
                    <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400" />
                    <span>All {assignments.length} Departures Fully Staffed</span>
                  </Badge>
                ) : (
                  <>
                    {assignmentSummary.unassignedConductors > 0 && (
                      <Badge
                        variant="outline"
                        className="text-[11px] font-bold px-2 py-0 border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-md"
                      >
                        {assignmentSummary.unassignedConductors} Missing Conductors
                      </Badge>
                    )}
                    {assignmentSummary.unassignedDrivers > 0 && (
                      <Badge
                        variant="outline"
                        className="text-[11px] font-bold px-2 py-0 border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-400 rounded-md"
                      >
                        {assignmentSummary.unassignedDrivers} Unassigned Drivers
                      </Badge>
                    )}
                    {assignmentSummary.unassignedBuses > 0 && (
                      <Badge
                        variant="outline"
                        className="text-[11px] font-bold px-2 py-0 border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-400 rounded-md"
                      >
                        {assignmentSummary.unassignedBuses} Unassigned Buses
                      </Badge>
                    )}
                  </>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Every scheduled trip departure with assigned bus, driver, and conductor. Overlaps and unassigned duties are flagged.
              </p>
            </div>

            {/* Table Header Actions: Auto-Assign All & Bulk Conductors */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                size="sm"
                onClick={() => bulkFleetCrewMutation.mutate()}
                disabled={bulkFleetCrewMutation.isPending}
                className="h-8 text-xs px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-md shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCheck className="size-3.5" />
                {bulkFleetCrewMutation.isPending
                  ? "Assigning Fleet & Crew..."
                  : "Auto-Assign All Fleet & Crew"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => bulkConductorMutation.mutate()}
                disabled={bulkConductorMutation.isPending}
                className="h-8 text-xs px-2.5 border-border hover:bg-muted font-medium text-foreground rounded-md flex items-center gap-1.5 cursor-pointer"
              >
                <Users className="size-3.5 text-blue-600" />
                {bulkConductorMutation.isPending
                  ? "Assigning..."
                  : "Assign Conductors"}
              </Button>
            </div>
          </div>

          <TransitTable
            data={filteredAssignments}
            columns={assignmentColumns}
            isLoading={loadingAssignments}
            searchPlaceholder="Search by route, bus reg, driver, conductor, or trip code..."
            searchFilter={(item, query) => {
              const q = query.toLowerCase();
              return (
                item.busRegNumber.toLowerCase().includes(q) ||
                item.routeCode.toLowerCase().includes(q) ||
                item.routeName.toLowerCase().includes(q) ||
                item.driverName.toLowerCase().includes(q) ||
                item.conductorName.toLowerCase().includes(q) ||
                item.tripCode.toLowerCase().includes(q) ||
                (item.dutyCode || "").toLowerCase().includes(q) ||
                item.origin.toLowerCase().includes(q) ||
                item.destination.toLowerCase().includes(q) ||
                item.busDepot.toLowerCase().includes(q)
              );
            }}
            filters={[
              {
                key: "status",
                label: "Filter Assignments",
                value: assignmentStatusFilter,
                options: [
                  { label: "All Assignments", value: "all" },
                  { label: "Fully Staffed (100%)", value: "staffed" },
                  { label: "Missing Conductor", value: "missing_conductor" },
                  { label: "Unassigned Bus / Driver", value: "unassigned_bus_driver" },
                  { label: "Conflicted", value: "conflicted" },
                ],
                onChange: (v) => setAssignmentStatusFilter(v),
              },
              {
                key: "depot",
                label: "Filter Depot",
                value: assignmentDepotFilter,
                options: [
                  { label: "All Depots", value: "all" },
                  { label: "Meyyanur Depot", value: "Meyyanur Depot" },
                  { label: "Johnsonpet Depot", value: "Johnsonpet Depot" },
                  { label: "Hasthampatti Depot", value: "Hasthampatti Depot" },
                  { label: "Steel Plant Depot", value: "Steel Plant Depot" },
                ],
                onChange: (v) => setAssignmentDepotFilter(v),
              },
            ]}
          />
        </section>

        {/* ======================================================== */}
        {/* SECTION C: OPERATIONAL ISSUES & AUTOMATIC RESOLUTION CENTER */}
        {/* ======================================================== */}
        <section className="space-y-4 pt-2">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-foreground tracking-tight flex items-center gap-2">
                  <ShieldAlert className="size-4 text-amber-600" />
                  Operational Issues & Problem Resolution Center
                </h2>
                {issuesSummary.active > 0 ? (
                  <Badge
                    variant="outline"
                    className="text-[11px] font-bold px-2 py-0 border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-md"
                  >
                    {issuesSummary.active} Active
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="text-[11px] font-medium px-2 py-0 border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-md"
                  >
                    All Clear
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Automated 8-point diagnostic investigations with configurable Level 1 auto-resolutions and Level 2 supervisor reviews.
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center p-1 bg-muted/60 rounded-lg border border-border/60 text-xs">
              <button
                type="button"
                onClick={() => setIssuesTab("needs_review")}
                className={cn(
                  "px-3 py-1 rounded-md font-semibold transition-all flex items-center gap-1.5",
                  issuesTab === "needs_review"
                    ? "bg-card text-foreground shadow-xs border border-border/80"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span>Needs Review (Level 2)</span>
                <span className="font-mono text-[10px] px-1 py-0 bg-amber-500/20 text-amber-700 dark:text-amber-300 rounded-md">
                  {issuesSummary.awaitingApproval}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setIssuesTab("manual")}
                className={cn(
                  "px-3 py-1 rounded-md font-medium transition-all flex items-center gap-1.5",
                  issuesTab === "manual"
                    ? "bg-card text-foreground shadow-xs border border-border/80"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span>Awaiting Manual (Level 3)</span>
                <span className="font-mono text-[10px] px-1 py-0 bg-muted text-muted-foreground rounded-md">
                  {issuesSummary.awaitingManual}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setIssuesTab("resolved")}
                className={cn(
                  "px-3 py-1 rounded-md font-medium transition-all flex items-center gap-1.5",
                  issuesTab === "resolved"
                    ? "bg-card text-foreground shadow-xs border border-border/80"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span>Auto-Resolved & History</span>
                <span className="font-mono text-[10px] px-1 py-0 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 rounded-md">
                  {issuesSummary.resolved}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setIssuesTab("all")}
                className={cn(
                  "px-3 py-1 rounded-md font-medium transition-all",
                  issuesTab === "all"
                    ? "bg-card text-foreground shadow-xs border border-border/80"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                All ({issuesSummary.total})
              </button>
            </div>
          </div>

          {/* Issue Cards Grid */}
          {loadingIssues ? (
            <div className="py-12 rounded-lg border border-border/80 bg-card flex flex-col items-center justify-center gap-2 text-muted-foreground text-xs">
              <RefreshCw className="size-5 animate-spin text-blue-600" />
              <span>Scanning schedules and formulating diagnostic solutions...</span>
            </div>
          ) : filteredIssues.length === 0 ? (
            <div className="rounded-lg border border-border/80 bg-card p-8 text-center space-y-2">
              <div className="size-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="size-5" />
              </div>
              <h3 className="text-sm font-bold text-foreground">
                No Operational Issues in Selected View
              </h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                {issuesTab === "needs_review"
                  ? "All corridor trips have feasible, validated vehicle and crew assignments with zero active approvals required."
                  : issuesTab === "manual"
                    ? "Zero issues currently require manual supervisor intervention."
                    : "No issue records match the selected filter."}
              </p>
            </div>
          ) : (
            <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredIssues.map((issue) => (
                <div
                  key={issue.id}
                  className={cn(
                    "rounded-lg border p-4 space-y-3 shadow-xs flex flex-col justify-between transition-all",
                    issue.lifecycleStatus === "RESOLVED" ||
                      issue.lifecycleStatus === "AUTOMATICALLY_RESOLVED"
                      ? "border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/10"
                      : issue.lifecycleStatus === "AWAITING_MANUAL_INTERVENTION"
                        ? "border-rose-500/30 bg-rose-500/5 dark:bg-rose-950/10"
                        : "border-border/80 bg-card hover:border-blue-400/80",
                  )}
                >
                  <div className="space-y-2.5">
                    {/* Top Badges */}
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[9px] font-bold uppercase rounded-md px-1.5 py-0.5",
                            issue.category === "CREW_SOS"
                              ? "border-rose-600 text-rose-700 dark:text-rose-300 bg-rose-500/20 font-bold"
                              : issue.category === "BUS_BREAKDOWN" ||
                                  issue.category === "SCHEDULING_OVERLAP"
                                ? "border-rose-500/40 text-rose-700 dark:text-rose-400 bg-rose-500/10"
                                : "border-amber-500/40 text-amber-700 dark:text-amber-400 bg-amber-500/10",
                          )}
                        >
                          {issue.category === "CREW_SOS"
                            ? "EMERGENCY CREW SOS"
                            : issue.category.replace(/_/g, " ")}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-[9px] font-mono text-muted-foreground border-border bg-muted/40 rounded-md"
                        >
                          {issue.automationLevel === "LEVEL_1_AUTOMATIC"
                            ? "Level 1: Auto"
                            : issue.automationLevel === "LEVEL_2_APPROVAL_REQUIRED"
                              ? "Level 2: Approval"
                              : "Level 3: Manual"}
                        </Badge>
                      </div>

                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[9px] font-semibold rounded-md",
                          issue.lifecycleStatus === "RESOLVED" ||
                            issue.lifecycleStatus === "AUTOMATICALLY_RESOLVED"
                            ? "border-emerald-500/40 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10"
                            : issue.lifecycleStatus === "AWAITING_MANUAL_INTERVENTION"
                              ? "border-rose-500/40 text-rose-700 dark:text-rose-400 bg-rose-500/10"
                              : "border-blue-500/40 text-blue-700 dark:text-blue-400 bg-blue-500/10",
                        )}
                      >
                        {issue.lifecycleStatus.replace(/_/g, " ")}
                      </Badge>
                    </div>

                    {/* Affected Trip Context */}
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-foreground font-mono">
                        <span>{issue.tripCode}</span>
                        <span>·</span>
                        <RouteBadge route={issue.routeCode} size="sm" />
                        <span className="font-sans font-medium text-muted-foreground truncate max-w-[140px]">
                          ({issue.routeName})
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                        {issue.description}
                      </p>
                    </div>

                    {/* Auto-Action Banner or Recommendation Preview */}
                    {issue.automationActionTaken ? (
                      <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-2 text-xs space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400" />
                          Auto-Resolution Executed
                        </span>
                        <p className="text-[11px] text-foreground">
                          {issue.automationActionTaken}
                        </p>
                      </div>
                    ) : issue.bestSolution ? (
                      <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-2 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                            <ShieldCheck className="size-3 text-emerald-600 dark:text-emerald-400" />
                            Rank 1 Recommendation
                          </span>
                          <span className="font-mono text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                            {issue.bestSolution.suitabilityScore}/100 Match
                          </span>
                        </div>
                        <p className="text-[11px] font-medium text-foreground">
                          {issue.bestSolution.replacementBusReg ||
                            issue.bestSolution.replacementDriverName ||
                            issue.bestSolution.replacementConductorName ||
                            issue.bestSolution.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {issue.bestSolution.depot} ·{" "}
                          {issue.bestSolution.repositioningMinutes}m lead time · 0 overlaps
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-md border border-rose-500/30 bg-rose-500/10 p-2 text-xs">
                        <span className="text-[10px] font-bold uppercase text-rose-800 dark:text-rose-300 flex items-center gap-1">
                          <AlertTriangle className="size-3 text-rose-600" />
                          Manual Intervention Required
                        </span>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Standard depot pool exhausted. Supervisor manual action needed.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Card Actions */}
                  <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-1.5">
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(issue.reportedAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <div className="flex items-center gap-1">
                      {issue.lifecycleStatus === "AWAITING_MANUAL_INTERVENTION" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs px-2 rounded-md border-border hover:bg-muted font-medium text-foreground"
                          onClick={() => retryAnalysisMutation.mutate(issue.id)}
                          disabled={retryAnalysisMutation.isPending}
                        >
                          <RotateCcw className="size-3 mr-1" />
                          Retry
                        </Button>
                      )}
                      <Button
                        size="sm"
                        className="h-7 text-xs px-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-xs flex items-center gap-1"
                        onClick={() => handleOpenReview(issue)}
                      >
                        <span>8-Point Diagnostic</span>
                        <ChevronRight className="size-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ======================================================== */}
      {/* 8-POINT DIAGNOSTIC & APPROVAL SHEET */}
      {/* ======================================================== */}
      <Sheet open={reviewSheetOpen} onOpenChange={setReviewSheetOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-6 space-y-6">
          {selectedIssue && (
            <>
              <SheetHeader className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="text-[10px] font-bold uppercase rounded-md border-amber-500/40 text-amber-700 dark:text-amber-400 bg-amber-500/10"
                  >
                    {selectedIssue.category.replace(/_/g, " ")}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-mono text-muted-foreground border-border bg-muted/40 rounded-md"
                  >
                    {selectedIssue.automationLevel.replace(/_/g, " ")}
                  </Badge>
                </div>
                <SheetTitle className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                  <span>8-Point Operational Diagnostic</span>
                  <RouteBadge route={selectedIssue.routeCode} size="sm" />
                </SheetTitle>
                <SheetDescription className="text-xs text-muted-foreground">
                  Trip {selectedIssue.tripCode} ({selectedIssue.routeName}) · Service Date {selectedIssue.serviceDate}
                </SheetDescription>
              </SheetHeader>

              {/* 8 Plain-Language Answers */}
              <div className="space-y-3.5 text-xs">
                <div className="rounded-lg border border-border/80 bg-muted/30 p-3 space-y-1">
                  <div className="font-bold text-foreground text-[11px] uppercase tracking-wide">
                    1. What Happened?
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    {selectedIssue.diagnostic.whatHappened}
                  </p>
                </div>

                <div className="rounded-lg border border-border/80 bg-muted/30 p-3 space-y-1">
                  <div className="font-bold text-foreground text-[11px] uppercase tracking-wide">
                    2. Affected Routes & Trips
                  </div>
                  <p className="text-muted-foreground leading-relaxed font-mono">
                    {selectedIssue.diagnostic.affectedRouteTrips}
                  </p>
                </div>

                <div className="rounded-lg border border-border/80 bg-muted/30 p-3 space-y-1">
                  <div className="font-bold text-foreground text-[11px] uppercase tracking-wide">
                    3. Involved Resources
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    {selectedIssue.diagnostic.involvedResources}
                  </p>
                </div>

                <div className="rounded-lg border border-border/80 bg-muted/30 p-3 space-y-1">
                  <div className="font-bold text-foreground text-[11px] uppercase tracking-wide">
                    4. Why is Current Assignment Invalid?
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    {selectedIssue.diagnostic.whyInvalid}
                  </p>
                </div>

                <div className="rounded-lg border border-border/80 bg-muted/30 p-3 space-y-1">
                  <div className="font-bold text-foreground text-[11px] uppercase tracking-wide">
                    5. Operational Consequences if Unresolved
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    {selectedIssue.diagnostic.operationalConsequences}
                  </p>
                </div>

                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 space-y-1">
                  <div className="font-bold text-emerald-800 dark:text-emerald-300 text-[11px] uppercase tracking-wide">
                    6. Recommended Solution
                  </div>
                  <p className="text-foreground leading-relaxed font-medium">
                    {selectedIssue.diagnostic.recommendedSolution}
                  </p>
                </div>

                <div className="rounded-lg border border-border/80 bg-muted/30 p-3 space-y-1">
                  <div className="font-bold text-foreground text-[11px] uppercase tracking-wide">
                    7. Why is This Better than Alternatives?
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    {selectedIssue.diagnostic.whyBetter}
                  </p>
                </div>

                <div className="rounded-lg border border-border/80 bg-muted/30 p-3 space-y-1">
                  <div className="font-bold text-foreground text-[11px] uppercase tracking-wide">
                    8. Remaining Operational Risks
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    {selectedIssue.diagnostic.remainingRisks}
                  </p>
                </div>
              </div>

              {/* Solution Strategy & Options Selector */}
              {selectedIssue.lifecycleStatus !== "RESOLVED" &&
                selectedIssue.lifecycleStatus !== "AUTOMATICALLY_RESOLVED" && (
                  <div className="space-y-4 pt-3 border-t border-border/60">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm text-foreground">
                        Supervisor Resolution Strategy
                      </h3>
                      <Badge variant="outline" className="text-[10px] font-mono border-blue-500/30 text-blue-600 bg-blue-500/10 rounded-md">
                        {resolutionActionType === "driver" ? "Driver Reassignment" : resolutionActionType === "bus" ? "Bus Replacement" : "Ranked Constraint Solver"}
                      </Badge>
                    </div>

                    {/* Mode Selector Tabs */}
                    <div className="grid grid-cols-3 gap-1.5 p-1 bg-muted/60 rounded-md border border-border/70 text-xs">
                      <button
                        type="button"
                        onClick={() => setResolutionActionType("driver")}
                        className={cn(
                          "py-1.5 px-2 rounded-md font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center",
                          resolutionActionType === "driver"
                            ? "bg-card text-foreground shadow-xs border border-border/80"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        <UserCheck className="size-3.5 text-blue-600" />
                        <span>Change Driver</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setResolutionActionType("bus")}
                        className={cn(
                          "py-1.5 px-2 rounded-md font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center",
                          resolutionActionType === "bus"
                            ? "bg-card text-foreground shadow-xs border border-border/80"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        <Bus className="size-3.5 text-emerald-600" />
                        <span>Replace Bus</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setResolutionActionType("recommendation")}
                        className={cn(
                          "py-1.5 px-2 rounded-md font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center",
                          resolutionActionType === "recommendation"
                            ? "bg-card text-foreground shadow-xs border border-border/80"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        <ShieldCheck className="size-3.5 text-amber-600" />
                        <span>Automated Proposals</span>
                      </button>
                    </div>

                    {/* MODE 1: CHANGE / REASSIGN DRIVER */}
                    {resolutionActionType === "driver" && (
                      <div className="space-y-3 p-3.5 rounded-lg border border-blue-500/30 bg-blue-500/5">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <UserCheck className="size-3.5 text-blue-600" />
                            Select Certified Relief Driver to Assign
                          </label>
                          <p className="text-[11px] text-muted-foreground">
                            Assign an available pilot from depot reserve roster to take over active duty.
                          </p>
                        </div>

                        <Select
                          value={selectedDriverId}
                          onValueChange={setSelectedDriverId}
                        >
                          <SelectTrigger className="h-9 text-xs rounded-md bg-card">
                            <SelectValue placeholder="Select relief driver..." />
                          </SelectTrigger>
                          <SelectContent className="max-h-56">
                            {driversList.map((d: any) => (
                              <SelectItem key={d.id} value={d.id} className="text-xs">
                                {d.name} ({d.employeeId}) · {d.depot}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <div className="p-2.5 rounded-md border border-border/70 bg-card text-[11px] space-y-1 text-muted-foreground font-mono">
                          <div className="flex justify-between">
                            <span>Compliance Status:</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">MV Act & Continuous Rest Verified</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Reporting Buffer:</span>
                            <span className="font-bold text-foreground">6 - 8 Minutes Turnout</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* MODE 2: REPLACE BUS */}
                    {resolutionActionType === "bus" && (
                      <div className="space-y-3 p-3.5 rounded-lg border border-emerald-500/30 bg-emerald-500/5">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <Bus className="size-3.5 text-emerald-600" />
                            Select Standby Reserve Vehicle to Deploy
                          </label>
                          <p className="text-[11px] text-muted-foreground">
                            Dispatch a standby replacement fleet unit from depot reserve to resume service.
                          </p>
                        </div>

                        <Select
                          value={selectedBusId}
                          onValueChange={setSelectedBusId}
                        >
                          <SelectTrigger className="h-9 text-xs rounded-md bg-card">
                            <SelectValue placeholder="Select standby bus..." />
                          </SelectTrigger>
                          <SelectContent className="max-h-56">
                            {busesList.map((b: any) => (
                              <SelectItem key={b.id} value={b.id} className="text-xs">
                                {b.registrationNumber} ({b.fleetNumber || b.busType}) · {b.depot}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <div className="p-2.5 rounded-md border border-border/70 bg-card text-[11px] space-y-1 text-muted-foreground font-mono">
                          <div className="flex justify-between">
                            <span>Depot Inspection:</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">BS-VI Fitness Active</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Deadhead Turnaround:</span>
                            <span className="font-bold text-foreground">12 - 14 Minutes Buffer</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* MODE 3: RANKED PROPOSALS */}
                    {resolutionActionType === "recommendation" && (
                      <div className="space-y-2">
                        {[selectedIssue.bestSolution, ...selectedIssue.alternativeSolutions]
                          .filter(Boolean)
                          .map((sol) => (
                            <div
                              key={sol!.id}
                              onClick={() => setSelectedSolutionId(sol!.id)}
                              className={cn(
                                "p-3 rounded-lg border text-xs cursor-pointer transition-all space-y-1",
                                selectedSolutionId === sol!.id
                                  ? "border-blue-600 bg-blue-500/10 dark:bg-blue-950/20 shadow-xs"
                                  : "border-border/80 bg-card hover:bg-muted/40",
                              )}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-foreground flex items-center gap-1.5">
                                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-muted">
                                    Rank {sol!.rank}
                                  </span>
                                  {sol!.title}
                                </span>
                                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                  {sol!.suitabilityScore}/100 Match
                                </span>
                              </div>
                              <p className="text-muted-foreground">{sol!.reason}</p>
                              <div className="text-[10px] text-muted-foreground/80 flex items-center gap-3">
                                <span>Depot: {sol!.depot}</span>
                                <span>Lead Time: {sol!.repositioningMinutes} min</span>
                                <span>Risk: {sol!.cascadingConflictRisk}</span>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}

                    <div className="space-y-1.5 pt-1">
                      <label className="text-xs font-medium text-foreground">
                        Supervisor Dispatch Notes (Optional)
                      </label>
                      <Textarea
                        placeholder="e.g. Cleared with depot control master. Assigned relief pilot to trip."
                        value={dispatchNotes}
                        onChange={(e) => setDispatchNotes(e.target.value)}
                        className="text-xs rounded-md"
                        rows={2}
                      />
                    </div>
                  </div>
                )}

              <SheetFooter className="flex-row gap-2 justify-end pt-4 border-t border-border/60">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setReviewSheetOpen(false)}
                  className="rounded-md text-xs font-medium"
                >
                  Close
                </Button>

                {selectedIssue.lifecycleStatus === "AWAITING_MANUAL_INTERVENTION" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setTargetManualIssueId(selectedIssue.id);
                      setManualResolveDialogOpen(true);
                    }}
                    className="rounded-md text-xs font-medium border-border hover:bg-muted"
                  >
                    Mark Manually Resolved
                  </Button>
                )}

                {selectedIssue.lifecycleStatus !== "RESOLVED" &&
                  selectedIssue.lifecycleStatus !== "AUTOMATICALLY_RESOLVED" && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          rejectMutation.mutate({
                            issueId: selectedIssue.id,
                            reason: dispatchNotes || "Supervisor requested manual depot override.",
                          })
                        }
                        disabled={rejectMutation.isPending}
                        className="rounded-md text-xs font-medium border-rose-500/40 text-rose-700 dark:text-rose-400 hover:bg-rose-500/10"
                      >
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() =>
                          approveMutation.mutate({
                            issueId: selectedIssue.id,
                            solutionId: selectedSolutionId || undefined,
                            overrideDriverId:
                              resolutionActionType === "driver"
                                ? selectedDriverId || undefined
                                : undefined,
                            overrideBusId:
                              resolutionActionType === "bus"
                                ? selectedBusId || undefined
                                : undefined,
                            dispatchNotes,
                          })
                        }
                        disabled={approveMutation.isPending}
                        className="rounded-md text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer flex items-center gap-1.5"
                      >
                        {approveMutation.isPending
                          ? "Executing..."
                          : resolutionActionType === "driver"
                            ? "Approve & Reassign Driver"
                            : resolutionActionType === "bus"
                              ? "Approve & Deploy Standby Bus"
                              : "Approve & Dispatch"}
                      </Button>
                    </>
                  )}
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* ======================================================== */}
      {/* CONDUCTOR RECOMMENDATION DRAWER */}
      {/* ======================================================== */}
      <Sheet open={conductorDrawerOpen} onOpenChange={setConductorDrawerOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto p-6 space-y-6">
          {selectedTripForConductor && (
            <>
              <SheetHeader className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="text-[10px] font-bold uppercase rounded-md border-amber-500/40 text-amber-700 dark:text-amber-400 bg-amber-500/10"
                  >
                    Missing Conductor
                  </Badge>
                  <RouteBadge route={selectedTripForConductor.routeCode} size="sm" />
                </div>
                <SheetTitle className="text-lg font-bold tracking-tight text-foreground">
                  Recommend Conductor for Trip {selectedTripForConductor.tripCode}
                </SheetTitle>
                <SheetDescription className="text-xs text-muted-foreground">
                  Departure at {formatMinutesTo12Hour(selectedTripForConductor.startTime)} ({selectedTripForConductor.origin} to {selectedTripForConductor.destination})
                </SheetDescription>
              </SheetHeader>

              {loadingConductorRec ? (
                <div className="py-12 rounded-lg border border-border/80 bg-card flex flex-col items-center justify-center gap-2 text-muted-foreground text-xs">
                  <RefreshCw className="size-5 animate-spin text-blue-600" />
                  <span>Evaluating depot conductor rosters, rest hours, and overlaps...</span>
                </div>
              ) : conductorRecData?.recommended ? (
                <div className="space-y-4 text-xs">
                  {/* Top Recommendation Card */}
                  <div className="rounded-lg border-2 border-emerald-500/50 bg-emerald-500/10 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                        <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
                        Top System Recommendation
                      </span>
                      <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-300">
                        {conductorRecData.recommended.suitabilityScore}/100 Match
                      </span>
                    </div>

                    <div className="text-sm font-bold text-foreground">
                      {conductorRecData.recommended.replacementConductorName}
                    </div>

                    <p className="text-muted-foreground">
                      {conductorRecData.recommended.reason}
                    </p>

                    <div className="pt-2 flex items-center justify-between border-t border-emerald-500/20">
                      <span className="text-[10px] text-muted-foreground">
                        {conductorRecData.recommended.depot} · {conductorRecData.recommended.repositioningMinutes}m lead time
                      </span>
                      <Button
                        size="sm"
                        onClick={() =>
                          assignConductorMutation.mutate({
                            tripId: selectedTripForConductor.tripId,
                            dutyId: selectedTripForConductor.dutyId || undefined,
                            conductorId: conductorRecData.recommended!.replacementConductorId!,
                          })
                        }
                        disabled={assignConductorMutation.isPending}
                        className="h-7 text-xs px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-md shadow-xs"
                      >
                        Assign This Conductor
                      </Button>
                    </div>
                  </div>

                  {/* Alternative Candidates */}
                  {conductorRecData.alternatives.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <h4 className="text-xs font-bold text-foreground">
                        Alternative Available Conductors
                      </h4>
                      {conductorRecData.alternatives.map((alt) => (
                        <div
                          key={alt.id}
                          className="p-3 rounded-lg border border-border/80 bg-card hover:bg-muted/30 transition-all flex items-center justify-between gap-3"
                        >
                          <div>
                            <div className="font-bold text-foreground">
                              {alt.replacementConductorName}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              {alt.depot} · Suitability {alt.suitabilityScore}/100
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              assignConductorMutation.mutate({
                                tripId: selectedTripForConductor.tripId,
                                dutyId: selectedTripForConductor.dutyId || undefined,
                                conductorId: alt.replacementConductorId!,
                              })
                            }
                            disabled={assignConductorMutation.isPending}
                            className="h-7 text-xs px-2.5 rounded-md border-border hover:bg-muted font-medium"
                          >
                            Assign
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 rounded-lg border border-amber-500/30 bg-amber-500/10 text-center space-y-2">
                  <AlertTriangle className="size-6 text-amber-600 mx-auto" />
                  <h4 className="text-xs font-bold text-foreground">
                    No Eligible Conductors in Depot Pool
                  </h4>
                  <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                    All available conductors are currently deployed or required for mandatory rest buffers. Request central standby deployment.
                  </p>
                </div>
              )}

              <SheetFooter className="pt-4 border-t border-border/60">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConductorDrawerOpen(false)}
                  className="rounded-md text-xs font-medium"
                >
                  Close
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* ======================================================== */}
      {/* DRIVER MOBILE GPS TRANSMISSION DIALOG */}
      {/* ======================================================== */}
      <Dialog open={driverCheckinOpen} onOpenChange={setDriverCheckinOpen}>
        <DialogContent className="sm:max-w-md p-6 space-y-4">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Smartphone className="size-4 text-blue-600" />
              Driver Mobile Web GPS Interface
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Transmits actual live browser geolocation into TransitOS AVL gateway with explicit user permission. Never fabricates data.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">
                Assigned Vehicle Registration
              </label>
              <Input
                placeholder="e.g. TN-01-N-9842"
                value={checkinBusReg}
                onChange={(e) => setCheckinBusReg(e.target.value)}
                className="h-8 text-xs font-mono rounded-md"
              />
            </div>

            <Button
              onClick={() => handleTransmitDeviceGps(checkinBusReg)}
              disabled={transmittingGps || !checkinBusReg.trim()}
              className="w-full h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-xs flex items-center justify-center gap-1.5"
            >
              <Send className="size-3.5" />
              {transmittingGps ? "Acquiring GPS Fix..." : "Transmit My Current Geolocation"}
            </Button>

            {lastTransmittedCoords && (
              <div className="p-2.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 space-y-1 font-mono text-[11px]">
                <div className="font-bold text-emerald-800 dark:text-emerald-300">
                  Last Telemetry Packet Transmitted:
                </div>
                <div className="text-foreground">
                  Lat: {lastTransmittedCoords.lat.toFixed(5)} · Lng: {lastTransmittedCoords.lng.toFixed(5)}
                </div>
                <div className="text-muted-foreground">
                  Speed: {lastTransmittedCoords.speed} km/h · Accuracy: {lastTransmittedCoords.accuracy}m at {lastTransmittedCoords.time}
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-border/60 space-y-2">
              <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                Quick Terminal Check-in Pings (Chennai Corridors)
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSampleTerminalPing(checkinBusReg || "TN-01-N-9842", "broadway")}
                  className="h-7 text-[11px] rounded-md font-mono"
                >
                  Broadway
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSampleTerminalPing(checkinBusReg || "TN-01-N-9842", "cmbt")}
                  className="h-7 text-[11px] rounded-md font-mono"
                >
                  CMBT
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSampleTerminalPing(checkinBusReg || "TN-01-N-9842", "siruseri")}
                  className="h-7 text-[11px] rounded-md font-mono"
                >
                  Siruseri IT
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDriverCheckinOpen(false)}
              className="rounded-md text-xs font-medium"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ======================================================== */}
      {/* OPERATIONAL PROBLEM REPORTING DIALOG */}
      {/* ======================================================== */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="sm:max-w-md p-6 space-y-4">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <AlertTriangle className="size-4 text-amber-600" />
              Report Operational Incident
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Logs an operational disruption. The schedule engine triggers automated 8-point diagnostic analysis and ranks feasible solutions.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">
                Incident Category
              </label>
              <Select
                value={reportCategory}
                onValueChange={(v) => setReportCategory(v as ProblemCategory)}
              >
                <SelectTrigger className="h-8 text-xs rounded-md">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BUS_BREAKDOWN">Bus Mechanical Breakdown</SelectItem>
                  <SelectItem value="DRIVER_UNAVAILABLE">Driver Absent / Emergency Leave</SelectItem>
                  <SelectItem value="CONDUCTOR_ABSENT">Conductor Absent / Unassigned</SelectItem>
                  <SelectItem value="TRIP_DELAY">Corridor Trip Delay / Bottleneck</SelectItem>
                  <SelectItem value="SCHEDULING_OVERLAP">Scheduling Overlap Detected</SelectItem>
                  <SelectItem value="CANNOT_REACH_ON_TIME">Deadhead Turnout Infeasible</SelectItem>
                  <SelectItem value="OPERATIONAL_DISRUPTION">General Operational Disruption</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">
                Target Trip (Optional)
              </label>
              <Select value={reportTripId} onValueChange={setReportTripId}>
                <SelectTrigger className="h-8 text-xs rounded-md">
                  <SelectValue placeholder="Select Trip or Leave Blank" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Auto-Detect from Vehicle</SelectItem>
                  {assignments.slice(0, 30).map((a) => (
                    <SelectItem key={a.tripId} value={a.tripId}>
                      Trip {a.tripCode} (Route {a.routeCode} - {formatMinutesTo12Hour(a.startTime)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">
                Incident Description & Context
              </label>
              <Textarea
                placeholder="Describe mechanical faults, road bottlenecks, crew leaves, or dispatch constraints..."
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                className="text-xs rounded-md"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReportDialogOpen(false)}
              className="rounded-md text-xs font-medium"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => reportMutation.mutate()}
              disabled={reportMutation.isPending || !reportDescription.trim()}
              className="rounded-md text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
            >
              {reportMutation.isPending ? "Investigating..." : "Submit Incident"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ======================================================== */}
      {/* MANUAL RESOLUTION DIALOG */}
      {/* ======================================================== */}
      <Dialog open={manualResolveDialogOpen} onOpenChange={setManualResolveDialogOpen}>
        <DialogContent className="sm:max-w-md p-6 space-y-4">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">
              Supervisor Manual Issue Resolution
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Record the manual dispatch adjustments or fleet reassignments that resolved this issue.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 text-xs">
            <label className="text-xs font-medium text-foreground">
              Resolution Action & Supervisor Notes
            </label>
            <Textarea
              placeholder="e.g. Dispatched standby Leyland fleet from Saidapet depot to absorb headway."
              value={manualResolveNotes}
              onChange={(e) => setManualResolveNotes(e.target.value)}
              className="text-xs rounded-md"
              rows={3}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setManualResolveDialogOpen(false)}
              className="rounded-md text-xs font-medium"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() =>
                markManuallyResolvedMutation.mutate({
                  issueId: targetManualIssueId,
                  resolutionNotes: manualResolveNotes || "Resolved manually by supervisor.",
                })
              }
              disabled={markManuallyResolvedMutation.isPending}
              className="rounded-md text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
            >
              Confirm Resolution
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
