import { n as createServerFn } from "./server-CDJaugyn.mjs";
import { t as createServerRpc } from "./createServerRpc-BIfrKr7v.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-gis-fns-ul7rtUt7.js
var _getRoutes_createServerFn_handler = createServerRpc({
	id: "b330c9227661f9a84ddd97a4ea08d1a57604780700653f8221b7094e8bec005b",
	name: "_getRoutes",
	filename: "src/lib/routes-gis-fns.ts"
}, (opts) => _getRoutes.__executeServer(opts));
var _getRoutes = createServerFn({ method: "GET" }).validator((filters) => filters).handler(_getRoutes_createServerFn_handler, async ({ data }) => {
	const { getRoutesImpl } = await import("./routes-gis-5bqkCXxw.mjs");
	return await getRoutesImpl(data);
});
var _getRoute_createServerFn_handler = createServerRpc({
	id: "4aaaa5b51c42623e3169c6dca4d88714b280b32accc1ef6e3c7f379cd3a6bab8",
	name: "_getRoute",
	filename: "src/lib/routes-gis-fns.ts"
}, (opts) => _getRoute.__executeServer(opts));
var _getRoute = createServerFn({ method: "GET" }).validator((id) => id).handler(_getRoute_createServerFn_handler, async ({ data }) => {
	const { getRouteImpl } = await import("./routes-gis-5bqkCXxw.mjs");
	return await getRouteImpl(data);
});
var _createRoute_createServerFn_handler = createServerRpc({
	id: "0aafcbaf28d6e7cc9a43b1863452d2c0b1d030a930aa84070c0c1d3ca52811f8",
	name: "_createRoute",
	filename: "src/lib/routes-gis-fns.ts"
}, (opts) => _createRoute.__executeServer(opts));
var _createRoute = createServerFn({ method: "POST" }).validator((data) => data).handler(_createRoute_createServerFn_handler, async ({ data }) => {
	const { createRouteImpl } = await import("./routes-gis-5bqkCXxw.mjs");
	return await createRouteImpl(data);
});
var _updateRoute_createServerFn_handler = createServerRpc({
	id: "f38ee3affebf3bf85bdcdd98bf8c2ef9767eff4d7a8ce5aa4a2db2f3547efeaa",
	name: "_updateRoute",
	filename: "src/lib/routes-gis-fns.ts"
}, (opts) => _updateRoute.__executeServer(opts));
var _updateRoute = createServerFn({ method: "POST" }).validator((payload) => payload).handler(_updateRoute_createServerFn_handler, async ({ data }) => {
	const { updateRouteImpl } = await import("./routes-gis-5bqkCXxw.mjs");
	return await updateRouteImpl(data.id, data.data);
});
var _updateRouteStatus_createServerFn_handler = createServerRpc({
	id: "40bea18c0e077a0832bf7cbfd29fee1ad1ef6c5550cd97f50b5964cedd31c3eb",
	name: "_updateRouteStatus",
	filename: "src/lib/routes-gis-fns.ts"
}, (opts) => _updateRouteStatus.__executeServer(opts));
var _updateRouteStatus = createServerFn({ method: "POST" }).validator((payload) => payload).handler(_updateRouteStatus_createServerFn_handler, async ({ data }) => {
	const { updateRouteStatusImpl } = await import("./routes-gis-5bqkCXxw.mjs");
	return await updateRouteStatusImpl(data.id, data.status);
});
var _deleteRoute_createServerFn_handler = createServerRpc({
	id: "52da772f3c432bad3c98757535d3d4d63388ea02046bf3eafac7af8c02ec6bc2",
	name: "_deleteRoute",
	filename: "src/lib/routes-gis-fns.ts"
}, (opts) => _deleteRoute.__executeServer(opts));
var _deleteRoute = createServerFn({ method: "POST" }).validator((id) => id).handler(_deleteRoute_createServerFn_handler, async ({ data }) => {
	const { deleteRouteImpl } = await import("./routes-gis-5bqkCXxw.mjs");
	return await deleteRouteImpl(data);
});
var _getRouteStops_createServerFn_handler = createServerRpc({
	id: "f4ca3a24926d4a744417db3b51e86360e0bc2ce7a60f64b6e757b9358526fc60",
	name: "_getRouteStops",
	filename: "src/lib/routes-gis-fns.ts"
}, (opts) => _getRouteStops.__executeServer(opts));
var _getRouteStops = createServerFn({ method: "GET" }).validator((routeId) => routeId).handler(_getRouteStops_createServerFn_handler, async ({ data }) => {
	const { getRouteStopsImpl } = await import("./routes-gis-5bqkCXxw.mjs");
	return await getRouteStopsImpl(data);
});
var _createStop_createServerFn_handler = createServerRpc({
	id: "3452088659887388c01a22c0ca94d92e21a60028ed50687522af82cd71d9633e",
	name: "_createStop",
	filename: "src/lib/routes-gis-fns.ts"
}, (opts) => _createStop.__executeServer(opts));
var _createStop = createServerFn({ method: "POST" }).validator((data) => data).handler(_createStop_createServerFn_handler, async ({ data }) => {
	const { createStopImpl } = await import("./routes-gis-5bqkCXxw.mjs");
	return await createStopImpl(data);
});
var _updateStop_createServerFn_handler = createServerRpc({
	id: "09907814b4a780b3564fb07830f2f96fb77a1076b067025c83dedb95df059f75",
	name: "_updateStop",
	filename: "src/lib/routes-gis-fns.ts"
}, (opts) => _updateStop.__executeServer(opts));
var _updateStop = createServerFn({ method: "POST" }).validator((payload) => payload).handler(_updateStop_createServerFn_handler, async ({ data }) => {
	const { updateStopImpl } = await import("./routes-gis-5bqkCXxw.mjs");
	return await updateStopImpl(data.id, data.data);
});
var _deleteStop_createServerFn_handler = createServerRpc({
	id: "e9fc21dc95c3bdadc6809a5d80dc8fc35715282af1bc7532a0fd4293d908e0bc",
	name: "_deleteStop",
	filename: "src/lib/routes-gis-fns.ts"
}, (opts) => _deleteStop.__executeServer(opts));
var _deleteStop = createServerFn({ method: "POST" }).validator((id) => id).handler(_deleteStop_createServerFn_handler, async ({ data }) => {
	const { deleteStopImpl } = await import("./routes-gis-5bqkCXxw.mjs");
	return await deleteStopImpl(data);
});
var _reorderStops_createServerFn_handler = createServerRpc({
	id: "7e1c0273f7800a8fc7ca7c30686c7a9430158cdc085fa3c4d4359128d12a9a16",
	name: "_reorderStops",
	filename: "src/lib/routes-gis-fns.ts"
}, (opts) => _reorderStops.__executeServer(opts));
var _reorderStops = createServerFn({ method: "POST" }).validator((payload) => payload).handler(_reorderStops_createServerFn_handler, async ({ data }) => {
	const { reorderStopsImpl } = await import("./routes-gis-5bqkCXxw.mjs");
	return await reorderStopsImpl(data.routeId, data.stopIds);
});
var _analyzeRouteOverlap_createServerFn_handler = createServerRpc({
	id: "eacaf4b36e9bc0cdd02b8d3dab5a75ad0c9d8520f844645875a0bc5a7606bab8",
	name: "_analyzeRouteOverlap",
	filename: "src/lib/routes-gis-fns.ts"
}, (opts) => _analyzeRouteOverlap.__executeServer(opts));
var _analyzeRouteOverlap = createServerFn({ method: "POST" }).validator((proposedGeojson) => proposedGeojson).handler(_analyzeRouteOverlap_createServerFn_handler, async ({ data }) => {
	const { analyzeRouteOverlapImpl } = await import("./routes-gis-5bqkCXxw.mjs");
	return await analyzeRouteOverlapImpl(data);
});
//#endregion
export { _analyzeRouteOverlap_createServerFn_handler, _createRoute_createServerFn_handler, _createStop_createServerFn_handler, _deleteRoute_createServerFn_handler, _deleteStop_createServerFn_handler, _getRouteStops_createServerFn_handler, _getRoute_createServerFn_handler, _getRoutes_createServerFn_handler, _reorderStops_createServerFn_handler, _updateRouteStatus_createServerFn_handler, _updateRoute_createServerFn_handler, _updateStop_createServerFn_handler };
