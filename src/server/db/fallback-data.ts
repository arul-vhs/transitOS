import rawData from "./extracted-data.json";

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
  sequence: number;
  sequenceOrder: number;
  latitude: string;
  longitude: string;
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
  bus?: FallbackBus;
  driver?: FallbackCrew;
  conductor?: FallbackCrew;
  trips?: any[];
  dutyTrips?: any[];
  createdAt: string;
  updatedAt: string;
}

// Convert raw JSON rows into standardized typed objects
export const FALLBACK_BUSES: FallbackBus[] = (rawData.buses || []).map(
  (b: any) => ({
    id: b.id,
    tenantId: b.tenant_id,
    registrationNumber: b.registration_number,
    fleetNumber: b.fleet_number || b.registration_number,
    depot: b.depot || "Meyyanur Depot",
    status: b.status || "available",
    busType: b.bus_type || "Ashok Leyland 210 HP BS-VI Viking",
    capacity: b.capacity ?? 48,
    availableFrom: b.available_from ?? 330,
    createdAt: b.created_at || new Date().toISOString(),
    updatedAt: b.updated_at || new Date().toISOString(),
  }),
);

export const FALLBACK_CREW: FallbackCrew[] = (rawData.crew || []).map(
  (c: any) => ({
    id: c.id,
    tenantId: c.tenant_id,
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
  }),
);

export const FALLBACK_STOPS: FallbackStop[] = (rawData.stops || []).map(
  (s: any) => {
    const seq = s.sequence ?? s.sequence_order ?? 1;
    return {
      id: s.id,
      tenantId: s.tenant_id,
      routeId: s.route_id,
      name: s.name,
      sequence: seq,
      sequenceOrder: seq,
      latitude: String(s.latitude || "11.652800"),
      longitude: String(s.longitude || "78.159100"),
    };
  },
);

export const FALLBACK_ROUTES: FallbackRoute[] = (rawData.routes || []).map(
  (r: any) => {
    const stopsForRoute = FALLBACK_STOPS.filter((s) => s.routeId === r.id);
    const length = String(r.length_km || r.distance_km || "10.00");
    const duration = r.duration_min ?? r.runtime_minutes ?? 30;
    const geojson = r.geometry_geojson || r.polyline || null;

    return {
      id: r.id,
      tenantId: r.tenant_id,
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
  },
);

export const FALLBACK_TRIPS: FallbackTrip[] = (rawData.trips || []).map(
  (t: any) => {
    const route = FALLBACK_ROUTES.find((r) => r.id === t.route_id);
    const startTime = t.start_time ?? t.start_minutes ?? 360;
    const endTime = t.end_time ?? t.end_minutes ?? startTime + 30;
    const tripCode = t.trip_code || t.trip_number || `TR-${t.id?.slice(0, 6)}`;

    return {
      id: t.id,
      tenantId: t.tenant_id,
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
  },
);

const rawDutyTrips = rawData.duty_trips || [];

export const FALLBACK_DUTIES: FallbackDuty[] = (rawData.duties || []).map(
  (d: any) => {
    const bus = FALLBACK_BUSES.find((b) => b.id === d.bus_id);
    const driver = FALLBACK_CREW.find((c) => c.id === d.driver_id);
    const conductor = FALLBACK_CREW.find((c) => c.id === d.conductor_id);
    const assignedDutyTrips = rawDutyTrips
      .filter((dt: any) => dt.duty_id === d.id)
      .sort((a: any, b: any) => (a.sequence ?? 0) - (b.sequence ?? 0));

    const trips = assignedDutyTrips
      .map((dt: any) => FALLBACK_TRIPS.find((t) => t.id === dt.trip_id))
      .filter(Boolean);

    const dutyCode = d.duty_code || d.duty_number || "D-01";

    return {
      id: d.id,
      tenantId: d.tenant_id,
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
        trip: FALLBACK_TRIPS.find((t) => t.id === dt.trip_id),
      })),
      createdAt: d.created_at || new Date().toISOString(),
      updatedAt: d.updated_at || new Date().toISOString(),
    };
  },
);
