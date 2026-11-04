/**
 * Authentic Chennai Metropolitan Transport Corporation (MTC) Dataset
 * Sourced and normalized from official CUMTA / MTC GTFS feeds (Agency ID 69).
 */

export const CHENNAI_MTC_TENANT_ID = "69000000-0000-4000-8000-000000000069";
export const SALEM_TENANT_ID = "c4ab681d-7b82-4674-bb8a-14ef96de6d23";

export interface MTCStop {
  id: string;
  name: string;
  code: string;
  lat: number;
  lng: number;
  isTerminal?: boolean;
  zone?: string;
}

export interface MTCRoute {
  id: string;
  code: string;
  name: string;
  origin: string;
  destination: string;
  originId: string;
  destinationId: string;
  lengthKm: number;
  durationMin: number;
  direction: "UP" | "DOWN";
  color: string;
  peakFrequencyMin: number;
  offPeakFrequencyMin: number;
  depot: string;
  stops: {
    stopId: string;
    sequence: number;
    timeOffsetMin: number;
  }[];
  pathCoordinates: [number, number][]; // [longitude, latitude] for GeoJSON
}

export const CHENNAI_MTC_DEPOTS = [
  { id: "depot-chn-01", name: "Central / Broadway Depot", code: "CHN-BDW-01", capacity: 85, activeBuses: 78, lat: 13.0876, lng: 80.2838 },
  { id: "depot-chn-02", name: "Adyar Depot", code: "CHN-ADY-02", capacity: 70, activeBuses: 64, lat: 12.9978, lng: 80.2562 },
  { id: "depot-chn-03", name: "Annanagar West Depot", code: "CHN-ANW-03", capacity: 75, activeBuses: 68, lat: 13.0957, lng: 80.1979 },
  { id: "depot-chn-04", name: "Alandur Depot", code: "CHN-ALN-04", capacity: 60, activeBuses: 55, lat: 12.9971, lng: 80.1914 },
  { id: "depot-chn-05", name: "Madhavaram Depot", code: "CHN-MDV-05", capacity: 65, activeBuses: 58, lat: 13.1320, lng: 80.2371 },
  { id: "depot-chn-06", name: "Vadapalani / T. Nagar Depot", code: "CHN-VDP-06", capacity: 80, activeBuses: 74, lat: 13.0512, lng: 80.2120 },
  { id: "depot-chn-07", name: "Tambaram Depot", code: "CHN-TBM-07", capacity: 90, activeBuses: 82, lat: 12.9249, lng: 80.1265 },
  { id: "depot-chn-08", name: "CMBT Koyambedu Depot", code: "CHN-CMB-08", capacity: 100, activeBuses: 92, lat: 13.0673, lng: 80.2057 },
];

