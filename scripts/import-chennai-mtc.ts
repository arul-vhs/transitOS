// Load environment variables in Node runtime if not already loaded
if (typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile();
  } catch {
    // Ignore error if .env file does not exist
  }
}

import fs from "fs";
import path from "path";
import readline from "readline";
import bcrypt from "bcryptjs";
import { sql } from "drizzle-orm";
import { db, pool } from "../src/server/db/index";
import {
  tenants,
  users,
  buses,
  crew,
  routes,
  stops,
  trips,
  duties,
  dutyTrips,
} from "../src/server/db/schema";
import { CHENNAI_MTC_TENANT_ID } from "../src/server/auth";

// Haversine distance in km
function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Distance squared in coordinate space for fast lookup
function distSq(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = lat1 - lat2;
  const dLon = lon1 - lon2;
  return dLat * dLat + dLon * dLon;
}

interface GTFSStop {
  id: string;
  name: string;
  lat: number;
  lon: number;
}

const DEPOT_NAMES = [
  "Central / Broadway Depot",
  "Adyar Depot",
  "Annanagar West Depot",
  "Alandur Depot",
  "Madhavaram Depot",
  "Vadapalani Depot",
  "Tambaram Depot",
  "CMBT Koyambedu Depot",
  "Saidapet Depot",
  "T. Nagar Depot",
];

const ROUTE_COLORS = [
  "#2563eb", // Cobalt
  "#059669", // Emerald
  "#0284c7", // Sky blue
  "#475569", // Slate
  "#d97706", // Amber
  "#0d9488", // Teal
  "#4f46e5", // Indigo
  "#e11d48", // Crimson
];

