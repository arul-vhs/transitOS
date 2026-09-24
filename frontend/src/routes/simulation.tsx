import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef, useMemo } from "react";
import { toast } from "sonner";
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  AlertTriangle,
  Bus as BusIcon,
  Users,
  Clock,
  Sparkles,
  Zap,
  MapPin,
  CheckCircle2,
  AlertOctagon,
  ShieldCheck,
  TrendingUp,
  Activity,
  ArrowRight,
  Info,
  Radio,
  Sliders,
  Calendar,
  Layers,
  Wrench,
  Compass,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn, formatMinutesToTime } from "@/lib/utils";

export const Route = createFileRoute("/simulation")({
  head: () => ({
    meta: [
      { title: "Interactive Transit Simulator — TransitOS" },
      { name: "description", content: "Interactive day-in-the-life simulation of Salem City transit operations, fleet movement, and AI auto-recovery." },
    ],
  }),
  component: SimulationPage,
});

// Curated Salem Bus Corridors with actual GPS coordinates
const SALEM_CORRIDORS = [
  {
    id: "r1",
    code: "Route 1",
    name: "Town Bus Stand ⇄ Salem Junction",
    color: "#3B82F6", // Royal Blue
    stops: ["Town Bus Stand", "Collectorate", "Four Roads", "Five Roads", "Suramangalam", "Salem Junction"],
    coords: [
      [11.6528, 78.1591],
      [11.6580, 78.1550],
      [11.6668, 78.1565],
      [11.6705, 78.1437],
      [11.6718, 78.1170],
      [11.6714, 78.1132],
    ],
  },
  {
    id: "r13",
    code: "Route 13",
    name: "Town Bus Stand ⇄ Yercaud Foothills",
    color: "#10B981", // Emerald
    stops: ["Town Bus Stand", "Collectorate", "Sundar Lodge", "Hasthampatti", "Gorimedu", "Kannankurichi", "Yercaud Foothills"],
    coords: [
      [11.6528, 78.1591],
      [11.6580, 78.1550],
      [11.6625, 78.1560],
      [11.6795, 78.1573],
      [11.6965, 78.1635],
      [11.6989, 78.1790],
      [11.7125, 78.1885],
    ],
  },
  {
    id: "r4",
    code: "Route 4",
    name: "Town Bus Stand ⇄ Kondalampatti",
    color: "#F43F5E", // Rose
    stops: ["Town Bus Stand", "Shevapet Market", "Gugai", "Dadagapatti", "Trichy Main Rd", "Kondalampatti"],
    coords: [
      [11.6528, 78.1591],
      [11.6520, 78.1430],
      [11.6432, 78.1508],
      [11.6360, 78.1480],
      [11.6315, 78.1380],
      [11.6305, 78.1248],
    ],
  },
  {
    id: "r33",
    code: "Route 33",
    name: "MGR Central Bus Stand ⇄ Steel Plant",
    color: "#8B5CF6", // Purple
    stops: ["MGR Central", "Meyyanur", "Five Roads", "Salem Junction", "Mamangam", "Jagir Ammapalayam", "Steel Plant"],
    coords: [
      [11.6673, 78.1424],
      [11.6685, 78.1380],
      [11.6705, 78.1437],
      [11.6714, 78.1132],
      [11.6850, 78.1150],
      [11.6780, 78.1020],
      [11.6710, 78.0940],
    ],
  },
  {
    id: "r74",
    code: "Route 74",
    name: "Town Bus Stand ⇄ Omalur Bus Stand",
    color: "#06B6D4", // Cyan
    stops: ["Town Bus Stand", "Four Roads", "MGR Central", "Mamangam", "Karuppur", "Omalur Toll", "Omalur Town"],
    coords: [
      [11.6528, 78.1591],
      [11.6668, 78.1565],
      [11.6673, 78.1424],
      [11.6850, 78.1150],
      [11.7180, 78.0780],
      [11.7320, 78.0580],
      [11.7436, 78.0476],
    ],
  },
];

// Active Simulated Fleet
interface SimBus {
  id: string;
  fleetNumber: string;
  regNumber: string;
  routeId: string;
  routeName: string;
  routeColor: string;
  depot: string;
  driver: string;
  conductor: string;
  driverDrivingMinutes: number;
  passengerCount: number;
  capacity: number;
  speedKmH: number;
  fuelBatteryPct: number;
  status: "on-route" | "breakdown" | "standby" | "delayed";
  currentPosition: [number, number];
  nextStop: string;
  varianceMinutes: number;
  progressAlongRoute: number; // 0.0 to 1.0 along current leg
  direction: "outbound" | "return"; // outbound: Start ➔ Destination; return: Destination ➔ Start
  origin: string;
  destination: string;
  completedTrips: number;
}

