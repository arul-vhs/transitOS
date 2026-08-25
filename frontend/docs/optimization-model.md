# Scheduling Optimization Model

The TransitOS Optimization Model defines the decision variables, hard constraints, and scheduling modes utilized by the constraint solver.

## Decision Variables

The optimizer makes discrete decisions for each scheduled trip `t`:
- **`trip -> bus`**: The assigned bus `b`.
- **`trip -> driver`**: The assigned driver `d`.
- **`trip -> conductor`**: The assigned conductor `c`.
- **`trip -> duty`**: The duty block `duty` to group `t`.
- **`duty type`**: Configured as `LINKED` or `UNLINKED`.
- **`handoverRequired`**: Set to true if a crew change occurs after `t` in unlinked mode.

## Hard Constraints

The solver enforces that these rules are never violated:
1. **Trip Coverage**: Feasible trips are assigned. Unfeasible ones are left unassigned (no fake/invalid assignments).
2. **Bus Overlap**: A single vehicle cannot be assigned to overlapping trips.
3. **Crew Overlap**: Drivers and conductors cannot operate overlapping assignments.
4. **Resource Status**: Inactive buses (maintenance, breakdown) and crew (leave, unavailable) are ineligible.
5. **Mandatory Rest**: Crew members cannot start work before their `restUntil` time limit ends.
6. **Turnaround Buffer**: 10 minutes minimum buffer required between consecutive trips of different routes.
7. **Maximum Duty duration**: Continuous duty blocks cannot exceed 8 hours.
8. **Chronological Continuity**: Trips inside a duty must be strictly chronological.

## Scheduling Modes

- **LINKED**: The bus, driver, and conductor remain together for the entire duty.
- **UNLINKED**: Allows crew handovers between trips while the bus remains active.
- **HYBRID**: The solver dynamically chooses linked or unlinked duty structures to maximize coverage.
