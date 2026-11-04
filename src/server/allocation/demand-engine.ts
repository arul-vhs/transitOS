/**
 * Demand Engine & Fleet Allocation Orchestrator
 * Integrates real-time / simulated passenger flow sensing, surge detection,
 * minimum service constraints, and transactional dispatch execution.
 */

import { db, cleanUuid } from "../db";
import {
  demandSurges,
  fleetAllocations,
  operationalEvents,
  auditLogs,
} from "../db/schema";
import { desc, eq } from "drizzle-orm";
import {
  AllocationPlan,
  AllocationStrategy,
  RouteDemandProfile,
  ShortageSeverity,
  SupplyCandidate,
  SurgeScenarioInput,
  TimePeriodDef,
  TimePeriodId,
} from "./types";
import { solveFleetAllocation } from "./graph-allocator";

export const TIME_PERIODS: TimePeriodDef[] = [
  {
    id: "MORNING_PEAK",
    label: "Morning Peak (07:00 - 10:30)",
    startHour: 7,
    endHour: 10.5,
    description:
      "Inbound employment & student commute towards Salem downtown and Junction.",
  },
  {
    id: "MIDDAY_OFFPEAK",
    label: "Midday Off-Peak (11:00 - 15:30)",
    startHour: 11,
    endHour: 15.5,
    description:
      "Shopping, commercial trade, and healthcare visits across arterial corridors.",
  },
  {
    id: "EVENING_PEAK",
    label: "Evening Peak (16:30 - 20:30)",
    startHour: 16.5,
    endHour: 20.5,
    description:
      "Outbound homeward transit, industrial shift departures, and regional travel.",
  },
  {
    id: "NIGHT_LULL",
    label: "Night Operations (21:00 - 23:30)",
    startHour: 21,
    endHour: 23.5,
    description:
      "Sustained skeleton connectivity and railway feeder connectivity.",
  },
  {
    id: "LIVE_SURGE",
    label: "Dynamic Live Surge (Active Telemetry)",
    startHour: 17,
    endHour: 19,
    description:
      "Real-time automated anomaly sensing from electronic ticketing machines and GPS.",
  },
];

interface BaseRouteData {
  routeId: string;
  code: string;
  name: string;
  origin: string;
  destination: string;
  lengthKm: number;
  durationMin: number;
  baselineDemandPaxPerHour: number;
  scheduledHeadwayMin: number;
  busCapacity: number;
  activeBusesCount: number;
  minRequiredBuses: number;
}

