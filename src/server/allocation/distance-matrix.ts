/**
 * GIS Distance & Deadheading Matrix for Salem Transit Network
 * Computes road network distances and deadhead travel times between depots,
 * route terminals, and surge corridor origins.
 */

interface GeoPoint {
  name: string;
  lat: number;
  lng: number;
}

export const DEPOT_LOCATIONS: Record<string, GeoPoint> = {
  "Johnsonpet Depot": { name: "Johnsonpet Depot", lat: 11.6565, lng: 78.1585 },
  "Meyyanur Depot": { name: "Meyyanur Depot", lat: 11.6685, lng: 78.1325 },
  "Hasthampatti Depot": {
    name: "Hasthampatti Depot",
    lat: 11.6795,
    lng: 78.165,
  },
  "Steel Plant Depot": { name: "Steel Plant Depot", lat: 11.632, lng: 78.045 },
};

export const TERMINAL_LOCATIONS: Record<string, GeoPoint> = {
  "Town Bus Stand": { name: "Town Bus Stand", lat: 11.6538, lng: 78.1595 },
  "Salem Junction": { name: "Salem Junction", lat: 11.6738, lng: 78.1278 },
  "MGR Central Bus Stand": {
    name: "MGR Central Bus Stand",
    lat: 11.6655,
    lng: 78.1465,
  },
  "Yercaud Foothills": { name: "Yercaud Foothills", lat: 11.725, lng: 78.205 },
  "Kondalampatti Roundana": {
    name: "Kondalampatti Roundana",
    lat: 11.621,
    lng: 78.135,
  },
  "Steel Plant Township": {
    name: "Steel Plant Township",
    lat: 11.6315,
    lng: 78.042,
  },
  "Ammapet Colony Terminus": {
    name: "Ammapet Colony Terminus",
    lat: 11.658,
    lng: 78.188,
  },
  "Omalur Town Bus Stand": {
    name: "Omalur Town Bus Stand",
    lat: 11.745,
    lng: 78.042,
  },
  "Seelanaickenpatti Bypass": {
    name: "Seelanaickenpatti Bypass",
    lat: 11.622,
    lng: 78.162,
  },
  "Ayothiapattinam Bus Stand": {
    name: "Ayothiapattinam Bus Stand",
    lat: 11.668,
    lng: 78.252,
  },
};

// Haversine distance in kilometers
function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Deadheading travel speed factoring urban arterial street grid (26 km/h)
const AVERAGE_DEADHEAD_SPEED_KMH = 26;
const DETOUR_CIRCUITY_FACTOR = 1.32; // Road network curvature over straight line
const FUEL_COST_PER_KM = 28.5; // Currency per deadhead km
const DISPATCH_OVERHEAD_BASE = 120.0; // Base positioning and dispatch cost

export function getDeadheadMetrics(
  fromLocation: string,
  toOriginLocation: string,
): {
  deadheadKm: number;
  deadheadMinutes: number;
  estimatedCost: number;
} {
  const fromPoint = DEPOT_LOCATIONS[fromLocation] ||
    TERMINAL_LOCATIONS[fromLocation] || {
      name: fromLocation,
      lat: 11.66,
      lng: 78.15,
    };

  const toPoint = TERMINAL_LOCATIONS[toOriginLocation] ||
    DEPOT_LOCATIONS[toOriginLocation] || {
      name: toOriginLocation,
      lat: 11.66,
      lng: 78.15,
    };

  const crowFlyDistance = haversineKm(
    fromPoint.lat,
    fromPoint.lng,
    toPoint.lat,
    toPoint.lng,
  );

  // Apply circuity factor for road network
  const deadheadKm = Math.max(
    1.2,
    Number((crowFlyDistance * DETOUR_CIRCUITY_FACTOR).toFixed(2)),
  );

  // Travel time in minutes
  const travelTimeHours = deadheadKm / AVERAGE_DEADHEAD_SPEED_KMH;
  const deadheadMinutes = Math.max(5, Math.round(travelTimeHours * 60) + 3); // 3 min prep/turnaround

  // Estimated operational cost (fuel + driver dispatch time)
  const estimatedCost = Number(
    (
      deadheadKm * FUEL_COST_PER_KM +
      DISPATCH_OVERHEAD_BASE +
      (deadheadMinutes / 60) * 180
    ).toFixed(2),
  );

  return {
    deadheadKm,
    deadheadMinutes,
    estimatedCost,
  };
}
