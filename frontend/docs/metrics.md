# TransitOS Metric Formulas

This document defines the mathematical formulas implemented inside the TransitOS analytics queries:

## 1. Completion Rate

$$\text{Completion Rate} = \frac{\text{completedTrips}}{\text{scheduledTrips}} \times 100$$
- **`completedTrips`**: Total trips with status `COMPLETED` or `RECOVERED`.
- **`scheduledTrips`**: Total trips in scheduled plan.

## 2. Cancellation Rate

$$\text{Cancellation Rate} = \frac{\text{cancelledTrips}}{\text{scheduledTrips}} \times 100$$
- **`cancelledTrips`**: Total trips with status `CANCELLED`.

## 3. On-Time Rate

$$\text{On-Time Rate} = \frac{\text{onTimeTrips}}{\text{completedTrips}} \times 100$$
- **`onTimeTrips`**: Trips with $\text{departureVariance} \le 5$ minutes.

## 4. Fleet Utilization Rate

$$\text{Fleet Utilization} = \frac{\text{operatedMinutes}}{\text{availableMinutes}} \times 100$$
- **`operatedMinutes`**: Sum of duty minutes for all assigned vehicles.
- **`availableMinutes`**: Available duration limit (configured to 480 mins / 8 hours per vehicle).

## 5. Recovery Success Rate

$$\text{Recovery Success} = \frac{\text{recoveredTrips}}{\text{affectedTrips}} \times 100$$
- **`recoveredTrips`**: Trips marked `RECOVERED` or successfully reassigned.
- **`affectedTrips`**: Count of trips in the incident's re-optimization recovery window.
