import { n as createServerFn } from "./server-CDJaugyn.mjs";
import { t as createServerRpc } from "./createServerRpc-BIfrKr7v.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/analytics-fns-BdoqsCHp.js
var _getServiceMetrics_createServerFn_handler = createServerRpc({
	id: "eaab6afa926cf02ac80f372a0c89f12bd8ac3644232c012d103dd45ee613140b",
	name: "_getServiceMetrics",
	filename: "src/lib/analytics-fns.ts"
}, (opts) => _getServiceMetrics.__executeServer(opts));
var _getServiceMetrics = createServerFn({ method: "GET" }).validator((filters) => filters).handler(_getServiceMetrics_createServerFn_handler, async ({ data }) => {
	const { getServiceMetricsImpl } = await import("./queries-D06nuTWx.mjs");
	return await getServiceMetricsImpl(data);
});
var _getPlanVsActual_createServerFn_handler = createServerRpc({
	id: "ed37aed429290197e9be65844b86ef1cb5daea613c84fe3f890a7782ac5ff0b2",
	name: "_getPlanVsActual",
	filename: "src/lib/analytics-fns.ts"
}, (opts) => _getPlanVsActual.__executeServer(opts));
var _getPlanVsActual = createServerFn({ method: "GET" }).validator((filters) => filters).handler(_getPlanVsActual_createServerFn_handler, async ({ data }) => {
	const { getPlanVsActualImpl } = await import("./queries-D06nuTWx.mjs");
	return await getPlanVsActualImpl(data);
});
var _getRouteAnalytics_createServerFn_handler = createServerRpc({
	id: "fa1ab19f5f374932c10d4cf90172e29da56a26fb5b2d8aaf8fffbab351c73f24",
	name: "_getRouteAnalytics",
	filename: "src/lib/analytics-fns.ts"
}, (opts) => _getRouteAnalytics.__executeServer(opts));
var _getRouteAnalytics = createServerFn({ method: "GET" }).validator((filters) => filters).handler(_getRouteAnalytics_createServerFn_handler, async ({ data }) => {
	const { getRouteAnalyticsImpl } = await import("./queries-D06nuTWx.mjs");
	return await getRouteAnalyticsImpl(data);
});
var _getFleetAnalytics_createServerFn_handler = createServerRpc({
	id: "01e8a388344a9332e9a3d41ff8e7bdb5747b1b44deedc1cb205a02ecb9c0b9a0",
	name: "_getFleetAnalytics",
	filename: "src/lib/analytics-fns.ts"
}, (opts) => _getFleetAnalytics.__executeServer(opts));
var _getFleetAnalytics = createServerFn({ method: "GET" }).validator((filters) => filters).handler(_getFleetAnalytics_createServerFn_handler, async ({ data }) => {
	const { getFleetAnalyticsImpl } = await import("./queries-D06nuTWx.mjs");
	return await getFleetAnalyticsImpl(data);
});
var _getCrewAnalytics_createServerFn_handler = createServerRpc({
	id: "1a162f71579aa151e97e4f46fa2613d022cd4bdd783219520ef8a7dd7da1e858",
	name: "_getCrewAnalytics",
	filename: "src/lib/analytics-fns.ts"
}, (opts) => _getCrewAnalytics.__executeServer(opts));
var _getCrewAnalytics = createServerFn({ method: "GET" }).handler(_getCrewAnalytics_createServerFn_handler, async () => {
	const { getCrewAnalyticsImpl } = await import("./queries-D06nuTWx.mjs");
	return await getCrewAnalyticsImpl();
});
var _getIncidentAnalytics_createServerFn_handler = createServerRpc({
	id: "4395ae59d7a32a4292580eb3efb5b73b1ed43218f6c2b36714d39ad286830cbe",
	name: "_getIncidentAnalytics",
	filename: "src/lib/analytics-fns.ts"
}, (opts) => _getIncidentAnalytics.__executeServer(opts));
var _getIncidentAnalytics = createServerFn({ method: "GET" }).handler(_getIncidentAnalytics_createServerFn_handler, async () => {
	const { getIncidentAnalyticsImpl } = await import("./queries-D06nuTWx.mjs");
	return await getIncidentAnalyticsImpl();
});
var _getOptimizationAnalytics_createServerFn_handler = createServerRpc({
	id: "f3b03212213839b019de799660ee9bd86a701f1b4cb4ebaf70a379d1af7a1ac8",
	name: "_getOptimizationAnalytics",
	filename: "src/lib/analytics-fns.ts"
}, (opts) => _getOptimizationAnalytics.__executeServer(opts));
var _getOptimizationAnalytics = createServerFn({ method: "GET" }).handler(_getOptimizationAnalytics_createServerFn_handler, async () => {
	const { getOptimizationAnalyticsImpl } = await import("./queries-D06nuTWx.mjs");
	return await getOptimizationAnalyticsImpl();
});
var _getRecoveryAnalytics_createServerFn_handler = createServerRpc({
	id: "d6c9f0c92d81e7ececcae6e64f6343464366505dc06468c6ddc7e3cc7521c278",
	name: "_getRecoveryAnalytics",
	filename: "src/lib/analytics-fns.ts"
}, (opts) => _getRecoveryAnalytics.__executeServer(opts));
var _getRecoveryAnalytics = createServerFn({ method: "GET" }).handler(_getRecoveryAnalytics_createServerFn_handler, async () => {
	const { getRecoveryAnalyticsImpl } = await import("./queries-D06nuTWx.mjs");
	return await getRecoveryAnalyticsImpl();
});
var _getDepotAnalytics_createServerFn_handler = createServerRpc({
	id: "6ddbc6bee597e58e9515cb85c040dba815e454d686a872d0284b2ae8e914be36",
	name: "_getDepotAnalytics",
	filename: "src/lib/analytics-fns.ts"
}, (opts) => _getDepotAnalytics.__executeServer(opts));
var _getDepotAnalytics = createServerFn({ method: "GET" }).handler(_getDepotAnalytics_createServerFn_handler, async () => {
	const { getDepotAnalyticsImpl } = await import("./queries-D06nuTWx.mjs");
	return await getDepotAnalyticsImpl();
});
var _exportAnalyticsCsv_createServerFn_handler = createServerRpc({
	id: "e575249ae6cd76ed29b6e5854128d93222336dddf14104d091fe296ca826f1d8",
	name: "_exportAnalyticsCsv",
	filename: "src/lib/analytics-fns.ts"
}, (opts) => _exportAnalyticsCsv.__executeServer(opts));
var _exportAnalyticsCsv = createServerFn({ method: "POST" }).validator((type) => type).handler(_exportAnalyticsCsv_createServerFn_handler, async ({ data }) => {
	const { exportAnalyticsCsvImpl } = await import("./export-CtFo7m3S.mjs");
	return await exportAnalyticsCsvImpl(data);
});
//#endregion
export { _exportAnalyticsCsv_createServerFn_handler, _getCrewAnalytics_createServerFn_handler, _getDepotAnalytics_createServerFn_handler, _getFleetAnalytics_createServerFn_handler, _getIncidentAnalytics_createServerFn_handler, _getOptimizationAnalytics_createServerFn_handler, _getPlanVsActual_createServerFn_handler, _getRecoveryAnalytics_createServerFn_handler, _getRouteAnalytics_createServerFn_handler, _getServiceMetrics_createServerFn_handler };
