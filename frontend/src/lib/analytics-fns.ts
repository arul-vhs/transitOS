import { createServerFn } from "@tanstack/react-start";
import { toServerFnArgs } from "./server-fn-utils";

const _getServiceMetrics = createServerFn({ method: "GET" })
  .validator((filters?: { serviceDate?: string; routeId?: string; busId?: string }) => filters)
  .handler(async ({ data }) => {
    const { getServiceMetricsImpl } = await import("../server/analytics/queries");
    return await getServiceMetricsImpl(data);
  });

export const getServiceMetrics = async (
  filters?: { serviceDate?: string; routeId?: string; busId?: string } | { data?: { serviceDate?: string; routeId?: string; busId?: string } }
) => {
  return await _getServiceMetrics(toServerFnArgs(filters));
};

const _getPlanVsActual = createServerFn({ method: "GET" })
  .validator(
    (filters?: {
      routeId?: string;
      busId?: string;
      status?: string;
      serviceDate?: string;
    }) => filters
  )
  .handler(async ({ data }) => {
    const { getPlanVsActualImpl } = await import("../server/analytics/queries");
    return await getPlanVsActualImpl(data);
  });

export const getPlanVsActual = async (filters?: any) => {
  return await _getPlanVsActual(toServerFnArgs(filters));
};

const _getRouteAnalytics = createServerFn({ method: "GET" })
  .validator((filters?: { serviceDate?: string }) => filters)
  .handler(async ({ data }) => {
    const { getRouteAnalyticsImpl } = await import("../server/analytics/queries");
    return await getRouteAnalyticsImpl(data);
  });

export const getRouteAnalytics = async (
  filters?: { serviceDate?: string } | { data?: { serviceDate?: string } }
) => {
  return await _getRouteAnalytics(toServerFnArgs(filters));
};

const _getFleetAnalytics = createServerFn({ method: "GET" })
  .validator((filters?: { depot?: string }) => filters)
  .handler(async ({ data }) => {
    const { getFleetAnalyticsImpl } = await import("../server/analytics/queries");
    return await getFleetAnalyticsImpl(data);
  });

export const getFleetAnalytics = async (
  filters?: { depot?: string } | { data?: { depot?: string } }
) => {
  return await _getFleetAnalytics(toServerFnArgs(filters));
};

const _getCrewAnalytics = createServerFn({ method: "GET" }).handler(async () => {
  const { getCrewAnalyticsImpl } = await import("../server/analytics/queries");
  return await getCrewAnalyticsImpl();
});

export const getCrewAnalytics = async () => {
  return await _getCrewAnalytics();
};

const _getIncidentAnalytics = createServerFn({ method: "GET" }).handler(async () => {
  const { getIncidentAnalyticsImpl } = await import("../server/analytics/queries");
  return await getIncidentAnalyticsImpl();
});

export const getIncidentAnalytics = async () => {
  return await _getIncidentAnalytics();
};

const _getOptimizationAnalytics = createServerFn({ method: "GET" }).handler(async () => {
  const { getOptimizationAnalyticsImpl } = await import("../server/analytics/queries");
  return await getOptimizationAnalyticsImpl();
});

export const getOptimizationAnalytics = async () => {
  return await _getOptimizationAnalytics();
};

const _getRecoveryAnalytics = createServerFn({ method: "GET" }).handler(async () => {
  const { getRecoveryAnalyticsImpl } = await import("../server/analytics/queries");
  return await getRecoveryAnalyticsImpl();
});

export const getRecoveryAnalytics = async () => {
  return await _getRecoveryAnalytics();
};

const _getDepotAnalytics = createServerFn({ method: "GET" }).handler(async () => {
  const { getDepotAnalyticsImpl } = await import("../server/analytics/queries");
  return await getDepotAnalyticsImpl();
});

export const getDepotAnalytics = async () => {
  return await _getDepotAnalytics();
};

const _exportAnalyticsCsv = createServerFn({ method: "POST" })
  .validator((type: string) => type)
  .handler(async ({ data }) => {
    const { exportAnalyticsCsvImpl } = await import("../server/analytics/export");
    return await exportAnalyticsCsvImpl(data);
  });

export const exportAnalyticsCsv = async (type: string | { data: string }) => {
  return await _exportAnalyticsCsv(toServerFnArgs(type)!);
};
