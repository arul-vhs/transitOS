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
  Building2,
  ChevronDown,
  Check,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { useActiveTenant } from "@/lib/tenant-context";

import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
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

type NavItem = { label: string; to: string; icon: typeof Bus };
type NavGroup = { title: string; items: NavItem[] };

const NAV: NavGroup[] = [
  {
    title: "Operations",
    items: [
      { label: "Dashboard", to: "/", icon: Gauge },
      {
        label: "Schedules & Trips",
        to: "/operations/trips",
        icon: CalendarClock,
      },
      { label: "Driver Shifts", to: "/operations/duties", icon: CalendarClock },
      { label: "Live Tracking", to: "/operations/today", icon: RouteIcon },
      {
        label: "Reports & Analytics",
        to: "/analytics",
        icon: BarChart3,
      },
    ],
  },
  {
    title: "Fleet & Routes",
    items: [
      { label: "Buses", to: "/fleet/buses", icon: Bus },
      { label: "Drivers", to: "/crew/drivers", icon: Users },
      { label: "Conductors", to: "/crew/conductors", icon: Users },
      { label: "Routes & Stops", to: "/network/routes", icon: Map },
    ],
  },
  {
    title: "Tools & Settings",
    items: [
      { label: "Simulation Deck", to: "/simulation", icon: PlayCircle },
      { label: "Settings", to: "/settings", icon: Settings },
    ],
  },
];

