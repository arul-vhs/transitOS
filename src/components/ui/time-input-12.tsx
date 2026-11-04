import * as React from "react";
import { Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface Time12Value {
  time12: string; // "HH:mm" e.g. "05:30"
  period: "AM" | "PM";
}

export function from24Hour(time24: string | null | undefined): Time12Value {
  if (!time24 || !time24.includes(":")) {
    return { time12: "06:00", period: "AM" };
  }
  const parts = time24.trim().split(":");
  let h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);

  if (isNaN(h)) h = 6;
  const safeMin = isNaN(m) ? 0 : Math.min(Math.max(m, 0), 59);

  const period: "AM" | "PM" = h >= 12 ? "PM" : "AM";
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;

  return {
    time12: `${String(h12).padStart(2, "0")}:${String(safeMin).padStart(2, "0")}`,
    period,
  };
}

export function to24Hour(time12: string, period: "AM" | "PM"): string {
  if (!time12) return period === "PM" ? "12:00" : "00:00";
  const parts = time12.trim().split(":");
  let h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);

  if (isNaN(h)) h = 12;
  const safeMin = isNaN(m) ? 0 : Math.min(Math.max(m, 0), 59);

  if (period === "AM") {
    if (h === 12) h = 0;
    else if (h > 12) h = h % 12;
  } else {
    if (h < 12) h += 12;
  }

  return `${String(h).padStart(2, "0")}:${String(safeMin).padStart(2, "0")}`;
}

export function minutesToTime12(totalMin: number | null | undefined): Time12Value {
  if (totalMin === null || totalMin === undefined || isNaN(Number(totalMin))) {
    return { time12: "06:00", period: "AM" };
  }
  const mins = Math.max(0, Math.floor(Number(totalMin)));
  let h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  const period: "AM" | "PM" = h >= 12 ? "PM" : "AM";
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;
  return {
    time12: `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
    period,
  };
}

export function time12ToMinutes(time12: string, period: "AM" | "PM"): number {
  const time24 = to24Hour(time12, period);
  const [h, m] = time24.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function formatTime12Display(time24: string | null | undefined): string {
  const { time12, period } = from24Hour(time24);
  return `${time12} ${period}`;
}

export function formatMinutesDisplay(totalMin: number | null | undefined): string {
  const { time12, period } = minutesToTime12(totalMin);
  return `${time12} ${period}`;
}

interface TimeInput12Props {
  value: string; // 24-hour format "HH:mm" e.g. "06:30" or "14:30"
  onChange: (value24: string) => void;
  className?: string;
  disabled?: boolean;
  id?: string;
  required?: boolean;
  placeholder?: string;
}

export function TimeInput12({
  value,
  onChange,
  className,
  disabled,
  id,
  required,
  placeholder = "06:00",
}: TimeInput12Props) {
  const { time12, period } = React.useMemo(() => from24Hour(value), [value]);

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime12 = e.target.value;
    onChange(to24Hour(newTime12, period));
  };

  const handlePeriodChange = (newPeriod: "AM" | "PM") => {
    onChange(to24Hour(time12, newPeriod));
  };

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            id={id}
            type="text"
            value={time12}
            onChange={handleTimeChange}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            className="pl-8 font-mono text-xs rounded-md"
          />
        </div>
        <Select
          value={period}
          onValueChange={handlePeriodChange}
          disabled={disabled}
        >
          <SelectTrigger className="w-22 text-xs font-semibold rounded-md font-mono">
            <SelectValue placeholder="Period" />
          </SelectTrigger>
          <SelectContent className="rounded-md">
            <SelectItem value="AM" className="text-xs font-mono font-medium">
              AM
            </SelectItem>
            <SelectItem value="PM" className="text-xs font-mono font-medium">
              PM
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between text-[11px] text-muted-foreground px-0.5 font-mono">
        <span>
          Selected: <strong className="text-foreground">{time12} {period}</strong>
        </span>
        <span className="text-[10px] opacity-75">
          ({to24Hour(time12, period)} 24h)
        </span>
      </div>
    </div>
  );
}

interface TimeInput12MinutesProps {
  value: number; // minutes from midnight, e.g. 330
  onChange: (minutes: number) => void;
  className?: string;
  disabled?: boolean;
  id?: string;
  required?: boolean;
  placeholder?: string;
}

export function TimeInput12Minutes({
  value,
  onChange,
  className,
  disabled,
  id,
  required,
  placeholder = "06:00",
}: TimeInput12MinutesProps) {
  const { time12, period } = React.useMemo(() => minutesToTime12(value), [value]);

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime12 = e.target.value;
    onChange(time12ToMinutes(newTime12, period));
  };

  const handlePeriodChange = (newPeriod: "AM" | "PM") => {
    onChange(time12ToMinutes(time12, newPeriod));
  };

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            id={id}
            type="text"
            value={time12}
            onChange={handleTimeChange}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            className="pl-8 font-mono text-xs rounded-md"
          />
        </div>
        <Select
          value={period}
          onValueChange={handlePeriodChange}
          disabled={disabled}
        >
          <SelectTrigger className="w-22 text-xs font-semibold rounded-md font-mono">
            <SelectValue placeholder="Period" />
          </SelectTrigger>
          <SelectContent className="rounded-md">
            <SelectItem value="AM" className="text-xs font-mono font-medium">
              AM
            </SelectItem>
            <SelectItem value="PM" className="text-xs font-mono font-medium">
              PM
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between text-[11px] text-muted-foreground px-0.5 font-mono">
        <span>
          Selected: <strong className="text-foreground">{time12} {period}</strong>
        </span>
        <span className="text-[10px] opacity-75">
          ({to24Hour(time12, period)} 24h)
        </span>
      </div>
    </div>
  );
}

