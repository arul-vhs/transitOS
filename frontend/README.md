# Transit Flow

Build a Small Working Demo Module: Intelligent Bus Scheduling & Dynamic Rescheduling

You are working on a prototype for a SaaS product called:

TransitOS — Automated Bus Scheduling & Route Management System

The goal is to build a polished, functional demo module for a college project first review.

IMPORTANT

Do NOT build the entire SaaS yet.

Build only a small but highly convincing working module that demonstrates the core innovation:

Constraint-based automatic bus/crew scheduling + dynamic minimum-disruption rescheduling.

First inspect the existing project structure, framework, dependencies, and UI conventions. Reuse the existing architecture and components wherever possible. Do not unnecessarily replace the current stack.

1. Demo Scenario

Create a fictional transport corporation:

Salem Transport Corporation

Depot:

Salem Central Depot

Use realistic-looking synthetic data.

The demo should work completely with seeded/mock data. Do NOT require external APIs, authentication, real GPS, or real transport data.

2. Main Demo Screen

Create a page:

Scheduling → Schedule Optimizer

The screen should contain:

Header

Schedule Optimizer

Subtitle:

Generate, validate and dynamically reschedule bus and crew duties.

Top controls:

Date: 14 Aug 2026

Depot: Salem Central Depot

Duty Type:

Linked Duty

Unlinked Duty

Button: Generate Schedule

3. KPI Cards

Show four cards:

Available Buses

12

Available Crew

24

Trips

36

Conflicts

0

After generating the schedule, update the cards dynamically.

Example:

Available Buses     12
Crew                24
Trips               36
Conflicts            0


4. Automatic Schedule Generation

When the user clicks:

Generate Schedule

show a short loading state:

Loading trips...
Checking bus availability...
Checking crew availability...
Applying scheduling constraints...
Optimizing duties...
Generating schedule...


Then show:

✓ Schedule generated successfully

Use a deterministic mock optimization algorithm if a real OR-Tools backend is not already available.

Structure the code so that OR-Tools can be integrated later.

The generated schedule should assign:

Bus

Driver

Conductor

Route

Trip

Start time

End time

Duty type

5. Schedule Table

Display a professional scheduling table.

Columns:

Duty Bus Driver Conductor Route Start End Status

Example data:

D001 | TN-30-AB-1001 | Kumar | Ravi | Route 101 | 06:00 | 10:00 | Valid
D002 | TN-30-AB-1002 | Arjun | Mani | Route 102 | 06:15 | 10:30 | Valid
D003 | TN-30-AB-1003 | Suresh | Bala | Route 103 | 06:30 | 11:00 | Valid
D004 | TN-30-AB-1004 | Prakash | Vignesh | Route 104 | 07:00 | 11:30 | Valid


Use at least 10–15 duties so the interface looks realistic.

6. Linked Duty Visualization

Add a section:

Linked Duty Timeline

Show a horizontal timeline for one selected bus.

Example:

BUS TN-30-AB-1001

06:00              10:00              14:00
│-------------------│-------------------│
│      CREW A       │                   │
│   Route 101       │                   │
└───────────────────┘


Clearly communicate that in a linked duty:

The same crew remains assigned to the bus throughout the duty.

7. Dynamic Rescheduling Demo

This is the MOST IMPORTANT part of the demo.

Add a card/button:

Simulate Operational Incident

Buttons:

🚌 Bus Breakdown

👨‍✈️ Crew Unavailable

Clicking Bus Breakdown should simulate:

🚨 Bus TN-30-AB-1003 has broken down at 09:20.

Then automatically identify affected future trips.

Example:

Affected Duties
D007
D008
D009


Show an impact panel:

INCIDENT DETECTED

Bus: TN-30-AB-1003
Time: 09:20
Location: Salem Junction

Affected Trips: 3
Affected Crew: 1


8. Minimum-Disruption Rescheduling

After the incident, display:

Analyze Impact

Then:

Checking available buses...
Checking crew availability...
Checking rest constraints...
Checking turnaround time...
Finding minimum-disruption solution...


Then produce a replacement schedule.

IMPORTANT:

Do NOT regenerate the entire schedule.

Keep unaffected duties unchanged.

Only modify the affected duties.