function isNavVisible(role: string, to: string): boolean {
  if (!role || role === "PLATFORM_ADMIN" || role === "ORGANIZATION_ADMIN")
    return true;

  switch (to) {
    case "/":
    case "/simulation":
      return true;
    case "/operations/today":
    case "/operations/trips":
    case "/operations/duties":
    case "/analytics":
      return [
        "SCHEDULER",
        "DEPOT_MANAGER",
        "ROUTE_PLANNER",
        "MANAGEMENT",
      ].includes(role);
    case "/fleet/buses":
      return [
        "SCHEDULER",
        "DEPOT_MANAGER",
        "ROUTE_PLANNER",
        "MANAGEMENT",
      ].includes(role);
    case "/crew/drivers":
    case "/crew/conductors":
      return [
        "SCHEDULER",
        "DEPOT_MANAGER",
        "ROUTE_PLANNER",
        "MANAGEMENT",
      ].includes(role);
    case "/network/routes":
      return [
        "SCHEDULER",
        "ROUTE_PLANNER",
        "DEPOT_MANAGER",
        "MANAGEMENT",
      ].includes(role);
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
  const { currentTenant } = useActiveTenant();

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground select-none">
      {/* Brand Header */}
      <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-4.5 bg-sidebar/90 backdrop-blur-md">
        <div className="relative flex size-10 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
          <Bus className="size-5.5 text-white" />
          <span className="absolute -bottom-0.5 -right-0.5 flex size-2.5">
            <span className="relative inline-flex size-2 rounded bg-emerald-500"></span>
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-base font-extrabold tracking-tight text-sidebar-foreground">
              TransitOS
            </span>
            <span className="rounded bg-slate-800 px-1.5 py-0.2 text-[9px] font-mono font-bold text-slate-300 uppercase border border-slate-700">
              OPERATIONS
            </span>
          </div>
          <p
            className="text-[11px] font-medium text-sidebar-foreground/60 truncate"
            title={currentTenant.name}
          >
            {currentTenant.name}
          </p>
        </div>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {NAV.map((group, gi) => {
          const visibleItems = group.items.filter((item) =>
            isNavVisible(role, item.to),
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.title || gi} className="space-y-1">
              {group.title ? (
                <p className="px-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/45">
                  {group.title}
                </p>
              ) : null}
              {visibleItems.map((item) => {
                const active =
                  item.to === "/"
                    ? pathname === "/"
                    : pathname === item.to ||
                      pathname.startsWith(item.to + "/");
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
                      <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r bg-sidebar-primary" />
                    ) : null}
                    <item.icon
                      className={cn(
                        "size-4 shrink-0 transition-transform duration-150 group-hover:scale-110",
                        active
                          ? "text-sidebar-primary"
                          : "text-sidebar-foreground/60",
                      )}
                    />
                    <span className="truncate">{item.label}</span>
                    {active ? (
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
              <span className="inline-flex size-2 rounded bg-emerald-500"></span>
            </span>
            <span className="font-mono text-[11px] font-medium text-sidebar-foreground/80 truncate">
              System Online
            </span>
          </div>
          <Badge
            variant="outline"
            className="border-sidebar-border bg-sidebar text-[10px] font-mono text-sidebar-foreground/70 rounded"
          >
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
  const { allTenants, currentTenant, currentDepot, switchTenant, switchDepot } =
    useActiveTenant();

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
                <Button
                  variant="outline"
                  size="icon"
                  className="lg:hidden shrink-0"
                >
                  <Menu className="size-4" />
                  <span className="sr-only">Open navigation</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 border-0 p-0">
                <SidebarContent onNavigate={() => setOpen(false)} />
              </SheetContent>
            </Sheet>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="truncate text-lg font-bold tracking-tight sm:text-xl text-foreground">
                  {title}
                </h1>

                {/* Multi-Tenant Corporation & Depot Switcher */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="hidden sm:inline-flex items-center gap-1.5 rounded-md border border-primary/25 bg-primary/10 hover:bg-primary/15 px-2.5 py-1 text-xs font-semibold text-primary transition-colors cursor-pointer"
                      title="Switch Operating Corporation & Depot (Multi-Tenant)"
                    >
                      <Building2 className="size-3.5" />
                      <span className="font-mono text-[10px] truncate max-w-[140px] md:max-w-[200px]">
                        {currentTenant.name
                          .replace(" Corporation", "")
                          .replace(" Transit", "")}{" "}
                        : {currentDepot}
                      </span>
                      <ChevronDown className="size-3 opacity-60" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="w-80 shadow-lg border-border"
                  >
                    <DropdownMenuLabel className="text-[11px] text-muted-foreground uppercase tracking-wider font-mono">
                      Switch Corporation (Multi-Tenant)
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {allTenants.map((t) => (
                      <DropdownMenuItem
                        key={t.id}
                        onClick={() => {
                          switchTenant(t.id);
                          toast.success(
                            `Switched to ${t.name} (${t.activeDepot})`,
                          );
                        }}
                        className="flex items-center justify-between cursor-pointer py-2"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-xs text-foreground truncate">
                            {t.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground font-mono">
                            {t.region} · {t.fleetCount} Buses · {t.routesCount}{" "}
                            Routes
                          </p>
                        </div>
                        {t.id === currentTenant.id && (
                          <Check className="size-4 text-primary ml-2 shrink-0" />
                        )}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-[11px] text-muted-foreground uppercase tracking-wider font-mono">
                      Depot Selection ({currentTenant.name})
                    </DropdownMenuLabel>
                    {currentTenant.depots.map(
                      (
                        d: string | { id: string; name: string; code?: string },
                      ) => {
                        const depotName = typeof d === "string" ? d : d.name;
                        const depotCode = typeof d === "string" ? "" : d.code;
                        const depotKey = typeof d === "string" ? d : d.id;
                        const isSelected = depotName === currentDepot;
                        return (
                          <DropdownMenuItem
                            key={depotKey}
                            onClick={() => {
                              switchDepot(depotName);
                              toast.success(
                                `Operating depot set to ${depotName}`,
                              );
                            }}
                            className="text-xs flex items-center justify-between cursor-pointer"
                          >
                            <div className="flex items-center gap-1.5">
                              <span>{depotName}</span>
                              {depotCode ? (
                                <span className="text-[10px] text-muted-foreground font-mono">
                                  ({depotCode})
                                </span>
                              ) : null}
                            </div>
                            {isSelected && (
                              <Check className="size-3.5 text-primary ml-2 shrink-0" />
                            )}
                          </DropdownMenuItem>
                        );
                      },
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              {subtitle ? (
                <p className="mt-0.5 text-xs text-muted-foreground truncate">
                  {subtitle}
                </p>
              ) : null}
            </div>

            {/* Header Right Actions */}
            <div className="flex shrink-0 items-center gap-2.5">
              {actions ? (
                <div className="flex items-center gap-2">{actions}</div>
              ) : null}

              {/* Beginner Guide Sheet Trigger */}
              <Sheet open={helpOpen} onOpenChange={setHelpOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 border-border hover:bg-muted text-xs font-semibold cursor-pointer rounded-md shadow-2xs"
                    title="Open Beginner Guide & Common Terms"
                  >
                    <BookOpen className="size-3.5 text-primary" />
                    <span className="hidden md:inline">Help Guide</span>
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="w-full sm:max-w-lg overflow-y-auto p-6 space-y-6"
                >
                  <SheetHeader className="text-left space-y-2 border-b border-border/70 pb-4">
                    <div className="flex items-center gap-2">
                      <div className="grid size-8 place-items-center rounded bg-primary/10 text-primary border border-primary/20">
                        <BookOpen className="size-4" />
                      </div>
                      <div>
                        <SheetTitle className="text-base font-bold text-foreground">
                          Beginner Guide: Transit Operations
                        </SheetTitle>
                        <SheetDescription className="text-xs text-muted-foreground">
                          Everything you need to know to manage routes, buses,
                          and driver shifts.
                        </SheetDescription>
                      </div>
                    </div>
                  </SheetHeader>

                  {/* 3-Step Routine */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                      <Workflow className="size-4" />
                      <span>The 3-Step Daily Routine</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Follow these 3 simple steps to organize your depot every
                      day:
                    </p>

                    <div className="space-y-2.5">
                      {[
                        {
                          step: "1",
                          title: "Set Timetable & Trips",
                          desc: "Review departure times. Add single trips or use Auto-Fill to generate trips every 15 or 30 minutes.",
                          to: "/operations/trips",
                          badge: "Timetable",
                        },
                        {
                          step: "2",
                          title: "Assign Drivers & Buses",
                          desc: "Pair drivers and buses with scheduled trips. The system checks rest requirements automatically.",
                          to: "/operations/duties",
                          badge: "Shifts",
                        },
                        {
                          step: "3",
                          title: "Live Tracking & Delays",
                          desc: "Monitor active buses on the road. If a bus is delayed or broken down, deploy a replacement in seconds.",
                          to: "/operations/today",
                          badge: "Live Board",
                        },
                      ].map((item) => (
                        <Link
                          key={item.step}
                          to={item.to}
                          onClick={() => setHelpOpen(false)}
                          className="group flex items-start gap-3 p-3 rounded-lg border border-border/70 bg-card hover:border-primary/50 hover:bg-muted/50 transition-all cursor-pointer"
                        >
                          <div className="size-6 rounded bg-primary/10 text-primary font-bold text-xs grid place-items-center shrink-0 font-mono group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                            {item.step}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                                {item.title}
                              </p>
                              <Badge
                                variant="outline"
                                className="text-[9px] font-mono px-1 py-0 text-muted-foreground border-border/80 rounded"
                              >
                                {item.badge}
                              </Badge>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                              {item.desc}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Plain English Glossary */}
                  <div className="space-y-3 pt-2 border-t border-border/70">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                      <Lightbulb className="size-4" />
                      <span>Key Terms Explained in Plain English</span>
                    </div>

                    <div className="grid gap-2 text-xs">
                      <div className="p-2.5 rounded-md border border-border/60 bg-muted/30">
                        <span className="font-bold text-foreground">
                          Trip:{" "}
                        </span>
                        <span className="text-muted-foreground">
                          A single one-way journey between two terminals (e.g.
                          Town Bus Stand to Salem Junction).
                        </span>
                      </div>
                      <div className="p-2.5 rounded-md border border-border/60 bg-muted/30">
                        <span className="font-bold text-foreground">
                          Shift (Duty):{" "}
                        </span>
                        <span className="text-muted-foreground">
                          A driver's day of work. It links several trips
                          together with required lunch and rest breaks.
                        </span>
                      </div>
                      <div className="p-2.5 rounded-md border border-border/60 bg-muted/30">
                        <span className="font-bold text-foreground">
                          Standby Bus:{" "}
                        </span>
                        <span className="text-muted-foreground">
                          A reserve bus parked at the depot ready to replace any
                          broken-down bus immediately.
                        </span>
                      </div>
                      <div className="p-2.5 rounded-md border border-border/60 bg-muted/30">
                        <span className="font-bold text-foreground">
                          Corridor:{" "}
                        </span>
                        <span className="text-muted-foreground">
                          A designated transit route connecting major city
                          centers and bus stops.
                        </span>
                      </div>
                      <div className="p-2.5 rounded-md border border-border/60 bg-muted/30">
                        <span className="font-bold text-foreground">
                          Rest Rules:{" "}
                        </span>
                        <span className="text-muted-foreground">
                          Safety regulations requiring drivers to take breaks
                          after 4 hours of driving to prevent fatigue.
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Simulation Link */}
                  <div className="rounded-lg border border-border bg-muted/20 p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">
                        Want to test before making changes?
                      </span>
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] rounded">
                        Interactive
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Use the Corridor Simulation Deck to see buses driving
                      along Salem routes in real time.
                    </p>
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="w-full h-8 text-xs rounded-md shadow-xs"
                    >
                      <Link to="/simulation" onClick={() => setHelpOpen(false)}>
                        <PlayCircle className="size-3.5 mr-1.5 text-primary" />
                        Open Simulation Deck
                      </Link>
                    </Button>
                  </div>

                  {/* Footer */}
                  <div className="pt-2 border-t border-border/70 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5 font-medium">
                      <ShieldCheck className="size-4 text-emerald-500" /> Salem
                      Transport Corporation
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setHelpOpen(false)}
                      className="text-xs h-7 text-primary hover:text-primary hover:bg-primary/10 rounded-md"
                    >
                      Close Guide
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>

              {user && user.name && user.role ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2.5 rounded-md p-1 pl-2.5 hover:bg-muted/70 transition-colors border border-border/60 focus:outline-hidden">
                      <div className="text-right hidden md:block">
                        <p className="text-xs font-semibold leading-tight text-foreground">
                          {user.name}
                        </p>
                        <p className="text-[10px] font-mono text-muted-foreground uppercase">
                          {user.role.replace("_", " ")}
                        </p>
                      </div>
                      <Avatar className="size-8 ring-2 ring-primary/20 shadow-xs">
                        <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-primary-foreground font-bold text-xs">
                          {user.name
                            ? user.name
                                .split(" ")
                                .map((n: string) => n[0])
                                .join("")
                                .toUpperCase()
                            : "U"}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-60 shadow-xl border-border/80"
                    align="end"
                    forceMount
                  >
                    <DropdownMenuLabel className="font-normal p-3">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-bold text-foreground leading-none">
                          {user.name}
                        </p>
                        <p className="text-xs font-mono text-muted-foreground">
                          {user.email}
                        </p>
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className="size-1.5 rounded-full bg-emerald-500"></span>
                          <span className="text-[10px] font-semibold text-primary">
                            {user.tenantName}
                          </span>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link
                        to="/settings"
                        className="w-full flex items-center cursor-pointer"
                      >
                        <Settings className="mr-2.5 size-4 text-muted-foreground" />
                        <span>System Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                    >
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
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export function ComingSoon({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <AppShell title={title} subtitle={subtitle}>
      <div className="glass-panel grid min-h-[55vh] place-items-center p-10 text-center animate-fade-in">
        <div className="max-w-md space-y-4">
          <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-lg shadow-primary/10 animate-float">
            <Radio className="size-8 animate-pulse" />
          </div>
          <div className="space-y-1.5">
            <Badge
              variant="outline"
              className="font-mono text-xs uppercase tracking-widest text-primary border-primary/30"
            >
              Module Roadmap
            </Badge>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              {title}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {subtitle ||
                "This advanced transit module is scheduled for the next operational release wave."}
            </p>
          </div>
          <div className="pt-2 flex justify-center gap-3">
            <Button asChild variant="outline" size="sm" className="font-medium">
              <Link to="/scheduling/optimizer">Go to Optimizer</Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="font-medium bg-primary text-primary-foreground"
            >
              <Link to="/operations/today">View Active Duties</Link>
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
