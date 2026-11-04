import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Standardized TransitOS Route Number & Label Utility
 *
 * Ensures GTFS route_short_name is used as the passenger-facing route number.
 * Preserves alphanumeric codes (e.g., "21G", "5C", "M70", "D70", "A1", "570", "102") as strings.
 * Never exposes internal database UUIDs or internal technical identifiers.
 */

export interface RouteIdentifiable {
  code?: string | null;
  routeCode?: string | null;
  route_short_name?: string | null;
  name?: string | null;
  routeName?: string | null;
  route_long_name?: string | null;
  origin?: string | null;
  destination?: string | null;
  id?: string | null;
}

export function formatRouteNumber(
  route: RouteIdentifiable | string | null | undefined,
): string {
  if (!route) return "Route --";

  if (typeof route === "string") {
    const trimmed = route.trim();
    if (!trimmed) return "Route --";

    // Clean internal route id prefixes (e.g. "route-mtc-570" -> "570", "route-mtc-21g" -> "21G")
    if (trimmed.startsWith("route-mtc-")) {
      const codePart = trimmed.replace("route-mtc-", "").toUpperCase();
      return codePart;
    }
    if (trimmed.startsWith("route-slm-")) {
      const codePart = trimmed.replace("route-slm-", "").toUpperCase();
      return codePart;
    }
    // Check if it's a UUID (36 chars with dashes)
    if (
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        trimmed,
      )
    ) {
      return "Route --";
    }

    // Check if it's a composite string like "5C: Broadway to Tambaram" or "Route 570 - CMBT"
    const match = trimmed.match(
      /^(?:Route\s+)?([0-9]+[A-Z]*|[A-Z]+[0-9]+[A-Z]*)\s*[:\-–]/i,
    );
    if (match && match[1]) {
      return match[1].toUpperCase();
    }

    // Check if it's "Route 1", "Route 570", "Route 21G"
    const routePrefixMatch = trimmed.match(/^Route\s+([0-9]+[A-Z]*|[A-Z]+[0-9]+[A-Z]*)$/i);
    if (routePrefixMatch && routePrefixMatch[1]) {
      return routePrefixMatch[1].toUpperCase();
    }

    return trimmed;
  }

  // 1. Check primary GTFS short name or code fields
  const candidate =
    route.code || route.routeCode || route.route_short_name;

  if (candidate && typeof candidate === "string" && candidate.trim()) {
    const trimmed = candidate.trim();
    if (trimmed.startsWith("route-mtc-")) {
      return trimmed.replace("route-mtc-", "").toUpperCase();
    }
    if (trimmed.startsWith("route-slm-")) {
      return trimmed.replace("route-slm-", "").toUpperCase();
    }
    // Check if it's a composite string like "5C: Broadway to Tambaram" or "Route 570 - CMBT"
    const match = trimmed.match(
      /^(?:Route\s+)?([0-9]+[A-Z]*|[A-Z]+[0-9]+[A-Z]*)\s*[:\-–]/i,
    );
    if (match && match[1]) {
      return match[1].toUpperCase();
    }

    // Check if it's "Route 1", "Route 570", "Route 21G"
    const routePrefixMatch = trimmed.match(/^Route\s+([0-9]+[A-Z]*|[A-Z]+[0-9]+[A-Z]*)$/i);
    if (routePrefixMatch && routePrefixMatch[1]) {
      return routePrefixMatch[1].toUpperCase();
    }

    return trimmed;
  }

  // 2. Check if name starts with a route number pattern (e.g. "570: CMBT..." or "21G - Broadway...")
  const nameCandidate = route.name || route.routeName || route.route_long_name;
  if (nameCandidate && typeof nameCandidate === "string") {
    const match = nameCandidate.match(/^([0-9]+[A-Z]*|[A-Z]+[0-9]+[A-Z]*)\s*[:\-–]\s*/i);
    if (match && match[1]) {
      return match[1].toUpperCase();
    }
  }

  // 3. Fallback from id if it embeds the code
  if (route.id && typeof route.id === "string") {
    if (route.id.startsWith("route-mtc-")) {
      return route.id.replace("route-mtc-", "").toUpperCase();
    }
  }

  return "Route --";
}

export function formatRouteName(
  route: RouteIdentifiable | string | null | undefined,
): string {
  if (!route) return "Corridor Service";

  if (typeof route === "string") {
    return route;
  }

  const name =
    route.name || route.routeName || route.route_long_name;
  if (name && typeof name === "string" && name.trim()) {
    // Strip leading "570: " or "Route 570: " if present for clean description
    const cleaned = name.replace(/^(?:Route\s+)?[0-9A-Z]+\s*[:\-–]\s*/i, "").trim();
    return cleaned || name;
  }

  if (route.origin && route.destination) {
    return `${route.origin} ⇄ ${route.destination}`;
  }

  return "Corridor Service";
}

export function formatRouteDisplay(
  route: RouteIdentifiable | string | null | undefined,
): {
  number: string;
  name: string;
  fullLabel: string;
} {
  const number = formatRouteNumber(route);
  const name = formatRouteName(route);
  return {
    number,
    name,
    fullLabel: `${number}: ${name}`,
  };
}

export interface RouteBadgeProps {
  route: RouteIdentifiable | string | null | undefined;
  className?: string;
  showName?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
}

export function RouteBadge({
  route,
  className,
  showName = false,
  size = "md",
}: RouteBadgeProps) {
  const { number, name } = formatRouteDisplay(route);

  const sizeClasses =
    size === "xs"
      ? "text-[9px] px-1 py-0"
      : size === "sm"
        ? "text-[10px] px-1.5 py-0"
        : size === "lg"
          ? "text-xs px-2 py-0.5"
          : "text-[11px] px-1.5 py-0";

  return (
    <div className={cn("inline-flex items-center gap-1.5", className)}>
      <Badge
        variant="outline"
        className={cn(
          "font-mono font-bold bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30 rounded-md tracking-wider uppercase shrink-0",
          sizeClasses
        )}
      >
        {number}
      </Badge>
      {showName ? (
        <span className="text-xs font-semibold text-foreground truncate max-w-[200px]">
          {name}
        </span>
      ) : null}
    </div>
  );
}
