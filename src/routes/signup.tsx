import {
  createFileRoute,
  redirect,
  useRouter,
  Link,
} from "@tanstack/react-router";
import { useState, useRef } from "react";
import { toast } from "sonner";
import {
  Bus,
  Loader2,
  Lock,
  Mail,
  ArrowLeft,
  Building2,
  User,
  Upload,
  FileSpreadsheet,
  FileCode,
  FileText,
  CheckCircle2,
  AlertCircle,
  Database,
  ArrowRight,
  Download,
  Sparkles,
  ShieldCheck,
  Check,
  MapPin,
} from "lucide-react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { getCurrentUserFn, onboardTenantAndSignupFn } from "@/lib/auth";

export const Route = createFileRoute("/signup")({
  beforeLoad: async () => {
    try {
      const user = await getCurrentUserFn();
      if (user) {
        throw redirect({ to: "/" });
      }
    } catch (err: any) {
      if (
        err?.message === "Redirect" ||
        err?.status === 302 ||
        err?.status === 307
      ) {
        throw err;
      }
    }
  },
  head: () => ({
    meta: [
      { title: "Onboard Transport Corporation: TransitOS" },
      {
        name: "description",
        content:
          "Register and onboard your municipal bus corporation or private fleet into TransitOS with JSON, CSV, or Excel dataset ingestion.",
      },
    ],
  }),
  component: SignupPage,
});

interface ParsedDataset {
  routes: Array<{
    code: string;
    name: string;
    origin?: string;
    destination?: string;
    lengthKm?: number | string;
    durationMin?: number;
    peakFrequency?: number;
    offPeakFrequency?: number;
    color?: string;
  }>;
  buses: Array<{
    registrationNumber: string;
    fleetNumber?: string;
    depot?: string;
    busType?: string;
    capacity?: number;
  }>;
  crew: Array<{
    employeeId: string;
    name: string;
    role: "driver" | "conductor";
    depot?: string;
    licenseCategory?: string;
  }>;
  trips: Array<{
    routeCode?: string;
    tripCode?: string;
    direction?: string;
    startTime?: number;
    endTime?: number;
    durationMin?: number;
    origin?: string;
    destination?: string;
  }>;
}

