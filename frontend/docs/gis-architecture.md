# GIS Architecture Documentation

This document describes the Geographical Information Systems (GIS) architecture of the TransitOS platform, detailing library choices, map styling, coordinates, and coordinates storage.

---

## 1. Stack & Library Selection

TransitOS uses **Leaflet** as its primary mapping engine:
- **Leaflet**: Lightweight, performant, mobile-friendly GIS library.
- **OpenStreetMap (OSM) Tiles**: Free, public tile provider for rendering geographic base layers, avoiding paid mapping API dependencies.
- **Vanilla Integration**: To prevent React 19 package compatibility warnings and ensure full execution control, Leaflet is instantiated directly (`L.map`) inside standard React `useEffect` hooks rather than through React wrapper packages.
- **CDN Stylesheets**: Leaflet CSS is linked in the global router layout head to ensure stylesheet styling is loaded prior to client-side hydration, preventing map rendering layout shift.

---

## 2. GeoJSON Geometry Storage

Route shapes are stored directly in the `routes` table as GeoJSON using the PostgreSQL `jsonb` column type.

### GeoJSON LineString Representation
A route is saved as a LineString GeoJSON object:
```json
{
  "type": "LineString",
  "coordinates": [
    [78.1460, 11.6643],
    [78.1450, 11.6500],
    [78.1330, 11.6750]
  ]
}
```

> [!IMPORTANT]
> **Coordinate Ordering Convention**
> GeoJSON geometry strictly follows the longitude-first standard:
> `[longitude, latitude]`
> Leaflet map queries and coordinate renders dynamically map these coordinates to `[latitude, longitude]` during map polyline plotting.

---

## 3. Interactive Route Rendering & Custom Styling

- **Path Rendering**: Routes are drawn on the base map using `L.polyline`. The active selected route is highlighted with a larger stroke weight, and non-selected routes are rendered in semi-transparent, thin paths.
- **Marker Overlays**: Stops are plotted on the map using `L.marker` combined with CSS-styled `L.divIcon` HTML overlays. This approach eliminates reliance on external image assets (avoiding standard Leaflet asset bundling gotchas) and provides high-definition circular markers with stop sequence numbers inside them.
- **Map Boundaries**: Selecting a route triggers `map.fitBounds()`, which zooms and centers the viewport to tightly frame the coordinate boundaries of the selected LineString.

---

## 4. Interactive Vertex Drawing Workflow

The Route Planner (`/network/planner`) introduces a dynamic vertex drawing mode:
1. **State Activation**: Enabling map clicks adds a click listener to the map.
2. **Point Addition**: Clicking coordinates on the map pushes new `[lng, lat]` coordinates into the proposed route's coordinate array.
3. **Polyline Preview**: Leaflet updates the proposed path polyline in real-time as nodes are placed.
4. **Distance Calculation**: The map calculates and displays the path distance dynamically in kilometers by summing the distance between sequential coordinates using the spherical Haversine formula:
   $$d = 2R \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos \phi_1 \cos \phi_2 \sin^2\left(\frac{\Delta \lambda}{2}\right)}\right)$$
5. **Stop Mapping**: Drawn coordinates can be highlighted and marked as Stops in the panel, populating the stops registry coordinates instantly.