const INITIAL_FLEET: SimBus[] = [
  {
    id: "b1",
    fleetNumber: "SLM-MY-101",
    regNumber: "TN-30-N-0412",
    routeId: "r1",
    routeName: "Route 1: Town ⇄ Junction",
    routeColor: "#3B82F6",
    depot: "Meyyanur Depot",
    driver: "Murugesan K.",
    conductor: "Muthusamy G.",
    driverDrivingMinutes: 145,
    passengerCount: 38,
    capacity: 48,
    speedKmH: 32,
    fuelBatteryPct: 88,
    status: "on-route",
    currentPosition: [11.6580, 78.1550],
    nextStop: "Four Roads",
    varianceMinutes: 0,
    progressAlongRoute: 0.25,
    direction: "outbound",
    origin: "Town Bus Stand",
    destination: "Salem Junction",
    completedTrips: 2,
  },
  {
    id: "b2",
    fleetNumber: "SLM-MY-102",
    regNumber: "TN-30-N-0589",
    routeId: "r13",
    routeName: "Route 13: Town ⇄ Yercaud",
    routeColor: "#10B981",
    depot: "Meyyanur Depot",
    driver: "Selvam R.",
    conductor: "Natarajan S.",
    driverDrivingMinutes: 190,
    passengerCount: 41,
    capacity: 42,
    speedKmH: 28,
    fuelBatteryPct: 76,
    status: "on-route",
    currentPosition: [11.6795, 78.1573],
    nextStop: "Gorimedu (Arts College)",
    varianceMinutes: 1,
    progressAlongRoute: 0.50,
    direction: "outbound",
    origin: "Town Bus Stand",
    destination: "Yercaud Foothills",
    completedTrips: 1,
  },
  {
    id: "b3",
    fleetNumber: "SLM-MY-104",
    regNumber: "TN-30-N-0744",
    routeId: "r1",
    routeName: "Route 1: Town ⇄ Junction",
    routeColor: "#3B82F6",
    depot: "Meyyanur Depot",
    driver: "Arumugam V.",
    conductor: "Madhavan P.",
    driverDrivingMinutes: 210,
    passengerCount: 44,
    capacity: 48,
    speedKmH: 35,
    fuelBatteryPct: 69,
    status: "on-route",
    currentPosition: [11.6705, 78.1437],
    nextStop: "Four Roads",
    varianceMinutes: -1,
    progressAlongRoute: 0.40,
    direction: "return", // Returning from Salem Junction back to Town Bus Stand!
    origin: "Salem Junction",
    destination: "Town Bus Stand",
    completedTrips: 3,
  },
  {
    id: "b4",
    fleetNumber: "SLM-JP-201",
    regNumber: "TN-30-N-1205",
    routeId: "r4",
    routeName: "Route 4: Town ⇄ Kondalampatti",
    routeColor: "#F43F5E",
    depot: "Johnsonpet Depot",
    driver: "Marimuthu N.",
    conductor: "Balamurali K.",
    driverDrivingMinutes: 80,
    passengerCount: 29,
    capacity: 48,
    speedKmH: 30,
    fuelBatteryPct: 92,
    status: "on-route",
    currentPosition: [11.6432, 78.1508],
    nextStop: "Dadagapatti",
    varianceMinutes: 0,
    progressAlongRoute: 0.40,
    direction: "outbound",
    origin: "Town Bus Stand",
    destination: "Kondalampatti",
    completedTrips: 2,
  },
  {
    id: "b5",
    fleetNumber: "SLM-SP-401",
    regNumber: "TN-30-N-3120",
    routeId: "r33",
    routeName: "Route 33: Central ⇄ Steel Plant",
    routeColor: "#8B5CF6",
    depot: "Steel Plant Depot",
    driver: "Vignesh R.",
    conductor: "Ganesan P.",
    driverDrivingMinutes: 160,
    passengerCount: 46,
    capacity: 48,
    speedKmH: 38,
    fuelBatteryPct: 81,
    status: "on-route",
    currentPosition: [11.6780, 78.1020],
    nextStop: "Salem Junction",
    varianceMinutes: 0,
    progressAlongRoute: 0.45,
    direction: "return", // Returning from Steel Plant back to MGR Central!
    origin: "Steel Plant",
    destination: "MGR Central Bus Stand",
    completedTrips: 2,
  },
  {
    id: "b6",
    fleetNumber: "SLM-HP-301",
    regNumber: "TN-30-N-2108",
    routeId: "r74",
    routeName: "Route 74: Town ⇄ Omalur",
    routeColor: "#06B6D4",
    depot: "Hasthampatti Depot",
    driver: "Manikandan G.",
    conductor: "Krishnan S.",
    driverDrivingMinutes: 120,
    passengerCount: 34,
    capacity: 48,
    speedKmH: 42,
    fuelBatteryPct: 85,
    status: "on-route",
    currentPosition: [11.7180, 78.0780],
    nextStop: "Omalur Toll",
    varianceMinutes: 2,
    progressAlongRoute: 0.65,
    direction: "outbound",
    origin: "Town Bus Stand",
    destination: "Omalur Town",
    completedTrips: 1,
  },
  {
    id: "b7",
    fleetNumber: "SLM-MY-108",
    regNumber: "TN-30-AA-1420",
    routeId: "standby",
    routeName: "Standby Reserve (Meyyanur)",
    routeColor: "#64748B",
    depot: "Meyyanur Depot",
    driver: "Dhanapal S.",
    conductor: "Saravanan T.",
    driverDrivingMinutes: 0,
    passengerCount: 0,
    capacity: 48,
    speedKmH: 0,
    fuelBatteryPct: 100,
    status: "standby",
    currentPosition: [11.6685, 78.1380], // Meyyanur Depot
    nextStop: "Depot Standby Bay 3",
    varianceMinutes: 0,
    progressAlongRoute: 0.0,
    direction: "outbound",
    origin: "Meyyanur Depot",
    destination: "Standby Bay",
    completedTrips: 0,
  },
];

