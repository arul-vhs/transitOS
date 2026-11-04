import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Building, Bus, Landmark, Check, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { searchLocations, CanonicalLocation } from "@/lib/location-fns";
import { useActiveTenant } from "@/lib/tenant-context";
import { cn } from "@/lib/utils";

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string, location?: CanonicalLocation) => void;
  onSelectLocation?: (location: CanonicalLocation) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  autoFocus?: boolean;
}

export function LocationAutocomplete({
  value,
  onChange,
  onSelectLocation,
  placeholder,
  disabled = false,
  className,
  autoFocus = false,
}: LocationAutocompleteProps) {
  const { currentTenant } = useActiveTenant();
  const effectivePlaceholder =
    placeholder ||
    (currentTenant.id.startsWith("69000000")
      ? "Search Chennai stop, terminus or depot..."
      : `Search ${currentTenant.name.split(" ")[0]} stop or landmark...`);

  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || "");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync internal state with external value
  useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  const { data: suggestions = [], isFetching } = useQuery({
    queryKey: ["canonical-locations-search", currentTenant.id, inputValue],
    queryFn: async () => {
      const results = await searchLocations({
        query: inputValue,
        limit: 8,
        tenantId: currentTenant.id,
      });
      return results || [];
    },
    enabled: isOpen && inputValue.trim().length >= 1,
    staleTime: 60_000,
  });

  // Close popup on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (loc: CanonicalLocation) => {
    setInputValue(loc.name);
    onChange(loc.name, loc);
    if (onSelectLocation) onSelectLocation(loc);
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === "ArrowDown") {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : 0,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev > 0 ? prev - 1 : suggestions.length - 1,
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        handleSelect(suggestions[selectedIndex]!);
      } else if (suggestions.length > 0) {
        handleSelect(suggestions[0]!);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "terminal":
        return <Landmark className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />;
      case "depot":
        return <Building className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />;
      case "station":
        return <Bus className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />;
      default:
        return <MapPin className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "terminal":
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            Terminus
          </span>
        );
      case "depot":
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            Depot
          </span>
        );
      case "station":
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            Station
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
            Stop
          </span>
        );
    }
  };

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        <Input
          type="text"
          value={inputValue}
          disabled={disabled}
          autoFocus={autoFocus}
          placeholder={effectivePlaceholder}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            const next = e.target.value;
            setInputValue(next);
            onChange(next);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          className="pl-9 pr-8 h-9 text-sm rounded-md"
        />
        {inputValue && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => {
              setInputValue("");
              onChange("");
              setIsOpen(false);
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-0.5"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {isOpen && inputValue.trim().length >= 1 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-950 overflow-hidden">
          <div className="max-h-60 overflow-y-auto py-1 text-xs">
            {isFetching && suggestions.length === 0 ? (
              <div className="px-3 py-2 text-slate-500">Searching Chennai locations...</div>
            ) : suggestions.length > 0 ? (
              suggestions.map((loc, idx) => (
                <div
                  key={loc.id || `${loc.name}-${idx}`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(loc);
                  }}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 cursor-pointer transition-colors text-slate-900 dark:text-slate-100",
                    selectedIndex === idx
                      ? "bg-slate-100 dark:bg-slate-900"
                      : "hover:bg-slate-50 dark:hover:bg-slate-900/60",
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="shrink-0">{getTypeIcon(loc.type)}</span>
                    <div className="truncate">
                      <div className="font-medium truncate">{loc.name}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        {loc.area && <span>{loc.area}</span>}
                        <span>
                          {loc.lat.toFixed(4)}° N, {loc.lng.toFixed(4)}° E
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 pl-2">
                    {getTypeBadge(loc.type)}
                  </div>
                </div>
              ))
            ) : (
              <div className="px-3 py-2 text-slate-500">
                <span>No exact Chennai stop found.</span>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setIsOpen(false);
                  }}
                  className="block mt-1 font-medium text-blue-600 hover:underline dark:text-blue-400"
                >
                  Use "{inputValue}" as custom location
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

