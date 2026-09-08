import { createServerFn } from "@tanstack/react-start";
import { toServerFnArgs } from "./server-fn-utils";
import type { OptimizerResult } from "../server/scheduling/types";

const _generateOptimizedSchedule = createServerFn({ method: "POST" })
  .validator(
    (data: {
      serviceDate: string;
      mode: "LINKED" | "UNLINKED" | "HYBRID";
    }) => data
  )
  .handler(async ({ data }) => {
    const { generateOptimizedScheduleImpl } = await import("../server/scheduling/optimizer");
    return await generateOptimizedScheduleImpl(data);
  });

export const generateOptimizedSchedule = async (
  data:
    | {
        serviceDate: string;
        mode: "LINKED" | "UNLINKED" | "HYBRID";
      }
    | {
        data: {
          serviceDate: string;
          mode: "LINKED" | "UNLINKED" | "HYBRID";
        };
      }
) => {
  return await _generateOptimizedSchedule(toServerFnArgs(data)!);
};

const _getOptimizationRun = createServerFn({ method: "GET" })
  .validator((runId: string) => runId)
  .handler(async ({ data }) => {
    const { getOptimizationRunImpl } = await import("../server/scheduling/optimizer");
    return await getOptimizationRunImpl(data);
  });

export const getOptimizationRun = async (runId: string | { data: string }) => {
  return await _getOptimizationRun(toServerFnArgs(runId)!);
};

const _publishSchedule = createServerFn({ method: "POST" })
  .validator((payload: { runId: string; proposal: OptimizerResult }) => payload)
  .handler(async ({ data }) => {
    const { publishScheduleImpl } = await import("../server/scheduling/optimizer");
    return await publishScheduleImpl(data);
  });

export const publishSchedule = async (
  payload: { runId: string; proposal: OptimizerResult } | { data: { runId: string; proposal: OptimizerResult } }
) => {
  return await _publishSchedule(toServerFnArgs(payload)!);
};
