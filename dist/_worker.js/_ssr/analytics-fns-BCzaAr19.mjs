import { n as createServerFn } from "./server-CDJaugyn.mjs";
import { a as toServerFnArgs, t as createSsrRpc } from "./auth-SlquhadG.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/analytics-fns-BCzaAr19.js
var _getServiceMetrics = createServerFn({ method: "GET" }).validator((filters) => filters).handler(createSsrRpc("eaab6afa926cf02ac80f372a0c89f12bd8ac3644232c012d103dd45ee613140b"));
var getServiceMetrics = async (filters) => {
	return await _getServiceMetrics(toServerFnArgs(filters));
};
var _getPlanVsActual = createServerFn({ method: "GET" }).validator((filters) => filters).handler(createSsrRpc("ed37aed429290197e9be65844b86ef1cb5daea613c84fe3f890a7782ac5ff0b2"));
var getPlanVsActual = async (filters) => {
	return await _getPlanVsActual(toServerFnArgs(filters));
};
var _getRouteAnalytics = createServerFn({ method: "GET" }).validator((filters) => filters).handler(createSsrRpc("fa1ab19f5f374932c10d4cf90172e29da56a26fb5b2d8aaf8fffbab351c73f24"));
var getRouteAnalytics = async (filters) => {
	return await _getRouteAnalytics(toServerFnArgs(filters));
};
var _getFleetAnalytics = createServerFn({ method: "GET" }).validator((filters) => filters).handler(createSsrRpc("01e8a388344a9332e9a3d41ff8e7bdb5747b1b44deedc1cb205a02ecb9c0b9a0"));
var getFleetAnalytics = async (filters) => {
	return await _getFleetAnalytics(toServerFnArgs(filters));
};
var _getCrewAnalytics = createServerFn({ method: "GET" }).handler(createSsrRpc("1a162f71579aa151e97e4f46fa2613d022cd4bdd783219520ef8a7dd7da1e858"));
var getCrewAnalytics = async () => {
	return await _getCrewAnalytics();
};
var _getIncidentAnalytics = createServerFn({ method: "GET" }).handler(createSsrRpc("4395ae59d7a32a4292580eb3efb5b73b1ed43218f6c2b36714d39ad286830cbe"));
var getIncidentAnalytics = async () => {
	return await _getIncidentAnalytics();
};
var _getOptimizationAnalytics = createServerFn({ method: "GET" }).handler(createSsrRpc("f3b03212213839b019de799660ee9bd86a701f1b4cb4ebaf70a379d1af7a1ac8"));
var getOptimizationAnalytics = async () => {
	return await _getOptimizationAnalytics();
};
var _getRecoveryAnalytics = createServerFn({ method: "GET" }).handler(createSsrRpc("d6c9f0c92d81e7ececcae6e64f6343464366505dc06468c6ddc7e3cc7521c278"));
var getRecoveryAnalytics = async () => {
	return await _getRecoveryAnalytics();
};
var _getDepotAnalytics = createServerFn({ method: "GET" }).handler(createSsrRpc("6ddbc6bee597e58e9515cb85c040dba815e454d686a872d0284b2ae8e914be36"));
var getDepotAnalytics = async () => {
	return await _getDepotAnalytics();
};
var _exportAnalyticsCsv = createServerFn({ method: "POST" }).validator((type) => type).handler(createSsrRpc("e575249ae6cd76ed29b6e5854128d93222336dddf14104d091fe296ca826f1d8"));
var exportAnalyticsCsv = async (type) => {
	return await _exportAnalyticsCsv(toServerFnArgs(type));
};
//#endregion
export { getIncidentAnalytics as a, getRecoveryAnalytics as c, getFleetAnalytics as i, getRouteAnalytics as l, getCrewAnalytics as n, getOptimizationAnalytics as o, getDepotAnalytics as r, getPlanVsActual as s, exportAnalyticsCsv as t, getServiceMetrics as u };
