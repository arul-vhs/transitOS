# Route Management Module Documentation

This document describes the Route Management module of the TransitOS platform, detailing the database schema, query interfaces, stop CRUD/reordering mechanics, and integration with mapping.

---

## 1. Database Schemas

### Route Table Schema
Routes are stored in the PostgreSQL database using the `routes` table:

```typescript
export const routes = pgTable("routes", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  code: varchar("code", { length: 50 }).notNull(), // e.g. Route 101
  name: varchar("name", { length: 255 }).notNull(), // e.g. Salem Central -> Hasthampatti
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
});
```

### Stops Table Schema
Stops belong to routes and are ordered by sequence:

```typescript
export const stops = pgTable("stops", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  routeId: uuid("route_id").notNull().references(() => routes.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  sequence: integer("sequence").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 6 }),
  longitude: decimal("longitude", { precision: 10, scale: 6 }),
});
```

---

## 2. API Surface & Server Functions

The module exports clean client-safe RPC-bridged TanStack Start server functions:

- **`getRoutes(filters)`**: Loads a filtered list of routes (search by code, name, origin, destination; filter by status and direction). Scoped to tenant.
- **`getRoute(id)`**: Fetches route details and associated stops ordered by sequence.
- **`createRoute(data)`**: Creates a new route with uniqueness validation on route code.
- **`updateRoute(payload)`**: Updates route metadata.
- **`updateRouteStatus(payload)`**: Switches route status (Active, Draft, Proposed, Suspended).
- **`deleteRoute(id)`**: Archives a route.

---

## 3. Stop CRUD & Reordering Mechanics

### Sequencing Safeguards
- **Create Stop (`createStop`)**: Validates name, positive sequence, lat/lng ranges. If a stop already exists at the target sequence number, sequences of all subsequent stops are incremented by 1 before inserting.
- **Delete Stop (`deleteStop`)**: Deletes the stop record and sequentially re-numbers remaining stops (`1, 2, 3...`) to ensure a continuous gapless sequence.
- **Reorder Stops (`reorderStops`)**: Updates stop sequences based on an ordered array of IDs.
- **Draggable Coordinates**: If the user has `routes.manage` permissions, they can drag stop markers on the map, which triggers coordinate updates directly in PostgreSQL.

---

## 4. Multi-Tenant Isolation

Tenant scoping is resolved entirely server-side using the user's authenticated JWT session cookie. URL or request-payload-supplied tenant IDs are ignored to prevent privilege escalation:

```typescript
const currentUser = await requireAuth();
const list = await db
  .select()
  .from(routes)
  .where(
    and(
      eq(routes.tenantId, currentUser.tenantId),
      // ... filters
    )
  );
```

---

## 5. Audit Logging

State modifications trigger audit log entries:
- `ROUTE_CREATED` / `ROUTE_UPDATED`
- `ROUTE_STATUS_CHANGED` / `ROUTE_ARCHIVED`
- `STOP_CREATED` / `STOP_UPDATED` / `STOP_DELETED`
- `STOP_REORDERED`
