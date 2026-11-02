import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMinutesToTime(totalMin: number | null | undefined): string {
  if (totalMin === null || totalMin === undefined || isNaN(Number(totalMin))) return "--:--";
  const mins = Math.max(0, Math.floor(Number(totalMin)));
  const hh = Math.floor(mins / 60) % 24;
  const mm = mins % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}
