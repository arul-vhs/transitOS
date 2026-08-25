# Plan vs Actual Analytics

TransitOS tracks scheduled service plans against actual live operation records.

## Extended Trip Parameters

The `trips` table stores the following values:
- **`plannedStart`**: Scheduled trip departure (minutes from midnight).
- **`actualStart`**: Actual recorded departure (minutes from midnight).
- **`plannedEnd`**: Scheduled trip arrival (minutes from midnight).
- **`actualEnd`**: Actual recorded arrival (minutes from midnight).
- **`departureVariance`**: `actualStart - plannedStart` (minutes).
- **`arrivalVariance`**: `actualEnd - plannedEnd` (minutes).
- **`plannedDuration`**: Scheduled run duration.
- **`actualDuration`**: `actualEnd - actualStart` (minutes).
- **`status`**: Current trip status (`ON_TIME`, `EARLY`, `DELAYED`, `CANCELLED`, `SKIPPED`).
- **`cancellationReason`**: String documenting the cancellation cause.

## On-Time Tolerance

The default variance tolerance is configured to **5 minutes**.
- If $\text{departureVariance} \le 5$, the status is marked **ON_TIME**.
- If $\text{departureVariance} > 5$, the status is marked **DELAYED**.
