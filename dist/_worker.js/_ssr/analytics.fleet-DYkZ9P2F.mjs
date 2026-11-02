import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { f as require_jsx_runtime } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { t as Button } from "./button-BnVgmmWP.mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { Dt as ArrowLeft, _t as Bus } from "../_libs/lucide-react.mjs";
import { t as AppShell } from "./app-shell-CxpRo8VR.mjs";
import { a as TableHeader, i as TableHead, n as TableBody, o as TableRow, r as TableCell, t as Table } from "./table-BcOd4hKY.mjs";
import { i as getFleetAnalytics } from "./analytics-fns-BCzaAr19.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-CrkmWf-u.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/analytics.fleet-DYkZ9P2F.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function FleetAnalyticsPage() {
	const [depotFilter, setDepotFilter] = (0, import_react.useState)("all");
	const { data: fleetStats = [], isLoading } = useQuery({
		queryKey: ["fleet-analytics-data", depotFilter],
		queryFn: () => getFleetAnalytics(depotFilter === "all" ? void 0 : { depot: depotFilter })
	});
	const filteredStats = fleetStats.filter((b) => depotFilter === "all" || b.depot === depotFilter);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		title: "Fleet Utilization & Maintenance Analytics",
		subtitle: "Examine operating hours, maintenance timelines, breakdowns, and active utilization per bus.",
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
				className: "panel p-4 flex gap-4 items-end max-w-sm",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-1 flex-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-xs font-semibold text-muted-foreground",
						children: "Filter Depot"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
						value: depotFilter,
						onValueChange: setDepotFilter,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
							className: "bg-background/50 h-9",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: "all",
								children: "All Depots"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: "Central Depot",
								children: "Central Depot"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: "North Depot",
								children: "North Depot"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: "West Depot",
								children: "West Depot"
							})
						] })]
					})]
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "panel p-5 space-y-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
					className: "text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bus, { className: "size-4 text-primary" }), " Active Bus Performance & Utilization Metrics"]
				}), isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "py-20 text-center text-xs text-muted-foreground",
					children: "Loading vehicle utilization..."
				}) : filteredStats.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "py-20 text-center text-xs text-muted-foreground italic",
					children: "No fleet records matching depot filter."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Registration Number" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Depot" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Current Status" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
						className: "text-right",
						children: "Trips Operated"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
						className: "text-right",
						children: "Operating Hours"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
						className: "text-right text-primary font-bold",
						children: "Utilization Rate"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
						className: "text-right",
						children: "Breakdowns Count"
					})
				] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableBody, { children: filteredStats.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
						className: "font-bold text-xs",
						children: b.registrationNumber
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
						className: "text-xs",
						children: b.depot
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
						className: "text-xs uppercase font-mono",
						children: b.status
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
						className: "text-right text-xs font-mono",
						children: b.tripsOperated
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, {
						className: "text-right text-xs font-mono",
						children: [b.operatedHours, " hrs"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, {
						className: "text-right text-xs font-mono font-bold text-primary",
						children: [b.utilizationRate, "%"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
						className: "text-right text-xs font-mono text-destructive",
						children: b.breakdownsCount
					})
				] }, b.busId)) })] })]
			})]
		})
	});
}
//#endregion
export { FleetAnalyticsPage as component };
