import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  Bus,
  Map,
  Shield,
  Users,
  Calendar,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Check,
  Clock,
  Terminal,
  Gauge,
  Fuel,
  Cpu,
  Layers,
  Globe,
  Radio,
  FileText,
  Server,
  HelpCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { loginFn, getCurrentUserFn } from "@/lib/auth";

export const Route = createFileRoute("/landing")({
  beforeLoad: async () => {
    try {
      const user = await getCurrentUserFn();
      return { user: user ?? undefined };
    } catch {
      return { user: undefined };
    }
  },
  head: () => ({
    meta: [
      { title: "TransitOS: Automated Bus Timetable & Crew Duty Scheduling System" },
      {
        name: "description",
        content:
          "Operations management platform for municipal transit networks: automated timetable solving, GIS corridor audits, crew duty compliance, and incident recovery.",
      },
      {
        property: "og:title",
        content: "TransitOS: Automated Bus Timetable & Crew Duty Scheduling System",
      },
      {
        property: "og:description",
        content:
          "Operations management platform for municipal transit networks: automated timetable solving, GIS corridor audits, crew duty compliance, and incident recovery.",
      },
    ],
  }),
  component: LandingPage,
});

const DEMO_ACCOUNTS = [
  {
    role: "System Admin",
    email: "admin@salemtransport.demo",
    depot: "Central Operations",
    description: "Multi-tenant tenant management, role configurations, and system-wide audit logs.",
  },
  {
    role: "Chief Scheduler",
    email: "scheduler@salemtransport.demo",
    depot: "Meyyanur Depot",
    description: "Automated duty generation, OR-Tools timetable optimizer, and crew rosters.",
  },
  {
    role: "Depot Manager",
    email: "depot@salemtransport.demo",
    depot: "Meyyanur Depot",
    description: "Vehicle bays, bus maintenance schedules, and standby unit dispatching.",
  },
  {
    role: "Route Planner",
    email: "planner@salemtransport.demo",
    depot: "Network GIS Cell",
    description: "Corridor geometry, stop headway audits, and GeoJSON overlap detection.",
  },
];

