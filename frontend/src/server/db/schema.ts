import { pgTable, uuid, varchar, timestamp, integer, decimal, boolean, jsonb, text, index, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// 1. Tenants Table
export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// 2. Users Table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  email: varchar("email", { length: 255 }).notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull().default("SCHEDULER"), // PLATFORM_ADMIN, ORGANIZATION_ADMIN, SCHEDULER, DEPOT_MANAGER, ROUTE_PLANNER, MANAGEMENT
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("users_tenant_id_idx").on(table.tenantId),
  unique("users_tenant_email_unique").on(table.tenantId, table.email)
]);

// 3. Buses Table
export const buses = pgTable("buses", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  registrationNumber: varchar("registration_number", { length: 50 }).notNull(),
  fleetNumber: varchar("fleet_number", { length: 50 }),
  depot: varchar("depot", { length: 255 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("available"),
  busType: varchar("bus_type", { length: 100 }),
  capacity: integer("capacity"),
  availableFrom: integer("available_from").notNull().default(330),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("buses_tenant_id_idx").on(table.tenantId),
  unique("buses_tenant_registration_number_unique").on(table.tenantId, table.registrationNumber),
  unique("buses_tenant_fleet_number_unique").on(table.tenantId, table.fleetNumber)
]);

// 4. Crew Table (Drivers and Conductors)
export const crew = pgTable("crew", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  employeeId: varchar("employee_id", { length: 50 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull(), // driver, conductor
  status: varchar("status", { length: 50 }).notNull().default("available"),
  depot: varchar("depot", { length: 255 }).notNull(),
  availableFrom: integer("available_from").notNull().default(330),
  restUntil: integer("rest_until").notNull().default(330),
  licenseCategory: varchar("license_category", { length: 50 }),
  licenseExpiry: timestamp("license_expiry"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("crew_tenant_id_idx").on(table.tenantId),
  unique("crew_tenant_employee_id_unique").on(table.tenantId, table.employeeId)
]);

// 5. Routes Table
export const routes = pgTable("routes", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  code: varchar("code", { length: 50 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  origin: varchar("origin", { length: 255 }),
  destination: varchar("destination", { length: 255 }),
  lengthKm: decimal("length_km", { precision: 10, scale: 2 }).notNull(),
  durationMin: integer("duration_min").notNull(),
  geometryGeojson: jsonb("geometry_geojson"),
  status: varchar("status", { length: 50 }).notNull().default("active"),
  direction: varchar("direction", { length: 50 }),
  color: varchar("color", { length: 50 }),
  peakFrequency: integer("peak_frequency"),
  offPeakFrequency: integer("off_peak_frequency"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("routes_tenant_id_idx").on(table.tenantId),
  index("routes_status_idx").on(table.status),
  unique("routes_tenant_code_unique").on(table.tenantId, table.code)
]);

// 6. Stops Table
export const stops = pgTable("stops", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  routeId: uuid("route_id").notNull().references(() => routes.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  sequence: integer("sequence").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 6 }),
  longitude: decimal("longitude", { precision: 10, scale: 6 }),
}, (table) => [
  index("stops_tenant_id_idx").on(table.tenantId),
  index("stops_route_id_idx").on(table.routeId)
]);

// 7. Trips Table
export const trips = pgTable("trips", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  routeId: uuid("route_id").notNull().references(() => routes.id, { onDelete: "cascade" }),
  tripCode: varchar("trip_code", { length: 50 }).notNull(),
  direction: varchar("direction", { length: 50 }).notNull().default("OUTBOUND"),
  startTime: integer("start_time").notNull(),
  endTime: integer("end_time").notNull(),
  durationMin: integer("duration_min").notNull().default(0),
  distanceKm: decimal("distance_km", { precision: 10, scale: 2 }).notNull().default("0.00"),
  origin: varchar("origin", { length: 255 }).notNull().default(""),
  destination: varchar("destination", { length: 255 }).notNull().default(""),
  status: varchar("status", { length: 50 }).notNull().default("scheduled"),
  serviceDate: varchar("service_date", { length: 100 }).notNull(), // e.g. "14 Aug 2026"
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  
  // Plan vs Actual Operational Columns
  plannedStart: integer("planned_start").notNull().default(0),
  actualStart: integer("actual_start"),
  plannedEnd: integer("planned_end").notNull().default(0),
  actualEnd: integer("actual_end"),
  departureVariance: integer("departure_variance"),
  arrivalVariance: integer("arrival_variance"),
  plannedDuration: integer("planned_duration").notNull().default(0),
  actualDuration: integer("actual_duration"),
  durationVariance: integer("duration_variance"),
  cancellationReason: text("cancellation_reason"),
}, (table) => [
  index("trips_tenant_id_idx").on(table.tenantId),
  index("trips_route_id_idx").on(table.routeId),
  index("trips_service_date_idx").on(table.serviceDate),
  unique("trips_tenant_trip_code_unique").on(table.tenantId, table.tripCode)
]);

// 8. Schedules Table
export const schedules = pgTable("schedules", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  date: varchar("date", { length: 100 }).notNull(), // matches "14 Aug 2026"
  depot: varchar("depot", { length: 255 }).notNull(),
  dutyType: varchar("duty_type", { length: 50 }).notNull(), // linked, unlinked
  status: varchar("status", { length: 50 }).notNull().default("draft"), // draft, generated, published, archived
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("schedules_tenant_id_idx").on(table.tenantId)
]);

// 9. Duties Table
export const duties = pgTable("duties", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  dutyCode: varchar("duty_code", { length: 50 }).notNull(),
  dutyType: varchar("duty_type", { length: 50 }).notNull().default("LINKED"), // LINKED, UNLINKED
  serviceDate: varchar("service_date", { length: 100 }).notNull(),
  startTime: integer("start_time").notNull().default(0),
  endTime: integer("end_time").notNull().default(0),
  status: varchar("status", { length: 50 }).notNull().default("draft"), // draft, generated, assigned, published, cancelled
  busId: uuid("bus_id").references(() => buses.id, { onDelete: "set null" }),
  driverId: uuid("driver_id").references(() => crew.id, { onDelete: "set null" }),
  conductorId: uuid("conductor_id").references(() => crew.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("duties_tenant_id_idx").on(table.tenantId),
  index("duties_bus_id_idx").on(table.busId),
  index("duties_driver_id_idx").on(table.driverId),
  index("duties_conductor_id_idx").on(table.conductorId),
  unique("duties_tenant_duty_code_unique").on(table.tenantId, table.dutyCode)
]);

// 9.1 Duty Trips Table
export const dutyTrips = pgTable("duty_trips", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  dutyId: uuid("duty_id").notNull().references(() => duties.id, { onDelete: "cascade" }),
  tripId: uuid("trip_id").notNull().references(() => trips.id, { onDelete: "cascade" }),
  sequence: integer("sequence").notNull(),
  handoverRequired: boolean("handover_required").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("duty_trips_tenant_id_idx").on(table.tenantId),
  index("duty_trips_duty_id_idx").on(table.dutyId),
  index("duty_trips_trip_id_idx").on(table.tripId)
]);