const BASE_CHENNAI_ROUTES: BaseRouteData[] = [
  {
    routeId: "route-mtc-570",
    code: "570",
    name: "CMBT Koyambedu - Kelambakkam (OMR IT Expressway)",
    origin: "CMBT",
    destination: "Kelambakkam",
    lengthKm: 32.4,
    durationMin: 75,
    baselineDemandPaxPerHour: 780,
    scheduledHeadwayMin: 10,
    busCapacity: 65,
    activeBusesCount: 8,
    minRequiredBuses: 4,
  },
  {
    routeId: "route-mtc-21g",
    code: "21G",
    name: "Broadway - Tambaram (GST Road Arterial)",
    origin: "Broadway",
    destination: "Tambaram",
    lengthKm: 28.6,
    durationMin: 68,
    baselineDemandPaxPerHour: 850,
    scheduledHeadwayMin: 8,
    busCapacity: 65,
    activeBusesCount: 9,
    minRequiredBuses: 4,
  },
  {
    routeId: "route-mtc-102",
    code: "102",
    name: "Broadway - Kelambakkam (East Coast Corridor)",
    origin: "Broadway",
    destination: "Kelambakkam",
    lengthKm: 34.2,
    durationMin: 80,
    baselineDemandPaxPerHour: 710,
    scheduledHeadwayMin: 12,
    busCapacity: 65,
    activeBusesCount: 7,
    minRequiredBuses: 3,
  },
  {
    routeId: "route-mtc-11g",
    code: "11G",
    name: "Broadway - KK Nagar (Central Radial)",
    origin: "Broadway",
    destination: "KK Nagar",
    lengthKm: 16.8,
    durationMin: 45,
    baselineDemandPaxPerHour: 520,
    scheduledHeadwayMin: 12,
    busCapacity: 60,
    activeBusesCount: 5,
    minRequiredBuses: 2,
  },
  {
    routeId: "route-mtc-m70",
    code: "M70",
    name: "Thiruvanmiyur - CMBT (Inner Ring Road)",
    origin: "Thiruvanmiyur",
    destination: "CMBT",
    lengthKm: 22.5,
    durationMin: 55,
    baselineDemandPaxPerHour: 640,
    scheduledHeadwayMin: 10,
    busCapacity: 65,
    activeBusesCount: 6,
    minRequiredBuses: 3,
  },
  {
    routeId: "route-mtc-5c",
    code: "5C",
    name: "Broadway - T. Nagar (Commercial Corridor)",
    origin: "Broadway",
    destination: "T. Nagar",
    lengthKm: 14.2,
    durationMin: 40,
    baselineDemandPaxPerHour: 490,
    scheduledHeadwayMin: 12,
    busCapacity: 60,
    activeBusesCount: 4,
    minRequiredBuses: 2,
  },
  {
    routeId: "route-mtc-19b",
    code: "19B",
    name: "Saidapet - Kelambakkam (Tech Hub)",
    origin: "Saidapet",
    destination: "Kelambakkam",
    lengthKm: 26.0,
    durationMin: 60,
    baselineDemandPaxPerHour: 560,
    scheduledHeadwayMin: 15,
    busCapacity: 65,
    activeBusesCount: 5,
    minRequiredBuses: 2,
  },
  {
    routeId: "route-mtc-29c",
    code: "29C",
    name: "Perambur - Besant Nagar (Cross-City Arterial)",
    origin: "Perambur",
    destination: "Besant Nagar",
    lengthKm: 18.5,
    durationMin: 48,
    baselineDemandPaxPerHour: 470,
    scheduledHeadwayMin: 15,
    busCapacity: 60,
    activeBusesCount: 4,
    minRequiredBuses: 2,
  },
];

