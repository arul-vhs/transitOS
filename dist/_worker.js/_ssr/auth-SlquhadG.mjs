import { a as getServerFnById, n as createServerFn, t as TSS_SERVER_FUNCTION } from "./server-CDJaugyn.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/auth-SlquhadG.js
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
/**
* Helper to normalize caller arguments into TanStack Start server function options.
* TanStack Start requires server function payloads to be wrapped in `{ data: ... }`.
* This helper allows callers to pass direct parameters (e.g. `getBus(id)`)
* or options objects (e.g. `loginFn({ data: credentials })`), while cleanly
* passing `undefined` when no argument is provided.
*/
function toServerFnArgs(arg) {
	if (arg === void 0) return void 0;
	if (typeof arg === "object" && arg !== null && "data" in arg && Object.keys(arg).length === 1) return arg;
	return { data: arg };
}
var _loginFn = createServerFn({ method: "POST" }).validator((credentials) => credentials).handler(createSsrRpc("20da441e275c24bd3c848f7904c02cb21e33fd83a8c5e2b623da1cf969a103fc"));
var loginFn = async (credentials) => {
	return await _loginFn(toServerFnArgs(credentials));
};
var _logoutFn = createServerFn({ method: "POST" }).handler(createSsrRpc("41e26cb9381f874ee3551f44a4887421b7fb17d1c8844c8a347292fb1c76e5eb"));
var logoutFn = async () => {
	return await _logoutFn();
};
var _getCurrentUserFn = createServerFn({ method: "GET" }).handler(createSsrRpc("9917c261580f021138cad0412cce2653d612ec64f291beb74730ed03e19b21f3"));
var getCurrentUserFn = async () => {
	return await _getCurrentUserFn();
};
//#endregion
export { toServerFnArgs as a, logoutFn as i, getCurrentUserFn as n, loginFn as r, createSsrRpc as t };
