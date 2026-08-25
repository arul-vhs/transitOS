# Operational Analytics Engine

TransitOS provides a server-side operational intelligence dashboard querying PostgreSQL aggregates directly.

## Performance Scoping

All analytics queries derive the active tenant context directly from the verified session context on the server side:
- **Tenant Scoping**: All queries append `WHERE tenant_id = verifiedSessionTenantId`.
- **No Client Input Overrides**: The client is never allowed to supply `tenantId` in request payloads.
- **SQL Aggregations**: Uses Drizzle `sql` operators alongside standard grouping (`GROUP BY`, `COUNT`, `SUM`, `AVG`) to aggregate metrics at the database level rather than buffering tables into browser memory.

## Export System

- **Permission Bounds**: Execution requires `analytics.view` permissions.
- **Audit Records**: When `exportAnalyticsCsv(type)` runs, the system registers an `ANALYTICS_EXPORT` entry inside the `audit_logs` table containing the exported rows count.