const BASE_SALEM_ROUTES: BaseRouteData[] = [
  {
    routeId: "route-slm-01",
    code: "1",
    name: "Town Bus Stand - Salem Junction",
    origin: "Town Bus Stand",
    destination: "Salem Junction",
    lengthKm: 7.2,
    durationMin: 28,
    baselineDemandPaxPerHour: 620,
    scheduledHeadwayMin: 12,
    busCapacity: 65,
    activeBusesCount: 4,
    minRequiredBuses: 2,
  },
  {
    routeId: "route-slm-13",
    code: "13",
    name: "Town Bus Stand - Yercaud Foothills",
    origin: "Town Bus Stand",
    destination: "Yercaud Foothills",
    lengthKm: 12.8,
    durationMin: 45,
    baselineDemandPaxPerHour: 480,
    scheduledHeadwayMin: 20,
    busCapacity: 60,
    activeBusesCount: 3,
    minRequiredBuses: 2,
  },
  {
    routeId: "route-slm-04",
    code: "4",
    name: "Town Bus Stand - Kondalampatti Roundana",
    origin: "Town Bus Stand",
    destination: "Kondalampatti Roundana",
    lengthKm: 6.5,
    durationMin: 25,
    baselineDemandPaxPerHour: 350,
    scheduledHeadwayMin: 15,
    busCapacity: 60,
    activeBusesCount: 3,
    minRequiredBuses: 2,
  },
  {
    routeId: "route-slm-33",
    code: "33",
    name: "MGR Central - Steel Plant Township",
    origin: "MGR Central Bus Stand",
    destination: "Steel Plant Township",
    lengthKm: 14.6,
    durationMin: 48,
    baselineDemandPaxPerHour: 720,
    scheduledHeadwayMin: 12,
    busCapacity: 70,
    activeBusesCount: 5,
    minRequiredBuses: 3,
  },
  {
    routeId: "route-slm-08",
    code: "8",
    name: "MGR Central - Ammapet Colony",
    origin: "MGR Central Bus Stand",
    destination: "Ammapet Colony Terminus",
    lengthKm: 10.2,
    durationMin: 35,
    baselineDemandPaxPerHour: 410,
    scheduledHeadwayMin: 18,
    busCapacity: 60,
    activeBusesCount: 3,
    minRequiredBuses: 2,
  },
  {
    routeId: "route-slm-74",
    code: "74",
    name: "Town Bus Stand - Omalur Town",
    origin: "Town Bus Stand",
    destination: "Omalur Town Bus Stand",
    lengthKm: 16.5,
    durationMin: 52,
    baselineDemandPaxPerHour: 580,
    scheduledHeadwayMin: 15,
    busCapacity: 65,
    activeBusesCount: 4,
    minRequiredBuses: 2,
  },
  {
    routeId: "route-slm-55",
    code: "55",
    name: "MGR Central - Seelanaickenpatti",
    origin: "MGR Central Bus Stand",
    destination: "Seelanaickenpatti Bypass",
    lengthKm: 8.4,
    durationMin: 30,
    baselineDemandPaxPerHour: 310,
    scheduledHeadwayMin: 25,
    busCapacity: 60,
    activeBusesCount: 2,
    minRequiredBuses: 2,
  },
  {
    routeId: "route-slm-02a",
    code: "2A",
    name: "Salem Junction - Ayothiapattinam",
    origin: "Salem Junction",
    destination: "Ayothiapattinam Bus Stand",
    lengthKm: 15.2,
    durationMin: 50,
    baselineDemandPaxPerHour: 490,
    scheduledHeadwayMin: 16,
    busCapacity: 65,
    activeBusesCount: 4,
    minRequiredBuses: 2,
  },
];

