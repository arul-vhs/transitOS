import { db } from "./index";
import { tenants, buses, crew, routes, stops, trips, duties, dutyTrips, dutyCrewSegments, users } from "./schema";
import { sql } from "drizzle-orm";
import bcrypt from "bcryptjs";

const minutes = (h: number, m = 0) => h * 60 + m;

async function main() {
  console.log("🌱 Starting real-world Salem City database seeding...");

  // 1. Clear existing data in reverse order of foreign key relationships
  console.log("Cleaning existing database records...");
  await db.execute(sql`TRUNCATE TABLE reschedule_actions CASCADE;`);
  await db.execute(sql`TRUNCATE TABLE incidents CASCADE;`);
  await db.execute(sql`TRUNCATE TABLE duty_crew_segments CASCADE;`);
  await db.execute(sql`TRUNCATE TABLE duty_trips CASCADE;`);
  await db.execute(sql`TRUNCATE TABLE duties CASCADE;`);
  await db.execute(sql`TRUNCATE TABLE trips CASCADE;`);
  await db.execute(sql`TRUNCATE TABLE stops CASCADE;`);
  await db.execute(sql`TRUNCATE TABLE schedules CASCADE;`);
  await db.execute(sql`TRUNCATE TABLE routes CASCADE;`);
  await db.execute(sql`TRUNCATE TABLE crew CASCADE;`);
  await db.execute(sql`TRUNCATE TABLE buses CASCADE;`);
  await db.execute(sql`TRUNCATE TABLE users CASCADE;`);
  await db.execute(sql`TRUNCATE TABLE tenants CASCADE;`);

  // 2. Seed Tenant: Salem Transport Corporation
  console.log("Seeding tenant: Salem Transport Corporation...");
  const [tenant] = await db.insert(tenants).values({
    name: "Salem Transport Corporation",
    slug: "salem-transport",
  }).returning();

  const tenantId = tenant!.id;

  // 3. Seed Users with hashed passwords
  console.log("Seeding users...");
  const pw = await bcrypt.hash("password123", 10);
  const userValues = [
    { tenantId, name: "System Admin", email: "admin@salemtransport.demo", passwordHash: pw, role: "ORGANIZATION_ADMIN" },
    { tenantId, name: "Platform Admin", email: "platform@salemtransport.demo", passwordHash: pw, role: "PLATFORM_ADMIN" },
    { tenantId, name: "Roster Planner", email: "planner@salemtransport.demo", passwordHash: pw, role: "ROUTE_PLANNER" },
    { tenantId, name: "Chief Scheduler", email: "scheduler@salemtransport.demo", passwordHash: pw, role: "SCHEDULER" },
    { tenantId, name: "Depot Manager", email: "depot@salemtransport.demo", passwordHash: pw, role: "DEPOT_MANAGER" },
    { tenantId, name: "Management Executive", email: "management@salemtransport.demo", passwordHash: pw, role: "MANAGEMENT" },
  ];
  await db.insert(users).values(userValues);
  console.log(`Seeded ${userValues.length} users.`);

  // 4. Seed Buses across 4 authentic Salem Depots
  console.log("Seeding Salem city bus fleet...");
  const busDefs = [
    // Meyyanur Depot (Depot-1, adjoining MGR Central Bus Stand)
    { reg: "TN-30-N-0412", fleet: "SLM-MY-101", depot: "Meyyanur Depot", type: "Ashok Leyland 210 HP BS-VI Viking", cap: 48, status: "available" },
    { reg: "TN-30-N-0589", fleet: "SLM-MY-102", depot: "Meyyanur Depot", type: "Ashok Leyland Semi-Low Floor SLF", cap: 42, status: "available" },
    { reg: "TN-30-N-0631", fleet: "SLM-MY-103", depot: "Meyyanur Depot", type: "Tata Marcopolo Starbus Ultra", cap: 32, status: "available" },
    { reg: "TN-30-N-0744", fleet: "SLM-MY-104", depot: "Meyyanur Depot", type: "Ashok Leyland 210 HP BS-VI Viking", cap: 48, status: "assigned" },
    { reg: "TN-30-N-0812", fleet: "SLM-MY-105", depot: "Meyyanur Depot", type: "Ashok Leyland Semi-Low Floor SLF", cap: 42, status: "assigned" },
    { reg: "TN-30-N-0955", fleet: "SLM-MY-106", depot: "Meyyanur Depot", type: "Tata Marcopolo Starbus Ultra", cap: 32, status: "available" },
    { reg: "TN-27-N-1102", fleet: "SLM-MY-107", depot: "Meyyanur Depot", type: "Ashok Leyland Suburban Liner", cap: 52, status: "maintenance" },
    { reg: "TN-30-AA-1420", fleet: "SLM-MY-108", depot: "Meyyanur Depot", type: "Ashok Leyland 210 HP BS-VI Viking", cap: 48, status: "available" },

    // Johnsonpet Depot (Depot-2, Town Bus Stand & central corridors)
    { reg: "TN-30-N-1205", fleet: "SLM-JP-201", depot: "Johnsonpet Depot", type: "Ashok Leyland 210 HP BS-VI Viking", cap: 48, status: "available" },
    { reg: "TN-30-N-1342", fleet: "SLM-JP-202", depot: "Johnsonpet Depot", type: "Ashok Leyland Semi-Low Floor SLF", cap: 42, status: "available" },
    { reg: "TN-30-N-1488", fleet: "SLM-JP-203", depot: "Johnsonpet Depot", type: "Tata Marcopolo Starbus Ultra", cap: 32, status: "assigned" },
    { reg: "TN-27-N-1590", fleet: "SLM-JP-204", depot: "Johnsonpet Depot", type: "Ashok Leyland 210 HP BS-VI Viking", cap: 48, status: "assigned" },
    { reg: "TN-30-AA-2101", fleet: "SLM-JP-205", depot: "Johnsonpet Depot", type: "Ashok Leyland Semi-Low Floor SLF", cap: 42, status: "available" },
    { reg: "TN-30-N-1677", fleet: "SLM-JP-206", depot: "Johnsonpet Depot", type: "Ashok Leyland Suburban Liner", cap: 52, status: "breakdown" },

    // Hasthampatti Depot (North Salem, Gorimedu & Yercaud foothills)
    { reg: "TN-30-N-2108", fleet: "SLM-HP-301", depot: "Hasthampatti Depot", type: "Ashok Leyland 210 HP BS-VI Viking", cap: 48, status: "available" },
    { reg: "TN-30-N-2254", fleet: "SLM-HP-302", depot: "Hasthampatti Depot", type: "Ashok Leyland Semi-Low Floor SLF", cap: 42, status: "available" },
    { reg: "TN-30-N-2390", fleet: "SLM-HP-303", depot: "Hasthampatti Depot", type: "Tata Marcopolo Starbus Ultra", cap: 32, status: "assigned" },
    { reg: "TN-27-N-2412", fleet: "SLM-HP-304", depot: "Hasthampatti Depot", type: "Ashok Leyland 210 HP BS-VI Viking", cap: 48, status: "available" },
    { reg: "TN-30-AA-3150", fleet: "SLM-HP-305", depot: "Hasthampatti Depot", type: "Ashok Leyland Suburban Liner", cap: 52, status: "out-of-service" },

    // Steel Plant Depot (Suramangalam, Mamangam & western corridors)
    { reg: "TN-30-N-3120", fleet: "SLM-SP-401", depot: "Steel Plant Depot", type: "Ashok Leyland 210 HP BS-VI Viking", cap: 48, status: "available" },
    { reg: "TN-30-N-3285", fleet: "SLM-SP-402", depot: "Steel Plant Depot", type: "Ashok Leyland Semi-Low Floor SLF", cap: 42, status: "available" },
    { reg: "TN-30-N-3341", fleet: "SLM-SP-403", depot: "Steel Plant Depot", type: "Tata Marcopolo Starbus Ultra", cap: 32, status: "assigned" },
    { reg: "TN-27-N-3450", fleet: "SLM-SP-404", depot: "Steel Plant Depot", type: "Ashok Leyland 210 HP BS-VI Viking", cap: 48, status: "assigned" },
    { reg: "TN-30-AA-4201", fleet: "SLM-SP-405", depot: "Steel Plant Depot", type: "Ashok Leyland Suburban Liner", cap: 52, status: "available" },
  ];

  const busValues = busDefs.map((b) => ({
    tenantId,
    registrationNumber: b.reg,
    fleetNumber: b.fleet,
    depot: b.depot,
    status: b.status,
    busType: b.type,
    capacity: b.cap,
    availableFrom: minutes(5, 30),
  }));

  const seededBuses = await db.insert(buses).values(busValues).returning();
  console.log(`Seeded ${seededBuses.length} real Salem buses across 4 depots.`);

  // 5. Seed Real Regional Crew (Drivers & Conductors)
  console.log("Seeding Salem transport crew...");
  const driverDefs = [
    // Meyyanur Depot
    { name: "Murugesan K.", depot: "Meyyanur Depot", status: "available" },
    { name: "Selvam R.", depot: "Meyyanur Depot", status: "available" },
    { name: "Palanisamy M.", depot: "Meyyanur Depot", status: "available" },
    { name: "Arumugam V.", depot: "Meyyanur Depot", status: "assigned" },
    { name: "Senthilkumar P.", depot: "Meyyanur Depot", status: "assigned" },
    { name: "Dhanapal S.", depot: "Meyyanur Depot", status: "available" },
    { name: "Anbarasan T.", depot: "Meyyanur Depot", status: "resting" },
    { name: "Ramasamy K.", depot: "Meyyanur Depot", status: "leave" },

    // Johnsonpet Depot
    { name: "Marimuthu N.", depot: "Johnsonpet Depot", status: "available" },
    { name: "Velusamy K.", depot: "Johnsonpet Depot", status: "available" },
    { name: "Subramani P.", depot: "Johnsonpet Depot", status: "assigned" },
    { name: "Boopathi M.", depot: "Johnsonpet Depot", status: "assigned" },
    { name: "Thangavel S.", depot: "Johnsonpet Depot", status: "available" },
    { name: "Saravanan C.", depot: "Johnsonpet Depot", status: "resting" },

    // Hasthampatti Depot
    { name: "Manikandan G.", depot: "Hasthampatti Depot", status: "available" },
    { name: "Nataraj P.", depot: "Hasthampatti Depot", status: "available" },
    { name: "Sivakumar V.", depot: "Hasthampatti Depot", status: "assigned" },
    { name: "Ramesh K.", depot: "Hasthampatti Depot", status: "available" },
    { name: "Sridhar M.", depot: "Hasthampatti Depot", status: "unavailable" },

    // Steel Plant Depot
    { name: "Vignesh R.", depot: "Steel Plant Depot", status: "available" },
    { name: "Jayakumar S.", depot: "Steel Plant Depot", status: "available" },
    { name: "Chandran M.", depot: "Steel Plant Depot", status: "assigned" },
    { name: "Kathirvel P.", depot: "Steel Plant Depot", status: "assigned" },
    { name: "Ilango T.", depot: "Steel Plant Depot", status: "available" },
  ];

  const conductorDefs = [
    // Meyyanur Depot
    { name: "Muthusamy G.", depot: "Meyyanur Depot", status: "available" },
    { name: "Natarajan S.", depot: "Meyyanur Depot", status: "available" },
    { name: "Balamurali K.", depot: "Meyyanur Depot", status: "available" },
    { name: "Madhavan P.", depot: "Meyyanur Depot", status: "assigned" },
    { name: "Krishnan R.", depot: "Meyyanur Depot", status: "assigned" },
    { name: "Chinnasamy T.", depot: "Meyyanur Depot", status: "available" },
    { name: "Ganesan V.", depot: "Meyyanur Depot", status: "resting" },
    { name: "Rajendran S.", depot: "Meyyanur Depot", status: "leave" },

    // Johnsonpet Depot
    { name: "Govindaraj M.", depot: "Johnsonpet Depot", status: "available" },
    { name: "Sivakumar A.", depot: "Johnsonpet Depot", status: "available" },
    { name: "Balakrishnan E.", depot: "Johnsonpet Depot", status: "assigned" },
    { name: "Shanmugam P.", depot: "Johnsonpet Depot", status: "assigned" },
    { name: "Ravi V.", depot: "Johnsonpet Depot", status: "available" },
    { name: "Mohanraj K.", depot: "Johnsonpet Depot", status: "resting" },

    // Hasthampatti Depot
    { name: "Duraisamy T.", depot: "Hasthampatti Depot", status: "available" },
    { name: "Elango N.", depot: "Hasthampatti Depot", status: "available" },
    { name: "Kumaravel S.", depot: "Hasthampatti Depot", status: "assigned" },
    { name: "Kandasamy R.", depot: "Hasthampatti Depot", status: "available" },
    { name: "Sadasivam M.", depot: "Hasthampatti Depot", status: "unavailable" },

    // Steel Plant Depot
    { name: "Loganathan C.", depot: "Steel Plant Depot", status: "available" },
    { name: "Pandian M.", depot: "Steel Plant Depot", status: "available" },
    { name: "Vetrivel S.", depot: "Steel Plant Depot", status: "assigned" },
    { name: "Vijayaraghavan R.", depot: "Steel Plant Depot", status: "assigned" },
    { name: "Sengottaiyan P.", depot: "Steel Plant Depot", status: "available" },
  ];

  const crewValues = [
    ...driverDefs.map((d, i) => {
      const isResting = d.status === "resting";
      return {
        tenantId,
        employeeId: `TNSTC-SLM-DR-${String(i + 1).padStart(3, "0")}`,
        name: d.name,
        role: "driver",
        status: d.status,
        depot: d.depot,
        availableFrom: minutes(5, 30),
        restUntil: isResting ? minutes(14, 30) : minutes(5, 30),
        licenseCategory: "Heavy Passenger Vehicle (HPV) / PSV Badge",
        licenseExpiry: new Date(2028 + (i % 3), (i * 2) % 12, 15),
      };
    }),
    ...conductorDefs.map((c, i) => {
      const isResting = c.status === "resting";
      return {
        tenantId,
        employeeId: `TNSTC-SLM-CN-${String(i + 1).padStart(3, "0")}`,
        name: c.name,
        role: "conductor",
        status: c.status,
        depot: c.depot,
        availableFrom: minutes(5, 30),
        restUntil: isResting ? minutes(14, 30) : minutes(5, 30),
        licenseCategory: null,
        licenseExpiry: null,
      };
    }),
  ];

  const seededCrew = await db.insert(crew).values(crewValues).returning();
  console.log(`Seeded ${seededCrew.length} crew members (24 drivers, 24 conductors).`);

  // 6. High-Precision Salem Landmark Coordinates
  const STOP_COORDINATES: Record<string, { lat: number; lng: number }> = {
    "Town Bus Stand": { lat: 11.6528, lng: 78.1591 },
    "Bose Maidan": { lat: 11.6542, lng: 78.1580 },
    "Collectorate": { lat: 11.6580, lng: 78.1550 },
    "Sundar Lodge": { lat: 11.6625, lng: 78.1560 },
    "Four Roads": { lat: 11.6668, lng: 78.1565 },
    "Five Roads": { lat: 11.6705, lng: 78.1437 },
    "MGR Central Bus Stand": { lat: 11.6673, lng: 78.1424 },
    "Meyyanur": { lat: 11.6685, lng: 78.1380 },
    "Swarnapuri": { lat: 11.6710, lng: 78.1320 },
    "Suramangalam": { lat: 11.6718, lng: 78.1170 },
    "Salem Junction": { lat: 11.6714, lng: 78.1132 },
    "Hasthampatti Roundana": { lat: 11.6795, lng: 78.1573 },
    "Gorimedu (Arts College)": { lat: 11.6965, lng: 78.1635 },
    "Kannankurichi Lake": { lat: 11.6989, lng: 78.1790 },
    "Yercaud Foothills": { lat: 11.7125, lng: 78.1885 },
    "Shevapet Market": { lat: 11.6520, lng: 78.1430 },
    "Gugai Handloom Colony": { lat: 11.6432, lng: 78.1508 },
    "Dadagapatti": { lat: 11.6360, lng: 78.1480 },
    "Trichy Main Road": { lat: 11.6315, lng: 78.1380 },
    "Kondalampatti Roundana": { lat: 11.6305, lng: 78.1248 },
    "Mamangam": { lat: 11.6850, lng: 78.1150 },
    "Jagir Ammapalayam": { lat: 11.6780, lng: 78.1020 },
    "Steel Plant Township": { lat: 11.6710, lng: 78.0940 },
    "Pattai Koil": { lat: 11.6540, lng: 78.1710 },
    "Ammapet Main Road": { lat: 11.6548, lng: 78.1877 },
    "Ammapet Colony Terminus": { lat: 11.6570, lng: 78.1950 },
    "Karuppur (Periyar Univ)": { lat: 11.7180, lng: 78.0780 },
    "Toll Gate (Omalur)": { lat: 11.7320, lng: 78.0580 },
    "Omalur Town Bus Stand": { lat: 11.7436, lng: 78.0476 },
    "Annathanapatti": { lat: 11.6380, lng: 78.1460 },
    "Seelanaickenpatti Bypass": { lat: 11.6228, lng: 78.1450 },
    "Udayapatti": { lat: 11.6620, lng: 78.2120 },
    "Ayothiapattinam Bus Stand": { lat: 11.6745, lng: 78.2520 },
  };

  // 7. Seed Real Salem Bus Routes
  console.log("Seeding authentic Salem City bus corridors...");
  const routeData = [
    {
      code: "Route 1",
      name: "Town Bus Stand ⇄ Salem Junction",
      lengthKm: "7.20",
      durationMin: 25,
      direction: "UP",
      color: "#2563EB", // Blue
      peakFrequency: 10,
      offPeakFrequency: 15,
      stops: ["Town Bus Stand", "Collectorate", "Four Roads", "Five Roads", "Suramangalam", "Salem Junction"],
    },
    {
      code: "Route 13",
      name: "Town Bus Stand ⇄ Yercaud Foothills",
      lengthKm: "12.80",
      durationMin: 40,
      direction: "UP",
      color: "#059669", // Emerald Green
      peakFrequency: 15,
      offPeakFrequency: 30,
      stops: ["Town Bus Stand", "Collectorate", "Sundar Lodge", "Hasthampatti Roundana", "Gorimedu (Arts College)", "Kannankurichi Lake", "Yercaud Foothills"],
    },
    {
      code: "Route 4",
      name: "Town Bus Stand ⇄ Kondalampatti",
      lengthKm: "6.50",
      durationMin: 22,
      direction: "UP",
      color: "#DC2626", // Red
      peakFrequency: 12,
      offPeakFrequency: 20,
      stops: ["Town Bus Stand", "Shevapet Market", "Gugai Handloom Colony", "Dadagapatti", "Trichy Main Road", "Kondalampatti Roundana"],
    },
    {
      code: "Route 33",
      name: "MGR Central Bus Stand ⇄ Steel Plant",
      lengthKm: "14.60",
      durationMin: 45,
      direction: "UP",
      color: "#7C3AED", // Purple
      peakFrequency: 20,
      offPeakFrequency: 40,
      stops: ["MGR Central Bus Stand", "Meyyanur", "Five Roads", "Salem Junction", "Mamangam", "Jagir Ammapalayam", "Steel Plant Township"],
    },
    {
      code: "Route 8",
      name: "MGR Central Bus Stand ⇄ Ammapet Colony",
      lengthKm: "10.20",
      durationMin: 32,
      direction: "UP",
      color: "#EA580C", // Orange
      peakFrequency: 15,
      offPeakFrequency: 25,
      stops: ["MGR Central Bus Stand", "Five Roads", "Four Roads", "Town Bus Stand", "Pattai Koil", "Ammapet Main Road", "Ammapet Colony Terminus"],
    },
    {
      code: "Route 74",
      name: "Town Bus Stand ⇄ Omalur Bus Stand",
      lengthKm: "16.50",
      durationMin: 50,
      direction: "UP",
      color: "#0891B2", // Cyan
      peakFrequency: 20,
      offPeakFrequency: 35,
      stops: ["Town Bus Stand", "Four Roads", "MGR Central Bus Stand", "Mamangam", "Karuppur (Periyar Univ)", "Toll Gate (Omalur)", "Omalur Town Bus Stand"],
    },
    {
      code: "Route 55",
      name: "MGR Central Bus Stand ⇄ Seelanaickenpatti",
      lengthKm: "8.40",
      durationMin: 28,
      direction: "UP",
      color: "#D97706", // Amber
      peakFrequency: 15,
      offPeakFrequency: 30,
      stops: ["MGR Central Bus Stand", "Meyyanur", "Four Roads", "Gugai Handloom Colony", "Annathanapatti", "Seelanaickenpatti Bypass"],
    },
    {
      code: "Route 2A",
      name: "Salem Junction ⇄ Ayothiapattinam",
      lengthKm: "15.20",
      durationMin: 48,
      direction: "UP",
      color: "#DB2777", // Pink
      peakFrequency: 20,
      offPeakFrequency: 40,
      stops: ["Salem Junction", "Suramangalam", "Five Roads", "Four Roads", "Town Bus Stand", "Ammapet Main Road", "Udayapatti", "Ayothiapattinam Bus Stand"],
    },
  ];

  const seededRoutesMap: Record<string, string> = {};

  for (const r of routeData) {
    const routeCoords = r.stops.map((stopName) => {
      const coords = STOP_COORDINATES[stopName] || { lat: 11.6673, lng: 78.1424 };
      return [coords.lng, coords.lat]; // GeoJSON [longitude, latitude]
    });

    const geojson = {
      type: "LineString",
      coordinates: routeCoords,
    };

    const [route] = await db.insert(routes).values({
      tenantId,
      code: r.code,
      name: r.name,
      origin: r.stops[0],
      destination: r.stops[r.stops.length - 1],
      lengthKm: r.lengthKm,
      durationMin: r.durationMin,
      direction: r.direction,
      color: r.color,
      peakFrequency: r.peakFrequency,
      offPeakFrequency: r.offPeakFrequency,
      status: "active",
      geometryGeojson: geojson,
    }).returning();

    seededRoutesMap[r.code] = route!.id;

    // Seed stops for this route
    const stopValues = r.stops.map((stopName, idx) => {
      const coords = STOP_COORDINATES[stopName] || { lat: 11.6673, lng: 78.1424 };
      return {
        tenantId,
        routeId: route!.id,
        name: stopName,
        sequence: idx + 1,
        latitude: String(coords.lat),
        longitude: String(coords.lng),
      };
    });
    await db.insert(stops).values(stopValues);
  }
  console.log(`Seeded ${routeData.length} Salem routes with full GPS stop sequences.`);

  // 8. Seed Realistic Trips
  console.log("Seeding scheduled Salem bus trips...");
  const serviceDate = "25 Aug 2026";
  const tripsData = [
    // Route 1 trips (Town Bus Stand ⇄ Salem Junction)
    { code: "R1-0600", routeCode: "Route 1", start: minutes(6, 0), dir: "OUTBOUND" },
    { code: "R1-0630", routeCode: "Route 1", start: minutes(6, 30), dir: "INBOUND" },
    { code: "R1-0700", routeCode: "Route 1", start: minutes(7, 0), dir: "OUTBOUND" },
    { code: "R1-0730", routeCode: "Route 1", start: minutes(7, 30), dir: "INBOUND" },
    { code: "R1-0800", routeCode: "Route 1", start: minutes(8, 0), dir: "OUTBOUND" },
    { code: "R1-0830", routeCode: "Route 1", start: minutes(8, 30), dir: "INBOUND" },
    { code: "R1-0900", routeCode: "Route 1", start: minutes(9, 0), dir: "OUTBOUND" },
    { code: "R1-0930", routeCode: "Route 1", start: minutes(9, 30), dir: "INBOUND" },

    // Route 13 trips (Town Bus Stand ⇄ Yercaud Foothills)
    { code: "R13-0615", routeCode: "Route 13", start: minutes(6, 15), dir: "OUTBOUND" },
    { code: "R13-0705", routeCode: "Route 13", start: minutes(7, 5), dir: "INBOUND" },
    { code: "R13-0800", routeCode: "Route 13", start: minutes(8, 0), dir: "OUTBOUND" },
    { code: "R13-0850", routeCode: "Route 13", start: minutes(8, 50), dir: "INBOUND" },
    { code: "R13-0945", routeCode: "Route 13", start: minutes(9, 45), dir: "OUTBOUND" },
    { code: "R13-1035", routeCode: "Route 13", start: minutes(10, 35), dir: "INBOUND" },

    // Route 4 trips (Town Bus Stand ⇄ Kondalampatti)
    { code: "R4-0615", routeCode: "Route 4", start: minutes(6, 15), dir: "OUTBOUND" },
    { code: "R4-0645", routeCode: "Route 4", start: minutes(6, 45), dir: "INBOUND" },
    { code: "R4-0715", routeCode: "Route 4", start: minutes(7, 15), dir: "OUTBOUND" },
    { code: "R4-0745", routeCode: "Route 4", start: minutes(7, 45), dir: "INBOUND" },
    { code: "R4-0815", routeCode: "Route 4", start: minutes(8, 15), dir: "OUTBOUND" },
    { code: "R4-0845", routeCode: "Route 4", start: minutes(8, 45), dir: "INBOUND" },

    // Route 33 trips (MGR Central Bus Stand ⇄ Steel Plant)
    { code: "R33-0630", routeCode: "Route 33", start: minutes(6, 30), dir: "OUTBOUND" },
    { code: "R33-0725", routeCode: "Route 33", start: minutes(7, 25), dir: "INBOUND" },
    { code: "R33-0820", routeCode: "Route 33", start: minutes(8, 20), dir: "OUTBOUND" },
    { code: "R33-0915", routeCode: "Route 33", start: minutes(9, 15), dir: "INBOUND" },

    // Route 8 trips (MGR Central Bus Stand ⇄ Ammapet Colony)
    { code: "R8-0645", routeCode: "Route 8", start: minutes(6, 45), dir: "OUTBOUND" },
    { code: "R8-0725", routeCode: "Route 8", start: minutes(7, 25), dir: "INBOUND" },
    { code: "R8-0810", routeCode: "Route 8", start: minutes(8, 10), dir: "OUTBOUND" },
    { code: "R8-0850", routeCode: "Route 8", start: minutes(8, 50), dir: "INBOUND" },

    // Route 74 trips (Town Bus Stand ⇄ Omalur Bus Stand)
    { code: "R74-0645", routeCode: "Route 74", start: minutes(6, 45), dir: "OUTBOUND" },
    { code: "R74-0745", routeCode: "Route 74", start: minutes(7, 45), dir: "INBOUND" },
    { code: "R74-0850", routeCode: "Route 74", start: minutes(8, 50), dir: "OUTBOUND" },
    { code: "R74-0950", routeCode: "Route 74", start: minutes(9, 50), dir: "INBOUND" },

    // Route 55 trips (MGR Central Bus Stand ⇄ Seelanaickenpatti)
    { code: "R55-0700", routeCode: "Route 55", start: minutes(7, 0), dir: "OUTBOUND" },
    { code: "R55-0735", routeCode: "Route 55", start: minutes(7, 35), dir: "INBOUND" },
    { code: "R55-0815", routeCode: "Route 55", start: minutes(8, 15), dir: "OUTBOUND" },
    { code: "R55-0850", routeCode: "Route 55", start: minutes(8, 50), dir: "INBOUND" },

    // Route 2A trips (Salem Junction ⇄ Ayothiapattinam)
    { code: "R2A-0645", routeCode: "Route 2A", start: minutes(6, 45), dir: "OUTBOUND" },
    { code: "R2A-0745", routeCode: "Route 2A", start: minutes(7, 45), dir: "INBOUND" },
    { code: "R2A-0850", routeCode: "Route 2A", start: minutes(8, 50), dir: "OUTBOUND" },
    { code: "R2A-0950", routeCode: "Route 2A", start: minutes(9, 50), dir: "INBOUND" },
  ];

  const seededTripsMap: Record<string, string> = {};

  for (const t of tripsData) {
    const routeId = seededRoutesMap[t.routeCode]!;
    const route = routeData.find(r => r.code === t.routeCode)!;
    const end = t.start + route.durationMin;

    const [insertedTrip] = await db.insert(trips).values({
      tenantId,
      routeId,
      tripCode: t.code,
      direction: t.dir,
      startTime: t.start,
      endTime: end,
      durationMin: route.durationMin,
      distanceKm: route.lengthKm,
      origin: t.dir === "OUTBOUND" ? route.stops[0]! : route.stops[route.stops.length - 1]!,
      destination: t.dir === "OUTBOUND" ? route.stops[route.stops.length - 1]! : route.stops[0]!,
      status: "planned",
      serviceDate,
    }).returning();

    seededTripsMap[t.code] = insertedTrip!.id;
  }
  console.log(`Seeded ${tripsData.length} scheduled Salem trips.`);

  // 9. Seed Operational Duties (14 Linked Duties, 4 Unlinked Duties)
  console.log("Seeding operational duties and crew rosters...");

  const availableBuses = seededBuses.filter(b => b.status === "available" || b.status === "assigned");
  const drivers = seededCrew.filter(c => c.role === "driver");
  const conductors = seededCrew.filter(c => c.role === "conductor");

  // Pairings for Linked Duties
  const linkedDutyConfigs = [
    { code: "L-SLM-101", trips: ["R1-0600", "R1-0630", "R1-0700", "R1-0730"] },
    { code: "L-SLM-102", trips: ["R1-0800", "R1-0830", "R1-0900", "R1-0930"] },
    { code: "L-SLM-103", trips: ["R13-0615", "R13-0705"] },
    { code: "L-SLM-104", trips: ["R13-0800", "R13-0850"] },
    { code: "L-SLM-105", trips: ["R4-0615", "R4-0645", "R4-0715"] },
    { code: "L-SLM-106", trips: ["R4-0745", "R4-0815", "R4-0845"] },
    { code: "L-SLM-107", trips: ["R33-0630", "R33-0725"] },
    { code: "L-SLM-108", trips: ["R33-0820", "R33-0915"] },
    { code: "L-SLM-109", trips: ["R8-0645", "R8-0725"] },
    { code: "L-SLM-110", trips: ["R8-0810", "R8-0850"] },
    { code: "L-SLM-111", trips: ["R74-0645", "R74-0745"] },
    { code: "L-SLM-112", trips: ["R74-0850", "R74-0950"] },
    { code: "L-SLM-113", trips: ["R55-0700", "R55-0735"] },
    { code: "L-SLM-114", trips: ["R55-0815", "R55-0850"] },
  ];

  for (let i = 0; i < linkedDutyConfigs.length; i++) {
    const config = linkedDutyConfigs[i]!;
    const bus = availableBuses[i % availableBuses.length]!;
    const driver = drivers[i % drivers.length]!;
    const conductor = conductors[i % conductors.length]!;

    const [dutyRecord] = await db.insert(duties).values({
      tenantId,
      dutyCode: config.code,
      dutyType: "LINKED",
      serviceDate,
      startTime: minutes(6, 0),
      endTime: minutes(11, 30),
      status: "assigned",
      busId: bus.id,
      driverId: driver.id,
      conductorId: conductor.id,
    }).returning();

    for (let seq = 0; seq < config.trips.length; seq++) {
      const tripCode = config.trips[seq]!;
      const tripId = seededTripsMap[tripCode];
      if (tripId) {
        await db.insert(dutyTrips).values({
          tenantId,
          dutyId: dutyRecord!.id,
          tripId,
          sequence: seq + 1,
          handoverRequired: false,
        });
      }
    }
  }

  // Unlinked Duty 1 (Route 13 Yercaud Foothills Corridor with driver handover at Town Bus Stand)
  const unlinkedBus1 = availableBuses[14 % availableBuses.length]!;
  const [unlinkedDuty1] = await db.insert(duties).values({
    tenantId,
    dutyCode: "U-SLM-201",
    dutyType: "UNLINKED",
    serviceDate,
    startTime: minutes(6, 15),
    endTime: minutes(11, 30),
    status: "published",
    busId: unlinkedBus1.id,
  }).returning();

  const u1Trip1 = seededTripsMap["R13-0615"]!;
  const u1Trip2 = seededTripsMap["R13-0705"]!;
  const u1Trip3 = seededTripsMap["R13-0800"]!;

  await db.insert(dutyTrips).values([
    { tenantId, dutyId: unlinkedDuty1!.id, tripId: u1Trip1, sequence: 1, handoverRequired: false },
    { tenantId, dutyId: unlinkedDuty1!.id, tripId: u1Trip2, sequence: 2, handoverRequired: true }, // Handover at Town Bus Stand
    { tenantId, dutyId: unlinkedDuty1!.id, tripId: u1Trip3, sequence: 3, handoverRequired: false },
  ]);

  await db.insert(dutyCrewSegments).values([
    {
      tenantId,
      dutyId: unlinkedDuty1!.id,
      driverId: drivers[14]!.id,
      conductorId: conductors[14]!.id,
      startTime: minutes(6, 15),
      endTime: minutes(7, 50),
      sequence: 1,
    },
    {
      tenantId,
      dutyId: unlinkedDuty1!.id,
      driverId: drivers[15]!.id,
      conductorId: conductors[15]!.id,
      startTime: minutes(7, 50),
      endTime: minutes(11, 30),
      sequence: 2,
    },
  ]);

  // Unlinked Duty 2 (Route 2A Salem Junction ⇄ Ayothiapattinam with handover at Town Bus Stand)
  const unlinkedBus2 = availableBuses[15 % availableBuses.length]!;
  const [unlinkedDuty2] = await db.insert(duties).values({
    tenantId,
    dutyCode: "U-SLM-202",
    dutyType: "UNLINKED",
    serviceDate,
    startTime: minutes(6, 45),
    endTime: minutes(10, 40),
    status: "published",
    busId: unlinkedBus2.id,
  }).returning();

  const u2Trip1 = seededTripsMap["R2A-0645"]!;
  const u2Trip2 = seededTripsMap["R2A-0745"]!;

  await db.insert(dutyTrips).values([
    { tenantId, dutyId: unlinkedDuty2!.id, tripId: u2Trip1, sequence: 1, handoverRequired: true },
    { tenantId, dutyId: unlinkedDuty2!.id, tripId: u2Trip2, sequence: 2, handoverRequired: false },
  ]);

  await db.insert(dutyCrewSegments).values([
    {
      tenantId,
      dutyId: unlinkedDuty2!.id,
      driverId: drivers[16]!.id,
      conductorId: conductors[16]!.id,
      startTime: minutes(6, 45),
      endTime: minutes(8, 35),
      sequence: 1,
    },
    {
      tenantId,
      dutyId: unlinkedDuty2!.id,
      driverId: drivers[17]!.id,
      conductorId: conductors[17]!.id,
      startTime: minutes(8, 35),
      endTime: minutes(10, 40),
      sequence: 2,
    },
  ]);

  // Unlinked Duty 3 (Route 33 Steel Plant Corridor)
  const unlinkedBus3 = availableBuses[16 % availableBuses.length]!;
  const [unlinkedDuty3] = await db.insert(duties).values({
    tenantId,
    dutyCode: "U-SLM-203",
    dutyType: "UNLINKED",
    serviceDate,
    startTime: minutes(8, 20),
    endTime: minutes(12, 0),
    status: "published",
    busId: unlinkedBus3.id,
  }).returning();

  const u3Trip1 = seededTripsMap["R33-0820"]!;
  const u3Trip2 = seededTripsMap["R33-0915"]!;

  await db.insert(dutyTrips).values([
    { tenantId, dutyId: unlinkedDuty3!.id, tripId: u3Trip1, sequence: 1, handoverRequired: true },
    { tenantId, dutyId: unlinkedDuty3!.id, tripId: u3Trip2, sequence: 2, handoverRequired: false },
  ]);

  await db.insert(dutyCrewSegments).values([
    {
      tenantId,
      dutyId: unlinkedDuty3!.id,
      driverId: drivers[18]!.id,
      conductorId: conductors[18]!.id,
      startTime: minutes(8, 20),
      endTime: minutes(10, 10),
      sequence: 1,
    },
    {
      tenantId,
      dutyId: unlinkedDuty3!.id,
      driverId: drivers[19]!.id,
      conductorId: conductors[19]!.id,
      startTime: minutes(10, 10),
      endTime: minutes(12, 0),
      sequence: 2,
    },
  ]);

  // Unlinked Duty 4 (Route 74 Omalur Corridor)
  const unlinkedBus4 = availableBuses[17 % availableBuses.length]!;
  const [unlinkedDuty4] = await db.insert(duties).values({
    tenantId,
    dutyCode: "U-SLM-204",
    dutyType: "UNLINKED",
    serviceDate,
    startTime: minutes(8, 50),
    endTime: minutes(12, 30),
    status: "published",
    busId: unlinkedBus4.id,
  }).returning();

  const u4Trip1 = seededTripsMap["R74-0850"]!;
  const u4Trip2 = seededTripsMap["R74-0950"]!;

  await db.insert(dutyTrips).values([
    { tenantId, dutyId: unlinkedDuty4!.id, tripId: u4Trip1, sequence: 1, handoverRequired: true },
    { tenantId, dutyId: unlinkedDuty4!.id, tripId: u4Trip2, sequence: 2, handoverRequired: false },
  ]);

  await db.insert(dutyCrewSegments).values([
    {
      tenantId,
      dutyId: unlinkedDuty4!.id,
      driverId: drivers[20]!.id,
      conductorId: conductors[20]!.id,
      startTime: minutes(8, 50),
      endTime: minutes(10, 45),
      sequence: 1,
    },
    {
      tenantId,
      dutyId: unlinkedDuty4!.id,
      driverId: drivers[21]!.id,
      conductorId: conductors[21]!.id,
      startTime: minutes(10, 45),
      endTime: minutes(12, 30),
      sequence: 2,
    },
  ]);

  console.log(`Seeded 18 duties (14 linked, 4 unlinked) with realistic crew handovers.`);
  console.log("🎉 Real-world Salem City data seeding completed successfully!");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Seeding failed with error:", err);
  process.exit(1);
});
