import { createServerFn } from "@tanstack/react-start";
import { toServerFnArgs } from "./server-fn-utils";
import type {
  AllocationStrategy,
  SurgeScenarioInput,
  TimePeriodId,
} from "../server/allocation/types";

const _getAllocationPlan = createServerFn({ method: "POST" })
  .validator(
    (data: {
      strategy?: AllocationStrategy;
      periodId?: TimePeriodId;
      customSurges?: SurgeScenarioInput[];
      serviceDate?: string;
      tenantId?: string;
    }) => data,
  )
  .handler(async ({ data }) => {
    const { generateFleetAllocationPlan } =
      await import("../server/allocation/demand-engine");
    return await generateFleetAllocationPlan(
      data.strategy,
      data.periodId,
      data.customSurges,
      data.serviceDate,
      data.tenantId,
    );
  });

export const getAllocationPlan = async (data?: {
  strategy?: AllocationStrategy;
  periodId?: TimePeriodId;
  customSurges?: SurgeScenarioInput[];
  serviceDate?: string;
  tenantId?: string;
}) => {
  return await _getAllocationPlan(toServerFnArgs(data || {})!);
};

const _getCorridorDemandProfiles = createServerFn({ method: "POST" })
  .validator(
    (data: {
      periodId?: TimePeriodId;
      customSurges?: SurgeScenarioInput[];
      tenantId?: string;
    }) => data,
  )
  .handler(async ({ data }) => {
    const { buildCorridorProfiles } =
      await import("../server/allocation/demand-engine");
    return buildCorridorProfiles(data.periodId, data.customSurges, data.tenantId);
  });

export const getCorridorDemandProfiles = async (data?: {
  periodId?: TimePeriodId;
  customSurges?: SurgeScenarioInput[];
  tenantId?: string;
}) => {
  return await _getCorridorDemandProfiles(toServerFnArgs(data || {})!);
};

const _dispatchFleetAllocation = createServerFn({ method: "POST" })
  .validator(
    (data: {
      recommendationId: string;
      targetRouteId: string;
      targetRouteCode: string;
      busId: string;
      busRegistration: string;
      driverId?: string;
      conductorId?: string;
      sourceType: string;
      sourceDepot?: string;
      strategy: AllocationStrategy;
      deadheadKm: number;
      deadheadMinutes: number;
      estimatedCost: number;
      headwayBeforeMin: number;
      headwayAfterMin: number;
      waitTimeBeforeMin: number;
      waitTimeAfterMin: number;
      loadFactorBefore: number;
      loadFactorAfter: number;
      notes?: string;
      tenantId?: string;
    }) => data,
  )
  .handler(async ({ data }) => {
    const { dispatchAllocationImpl } =
      await import("../server/allocation/demand-engine");
    return await dispatchAllocationImpl(data);
  });

export const dispatchFleetAllocation = async (data: any) => {
  return await _dispatchFleetAllocation(toServerFnArgs(data)!);
};

const _getRecentAllocations = createServerFn({ method: "POST" })
  .validator((data?: { tenantId?: string }) => data)
  .handler(async ({ data }) => {
    const { getRecentAllocationsImpl } =
      await import("../server/allocation/demand-engine");
    return await getRecentAllocationsImpl(data);
  });

export const getRecentAllocations = async (data?: { tenantId?: string }) => {
  return await _getRecentAllocations(toServerFnArgs(data || {})!);
};

const _getTimePeriods = createServerFn({ method: "GET" }).handler(async () => {
  const { TIME_PERIODS } = await import("../server/allocation/demand-engine");
  return TIME_PERIODS;
});

export const getTimePeriods = async () => {
  return await _getTimePeriods();
};