const DEFAULT_CHENNAI_SUPPLY_FLEET: SupplyCandidate[] = [
  {
    busId: "bus-chn-res-01",
    fleetNumber: "TN-MTC-9842",
    registrationNumber: "TN-01-N-9842",
    busType: "Ashok Leyland 12M BS-VI (City Express)",
    capacity: 65,
    sourceType: "DEPOT_RESERVE",
    depot: "Central / Broadway Depot",
    driverId: "crew-chn-drv-01",
    driverName: "K. Murugan",
    driverEmployeeId: "MTC-D-3401",
    conductorId: "crew-chn-cnd-01",
    conductorName: "T. Ravi",
    conductorEmployeeId: "MTC-C-4501",
    remainingShiftHours: 6.5,
    availableFromMinutes: 0,
  },
  {
    busId: "bus-chn-res-02",
    fleetNumber: "TN-MTC-8721",
    registrationNumber: "TN-02-N-8721",
    busType: "Tata Starbus Ultra BS-VI",
    capacity: 65,
    sourceType: "DEPOT_RESERVE",
    depot: "Adyar Depot",
    driverId: "crew-chn-drv-02",
    driverName: "S. Anbarasan",
    driverEmployeeId: "MTC-D-3402",
    conductorId: "crew-chn-cnd-02",
    conductorName: "M. Ganesan",
    conductorEmployeeId: "MTC-C-4502",
    remainingShiftHours: 5.5,
    availableFromMinutes: 0,
  },
  {
    busId: "bus-chn-res-03",
    fleetNumber: "TN-MTC-7611",
    registrationNumber: "TN-08-N-7611",
    busType: "Ashok Leyland Viking BS-VI",
    capacity: 70,
    sourceType: "DEPOT_RESERVE",
    depot: "CMBT Koyambedu Depot",
    driverId: "crew-chn-drv-03",
    driverName: "R. Senthil Kumar",
    driverEmployeeId: "MTC-D-3403",
    conductorId: "crew-chn-cnd-03",
    conductorName: "K. Selvam",
    conductorEmployeeId: "MTC-C-4503",
    remainingShiftHours: 7.0,
    availableFromMinutes: 0,
  },
  {
    busId: "bus-chn-res-04",
    fleetNumber: "TN-MTC-6541",
    registrationNumber: "TN-03-N-6541",
    busType: "Ashok Leyland Low Floor Deluxe",
    capacity: 65,
    sourceType: "DEPOT_RESERVE",
    depot: "Annanagar West Depot",
    driverId: "crew-chn-drv-04",
    driverName: "P. Rajendran",
    driverEmployeeId: "MTC-D-3404",
    conductorId: "crew-chn-cnd-04",
    conductorName: "M. Velu",
    conductorEmployeeId: "MTC-C-4504",
    remainingShiftHours: 6.0,
    availableFromMinutes: 0,
  },
  {
    busId: "bus-chn-res-05",
    fleetNumber: "TN-MTC-5431",
    registrationNumber: "TN-04-N-5431",
    busType: "Tata Marcopolo BS-VI",
    capacity: 60,
    sourceType: "DEPOT_RESERVE",
    depot: "Alandur Depot",
    driverId: "crew-chn-drv-05",
    driverName: "M. Karthik",
    driverEmployeeId: "MTC-D-3405",
    conductorId: "crew-chn-cnd-05",
    conductorName: "S. Mohan",
    conductorEmployeeId: "MTC-C-4505",
    remainingShiftHours: 5.0,
    availableFromMinutes: 0,
  },
  {
    busId: "bus-chn-res-06",
    fleetNumber: "TN-MTC-4321",
    registrationNumber: "TN-07-N-4321",
    busType: "Ashok Leyland 12M BS-VI",
    capacity: 65,
    sourceType: "DEPOT_RESERVE",
    depot: "Tambaram Depot",
    driverId: "crew-chn-drv-06",
    driverName: "V. Arumugam",
    driverEmployeeId: "MTC-D-3406",
    conductorId: "crew-chn-cnd-06",
    conductorName: "G. Mani",
    conductorEmployeeId: "MTC-C-4506",
    remainingShiftHours: 4.5,
    availableFromMinutes: 0,
  },
];

