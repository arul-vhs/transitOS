# Route Overlap Detection & Calculation

This document details the route overlap algorithm, spatial tolerance levels, severity metrics, and map visualization guidelines implemented in TransitOS.

---

## 1. The Proximity Problem

In municipal transport planning, adding a new route that duplicates segments of existing corridors leads to vehicle redundancy and driver inefficiency. Comparing route paths by names alone is insufficient because paths overlap geographically regardless of naming conventions. The system must verify geographic coordinate overlaps between proposed paths and existing routes in the database.

---

## 2. The Overlap Detection Algorithm

TransitOS implements a segment-based proximity search algorithm written in TypeScript:

### Step 1: Spatial Interpolation
Vertex coordinates in route geometries can be far apart (e.g. sparse points). To ensure high precision, both the proposed route's coordinates and all comparison routes' coordinates are interpolated at a dense interval of **80 meters** using the Haversine formula. This guarantees an even density of coordinates along the path.

### Step 2: Distance Scanning
For each interpolated coordinate $p$ in the proposed route $P$:
1. Loop through all interpolated coordinates $e$ of the target active route $E$.
2. Compute the great-circle distance between $p$ and $e$.
3. If the distance is less than or equal to the spatial tolerance threshold (**50 meters**), mark point $p$ as **overlapping**.

### Step 3: Metric Calculation
- **Overlap Percentage**:
  $$\text{Overlap \%} = \left(\frac{\text{Number of Overlapping Points}}{\text{Total Interpolated Points in Proposed Route}}\right) \times 100$$
- **Overlap Distance**:
  $$\text{Overlap Distance (km)} = \text{Overlap \%} \times \text{Total Proposed Length}$$

---

## 3. Severity Classification & Recommendations

For each compared route, severity is calculated as follows:

| Overlap Percentage | Severity | System Recommendation |
| :--- | :--- | :--- |
| **< 10%** | **LOW** | *Minimal corridor overlap. The proposed corridor is mostly independent.* |
| **10% - 40%** | **MEDIUM** | *Moderate corridor overlap detected. Consider modifying the proposed corridor.* |
| **> 40%** | **HIGH** | *High corridor overlap detected. This proposed route conflicts heavily with existing routes.* |

---

## 4. UI/UX Mapping Visualization

- **Base Layers**: Existing routes are plotted in thin, muted colors or semi-transparent styles.
- **Proposed Layer**: The proposed path is rendered in a thick orange polyline (`#F59E0B`).
- **Overlap Layer**: Coordinates identified as overlapping are isolated and rendered as a thick dashed red polyline (`#DC2626`) on top of the map. This provides immediate visual feedback to the route planner regarding where corridor conflicts occur.
- **Recommendations Panel**: A details drawer lists all active routes that are intersected by the proposed route, displaying their codes, names, overlap distance, overlap percentage, severity badge, and actionable design warnings.
