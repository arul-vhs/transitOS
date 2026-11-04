import fs from "fs";
import path from "path";
import { db } from "./db";
import { stops, routes } from "./db/schema";
import { requireAuth } from "./auth";
import { eq } from "drizzle-orm";

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

let cachedCanonicalLocations: CanonicalLocation[] | null = null;

function loadCanonicalLocations(): CanonicalLocation[] {
  if (cachedCanonicalLocations) return cachedCanonicalLocations;

  const locs: CanonicalLocation[] = [...MAJOR_CHENNAI_HUBS];
  const seenNames = new Set(MAJOR_CHENNAI_HUBS.map((h) => h.name.toLowerCase()));

  const jsonFile = path.resolve(process.cwd(), "data/chennai-canonical-locations.json");
  if (fs.existsSync(jsonFile)) {
    try {
      const raw = JSON.parse(fs.readFileSync(jsonFile, "utf8"));
      if (Array.isArray(raw)) {
        for (const item of raw) {
          const normName = (item.name || "").trim();
          if (normName && !seenNames.has(normName.toLowerCase())) {
            seenNames.add(normName.toLowerCase());
            locs.push({
              id: item.id || `loc-${normName.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
              name: normName,
              lat: Number(item.lat),
              lng: Number(item.lng),
              type: "stop",
            });
          }
        }
      }
    } catch {
      // Fallback to major hubs
    }
  }

  cachedCanonicalLocations = locs;
  return cachedCanonicalLocations;
}

export async function searchLocationsImpl(query: string, limit = 12): Promise<CanonicalLocation[]> {
  const allLocations = loadCanonicalLocations();
  const trimmed = (query || "").trim().toLowerCase();

  if (!trimmed) {
    return allLocations.slice(0, limit);
  }

  // Score matches:
  // Exact match: 100
  // Starts with: 80
  // Word match: 60
  // Substring match: 40
  // Code match: 90
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

export async function getCanonicalLocationsImpl(): Promise<CanonicalLocation[]> {
  return loadCanonicalLocations();
}