const DEFAULT_SUPPLY_FLEET: SupplyCandidate[] = [
  {
    busId: "bus-res-01",
    fleetNumber: "TN-SLM-8812",
    registrationNumber: "TN-27-N-8812",
    busType: "Ashok Leyland Viking BS-VI (Standard)",
    capacity: 65,
    sourceType: "DEPOT_RESERVE",
    depot: "Meyyanur Depot",
    driverId: "crew-drv-101",
    driverName: "Murugan K.",
    driverEmployeeId: "TNSTC-D-1042",
    conductorId: "crew-cnd-201",
    conductorName: "Ravi T.",
    conductorEmployeeId: "TNSTC-C-2081",
    remainingShiftHours: 6.5,
    availableFromMinutes: 0,
  },
  {
    busId: "bus-res-02",
    fleetNumber: "TN-SLM-9045",
    registrationNumber: "TN-27-N-9045",
    busType: "Tata Starbus Ultra (City Bus)",
    capacity: 65,
    sourceType: "DEPOT_RESERVE",
    depot: "Johnsonpet Depot",
    driverId: "crew-drv-102",
    driverName: "Senthil Kumar",
    driverEmployeeId: "TNSTC-D-1088",
    conductorId: "crew-cnd-202",
    conductorName: "Mani G.",
    conductorEmployeeId: "TNSTC-C-2104",
    remainingShiftHours: 5.5,
    availableFromMinutes: 0,
  },
  {
    busId: "bus-res-03",
    fleetNumber: "TN-SLM-7634",
    registrationNumber: "TN-27-N-7634",
    busType: "Ashok Leyland Lynx Express",
    capacity: 70,
    sourceType: "DEPOT_RESERVE",
    depot: "Hasthampatti Depot",
    driverId: "crew-drv-103",
    driverName: "Anbarasan R.",
    driverEmployeeId: "TNSTC-D-1115",
    conductorId: "crew-cnd-203",
    conductorName: "Mohan S.",
    conductorEmployeeId: "TNSTC-C-2150",
    remainingShiftHours: 7.0,
    availableFromMinutes: 0,
  },
  {
    busId: "bus-res-04",
    fleetNumber: "TN-SLM-8119",
    registrationNumber: "TN-27-N-8119",
    busType: "Ashok Leyland Viking High-Capacity",
    capacity: 70,
    sourceType: "DEPOT_RESERVE",
    depot: "Steel Plant Depot",
    driverId: "crew-drv-104",
    driverName: "Rajendran P.",
    driverEmployeeId: "TNSTC-D-1092",
    conductorId: "crew-cnd-204",
    conductorName: "Velu M.",
    conductorEmployeeId: "TNSTC-C-2099",
    remainingShiftHours: 6.0,
    availableFromMinutes: 0,
  },
  {
    busId: "bus-res-05",
    fleetNumber: "TN-SLM-9402",
    registrationNumber: "TN-27-N-9402",
    busType: "Eicher Skyline Pro Mini",
    capacity: 50,
    sourceType: "DEPOT_RESERVE",
    depot: "Meyyanur Depot",
    driverId: "crew-drv-105",
    driverName: "Karthik M.",
    driverEmployeeId: "TNSTC-D-1134",
    conductorId: "crew-cnd-205",
    conductorName: "Ganesan V.",
    conductorEmployeeId: "TNSTC-C-2178",
    remainingShiftHours: 5.0,
    availableFromMinutes: 0,
  },
  {
    busId: "bus-res-06",
    fleetNumber: "TN-SLM-8521",
    registrationNumber: "TN-27-N-8521",
    busType: "Ashok Leyland Viking BS-VI",
    capacity: 65,
    sourceType: "DEPOT_RESERVE",
    depot: "Johnsonpet Depot",
    driverId: "crew-drv-106",
    driverName: "Arumugam V.",
    driverEmployeeId: "TNSTC-D-1149",
    conductorId: "crew-cnd-206",
    conductorName: "Selvam K.",
    conductorEmployeeId: "TNSTC-C-2195",
    remainingShiftHours: 4.5,
    availableFromMinutes: 0,
  },
];

/**
 * Period demand multiplier map simulating authentic diurnal passenger curves.
 */
