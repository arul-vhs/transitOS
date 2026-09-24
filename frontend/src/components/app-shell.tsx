import { Link, useRouterState, useRouter } from "@tanstack/react-router";
import {
  BarChart3,
  Bus,
  CalendarClock,
  ChevronRight,
  Gauge,
  Map,
  Menu,
  Route as RouteIcon,
  Settings,
  UserCog,
  Users,
  Wrench,
  LogOut,
  User,
  AlertTriangle,
  Radio,
  Sparkles,
  HelpCircle,
  BookOpen,
  Lightbulb,
  Compass,
  Workflow,
  ExternalLink,
  ShieldCheck,
  PlayCircle,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Route } from "@/routes/__root";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { logoutFn } from "@/lib/auth";
import { toast } from "sonner";

type NavItem = { label: string; to: string; icon: typeof Bus; badge?: string; badgeColor?: string };
type NavGroup = { title: string; items: NavItem[] };

const NAV: NavGroup[] = [
  {
    title: "Command Center",
    items: [
      { label: "Executive Dashboard", to: "/", icon: Gauge },
      { label: "Live Simulation Deck", to: "/simulation", icon: PlayCircle, badge: "Sim", badgeColor: "bg-indigo-500/20 text-indigo-500 border-indigo-500/30" },
    ],
  },
  {
    title: "Daily Operations",
    items: [
      { label: "Live Fleet Tracking", to: "/operations/today", icon: CalendarClock, badge: "Live", badgeColor: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30" },
      { label: "Timetable & Departures", to: "/operations/trips", icon: RouteIcon },
      { label: "Driver Shifts (Duties)", to: "/operations/duties", icon: CalendarClock },
      { label: "AI Auto-Scheduler", to: "/scheduling/optimizer", icon: Sparkles, badge: "AI", badgeColor: "bg-primary/20 text-primary border-primary/30" },
      { label: "Disruption Radar", to: "/operations/incidents", icon: AlertTriangle, badge: "Radar", badgeColor: "bg-destructive/15 text-destructive border-destructive/30" },
    ],
  },
  {
    title: "Buses & Vehicles",
    items: [
      { label: "Bus Fleet & Health", to: "/fleet/buses", icon: Bus },
      { label: "Maintenance Bays", to: "/fleet/maintenance", icon: Wrench },
    ],
  },
  {
    title: "Drivers & Crew",
    items: [
      { label: "Drivers & Licenses", to: "/crew/drivers", icon: UserCog },
      { label: "Conductors", to: "/crew/conductors", icon: Users },
      { label: "Crew Availability", to: "/crew/availability", icon: CalendarClock },
    ],
  },
  {
    title: "Routes & Stops",
    items: [
      { label: "Routes & Stops Map", to: "/network/routes", icon: Map },
      { label: "Route Builder", to: "/network/planner", icon: RouteIcon },
    ],
  },
  {
    title: "System Insights",
    items: [
      { label: "Analytics & Telemetry", to: "/analytics", icon: BarChart3 },
      { label: "Settings & Access", to: "/settings", icon: Settings },
    ],
  },
];

function isNavVisible(role: string, to: string): boolean {
  if (!role || role === "PLATFORM_ADMIN" || role === "ORGANIZATION_ADMIN") return true;

  switch (to) {
    case "/":
    case "/simulation":
      return true;
    case "/operations/today":
    case "/operations/trips":
    case "/operations/duties":
    case "/scheduling/optimizer":
    case "/operations/incidents":
      return ["SCHEDULER", "DEPOT_MANAGER", "ROUTE_PLANNER", "MANAGEMENT"].includes(role);
    case "/fleet/buses":
      return ["SCHEDULER", "DEPOT_MANAGER", "ROUTE_PLANNER", "MANAGEMENT"].includes(role);
    case "/fleet/maintenance":
      return ["DEPOT_MANAGER", "SCHEDULER"].includes(role);
    case "/crew/drivers":
    case "/crew/conductors":
    case "/crew/availability":
      return ["SCHEDULER", "DEPOT_MANAGER", "ROUTE_PLANNER", "MANAGEMENT"].includes(role);
    case "/network/routes":
      return ["SCHEDULER", "ROUTE_PLANNER", "DEPOT_MANAGER", "MANAGEMENT"].includes(role);
    case "/network/planner":
      return ["ROUTE_PLANNER", "SCHEDULER", "DEPOT_MANAGER"].includes(role);
    case "/analytics":
      return ["SCHEDULER", "ROUTE_PLANNER", "MANAGEMENT", "DEPOT_MANAGER"].includes(role);
    case "/settings":
      return ["ORGANIZATION_ADMIN", "PLATFORM_ADMIN"].includes(role);
    default:
      return true;
  }
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const context = Route.useRouteContext();
  const user = context?.user;
  const role = user?.role || "";

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground select-none">
      {/* Brand Header */}
      <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-4.5 bg-sidebar/90 backdrop-blur-md">
        <div className="relative flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 text-white shadow-lg shadow-indigo-500/30">
          <Bus className="size-5.5 text-white" />
          <span className="absolute -bottom-0.5 -right-0.5 flex size-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500"></span>
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-base font-extrabold tracking-tight text-sidebar-foreground">TransitOS</span>
            <span className="rounded-full bg-primary/20 px-1.5 py-0.2 text-[9px] font-mono font-bold text-primary uppercase border border-primary/30">PRO</span>
          </div>
          <p className="text-[11px] font-medium text-sidebar-foreground/60 truncate" title={user?.tenantName}>
            {user?.tenantName || "Salem Transport Corp."}
          </p>
        </div>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {NAV.map((group, gi) => {
          const visibleItems = group.items.filter((item) => isNavVisible(role, item.to));
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.title || gi} className="space-y-1">
              {group.title ? (
                <p className="px-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/45">
                  {group.title}
                </p>
              ) : null}
              {visibleItems.map((item) => {
                const active = item.to === "/" ? pathname === "/" : pathname === item.to || pathname.startsWith(item.to + "/");
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={onNavigate}
                    className={cn(
                      "group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-all duration-150",
                      active
                        ? "bg-sidebar-primary/15 text-sidebar-primary font-semibold shadow-xs"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                    )}
                  >
                    {active ? (
                      <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-sidebar-primary" />
                    ) : null}
                    <item.icon className={cn("size-4 shrink-0 transition-transform duration-150 group-hover:scale-110", active ? "text-sidebar-primary" : "text-sidebar-foreground/60")} />
                    <span className="truncate">{item.label}</span>
                    {item.badge ? (
                      <span className={cn("ml-auto rounded-full border px-1.5 py-0.2 text-[9px] font-bold font-mono tracking-tight", item.badgeColor || "bg-sidebar-accent text-sidebar-accent-foreground")}>
                        {item.badge}
                      </span>
                    ) : active ? (
                      <ChevronRight className="ml-auto size-3.5 opacity-60" />
                    ) : null}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* System Status Footer */}
      <div className="border-t border-sidebar-border p-3.5 bg-sidebar/50">
        <div className="flex items-center justify-between rounded-lg bg-sidebar-accent/40 p-2 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="relative flex size-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
            </span>
            <span className="font-mono text-[11px] font-medium text-sidebar-foreground/80 truncate">Telemetry Online</span>
          </div>
          <Badge variant="outline" className="border-sidebar-border bg-sidebar text-[10px] font-mono text-sidebar-foreground/70">
            25 Aug
          </Badge>
        </div>
      </div>
    </div>
  );
}

export function AppShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const router = useRouter();
  const context = Route.useRouteContext();
  const user = context?.user;

  const handleLogout = async () => {
    try {
      await logoutFn();
      toast.success("Logged out successfully");
      await router.invalidate();
      await router.navigate({ to: "/login" });
    } catch (err) {
      console.error("Logout error", err);
      toast.error("Failed to log out");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-sidebar-border shadow-xl shadow-black/5 lg:block z-30">
        <SidebarContent />
      </aside>
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Sticky Top Header with Glass Effect */}
        <header className="sticky top-0 z-20 border-b border-border/80 bg-background/85 backdrop-blur-md transition-all">
          <div className="flex items-center gap-3 px-4 py-3.5 sm:px-6">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="lg:hidden shrink-0">
                  <Menu className="size-4" />
                  <span className="sr-only">Open navigation</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 border-0 p-0">
                <SidebarContent onNavigate={() => setOpen(false)} />
              </SheetContent>
            </Sheet>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2.5">
                <h1 className="truncate text-lg font-bold tracking-tight sm:text-xl text-foreground">{title}</h1>
                <Badge variant="secondary" className="hidden sm:inline-flex text-[10px] font-mono font-semibold uppercase tracking-wider bg-primary/10 text-primary border-primary/20">
                  Salem Central
                </Badge>
                <span className="hidden md:inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  24 Buses Active
                </span>
              </div>
              {subtitle ? (
                <p className="mt-0.5 text-xs text-muted-foreground truncate">{subtitle}</p>
              ) : null}
            </div>

            {/* Header Right Actions */}
            <div className="flex shrink-0 items-center gap-2.5">
              {actions ? <div className="flex items-center gap-2">{actions}</div> : null}

              {/* Live Simulator Quick Launch */}
              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 border-indigo-500/30 text-indigo-600 dark:text-indigo-400 bg-indigo-500/5 hover:bg-indigo-500/15 hover:border-indigo-500/50 text-xs font-semibold cursor-pointer shadow-2xs"
                title="Launch Live Simulation Deck"
              >
                <Link to="/simulation">
                  <PlayCircle className="size-3.5 text-indigo-500 animate-pulse" />
                  <span className="hidden sm:inline">Simulator</span>
                </Link>
              </Button>

              {/* Global Quick Guide & Help Trigger */}
              <Sheet open={helpOpen} onOpenChange={setHelpOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 border-primary/30 text-primary bg-primary/5 hover:bg-primary/10 hover:border-primary/50 text-xs font-semibold cursor-pointer shadow-2xs"
                    title="Open TransitOS Operations Guide & Glossary"
                  >
                    <HelpCircle className="size-3.5 text-primary" />
                    <span className="hidden md:inline">Quick Guide</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto p-6 space-y-6">
                  <SheetHeader className="text-left space-y-2 border-b border-border/70 pb-4">
                    <div className="flex items-center gap-2">
                      <div className="grid size-8 place-items-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                        <BookOpen className="size-4" />
                      </div>
                      <div>
                        <SheetTitle className="text-base font-bold text-foreground">TransitOS Operations Guide</SheetTitle>
                        <SheetDescription className="text-xs text-muted-foreground">
                          Understand how transit features connect and what every operational term means.
                        </SheetDescription>
                      </div>
                    </div>
                  </SheetHeader>

                  {/* Interactive Simulation Callout */}
                  <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex size-2 rounded-full bg-indigo-500 animate-ping" />
                        <span className="text-xs font-bold text-foreground">Interactive Simulation Deck</span>
                      </div>
                      <Badge className="bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 text-[10px]">
                        Live Demo
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Want to see how everything works in real time? Scrub the 24h clock, watch buses drive Salem corridors, inject breakdowns, and test automated recovery.
                    </p>
                    <Button asChild size="sm" className="w-full h-7 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm">
                      <Link to="/simulation" onClick={() => setHelpOpen(false)}>
                        <PlayCircle className="size-3.5 mr-1.5" />
                        Launch Live Simulation
                      </Link>
                    </Button>
                  </div>

                  {/* Section 1: 5-Step Operational Lifecycle */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                      <Workflow className="size-4" />
                      <span>The 5-Step Operational Flow</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Follow this recommended path to take your depot from raw timetable data to live on-time dispatch:
                    </p>

                    <div className="space-y-2.5">
                      {[
                        {
                          step: "1",
                          title: "Corridors & Fleet",
                          desc: "Register routes, stops, bus inventory, and driver rosters with legal rest limits.",
                          to: "/network/routes",
                          badge: "Setup",
                        },
                        {
                          step: "2",
                          title: "Trip Timetable",
                          desc: "Define scheduled departures. Use 'Generate Timetable' to create trips at 15/30-min intervals.",
                          to: "/operations/trips",
                          badge: "Planning",
                        },
                        {
                          step: "3",
                          title: "AI Schedule Optimizer",
                          desc: "Run Google OR-Tools to mathematically chain trips into optimal shifts (duties) and bus assignments.",
                          to: "/scheduling/optimizer",
                          badge: "AI Optimization",
                        },
                        {
                          step: "4",
                          title: "Duty Dispatch & Today",
                          desc: "Review crew shifts, fine-tune manual assignments, and monitor live vehicles on duty.",
                          to: "/operations/duties",
                          badge: "Dispatch",
                        },
                        {
                          step: "5",
                          title: "Disruption Radar",
                          desc: "When a bus breaks down or delays occur, generate instant recovery options with zero guesswork.",
                          to: "/operations/incidents",
                          badge: "Recovery",
                        },
                      ].map((item) => (
                        <Link
                          key={item.step}
                          to={item.to}
                          onClick={() => setHelpOpen(false)}
                          className="group flex items-start gap-3 p-3 rounded-xl border border-border/70 bg-card/60 hover:border-primary/50 hover:bg-muted/50 transition-all cursor-pointer"
                        >
                          <div className="size-6 rounded-full bg-primary/10 text-primary font-bold text-xs grid place-items-center shrink-0 font-mono group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                            {item.step}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">{item.title}</p>
                              <Badge variant="outline" className="text-[9px] font-mono px-1 py-0 text-muted-foreground border-border/80">
                                {item.badge}
                              </Badge>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{item.desc}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Section 2: Transit Terms Simplified */}
                  <div className="space-y-3 pt-2 border-t border-border/70">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                      <Lightbulb className="size-4" />
                      <span>Transit Terms Simplified</span>
                    </div>

                    <div className="grid gap-2 text-xs">
                      <div className="p-2.5 rounded-lg border border-border/60 bg-muted/30">
                        <span className="font-bold text-foreground">Trip: </span>
                        <span className="text-muted-foreground">A single one-way bus journey between an origin and destination at a fixed time.</span>
                      </div>
                      <div className="p-2.5 rounded-lg border border-border/60 bg-muted/30">
                        <span className="font-bold text-foreground">Duty (Shift): </span>
                        <span className="text-muted-foreground">A full work shift for a crew member or bus, packaging multiple trips and required rest pauses.</span>
                      </div>
                      <div className="p-2.5 rounded-lg border border-border/60 bg-muted/30">
                        <span className="font-bold text-foreground">Deadhead: </span>
                        <span className="text-muted-foreground">Driving an empty bus from depot to the first stop. The AI optimizer minimizes this to save fuel.</span>
                      </div>
                      <div className="p-2.5 rounded-lg border border-border/60 bg-muted/30">
                        <span className="font-bold text-foreground">Continuous Driving: </span>
                        <span className="text-muted-foreground">Motor Vehicle Act rule limiting a driver to 240 mins (4 hrs) maximum continuous driving before a break.</span>
                      </div>
                      <div className="p-2.5 rounded-lg border border-border/60 bg-muted/30">
                        <span className="font-bold text-foreground">Spreadover: </span>
                        <span className="text-muted-foreground">Total elapsed time from driver clock-in to clock-out, including split-shift idle periods.</span>
                      </div>
                      <div className="p-2.5 rounded-lg border border-border/60 bg-muted/30">
                        <span className="font-bold text-foreground">Linked vs Unlinked: </span>
                        <span className="text-muted-foreground">Linked pairs a driver with one bus all day. Unlinked allows relief drivers to swap buses at major terminals.</span>
                      </div>
                      <div className="p-2.5 rounded-lg border border-border/60 bg-muted/30">
                        <span className="font-bold text-foreground">Google OR-Tools: </span>
                        <span className="text-muted-foreground">An open-source mathematical solver by Google that finds the highest-quality schedule out of millions of combinations.</span>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Quick Jump Shortcuts */}
                  <div className="pt-2 border-t border-border/70 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5 font-medium">
                      <ShieldCheck className="size-4 text-emerald-500" /> Multi-Tenant ISO Secure
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setHelpOpen(false)}
                      className="text-xs h-7 text-primary hover:text-primary hover:bg-primary/10"
                    >
                      Close Guide
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>

              {user && user.name && user.role ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2.5 rounded-full p-1 pl-2.5 hover:bg-muted/70 transition-colors border border-border/60 focus:outline-hidden">
                      <div className="text-right hidden md:block">
                        <p className="text-xs font-semibold leading-tight text-foreground">{user.name}</p>
                        <p className="text-[10px] font-mono text-muted-foreground uppercase">{user.role.replace("_", " ")}</p>
                      </div>
                      <Avatar className="size-8 ring-2 ring-primary/20 shadow-xs">
                        <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-primary-foreground font-bold text-xs">
                          {user.name ? user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase() : "U"}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-60 shadow-xl border-border/80" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal p-3">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-bold text-foreground leading-none">{user.name}</p>
                        <p className="text-xs font-mono text-muted-foreground">{user.email}</p>
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className="size-1.5 rounded-full bg-emerald-500"></span>
                          <span className="text-[10px] font-semibold text-primary">{user.tenantName}</span>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/settings" className="w-full flex items-center cursor-pointer">
                        <Settings className="mr-2.5 size-4 text-muted-foreground" />
                        <span>System Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer">
                      <LogOut className="mr-2.5 size-4" />
                      <span>Sign Out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
            </div>
          </div>
        </header>

        {/* Main Workspace Body */}
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}

export function ComingSoon({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <AppShell title={title} subtitle={subtitle}>
      <div className="glass-panel grid min-h-[55vh] place-items-center p-10 text-center animate-fade-in">
        <div className="max-w-md space-y-4">
          <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-lg shadow-primary/10 animate-float">
            <Radio className="size-8 animate-pulse" />
          </div>
          <div className="space-y-1.5">
            <Badge variant="outline" className="font-mono text-xs uppercase tracking-widest text-primary border-primary/30">
              Module Roadmap
            </Badge>
            <h2 className="text-xl font-bold tracking-tight text-foreground">{title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {subtitle || "This advanced transit module is scheduled for the next operational release wave."}
            </p>
          </div>
          <div className="pt-2 flex justify-center gap-3">
            <Button asChild variant="outline" size="sm" className="font-medium">
              <Link to="/scheduling/optimizer">Go to Optimizer</Link>
            </Button>
            <Button asChild size="sm" className="font-medium bg-primary text-primary-foreground">
              <Link to="/operations/today">View Active Duties</Link>
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
