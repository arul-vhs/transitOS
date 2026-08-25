# Crew Management Module Documentation

This document describes the Crew Management module of the TransitOS platform, detailing the database schema, security scopes, API surface, status validation rules, and future integration with scheduling.

---

## 1. Data Model & Database Schema

Crew members (drivers and conductors) are stored in the PostgreSQL database using the `crew` table.

```typescript
export const crew = pgTable("crew", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  employeeId: varchar("employee_id", { length: 50 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull(), // "driver" or "conductor"
  status: varchar("status", { length: 50 }).notNull().default("available"),
  depot: varchar("depot", { length: 255 }).notNull(),
  availableFrom: integer("available_from").notNull().default(330), // minutes from midnight (e.g. 330 = 05:30)
  restUntil: integer("rest_until").notNull().default(330), // minutes from midnight
  licenseCategory: varchar("license_category", { length: 50 }), // driver only
  licenseExpiry: timestamp("license_expiry"), // driver only
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

### Constraints & Indexes
- **Tenant Scope Isolation**: Row-level isolation is logically enforced using an index on `tenant_id`.
- **Tenant Uniqueness**: Uniqueness is enforced on `employee_id` within each individual tenant scope:
  - `unique("crew_tenant_employee_id_unique").on(table.tenantId, table.employeeId)`

---

## 2. API Surface & Server Functions

The module exports clean client-safe RPC-bridged TanStack Start server functions defined in `src/lib/fleet-crew.ts`:

- **`getDrivers(filters)`**: Loads a filtered list of crew members with `role = "driver"`.
- **`getConductors(filters)`**: Loads a filtered list of crew members with `role = "conductor"`.
- **`getCrewMember(id)`**: Fetches details for a single crew member.
- **`createCrewMember(data)`**: Validates and inserts a new crew member (driver or conductor) record.
- **`updateCrewMember(payload)`**: Validates and updates properties of a crew member.
- **`updateCrewStatus(payload)`**: Changes the status parameter of a crew member.
- **`getCrewAvailability()`**: Fetches all crew members for the availability timeline view.

---

## 3. Business & Status Validation Rules

1. **Write Operations**: Require the `crew.manage` permission (granted to `PLATFORM_ADMIN` and `ORGANIZATION_ADMIN`).
2. **Read Operations**: Require the `crew.view` permission (granted to admins, schedulers, depot managers, and route planners).
3. **Availability & Status Rules**:
   - **`available`**: Fully eligible for duties.
   - **`on-duty`**: Active on a scheduled run, not freely available.
   - **`resting`**: Ineligible for duty assignments until the time exceeds `rest_until`.
   - **`leave` / `unavailable`**: Excluded from availability pools.
4. **Validation Requirements**:
   - Employee ID and Name are required.
   - Depot is required.
   - License Expiry (for drivers) must be a valid date.
   - Employee ID must be unique within the tenant organization context.

---

## 4. Availability Timeline

The `/crew/availability` screen translates the current database status and time markers (`availableFrom`, `restUntil`) into a visual hourly grid:
- Grid represents hours from `06:00` to `22:00`.
- Cells are color-coded based on active constraints:
  - Green: Available
  - Blue: On Duty (Busy)
  - Orange: Resting (labeled REST)
  - Red: Leave (labeled LV)
  - Gray: Unavailable / Off Duty

---

## 5. Audit Logging & Compliance

All crew management modifications are tracked:
- **`DRIVER_CREATED` / `CONDUCTOR_CREATED`**
- **`DRIVER_UPDATED` / `CONDUCTOR_UPDATED`**
- **`DRIVER_STATUS_CHANGED` / `CONDUCTOR_STATUS_CHANGED`**

---

## 6. Future Scheduling Engine Integration

The scheduler resolves candidate crew pairs (one driver, one conductor) dynamically:
- Candidate selection checks that `licenseExpiry` is in the future.
- Check-ins verify that `restUntil` constraints are met.
- Supports both **Linked Duties** (crew and vehicle stay together for the block) and **Unlinked Duties** (crew handovers occur during service intervals).