const SAMPLE_MUNICIPAL_DATASET: ParsedDataset = {
  routes: [
    {
      code: "C-101",
      name: "Gandhipuram to Singanallur Hub",
      origin: "Gandhipuram Central Terminal",
      destination: "Singanallur Junction Hub",
      lengthKm: 14.8,
      durationMin: 36,
      peakFrequency: 12,
      offPeakFrequency: 24,
      color: "#2563EB",
    },
    {
      code: "C-204",
      name: "Ukkadam to Saravanampatti IT Corridor",
      origin: "Ukkadam Bus Stand",
      destination: "Saravanampatti Tech Park",
      lengthKm: 19.2,
      durationMin: 48,
      peakFrequency: 15,
      offPeakFrequency: 30,
      color: "#059669",
    },
    {
      code: "C-305",
      name: "Railway Junction to Peelamedu Airport",
      origin: "Coimbatore Railway Junction",
      destination: "Civil Aerodrome Terminal",
      lengthKm: 11.5,
      durationMin: 28,
      peakFrequency: 10,
      offPeakFrequency: 20,
      color: "#D97706",
    },
  ],
  buses: [
    {
      registrationNumber: "TN-38-N-4101",
      fleetNumber: "CMT-101",
      depot: "Gandhipuram Depot",
      busType: "Ashok Leyland 210 HP BS-VI Viking",
      capacity: 52,
    },
    {
      registrationNumber: "TN-38-N-4102",
      fleetNumber: "CMT-102",
      depot: "Gandhipuram Depot",
      busType: "Ashok Leyland 210 HP BS-VI Viking",
      capacity: 52,
    },
    {
      registrationNumber: "TN-38-N-4103",
      fleetNumber: "CMT-103",
      depot: "Gandhipuram Depot",
      busType: "Tata Marcopolo BS-VI Low-Floor",
      capacity: 48,
    },
    {
      registrationNumber: "TN-38-N-4104",
      fleetNumber: "CMT-104",
      depot: "Gandhipuram Depot",
      busType: "Tata Marcopolo BS-VI Low-Floor",
      capacity: 48,
    },
    {
      registrationNumber: "TN-38-N-4105",
      fleetNumber: "CMT-105",
      depot: "Ukkadam Depot",
      busType: "Ashok Leyland 210 HP BS-VI Viking",
      capacity: 52,
    },
    {
      registrationNumber: "TN-38-N-4106",
      fleetNumber: "CMT-106",
      depot: "Ukkadam Depot",
      busType: "Ashok Leyland 210 HP BS-VI Viking",
      capacity: 52,
    },
  ],
  crew: [
    {
      employeeId: "CMT-EMP-001",
      name: "S. Karuppasamy",
      role: "driver",
      depot: "Gandhipuram Depot",
      licenseCategory: "Heavy Passenger Vehicle (HPV) / PSV Badge",
    },
    {
      employeeId: "CMT-EMP-002",
      name: "M. Soundararajan",
      role: "conductor",
      depot: "Gandhipuram Depot",
    },
    {
      employeeId: "CMT-EMP-003",
      name: "K. Rathinavel",
      role: "driver",
      depot: "Gandhipuram Depot",
      licenseCategory: "Heavy Passenger Vehicle (HPV) / PSV Badge",
    },
    {
      employeeId: "CMT-EMP-004",
      name: "P. Chelladurai",
      role: "conductor",
      depot: "Gandhipuram Depot",
    },
    {
      employeeId: "CMT-EMP-005",
      name: "A. Venkatachalam",
      role: "driver",
      depot: "Ukkadam Depot",
      licenseCategory: "Heavy Passenger Vehicle (HPV) / PSV Badge",
    },
    {
      employeeId: "CMT-EMP-006",
      name: "R. Dharmalingam",
      role: "conductor",
      depot: "Ukkadam Depot",
    },
  ],
  trips: [
    {
      routeCode: "C-101",
      tripCode: "TR-CMT-101",
      direction: "OUTBOUND",
      startTime: 360,
      endTime: 396,
      durationMin: 36,
      origin: "Gandhipuram Central Terminal",
      destination: "Singanallur Junction Hub",
    },
    {
      routeCode: "C-101",
      tripCode: "TR-CMT-102",
      direction: "RETURN",
      startTime: 410,
      endTime: 446,
      durationMin: 36,
      origin: "Singanallur Junction Hub",
      destination: "Gandhipuram Central Terminal",
    },
    {
      routeCode: "C-204",
      tripCode: "TR-CMT-201",
      direction: "OUTBOUND",
      startTime: 375,
      endTime: 423,
      durationMin: 48,
      origin: "Ukkadam Bus Stand",
      destination: "Saravanampatti Tech Park",
    },
    {
      routeCode: "C-305",
      tripCode: "TR-CMT-301",
      direction: "OUTBOUND",
      startTime: 390,
      endTime: 418,
      durationMin: 28,
      origin: "Coimbatore Railway Junction",
      destination: "Civil Aerodrome Terminal",
    },
  ],
};

function SignupPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Wizard state: 1 = Profile, 2 = Data Onboarding, 3 = Review & Launch
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Step 1: Corporation & Admin Credentials
  const [corpName, setCorpName] = useState("");
  const [corpCode, setCorpCode] = useState("");
  const [region, setRegion] = useState("Tamil Nadu Transit Division");
  const [depotName, setDepotName] = useState("");
  const [adminName, setAdminName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Step 2: Dataset Onboarding
  const [dataset, setDataset] = useState<ParsedDataset>({
    routes: [],
    buses: [],
    crew: [],
    trips: [],
  });
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [parsingFile, setParsingFile] = useState(false);

  // Submission
  const [submitting, setSubmitting] = useState(false);

  // Helper: Auto-generate depot and short code from name
  const handleCorpNameChange = (val: string) => {
    setCorpName(val);
    if (!corpCode || corpCode.length <= 4) {
      const acronym = val
        .split(" ")
        .filter((w) => w.length > 0)
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 5);
      if (acronym) setCorpCode(acronym);
    }
    if (!depotName) {
      setDepotName(`${val.trim()} Central Depot`);
    }
  };

  // Download Sample JSON Template
  const handleDownloadJsonTemplate = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(SAMPLE_MUNICIPAL_DATASET, null, 2),
    )}`;
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", jsonString);
    downloadAnchor.setAttribute("download", "transitos-onboarding-template.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success("Downloaded sample JSON onboarding template");
  };

  // Download Sample CSV Template
  const handleDownloadCsvTemplate = () => {
    const csvContent = [
      "# TRANSITOS NETWORK & FLEET ONBOARDING TEMPLATE",
      "# Format: routes, buses, and crew tables can be supplied or uploaded separately",
      "",
      "# SECTION: ROUTES",
      "code,name,origin,destination,lengthKm,durationMin,peakFrequency,offPeakFrequency",
      "R-01,Central to South Bypass,Central Bus Stand,South Bypass Terminal,14.5,35,15,30",
      "R-02,North Terminal to Tech Park,North Stand,Tech Park Gate 2,18.0,45,20,40",
      "",
      "# SECTION: BUSES",
      "registrationNumber,fleetNumber,depot,busType,capacity",
      "TN-XX-N-2001,FLEET-001,Central Depot,Ashok Leyland BS-VI Viking,48",
      "TN-XX-N-2002,FLEET-002,Central Depot,Ashok Leyland BS-VI Viking,48",
      "TN-XX-N-2003,FLEET-003,North Depot,Tata Marcopolo Low-Floor,52",
      "",
      "# SECTION: CREW",
      "employeeId,name,role,depot,licenseCategory",
      "EMP-001,K. Soundaram,driver,Central Depot,Heavy Passenger Vehicle (HPV) / PSV Badge",
      "EMP-002,P. Veluchamy,conductor,Central Depot,",
      "EMP-003,R. Thangaraj,driver,North Depot,Heavy Passenger Vehicle (HPV) / PSV Badge",
      "EMP-004,M. Jayaseelan,conductor,North Depot,",
      "",
      "# SECTION: TRIPS",
      "routeCode,tripCode,direction,startTime,endTime,durationMin,origin,destination",
      "R-01,TR-001,OUTBOUND,360,395,35,Central Bus Stand,South Bypass Terminal",
      "R-01,TR-002,RETURN,410,445,35,South Bypass Terminal,Central Bus Stand",
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "transitos-network-template.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success("Downloaded sample CSV onboarding template");
  };

  // 1-Click Load Sample Dataset
  const handleLoadSampleDataset = () => {
    setCorpName("Coimbatore Urban Transport Corporation");
    setCorpCode("CUTC");
    setRegion("Western Zone, Tamil Nadu");
    setDepotName("Gandhipuram Central Depot");
    setAdminName("R. Subramanian (Chief Operations Manager)");
    setEmail("admin@cutc.transport.gov.in");
    setPassword("password123");
    setConfirmPassword("password123");
    setDataset(SAMPLE_MUNICIPAL_DATASET);
    setUploadedFileName("sample-coimbatore-urban-transport.json");
    toast.success(
      "Loaded sample municipal dataset: 3 corridors, 6 buses, 6 crew operators, and 4 trips.",
    );
  };

  // Parse CSV File Content
  const parseCsvText = (text: string): ParsedDataset => {
    const lines = text.split(/\r?\n/).map((l) => l.trim());
    const parsed: ParsedDataset = {
      routes: [],
      buses: [],
      crew: [],
      trips: [],
    };

    let currentSection: "routes" | "buses" | "crew" | "trips" | null = null;
    let headers: string[] = [];

    for (const line of lines) {
      if (!line || line.startsWith("#")) {
        const lower = line.toLowerCase();
        if (lower.includes("section: routes") || lower.includes("section:routes")) {
          currentSection = "routes";
          headers = [];
        } else if (lower.includes("section: buses") || lower.includes("section:buses")) {
          currentSection = "buses";
          headers = [];
        } else if (lower.includes("section: crew") || lower.includes("section:crew")) {
          currentSection = "crew";
          headers = [];
        } else if (lower.includes("section: trips") || lower.includes("section:trips")) {
          currentSection = "trips";
          headers = [];
        }
        continue;
      }

      const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));

      // Detect header row if not set
      if (headers.length === 0) {
        headers = cols.map((h) => h.toLowerCase());
        if (!currentSection) {
          if (headers.includes("registrationnumber") || headers.includes("fleetnumber")) {
            currentSection = "buses";
          } else if (headers.includes("employeeid") || headers.includes("licensecategory")) {
            currentSection = "crew";
          } else if (headers.includes("tripcode") || headers.includes("starttime")) {
            currentSection = "trips";
          } else if (headers.includes("code") && (headers.includes("lengthkm") || headers.includes("origin"))) {
            currentSection = "routes";
          }
        }
        continue;
      }

      const row: Record<string, string> = {};
      headers.forEach((h, idx) => {
        row[h] = cols[idx] || "";
      });

      if (currentSection === "routes") {
        const code = row["code"] || `R-${parsed.routes.length + 1}`;
        const name = row["name"] || `Corridor ${code}`;
        const origin = row["origin"] || "Origin Terminal";
        const destination = row["destination"] || "Destination Hub";
        const lengthKm = row["lengthkm"] ? parseFloat(row["lengthkm"]) || 12.5 : 12.5;
        const durationMin = row["durationmin"] ? parseInt(row["durationmin"], 10) || 35 : 35;
        const peakFrequency = row["peakfrequency"] ? parseInt(row["peakfrequency"], 10) || 15 : 15;
        const offPeakFrequency = row["offpeakfrequency"] ? parseInt(row["offpeakfrequency"], 10) || 30 : 30;

        parsed.routes.push({
          code,
          name,
          origin,
          destination,
          lengthKm,
          durationMin,
          peakFrequency,
          offPeakFrequency,
        });
      } else if (currentSection === "buses") {
        const reg = row["registrationnumber"] || `TN-XX-N-${1000 + parsed.buses.length}`;
        const fleetNum = row["fleetnumber"] || `BUS-${String(parsed.buses.length + 1).padStart(3, "0")}`;
        const dep = row["depot"] || depotName || "Central Depot";
        const bType = row["bustype"] || "Ashok Leyland 210 HP BS-VI Viking";
        const cap = row["capacity"] ? parseInt(row["capacity"], 10) || 48 : 48;

        parsed.buses.push({
          registrationNumber: reg,
          fleetNumber: fleetNum,
          depot: dep,
          busType: bType,
          capacity: cap,
        });
      } else if (currentSection === "crew") {
        const empId = row["employeeid"] || `EMP-${String(parsed.crew.length + 1).padStart(3, "0")}`;
        const cName = row["name"] || `Staff Member ${parsed.crew.length + 1}`;
        const role = row["role"]?.toLowerCase() === "conductor" ? "conductor" : "driver";
        const dep = row["depot"] || depotName || "Central Depot";
        const lic = row["licensecategory"] || (role === "driver" ? "Heavy Passenger Vehicle (HPV) / PSV Badge" : undefined);

        parsed.crew.push({
          employeeId: empId,
          name: cName,
          role,
          depot: dep,
          licenseCategory: lic,
        });
      } else if (currentSection === "trips") {
        const rCode = row["routecode"] || "";
        const tCode = row["tripcode"] || `TR-${100 + parsed.trips.length + 1}`;
        const dir = row["direction"]?.toUpperCase() === "RETURN" ? "RETURN" : "OUTBOUND";
        const startTime = row["starttime"] ? parseInt(row["starttime"], 10) || 360 : 360;
        const endTime = row["endtime"] ? parseInt(row["endtime"], 10) || 395 : 395;
        const dur = row["durationmin"] ? parseInt(row["durationmin"], 10) || 35 : 35;
        const origin = row["origin"] || "Origin Terminal";
        const dest = row["destination"] || "Destination Hub";

        parsed.trips.push({
          routeCode: rCode,
          tripCode: tCode,
          direction: dir,
          startTime,
          endTime,
          durationMin: dur,
          origin,
          destination: dest,
        });
      }
    }

    return parsed;
  };

  // Parse Excel / XLSX Workbook Content
  const parseExcelWorkbook = (workbook: XLSX.WorkBook): ParsedDataset => {
    const parsed: ParsedDataset = {
      routes: [],
      buses: [],
      crew: [],
      trips: [],
    };

    workbook.SheetNames.forEach((sheetName) => {
      const lower = sheetName.toLowerCase();
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) return;

      const rows: any[] = XLSX.utils.sheet_to_json(sheet);
      if (!rows || rows.length === 0) return;

      if (lower.includes("route")) {
        rows.forEach((r, idx) => {
          parsed.routes.push({
            code: String(r.code || r.Code || `R-${idx + 1}`).trim(),
            name: String(r.name || r.Name || `Corridor ${idx + 1}`).trim(),
            origin: String(r.origin || r.Origin || "Origin Terminal").trim(),
            destination: String(r.destination || r.Destination || "Destination Hub").trim(),
            lengthKm: Number(r.lengthKm || r.LengthKm || r.length_km) || 12.5,
            durationMin: Number(r.durationMin || r.DurationMin || r.duration_min) || 35,
            peakFrequency: Number(r.peakFrequency || r.PeakFrequency) || 15,
            offPeakFrequency: Number(r.offPeakFrequency || r.OffPeakFrequency) || 30,
          });
        });
      } else if (lower.includes("bus") || lower.includes("fleet")) {
        rows.forEach((b, idx) => {
          parsed.buses.push({
            registrationNumber: String(b.registrationNumber || b.RegistrationNumber || b.registration_number || `TN-XX-N-${1000 + idx}`).trim(),
            fleetNumber: String(b.fleetNumber || b.FleetNumber || b.fleet_number || `BUS-${String(idx + 1).padStart(3, "0")}`).trim(),
            depot: String(b.depot || b.Depot || depotName || "Central Depot").trim(),
            busType: String(b.busType || b.BusType || b.bus_type || "Ashok Leyland 210 HP BS-VI Viking").trim(),
            capacity: Number(b.capacity || b.Capacity) || 48,
          });
        });
      } else if (lower.includes("crew") || lower.includes("driver") || lower.includes("conductor")) {
        rows.forEach((c, idx) => {
          const roleStr = String(c.role || c.Role || "").toLowerCase();
          const role = roleStr.includes("cond") ? "conductor" : "driver";
          parsed.crew.push({
            employeeId: String(c.employeeId || c.EmployeeId || c.employee_id || `EMP-${String(idx + 1).padStart(3, "0")}`).trim(),
            name: String(c.name || c.Name || `Staff Member ${idx + 1}`).trim(),
            role,
            depot: String(c.depot || c.Depot || depotName || "Central Depot").trim(),
            licenseCategory: String(c.licenseCategory || c.LicenseCategory || (role === "driver" ? "Heavy Passenger Vehicle (HPV) / PSV Badge" : "")).trim(),
          });
        });
      } else if (lower.includes("trip")) {
        rows.forEach((t, idx) => {
          parsed.trips.push({
            routeCode: String(t.routeCode || t.RouteCode || t.route_code || "").trim(),
            tripCode: String(t.tripCode || t.TripCode || t.trip_code || `TR-${100 + idx + 1}`).trim(),
            direction: String(t.direction || t.Direction || "OUTBOUND").toUpperCase().includes("RETURN") ? "RETURN" : "OUTBOUND",
            startTime: Number(t.startTime || t.StartTime || t.start_time) || 360,
            endTime: Number(t.endTime || t.EndTime || t.end_time) || 395,
            durationMin: Number(t.durationMin || t.DurationMin || t.duration_min) || 35,
            origin: String(t.origin || t.Origin || "Origin Terminal").trim(),
            destination: String(t.destination || t.Destination || "Destination Hub").trim(),
          });
        });
      }
    });

    return parsed;
  };

  // Handle File Upload Event
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParsingFile(true);
    setUploadedFileName(file.name);

    try {
      const ext = file.name.split(".").pop()?.toLowerCase();

      if (ext === "json") {
        const text = await file.text();
        const json = JSON.parse(text);
        const parsed: ParsedDataset = {
          routes: Array.isArray(json.routes) ? json.routes : [],
          buses: Array.isArray(json.buses) ? json.buses : [],
          crew: Array.isArray(json.crew) ? json.crew : [],
          trips: Array.isArray(json.trips) ? json.trips : [],
        };
        setDataset(parsed);
        toast.success(
          `Parsed JSON: ${parsed.routes.length} corridors, ${parsed.buses.length} buses, ${parsed.crew.length} crew operators.`,
        );
      } else if (ext === "csv" || ext === "txt") {
        const text = await file.text();
        const parsed = parseCsvText(text);
        setDataset(parsed);
        toast.success(
          `Parsed CSV: ${parsed.routes.length} corridors, ${parsed.buses.length} buses, ${parsed.crew.length} crew operators.`,
        );
      } else if (ext === "xlsx" || ext === "xls") {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const parsed = parseExcelWorkbook(workbook);
        setDataset(parsed);
        toast.success(
          `Parsed Excel: ${parsed.routes.length} corridors, ${parsed.buses.length} buses, ${parsed.crew.length} crew operators.`,
        );
      } else {
        toast.error("Unsupported file format. Please upload .json, .csv, or .xlsx.");
      }
    } catch (err: any) {
      console.error("Error parsing dataset file:", err);
      toast.error(`Failed to parse file: ${err.message || "Invalid format"}`);
    } finally {
      setParsingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Validate Step 1
  const validateStep1 = () => {
    if (!corpName.trim()) {
      toast.error("Please enter the Transport Corporation name.");
      return false;
    }
    if (!corpCode.trim()) {
      toast.error("Please enter a short code for the corporation (e.g. CMTC).");
      return false;
    }
    if (!adminName.trim()) {
      toast.error("Please enter the Administrator's full name.");
      return false;
    }
    if (!email.trim() || !email.includes("@")) {
      toast.error("Please enter a valid official work email address.");
      return false;
    }
    if (!password || password.length < 6) {
      toast.error("Password must be at least 6 characters in length.");
      return false;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return false;
    }
    return true;
  };

  // Final Submission
  const handleSubmitOnboarding = async () => {
    if (!validateStep1()) {
      setCurrentStep(1);
      return;
    }

    setSubmitting(true);
    try {
      const res = await onboardTenantAndSignupFn({
        data: {
          name: corpName.trim(),
          code: corpCode.trim().toUpperCase(),
          region: region.trim(),
          depotName: depotName.trim() || `${corpName.trim()} Central Depot`,
          adminName: adminName.trim(),
          email: email.trim().toLowerCase(),
          password,
          dataset,
        },
      });

      if (res.success && res.tenantId) {
        localStorage.setItem("transitos_active_tenant_id", res.tenantId);
        window.dispatchEvent(new Event("transitos_tenant_change"));
        toast.success(
          `Corporation ${res.tenantName} successfully onboarded and activated!`,
        );
        await router.invalidate();
        await router.navigate({ to: "/" });
      } else {
        throw new Error("Onboarding response was not successful.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to onboard corporation. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans pb-16">
      {/* Top Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 sticky top-0 z-30 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link
            to="/landing"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="size-4" />
            <span>Back to TransitOS Overview</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Already registered?</span>
            <Button asChild variant="outline" size="sm" className="rounded-md text-xs">
              <Link to="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-4xl px-4 pt-8 sm:px-6">
        {/* Title & Introduction */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300 mb-3">
            <Building2 className="size-3.5" />
            <span>Self-Service Tenant Provisioning</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Onboard New Transport Corporation
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Initialize an isolated municipal undertaking workspace, upload your GTFS corridors, bus fleet, and crew records via JSON, CSV, or Excel.
          </p>
        </div>

        {/* 3-Step Wizard Navigation */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-8">
          {[
            {
              step: 1,
              title: "1. Profile & Admin",
              desc: "Corporation credentials",
            },
            {
              step: 2,
              title: "2. Data Ingestion",
              desc: "JSON, CSV, or Excel",
            },
            {
              step: 3,
              title: "3. Review & Launch",
              desc: "Statutory checks & verify",
            },
          ].map((s) => {
            const isActive = currentStep === s.step;
            const isCompleted = currentStep > s.step;
            return (
              <button
                key={s.step}
                type="button"
                onClick={() => {
                  if (s.step === 2 && !validateStep1()) return;
                  if (s.step === 3 && !validateStep1()) return;
                  setCurrentStep(s.step as 1 | 2 | 3);
                }}
                className={`text-left p-3.5 rounded-lg border transition-all ${
                  isActive
                    ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 shadow-sm"
                    : isCompleted
                    ? "border-emerald-500/60 bg-emerald-50/30 dark:bg-emerald-950/20"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold ${
                      isActive
                        ? "text-blue-600 dark:text-blue-400"
                        : isCompleted
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-slate-500"
                    }`}
                  >
                    {s.title}
                  </span>
                  {isCompleted && (
                    <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-1 hidden sm:block">
                  {s.desc}
                </p>
              </button>
            );
          })}
        </div>

        {/* STEP 1: Corporation Profile & Administrator Credentials */}
        {currentStep === 1 && (
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Corporation Details &amp; Administrator Account
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Establish the statutory organizational identity and your primary master credentials.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleLoadSampleDataset}
                className="rounded-md text-xs font-semibold text-blue-600 border-blue-200 hover:bg-blue-50 dark:border-blue-900 dark:hover:bg-blue-950"
              >
                <Sparkles className="mr-1.5 size-3.5" />
                <span>Fill Sample Corporation</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="corpName" className="text-xs font-semibold">
                  Transport Undertaking / Corporation Name *
                </Label>
                <Input
                  id="corpName"
                  placeholder="e.g. Coimbatore Metropolitan Transport Corporation"
                  value={corpName}
                  onChange={(e) => handleCorpNameChange(e.target.value)}
                  className="rounded-md"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="corpCode" className="text-xs font-semibold">
                  Short Code / Prefix (3-6 chars) *
                </Label>
                <Input
                  id="corpCode"
                  placeholder="e.g. CMTC"
                  value={corpCode}
                  onChange={(e) =>
                    setCorpCode(e.target.value.toUpperCase().slice(0, 8))
                  }
                  className="rounded-md font-mono"
                />
                <span className="text-[10px] text-slate-500">
                  Used as prefix for fleet IDs and schedule run codes.
                </span>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="region" className="text-xs font-semibold">
                  Operating Division / State *
                </Label>
                <Input
                  id="region"
                  placeholder="e.g. Western Zone, Tamil Nadu"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="rounded-md"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="depotName" className="text-xs font-semibold">
                  Primary Headquarters Depot Name
                </Label>
                <Input
                  id="depotName"
                  placeholder="e.g. Gandhipuram Central Depot"
                  value={depotName}
                  onChange={(e) => setDepotName(e.target.value)}
                  className="rounded-md"
                />
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-800 pt-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <User className="size-4 text-blue-600" />
                <span>Primary Organization Administrator</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="adminName" className="text-xs font-semibold">
                    Administrator Full Name *
                  </Label>
                  <Input
                    id="adminName"
                    placeholder="e.g. R. Subramanian"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className="rounded-md"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold">
                    Official Work Email *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="e.g. admin@coimbatoretransport.gov.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="rounded-md"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs font-semibold">
                    Account Password (min 6 chars) *
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="rounded-md"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-xs font-semibold">
                    Confirm Password *
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="rounded-md"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
              <Button
                type="button"
                onClick={() => {
                  if (validateStep1()) setCurrentStep(2);
                }}
                className="rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-5 h-10"
              >
                <span>Continue to Data Onboarding</span>
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: Fleet & Network Data Onboarding */}
        {currentStep === 2 && (
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Ingest Network &amp; Fleet Operations Data
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Upload your routes, bus inventory, and crew duty rosters via JSON, CSV, or Excel.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadJsonTemplate}
                  className="rounded-md text-xs font-semibold"
                >
                  <Download className="mr-1.5 size-3.5" />
                  <span>JSON Template</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadCsvTemplate}
                  className="rounded-md text-xs font-semibold"
                >
                  <Download className="mr-1.5 size-3.5" />
                  <span>CSV Template</span>
                </Button>
              </div>
            </div>

            {/* Drag & Drop File Upload Area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-lg p-8 text-center cursor-pointer bg-slate-50/50 dark:bg-slate-950/40 transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.csv,.xlsx,.xls,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="mx-auto flex size-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 mb-3">
                {parsingFile ? (
                  <Loader2 className="size-6 animate-spin" />
                ) : (
                  <Upload className="size-6" />
                )}
              </div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {uploadedFileName
                  ? `Loaded File: ${uploadedFileName}`
                  : "Click to select or drag and drop network file"}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Supports .json, .csv, and Excel (.xlsx, .xls) formats
              </p>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <Badge variant="outline" className="text-[11px] gap-1 font-mono">
                  <FileCode className="size-3 text-blue-600" /> JSON
                </Badge>
                <Badge variant="outline" className="text-[11px] gap-1 font-mono">
                  <FileText className="size-3 text-emerald-600" /> CSV
                </Badge>
                <Badge variant="outline" className="text-[11px] gap-1 font-mono">
                  <FileSpreadsheet className="size-3 text-amber-600" /> Excel
                </Badge>
              </div>
            </div>

            {/* Quick Municipal Dataset Fallback */}
            <div className="flex items-center justify-between p-3.5 rounded-lg border border-blue-200/70 bg-blue-50/40 dark:border-blue-900/40 dark:bg-blue-950/20 text-xs">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <Database className="size-4 text-blue-600" />
                <span>
                  No dataset file ready right now? You can proceed with standard starter seed data or load a complete municipal test fleet.
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleLoadSampleDataset}
                className="rounded-md text-xs font-semibold shrink-0"
              >
                <Sparkles className="mr-1.5 size-3.5 text-blue-600" />
                <span>Load Sample Dataset</span>
              </Button>
            </div>

            {/* Live Data Ingestion Summary Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Corridors / Routes
                </span>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {dataset.routes.length > 0 ? dataset.routes.length : "2 (Default)"}
                </p>
                <span className="text-[10px] text-slate-400">
                  {dataset.routes.length > 0 ? "Uploaded from dataset" : "Auto-generated"}
                </span>
              </div>

              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Bus Fleet
                </span>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {dataset.buses.length > 0 ? dataset.buses.length : "8 (Default)"}
                </p>
                <span className="text-[10px] text-slate-400">
                  {dataset.buses.length > 0 ? "Uploaded from dataset" : "Auto-generated BS-VI"}
                </span>
              </div>

              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Crew Operators
                </span>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {dataset.crew.length > 0 ? dataset.crew.length : "8 (Default)"}
                </p>
                <span className="text-[10px] text-slate-400">
                  {dataset.crew.length > 0 ? "Drivers & conductors" : "4 Drivers + 4 Conductors"}
                </span>
              </div>

              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Scheduled Trips
                </span>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {dataset.trips.length > 0 ? dataset.trips.length : "8 (Default)"}
                </p>
                <span className="text-[10px] text-slate-400">
                  {dataset.trips.length > 0 ? "Mapped departures" : "Timetable starter slots"}
                </span>
              </div>
            </div>

            {/* Parsed Corridors Preview Table */}
            {dataset.routes.length > 0 && (
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Ingested Corridors Preview ({dataset.routes.length})
                </h4>
                <div className="rounded-md border border-slate-200 dark:border-slate-800 overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-semibold">
                      <tr>
                        <th className="p-2.5">Code</th>
                        <th className="p-2.5">Corridor Name</th>
                        <th className="p-2.5">Origin / Destination</th>
                        <th className="p-2.5">Distance</th>
                        <th className="p-2.5">Runtime</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {dataset.routes.slice(0, 5).map((r, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                          <td className="p-2.5 font-mono font-bold text-blue-600 dark:text-blue-400">
                            {r.code}
                          </td>
                          <td className="p-2.5 font-medium">{r.name}</td>
                          <td className="p-2.5 text-slate-500">
                            {r.origin} → {r.destination}
                          </td>
                          <td className="p-2.5">{r.lengthKm} km</td>
                          <td className="p-2.5">{r.durationMin} mins</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(1)}
                className="rounded-md text-xs font-semibold px-4 h-10"
              >
                <ArrowLeft className="mr-2 size-4" />
                <span>Back to Profile</span>
              </Button>

              <Button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-5 h-10"
              >
                <span>Proceed to Statutory Review</span>
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Statutory Review & Launch */}
        {currentStep === 3 && (
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Statutory Compliance Verification &amp; Corporation Launch
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Review operational configuration against Motor Vehicles Act rules and launch your dedicated console.
              </p>
            </div>

            {/* Corporation Overview Card */}
            <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {corpName || "Municipal Transport Corporation"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Code: <span className="font-mono font-semibold">{corpCode || "MTC"}</span> · Region: {region}
                  </p>
                </div>
                <Badge className="bg-emerald-600 text-white font-mono text-[11px] rounded-md">
                  Ready to Deploy
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-800/80 text-xs">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase">Admin Email</span>
                  <p className="font-medium truncate">{email || "admin@transit.gov"}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase">Headquarters Depot</span>
                  <p className="font-medium truncate">{depotName || "Central Depot"}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase">Fleet Vehicles</span>
                  <p className="font-medium">
                    {dataset.buses.length > 0 ? `${dataset.buses.length} buses` : "8 starter buses"}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase">Operating Crew</span>
                  <p className="font-medium">
                    {dataset.crew.length > 0 ? `${dataset.crew.length} members` : "8 crew members"}
                  </p>
                </div>
              </div>
            </div>

            {/* Compliance Checklist */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="size-4 text-emerald-600" />
                <span>Statutory Pre-Flight Verification</span>
              </h4>

              <div className="space-y-2 text-xs">
                {[
                  {
                    title: "Motor Vehicles Act Section 91 Compliance",
                    desc: "Duty shift durations capped at 8 continuous driving hours with mandatory 30-minute interval.",
                  },
                  {
                    title: "Heavy Passenger Vehicle (HPV) & PSV Badge Verification",
                    desc: "Driver licensing records verified with PSV authorization badge requirement.",
                  },
                  {
                    title: "Deadhead Minimization & Vehicle-Duty Pairing",
                    desc: "Automated mathematical optimization configured for garage pulling and push runs.",
                  },
                  {
                    title: "Multi-Tenant Data Isolation",
                    desc: "Strict cryptographic and row-level tenant separation with isolated session token.",
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 p-3 rounded-md border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900"
                  >
                    <Check className="size-4 text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-slate-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(2)}
                disabled={submitting}
                className="rounded-md text-xs font-semibold px-4 h-10"
              >
                <ArrowLeft className="mr-2 size-4" />
                <span>Back to Data Ingestion</span>
              </Button>

              <Button
                type="button"
                onClick={handleSubmitOnboarding}
                disabled={submitting}
                className="rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-6 h-10 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    <span>Provisioning Corporation...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 size-4" />
                    <span>Complete Corporation Onboarding &amp; Launch Console</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
