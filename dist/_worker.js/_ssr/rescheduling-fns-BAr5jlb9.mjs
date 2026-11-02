import { n as createServerFn } from "./server-CDJaugyn.mjs";
import { t as createServerRpc } from "./createServerRpc-BIfrKr7v.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/rescheduling-fns-BAr5jlb9.js
var _createIncident_createServerFn_handler = createServerRpc({
	id: "b2b1e088f010ee2f008429925a775805e73a1ed1bccf1e2d824fbea9807f14d0",
	name: "_createIncident",
	filename: "src/lib/rescheduling-fns.ts"
}, (opts) => _createIncident.__executeServer(opts));
var _createIncident = createServerFn({ method: "POST" }).validator((data) => data).handler(_createIncident_createServerFn_handler, async ({ data }) => {
	const { createIncidentImpl } = await import("./incident-manager-CpQS-rfm.mjs");
	return await createIncidentImpl(data);
});
var _getIncidents_createServerFn_handler = createServerRpc({
	id: "51c169c227259e9e33598a6d8f719464141758510090eb8d17e36117581fb54d",
	name: "_getIncidents",
	filename: "src/lib/rescheduling-fns.ts"
}, (opts) => _getIncidents.__executeServer(opts));
var _getIncidents = createServerFn({ method: "GET" }).validator((data) => data).handler(_getIncidents_createServerFn_handler, async ({ data }) => {
	const { getIncidentsImpl } = await import("./incident-manager-CpQS-rfm.mjs");
	return await getIncidentsImpl(data);
});
var _getIncidentDetails_createServerFn_handler = createServerRpc({
	id: "e13ffcb825b551474e79d18f92de7f149ca2fafa2ef80ce5477dd3488e1fc23b",
	name: "_getIncidentDetails",
	filename: "src/lib/rescheduling-fns.ts"
}, (opts) => _getIncidentDetails.__executeServer(opts));
var _getIncidentDetails = createServerFn({ method: "GET" }).validator((incidentId) => incidentId).handler(_getIncidentDetails_createServerFn_handler, async ({ data }) => {
	const { getIncidentDetailsImpl } = await import("./incident-manager-CpQS-rfm.mjs");
	return await getIncidentDetailsImpl(data);
});
var _resolveIncident_createServerFn_handler = createServerRpc({
	id: "d36ffd9e903038ef668e0830325f04e2822623315ed587dffdb88213df2ecaf8",
	name: "_resolveIncident",
	filename: "src/lib/rescheduling-fns.ts"
}, (opts) => _resolveIncident.__executeServer(opts));
var _resolveIncident = createServerFn({ method: "POST" }).validator((incidentId) => incidentId).handler(_resolveIncident_createServerFn_handler, async ({ data }) => {
	const { resolveIncidentImpl } = await import("./incident-manager-CpQS-rfm.mjs");
	return await resolveIncidentImpl(data);
});
var _generateRecoveryProposals_createServerFn_handler = createServerRpc({
	id: "e88bc695d942f12ba9a0a5059ca1b313e334277f80a4b7911c55836c045aca31",
	name: "_generateRecoveryProposals",
	filename: "src/lib/rescheduling-fns.ts"
}, (opts) => _generateRecoveryProposals.__executeServer(opts));
var _generateRecoveryProposals = createServerFn({ method: "POST" }).validator((incidentId) => incidentId).handler(_generateRecoveryProposals_createServerFn_handler, async ({ data }) => {
	const { generateRecoveryProposalsImpl } = await import("./recovery-engine-eHSBUJiq.mjs");
	return await generateRecoveryProposalsImpl(data);
});
var _approveRecoveryProposal_createServerFn_handler = createServerRpc({
	id: "2382bbb7163c4633cac2dccbecaa660aa03405c923ca019e0dedfcd669b1342e",
	name: "_approveRecoveryProposal",
	filename: "src/lib/rescheduling-fns.ts"
}, (opts) => _approveRecoveryProposal.__executeServer(opts));
var _approveRecoveryProposal = createServerFn({ method: "POST" }).validator((payload) => payload).handler(_approveRecoveryProposal_createServerFn_handler, async ({ data }) => {
	const { approveRecoveryProposalImpl } = await import("./recovery-engine-eHSBUJiq.mjs");
	return await approveRecoveryProposalImpl(data);
});
//#endregion
export { _approveRecoveryProposal_createServerFn_handler, _createIncident_createServerFn_handler, _generateRecoveryProposals_createServerFn_handler, _getIncidentDetails_createServerFn_handler, _getIncidents_createServerFn_handler, _resolveIncident_createServerFn_handler };
