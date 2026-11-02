# Core Scheduling Optimization Engine

The TransitOS Scheduling Optimization Engine is a pure TypeScript constraint-satisfaction scheduling system designed to dynamically match vehicle runs (trips) with available fleet (buses) and crew resources (drivers and conductors).

## System Workflow

1. **Parameters & Inputs Setup**: Users configure the service date (e.g. `25 Aug 2026`) and the scheduling mode (Linked, Unlinked, or Hybrid).
2. **Authorized Data Load**: The server loads authoritative tenant data directly from PostgreSQL. It fetches trips, active buses, drivers, conductors, and route lengths/durations.
3. **Candidate Set Generation**: Compiles eligible candidates for each trip based on status, license expirations, category matches, and mandatory rest periods. This significantly restricts search space size.
4. **Constraint Solver Execution**: Sequential search exploration assigning compatible buses and crew to chronological trips, grouping them into duties.
5. **Quality Metric Scoring**: Computes objective scores based on coverage, vehicle counts, crew handovers, idle gaps, and cross-depot penalty weights.
6. **Proposal Review**: The output is returned as a proposed schedule (marked as RUNNING / COMPLETED in database). Planners review Gantt visual charts, unassigned reasons, and baseline comparisons.
7. **Transactional Publishing**: Users click "Publish". The backend checks resource snapshots for concurrent modifications, validates the schedule, and inserts duties and segments inside a database transaction.