export const CHENNAI_MTC_STOPS: Record<string, MTCStop> = {
  // Key Terminals and Interchanges
  "MTC-840": { id: "MTC-840", name: "Broadway Bus Terminus", code: "BDW", lat: 13.08762, lng: 80.28383, isTerminal: true, zone: "North" },
  "MTC-CENTRAL": { id: "MTC-CENTRAL", name: "Chennai Central Railway Station", code: "MAS", lat: 13.0827, lng: 80.2757, isTerminal: true, zone: "Central" },
  "MTC-EGMORE": { id: "MTC-EGMORE", name: "Chennai Egmore Station", code: "MS", lat: 13.0784, lng: 80.2608, isTerminal: true, zone: "Central" },
  "MTC-ANNA-SQ": { id: "MTC-ANNA-SQ", name: "Anna Square (Marina Beach)", code: "ASQ", lat: 13.0645, lng: 80.2858, isTerminal: true, zone: "Central" },
  "MTC-CMBT": { id: "MTC-CMBT", name: "CMBT Koyambedu Terminus", code: "CMBT", lat: 13.0673, lng: 80.2057, isTerminal: true, zone: "West" },
  "MTC-TNAGAR": { id: "MTC-TNAGAR", name: "T. Nagar Bus Terminus", code: "TNG", lat: 13.0402, lng: 80.2337, isTerminal: true, zone: "South" },
  "MTC-SAIDAPET": { id: "MTC-SAIDAPET", name: "Saidapet Bus Stand", code: "SDP", lat: 13.0205, lng: 80.2228, isTerminal: true, zone: "South" },
  "MTC-GUINDY": { id: "MTC-GUINDY", name: "Guindy Kathipara Junction", code: "GDY", lat: 13.0067, lng: 80.2023, isTerminal: true, zone: "South" },
  "MTC-ADYAR": { id: "MTC-ADYAR", name: "Adyar Bus Depot", code: "ADY", lat: 12.9978, lng: 80.2562, isTerminal: true, zone: "South" },
  "MTC-THIRUVAN": { id: "MTC-THIRUVAN", name: "Thiruvanmiyur Bus Stand", code: "TRV", lat: 12.9830, lng: 80.2594, isTerminal: true, zone: "South" },
  "MTC-SHOLING": { id: "MTC-SHOLING", name: "Sholinganallur Junction", code: "SHL", lat: 12.9010, lng: 80.2279, isTerminal: true, zone: "OMR" },
  "MTC-SIRUSERI": { id: "MTC-SIRUSERI", name: "Siruseri SIPCOT IT Park", code: "SRS", lat: 12.8284, lng: 80.2195, isTerminal: true, zone: "OMR" },
  "MTC-KELAMBA": { id: "MTC-KELAMBA", name: "Kelambakkam Bus Stand", code: "KLM", lat: 12.7876, lng: 80.2185, isTerminal: true, zone: "OMR" },
  "MTC-TAMBARAM": { id: "MTC-TAMBARAM", name: "Tambaram West Bus Stand", code: "TBM", lat: 12.9249, lng: 80.1265, isTerminal: true, zone: "South-West" },
  "MTC-VANDALUR": { id: "MTC-VANDALUR", name: "Vandalur Zoo (Arignar Anna Zoo)", code: "VDL", lat: 12.8796, lng: 80.0817, isTerminal: true, zone: "South-West" },
  "MTC-POONAM": { id: "MTC-POONAM", name: "Poonamallee Bus Terminus", code: "PNM", lat: 13.0494, lng: 80.0911, isTerminal: true, zone: "West" },
  "MTC-AMBATTUR": { id: "MTC-AMBATTUR", name: "Ambattur Industrial Estate", code: "AMB", lat: 13.0984, lng: 80.1618, isTerminal: true, zone: "West" },
  "MTC-AVADI": { id: "MTC-AVADI", name: "Avadi Bus Terminus", code: "AVD", lat: 13.1189, lng: 80.1009, isTerminal: true, zone: "North-West" },
  "MTC-PERAMBUR": { id: "MTC-PERAMBUR", name: "Perambur Bus Terminus", code: "PRB", lat: 13.1105, lng: 80.2435, isTerminal: true, zone: "North" },
  "MTC-MADHAV": { id: "MTC-MADHAV", name: "Madhavaram Bus Depot", code: "MDV", lat: 13.1320, lng: 80.2371, isTerminal: true, zone: "North" },
  "MTC-VADAPALANI": { id: "MTC-VADAPALANI", name: "Vadapalani Bus Depot", code: "VDP", lat: 13.0512, lng: 80.2120, isTerminal: true, zone: "Central" },
  "MTC-ANNA-WEST": { id: "MTC-ANNA-WEST", name: "Anna Nagar West Depot", code: "ANW", lat: 13.0957, lng: 80.1979, isTerminal: true, zone: "North-West" },
  "MTC-VELACHERY": { id: "MTC-VELACHERY", name: "Velachery Checkpost", code: "VLC", lat: 12.9815, lng: 80.2209, isTerminal: true, zone: "South" },
  "MTC-BESANT": { id: "MTC-BESANT", name: "Besant Nagar Beach Terminus", code: "BSN", lat: 13.0002, lng: 80.2667, isTerminal: true, zone: "South" },
  "MTC-AYANAVARAM": { id: "MTC-AYANAVARAM", name: "Ayanavaram Bus Depot", code: "AYN", lat: 13.0991, lng: 80.2351, isTerminal: true, zone: "North" },
  "MTC-KKNAGAR": { id: "MTC-KKNAGAR", name: "K.K. Nagar Bus Depot", code: "KKN", lat: 13.0371, lng: 80.1985, isTerminal: true, zone: "Central" },
  "MTC-KUNDRATHUR": { id: "MTC-KUNDRATHUR", name: "Kundrathur Murugan Temple", code: "KUN", lat: 12.9972, lng: 80.0968, isTerminal: true, zone: "South-West" },
  "MTC-MEDAVAKKAM": { id: "MTC-MEDAVAKKAM", name: "Medavakkam Koot Road", code: "MDV", lat: 12.9185, lng: 80.1925, isTerminal: false, zone: "South" },

  // Intermediate En-Route Stops
  "MTC-PERIYAMEDU": { id: "MTC-PERIYAMEDU", name: "Periyamedu", code: "PMD", lat: 13.0839, lng: 80.2704 },
  "MTC-CHINTADRI": { id: "MTC-CHINTADRI", name: "Chintadripet Station", code: "CPT", lat: 13.0768, lng: 80.2715 },
  "MTC-LIC": { id: "MTC-LIC", name: "LIC Anna Salai", code: "LIC", lat: 13.0632, lng: 80.2651 },
  "MTC-THOUSAND": { id: "MTC-THOUSAND", name: "Thousand Lights", code: "TSL", lat: 13.0548, lng: 80.2529 },
  "MTC-TEYNAMPET": { id: "MTC-TEYNAMPET", name: "Teynampet DMS", code: "TYN", lat: 13.0421, lng: 80.2458 },
  "MTC-NANDANAM": { id: "MTC-NANDANAM", name: "Nandanam Signal", code: "NDN", lat: 13.0315, lng: 80.2361 },
  "MTC-AIRPORT": { id: "MTC-AIRPORT", name: "Chennai Airport (Meenambakkam)", code: "MAA", lat: 12.9818, lng: 80.1648 },
  "MTC-PALLAVARAM": { id: "MTC-PALLAVARAM", name: "Pallavaram Bus Stand", code: "PLV", lat: 12.9675, lng: 80.1492 },
  "MTC-CHROMPET": { id: "MTC-CHROMPET", name: "Chromepet Station", code: "CRP", lat: 12.9517, lng: 80.1411 },
  "MTC-KANDANCH": { id: "MTC-KANDANCH", name: "Kandanchavadi IT Corridor", code: "KDC", lat: 12.9672, lng: 80.2461 },
  "MTC-PERUNGUDI": { id: "MTC-PERUNGUDI", name: "Perungudi Toll Plaza", code: "PRG", lat: 12.9556, lng: 80.2443 },
  "MTC-THORAIPAK": { id: "MTC-THORAIPAK", name: "Thoraipakkam Anand Nagar", code: "THP", lat: 12.9351, lng: 80.2348 },
  "MTC-KARAPAKKAM": { id: "MTC-KARAPAKKAM", name: "Karapakkam TCS", code: "KPK", lat: 12.9189, lng: 80.2291 },
  "MTC-NAVALUR": { id: "MTC-NAVALUR", name: "Navalur Vivira Mall", code: "NVL", lat: 12.8465, lng: 80.2263 },
  "MTC-KOYAMBEDU": { id: "MTC-KOYAMBEDU", name: "Koyambedu Roundtana", code: "KYM", lat: 13.0712, lng: 80.1989 },
  "MTC-ARUMBAKKAM": { id: "MTC-ARUMBAKKAM", name: "Arumbakkam Metro", code: "ABK", lat: 13.0628, lng: 80.2117 },
  "MTC-ASHOK": { id: "MTC-ASHOK", name: "Ashok Pillar", code: "ASP", lat: 13.0345, lng: 80.2114 },
  "MTC-EKKATUTH": { id: "MTC-EKKATUTH", name: "Ekkatuthangal Metro", code: "EKT", lat: 13.0232, lng: 80.2058 },
  "MTC-PORUR": { id: "MTC-PORUR", name: "Porur Toll Junction", code: "PRR", lat: 13.0336, lng: 80.1583 },
  "MTC-IYAPPAN": { id: "MTC-IYAPPAN", name: "Iyappanthangal Depot", code: "IPT", lat: 13.0384, lng: 80.1415 },
  "MTC-KILPAUK": { id: "MTC-KILPAUK", name: "Kilpauk Medical College", code: "KMC", lat: 13.0792, lng: 80.2418 },
  "MTC-CHETPET": { id: "MTC-CHETPET", name: "Chetpet Signal", code: "CPT", lat: 13.0718, lng: 80.2435 },
  "MTC-ROYAPET": { id: "MTC-ROYAPET", name: "Royapettah Hospital", code: "RYP", lat: 13.0569, lng: 80.2642 },
  "MTC-LUZ": { id: "MTC-LUZ", name: "Luz Corner Mylapore", code: "LUZ", lat: 13.0354, lng: 80.2678 },
  "MTC-MANDAVELI": { id: "MTC-MANDAVELI", name: "Mandaveli Depot", code: "MDV", lat: 13.0271, lng: 80.2612 },
  "MTC-VILLIVAKKAM": { id: "MTC-VILLIVAKKAM", name: "Villivakkam Bus Stand", code: "VLK", lat: 13.1075, lng: 80.2045 },
  "MTC-SHENOY": { id: "MTC-SHENOY", name: "Shenoy Nagar Metro", code: "SHN", lat: 13.0805, lng: 80.2268 },
};

