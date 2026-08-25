# TransitOS E2E Demo Script

This script walks through a 5–10 minute demonstration sequence of the completed TransitOS B2B SaaS platform.

## Demo Sequence

### 1. Authentication & Tenant Scope
1. Navigate to the login screen.
2. Log in using the Salem Transport Corporation Depot Manager credential:
   - **Email**: `manager@salemtransport.demo`
   - **Password**: `password123`
3. Notice the interface loads the custom Salem Transport Corporation dashboard context (tenant boundary enforced).

### 2. Operational Resources
1. Click **Buses** under the **Fleet** menu to show the PostgreSQL-backed fleet registry.
2. Click **Drivers** and **Conductors** under the **Crew** menu to see crew availability states.
3. Click **Availability Timeline** to view driver/conductor rest buffers.

### 3. Route & Timetable Planning
1. Click **Route Network** to view the interactive Leaflet GIS map drawing coordinates from the database.
2. Click **Route Planner** to test route overlap calculations.
3. Click **Trip Management** to generate timetables and view daily trips for `25 Aug 2026`.

### 4. Duty Building & Validation
1. Click **Duty Builder** under **Operations**.
2. Click **Create Duty** to build a linked duty manually.
3. Click **Create Unlinked Duty** to specify crew segments and handovers.
4. Click **Validate Schedule** to run the constraint validator checking for overlaps and rest violations.

### 5. Automated Optimization Engine
1. Click **Schedule Optimizer**.
2. Set service date to `25 Aug 2026` and duty type to **Linked** or **Unlinked**.
3. Click **Generate Schedule**.
4. Review the timeline Gantt chart.
5. Click **Publish Schedule** to persist the optimized plan to the live duties board.

### 6. Today's Operations & Disruption Management
1. Click **Today's Operations**. Notice the live ticker monitoring active runs.
2. Click **Disruption Manager** (or navigate to `/operations/incidents`).
3. Click **Report Disruption**. Report a `BUS_BREAKDOWN` for bus `TN-30-AB-1003` at 09:20.
4. Notice the system maps the direct breakdown and propagates delay minutes downstream.
5. Click **Solve Disruption** to generate recovery options A/B/C.
6. Compare the proposals side by side: Option A (Balanced), Option B (Coverage Focus), Option C (Low Disruption).
7. Select the recommended proposal and click **Approve Plan** to save the recovery plan.

### 7. Plan vs Actual Analytics & CSV Export
1. Click **Analytics** to view executive KPI cards (On-Time %, Completion %, Recovery Success %).
2. Click **View Plan vs Actual** to see the variance timestamps table.
3. Click **Export CSV** to download the report.
4. Check **Audit Log** in settings to confirm the `ANALYTICS_EXPORT` event was recorded.