// 9.2 Duty Crew Segments Table
export const dutyCrewSegments = pgTable("duty_crew_segments", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  dutyId: uuid("duty_id").notNull().references(() => duties.id, { onDelete: "cascade" }),
  driverId: uuid("driver_id").references(() => crew.id, { onDelete: "set null" }),
  conductorId: uuid("conductor_id").references(() => crew.id, { onDelete: "set null" }),
  startTime: integer("start_time").notNull(),
  endTime: integer("end_time").notNull(),
  sequence: integer("sequence").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("duty_crew_segments_tenant_id_idx").on(table.tenantId),
  index("duty_crew_segments_duty_id_idx").on(table.dutyId)
]);

// 10. Incidents Table
export const incidents = pgTable("incidents", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  scheduleId: uuid("schedule_id").references(() => schedules.id, { onDelete: "cascade" }), // nullable context link
  type: varchar("type", { length: 50 }).notNull(), // BUS_BREAKDOWN, DRIVER_ABSENT, CONDUCTOR_ABSENT, TRIP_DELAY, TRIP_CANCELLED, ROUTE_BLOCKED, MANUAL_DISRUPTION
  status: varchar("status", { length: 50 }).notNull().default("OPEN"), // OPEN, ANALYZING, RECOVERY_PROPOSED, APPROVED, APPLIED, RESOLVED, CANCELLED
  severity: varchar("severity", { length: 50 }).notNull().default("medium"), // low, medium, high, critical
  serviceDate: varchar("service_date", { length: 100 }).notNull(),
  resourceType: varchar("resource_type", { length: 50 }), // bus, crew
  resourceId: uuid("resource_id"), // busId or driverId/conductorId
  tripId: uuid("trip_id").references(() => trips.id, { onDelete: "set null" }),
  routeId: uuid("route_id").references(() => routes.id, { onDelete: "set null" }),
  reportedAt: timestamp("reported_at").notNull().defaultNow(),
  reportedBy: uuid("reported_by").references(() => users.id, { onDelete: "set null" }),
  startTime: integer("start_time").notNull().default(0),
  expectedEndTime: integer("expected_end_time"),
  actualEndTime: integer("actual_end_time"),
  location: varchar("location", { length: 255 }),
  description: text("description"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("incidents_tenant_id_idx").on(table.tenantId),
  index("incidents_service_date_idx").on(table.serviceDate)
]);

