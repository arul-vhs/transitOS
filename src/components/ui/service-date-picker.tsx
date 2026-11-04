import { useState, useMemo } from "react";
import { Calendar as CalendarIcon, Check, ChevronDown, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface ServiceDatePickerProps {
  value: string;
  onChange: (date: string) => void;
  className?: string;
  align?: "start" | "center" | "end";
}

const CANONICAL_DEMO_DATE = "25 Aug 2026";

function formatDateToStandard(date: Date): string {
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  const day = String(date.getDate()).padStart(2, "0");
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

function parseToIso(dateStr: string): string {
  if (!dateStr) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function ServiceDatePicker({
  value,
  onChange,
  className,
  align = "start",
}: ServiceDatePickerProps) {
  const [open, setOpen] = useState(false);

  const todayStr = useMemo(() => formatDateToStandard(new Date()), []);
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return formatDateToStandard(d);
  }, []);

  const isoValue = useMemo(() => parseToIso(value), [value]);

  const handleDateSelect = (newDateStr: string) => {
    onChange(newDateStr);
    setOpen(false);
  };

  const handleNativeDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val) return;
    const parts = val.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0]!, 10);
      const month = parseInt(parts[1]!, 10) - 1;
      const day = parseInt(parts[2]!, 10);
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) {
        handleDateSelect(formatDateToStandard(d));
      }
    }
  };

  const presets = [
    {
      label: "25 Aug 2026 (Operational Network Schedule)",
      dateStr: CANONICAL_DEMO_DATE,
      description: "Complete seeded trips, duties, crew rosters, and corridors",
    },
    {
      label: "Today (Live Operational Window)",
      dateStr: todayStr,
      description: "Real-time date with live telemetry and fleet monitoring",
    },
    {
      label: "Tomorrow (Upcoming Schedule)",
      dateStr: tomorrowStr,
      description: "Next operational day dispatch plan",
    },
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center gap-2 border border-border/80 bg-background/60 hover:bg-muted/70 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer",
            className,
          )}
          title="Select Service Date"
        >
          <CalendarIcon className="size-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
          <span className="font-mono text-foreground text-xs">{value || CANONICAL_DEMO_DATE}</span>
          <ChevronDown className="size-3 text-muted-foreground opacity-60 ml-0.5" />
        </button>
      </PopoverTrigger>

      <PopoverContent align={align} className="w-80 p-3 bg-card border-border shadow-lg rounded-lg">
        <div className="space-y-3">
          <div className="border-b border-border/60 pb-2">
            <h4 className="text-xs font-bold text-foreground">Service Date</h4>
            <p className="text-[11px] text-muted-foreground">
              Select date for operational timetable, duty rosters, and telemetry.
            </p>
          </div>

          {/* Quick Presets */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Quick Schedules
            </label>
            <div className="grid gap-1">
              {presets.map((preset) => {
                const isSelected = value === preset.dateStr;
                return (
                  <button
                    key={preset.dateStr}
                    type="button"
                    onClick={() => handleDateSelect(preset.dateStr)}
                    className={cn(
                      "flex items-start justify-between p-2 rounded-md text-left transition-colors cursor-pointer border text-xs",
                      isSelected
                        ? "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300"
                        : "bg-background/50 hover:bg-muted/60 border-border/60 text-foreground",
                    )}
                  >
                    <div className="space-y-0.5 min-w-0 pr-2">
                      <div className="font-semibold text-[11px]">{preset.label}</div>
                      <div className="text-[10px] text-muted-foreground line-clamp-1">
                        {preset.description}
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="size-3.5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Date Input */}
          <div className="pt-2 border-t border-border/60 space-y-1.5">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              <span>Custom Calendar Date</span>
              <Clock className="size-3 text-muted-foreground" />
            </label>
            <input
              type="date"
              value={isoValue}
              onChange={handleNativeDateChange}
              className="w-full h-8 px-2.5 text-xs font-mono rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

