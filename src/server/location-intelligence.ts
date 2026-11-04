import fs from "fs";
import path from "path";
import { db } from "./db";
import { stops, routes } from "./db/schema";
import { requireAuth } from "./auth";
import { eq } from "drizzle-orm";
import { FALLBACK_STOPS } from "./db/fallback-data";
import { CHENNAI_MTC_STOPS } from "./data/chennai-mtc-dataset";

export interface CanonicalLocation {
  id: string;
  name: string;
  code?: string;
  lat: number;
  lng: number;
  type: "terminal" | "depot" | "station" | "stop";
  area?: string;
  routesServed?: string[];
}

// Major hubs and landmarks for priority matching
const MAJOR_CHENNAI_HUBS: CanonicalLocation[] = [
  {
    id: "hub-tambaram",
    name: "Tambaram West Bus Terminus",
    code: "TBM",
    lat: 12.9249,
    lng: 80.1265,
    type: "terminal",
    area: "South-West",
    routesServed: ["1B", "21G", "570", "70", "18A"],
  },
  {
    id: "hub-broadway",
    name: "Broadway Bus Terminus",
    code: "BDW",
    lat: 13.0876,
    lng: 80.2838,
    type: "terminal",
    area: "North",
    routesServed: ["1", "4", "5C", "21G", "11 R"],
  },
  {
    id: "hub-cmbt",
    name: "CMBT Koyambedu Terminus",
    code: "CMBT",
    lat: 13.0673,
    lng: 80.2057,
    type: "terminal",
    area: "West",
    routesServed: ["570", "70", "D70", "M70", "154"],
  },
  {
    id: "hub-guindy",
    name: "Guindy Kathipara Junction",
    code: "GDY",
    lat: 13.0067,
    lng: 80.2023,
    type: "terminal",
    area: "South",
    routesServed: ["570", "21G", "70", "19B", "3CT"],
  },
  {
    id: "hub-tnagar",
    name: "T. Nagar Bus Terminus",
    code: "TNG",
    lat: 13.0402,
    lng: 80.2337,
    type: "terminal",
    area: "Central",
    routesServed: ["3", "5B", "5G", "11 R", "47A"],
  },
  {
    id: "hub-annanagar",
    name: "Anna Nagar West Depot",
    code: "ANW",
    lat: 13.0957,
    lng: 80.1979,
    type: "depot",
    area: "North-West",
    routesServed: ["29A", "22 CT", "70"],
  },
  {
    id: "hub-adyar",
    name: "Adyar Bus Depot",
    code: "ADY",
    lat: 12.9978,
    lng: 80.2562,
    type: "depot",
    area: "South",
    routesServed: ["1", "5C", "19B", "21G", "570"],
  },
  {
    id: "hub-saidapet",
    name: "Saidapet Bus Stand",
    code: "SDP",
    lat: 13.0205,
    lng: 80.2228,
    type: "terminal",
    area: "South",
    routesServed: ["18A", "21G", "570", "47A"],
  },
  {
    id: "hub-central",
    name: "Chennai Central Railway Station",
    code: "MAS",
    lat: 13.0827,
    lng: 80.2757,
    type: "station",
    area: "Central",
    routesServed: ["1", "21G", "2ACT", "11 R"],
  },
  {
    id: "hub-egmore",
    name: "Chennai Egmore Station",
    code: "MS",
    lat: 13.0784,
    lng: 80.2608,
    type: "station",
    area: "Central",
    routesServed: ["29A", "27B"],
  },
  {
    id: "hub-marina",
    name: "Anna Square (Marina Beach)",
    code: "ASQ",
    lat: 13.0645,
    lng: 80.2858,
    type: "terminal",
    area: "Central",
    routesServed: ["2", "2A", "29A", "12G"],
  },
  {
    id: "hub-vadapalani",
    name: "Vadapalani Bus Depot",
    code: "VDP",
    lat: 13.0512,
    lng: 80.212,
    type: "depot",
    area: "Central",
    routesServed: ["5E", "70", "88K"],
  },
  {
    id: "hub-siruseri",
    name: "Siruseri SIPCOT IT Park",
    code: "SRS",
    lat: 12.8284,
    lng: 80.2195,
    type: "terminal",
    area: "OMR IT Corridor",
    routesServed: ["570", "102", "19B"],
  },
  {
    id: "hub-thiruvanmiyur",
    name: "Thiruvanmiyur Depot",
    code: "TRV",
    lat: 12.983,
    lng: 80.2594,
    type: "depot",
    area: "South",
    routesServed: ["1", "1C", "1D", "3"],
  },
  {
    id: "hub-velachery",
    name: "Velachery Checkpost",
    code: "VLC",
    lat: 12.9815,
    lng: 80.2209,
    type: "terminal",
    area: "South",
    routesServed: ["570", "5C", "19B"],
  },
  {
    id: "hub-poonamallee",
    name: "Poonamallee Bus Terminus",
    code: "PNM",
    lat: 13.0494,
    lng: 80.0911,
    type: "terminal",
    area: "West",
    routesServed: ["54", "88K"],
  },
  {
    id: "hub-avadi",
    name: "Avadi Bus Terminus",
    code: "AVD",
    lat: 13.1189,
    lng: 80.1009,
    type: "terminal",
    area: "North-West",
    routesServed: ["70", "29A"],
  },
  {
    id: "hub-ambattur",
    name: "Ambattur Industrial Estate",
    code: "AMB",
    lat: 13.0984,
    lng: 80.1618,
    type: "terminal",
    area: "North-West",
    routesServed: ["70", "D70"],
  },
  {
    id: "hub-madhavaram",
    name: "Madhavaram MMBT Terminus",
    code: "MDV",
    lat: 13.132,
    lng: 80.2371,
    type: "terminal",
    area: "North",
    routesServed: ["570", "114"],
  },
];

