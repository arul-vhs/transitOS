import { createServerFn } from "@tanstack/react-start";
import { toServerFnArgs } from "./server-fn-utils";

export interface CanonicalLocation {
  id: string;
  name: string;
  code?: string;
  lat: number;
  lng: number;
  type: "terminal" | "depot" | "station" | "stop";
  area?: string;
  routesServed?: string[];
}

const _searchLocations = createServerFn({ method: "GET" })
  .validator((args: { query: string; limit?: number; tenantId?: string }) => args)
  .handler(async ({ data }) => {
    const { searchLocationsImpl } = await import("../server/location-intelligence");
    return await searchLocationsImpl(data.query, data.limit, data.tenantId);
  });

export const searchLocations = async (
  args:
    | { query: string; limit?: number; tenantId?: string }
    | { data: { query: string; limit?: number; tenantId?: string } },
): Promise<CanonicalLocation[]> => {
  return await _searchLocations(toServerFnArgs(args));
};

const _getCanonicalLocations = createServerFn({ method: "GET" })
  .validator((args?: { tenantId?: string }) => args)
  .handler(async ({ data }) => {
    const { getCanonicalLocationsImpl } = await import("../server/location-intelligence");
    return await getCanonicalLocationsImpl(data?.tenantId);
  });

export const getCanonicalLocations = async (
  args?: { tenantId?: string } | { data?: { tenantId?: string } },
): Promise<CanonicalLocation[]> => {
  return await _getCanonicalLocations(toServerFnArgs(args));
};

