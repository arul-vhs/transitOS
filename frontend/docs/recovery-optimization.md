# Recovery Optimization Engine

TransitOS utilizes local re-optimization to resolve schedule deviations instead of rebuilding the entire day's plan.

## Frozen Schedule Mechanism

Trips starting outside the recovery window are **FROZEN** (Region $U$). The solver cannot alter their assignments (bus/driver/conductor). Trips inside the window ($A$) are re-optimized:
$$S' = U + \text{Optimize}(A)$$

The recovery window bounds:
- **`MIN_RECOVERY_WINDOW`**: 60 minutes.
- **`MAX_RECOVERY_WINDOW`**: 240 minutes (4 hours).

## Recovery Objective Weights

The engine uses a dedicated objective function to minimize disruption:
- **`UNASSIGNED_TRIP_PENALTY`** = 1000: High penalty on cancelled runs.
- **`NEW_BUS_WEIGHT`** = 150: Penalty on dispatching extra/spare buses.
- **`CREW_CHANGE_WEIGHT`** = 100: Penalty on altering driver/conductor assignments.
- **`HANDOVER_WEIGHT`** = 50: Penalty on introducing handovers.
- **`DISRUPTION_WEIGHT`** = 40: Penalty on altering any pre-existing resource binding.

## Recovery Proposal Options

1. **Option A (Balanced Recovery)**: Normal recovery weights, balancing cancellations, handovers, and bus counts.
2. **Option B (Minimize Cancellations)**: Aggressively uses spare buses to cover all runs (low new bus weight, high cancellation weight).
3. **Option C (Minimize Resource Changes)**: Avoids crew shifts, prioritizing pre-incident schedule preservation (high bus and crew change weights).
