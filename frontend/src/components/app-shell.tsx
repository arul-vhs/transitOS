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
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
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
  { title: "", items: [{ label: "Dashboard", to: "/", icon: Gauge }] },
  {
    title: "Operations",
    items: [
      { label: "Today's Operations", to: "/operations/today", icon: CalendarClock },
      { label: "Trip Management", to: "/operations/trips", icon: RouteIcon },
      { label: "Duty Builder", to: "/operations/duties", icon: CalendarClock },
      { label: "Schedule Optimizer", to: "/scheduling/optimizer", icon: Bus },
    ],
  },
  {
    title: "Fleet",
    items: [
      { label: "Buses", to: "/fleet/buses", icon: Bus },
      { label: "Maintenance", to: "/fleet/maintenance", icon: Wrench },
    ],
  },
  {
    title: "Crew",
    items: [
      { label: "Drivers", to: "/crew/drivers", icon: UserCog },
      { label: "Conductors", to: "/crew/conductors", icon: Users },
      { label: "Availability Timeline", to: "/crew/availability", icon: CalendarClock },
    ],
  },
  {
    title: "Routes",
    items: [
      { label: "Route Network", to: "/network/routes", icon: Map },
      { label: "Route Planner", to: "/network/planner", icon: RouteIcon },
    ],
  },
  {
    title: "",
    items: [
      { label: "Analytics", to: "/analytics", icon: BarChart3 },
      { label: "Settings", to: "/settings", icon: Settings },
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
      return false; // only admin (handled by default true at the top)
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
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-4">
        <div className="grid size-9 place-items-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
          <Bus className="size-5" />
        </div>
        <div>
          <p className="text-sm font-semibold tracking-tight">TransitOS</p>
          <p className="text-[11px] text-sidebar-foreground/60 truncate max-w-[140px]" title={user?.tenantName}>
            {user?.tenantName || "Salem Transport Corp."}
          </p>
        </div>
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {NAV.map((group, gi) => {
          const visibleItems = group.items.filter((item) => isNavVisible(role, item.to));
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.title || gi} className="space-y-1">
              {group.title ? (
                <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/45">
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
                      "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                      active
                        ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                    )}
                  >
                    <item.icon className="size-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                    {active ? <ChevronRight className="ml-auto size-3.5 opacity-60" /> : null}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border px-5 py-3 text-[11px] text-sidebar-foreground/55">
        Demo build · {user?.role ? `${user.role.replace("_", " ")}` : "Guest"}
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
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-sidebar-border lg:block">
        <SidebarContent />
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-4 sm:px-6">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="lg:hidden">
                  <Menu className="size-4" />
                  <span className="sr-only">Open navigation</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 border-0 p-0">
                <SidebarContent onNavigate={() => setOpen(false)} />
              </SheetContent>
            </Sheet>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-semibold tracking-tight sm:text-xl">{title}</h1>
              {subtitle ? (
                <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
              ) : null}
            </div>
            
            <div className="flex shrink-0 items-center gap-4">
              {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
              
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                          {user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground capitalize">
                          {user.role.toLowerCase().replace("_", " ")}
                        </p>
                        <p className="text-[10px] leading-none text-primary/80 font-medium">
                          {user.tenantName}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/settings" className="w-full flex items-center cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/settings" className="w-full flex items-center cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
            </div>
          </div>
        </header>
        <main className="px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}

export function ComingSoon({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <AppShell title={title} subtitle={subtitle}>
      <div className="panel grid min-h-[50vh] place-items-center p-10 text-center">
        <div className="max-w-sm space-y-3">
          <div className="mx-auto grid size-12 place-items-center rounded-full bg-accent text-accent-foreground">
            <CalendarClock className="size-6" />
          </div>
          <h2 className="text-base font-semibold">Coming soon</h2>
          <p className="text-sm text-muted-foreground">
            This module is part of the full TransitOS roadmap. The first review demo covers the
            Schedule Optimizer and Route Network.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link to="/scheduling/optimizer">Go to Schedule Optimizer</Link>
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
