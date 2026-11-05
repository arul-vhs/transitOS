import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Route as RouteIcon,
  MapPin,
  Bus,
  Users,
  CalendarClock,
  ArrowRight,
  X,
  Settings,
  ChevronDown,
  SlidersHorizontal,
  Sliders,
  Moon,
  Sun,
  Laptop,
  Check,
  Building2,
  ShieldCheck,
  Workflow,
  Sparkles,
  Layers,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getRoutes, getAllStops } from "@/lib/routes-gis-fns";
import { getBuses, getDrivers, getConductors } from "@/lib/fleet-crew";
import { getTrips } from "@/lib/scheduling-fns";
import { cn } from "@/lib/utils";
import { useActiveTenant } from "@/lib/tenant-context";
import { useTheme } from "@/components/theme-provider";
import { toast } from "sonner";

export type SearchCategory =
  | "All"
  | "Route"
  | "Stop"
  | "Bus"
  | "Crew"
  | "Trip"
  | "Settings";

interface SearchResultItem {
  id: string;
  category: "Route" | "Stop" | "Bus" | "Crew" | "Trip" | "Settings";
  title: string;
  subtitle: string;
  badge?: string;
  navigateTo?: string;
  action?: () => void;
}

export function GlobalSearchBar() {
  const router = useRouter();
  const { currentTenant, allTenants, currentDepot, switchTenant, switchDepot } =
    useActiveTenant();
  const { theme, setTheme } = useTheme();

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<SearchCategory>("All");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut Ctrl+K or / to open/focus search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === "Escape") {
        setIsOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch data caches
  const { data: routesList = [] } = useQuery({
    queryKey: ["global-search-routes", currentTenant.id],
    queryFn: () => getRoutes(),
    staleTime: 60_000,
  });

  const { data: stopsList = [] } = useQuery({
    queryKey: ["global-search-stops", currentTenant.id],
    queryFn: () => getAllStops(),
    staleTime: 60_000,
  });

  const { data: busesList = [] } = useQuery({
    queryKey: ["global-search-buses", currentTenant.id],
    queryFn: () => getBuses(),
    staleTime: 60_000,
  });

  const { data: driversList = [] } = useQuery({
    queryKey: ["global-search-drivers", currentTenant.id],
    queryFn: () => getDrivers(),
    staleTime: 60_000,
  });

  const { data: conductorsList = [] } = useQuery({
    queryKey: ["global-search-conductors", currentTenant.id],
    queryFn: () => getConductors(),
    staleTime: 60_000,
  });

  const { data: tripsList = [] } = useQuery({
    queryKey: ["global-search-trips", currentTenant.id],
    queryFn: () => getTrips(),
    staleTime: 60_000,
  });

  // System Settings & Feature catalog for search
  const settingsCatalog: SearchResultItem[] = useMemo(
    () => [
      {
        id: "set-org",
        category: "Settings",
        title: "Transport Corporation Settings",
        subtitle: `Configured: ${currentTenant.name} (${currentTenant.region})`,
        badge: "Settings",
        navigateTo: "/settings",
      },
      {
        id: "set-depot",
        category: "Settings",
        title: "Depot Management & Fleet Bases",
        subtitle: `Active Depot: ${currentDepot} · 4 Operational Depots`,
        badge: "Depots",
        navigateTo: "/settings",
      },
      {
        id: "set-shift-rules",
        category: "Settings",
        title: "Motor Vehicles Act Shift Compliance",
        subtitle: "Max 4.5 hours continuous driving, 30m break, 8h daily limit",
        badge: "Shift Rules",
        navigateTo: "/settings",
      },
      {
        id: "set-turnaround",
        category: "Settings",
        title: "Timetable Turnaround Buffers",
        subtitle: "10-minute minimum buffer between terminating and outbound trips",
        badge: "Schedule Rules",
        navigateTo: "/settings",
      },
      {
        id: "set-theme-light",
        category: "Settings",
        title: "Theme Mode: Switch to Light Theme",
        subtitle: "Clean enterprise bright surface interface",
        badge: "Theme",
        action: () => {
          setTheme("light");
          toast.success("Theme switched to Light mode");
        },
      },
      {
        id: "set-theme-dark",
        category: "Settings",
        title: "Theme Mode: Switch to Dark Theme",
        subtitle: "High-contrast slate/navy low-light interface",
        badge: "Theme",
        action: () => {
          setTheme("dark");
          toast.success("Theme switched to Dark mode");
        },
      },
      {
        id: "set-sim-deck",
        category: "Settings",
        title: "Corridor Simulation Deck",
        subtitle: "Multi-corridor live simulation, disruption injection & AI recovery",
        badge: "Simulation",
        navigateTo: "/simulation",
      },
      {
        id: "set-live-tracking",
        category: "Settings",
        title: "Live Operations Tracking",
        subtitle: "Real-time bus tracking, vehicle assignments & conflict resolution",
        badge: "Live Ops",
        navigateTo: "/operations/today",
      },
      {
        id: "set-crew-portal",
        category: "Settings",
        title: "Crew Shift & SOS Portal",
        subtitle: "Driver mobile shift check-in, SOS alerts & incident feeds",
        badge: "Crew Portal",
        navigateTo: "/crew/portal",
      },
      {
        id: "set-demand-allocation",
        category: "Settings",
        title: "Passenger Demand & Fleet Allocation",
        subtitle: "Corridor peak passenger flow analysis & vehicle graph optimizer",
        badge: "Allocation",
        navigateTo: "/operations/allocation",
      },
      {
        id: "set-timetables",
        category: "Settings",
        title: "Schedules & Timetable Publisher",
        subtitle: "Corridor departure frequency, trip generation & crew rostering",
        badge: "Timetables",
        navigateTo: "/operations/trips",
      },
      {
        id: "set-privacy",
        category: "Settings",
        title: "Privacy Policy & GDPR Compliance",
        subtitle: "Telemetry data retention, operator confidentiality & security",
        badge: "Privacy",
        navigateTo: "/privacy",
      },
      {
        id: "set-terms",
        category: "Settings",
        title: "Terms of Service & Operational SLA",
        subtitle: "Enterprise uptime agreements and transit software terms",
        badge: "Terms",
        navigateTo: "/terms",
      },
    ],
    [currentTenant, currentDepot, setTheme],
  );

  // Compute matched categorized results
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      if (selectedCategory === "Settings") {
        return settingsCatalog;
      }
      return [];
    }

    const items: SearchResultItem[] = [];

    // 1. Match Routes
    if (selectedCategory === "All" || selectedCategory === "Route") {
      (routesList as any[]).forEach((r) => {
        if (
          r.code?.toLowerCase().includes(q) ||
          r.name?.toLowerCase().includes(q) ||
          r.origin?.toLowerCase().includes(q) ||
          r.destination?.toLowerCase().includes(q)
        ) {
          items.push({
            id: `route-${r.id}`,
            category: "Route",
            title: `Route ${r.code}: ${r.name}`,
            subtitle: `${r.origin} ⇄ ${r.destination} · ${r.lengthKm} km`,
            badge: r.code,
            navigateTo: `/network/routes`,
          });
        }
      });
    }

    // 2. Match Stops
    if (selectedCategory === "All" || selectedCategory === "Stop") {
      const seenStops = new Set<string>();
      (stopsList as any[]).forEach((s) => {
        if (
          s.name &&
          s.name.toLowerCase().includes(q) &&
          !seenStops.has(s.name.toLowerCase())
        ) {
          seenStops.add(s.name.toLowerCase());
          items.push({
            id: `stop-${s.id}`,
            category: "Stop",
            title: s.name,
            subtitle: `Stop Sequence #${s.sequence || 1} · [${Number(s.latitude).toFixed(3)}, ${Number(s.longitude).toFixed(3)}]`,
            navigateTo: `/network/map`,
          });
        }
      });
    }

    // 3. Match Buses
    if (selectedCategory === "All" || selectedCategory === "Bus") {
      (busesList as any[]).forEach((b) => {
        if (
          b.registrationNumber?.toLowerCase().includes(q) ||
          b.fleetNumber?.toLowerCase().includes(q) ||
          b.depot?.toLowerCase().includes(q)
        ) {
          items.push({
            id: `bus-${b.id}`,
            category: "Bus",
            title: b.registrationNumber,
            subtitle: `${b.fleetNumber || "Unit"} · ${b.depot} · ${b.busType || "Bus"}`,
            badge: b.status,
            navigateTo: `/fleet/buses`,
          });
        }
      });
    }

    // 4. Match Crew (Drivers & Conductors)
    if (selectedCategory === "All" || selectedCategory === "Crew") {
      (driversList as any[]).forEach((d) => {
        if (
          d.name?.toLowerCase().includes(q) ||
          d.employeeId?.toLowerCase().includes(q) ||
          d.depot?.toLowerCase().includes(q)
        ) {
          items.push({
            id: `drv-${d.id}`,
            category: "Crew",
            title: `${d.name} (${d.employeeId})`,
            subtitle: `Driver · ${d.depot} Depot · ${d.status}`,
            badge: "Driver",
            navigateTo: `/crew/drivers`,
          });
        }
      });

      (conductorsList as any[]).forEach((c) => {
        if (
          c.name?.toLowerCase().includes(q) ||
          c.employeeId?.toLowerCase().includes(q) ||
          c.depot?.toLowerCase().includes(q)
        ) {
          items.push({
            id: `cnd-${c.id}`,
            category: "Crew",
            title: `${c.name} (${c.employeeId})`,
            subtitle: `Conductor · ${c.depot} Depot · ${c.status}`,
            badge: "Conductor",
            navigateTo: `/crew/conductors`,
          });
        }
      });
    }

    // 5. Match Trips
    if (selectedCategory === "All" || selectedCategory === "Trip") {
      (tripsList as any[]).forEach((t) => {
        if (
          t.tripCode?.toLowerCase().includes(q) ||
          t.routeCode?.toLowerCase().includes(q) ||
          t.origin?.toLowerCase().includes(q) ||
          t.destination?.toLowerCase().includes(q)
        ) {
          items.push({
            id: `trp-${t.id}`,
            category: "Trip",
            title: `Trip ${t.tripCode}`,
            subtitle: `Route ${t.routeCode || ""} · ${t.origin || ""} to ${t.destination || ""}`,
            badge: t.status,
            navigateTo: `/operations/trips`,
          });
        }
      });
    }

    // 6. Match Settings & System Options
    if (selectedCategory === "All" || selectedCategory === "Settings") {
      settingsCatalog.forEach((s) => {
        if (
          s.title.toLowerCase().includes(q) ||
          s.subtitle.toLowerCase().includes(q) ||
          (s.badge && s.badge.toLowerCase().includes(q))
        ) {
          items.push(s);
        }
      });
    }

    return items.slice(0, 20);
  }, [
    query,
    selectedCategory,
    routesList,
    stopsList,
    busesList,
    driversList,
    conductorsList,
    tripsList,
    settingsCatalog,
  ]);

  const handleSelectResult = (item: SearchResultItem) => {
    setIsOpen(false);
    setQuery("");
    if (item.action) {
      item.action();
      return;
    }
    if (item.navigateTo) {
      void router.navigate({ to: item.navigateTo });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleSelectResult(results[selectedIndex]!);
      }
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Route":
        return <RouteIcon className="size-3.5 text-blue-600 dark:text-blue-400" />;
      case "Stop":
        return <MapPin className="size-3.5 text-emerald-600 dark:text-emerald-400" />;
      case "Bus":
        return <Bus className="size-3.5 text-sky-600 dark:text-sky-400" />;
      case "Crew":
        return <Users className="size-3.5 text-amber-600 dark:text-amber-400" />;
      case "Trip":
        return <CalendarClock className="size-3.5 text-slate-600 dark:text-slate-400" />;
      case "Settings":
        return <Settings className="size-3.5 text-primary" />;
      default:
        return <Search className="size-3.5 text-muted-foreground" />;
    }
  };

  const categoryOptions: { label: string; value: SearchCategory }[] = [
    { label: "All Items", value: "All" },
    { label: "Routes", value: "Route" },
    { label: "Stops", value: "Stop" },
    { label: "Bus Fleet", value: "Bus" },
    { label: "Crew", value: "Crew" },
    { label: "Trips", value: "Trip" },
    { label: "Settings", value: "Settings" },
  ];

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="flex items-center rounded-md border border-border/90 bg-muted/30 focus-within:bg-background focus-within:border-primary/60 transition-all shadow-2xs">
        {/* Category Selector Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-1 border-r border-border/80 px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-l-md transition-colors shrink-0 cursor-pointer"
              title="Search Scope Category"
            >
              <span>{selectedCategory === "All" ? "All" : selectedCategory}</span>
              <ChevronDown className="size-3 opacity-60" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44 text-xs rounded-lg shadow-lg border-border">
            <DropdownMenuLabel className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
              Search Scope
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {categoryOptions.map((opt) => (
              <DropdownMenuItem
                key={opt.value}
                onClick={() => {
                  setSelectedCategory(opt.value);
                  inputRef.current?.focus();
                  setIsOpen(true);
                }}
                className="flex items-center justify-between text-xs py-1.5 rounded-md cursor-pointer"
              >
                <span>{opt.label}</span>
                {selectedCategory === opt.value && (
                  <Check className="size-3.5 text-primary" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Search Input Box */}
        <div className="relative flex-1 flex items-center">
          <Search className="absolute left-2.5 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            ref={inputRef}
            type="text"
            value={query}
            onFocus={() => setIsOpen(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              selectedCategory === "Settings"
                ? "Search settings, themes, rules..."
                : `Search ${selectedCategory === "All" ? "routes, buses, crew, settings" : selectedCategory.toLowerCase()}...`
            }
            className="h-9.5 pl-8 pr-16 text-xs sm:text-sm bg-transparent border-0 focus-visible:ring-0 shadow-none rounded-none"
          />

          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="absolute right-7 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="size-3" />
            </button>
          ) : (
            <kbd className="absolute right-7 hidden sm:inline-flex items-center gap-0.5 rounded border border-border/80 bg-background px-1 font-mono text-[9px] text-muted-foreground pointer-events-none">
              <span>Ctrl</span>K
            </kbd>
          )}

          {/* Quick Search Settings Button */}
          <Popover open={settingsOpen} onOpenChange={setSettingsOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="absolute right-1 text-muted-foreground hover:text-foreground hover:bg-muted p-1 rounded-md transition-colors cursor-pointer"
                title="Search Options & Settings"
              >
                <SlidersHorizontal className="size-3.5" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 p-3 rounded-lg border-border shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                  <Settings className="size-3.5 text-primary" />
                  Search Options
                </span>
                <span className="text-[10px] font-mono text-muted-foreground">
                  Shortcut: Ctrl+K
                </span>
              </div>
              <div className="space-y-1.5 text-xs">
                <p className="text-[11px] text-muted-foreground">Default Filter Scope:</p>
                <div className="grid grid-cols-2 gap-1">
                  {categoryOptions.slice(0, 6).map((c) => (
                    <button
                      key={c.value}
                      onClick={() => {
                        setSelectedCategory(c.value);
                        setSettingsOpen(false);
                        inputRef.current?.focus();
                      }}
                      className={cn(
                        "text-left text-[11px] px-2 py-1 rounded border transition-colors",
                        selectedCategory === c.value
                          ? "bg-primary/10 border-primary/40 font-semibold text-primary"
                          : "border-border hover:bg-muted text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="border-t border-border pt-2 space-y-1">
                <p className="text-[10px] text-muted-foreground">Quick Shortcuts:</p>
                <button
                  onClick={() => {
                    setSettingsOpen(false);
                    void router.navigate({ to: "/settings" });
                  }}
                  className="w-full text-left text-xs px-2 py-1.5 rounded-md hover:bg-muted text-foreground flex items-center justify-between"
                >
                  <span className="flex items-center gap-1.5">
                    <Building2 className="size-3 text-muted-foreground" />
                    System Settings Page
                  </span>
                  <ArrowRight className="size-3 text-muted-foreground" />
                </button>
                <button
                  onClick={() => {
                    setSettingsOpen(false);
                    void router.navigate({ to: "/simulation" });
                  }}
                  className="w-full text-left text-xs px-2 py-1.5 rounded-md hover:bg-muted text-foreground flex items-center justify-between"
                >
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="size-3 text-muted-foreground" />
                    Simulation Deck
                  </span>
                  <ArrowRight className="size-3 text-muted-foreground" />
                </button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Dropdown Results Overlay */}
      {isOpen && (query.trim() || selectedCategory === "Settings") && (
        <div className="absolute top-11 left-0 right-0 z-50 rounded-lg border border-border bg-background shadow-xl overflow-hidden animate-in fade-in-50 duration-100">
          {/* Quick Filter Pill Strip */}
          <div className="flex items-center gap-1 px-2.5 py-1.5 bg-muted/40 border-b border-border/70 overflow-x-auto text-[11px]">
            <span className="text-[10px] text-muted-foreground font-mono shrink-0 mr-1">
              Filter:
            </span>
            {categoryOptions.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setSelectedCategory(cat.value);
                  setSelectedIndex(0);
                }}
                className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-medium transition-colors shrink-0 cursor-pointer",
                  selectedCategory === cat.value
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80",
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Results List */}
          <div className="max-h-80 overflow-y-auto p-1 text-xs">
            {results.length > 0 ? (
              <div className="space-y-0.5">
                {results.map((item, idx) => (
                  <div
                    key={item.id}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelectResult(item);
                    }}
                    className={cn(
                      "flex items-center justify-between px-2.5 py-2 rounded-md cursor-pointer transition-colors",
                      selectedIndex === idx
                        ? "bg-muted text-foreground font-medium"
                        : "hover:bg-muted/60 text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="shrink-0">{getCategoryIcon(item.category)}</span>
                      <div className="truncate">
                        <div className="font-semibold text-foreground truncate">
                          {item.title}
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate">
                          {item.subtitle}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 pl-2">
                      <span
                        className={cn(
                          "text-[9px] font-mono px-1.5 py-0.5 rounded border leading-none",
                          item.category === "Settings"
                            ? "bg-primary/10 border-primary/30 text-primary font-semibold"
                            : "bg-muted/80 text-muted-foreground border-border",
                        )}
                      >
                        {item.badge || item.category}
                      </span>
                      <ArrowRight className="size-3 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-muted-foreground space-y-1">
                <p>No matching {selectedCategory === "All" ? "items" : selectedCategory.toLowerCase()} found for "{query}".</p>
                <p className="text-[10px]">Try searching by route code, stop name, bus registration, or "settings".</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
