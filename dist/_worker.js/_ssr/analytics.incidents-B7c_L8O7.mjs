import { v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { f as require_jsx_runtime } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { t as Button } from "./button-BnVgmmWP.mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { Dt as ArrowLeft, c as TriangleAlert } from "../_libs/lucide-react.mjs";
import { t as AppShell } from "./app-shell-CxpRo8VR.mjs";
import { a as TableHeader, i as TableHead, n as TableBody, o as TableRow, r as TableCell, t as Table } from "./table-BcOd4hKY.mjs";
import { a as getIncidentAnalytics, c as getRecoveryAnalytics } from "./analytics-fns-BCzaAr19.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/analytics.incidents-B7c_L8O7.js
var import_jsx_runtime = require_jsx_runtime();
function IncidentsAnalyticsPage() {
	const { data: incidentStats = {}, isLoading: statsLoading } = useQuery({
		queryKey: ["incidents-analytics-details"],
		queryFn: () => getIncidentAnalytics()
	});
	const { data: recoveryStats = [], isLoading: runsLoading } = useQuery({
		queryKey: ["recovery-runs-details"],
		queryFn: () => getRecoveryAnalytics()
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		title: "Disruption & Recovery Analytics",
		subtitle: "Examine logged incidents frequency, recovery success rate, and re-optimization performance.",
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
			className: "grid gap-6 lg:grid-cols-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "panel p-5 space-y-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
					className: "text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "size-4 text-primary" }), " Incident Hotspots & Types"]
				}), statsLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-xs text-muted-foreground py-10 text-center",
					children: "Loading summaries..."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "p-4 border rounded bg-secondary/5 space-y-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between text-xs",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Total Incidents Reported:" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-bold text-foreground font-mono",
									children: incidentStats.totalIncidents
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between text-xs",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Recovery Success Rate:" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "font-bold text-success font-mono",
									children: [incidentStats.recoverySuccessRate, "%"]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between text-xs",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Avg Solve Runtime:" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "font-bold text-primary font-mono",
									children: [incidentStats.averageRecoveryTimeMins, "s"]
								})]
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-2 text-xs",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-semibold",
							children: "Incidents by Type:"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "space-y-1.5 font-mono",
							children: incidentStats.typesSummary?.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between py-1 border-b",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t.type }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-bold",
									children: t.count
								})]
							}, t.type))
						})]
					})]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "panel p-5 lg:col-span-2 space-y-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "text-xs font-bold uppercase tracking-wider text-muted-foreground",
					children: "Disruption Re-optimization Solver Log"
				}), runsLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "py-20 text-center text-xs text-muted-foreground",
					children: "Loading solver logs..."
				}) : recoveryStats.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "py-20 text-center text-xs text-muted-foreground italic",
					children: "No recovery runs recorded."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Service Date" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Incident Type" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
						className: "text-right",
						children: "Trips Affected"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
						className: "text-right",
						children: "Recovered"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
						className: "text-right",
						children: "Unassigned"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
						className: "text-right",
						children: "Recovery Success"
					})
				] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableBody, { children: recoveryStats.map((r) => {
					const successRate = r.tripsAffected > 0 ? Math.round(r.tripsRecovered / r.tripsAffected * 100) : 100;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
							className: "text-xs font-mono",
							children: r.serviceDate
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
							className: "text-xs uppercase font-mono",
							children: r.incidentType
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
							className: "text-right text-xs font-mono",
							children: r.tripsAffected
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
							className: "text-right text-xs font-mono text-success",
							children: r.tripsRecovered
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
							className: "text-right text-xs font-mono text-destructive",
							children: r.tripsUnassigned
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, {
							className: "text-right text-xs font-mono font-bold",
							children: [successRate, "%"]
						})
					] }, r.runId);
				}) })] })]
			})]
		})
	});
}
//#endregion
export { IncidentsAnalyticsPage as component };
