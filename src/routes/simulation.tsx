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
  Check,
  CheckCheck,
  Gauge,
  BatteryCharging,
  Fuel,
  TrendingDown,
  FileSpreadsheet,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { useActiveTenant } from "@/lib/tenant-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatRouteNumber } from "@/lib/route-utils";
import { cn, formatMinutesToTime } from "@/lib/utils";

export const Route = createFileRoute("/simulation")({
  head: () => ({
    meta: [
      { title: "Interactive Transit Simulator: TransitOS" },
      {
        name: "description",
        content:
          "Multi-corridor transit operations simulation, real-time fleet movement, telemetry tracking, and automated recovery engine.",
      },
    ],
  }),
  component: SimulationPage,
});

export interface SimBus {
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
  status: "on-route" | "standby" | "breakdown" | "maintenance";
  currentPosition: [number, number];
  nextStop: string;
  varianceMinutes: number;
  progressAlongRoute: number;
  direction: "outbound" | "return";
  origin: string;
  destination: string;
  completedTrips: number;
}

// 1. Chennai MTC Corridors with actual GPS coordinates
export const CHENNAI_CORRIDORS = [
  {
    id: "r-570",
    code: "Route 570",
    name: "CMBT Koyambedu ⇄ Kelambakkam Bus Stand",
    color: "#2563EB",
    stops: [
      "CMBT Koyambedu",
      "Vadapalani",
      "Guindy Kathipara",
      "Velachery Checkpost",
      "Perungudi Toll Plaza",
      "Thoraipakkam",
      "Sholinganallur Junction",
      "Navalur",
      "Siruseri SIPCOT",
      "Kelambakkam Bus Stand",
    ],
    coords: [
      [13.0673, 80.2057],
      [13.0512, 80.2120],
      [13.0067, 80.2023],
      [12.9815, 80.2209],
      [12.9556, 80.2443],
      [12.9351, 80.2348],
      [12.9010, 80.2279],
      [12.8465, 80.2263],
      [12.8284, 80.2195],
      [12.7876, 80.2185],
    ],
  },
  {
    id: "r-102",
    code: "Route 102",
    name: "Broadway ⇄ Kelambakkam Bus Stand",
    color: "#059669",
    stops: [
      "Broadway Bus Terminus",
      "Chennai Central",
      "Anna Square",
      "Luz Corner",
      "Adyar Depot",
      "Thiruvanmiyur",
      "Perungudi Toll Plaza",
      "Sholinganallur Junction",
      "Navalur",
      "Kelambakkam Bus Stand",
    ],
    coords: [
      [13.0876, 80.2838],
      [13.0827, 80.2757],
      [13.0645, 80.2858],
      [13.0354, 80.2678],
      [12.9978, 80.2562],
      [12.9830, 80.2594],
      [12.9556, 80.2443],
      [12.9010, 80.2279],
      [12.8465, 80.2263],
      [12.7876, 80.2185],
    ],
  },
  {
    id: "r-29a",
    code: "Route 29A",
    name: "Anna Square ⇄ Perambur Bus Terminus",
    color: "#D97706",
    stops: [
      "Anna Square",
      "Chintadripet Station",
      "Chennai Central",
      "Periyamedu",
      "Kilpauk Medical College",
      "Ayanavaram Depot",
      "Perambur Terminus",
    ],
    coords: [
      [13.0645, 80.2858],
      [13.0768, 80.2715],
      [13.0827, 80.2757],
      [13.0839, 80.2704],
      [13.0792, 80.2418],
      [13.0991, 80.2351],
      [13.1105, 80.2435],
    ],
  },
  {
    id: "r-21g",
    code: "Route 21G",
    name: "Broadway ⇄ Tambaram West",
    color: "#1D4ED8",
    stops: [
      "Broadway Terminus",
      "Chennai Central",
      "LIC Anna Salai",
      "Saidapet Bus Stand",
      "Guindy Kathipara",
      "Chennai Airport",
      "Chromepet Station",
      "Tambaram West",
    ],
    coords: [
      [13.0876, 80.2838],
      [13.0827, 80.2757],
      [13.0632, 80.2651],
      [13.0205, 80.2228],
      [13.0067, 80.2023],
      [12.9818, 80.1648],
      [12.9517, 80.1411],
      [12.9249, 80.1265],
    ],
  },
  {
    id: "r-54",
    code: "Route 54",
    name: "Broadway ⇄ Poonamallee",
    color: "#0D9488",
    stops: [
      "Broadway Terminus",
      "Chennai Central",
      "Thousand Lights",
      "Guindy Kathipara",
      "Porur Roundtana",
      "Poonamallee Terminus",
    ],
    coords: [
      [13.0876, 80.2838],
      [13.0827, 80.2757],
      [13.0548, 80.2529],
      [13.0067, 80.2023],
      [13.0336, 80.1587],
      [13.0494, 80.0911],
    ],
  },
];

