import { i as __toESM, n as __exportAll } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { R as redirect, _ as createRootRouteWithContext, b as useRouter, g as createFileRoute, h as lazyRouteComponent, l as Scripts, m as Outlet, p as createRouter, u as HeadContent, v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { f as require_jsx_runtime } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { c as __exportAll$1 } from "./server-CDJaugyn.mjs";
import { n as cn, t as Button } from "./button-BnVgmmWP.mjs";
import { n as getCurrentUserFn, r as loginFn } from "./auth-SlquhadG.mjs";
import { t as hasPermission } from "./auth-shared-CAbXQXMK.mjs";
import { a as dehydrate, o as hydrate, t as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { r as QueryClientProvider } from "../_libs/tanstack__react-query.mjs";
import { n as toast, t as Toaster } from "../_libs/sonner.mjs";
import { E as Radio, F as Map, G as Layers, Tt as ArrowRight, Y as Gauge, _t as Bus, b as Server, c as TriangleAlert, f as Terminal, g as Shield, m as SlidersVertical, pt as Check, rt as Clock, st as CircleCheck, tt as Cpu } from "../_libs/lucide-react.mjs";
import { i as SliderTrack, n as SliderRange, r as SliderThumb, t as Slider$1 } from "../_libs/radix-ui__react-slider.mjs";
import { i as Trigger, n as List, r as Root2, t as Content } from "../_libs/radix-ui__react-tabs.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/router-9Rnl3R3s.js
var router_9Rnl3R3s_exports = /* @__PURE__ */ __exportAll({
	a: () => TabsTrigger,
	getRouter: () => getRouter,
	i: () => TabsList,
	n: () => Tabs,
	o: () => Route$26,
	r: () => TabsContent,
	s: () => Route$27,
	t: () => router_exports
});
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var Toaster$1 = ({ ...props }) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
		className: "toaster group",
		toastOptions: { classNames: {
			toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
			description: "group-[.toast]:text-muted-foreground",
			actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
			cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground"
		} },
		...props
	});
};
var styles_default = "/assets/styles-CIWsiQZx.css";
function reportLovableError(error, context = {}) {
	if (typeof window === "undefined") return;
	window.__lovableEvents?.captureException?.(error, {
		source: "react_error_boundary",
		route: window.location.pathname,
		...context
	}, {
		mechanism: "react_error_boundary",
		handled: false,
		severity: "error"
	});
	const message = error instanceof Response ? `Response ${error.status}${error.url ? ` at ${error.url}` : ""}` : error instanceof Error ? error.message : String(error);
	const stack = error instanceof Error ? error.stack : void 0;
	window.__lovableReportRuntimeError?.({
		message,
		...stack !== void 0 && { stack },
		filename: window.location.pathname
	});
}
function NotFoundComponent() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-7xl font-bold text-foreground",
					children: "404"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-4 text-xl font-semibold text-foreground",
					children: "Page not found"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "The page you're looking for doesn't exist or has been moved."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Go home"
					})
				})
			]
		})
	});
}
function ErrorComponent({ error, reset }) {
	console.error(error);
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		reportLovableError(error, { boundary: "tanstack_root_error_component" });
	}, [error]);
	const isForbidden = error?.message === "Forbidden" || error?.message?.includes("Forbidden");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl",
					children: isForbidden ? "403" : "500"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-4 text-xl font-semibold text-foreground",
					children: isForbidden ? "Access Denied" : "This page didn't load"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: isForbidden ? "You don't have permission to perform this action." : "Something went wrong on our end. You can try refreshing or head back home."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 flex flex-wrap justify-center gap-2",
					children: [!isForbidden ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => {
							router.invalidate();
							reset();
						},
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Try again"
					}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						className: "inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent",
						children: "Go home"
					})]
				})
			]
		})
	});
}
var Route$27 = createRootRouteWithContext()({
	beforeLoad: async ({ location }) => {
		if ([
			"/login",
			"/landing",
			"/privacy",
			"/terms"
		].includes(location.pathname)) try {
			return { user: await getCurrentUserFn() ?? void 0 };
		} catch {
			return { user: void 0 };
		}
		try {
			const user = await getCurrentUserFn();
			if (!user) {
				if (location.pathname === "/") throw redirect({ to: "/landing" });
				throw redirect({
					to: "/login",
					search: { redirect: location.href }
				});
			}
			return { user };
		} catch (err) {
			if (err?.message === "Redirect" || err?.status === 302 || err?.status === 307) throw err;
			if (location.pathname === "/") throw redirect({ to: "/landing" });
			throw redirect({ to: "/login" });
		}
	},
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: "TransitOS: Municipal Transit Scheduling & Fleet Operations" },
			{
				name: "description",
				content: "Operations management platform for municipal transit networks: automated timetable solving, GIS corridor audits, crew duty compliance, and incident recovery."
			},
			{
				name: "author",
				content: "TransitOS"
			},
			{
				property: "og:title",
				content: "TransitOS: Municipal Transit Scheduling & Fleet Operations"
			},
			{
				property: "og:description",
				content: "Operations management platform for municipal transit networks: automated timetable solving, GIS corridor audits, crew duty compliance, and incident recovery."
			},
			{
				property: "og:type",
				content: "website"
			},
			{
				name: "twitter:card",
				content: "summary_large_image"
			},
			{
				name: "twitter:title",
				content: "TransitOS: Municipal Transit Scheduling & Fleet Operations"
			},
			{
				name: "twitter:description",
				content: "Operations management platform for municipal transit networks: automated timetable solving, GIS corridor audits, crew duty compliance, and incident recovery."
			},
			{
				property: "og:image",
				content: "/logo.svg"
			},
			{
				name: "twitter:image",
				content: "/logo.svg"
			}
		],
		links: [
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "icon",
				href: "/favicon.svg",
				type: "image/svg+xml"
			},
			{
				rel: "alternate icon",
				href: "/favicon.ico",
				type: "image/x-icon"
			},
			{
				rel: "apple-touch-icon",
				href: "/logo.svg"
			},
			{
				rel: "manifest",
				href: "/site.webmanifest"
			},
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
			}
		]
	}),
	shellComponent: RootShell,
	component: RootComponent,
	notFoundComponent: NotFoundComponent,
	errorComponent: ErrorComponent
});
function RootShell({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})] })]
	});
}
function RootComponent() {
	const { queryClient } = Route$27.useRouteContext();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(QueryClientProvider, {
		client: queryClient,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster$1, {
			position: "top-right",
			richColors: true
		})]
	});
}
var $$splitComponentImporter$24 = () => import("./routes-BhaFZZbf.mjs");
var Route$26 = createFileRoute("/")({
	head: () => ({ meta: [
		{ title: "TransitOS Dashboard: Salem Transport Corporation" },
		{
			name: "description",
			content: "Operations overview for Salem City corridors: fleet, crew, routes and automated schedule generation."
		},
		{
			property: "og:title",
			content: "TransitOS Dashboard: Salem Transport Corporation"
		},
		{
			property: "og:description",
			content: "Operations overview for Salem City corridors: fleet, crew, routes and automated schedule generation."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$24, "component")
});
var $$splitComponentImporter$23 = () => import("./analytics-DXJ8CDhA.mjs");
var Route$25 = createFileRoute("/analytics")({
	beforeLoad: ({ context }) => {
		if (!context.user || !hasPermission(context.user.role, "analytics.view")) throw new Error("Forbidden");
	},
	head: () => ({ meta: [
		{ title: "Analytics: TransitOS" },
		{
			name: "description",
			content: "Punctuality, utilisation and disruption analytics."
		},
		{
			property: "og:title",
			content: "Analytics: TransitOS"
		},
		{
			property: "og:description",
			content: "Punctuality, utilisation and disruption analytics."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$23, "component")
});
var Card = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	ref,
	className: cn("rounded-xl border bg-card text-card-foreground shadow", className),
	...props
}));
Card.displayName = "Card";
var CardHeader = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	ref,
	className: cn("flex flex-col space-y-1.5 p-6", className),
	...props
}));
CardHeader.displayName = "CardHeader";
var CardTitle = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	ref,
	className: cn("font-semibold leading-none tracking-tight", className),
	...props
}));
CardTitle.displayName = "CardTitle";
var CardDescription = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	ref,
	className: cn("text-sm text-muted-foreground", className),
	...props
}));
CardDescription.displayName = "CardDescription";
var CardContent = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	ref,
	className: cn("p-6 pt-0", className),
	...props
}));
CardContent.displayName = "CardContent";
var CardFooter = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	ref,
	className: cn("flex items-center p-6 pt-0", className),
	...props
}));
CardFooter.displayName = "CardFooter";
var Slider = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Slider$1, {
	ref,
	className: cn("relative flex w-full touch-none select-none items-center", className),
	...props,
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderTrack, {
		className: "relative h-1.5 w-full grow overflow-hidden rounded-full bg-primary/20",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderRange, { className: "absolute h-full bg-primary" })
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderThumb, { className: "block h-4 w-4 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50" })]
}));
Slider.displayName = Slider$1.displayName;
var Tabs = Root2;
var TabsList = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(List, {
	ref,
	className: cn("inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground", className),
	...props
}));
TabsList.displayName = List.displayName;
var TabsTrigger = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trigger, {
	ref,
	className: cn("inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow", className),
	...props
}));
TabsTrigger.displayName = Trigger.displayName;
var TabsContent = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Content, {
	ref,
	className: cn("mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", className),
	...props
}));
TabsContent.displayName = Content.displayName;
var Route$24 = createFileRoute("/landing")({
	beforeLoad: async () => {
		try {
			return { user: await getCurrentUserFn() ?? void 0 };
		} catch {
			return { user: void 0 };
		}
	},
	head: () => ({ meta: [
		{ title: "TransitOS: Automated Bus Timetable & Crew Duty Scheduling System" },
		{
			name: "description",
			content: "Operations management platform for municipal transit networks: automated timetable solving, GIS corridor audits, crew duty compliance, and incident recovery."
		},
		{
			property: "og:title",
			content: "TransitOS: Automated Bus Timetable & Crew Duty Scheduling System"
		},
		{
			property: "og:description",
			content: "Operations management platform for municipal transit networks: automated timetable solving, GIS corridor audits, crew duty compliance, and incident recovery."
		}
	] }),
	component: LandingPage
});
var DEMO_ACCOUNTS = [
	{
		role: "System Admin",
		email: "admin@salemtransport.demo",
		depot: "Central Operations",
		description: "Multi-tenant tenant management, role configurations, and system-wide audit logs."
	},
	{
		role: "Chief Scheduler",
		email: "scheduler@salemtransport.demo",
		depot: "Meyyanur Depot",
		description: "Automated duty generation, OR-Tools timetable optimizer, and crew rosters."
	},
	{
		role: "Depot Manager",
		email: "depot@salemtransport.demo",
		depot: "Meyyanur Depot",
		description: "Vehicle bays, bus maintenance schedules, and standby unit dispatching."
	},
	{
		role: "Route Planner",
		email: "planner@salemtransport.demo",
		depot: "Network GIS Cell",
		description: "Corridor geometry, stop headway audits, and GeoJSON overlap detection."
	}
];
function LandingPage() {
	const router = useRouter();
	const currentUser = Route$24.useRouteContext()?.user;
	const [loggingIn, setLoggingIn] = (0, import_react.useState)(false);
	const [selectedDemoEmail, setSelectedDemoEmail] = (0, import_react.useState)(DEMO_ACCOUNTS[0].email);
	const [fleetSize, setFleetSize] = (0, import_react.useState)([45]);
	const [dailyTripsPerBus, setDailyTripsPerBus] = (0, import_react.useState)([8]);
	const [fuelCostPerKm, setFuelCostPerKm] = (0, import_react.useState)([75]);
	const [solverRunning, setSolverRunning] = (0, import_react.useState)(false);
	const [solverResult, setSolverResult] = (0, import_react.useState)({
		solved: false,
		tripsPaired: 40,
		deadheadSavedKm: 184,
		runtimeMs: 418,
		violationCount: 0,
		deadheadReductionPct: "32.0%"
	});
	const [disruptionState, setDisruptionState] = (0, import_react.useState)("normal");
	const [selectedRecoveryOption, setSelectedRecoveryOption] = (0, import_react.useState)("A");
	const handleQuickLogin = async (email) => {
		setLoggingIn(true);
		try {
			const res = await loginFn({ data: {
				email,
				password: "password123"
			} });
			if (res.success) {
				toast.success(`Signed in as ${res.user.name || "Authorized Operator"}`);
				await router.invalidate();
				await router.navigate({ to: "/" });
			} else {
				toast.error("Sign in failed. Redirecting to login page.");
				await router.navigate({ to: "/login" });
			}
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Sign in failed. Redirecting to login page.";
			toast.error(msg);
			await router.navigate({ to: "/login" });
		} finally {
			setLoggingIn(false);
		}
	};
	const runSimulatedSolver = () => {
		setSolverRunning(true);
		setTimeout(() => {
			setSolverRunning(false);
			setSolverResult({
				solved: true,
				tripsPaired: 40,
				deadheadSavedKm: 216,
				runtimeMs: 382,
				violationCount: 0,
				deadheadReductionPct: "34.5%"
			});
			toast.success("OR-Tools Solver completed in 382ms: 40/40 duty shifts assigned with zero constraint violations.");
		}, 1e3);
	};
	const busCount = fleetSize[0];
	const tripsCount = dailyTripsPerBus[0];
	const costPerKm = fuelCostPerKm[0];
	const annualTrips = busCount * tripsCount * 365;
	const deadheadKmSavedAnnual = Math.round(annualTrips * 1.85);
	const annualCostSavings = Math.round(deadheadKmSavedAnnual * costPerKm);
	const dispatcherHoursSaved = Math.round(busCount * 28.5);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 font-sans",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "border-b border-slate-200 bg-slate-900 text-slate-200 px-4 py-2 text-xs",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex max-w-7xl items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-mono font-semibold text-blue-400",
								children: "TransitOS Production Release"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-slate-400 hidden sm:inline",
								children: "|"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-slate-300 hidden sm:inline",
								children: "Seeded operational dataset: Salem Transport Corporation (24 buses, 48 crew, 8 corridors)."
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-4 text-slate-400",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/privacy",
							className: "hover:text-white transition-colors",
							children: "Privacy Policy"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/terms",
							className: "hover:text-white transition-colors",
							children: "Terms & Conditions"
						})]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
				className: "sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/landing",
							className: "flex items-center gap-2.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex size-9 items-center justify-center rounded-md bg-slate-900 text-white dark:bg-blue-600",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bus, { className: "size-5" })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-col",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-lg font-bold tracking-tight text-slate-900 dark:text-white leading-tight",
									children: "TransitOS"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[10px] font-mono uppercase tracking-wider text-slate-500",
									children: "Transit Operations System"
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
							className: "hidden lg:flex items-center gap-7 text-xs font-semibold text-slate-600 dark:text-slate-300",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
									href: "#features",
									className: "hover:text-slate-900 dark:hover:text-white transition-colors",
									children: "Core Capabilities"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
									href: "#interactive-demo",
									className: "hover:text-slate-900 dark:hover:text-white transition-colors",
									children: "System Demonstration"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
									href: "#estimator",
									className: "hover:text-slate-900 dark:hover:text-white transition-colors",
									children: "Operational Estimator"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
									href: "#benchmark",
									className: "hover:text-slate-900 dark:hover:text-white transition-colors",
									children: "Salem Benchmark"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
									href: "#architecture",
									className: "hover:text-slate-900 dark:hover:text-white transition-colors",
									children: "Technical Architecture"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
									href: "#domains",
									className: "hover:text-slate-900 dark:hover:text-white transition-colors",
									children: "Custom Domains"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
									href: "#pricing",
									className: "hover:text-slate-900 dark:hover:text-white transition-colors",
									children: "Deployment Tiers"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex items-center gap-3",
							children: currentUser ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								asChild: true,
								size: "sm",
								className: "rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
									to: "/",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gauge, { className: "mr-1.5 size-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Operations Console" })]
								})
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								asChild: true,
								variant: "outline",
								size: "sm",
								className: "rounded-md font-medium text-xs",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/login",
									children: "Sign In"
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								size: "sm",
								onClick: () => handleQuickLogin("admin@salemtransport.demo"),
								disabled: loggingIn,
								className: "rounded-md bg-slate-900 hover:bg-slate-800 text-white dark:bg-blue-600 dark:hover:bg-blue-700 font-medium text-xs cursor-pointer",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Server, { className: "mr-1.5 size-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Launch Live Demo" })]
							})] })
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "border-b border-slate-200 bg-white py-16 sm:py-24 dark:border-slate-800 dark:bg-slate-900",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-1 lg:grid-cols-12 gap-12 items-center",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "lg:col-span-7 space-y-6",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "inline-flex items-center gap-2 rounded border border-slate-300 bg-slate-100 px-2.5 py-1 text-xs font-mono font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Enterprise Transit Software" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-slate-400",
											children: "|"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Version 2.4" })
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
									className: "text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]",
									children: "Automated Bus Timetable and Crew Duty Scheduling System"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-base text-slate-600 dark:text-slate-400 leading-relaxed",
									children: "TransitOS is a multi-tenant operations platform designed for municipal bus undertakings. It formulates vehicle-crew duty pairings using mathematical constraint optimization, audits route overlap geometry, and provides real-time disruption recovery workflows under statutory Motor Vehicle Act labor limits."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-wrap items-center gap-3 pt-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											size: "default",
											onClick: () => handleQuickLogin("admin@salemtransport.demo"),
											disabled: loggingIn,
											className: "rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-5 h-10 cursor-pointer",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Server, { className: "mr-2 size-4" }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Access Demo System (Org Admin)" }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "ml-2 size-4" })
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											asChild: true,
											variant: "outline",
											size: "default",
											className: "rounded-md text-xs font-semibold px-5 h-10",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
												to: "/simulation",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Radio, { className: "mr-2 size-4 text-blue-600 dark:text-blue-400" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Open Route Simulator" })]
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											asChild: true,
											variant: "outline",
											size: "default",
											className: "rounded-md text-xs font-semibold px-4 h-10",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
												href: "#interactive-demo",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SlidersVertical, { className: "mr-2 size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Interactive Solver" })]
											})
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-200 dark:border-slate-800 text-xs",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-semibold text-slate-900 dark:text-white",
											children: "Optimization Engine:"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-slate-500 font-mono",
											children: "Google OR-Tools MILP"
										})] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-semibold text-slate-900 dark:text-white",
											children: "Regulatory Ceiling:"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-slate-500 font-mono",
											children: "Motor Vehicle Act 1988"
										})] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-semibold text-slate-900 dark:text-white",
											children: "Database Isolation:"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-slate-500 font-mono",
											children: "PostgreSQL Row Bounds"
										})] })
									]
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "lg:col-span-5",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-lg border border-slate-300 bg-slate-950 p-5 text-slate-200 shadow-sm font-mono text-xs space-y-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between border-b border-slate-800 pb-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Terminal, { className: "size-4 text-slate-400" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "font-bold text-slate-200",
												children: "SALEM DISPATCH CONTROLLER"
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[11px] font-semibold text-emerald-400",
											children: "TELEMETRY CONNECTED"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-2 gap-3 text-slate-300",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "rounded border border-slate-800 bg-slate-900 p-2.5",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "text-[10px] text-slate-400 uppercase",
														children: "Registered Fleet"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "text-lg font-bold text-white mt-0.5",
														children: "24 Buses"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "text-[10px] text-slate-400",
														children: "18 In-service, 6 Maintenance/Standby"
													})
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "rounded border border-slate-800 bg-slate-900 p-2.5",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "text-[10px] text-slate-400 uppercase",
														children: "Certified Crew"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "text-lg font-bold text-white mt-0.5",
														children: "48 Personnel"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "text-[10px] text-slate-400",
														children: "24 Drivers, 24 Conductors"
													})
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "rounded border border-slate-800 bg-slate-900 p-2.5",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "text-[10px] text-slate-400 uppercase",
														children: "Monitored Corridors"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "text-lg font-bold text-white mt-0.5",
														children: "8 Lines"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "text-[10px] text-slate-400",
														children: "54 Bus Stops Mapped"
													})
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "rounded border border-slate-800 bg-slate-900 p-2.5",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "text-[10px] text-slate-400 uppercase",
														children: "Scheduled Departures"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "text-lg font-bold text-white mt-0.5",
														children: "40 Trips/Day"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "text-[10px] text-slate-400",
														children: "06:00 to 22:30 Service Window"
													})
												]
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "border-t border-slate-800 pt-3 space-y-1.5 text-[11px] text-slate-400",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "flex items-start gap-1.5",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-slate-500",
													children: "[08:14:10]"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-slate-300",
													children: "Solver batch #9042 converged in 418ms: 40/40 duty shifts assigned."
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "flex items-start gap-1.5",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-slate-500",
													children: "[08:14:25]"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-slate-300",
													children: "Vehicle TN-27-N-4012 (Corridor 1A) departed Old Bus Stand (+12s variance)."
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "flex items-start gap-1.5",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-slate-500",
													children: "[08:14:42]"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-slate-300",
													children: "Standby bus SB-04 fueled and positioned at Meyyanur Depot Bay 2."
												})]
											})
										]
									})
								]
							})
						})]
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				id: "interactive-demo",
				className: "py-16 sm:py-24 border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-950",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "max-w-3xl space-y-2 mb-10",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-xs font-mono font-bold uppercase text-slate-500",
								children: "Live Browser Demonstration"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white",
								children: "System Demonstration: Core Computational Engines"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-slate-600 dark:text-slate-400",
								children: "Test the mathematical duty solver, disruption recovery radar, corridor overlap verification, and statutory rest rule auditing using the live modules below."
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "max-w-5xl",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
							defaultValue: "solver",
							className: "w-full",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, {
									className: "grid grid-cols-2 md:grid-cols-4 h-auto p-1 rounded-md bg-white border border-slate-300 dark:bg-slate-900 dark:border-slate-800 mb-6",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
											value: "solver",
											className: "rounded py-2 text-xs font-semibold",
											children: "Duty Pairing Solver"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
											value: "disruption",
											className: "rounded py-2 text-xs font-semibold",
											children: "Disruption Radar"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
											value: "gis",
											className: "rounded py-2 text-xs font-semibold",
											children: "Corridor Overlap Audit"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
											value: "labor",
											className: "rounded py-2 text-xs font-semibold",
											children: "Labor Law Compliance"
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
									value: "solver",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
										className: "rounded-md border-slate-300 dark:border-slate-800 shadow-none bg-white dark:bg-slate-900",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, {
											className: "border-b border-slate-200 dark:border-slate-800 pb-4",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
													className: "text-base font-bold text-slate-900 dark:text-white",
													children: "Mixed-Integer Linear Programming Duty Solver"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, {
													className: "text-xs mt-1",
													children: "Calculates optimal vehicle and crew pairings while strictly enforcing Motor Vehicle Act continuous driving ceilings (<= 4.5 hours) and minimizing empty deadhead kilometers."
												})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
													onClick: runSimulatedSolver,
													disabled: solverRunning,
													className: "rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shrink-0 cursor-pointer",
													children: solverRunning ? "Solving Model..." : "Execute OR-Tools Solver"
												})]
											})
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
											className: "p-6 space-y-6",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "grid grid-cols-2 md:grid-cols-4 gap-3 text-xs",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "rounded border border-slate-200 dark:border-slate-800 p-3 bg-slate-50 dark:bg-slate-950",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "font-mono text-slate-500 uppercase text-[10px]",
																children: "Trips Assigned"
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "text-xl font-bold text-slate-900 dark:text-white mt-1",
																children: [solverResult.tripsPaired, " / 40"]
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold",
																children: "100% paired"
															})
														]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "rounded border border-slate-200 dark:border-slate-800 p-3 bg-slate-50 dark:bg-slate-950",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "font-mono text-slate-500 uppercase text-[10px]",
																children: "Deadhead Saved"
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "text-xl font-bold text-slate-900 dark:text-white mt-1",
																children: [solverResult.deadheadSavedKm, " km"]
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																className: "text-[10px] text-slate-500",
																children: [solverResult.deadheadReductionPct, " vs unlinked"]
															})
														]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "rounded border border-slate-200 dark:border-slate-800 p-3 bg-slate-50 dark:bg-slate-950",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "font-mono text-slate-500 uppercase text-[10px]",
																children: "Labor Violations"
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
																className: "text-xl font-bold text-slate-900 dark:text-white mt-1",
																children: solverResult.violationCount
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold",
																children: "Zero violations"
															})
														]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "rounded border border-slate-200 dark:border-slate-800 p-3 bg-slate-50 dark:bg-slate-950",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "font-mono text-slate-500 uppercase text-[10px]",
																children: "Solver Execution"
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "text-xl font-bold text-slate-900 dark:text-white mt-1",
																children: [solverResult.runtimeMs, " ms"]
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "text-[10px] text-slate-500",
																children: "Meyyanur Depot model"
															})
														]
													})
												]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "rounded border border-slate-200 dark:border-slate-800 overflow-hidden text-xs",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "bg-slate-100 dark:bg-slate-800 px-4 py-2 font-mono font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800",
													children: "SAMPLE GENERATED DUTY SHIFTS: SALEM MEYYANUR DEPOT"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "divide-y divide-slate-200 dark:divide-slate-800",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "p-3 grid grid-cols-1 sm:grid-cols-4 gap-2 items-center bg-white dark:bg-slate-900",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "font-bold text-slate-900 dark:text-white",
																children: "Duty DT-101 (Peak Morning)"
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
																className: "text-[10px] text-slate-500",
																children: "Bus: TN-27-N-4012 (Corridor 1A)"
															})] }),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "text-slate-700 dark:text-slate-300",
																children: "06:00 to 14:00 (8h 00m)"
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
																className: "text-[10px] text-slate-500",
																children: "Drive: 6h 40m | Rest: 1h 20m"
															})] }),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "text-slate-700 dark:text-slate-300",
																children: "Driver: K. Raja (DRV-001)"
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
																className: "text-[10px] text-slate-500",
																children: "Conductor: M. Selvam"
															})] }),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
																className: "sm:text-right",
																children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																	className: "inline-block rounded border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
																	children: "MVA Compliant"
																})
															})
														]
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "p-3 grid grid-cols-1 sm:grid-cols-4 gap-2 items-center bg-white dark:bg-slate-900",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "font-bold text-slate-900 dark:text-white",
																children: "Duty DT-102 (Corridor 4B)"
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
																className: "text-[10px] text-slate-500",
																children: "Bus: TN-27-N-4015"
															})] }),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "text-slate-700 dark:text-slate-300",
																children: "06:30 to 14:30 (8h 00m)"
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
																className: "text-[10px] text-slate-500",
																children: "Drive: 6h 50m | Rest: 1h 10m"
															})] }),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "text-slate-700 dark:text-slate-300",
																children: "Driver: S. Murugan (DRV-002)"
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
																className: "text-[10px] text-slate-500",
																children: "Conductor: P. Ganesan"
															})] }),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
																className: "sm:text-right",
																children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																	className: "inline-block rounded border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
																	children: "MVA Compliant"
																})
															})
														]
													})]
												})]
											})]
										})]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
									value: "disruption",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
										className: "rounded-md border-slate-300 dark:border-slate-800 shadow-none bg-white dark:bg-slate-900",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, {
											className: "border-b border-slate-200 dark:border-slate-800 pb-4",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
													className: "text-base font-bold text-slate-900 dark:text-white",
													children: "Disruption Radar: Real-Time Incident Mitigation"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, {
													className: "text-xs mt-1",
													children: "When a mechanical failure occurs, the engine maps the delay cascade across linked duties and presents structured recovery options."
												})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex gap-2",
													children: [disruptionState === "normal" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
														size: "sm",
														variant: "destructive",
														onClick: () => {
															setDisruptionState("breakdown");
															toast.error("Simulated breakdown logged: Bus TN-27-N-4018 coolant leak at Five Roads Junction.");
														},
														className: "rounded-md text-xs font-semibold cursor-pointer",
														children: "Simulate Vehicle Breakdown"
													}), disruptionState !== "normal" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
														size: "sm",
														variant: "outline",
														onClick: () => {
															setDisruptionState("normal");
															toast.info("Network reset to normal timetable.");
														},
														className: "rounded-md text-xs font-semibold",
														children: "Reset State"
													})]
												})]
											})
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
											className: "p-6 space-y-6",
											children: [
												disruptionState === "normal" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "rounded border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center space-y-2",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "size-6 text-emerald-600 mx-auto" }),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
															className: "text-sm font-bold text-slate-900 dark:text-white",
															children: "All Corridors Operating to Timetable"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
															className: "text-xs text-slate-500 max-w-md mx-auto",
															children: "Click \"Simulate Vehicle Breakdown\" above to trigger an incident and review the automated recovery options."
														})
													]
												}),
												disruptionState === "breakdown" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "space-y-4",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "rounded border border-rose-300 bg-rose-50 p-4 text-xs dark:border-rose-900/50 dark:bg-rose-950/30",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "font-bold text-rose-800 dark:text-rose-300",
															children: "INCIDENT REPORT: BUS TN-27-N-4018 DISABLED"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
															className: "mt-1 text-slate-700 dark:text-slate-300",
															children: [
																"Location: Five Roads Junction. Corridor 2B. Projected downstream delay cascade: ",
																/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "42 minutes" }),
																" across 3 return departures."
															]
														})]
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "space-y-2",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "text-xs font-mono font-bold uppercase text-slate-500",
																children: "GENERATED RECOVERY OPTIONS:"
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "grid grid-cols-1 md:grid-cols-3 gap-3",
																children: [
																	/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																		onClick: () => setSelectedRecoveryOption("A"),
																		className: `rounded border p-3.5 cursor-pointer text-xs transition-colors ${selectedRecoveryOption === "A" ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 dark:border-blue-500" : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"}`,
																		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																			className: "flex items-center justify-between mb-1",
																			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																				className: "font-bold text-slate-900 dark:text-white",
																				children: "Option A (Recommended)"
																			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																				className: "font-mono text-emerald-600 font-bold",
																				children: "96% Recovery"
																			})]
																		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
																			className: "text-slate-600 dark:text-slate-400",
																			children: "Deploy Standby Bus SB-04 from Meyyanur Depot (6 minutes away). Transfer crew upon arrival."
																		})]
																	}),
																	/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																		onClick: () => setSelectedRecoveryOption("B"),
																		className: `rounded border p-3.5 cursor-pointer text-xs transition-colors ${selectedRecoveryOption === "B" ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 dark:border-blue-500" : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"}`,
																		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																			className: "flex items-center justify-between mb-1",
																			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																				className: "font-bold text-slate-900 dark:text-white",
																				children: "Option B"
																			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																				className: "font-mono text-slate-500 font-bold",
																				children: "78% Recovery"
																			})]
																		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
																			className: "text-slate-600 dark:text-slate-400",
																			children: "Short-turn at Five Roads loop: cancel remaining outbound stops and turn bus into return trip."
																		})]
																	}),
																	/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																		onClick: () => setSelectedRecoveryOption("C"),
																		className: `rounded border p-3.5 cursor-pointer text-xs transition-colors ${selectedRecoveryOption === "C" ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 dark:border-blue-500" : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"}`,
																		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																			className: "flex items-center justify-between mb-1",
																			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																				className: "font-bold text-slate-900 dark:text-white",
																				children: "Option C"
																			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																				className: "font-mono text-slate-500 font-bold",
																				children: "64% Recovery"
																			})]
																		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
																			className: "text-slate-600 dark:text-slate-400",
																			children: "Adjust corridor headway: advance adjacent vehicle TN-27-N-4022 by 3 minutes to bridge headway."
																		})]
																	})
																]
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
																className: "pt-2 flex justify-end",
																children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
																	onClick: () => {
																		setDisruptionState("resolved");
																		toast.success(`Option ${selectedRecoveryOption} committed to dispatch boards.`);
																	},
																	className: "rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer",
																	children: ["Commit and Publish Option ", selectedRecoveryOption]
																})
															})
														]
													})]
												}),
												disruptionState === "resolved" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "rounded border border-emerald-300 bg-emerald-50 p-6 text-xs text-center space-y-2 dark:border-emerald-900/50 dark:bg-emerald-950/30",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "size-6 text-emerald-600 mx-auto" }),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h4", {
															className: "font-bold text-slate-900 dark:text-white",
															children: [
																"Option ",
																selectedRecoveryOption,
																" Successfully Executed"
															]
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
															className: "text-slate-600 dark:text-slate-400 max-w-md mx-auto",
															children: "Instructions dispatched to driver terminal and Meyyanur depot board. Downstream passenger delay mitigated from 42 minutes to under 3 minutes."
														})
													]
												})
											]
										})]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
									value: "gis",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
										className: "rounded-md border-slate-300 dark:border-slate-800 shadow-none bg-white dark:bg-slate-900",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, {
											className: "border-b border-slate-200 dark:border-slate-800 pb-4",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
												className: "text-base font-bold text-slate-900 dark:text-white",
												children: "GIS Route Geometry and Corridor Headway Audits"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, {
												className: "text-xs mt-1",
												children: "Maps stop coordinates to detect route duplication, headway bunching, and redundant deadhead routing across urban corridors."
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
											className: "p-6 space-y-4 text-xs",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "rounded border border-slate-200 dark:border-slate-800 overflow-hidden",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "bg-slate-100 dark:bg-slate-800 px-4 py-2 font-mono font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800",
													children: "SALEM URBAN NETWORK CORRIDOR AUDIT DATA"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "divide-y divide-slate-200 dark:divide-slate-800",
													children: [
														{
															id: "Corridor 1A",
															route: "Salem Old Bus Stand to Omalur Junction",
															stops: 18,
															headway: "8 mins",
															overlap: "4.2%",
															status: "Optimal"
														},
														{
															id: "Corridor 2B",
															route: "Salem Junction Railway to Hasthampatti",
															stops: 12,
															headway: "6 mins",
															overlap: "5.1%",
															status: "Synchronized"
														},
														{
															id: "Corridor 3C",
															route: "Meyyanur Depot to Shevapet Market",
															stops: 14,
															headway: "10 mins",
															overlap: "2.8%",
															status: "Optimal"
														}
													].map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "p-3 grid grid-cols-1 sm:grid-cols-4 gap-2 items-center bg-white dark:bg-slate-900",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "font-bold text-slate-900 dark:text-white",
																children: c.id
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "text-slate-600 dark:text-slate-400",
																children: c.route
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																className: "text-slate-600 dark:text-slate-400",
																children: [
																	c.stops,
																	" stops | Headway ",
																	c.headway
																]
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
																className: "sm:text-right",
																children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																	className: "inline-block rounded border border-slate-300 bg-slate-100 px-2 py-0.5 text-[10px] font-mono font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
																	children: ["Overlap: ", c.overlap]
																})
															})
														]
													}, c.id))
												})]
											})
										})]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
									value: "labor",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
										className: "rounded-md border-slate-300 dark:border-slate-800 shadow-none bg-white dark:bg-slate-900",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, {
											className: "border-b border-slate-200 dark:border-slate-800 pb-4",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
												className: "text-base font-bold text-slate-900 dark:text-white",
												children: "Motor Vehicle Act 1988 Labor Guardrails"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, {
												className: "text-xs mt-1",
												children: "Statutory constraint validation applied to every driver and conductor shift before timetable publication."
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
											className: "p-6",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "rounded border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-950",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "font-semibold text-slate-900 dark:text-white block mb-1",
																children: "Continuous Driving Limit"
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
																className: "text-xl font-bold font-mono text-slate-900 dark:text-white",
																children: "<= 4.5 Hours"
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
																className: "text-slate-500 mt-1 text-[11px]",
																children: "Mandatory minimum 30-minute rest break required prior to subsequent driving segment."
															})
														]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "rounded border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-950",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "font-semibold text-slate-900 dark:text-white block mb-1",
																children: "Inter-Shift Daily Rest"
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
																className: "text-xl font-bold font-mono text-slate-900 dark:text-white",
																children: ">= 12.0 Hours"
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
																className: "text-slate-500 mt-1 text-[11px]",
																children: "Guaranteed mandatory rest window between duty conclusion and next shift pull-out."
															})
														]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "rounded border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-950",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "font-semibold text-slate-900 dark:text-white block mb-1",
																children: "Weekly Driving Ceiling"
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
																className: "text-xl font-bold font-mono text-slate-900 dark:text-white",
																children: "<= 48.0 Hours"
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
																className: "text-slate-500 mt-1 text-[11px]",
																children: "Weekly hours ceiling strictly enforced to prevent fatigue and overtime violations."
															})
														]
													})
												]
											})
										})]
									})
								})
							]
						})
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				id: "estimator",
				className: "py-16 sm:py-24 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "max-w-3xl space-y-2 mb-12",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-xs font-mono font-bold uppercase text-slate-500",
								children: "Fleet Operations Model"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white",
								children: "Operational Efficiency Estimator"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-slate-600 dark:text-slate-400",
								children: "Calculate projected deadhead mileage reductions and scheduling hours saved based on your authority fleet parameters."
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "max-w-5xl rounded-md border border-slate-300 dark:border-slate-800 p-6 sm:p-8 bg-slate-50 dark:bg-slate-950",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-1 lg:grid-cols-12 gap-8 items-center",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "lg:col-span-7 space-y-6",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-2",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex justify-between text-xs font-semibold",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Active Buses in Network:" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "font-mono text-blue-600 dark:text-blue-400",
													children: [busCount, " Buses"]
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
												value: fleetSize,
												onValueChange: setFleetSize,
												min: 10,
												max: 250,
												step: 5
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex justify-between text-[10px] font-mono text-slate-400",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "10 Buses" }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "120 Buses" }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "250 Buses" })
												]
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-2",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex justify-between text-xs font-semibold",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Daily Departures per Bus:" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "font-mono text-blue-600 dark:text-blue-400",
													children: [tripsCount, " Departures/Day"]
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
												value: dailyTripsPerBus,
												onValueChange: setDailyTripsPerBus,
												min: 4,
												max: 16,
												step: 1
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex justify-between text-[10px] font-mono text-slate-400",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "4 Departures" }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "8 Departures" }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "16 Departures" })
												]
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-2",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex justify-between text-xs font-semibold",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Operating Cost per Kilometer:" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "font-mono text-blue-600 dark:text-blue-400",
													children: [
														"₹",
														costPerKm.toFixed(0),
														" / km"
													]
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
												value: fuelCostPerKm,
												onValueChange: setFuelCostPerKm,
												min: 40,
												max: 150,
												step: 5
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex justify-between text-[10px] font-mono text-slate-400",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "₹40 / km" }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "₹95 / km" }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "₹150 / km" })
												]
											})
										]
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "lg:col-span-5 rounded border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 text-xs",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[10px] font-mono uppercase text-slate-500",
											children: "PROJECTED DEADHEAD COST RECOVERY"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "text-3xl font-bold font-mono text-slate-900 dark:text-white mt-1",
											children: [
												"₹",
												annualCostSavings.toLocaleString("en-IN"),
												" / year"
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-slate-500 text-[11px] mt-0.5",
											children: "Calculated from 1.85 km average deadhead reduction per scheduled duty."
										})
									] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "border-t border-slate-200 dark:border-slate-800 pt-3 space-y-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex justify-between",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-slate-500",
												children: "Deadhead Kilometers Eliminated:"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "font-mono font-semibold text-slate-900 dark:text-white",
												children: [deadheadKmSavedAnnual.toLocaleString(), " km/yr"]
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex justify-between",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-slate-500",
												children: "Scheduler Time Recovered:"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "font-mono font-semibold text-slate-900 dark:text-white",
												children: [dispatcherHoursSaved.toLocaleString(), " hrs/yr"]
											})]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										onClick: () => handleQuickLogin("admin@salemtransport.demo"),
										disabled: loggingIn,
										className: "w-full rounded-md bg-slate-900 hover:bg-slate-800 text-white dark:bg-blue-600 dark:hover:bg-blue-700 text-xs font-semibold h-9 cursor-pointer",
										children: "Verify Model Against Depot Data"
									})
								]
							})]
						})
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				id: "features",
				className: "py-16 sm:py-24 border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-950",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "max-w-3xl space-y-2 mb-12",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-xs font-mono font-bold uppercase text-slate-500",
								children: "Platform Specifications"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white",
								children: "Core Capabilities for Transit Authorities"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-slate-600 dark:text-slate-400",
								children: "Designed specifically for municipal depot operations, regulatory audits, and live dispatch control rooms."
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-md border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cpu, { className: "size-5 text-slate-800 dark:text-blue-400" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "font-bold text-sm text-slate-900 dark:text-white",
										children: "1. Constraint Solver Engine"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-slate-600 dark:text-slate-400 leading-relaxed",
										children: "Mixed-Integer Linear Programming solver using Google OR-Tools. Simultaneously solves vehicle duty links, depot pull-outs, and driver rest constraints."
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-md border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Map, { className: "size-5 text-slate-800 dark:text-blue-400" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "font-bold text-sm text-slate-900 dark:text-white",
										children: "2. GIS Geometry and Overlap Audits"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-slate-600 dark:text-slate-400 leading-relaxed",
										children: "Leaflet GeoJSON coordinate mapping for all bus stops and corridors. Detects corridor redundancy and prevents headway bunching between parallel routes."
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-md border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "size-5 text-slate-800 dark:text-blue-400" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "font-bold text-sm text-slate-900 dark:text-white",
										children: "3. Disruption Recovery Radar"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-slate-600 dark:text-slate-400 leading-relaxed",
										children: "Maps delay propagation across linked duty shifts during vehicle breakdown and calculates structured recovery options in under 420 milliseconds."
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-md border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shield, { className: "size-5 text-slate-800 dark:text-blue-400" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "font-bold text-sm text-slate-900 dark:text-white",
										children: "4. Motor Vehicle Act Compliance"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-slate-600 dark:text-slate-400 leading-relaxed",
										children: "Automated guardrails enforce statutory rest limits: max 4.5 continuous driving hours, min 30 min breaks, and 12-hour mandatory inter-shift rest periods."
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-md border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "size-5 text-slate-800 dark:text-blue-400" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "font-bold text-sm text-slate-900 dark:text-white",
										children: "5. Plan vs. Actual Variance Engine"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-slate-600 dark:text-slate-400 leading-relaxed",
										children: "Compares published timetables with GPS departures. Tracks on-time rates within a 5-minute tolerance window with exportable audit logs."
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-md border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Layers, { className: "size-5 text-slate-800 dark:text-blue-400" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "font-bold text-sm text-slate-900 dark:text-white",
										children: "6. Multi-Tenant Enterprise Isolation"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-slate-600 dark:text-slate-400 leading-relaxed",
										children: "Strict row-level multi-tenancy enforced at the database level. HTTP-only signed JWT sessions, role-based access control, and tenant data isolation."
									})
								]
							})
						]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				id: "benchmark",
				className: "py-16 sm:py-24 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "max-w-3xl space-y-2 mb-10",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-xs font-mono font-bold uppercase text-slate-500",
								children: "Production Benchmark"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white",
								children: "Salem Transport Corporation Operational Metrics"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-slate-600 dark:text-slate-400",
								children: "Operational benchmark comparing manual dispatch spreadsheets with the TransitOS solver across 8 urban corridors in Salem."
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "max-w-5xl rounded-md border border-slate-300 dark:border-slate-800 overflow-hidden text-xs",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-4 bg-slate-100 dark:bg-slate-800 p-3 font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: "Metric" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: "Manual Spreadsheet Dispatch" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: "TransitOS Solver" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: "Operational Variance" })
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "divide-y divide-slate-200 dark:divide-slate-800",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-4 p-3 bg-white dark:bg-slate-900",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-medium text-slate-900 dark:text-white",
											children: "Roster Generation Time"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-slate-500",
											children: "14 hours / week"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-mono text-emerald-600 dark:text-emerald-400 font-semibold",
											children: "418 milliseconds"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-slate-700 dark:text-slate-300 font-semibold",
											children: "-99.9% labor time"
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-4 p-3 bg-white dark:bg-slate-900",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-medium text-slate-900 dark:text-white",
											children: "Average Daily Deadhead"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-slate-500",
											children: "575 km / day"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-mono text-emerald-600 dark:text-emerald-400 font-semibold",
											children: "391 km / day"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-slate-700 dark:text-slate-300 font-semibold",
											children: "-32.0% deadhead"
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-4 p-3 bg-white dark:bg-slate-900",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-medium text-slate-900 dark:text-white",
											children: "Shift Rest Violations"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-slate-500",
											children: "18 violations / week"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-mono text-emerald-600 dark:text-emerald-400 font-semibold",
											children: "0 violations"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-slate-700 dark:text-slate-300 font-semibold",
											children: "100% MVA compliance"
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-4 p-3 bg-white dark:bg-slate-900",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-medium text-slate-900 dark:text-white",
											children: "Breakdown Recovery Time"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-slate-500",
											children: "45 minutes average"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-mono text-emerald-600 dark:text-emerald-400 font-semibold",
											children: "< 90 seconds"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-slate-700 dark:text-slate-300 font-semibold",
											children: "Algorithmic contingency"
										})
									]
								})
							]
						})]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				id: "domains",
				className: "py-16 sm:py-24 border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-950",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "max-w-3xl space-y-2 mb-10",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-xs font-mono font-bold uppercase text-slate-500",
								children: "Enterprise Infrastructure"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white",
								children: "Custom Domain Connection and Production Deployment"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-slate-600 dark:text-slate-400",
								children: "TransitOS supports binding your authority custom domain (e.g., transit.salem.gov or dispatch.citytransit.org) with automated TLS/SSL certificate issuance."
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "max-w-5xl rounded-md border border-slate-300 dark:border-slate-800 p-6 bg-white dark:bg-slate-900 space-y-6 text-xs",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-1 md:grid-cols-3 gap-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "rounded border border-slate-200 dark:border-slate-800 p-4 space-y-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-bold text-slate-900 dark:text-white block",
										children: "Step 1: Point DNS Record"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-slate-600 dark:text-slate-400",
										children: [
											"Add a CNAME record pointing your desired subdomain to",
											" ",
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
												className: "font-mono text-slate-800 dark:text-slate-200",
												children: "cname.transitos.internal"
											}),
											"."
										]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "rounded border border-slate-200 dark:border-slate-800 p-4 space-y-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-bold text-slate-900 dark:text-white block",
										children: "Step 2: Automated TLS 1.3"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-slate-600 dark:text-slate-400",
										children: "Edge routing verifies domain ownership and automatically provisions a Let's Encrypt TLS certificate within 60 seconds."
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "rounded border border-slate-200 dark:border-slate-800 p-4 space-y-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-bold text-slate-900 dark:text-white block",
										children: "Step 3: Tenant Boundary Lock"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-slate-600 dark:text-slate-400",
										children: "Requests arriving on your custom domain are bound exclusively to your corporation tenant identifier in the database."
									})]
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded border border-slate-200 dark:border-slate-800 bg-slate-950 p-4 font-mono text-slate-300 text-xs space-y-1",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-slate-500",
									children: "# Standard DNS Configuration for Municipal Authority"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: "Type: CNAME" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: "Host: dispatch.salemtransport.gov.in" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: "Value: edge.transitos.internal" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: "TTL: 300 seconds (Automatic SSL verification)" })
							]
						})]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				id: "architecture",
				className: "py-16 sm:py-24 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "max-w-3xl space-y-2 mb-10",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-xs font-mono font-bold uppercase text-slate-500",
								children: "Engineering Specifications"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white",
								children: "Full-Stack System Architecture"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-slate-600 dark:text-slate-400",
								children: "Built on React 19, TanStack Start, PostgreSQL with Drizzle ORM, Leaflet GIS, and Edge-ready Nitro runtime."
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl text-xs",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-md border border-slate-300 dark:border-slate-800 p-4 space-y-2 bg-slate-50 dark:bg-slate-950",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-bold text-slate-900 dark:text-white block",
									children: "Frontend Runtime"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-slate-600 dark:text-slate-400",
									children: "React 19 with TanStack Start SSR and TanStack Router for type-safe route trees."
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-md border border-slate-300 dark:border-slate-800 p-4 space-y-2 bg-slate-50 dark:bg-slate-950",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-bold text-slate-900 dark:text-white block",
									children: "PostgreSQL and Drizzle ORM"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-slate-600 dark:text-slate-400",
									children: "Multi-tenant isolated tables with migration history and relational query constraints."
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-md border border-slate-300 dark:border-slate-800 p-4 space-y-2 bg-slate-50 dark:bg-slate-950",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-bold text-slate-900 dark:text-white block",
									children: "Mathematical Solver"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-slate-600 dark:text-slate-400",
									children: "Google OR-Tools solver wrapper handling continuous driving constraints and vehicle linkage."
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-md border border-slate-300 dark:border-slate-800 p-4 space-y-2 bg-slate-50 dark:bg-slate-950",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-bold text-slate-900 dark:text-white block",
									children: "GIS Mapping Engine"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-slate-600 dark:text-slate-400",
									children: "Leaflet GeoJSON coordinate mapping for stop locations, route lines, and headway corridors."
								})]
							})
						]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				id: "pricing",
				className: "py-16 sm:py-24 border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-950",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "max-w-3xl space-y-2 mb-10",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-xs font-mono font-bold uppercase text-slate-500",
								children: "Subscription Tiers"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white",
								children: "Transit Authority Licensing Tiers"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-slate-600 dark:text-slate-400",
								children: "Structured tiers for standalone bus depots, city transit undertakings, and state-wide operations."
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-md border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4 text-xs flex flex-col justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-3",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-bold uppercase tracking-wider text-slate-500 block",
											children: "Depot Starter"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-2xl font-bold text-slate-900 dark:text-white",
											children: "₹75,000 / month"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-slate-600 dark:text-slate-400",
											children: "Single bus depot operations up to 30 active vehicles."
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center gap-2 text-slate-700 dark:text-slate-300",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-3.5 text-slate-700 dark:text-slate-300 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Up to 30 buses & 60 certified crew" })]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center gap-2 text-slate-700 dark:text-slate-300",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-3.5 text-slate-700 dark:text-slate-300 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Timetable and Duty Builder" })]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center gap-2 text-slate-700 dark:text-slate-300",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-3.5 text-slate-700 dark:text-slate-300 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Motor Vehicle Act Rest Auditing" })]
												})
											]
										})
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									asChild: true,
									variant: "outline",
									className: "w-full rounded-md text-xs font-semibold",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
										to: "/login",
										children: "Start Depot Evaluation"
									})
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-md border-2 border-blue-600 bg-white dark:bg-slate-900 p-6 space-y-4 text-xs flex flex-col justify-between relative shadow-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-3",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block",
											children: "Metropolitan Authority"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-2xl font-bold text-slate-900 dark:text-white",
											children: "₹1,95,000 / month"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-slate-600 dark:text-slate-400",
											children: "City transport undertakings managing multiple depots."
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center gap-2 text-slate-700 dark:text-slate-300",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-3.5 text-blue-600 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Up to 250 buses across 5 depots" })]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center gap-2 text-slate-700 dark:text-slate-300",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-3.5 text-blue-600 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Full Google OR-Tools AI Solver" })]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center gap-2 text-slate-700 dark:text-slate-300",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-3.5 text-blue-600 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Live Disruption Radar (3-Option Recovery)" })]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center gap-2 text-slate-700 dark:text-slate-300",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-3.5 text-blue-600 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Custom Domain Binding (transit.city.gov)" })]
												})
											]
										})
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									onClick: () => handleQuickLogin("admin@salemtransport.demo"),
									disabled: loggingIn,
									className: "w-full rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer",
									children: "Access Metropolitan Live Demo"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-md border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4 text-xs flex flex-col justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-3",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-bold uppercase tracking-wider text-slate-500 block",
											children: "State Undertaking"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-2xl font-bold text-slate-900 dark:text-white",
											children: "Custom Procurement"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-slate-600 dark:text-slate-400",
											children: "Large-scale state transport corporations with thousands of buses."
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center gap-2 text-slate-700 dark:text-slate-300",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-3.5 text-slate-700 dark:text-slate-300 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Unlimited buses, depots, and corridors" })]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center gap-2 text-slate-700 dark:text-slate-300",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-3.5 text-slate-700 dark:text-slate-300 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Custom Telematics and GPS Protocol Integration" })]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center gap-2 text-slate-700 dark:text-slate-300",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-3.5 text-slate-700 dark:text-slate-300 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "99.9% SLA & Dedicated Deployment Engineer" })]
												})
											]
										})
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									asChild: true,
									variant: "outline",
									className: "w-full rounded-md text-xs font-semibold",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
										to: "/login",
										children: "Contact Government Procurement"
									})
								})]
							})
						]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "py-16 sm:py-24 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-8",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2 text-center max-w-2xl mx-auto",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white",
								children: "Authorized Demo Access"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs sm:text-sm text-slate-600 dark:text-slate-400",
								children: "Select an operational role below to sign in directly with pre-seeded Salem Transport Corporation credentials:"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs",
							children: DEMO_ACCOUNTS.map((acc) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								onClick: () => setSelectedDemoEmail(acc.email),
								className: `rounded-md border p-4 cursor-pointer transition-colors ${selectedDemoEmail === acc.email ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 dark:border-blue-500" : "border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"}`,
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between mb-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-bold text-slate-900 dark:text-white",
											children: acc.role
										}), selectedDemoEmail === acc.email && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "size-4 text-blue-600" })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "font-mono text-[10px] text-blue-600 dark:text-blue-400 truncate mb-1",
										children: acc.email
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-slate-500 line-clamp-2 text-[11px]",
										children: acc.description
									})
								]
							}, acc.email))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex justify-center gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								size: "default",
								onClick: () => handleQuickLogin(selectedDemoEmail),
								disabled: loggingIn,
								className: "rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-6 h-10 cursor-pointer",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Server, { className: "mr-2 size-4" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Sign In as Selected Role" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "ml-2 size-4" })
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								asChild: true,
								variant: "outline",
								size: "default",
								className: "rounded-md text-xs font-semibold px-5 h-10",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/login",
									children: "Standard Login Page"
								})
							})]
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("footer", {
				className: "border-t border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-950 py-12 text-xs text-slate-600 dark:text-slate-400",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2.5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex size-7 items-center justify-center rounded bg-slate-900 text-white dark:bg-blue-600",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bus, { className: "size-4" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-bold text-slate-900 dark:text-white text-sm",
									children: "TransitOS Platform"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-slate-400",
									children: "|"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-slate-500",
									children: "Municipal Transit Scheduling and Fleet Operations"
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-4 text-xs font-medium",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/privacy",
									className: "hover:text-slate-900 dark:hover:text-white transition-colors",
									children: "Privacy Policy"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/terms",
									className: "hover:text-slate-900 dark:hover:text-white transition-colors",
									children: "Terms and Conditions"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/login",
									className: "hover:text-slate-900 dark:hover:text-white transition-colors",
									children: "Operator Sign In"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/simulation",
									className: "hover:text-slate-900 dark:hover:text-white transition-colors",
									children: "Route Simulator"
								})
							]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: "© 2026 TransitOS. Licensed for municipal transit authorities and licensed bus operators." }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: "Custom domain deployment ready: TLS 1.3 encrypted, multi-tenant database isolation." })]
					})]
				})
			})
		]
	});
}
var $$splitComponentImporter$22 = () => import("./login-B3sVsgzK.mjs");
var Route$23 = createFileRoute("/login")({
	beforeLoad: async () => {
		try {
			if (await getCurrentUserFn()) throw redirect({ to: "/" });
		} catch (err) {
			if (err?.message === "Redirect" || err?.status === 302 || err?.status === 307) throw err;
		}
	},
	head: () => ({ meta: [{ title: "Sign In: TransitOS" }, {
		name: "description",
		content: "Sign in to your TransitOS account."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$22, "component")
});
var $$splitComponentImporter$21 = () => import("./privacy-DRXIhTix.mjs");
var Route$22 = createFileRoute("/privacy")({
	head: () => ({ meta: [
		{ title: "Privacy Policy: TransitOS Platform" },
		{
			name: "description",
			content: "Privacy policy and data protection standards for TransitOS municipal transit management software."
		},
		{
			property: "og:title",
			content: "Privacy Policy: TransitOS Platform"
		},
		{
			property: "og:description",
			content: "Privacy policy and data protection standards for TransitOS municipal transit management software."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$21, "component")
});
var $$splitComponentImporter$20 = () => import("./settings-yQ1BPbhP.mjs");
var Route$21 = createFileRoute("/settings")({
	beforeLoad: ({ context }) => {
		if (!context.user || !hasPermission(context.user.role, "organization.view")) throw new Error("Forbidden");
	},
	head: () => ({ meta: [{ title: "System & Depot Settings: TransitOS" }, {
		name: "description",
		content: "Depot rules, labor compliance limits and optimizer solver weights."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$20, "component")
});
var $$splitComponentImporter$19 = () => import("./simulation-D5Er2doB.mjs");
var Route$20 = createFileRoute("/simulation")({
	head: () => ({ meta: [{ title: "Interactive Transit Simulator: TransitOS" }, {
		name: "description",
		content: "Interactive day-in-the-life simulation of Salem City transit operations, fleet movement, and AI auto-recovery."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$19, "component")
});
var $$splitComponentImporter$18 = () => import("./terms-UEv4qRyz.mjs");
var Route$19 = createFileRoute("/terms")({
	head: () => ({ meta: [
		{ title: "Terms and Conditions: TransitOS Platform" },
		{
			name: "description",
			content: "Enterprise master service agreement, licensing terms, and operational warranties for TransitOS."
		},
		{
			property: "og:title",
			content: "Terms and Conditions: TransitOS Platform"
		},
		{
			property: "og:description",
			content: "Enterprise master service agreement, licensing terms, and operational warranties for TransitOS."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$18, "component")
});
var $$splitComponentImporter$17 = () => import("./analytics.index-Mjo8EvO7.mjs");
var Route$18 = createFileRoute("/analytics/")({
	beforeLoad: ({ context }) => {
		if (!context.user || !hasPermission(context.user.role, "analytics.view")) throw new Error("Forbidden");
	},
	head: () => ({ meta: [{ title: "Operations Intelligence & Analytics: TransitOS" }, {
		name: "description",
		content: "Operational analytics dashboard for fleet utilization, schedule compliance, and disruption containment."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$17, "component")
});
var $$splitComponentImporter$16 = () => import("./analytics.crew-ZoqwVff9.mjs");
var Route$17 = createFileRoute("/analytics/crew")({ component: lazyRouteComponent($$splitComponentImporter$16, "component") });
var $$splitComponentImporter$15 = () => import("./analytics.fleet-DYkZ9P2F.mjs");
var Route$16 = createFileRoute("/analytics/fleet")({ component: lazyRouteComponent($$splitComponentImporter$15, "component") });
var $$splitComponentImporter$14 = () => import("./analytics.incidents-B7c_L8O7.mjs");
var Route$15 = createFileRoute("/analytics/incidents")({ component: lazyRouteComponent($$splitComponentImporter$14, "component") });
var $$splitComponentImporter$13 = () => import("./analytics.plan-vs-actual-BylqyfXI.mjs");
var Route$14 = createFileRoute("/analytics/plan-vs-actual")({ component: lazyRouteComponent($$splitComponentImporter$13, "component") });
var $$splitComponentImporter$12 = () => import("./analytics.routes-DMJYyYKa.mjs");
var Route$13 = createFileRoute("/analytics/routes")({ component: lazyRouteComponent($$splitComponentImporter$12, "component") });
var $$splitComponentImporter$11 = () => import("./crew.availability-CMjiIpck.mjs");
var Route$12 = createFileRoute("/crew/availability")({
	beforeLoad: ({ context }) => {
		if (!context.user || !hasPermission(context.user.role, "crew.view")) throw new Error("Forbidden");
	},
	head: () => ({ meta: [{ title: "Crew Availability Matrix: TransitOS" }, {
		name: "description",
		content: "Visual crew availability, shift waves and rest timelines."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$11, "component")
});
var $$splitComponentImporter$10 = () => import("./crew.conductors-B_BCSeFw.mjs");
var Route$11 = createFileRoute("/crew/conductors")({
	beforeLoad: ({ context }) => {
		if (!context.user || !hasPermission(context.user.role, "crew.view")) throw new Error("Forbidden");
	},
	head: () => ({ meta: [{ title: "Conductor Roster & Profile: TransitOS" }, {
		name: "description",
		content: "Conductor rosters, ticketing machine registers and availability."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$10, "component")
});
var $$splitComponentImporter$9 = () => import("./crew.drivers-sUbBrLgz.mjs");
var Route$10 = createFileRoute("/crew/drivers")({
	beforeLoad: ({ context }) => {
		if (!context.user || !hasPermission(context.user.role, "crew.view")) throw new Error("Forbidden");
	},
	head: () => ({ meta: [{ title: "Driver Roster & Profile: TransitOS" }, {
		name: "description",
		content: "Driver registry, HPV licensing compliance, availability timeline and shift logs."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$9, "component")
});
var $$splitComponentImporter$8 = () => import("./fleet.buses-BhByNnwk.mjs");
var Route$9 = createFileRoute("/fleet/buses")({
	beforeLoad: ({ context }) => {
		if (!context.user || !hasPermission(context.user.role, "fleet.view")) throw new Error("Forbidden");
	},
	head: () => ({ meta: [{ title: "Fleet Management: TransitOS" }, {
		name: "description",
		content: "Fleet register, availability and depot allocation."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$8, "component")
});
var $$splitComponentImporter$7 = () => import("./fleet.maintenance-Dp11Q6r3.mjs");
var Route$8 = createFileRoute("/fleet/maintenance")({
	beforeLoad: ({ context }) => {
		if (!context.user || !hasPermission(context.user.role, "fleet.view")) throw new Error("Forbidden");
	},
	head: () => ({ meta: [{ title: "Fleet Maintenance Bays: TransitOS" }, {
		name: "description",
		content: "Scheduled servicing, docking bay tracking and defect remediation."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
var $$splitComponentImporter$6 = () => import("./network.planner-BtHD5IXg.mjs");
var Route$7 = createFileRoute("/network/planner")({
	beforeLoad: ({ context }) => {
		if (!context.user || !hasPermission(context.user.role, "routes.manage")) throw new Error("Forbidden");
	},
	head: () => ({ meta: [{ title: "Route Planner: TransitOS" }, {
		name: "description",
		content: "Design new Salem corridors, draw points and analyze overlap."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
var $$splitComponentImporter$5 = () => import("./network.routes-BkNvtFE2.mjs");
var Route$6 = createFileRoute("/network/routes")({
	beforeLoad: ({ context }) => {
		if (!context.user || !hasPermission(context.user.role, "routes.view")) throw new Error("Forbidden");
	},
	head: () => ({ meta: [{ title: "Route Network: TransitOS" }, {
		name: "description",
		content: "Explore Salem corridors, stop sequence coordinates and overlap."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
var $$splitComponentImporter$4 = () => import("./operations.duties-l1GW7uEg.mjs");
var Route$5 = createFileRoute("/operations/duties")({
	beforeLoad: ({ context }) => {
		if (!context.user || !hasPermission(context.user.role, "schedule.view")) throw new Error("Forbidden");
	},
	head: () => ({ meta: [{ title: "Duty Builder & Editor: TransitOS" }, {
		name: "description",
		content: "Assemble, validate, and dispatch vehicle duties and crew shifts."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
var $$splitComponentImporter$3 = () => import("./operations.incidents-Cw-hIwM2.mjs");
var Route$4 = createFileRoute("/operations/incidents")({
	beforeLoad: ({ context }) => {
		if (!context.user || !hasPermission(context.user.role, "schedule.view")) throw new Error("Forbidden");
	},
	head: () => ({ meta: [{ title: "Disruption Recovery Manager: TransitOS" }, {
		name: "description",
		content: "Track live operational incidents, analyze impacts, and apply re-optimized recovery schedules."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
var $$splitComponentImporter$2 = () => import("./operations.today-D7_w4y4h.mjs");
var Route$3 = createFileRoute("/operations/today")({
	beforeLoad: ({ context }) => {
		if (!context.user || !hasPermission(context.user.role, "schedule.view")) throw new Error("Forbidden");
	},
	head: () => ({ meta: [{ title: "Today's Operations: TransitOS" }, {
		name: "description",
		content: "Live operational duty board, fleet telemetry, and dispatch monitoring."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
var $$splitComponentImporter$1 = () => import("./operations.trips-CHz9RI_v.mjs");
var Route$2 = createFileRoute("/operations/trips")({
	beforeLoad: ({ context }) => {
		if (!context.user || !hasPermission(context.user.role, "schedule.view")) throw new Error("Forbidden");
	},
	head: () => ({ meta: [{ title: "Trip Management: TransitOS" }, {
		name: "description",
		content: "Timetable registers and frequency-based generators."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
var $$splitComponentImporter = () => import("./scheduling.optimizer-jWFr8Pp0.mjs");
var Route$1 = createFileRoute("/scheduling/optimizer")({
	beforeLoad: ({ context }) => {
		if (!context.user || !hasPermission(context.user.role, "schedule.view")) throw new Error("Forbidden");
	},
	head: () => ({ meta: [{ title: "Schedule Optimizer: TransitOS" }, {
		name: "description",
		content: "Generate, validate, and publish optimized bus and crew duties with automated constraint satisfaction."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
var IndexRoute = Route$26.update({
	id: "/",
	path: "/",
	getParentRoute: () => Route$27
});
var AnalyticsRoute = Route$25.update({
	id: "/analytics",
	path: "/analytics",
	getParentRoute: () => Route$27
});
var LandingRoute = Route$24.update({
	id: "/landing",
	path: "/landing",
	getParentRoute: () => Route$27
});
var LoginRoute = Route$23.update({
	id: "/login",
	path: "/login",
	getParentRoute: () => Route$27
});
var PrivacyRoute = Route$22.update({
	id: "/privacy",
	path: "/privacy",
	getParentRoute: () => Route$27
});
var SettingsRoute = Route$21.update({
	id: "/settings",
	path: "/settings",
	getParentRoute: () => Route$27
});
var SimulationRoute = Route$20.update({
	id: "/simulation",
	path: "/simulation",
	getParentRoute: () => Route$27
});
var TermsRoute = Route$19.update({
	id: "/terms",
	path: "/terms",
	getParentRoute: () => Route$27
});
var AnalyticsIndexRoute = Route$18.update({
	id: "/",
	path: "/",
	getParentRoute: () => AnalyticsRoute
});
var AnalyticsCrewRoute = Route$17.update({
	id: "/crew",
	path: "/crew",
	getParentRoute: () => AnalyticsRoute
});
var AnalyticsFleetRoute = Route$16.update({
	id: "/fleet",
	path: "/fleet",
	getParentRoute: () => AnalyticsRoute
});
var AnalyticsIncidentsRoute = Route$15.update({
	id: "/incidents",
	path: "/incidents",
	getParentRoute: () => AnalyticsRoute
});
var AnalyticsPlanVsActualRoute = Route$14.update({
	id: "/plan-vs-actual",
	path: "/plan-vs-actual",
	getParentRoute: () => AnalyticsRoute
});
var AnalyticsRoutesRoute = Route$13.update({
	id: "/routes",
	path: "/routes",
	getParentRoute: () => AnalyticsRoute
});
var CrewAvailabilityRoute = Route$12.update({
	id: "/crew/availability",
	path: "/crew/availability",
	getParentRoute: () => Route$27
});
var CrewConductorsRoute = Route$11.update({
	id: "/crew/conductors",
	path: "/crew/conductors",
	getParentRoute: () => Route$27
});
var CrewDriversRoute = Route$10.update({
	id: "/crew/drivers",
	path: "/crew/drivers",
	getParentRoute: () => Route$27
});
var FleetBusesRoute = Route$9.update({
	id: "/fleet/buses",
	path: "/fleet/buses",
	getParentRoute: () => Route$27
});
var FleetMaintenanceRoute = Route$8.update({
	id: "/fleet/maintenance",
	path: "/fleet/maintenance",
	getParentRoute: () => Route$27
});
var NetworkPlannerRoute = Route$7.update({
	id: "/network/planner",
	path: "/network/planner",
	getParentRoute: () => Route$27
});
var NetworkRoutesRoute = Route$6.update({
	id: "/network/routes",
	path: "/network/routes",
	getParentRoute: () => Route$27
});
var OperationsDutiesRoute = Route$5.update({
	id: "/operations/duties",
	path: "/operations/duties",
	getParentRoute: () => Route$27
});
var OperationsIncidentsRoute = Route$4.update({
	id: "/operations/incidents",
	path: "/operations/incidents",
	getParentRoute: () => Route$27
});
var OperationsTodayRoute = Route$3.update({
	id: "/operations/today",
	path: "/operations/today",
	getParentRoute: () => Route$27
});
var OperationsTripsRoute = Route$2.update({
	id: "/operations/trips",
	path: "/operations/trips",
	getParentRoute: () => Route$27
});
var SchedulingOptimizerRoute = Route$1.update({
	id: "/scheduling/optimizer",
	path: "/scheduling/optimizer",
	getParentRoute: () => Route$27
});
var AnalyticsRouteChildren = {
	AnalyticsCrewRoute,
	AnalyticsFleetRoute,
	AnalyticsIncidentsRoute,
	AnalyticsPlanVsActualRoute,
	AnalyticsRoutesRoute,
	AnalyticsIndexRoute
};
var rootRouteChildren = {
	IndexRoute,
	AnalyticsRoute: AnalyticsRoute._addFileChildren(AnalyticsRouteChildren),
	LandingRoute,
	LoginRoute,
	PrivacyRoute,
	SettingsRoute,
	SimulationRoute,
	TermsRoute,
	CrewAvailabilityRoute,
	CrewConductorsRoute,
	CrewDriversRoute,
	FleetBusesRoute,
	FleetMaintenanceRoute,
	NetworkPlannerRoute,
	NetworkRoutesRoute,
	OperationsDutiesRoute,
	OperationsIncidentsRoute,
	OperationsTodayRoute,
	OperationsTripsRoute,
	SchedulingOptimizerRoute
};
var routeTree = Route$27._addFileChildren(rootRouteChildren)._addFileTypes();
var router_exports = /* @__PURE__ */ __exportAll$1({ getRouter: () => getRouter });
var getRouter = () => {
	const queryClient = new QueryClient();
	return createRouter({
		routeTree,
		context: { queryClient },
		scrollRestoration: true,
		defaultPreloadStaleTime: 0,
		dehydrate: () => {
			return { queryClientState: dehydrate(queryClient) };
		},
		hydrate: (dehydrated) => {
			hydrate(queryClient, dehydrated.queryClientState);
		}
	});
};
//#endregion
export { TabsList as a, TabsContent as i, Route$27 as n, TabsTrigger as o, Tabs as r, router_9Rnl3R3s_exports as s, Route$26 as t };
