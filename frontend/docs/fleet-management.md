# Fleet Management Module Documentation

This document describes the Fleet Management module of the TransitOS platform, detailing the database schema, security scopes, API surface, validation rules, and future integration with scheduling.

---

## 1. Data Model & Database Schema

Buses are stored in the PostgreSQL database using the `buses` table.

```typescript
export const buses = pgTable("buses", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  registrationNumber: varchar("registration_number", { length: 50 }).notNull(),
  fleetNumber: varchar("fleet_number", { length: 50 }),
  depot: varchar("depot", { length: 255 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("available"),
  busType: varchar("bus_type", { length: 100 }),
  capacity: integer("capacity"),
  availableFrom: integer("available_from").notNull().default(330), // minutes from midnight (e.g. 330 = 05:30)
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

### Constraints & Indexes
- **Tenant Scope Isolation**: Row-level isolation is logically enforced using an index on `tenant_id`.
- **Tenant Uniqueness**: Uniqueness is enforced on both `registration_number` and `fleet_number` within each individual tenant scope:
  - `unique("buses_tenant_registration_number_unique").on(table.tenantId, table.registrationNumber)`
  - `unique("buses_tenant_fleet_number_unique").on(table.tenantId, table.fleetNumber)`

---

## 2. API Surface & Server Functions

The module exports clean client-safe RPC-bridged TanStack Start server functions defined in `src/lib/fleet-crew.ts`:

- **`getBuses(filters)`**: Loads a filtered list of buses for the logged-in user's tenant.
- **`getBus(id)`**: Fetches details for a single bus including today's duties and upcoming maintenance logs (currently placeholders).
- **`createBus(data)`**: Validates and inserts a new bus record.
- **`updateBus(payload)`**: Validates and updates properties of an existing bus.
- **`updateBusStatus(payload)`**: Changes the status parameter of a bus.

---

## 3. Business & Status Validation Rules

1. **Write Operations**: Require the `fleet.manage` permission (granted to `PLATFORM_ADMIN` and `ORGANIZATION_ADMIN`).
2. **Read Operations**: Require the `fleet.view` permission (granted to admins, schedulers, depot managers, and route planners).
3. **Validation Requirements**:
   - Registration Number and Fleet Number are required.
   - Capacity must be a positive integer (`> 0`).
   - Depot and Status must be non-empty strings.
   - Registration and Fleet numbers must be unique within the active tenant organization context.
4. **Status Confirmation**:
   - Changing status to `Breakdown` or `Out of Service` triggers an explicit confirmation dialog in the UI.

---

## 4. Multi-Tenant Isolation

Every database operation resolves the active tenant's context server-side by validating the JWT session cookie:

```typescript
const currentUser = await requireAuth();
const list = await db
  .select()
  .from(buses)
  .where(
    and(
      eq(buses.tenantId, currentUser.tenantId),
      // ... filters
    )
  );
```

---

## 5. Audit Logging & Tracking

All status changes and modifications are logged in the `audit_logs` table for compliance tracking:
- **`BUS_CREATED`**: Triggered when a new bus is registered.
- **`BUS_UPDATED`**: Triggered when properties are modified.
- **`BUS_STATUS_CHANGED`**: Triggered when status is modified.

---

## 6. Future Scheduling Engine Integration

The status of the bus dictates its eligibility for the scheduling optimizer:
- Only buses marked `available` or `assigned` are considered pool candidates.
- Buses marked `maintenance`, `breakdown`, or `out-of-service` are excluded.
- If a bus is marked `breakdown` during the service day, this status change will later trigger the dynamic rescheduling workflow to select a replacement vehicle from the available pool.
