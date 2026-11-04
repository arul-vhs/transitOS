import pg from "pg";
import rawData from "../src/server/db/extracted-data.json" with { type: "json" };

const SALEM_TENANT_ID = "c4ab681d-7b82-4674-bb8a-14ef96de6d23";

async function run() {
  const client = new pg.Client({
    connectionString: "postgresql://postgres:1234@localhost:5432/transit",
  });
  await client.connect();

  console.log("Connected to PostgreSQL. Seeding Salem dataset...");

  // Delete existing operational records for Salem
  await client.query("DELETE FROM duty_trips WHERE duty_id IN (SELECT id FROM duties WHERE tenant_id = $1)", [SALEM_TENANT_ID]);
  await client.query("DELETE FROM duties WHERE tenant_id = $1", [SALEM_TENANT_ID]);
  await client.query("DELETE FROM trips WHERE tenant_id = $1", [SALEM_TENANT_ID]);
  await client.query("DELETE FROM stops WHERE tenant_id = $1", [SALEM_TENANT_ID]);
  await client.query("DELETE FROM routes WHERE tenant_id = $1", [SALEM_TENANT_ID]);
  await client.query("DELETE FROM buses WHERE tenant_id = $1", [SALEM_TENANT_ID]);
  await client.query("DELETE FROM crew WHERE tenant_id = $1", [SALEM_TENANT_ID]);

  // Insert Buses
  for (const b of rawData.buses || []) {
    await client.query(
      `INSERT INTO buses (id, tenant_id, registration_number, fleet_number, depot, status, bus_type, capacity, available_from, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
       ON CONFLICT (id) DO UPDATE SET tenant_id = EXCLUDED.tenant_id`,
      [b.id, SALEM_TENANT_ID, b.registration_number, b.fleet_number || b.registration_number, b.depot || "Meyyanur Central Depot", b.status || "available", b.bus_type, b.capacity || 48, b.available_from || 330]
    );
  }
  console.log(`Inserted ${(rawData.buses || []).length} Salem buses.`);

  // Insert Crew
  for (const c of rawData.crew || []) {
    await client.query(
      `INSERT INTO crew (id, tenant_id, employee_id, name, role, status, depot, available_from, rest_until, license_category, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
       ON CONFLICT (tenant_id, employee_id) DO UPDATE SET name = EXCLUDED.name, depot = EXCLUDED.depot`,
      [c.id, SALEM_TENANT_ID, c.employee_id, c.name, c.role || "driver", c.status || "available", c.depot || "Meyyanur Central Depot", c.available_from || 330, c.rest_until || 330, c.license_category || "HEAVY_PASSENGER_VEHICLE"]
    );
  }
  console.log(`Inserted ${(rawData.crew || []).length} Salem crew.`);

  // Insert Routes
  for (const r of rawData.routes || []) {
    await client.query(
      `INSERT INTO routes (id, tenant_id, code, name, origin, destination, length_km, duration_min, geometry_geojson, status, direction, color, peak_frequency, off_peak_frequency, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
       ON CONFLICT (id) DO UPDATE SET tenant_id = EXCLUDED.tenant_id`,
      [
        r.id,
        SALEM_TENANT_ID,
        r.code,
        r.name,
        r.origin,
        r.destination,
        r.length_km || "8.5",
        r.duration_min || 30,
        JSON.stringify(r.geometry_geojson || { type: "LineString", coordinates: [[78.15, 11.65], [78.16, 11.66]] }),
        r.status || "active",
        r.direction || "UP",
        r.color || "#2563EB",
        r.peak_frequency || 15,
        r.off_peak_frequency || 30
      ]
    );
  }
  console.log(`Inserted ${(rawData.routes || []).length} Salem routes.`);

  // Insert Stops
  for (const s of rawData.stops || []) {
    await client.query(
      `INSERT INTO stops (id, tenant_id, route_id, name, sequence, latitude, longitude)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET tenant_id = EXCLUDED.tenant_id`,
      [s.id, SALEM_TENANT_ID, s.route_id, s.name, s.sequence || 1, s.latitude, s.longitude]
    );
  }
  console.log(`Inserted ${(rawData.stops || []).length} Salem stops.`);

  // Insert Trips
  for (const t of rawData.trips || []) {
    await client.query(
      `INSERT INTO trips (id, tenant_id, route_id, trip_code, direction, start_time, end_time, service_date, status, origin, destination, duration_min, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
       ON CONFLICT (id) DO UPDATE SET tenant_id = EXCLUDED.tenant_id`,
      [
        t.id,
        SALEM_TENANT_ID,
        t.route_id,
        t.trip_code || t.trip_number || "TR-01",
        t.direction || "UP",
        t.start_time || 360,
        t.end_time || 390,
        t.service_date || "25 Aug 2026",
        t.status || "scheduled",
        t.origin || "Town Bus Stand",
        t.destination || "Salem Junction",
        t.duration_min || 30
      ]
    );
  }
  console.log(`Inserted ${(rawData.trips || []).length} Salem trips.`);

  // Insert Duties
  for (const d of rawData.duties || []) {
    await client.query(
      `INSERT INTO duties (id, tenant_id, duty_code, duty_type, service_date, bus_id, driver_id, conductor_id, start_time, end_time, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
       ON CONFLICT (id) DO UPDATE SET tenant_id = EXCLUDED.tenant_id`,
      [
        d.id,
        SALEM_TENANT_ID,
        d.duty_code || d.duty_number || "D-01",
        d.duty_type || "LINKED",
        d.service_date || "25 Aug 2026",
        d.bus_id || null,
        d.driver_id || null,
        d.conductor_id || null,
        d.start_time || 360,
        d.end_time || 450,
        d.status || "scheduled"
      ]
    );
  }
  console.log(`Inserted ${(rawData.duties || []).length} Salem duties.`);

  // Insert Duty Trips
  for (const dt of rawData.duty_trips || []) {
    await client.query(
      `INSERT INTO duty_trips (id, tenant_id, duty_id, trip_id, sequence, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (id) DO UPDATE SET tenant_id = EXCLUDED.tenant_id`,
      [dt.id, SALEM_TENANT_ID, dt.duty_id, dt.trip_id, dt.sequence || 1]
    );
  }
  console.log(`Inserted ${(rawData.duty_trips || []).length} Salem duty_trips.`);

  await client.end();
  console.log("Salem dataset seeded successfully!");
}

run().catch((err) => {
  console.error("Error seeding Salem:", err);
  process.exit(1);
});