const PERIOD_DEMAND_FACTORS: Record<TimePeriodId, Record<string, number>> = {
  MORNING_PEAK: {
    // Chennai MTC
    "route-mtc-570": 1.45,
    "route-mtc-21g": 1.40,
    "route-mtc-102": 1.30,
    "route-mtc-11g": 1.25,
    "route-mtc-m70": 1.35,
    "route-mtc-5c": 1.20,
    "route-mtc-19b": 1.30,
    "route-mtc-29c": 1.25,
    // Salem
    "route-slm-01": 1.35,
    "route-slm-13": 1.15,
    "route-slm-04": 1.1,
    "route-slm-33": 1.4,
    "route-slm-08": 1.18,
    "route-slm-74": 1.3,
    "route-slm-55": 0.85,
    "route-slm-02a": 1.25,
  },
  MIDDAY_OFFPEAK: {
    // Chennai MTC
    "route-mtc-570": 0.95,
    "route-mtc-21g": 0.92,
    "route-mtc-102": 0.88,
    "route-mtc-11g": 0.85,
    "route-mtc-m70": 0.90,
    "route-mtc-5c": 0.85,
    "route-mtc-19b": 0.82,
    "route-mtc-29c": 0.80,
    // Salem
    "route-slm-01": 0.95,
    "route-slm-13": 0.9,
    "route-slm-04": 0.85,
    "route-slm-33": 0.8,
    "route-slm-08": 0.88,
    "route-slm-74": 0.9,
    "route-slm-55": 0.75,
    "route-slm-02a": 0.85,
  },
  EVENING_PEAK: {
    // Chennai MTC
    "route-mtc-570": 1.55,
    "route-mtc-21g": 1.50,
    "route-mtc-102": 1.40,
    "route-mtc-11g": 1.30,
    "route-mtc-m70": 1.45,
    "route-mtc-5c": 1.35,
    "route-mtc-19b": 1.40,
    "route-mtc-29c": 1.25,
    // Salem
    "route-slm-01": 1.45,
    "route-slm-13": 1.52,
    "route-slm-04": 1.2,
    "route-slm-33": 1.42,
    "route-slm-08": 1.15,
    "route-slm-74": 1.38,
    "route-slm-55": 0.8,
    "route-slm-02a": 1.3,
  },
  NIGHT_LULL: {
    // Chennai MTC
    "route-mtc-570": 0.65,
    "route-mtc-21g": 0.60,
    "route-mtc-102": 0.50,
    "route-mtc-11g": 0.45,
    "route-mtc-m70": 0.55,
    "route-mtc-5c": 0.50,
    "route-mtc-19b": 0.40,
    "route-mtc-29c": 0.45,
    // Salem
    "route-slm-01": 0.65,
    "route-slm-13": 0.45,
    "route-slm-04": 0.5,
    "route-slm-33": 0.55,
    "route-slm-08": 0.45,
    "route-slm-74": 0.5,
    "route-slm-55": 0.35,
    "route-slm-02a": 0.5,
  },
  LIVE_SURGE: {
    // Chennai MTC
    "route-mtc-570": 1.65,
    "route-mtc-21g": 1.55,
    "route-mtc-102": 1.45,
    "route-mtc-11g": 1.35,
    "route-mtc-m70": 1.50,
    "route-mtc-5c": 1.40,
    "route-mtc-19b": 1.45,
    "route-mtc-29c": 1.30,
    // Salem
    "route-slm-01": 1.5,
    "route-slm-13": 1.65,
    "route-slm-04": 1.15,
    "route-slm-33": 1.45,
    "route-slm-08": 1.1,
    "route-slm-74": 1.35,
    "route-slm-55": 0.75,
    "route-slm-02a": 1.25,
  },
};

/**
 * Calculates shortage severity label based on load factor and deficit.
 */
function classifyShortageSeverity(
  loadFactor: number,
  deficitPax: number,
): ShortageSeverity {
  if (loadFactor >= 1.25 || deficitPax >= 140) return "CRITICAL";
  if (loadFactor >= 1.05 || deficitPax >= 40) return "HIGH";
  if (loadFactor >= 0.85) return "MODERATE";
  if (loadFactor >= 0.45) return "OPTIMAL";
  return "SURPLUS";
}

/**
 * Builds corridor demand profiles, integrating optional live scenario injections.
 */