// 11. Reschedule Actions Table
export const rescheduleActions = pgTable("reschedule_actions", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  scheduleId: uuid("schedule_id").notNull().references(() => schedules.id, { onDelete: "cascade" }),
  incidentId: uuid("incident_id").notNull().references(() => incidents.id, { onDelete: "cascade" }),
  dutyId: uuid("duty_id").notNull().references(() => duties.id, { onDelete: "cascade" }),
  actionType: varchar("action_type", { length: 50 }).notNull(),
  beforeData: jsonb("before_data"),
  afterData: jsonb("after_data"),
  reason: text("reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("reschedule_actions_tenant_id_idx").on(table.tenantId),
  index("reschedule_actions_schedule_id_idx").on(table.scheduleId),
  index("reschedule_actions_incident_id_idx").on(table.incidentId),
  index("reschedule_actions_duty_id_idx").on(table.dutyId)
]);

// Define Relations for Drizzle Queries

export const tenantsRelations = relations(tenants, ({ many }) => ({
  users: many(users),
  buses: many(buses),
  crew: many(crew),
  routes: many(routes),
  stops: many(stops),
  trips: many(trips),
  schedules: many(schedules),
  duties: many(duties),
  incidents: many(incidents),
  rescheduleActions: many(rescheduleActions),
  auditLogs: many(auditLogs),
  optimizationRuns: many(optimizationRuns),
  reschedulingRuns: many(reschedulingRuns),
  operationalEvents: many(operationalEvents),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [users.tenantId],
    references: [tenants.id],
  }),
  optimizationRuns: many(optimizationRuns),
  incidents: many(incidents),
  reschedulingRuns: many(reschedulingRuns),
  operationalEvents: many(operationalEvents),
}));

export const busesRelations = relations(buses, ({ one }) => ({
  tenant: one(tenants, {
    fields: [buses.tenantId],
    references: [tenants.id],
  }),
}));

export const crewRelations = relations(crew, ({ one }) => ({
  tenant: one(tenants, {
    fields: [crew.tenantId],
    references: [tenants.id],
  }),
}));

export const routesRelations = relations(routes, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [routes.tenantId],
    references: [tenants.id],
  }),
  stops: many(stops),
  trips: many(trips),
}));

export const stopsRelations = relations(stops, ({ one }) => ({
  tenant: one(tenants, {
    fields: [stops.tenantId],
    references: [tenants.id],
  }),
  route: one(routes, {
    fields: [stops.routeId],
    references: [routes.id],
  }),
}));

export const tripsRelations = relations(trips, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [trips.tenantId],
    references: [tenants.id],
  }),
  route: one(routes, {
    fields: [trips.routeId],
    references: [routes.id],
  }),
  dutyTrips: many(dutyTrips),
}));

export const schedulesRelations = relations(schedules, ({ one }) => ({
  tenant: one(tenants, {
    fields: [schedules.tenantId],
    references: [tenants.id],
  }),
}));

export const dutiesRelations = relations(duties, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [duties.tenantId],
    references: [tenants.id],
  }),
  bus: one(buses, {
    fields: [duties.busId],
    references: [buses.id],
  }),
  driver: one(crew, {
    fields: [duties.driverId],
    references: [crew.id],
  }),
  conductor: one(crew, {
    fields: [duties.conductorId],
    references: [crew.id],
  }),
  dutyTrips: many(dutyTrips),
  dutyCrewSegments: many(dutyCrewSegments),
}));

export const dutyTripsRelations = relations(dutyTrips, ({ one }) => ({
  tenant: one(tenants, {
    fields: [dutyTrips.tenantId],
    references: [tenants.id],
  }),
  duty: one(duties, {
    fields: [dutyTrips.dutyId],
    references: [duties.id],
  }),
  trip: one(trips, {
    fields: [dutyTrips.tripId],
    references: [trips.id],
  }),
}));

