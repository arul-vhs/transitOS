# Trip Management Module

The Trip Management module implements the database schema, business logic, and user interface for defining, scheduling, and generating individual trips on the route network.

## Concept & Data Model

A **Trip** represents a single journey of a vehicle along a specific route in a single direction starting at a specific time.

Trips are stored in the `trips` database table:
- **`id`**: Unique UUID primary key.
- **`tenantId`**: Tenant isolation key.
- **`routeId`**: Foreign key to the Route.
- **`tripCode`**: Unique generated code format `{routeCode}-{startTime_padded}` (e.g., `101-0630`). If a collision occurs on the same date, a sequential suffix is added (e.g., `101-0630-02`).
- **`direction`**: Direction parameter (`OUTBOUND` or `INBOUND`).
- **`startTime`**: Start time represented as minutes from midnight (e.g., 360 for 06:00).
- **`endTime`**: End time computed automatically as `startTime + route.durationMin`.
- **`durationMin` / `distanceKm`**: Cached route duration and length parameters.
- **`origin` / `destination`**: Starting and ending stop labels.
- **`serviceDate`**: String date identifier (e.g. `25 Aug 2026`).

## Timetable Generation Engine

Rather than manual scheduling alone, the system supports a **Frequency-Based Timetable Generator**:
- Planners configure:
  - Route Corridor
  - Service Date
  - Start Time Limit
  - End Time Limit
  - Headway/Frequency Interval (in minutes)
  - Direction
- The generator loops from `startTime` to `endTime` stepping by `frequency`, instantiating and persisting new trips sequentially.
