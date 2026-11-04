import rawData from "./extracted-data.json";
import {
  CHENNAI_MTC_TENANT_ID,
  SALEM_TENANT_ID,
  CHENNAI_MTC_STOPS,
  CHENNAI_MTC_ROUTES,
  CHENNAI_MTC_BUSES,
  CHENNAI_MTC_CREW,
  CHENNAI_MTC_TRIPS,
} from "../data/chennai-mtc-dataset";

export interface FallbackBus {
  id: string;
  tenantId: string;
  registrationNumber: string;
  fleetNumber: string;
  depot: string;
  status: string;
  busType: string;
  capacity: number;
  availableFrom: number;
  createdAt: string;
  updatedAt: string;
}

export interface FallbackCrew {
  id: string;
  tenantId: string;
  employeeId: string;
  name: string;
  role: string; // driver, conductor
  status: string; // available, assigned, resting, leave, unavailable
  depot: string;
  availableFrom: number;
  restUntil: number;
  licenseCategory?: string | null;
  licenseExpiry?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FallbackRoute {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  origin: string;
  destination: string;
  direction: string;
  lengthKm: string;
  distanceKm: string;
  durationMin: number;
  runtimeMinutes: number;
  geometryGeojson: any;
  polyline: any;
  status: string;
  color?: string;
  peakFrequency?: number;
  offPeakFrequency?: number;
  stopsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface FallbackStop {
  id: string;
  tenantId: string;
  routeId: string;
  name: string;
  code?: string;
  sequence: number;
  sequenceOrder: number;
  latitude: string;
  longitude: string;
  isTimepoint?: boolean;
  cumulativeDistanceKm?: string;
  cumulativeTimeMinutes?: number;
}

export interface FallbackTrip {
  id: string;
  tenantId: string;
  routeId: string;
  tripCode: string;
  tripNumber: string;
  direction: string;
  startTime: number;
  endTime: number;
  startMinutes: number;
  endMinutes: number;
  durationMin: number;
  distanceKm: string;
  origin: string;
  destination: string;
  status: string;
  serviceDate: string;
  route?: FallbackRoute;
  createdAt: string;
  updatedAt: string;
}

export interface FallbackDuty {
  id: string;
  tenantId: string;
  dutyCode: string;
  dutyNumber: string;
  dutyType: string;
  serviceDate: string;
  busId: string | null;
  driverId: string | null;
  conductorId: string | null;
  startTime: number;
  endTime: number;
  status: string;
  tripsCount?: number;
  spreadoverMinutes?: number;
  steeringMinutes?: number;
  bus?: FallbackBus;
  driver?: FallbackCrew;
  conductor?: FallbackCrew;
  trips?: any[];
  dutyTrips?: any[];
  createdAt: string;
  updatedAt: string;
}

// 1. Salem Fallback Records (Normalized from extracted-data.json)
const salemBuses: FallbackBus[] = (rawData.buses || []).map((b: any) => ({
  id: b.id,
  tenantId: b.tenant_id || SALEM_TENANT_ID,
  registrationNumber: b.registration_number,
  fleetNumber: b.fleet_number || b.registration_number,
  depot: b.depot || "Meyyanur Depot",
  status: b.status || "available",
  busType: b.bus_type || "Ashok Leyland 210 HP BS-VI Viking",
  capacity: b.capacity ?? 48,
  availableFrom: b.available_from ?? 330,
  createdAt: b.created_at || new Date().toISOString(),
  updatedAt: b.updated_at || new Date().toISOString(),
}));

const salemCrew: FallbackCrew[] = (rawData.crew || []).map((c: any) => ({
  id: c.id,
  tenantId: c.tenant_id || SALEM_TENANT_ID,
  employeeId: c.employee_id,
  name: c.name,
  role: c.role || "driver",
  status: c.status || "available",
  depot: c.depot || "Meyyanur Depot",
  availableFrom: c.available_from ?? 330,
  restUntil: c.rest_until ?? 330,
  licenseCategory:
    c.license_category ||
    (c.role === "driver"
      ? "Heavy Passenger Vehicle (HPV) / PSV Badge"
      : null),
  licenseExpiry: c.license_expiry || null,
  createdAt: c.created_at || new Date().toISOString(),
  updatedAt: c.updated_at || new Date().toISOString(),
}));

const salemStops: FallbackStop[] = (rawData.stops || []).map((s: any) => {
  const seq = s.sequence ?? s.sequence_order ?? 1;
  return {
    id: s.id,
    tenantId: s.tenant_id || SALEM_TENANT_ID,
    routeId: s.route_id,
    name: s.name,
    code: s.code || s.name,
    sequence: seq,
    sequenceOrder: seq,
    latitude: String(s.latitude || "11.652800"),
    longitude: String(s.longitude || "78.159100"),
  };
});

const salemRoutes: FallbackRoute[] = (rawData.routes || []).map((r: any) => {
  const stopsForRoute = salemStops.filter((s) => s.routeId === r.id);
  const length = String(r.length_km || r.distance_km || "10.00");
  const duration = r.duration_min ?? r.runtime_minutes ?? 30;
  const geojson = r.geometry_geojson || r.polyline || null;

  return {
    id: r.id,
    tenantId: r.tenant_id || SALEM_TENANT_ID,
    code: r.code,
    name: r.name,
    origin: r.origin || "Origin Terminal",
    destination: r.destination || "Destination Terminal",
    direction: r.direction || "UP",
    lengthKm: length,
    distanceKm: length,
    durationMin: duration,
    runtimeMinutes: duration,
    geometryGeojson: geojson,
    polyline: geojson,
    status: r.status || "active",
    color: r.color || "#2563EB",
    peakFrequency: r.peak_frequency,
    offPeakFrequency: r.off_peak_frequency,
    stopsCount: stopsForRoute.length,
    createdAt: r.created_at || new Date().toISOString(),
    updatedAt: r.updated_at || new Date().toISOString(),
  };
});

const salemTrips: FallbackTrip[] = (rawData.trips || []).map((t: any) => {
  const route = salemRoutes.find((r) => r.id === t.route_id);
  const startTime = t.start_time ?? t.start_minutes ?? 360;
  const endTime = t.end_time ?? t.end_minutes ?? startTime + 30;
  const tripCode = t.trip_code || t.trip_number || `TR-${t.id?.slice(0, 6)}`;

  return {
    id: t.id,
    tenantId: t.tenant_id || SALEM_TENANT_ID,
    routeId: t.route_id,
    tripCode,
    tripNumber: tripCode,
    direction: t.direction || "OUTBOUND",
    startTime,
    endTime,
    startMinutes: startTime,
    endMinutes: endTime,
    durationMin: t.duration_min ?? endTime - startTime,
    distanceKm: t.distance_km || route?.lengthKm || "10.00",
    origin: t.origin || route?.origin || "Salem Central",
    destination:
      t.destination || route?.destination || "Destination Terminus",
    status: t.status || "scheduled",
    serviceDate: t.service_date || "25 Aug 2026",
    route,
    createdAt: t.created_at || new Date().toISOString(),
    updatedAt: t.updated_at || new Date().toISOString(),
  };
});

const rawDutyTrips = rawData.duty_trips || [];

const salemDuties: FallbackDuty[] = (rawData.duties || []).map((d: any) => {
  const bus = salemBuses.find((b) => b.id === d.bus_id);
  const driver = salemCrew.find((c) => c.id === d.driver_id);
  const conductor = salemCrew.find((c) => c.id === d.conductor_id);
  const assignedDutyTrips = rawDutyTrips
    .filter((dt: any) => dt.duty_id === d.id)
    .sort((a: any, b: any) => (a.sequence ?? 0) - (b.sequence ?? 0));

  const trips = assignedDutyTrips
    .map((dt: any) => salemTrips.find((t) => t.id === dt.trip_id))
    .filter(Boolean);

  const dutyCode = d.duty_code || d.duty_number || "D-01";

  return {
    id: d.id,
    tenantId: d.tenant_id || SALEM_TENANT_ID,
    dutyCode,
    dutyNumber: dutyCode,
    dutyType: d.duty_type || "LINKED",
    serviceDate: d.service_date || "25 Aug 2026",
    busId: d.bus_id,
    driverId: d.driver_id,
    conductorId: d.conductor_id,
    startTime: d.start_time ?? 360,
    endTime: d.end_time ?? 480,
    status: d.status || "published",
    tripsCount: assignedDutyTrips.length,
    spreadoverMinutes: (d.end_time ?? 480) - (d.start_time ?? 360),
    steeringMinutes: Math.floor(((d.end_time ?? 480) - (d.start_time ?? 360)) * 0.75),
    bus,
    driver,
    conductor,
    trips,
    dutyTrips: assignedDutyTrips.map((dt: any) => ({
      id: dt.id,
      dutyId: dt.duty_id,
      tripId: dt.trip_id,
      sequence: dt.sequence ?? 1,
      sequenceOrder: dt.sequence ?? 1,
      trip: salemTrips.find((t) => t.id === dt.trip_id),
    })),
    createdAt: d.created_at || new Date().toISOString(),
    updatedAt: d.updated_at || new Date().toISOString(),
  };
});

// 2. Chennai MTC Fallback Records (Generated from GTFS Dataset)
const mtcStops: FallbackStop[] = CHENNAI_MTC_ROUTES.flatMap((r) =>
  r.stops.map((s) => {
    const stopDetail = CHENNAI_MTC_STOPS[s.stopId];
    return {
      id: `stop-mtc-${r.code.toLowerCase()}-${s.sequence}`,
      tenantId: CHENNAI_MTC_TENANT_ID,
      routeId: r.id,
      name: stopDetail ? stopDetail.name : s.stopId,
      code: stopDetail ? stopDetail.code : s.stopId,
      sequence: s.sequence,
      sequenceOrder: s.sequence,
      latitude: String(stopDetail?.lat || 13.0827),
      longitude: String(stopDetail?.lng || 80.2707),
      isTimepoint: true,
      cumulativeDistanceKm: String(
        Math.round((r.lengthKm * (s.sequence / r.stops.length)) * 10) / 10,
      ),
      cumulativeTimeMinutes: s.timeOffsetMin,
    };
  }),
);

const mtcRoutes: FallbackRoute[] = CHENNAI_MTC_ROUTES.map((r) => ({
  id: r.id,
  tenantId: CHENNAI_MTC_TENANT_ID,
  code: r.code,
  name: r.name,
  origin: r.origin,
  destination: r.destination,
  direction: r.direction,
  lengthKm: String(r.lengthKm),
  distanceKm: String(r.lengthKm),
  durationMin: r.durationMin,
  runtimeMinutes: r.durationMin,
  geometryGeojson: {
    type: "LineString",
    coordinates: r.pathCoordinates,
  },
  polyline: {
    type: "LineString",
    coordinates: r.pathCoordinates,
  },
  status: "active",
  color: r.color,
  peakFrequency: r.peakFrequencyMin,
  offPeakFrequency: r.offPeakFrequencyMin,
  stopsCount: r.stops.length,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}));

const mtcTrips: FallbackTrip[] = CHENNAI_MTC_TRIPS.map((t) => {
  const route = mtcRoutes.find((r) => r.id === t.routeId);
  return {
    id: t.id,
    tenantId: t.tenantId,
    routeId: t.routeId,
    tripCode: t.tripCode,
    tripNumber: t.tripNumber,
    direction: t.direction,
    startTime: t.startTime,
    endTime: t.endTime,
    startMinutes: t.startMinutes,
    endMinutes: t.endMinutes,
    durationMin: t.durationMin,
    distanceKm: t.distanceKm,
    origin: t.origin,
    destination: t.destination,
    status: t.status,
    serviceDate: t.serviceDate,
    route,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
});

const mtcDuties: FallbackDuty[] = CHENNAI_MTC_TRIPS.slice(0, 35).map(
  (t, idx) => {
    const bus = CHENNAI_MTC_BUSES[idx % CHENNAI_MTC_BUSES.length]!;
    const drivers = CHENNAI_MTC_CREW.filter((c) => c.role === "driver");
    const conductors = CHENNAI_MTC_CREW.filter((c) => c.role === "conductor");
    const driver = drivers[idx % drivers.length];
    const conductor = conductors[idx % conductors.length];
    const dutyCode = `D-CHN-${101 + idx}`;

    return {
      id: `duty-mtc-${101 + idx}`,
      tenantId: CHENNAI_MTC_TENANT_ID,
      dutyCode,
      dutyNumber: dutyCode,
      dutyType: "LINKED",
      serviceDate: "25 Aug 2026",
      busId: bus.id,
      driverId: driver?.id || null,
      conductorId: conductor?.id || null,
      startTime: t.startTime,
      endTime: t.endTime + 45,
      status: "published",
      tripsCount: 1,
      spreadoverMinutes: t.durationMin + 45,
      steeringMinutes: t.durationMin,
      bus: bus as any,
      driver: driver as any,
      conductor: conductor as any,
      trips: [t as any],
      dutyTrips: [
        {
          id: `dt-mtc-${idx}`,
          dutyId: `duty-mtc-${101 + idx}`,
          tripId: t.id,
          sequence: 1,
          sequenceOrder: 1,
          trip: t as any,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },
);

// 3. Consolidated Multi-Tenant Datasets
export const FALLBACK_BUSES: FallbackBus[] = [
  ...salemBuses,
  ...CHENNAI_MTC_BUSES,
];

export const FALLBACK_CREW: FallbackCrew[] = [
  ...salemCrew,
  ...CHENNAI_MTC_CREW,
];

export const FALLBACK_STOPS: FallbackStop[] = [
  ...salemStops,
  ...mtcStops,
];

export const FALLBACK_ROUTES: FallbackRoute[] = [
  ...salemRoutes,
  ...mtcRoutes,
];

export const FALLBACK_TRIPS: FallbackTrip[] = [
  ...salemTrips,
  ...mtcTrips,
];

export const FALLBACK_DUTIES: FallbackDuty[] = [
  ...salemDuties,
  ...mtcDuties,
];
