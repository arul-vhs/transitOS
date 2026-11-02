globalThis.__nitro_main__ = import.meta.url;
import { n as HTTPError, r as defineLazyEventHandler, t as H3Core } from "./_libs/h3+rou3+srvx.mjs";
import { o as FastResponse } from "./_libs/h3-v2+rou3+srvx.mjs";
//#region #nitro-vite-setup
function lazyService(loader) {
	let promise, mod;
	return { fetch(req) {
		if (mod) return mod.fetch(req);
		if (!promise) promise = loader().then((_mod) => mod = _mod.default || _mod);
		return promise.then((mod) => mod.fetch(req));
	} };
}
var services = { ["ssr"]: lazyService(() => import("./_ssr/ssr.mjs")) };
globalThis.__nitro_vite_envs__ = services;
//#endregion
//#region node_modules/nitro/dist/runtime/internal/route-rules.mjs
var headers = ((m) => function headersRouteRule(event) {
	for (const [key, value] of Object.entries(m.options || {})) event.res.headers.set(key, value);
});
//#endregion
//#region #nitro/virtual/routing
var findRouteRules = /* @__PURE__ */ (() => {
	const $0 = [{
		name: "headers",
		route: "/assets/**",
		handler: headers,
		options: { "cache-control": "public, max-age=31536000, immutable" }
	}];
	return (m, p) => {
		let r = [];
		if (p.charCodeAt(p.length - 1) === 47) p = p.slice(0, -1) || "/";
		let s = p.split("/");
		if (s.length > 1) {
			if (s[1] === "assets") r.unshift({
				data: $0,
				params: { "_": s.slice(2).join("/") }
			});
		}
		return r;
	};
})();
var _lazy_DZOtiu = defineLazyEventHandler(() => import("./_chunks/ssr-renderer.mjs"));
var findRoute = /* @__PURE__ */ (() => {
	const data = {
		route: "/**",
		handler: _lazy_DZOtiu
	};
	return ((_m, p) => {
		return {
			data,
			params: { "_": p.slice(1) }
		};
	});
})();
[].filter(Boolean);
//#endregion
//#region node_modules/nitro/dist/runtime/internal/error/prod.mjs
var errorHandler = (error, event) => {
	const res = defaultHandler(error, event);
	return new FastResponse(typeof res.body === "string" ? res.body : JSON.stringify(res.body, null, 2), res);
};
function defaultHandler(error, event) {
	const unhandled = error.unhandled ?? !HTTPError.isError(error);
	const { status = 500, statusText = "" } = unhandled ? {} : error;
	if (status === 404) {
		const url = event.url || new URL(event.req.url);
		const baseURL = "/";
		if (/^\/[^/]/.test(baseURL) && !url.pathname.startsWith(baseURL)) return {
			status: 302,
			headers: new Headers({ location: `${baseURL}${url.pathname.slice(1)}${url.search}` })
		};
	}
	const headers = new Headers(unhandled ? {} : error.headers);
	headers.set("content-type", "application/json; charset=utf-8");
	return {
		status,
		statusText,
		headers,
		body: {
			error: true,
			...unhandled ? {
				status,
				unhandled: true
			} : typeof error.toJSON === "function" ? error.toJSON() : {
				status,
				statusText,
				message: error.message
			}
		}
	};
}
//#endregion
//#region #nitro/virtual/error-handler
var errorHandlers = [errorHandler];
async function error_handler_default(error, event) {
	for (const handler of errorHandlers) try {
		const response = await handler(error, event, { defaultHandler });
		if (response) return response;
	} catch (error) {
		console.error(error);
	}
}
//#endregion
//#region #nitro/virtual/app
function createNitroApp() {
	const captureError = (error, errorCtx) => {
		if (errorCtx?.event) {
			const errors = errorCtx.event.req.context?.nitro?.errors;
			if (errors) errors.push({
				error,
				context: errorCtx
			});
		}
	};
	const h3App = createH3App({ onError(error, event) {
		return error_handler_default(error, event);
	} });
	let appHandler = (req) => {
		req.context ||= {};
		req.context.nitro = req.context.nitro || { errors: [] };
		return h3App.fetch(req);
	};
	return {
		fetch: appHandler,
		h3: h3App,
		hooks: void 0,
		captureError
	};
}
function createH3App(config) {
	const h3App = new H3Core(config);
	h3App["~findRoute"] = (event) => findRoute(event.req.method, event.url.pathname);
	h3App["~getMiddleware"] = (event, route) => {
		const pathname = event.url.pathname;
		const method = event.req.method;
		const middleware = [];
		const routeRules = getRouteRules(method, pathname);
		event.context.routeRules = routeRules?.routeRules;
		if (routeRules?.routeRuleMiddleware.length) middleware.push(...routeRules.routeRuleMiddleware);
		if (route?.data?.middleware?.length) middleware.push(...route.data.middleware);
		return middleware;
	};
	return h3App;
}
//#endregion
//#region node_modules/nitro/dist/runtime/internal/app.mjs
var APP_ID = "default";
function useNitroApp() {
	let instance = useNitroApp._instance;
	if (instance) return instance;
	instance = useNitroApp._instance = createNitroApp();
	globalThis.__nitro__ = globalThis.__nitro__ || {};
	globalThis.__nitro__[APP_ID] = instance;
	return instance;
}
function getRouteRules(method, pathname) {
	const m = findRouteRules(method, pathname);
	if (!m?.length) return { routeRuleMiddleware: [] };
	const routeRules = {};
	for (const layer of m) for (const rule of layer.data) {
		const currentRule = routeRules[rule.name];
		if (currentRule) {
			if (rule.options === false) {
				delete routeRules[rule.name];
				continue;
			}
			if (typeof currentRule.options === "object" && typeof rule.options === "object") currentRule.options = {
				...currentRule.options,
				...rule.options
			};
			else currentRule.options = rule.options;
			currentRule.route = rule.route;
			currentRule.params = {
				...currentRule.params,
				...layer.params
			};
		} else if (rule.options !== false) routeRules[rule.name] = {
			...rule,
			params: layer.params
		};
	}
	const middleware = [];
	const orderedRules = Object.values(routeRules).sort((a, b) => (a.handler?.order || 0) - (b.handler?.order || 0));
	for (const rule of orderedRules) {
		if (rule.options === false || !rule.handler) continue;
		middleware.push(rule.handler(rule));
	}
	return {
		routeRules,
		routeRuleMiddleware: middleware
	};
}
//#endregion
//#region #nitro/virtual/public-assets-data
var public_assets_data_default = {
	"/favicon.ico": {
		"type": "image/vnd.microsoft.icon",
		"etag": "\"4f95-3RXc3p2mhEAs1WBwaIvE0Y0uu0Y\"",
		"mtime": "2026-10-12T16:30:01.548Z",
		"size": 20373,
		"path": "../favicon.ico"
	},
	"/favicon.svg": {
		"type": "image/svg+xml",
		"etag": "\"249-uHA0IQwDyhZ9nZPbUMnSqEAFdxU\"",
		"mtime": "2026-10-12T16:30:01.548Z",
		"size": 585,
		"path": "../favicon.svg"
	},
	"/logo.svg": {
		"type": "image/svg+xml",
		"etag": "\"66f-m9dSOrHQHPPZIyJjvDqB2HVoKxo\"",
		"mtime": "2026-10-12T16:30:01.548Z",
		"size": 1647,
		"path": "../logo.svg"
	},
	"/robots.txt": {
		"type": "text/plain; charset=utf-8",
		"etag": "\"a0-CKGXSIe7TSsqDTmGm/nY1t/o5d0\"",
		"mtime": "2026-10-12T16:30:01.549Z",
		"size": 160,
		"path": "../robots.txt"
	},
	"/site.webmanifest": {
		"type": "application/manifest+json",
		"etag": "\"21f-RvthmtSpZEJEg0995c5m5/2KEbM\"",
		"mtime": "2026-10-12T16:30:01.549Z",
		"size": 543,
		"path": "../site.webmanifest"
	},
	"/screenshot-landing.png": {
		"type": "image/png",
		"etag": "\"2c3a0-IRp8n0QWDYxwvNXU0bLtQTOAcIE\"",
		"mtime": "2026-10-12T16:30:01.551Z",
		"size": 181152,
		"path": "../screenshot-landing.png"
	},
	"/presentation/01-landing.png": {
		"type": "image/png",
		"etag": "\"64626-ZYv5KyieuiXJAdOL5Ek5GVf+Jhg\"",
		"mtime": "2026-10-12T16:30:01.549Z",
		"size": 411174,
		"path": "../presentation/01-landing.png"
	},
	"/presentation/10-interactive-simulation.png": {
		"type": "image/png",
		"etag": "\"2bdbf-X5p5YqeFI545XtIoXVKYFQhapKI\"",
		"mtime": "2026-10-12T16:30:01.549Z",
		"size": 179647,
		"path": "../presentation/10-interactive-simulation.png"
	},
	"/presentation/index.html": {
		"type": "text/html; charset=utf-8",
		"etag": "\"12064-FUJ+ewqn7jq16tU4a+OsvlWMba0\"",
		"mtime": "2026-10-12T16:30:01.547Z",
		"size": 73828,
		"path": "../presentation/index.html"
	},
	"/assets/activity-DVje9OcN.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"e0-Fmbkvu3l+vYMeXXqF8fv/vDi+fA\"",
		"mtime": "2026-10-12T16:30:00.807Z",
		"size": 224,
		"path": "../assets/activity-DVje9OcN.js"
	},
	"/assets/analytics-fns-lhLgqN8i.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"54c-5cGod4UW9k//TKUNMf6vXqTw0Yc\"",
		"mtime": "2026-10-12T16:30:00.807Z",
		"size": 1356,
		"path": "../assets/analytics-fns-lhLgqN8i.js"
	},
	"/assets/analytics.fleet-4V2dabBr.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"dc2-b4YbeMzI10eHRdofZAjB+wBaUsQ\"",
		"mtime": "2026-10-12T16:30:00.807Z",
		"size": 3522,
		"path": "../assets/analytics.fleet-4V2dabBr.js"
	},
	"/assets/analytics-CioevVjr.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8b-2TXxtvKXTzmJhsJtnEfbmdWkGEc\"",
		"mtime": "2026-10-12T16:30:00.807Z",
		"size": 139,
		"path": "../assets/analytics-CioevVjr.js"
	},
	"/assets/analytics.incidents-Bfd_t0Um.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1085-l6p0KNIL7Hy3F++IhI+dOFUsTXU\"",
		"mtime": "2026-10-12T16:30:00.807Z",
		"size": 4229,
		"path": "../assets/analytics.incidents-Bfd_t0Um.js"
	},
	"/assets/analytics.crew-Dzb8uGRc.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"a82-NLDLLazRilRjmeS0GiwC0aVF+gs\"",
		"mtime": "2026-10-12T16:30:00.807Z",
		"size": 2690,
		"path": "../assets/analytics.crew-Dzb8uGRc.js"
	},
	"/assets/analytics.index-nLR7rJ-R.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"362e-zbIMhuAwO+KSplYiQ6GrOdwT84k\"",
		"mtime": "2026-10-12T16:30:00.807Z",
		"size": 13870,
		"path": "../assets/analytics.index-nLR7rJ-R.js"
	},
	"/presentation/07-today-operations.png": {
		"type": "image/png",
		"etag": "\"7f314-a2o79H9eGtBmT5i6U6FJdQIaD0M\"",
		"mtime": "2026-10-12T16:30:01.547Z",
		"size": 520980,
		"path": "../presentation/07-today-operations.png"
	},
	"/presentation/09-plan-vs-actual.png": {
		"type": "image/png",
		"etag": "\"79e9e-QbXMpW/Nv17GlmPt/BrAAaOamTE\"",
		"mtime": "2026-10-12T16:30:01.547Z",
		"size": 499358,
		"path": "../presentation/09-plan-vs-actual.png"
	},
	"/presentation/02-dashboard.png": {
		"type": "image/png",
		"etag": "\"80731-msczF0/0K8IDMrqvj01Ekfswfmg\"",
		"mtime": "2026-10-12T16:30:01.544Z",
		"size": 526129,
		"path": "../presentation/02-dashboard.png"
	},
	"/presentation/06-disruption-recovery.png": {
		"type": "image/png",
		"etag": "\"80ee1-F8R6M7tG2ABgWLwSw1f/Z4qlCjU\"",
		"mtime": "2026-10-12T16:30:01.544Z",
		"size": 528097,
		"path": "../presentation/06-disruption-recovery.png"
	},
	"/presentation/05-duty-optimizer.png": {
		"type": "image/png",
		"etag": "\"a9756-mZixUWQKZdlrP2sKGKrSWa5YQfE\"",
		"mtime": "2026-10-12T16:30:01.544Z",
		"size": 694102,
		"path": "../presentation/05-duty-optimizer.png"
	},
	"/presentation/08-crew-availability.png": {
		"type": "image/png",
		"etag": "\"95b4d-4yDxpIUUaEUnpOCXLn7/VFeyee0\"",
		"mtime": "2026-10-12T16:30:01.547Z",
		"size": 613197,
		"path": "../presentation/08-crew-availability.png"
	},
	"/presentation/03-route-network.png": {
		"type": "image/png",
		"etag": "\"1b24a6-4KJYdHoREx4H+A2gkbKYbnWVsI0\"",
		"mtime": "2026-10-12T16:30:01.554Z",
		"size": 1778854,
		"path": "../presentation/03-route-network.png"
	},
	"/presentation/06-simulation.png": {
		"type": "image/png",
		"etag": "\"1df5d8-Bi629zplBjQ6Pc/tg1M0WaHUQ3k\"",
		"mtime": "2026-10-12T16:30:01.545Z",
		"size": 1963480,
		"path": "../presentation/06-simulation.png"
	},
	"/assets/analytics.plan-vs-actual-Bi8xmJpF.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"16f9-FuLkdKIbthayXawf+mWbJPFYte8\"",
		"mtime": "2026-10-12T16:30:00.807Z",
		"size": 5881,
		"path": "../assets/analytics.plan-vs-actual-Bi8xmJpF.js"
	},
	"/assets/analytics.routes-v380oGq0.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"ff3-4erdQULBKBaWEHiaBtCnK0q/mVo\"",
		"mtime": "2026-10-12T16:30:00.807Z",
		"size": 4083,
		"path": "../assets/analytics.routes-v380oGq0.js"
	},
	"/assets/arrow-left-BPRhVlz7.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"9b-KkReOxtvGW4o/81EE9ucBxwNayw\"",
		"mtime": "2026-10-12T16:30:00.807Z",
		"size": 155,
		"path": "../assets/arrow-left-BPRhVlz7.js"
	},
	"/assets/app-shell-5o3RsLOE.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"18d1d-cM8nM12yn5WxulyWJ8X52J1HPO0\"",
		"mtime": "2026-10-12T16:30:00.807Z",
		"size": 101661,
		"path": "../assets/app-shell-5o3RsLOE.js"
	},
	"/assets/award-CSB5vJOb.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"108-2znYEsXx97pCyZboo8gAVYHnJ7A\"",
		"mtime": "2026-10-12T16:30:00.807Z",
		"size": 264,
		"path": "../assets/award-CSB5vJOb.js"
	},
	"/assets/arrow-up-right-S6Fuokvj.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"9d-J0aSiH39/g7NFkfg9V6HogOLuik\"",
		"mtime": "2026-10-12T16:30:00.807Z",
		"size": 157,
		"path": "../assets/arrow-up-right-S6Fuokvj.js"
	},
	"/assets/building-2-Bb4mGTu1.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"175-liRPwJYKjS0kBgFt1uLacuyNQXs\"",
		"mtime": "2026-10-12T16:30:00.807Z",
		"size": 373,
		"path": "../assets/building-2-Bb4mGTu1.js"
	},
	"/assets/circle-check-big-owxdSTmR.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"b8-g7u6R4o81M59H0yci0fU9xyrc3M\"",
		"mtime": "2026-10-12T16:30:00.808Z",
		"size": 184,
		"path": "../assets/circle-check-big-owxdSTmR.js"
	},
	"/assets/button-CXfHfxb8.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"cede-M7khHSAjhBhwq9aN+QHBpiplHJk\"",
		"mtime": "2026-10-12T16:30:00.807Z",
		"size": 52958,
		"path": "../assets/button-CXfHfxb8.js"
	},
	"/assets/crew.availability-Cvf7njFj.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"7bb3-6wKTYvDrxN2sEsWJSaIHVVl6dPA\"",
		"mtime": "2026-10-12T16:30:00.808Z",
		"size": 31667,
		"path": "../assets/crew.availability-Cvf7njFj.js"
	},
	"/assets/crew.conductors-BI1xJ1Wn.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4c26-DCGGZ9Z41Zggt0FHnfUmtkit3AA\"",
		"mtime": "2026-10-12T16:30:00.808Z",
		"size": 19494,
		"path": "../assets/crew.conductors-BI1xJ1Wn.js"
	},
	"/assets/dialog-DrbRjSbQ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"857-josax8zTWhmqM3TVaC0CqzHbxHg\"",
		"mtime": "2026-10-12T16:30:00.808Z",
		"size": 2135,
		"path": "../assets/dialog-DrbRjSbQ.js"
	},
	"/assets/crew.drivers-DM0QA8lc.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"53a8-IhD4YHZRGHLddgegKHnjtVeGtFY\"",
		"mtime": "2026-10-12T16:30:00.808Z",
		"size": 21416,
		"path": "../assets/crew.drivers-DM0QA8lc.js"
	},
	"/assets/download-BmAFRKXl.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"de-y82RPqFx+iCLzk1bUjicFeStDoY\"",
		"mtime": "2026-10-12T16:30:00.808Z",
		"size": 222,
		"path": "../assets/download-BmAFRKXl.js"
	},
	"/assets/eye-Dz4UL-bh.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"f6-WYQ3XVY3mzuUlTQGh2521kn1/I0\"",
		"mtime": "2026-10-12T16:30:00.808Z",
		"size": 246,
		"path": "../assets/eye-Dz4UL-bh.js"
	},
	"/assets/file-text-BtwQvUmw.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"177-2MMlm69u92ZlmHuCvdmTid7f1K0\"",
		"mtime": "2026-10-12T16:30:00.808Z",
		"size": 375,
		"path": "../assets/file-text-BtwQvUmw.js"
	},
	"/presentation/04-corridor-planner.png": {
		"type": "image/png",
		"etag": "\"20578c-PazHJGbNQ74o5A9dKS0H/V8Lbdc\"",
		"mtime": "2026-10-12T16:30:01.554Z",
		"size": 2119564,
		"path": "../presentation/04-corridor-planner.png"
	},
	"/assets/dist-DGnE9XAm.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"12d9d-sE4e5YRth+a3Kzep8IHHzQWdLNM\"",
		"mtime": "2026-10-12T16:30:00.808Z",
		"size": 77213,
		"path": "../assets/dist-DGnE9XAm.js"
	},
	"/assets/calendar-Dmfy2Olw.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"f7-PkuNTRAiqg30JnlcZMFsKntwKIQ\"",
		"mtime": "2026-10-12T16:30:00.807Z",
		"size": 247,
		"path": "../assets/calendar-Dmfy2Olw.js"
	},
	"/assets/fleet-crew-C_wgLRFz.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"662-OUuVztDHHU6kfyk1kI5rGkpQe5g\"",
		"mtime": "2026-10-12T16:30:00.808Z",
		"size": 1634,
		"path": "../assets/fleet-crew-C_wgLRFz.js"
	},
	"/assets/fleet.buses-CAshV_vf.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"5fed-utjrqFqnmzqO+M+PpQoZiAmHSiQ\"",
		"mtime": "2026-10-12T16:30:00.808Z",
		"size": 24557,
		"path": "../assets/fleet.buses-CAshV_vf.js"
	},
	"/assets/fleet.maintenance-BlMxo0Pf.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2b19-gs/PDodWMGRietXwHcA2mlCE5aw\"",
		"mtime": "2026-10-12T16:30:00.808Z",
		"size": 11033,
		"path": "../assets/fleet.maintenance-BlMxo0Pf.js"
	},
	"/assets/funnel-DkUpEwCy.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"f6-l96V4meGHIboVh5V8ZmP0GxSxOw\"",
		"mtime": "2026-10-12T16:30:00.808Z",
		"size": 246,
		"path": "../assets/funnel-DkUpEwCy.js"
	},
	"/assets/id-card-BSDCGNeE.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"139-HVlL7yJak6J1Ys/KxawT39BWzRs\"",
		"mtime": "2026-10-12T16:30:00.808Z",
		"size": 313,
		"path": "../assets/id-card-BSDCGNeE.js"
	},
	"/assets/index-CQhMNG_w.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"5f1e1-tIFspeJtCwdzTWdEIdZzwXUzapQ\"",
		"mtime": "2026-10-12T16:30:00.807Z",
		"size": 389601,
		"path": "../assets/index-CQhMNG_w.js"
	},
	"/assets/input-CEtagnW5.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"297-fCElo/GEAlyJsxoNzZXZcXWCepc\"",
		"mtime": "2026-10-12T16:30:00.808Z",
		"size": 663,
		"path": "../assets/input-CEtagnW5.js"
	},
	"/assets/label-0JUYHx0u.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2d2-bm8MHFEw15ZPlVoeIiRwLWmJ3MI\"",
		"mtime": "2026-10-12T16:30:00.808Z",
		"size": 722,
		"path": "../assets/label-0JUYHx0u.js"
	},
	"/assets/leaflet-src-Bv4pEK9w.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"24555-aQFz4WCchjSRfh4tCmchvKLXsf4\"",
		"mtime": "2026-10-12T16:30:00.808Z",
		"size": 148821,
		"path": "../assets/leaflet-src-Bv4pEK9w.js"
	},
	"/assets/loader-circle-Coug7qBV.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"86-92PXfSirQWDOYOR/OpBzesBp3Bg\"",
		"mtime": "2026-10-12T16:30:00.808Z",
		"size": 134,
		"path": "../assets/loader-circle-Coug7qBV.js"
	},
	"/assets/login-C30znOMD.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"152c-HJ4x6pUTP4n7J9KZLMWXM8gUyKM\"",
		"mtime": "2026-10-12T16:30:00.808Z",
		"size": 5420,
		"path": "../assets/login-C30znOMD.js"
	},
	"/assets/network.planner-BNMTwhFv.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4392-RoYUNr5/i+wKJqRwdw6XI3ZKEtI\"",
		"mtime": "2026-10-12T16:30:00.809Z",
		"size": 17298,
		"path": "../assets/network.planner-BNMTwhFv.js"
	},
	"/assets/network.routes-Bix110Xw.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"79c7-PTP4N8bcS2g7lm2Lyy+8EoaBmtM\"",
		"mtime": "2026-10-12T16:30:00.809Z",
		"size": 31175,
		"path": "../assets/network.routes-Bix110Xw.js"
	},
	"/assets/not-found-DIgawKw1.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"37-RTB6YH5iXRKeXz1Sn6ZQ+vS0lnc\"",
		"mtime": "2026-10-12T16:30:00.809Z",
		"size": 55,
		"path": "../assets/not-found-DIgawKw1.js"
	},
	"/assets/operations.duties-Bt9INPpx.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"6c4e-rbLURrYyB155G/698CQQs1aEPs4\"",
		"mtime": "2026-10-12T16:30:00.809Z",
		"size": 27726,
		"path": "../assets/operations.duties-Bt9INPpx.js"
	},
	"/assets/operations.incidents-RSkc_Uh_.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"5b8d-VVcZeJ5nMiMKVBsQRLeyOmnNcvE\"",
		"mtime": "2026-10-12T16:30:00.809Z",
		"size": 23437,
		"path": "../assets/operations.incidents-RSkc_Uh_.js"
	},
	"/assets/operations.trips-DTyZEqNd.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3e68-e6Sxfo3fH0DMsE4XK0S4JDB8PZo\"",
		"mtime": "2026-10-12T16:30:00.809Z",
		"size": 15976,
		"path": "../assets/operations.trips-DTyZEqNd.js"
	},
	"/assets/operations.today-CeGWysEY.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3539-y0FmlJTqrtpgZ78gwzh2ikmuo3E\"",
		"mtime": "2026-10-12T16:30:00.809Z",
		"size": 13625,
		"path": "../assets/operations.today-CeGWysEY.js"
	},
	"/assets/pen-BoXSxJ4y.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"e1-qjhONy3W+VMsmpGx6lIVch5nkwI\"",
		"mtime": "2026-10-12T16:30:00.809Z",
		"size": 225,
		"path": "../assets/pen-BoXSxJ4y.js"
	},
	"/assets/plus-C8SME4HA.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8f-5b2KcaLRIBIXxFSbrhn2jSVoTcE\"",
		"mtime": "2026-10-12T16:30:00.809Z",
		"size": 143,
		"path": "../assets/plus-C8SME4HA.js"
	},
	"/assets/privacy-CMdpM_XV.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"25f0-/W33HRRMKArGnWbbYVJerzOHXt0\"",
		"mtime": "2026-10-12T16:30:00.809Z",
		"size": 9712,
		"path": "../assets/privacy-CMdpM_XV.js"
	},
	"/assets/progress-AZ4QGMXr.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"91b-iJzNSdMFJmEhXE1mCds19A/cbVs\"",
		"mtime": "2026-10-12T16:30:00.809Z",
		"size": 2331,
		"path": "../assets/progress-AZ4QGMXr.js"
	},
	"/assets/refresh-cw-BGh8aFXQ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"137-+QAuwpvVWS7XzMvr9cOhuD2Cvsc\"",
		"mtime": "2026-10-12T16:30:00.809Z",
		"size": 311,
		"path": "../assets/refresh-cw-BGh8aFXQ.js"
	},
	"/assets/rescheduling-fns-DEeJyHU1.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"357-KNQ+6vVE7SNTE3JSzEUUvF23p7o\"",
		"mtime": "2026-10-12T16:30:00.809Z",
		"size": 855,
		"path": "../assets/rescheduling-fns-DEeJyHU1.js"
	},
	"/assets/rolldown-runtime-CbXtAM7H.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"24d-+aXgvbJ1Wwcp2A8AXKIBByksYC8\"",
		"mtime": "2026-10-12T16:30:00.809Z",
		"size": 589,
		"path": "../assets/rolldown-runtime-CbXtAM7H.js"
	},
	"/assets/routes-BfFdjVCF.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"5249-fG8frmzdMmzaTMTL06sC9hJJ0UU\"",
		"mtime": "2026-10-12T16:30:00.809Z",
		"size": 21065,
		"path": "../assets/routes-BfFdjVCF.js"
	},
	"/assets/routes-gis-fns-65c3K85f.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"62d-dn644eOor4ATnLFw1C3LYPAK16k\"",
		"mtime": "2026-10-12T16:30:00.809Z",
		"size": 1581,
		"path": "../assets/routes-gis-fns-65c3K85f.js"
	},
	"/assets/save-BORcn7fN.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"13d-okdmOxgiuNe+cSy/A/B4g5VbNf4\"",
		"mtime": "2026-10-12T16:30:00.809Z",
		"size": 317,
		"path": "../assets/save-BORcn7fN.js"
	},
	"/assets/scheduling-fns-UhvdIq79.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"904-QZ05rIB4qcp6nuQk0VwJvp5uN0M\"",
		"mtime": "2026-10-12T16:30:00.809Z",
		"size": 2308,
		"path": "../assets/scheduling-fns-UhvdIq79.js"
	},
	"/assets/select-BVXJFS--.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"5614-ZVXlA5+E4h5+YSzjTBGDcIOkdWQ\"",
		"mtime": "2026-10-12T16:30:00.810Z",
		"size": 22036,
		"path": "../assets/select-BVXJFS--.js"
	},
	"/assets/search-Du3_tFAA.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"a4-jPzD2ERUEUaRFx4r0gDV6eSa5HM\"",
		"mtime": "2026-10-12T16:30:00.810Z",
		"size": 164,
		"path": "../assets/search-Du3_tFAA.js"
	},
	"/assets/scheduling.optimizer-40iL8F9P.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"844a-VKBzEPX28k2g8l5vAjkmGcLFBVk\"",
		"mtime": "2026-10-12T16:30:00.810Z",
		"size": 33866,
		"path": "../assets/scheduling.optimizer-40iL8F9P.js"
	},
	"/assets/settings-Idu_Vj0P.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3883-sqDfOWKPG7EjAcCh+lIXdKDODYk\"",
		"mtime": "2026-10-12T16:30:00.810Z",
		"size": 14467,
		"path": "../assets/settings-Idu_Vj0P.js"
	},
	"/assets/shield-alert-b3umYvbN.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"157-f+TAmOAr5cx8a6Kn7ZVHpErsGvI\"",
		"mtime": "2026-10-12T16:30:00.810Z",
		"size": 343,
		"path": "../assets/shield-alert-b3umYvbN.js"
	},
	"/assets/simulation-iRleFzko.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8642-if7N20ryQ6SVcR9nHZBVVRaFkc4\"",
		"mtime": "2026-10-12T16:30:00.810Z",
		"size": 34370,
		"path": "../assets/simulation-iRleFzko.js"
	},
	"/assets/terms-Ba0JoYnV.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"214d-7aQsCJ/Kw2D4otAcY+6QzivSJTA\"",
		"mtime": "2026-10-12T16:30:00.810Z",
		"size": 8525,
		"path": "../assets/terms-Ba0JoYnV.js"
	},
	"/assets/table-BVIbOMCK.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"696-omAJIrS/Cnv9QX1Xbb4e5ynEhKI\"",
		"mtime": "2026-10-12T16:30:00.810Z",
		"size": 1686,
		"path": "../assets/table-BVIbOMCK.js"
	},
	"/assets/trash-2-BxmcxUpJ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"13e-V5e4WpQ71voC3Av6JIEPALBWKP4\"",
		"mtime": "2026-10-12T16:30:00.810Z",
		"size": 318,
		"path": "../assets/trash-2-BxmcxUpJ.js"
	},
	"/assets/useMutation-vD7lz_z4.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8f3-VwZOyexw1ERxExci7NaYVvyf6z8\"",
		"mtime": "2026-10-12T16:30:00.810Z",
		"size": 2291,
		"path": "../assets/useMutation-vD7lz_z4.js"
	},
	"/assets/trending-up--bLa25g4.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"a5-k3JeAXkqngrYCVYjoYK+nJ6m0XM\"",
		"mtime": "2026-10-12T16:30:00.810Z",
		"size": 165,
		"path": "../assets/trending-up--bLa25g4.js"
	},
	"/assets/useQuery-DHS4OP6s.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"227f-ohf8v1u36XpC/U7KkM2DAn0Va38\"",
		"mtime": "2026-10-12T16:30:00.810Z",
		"size": 8831,
		"path": "../assets/useQuery-DHS4OP6s.js"
	},
	"/assets/useStore-CxBsohbJ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"270c-LceHTIYvE5RJwzU1QbaWlQd8who\"",
		"mtime": "2026-10-12T16:30:00.810Z",
		"size": 9996,
		"path": "../assets/useStore-CxBsohbJ.js"
	},
	"/assets/waypoints-CsXAw_fK.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"268-9SpEHEIB10rpKjpvalXkFeWW+v8\"",
		"mtime": "2026-10-12T16:30:00.810Z",
		"size": 616,
		"path": "../assets/waypoints-CsXAw_fK.js"
	},
	"/assets/zap-CDyuEG6l.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"fc-be/pJafREI5e/UH7PkV9SQcOC0g\"",
		"mtime": "2026-10-12T16:30:00.810Z",
		"size": 252,
		"path": "../assets/zap-CDyuEG6l.js"
	},
	"/assets/styles-CIWsiQZx.css": {
		"type": "text/css; charset=utf-8",
		"etag": "\"283f9-mZ6mmeQUK66cIC38avJcUhx2ICQ\"",
		"mtime": "2026-10-12T16:30:00.810Z",
		"size": 164857,
		"path": "../assets/styles-CIWsiQZx.css"
	}
};
//#endregion
//#region #nitro/virtual/public-assets
var publicAssetBases = {};
function isPublicAssetURL(id = "") {
	if (public_assets_data_default[id]) return true;
	for (const base in publicAssetBases) if (id.startsWith(base)) return true;
	return false;
}
//#endregion
//#region node_modules/nitro/dist/presets/cloudflare/runtime/_module-handler.mjs
function augmentReq(cfReq, ctx) {
	const req = cfReq;
	req.ip = cfReq.headers.get("cf-connecting-ip") || void 0;
	req.runtime ??= { name: "cloudflare" };
	req.runtime.cloudflare = {
		...req.runtime.cloudflare,
		...ctx
	};
	req.waitUntil = ctx.context?.waitUntil.bind(ctx.context);
}
//#endregion
//#region node_modules/nitro/dist/presets/cloudflare/runtime/cloudflare-pages.mjs
var nitroApp = useNitroApp();
var cloudflare_pages_default = {
	async fetch(cfReq, env, context) {
		augmentReq(cfReq, {
			env,
			context
		});
		const url = new URL(cfReq.url);
		if (env.ASSETS && isPublicAssetURL(url.pathname)) return env.ASSETS.fetch(cfReq);
		return nitroApp.fetch(cfReq);
	},
	scheduled(event, env, context) {}
};
//#endregion
export { cloudflare_pages_default as default };