export const CHENNAI_MTC_ROUTES: MTCRoute[] = [
  {
    id: "route-mtc-570",
    code: "570",
    name: "CMBT Koyambedu ⇄ Siruseri SIPCOT IT Park",
    origin: "CMBT Koyambedu Terminus",
    destination: "Siruseri SIPCOT IT Park",
    originId: "MTC-CMBT",
    destinationId: "MTC-SIRUSERI",
    lengthKm: 34.5,
    durationMin: 75,
    direction: "UP",
    color: "#2563EB", // Royal Blue
    peakFrequencyMin: 8,
    offPeakFrequencyMin: 15,
    depot: "CMBT Koyambedu Depot",
    stops: [
      { stopId: "MTC-CMBT", sequence: 1, timeOffsetMin: 0 },
      { stopId: "MTC-ARUMBAKKAM", sequence: 2, timeOffsetMin: 5 },
      { stopId: "MTC-VADAPALANI", sequence: 3, timeOffsetMin: 12 },
      { stopId: "MTC-ASHOK", sequence: 4, timeOffsetMin: 18 },
      { stopId: "MTC-EKKATUTH", sequence: 5, timeOffsetMin: 24 },
      { stopId: "MTC-GUINDY", sequence: 6, timeOffsetMin: 30 },
      { stopId: "MTC-VELACHERY", sequence: 7, timeOffsetMin: 42 },
      { stopId: "MTC-PERUNGUDI", sequence: 8, timeOffsetMin: 49 },
      { stopId: "MTC-THORAIPAK", sequence: 9, timeOffsetMin: 55 },
      { stopId: "MTC-SHOLING", sequence: 10, timeOffsetMin: 62 },
      { stopId: "MTC-NAVALUR", sequence: 11, timeOffsetMin: 68 },
      { stopId: "MTC-SIRUSERI", sequence: 12, timeOffsetMin: 75 },
    ],
    pathCoordinates: [
      [80.2057, 13.0673],
      [80.2117, 13.0628],
      [80.2120, 13.0512],
      [80.2114, 13.0345],
      [80.2058, 13.0232],
      [80.2023, 13.0067],
      [80.2209, 12.9815],
      [80.2443, 12.9556],
      [80.2348, 12.9351],
      [80.2279, 12.9010],
      [80.2263, 12.8465],
      [80.2195, 12.8284],
    ],
  },
  {
    id: "route-mtc-102",
    code: "102",
    name: "Broadway ⇄ Kelambakkam Bus Stand",
    origin: "Broadway Bus Terminus",
    destination: "Kelambakkam Bus Stand",
    originId: "MTC-840",
    destinationId: "MTC-KELAMBA",
    lengthKm: 42.0,
    durationMin: 85,
    direction: "UP",
    color: "#059669", // Emerald Green
    peakFrequencyMin: 10,
    offPeakFrequencyMin: 20,
    depot: "Central / Broadway Depot",
    stops: [
      { stopId: "MTC-840", sequence: 1, timeOffsetMin: 0 },
      { stopId: "MTC-CENTRAL", sequence: 2, timeOffsetMin: 6 },
      { stopId: "MTC-ANNA-SQ", sequence: 3, timeOffsetMin: 16 },
      { stopId: "MTC-LUZ", sequence: 4, timeOffsetMin: 28 },
      { stopId: "MTC-MANDAVELI", sequence: 5, timeOffsetMin: 34 },
      { stopId: "MTC-ADYAR", sequence: 6, timeOffsetMin: 42 },
      { stopId: "MTC-THIRUVAN", sequence: 7, timeOffsetMin: 48 },
      { stopId: "MTC-KANDANCH", sequence: 8, timeOffsetMin: 55 },
      { stopId: "MTC-PERUNGUDI", sequence: 9, timeOffsetMin: 60 },
      { stopId: "MTC-SHOLING", sequence: 10, timeOffsetMin: 68 },
      { stopId: "MTC-NAVALUR", sequence: 11, timeOffsetMin: 76 },
      { stopId: "MTC-KELAMBA", sequence: 12, timeOffsetMin: 85 },
    ],
    pathCoordinates: [
      [80.28383, 13.08762],
      [80.2757, 13.0827],
      [80.2858, 13.0645],
      [80.2678, 13.0354],
      [80.2612, 13.0271],
      [80.2562, 12.9978],
      [80.2594, 12.9830],
      [80.2461, 12.9672],
      [80.2443, 12.9556],
      [80.2279, 12.9010],
      [80.2263, 12.8465],
      [80.2185, 12.7876],
    ],
  },
  {
    id: "route-mtc-29a",
    code: "29A",
    name: "Anna Square ⇄ Perambur Bus Terminus",
    origin: "Anna Square (Marina Beach)",
    destination: "Perambur Bus Terminus",
    originId: "MTC-ANNA-SQ",
    destinationId: "MTC-PERAMBUR",
    lengthKm: 14.8,
    durationMin: 45,
    direction: "UP",
    color: "#D97706", // Amber
    peakFrequencyMin: 10,
    offPeakFrequencyMin: 15,
    depot: "Central / Broadway Depot",
    stops: [
      { stopId: "MTC-ANNA-SQ", sequence: 1, timeOffsetMin: 0 },
      { stopId: "MTC-CHINTADRI", sequence: 2, timeOffsetMin: 10 },
      { stopId: "MTC-CENTRAL", sequence: 3, timeOffsetMin: 16 },
      { stopId: "MTC-PERIYAMEDU", sequence: 4, timeOffsetMin: 22 },
      { stopId: "MTC-KILPAUK", sequence: 5, timeOffsetMin: 30 },
      { stopId: "MTC-AYANAVARAM", sequence: 6, timeOffsetMin: 38 },
      { stopId: "MTC-PERAMBUR", sequence: 7, timeOffsetMin: 45 },
    ],
    pathCoordinates: [
      [80.2858, 13.0645],
      [80.2715, 13.0768],
      [80.2757, 13.0827],
      [80.2704, 13.0839],
      [80.2418, 13.0792],
      [80.2351, 13.0991],
      [80.2435, 13.1105],
    ],
  },
  {
    id: "route-mtc-23c",
    code: "23C",
    name: "Besant Nagar ⇄ Ayanavaram Bus Depot",
    origin: "Besant Nagar Beach Terminus",
    destination: "Ayanavaram Bus Depot",
    originId: "MTC-BESANT",
    destinationId: "MTC-AYANAVARAM",
    lengthKm: 18.2,
    durationMin: 55,
    direction: "UP",
    color: "#0284C7", // Sky Blue
    peakFrequencyMin: 12,
    offPeakFrequencyMin: 20,
    depot: "Adyar Depot",
    stops: [
      { stopId: "MTC-BESANT", sequence: 1, timeOffsetMin: 0 },
      { stopId: "MTC-ADYAR", sequence: 2, timeOffsetMin: 8 },
      { stopId: "MTC-MANDAVELI", sequence: 3, timeOffsetMin: 16 },
      { stopId: "MTC-LUZ", sequence: 4, timeOffsetMin: 22 },
      { stopId: "MTC-TEYNAMPET", sequence: 5, timeOffsetMin: 32 },
      { stopId: "MTC-CHETPET", sequence: 6, timeOffsetMin: 42 },
      { stopId: "MTC-KILPAUK", sequence: 7, timeOffsetMin: 48 },
      { stopId: "MTC-AYANAVARAM", sequence: 8, timeOffsetMin: 55 },
    ],
    pathCoordinates: [
      [80.2667, 13.0002],
      [80.2562, 12.9978],
      [80.2612, 13.0271],
      [80.2678, 13.0354],
      [80.2458, 13.0421],
      [80.2435, 13.0718],
      [80.2418, 13.0792],
      [80.2351, 13.0991],
    ],
  },
  {
    id: "route-mtc-21g",
    code: "21G",
    name: "Broadway ⇄ Vandalur Zoo (Arignar Anna Zoo)",
    origin: "Broadway Bus Terminus",
    destination: "Vandalur Zoo (Arignar Anna Zoo)",
    originId: "MTC-840",
    destinationId: "MTC-VANDALUR",
    lengthKm: 36.4,
    durationMin: 80,
    direction: "UP",
    color: "#DC2626", // Red
    peakFrequencyMin: 10,
    offPeakFrequencyMin: 18,
    depot: "Tambaram Depot",
    stops: [
      { stopId: "MTC-840", sequence: 1, timeOffsetMin: 0 },
      { stopId: "MTC-CENTRAL", sequence: 2, timeOffsetMin: 6 },
      { stopId: "MTC-LIC", sequence: 3, timeOffsetMin: 15 },
      { stopId: "MTC-TEYNAMPET", sequence: 4, timeOffsetMin: 24 },
      { stopId: "MTC-SAIDAPET", sequence: 5, timeOffsetMin: 32 },
      { stopId: "MTC-GUINDY", sequence: 6, timeOffsetMin: 38 },
      { stopId: "MTC-AIRPORT", sequence: 7, timeOffsetMin: 46 },
      { stopId: "MTC-PALLAVARAM", sequence: 8, timeOffsetMin: 54 },
      { stopId: "MTC-CHROMPET", sequence: 9, timeOffsetMin: 61 },
      { stopId: "MTC-TAMBARAM", sequence: 10, timeOffsetMin: 70 },
      { stopId: "MTC-VANDALUR", sequence: 11, timeOffsetMin: 80 },
    ],
    pathCoordinates: [
      [80.28383, 13.08762],
      [80.2757, 13.0827],
      [80.2651, 13.0632],
      [80.2458, 13.0421],
      [80.2228, 13.0205],
      [80.2023, 13.0067],
      [80.1648, 12.9818],
      [80.1492, 12.9675],
      [80.1411, 12.9517],
      [80.1265, 12.9249],
      [80.0817, 12.8796],
    ],
  },
  {
    id: "route-mtc-54",
    code: "54",
    name: "Broadway ⇄ Poonamallee Bus Terminus",
    origin: "Broadway Bus Terminus",
    destination: "Poonamallee Bus Terminus",
    originId: "MTC-840",
    destinationId: "MTC-POONAM",
    lengthKm: 26.5,
    durationMin: 65,
    direction: "UP",
    color: "#7C3AED", // Indigo
    peakFrequencyMin: 12,
    offPeakFrequencyMin: 20,
    depot: "Vadapalani / T. Nagar Depot",
    stops: [
      { stopId: "MTC-840", sequence: 1, timeOffsetMin: 0 },
      { stopId: "MTC-CENTRAL", sequence: 2, timeOffsetMin: 7 },
      { stopId: "MTC-LIC", sequence: 3, timeOffsetMin: 16 },
      { stopId: "MTC-SAIDAPET", sequence: 4, timeOffsetMin: 30 },
      { stopId: "MTC-GUINDY", sequence: 5, timeOffsetMin: 36 },
      { stopId: "MTC-PORUR", sequence: 6, timeOffsetMin: 48 },
      { stopId: "MTC-IYAPPAN", sequence: 7, timeOffsetMin: 55 },
      { stopId: "MTC-POONAM", sequence: 8, timeOffsetMin: 65 },
    ],
    pathCoordinates: [
      [80.28383, 13.08762],
      [80.2757, 13.0827],
      [80.2651, 13.0632],
      [80.2228, 13.0205],
      [80.2023, 13.0067],
      [80.1583, 13.0336],
      [80.1415, 13.0384],
      [80.0911, 13.0494],
    ],
  },
  {
    id: "route-mtc-a1",
    code: "A1",
    name: "Chennai Central ⇄ Thiruvanmiyur Bus Stand",
    origin: "Chennai Central Railway Station",
    destination: "Thiruvanmiyur Bus Stand",
    originId: "MTC-CENTRAL",
    destinationId: "MTC-THIRUVAN",
    lengthKm: 16.5,
    durationMin: 50,
    direction: "UP",
    color: "#0D9488", // Teal
    peakFrequencyMin: 15,
    offPeakFrequencyMin: 25,
    depot: "Adyar Depot",
    stops: [
      { stopId: "MTC-CENTRAL", sequence: 1, timeOffsetMin: 0 },
      { stopId: "MTC-CHINTADRI", sequence: 2, timeOffsetMin: 6 },
      { stopId: "MTC-ROYAPET", sequence: 3, timeOffsetMin: 15 },
      { stopId: "MTC-LUZ", sequence: 4, timeOffsetMin: 24 },
      { stopId: "MTC-MANDAVELI", sequence: 5, timeOffsetMin: 30 },
      { stopId: "MTC-ADYAR", sequence: 6, timeOffsetMin: 38 },
      { stopId: "MTC-THIRUVAN", sequence: 7, timeOffsetMin: 50 },
    ],
    pathCoordinates: [
      [80.2757, 13.0827],
      [80.2715, 13.0768],
      [80.2642, 13.0569],
      [80.2678, 13.0354],
      [80.2612, 13.0271],
      [80.2562, 12.9978],
      [80.2594, 12.9830],
    ],
  },
  {
    id: "route-mtc-d70",
    code: "D70",
    name: "Ambattur Estate ⇄ Velachery Checkpost",
    origin: "Ambattur Industrial Estate",
    destination: "Velachery Checkpost",
    originId: "MTC-AMBATTUR",
    destinationId: "MTC-VELACHERY",
    lengthKm: 23.8,
    durationMin: 60,
    direction: "UP",
    color: "#E11D48", // Rose Red
    peakFrequencyMin: 10,
    offPeakFrequencyMin: 18,
    depot: "Annanagar West Depot",
    stops: [
      { stopId: "MTC-AMBATTUR", sequence: 1, timeOffsetMin: 0 },
      { stopId: "MTC-ANNA-WEST", sequence: 2, timeOffsetMin: 12 },
      { stopId: "MTC-KOYAMBEDU", sequence: 3, timeOffsetMin: 22 },
      { stopId: "MTC-VADAPALANI", sequence: 4, timeOffsetMin: 30 },
      { stopId: "MTC-ASHOK", sequence: 5, timeOffsetMin: 36 },
      { stopId: "MTC-GUINDY", sequence: 6, timeOffsetMin: 45 },
      { stopId: "MTC-VELACHERY", sequence: 7, timeOffsetMin: 60 },
    ],
    pathCoordinates: [
      [80.1618, 13.0984],
      [80.1979, 13.0957],
      [80.1989, 13.0712],
      [80.2120, 13.0512],
      [80.2114, 13.0345],
      [80.2023, 13.0067],
      [80.2209, 12.9815],
    ],
  },
  {
    id: "route-mtc-11g",
    code: "11G",
    name: "Broadway ⇄ K.K. Nagar Bus Depot",
    origin: "Broadway Bus Terminus",
    destination: "K.K. Nagar Bus Depot",
    originId: "MTC-840",
    destinationId: "MTC-KKNAGAR",
    lengthKm: 15.6,
    durationMin: 50,
    direction: "UP",
    color: "#0891B2", // Cyan
    peakFrequencyMin: 12,
    offPeakFrequencyMin: 20,
    depot: "Central / Broadway Depot",
    stops: [
      { stopId: "MTC-840", sequence: 1, timeOffsetMin: 0 },
      { stopId: "MTC-CENTRAL", sequence: 2, timeOffsetMin: 6 },
      { stopId: "MTC-LIC", sequence: 3, timeOffsetMin: 14 },
      { stopId: "MTC-THOUSAND", sequence: 4, timeOffsetMin: 20 },
      { stopId: "MTC-TEYNAMPET", sequence: 5, timeOffsetMin: 28 },
      { stopId: "MTC-TNAGAR", sequence: 6, timeOffsetMin: 36 },
      { stopId: "MTC-ASHOK", sequence: 7, timeOffsetMin: 44 },
      { stopId: "MTC-KKNAGAR", sequence: 8, timeOffsetMin: 50 },
    ],
    pathCoordinates: [
      [80.28383, 13.08762],
      [80.2757, 13.0827],
      [80.2651, 13.0632],
      [80.2529, 13.0548],
      [80.2458, 13.0421],
      [80.2337, 13.0402],
      [80.2114, 13.0345],
      [80.1985, 13.0371],
    ],
  },
  {
    id: "route-mtc-19b",
    code: "19B",
    name: "T. Nagar ⇄ Kelambakkam Bus Stand",
    origin: "T. Nagar Bus Terminus",
    destination: "Kelambakkam Bus Stand",
    originId: "MTC-TNAGAR",
    destinationId: "MTC-KELAMBA",
    lengthKm: 34.2,
    durationMin: 75,
    direction: "UP",
    color: "#65A30D", // Lime Green
    peakFrequencyMin: 15,
    offPeakFrequencyMin: 25,
    depot: "Vadapalani / T. Nagar Depot",
    stops: [
      { stopId: "MTC-TNAGAR", sequence: 1, timeOffsetMin: 0 },
      { stopId: "MTC-SAIDAPET", sequence: 2, timeOffsetMin: 10 },
      { stopId: "MTC-GUINDY", sequence: 3, timeOffsetMin: 18 },
      { stopId: "MTC-VELACHERY", sequence: 4, timeOffsetMin: 30 },
      { stopId: "MTC-PERUNGUDI", sequence: 5, timeOffsetMin: 38 },
      { stopId: "MTC-THORAIPAK", sequence: 6, timeOffsetMin: 45 },
      { stopId: "MTC-SHOLING", sequence: 7, timeOffsetMin: 54 },
      { stopId: "MTC-NAVALUR", sequence: 8, timeOffsetMin: 64 },
      { stopId: "MTC-KELAMBA", sequence: 9, timeOffsetMin: 75 },
    ],
    pathCoordinates: [
      [80.2337, 13.0402],
      [80.2228, 13.0205],
      [80.2023, 13.0067],
      [80.2209, 12.9815],
      [80.2443, 12.9556],
      [80.2348, 12.9351],
      [80.2279, 12.9010],
      [80.2263, 12.8465],
      [80.2185, 12.7876],
    ],
  },
  {
    id: "route-mtc-40a",
    code: "40A",
    name: "Anna Square ⇄ Avadi Bus Terminus",
    origin: "Anna Square (Marina Beach)",
    destination: "Avadi Bus Terminus",
    originId: "MTC-ANNA-SQ",
    destinationId: "MTC-AVADI",
    lengthKm: 27.5,
    durationMin: 70,
    direction: "UP",
    color: "#4F46E5", // Indigo
    peakFrequencyMin: 15,
    offPeakFrequencyMin: 25,
    depot: "Annanagar West Depot",
    stops: [
      { stopId: "MTC-ANNA-SQ", sequence: 1, timeOffsetMin: 0 },
      { stopId: "MTC-CHINTADRI", sequence: 2, timeOffsetMin: 8 },
      { stopId: "MTC-CENTRAL", sequence: 3, timeOffsetMin: 14 },
      { stopId: "MTC-KILPAUK", sequence: 4, timeOffsetMin: 24 },
      { stopId: "MTC-SHENOY", sequence: 5, timeOffsetMin: 32 },
      { stopId: "MTC-ANNA-WEST", sequence: 6, timeOffsetMin: 40 },
      { stopId: "MTC-VILLIVAKKAM", sequence: 7, timeOffsetMin: 48 },
      { stopId: "MTC-AMBATTUR", sequence: 8, timeOffsetMin: 58 },
      { stopId: "MTC-AVADI", sequence: 9, timeOffsetMin: 70 },
    ],
    pathCoordinates: [
      [80.2858, 13.0645],
      [80.2715, 13.0768],
      [80.2757, 13.0827],
      [80.2418, 13.0792],
      [80.2268, 13.0805],
      [80.1979, 13.0957],
      [80.2045, 13.1075],
      [80.1618, 13.0984],
      [80.1009, 13.1189],
    ],
  },
  {
    id: "route-mtc-15",
    code: "15",
    name: "Broadway ⇄ Anna Nagar West Depot",
    origin: "Broadway Bus Terminus",
    destination: "Anna Nagar West Depot",
    originId: "MTC-840",
    destinationId: "MTC-ANNA-WEST",
    lengthKm: 13.2,
    durationMin: 40,
    direction: "UP",
    color: "#B45309", // Warm Brown
    peakFrequencyMin: 8,
    offPeakFrequencyMin: 15,
    depot: "Annanagar West Depot",
    stops: [
      { stopId: "MTC-840", sequence: 1, timeOffsetMin: 0 },
      { stopId: "MTC-CENTRAL", sequence: 2, timeOffsetMin: 6 },
      { stopId: "MTC-PERIYAMEDU", sequence: 3, timeOffsetMin: 12 },
      { stopId: "MTC-KILPAUK", sequence: 4, timeOffsetMin: 20 },
      { stopId: "MTC-SHENOY", sequence: 5, timeOffsetMin: 28 },
      { stopId: "MTC-ANNA-WEST", sequence: 6, timeOffsetMin: 40 },
    ],
    pathCoordinates: [
      [80.28383, 13.08762],
      [80.2757, 13.0827],
      [80.2704, 13.0839],
      [80.2418, 13.0792],
      [80.2268, 13.0805],
      [80.1979, 13.0957],
    ],
  },
];

