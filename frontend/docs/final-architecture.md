
# TransitOS Complete Final System Architecture

This document maps the complete system architecture of the TransitOS multi-tenant SaaS platform.

## 1. Technical Stack

- **Frontend Core**: React 19 + TanStack Router + Vite + TailwindCSS.
- **Client State**: TanStack Query (React Query) + Lucide Icons.
- **Data Visualizations**: Leaflet GIS Maps + CSS timelines.
- **Backend Edge Functions**: TanStack Start (Server Functions / RPC).
- **Database Layer**: PostgreSQL + Drizzle ORM + Drizzle Migrations.
- **Authentication**: JWT HTTP-only cookies + Password hashing.

---

## 2. Dynamic Architectural Blueprint

```mermaid
graph TD
  Client[React SPA Router] <--> RPC[TanStack Start Server Functions]
  RPC <--> DB[(PostgreSQL + Drizzle ORM)]
  
  subgraph Server Layers
    RPC --> Auth[Auth Session Guard]
    RPC --> OptEngine[Schedule Optimizer Engine]
    RPC --> RecoveryEngine[Dynamic Rescheduling Engine]
    RPC --> Analytics[PG Analytics Aggregations]
  end
```

---

## 3. Database Schema Overview

```mermaid
erDiagram
  tenants ||--o{ users : owns
  tenants ||--o{ buses : owns
  tenants ||--o{ crew : owns
  tenants ||--o{ routes : owns
  tenants ||--o{ trips : owns
  tenants ||--o{ duties : owns
  tenants ||--o{ incidents : owns
  tenants ||--o{ audit_logs : owns
  tenants ||--o{ operational_events : owns
  
  duties ||--o{ duty_trips : assigns
  trips ||--o{ duty_trips : maps
  incidents ||--o{ incident_impacts : has
  incidents ||--o{ rescheduling_runs : generates
  rescheduling_runs ||--o{ recovery_proposals : offers
```

---

## 4. Multi-Tenancy & Security Isolation

Every database query routes through the server context helper `withTenant(dbQuery)` to enforce scope bounds:
- **Tenant Isolation**: Injects `eq(table.tenantId, session.tenantId)` to all queries.
- **RBAC Matrix**: Enforced both on route levels (`beforeLoad` router guards) and server functions mutations.
- **Audit Logs**: Logs administrative operations (e.g. `OPTIMIZATION_PUBLISHED`, `ANALYTICS_EXPORT`) into the `audit_logs` table.
