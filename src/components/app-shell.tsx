import { Link, useRouterState, useRouter } from "@tanstack/react-router";
import {
  BarChart3,
  Bus,
  CalendarClock,
  ChevronRight,
  Compass,
  Gauge,
  Map,
  Menu,
  Route as RouteIcon,
  Settings,
  Users,
  LogOut,
  BookOpen,
  Lightbulb,
  Workflow,
  ShieldCheck,
  Building2,
  ChevronDown,
  Check,
  Radio,
  Play,
  Sun,
  Moon,
  Laptop,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { useTheme } from "@/components/theme-provider";
import { useActiveTenant } from "@/lib/tenant-context";
import { GlobalSearchBar } from "@/components/global-search-bar";

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

// Streamlined navigation organized strictly around the transport operational lifecycle
const NAV: NavGroup[] = [
  {
    title: "Operational Lifecycle",
    items: [
      { label: "Dashboard", to: "/", icon: Gauge },
      { label: "Transit Network Map", to: "/network/map", icon: Map },
      { label: "Routes & Corridors", to: "/network/routes", icon: RouteIcon },
      { label: "Route Planner", to: "/network/planner", icon: Compass },
      { label: "Bus Fleet", to: "/fleet/buses", icon: Bus },
      { label: "Bus Crew", to: "/crew/drivers", icon: Users },
      { label: "Crew Shift & SOS Portal", to: "/crew/portal", icon: ShieldCheck },
      { label: "Schedules & Timetable", to: "/operations/trips", icon: CalendarClock },
      { label: "Passenger Demand & Allocation", to: "/operations/allocation", icon: Workflow },
      { label: "Simulation Deck", to: "/simulation", icon: Play },
      { label: "Live Tracking", to: "/operations/today", icon: Radio },
    ],
  },
  {
    title: "Analysis & Setup",
    items: [
      { label: "Operations Reports", to: "/analytics", icon: BarChart3 },
      { label: "Transport Setup", to: "/settings", icon: Settings },
    ],
  },
];

function isNavVisible(role: string, to: string): boolean {
  if (!role || role === "PLATFORM_ADMIN" || role === "ORGANIZATION_ADMIN")
    return true;

  switch (to) {
    case "/":
    case "/network/map":
    case "/simulation":
    case "/operations/today":
    case "/operations/trips":
    case "/analytics":
    case "/fleet/buses":
    case "/crew/drivers":
    case "/crew/portal":
    case "/network/routes":
    case "/network/planner":
    case "/operations/allocation":
      return true;
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
      <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-4 bg-sidebar/90 backdrop-blur-md">
        <div className="relative flex size-10 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs shrink-0">
          <Bus className="size-5 text-white" />
          <span className="absolute -bottom-0.5 -right-0.5 flex size-2.5">
            <span className="relative inline-flex size-2 rounded-xs bg-emerald-500"></span>
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-base font-extrabold tracking-tight text-sidebar-foreground">
              TransitOS
            </span>
            <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] font-mono font-bold text-slate-300 uppercase border border-slate-700 leading-none">
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

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0 border-border hover:bg-muted cursor-pointer rounded-md shadow-2xs"
          title={`Theme: ${theme.charAt(0).toUpperCase() + theme.slice(1)}`}
        >
          {resolvedTheme === "dark" ? (
            <Moon className="size-4 text-sky-400" />
          ) : (
            <Sun className="size-4 text-amber-500" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36 rounded-lg shadow-lg border-border">
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className="flex items-center justify-between text-xs cursor-pointer py-1.5 rounded-md"
        >
          <div className="flex items-center gap-2">
            <Sun className="size-3.5 text-amber-500" />
            <span>Light</span>
          </div>
          {theme === "light" && <Check className="size-3.5 text-primary" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className="flex items-center justify-between text-xs cursor-pointer py-1.5 rounded-md"
        >
          <div className="flex items-center gap-2">
            <Moon className="size-3.5 text-sky-400" />
            <span>Dark</span>
          </div>
          {theme === "dark" && <Check className="size-3.5 text-primary" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className="flex items-center justify-between text-xs cursor-pointer py-1.5 rounded-md"
        >
          <div className="flex items-center gap-2">
            <Laptop className="size-3.5 text-muted-foreground" />
            <span>System</span>
          </div>
          {theme === "system" && <Check className="size-3.5 text-primary" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
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
        {/* Sticky Top Header */}
        <header className="sticky top-0 z-20 border-b border-border/80 bg-background/85 backdrop-blur-md transition-all">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="lg:hidden shrink-0 rounded-md"
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
                <h1 className="truncate text-base font-bold tracking-tight sm:text-lg text-foreground">
                  {title}
                </h1>

                {/* Multi-Tenant Corporation & Depot Switcher */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="hidden sm:inline-flex items-center gap-1.5 rounded-md border border-primary/25 bg-primary/10 hover:bg-primary/15 px-2.5 py-1 text-xs font-semibold text-primary transition-colors cursor-pointer"
                      title="Switch Operating Corporation & Depot"
                    >
                      <Building2 className="size-3.5" />
                      <span className="font-mono text-[10px] truncate max-w-[140px] md:max-w-[200px]">
                        {currentTenant.name.replace(" Corporation", "").replace(" Transit", "")}: {currentDepot}
                      </span>
                      <ChevronDown className="size-3 opacity-60" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="w-80 shadow-lg border-border rounded-lg"
                  >
                    <DropdownMenuLabel className="text-[11px] text-muted-foreground uppercase tracking-wider font-mono">
                      Switch Transport Corporation
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
                        className="flex items-center justify-between cursor-pointer py-2 rounded-md"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-xs text-foreground truncate">
                            {t.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground font-mono">
                            {t.region} · {t.fleetCount} Buses · {t.routesCount} Routes
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
                            className="text-xs flex items-center justify-between cursor-pointer rounded-md"
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

            
            {/* Persistent Global Search */}
            <div className="hidden sm:flex items-center flex-1 max-w-sm ml-2">
              <GlobalSearchBar />
            </div>

            {/* Header Right Actions */}
            <div className="flex shrink-0 items-center gap-2">
              {actions ? (
                <div className="flex items-center gap-2">{actions}</div>
              ) : null}

              {/* Operations Guide Sheet Trigger */}
              <Sheet open={helpOpen} onOpenChange={setHelpOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 border-border hover:bg-muted text-xs font-semibold cursor-pointer rounded-md shadow-2xs"
                    title="Open Operations Guide"
                  >
                    <BookOpen className="size-3.5 text-primary" />
                    <span className="hidden md:inline">Operations Guide</span>
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="w-full sm:max-w-lg overflow-y-auto p-6 space-y-6"
                >
                  <SheetHeader className="text-left space-y-2 border-b border-border/70 pb-4">
                    <div className="flex items-center gap-2">
                      <div className="grid size-8 place-items-center rounded-md bg-primary/10 text-primary border border-primary/20">
                        <BookOpen className="size-4" />
                      </div>
                      <div>
                        <SheetTitle className="text-base font-bold text-foreground">
                          Transport Operations Guide
                        </SheetTitle>
                        <SheetDescription className="text-xs text-muted-foreground">
                          Operational instructions for managing corridors, fleet, and schedules.
                        </SheetDescription>
                      </div>
                    </div>
                  </SheetHeader>

                  {/* 3-Step Routine */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                      <Workflow className="size-4" />
                      <span>Daily Operational Flow</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Follow these standard steps to organize daily transport operations:
                    </p>

                    <div className="space-y-2.5">
                      {[
                        {
                          step: "1",
                          title: "Routes & Fleet Setup",
                          desc: "Verify active bus corridors and buses available at the depot.",
                          to: "/network/routes",
                          badge: "Setup",
                        },
                        {
                          step: "2",
                          title: "Schedules & Assignments",
                          desc: "Pair available buses and crew with departure timings. Check conflicts automatically.",
                          to: "/operations/trips",
                          badge: "Scheduling",
                        },
                        {
                          step: "3",
                          title: "Live Tracking",
                          desc: "Monitor active bus runs on the road and log any disruptions or replacements.",
                          to: "/operations/today",
                          badge: "Operations",
                        },
                      ].map((item) => (
                        <Link
                          key={item.step}
                          to={item.to}
                          onClick={() => setHelpOpen(false)}
                          className="group flex items-start gap-3 p-3 rounded-lg border border-border/70 bg-card hover:border-primary/50 hover:bg-muted/50 transition-all cursor-pointer"
                        >
                          <div className="size-6 rounded-md bg-primary/10 text-primary font-bold text-xs grid place-items-center shrink-0 font-mono group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                            {item.step}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                                {item.title}
                              </p>
                              <Badge
                                variant="outline"
                                className="text-[9px] font-mono px-1 py-0 text-muted-foreground border-border/80 rounded-md"
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

                  {/* Operational Glossary */}
                  <div className="space-y-3 pt-2 border-t border-border/70">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                      <Lightbulb className="size-4" />
                      <span>Operational Terminology</span>
                    </div>

                    <div className="grid gap-2 text-xs">
                      <div className="p-2.5 rounded-md border border-border/60 bg-muted/30">
                        <span className="font-bold text-foreground">
                          Trip:{" "}
                        </span>
                        <span className="text-muted-foreground">
                          A single one-way transit journey between two terminals (e.g. Town Bus Stand to Salem Junction).
                        </span>
                      </div>
                      <div className="p-2.5 rounded-md border border-border/60 bg-muted/30">
                        <span className="font-bold text-foreground">
                          Duty Shift:{" "}
                        </span>
                        <span className="text-muted-foreground">
                          A crew work shift grouping consecutive trips with required rest intervals.
                        </span>
                      </div>
                      <div className="p-2.5 rounded-md border border-border/60 bg-muted/30">
                        <span className="font-bold text-foreground">
                          Standby Bus:{" "}
                        </span>
                        <span className="text-muted-foreground">
                          A reserve bus stationed at the depot ready to replace any disrupted vehicle immediately.
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="pt-2 border-t border-border/70 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5 font-medium">
                      <ShieldCheck className="size-4 text-emerald-500" />
                      {currentTenant.name}
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

              {/* Theme Toggle (Light / Dark / System) */}
              <ThemeToggle />

              {user && user.name && user.role ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2.5 rounded-md p-1 pl-2 hover:bg-muted/70 transition-colors border border-border/60 focus:outline-hidden">
                      <div className="text-right hidden md:block">
                        <p className="text-xs font-semibold leading-tight text-foreground">
                          {user.name}
                        </p>
                        <p className="text-[10px] font-mono text-muted-foreground uppercase">
                          {user.role.replace("_", " ")}
                        </p>
                      </div>
                      <Avatar className="size-8 rounded-md ring-2 ring-primary/20 shadow-xs">
                        <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xs rounded-md">
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
                    className="w-60 shadow-xl border-border/80 rounded-lg"
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
                          <span className="size-1.5 rounded-md bg-emerald-500"></span>
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
                        className="w-full flex items-center cursor-pointer rounded-md"
                      >
                        <Settings className="mr-2.5 size-4 text-muted-foreground" />
                        <span>System Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer rounded-md"
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
      <div className="rounded-lg border border-border bg-card grid min-h-[55vh] place-items-center p-10 text-center">
        <div className="max-w-md space-y-4">
          <div className="mx-auto grid size-16 place-items-center rounded-lg bg-primary/10 text-primary border border-primary/20 shadow-xs">
            <Radio className="size-8" />
          </div>
          <div className="space-y-1.5">
            <Badge
              variant="outline"
              className="font-mono text-xs uppercase tracking-widest text-primary border-primary/30 rounded-md"
            >
              Operational Module
            </Badge>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              {title}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {subtitle ||
                "This transit operational module is configured for scheduled rollout."}
            </p>
          </div>
          <div className="pt-2 flex justify-center gap-3">
            <Button asChild variant="outline" size="sm" className="font-medium rounded-md">
              <Link to="/operations/trips">Go to Schedules</Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md"
            >
              <Link to="/operations/today">View Live Dispatch</Link>
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
