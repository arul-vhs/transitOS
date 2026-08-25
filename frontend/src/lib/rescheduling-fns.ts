import { createServerFn } from "@tanstack/react-start";
import type { IncidentType } from "../server/rescheduling/types";

const RESCHEDULING_SERVER_PATH = "../server/rescheduling/incident-manager";
const RECOVERY_SERVER_PATH = "../server/rescheduling/recovery-engine";

export const createIncident = createServerFn(
  "POST",
  async (data: {
    type: IncidentType;
    severity: "low" | "medium" | "high" | "critical";
    serviceDate: string;
    resourceType: "bus" | "crew" | null;
    resourceId: string | null;
    tripId: string | null;
    routeId: string | null;
    startTime: number;
    expectedEndTime: number | null;
    location: string | null;
    description: string | null;
  }) => {
    const { createIncidentImpl } = await import(RESCHEDULING_SERVER_PATH);
    return await createIncidentImpl(data);
  }
);

export const getIncidents = createServerFn("GET", async (data: { serviceDate: string }) => {
  const { getIncidentsImpl } = await import(RESCHEDULING_SERVER_PATH);
  return await getIncidentsImpl(data);
});

export const getIncidentDetails = createServerFn("GET", async (incidentId: string) => {
  const { getIncidentDetailsImpl } = await import(RESCHEDULING_SERVER_PATH);
  return await getIncidentDetailsImpl(incidentId);
});

export const resolveIncident = createServerFn("POST", async (incidentId: string) => {
  const { resolveIncidentImpl } = await import(RESCHEDULING_SERVER_PATH);
  return await resolveIncidentImpl(incidentId);
});

export const generateRecoveryProposals = createServerFn(
  "POST",
  async (incidentId: string) => {
    const { generateRecoveryProposalsImpl } = await import(RECOVERY_SERVER_PATH);
    return await generateRecoveryProposalsImpl(incidentId);
  }
);

export const approveRecoveryProposal = createServerFn(
  "POST",
  async (payload: { proposalId: string }) => {
    const { approveRecoveryProposalImpl } = await import(RECOVERY_SERVER_PATH);
    return await approveRecoveryProposalImpl(payload);
  }
);