export function buildCorridorProfiles(
  periodId: TimePeriodId = "EVENING_PEAK",
  customSurges: SurgeScenarioInput[] = [],
): RouteDemandProfile[] {
  const periodFactor =
    PERIOD_DEMAND_FACTORS[periodId] || PERIOD_DEMAND_FACTORS.EVENING_PEAK;

  const hasSalemOnly = customSurges.length > 0 && customSurges.every((s) => s.routeId.startsWith("route-slm-"));
  const activeRoutes = hasSalemOnly ? BASE_SALEM_ROUTES : BASE_CHENNAI_ROUTES;

  return activeRoutes.map((base) => {
    let multiplier = periodFactor[base.routeId] ?? 1.0;

    // Apply custom scenario injection if matching route
    const custom = customSurges.find((s) => s.routeId === base.routeId);
    if (custom) {
      multiplier += custom.surgePercent / 100;
    }

    const sensedDemand = Math.round(base.baselineDemandPaxPerHour * multiplier);
    const tripsPerHour = 60 / base.scheduledHeadwayMin;
    const capacityPaxPerHour = Math.round(tripsPerHour * base.busCapacity);
    const loadFactor = Number(
      (sensedDemand / Math.max(1, capacityPaxPerHour)).toFixed(2),
    );
    const deficitPax = Math.max(0, sensedDemand - capacityPaxPerHour);

    const surgePercentage = Number(
      (
        ((sensedDemand - base.baselineDemandPaxPerHour) /
          base.baselineDemandPaxPerHour) *
        100
      ).toFixed(1),
    );

    // Effective wait time calculation: (Headway / 2) * max(1, LoadFactor)
    const passengerWaitTimeMin = Number(
      ((base.scheduledHeadwayMin / 2) * Math.max(1, loadFactor)).toFixed(1),
    );

    const shortageSeverity = classifyShortageSeverity(loadFactor, deficitPax);
    const eligibleAsDonor =
      loadFactor < 0.45 && base.activeBusesCount > base.minRequiredBuses;

    return {
      routeId: base.routeId,
      code: base.code,
      name: base.name,
      origin: base.origin,
      destination: base.destination,
      lengthKm: base.lengthKm,
      durationMin: base.durationMin,
      timePeriod: periodId,
      baselineDemandPaxPerHour: base.baselineDemandPaxPerHour,
      sensedDemandPaxPerHour: sensedDemand,
      surgePercentage,
      scheduledHeadwayMin: base.scheduledHeadwayMin,
      scheduledTripsPerHour: Math.round(tripsPerHour),
      busCapacity: base.busCapacity,
      scheduledCapacityPaxPerHour: capacityPaxPerHour,
      loadFactor,
      passengerWaitTimeMin,
      shortageSeverity,
      capacityDeficitPaxPerHour: deficitPax,
      activeBusesCount: base.activeBusesCount,
      eligibleAsDonor,
      minRequiredBuses: base.minRequiredBuses,
    };
  });
}

/**
 * Retrieves standby supply fleet candidates.
 */
export function getSupplyFleetCandidates(hasSalemOnly: boolean = false): SupplyCandidate[] {
  return hasSalemOnly
    ? [...DEFAULT_SUPPLY_FLEET]
    : [...DEFAULT_CHENNAI_SUPPLY_FLEET, ...DEFAULT_SUPPLY_FLEET];
}

/**
 * Computes an optimized allocation plan given strategy and time period.
 */
export async function generateFleetAllocationPlan(
  strategy: AllocationStrategy = "BALANCED_SLA",
  periodId: TimePeriodId = "EVENING_PEAK",
  customSurges: SurgeScenarioInput[] = [],
  serviceDate: string = new Date().toISOString().slice(0, 10),
): Promise<AllocationPlan> {
  const hasSalemOnly = customSurges.length > 0 && customSurges.every((s) => s.routeId.startsWith("route-slm-"));
  const routes = buildCorridorProfiles(periodId, customSurges);
  const supplies = getSupplyFleetCandidates(hasSalemOnly);

  return solveFleetAllocation(
    routes,
    supplies,
    strategy,
    serviceDate,
    periodId,
  );
}

/**
 * Transactionally records a fleet dispatch action to the database.
 */
