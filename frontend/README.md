# TransitOS — Automated Bus Scheduling & Route Management SaaS

TransitOS is a production-style multi-tenant SaaS platform built to coordinate, optimize, and reschedule transit networks. This prototype demonstrates constraint-based duty optimization, dynamic rescheduling, plan-vs-actual analytics, and GIS route corridor overlap audits.

---

## 1. Product Overview & Key Features

- **Multi-Tenant SaaS Boundary**: Enforces tenant-isolation bounds across all PostgreSQL queries using HTTP-only JWT sessions.
- **Fleet & Crew Registries**: Real-time management of buses, drivers, conductors, and crew rest timeline compliance.
- **Route & GIS Corridor Planning**: Interactive Leaflet maps drawing coordinate geometry, alongside automatic overlap detection.
- **Timetable & Trip Management**: Generates linked and unlinked operational duty schedules.
- **Automated Schedule Optimizer**: OR-Tools-ready scheduling solver optimizing coverage, duty count, and vehicle utilization.
- **Dynamic Rescheduling & Disruption Recovery**: Logs vehicle/crew incidents, maps delay propagation chains, offers Side-by-Side Options A/B/C, and transactionally publishes recoveries.
- **Operations Analytics**: Plan vs Actual departure variance logs, fleet utilization metrics, and audit-logged CSV exports.

---

## 2. Technology Stack

- **Frontend**: React 19 + TanStack Start + Vite + TanStack Router + TailwindCSS.
- **Database & Query**: PostgreSQL + Drizzle ORM + Drizzle Kit.
- **GIS Mapping**: Leaflet Maps.
- **Authentication**: JWT Cookie Sessions + Password Hashing.

---

## 3. Local Setup & Startup

### Prerequisites
- Node.js (v18+)
- PostgreSQL Database instance

### Installation
1. Navigate to the frontend directory:
   ```bash
   cd transitOS/frontend
   npm install
   ```

2. Configure environment variables:
   Copy `.env.example` to `.env` and set your local PostgreSQL database credentials:
   ```bash
   cp .env.example .env
   ```

3. Database Operations:
   Run Drizzle migration commands to create the database schemas and seed the Salem Transport Corporation demo datasets:
   ```bash
   # Generate Drizzle migration files
   npm run db:generate

   # Apply migrations to PostgreSQL
   npm run db:migrate

   # Seed demo accounts and operational resources
   npm run db:seed
   ```

4. Run the Dev Server:
   ```bash
   npm run dev
   ```

---

## 4. Seeded Demo Accounts (Password: `password123`)

- **Org Admin**: `admin@salemtransport.demo`
- **Scheduler**: `scheduler@salemtransport.demo`
- **Route Planner**: `planner@salemtransport.demo`
- **Depot Manager**: `manager@salemtransport.demo`
- **Management**: `management@salemtransport.demo`

---

## 5. System Metrics & Performance Formulas

- **On-Time Rate**: percentage of completed trips departing within a ±5-minute tolerance window.
- **Fleet Utilization**: sum of operated duty minutes divided by available fleet capacity minutes.
- **Recovery Success**: percentage of affected trips successfully re-optimized and resolved after disruptions.
