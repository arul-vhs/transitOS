import { createServerFn } from "@tanstack/react-start";
import { toServerFnArgs } from "./server-fn-utils";

const _getRoutes = createServerFn({ method: "GET" })
  .validator((filters?: { status?: string; direction?: string; search?: string }) => filters)
  .handler(async ({ data }) => {
    const { getRoutesImpl } = await import("../server/routes-gis");
    return await getRoutesImpl(data);
  });

export const getRoutes = async (
  filters?: { status?: string; direction?: string; search?: string } | { data?: { status?: string; direction?: string; search?: string } }
) => {
  return await _getRoutes(toServerFnArgs(filters));
};

const _getRoute = createServerFn({ method: "GET" })
  .validator((id: string) => id)
  .handler(async ({ data }) => {
    const { getRouteImpl } = await import("../server/routes-gis");
    return await getRouteImpl(data);
  });

export const getRoute = async (id: string | { data: string }) => {
  return await _getRoute(toServerFnArgs(id)!);
};

const _createRoute = createServerFn({ method: "POST" })
  .validator(
    (data: {
      code: string;
      name: string;
      origin: string;
      destination: string;
      lengthKm: string;
      durationMin: number;
      direction?: string;
      color?: string;
      status?: string;
      peakFrequency?: number;
      offPeakFrequency?: number;
      geometryGeojson?: any;
    }) => data
  )
  .handler(async ({ data }) => {
    const { createRouteImpl } = await import("../server/routes-gis");
    return await createRouteImpl(data);
  });

export const createRoute = async (
  data:
    | {
        code: string;
        name: string;
        origin: string;
        destination: string;
        lengthKm: string;
        durationMin: number;
        direction?: string;
        color?: string;
        status?: string;
        peakFrequency?: number;
        offPeakFrequency?: number;
        geometryGeojson?: any;
      }
    | {
        data: {
          code: string;
          name: string;
          origin: string;
          destination: string;
          lengthKm: string;
          durationMin: number;
          direction?: string;
          color?: string;
          status?: string;
          peakFrequency?: number;
          offPeakFrequency?: number;
          geometryGeojson?: any;
        };
      }
) => {
  return await _createRoute(toServerFnArgs(data)!);
};

const _updateRoute = createServerFn({ method: "POST" })
  .validator(
    (payload: {
      id: string;
      data: {
        code: string;
        name: string;
        origin: string;
        destination: string;
        lengthKm: string;
        durationMin: number;
        direction?: string;
        color?: string;
        status?: string;
        peakFrequency?: number;
        offPeakFrequency?: number;
        geometryGeojson?: any;
      };
    }) => payload
  )
  .handler(async ({ data }) => {
    const { updateRouteImpl } = await import("../server/routes-gis");
    return await updateRouteImpl(data.id, data.data);
  });

export const updateRoute = async (payload: any) => {
  return await _updateRoute(toServerFnArgs(payload)!);
};

const _updateRouteStatus = createServerFn({ method: "POST" })
  .validator((payload: { id: string; status: string }) => payload)
  .handler(async ({ data }) => {
    const { updateRouteStatusImpl } = await import("../server/routes-gis");
    return await updateRouteStatusImpl(data.id, data.status);
  });

export const updateRouteStatus = async (
  payload: { id: string; status: string } | { data: { id: string; status: string } }
) => {
  return await _updateRouteStatus(toServerFnArgs(payload)!);
};

const _deleteRoute = createServerFn({ method: "POST" })
  .validator((id: string) => id)
  .handler(async ({ data }) => {
    const { deleteRouteImpl } = await import("../server/routes-gis");
    return await deleteRouteImpl(data);
  });

export const deleteRoute = async (id: string | { data: string }) => {
  return await _deleteRoute(toServerFnArgs(id)!);
};

const _getRouteStops = createServerFn({ method: "GET" })
  .validator((routeId: string) => routeId)
  .handler(async ({ data }) => {
    const { getRouteStopsImpl } = await import("../server/routes-gis");
    return await getRouteStopsImpl(data);
  });

export const getRouteStops = async (routeId: string | { data: string }) => {
  return await _getRouteStops(toServerFnArgs(routeId)!);
};

const _createStop = createServerFn({ method: "POST" })
  .validator(
    (data: {
      routeId: string;
      name: string;
      sequence: number;
      latitude: string;
      longitude: string;
    }) => data
  )
  .handler(async ({ data }) => {
    const { createStopImpl } = await import("../server/routes-gis");
    return await createStopImpl(data);
  });

export const createStop = async (data: any) => {
  return await _createStop(toServerFnArgs(data)!);
};

const _updateStop = createServerFn({ method: "POST" })
  .validator(
    (payload: {
      id: string;
      data: {
        name: string;
        sequence: number;
        latitude: string;
        longitude: string;
      };
    }) => payload
  )
  .handler(async ({ data }) => {
    const { updateStopImpl } = await import("../server/routes-gis");
    return await updateStopImpl(data.id, data.data);
  });

export const updateStop = async (payload: any) => {
  return await _updateStop(toServerFnArgs(payload)!);
};

const _deleteStop = createServerFn({ method: "POST" })
  .validator((id: string) => id)
  .handler(async ({ data }) => {
    const { deleteStopImpl } = await import("../server/routes-gis");
    return await deleteStopImpl(data);
  });

export const deleteStop = async (id: string | { data: string }) => {
  return await _deleteStop(toServerFnArgs(id)!);
};

const _reorderStops = createServerFn({ method: "POST" })
  .validator((payload: { routeId: string; stopIds: string[] }) => payload)
  .handler(async ({ data }) => {
    const { reorderStopsImpl } = await import("../server/routes-gis");
    return await reorderStopsImpl(data.routeId, data.stopIds);
  });

export const reorderStops = async (
  payload: { routeId: string; stopIds: string[] } | { data: { routeId: string; stopIds: string[] } }
) => {
  return await _reorderStops(toServerFnArgs(payload)!);
};

const _analyzeRouteOverlap = createServerFn({ method: "POST" })
  .validator((proposedGeojson: any) => proposedGeojson)
  .handler(async ({ data }) => {
    const { analyzeRouteOverlapImpl } = await import("../server/routes-gis");
    return await analyzeRouteOverlapImpl(data);
  });

export const analyzeRouteOverlap = async (proposedGeojson: any) => {
  return await _analyzeRouteOverlap(toServerFnArgs(proposedGeojson)!);
};
