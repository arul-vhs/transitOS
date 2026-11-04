/**
 * TransitOS Date, Time & AM/PM Operational Formatting
 * Standardized for Indian Transit Operations (DD/MM/YYYY, 12h AM/PM, Asia/Kolkata)
 */

export const INDIAN_TIMEZONE = "Asia/Kolkata";

/**
 * Returns today's date formatted as DD/MM/YYYY in Asia/Kolkata timezone.
 */
export function getTodayIndianDate(): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: INDIAN_TIMEZONE,
  }).format(new Date());
}

/**
 * Formats any Date or date string to canonical Indian format DD/MM/YYYY.
 */
export function formatToIndianDate(input: Date | string | number | null | undefined): string {
  if (!input) return getTodayIndianDate();

  if (typeof input === "string") {
    const trimmed = input.trim();
    // Already in DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
      return trimmed;
    }
    // Handle YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const [y, m, d] = trimmed.split("-");
      return `${d}/${m}/${y}`;
    }
    // Handle "14 Aug 2026" or "25 Aug 2026"
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: INDIAN_TIMEZONE,
      }).format(parsed);
    }
    return trimmed;
  }

  const d = input instanceof Date ? input : new Date(input);
  if (isNaN(d.getTime())) return getTodayIndianDate();

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: INDIAN_TIMEZONE,
  }).format(d);
}

/**
 * Converts minutes from midnight (0..1439) into 12-hour AM/PM string, e.g. "10:30 AM", "02:45 PM".
 */
export function formatMinutesTo12Hour(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined || isNaN(minutes)) {
    return "--:--";
  }

  const normalized = ((Math.floor(minutes) % 1440) + 1440) % 1440;
  const h24 = Math.floor(normalized / 60);
  const m = normalized % 60;

  const period = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;

  const hStr = String(h12).padStart(2, "0");
  const mStr = String(m).padStart(2, "0");

  return `${hStr}:${mStr} ${period}`;
}

/**
 * Parses a 12-hour AM/PM string or 24h string into minutes from midnight.
 * Accepts: "10:30 AM", "02:45 PM", "14:45", "1030", "0630", "2:45pm".
 */
export function parse12HourToMinutes(input: string | null | undefined): number {
  if (!input) return 360; // Default 06:00 AM

  const clean = input.trim().toUpperCase();

  // Handle "1030" or "0630" shorthand
  if (/^\d{3,4}$/.test(clean)) {
    const padded = clean.padStart(4, "0");
    const h = parseInt(padded.slice(0, 2), 10);
    const m = parseInt(padded.slice(2, 4), 10);
    return Math.min(1439, Math.max(0, h * 60 + m));
  }

  // Handle "HH:MM AM" or "HH:MM PM"
  const ampmMatch = clean.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/);
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1]!, 10);
    const minutes = parseInt(ampmMatch[2]!, 10);
    const period = ampmMatch[3];

    if (period === "PM" && hours < 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;

    return Math.min(1439, Math.max(0, hours * 60 + minutes));
  }

  // Fallback split on colon
  if (clean.includes(":")) {
    const [h, m] = clean.split(":");
    return Math.min(1439, Math.max(0, (parseInt(h || "0", 10) * 60) + parseInt(m || "0", 10)));
  }

  return 360;
}

/**
 * Formats duration in minutes into clean human-readable runtime, e.g. "1h 15m" or "45m".
 */
export function formatDurationHuman(durationMin: number | null | undefined): string {
  if (!durationMin || durationMin <= 0) return "0m";
  const h = Math.floor(durationMin / 60);
  const m = Math.round(durationMin % 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

