import { n as createServerFn } from "./server-CDJaugyn.mjs";
import { a as toServerFnArgs, t as createSsrRpc } from "./auth-SlquhadG.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-gis-fns-BrjITXAP.js
var _getRoutes = createServerFn({ method: "GET" }).validator((filters) => filters).handler(createSsrRpc("b330c9227661f9a84ddd97a4ea08d1a57604780700653f8221b7094e8bec005b"));
var getRoutes = async (filters) => {
	return await _getRoutes(toServerFnArgs(filters));
};
var _getRoute = createServerFn({ method: "GET" }).validator((id) => id).handler(createSsrRpc("4aaaa5b51c42623e3169c6dca4d88714b280b32accc1ef6e3c7f379cd3a6bab8"));
var getRoute = async (id) => {
	return await _getRoute(toServerFnArgs(id));
};
var _createRoute = createServerFn({ method: "POST" }).validator((data) => data).handler(createSsrRpc("0aafcbaf28d6e7cc9a43b1863452d2c0b1d030a930aa84070c0c1d3ca52811f8"));
var createRoute = async (data) => {
	return await _createRoute(toServerFnArgs(data));
};
var _updateRoute = createServerFn({ method: "POST" }).validator((payload) => payload).handler(createSsrRpc("f38ee3affebf3bf85bdcdd98bf8c2ef9767eff4d7a8ce5aa4a2db2f3547efeaa"));
var updateRoute = async (payload) => {
	return await _updateRoute(toServerFnArgs(payload));
};
var _updateRouteStatus = createServerFn({ method: "POST" }).validator((payload) => payload).handler(createSsrRpc("40bea18c0e077a0832bf7cbfd29fee1ad1ef6c5550cd97f50b5964cedd31c3eb"));
var updateRouteStatus = async (payload) => {
	return await _updateRouteStatus(toServerFnArgs(payload));
};
var _deleteRoute = createServerFn({ method: "POST" }).validator((id) => id).handler(createSsrRpc("52da772f3c432bad3c98757535d3d4d63388ea02046bf3eafac7af8c02ec6bc2"));
var deleteRoute = async (id) => {
	return await _deleteRoute(toServerFnArgs(id));
};
createServerFn({ method: "GET" }).validator((routeId) => routeId).handler(createSsrRpc("f4ca3a24926d4a744417db3b51e86360e0bc2ce7a60f64b6e757b9358526fc60"));
var _createStop = createServerFn({ method: "POST" }).validator((data) => data).handler(createSsrRpc("3452088659887388c01a22c0ca94d92e21a60028ed50687522af82cd71d9633e"));
var createStop = async (data) => {
	return await _createStop(toServerFnArgs(data));
};
var _updateStop = createServerFn({ method: "POST" }).validator((payload) => payload).handler(createSsrRpc("09907814b4a780b3564fb07830f2f96fb77a1076b067025c83dedb95df059f75"));
var updateStop = async (payload) => {
	return await _updateStop(toServerFnArgs(payload));
};
var _deleteStop = createServerFn({ method: "POST" }).validator((id) => id).handler(createSsrRpc("e9fc21dc95c3bdadc6809a5d80dc8fc35715282af1bc7532a0fd4293d908e0bc"));
var deleteStop = async (id) => {
	return await _deleteStop(toServerFnArgs(id));
};
createServerFn({ method: "POST" }).validator((payload) => payload).handler(createSsrRpc("7e1c0273f7800a8fc7ca7c30686c7a9430158cdc085fa3c4d4359128d12a9a16"));
var _analyzeRouteOverlap = createServerFn({ method: "POST" }).validator((proposedGeojson) => proposedGeojson).handler(createSsrRpc("eacaf4b36e9bc0cdd02b8d3dab5a75ad0c9d8520f844645875a0bc5a7606bab8"));
var analyzeRouteOverlap = async (proposedGeojson) => {
	return await _analyzeRouteOverlap(toServerFnArgs(proposedGeojson));
};
//#endregion
export { deleteStop as a, updateRoute as c, deleteRoute as i, updateRouteStatus as l, createRoute as n, getRoute as o, createStop as r, getRoutes as s, analyzeRouteOverlap as t, updateStop as u };