Show something like:

94% of original schedule retained

3 duties affected
2 bus assignments changed
1 crew assignment changed
0 rest violations
0 unserved trips


Display:

✓ Dynamic rescheduling completed successfully.

9. Before / After Comparison

Create a visual comparison:

Before Incident

D007 → Bus 1003 → Route 103
D008 → Bus 1003 → Route 103
D009 → Bus 1003 → Route 105


After Rescheduling

D007 → Bus 1007 → Route 103
D008 → Bus 1008 → Route 103
D009 → Bus 1007 → Route 105


Highlight changed assignments.

Do NOT change unaffected duties.

10. Explainability Panel

Add:

Why was this bus selected?

When the user clicks a rescheduled assignment, show:

Bus TN-30-AB-1007 selected because:

✓ Available at required time
✓ Located at compatible depot
✓ Route compatible
✓ Minimum deadhead distance
✓ No crew conflict
✓ No turnaround violation
✓ Causes minimum schedule disruption


This is important because the project should demonstrate that the system is not simply randomly assigning buses.

11. Constraint Validation

Add a small panel:

Scheduling Constraints

Show:

✓ Bus availability
✓ Crew availability
✓ Maximum duty duration
✓ Minimum rest period
✓ Bus turnaround time
✓ Linked duty consistency
✓ No overlapping assignments


If the user creates/simulates a conflict, show a red warning.

Example:

⚠ Crew rest violation detected: only 18 minutes available, minimum required is 30 minutes.

12. Small Route Map Section

At the bottom or as a second tab, create:

Route Network

Use a map component if the current project already has one.

If not, create a lightweight visual map using a suitable mapping library already available in the project.

Display:

Route 101

Route 102

Route 103

Route 104

Allow the user to select a route.

For the demo, show:

Route 103

Length: 18.4 km
Stops: 16
Assigned Buses: 3
Daily Trips: 12


Also include a button:

Analyze Route Overlap

When clicked, show a mock but realistic result:

Existing Route Overlap

Route 101 → 18%
Route 102 → 7%
Route 104 → 31%

Coverage Score → 87/100


Label this clearly as demo/synthetic analysis if no real GIS backend exists.

13. UI/UX Requirements

The interface should look like a modern B2B SaaS product.

Use:

Clean dashboard layout

Sidebar navigation

Professional cards

Tables

Status badges

Dialog/modal for incidents

Timeline visualization

Toast notifications

Loading states

Empty states

Responsive design

Avoid making it look like a basic college CRUD application.

Use consistent typography, spacing, icons and component styling.

14. Sidebar

Create or extend the sidebar with:

TransitOS

Dashboard

Operations
  Today's Operations
  Schedule Optimizer

Fleet
  Buses
  Maintenance

Crew
  Drivers
  Conductors

Routes
  Route Network
  Route Planner

Analytics

Settings


Only the Schedule Optimizer and Route Network need to be functional for this demo.

Other pages can show:

Coming soon

15. Data Model

Use clean TypeScript/Python models depending on the existing architecture.

Core entities:

Bus
Crew
Driver
Conductor
Route
Stop
Trip
Duty
Schedule
Incident
RescheduleAction


Example:

Bus
- id
- registrationNumber
- depot
- status
- availableFrom


Crew
- id
- name
- role
- status
- availableFrom
- restUntil


Duty
- id
- busId
- driverId
- conductorId
- routeId
- startTime
- endTime
- dutyType
- status


16. Architecture

Prefer this flow:

Frontend
   ↓
Scheduling API / Service
   ↓
Constraint Validation
   ↓
Optimization Engine
   ↓
Schedule


For the demo, mock data is acceptable.

However, isolate the optimization logic into a separate service/module:

generateSchedule()
validateSchedule()
detectConflicts()
rescheduleAffectedDuties()
calculateDisruptionScore()


This will allow Google OR-Tools to replace the mock optimization logic later.

17. Important Optimization Logic

Even if using mock data, implement actual logical checks where practical.

The scheduling engine should consider:

Bus availability
+
Crew availability
+
Duty overlap
+
Crew rest
+
Maximum duty duration
+
Bus turnaround
+
Linked duty rules


For dynamic rescheduling:

Incident
↓
Find affected duties
↓
Freeze unaffected duties
↓
Find available replacement resources
↓
Validate constraints
↓
Choose minimum-disruption solution
↓
Update affected duties


18. Demo Data

Seed the application with:

Buses

12 buses:

TN-30-AB-1001
TN-30-AB-1002
TN-30-AB-1003
TN-30-AB-1004
TN-30-AB-1005
TN-30-AB-1006
TN-30-AB-1007
TN-30-AB-1008
TN-30-AB-1009
TN-30-AB-1010
TN-30-AB-1011
TN-30-AB-1012


Crew

At least:

12 drivers

12 conductors

Routes

Route 101 – Salem Central → Hasthampatti
Route 102 – Salem Central → Ammapet
Route 103 – Salem Central → Fairlands
Route 104 – Salem Central → Kondalampatti
Route 105 – Salem Central → New Bus Stand


Create realistic synthetic timings.

19. Demo Flow

The complete presentation demo should be:

1. Open Schedule Optimizer

2. Select:
   Date → 14 Aug 2026
   Depot → Salem Central Depot
   Duty Type → Linked Duty

3. Click:
   Generate Schedule

4. Show automatically generated duties.

5. Explain:
   "The system automatically assigns buses and crew while
   respecting scheduling constraints."

6. Click:
   Simulate Bus Breakdown

7. Show affected duties.

8. Click:
   Analyze Impact

9. Show:
   unaffected duties remain unchanged.

10. Show optimized replacement assignments.

11. Show:
   "94% schedule retained."

12. Open Route Network.

13. Select Route 103.

14. Click:
   Analyze Route Overlap.

15. Show overlap and coverage analysis.


This should take approximately 3–5 minutes to demonstrate.

20. Important Product Positioning

The UI should communicate these three concepts prominently:

AUTOMATED

Generate feasible schedules automatically.

INTELLIGENT

Optimize buses and crew under real operational constraints.

DYNAMIC

Adapt schedules when real-world disruptions occur.

21. Do NOT implement yet

Do NOT spend time on:

Real payment integration

Real authentication

Real-time GPS hardware

Government APIs

Production deployment

Complex ML models

Full enterprise permissions

Mobile application

Actual passenger ticketing

Full fleet maintenance system

The goal is a small, polished, functional proof-of-concept.

22. Final Acceptance Criteria

The module is complete only when I can:

View the scheduling dashboard

Generate a schedule

See bus/crew assignments

See linked duty visualization

See scheduling constraints

Simulate a bus breakdown

See affected duties

Run dynamic rescheduling

See that unaffected duties remain unchanged

See before/after assignments

See the reason for replacement selection

View the route network

Analyze route overlap

See professional SaaS-quality UI

Refresh the page without breaking the demo

Use realistic synthetic data and make the entire demo work without external services.

Prioritize functionality, visual polish, and a convincing demonstration of the innovation over building many incomplete modules.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://route-wise-auto.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/58367c15-2ef6-4ecd-a290-483f899f251d).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

### Local Setup
1. Clone the repository:
   ```sh
   git clone <this-repository-url>
   cd transitOS/frontend
   npm i
   ```

2. Configure Environment:
   Copy `.env.example` to `.env` and set your local PostgreSQL database URL:
   ```sh
   cp .env.example .env
   ```

3. Database Operations:
   Generate migrations, run migrations, and seed initial Salem Transport Corporation data:
   ```sh
   # Generate migration SQL
   npm run db:generate

   # Apply migrations to database
   npm run db:migrate

   # Seed database
   npm run db:seed
   ```

4. Run the Dev Server:
   ```sh
   npm run dev
   ```

### Authentication & Development Accounts
Seeded development credentials are provided for testing Role-Based Access Control (RBAC):
- **Password (all)**: `password123`
- **Org Admin**: `admin@salemtransport.demo`
- **Scheduler**: `scheduler@salemtransport.demo`
- **Route Planner**: `planner@salemtransport.demo`
- **Depot Manager**: `manager@salemtransport.demo`
- **Management**: `management@salemtransport.demo`

Refer to [docs/authentication.md](docs/authentication.md) and [docs/development-auth.md](docs/development-auth.md) for full details on roles, permissions, and security.