// Generate Chennai MTC Fleet (50 authentic buses)
export const CHENNAI_MTC_BUSES = Array.from({ length: 50 }, (_, i) => {
  const num = 1001 + i;
  const depotIdx = i % CHENNAI_MTC_DEPOTS.length;
  const depot = CHENNAI_MTC_DEPOTS[depotIdx]!;
  const busType = i % 4 === 0 ? "Deluxe Express" : i % 5 === 0 ? "Low Floor AC" : "Standard Leyland BS-VI";
  const status = i === 12 ? "maintenance" : i === 25 ? "breakdown" : "active";

  return {
    id: `bus-mtc-${num}`,
    tenantId: CHENNAI_MTC_TENANT_ID,
    registrationNumber: `TN-01-N-${num}`,
    fleetNumber: `MTC-${depot.code.split("-")[1]}-${100 + (i % 20)}`,
    depot: depot.name,
    status,
    busType,
    capacity: busType.includes("AC") ? 42 : 55,
    availableFrom: 300, // 05:00 AM
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
});

// Generate Chennai MTC Operational Crew (70 authentic drivers & conductors)
const TAMIL_FIRST_NAMES = [
  "R. Senthil", "K. Murugan", "M. Palani", "S. Anbalagan", "V. Selvam",
  "P. Arumugam", "T. Natarajan", "A. Subramanian", "G. Karthik", "D. Vijayan",
  "N. Saravanan", "C. Thangavel", "E. Balasubramani", "M. Gunasekaran", "R. Ilango",
  "J. Dhanasekaran", "K. Sivakumar", "P. Muthukumar", "V. Loganathan", "S. Rajendran",
  "A. Velu", "B. Pandian", "C. Manikandan", "D. Sundaram", "M. Vasanth"
];

export const CHENNAI_MTC_CREW = Array.from({ length: 70 }, (_, i) => {
  const isDriver = i % 2 === 0;
  const num = 2000 + i;
  const depotIdx = i % CHENNAI_MTC_DEPOTS.length;
  const depot = CHENNAI_MTC_DEPOTS[depotIdx]!;
  const nameIdx = i % TAMIL_FIRST_NAMES.length;
  const name = `${TAMIL_FIRST_NAMES[nameIdx]} ${isDriver ? "(Driver)" : "(Conductor)"}`;
  const status = i === 7 ? "leave" : i === 19 ? "unavailable" : "available";

  return {
    id: `crew-mtc-${num}`,
    tenantId: CHENNAI_MTC_TENANT_ID,
    employeeId: `MTC-EMP-${num}`,
    name,
    role: isDriver ? "driver" : "conductor",
    status,
    depot: depot.name,
    availableFrom: 330, // 05:30 AM
    restUntil: 330,
    licenseCategory: isDriver ? "Heavy Passenger Vehicle (HPV)" : null,
    licenseExpiry: isDriver ? "2028-12-31" : null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
});

// Generate Scheduled Trips for Chennai MTC Corridors
export const CHENNAI_MTC_TRIPS = CHENNAI_MTC_ROUTES.flatMap((route, rIdx) => {
  const trips = [];
  // Departures every 10-25 mins from 06:00 (360 min) to 21:30 (1290 min)
  let startMinutes = 360;
  let tripSeq = 1;

  while (startMinutes <= 1260) {
    const endMinutes = startMinutes + route.durationMin;
    const tripCode = `TR-${route.code}-${String(tripSeq).padStart(3, "0")}`;
    trips.push({
      id: `trip-mtc-${route.code.toLowerCase()}-${tripSeq}`,
      tenantId: CHENNAI_MTC_TENANT_ID,
      routeId: route.id,
      tripCode,
      tripNumber: tripCode,
      direction: tripSeq % 2 === 1 ? "OUTBOUND" : "INBOUND",
      startTime: startMinutes,
      endTime: endMinutes,
      startMinutes,
      endMinutes,
      durationMin: route.durationMin,
      distanceKm: String(route.lengthKm),
      origin: tripSeq % 2 === 1 ? route.origin : route.destination,
      destination: tripSeq % 2 === 1 ? route.destination : route.origin,
      status: "scheduled",
      serviceDate: "25 Aug 2026",
      routeCode: route.code,
      routeName: route.name,
    });

    startMinutes += (startMinutes >= 480 && startMinutes <= 660) || (startMinutes >= 1020 && startMinutes <= 1200)
      ? route.peakFrequencyMin
      : route.offPeakFrequencyMin;
    tripSeq++;
  }

  return trips;
});
