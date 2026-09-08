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
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
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
  { title: "Command Center", items: [{ label: "Dashboard", to: "/", icon: Gauge }] },
  {
    title: "Operations & Dispatch",
    items: [
      { label: "Today's Operations", to: "/operations/today", icon: CalendarClock, badge: "Live", badgeColor: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30" },
      { label: "Trip Timetable", to: "/operations/trips", icon: RouteIcon },
      { label: "Duty Builder", to: "/operations/duties", icon: CalendarClock },
      { label: "Schedule Optimizer", to: "/scheduling/optimizer", icon: Sparkles, badge: "AI", badgeColor: "bg-primary/20 text-primary border-primary/30" },
      { label: "Disruption Manager", to: "/operations/incidents", icon: AlertTriangle, badge: "Radar", badgeColor: "bg-destructive/15 text-destructive border-destructive/30" },
    ],
  },
  {
    title: "Fleet Management",
    items: [
      { label: "Vehicle Registry", to: "/fleet/buses", icon: Bus },
      { label: "Maintenance Bays", to: "/fleet/maintenance", icon: Wrench },
    ],
  },
  {
    title: "Crew & Rostering",
    items: [
      { label: "Driver Roster", to: "/crew/drivers", icon: UserCog },
      { label: "Conductor Roster", to: "/crew/conductors", icon: Users },
      { label: "Availability Timeline", to: "/crew/availability", icon: CalendarClock },
    ],
  },
  {
    title: "Corridors & GIS",
    items: [
      { label: "Route Network", to: "/network/routes", icon: Map },
      { label: "Route Planner", to: "/network/planner", icon: RouteIcon },
    ],
  },
  {
    title: "Analytics & System",
    items: [
      { label: "Analytics & Telemetry", to: "/analytics", icon: BarChart3 },
      { label: "System Settings", to: "/settings", icon: Settings },
    ],
  },
];

function isNavVisible(role: string, to: string): boolean {
  if (role === "PLATFORM_ADMIN" || role === "ORGANIZATION_ADMIN") return true;

  switch (to) {
    case "/":
      return true;
    case "/operations/today":
    case "/operations/trips":
    case "/operations/duties":
    case "/scheduling/optimizer":
    case "/operations/incidents":
      return ["SCHEDULER", "DEPOT_MANAGER"].includes(role);
    case "/fleet/buses":
      return ["SCHEDULER", "DEPOT_MANAGER"].includes(role);
    case "/fleet/maintenance":
      return ["DEPOT_MANAGER"].includes(role);
    case "/crew/drivers":
    case "/crew/conductors":
    case "/crew/availability":
      return ["SCHEDULER", "DEPOT_MANAGER"].includes(role);
    case "/network/routes":
      return ["SCHEDULER", "ROUTE_PLANNER", "DEPOT_MANAGER", "MANAGEMENT"].includes(role);
    case "/network/planner":
      return ["ROUTE_PLANNER"].includes(role);
    case "/analytics":
      return ["SCHEDULER", "ROUTE_PLANNER", "MANAGEMENT"].includes(role);
    case "/settings":
      return ["ORGANIZATION_ADMIN", "PLATFORM_ADMIN"].includes(role);
    default:
      return false;
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
      <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-4.5 bg-sidebar/80 backdrop-blur">
        <div className="relative flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-md shadow-primary/25">
          <Bus className="size-5.5" />
          <span className="absolute -bottom-0.5 -right-0.5 flex size-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500"></span>
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-base font-bold tracking-tight text-sidebar-foreground">TransitOS</span>
            <span className="rounded bg-sidebar-primary/20 px-1.5 py-0.2 text-[10px] font-mono font-semibold text-sidebar-primary uppercase">v2.4</span>
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
                const active = pathname === item.to;
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
              </div>
              {subtitle ? (
                <p className="mt-0.5 text-xs text-muted-foreground truncate">{subtitle}</p>
              ) : null}
            </div>

            {/* Header Right Actions */}
            <div className="flex shrink-0 items-center gap-3">
              {actions ? <div className="flex items-center gap-2">{actions}</div> : null}

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
