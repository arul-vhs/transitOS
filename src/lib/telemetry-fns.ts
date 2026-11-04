import { createServerFn } from "@tanstack/react-start";
import { toServerFnArgs } from "./server-fn-utils";

export type {
  LiveTrackedBus,
  VehicleTelemetryInput,
  TelemetryRecord,
} from "../server/telemetry-ops";

const _ingestVehicleTelemetry = createServerFn({ method: "POST" })
  .validator(
    (input: {
      busRegNumber: string;
      busId?: string;
      latitude: number;
      longitude: number;
      speedKmH?: number;
      heading?: number;
      accuracyMeters?: number;
      source?: "AVL_GATEWAY" | "DRIVER_MOBILE" | "TELEMETRY_API";
      timestamp?: string;
    }) => input,
  )
  .handler(async ({ data }) => {
    const { ingestVehicleTelemetryImpl } = await import(
      "../server/telemetry-ops"
    );
    return await ingestVehicleTelemetryImpl(data);
  });

export const ingestVehicleTelemetry = async (input: any) => {
  return await _ingestVehicleTelemetry(toServerFnArgs(input)!);
};

const _getLiveBusTracking = createServerFn({ method: "GET" })
  .validator(
    (filters?: {
      serviceDate?: string;
      depot?: string;
      routeCode?: string;
      statusFilter?: string;
    }) => filters,
  )
  .handler(async ({ data }) => {
    const { getLiveBusTrackingImpl } = await import(
      "../server/telemetry-ops"
    );
    return await getLiveBusTrackingImpl(data);
  });

export const getLiveBusTracking = async (filters?: any) => {
  return await _getLiveBusTracking(toServerFnArgs(filters));
};