export const dutyCrewSegmentsRelations = relations(dutyCrewSegments, ({ one }) => ({
  tenant: one(tenants, {
    fields: [dutyCrewSegments.tenantId],
    references: [tenants.id],
  }),
  duty: one(duties, {
    fields: [dutyCrewSegments.dutyId],
    references: [duties.id],
  }),
  driver: one(crew, {
    fields: [dutyCrewSegments.driverId],
    references: [crew.id],
  }),
  conductor: one(crew, {
    fields: [dutyCrewSegments.conductorId],
    references: [crew.id],
  }),
}));

export const incidentsRelations = relations(incidents, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [incidents.tenantId],
    references: [tenants.id],
  }),
  reporter: one(users, {
    fields: [incidents.reportedBy],
    references: [users.id],
  }),
  trip: one(trips, {
    fields: [incidents.tripId],
    references: [trips.id],
  }),
  route: one(routes, {
    fields: [incidents.routeId],
    references: [routes.id],
  }),
  impacts: many(incidentImpacts),
  reschedulingRuns: many(reschedulingRuns),
}));

export const rescheduleActionsRelations = relations(rescheduleActions, ({ one }) => ({
  tenant: one(tenants, {
    fields: [rescheduleActions.tenantId],
    references: [tenants.id],
  }),
  schedule: one(schedules, {
    fields: [rescheduleActions.scheduleId],
    references: [schedules.id],
  }),
  incident: one(incidents, {
    fields: [rescheduleActions.incidentId],
    references: [incidents.id],
  }),
  duty: one(duties, {
    fields: [rescheduleActions.dutyId],
    references: [duties.id],
  }),
}));

// 12. Audit Logs Table
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  email: varchar("email", { length: 255 }),
  action: varchar("action", { length: 50 }).notNull(),
  details: text("details"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
}, (table) => [
  index("audit_logs_tenant_id_idx").on(table.tenantId),
  index("audit_logs_user_id_idx").on(table.userId)
]);

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  tenant: one(tenants, {
    fields: [auditLogs.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

// 13. Optimization Runs Table
export const optimizationRuns = pgTable("optimization_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  serviceDate: varchar("service_date", { length: 100 }).notNull(),
  mode: varchar("mode", { length: 50 }).notNull().default("HYBRID"), // LINKED, UNLINKED, HYBRID
  status: varchar("status", { length: 50 }).notNull().default("QUEUED"), // QUEUED, RUNNING, COMPLETED, FAILED, EXPIRED, PUBLISHED
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  inputSnapshot: jsonb("input_snapshot"),
  resultSummary: jsonb("result_summary"),
  objectiveScore: decimal("objective_score", { precision: 15, scale: 2 }).default("0.00"),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("optimization_runs_tenant_id_idx").on(table.tenantId),
  index("optimization_runs_service_date_idx").on(table.serviceDate)
]);

export const optimizationRunsRelations = relations(optimizationRuns, ({ one }) => ({
  tenant: one(tenants, {
    fields: [optimizationRuns.tenantId],
    references: [tenants.id],
  }),
  creator: one(users, {
    fields: [optimizationRuns.createdBy],
    references: [users.id],
  }),
}));

// temporary placeholder for migration drop run
// 15. Incident Impacts Table
export const incidentImpacts = pgTable("incident_impacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  incidentId: uuid("incident_id").notNull().references(() => incidents.id, { onDelete: "cascade" }),
  tripId: uuid("trip_id").references(() => trips.id, { onDelete: "cascade" }),
  dutyId: uuid("duty_id").references(() => duties.id, { onDelete: "cascade" }),
  busId: uuid("bus_id").references(() => buses.id, { onDelete: "cascade" }),
  driverId: uuid("driver_id").references(() => crew.id, { onDelete: "cascade" }),
  conductorId: uuid("conductor_id").references(() => crew.id, { onDelete: "cascade" }),
  impactType: varchar("impact_type", { length: 50 }).notNull(), // BUS_LOST, CREW_LOST, DELAYED, CANCELLED, TURNAROUND_VIOLATION, CREW_REST_CONFLICT, UNASSIGNED
  impactLevel: varchar("impact_level", { length: 50 }).notNull(), // DIRECT, DOWNSTREAM, SECONDARY
  reason: text("reason"),
}, (table) => [
  index("incident_impacts_incident_id_idx").on(table.incidentId)
]);

// 16. Rescheduling Runs Table
export const reschedulingRuns = pgTable("rescheduling_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  incidentId: uuid("incident_id").notNull().references(() => incidents.id, { onDelete: "cascade" }),
  serviceDate: varchar("service_date", { length: 100 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("QUEUED"), // QUEUED, RUNNING, COMPLETED, FAILED, EXPIRED, APPROVED, APPLIED
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  objectiveScore: decimal("objective_score", { precision: 15, scale: 2 }).default("0.00"),
  tripsAffected: integer("trips_affected").notNull().default(0),
  tripsRecovered: integer("trips_recovered").notNull().default(0),
  tripsUnassigned: integer("trips_unassigned").notNull().default(0),
  resourceSnapshot: jsonb("resource_snapshot"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("rescheduling_runs_tenant_id_idx").on(table.tenantId),
  index("rescheduling_runs_incident_id_idx").on(table.incidentId)
]);

// 17. Recovery Proposals Table
export const recoveryProposals = pgTable("recovery_proposals", {
  id: uuid("id").primaryKey().defaultRandom(),
  runId: uuid("run_id").notNull().references(() => reschedulingRuns.id, { onDelete: "cascade" }),
  proposalNumber: integer("proposal_number").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("PROPOSED"), // PROPOSED, SELECTED, REJECTED, EXPIRED, APPLIED
  objectiveScore: decimal("objective_score", { precision: 15, scale: 2 }).default("0.00"),
  tripsRecovered: integer("trips_recovered").notNull().default(0),
  tripsUnassigned: integer("trips_unassigned").notNull().default(0),
  busesUsed: integer("buses_used").notNull().default(0),
  crewChanges: integer("crew_changes").notNull().default(0),
  handovers: integer("handovers").notNull().default(0),
  delayMinutes: integer("delay_minutes").notNull().default(0),
  cancellations: integer("cancellations").notNull().default(0),
  explanation: text("explanation"),
  proposalData: jsonb("proposal_data"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("recovery_proposals_run_id_idx").on(table.runId)
]);

export const incidentImpactsRelations = relations(incidentImpacts, ({ one }) => ({
  incident: one(incidents, {
    fields: [incidentImpacts.incidentId],
    references: [incidents.id],
  }),
  trip: one(trips, {
    fields: [incidentImpacts.tripId],
    references: [trips.id],
  }),
  duty: one(duties, {
    fields: [incidentImpacts.dutyId],
    references: [duties.id],
  }),
  bus: one(buses, {
    fields: [incidentImpacts.busId],
    references: [buses.id],
  }),
  driver: one(crew, {
    fields: [incidentImpacts.driverId],
    references: [crew.id],
  }),
  conductor: one(crew, {
    fields: [incidentImpacts.conductorId],
    references: [crew.id],
  }),
}));

export const reschedulingRunsRelations = relations(reschedulingRuns, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [reschedulingRuns.tenantId],
    references: [tenants.id],
  }),
  incident: one(incidents, {
    fields: [reschedulingRuns.incidentId],
    references: [incidents.id],
  }),
  creator: one(users, {
    fields: [reschedulingRuns.createdBy],
    references: [users.id],
  }),
  proposals: many(recoveryProposals),
}));