// Major hubs and landmarks for Salem
const MAJOR_SALEM_HUBS: CanonicalLocation[] = [
  {
    id: "hub-slm-town",
    name: "Salem Town Bus Stand (Old Bus Stand)",
    code: "SLM-OBS",
    lat: 11.6528,
    lng: 78.1591,
    type: "terminal",
    area: "Central Salem",
    routesServed: ["1", "4", "13", "74"],
  },
  {
    id: "hub-slm-mgr",
    name: "MGR Central Bus Stand (New Bus Stand)",
    code: "SLM-NBS",
    lat: 11.6673,
    lng: 78.1424,
    type: "terminal",
    area: "Meyyanur",
    routesServed: ["8", "33", "55"],
  },
  {
    id: "hub-slm-jnc",
    name: "Salem Junction Railway Station",
    code: "SLM-JNC",
    lat: 11.6714,
    lng: 78.1132,
    type: "station",
    area: "Suramangalam",
    routesServed: ["1", "2A"],
  },
  {
    id: "hub-slm-four-roads",
    name: "Four Roads Junction",
    code: "SLM-4RD",
    lat: 11.658,
    lng: 78.155,
    type: "stop",
    area: "Central Salem",
    routesServed: ["1", "13", "74"],
  },
  {
    id: "hub-slm-five-roads",
    name: "Five Roads Junction",
    code: "SLM-5RD",
    lat: 11.6668,
    lng: 78.1565,
    type: "stop",
    area: "Meyyanur",
    routesServed: ["1", "74"],
  },
  {
    id: "hub-slm-hasthampatti",
    name: "Hasthampatti Roundana",
    code: "SLM-HST",
    lat: 11.6705,
    lng: 78.1437,
    type: "terminal",
    area: "North Salem",
    routesServed: ["8", "13"],
  },
  {
    id: "hub-slm-meyyanur-depot",
    name: "Meyyanur Central Depot",
    code: "SLM-MEY-01",
    lat: 11.6675,
    lng: 78.143,
    type: "depot",
    area: "Meyyanur",
    routesServed: ["1", "8", "33"],
  },
  {
    id: "hub-slm-kondalampatti",
    name: "Kondalampatti Roundana",
    code: "SLM-KND",
    lat: 11.652,
    lng: 78.143,
    type: "terminal",
    area: "South Salem",
    routesServed: ["4"],
  },
  {
    id: "hub-slm-ammapet",
    name: "Ammapet Colony",
    code: "SLM-AMP",
    lat: 11.672,
    lng: 78.148,
    type: "stop",
    area: "East Salem",
    routesServed: ["8"],
  },
  {
    id: "hub-slm-yercaud-foot",
    name: "Yercaud Foothills",
    code: "SLM-YRC",
    lat: 11.685,
    lng: 78.175,
    type: "terminal",
    area: "Foot of Shevaroys",
    routesServed: ["13"],
  },
  {
    id: "hub-slm-steel-plant",
    name: "Salem Steel Plant",
    code: "SLM-STP",
    lat: 11.678,
    lng: 78.122,
    type: "terminal",
    area: "West Salem",
    routesServed: ["33"],
  },
  {
    id: "hub-slm-suramangalam-depot",
    name: "Suramangalam Depot",
    code: "SLM-SUR-03",
    lat: 11.6718,
    lng: 78.117,
    type: "depot",
    area: "Suramangalam",
    routesServed: ["2A"],
  },
];

