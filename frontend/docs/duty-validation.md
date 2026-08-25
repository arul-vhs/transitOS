# Duty Validation Engine

TransitOS features a centralized, explainable validation engine that analyzes duties in real-time. It ensures shifts adhere to safety regulations, labor laws, and depot scheduling rules before they are marked as `published`.

## Validated Constraints

The validation engine checks the following operational constraints:

### 1. Vehicle Overlap conflicts
- Assures a single Bus is not scheduled for more than one duty at any overlapping time:
  - Overlap formula: `(DutyA.startTime < DutyB.endTime) && (DutyA.endTime > DutyB.startTime)`
- Checks if the bus status in the registry is set to "maintenance", "breakdown", or "out-of-service".

### 2. Crew Availability & Overlaps
- Assures a Driver or Conductor is not assigned to multiple duties or handover segments simultaneously.
- Flags crew members with status "leave" or "unavailable".
- Enforces rest requirements: `duty.startTime >= crew.restUntil` (drivers must complete rest cycles).

### 3. Consecutive Trip Transitions
- Trips in a duty must be strictly sequential. Trip A must end before Trip B starts:
  - Overlap check: `TripA.endTime <= TripB.startTime`.
- **Turnaround Buffer**: If Trip A and Trip B occur on different routes, the engine enforces a turnaround padding of at least **10 minutes** (`MIN_TURNAROUND_MINUTES`) for route transitions.

### 4. Continuous Duty Hours
- Enforces maximum continuous work hours limit: the span `duty.endTime - duty.startTime` must not exceed **8 hours** (`MAX_DUTY_HOURS` = 480 minutes).

## Explainable Rejection Panel

In the Duty Builder user interface, the validation findings are rendered in a dedicated real-time panel:
- Passes are styled with a clean checkmark badge.
- Rejections are styled with alerts, highlighting detailed human-readable explanations specifying turnaround buffers violated, duplicate resource assignments, or rest limits broken.