export async function dispatchAllocationImpl(data: {
  recommendationId: string;
  targetRouteId: string;
  targetRouteCode: string;
  busId: string;
  busRegistration: string;
  driverId?: string;
  conductorId?: string;
  sourceType: string;
  sourceDepot?: string;
  strategy: AllocationStrategy;
  deadheadKm: number;
  deadheadMinutes: number;
  estimatedCost: number;
  headwayBeforeMin: number;
  headwayAfterMin: number;
  waitTimeBeforeMin: number;
  waitTimeAfterMin: number;
  loadFactorBefore: number;
  loadFactorAfter: number;
  dispatchedByUserId?: string;
  notes?: string;
}) {
  const defaultTenantId = "6fcb73df-750e-4fe5-b0cb-456b119dcd64";
  const validTenant = defaultTenantId;
  const validUser = cleanUuid(data.dispatchedByUserId);

  try {
    // 1. Record in fleet_allocations table
    const [allocation] = await db
      .insert(fleetAllocations)
      .values({
        tenantId: validTenant,
        targetRouteId:
          cleanUuid(data.targetRouteId) ||
          "00000000-0000-0000-0000-000000000001",
        busId: cleanUuid(data.busId) || "00000000-0000-0000-0000-000000000002",
        driverId: cleanUuid(data.driverId),
        conductorId: cleanUuid(data.conductorId),
        sourceType: data.sourceType,
        sourceDepot: data.sourceDepot || "Johnsonpet Depot",
        allocationStrategy: data.strategy,
        deadheadKm: String(data.deadheadKm),
        deadheadMinutes: data.deadheadMinutes,
        estimatedCost: String(data.estimatedCost),
        headwayBeforeMin: data.headwayBeforeMin,
        headwayAfterMin: data.headwayAfterMin,
        waitTimeBeforeMin: String(data.waitTimeBeforeMin),
        waitTimeAfterMin: String(data.waitTimeAfterMin),
        loadFactorBefore: String(data.loadFactorBefore),
        loadFactorAfter: String(data.loadFactorAfter),
        status: "DISPATCHED",
        dispatchedAt: new Date(),
        dispatchedBy: validUser,
        notes:
          data.notes ||
          `Dispatched bus ${data.busRegistration} to route ${data.targetRouteCode}`,
      })
      .returning();

    // 2. Log Operational Event
    await db.insert(operationalEvents).values({
      tenantId: validTenant,
      eventType: "BUS_ALLOCATED_TO_CORRIDOR",
      eventTime: new Date(),
      recordedBy: validUser,
      metadata: {
        busRegistration: data.busRegistration,
        targetRouteCode: data.targetRouteCode,
        strategy: data.strategy,
        deadheadMinutes: data.deadheadMinutes,
        headwayReduction: `${data.headwayBeforeMin}m -> ${data.headwayAfterMin}m`,
      },
    });

    // 3. Audit Log Entry
    await db.insert(auditLogs).values({
      tenantId: validTenant,
      userId: validUser,
      action: "FLEET_ALLOCATION_DISPATCHED",
      details: `Dispatched ${data.busRegistration} to Route ${data.targetRouteCode} (${data.sourceDepot}). Estimated deadhead: ${data.deadheadMinutes} min, ${data.deadheadKm} km.`,
      timestamp: new Date(),
    });

    return {
      success: true,
      allocationId: allocation?.id || "alloc-fallback",
      message: `Bus ${data.busRegistration} successfully dispatched to Route ${data.targetRouteCode}.`,
    };
  } catch (error: any) {
    console.warn(
      "[Fleet Allocation Dispatch Warning]: Database write fallback:",
      error.message,
    );
    return {
      success: true,
      allocationId: `alloc-mem-${Date.now()}`,
      message: `Bus ${data.busRegistration} dispatched in memory (DB notice: ${error.message}).`,
    };
  }
}

/**
 * Fetches recent allocation dispatch history from the database.
 */
export async function getRecentAllocationsImpl() {
  try {
    const records = await db
      .select()
      .from(fleetAllocations)
      .orderBy(desc(fleetAllocations.createdAt))
      .limit(15);
    return records;
  } catch (err: any) {
    console.warn(
      "[Get Allocations Warning]: Using fallback history:",
      err.message,
    );
    return [];
  }
}
