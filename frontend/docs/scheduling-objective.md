# Scheduling Objective Function

TransitOS does not just maximize coverage blindly; it utilizes a weighted objective function to evaluate and select the most efficient operational schedule.

## Objective Formulation

The objective score calculates a penalty index (lower is better):

```
Minimize:
  UNASSIGNED_TRIP_PENALTY * unassigned_trips
  + BUS_USAGE_WEIGHT * buses_used
  + DUTY_COUNT_WEIGHT * duties_created
  + HANDOVER_WEIGHT * handovers_count
  + IDLE_TIME_WEIGHT * total_idle_minutes
  + FRAGMENTATION_WEIGHT * fragmented_duties
  + CROSS_DEPOT_PENALTY * cross_depot_assignments
```

## Central Weights Config

Weights are centralized and customizable in `src/lib/transit/config.ts`:
- **`UNASSIGNED_TRIP_PENALTY`** = 1000: Enforces highest priority on trip coverage.
- **`BUS_USAGE_WEIGHT`** = 100: Prefers using fewer buses.
- **`DUTY_COUNT_WEIGHT`** = 50: Prefers fewer driver shifts.
- **`HANDOVER_WEIGHT`** = 80: Penalizes excessive crew handovers.
- **`IDLE_TIME_WEIGHT`** = 1: Penalizes deadhead gaps between trips.
- **`FRAGMENTATION_WEIGHT`** = 10: Penalizes single-trip fragmented duties.
- **`CROSS_DEPOT_PENALTY`** = 200: Penalizes assigning crew/buses from different home depots.
