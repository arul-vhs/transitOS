# Dynamic Rescheduling & Disruption Management

TransitOS Dynamic Rescheduling and Disruption Management implements local re-optimization to recover from live service deviations without rebuilding the entire day's schedule.

## System Objective

When a disruption (breakdown, delay, block, absence) is reported, TransitOS preserves the unaffected portions of the schedule, identifies direct and downstream impacts, defines a recovery window, re-optimizes within that window, and allows the dispatcher to review side-by-side recovery options before committing the approved changes transactionally.

## Process Lifecycle

1. **Incident Logging**: Dispatcher reports a disruption on `/operations/incidents` or via system automation.
2. **Impact Calculation**: Propagates direct and downstream timeline overlaps and turnaround conflicts.
3. **Recovery Run**: Solves local recovery using modified objectives.
4. **Tradeoff Analysis**: Generates three side-by-side alternative recovery options (A, B, C).
5. **Approval**: Dispatcher clicks "Approve". Stale protect checks run, validating duties and modifying PostgreSQL transactionally.
6. **Live Dashboard Update**: `/operations/today` reflects the recovered statuses.
