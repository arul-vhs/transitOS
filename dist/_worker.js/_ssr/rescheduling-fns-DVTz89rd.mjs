import { n as createServerFn } from "./server-CDJaugyn.mjs";
import { a as toServerFnArgs, t as createSsrRpc } from "./auth-SlquhadG.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/rescheduling-fns-DVTz89rd.js
var _createIncident = createServerFn({ method: "POST" }).validator((data) => data).handler(createSsrRpc("b2b1e088f010ee2f008429925a775805e73a1ed1bccf1e2d824fbea9807f14d0"));
var createIncident = async (data) => {
	return await _createIncident(toServerFnArgs(data));
};
var _getIncidents = createServerFn({ method: "GET" }).validator((data) => data).handler(createSsrRpc("51c169c227259e9e33598a6d8f719464141758510090eb8d17e36117581fb54d"));
var getIncidents = async (data) => {
	return await _getIncidents(toServerFnArgs(data));
};
var _getIncidentDetails = createServerFn({ method: "GET" }).validator((incidentId) => incidentId).handler(createSsrRpc("e13ffcb825b551474e79d18f92de7f149ca2fafa2ef80ce5477dd3488e1fc23b"));
var getIncidentDetails = async (incidentId) => {
	return await _getIncidentDetails(toServerFnArgs(incidentId));
};
var _resolveIncident = createServerFn({ method: "POST" }).validator((incidentId) => incidentId).handler(createSsrRpc("d36ffd9e903038ef668e0830325f04e2822623315ed587dffdb88213df2ecaf8"));
var resolveIncident = async (incidentId) => {
	return await _resolveIncident(toServerFnArgs(incidentId));
};
var _generateRecoveryProposals = createServerFn({ method: "POST" }).validator((incidentId) => incidentId).handler(createSsrRpc("e88bc695d942f12ba9a0a5059ca1b313e334277f80a4b7911c55836c045aca31"));
var generateRecoveryProposals = async (incidentId) => {
	return await _generateRecoveryProposals(toServerFnArgs(incidentId));
};
var _approveRecoveryProposal = createServerFn({ method: "POST" }).validator((payload) => payload).handler(createSsrRpc("2382bbb7163c4633cac2dccbecaa660aa03405c923ca019e0dedfcd669b1342e"));
var approveRecoveryProposal = async (payload) => {
	return await _approveRecoveryProposal(toServerFnArgs(payload));
};
//#endregion
export { getIncidents as a, getIncidentDetails as i, createIncident as n, resolveIncident as o, generateRecoveryProposals as r, approveRecoveryProposal as t };
