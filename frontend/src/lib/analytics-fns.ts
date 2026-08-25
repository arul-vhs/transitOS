import { createServerFn } from "@tanstack/react-start";

const ANALYTICS_QUERIES_PATH = "../server/analytics/queries";
const ANALYTICS_EXPORT_PATH = "../server/analytics/export";

export const getServiceMetrics = createServerFn(
  "GET",
  async (filters: { serviceDate?: string; routeId?: string; busId?: string }) => {
    const { getServiceMetricsImpl } = await import(ANALYTICS_QUERIES_PATH);
    return await getServiceMetricsImpl(filters);
  }
);

export const getPlanVsActual = createServerFn(
  "GET",
  async (filters: {
    routeId?: string;
    busId?: string;
    status?: string;
    serviceDate?: string;
  }) => {
    const { getPlanVsActualImpl } = await import(ANALYTICS_QUERIES_PATH);
    return await getPlanVsActualImpl(filters);
  }
);

export const getRouteAnalytics = createServerFn(
  "GET",
  async (filters: { serviceDate?: string }) => {
    const { getRouteAnalyticsImpl } = await import(ANALYTICS_QUERIES_PATH);
    return await getRouteAnalyticsImpl(filters);
  }
);

export const getFleetAnalytics = createServerFn(
  "GET",
  async (filters: { depot?: string }) => {
    const { getFleetAnalyticsImpl } = await import(ANALYTICS_QUERIES_PATH);
    return await getFleetAnalyticsImpl(filters);
  }
);

export const getCrewAnalytics = createServerFn("GET", async () => {
  const { getCrewAnalyticsImpl } = await import(ANALYTICS_QUERIES_PATH);
  return await getCrewAnalyticsImpl();
});

export const getIncidentAnalytics = createServerFn("GET", async () => {
  const { getIncidentAnalyticsImpl } = await import(ANALYTICS_QUERIES_PATH);
  return await getIncidentAnalyticsImpl();
});

export const getOptimizationAnalytics = createServerFn("GET", async () => {
  const { getOptimizationAnalyticsImpl } = await import(ANALYTICS_QUERIES_PATH);
  return await getOptimizationAnalyticsImpl();
});

export const getRecoveryAnalytics = createServerFn("GET", async () => {
  const { getRecoveryAnalyticsImpl } = await import(ANALYTICS_QUERIES_PATH);
  return await getRecoveryAnalyticsImpl();
});

export const getDepotAnalytics = createServerFn(
  "GET",
  async () => {
    const { getDepotAnalyticsImpl } = await import(ANALYTICS_QUERIES_PATH);
    return await getDepotAnalyticsImpl();
  }
);

export const exportAnalyticsCsv = createServerFn(
  "POST",
  async (type: string) => {
    const { exportAnalyticsCsvImpl } = await import(ANALYTICS_EXPORT_PATH);
    return await exportAnalyticsCsvImpl(type);
  }
);
