import { createServerFn } from "@tanstack/react-start";

const ROUTES_GIS_SERVER_PATH = "../server/routes-gis";

export const getRoutes = createServerFn(
  "GET",
  async (filters?: { status?: string; direction?: string; search?: string }) => {
    const { getRoutesImpl } = await import(ROUTES_GIS_SERVER_PATH);
    return await getRoutesImpl(filters);
  }
);

export const getRoute = createServerFn("GET", async (id: string) => {
  const { getRouteImpl } = await import(ROUTES_GIS_SERVER_PATH);
  return await getRouteImpl(id);
});

export const createRoute = createServerFn(
  "POST",
  async (data: {
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
  }) => {
    const { createRouteImpl } = await import(ROUTES_GIS_SERVER_PATH);
    return await createRouteImpl(data);
  }
);

export const updateRoute = createServerFn(
  "POST",
  async (payload: {
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
  }) => {
    const { updateRouteImpl } = await import(ROUTES_GIS_SERVER_PATH);
    return await updateRouteImpl(payload.id, payload.data);
  }
);

export const updateRouteStatus = createServerFn(
  "POST",
  async (payload: { id: string; status: string }) => {
    const { updateRouteStatusImpl } = await import(ROUTES_GIS_SERVER_PATH);
    return await updateRouteStatusImpl(payload.id, payload.status);
  }
);

export const deleteRoute = createServerFn("POST", async (id: string) => {
  const { deleteRouteImpl } = await import(ROUTES_GIS_SERVER_PATH);
  return await deleteRouteImpl(id);
});

export const getRouteStops = createServerFn("GET", async (routeId: string) => {
  const { getRouteStopsImpl } = await import(ROUTES_GIS_SERVER_PATH);
  return await getRouteStopsImpl(routeId);
});

export const createStop = createServerFn(
  "POST",
  async (data: {
    routeId: string;
    name: string;
    sequence: number;
    latitude: string;
    longitude: string;
  }) => {
    const { createStopImpl } = await import(ROUTES_GIS_SERVER_PATH);
    return await createStopImpl(data);
  }
);

export const updateStop = createServerFn(
  "POST",
  async (payload: {
    id: string;
    data: {
      name: string;
      sequence: number;
      latitude: string;
      longitude: string;
    };
  }) => {
    const { updateStopImpl } = await import(ROUTES_GIS_SERVER_PATH);
    return await updateStopImpl(payload.id, payload.data);
  }
);

export const deleteStop = createServerFn("POST", async (id: string) => {
  const { deleteStopImpl } = await import(ROUTES_GIS_SERVER_PATH);
  return await deleteStopImpl(id);
});

export const reorderStops = createServerFn(
  "POST",
  async (payload: { routeId: string; stopIds: string[] }) => {
    const { reorderStopsImpl } = await import(ROUTES_GIS_SERVER_PATH);
    return await reorderStopsImpl(payload.routeId, payload.stopIds);
  }
);

export const analyzeRouteOverlap = createServerFn("POST", async (proposedGeojson: any) => {
  const { analyzeRouteOverlapImpl } = await import(ROUTES_GIS_SERVER_PATH);
  return await analyzeRouteOverlapImpl(proposedGeojson);
});