export const recoveryProposalsRelations = relations(recoveryProposals, ({ one }) => ({
  run: one(reschedulingRuns, {
    fields: [recoveryProposals.runId],
    references: [reschedulingRuns.id],
  }),
}));

// 18. Operational Events Table
export const operationalEvents = pgTable("operational_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  tripId: uuid("trip_id").references(() => trips.id, { onDelete: "cascade" }),
  eventType: varchar("event_type", { length: 100 }).notNull(), // TRIP_DISPATCHED, TRIP_STARTED, TRIP_COMPLETED, TRIP_DELAYED, TRIP_CANCELLED, BUS_ASSIGNED, BUS_CHANGED, DRIVER_CHANGED, CONDUCTOR_CHANGED, INCIDENT_CREATED, RECOVERY_APPLIED
  eventTime: timestamp("event_time").notNull().defaultNow(),
  recordedBy: uuid("recorded_by").references(() => users.id, { onDelete: "set null" }),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("operational_events_tenant_id_idx").on(table.tenantId),
  index("operational_events_trip_id_idx").on(table.tripId),
  index("operational_events_event_time_idx").on(table.eventTime)
]);

export const operationalEventsRelations = relations(operationalEvents, ({ one }) => ({
  tenant: one(tenants, {
    fields: [operationalEvents.tenantId],
    references: [tenants.id],
  }),
  trip: one(trips, {
    fields: [operationalEvents.tripId],
    references: [trips.id],
  }),
  user: one(users, {
    fields: [operationalEvents.recordedBy],
    references: [users.id],
  }),
}));
