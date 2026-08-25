# Schedule Explainability

Explainability is a core feature of the TransitOS Scheduling Engine. When the solver leaves a trip unassigned, it generates explicit human-readable reasons to help dispatchers understand resource bottlenecks.

## Bottleneck Diagnostics

The explainability engine analyze candidate profiles and timelines:
1. **Total Resource Shortage**:
   - No active buses: `"No active buses available in the fleet registry."`
   - No active crew: `"No active drivers available. Check for expired licenses or status locks."`
2. **Mandatory Rest Period overlaps**:
   - If drivers are available but resting: `"No driver available. Drivers exist, but they are under mandatory rest until HH:MM."`
3. **Turnaround Buffer Violation**:
   - If vehicle transitions fail to satisfy spacing: `"Buses exist, but turnaround transitions from their previous routes require a 10-minute buffer."`
4. **Timeline Overlaps**:
   - General overlap: `"No compatible bus or crew segment was free between HH:MM and HH:MM."`
