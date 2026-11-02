import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { f as require_jsx_runtime } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { t as Button } from "./button-BnVgmmWP.mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { Dt as ArrowLeft, nt as Compass } from "../_libs/lucide-react.mjs";
import { t as AppShell } from "./app-shell-CxpRo8VR.mjs";
import { a as TableHeader, i as TableHead, n as TableBody, o as TableRow, r as TableCell, t as Table } from "./table-BcOd4hKY.mjs";
import { l as getRouteAnalytics } from "./analytics-fns-BCzaAr19.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-CrkmWf-u.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/analytics.routes-DMJYyYKa.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function RoutesAnalyticsPage() {
	const [serviceDate, setServiceDate] = (0, import_react.useState)("25 Aug 2026");
	const [rankingFilter, setRankingFilter] = (0, import_react.useState)("default");
	const { data: routeStats = [], isLoading } = useQuery({
		queryKey: ["route-analytics-data", serviceDate],
		queryFn: () => getRouteAnalytics({ serviceDate })
	});
	const getSortedRoutes = () => {
		const list = [...routeStats];
		switch (rankingFilter) {
			case "most-reliable": return list.sort((a, b) => b.onTimeRate - a.onTimeRate);
			case "least-reliable": return list.sort((a, b) => a.onTimeRate - b.onTimeRate);
			case "most-delayed": return list.sort((a, b) => b.averageDelay - a.averageDelay);
			case "most-cancelled": return list.sort((a, b) => b.tripsCancelled - a.tripsCancelled);
			default: return list;
		}
	};
	const sortedList = getSortedRoutes();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		title: "Route Analytics & Performance",
		subtitle: "Examine operational service quality, completion rates, and delay trends per route corridor.",
		actions: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex items-center gap-2",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				asChild: true,
				variant: "outline",
				size: "sm",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/analytics",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "mr-2 size-3.5" }), " Back"]
				})
			})
		}),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "panel p-4 flex gap-4 items-end max-w-md",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-1 flex-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-xs font-semibold text-muted-foreground",
						children: "Rank By Performance"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
						value: rankingFilter,
						onValueChange: setRankingFilter,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
							className: "bg-background/50 h-9",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: "default",
								children: "Default Sort"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: "most-reliable",
								children: "Most Reliable (On-Time %)"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: "least-reliable",
								children: "Least Reliable (On-Time %)"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: "most-delayed",
								children: "Most Delayed (Avg Delay)"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: "most-cancelled",
								children: "Most Cancelled"
							})
						] })]
					})]
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "panel p-5 space-y-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
					className: "text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Compass, { className: "size-4 text-primary" }), " Corridor Reliability Matrix"]
				}), isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "py-20 text-center text-xs text-muted-foreground",
					children: "Loading route metrics..."
				}) : sortedList.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "py-20 text-center text-xs text-muted-foreground italic",
					children: "No route statistics for the selected service date."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Route Code" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Route Name" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
						className: "text-right",
						children: "Trips Scheduled"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
						className: "text-right",
						children: "Completed"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
						className: "text-right",
						children: "Cancelled"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
						className: "text-right",
						children: "Completion %"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
						className: "text-right text-primary font-bold",
						children: "On-Time %"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
						className: "text-right",
						children: "Avg Delay"
					})
				] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableBody, { children: sortedList.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
						className: "font-bold text-xs",
						children: r.routeCode
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
						className: "text-xs",
						children: r.routeName
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
						className: "text-right text-xs font-mono",
						children: r.tripsScheduled
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
						className: "text-right text-xs font-mono text-success",
						children: r.tripsCompleted
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
						className: "text-right text-xs font-mono text-destructive",
						children: r.tripsCancelled
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, {
						className: "text-right text-xs font-mono",
						children: [r.completionRate, "%"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, {
						className: "text-right text-xs font-mono font-bold text-primary",
						children: [r.onTimeRate, "%"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, {
						className: "text-right text-xs font-mono",
						children: [r.averageDelay, " mins"]
					})
				] }, r.routeId)) })] })]
			})]
		})
	});
}
//#endregion
export { RoutesAnalyticsPage as component };
