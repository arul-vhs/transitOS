# TransitOS Database Documentation

This document describes the PostgreSQL database architecture, setup, migration scripts, and seed data for the TransitOS multi-tenant SaaS platform.

## Database Technology Stack
- **Database**: PostgreSQL (v18)
- **Object-Relational Mapping (ORM)**: Drizzle ORM
- **Migration Engine**: Drizzle Kit
- **Script Executor**: tsx (TypeScript Execute)

---

## 1. Setup Instructions

### Prerequisites
- Node.js (v18+)
- PostgreSQL installed and running locally on port `5432`

### Environment Configuration
Create a `.env` file in the `frontend/` directory (you can copy `.env.example` as a starting point) and define the `DATABASE_URL` environment variable:

```bash
DATABASE_URL="postgres://<username>:<password>@localhost:5432/transitos"
```

*Example for local development:*
```bash
DATABASE_URL="postgres://postgres:1234@localhost:5432/transitos"
```

---

## 2. Drizzle Commands (NPM Scripts)

The following scripts are defined in `package.json` to manage the database:

### Generate Migrations
Generate SQL migration files in `src/server/db/migrations` by comparing your TypeScript schema definitions in `schema.ts` with current migration history:
```bash
npm run db:generate
```

### Apply Migrations
Apply the generated SQL migrations to your active PostgreSQL database:
```bash
npm run db:migrate
```

### Seed Database
Run the seed script to wipe existing data and populate fresh initial records (tenants, buses, crew, routes, stops, and trips):
```bash
npm run db:seed
```

---

## 3. Database Architecture & Schema Design

TransitOS is designed as a multi-tenant platform. Each tenant-owned entity includes a `tenant_id` field for logical partition isolation.

```
                  +------------------+
                  |     tenants      |
                  +------------------+
                           |
       +-------------------+-------------------+
       |                   |                   |
+------+------+     +------+------+     +------+------+
|    users    |     |    buses    |     |    crew     |
+-------------+     +-------------+     +-------------+
                           |                   |
                           +---------+---------+
                                     |
                               +-----+-----+
                               |  duties   | <----+
                               +-----------+      |
                                     |            |
                               +-----+-----+      |
                               | schedules |      |
                               +-----------+      |
                                     |            |
                               +-----+-----+      |
                               | incidents |      |
                               +-----------+      |
                                     |            |
                        +------------+------------+
                        | reschedule_actions      |
                        +-------------------------+
```

### Entity Tables

1. **`tenants`**: Represents independent transport corporations (e.g. Salem Transport Corporation).
2. **`users`**: Platform administrators and dispatcher accounts associated with a tenant.
3. **`buses`**: Vehicle inventory owned by a tenant. Includes unique constraint on `(tenant_id, registration_number)`.
4. **`crew`**: Crew members (drivers and conductors) employed by a tenant. Includes unique constraint on `(tenant_id, employee_id)`.
5. **`routes`**: Bus corridors defined by code and name. Includes unique constraint on `(tenant_id, code)`.
6. **`stops`**: Stop coordinates mapping route paths. Scoped to `route_id`.
7. **`trips`**: Specific time schedule blocks for bus routes. Scoped to `route_id`.
8. **`schedules`**: Master scheduling runs for specific days and depots. Scoped to `tenant_id`.
9. **`duties`**: Duty allocations mapping a single trip to assigned buses, drivers, conductors, and routes.
10. **`incidents`**: Logs for breakdown events or crew unavailability issues.
11. **`reschedule_actions`**: Auditable logs of minimum-disruption rescheduling revisions.

---

## 4. Multi-Tenant Query Scoping

All write and read queries targeting tenant-owned data should be constrained using the `withTenant` helper exported from `src/server/db/index.ts`. This enforces tenant isolation at the query level:

```typescript
import { db, withTenant } from "@/server/db";
import { buses } from "@/server/db/schema";

// Query all buses belonging exclusively to tenantId
const tenantBuses = await db
  .select()
  .from(buses)
  .where(withTenant(buses, tenantId));
```

This prevents database leaks between different tenant corporations on shared compute/storage infrastructure.
