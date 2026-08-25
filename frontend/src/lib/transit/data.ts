import type { Bus, Crew, TransitRoute } from "./types";

export const DEPOT = "Salem Central Depot";
export const CORPORATION = "Salem Transport Corporation";
export const SCHEDULE_DATE = "14 Aug 2026";

export const minutes = (h: number, m = 0) => h * 60 + m;

export const fmtTime = (mins: number) => {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

const driverNames = [
  "Kumar",
  "Arjun",
  "Suresh",
  "Prakash",
  "Murugan",
  "Selvam",
  "Karthik",
  "Dinesh",
  "Anand",
  "Rajesh",
  "Saravanan",
  "Vetri",
];

const conductorNames = [
  "Ravi",
  "Mani",
  "Bala",
  "Vignesh",
  "Gopal",
  "Sathish",
  "Naveen",
  "Hari",
  "Ilango",
  "Tamil",
  "Senthil",
  "Ashok",
];

export const BUSES: Bus[] = Array.from({ length: 12 }, (_, i) => ({
  id: `B${String(i + 1).padStart(3, "0")}`,
  registrationNumber: `TN-30-AB-${1001 + i}`,
  depot: DEPOT,
  status: "available" as const,
  availableFrom: minutes(5, 30),
}));

export const DRIVERS: Crew[] = driverNames.map((name, i) => ({
  id: `DR${String(i + 1).padStart(3, "0")}`,
  name,
  role: "driver" as const,
  status: "available" as const,
  availableFrom: minutes(5, 30),
  restUntil: minutes(5, 30),
}));

export const CONDUCTORS: Crew[] = conductorNames.map((name, i) => ({
  id: `CN${String(i + 1).padStart(3, "0")}`,
  name,
  role: "conductor" as const,
  status: "available" as const,
  availableFrom: minutes(5, 30),
  restUntil: minutes(5, 30),
}));

const stops = (names: string[]) => names.map((n, i) => ({ id: `S${i}-${n}`, name: n }));

export const ROUTES: TransitRoute[] = [
  {
    id: "R101",
    code: "Route 101",
    name: "Salem Central → Hasthampatti",
    lengthKm: 12.6,
    durationMin: 240,
    dailyTrips: 10,
    stops: stops([
      "Salem Central",
      "Gugai",
      "Alagapuram",
      "Maravaneri",
      "Hasthampatti",
    ]),
  },
  {
    id: "R102",
    code: "Route 102",
    name: "Salem Central → Ammapet",
    lengthKm: 9.8,
    durationMin: 255,
    dailyTrips: 8,
    stops: stops(["Salem Central", "Shevapet", "Ammapet Bridge", "Ammapet"]),
  },
  {
    id: "R103",
    code: "Route 103",
    name: "Salem Central → Fairlands",
    lengthKm: 18.4,
    durationMin: 270,
    dailyTrips: 12,
    stops: stops([
      "Salem Central",
      "Salem Junction",
      "Five Roads",
      "Anna Park",
      "Fairlands",
    ]),
  },
  {
    id: "R104",
    code: "Route 104",
    name: "Salem Central → Kondalampatti",
    lengthKm: 15.2,
    durationMin: 270,
    dailyTrips: 9,
    stops: stops(["Salem Central", "Seelanaickenpatti", "Karuppur", "Kondalampatti"]),
  },
  {
    id: "R105",
    code: "Route 105",
    name: "Salem Central → New Bus Stand",
    lengthKm: 7.4,
    durationMin: 210,
    dailyTrips: 11,
    stops: stops(["Salem Central", "Old Bus Stand", "Meyyanur", "New Bus Stand"]),
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
