# Development Authentication Credentials

The database contains seeded development users representing various roles in the organization (Salem Transport Corporation).

## Seeded Users

All development users have the same password:

**Password**: `password123`

| Name | Email | Role | Access Permissions |
| :--- | :--- | :--- | :--- |
| **Arun Kumar** | `admin@salemtransport.demo` | `ORGANIZATION_ADMIN` | Full access to tenant organization data, users, and resources |
| **Suresh Scheduler** | `scheduler@salemtransport.demo` | `SCHEDULER` | Access to fleet, crew, routes, schedules, and dynamic rescheduling |
| **Preethi Planner** | `planner@salemtransport.demo` | `ROUTE_PLANNER` | Access to routes, stops, and GIS analytics; read-only fleet/crew |
| **Mani Manager** | `manager@salemtransport.demo` | `DEPOT_MANAGER` | Access to operational queues, today's routes, and incident reporting |
| **Meera Executive** | `management@salemtransport.demo` | `MANAGEMENT` | Read-only executive dashboard and operational reports |
| **Platform Admin User** | `platform@salemtransport.demo` | `PLATFORM_ADMIN` | Global super admin capabilities across all tenants (unrestricted) |

---

## Testing Scenarios

1. **Role Restriction**: Log in as `management@salemtransport.demo` and attempt to trigger a bus breakdown or generate a schedule. The operations should be greyed out in the UI and rejected on the server with a `403 Forbidden` error.
2. **Path Planner Restriction**: Log in as `planner@salemtransport.demo`. You should see the Routes menu, but options to access schedules should be disabled/hidden.
