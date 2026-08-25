# Operational Events Log

TransitOS isolates user-facing administrative changes (handled by the general `audit_logs` table) from operational service state changes, which are written to `operational_events`.

## Table Structure

- **`id`**: Unique primary identifier.
- **`tenantId`**: Associated tenant context.
- **`tripId`**: Affected trip (nullable).
- **`eventType`**: Dispatched operational actions (see below).
- **`eventTime`**: Timestamp of the occurrence.
- **`recordedBy`**: ID of the dispatch officer or automated worker.
- **`metadata`**: JSON fields documenting parameters.

## Event Types

- **`TRIP_DISPATCHED`**: Dispatched from depot.
- **`TRIP_STARTED`**: Trip starts actual operation.
- **`TRIP_COMPLETED`**: Trip completes.
- **`TRIP_DELAYED`**: Departure or arrival delay.
- **`TRIP_CANCELLED`**: Cancelled trip.
- **`BUS_ASSIGNED`**: Vehicle bound to duty.
- **`BUS_CHANGED`**: Spare vehicle swap.
- **`DRIVER_CHANGED` / `CONDUCTOR_CHANGED`**: Crew members swapped.
- **`INCIDENT_CREATED`**: Disruption incident reported.
- **`RECOVERY_APPLIED`**: Re-optimized recovery proposals committed.
