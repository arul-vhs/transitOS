# TransitOS: Automated Bus Scheduling & Route Management Platform

TransitOS is a production-grade multi-tenant transit operations platform built to coordinate, optimize, and reschedule bus transit networks. It provides constraint-based duty optimization, dynamic rescheduling, plan-vs-actual analytics, and GIS route corridor overlap audits.

---

## 1. Product Overview & Key Capabilities

- **Multi-Tenant SaaS Boundary**: Enforces tenant-isolation bounds across all PostgreSQL queries using HTTP-only JWT sessions.
- **Fleet & Crew Registries**: Real-time management of buses, drivers, conductors, and crew rest timeline compliance.
- **Route & GIS Corridor Planning**: Interactive Leaflet maps drawing coordinate geometry, alongside automatic overlap detection.
- **Timetable & Trip Management**: Generates linked and unlinked operational duty schedules.
- **Automated Schedule Optimizer**: Scheduling solver optimizing coverage, duty count, and vehicle utilization.
- **Dynamic Rescheduling & Disruption Recovery**: Logs vehicle and crew incidents, maps delay propagation chains, offers side-by-side recovery options, and transactionally publishes recoveries.
- **Operations Analytics**: Plan vs actual departure variance logs, fleet utilization metrics, and audit-logged CSV exports.

---

## 2. Technology Stack

- **Frontend**: React 19, TanStack Start, Vite, TanStack Router, TailwindCSS.
- **Database & Query**: PostgreSQL, Drizzle ORM, Drizzle Kit.
- **GIS Mapping**: Leaflet.
- **Authentication**: JWT Cookie Sessions with password hashing.

---

## 3. Database & Local Setup (Any Computer)

### Option A: Quick Setup via Docker (Recommended)

Run PostgreSQL in a background container with one command:

```bash
docker compose up -d
```

This starts a PostgreSQL 16 container on port `5432` with credentials matching `.env.example`:
- Database: `postgres`
- Username: `postgres`
- Password: `1234`
- Port: `5432`

---

### Option B: Local Native PostgreSQL / pgAdmin

If you already have PostgreSQL installed on your machine:
1. Ensure the PostgreSQL service is running on port `5432`.
2. Create a database named `postgres` or `transitos`.
3. Set your connection string in `.env`:
   ```env
   DATABASE_URL="postgresql://postgres:your_password@localhost:5432/postgres"
   ```

---

### Option C: Remote Cloud Database (Neon / Supabase / Aiven)

Set your cloud connection string in `.env`:
```env
DATABASE_URL="postgresql://user:password@ep-xyz.neon.tech/transitos?sslmode=require"
```

---

## 4. Application Installation & Running

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```
   Verify that `DATABASE_URL` points to your PostgreSQL instance.

3. **Run database migrations and seed demo data in one step**:
   ```bash
   npm run db:setup
   ```
   Or run the steps individually:
   ```bash
   # Apply migrations
   npm run db:migrate

   # Seed demo accounts, routes, fleet, and schedules
   npm run db:seed
   ```

4. **Launch the development server**:
   ```bash
   npm run dev
   ```

5. **Visual Database Management (Drizzle Studio)**:
   ```bash
   npm run db:studio
   ```

---

## 5. Seeded Demo Accounts (Password: `password123`)

- **Org Admin**: `admin@salemtransport.demo`
- **Scheduler**: `scheduler@salemtransport.demo`
- **Route Planner**: `planner@salemtransport.demo`
- **Depot Manager**: `manager@salemtransport.demo`
- **Management**: `management@salemtransport.demo`

---

## 6. System Metrics & Performance Formulas

- **On-Time Rate**: Percentage of completed trips departing within a +/- 5-minute tolerance window.
- **Fleet Utilization**: Sum of operated duty minutes divided by available fleet capacity minutes.
- **Recovery Success**: Percentage of affected trips successfully re-optimized and resolved after disruptions.
