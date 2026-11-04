import { useState, useEffect, useRef } from "react";
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
  Command,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getRoutes, getAllStops } from "@/lib/routes-gis-fns";
import { getBuses, getDrivers, getConductors } from "@/lib/fleet-crew";
import { getTrips } from "@/lib/scheduling-fns";
import { cn } from "@/lib/utils";
import { useActiveTenant } from "@/lib/tenant-context";

interface SearchResultItem {
  id: string;
  category: "Route" | "Stop" | "Bus" | "Crew" | "Trip";
  title: string;
  subtitle: string;
  badge?: string;
  navigateTo: string;
}

export function GlobalSearchBar() {
  const router = useRouter();
  const { currentTenant } = useActiveTenant();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
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

  // Compute matched categorized results
  const results = (() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const items: SearchResultItem[] = [];

    // 1. Match Routes
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

    // 2. Match Stops
    const seenStops = new Set<string>();
    (stopsList as any[]).forEach((s) => {
      if (s.name && s.name.toLowerCase().includes(q) && !seenStops.has(s.name.toLowerCase())) {
        seenStops.add(s.name.toLowerCase());
        items.push({
          id: `stop-${s.id}`,
          category: "Stop",
          title: s.name,
          subtitle: `Sequence #${s.sequence} · [${Number(s.latitude).toFixed(3)}, ${Number(s.longitude).toFixed(3)}]`,
          navigateTo: `/network/map`,
        });
      }
    });

    // 3. Match Buses
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

    // 4. Match Crew (Drivers & Conductors)
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

    // 5. Match Trips
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
          title: `Trip ${t.tripCode} (${t.routeCode || "Route"})`,
          subtitle: `${t.origin} → ${t.destination} · ${t.serviceDate}`,
          badge: t.status,
          navigateTo: `/operations/trips`,
        });
      }
    });

    return items.slice(0, 15);
  })();

  const handleSelectResult = (item: SearchResultItem) => {
    setIsOpen(false);
    setQuery("");
    router.navigate({ to: item.navigateTo as any });
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
      default:
        return <Search className="size-3.5 text-muted-foreground" />;
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-xs md:max-w-sm lg:max-w-md">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
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
          placeholder="Search routes, stops, buses, crew (Ctrl+K)..."
          className="h-8 pl-8 pr-12 text-xs bg-muted/40 hover:bg-muted/70 focus:bg-background border-border rounded-md shadow-2xs"
        />
        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setIsOpen(false);
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="size-3" />
          </button>
        ) : (
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 rounded border border-border bg-background px-1.5 font-mono text-[9px] text-muted-foreground pointer-events-none">
            <span>Ctrl</span>K
          </kbd>
        )}
      </div>

      {isOpen && query.trim() && (
        <div className="absolute top-10 left-0 right-0 z-50 rounded-lg border border-border bg-background shadow-xl overflow-hidden animate-in fade-in-50 duration-100">
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
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted/80 text-muted-foreground border border-border">
                        {item.category}
                      </span>
                      <ArrowRight className="size-3 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-muted-foreground">
                No matching routes, stops, buses, crew or trips found for "{query}".
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

