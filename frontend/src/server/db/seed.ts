import { db } from "./index";
import { tenants, buses, crew, routes, stops, trips, duties, dutyTrips, dutyCrewSegments, users } from "./schema";
import { sql } from "drizzle-orm";
import bcrypt from "bcryptjs";

const minutes = (h: number, m = 0) => h * 60 + m;

async function main() {
  console.log("🌱 Starting database seeding...");

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

  // 2. Seed Tenant
  console.log("Seeding tenants...");
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

  // 4. Seed Buses
  console.log("Seeding buses...");
  const busStatuses = [
    "available", "available", "available", "available", "available", "available",
    "assigned", "assigned", "assigned", "available", "breakdown", "out-of-service"
  ];
  const busValues = Array.from({ length: 12 }).map((_, i) => {
    const capacities = [40, 28, 44];
    const capacity = capacities[i % 3]!;
    const type = capacity === 40 ? "Standard Diesel Leyland" : capacity === 28 ? "Midi Bus Feeder" : "Double-Decker Express";
    const status = busStatuses[i] || "available";
    return {
      tenantId,
      registrationNumber: `TN-30-AB-${1000 + i}`,
      fleetNumber: `F-${String(100 + i)}`,
      depot: "Salem Central Depot",
      status,
      busType: type,
      capacity,
      availableFrom: minutes(5, 30),
    };
  });
  const seededBuses = await db.insert(buses).values(busValues).returning();
  console.log(`Seeded ${seededBuses.length} buses.`);

  // 5. Seed Crew Members
  console.log("Seeding crew...");
  const driverNames = [
    "Karthi Ganesan", "Suresh Kumar", "Mani Ratnam", "Velu Naicker",
    "Prakash Raj", "Rajesh Khanna", "Amitabh Bachchan", "Kamal Haasan",
    "Ravi Shastri", "Dhanush K", "Vijay Sethupathi", "Suriya Sivakumar"
  ];
  const driverStatuses = ["available", "available", "available", "available", "available", "available", "available", "available", "resting", "resting", "leave", "unavailable"];
  
  const conductorNames = [
    "Muthu Swamy", "Ranga Pillai", "Gopal Iyer", "Chinna Thambi",
    "Nataraj S", "Bala Murali", "Krishnan G", "Madhavan R",
    "Jeeva M", "Karthik R", "Senthil P", "Goundamani R"
  ];
  const conductorStatuses = ["available", "available", "available", "available", "available", "available", "available", "available", "resting", "resting", "leave", "unavailable"];

  const crewValues = [
    ...driverNames.map((name, i) => {
      const status = driverStatuses[i] || "available";
      const isResting = status === "resting";
      return {
        tenantId,
        employeeId: `EMP-DR-${String(i + 1).padStart(3, "0")}`,
        name,
        role: "driver",
        status,
        depot: "Salem Central Depot",
        availableFrom: minutes(5, 30),
        restUntil: isResting ? minutes(14, 30) : minutes(5, 30),
        licenseCategory: i % 2 === 0 ? "Heavy Passenger Vehicle (HPV)" : "Commercial Bus Licence",
        licenseExpiry: new Date(2027 + (i % 3), i, 15),
      };
    }),
    ...conductorNames.map((name, i) => {
      const status = conductorStatuses[i] || "available";
      const isResting = status === "resting";
      return {
        tenantId,
        employeeId: `EMP-CN-${String(i + 1).padStart(3, "0")}`,
        name,
        role: "conductor",
        status,
        depot: "Salem Central Depot",
        availableFrom: minutes(5, 30),
        restUntil: isResting ? minutes(14, 30) : minutes(5, 30),
        licenseCategory: null,
        licenseExpiry: null,
      };
    }),
  ];
  const seededCrew = await db.insert(crew).values(crewValues).returning();
  console.log(`Seeded ${seededCrew.length} crew members.`);

  // 6. Seed Routes & Stops
  console.log("Seeding routes...");
  const STOP_COORDINATES: Record<string, { lat: number; lng: number }> = {
    "Salem Central": { lat: 11.6643, lng: 78.1460 },
    "Gugai": { lat: 11.6500, lng: 78.1450 },
    "Alagapuram": { lat: 11.6720, lng: 78.1360 },
    "Maravaneri": { lat: 11.6650, lng: 78.1520 },
    "Hasthampatti": { lat: 11.6780, lng: 78.1580 },
    "Shevapet": { lat: 11.6600, lng: 78.1350 },
    "Ammapet Bridge": { lat: 11.6620, lng: 78.1650 },
    "Ammapet": { lat: 11.6610, lng: 78.1750 },
    "Salem Junction": { lat: 11.6690, lng: 78.1250 },
    "Five Roads": { lat: 11.6750, lng: 78.1330 },
    "Anna Park": { lat: 11.6800, lng: 78.1450 },
    "Fairlands": { lat: 11.6850, lng: 78.1510 },
    "Seelanaickenpatti": { lat: 11.6280, lng: 78.1520 },
    "Karuppur": { lat: 11.7100, lng: 78.0850 },
    "Kondalampatti": { lat: 11.6320, lng: 78.1250 },
    "Old Bus Stand": { lat: 11.6580, lng: 78.1500 },
    "Meyyanur": { lat: 11.6710, lng: 78.1210 },
    "New Bus Stand": { lat: 11.6760, lng: 78.1180 },
  };

  const routeData = [
    {
      code: "Route 101",
      name: "Salem Central → Hasthampatti",
      lengthKm: "12.60",
      durationMin: 40,
      direction: "UP",
      color: "#3B82F6", // Blue
      peakFrequency: 10,
      offPeakFrequency: 20,
      stops: ["Salem Central", "Gugai", "Alagapuram", "Maravaneri", "Hasthampatti"],
    },
    {
      code: "Route 102",
      name: "Salem Central → Ammapet",
      lengthKm: "9.80",
      durationMin: 30,
      direction: "UP",
      color: "#EF4444", // Red
      peakFrequency: 15,
      offPeakFrequency: 30,
      stops: ["Salem Central", "Shevapet", "Ammapet Bridge", "Ammapet"],
    },
    {
      code: "Route 103",
      name: "Salem Central → Fairlands",
      lengthKm: "18.40",
      durationMin: 50,
      direction: "UP",
      color: "#10B981", // Green (High Overlap with Route 101)
      peakFrequency: 12,
      offPeakFrequency: 24,
      stops: ["Salem Central", "Salem Junction", "Five Roads", "Anna Park", "Fairlands"],
    },
    {
      code: "Route 104",
      name: "Salem Central → Kondalampatti",
      lengthKm: "15.20",
      durationMin: 45,
      direction: "UP",
      color: "#F59E0B", // Orange
      peakFrequency: 20,
      offPeakFrequency: 40,
      stops: ["Salem Central", "Seelanaickenpatti", "Karuppur", "Kondalampatti"],
    },
    {
      code: "Route 105",
      name: "Salem Central → New Bus Stand",
      lengthKm: "7.40",
      durationMin: 35,
      direction: "UP",
      color: "#8B5CF6", // Purple
      peakFrequency: 30,
      offPeakFrequency: 60,
      stops: ["Salem Central", "Old Bus Stand", "Meyyanur", "New Bus Stand"],
    },
  ];

  const seededRoutesMap: Record<string, string> = {};

  for (const r of routeData) {
    const routeCoords = r.stops.map((stopName) => {
      const coords = STOP_COORDINATES[stopName] || { lat: 11.6643, lng: 78.1460 };
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
      const coords = STOP_COORDINATES[stopName] || { lat: 11.6643, lng: 78.1460 };
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
  console.log(`Seeded ${routeData.length} routes and their stop sequences.`);

  // 7. Seed Trips
  console.log("Seeding trips...");
  const serviceDate = "25 Aug 2026";
  const tripsData = [
    // Route 101 trips
    { code: "101-0600", routeCode: "Route 101", start: minutes(6, 0), dir: "OUTBOUND" },
    { code: "101-0700", routeCode: "Route 101", start: minutes(7, 0), dir: "INBOUND" },
    { code: "101-0800", routeCode: "Route 101", start: minutes(8, 0), dir: "OUTBOUND" },
    { code: "101-0900", routeCode: "Route 101", start: minutes(9, 0), dir: "INBOUND" },
    { code: "101-1000", routeCode: "Route 101", start: minutes(10, 0), dir: "OUTBOUND" },
    
    // Route 102 trips
    { code: "102-0615", routeCode: "Route 102", start: minutes(6, 15), dir: "OUTBOUND" },
    { code: "102-0715", routeCode: "Route 102", start: minutes(7, 15), dir: "INBOUND" },
    { code: "102-0815", routeCode: "Route 102", start: minutes(8, 15), dir: "OUTBOUND" },
    { code: "102-0915", routeCode: "Route 102", start: minutes(9, 15), dir: "INBOUND" },
    { code: "102-1015", routeCode: "Route 102", start: minutes(10, 15), dir: "OUTBOUND" },

    // Route 103 trips
    { code: "103-0630", routeCode: "Route 103", start: minutes(6, 30), dir: "OUTBOUND" },
    { code: "103-0730", routeCode: "Route 103", start: minutes(7, 30), dir: "INBOUND" },
    { code: "103-0830", routeCode: "Route 103", start: minutes(8, 30), dir: "OUTBOUND" },
    { code: "103-0930", routeCode: "Route 103", start: minutes(9, 30), dir: "INBOUND" },
    { code: "103-1030", routeCode: "Route 103", start: minutes(10, 30), dir: "OUTBOUND" },

    // Route 104 trips
    { code: "104-0645", routeCode: "Route 104", start: minutes(6, 45), dir: "OUTBOUND" },
    { code: "104-0745", routeCode: "Route 104", start: minutes(7, 45), dir: "INBOUND" },
    { code: "104-0845", routeCode: "Route 104", start: minutes(8, 45), dir: "OUTBOUND" },
    { code: "104-0945", routeCode: "Route 104", start: minutes(9, 45), dir: "INBOUND" },
    { code: "104-1045", routeCode: "Route 104", start: minutes(10, 45), dir: "OUTBOUND" },

    // Route 105 trips
    { code: "105-0700", routeCode: "Route 105", start: minutes(7, 0), dir: "OUTBOUND" },
    { code: "105-0800", routeCode: "Route 105", start: minutes(8, 0), dir: "INBOUND" },
    { code: "105-0900", routeCode: "Route 105", start: minutes(9, 0), dir: "OUTBOUND" },
    { code: "105-1000", routeCode: "Route 105", start: minutes(10, 0), dir: "INBOUND" },
    { code: "105-1100", routeCode: "Route 105", start: minutes(11, 0), dir: "OUTBOUND" },
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
      origin: route.stops[0] || "",
      destination: route.stops[route.stops.length - 1] || "",
      status: "planned",
      serviceDate,
    }).returning();

    seededTripsMap[t.code] = insertedTrip!.id;
  }
  console.log(`Seeded ${tripsData.length} trips.`);

  // 8. Seed Duties (8 Linked, 2 Unlinked)
  console.log("Seeding duties...");

  // Get active buses and crew (available statuses)
  const availableBuses = seededBuses.filter(b => b.status === "available" || b.status === "assigned");
  const drivers = seededCrew.filter(c => c.role === "driver");
  const conductors = seededCrew.filter(c => c.role === "conductor");

  // Linked Duties
  for (let i = 0; i < 8; i++) {
    const bus = availableBuses[i]!;
    const driver = drivers[i]!;
    const conductor = conductors[i]!;
    const dutyCode = `L-${String(100 + i)}`;

    // Grab 2 non-overlapping trips for this linked duty
    // e.g. Route 101 code 101-0600 (start 6:00, end 6:40) & 101-0800 (start 8:00, end 8:40)
    const trip1Code = `${101 + (i % 5)}-06${15 * (i % 4)}`;
    const trip2Code = `${101 + (i % 5)}-08${15 * (i % 4)}`;
    const trip1Id = seededTripsMap[trip1Code];
    const trip2Id = seededTripsMap[trip2Code];

    const [dutyRecord] = await db.insert(duties).values({
      tenantId,
      dutyCode,
      dutyType: "LINKED",
      serviceDate,
      startTime: minutes(6, 0),
      endTime: minutes(9, 30),
      status: "assigned",
      busId: bus.id,
      driverId: driver.id,
      conductorId: conductor.id,
    }).returning();

    // Insert Duty Trips
    if (trip1Id) {
      await db.insert(dutyTrips).values({
        tenantId,
        dutyId: dutyRecord!.id,
        tripId: trip1Id,
        sequence: 1,
        handoverRequired: false,
      });
    }
    if (trip2Id) {
      await db.insert(dutyTrips).values({
        tenantId,
        dutyId: dutyRecord!.id,
        tripId: trip2Id,
        sequence: 2,
        handoverRequired: false,
      });
    }
  }

  // Unlinked Duty 1
  const busUnlinked1 = availableBuses[8]!;
  const [unlinkedDuty1] = await db.insert(duties).values({
    tenantId,
    dutyCode: "U-201",
    dutyType: "UNLINKED",
    serviceDate,
    startTime: minutes(6, 0),
    endTime: minutes(11, 35),
    status: "published",
    busId: busUnlinked1.id,
  }).returning();

  // Assign trips sequentially
  const u1Trip1Id = seededTripsMap["101-0600"]!; // 06:00 - 06:40
  const u1Trip2Id = seededTripsMap["101-0800"]!; // 08:00 - 08:40
  const u1Trip3Id = seededTripsMap["101-1000"]!; // 10:00 - 10:40

  await db.insert(dutyTrips).values([
    { tenantId, dutyId: unlinkedDuty1!.id, tripId: u1Trip1Id, sequence: 1, handoverRequired: false },
    { tenantId, dutyId: unlinkedDuty1!.id, tripId: u1Trip2Id, sequence: 2, handoverRequired: true }, // Handover after 2nd trip!
    { tenantId, dutyId: unlinkedDuty1!.id, tripId: u1Trip3Id, sequence: 3, handoverRequired: false },
  ]);

  // Crew Segments: Driver 9/Conductor 9 for segment 1, Driver 10/Conductor 10 for segment 2
  await db.insert(dutyCrewSegments).values([
    {
      tenantId,
      dutyId: unlinkedDuty1!.id,
      driverId: drivers[8]!.id,
      conductorId: conductors[8]!.id,
      startTime: minutes(6, 0),
      endTime: minutes(9, 0),
      sequence: 1,
    },
    {
      tenantId,
      dutyId: unlinkedDuty1!.id,
      driverId: drivers[9]!.id,
      conductorId: conductors[9]!.id,
      startTime: minutes(9, 0),
      endTime: minutes(11, 35),
      sequence: 2,
    },
  ]);

  // Unlinked Duty 2
  const busUnlinked2 = availableBuses[9]!;
  const [unlinkedDuty2] = await db.insert(duties).values({
    tenantId,
    dutyCode: "U-202",
    dutyType: "UNLINKED",
    serviceDate,
    startTime: minutes(7, 15),
    endTime: minutes(10, 50),
    status: "published",
    busId: busUnlinked2.id,
  }).returning();

  const u2Trip1Id = seededTripsMap["102-0715"]!; // 07:15 - 07:45
  const u2Trip2Id = seededTripsMap["102-0915"]!; // 09:15 - 09:45

  await db.insert(dutyTrips).values([
    { tenantId, dutyId: unlinkedDuty2!.id, tripId: u2Trip1Id, sequence: 1, handoverRequired: true },
    { tenantId, dutyId: unlinkedDuty2!.id, tripId: u2Trip2Id, sequence: 2, handoverRequired: false },
  ]);

  await db.insert(dutyCrewSegments).values([
    {
      tenantId,
      dutyId: unlinkedDuty2!.id,
      driverId: drivers[10]!.id,
      conductorId: conductors[10]!.id,
      startTime: minutes(7, 15),
      endTime: minutes(9, 0),
      sequence: 1,
    },
    {
      tenantId,
      dutyId: unlinkedDuty2!.id,
      driverId: drivers[11]!.id,
      conductorId: conductors[11]!.id,
      startTime: minutes(9, 0),
      endTime: minutes(10, 50),
      sequence: 2,
    },
  ]);

  console.log(`Seeded 10 duties (8 linked, 2 unlinked) and crew segments.`);

  console.log("🎉 Seeding completed successfully!");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Seeding failed with error:", err);
  process.exit(1);
});
