# Duty Construction Engine

The Duty Construction Engine is responsible for organizing sequenced trips into logical driver and conductor shifts (Duties) while ensuring asset allocation matches.

## Core Concepts

Schedules in TransitOS are structured hierarchically:
`Route` → `Trip` → `Duty`

A **Duty** represents a work block (shift) assigned to a bus and crew for a specific service date. Duties are categorized into two configurations:
1. **LINKED (Linked Crew)**: The bus, driver, and conductor remain together for the entire duration of the duty block.
2. **UNLINKED (Unlinked Handovers)**: The bus is scheduled for the entire duration, but crew handovers occur throughout the day. Crew transitions are represented as sequenced rows in the `duty_crew_segments` table.

## Data Schema

### 1. `duties` Table
- **`id`**: Unique UUID primary key.
- **`dutyCode`**: Unique code within a tenant (e.g. `L-101`, `U-201`).
- **`dutyType`**: Either `LINKED` or `UNLINKED`.
- **`startTime` / `endTime`**: Adjusted dynamically as the minimum of the first trip's start time and maximum of the last trip's end time.
- **`busId` / `driverId` / `conductorId`**: References assigned resources.

### 2. `duty_trips` Table
Defines many-to-many linkages between duties and trips:
- **`dutyId`**: Reference to the Duty.
- **`tripId`**: Reference to the Trip.
- **`sequence`**: Order index starting from 1.
- **`handoverRequired`**: Boolean flag indicating if a crew change occurs after this trip.

### 3. `duty_crew_segments` Table
Tracks crew assignments for unlinked handover duties:
- **`dutyId`**: Reference to the Duty.
- **`driverId` / `conductorId`**: Assigned crew for this segment.
- **`startTime` / `endTime`**: Segment timeframe boundaries.
- **`sequence`**: Sequence ordering starting from 1.