async function main() {
  console.log("=================================================");
  console.log(" TransitOS - Chennai MTC Clean Import Pipeline  ");
  console.log("=================================================");

  // 1. Ensure Chennai MTC Tenant Record
  console.log("\n[1/7] Ensuring Chennai MTC Tenant in database...");
  const existingTenant = await db.query.tenants.findFirst({
    where: (t, { eq }) => eq(t.id, CHENNAI_MTC_TENANT_ID),
  });

  if (!existingTenant) {
    console.log("Inserting Chennai MTC tenant record...");
    await db.insert(tenants).values({
      id: CHENNAI_MTC_TENANT_ID,
      name: "Chennai Metropolitan Transport Corporation",
      slug: "chennai-mtc",
    });
  } else {
    console.log("Chennai MTC tenant already exists:", existingTenant.name);
  }

  // 2. Ensure Users for Chennai MTC
  console.log("\n[2/7] Ensuring MTC Demo users in database...");
  const passwordHash = await bcrypt.hash("password123", 10);
  const mtcUsers = [
    {
      id: "69c3c165-8fcd-4490-b126-c286ffa64700",
      tenantId: CHENNAI_MTC_TENANT_ID,
      email: "admin@mtcchennai.demo",
      passwordHash,
      name: "System Admin (MTC)",
      role: "ORGANIZATION_ADMIN",
    },
    {
      id: "69693473-27dd-4c95-b892-9afd2d41db1b",
      tenantId: CHENNAI_MTC_TENANT_ID,
      email: "scheduler@mtcchennai.demo",
      passwordHash,
      name: "Chief Scheduler (MTC)",
      role: "SCHEDULER",
    },
    {
      id: "69ceced7-eb42-4cd3-9e25-ab8515ed03a1",
      tenantId: CHENNAI_MTC_TENANT_ID,
      email: "planner@mtcchennai.demo",
      passwordHash,
      name: "Route Planner (MTC)",
      role: "ROUTE_PLANNER",
    },
    {
      id: "69271598-b1a5-4978-8cc8-75d10a2490c5",
      tenantId: CHENNAI_MTC_TENANT_ID,
      email: "depot@mtcchennai.demo",
      passwordHash,
      name: "Depot Manager (Broadway)",
      role: "DEPOT_MANAGER",
    },
    {
      id: "691ca0b7-74c9-4809-9965-7e7b77999d09",
      tenantId: CHENNAI_MTC_TENANT_ID,
      email: "management@mtcchennai.demo",
      passwordHash,
      name: "Operations Director",
      role: "MANAGEMENT",
    },
    {
      id: "69ef4c67-51ea-4288-a845-d5b0f3f1f00b",
      tenantId: CHENNAI_MTC_TENANT_ID,
      email: "platform@mtcchennai.demo",
      passwordHash,
      name: "Platform Engineer",
      role: "PLATFORM_ADMIN",
    },
  ];

  for (const u of mtcUsers) {
    const existing = await db.query.users.findFirst({
      where: (userTable, { and, eq }) =>
        and(
          eq(userTable.tenantId, u.tenantId),
          eq(userTable.email, u.email),
        ),
    });
    if (!existing) {
      await db.insert(users).values(u);
      console.log(`Created user: ${u.email} (${u.role})`);
    } else {
      console.log(`User already exists: ${u.email}`);
    }
  }

  // 3. Clean Purge Outdated Transit Operational Data
  console.log("\n[3/7] Purging outdated transit operational data (preserving users and tenants)...");
  await db.execute(sql`TRUNCATE TABLE duty_crew_segments CASCADE;`);
  await db.execute(sql`TRUNCATE TABLE duty_trips CASCADE;`);
  await db.execute(sql`TRUNCATE TABLE reschedule_actions CASCADE;`);
  await db.execute(sql`TRUNCATE TABLE recovery_proposals CASCADE;`);
  await db.execute(sql`TRUNCATE TABLE incident_impacts CASCADE;`);
  await db.execute(sql`TRUNCATE TABLE incidents CASCADE;`);
  await db.execute(sql`TRUNCATE TABLE rescheduling_runs CASCADE;`);
  await db.execute(sql`TRUNCATE TABLE duties CASCADE;`);
  await db.execute(sql`TRUNCATE TABLE trips CASCADE;`);
  await db.execute(sql`TRUNCATE TABLE stops CASCADE;`);
  await db.execute(sql`TRUNCATE TABLE schedules CASCADE;`);
  await db.execute(sql`TRUNCATE TABLE routes CASCADE;`);
  await db.execute(sql`TRUNCATE TABLE buses CASCADE;`);
  await db.execute(sql`TRUNCATE TABLE crew CASCADE;`);
  await db.execute(sql`TRUNCATE TABLE optimization_runs CASCADE;`);
  await db.execute(sql`TRUNCATE TABLE operational_events CASCADE;`);
  console.log("Operational tables cleanly cleared.");

  // 4. Seed Realistic Chennai MTC Fleet (Buses)
  console.log("\n[4/7] Seeding realistic Chennai MTC fleet...");
  const busModels = [
    { type: "Ashok Leyland Viking BS-VI", cap: 58 },
    { type: "Tata Marcopolo BS-VI", cap: 55 },
    { type: "Volvo 8400 Low Floor AC", cap: 42 },
    { type: "E-Bus JBM Ecolife", cap: 50 },
  ];

  const busRecords: {
    tenantId: string;
    registrationNumber: string;
    fleetNumber: string;
    depot: string;
    status: string;
    busType: string;
    capacity: number;
    availableFrom: number;
  }[] = [];

  for (let i = 1; i <= 50; i++) {
    const regNum = `TN-01-N-${9400 + i}`;
    const fleetNum = `MTC-${String(100 + i).padStart(4, "0")}`;
    const depot = DEPOT_NAMES[(i - 1) % DEPOT_NAMES.length]!;
    const model = busModels[(i - 1) % busModels.length]!;

    busRecords.push({
      tenantId: CHENNAI_MTC_TENANT_ID,
      registrationNumber: regNum,
      fleetNumber: fleetNum,
      depot,
      status: "available",
      busType: model.type,
      capacity: model.cap,
      availableFrom: 300, // 05:00 AM
    });
  }

  const insertedBuses = await db.insert(buses).values(busRecords).returning();
  console.log(`Inserted ${insertedBuses.length} Chennai MTC buses across 10 depots.`);

  // 5. Seed Realistic Chennai MTC Crew (Drivers and Conductors)
  console.log("\n[5/7] Seeding realistic Chennai MTC drivers and conductors...");
  const driverNames = [
    "R. Murugan", "K. Selvakumar", "M. Arumugam", "P. Senthil", "S. Natarajan",
    "G. Kumar", "V. Rajendran", "A. Thangavel", "T. Balasubramanian", "D. Mohan",
    "K. Govindaraj", "J. Jayakumar", "S. Venkatesh", "M. Saravanan", "R. Manoharan",
    "P. Sivakumar", "C. Sundaram", "N. Balamurugan", "E. Paneerselvam", "K. Shankar",
    "S. Ramamoorthy", "A. Anbalagan", "M. Veerappan", "V. Elangovan", "R. Velayutham",
    "T. Jayaraman", "K. Ganesan", "P. Radhakrishnan", "S. Chelladurai", "M. Munusamy",
    "B. Subramani", "A. Karuppasamy", "G. Loganathan", "C. Marimuthu", "R. Prabhakaran",
    "N. Muthukumar", "V. Dinakaran", "K. Srinivasan", "S. Chandran", "M. Kannan",
    "T. Ravi", "P. Gopalakrishnan", "A. Dhanasekaran", "R. Vijayan", "K. Soundararajan",
  ];

  const conductorNames = [
    "C. Palani", "T. Vijayakumar", "B. Jayavel", "A. Shankar", "M. Velu",
    "K. Dharmalingam", "D. Parthiban", "S. Krishnan", "R. Jagadeesan", "V. Thilagar",
    "P. Moorthy", "G. Sridhar", "M. Gnanasekaran", "A. Vetrivel", "K. Narayanan",
    "R. Devaraj", "S. Annamalai", "T. Thirunavukkarasu", "C. Boobalan", "M. Ramesh",
    "P. Udhayakumar", "V. Kothandaraman", "S. Sathish", "K. Murugesan", "A. Pandian",
    "R. Karthikeyan", "M. Kalidass", "G. Gunasekaran", "T. Selvam", "P. Vasudevan",
    "B. Boopalan", "A. Ravichandran", "K. Pushparaj", "S. Baskar", "M. Sengottaiyan",
    "C. Tamilarasan", "V. Prakash", "N. Suresh", "R. Durairaj", "K. Sudhakar",
    "T. Manivannan", "P. Rajasekaran", "A. Mohanraj", "R. Govindasamy", "S. Kesavan",
  ];

  const crewRecords: {
    tenantId: string;
    employeeId: string;
    name: string;
    role: string;
    status: string;
    depot: string;
    availableFrom: number;
    restUntil: number;
    licenseCategory?: string;
  }[] = [];

  for (let i = 0; i < driverNames.length; i++) {
    crewRecords.push({
      tenantId: CHENNAI_MTC_TENANT_ID,
      employeeId: `EMP-DRV-${101 + i}`,
      name: driverNames[i]!,
      role: "driver",
      status: "available",
      depot: DEPOT_NAMES[i % DEPOT_NAMES.length]!,
      availableFrom: 300,
      restUntil: 300,
      licenseCategory: "HEAVY_PASSENGER_VEHICLE",
    });
  }

  for (let i = 0; i < conductorNames.length; i++) {
    crewRecords.push({
      tenantId: CHENNAI_MTC_TENANT_ID,
      employeeId: `EMP-CND-${201 + i}`,
      name: conductorNames[i]!,
      role: "conductor",
      status: "available",
      depot: DEPOT_NAMES[i % DEPOT_NAMES.length]!,
      availableFrom: 300,
      restUntil: 300,
      licenseCategory: "CONDUCTOR_BADGE",
    });
  }

  const insertedCrew = await db.insert(crew).values(crewRecords).returning();
  console.log(`Inserted ${insertedCrew.length} crew members (${driverNames.length} drivers, ${conductorNames.length} conductors).`);

  // 6. Load GTFS Stops & GeoJSON Routes
  console.log("\n[6/7] Reading Chennai MTC routes and stops datasets...");
  const stopsPath = path.resolve(process.cwd(), "data/staging/stops.txt");
  const routesGeoPath = path.resolve(
    process.cwd(),
    "data/staging/static_mtc_gtfs_data/all_mtc_routes.geojson",
  );

  // Read GTFS stops
  const allStops: GTFSStop[] = [];
  const stopsRl = readline.createInterface({
    input: fs.createReadStream(stopsPath),
    crlfDelay: Infinity,
  });

  let lineCount = 0;
  for await (const line of stopsRl) {
    if (lineCount++ === 0) continue; // skip header
    const parts = line.split(",");
    if (parts.length >= 4) {
      const id = parts[0]?.trim() || "";
      const name = parts[1]?.trim() || "";
      const lat = parseFloat(parts[2]?.trim() || "0");
      const lon = parseFloat(parts[3]?.trim() || "0");
      if (id && name && !isNaN(lat) && !isNaN(lon) && lat >= 12.5 && lat <= 13.6 && lon >= 79.5 && lon <= 80.5) {
        allStops.push({ id, name, lat, lon });
      }
    }
  }
  console.log(`Loaded ${allStops.length} valid Chennai GTFS stops.`);

  // Read all_mtc_routes.geojson
  const routesGeo = JSON.parse(fs.readFileSync(routesGeoPath, "utf8"));
  console.log(`Loaded ${routesGeo.features.length} GeoJSON routes from all_mtc_routes.geojson.`);

  // Save canonical location index to data/chennai-canonical-locations.json
  const uniqueStopsMap = new Map<string, { id: string; name: string; lat: number; lng: number }>();
  for (const s of allStops) {
    const key = `${s.name.toLowerCase()}@${s.lat.toFixed(3)},${s.lon.toFixed(3)}`;
    if (!uniqueStopsMap.has(key)) {
      uniqueStopsMap.set(key, { id: s.id, name: s.name, lat: s.lat, lng: s.lon });
    }
  }

  const canonicalLocationsDir = path.resolve(process.cwd(), "data");
  if (!fs.existsSync(canonicalLocationsDir)) {
    fs.mkdirSync(canonicalLocationsDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(canonicalLocationsDir, "chennai-canonical-locations.json"),
    JSON.stringify(Array.from(uniqueStopsMap.values()), null, 2),
    "utf8",
  );
  console.log(`Saved ${uniqueStopsMap.size} canonical locations to data/chennai-canonical-locations.json.`);

  // We will import up to 100 prominent MTC routes (or all valid ones)
  // Let's ensure high priority routes like 570, 21G, 102, 29A, 5C, 1, 1B, 2, 3, etc. are processed
  const priorityCodes = new Set([
    "570", "21G", "102", "29A", "5C", "1", "1B", "1C", "1D", "2", "2A",
    "3", "4", "5B", "5E", "5G", "11 R", "12G", "19B", "27B", "47A", "70",
    "88K", "18A", "25G", "D70", "M70", "A1", "B29", "T29", "54", "570S",
    "102X", "21H", "23C", "45A", "70A", "70V", "114", "154", "515", "570A"
  ]);

  // Sort features: priority routes first, then alphabetically
  const sortedFeatures = [...routesGeo.features].sort((a: any, b: any) => {
    const codeA = a.properties?.route_name || "";
    const codeB = b.properties?.route_name || "";
    const isPrioA = priorityCodes.has(codeA);
    const isPrioB = priorityCodes.has(codeB);
    if (isPrioA && !isPrioB) return -1;
    if (!isPrioA && isPrioB) return 1;
    return codeA.localeCompare(codeB);
  });

  // Select top 80 routes for production DB to ensure crisp performance and fast loading
  const selectedFeatures = sortedFeatures.slice(0, 80);
  console.log(`Processing top ${selectedFeatures.length} routes with full geometry & sequenced stops...`);

  const insertedRoutesMap = new Map<string, any>();
  let stopInsertCount = 0;

  for (let idx = 0; idx < selectedFeatures.length; idx++) {
    const f = selectedFeatures[idx];
    const code = f.properties?.route_name || `MTC-${idx + 1}`;
    const origin = f.properties?.source || "Origin";
    const destination = f.properties?.destinatio || "Destination";
    const coordsMulti = f.geometry?.coordinates || [];

    // Flatten coords into a single array of [lon, lat] points
    let flatCoords: [number, number][] = [];
    if (f.geometry.type === "MultiLineString") {
      for (const line of coordsMulti) {
        flatCoords.push(...line);
      }
    } else if (f.geometry.type === "LineString") {
      flatCoords = coordsMulti;
    }

    if (flatCoords.length === 0) continue;

    // Calculate length in km
    let lengthKm = 0;
    for (let c = 0; c < flatCoords.length - 1; c++) {
      const p1 = flatCoords[c]!;
      const p2 = flatCoords[c + 1]!;
      lengthKm += haversineKm(p1[1], p1[0], p2[1], p2[0]);
    }
    lengthKm = Math.max(2.5, Math.round(lengthKm * 10) / 10);

    // Calculate duration in min (city transit speed approx 20 km/h + 10m buffer)
    const durationMin = Math.max(20, Math.round((lengthKm / 20) * 60) + 5);
    const color = ROUTE_COLORS[idx % ROUTE_COLORS.length]!;

    // Create GeoJSON object
    const geometryGeojson = {
      type: "Feature",
      properties: {
        code,
        origin,
        destination,
        lengthKm,
        durationMin,
      },
      geometry: {
        type: "LineString",
        coordinates: flatCoords,
      },
    };

    const [newRoute] = await db
      .insert(routes)
      .values({
        tenantId: CHENNAI_MTC_TENANT_ID,
        code,
        name: `${origin} ⇄ ${destination}`,
        origin,
        destination,
        lengthKm: lengthKm.toFixed(2),
        durationMin,
        geometryGeojson,
        status: "active",
        direction: "CIRCULAR",
        color,
        peakFrequency: 15,
        offPeakFrequency: 30,
      })
      .returning();

    if (!newRoute) continue;
    insertedRoutesMap.set(code, newRoute);

    // Find and sequence stops along this route
    // 1. Start stop at origin
    // 2. Sample 10 to 14 intermediate stops along flatCoords
    // 3. End stop at destination
    const routeStopsToInsert: {
      tenantId: string;
      routeId: string;
      name: string;
      sequence: number;
      latitude: string;
      longitude: string;
    }[] = [];

    const numStops = Math.min(16, Math.max(8, Math.round(lengthKm * 0.8)));
    const step = Math.floor(flatCoords.length / (numStops + 1));

    // Origin Stop
    const firstCoord = flatCoords[0]!;
    routeStopsToInsert.push({
      tenantId: CHENNAI_MTC_TENANT_ID,
      routeId: newRoute.id,
      name: origin,
      sequence: 1,
      latitude: firstCoord[1].toFixed(6),
      longitude: firstCoord[0].toFixed(6),
    });

    // Intermediate stops - find closest matching GTFS stop near coordinate step
    const usedStopNames = new Set<string>([origin.toLowerCase()]);
    for (let sIdx = 1; sIdx <= numStops; sIdx++) {
      const coordIndex = Math.min(flatCoords.length - 1, sIdx * step);
      const coord = flatCoords[coordIndex]!;
      const lat = coord[1];
      const lon = coord[0];

      // Find closest GTFS stop within 350 meters
      let bestStop: GTFSStop | null = null;
      let minD = 0.00015; // roughly 400m squared
      for (const gs of allStops) {
        const d = distSq(lat, lon, gs.lat, gs.lon);
        if (d < minD && !usedStopNames.has(gs.name.toLowerCase())) {
          minD = d;
          bestStop = gs;
        }
      }

      const stopName = bestStop ? bestStop.name : `Stop ${sIdx} (${origin} Sector)`;
      usedStopNames.add(stopName.toLowerCase());

      routeStopsToInsert.push({
        tenantId: CHENNAI_MTC_TENANT_ID,
        routeId: newRoute.id,
        name: stopName,
        sequence: sIdx + 1,
        latitude: (bestStop ? bestStop.lat : lat).toFixed(6),
        longitude: (bestStop ? bestStop.lon : lon).toFixed(6),
      });
    }

    // Destination Stop
    const lastCoord = flatCoords[flatCoords.length - 1]!;
    routeStopsToInsert.push({
      tenantId: CHENNAI_MTC_TENANT_ID,
      routeId: newRoute.id,
      name: destination,
      sequence: routeStopsToInsert.length + 1,
      latitude: lastCoord[1].toFixed(6),
      longitude: lastCoord[0].toFixed(6),
    });

    // Batch insert stops for this route
    await db.insert(stops).values(routeStopsToInsert);
    stopInsertCount += routeStopsToInsert.length;
  }

  console.log(`Inserted ${insertedRoutesMap.size} routes with ${stopInsertCount} sequenced stops.`);

  // 7. Seed Initial Operational Trips, Duties & Assignments
  console.log("\n[7/7] Seeding operational trips, duties and assignments...");
  const todayStr = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date()); // e.g. "04/11/2026"

  const serviceDates = [todayStr, "14/08/2026"];

  const driversList = insertedCrew.filter((c) => c.role === "driver");
  const conductorsList = insertedCrew.filter((c) => c.role === "conductor");

  let tripCount = 0;
  let dutyCount = 0;

  // Key routes to create scheduled operations for
  const operationalRoutes = [
    insertedRoutesMap.get("570"),
    insertedRoutesMap.get("21G"),
    insertedRoutesMap.get("102"),
    insertedRoutesMap.get("29A"),
    insertedRoutesMap.get("5C"),
    insertedRoutesMap.get("1"),
    insertedRoutesMap.get("1B"),
    insertedRoutesMap.get("2"),
    insertedRoutesMap.get("3"),
  ].filter(Boolean);

  let busIndex = 0;
  let crewIndex = 0;

  for (const date of serviceDates) {
    for (let rIdx = 0; rIdx < operationalRoutes.length; rIdx++) {
      const r = operationalRoutes[rIdx];
      const duration = r.durationMin || 60;
      const length = parseFloat(r.lengthKm) || 20;

      // 4 scheduled trips per route (Morning Peak, Midday, Afternoon, Evening Peak)
      const departureTimes = [
        360, // 06:00 AM
        480, // 08:00 AM
        660, // 11:00 AM
        960, // 04:00 PM
      ];

      for (let tIdx = 0; tIdx < departureTimes.length; tIdx++) {
        const startTime = departureTimes[tIdx]!;
        const endTime = startTime + duration;
        const isReturn = tIdx % 2 === 1;
        const origin = isReturn ? r.destination : r.origin;
        const destination = isReturn ? r.origin : r.destination;
        const tripCode = `TRP-${date.replace(/\//g, "")}-${r.code}-${tIdx + 1}`;

        const [createdTrip] = await db
          .insert(trips)
          .values({
            tenantId: CHENNAI_MTC_TENANT_ID,
            routeId: r.id,
            tripCode,
            direction: isReturn ? "RETURN" : "OUTBOUND",
            startTime,
            endTime,
            durationMin: duration,
            distanceKm: length.toFixed(2),
            origin,
            destination,
            status: "scheduled",
            serviceDate: date,
            plannedStart: startTime,
            plannedEnd: endTime,
            plannedDuration: duration,
          })
          .returning();

        tripCount++;

        // For the first 2 trips on each route, create an assigned duty (bus, driver, conductor)
        // Leave the 3rd and 4th trips unassigned so the user can test the scheduling wizard & conflict resolver!
        if (tIdx < 2 && createdTrip) {
          const assignedBus = insertedBuses[busIndex % insertedBuses.length]!;
          const assignedDriver = driversList[crewIndex % driversList.length]!;
          const assignedConductor = conductorsList[crewIndex % conductorsList.length]!;

          const dutyCode = `DTY-${date.replace(/\//g, "")}-${r.code}-${tIdx + 1}`;
          const [createdDuty] = await db
            .insert(duties)
            .values({
              tenantId: CHENNAI_MTC_TENANT_ID,
              dutyCode,
              dutyType: "LINKED",
              serviceDate: date,
              startTime,
              endTime,
              status: "assigned",
              busId: assignedBus.id,
              driverId: assignedDriver.id,
              conductorId: assignedConductor.id,
            })
            .returning();

          if (createdDuty) {
            await db.insert(dutyTrips).values({
              tenantId: CHENNAI_MTC_TENANT_ID,
              dutyId: createdDuty.id,
              tripId: createdTrip.id,
              sequence: 1,
            });
            dutyCount++;
          }

          busIndex++;
          crewIndex++;
        }
      }
    }
  }

  console.log(`Created ${tripCount} operational trips and ${dutyCount} linked duties with bus/driver/conductor assignments.`);

  console.log("\n=================================================");
  console.log("  MTC Chennai Dataset Successfully Imported!    ");
  console.log("=================================================");
  console.log(`- Tenant: Chennai Metropolitan Transport Corporation (${CHENNAI_MTC_TENANT_ID})`);
  console.log(`- Buses: ${insertedBuses.length}`);
  console.log(`- Crew: ${insertedCrew.length}`);
  console.log(`- Routes: ${insertedRoutesMap.size}`);
  console.log(`- Sequenced Stops: ${stopInsertCount}`);
  console.log(`- Canonical Locations: ${uniqueStopsMap.size}`);
  console.log(`- Operational Trips: ${tripCount}`);
  console.log(`- Active Duties: ${dutyCount}`);

  await pool.end();
}

main().catch((err) => {
  console.error("Error running import:", err);
  process.exit(1);
});