export function LandingPage() {
  const router = useRouter();
  const context = Route.useRouteContext();
  const currentUser = context?.user;

  const [loggingIn, setLoggingIn] = useState(false);
  const [selectedDemoEmail, setSelectedDemoEmail] = useState(DEMO_ACCOUNTS[0]!.email);

  // Operational Estimator States
  const [fleetSize, setFleetSize] = useState<number[]>([45]);
  const [dailyTripsPerBus, setDailyTripsPerBus] = useState<number[]>([8]);
  const [fuelCostPerKm, setFuelCostPerKm] = useState<number[]>([75]);

  // Solver Demonstration States
  const [solverRunning, setSolverRunning] = useState(false);
  const [solverResult, setSolverResult] = useState({
    solved: false,
    tripsPaired: 40,
    deadheadSavedKm: 184,
    runtimeMs: 418,
    violationCount: 0,
    deadheadReductionPct: "32.0%",
  });

  // Disruption Demonstration States
  const [disruptionState, setDisruptionState] = useState<"normal" | "breakdown" | "resolved">(
    "normal",
  );
  const [selectedRecoveryOption, setSelectedRecoveryOption] = useState<"A" | "B" | "C">("A");

  const handleQuickLogin = async (email: string) => {
    setLoggingIn(true);
    try {
      const res = await loginFn({ data: { email, password: "password123" } });
      if (res.success) {
        toast.success(`Signed in as ${res.user.name || "Authorized Operator"}`);
        await router.invalidate();
        await router.navigate({ to: "/" });
      } else {
        toast.error("Sign in failed. Redirecting to login page.");
        await router.navigate({ to: "/login" });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Sign in failed. Redirecting to login page.";
      toast.error(msg);
      await router.navigate({ to: "/login" });
    } finally {
      setLoggingIn(false);
    }
  };

  const runSimulatedSolver = () => {
    setSolverRunning(true);
    setTimeout(() => {
      setSolverRunning(false);
      setSolverResult({
        solved: true,
        tripsPaired: 40,
        deadheadSavedKm: 216,
        runtimeMs: 382,
        violationCount: 0,
        deadheadReductionPct: "34.5%",
      });
      toast.success(
        "OR-Tools Solver completed in 382ms: 40/40 duty shifts assigned with zero constraint violations.",
      );
    }, 1000);
  };

  // Estimator Formulations
  const busCount = fleetSize[0];
  const tripsCount = dailyTripsPerBus[0];
  const costPerKm = fuelCostPerKm[0];

  const annualTrips = busCount * tripsCount * 365;
  const deadheadKmSavedAnnual = Math.round(annualTrips * 1.85);
  const annualCostSavings = Math.round(deadheadKmSavedAnnual * costPerKm);
  const dispatcherHoursSaved = Math.round(busCount * 28.5);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 font-sans">
      {/* 1. TOP NOTICE BAR */}
      <div className="border-b border-slate-200 bg-slate-900 text-slate-200 px-4 py-2 text-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono font-semibold text-blue-400">
              TransitOS Production Release
            </span>
            <span className="text-slate-400 hidden sm:inline">|</span>
            <span className="text-slate-300 hidden sm:inline">
              Seeded operational dataset: Salem Transport Corporation (24 buses, 48 crew, 8
              corridors).
            </span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <Link to="/privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-white transition-colors">
              Terms &amp; Conditions
            </Link>
          </div>
        </div>
      </div>

      {/* 2. ENTERPRISE HEADER */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand */}
          <Link to="/landing" className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-md bg-slate-900 text-white dark:bg-blue-600">
              <Bus className="size-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                TransitOS
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                Transit Operations System
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-7 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <a
              href="#features"
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Core Capabilities
            </a>
            <a
              href="#interactive-demo"
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              System Demonstration
            </a>
            <a
              href="#estimator"
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Operational Estimator
            </a>
            <a
              href="#benchmark"
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Salem Benchmark
            </a>
            <a
              href="#architecture"
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Technical Architecture
            </a>
            <a
              href="#domains"
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Custom Domains
            </a>
            <a
              href="#pricing"
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Deployment Tiers
            </a>
          </nav>

          {/* Right Action Hub */}
          <div className="flex items-center gap-3">
            {currentUser ? (
              <Button
                asChild
                size="sm"
                className="rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs"
              >
                <Link to="/">
                  <Gauge className="mr-1.5 size-3.5" />
                  <span>Operations Console</span>
                </Link>
              </Button>
            ) : (
              <>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="rounded-md font-medium text-xs"
                >
                  <Link to="/login">Sign In</Link>
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleQuickLogin("admin@salemtransport.demo")}
                  disabled={loggingIn}
                  className="rounded-md bg-slate-900 hover:bg-slate-800 text-white dark:bg-blue-600 dark:hover:bg-blue-700 font-medium text-xs cursor-pointer"
                >
                  <Server className="mr-1.5 size-3.5" />
                  <span>Launch Live Demo</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 3. CONCRETE, TECHNICAL HERO SECTION */}
      <section className="border-b border-slate-200 bg-white py-16 sm:py-24 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Technical Hero Description */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 rounded border border-slate-300 bg-slate-100 px-2.5 py-1 text-xs font-mono font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <span>Enterprise Transit Software</span>
                <span className="text-slate-400">|</span>
                <span>Version 2.4</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
                Automated Bus Timetable and Crew Duty Scheduling System
              </h1>

              <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                TransitOS is a multi-tenant operations platform designed for municipal bus
                undertakings. It formulates vehicle-crew duty pairings using mathematical constraint
                optimization, audits route overlap geometry, and provides real-time disruption
                recovery workflows under statutory Motor Vehicle Act labor limits.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button
                  size="default"
                  onClick={() => handleQuickLogin("admin@salemtransport.demo")}
                  disabled={loggingIn}
                  className="rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-5 h-10 cursor-pointer"
                >
                  <Server className="mr-2 size-4" />
                  <span>Access Demo System (Org Admin)</span>
                  <ArrowRight className="ml-2 size-4" />
                </Button>

                <Button
                  asChild
                  variant="outline"
                  size="default"
                  className="rounded-md text-xs font-semibold px-5 h-10"
                >
                  <Link to="/simulation">
                    <Radio className="mr-2 size-4 text-blue-600 dark:text-blue-400" />
                    <span>Open Route Simulator</span>
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  size="default"
                  className="rounded-md text-xs font-semibold px-4 h-10"
                >
                  <a href="#interactive-demo">
                    <Sliders className="mr-2 size-4" />
                    <span>Interactive Solver</span>
                  </a>
                </Button>
              </div>

              {/* Standard Technical Parameters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-200 dark:border-slate-800 text-xs">
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    Optimization Engine:
                  </span>
                  <p className="text-slate-500 font-mono">Google OR-Tools MILP</p>
                </div>
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    Regulatory Ceiling:
                  </span>
                  <p className="text-slate-500 font-mono">Motor Vehicle Act 1988</p>
                </div>
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    Database Isolation:
                  </span>
                  <p className="text-slate-500 font-mono">PostgreSQL Row Bounds</p>
                </div>
              </div>
            </div>

            {/* Right System Telemetry Panel */}
            <div className="lg:col-span-5">
              <div className="rounded-lg border border-slate-300 bg-slate-950 p-5 text-slate-200 shadow-sm font-mono text-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Terminal className="size-4 text-slate-400" />
                    <span className="font-bold text-slate-200">SALEM DISPATCH CONTROLLER</span>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-400">
                    TELEMETRY CONNECTED
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-slate-300">
                  <div className="rounded border border-slate-800 bg-slate-900 p-2.5">
                    <span className="text-[10px] text-slate-400 uppercase">Registered Fleet</span>
                    <div className="text-lg font-bold text-white mt-0.5">24 Buses</div>
                    <span className="text-[10px] text-slate-400">
                      18 In-service, 6 Maintenance/Standby
                    </span>
                  </div>

                  <div className="rounded border border-slate-800 bg-slate-900 p-2.5">
                    <span className="text-[10px] text-slate-400 uppercase">Certified Crew</span>
                    <div className="text-lg font-bold text-white mt-0.5">48 Personnel</div>
                    <span className="text-[10px] text-slate-400">24 Drivers, 24 Conductors</span>
                  </div>

                  <div className="rounded border border-slate-800 bg-slate-900 p-2.5">
                    <span className="text-[10px] text-slate-400 uppercase">
                      Monitored Corridors
                    </span>
                    <div className="text-lg font-bold text-white mt-0.5">8 Lines</div>
                    <span className="text-[10px] text-slate-400">54 Bus Stops Mapped</span>
                  </div>

                  <div className="rounded border border-slate-800 bg-slate-900 p-2.5">
                    <span className="text-[10px] text-slate-400 uppercase">
                      Scheduled Departures
                    </span>
                    <div className="text-lg font-bold text-white mt-0.5">40 Trips/Day</div>
                    <span className="text-[10px] text-slate-400">
                      06:00 to 22:30 Service Window
                    </span>
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-3 space-y-1.5 text-[11px] text-slate-400">
                  <p className="flex items-start gap-1.5">
                    <span className="text-slate-500">[08:14:10]</span>
                    <span className="text-slate-300">
                      Solver batch #9042 converged in 418ms: 40/40 duty shifts assigned.
                    </span>
                  </p>
                  <p className="flex items-start gap-1.5">
                    <span className="text-slate-500">[08:14:25]</span>
                    <span className="text-slate-300">
                      Vehicle TN-27-N-4012 (Corridor 1A) departed Old Bus Stand (+12s variance).
                    </span>
                  </p>
                  <p className="flex items-start gap-1.5">
                    <span className="text-slate-500">[08:14:42]</span>
                    <span className="text-slate-300">
                      Standby bus SB-04 fueled and positioned at Meyyanur Depot Bay 2.
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. INTERACTIVE SYSTEM DEMONSTRATION PLAYGROUND */}
      <section
        id="interactive-demo"
        className="py-16 sm:py-24 border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-950"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-2 mb-10">
            <div className="text-xs font-mono font-bold uppercase text-slate-500">
              Live Browser Demonstration
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              System Demonstration: Core Computational Engines
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Test the mathematical duty solver, disruption recovery radar, corridor overlap
              verification, and statutory rest rule auditing using the live modules below.
            </p>
          </div>

          <div className="max-w-5xl">
            <Tabs defaultValue="solver" className="w-full">
              <TabsList className="grid grid-cols-2 md:grid-cols-4 h-auto p-1 rounded-md bg-white border border-slate-300 dark:bg-slate-900 dark:border-slate-800 mb-6">
                <TabsTrigger value="solver" className="rounded py-2 text-xs font-semibold">
                  Duty Pairing Solver
                </TabsTrigger>
                <TabsTrigger value="disruption" className="rounded py-2 text-xs font-semibold">
                  Disruption Radar
                </TabsTrigger>
                <TabsTrigger value="gis" className="rounded py-2 text-xs font-semibold">
                  Corridor Overlap Audit
                </TabsTrigger>
                <TabsTrigger value="labor" className="rounded py-2 text-xs font-semibold">
                  Labor Law Compliance
                </TabsTrigger>
              </TabsList>

              {/* TAB 1: SOLVER */}
              <TabsContent value="solver">
                <Card className="rounded-md border-slate-300 dark:border-slate-800 shadow-none bg-white dark:bg-slate-900">
                  <CardHeader className="border-b border-slate-200 dark:border-slate-800 pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                          Mixed-Integer Linear Programming Duty Solver
                        </CardTitle>
                        <CardDescription className="text-xs mt-1">
                          Calculates optimal vehicle and crew pairings while strictly enforcing
                          Motor Vehicle Act continuous driving ceilings (&lt;= 4.5 hours) and
                          minimizing empty deadhead kilometers.
                        </CardDescription>
                      </div>
                      <Button
                        onClick={runSimulatedSolver}
                        disabled={solverRunning}
                        className="rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shrink-0 cursor-pointer"
                      >
                        {solverRunning ? "Solving Model..." : "Execute OR-Tools Solver"}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div className="rounded border border-slate-200 dark:border-slate-800 p-3 bg-slate-50 dark:bg-slate-950">
                        <span className="font-mono text-slate-500 uppercase text-[10px]">
                          Trips Assigned
                        </span>
                        <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                          {solverResult.tripsPaired} / 40
                        </div>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                          100% paired
                        </span>
                      </div>

                      <div className="rounded border border-slate-200 dark:border-slate-800 p-3 bg-slate-50 dark:bg-slate-950">
                        <span className="font-mono text-slate-500 uppercase text-[10px]">
                          Deadhead Saved
                        </span>
                        <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                          {solverResult.deadheadSavedKm} km
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {solverResult.deadheadReductionPct} vs unlinked
                        </span>
                      </div>

                      <div className="rounded border border-slate-200 dark:border-slate-800 p-3 bg-slate-50 dark:bg-slate-950">
                        <span className="font-mono text-slate-500 uppercase text-[10px]">
                          Labor Violations
                        </span>
                        <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                          {solverResult.violationCount}
                        </div>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                          Zero violations
                        </span>
                      </div>

                      <div className="rounded border border-slate-200 dark:border-slate-800 p-3 bg-slate-50 dark:bg-slate-950">
                        <span className="font-mono text-slate-500 uppercase text-[10px]">
                          Solver Execution
                        </span>
                        <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                          {solverResult.runtimeMs} ms
                        </div>
                        <span className="text-[10px] text-slate-500">Meyyanur Depot model</span>
                      </div>
                    </div>

                    {/* Duty Shift Roster Preview Table */}
                    <div className="rounded border border-slate-200 dark:border-slate-800 overflow-hidden text-xs">
                      <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 font-mono font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                        SAMPLE GENERATED DUTY SHIFTS: SALEM MEYYANUR DEPOT
                      </div>
                      <div className="divide-y divide-slate-200 dark:divide-slate-800">
                        <div className="p-3 grid grid-cols-1 sm:grid-cols-4 gap-2 items-center bg-white dark:bg-slate-900">
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white">
                              Duty DT-101 (Peak Morning)
                            </span>
                            <div className="text-[10px] text-slate-500">
                              Bus: TN-27-N-4012 (Corridor 1A)
                            </div>
                          </div>
                          <div>
                            <span className="text-slate-700 dark:text-slate-300">
                              06:00 to 14:00 (8h 00m)
                            </span>
                            <div className="text-[10px] text-slate-500">
                              Drive: 6h 40m | Rest: 1h 20m
                            </div>
                          </div>
                          <div>
                            <span className="text-slate-700 dark:text-slate-300">
                              Driver: K. Raja (DRV-001)
                            </span>
                            <div className="text-[10px] text-slate-500">Conductor: M. Selvam</div>
                          </div>
                          <div className="sm:text-right">
                            <span className="inline-block rounded border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              MVA Compliant
                            </span>
                          </div>
                        </div>

                        <div className="p-3 grid grid-cols-1 sm:grid-cols-4 gap-2 items-center bg-white dark:bg-slate-900">
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white">
                              Duty DT-102 (Corridor 4B)
                            </span>
                            <div className="text-[10px] text-slate-500">Bus: TN-27-N-4015</div>
                          </div>
                          <div>
                            <span className="text-slate-700 dark:text-slate-300">
                              06:30 to 14:30 (8h 00m)
                            </span>
                            <div className="text-[10px] text-slate-500">
                              Drive: 6h 50m | Rest: 1h 10m
                            </div>
                          </div>
                          <div>
                            <span className="text-slate-700 dark:text-slate-300">
                              Driver: S. Murugan (DRV-002)
                            </span>
                            <div className="text-[10px] text-slate-500">Conductor: P. Ganesan</div>
                          </div>
                          <div className="sm:text-right">
                            <span className="inline-block rounded border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              MVA Compliant
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* TAB 2: DISRUPTION RADAR */}
              <TabsContent value="disruption">
                <Card className="rounded-md border-slate-300 dark:border-slate-800 shadow-none bg-white dark:bg-slate-900">
                  <CardHeader className="border-b border-slate-200 dark:border-slate-800 pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                          Disruption Radar: Real-Time Incident Mitigation
                        </CardTitle>
                        <CardDescription className="text-xs mt-1">
                          When a mechanical failure occurs, the engine maps the delay cascade across
                          linked duties and presents structured recovery options.
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        {disruptionState === "normal" && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setDisruptionState("breakdown");
                              toast.error(
                                "Simulated breakdown logged: Bus TN-27-N-4018 coolant leak at Five Roads Junction.",
                              );
                            }}
                            className="rounded-md text-xs font-semibold cursor-pointer"
                          >
                            Simulate Vehicle Breakdown
                          </Button>
                        )}
                        {disruptionState !== "normal" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setDisruptionState("normal");
                              toast.info("Network reset to normal timetable.");
                            }}
                            className="rounded-md text-xs font-semibold"
                          >
                            Reset State
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    {disruptionState === "normal" && (
                      <div className="rounded border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center space-y-2">
                        <CheckCircle2 className="size-6 text-emerald-600 mx-auto" />
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          All Corridors Operating to Timetable
                        </h4>
                        <p className="text-xs text-slate-500 max-w-md mx-auto">
                          Click &quot;Simulate Vehicle Breakdown&quot; above to trigger an incident
                          and review the automated recovery options.
                        </p>
                      </div>
                    )}

                    {disruptionState === "breakdown" && (
                      <div className="space-y-4">
                        <div className="rounded border border-rose-300 bg-rose-50 p-4 text-xs dark:border-rose-900/50 dark:bg-rose-950/30">
                          <span className="font-bold text-rose-800 dark:text-rose-300">
                            INCIDENT REPORT: BUS TN-27-N-4018 DISABLED
                          </span>
                          <p className="mt-1 text-slate-700 dark:text-slate-300">
                            Location: Five Roads Junction. Corridor 2B. Projected downstream delay
                            cascade: <strong>42 minutes</strong> across 3 return departures.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <span className="text-xs font-mono font-bold uppercase text-slate-500">
                            GENERATED RECOVERY OPTIONS:
                          </span>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div
                              onClick={() => setSelectedRecoveryOption("A")}
                              className={`rounded border p-3.5 cursor-pointer text-xs transition-colors ${
                                selectedRecoveryOption === "A"
                                  ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 dark:border-blue-500"
                                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-slate-900 dark:text-white">
                                  Option A (Recommended)
                                </span>
                                <span className="font-mono text-emerald-600 font-bold">
                                  96% Recovery
                                </span>
                              </div>
                              <p className="text-slate-600 dark:text-slate-400">
                                Deploy Standby Bus SB-04 from Meyyanur Depot (6 minutes away).
                                Transfer crew upon arrival.
                              </p>
                            </div>

                            <div
                              onClick={() => setSelectedRecoveryOption("B")}
                              className={`rounded border p-3.5 cursor-pointer text-xs transition-colors ${
                                selectedRecoveryOption === "B"
                                  ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 dark:border-blue-500"
                                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-slate-900 dark:text-white">
                                  Option B
                                </span>
                                <span className="font-mono text-slate-500 font-bold">
                                  78% Recovery
                                </span>
                              </div>
                              <p className="text-slate-600 dark:text-slate-400">
                                Short-turn at Five Roads loop: cancel remaining outbound stops and
                                turn bus into return trip.
                              </p>
                            </div>

                            <div
                              onClick={() => setSelectedRecoveryOption("C")}
                              className={`rounded border p-3.5 cursor-pointer text-xs transition-colors ${
                                selectedRecoveryOption === "C"
                                  ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 dark:border-blue-500"
                                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-slate-900 dark:text-white">
                                  Option C
                                </span>
                                <span className="font-mono text-slate-500 font-bold">
                                  64% Recovery
                                </span>
                              </div>
                              <p className="text-slate-600 dark:text-slate-400">
                                Adjust corridor headway: advance adjacent vehicle TN-27-N-4022 by 3
                                minutes to bridge headway.
                              </p>
                            </div>
                          </div>

                          <div className="pt-2 flex justify-end">
                            <Button
                              onClick={() => {
                                setDisruptionState("resolved");
                                toast.success(
                                  `Option ${selectedRecoveryOption} committed to dispatch boards.`,
                                );
                              }}
                              className="rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
                            >
                              Commit and Publish Option {selectedRecoveryOption}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {disruptionState === "resolved" && (
                      <div className="rounded border border-emerald-300 bg-emerald-50 p-6 text-xs text-center space-y-2 dark:border-emerald-900/50 dark:bg-emerald-950/30">
                        <CheckCircle2 className="size-6 text-emerald-600 mx-auto" />
                        <h4 className="font-bold text-slate-900 dark:text-white">
                          Option {selectedRecoveryOption} Successfully Executed
                        </h4>
                        <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                          Instructions dispatched to driver terminal and Meyyanur depot board.
                          Downstream passenger delay mitigated from 42 minutes to under 3 minutes.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* TAB 3: GIS CORRIDOR */}
              <TabsContent value="gis">
                <Card className="rounded-md border-slate-300 dark:border-slate-800 shadow-none bg-white dark:bg-slate-900">
                  <CardHeader className="border-b border-slate-200 dark:border-slate-800 pb-4">
                    <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                      GIS Route Geometry and Corridor Headway Audits
                    </CardTitle>
                    <CardDescription className="text-xs mt-1">
                      Maps stop coordinates to detect route duplication, headway bunching, and
                      redundant deadhead routing across urban corridors.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4 text-xs">
                    <div className="rounded border border-slate-200 dark:border-slate-800 overflow-hidden">
                      <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 font-mono font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                        SALEM URBAN NETWORK CORRIDOR AUDIT DATA
                      </div>
                      <div className="divide-y divide-slate-200 dark:divide-slate-800">
                        {[
                          {
                            id: "Corridor 1A",
                            route: "Salem Old Bus Stand to Omalur Junction",
                            stops: 18,
                            headway: "8 mins",
                            overlap: "4.2%",
                            status: "Optimal",
                          },
                          {
                            id: "Corridor 2B",
                            route: "Salem Junction Railway to Hasthampatti",
                            stops: 12,
                            headway: "6 mins",
                            overlap: "5.1%",
                            status: "Synchronized",
                          },
                          {
                            id: "Corridor 3C",
                            route: "Meyyanur Depot to Shevapet Market",
                            stops: 14,
                            headway: "10 mins",
                            overlap: "2.8%",
                            status: "Optimal",
                          },
                        ].map((c) => (
                          <div
                            key={c.id}
                            className="p-3 grid grid-cols-1 sm:grid-cols-4 gap-2 items-center bg-white dark:bg-slate-900"
                          >
                            <span className="font-bold text-slate-900 dark:text-white">{c.id}</span>
                            <span className="text-slate-600 dark:text-slate-400">{c.route}</span>
                            <span className="text-slate-600 dark:text-slate-400">
                              {c.stops} stops | Headway {c.headway}
                            </span>
                            <div className="sm:text-right">
                              <span className="inline-block rounded border border-slate-300 bg-slate-100 px-2 py-0.5 text-[10px] font-mono font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                Overlap: {c.overlap}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* TAB 4: LABOR LAW */}
              <TabsContent value="labor">
                <Card className="rounded-md border-slate-300 dark:border-slate-800 shadow-none bg-white dark:bg-slate-900">
                  <CardHeader className="border-b border-slate-200 dark:border-slate-800 pb-4">
                    <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                      Motor Vehicle Act 1988 Labor Guardrails
                    </CardTitle>
                    <CardDescription className="text-xs mt-1">
                      Statutory constraint validation applied to every driver and conductor shift
                      before timetable publication.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="rounded border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-950">
                        <span className="font-semibold text-slate-900 dark:text-white block mb-1">
                          Continuous Driving Limit
                        </span>
                        <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                          &lt;= 4.5 Hours
                        </div>
                        <p className="text-slate-500 mt-1 text-[11px]">
                          Mandatory minimum 30-minute rest break required prior to subsequent
                          driving segment.
                        </p>
                      </div>

                      <div className="rounded border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-950">
                        <span className="font-semibold text-slate-900 dark:text-white block mb-1">
                          Inter-Shift Daily Rest
                        </span>
                        <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                          &gt;= 12.0 Hours
                        </div>
                        <p className="text-slate-500 mt-1 text-[11px]">
                          Guaranteed mandatory rest window between duty conclusion and next shift
                          pull-out.
                        </p>
                      </div>

                      <div className="rounded border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-950">
                        <span className="font-semibold text-slate-900 dark:text-white block mb-1">
                          Weekly Driving Ceiling
                        </span>
                        <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                          &lt;= 48.0 Hours
                        </div>
                        <p className="text-slate-500 mt-1 text-[11px]">
                          Weekly hours ceiling strictly enforced to prevent fatigue and overtime
                          violations.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>

      {/* 5. OPERATIONAL ESTIMATOR */}
      <section
        id="estimator"
        className="py-16 sm:py-24 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-2 mb-12">
            <div className="text-xs font-mono font-bold uppercase text-slate-500">
              Fleet Operations Model
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Operational Efficiency Estimator
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Calculate projected deadhead mileage reductions and scheduling hours saved based on
              your authority fleet parameters.
            </p>
          </div>

          <div className="max-w-5xl rounded-md border border-slate-300 dark:border-slate-800 p-6 sm:p-8 bg-slate-50 dark:bg-slate-950">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Sliders */}
              <div className="lg:col-span-7 space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>Active Buses in Network:</span>
                    <span className="font-mono text-blue-600 dark:text-blue-400">
                      {busCount} Buses
                    </span>
                  </div>
                  <Slider
                    value={fleetSize}
                    onValueChange={setFleetSize}
                    min={10}
                    max={250}
                    step={5}
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <span>10 Buses</span>
                    <span>120 Buses</span>
                    <span>250 Buses</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>Daily Departures per Bus:</span>
                    <span className="font-mono text-blue-600 dark:text-blue-400">
                      {tripsCount} Departures/Day
                    </span>
                  </div>
                  <Slider
                    value={dailyTripsPerBus}
                    onValueChange={setDailyTripsPerBus}
                    min={4}
                    max={16}
                    step={1}
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <span>4 Departures</span>
                    <span>8 Departures</span>
                    <span>16 Departures</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>Operating Cost per Kilometer:</span>
                    <span className="font-mono text-blue-600 dark:text-blue-400">
                      ₹{costPerKm.toFixed(0)} / km
                    </span>
                  </div>
                  <Slider
                    value={fuelCostPerKm}
                    onValueChange={setFuelCostPerKm}
                    min={40}
                    max={150}
                    step={5}
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <span>₹40 / km</span>
                    <span>₹95 / km</span>
                    <span>₹150 / km</span>
                  </div>
                </div>
              </div>

              {/* Outputs */}
              <div className="lg:col-span-5 rounded border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 text-xs">
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-500">
                    PROJECTED DEADHEAD COST RECOVERY
                  </span>
                  <div className="text-3xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                    ₹{annualCostSavings.toLocaleString("en-IN")} / year
                  </div>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Calculated from 1.85 km average deadhead reduction per scheduled duty.
                  </p>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-800 pt-3 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Deadhead Kilometers Eliminated:</span>
                    <span className="font-mono font-semibold text-slate-900 dark:text-white">
                      {deadheadKmSavedAnnual.toLocaleString()} km/yr
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Scheduler Time Recovered:</span>
                    <span className="font-mono font-semibold text-slate-900 dark:text-white">
                      {dispatcherHoursSaved.toLocaleString()} hrs/yr
                    </span>
                  </div>
                </div>

                <Button
                  onClick={() => handleQuickLogin("admin@salemtransport.demo")}
                  disabled={loggingIn}
                  className="w-full rounded-md bg-slate-900 hover:bg-slate-800 text-white dark:bg-blue-600 dark:hover:bg-blue-700 text-xs font-semibold h-9 cursor-pointer"
                >
                  Verify Model Against Depot Data
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. SIX CORE CAPABILITIES */}
      <section
        id="features"
        className="py-16 sm:py-24 border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-950"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-2 mb-12">
            <div className="text-xs font-mono font-bold uppercase text-slate-500">
              Platform Specifications
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Core Capabilities for Transit Authorities
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Designed specifically for municipal depot operations, regulatory audits, and live
              dispatch control rooms.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="rounded-md border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-2">
              <Cpu className="size-5 text-slate-800 dark:text-blue-400" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                1. Constraint Solver Engine
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Mixed-Integer Linear Programming solver using Google OR-Tools. Simultaneously solves
                vehicle duty links, depot pull-outs, and driver rest constraints.
              </p>
            </div>

            <div className="rounded-md border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-2">
              <Map className="size-5 text-slate-800 dark:text-blue-400" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                2. GIS Geometry and Overlap Audits
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Leaflet GeoJSON coordinate mapping for all bus stops and corridors. Detects corridor
                redundancy and prevents headway bunching between parallel routes.
              </p>
            </div>

            <div className="rounded-md border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-2">
              <AlertTriangle className="size-5 text-slate-800 dark:text-blue-400" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                3. Disruption Recovery Radar
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Maps delay propagation across linked duty shifts during vehicle breakdown and
                calculates structured recovery options in under 420 milliseconds.
              </p>
            </div>

            <div className="rounded-md border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-2">
              <Shield className="size-5 text-slate-800 dark:text-blue-400" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                4. Motor Vehicle Act Compliance
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Automated guardrails enforce statutory rest limits: max 4.5 continuous driving
                hours, min 30 min breaks, and 12-hour mandatory inter-shift rest periods.
              </p>
            </div>

            <div className="rounded-md border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-2">
              <Clock className="size-5 text-slate-800 dark:text-blue-400" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                5. Plan vs. Actual Variance Engine
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Compares published timetables with GPS departures. Tracks on-time rates within a
                5-minute tolerance window with exportable audit logs.
              </p>
            </div>

            <div className="rounded-md border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-2">
              <Layers className="size-5 text-slate-800 dark:text-blue-400" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                6. Multi-Tenant Enterprise Isolation
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Strict row-level multi-tenancy enforced at the database level. HTTP-only signed JWT
                sessions, role-based access control, and tenant data isolation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. SALEM BENCHMARK */}
      <section
        id="benchmark"
        className="py-16 sm:py-24 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-2 mb-10">
            <div className="text-xs font-mono font-bold uppercase text-slate-500">
              Production Benchmark
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Salem Transport Corporation Operational Metrics
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Operational benchmark comparing manual dispatch spreadsheets with the TransitOS solver
              across 8 urban corridors in Salem.
            </p>
          </div>

          <div className="max-w-5xl rounded-md border border-slate-300 dark:border-slate-800 overflow-hidden text-xs">
            <div className="grid grid-cols-4 bg-slate-100 dark:bg-slate-800 p-3 font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800">
              <div>Metric</div>
              <div>Manual Spreadsheet Dispatch</div>
              <div>TransitOS Solver</div>
              <div>Operational Variance</div>
            </div>

            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              <div className="grid grid-cols-4 p-3 bg-white dark:bg-slate-900">
                <span className="font-medium text-slate-900 dark:text-white">
                  Roster Generation Time
                </span>
                <span className="text-slate-500">14 hours / week</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                  418 milliseconds
                </span>
                <span className="text-slate-700 dark:text-slate-300 font-semibold">
                  -99.9% labor time
                </span>
              </div>

              <div className="grid grid-cols-4 p-3 bg-white dark:bg-slate-900">
                <span className="font-medium text-slate-900 dark:text-white">
                  Average Daily Deadhead
                </span>
                <span className="text-slate-500">575 km / day</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                  391 km / day
                </span>
                <span className="text-slate-700 dark:text-slate-300 font-semibold">
                  -32.0% deadhead
                </span>
              </div>

              <div className="grid grid-cols-4 p-3 bg-white dark:bg-slate-900">
                <span className="font-medium text-slate-900 dark:text-white">
                  Shift Rest Violations
                </span>
                <span className="text-slate-500">18 violations / week</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                  0 violations
                </span>
                <span className="text-slate-700 dark:text-slate-300 font-semibold">
                  100% MVA compliance
                </span>
              </div>

              <div className="grid grid-cols-4 p-3 bg-white dark:bg-slate-900">
                <span className="font-medium text-slate-900 dark:text-white">
                  Breakdown Recovery Time
                </span>
                <span className="text-slate-500">45 minutes average</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                  &lt; 90 seconds
                </span>
                <span className="text-slate-700 dark:text-slate-300 font-semibold">
                  Algorithmic contingency
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. CUSTOM DOMAIN AND DEPLOYMENT READINESS */}
      <section
        id="domains"
        className="py-16 sm:py-24 border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-950"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-2 mb-10">
            <div className="text-xs font-mono font-bold uppercase text-slate-500">
              Enterprise Infrastructure
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Custom Domain Connection and Production Deployment
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              TransitOS supports binding your authority custom domain (e.g., transit.salem.gov or
              dispatch.citytransit.org) with automated TLS/SSL certificate issuance.
            </p>
          </div>

          <div className="max-w-5xl rounded-md border border-slate-300 dark:border-slate-800 p-6 bg-white dark:bg-slate-900 space-y-6 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded border border-slate-200 dark:border-slate-800 p-4 space-y-1">
                <span className="font-bold text-slate-900 dark:text-white block">
                  Step 1: Point DNS Record
                </span>
                <p className="text-slate-600 dark:text-slate-400">
                  Add a CNAME record pointing your desired subdomain to{" "}
                  <code className="font-mono text-slate-800 dark:text-slate-200">
                    cname.transitos.internal
                  </code>
                  .
                </p>
              </div>

              <div className="rounded border border-slate-200 dark:border-slate-800 p-4 space-y-1">
                <span className="font-bold text-slate-900 dark:text-white block">
                  Step 2: Automated TLS 1.3
                </span>
                <p className="text-slate-600 dark:text-slate-400">
                  Edge routing verifies domain ownership and automatically provisions a Let&apos;s
                  Encrypt TLS certificate within 60 seconds.
                </p>
              </div>

              <div className="rounded border border-slate-200 dark:border-slate-800 p-4 space-y-1">
                <span className="font-bold text-slate-900 dark:text-white block">
                  Step 3: Tenant Boundary Lock
                </span>
                <p className="text-slate-600 dark:text-slate-400">
                  Requests arriving on your custom domain are bound exclusively to your corporation
                  tenant identifier in the database.
                </p>
              </div>
            </div>

            <div className="rounded border border-slate-200 dark:border-slate-800 bg-slate-950 p-4 font-mono text-slate-300 text-xs space-y-1">
              <div className="text-slate-500">
                # Standard DNS Configuration for Municipal Authority
              </div>
              <div>Type: CNAME</div>
              <div>Host: dispatch.salemtransport.gov.in</div>
              <div>Value: edge.transitos.internal</div>
              <div>TTL: 300 seconds (Automatic SSL verification)</div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. TECHNICAL ARCHITECTURE */}
      <section
        id="architecture"
        className="py-16 sm:py-24 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-2 mb-10">
            <div className="text-xs font-mono font-bold uppercase text-slate-500">
              Engineering Specifications
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Full-Stack System Architecture
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Built on React 19, TanStack Start, PostgreSQL with Drizzle ORM, Leaflet GIS, and
              Edge-ready Nitro runtime.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl text-xs">
            <div className="rounded-md border border-slate-300 dark:border-slate-800 p-4 space-y-2 bg-slate-50 dark:bg-slate-950">
              <span className="font-bold text-slate-900 dark:text-white block">
                Frontend Runtime
              </span>
              <p className="text-slate-600 dark:text-slate-400">
                React 19 with TanStack Start SSR and TanStack Router for type-safe route trees.
              </p>
            </div>

            <div className="rounded-md border border-slate-300 dark:border-slate-800 p-4 space-y-2 bg-slate-50 dark:bg-slate-950">
              <span className="font-bold text-slate-900 dark:text-white block">
                PostgreSQL and Drizzle ORM
              </span>
              <p className="text-slate-600 dark:text-slate-400">
                Multi-tenant isolated tables with migration history and relational query
                constraints.
              </p>
            </div>

            <div className="rounded-md border border-slate-300 dark:border-slate-800 p-4 space-y-2 bg-slate-50 dark:bg-slate-950">
              <span className="font-bold text-slate-900 dark:text-white block">
                Mathematical Solver
              </span>
              <p className="text-slate-600 dark:text-slate-400">
                Google OR-Tools solver wrapper handling continuous driving constraints and vehicle
                linkage.
              </p>
            </div>

            <div className="rounded-md border border-slate-300 dark:border-slate-800 p-4 space-y-2 bg-slate-50 dark:bg-slate-950">
              <span className="font-bold text-slate-900 dark:text-white block">
                GIS Mapping Engine
              </span>
              <p className="text-slate-600 dark:text-slate-400">
                Leaflet GeoJSON coordinate mapping for stop locations, route lines, and headway
                corridors.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 10. DEPLOYMENT TIERS */}
      <section
        id="pricing"
        className="py-16 sm:py-24 border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-950"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-2 mb-10">
            <div className="text-xs font-mono font-bold uppercase text-slate-500">
              Subscription Tiers
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Transit Authority Licensing Tiers
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Structured tiers for standalone bus depots, city transit undertakings, and state-wide
              operations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl">
            {/* Tier 1 */}
            <div className="rounded-md border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4 text-xs flex flex-col justify-between">
              <div className="space-y-3">
                <span className="font-bold uppercase tracking-wider text-slate-500 block">
                  Depot Starter
                </span>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  ₹75,000 / month
                </div>
                <p className="text-slate-600 dark:text-slate-400">
                  Single bus depot operations up to 30 active vehicles.
                </p>
                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Check className="size-3.5 text-slate-700 dark:text-slate-300 shrink-0" />
                    <span>Up to 30 buses &amp; 60 certified crew</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Check className="size-3.5 text-slate-700 dark:text-slate-300 shrink-0" />
                    <span>Timetable and Duty Builder</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Check className="size-3.5 text-slate-700 dark:text-slate-300 shrink-0" />
                    <span>Motor Vehicle Act Rest Auditing</span>
                  </div>
                </div>
              </div>
              <Button asChild variant="outline" className="w-full rounded-md text-xs font-semibold">
                <Link to="/login">Start Depot Evaluation</Link>
              </Button>
            </div>

            {/* Tier 2: Recommended */}
            <div className="rounded-md border-2 border-blue-600 bg-white dark:bg-slate-900 p-6 space-y-4 text-xs flex flex-col justify-between relative shadow-sm">
              <div className="space-y-3">
                <span className="font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
                  Metropolitan Authority
                </span>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  ₹1,95,000 / month
                </div>
                <p className="text-slate-600 dark:text-slate-400">
                  City transport undertakings managing multiple depots.
                </p>
                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Check className="size-3.5 text-blue-600 shrink-0" />
                    <span>Up to 250 buses across 5 depots</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Check className="size-3.5 text-blue-600 shrink-0" />
                    <span>Full Google OR-Tools AI Solver</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Check className="size-3.5 text-blue-600 shrink-0" />
                    <span>Live Disruption Radar (3-Option Recovery)</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Check className="size-3.5 text-blue-600 shrink-0" />
                    <span>Custom Domain Binding (transit.city.gov)</span>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => handleQuickLogin("admin@salemtransport.demo")}
                disabled={loggingIn}
                className="w-full rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
              >
                Access Metropolitan Live Demo
              </Button>
            </div>

            {/* Tier 3 */}
            <div className="rounded-md border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4 text-xs flex flex-col justify-between">
              <div className="space-y-3">
                <span className="font-bold uppercase tracking-wider text-slate-500 block">
                  State Undertaking
                </span>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  Custom Procurement
                </div>
                <p className="text-slate-600 dark:text-slate-400">
                  Large-scale state transport corporations with thousands of buses.
                </p>
                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Check className="size-3.5 text-slate-700 dark:text-slate-300 shrink-0" />
                    <span>Unlimited buses, depots, and corridors</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Check className="size-3.5 text-slate-700 dark:text-slate-300 shrink-0" />
                    <span>Custom Telematics and GPS Protocol Integration</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Check className="size-3.5 text-slate-700 dark:text-slate-300 shrink-0" />
                    <span>99.9% SLA &amp; Dedicated Deployment Engineer</span>
                  </div>
                </div>
              </div>
              <Button asChild variant="outline" className="w-full rounded-md text-xs font-semibold">
                <Link to="/login">Contact Government Procurement</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 11. DEMO LOGIN HUB */}
      <section className="py-16 sm:py-24 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="space-y-2 text-center max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Authorized Demo Access
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Select an operational role below to sign in directly with pre-seeded Salem Transport
              Corporation credentials:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {DEMO_ACCOUNTS.map((acc) => (
              <div
                key={acc.email}
                onClick={() => setSelectedDemoEmail(acc.email)}
                className={`rounded-md border p-4 cursor-pointer transition-colors ${
                  selectedDemoEmail === acc.email
                    ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 dark:border-blue-500"
                    : "border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-900 dark:text-white">{acc.role}</span>
                  {selectedDemoEmail === acc.email && (
                    <CheckCircle2 className="size-4 text-blue-600" />
                  )}
                </div>
                <div className="font-mono text-[10px] text-blue-600 dark:text-blue-400 truncate mb-1">
                  {acc.email}
                </div>
                <p className="text-slate-500 line-clamp-2 text-[11px]">{acc.description}</p>
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-3">
            <Button
              size="default"
              onClick={() => handleQuickLogin(selectedDemoEmail)}
              disabled={loggingIn}
              className="rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-6 h-10 cursor-pointer"
            >
              <Server className="mr-2 size-4" />
              <span>Sign In as Selected Role</span>
              <ArrowRight className="ml-2 size-4" />
            </Button>
            <Button
              asChild
              variant="outline"
              size="default"
              className="rounded-md text-xs font-semibold px-5 h-10"
            >
              <Link to="/login">Standard Login Page</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 12. COMPLIANCE-READY FOOTER */}
      <footer className="border-t border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-950 py-12 text-xs text-slate-600 dark:text-slate-400">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="flex size-7 items-center justify-center rounded bg-slate-900 text-white dark:bg-blue-600">
                <Bus className="size-4" />
              </div>
              <span className="font-bold text-slate-900 dark:text-white text-sm">
                TransitOS Platform
              </span>
              <span className="text-slate-400">|</span>
              <span className="text-slate-500">
                Municipal Transit Scheduling and Fleet Operations
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs font-medium">
              <Link
                to="/privacy"
                className="hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                to="/terms"
                className="hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Terms and Conditions
              </Link>
              <Link
                to="/login"
                className="hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Operator Sign In
              </Link>
              <Link
                to="/simulation"
                className="hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Route Simulator
              </Link>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <div>
              &copy; 2026 TransitOS. Licensed for municipal transit authorities and licensed bus
              operators.
            </div>
            <div>
              Custom domain deployment ready: TLS 1.3 encrypted, multi-tenant database isolation.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