export const CHENNAI_INITIAL_FLEET: SimBus[] = [
  {
    id: "b-mtc-1",
    fleetNumber: "MTC-BDW-101",
    regNumber: "TN-01-N-1001",
    routeId: "r-570",
    routeName: "Route 570: CMBT ⇄ Kelambakkam",
    routeColor: "#2563EB",
    depot: "Central / Broadway Depot",
    driver: "R. Senthil",
    conductor: "K. Murugan",
    driverDrivingMinutes: 145,
    passengerCount: 46,
    capacity: 55,
    speedKmH: 34,
    fuelBatteryPct: 88,
    status: "on-route",
    currentPosition: [13.0067, 80.2023],
    nextStop: "Guindy Kathipara",
    varianceMinutes: 0,
    progressAlongRoute: 0.25,
    direction: "outbound",
    origin: "CMBT Koyambedu",
    destination: "Kelambakkam Bus Stand",
    completedTrips: 2,
  },
  {
    id: "b-mtc-2",
    fleetNumber: "MTC-ADY-102",
    regNumber: "TN-01-N-1002",
    routeId: "r-102",
    routeName: "Route 102: Broadway ⇄ Kelambakkam",
    routeColor: "#059669",
    depot: "Adyar Depot",
    driver: "M. Palani",
    conductor: "S. Anbalagan",
    driverDrivingMinutes: 190,
    passengerCount: 42,
    capacity: 55,
    speedKmH: 30,
    fuelBatteryPct: 76,
    status: "on-route",
    currentPosition: [12.9978, 80.2562],
    nextStop: "Adyar Depot",
    varianceMinutes: 1,
    progressAlongRoute: 0.45,
    direction: "outbound",
    origin: "Broadway Bus Terminus",
    destination: "Kelambakkam Bus Stand",
    completedTrips: 1,
  },
  {
    id: "b-mtc-3",
    fleetNumber: "MTC-ANW-103",
    regNumber: "TN-01-N-1003",
    routeId: "r-29a",
    routeName: "Route 29A: Anna Sq ⇄ Perambur",
    routeColor: "#D97706",
    depot: "Annanagar West Depot",
    driver: "V. Selvam",
    conductor: "P. Arumugam",
    driverDrivingMinutes: 210,
    passengerCount: 38,
    capacity: 55,
    speedKmH: 28,
    fuelBatteryPct: 69,
    status: "on-route",
    currentPosition: [13.0827, 80.2757],
    nextStop: "Chennai Central",
    varianceMinutes: -1,
    progressAlongRoute: 0.35,
    direction: "return",
    origin: "Perambur Terminus",
    destination: "Anna Square",
    completedTrips: 3,
  },
  {
    id: "b-mtc-4",
    fleetNumber: "MTC-CMB-104",
    regNumber: "TN-01-N-1004",
    routeId: "r-21g",
    routeName: "Route 21G: Broadway ⇄ Tambaram",
    routeColor: "#1D4ED8",
    depot: "CMBT Koyambedu Depot",
    driver: "T. Natarajan",
    conductor: "A. Subramanian",
    driverDrivingMinutes: 85,
    passengerCount: 52,
    capacity: 55,
    speedKmH: 32,
    fuelBatteryPct: 91,
    status: "on-route",
    currentPosition: [12.9818, 80.1648],
    nextStop: "Chennai Airport",
    varianceMinutes: 0,
    progressAlongRoute: 0.65,
    direction: "outbound",
    origin: "Broadway Terminus",
    destination: "Tambaram West",
    completedTrips: 2,
  },
  {
    id: "b-mtc-5",
    fleetNumber: "MTC-VDP-105",
    regNumber: "TN-01-N-1005",
    routeId: "r-54",
    routeName: "Route 54: Broadway ⇄ Poonamallee",
    routeColor: "#0D9488",
    depot: "Vadapalani Depot",
    driver: "G. Karthik",
    conductor: "D. Vijayan",
    driverDrivingMinutes: 160,
    passengerCount: 44,
    capacity: 55,
    speedKmH: 36,
    fuelBatteryPct: 82,
    status: "on-route",
    currentPosition: [13.0067, 80.2023],
    nextStop: "Guindy Kathipara",
    varianceMinutes: 0,
    progressAlongRoute: 0.5,
    direction: "outbound",
    origin: "Broadway Terminus",
    destination: "Poonamallee Terminus",
    completedTrips: 1,
  },
  {
    id: "b-mtc-6",
    fleetNumber: "MTC-BDW-107",
    regNumber: "TN-01-N-1007",
    routeId: "r-570",
    routeName: "Route 570: CMBT ⇄ Kelambakkam",
    routeColor: "#2563EB",
    depot: "Central / Broadway Depot",
    driver: "E. Balasubramani",
    conductor: "M. Gunasekaran",
    driverDrivingMinutes: 0,
    passengerCount: 0,
    capacity: 55,
    speedKmH: 0,
    fuelBatteryPct: 100,
    status: "standby",
    currentPosition: [13.0876, 80.2838],
    nextStop: "Central / Broadway Depot",
    varianceMinutes: 0,
    progressAlongRoute: 0.0,
    direction: "outbound",
    origin: "Central / Broadway Depot",
    destination: "Standby Reserve",
    completedTrips: 0,
  },
];

// 2. Salem Transport Corporation Corridors with actual GPS coordinates
export const SALEM_CORRIDORS = [
  {
    id: "r1",
    code: "Route 1",
    name: "Town Bus Stand ⇄ Salem Junction",
    color: "#2563EB",
    stops: [
      "Town Bus Stand",
      "Collectorate",
      "Four Roads",
      "Five Roads",
      "Suramangalam",
      "Salem Junction",
    ],
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
    color: "#059669",
    stops: [
      "Town Bus Stand",
      "Collectorate",
      "Sundar Lodge",
      "Hasthampatti",
      "Gorimedu",
      "Kannankurichi",
      "Yercaud Foothills",
    ],
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
    color: "#0284C7",
    stops: [
      "Town Bus Stand",
      "Shevapet Market",
      "Gugai",
      "Dadagapatti",
      "Trichy Main Rd",
      "Kondalampatti",
    ],
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
    color: "#0D9488",
    stops: [
      "MGR Central",
      "Meyyanur",
      "Five Roads",
      "Salem Junction",
      "Mamangam",
      "Jagir Ammapalayam",
      "Steel Plant",
    ],
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
    color: "#0369A1",
    stops: [
      "Town Bus Stand",
      "Four Roads",
      "MGR Central",
      "Mamangam",
      "Karuppur",
      "Omalur Toll",
      "Omalur Town",
    ],
    coords: [
      [11.6528, 78.1591],
      [11.6668, 78.1565],
      [11.6673, 78.1424],
      [11.6850, 78.1150],
      [11.7080, 78.0980],
      [11.7180, 78.0780],
      [11.7350, 78.0420],
    ],
  },
];

export const SALEM_INITIAL_FLEET: SimBus[] = [
  {
    id: "b1",
    fleetNumber: "SLM-MY-101",
    regNumber: "TN-30-N-1012",
    routeId: "r1",
    routeName: "Route 1: Town ⇄ Salem Junction",
    routeColor: "#2563EB",
    depot: "Meyyanur Depot",
    driver: "Murugesan K.",
    conductor: "Natarajan S.",
    driverDrivingMinutes: 135,
    passengerCount: 41,
    capacity: 48,
    speedKmH: 32,
    fuelBatteryPct: 86,
    status: "on-route",
    currentPosition: [11.6668, 78.1565],
    nextStop: "Five Roads",
    varianceMinutes: 0,
    progressAlongRoute: 0.35,
    direction: "outbound",
    origin: "Town Bus Stand",
    destination: "Salem Junction",
    completedTrips: 2,
  },
  {
    id: "b2",
    fleetNumber: "SLM-HP-102",
    regNumber: "TN-30-N-1145",
    routeId: "r13",
    routeName: "Route 13: Town ⇄ Yercaud Foothills",
    routeColor: "#059669",
    depot: "Hasthampatti Depot",
    driver: "Selvam R.",
    conductor: "Chinnasamy T.",
    driverDrivingMinutes: 180,
    passengerCount: 38,
    capacity: 48,
    speedKmH: 28,
    fuelBatteryPct: 74,
    status: "on-route",
    currentPosition: [11.6795, 78.1573],
    nextStop: "Gorimedu",
    varianceMinutes: 1,
    progressAlongRoute: 0.5,
    direction: "outbound",
    origin: "Town Bus Stand",
    destination: "Yercaud Foothills",
    completedTrips: 1,
  },
  {
    id: "b3",
    fleetNumber: "SLM-MY-104",
    regNumber: "TN-30-N-1099",
    routeId: "r1",
    routeName: "Route 1: Town ⇄ Salem Junction",
    routeColor: "#2563EB",
    depot: "Meyyanur Depot",
    driver: "Palanisamy M.",
    conductor: "Rajendran P.",
    driverDrivingMinutes: 215,
    passengerCount: 44,
    capacity: 48,
    speedKmH: 35,
    fuelBatteryPct: 69,
    status: "on-route",
    currentPosition: [11.6705, 78.1437],
    nextStop: "Four Roads",
    varianceMinutes: -1,
    progressAlongRoute: 0.4,
    direction: "return",
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
    routeColor: "#0284C7",
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
    progressAlongRoute: 0.4,
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
    routeColor: "#0D9488",
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
    direction: "return",
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
    routeColor: "#0369A1",
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
    routeColor: "#475569",
    depot: "Meyyanur Depot",
    driver: "Dhanapal S.",
    conductor: "Saravanan T.",
    driverDrivingMinutes: 0,
    passengerCount: 0,
    capacity: 48,
    speedKmH: 0,
    fuelBatteryPct: 100,
    status: "standby",
    currentPosition: [11.6685, 78.1380],
    nextStop: "Depot Standby Bay 3",
    varianceMinutes: 0,
    progressAlongRoute: 0.0,
    direction: "outbound",
    origin: "Meyyanur Depot",
    destination: "Standby Bay",
    completedTrips: 0,
  },
];

