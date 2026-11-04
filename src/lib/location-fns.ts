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
  .validator((args: { query: string; limit?: number }) => args)
  .handler(async ({ data }) => {
    const { searchLocationsImpl } = await import("../server/location-intelligence");
    return await searchLocationsImpl(data.query, data.limit);
  });

export const searchLocations = async (
  args: { query: string; limit?: number } | { data: { query: string; limit?: number } },
): Promise<CanonicalLocation[]> => {
  return await _searchLocations(toServerFnArgs(args));
};

const _getCanonicalLocations = createServerFn({ method: "GET" })
  .handler(async () => {
    const { getCanonicalLocationsImpl } = await import("../server/location-intelligence");
    return await getCanonicalLocationsImpl();
  });

export const getCanonicalLocations = async (): Promise<CanonicalLocation[]> => {
  return await _getCanonicalLocations();
};