// Helper: interpolate between coordinate pairs along polyline
function getInterpolatedPosition(coords: number[][], progress: number): [number, number] {
  if (!coords || coords.length === 0) return [11.6673, 78.1424];
  if (coords.length === 1) return [coords[0][0], coords[0][1]];

  const totalSegments = coords.length - 1;
  const clampedProgress = Math.min(1.0, Math.max(0.0, progress));
  const scaledProgress = clampedProgress * totalSegments;
  const index = Math.floor(scaledProgress);
  const frac = scaledProgress - index;

  const p1 = coords[Math.min(index, coords.length - 1)];
  const p2 = coords[Math.min(index + 1, coords.length - 1)];

  const lat = p1[0] + (p2[0] - p1[0]) * frac;
  const lng = p1[1] + (p2[1] - p1[1]) * frac;
  return [lat, lng];
}

function SimulationPage() {
  // Master Clock: in minutes from midnight (e.g. 510 = 08:30 AM)
  const [currentMinutes, setCurrentMinutes] = useState(510);
  const [isPlaying, setIsPlaying] = useState(true);
  const [simSpeed, setSimSpeed] = useState<number>(5); // 1x, 5x, 15x, 60x
  const [fleet, setFleet] = useState<SimBus[]>(INITIAL_FLEET);
  const [selectedBusId, setSelectedBusId] = useState<string>("b3"); // Bus SLM-MY-104 selected by default
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"controls" | "walkthrough" | "telemetry">("controls");

  // Radio Dispatch / Event Ticker Logs
  const [eventLogs, setEventLogs] = useState<Array<{ id: string; time: string; text: string; type: "info" | "alert" | "success" | "recovery" }>>([
    { id: "1", time: "08:15 AM", text: "Dispatch check: 6 vehicles active on Salem corridors, 1 standby bus at Meyyanur Depot.", type: "info" },
    { id: "2", time: "08:22 AM", text: "Driver Murugesan K. (SLM-MY-101) outbound to Salem Junction passed Four Roads with 0 departure variance.", type: "success" },
    { id: "3", time: "08:28 AM", text: "SLM-MY-104 on return journey to Town Bus Stand approaching Five Roads.", type: "info" },
  ]);

  // Leaflet references
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [L, setL] = useState<any>(null);
  const busMarkersRef = useRef<Record<string, any>>({});
  const polylineGroupRef = useRef<any>(null);

  // Dynamic Leaflet Import on client
  useEffect(() => {
    if (typeof window !== "undefined") {
      import("leaflet").then((mod) => {
        setL(mod.default);
      });
    }
  }, []);

  // Main Simulation Loop with True Round-Trip Logic (Start ⇄ Destination)
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentMinutes((prev) => {
        const next = prev + (simSpeed * 0.1);
        return next >= 1380 ? 330 : next; // Reset at 11:00 PM back to 05:30 AM
      });

      // Update bus positions along their respective routes
      setFleet((prevFleet) => {
        const arrivalEvents: Array<{ fleetNumber: string; terminal: string; nextDir: string; nextDest: string }> = [];

        const updatedFleet = prevFleet.map((bus) => {
          if (bus.status === "breakdown" || bus.status === "standby") {
            return bus;
          }

          const corridor = SALEM_CORRIDORS.find((c) => c.id === bus.routeId);
          if (!corridor) return bus;

          // Increment progress smoothly along current trip leg
          const stepDelta = (bus.speedKmH / 60) * 0.002 * simSpeed;
          let newProgress = bus.progressAlongRoute + stepDelta;
          let newDirection = bus.direction;
          let completedTrips = bus.completedTrips;
          let newOrigin = bus.origin;
          let newDestination = bus.destination;

          const startTerminal = corridor.stops[0];
          const endTerminal = corridor.stops[corridor.stops.length - 1];

          // If reached terminal end of current leg
          if (newProgress >= 1.0) {
            completedTrips += 1;
            const arrivedAt = newDestination;

            if (bus.direction === "outbound") {
              // Reached Destination -> Turn around for Return trip back to Start
              newDirection = "return";
              newOrigin = endTerminal;
              newDestination = startTerminal;
            } else {
              // Reached Start -> Turn around for Outbound trip to Destination
              newDirection = "outbound";
              newOrigin = startTerminal;
              newDestination = endTerminal;
            }

            arrivalEvents.push({
              fleetNumber: bus.fleetNumber,
              terminal: arrivedAt,
              nextDir: newDirection === "return" ? "Return" : "Outbound",
              nextDest: newDestination,
            });

            newProgress = newProgress - 1.0;
          }

          // Active coordinates & stops based on current direction
          const activeCoords = newDirection === "outbound"
            ? corridor.coords
            : [...corridor.coords].reverse();

          const activeStops = newDirection === "outbound"
            ? corridor.stops
            : [...corridor.stops].reverse();

          const newPos = getInterpolatedPosition(activeCoords, newProgress);

          // Calculate next stop name along the active direction
          const stopIdx = Math.floor(newProgress * (activeStops.length - 1));
          const nextStop = activeStops[Math.min(stopIdx + 1, activeStops.length - 1)];

          return {
            ...bus,
            direction: newDirection,
            origin: newOrigin,
            destination: newDestination,
            completedTrips,
            progressAlongRoute: newProgress,
            currentPosition: newPos,
            nextStop,
            driverDrivingMinutes: Math.min(360, bus.driverDrivingMinutes + (simSpeed * 0.05)),
          };
        });

        // If any buses reached terminal and turned around, log to radio feed
        if (arrivalEvents.length > 0) {
          setEventLogs((prev) => [
            ...arrivalEvents.map((evt) => ({
              id: String(Date.now() + Math.random()),
              time: formatMinutesToTime(Math.floor(currentMinutes)),
              text: `🔄 TERMINAL TURNAROUND: ${evt.fleetNumber} arrived at ${evt.terminal}. Turned around for ${evt.nextDir} trip ➔ ${evt.nextDest}.`,
              type: "info" as const,
            })),
            ...prev.slice(0, 45),
          ]);
        }

        return updatedFleet;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, simSpeed, currentMinutes]);

  // Initialize and update Leaflet Map
  useEffect(() => {
    if (!L || !mapRef.current) return;

    let map = mapInstanceRef.current;
    if (!map || map.getContainer() !== mapRef.current) {
      if (map) {
        try {
          map.remove();
        } catch {}
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
    }

    // Draw all Salem route corridors
    if (polylineGroupRef.current) {
      polylineGroupRef.current.clearLayers();
      SALEM_CORRIDORS.forEach((corridor) => {
        L.polyline(corridor.coords, {
          color: corridor.color,
          weight: 4,
          opacity: 0.75,
          dashArray: corridor.id === "r74" ? "4, 6" : undefined,
        }).addTo(polylineGroupRef.current);

        // Add stop dots
        corridor.coords.forEach((coord, i) => {
          L.circleMarker(coord, {
            radius: 4,
            fillColor: corridor.color,
            fillOpacity: 0.9,
            color: "#ffffff",
            weight: 1.5,
          })
            .bindTooltip(`${corridor.code}: ${corridor.stops[i]}`, { direction: "top", offset: [0, -5] })
            .addTo(polylineGroupRef.current);
        });
      });
    }
  }, [L]);

  // Update animated bus markers on map
  useEffect(() => {
    if (!L || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    fleet.forEach((bus) => {
      const isSelected = bus.id === selectedBusId;
      const isBreakdown = bus.status === "breakdown";
      const isStandby = bus.status === "standby";

      const dirArrow = bus.direction === "return" ? "◀" : "▶";
      const dirText = bus.direction === "return" ? "Return" : "Outbound";

      const markerHtml = `
        <div class="relative flex items-center justify-center transition-transform ${isSelected ? "scale-125 z-50" : "scale-100"}">
          <div class="size-7 rounded-xl flex items-center justify-center text-white text-[10px] font-mono font-bold shadow-lg border-2 ${
            isBreakdown
              ? "bg-rose-600 border-white animate-bounce"
              : isStandby
              ? "bg-slate-500 border-white opacity-85"
              : isSelected
              ? "bg-primary border-white ring-2 ring-primary ring-offset-2"
              : "bg-slate-900 border-white"
          }">
            🚌
          </div>
          <div class="absolute -bottom-4 px-1.5 py-0.2 rounded bg-slate-900/90 text-white font-mono text-[9px] whitespace-nowrap shadow border border-white/20 flex items-center gap-1">
            <span>${bus.fleetNumber.split("-")[2]}</span>
            ${!isStandby ? `<span class="text-[8px] font-bold ${bus.direction === "return" ? "text-amber-400" : "text-emerald-400"}">${dirArrow}</span>` : ""}
          </div>
        </div>
      `;

      const icon = L.divIcon({
        html: markerHtml,
        className: "custom-bus-marker",
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const tooltipContent = isStandby
        ? `<strong>${bus.fleetNumber}</strong><br/>Standby Reserve at ${bus.depot}`
        : `<strong>${bus.fleetNumber}</strong> (${dirText} Trip)<br/>Heading to: <strong>${bus.destination}</strong><br/>Next Stop: ${bus.nextStop}<br/>Trip #${bus.completedTrips + 1}`;

      if (busMarkersRef.current[bus.id]) {
        busMarkersRef.current[bus.id].setLatLng(bus.currentPosition);
        busMarkersRef.current[bus.id].setIcon(icon);
        busMarkersRef.current[bus.id].setTooltipContent(tooltipContent);
      } else {
        const marker = L.marker(bus.currentPosition, { icon })
          .bindTooltip(tooltipContent, { direction: "top", offset: [0, -16] })
          .on("click", () => {
            setSelectedBusId(bus.id);
          })
          .addTo(map);
        busMarkersRef.current[bus.id] = marker;
      }
    });
  }, [L, fleet, selectedBusId]);

  const selectedBus = fleet.find((b) => b.id === selectedBusId) || fleet[0];

  // Simulation Time Phase description
  const timePhase = useMemo(() => {
    const h = Math.floor(currentMinutes / 60);
    if (h < 7) return { title: "Dawn Launch & Depots Pull-Out", badge: "Morning Rollout", color: "text-amber-500" };
    if (h < 10) return { title: "Morning Peak Commute (Heavy Load)", badge: "Peak Rush", color: "text-rose-500 font-bold" };
    if (h < 16) return { title: "Steady Daytime Service", badge: "Normal Operations", color: "text-emerald-500" };
    if (h < 20) return { title: "Evening Return Peak (Heavy Load)", badge: "Evening Peak", color: "text-primary font-bold" };
    return { title: "Late Night Wind-down & Depot Influx", badge: "Night Shift", color: "text-indigo-400" };
  }, [currentMinutes]);

  // SCENARIO 1: Simulate Bus Breakdown
  const triggerBreakdownScenario = () => {
    setActiveScenario("breakdown");
    setIsPlaying(false); // Pause so the user can inspect the incident
    setFleet((prev) =>
      prev.map((b) =>
        b.id === "b3" ? { ...b, status: "breakdown", speedKmH: 0, varianceMinutes: 18 } : b
      )
    );
    setSelectedBusId("b3");
    toast.error("🚨 EMERGENCY: Bus SLM-MY-104 reported engine temperature failure at Five Roads!", {
      duration: 6000,
    });
    setEventLogs((prev) => [
      {
        id: String(Date.now()),
        time: formatMinutesToTime(Math.floor(currentMinutes)),
        text: "🚨 BREAKDOWN ALERT: Bus SLM-MY-104 stalled at Five Roads. Disruption Radar triggered.",
        type: "alert",
      },
      ...prev,
    ]);
  };

  // SCENARIO 1 RECOVERY: Dispatch Standby Bus
  const resolveBreakdownRecovery = () => {
    setFleet((prev) =>
      prev.map((b) => {
        if (b.id === "b3") {
          return { ...b, status: "standby", routeName: "Towed to Meyyanur Bay 2" };
        }
        if (b.id === "b7") {
          // Standby bus deploys to cover the route!
          return {
            ...b,
            status: "on-route",
            routeId: "r1",
            routeName: "Route 1: Town ⇄ Junction (Relief Run)",
            routeColor: "#3B82F6",
            direction: "return",
            origin: "Salem Junction",
            destination: "Town Bus Stand",
            completedTrips: 1,
            currentPosition: [11.6705, 78.1437], // At Five Roads
            speedKmH: 34,
            passengerCount: 44,
            varianceMinutes: 3,
            progressAlongRoute: 0.40,
            nextStop: "Four Roads",
          };
        }
        return b;
      })
    );
    setSelectedBusId("b7");
    setActiveScenario(null);
    setIsPlaying(true);
    toast.success("✅ RECOVERY DEPLOYED: Standby Bus SLM-MY-108 dispatched on Return trip to Town Bus Stand!", {
      duration: 6000,
    });
    setEventLogs((prev) => [
      {
        id: String(Date.now()),
        time: formatMinutesToTime(Math.floor(currentMinutes)),
        text: "✅ INCIDENT RESOLVED: Standby Bus SLM-MY-108 accepted Route 1 duty. 0 passengers stranded.",
        type: "recovery",
      },
      ...prev,
    ]);
  };

  // SCENARIO 2: Inject Traffic Congestion
  const triggerTrafficScenario = () => {
    setActiveScenario("traffic");
    setFleet((prev) =>
      prev.map((b) =>
        b.id === "b1" ? { ...b, speedKmH: 12, varianceMinutes: 14 } : b
      )
    );
    setSelectedBusId("b1");
    toast.warning("🚦 CONGESTION SPIKE: Junction corridor gridlock detected. Arrival variance +14 min.", {
      duration: 5000,
    });
    setEventLogs((prev) => [
      {
        id: String(Date.now()),
        time: formatMinutesToTime(Math.floor(currentMinutes)),
        text: "🚦 TRAFFIC ALERT: SLM-MY-101 speed dropped to 12 km/h. Headway regulator deployed.",
        type: "alert",
      },
      ...prev,
    ]);
  };

  // SCENARIO 3: Trigger Driver Fatigue / Rest Handover
  const triggerDriverRestScenario = () => {
    setActiveScenario("driver-rest");
    setFleet((prev) =>
      prev.map((b) =>
        b.id === "b1" ? { ...b, driverDrivingMinutes: 245 } : b
      )
    );
    setSelectedBusId("b1");
    toast.info("👨‍✈️ COMPLIANCE ALERT: Driver Murugesan K. reached 240 mins continuous driving limit!", {
      duration: 6000,
    });
    setEventLogs((prev) => [
      {
        id: String(Date.now()),
        time: formatMinutesToTime(Math.floor(currentMinutes)),
        text: "👨‍✈️ MVA COMPLIANCE: Driver Murugesan reached 4.0 hr limit. Mandating relief handover.",
        type: "info",
      },
      ...prev,
    ]);
  };

  // SCENARIO 3 RECOVERY: Execute Driver Handover
  const resolveDriverHandover = () => {
    setFleet((prev) =>
      prev.map((b) =>
        b.id === "b1"
          ? { ...b, driver: "Palanisamy M. (Relief Driver)", driverDrivingMinutes: 15 }
          : b
      )
    );
    setActiveScenario(null);
    toast.success("✅ CREW HANDOVER COMPLETED: Driver Palanisamy M. took over at Town Bus Stand.", {
      duration: 5000,
    });
    setEventLogs((prev) => [
      {
        id: String(Date.now()),
        time: formatMinutesToTime(Math.floor(currentMinutes)),
        text: "✅ HANDOVER VERIFIED: Palanisamy M. logged as active driver. Murugesan K. on mandatory rest.",
        type: "success",
      },
      ...prev,
    ]);
  };

  // Reset Simulation
  const resetSimulation = () => {
    setCurrentMinutes(510);
    setFleet(INITIAL_FLEET);
    setSelectedBusId("b3");
    setActiveScenario(null);
    setIsPlaying(true);
    toast.info("Simulation clock reset to 08:30 AM.");
  };

  return (
    <AppShell
      title="Interactive Operations Simulator"
      subtitle="Experience TransitOS in action: real-time vehicle dispatch, telemetry streaming, and automated disruption healing."
      actions={
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-xs border-indigo-500/30 text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 gap-1.5">
            <span className="size-2 rounded-full bg-indigo-500 animate-ping"></span>
            Simulation Deck
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={resetSimulation}
            className="text-xs h-8 gap-1.5 cursor-pointer"
          >
            <RotateCcw className="size-3.5" />
            Reset 08:30 AM
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* 1. MASTER SIMULATION CONTROLLER & CLOCK DECK */}
        <div className="glass-panel p-4 sm:p-5 rounded-3xl bg-linear-to-r from-card via-card to-primary/5 border border-border/80 shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Clock & Phase */}
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xs">
                <Clock className="size-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-extrabold font-mono tracking-tight text-foreground">
                    {formatMinutesToTime(Math.floor(currentMinutes))}
                  </span>
                  <Badge variant="outline" className={cn("text-[11px] font-semibold px-2 py-0.5", timePhase.color)}>
                    {timePhase.badge}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{timePhase.title}</p>
              </div>
            </div>

            {/* Play / Pause & Speed Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border/60">
                <Button
                  variant={isPlaying ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="h-8 px-3 rounded-lg text-xs gap-1.5 font-semibold cursor-pointer"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="size-3.5" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="size-3.5" />
                      Resume
                    </>
                  )}
                </Button>
              </div>

              {/* Speed Buttons */}
              <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border/60">
                {[
                  { label: "1x", val: 1 },
                  { label: "5x", val: 5 },
                  { label: "15x", val: 15 },
                  { label: "60x", val: 60 },
                ].map((s) => (
                  <Button
                    key={s.val}
                    variant={simSpeed === s.val ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setSimSpeed(s.val)}
                    className="h-8 px-2.5 rounded-lg text-xs font-mono font-bold cursor-pointer"
                  >
                    {s.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Time Scrubber Slider */}
          <div className="mt-4 pt-3 border-t border-border/50">
            <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground mb-1">
              <span>05:30 AM (Start)</span>
              <span className="font-semibold text-primary">Time Scrubber (Drag to fast-forward)</span>
              <span>11:00 PM (Depot Pull-in)</span>
            </div>
            <input
              type="range"
              min={330}
              max={1380}
              value={Math.floor(currentMinutes)}
              onChange={(e) => setCurrentMinutes(Number(e.target.value))}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>
        </div>

        {/* 2. MAIN WORKSPACE: MAP (LEFT) & TELEMETRY/SCENARIO DECK (RIGHT) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* MAP CANVAS (7 COLS) */}
          <div className="lg:col-span-7 space-y-3">
            <div className="glass-panel p-4 rounded-3xl relative overflow-hidden flex flex-col h-[520px]">
              {/* Map Header Bar */}
              <div className="flex items-center justify-between pb-3 border-b border-border/50 z-10">
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                  <span className="text-xs font-bold text-foreground">Salem City Corridors (Live Fleet Map)</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground">
                  <span>{fleet.filter((b) => b.status === "on-route").length} Moving</span>
                  <span>•</span>
                  <span>{fleet.filter((b) => b.status === "standby").length} Standby</span>
                </div>
              </div>

              {/* Leaflet DOM Node */}
              <div ref={mapRef} className="flex-1 w-full rounded-2xl z-0 mt-2" />

              {/* Active Route Legend Bar */}
              <div className="mt-2 pt-2 border-t border-border/50 flex flex-wrap items-center gap-3 text-[11px] font-mono">
                {SALEM_CORRIDORS.map((c) => (
                  <div key={c.id} className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full" style={{ backgroundColor: c.color }}></span>
                    <span className="text-muted-foreground">{c.code}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Fleet Carousel */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {fleet.map((bus) => {
                const isSelected = bus.id === selectedBusId;
                const isBreakdown = bus.status === "breakdown";
                const isStandby = bus.status === "standby";

                return (
                  <button
                    key={bus.id}
                    onClick={() => setSelectedBusId(bus.id)}
                    className={cn(
                      "p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between",
                      isSelected
                        ? "border-primary bg-primary/10 shadow-sm"
                        : isBreakdown
                        ? "border-rose-500/50 bg-rose-500/10 animate-pulse"
                        : isStandby
                        ? "border-border/60 bg-muted/40"
                        : "border-border/60 bg-card hover:border-border"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-foreground">{bus.fleetNumber.split("-")[2]}</span>
                      <span
                        className={cn(
                          "size-2 rounded-full",
                          isBreakdown ? "bg-rose-500" : isStandby ? "bg-slate-400" : "bg-emerald-500"
                        )}
                      ></span>
                    </div>
                    <div className="flex items-center justify-between mt-1 text-[10px] text-muted-foreground">
                      <span className="truncate">
                        {isBreakdown ? "Breakdown" : isStandby ? "Standby" : bus.routeName.split(":")[0]}
                      </span>
                      {!isStandby && !isBreakdown && (
                        <span className={cn("font-mono text-[9px] font-bold ml-1", bus.direction === "return" ? "text-amber-500" : "text-emerald-500")}>
                          {bus.direction === "return" ? "◀" : "▶"}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* TELEMETRY & SCENARIO TESTING DECK (5 COLS) */}
          <div className="lg:col-span-5 space-y-4">
            {/* TABS: CONTROLS & SCENARIOS vs GUIDED WALKTHROUGH vs TELEMETRY */}
            <div className="flex items-center bg-muted/60 p-1 rounded-2xl border border-border/60">
              <button
                onClick={() => setActiveTab("controls")}
                className={cn(
                  "flex-1 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer",
                  activeTab === "controls" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                )}
              >
                🎮 Test Scenarios
              </button>
              <button
                onClick={() => setActiveTab("walkthrough")}
                className={cn(
                  "flex-1 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer",
                  activeTab === "walkthrough" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                )}
              >
                📖 4-Step Tour
              </button>
              <button
                onClick={() => setActiveTab("telemetry")}
                className={cn(
                  "flex-1 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer",
                  activeTab === "telemetry" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                )}
              >
                📡 Radio Log ({eventLogs.length})
              </button>
            </div>

            {/* TAB 1: SCENARIOS & TELEMETRY */}
            {activeTab === "controls" && (
              <div className="space-y-4">
                {/* ACTIVE SELECTED BUS TELEMETRY CARD */}
                <div className="glass-panel p-4 rounded-3xl border-primary/30 relative overflow-hidden">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-base text-foreground font-mono">{selectedBus.fleetNumber}</h4>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] font-mono uppercase px-1.5 py-0.2",
                            selectedBus.status === "breakdown"
                              ? "border-rose-500/40 text-rose-500 bg-rose-500/10"
                              : selectedBus.status === "standby"
                              ? "border-slate-500/40 text-slate-500 bg-slate-500/10"
                              : "border-emerald-500/40 text-emerald-600 bg-emerald-500/10"
                          )}
                        >
                          {selectedBus.status}
                        </Badge>
                        {selectedBus.status !== "standby" && (
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] font-mono px-1.5 py-0.2",
                              selectedBus.direction === "return"
                                ? "border-amber-500/40 text-amber-600 bg-amber-500/10"
                                : "border-indigo-500/40 text-indigo-600 bg-indigo-500/10"
                            )}
                          >
                            {selectedBus.direction === "return" ? "◀ Return Trip" : "▶ Outbound Trip"}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{selectedBus.routeName}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold font-mono text-foreground">{selectedBus.speedKmH} km/h</span>
                      <p className="text-[10px] text-muted-foreground">Speed Telemetry</p>
                    </div>
                  </div>

                  {/* Current Journey Route Path & Progress */}
                  {selectedBus.status !== "standby" && (
                    <div className="mt-3 p-2.5 rounded-2xl bg-muted/30 border border-border/60 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-bold text-foreground truncate">{selectedBus.origin}</span>
                          <span className="text-muted-foreground">➔</span>
                          <span className="font-bold text-primary truncate">{selectedBus.destination}</span>
                        </div>
                        <Badge variant="secondary" className="text-[10px] font-mono shrink-0">
                          Trip #{selectedBus.completedTrips + 1}
                        </Badge>
                      </div>

                      {/* Progress Bar of current trip leg */}
                      <div className="space-y-1">
                        <Progress value={Math.round(selectedBus.progressAlongRoute * 100)} className="h-1.5" />
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                          <span>Dep: {selectedBus.origin.split(" ")[0]}</span>
                          <span>{Math.round(selectedBus.progressAlongRoute * 100)}% route complete</span>
                          <span>Term: {selectedBus.destination.split(" ")[0]}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Telemetry Metrics Grid */}
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-border/50 text-xs">
                    <div className="p-2 rounded-xl bg-muted/40">
                      <p className="text-[10px] text-muted-foreground">Next Stop</p>
                      <p className="font-semibold text-foreground truncate mt-0.5">{selectedBus.nextStop}</p>
                    </div>

                    <div className="p-2 rounded-xl bg-muted/40">
                      <p className="text-[10px] text-muted-foreground">Passenger Load</p>
                      <p className="font-semibold text-foreground mt-0.5">
                        {selectedBus.passengerCount} / {selectedBus.capacity} ({Math.round((selectedBus.passengerCount / selectedBus.capacity) * 100)}%)
                      </p>
                    </div>

                    <div className="p-2 rounded-xl bg-muted/40">
                      <p className="text-[10px] text-muted-foreground">Driver</p>
                      <p className="font-semibold text-foreground truncate mt-0.5">{selectedBus.driver}</p>
                    </div>

                    <div className="p-2 rounded-xl bg-muted/40">
                      <p className="text-[10px] text-muted-foreground">Continuous Driving</p>
                      <p
                        className={cn(
                          "font-semibold mt-0.5 font-mono",
                          selectedBus.driverDrivingMinutes >= 240 ? "text-rose-500 font-bold" : "text-foreground"
                        )}
                      >
                        {Math.floor(selectedBus.driverDrivingMinutes)} mins{" "}
                        {selectedBus.driverDrivingMinutes >= 240 && "⚠️ REST EXCEEDED"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* SCENARIO INJECTOR PANEL */}
                <div className="glass-panel p-4 rounded-3xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="size-4 text-primary" />
                      <span className="text-xs font-bold text-foreground">Interactive Scenarios (Click to Inject)</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] text-muted-foreground font-mono">
                      Real-World Demos
                    </Badge>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Click any real-world incident below to see how TransitOS's AI Disruption Radar and Rescheduling Engine respond in real-time:
                  </p>

                  <div className="space-y-2">
                    {/* Scenario 1: Breakdown */}
                    <div className="p-3 rounded-2xl border border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="size-2 rounded-full bg-rose-500"></span>
                            <span className="text-xs font-bold text-foreground">Scenario 1: Vehicle Engine Breakdown</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Bus SLM-MY-104 suffers engine failure on Route 1 at Five Roads.
                          </p>
                        </div>
                        {activeScenario === "breakdown" ? (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={resolveBreakdownRecovery}
                            className="text-xs h-7 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer whitespace-nowrap"
                          >
                            Accept Auto-Recovery
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={triggerBreakdownScenario}
                            className="text-xs h-7 border-rose-500/40 text-rose-600 hover:bg-rose-500/10 cursor-pointer whitespace-nowrap"
                          >
                            Trigger Breakdown
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Scenario 2: Traffic Delay */}
                    <div className="p-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="size-2 rounded-full bg-amber-500"></span>
                            <span className="text-xs font-bold text-foreground">Scenario 2: Traffic Congestion Spike</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Spikes arrival variance by +14 min on Salem Junction corridor.
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={triggerTrafficScenario}
                          className="text-xs h-7 border-amber-500/40 text-amber-600 hover:bg-amber-500/10 cursor-pointer whitespace-nowrap"
                        >
                          Inject Traffic
                        </Button>
                      </div>
                    </div>

                    {/* Scenario 3: Driver Rest Compliance Handover */}
                    <div className="p-3 rounded-2xl border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="size-2 rounded-full bg-primary"></span>
                            <span className="text-xs font-bold text-foreground">Scenario 3: Driver 4-Hour Limit Handover</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Driver hits 240 mins continuous steering limit; mandates relief handover.
                          </p>
                        </div>
                        {activeScenario === "driver-rest" ? (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={resolveDriverHandover}
                            className="text-xs h-7 bg-primary text-primary-foreground cursor-pointer whitespace-nowrap"
                          >
                            Swap Relief Driver
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={triggerDriverRestScenario}
                            className="text-xs h-7 border-primary/40 text-primary hover:bg-primary/10 cursor-pointer whitespace-nowrap"
                          >
                            Simulate Fatigue
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: GUIDED 4-ACT OPERATIONAL TOUR */}
            {activeTab === "walkthrough" && (
              <div className="glass-panel p-5 rounded-3xl space-y-4">
                <div className="flex items-center gap-2">
                  <div className="size-7 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-foreground">1. Network & Timetable Architecture</h4>
                    <p className="text-[11px] text-muted-foreground">Defining corridors, stops, and departure headway.</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed pl-9">
                  Operators configure routes (like Route 1: Town ⇄ Junction), geo-located bus stops, and generate the daily departure timetable.
                </p>
                <div className="pl-9">
                  <Link to="/operations/trips" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
                    Open Timetable & Departures <ArrowRight className="size-3" />
                  </Link>
                </div>

                <div className="pt-3 border-t border-border/50 flex items-center gap-2">
                  <div className="size-7 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                    2
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-foreground">2. Google OR-Tools AI Schedule Optimization</h4>
                    <p className="text-[11px] text-muted-foreground">Solving mixed-integer vehicle & crew duties.</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed pl-9">
                  Instead of manual guesswork, the AI solver batches trips into legal shifts, guaranteeing drivers never exceed 240 mins continuous driving and get 8h mandatory rest.
                </p>
                <div className="pl-9">
                  <Link to="/scheduling/optimizer" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
                    Open AI Schedule Optimizer <ArrowRight className="size-3" />
                  </Link>
                </div>

                <div className="pt-3 border-t border-border/50 flex items-center gap-2">
                  <div className="size-7 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                    3
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-foreground">3. Real-Time Fleet Dispatch & Live Tracking</h4>
                    <p className="text-[11px] text-muted-foreground">Monitoring vehicles, passenger load, and adherence.</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed pl-9">
                  The operations desk tracks buses moving across Salem corridors, alerting dispatchers if a bus falls behind schedule by more than 5 minutes.
                </p>
                <div className="pl-9">
                  <Link to="/operations/today" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
                    Open Live Dispatch Board <ArrowRight className="size-3" />
                  </Link>
                </div>

                <div className="pt-3 border-t border-border/50 flex items-center gap-2">
                  <div className="size-7 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                    4
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-foreground">4. Automated Disruption Recovery</h4>
                    <p className="text-[11px] text-muted-foreground">Instant self-healing when vehicles break down.</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed pl-9">
                  When a breakdown occurs, Disruption Radar generates candidate recovery plans, automatically recommending the lowest-delay standby vehicle dispatch.
                </p>
                <div className="pl-9">
                  <Link to="/operations/incidents" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
                    Open Disruption Radar <ArrowRight className="size-3" />
                  </Link>
                </div>
              </div>
            )}

            {/* TAB 3: RADIO LOGS & EVENT STREAM */}
            {activeTab === "telemetry" && (
              <div className="glass-panel p-4 rounded-3xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Radio className="size-4 text-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-foreground">Live Telemetry & Radio Dispatch Feed</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEventLogs([])}
                    className="text-[10px] h-6 px-2 text-muted-foreground"
                  >
                    Clear Feed
                  </Button>
                </div>

                <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                  {eventLogs.map((log) => (
                    <div
                      key={log.id}
                      className={cn(
                        "p-2.5 rounded-xl border text-xs leading-relaxed",
                        log.type === "alert"
                          ? "border-rose-500/30 bg-rose-500/5 text-rose-700 dark:text-rose-300"
                          : log.type === "recovery" || log.type === "success"
                          ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300"
                          : "border-border/60 bg-muted/30 text-muted-foreground"
                      )}
                    >
                      <div className="flex items-center justify-between font-mono text-[10px] text-muted-foreground mb-1">
                        <span>{log.time}</span>
                        <span className="uppercase font-semibold tracking-wider">{log.type}</span>
                      </div>
                      <p className="font-sans text-xs">{log.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
