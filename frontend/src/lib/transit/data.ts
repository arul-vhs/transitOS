import type { Bus, Crew, TransitRoute } from "./types";

export const DEPOT = "Meyyanur Depot";
export const CORPORATION = "Salem Transport Corporation";
export const SCHEDULE_DATE = "25 Aug 2026";

export const minutes = (h: number, m = 0) => h * 60 + m;

export const fmtTime = (mins: number) => {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

const driverNames = [
  "Murugesan K.",
  "Selvam R.",
  "Palanisamy M.",
  "Arumugam V.",
  "Senthilkumar P.",
  "Dhanapal S.",
  "Anbarasan T.",
  "Ramasamy K.",
  "Marimuthu N.",
  "Velusamy K.",
  "Subramani P.",
  "Boopathi M.",
  "Thangavel S.",
  "Saravanan C.",
  "Manikandan G.",
  "Nataraj P.",
  "Sivakumar V.",
  "Ramesh K.",
  "Sridhar M.",
  "Vignesh R.",
  "Jayakumar S.",
  "Chandran M.",
  "Kathirvel P.",
  "Ilango T.",
];

const conductorNames = [
  "Muthusamy G.",
  "Natarajan S.",
  "Balamurali K.",
  "Madhavan P.",
  "Krishnan R.",
  "Chinnasamy T.",
  "Ganesan V.",
  "Rajendran S.",
  "Govindaraj M.",
  "Sivakumar A.",
  "Balakrishnan E.",
  "Shanmugam P.",
  "Ravi V.",
  "Mohanraj K.",
  "Duraisamy T.",
  "Elango N.",
  "Kumaravel S.",
  "Kandasamy R.",
  "Sadasivam M.",
  "Loganathan C.",
  "Pandian M.",
  "Vetrivel S.",
  "Vijayaraghavan R.",
  "Sengottaiyan P.",
];

const busRegistrations = [
  "TN-30-N-0412", "TN-30-N-0589", "TN-30-N-0631", "TN-30-N-0744",
  "TN-30-N-0812", "TN-30-N-0955", "TN-27-N-1102", "TN-30-AA-1420",
  "TN-30-N-1205", "TN-30-N-1342", "TN-30-N-1488", "TN-27-N-1590",
  "TN-30-AA-2101", "TN-30-N-1677", "TN-30-N-2108", "TN-30-N-2254",
  "TN-30-N-2390", "TN-27-N-2412", "TN-30-AA-3150", "TN-30-N-3120",
  "TN-30-N-3285", "TN-30-N-3341", "TN-27-N-3450", "TN-30-AA-4201",
];

const depots = ["Meyyanur Depot", "Johnsonpet Depot", "Hasthampatti Depot", "Steel Plant Depot"];

export const BUSES: Bus[] = busRegistrations.map((reg, i) => ({
  id: `B${String(i + 1).padStart(3, "0")}`,
  registrationNumber: reg,
  depot: depots[i % depots.length]!,
  status: (i === 6 ? "maintenance" : i === 13 ? "breakdown" : i === 18 ? "out-of-service" : "available") as any,
  availableFrom: minutes(5, 30),
}));

export const DRIVERS: Crew[] = driverNames.map((name, i) => ({
  id: `DR${String(i + 1).padStart(3, "0")}`,
  name,
  role: "driver" as const,
  status: (i === 6 ? "resting" : i === 7 ? "leave" : i === 18 ? "unavailable" : "available") as any,
  availableFrom: minutes(5, 30),
  restUntil: minutes(5, 30),
}));

export const CONDUCTORS: Crew[] = conductorNames.map((name, i) => ({
  id: `CN${String(i + 1).padStart(3, "0")}`,
  name,
  role: "conductor" as const,
  status: (i === 6 ? "resting" : i === 7 ? "leave" : i === 18 ? "unavailable" : "available") as any,
  availableFrom: minutes(5, 30),
  restUntil: minutes(5, 30),
}));

const stops = (names: string[]) => names.map((n, i) => ({ id: `S${i}-${n}`, name: n }));

export const ROUTES: TransitRoute[] = [
  {
    id: "R1",
    code: "Route 1",
    name: "Town Bus Stand ⇄ Salem Junction",
    lengthKm: 7.2,
    durationMin: 25,
    dailyTrips: 12,
    stops: stops(["Town Bus Stand", "Collectorate", "Four Roads", "Five Roads", "Suramangalam", "Salem Junction"]),
  },
  {
    id: "R13",
    code: "Route 13",
    name: "Town Bus Stand ⇄ Yercaud Foothills",
    lengthKm: 12.8,
    durationMin: 40,
    dailyTrips: 10,
    stops: stops(["Town Bus Stand", "Collectorate", "Sundar Lodge", "Hasthampatti Roundana", "Gorimedu (Arts College)", "Kannankurichi Lake", "Yercaud Foothills"]),
  },
  {
    id: "R4",
    code: "Route 4",
    name: "Town Bus Stand ⇄ Kondalampatti",
    lengthKm: 6.5,
    durationMin: 22,
    dailyTrips: 10,
    stops: stops(["Town Bus Stand", "Shevapet Market", "Gugai Handloom Colony", "Dadagapatti", "Trichy Main Road", "Kondalampatti Roundana"]),
  },
  {
    id: "R33",
    code: "Route 33",
    name: "MGR Central Bus Stand ⇄ Steel Plant",
    lengthKm: 14.6,
    durationMin: 45,
    dailyTrips: 8,
    stops: stops(["MGR Central Bus Stand", "Meyyanur", "Five Roads", "Salem Junction", "Mamangam", "Jagir Ammapalayam", "Steel Plant Township"]),
  },
  {
    id: "R8",
    code: "Route 8",
    name: "MGR Central Bus Stand ⇄ Ammapet Colony",
    lengthKm: 10.2,
    durationMin: 32,
    dailyTrips: 8,
    stops: stops(["MGR Central Bus Stand", "Five Roads", "Four Roads", "Town Bus Stand", "Pattai Koil", "Ammapet Main Road", "Ammapet Colony Terminus"]),
  },
  {
    id: "R74",
    code: "Route 74",
    name: "Town Bus Stand ⇄ Omalur Bus Stand",
    lengthKm: 16.5,
    durationMin: 50,
    dailyTrips: 8,
    stops: stops(["Town Bus Stand", "Four Roads", "MGR Central Bus Stand", "Mamangam", "Karuppur (Periyar Univ)", "Toll Gate (Omalur)", "Omalur Town Bus Stand"]),
  },
  {
    id: "R55",
    code: "Route 55",
    name: "MGR Central Bus Stand ⇄ Seelanaickenpatti",
    lengthKm: 8.4,
    durationMin: 28,
    dailyTrips: 8,
    stops: stops(["MGR Central Bus Stand", "Meyyanur", "Four Roads", "Gugai Handloom Colony", "Annathanapatti", "Seelanaickenpatti Bypass"]),
  },
  {
    id: "R2A",
    code: "Route 2A",
    name: "Salem Junction ⇄ Ayothiapattinam",
    lengthKm: 15.2,
    durationMin: 48,
    dailyTrips: 8,
    stops: stops(["Salem Junction", "Suramangalam", "Five Roads", "Four Roads", "Town Bus Stand", "Ammapet Main Road", "Udayapatti", "Ayothiapattinam Bus Stand"]),
  },
];

export const busById = (id: string) => BUSES.find((b) => b.id === id);
export const crewById = (id: string) =>
  [...DRIVERS, ...CONDUCTORS].find((c) => c.id === id);
export const routeById = (id: string) => ROUTES.find((r) => r.id === id);

export const busLabel = (id: string) => busById(id)?.registrationNumber ?? id;
export const crewLabel = (id: string) => crewById(id)?.name ?? id;
export const routeLabel = (id: string) => routeById(id)?.code ?? id;

/** Constraint constants — the same values an OR-Tools model would receive. */
export const CONSTRAINTS = {
  maxDutyMinutes: 300,
  minRestMinutes: 30,
  turnaroundMinutes: 20,
};
