import { createServerFn } from "@tanstack/react-start";
import type { OptimizerResult } from "../server/scheduling/types";

const SCHEDULING_OPTIMIZER_SERVER_PATH = "../server/scheduling/optimizer";

export const generateOptimizedSchedule = createServerFn(
  "POST",
  async (data: {
    serviceDate: string;
    mode: "LINKED" | "UNLINKED" | "HYBRID";
  }) => {
    const { generateOptimizedScheduleImpl } = await import(SCHEDULING_OPTIMIZER_SERVER_PATH);
    return await generateOptimizedScheduleImpl(data);
  }
);

export const getOptimizationRun = createServerFn("GET", async (runId: string) => {
  const { getOptimizationRunImpl } = await import(SCHEDULING_OPTIMIZER_SERVER_PATH);
  return await getOptimizationRunImpl(runId);
});

export const publishSchedule = createServerFn(
  "POST",
  async (payload: { runId: string; proposal: OptimizerResult }) => {
    const { publishScheduleImpl } = await import(SCHEDULING_OPTIMIZER_SERVER_PATH);
    return await publishScheduleImpl(payload);
  }
);
