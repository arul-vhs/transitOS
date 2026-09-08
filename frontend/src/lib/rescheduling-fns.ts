import { createServerFn } from "@tanstack/react-start";
import { toServerFnArgs } from "./server-fn-utils";
import type { IncidentType } from "../server/rescheduling/types";

const _createIncident = createServerFn({ method: "POST" })
  .validator(
    (data: {
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
    }) => data
  )
  .handler(async ({ data }) => {
    const { createIncidentImpl } = await import("../server/rescheduling/incident-manager");
    return await createIncidentImpl(data);
  });

export const createIncident = async (data: any) => {
  return await _createIncident(toServerFnArgs(data)!);
};

const _getIncidents = createServerFn({ method: "GET" })
  .validator((data: { serviceDate: string }) => data)
  .handler(async ({ data }) => {
    const { getIncidentsImpl } = await import("../server/rescheduling/incident-manager");
    return await getIncidentsImpl(data);
  });

export const getIncidents = async (data: { serviceDate: string } | { data: { serviceDate: string } }) => {
  return await _getIncidents(toServerFnArgs(data)!);
};

const _getIncidentDetails = createServerFn({ method: "GET" })
  .validator((incidentId: string) => incidentId)
  .handler(async ({ data }) => {
    const { getIncidentDetailsImpl } = await import("../server/rescheduling/incident-manager");
    return await getIncidentDetailsImpl(data);
  });

export const getIncidentDetails = async (incidentId: string | { data: string }) => {
  return await _getIncidentDetails(toServerFnArgs(incidentId)!);
};

const _resolveIncident = createServerFn({ method: "POST" })
  .validator((incidentId: string) => incidentId)
  .handler(async ({ data }) => {
    const { resolveIncidentImpl } = await import("../server/rescheduling/incident-manager");
    return await resolveIncidentImpl(data);
  });

export const resolveIncident = async (incidentId: string | { data: string }) => {
  return await _resolveIncident(toServerFnArgs(incidentId)!);
};

const _generateRecoveryProposals = createServerFn({ method: "POST" })
  .validator((incidentId: string) => incidentId)
  .handler(async ({ data }) => {
    const { generateRecoveryProposalsImpl } = await import("../server/rescheduling/recovery-engine");
    return await generateRecoveryProposalsImpl(data);
  });

export const generateRecoveryProposals = async (incidentId: string | { data: string }) => {
  return await _generateRecoveryProposals(toServerFnArgs(incidentId)!);
};

const _approveRecoveryProposal = createServerFn({ method: "POST" })
  .validator((payload: { proposalId: string }) => payload)
  .handler(async ({ data }) => {
    const { approveRecoveryProposalImpl } = await import("../server/rescheduling/recovery-engine");
    return await approveRecoveryProposalImpl(data);
  });

export const approveRecoveryProposal = async (
  payload: { proposalId: string } | { data: { proposalId: string } }
) => {
  return await _approveRecoveryProposal(toServerFnArgs(payload)!);
};
