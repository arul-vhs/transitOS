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
  badgeNumber?: string;
  name: string;
  phone?: string;
  role: string;
  status: string;
  depot: string;
  availableFrom: number;
  restUntil: number;
  licenseNumber?: string;
  licenseCategory?: string | null;
  licenseExpiry?: string | null;
  shiftType?: string;
  weeklyHours?: number;
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
  distanceKm: string;
  runtimeMinutes: number;
  polyline: any;
  status: string;
  stopsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface FallbackStop {
  id: string;
  tenantId: string;
  routeId: string;
  name: string;
  code: string;
  sequenceOrder: number;
  latitude: string;
  longitude: string;
  isTimepoint: boolean;
  cumulativeDistanceKm: string;
  cumulativeTimeMinutes: number;
  createdAt: string;
  updatedAt: string;
}

export interface FallbackTrip {
  id: string;
  tenantId: string;
  routeId: string;
  tripNumber: string;
  tripCode: string;
  direction: string;
  startMinutes: number;
  endMinutes: number;
  startTime: number;
  endTime: number;
  durationMin: number;
  distanceKm: string;
  origin: string;
  destination: string;
  status: string;
  serviceDate: string;
  isSpecialService: boolean;
  route?: FallbackRoute;
  createdAt: string;
  updatedAt: string;
}

export interface FallbackDuty {
  id: string;
  tenantId: string;
  dutyNumber: string;
  depot: string;
  dutyType: string;
  busId: string | null;
  driverId: string | null;
  conductorId: string | null;
  startTime: number;
  endTime: number;
  spreadoverMinutes: number;
  steeringMinutes: number;
  status: string;
  isRestCompliant: boolean;
  tripsCount?: number;
  bus?: FallbackBus;
  driver?: FallbackCrew;
  conductor?: FallbackCrew;
  trips?: any[];
  dutyTrips?: any[];
  createdAt: string;
  updatedAt: string;
}

// Convert snake_case rows into standard camelCase objects
export const FALLBACK_BUSES: FallbackBus[] = (rawData.buses || []).map((b: any) => ({
  id: b.id,
  tenantId: b.tenant_id,
  registrationNumber: b.registration_number,
  fleetNumber: b.fleet_number,
  depot: b.depot,
  status: b.status,
  busType: b.bus_type,
  capacity: b.capacity,
  availableFrom: b.available_from,
  createdAt: b.created_at,
  updatedAt: b.updated_at,
}));

export const FALLBACK_CREW: FallbackCrew[] = (rawData.crew || []).map((c: any) => ({
  id: c.id,
  tenantId: c.tenant_id,
  employeeId: c.employee_id,
  badgeNumber: c.badge_number || c.employee_id,
  name: c.name,
  phone: c.phone || "+91 94431 00000",
  role: c.role,
  status: c.status || "available",
  depot: c.depot,
  availableFrom: c.available_from ?? 330,
  restUntil: c.rest_until ?? 330,
  licenseNumber: c.license_number,
  licenseCategory: c.license_category || (c.role === "driver" ? "Heavy Passenger Vehicle (HPV) / PSV Badge" : null),
  licenseExpiry: c.license_expiry || null,
  shiftType: c.shift_type || "Morning",
  weeklyHours: c.weekly_hours ?? 44,
  createdAt: c.created_at,
  updatedAt: c.updated_at,
}));

export const FALLBACK_STOPS: FallbackStop[] = (rawData.stops || []).map((s: any) => ({
  id: s.id,
  tenantId: s.tenant_id,
  routeId: s.route_id,
  name: s.name,
  code: s.code,
  sequenceOrder: s.sequence_order,
  latitude: s.latitude,
  longitude: s.longitude,
  isTimepoint: s.is_timepoint,
  cumulativeDistanceKm: s.cumulative_distance_km,
  cumulativeTimeMinutes: s.cumulative_time_minutes,
  createdAt: s.created_at,
  updatedAt: s.updated_at,
}));

export const FALLBACK_ROUTES: FallbackRoute[] = (rawData.routes || []).map((r: any) => {
  const stopsForRoute = FALLBACK_STOPS.filter((s) => s.routeId === r.id);
  return {
    id: r.id,
    tenantId: r.tenant_id,
    code: r.code,
    name: r.name,
    origin: r.origin,
    destination: r.destination,
    direction: r.direction,
    distanceKm: r.distance_km,
    runtimeMinutes: r.runtime_minutes,
    polyline: r.polyline,
    status: r.status,
    stopsCount: stopsForRoute.length,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
});

export const FALLBACK_TRIPS: FallbackTrip[] = (rawData.trips || []).map((t: any) => {
  const route = FALLBACK_ROUTES.find((r) => r.id === t.route_id);
  const startTime = t.start_time ?? t.start_minutes ?? 360;
  const endTime = t.end_time ?? t.end_minutes ?? (startTime + 30);
  const tripCode = t.trip_code || t.trip_number || `TR-${t.id?.slice(0, 6)}`;

  return {
    id: t.id,
    tenantId: t.tenant_id,
    routeId: t.route_id,
    tripNumber: tripCode,
    tripCode,
    direction: t.direction || "OUTBOUND",
    startMinutes: startTime,
    endMinutes: endTime,
    startTime,
    endTime,
    durationMin: t.duration_min ?? (endTime - startTime),
    distanceKm: t.distance_km || route?.distanceKm || "10.00",
    origin: t.origin || route?.origin || "Salem Central",
    destination: t.destination || route?.destination || "Destination Terminus",
    status: t.status || "scheduled",
    serviceDate: t.service_date || "25 Aug 2026",
    isSpecialService: !!t.is_special_service,
    route,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
  };
});

const rawDutyTrips = rawData.duty_trips || [];

export const FALLBACK_DUTIES: FallbackDuty[] = (rawData.duties || []).map((d: any) => {
  const bus = FALLBACK_BUSES.find((b) => b.id === d.bus_id);
  const driver = FALLBACK_CREW.find((c) => c.id === d.driver_id);
  const conductor = FALLBACK_CREW.find((c) => c.id === d.conductor_id);
  const assignedDutyTrips = rawDutyTrips
    .filter((dt: any) => dt.duty_id === d.id)
    .sort((a: any, b: any) => a.sequence_order - b.sequence_order);

  const trips = assignedDutyTrips
    .map((dt: any) => FALLBACK_TRIPS.find((t) => t.id === dt.trip_id))
    .filter(Boolean);

  return {
    id: d.id,
    tenantId: d.tenant_id,
    dutyNumber: d.duty_number,
    depot: d.depot,
    dutyType: d.duty_type,
    busId: d.bus_id,
    driverId: d.driver_id,
    conductorId: d.conductor_id,
    startTime: d.start_time,
    endTime: d.end_time,
    spreadoverMinutes: d.spreadover_minutes,
    steeringMinutes: d.steering_minutes,
    status: d.status,
    isRestCompliant: d.is_rest_compliant,
    tripsCount: assignedDutyTrips.length,
    bus,
    driver,
    conductor,
    trips,
    dutyTrips: assignedDutyTrips.map((dt: any) => ({
      id: dt.id,
      dutyId: dt.duty_id,
      tripId: dt.trip_id,
      sequenceOrder: dt.sequence_order,
      trip: FALLBACK_TRIPS.find((t) => t.id === dt.trip_id),
    })),
    createdAt: d.created_at,
    updatedAt: d.updated_at,
  };
});