// Coordinate interpolation
function getInterpolatedPosition(
  coords: number[][],
  progress: number,
): [number, number] {
  if (!coords || coords.length === 0) return [11.6673, 78.1424];
  if (coords.length === 1 && coords[0])
    return [coords[0][0] || 11.6673, coords[0][1] || 78.1424];

  const totalSegments = coords.length - 1;
  const clampedProgress = Math.min(1.0, Math.max(0.0, progress));
  const scaledProgress = clampedProgress * totalSegments;
  const index = Math.floor(scaledProgress);
  const frac = scaledProgress - index;

  const p1 = coords[Math.min(index, coords.length - 1)] || [11.6673, 78.1424];
  const p2 = coords[Math.min(index + 1, coords.length - 1)] || p1;

  const lat =
    (p1[0] ?? 11.6673) + ((p2[0] ?? 11.6673) - (p1[0] ?? 11.6673)) * frac;
  const lng =
    (p1[1] ?? 78.1424) + ((p2[1] ?? 78.1424) - (p1[1] ?? 78.1424)) * frac;
  return [lat, lng];
}

interface IncidentRecoveryDialogState {
  isOpen: boolean;
  type: "breakdown" | "fatigue" | "congestion" | "surge" | "conductor";
  targetBus: SimBus;
  rootCause: string;
  recommendedSolution: {
    title: string;
    suitabilityScore: number;
    delayPreventedMinutes: number;
    extraCostEstimate: string;
    description: string;
  };
  alternateOptions: Array<{
    title: string;
    suitabilityScore: number;
    description: string;
  }>;
}