const tenantLocationCache = new Map<string, CanonicalLocation[]>();

async function loadLocationsForTenant(tenantId?: string): Promise<CanonicalLocation[]> {
  let resolvedTenantId = tenantId;
  if (!resolvedTenantId) {
    try {
      const user = await requireAuth();
      resolvedTenantId = user.tenantId;
    } catch {
      resolvedTenantId = "69000000-0000-4000-8000-000000000069";
    }
  }

  if (tenantLocationCache.has(resolvedTenantId)) {
    return tenantLocationCache.get(resolvedTenantId)!;
  }

  const isSalem =
    resolvedTenantId === "c4ab681d-7b82-4674-bb8a-14ef96de6d23" ||
    resolvedTenantId === "6fcb73df-750e-4fe5-b0cb-456b119dcd64";
  const isChennai = resolvedTenantId.startsWith("69000000");

  const baseHubs = isSalem ? MAJOR_SALEM_HUBS : isChennai ? MAJOR_CHENNAI_HUBS : [];
  const locs: CanonicalLocation[] = [...baseHubs];
  const seenNames = new Set(baseHubs.map((h) => h.name.toLowerCase()));

  // 1. Load database stops for this tenant
  try {
    const dbStops = await db
      .select({
        id: stops.id,
        name: stops.name,
        code: stops.code,
        latitude: stops.latitude,
        longitude: stops.longitude,
      })
      .from(stops)
      .where(eq(stops.tenantId, resolvedTenantId));

    for (const s of dbStops) {
      const normName = (s.name || "").trim();
      if (normName && !seenNames.has(normName.toLowerCase())) {
        seenNames.add(normName.toLowerCase());
        locs.push({
          id: s.id,
          name: normName,
          code: s.code || undefined,
          lat: Number(s.latitude) || 0,
          lng: Number(s.longitude) || 0,
          type: "stop",
        });
      }
    }
  } catch {
    // Continue with fallback data
  }

  // 2. Load fallback stops if needed
  if (isSalem) {
    FALLBACK_STOPS.filter(
      (s) => s.tenantId === resolvedTenantId || s.tenantId === "c4ab681d-7b82-4674-bb8a-14ef96de6d23",
    ).forEach((s) => {
      const normName = (s.name || "").trim();
      if (normName && !seenNames.has(normName.toLowerCase())) {
        seenNames.add(normName.toLowerCase());
        locs.push({
          id: s.id,
          name: normName,
          code: s.code || undefined,
          lat: Number(s.latitude) || 11.65,
          lng: Number(s.longitude) || 78.15,
          type: "stop",
        });
      }
    });
  } else if (isChennai) {
    Object.values(CHENNAI_MTC_STOPS).forEach((s) => {
      const normName = (s.name || "").trim();
      if (normName && !seenNames.has(normName.toLowerCase())) {
        seenNames.add(normName.toLowerCase());
        locs.push({
          id: s.id,
          name: normName,
          code: s.code || undefined,
          lat: s.lat,
          lng: s.lng,
          type: s.isTerminal ? "terminal" : "stop",
          area: s.zone,
        });
      }
    });
  }

  tenantLocationCache.set(resolvedTenantId, locs);
  return locs;
}

export async function searchLocationsImpl(
  query: string,
  limit = 12,
  tenantId?: string,
): Promise<CanonicalLocation[]> {
  const allLocations = await loadLocationsForTenant(tenantId);
  const trimmed = (query || "").trim().toLowerCase();

  if (!trimmed) {
    return allLocations.slice(0, limit);
  }

  const scored = allLocations.map((loc) => {
    const nameLower = loc.name.toLowerCase();
    const codeLower = (loc.code || "").toLowerCase();
    const areaLower = (loc.area || "").toLowerCase();

    let score = 0;
    if (codeLower === trimmed) score = 100;
    else if (nameLower === trimmed) score = 95;
    else if (nameLower.startsWith(trimmed)) score = 80;
    else if (nameLower.includes(" " + trimmed)) score = 70;
    else if (nameLower.includes(trimmed)) score = 50;
    else if (areaLower.includes(trimmed)) score = 40;

    // Boost major hubs slightly
    if (loc.type === "terminal" || loc.type === "depot") {
      score += 5;
    }

    return { loc, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.loc);
}

export async function getCanonicalLocationsImpl(tenantId?: string): Promise<CanonicalLocation[]> {
  return await loadLocationsForTenant(tenantId);
}