function SimulationPage() {
  const { currentTenant } = useActiveTenant();
  const isChennai =
    currentTenant?.id?.startsWith("69000000") ||
    currentTenant?.name?.includes("Chennai") ||
    false;

  const activeCorridors = isChennai ? CHENNAI_CORRIDORS : SALEM_CORRIDORS;
  const initialFleet = isChennai ? CHENNAI_INITIAL_FLEET : SALEM_INITIAL_FLEET;

  // Clock in minutes from midnight (510 = 08:30 AM)
  const [currentMinutes, setCurrentMinutes] = useState(510);
  const [isPlaying, setIsPlaying] = useState(true);
  const [simSpeed, setSimSpeed] = useState<number>(5);
  const [fleet, setFleet] = useState<SimBus[]>(initialFleet);
  const [selectedBusId, setSelectedBusId] = useState<string>(
    isChennai ? "b-mtc-1" : "b1",
  );
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "controls" | "fleet" | "recovery" | "telemetry"
  >("controls");

  // Recovery Engine Dialog State
  const [recoveryModal, setRecoveryModal] =
    useState<IncidentRecoveryDialogState | null>(null);

  // Sync fleet on tenant switch
  useEffect(() => {
    setFleet(isChennai ? CHENNAI_INITIAL_FLEET : SALEM_INITIAL_FLEET);
    setSelectedBusId(isChennai ? "b-mtc-1" : "b1");
    setActiveScenario(null);
  }, [isChennai]);

  // Radio Dispatch Logs
  const [eventLogs, setEventLogs] = useState<
    Array<{
      id: string;
      time: string;
      text: string;
      type: "info" | "alert" | "success" | "recovery";
    }>
  >([
    {
      id: "1",
      time: "08:15 AM",
      text: `Dispatch startup: ${isChennai ? "Chennai MTC" : "Salem Transport"} AVL telemetry initialized across all corridors.`,
      type: "info",
    },
    {
      id: "2",
      time: "08:22 AM",
      text: "Vehicle SLM-MY-101 departed Town Bus Stand on schedule: headway variance 0 min.",
      type: "success",
    },
    {
      id: "3",
      time: "08:28 AM",
      text: "Automatic Disruption Radar and Rescheduling Engine active with objective weight 0.40 service reliability.",
      type: "info",
    },
  ]);

  // Leaflet map setup
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [L, setL] = useState<any>(null);
  const busMarkersRef = useRef<Record<string, any>>({});
  const polylineGroupRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      import("leaflet").then((mod) => {
        setL(mod.default);
      });
    }
  }, []);

  // Main simulation loop with smooth movement & round trips
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentMinutes((prev) => {
        const next = prev + simSpeed * 0.1;
        return next >= 1380 ? 330 : next;
      });

      setFleet((prevFleet) => {
        const turnarounds: Array<{
          fleetNumber: string;
          terminal: string;
          nextDir: string;
          nextDest: string;
        }> = [];

        const updatedFleet = prevFleet.map((bus) => {
          if (bus.status === "breakdown" || bus.status === "standby") {
            return bus;
          }

          const corridor = activeCorridors.find((c) => c.id === bus.routeId);
          if (!corridor) return bus;

          const stepDelta = (bus.speedKmH / 60) * 0.002 * simSpeed;
          let newProgress = bus.progressAlongRoute + stepDelta;
          let newDirection = bus.direction;
          let completedTrips = bus.completedTrips;
          let newOrigin = bus.origin;
          let newDestination = bus.destination;

          const startTerminal = corridor.stops[0]!;
          const endTerminal = corridor.stops[corridor.stops.length - 1]!;

          if (newProgress >= 1.0) {
            completedTrips += 1;
            const arrivedAt = newDestination;

            if (bus.direction === "outbound") {
              newDirection = "return";
              newOrigin = endTerminal;
              newDestination = startTerminal;
            } else {
              newDirection = "outbound";
              newOrigin = startTerminal;
              newDestination = endTerminal;
            }

            turnarounds.push({
              fleetNumber: bus.fleetNumber,
              terminal: arrivedAt,
              nextDir: newDirection === "return" ? "Return" : "Outbound",
              nextDest: newDestination,
            });

            newProgress = newProgress - 1.0;
          }

          const activeCoords =
            newDirection === "outbound"
              ? corridor.coords
              : [...corridor.coords].reverse();

          const activeStops =
            newDirection === "outbound"
              ? corridor.stops
              : [...corridor.stops].reverse();

          const newPos = getInterpolatedPosition(activeCoords, newProgress);
          const stopIdx = Math.floor(newProgress * (activeStops.length - 1));
          const nextStop =
            activeStops[Math.min(stopIdx + 1, activeStops.length - 1)] ||
            endTerminal;

          return {
            ...bus,
            direction: newDirection,
            origin: newOrigin,
            destination: newDestination,
            completedTrips,
            progressAlongRoute: newProgress,
            currentPosition: newPos,
            nextStop,
            driverDrivingMinutes: Math.min(
              320,
              bus.driverDrivingMinutes + simSpeed * 0.05,
            ),
          };
        });

        if (turnarounds.length > 0) {
          setEventLogs((prev) => [
            ...turnarounds.map((evt) => ({
              id: String(Date.now() + Math.random()),
              time: formatMinutesToTime(Math.floor(currentMinutes)),
              text: `[CORRIDOR TURNAROUND] ${evt.fleetNumber} arrived at ${evt.terminal}. Turned around for ${evt.nextDir} trip towards ${evt.nextDest}.`,
              type: "info" as const,
            })),
            ...prev.slice(0, 40),
          ]);
        }

        return updatedFleet;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, simSpeed, currentMinutes, activeCorridors]);

  // Map initialization
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
      map = L.map(mapRef.current).setView(
        isChennai ? [13.045, 80.24] : [11.6673, 78.1424],
        isChennai ? 12 : 13,
      );
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "OpenStreetMap contributors",
      }).addTo(map);
      mapInstanceRef.current = map;
      polylineGroupRef.current = L.featureGroup().addTo(map);
    }

    if (polylineGroupRef.current) {
      polylineGroupRef.current.clearLayers();
      activeCorridors.forEach((corridor) => {
        L.polyline(corridor.coords, {
          color: corridor.color,
          weight: 4,
          opacity: 0.8,
        }).addTo(polylineGroupRef.current);

        corridor.coords.forEach((coord, i) => {
          L.circleMarker(coord, {
            radius: 3.5,
            fillColor: corridor.color,
            fillOpacity: 0.9,
            color: "#ffffff",
            weight: 1.5,
          })
            .bindTooltip(`${corridor.code}: ${corridor.stops[i]}`, {
              direction: "top",
              offset: [0, -5],
            })
            .addTo(polylineGroupRef.current);
        });
      });
    }
  }, [L, isChennai]);

  // Animated bus markers
  useEffect(() => {
    if (!L || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    fleet.forEach((bus) => {
      const isSelected = bus.id === selectedBusId;
      const isBreakdown = bus.status === "breakdown";
      const isStandby = bus.status === "standby";

      const dirArrow = bus.direction === "return" ? "◀" : "▶";

      const markerHtml = `
        <div class="relative flex items-center justify-center transition-transform ${isSelected ? "scale-115 z-50" : "scale-100"}">
          <div class="size-7 rounded-md flex items-center justify-center text-white text-[10px] font-mono font-bold shadow-md border-2 ${
            isBreakdown
              ? "bg-rose-600 border-white animate-bounce"
              : isStandby
                ? "bg-slate-500 border-white opacity-85"
                : isSelected
                  ? "bg-blue-600 border-white ring-2 ring-blue-600 ring-offset-2"
                  : "bg-slate-900 border-white"
          }">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-white"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C18.1 6.7 17.1 6 16 6H4c-1.1 0-2.1.7-2.4 1.8l-1.4 5C0.1 13.2 0 13.6 0 14c0 .4.1.8.2 1.2.3 1.1.8 2.8.8 2.8h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/></svg>
          </div>
          <div class="absolute -bottom-4 px-1 py-0.2 rounded-xs bg-slate-900/90 text-white font-mono text-[9px] whitespace-nowrap shadow border border-white/20 flex items-center gap-1">
            <span>${bus.fleetNumber.split("-")[2] || bus.fleetNumber}</span>
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
        : `<strong>${bus.fleetNumber}</strong> (${bus.direction === "return" ? "Return" : "Outbound"} Trip)<br/>Next: <strong>${bus.nextStop}</strong><br/>Load: ${bus.passengerCount}/${bus.capacity} · Speed: ${bus.speedKmH} km/h`;

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

  const selectedBus =
    fleet.find((b) => b.id === selectedBusId) || fleet[0] || initialFleet[0]!;

  // Operational time phase indicator
  const timePhase = useMemo(() => {
    const h = Math.floor(currentMinutes / 60);
    if (h < 7)
      return {
        title: "Dawn Launch & Depots Pull-Out",
        badge: "Morning Rollout",
        color: "text-amber-600 dark:text-amber-400",
      };
    if (h < 10)
      return {
        title: "Morning Peak Commuter Flow",
        badge: "Peak Rush",
        color: "text-rose-600 dark:text-rose-400 font-bold",
      };
    if (h < 16)
      return {
        title: "Steady Midday Regular Headway",
        badge: "Steady Operations",
        color: "text-emerald-600 dark:text-emerald-400",
      };
    if (h < 20)
      return {
        title: "Evening Return Peak Commute",
        badge: "Evening Peak",
        color: "text-blue-600 dark:text-blue-400 font-bold",
      };
    return {
      title: "Late Night Operations & Depot Influx",
      badge: "Night Shift",
      color: "text-slate-600 dark:text-slate-400",
    };
  }, [currentMinutes]);

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    const activeMoving = fleet.filter((b) => b.status === "on-route");
    const onTime = activeMoving.filter((b) => Math.abs(b.varianceMinutes) <= 2);
    const avgLoad = activeMoving.length
      ? Math.round(
          (activeMoving.reduce((sum, b) => sum + b.passengerCount, 0) /
            activeMoving.reduce((sum, b) => sum + b.capacity, 0)) *
            100,
        )
      : 0;

    return {
      totalVehicles: fleet.length,
      activeMoving: activeMoving.length,
      standbyBuses: fleet.filter((b) => b.status === "standby").length,
      onTimePct: activeMoving.length
        ? Math.round((onTime.length / activeMoving.length) * 100)
        : 100,
      avgLoadPct: avgLoad,
    };
  }, [fleet]);

  // ----------------------------------------------------
  // DISRUPTION SCENARIO 1: FLEET ENGINE BREAKDOWN
  // ----------------------------------------------------
  const triggerBreakdownScenario = () => {
    const target = fleet.find((b) => b.status === "on-route") || fleet[0]!;
    setActiveScenario("breakdown");
    setIsPlaying(false);

    setFleet((prev) =>
      prev.map((b) =>
        b.id === target.id
          ? { ...b, status: "breakdown", speedKmH: 0, varianceMinutes: 18 }
          : b,
      ),
    );
    setSelectedBusId(target.id);

    // Open Automated Recovery Dialog
    setRecoveryModal({
      isOpen: true,
      type: "breakdown",
      targetBus: target,
      rootCause: `Critical engine coolant overheating logged on Bus ${target.regNumber} at ${target.nextStop}. Vehicle stalled on corridor.`,
      recommendedSolution: {
        title: "Deploy Standby Bus from Meyyanur Bay 3",
        suitabilityScore: 96,
        delayPreventedMinutes: 19,
        extraCostEstimate: "₹240 (6.2 km deadhead)",
        description:
          "Dispatches standby bus with pre-assigned certified crew to take over remaining trip departures. Minimizes headway disruption to under 3 minutes.",
      },
      alternateOptions: [
        {
          title: "Short-turn Following Bus to Absorb Load",
          suitabilityScore: 78,
          description:
            "Instructs following bus to skip non-peak transfer stops and pick up stranded passengers.",
        },
        {
          title: "Trip Cancellation & Retiming",
          suitabilityScore: 42,
          description:
            "Cancels single departure run and distributes passengers to subsequent 15-minute headway.",
        },
      ],
    });

    toast.error(`[BREAKDOWN ALERT] Vehicle ${target.regNumber} stalled!`);
    setEventLogs((prev) => [
      {
        id: String(Date.now()),
        time: formatMinutesToTime(Math.floor(currentMinutes)),
        text: `[INCIDENT] Engine failure reported on ${target.fleetNumber} (${target.regNumber}) at ${target.nextStop}. Automated Recovery Engine activated.`,
        type: "alert",
      },
      ...prev,
    ]);
  };

  const executeBreakdownRecovery = () => {
    if (!recoveryModal) return;
    const stalledId = recoveryModal.targetBus.id;
    const standbyBus = fleet.find((b) => b.status === "standby");

    setFleet((prev) =>
      prev.map((b) => {
        if (b.id === stalledId) {
          return {
            ...b,
            status: "maintenance",
            speedKmH: 0,
            routeName: "Towed for Maintenance Inspection",
          };
        }
        if (standbyBus && b.id === standbyBus.id) {
          return {
            ...b,
            status: "on-route",
            routeId: recoveryModal.targetBus.routeId,
            routeName: recoveryModal.targetBus.routeName,
            routeColor: recoveryModal.targetBus.routeColor,
            direction: recoveryModal.targetBus.direction,
            origin: recoveryModal.targetBus.origin,
            destination: recoveryModal.targetBus.destination,
            currentPosition: recoveryModal.targetBus.currentPosition,
            nextStop: recoveryModal.targetBus.nextStop,
            speedKmH: 34,
            passengerCount: recoveryModal.targetBus.passengerCount,
            varianceMinutes: 2,
            progressAlongRoute: recoveryModal.targetBus.progressAlongRoute,
            completedTrips: recoveryModal.targetBus.completedTrips,
          };
        }
        return b;
      }),
    );

    if (standbyBus) setSelectedBusId(standbyBus.id);
    setActiveScenario(null);
    setRecoveryModal(null);
    setIsPlaying(true);

    toast.success("Recovery deployed: Standby vehicle dispatched to corridor!");
    setEventLogs((prev) => [
      {
        id: String(Date.now()),
        time: formatMinutesToTime(Math.floor(currentMinutes)),
        text: `[RECOVERY EXECUTED] Standby ${standbyBus?.fleetNumber || "Unit"} deployed. Passenger transfer verified with 0 stranded.`,
        type: "recovery",
      },
      ...prev,
    ]);
  };

  // ----------------------------------------------------
  // DISRUPTION SCENARIO 2: DRIVER FATIGUE & REST HANDOVER
  // ----------------------------------------------------
  const triggerDriverFatigueScenario = () => {
    const target = fleet.find((b) => b.status === "on-route") || fleet[0]!;
    setActiveScenario("fatigue");

    setFleet((prev) =>
      prev.map((b) =>
        b.id === target.id
          ? { ...b, driverDrivingMinutes: 245 }
          : b,
      ),
    );
    setSelectedBusId(target.id);

    setRecoveryModal({
      isOpen: true,
      type: "fatigue",
      targetBus: target,
      rootCause: `Motor Vehicles Act Compliance: Driver ${target.driver} reached 245 mins continuous driving (exceeding 240 mins maximum threshold).`,
      recommendedSolution: {
        title: "Mandate Relief Driver Handover at Terminus",
        suitabilityScore: 98,
        delayPreventedMinutes: 0,
        extraCostEstimate: "₹0 (Scheduled Relief Driver)",
        description:
          "Executes driver relief swap with spare certified driver on duty roster at next scheduled terminus stop, ensuring zero MVA violations.",
      },
      alternateOptions: [
        {
          title: "Temporary 30-minute Rest Pause",
          suitabilityScore: 65,
          description:
            "Brings vehicle to depot rest bay for 30 minutes, adding departure variance to timetable.",
        },
      ],
    });

    toast.warning("[COMPLIANCE] Driver 4-hour steering limit reached!");
    setEventLogs((prev) => [
      {
        id: String(Date.now()),
        time: formatMinutesToTime(Math.floor(currentMinutes)),
        text: `[MVA COMPLIANCE] Driver ${target.driver} logged 245 mins. Mandatory handover triggered.`,
        type: "alert",
      },
      ...prev,
    ]);
  };

  const executeDriverFatigueRecovery = () => {
    if (!recoveryModal) return;
    const targetId = recoveryModal.targetBus.id;

    setFleet((prev) =>
      prev.map((b) =>
        b.id === targetId
          ? {
              ...b,
              driver: "Palanisamy M. (Certified Relief)",
              driverDrivingMinutes: 10,
            }
          : b,
      ),
    );

    setActiveScenario(null);
    setRecoveryModal(null);
    toast.success("Driver relief handover completed successfully.");
    setEventLogs((prev) => [
      {
        id: String(Date.now()),
        time: formatMinutesToTime(Math.floor(currentMinutes)),
        text: `[HANDOVER COMPLETED] Relief driver Palanisamy M. took over vehicle ${recoveryModal.targetBus.fleetNumber}. Rest verified.`,
        type: "success",
      },
      ...prev,
    ]);
  };

  // ----------------------------------------------------
  // DISRUPTION SCENARIO 3: TRAFFIC GRIDLOCK
  // ----------------------------------------------------
  const triggerTrafficScenario = () => {
    const target = fleet.find((b) => b.status === "on-route") || fleet[0]!;
    setActiveScenario("congestion");

    setFleet((prev) =>
      prev.map((b) =>
        b.id === target.id
          ? { ...b, speedKmH: 11, varianceMinutes: 15 }
          : b,
      ),
    );
    setSelectedBusId(target.id);

    toast.warning("[CONGESTION] Corridor gridlock detected: Speed dropped to 11 km/h!");
    setEventLogs((prev) => [
      {
        id: String(Date.now()),
        time: formatMinutesToTime(Math.floor(currentMinutes)),
        text: `[TRAFFIC ALERT] Congestion delay on ${target.routeName}: Speed reduced to 11 km/h. Headway regulator activated.`,
        type: "alert",
      },
      ...prev,
    ]);
  };

  // ----------------------------------------------------
  // DISRUPTION SCENARIO 4: CORRIDOR PASSENGER SURGE
  // ----------------------------------------------------
  const triggerSurgeScenario = () => {
    const target = fleet.find((b) => b.status === "on-route") || fleet[0]!;
    setActiveScenario("surge");

    setFleet((prev) =>
      prev.map((b) =>
        b.id === target.id
          ? { ...b, passengerCount: b.capacity - 1 }
          : b,
      ),
    );
    setSelectedBusId(target.id);

    toast.info("[PASSENGER SURGE] Vehicle passenger load reached 98%!");
    setEventLogs((prev) => [
      {
        id: String(Date.now()),
        time: formatMinutesToTime(Math.floor(currentMinutes)),
        text: `[LOAD SURGE] Vehicle ${target.fleetNumber} at ${target.passengerCount}/${target.capacity} capacity. Extra frequency recommended.`,
        type: "info",
      },
      ...prev,
    ]);
  };

  // Reset Simulation
  const resetSimulation = () => {
    setCurrentMinutes(510);
    setFleet(initialFleet);
    setSelectedBusId(isChennai ? "b-mtc-1" : "b1");
    setActiveScenario(null);
    setRecoveryModal(null);
    setIsPlaying(true);
    toast.info("Simulation clock reset to 08:30 AM.");
  };

  return (
    <AppShell
      title="Simulation Deck"
      subtitle={`Interactive multi-corridor transit simulation, real-time fleet movement, and automated schedule recovery (${isChennai ? "Chennai MTC" : "Salem Transport"}).`}
      actions={
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="font-mono text-xs border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/10 gap-1.5 rounded-md"
          >
            <Activity className="size-3" />
            <span>Deck Online</span>
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={resetSimulation}
            className="text-xs h-8 gap-1.5 cursor-pointer rounded-md border-border hover:bg-muted"
          >
            <RotateCcw className="size-3.5" />
            Reset 08:30 AM
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* KPI OVERVIEW STRIP */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3 rounded-lg border border-border/80 bg-card shadow-2xs">
            <span className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider">
              Fleet Monitored
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-bold font-mono text-foreground">
                {summaryMetrics.totalVehicles}
              </span>
              <span className="text-[11px] text-muted-foreground font-mono">
                {summaryMetrics.activeMoving} Active
              </span>
            </div>
          </div>

          <div className="p-3 rounded-lg border border-border/80 bg-card shadow-2xs">
            <span className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider">
              On-Time Performance
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {summaryMetrics.onTimePct}%
              </span>
              <span className="text-[11px] text-emerald-600 font-mono">
                ±2 min band
              </span>
            </div>
          </div>

          <div className="p-3 rounded-lg border border-border/80 bg-card shadow-2xs">
            <span className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider">
              Average Bus Load
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-bold font-mono text-foreground">
                {summaryMetrics.avgLoadPct}%
              </span>
              <span className="text-[11px] text-muted-foreground font-mono">
                Corridor Avg
              </span>
            </div>
          </div>

          <div className="p-3 rounded-lg border border-border/80 bg-card shadow-2xs">
            <span className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider">
              Depot Standby Fleet
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-bold font-mono text-foreground">
                {summaryMetrics.standbyBuses}
              </span>
              <span className="text-[11px] text-blue-600 font-mono">
                Hot Standby
              </span>
            </div>
          </div>

          <div className="p-3 rounded-lg border border-border/80 bg-card shadow-2xs col-span-2 sm:col-span-1">
            <span className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider">
              Operational Phase
            </span>
            <div className="mt-1">
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] font-semibold px-2 py-0.5 rounded-md",
                  timePhase.color,
                )}
              >
                {timePhase.badge}
              </Badge>
            </div>
          </div>
        </div>

        {/* MASTER SIMULATION CONTROLLER & CLOCK DECK */}
        <div className="p-4 sm:p-5 rounded-lg border border-border bg-card shadow-2xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Clock & Phase */}
            <div className="flex items-center gap-3">
              <div className="size-11 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-2xs">
                <Clock className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-foreground">
                    {formatMinutesToTime(Math.floor(currentMinutes))}
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[11px] font-semibold px-2 py-0.5 rounded-md",
                      timePhase.color,
                    )}
                  >
                    {timePhase.badge}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {timePhase.title}
                </p>
              </div>
            </div>

            {/* Playback Controls & Speed Multipliers */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={isPlaying ? "default" : "outline"}
                size="sm"
                onClick={() => setIsPlaying(!isPlaying)}
                className="h-8 px-3 rounded-md text-xs gap-1.5 font-semibold cursor-pointer"
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

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCurrentMinutes((prev) => Math.min(1380, prev + 5));
                  toast.success("Advanced clock by 5 minutes");
                }}
                className="h-8 px-2.5 rounded-md text-xs border-border hover:bg-muted font-mono"
                title="Step 5 Minutes Forward"
              >
                <FastForward className="size-3.5 mr-1" />
                +5m
              </Button>

              {/* Speed Multipliers */}
              <div className="flex items-center bg-muted/60 p-0.5 rounded-md border border-border">
                {[
                  { label: "1x", val: 1 },
                  { label: "5x", val: 5 },
                  { label: "15x", val: 15 },
                  { label: "60x", val: 60 },
                ].map((s) => (
                  <button
                    key={s.val}
                    onClick={() => setSimSpeed(s.val)}
                    className={cn(
                      "px-2.5 py-1 text-xs font-mono font-bold rounded-md transition-colors cursor-pointer",
                      simSpeed === s.val
                        ? "bg-background text-foreground shadow-2xs font-extrabold"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Time Scrubber Slider */}
          <div className="pt-3 border-t border-border/60">
            <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground mb-1.5">
              <span>05:30 AM (Start)</span>
              <span className="font-semibold text-primary">
                Operational Timeline Scrubber (05:30 - 23:00)
              </span>
              <span>11:00 PM (Pull-in)</span>
            </div>
            <input
              type="range"
              min={330}
              max={1380}
              value={Math.floor(currentMinutes)}
              onChange={(e) => setCurrentMinutes(Number(e.target.value))}
              className="w-full h-1.5 bg-muted rounded-md appearance-none cursor-pointer accent-primary"
            />
          </div>
        </div>

        {/* MAIN WORKSPACE: MAP (LEFT) & DIAGNOSTIC SCENARIO DECK (RIGHT) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* MAP CANVAS (7 COLS) */}
          <div className="lg:col-span-7 space-y-3">
            <div className="p-4 rounded-lg border border-border bg-card shadow-2xs relative overflow-hidden flex flex-col h-[520px]">
              {/* Map Header Bar */}
              <div className="flex items-center justify-between pb-3 border-b border-border/70 z-10">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-xs bg-emerald-500 animate-pulse"></span>
                  <span className="text-xs font-bold text-foreground">
                    {isChennai ? "Chennai MTC Corridors" : "Salem Transport Corridors"} (Live Fleet AVL)
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground">
                  <span>
                    {fleet.filter((b) => b.status === "on-route").length} Moving
                  </span>
                  <span>·</span>
                  <span>
                    {fleet.filter((b) => b.status === "standby").length} Standby
                  </span>
                </div>
              </div>

              {/* Leaflet DOM Node */}
              <div
                ref={mapRef}
                className="flex-1 w-full rounded-md z-0 mt-2 border border-border/60"
              />

              {/* Active Route Legend Bar */}
              <div className="mt-2 pt-2 border-t border-border/60 flex flex-wrap items-center gap-3 text-[11px] font-mono">
                {activeCorridors.map((c) => (
                  <div key={c.id} className="flex items-center gap-1.5">
                    <span
                      className="size-2 rounded-xs"
                      style={{ backgroundColor: c.color }}
                    ></span>
                    <span className="text-muted-foreground font-medium">
                      {formatRouteNumber(c.code)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Fleet Selection Bar */}
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
                      "p-2.5 rounded-md border text-left transition-all cursor-pointer flex flex-col justify-between",
                      isSelected
                        ? "border-primary bg-primary/10 shadow-2xs"
                        : isBreakdown
                          ? "border-rose-500/50 bg-rose-500/10 animate-pulse"
                          : isStandby
                            ? "border-border/60 bg-muted/40"
                            : "border-border/60 bg-card hover:border-border",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-foreground">
                        {bus.fleetNumber.split("-")[2] || bus.fleetNumber}
                      </span>
                      <span
                        className={cn(
                          "size-2 rounded-xs",
                          isBreakdown
                            ? "bg-rose-500"
                            : isStandby
                              ? "bg-slate-400"
                              : "bg-emerald-500",
                        )}
                      ></span>
                    </div>
                    <div className="flex items-center justify-between mt-1 text-[10px] text-muted-foreground">
                      <span className="truncate">
                        {isBreakdown
                          ? "Stalled"
                          : isStandby
                            ? "Standby"
                            : bus.routeName.split(":")[0]}
                      </span>
                      {!isStandby && !isBreakdown && (
                        <span
                          className={cn(
                            "font-mono text-[9px] font-bold ml-1",
                            bus.direction === "return"
                              ? "text-amber-500"
                              : "text-emerald-500",
                          )}
                        >
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
            {/* TABS */}
            <div className="flex items-center bg-muted/60 p-1 rounded-md border border-border">
              <button
                onClick={() => setActiveTab("controls")}
                className={cn(
                  "flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center justify-center gap-1.5",
                  activeTab === "controls"
                    ? "bg-card text-foreground shadow-2xs font-bold"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Sliders className="size-3.5" />
                <span>Scenarios</span>
              </button>
              <button
                onClick={() => setActiveTab("fleet")}
                className={cn(
                  "flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center justify-center gap-1.5",
                  activeTab === "fleet"
                    ? "bg-card text-foreground shadow-2xs font-bold"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <BusIcon className="size-3.5" />
                <span>Vehicle Card</span>
              </button>
              <button
                onClick={() => setActiveTab("telemetry")}
                className={cn(
                  "flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center justify-center gap-1.5",
                  activeTab === "telemetry"
                    ? "bg-card text-foreground shadow-2xs font-bold"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Radio className="size-3.5" />
                <span>Radio Feed</span>
              </button>
            </div>

            {/* TAB 1: SCENARIOS */}
            {activeTab === "controls" && (
              <div className="space-y-3">
                {/* Active Bus Mini Card */}
                <div className="p-3.5 rounded-lg border border-border bg-card space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-foreground">
                          {selectedBus.fleetNumber}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] font-mono uppercase px-1.5 py-0.2 rounded-md",
                            selectedBus.status === "breakdown"
                              ? "border-rose-500/40 text-rose-500 bg-rose-500/10"
                              : selectedBus.status === "standby"
                                ? "border-slate-500/40 text-slate-500 bg-slate-500/10"
                                : "border-emerald-500/40 text-emerald-600 bg-emerald-500/10",
                          )}
                        >
                          {selectedBus.status}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {selectedBus.routeName}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-mono font-bold text-foreground">
                        {selectedBus.speedKmH} km/h
                      </span>
                      <p className="text-[10px] text-muted-foreground">Speed</p>
                    </div>
                  </div>
                </div>

                {/* Scenario Injectors */}
                <div className="p-3.5 rounded-lg border border-border bg-card space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Sparkles className="size-3.5 text-primary" />
                      Disruption Scenarios (Click to Inject)
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground rounded-md">
                      Auto-Recovery
                    </Badge>
                  </div>

                  <div className="space-y-2 text-xs">
                    {/* Scenario 1: Breakdown */}
                    <div className="p-2.5 rounded-md border border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10 transition-colors flex items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-foreground">
                          1. Engine Failure / Breakdown
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Vehicle stalls at intersection. Triggers Disruption Radar.
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={triggerBreakdownScenario}
                        className="text-xs h-7 border-rose-500/40 text-rose-600 hover:bg-rose-500/10 rounded-md shrink-0 cursor-pointer"
                      >
                        Simulate
                      </Button>
                    </div>

                    {/* Scenario 2: Driver Fatigue */}
                    <div className="p-2.5 rounded-md border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 transition-colors flex items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-foreground">
                          2. MVA Driver 4-Hour Limit
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Exceeds 240m continuous driving. Mandates relief handover.
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={triggerDriverFatigueScenario}
                        className="text-xs h-7 border-amber-500/40 text-amber-600 hover:bg-amber-500/10 rounded-md shrink-0 cursor-pointer"
                      >
                        Simulate
                      </Button>
                    </div>

                    {/* Scenario 3: Traffic Gridlock */}
                    <div className="p-2.5 rounded-md border border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 transition-colors flex items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-foreground">
                          3. Corridor Traffic Congestion
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Speed drops to 11 km/h. Headway regulator intervenes.
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={triggerTrafficScenario}
                        className="text-xs h-7 border-blue-500/40 text-blue-600 hover:bg-blue-500/10 rounded-md shrink-0 cursor-pointer"
                      >
                        Simulate
                      </Button>
                    </div>

                    {/* Scenario 4: Passenger Surge */}
                    <div className="p-2.5 rounded-md border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors flex items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-foreground">
                          4. Passenger Surge (98% Load)
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          High passenger boarding load. Recommends extra frequency.
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={triggerSurgeScenario}
                        className="text-xs h-7 border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10 rounded-md shrink-0 cursor-pointer"
                      >
                        Simulate
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: DETAILED VEHICLE CARD */}
            {activeTab === "fleet" && (
              <div className="p-4 rounded-lg border border-border bg-card space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-extrabold text-base text-foreground font-mono">
                      {selectedBus.fleetNumber}
                    </h4>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                      Reg: {selectedBus.regNumber} · Depot: {selectedBus.depot}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="font-mono text-xs rounded-md"
                  >
                    Trip #{selectedBus.completedTrips + 1}
                  </Badge>
                </div>

                {/* Progress Along Active Leg */}
                {selectedBus.status !== "standby" && (
                  <div className="space-y-1.5 p-3 rounded-md bg-muted/40 border border-border/70">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-foreground">
                        {selectedBus.origin}
                      </span>
                      <span className="text-muted-foreground font-mono">
                        {Math.round(selectedBus.progressAlongRoute * 100)}%
                      </span>
                      <span className="font-bold text-primary">
                        {selectedBus.destination}
                      </span>
                    </div>
                    <Progress
                      value={Math.round(selectedBus.progressAlongRoute * 100)}
                      className="h-1.5"
                    />
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                      <span>Next: {selectedBus.nextStop}</span>
                      <span>
                        {selectedBus.direction === "return" ? "Return Leg" : "Outbound Leg"}
                      </span>
                    </div>
                  </div>
                )}

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-md border border-border bg-muted/20">
                    <p className="text-[10px] text-muted-foreground">Passenger Load</p>
                    <p className="font-mono font-bold text-foreground mt-0.5">
                      {selectedBus.passengerCount} / {selectedBus.capacity} (
                      {Math.round((selectedBus.passengerCount / selectedBus.capacity) * 100)}%)
                    </p>
                  </div>
                  <div className="p-2.5 rounded-md border border-border bg-muted/20">
                    <p className="text-[10px] text-muted-foreground">Battery / Fuel Health</p>
                    <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {selectedBus.fuelBatteryPct}% Optimal
                    </p>
                  </div>
                  <div className="p-2.5 rounded-md border border-border bg-muted/20">
                    <p className="text-[10px] text-muted-foreground">Operating Driver</p>
                    <p className="font-medium text-foreground truncate mt-0.5">
                      {selectedBus.driver}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-md border border-border bg-muted/20">
                    <p className="text-[10px] text-muted-foreground">Steering Duration</p>
                    <p
                      className={cn(
                        "font-mono font-bold mt-0.5",
                        selectedBus.driverDrivingMinutes >= 240
                          ? "text-rose-600 dark:text-rose-400"
                          : "text-foreground",
                      )}
                    >
                      {Math.floor(selectedBus.driverDrivingMinutes)}m / 240m
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: RADIO LOGS */}
            {activeTab === "telemetry" && (
              <div className="p-4 rounded-lg border border-border bg-card space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Radio className="size-3.5 text-emerald-500 animate-pulse" />
                    Live Radio Dispatch & Audit Stream
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEventLogs([])}
                    className="text-[10px] h-6 px-2 text-muted-foreground rounded-md"
                  >
                    Clear Feed
                  </Button>
                </div>

                <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                  {eventLogs.map((log) => (
                    <div
                      key={log.id}
                      className={cn(
                        "p-2.5 rounded-md border text-xs leading-relaxed",
                        log.type === "alert"
                          ? "border-rose-500/30 bg-rose-500/5 text-rose-700 dark:text-rose-300"
                          : log.type === "recovery" || log.type === "success"
                            ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300"
                            : "border-border/70 bg-muted/20 text-muted-foreground",
                      )}
                    >
                      <div className="flex items-center justify-between font-mono text-[10px] text-muted-foreground mb-1">
                        <span>{log.time}</span>
                        <span className="uppercase font-semibold tracking-wider">
                          {log.type}
                        </span>
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

      {/* AUTOMATED RECOVERY OPTIMIZATION DIALOG */}
      {recoveryModal && (
        <Dialog
          open={recoveryModal.isOpen}
          onOpenChange={(open) => {
            if (!open) {
              setRecoveryModal(null);
              setIsPlaying(true);
            }
          }}
        >
          <DialogContent className="max-w-md rounded-lg border-border">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-sm font-bold">
                <ShieldCheck className="size-4 text-emerald-600" />
                <span>Automated Recovery Recommendation</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                TransitOS Rescheduling Engine evaluated candidate solutions with 0.40 reliability weight.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              {/* Root Cause Alert */}
              <div className="p-3 rounded-md border border-rose-500/30 bg-rose-500/10 text-rose-800 dark:text-rose-200">
                <span className="font-bold">Incident Detected: </span>
                <span>{recoveryModal.rootCause}</span>
              </div>

              {/* Recommended Solution Card */}
              <div className="p-3.5 rounded-md border border-emerald-500/40 bg-emerald-500/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5 text-emerald-600" />
                    Recommended Action
                  </span>
                  <Badge
                    variant="outline"
                    className="border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-mono text-[10px] rounded-md"
                  >
                    Score: {recoveryModal.recommendedSolution.suitabilityScore}/100
                  </Badge>
                </div>

                <p className="font-bold text-sm text-foreground">
                  {recoveryModal.recommendedSolution.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {recoveryModal.recommendedSolution.description}
                </p>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-500/20 text-[11px] font-mono">
                  <div>
                    <span className="text-muted-foreground">Delay Prevented: </span>
                    <span className="font-bold text-emerald-600">
                      {recoveryModal.recommendedSolution.delayPreventedMinutes} mins
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Cost Metric: </span>
                    <span className="font-bold text-foreground">
                      {recoveryModal.recommendedSolution.extraCostEstimate}
                    </span>
                  </div>
                </div>
              </div>

              {/* Alternate Options */}
              {recoveryModal.alternateOptions.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] text-muted-foreground font-medium">
                    Alternate Evaluated Options:
                  </span>
                  {recoveryModal.alternateOptions.map((opt, i) => (
                    <div
                      key={i}
                      className="p-2 rounded-md border border-border/80 bg-muted/20 text-[11px] flex items-center justify-between"
                    >
                      <span className="text-muted-foreground">{opt.title}</span>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        Score {opt.suitabilityScore}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setRecoveryModal(null);
                  setIsPlaying(true);
                }}
                className="text-xs rounded-md"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  if (recoveryModal.type === "breakdown") {
                    executeBreakdownRecovery();
                  } else if (recoveryModal.type === "fatigue") {
                    executeDriverFatigueRecovery();
                  } else {
                    setRecoveryModal(null);
                    setIsPlaying(true);
                  }
                }}
                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-md cursor-pointer"
              >
                Approve & Deploy Recovery
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </AppShell>
  );
}
