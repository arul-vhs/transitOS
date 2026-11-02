import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { f as require_jsx_runtime } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { n as cn, t as Button } from "./button-BnVgmmWP.mjs";
import { n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { Ct as ArrowUpRight, H as ListRestart, _t as Bus, c as TriangleAlert, et as Download, h as SlidersHorizontal, kt as Activity, l as TrendingUp, nt as Compass, o as Users, rt as Clock, st as CircleCheck, vt as Building2 } from "../_libs/lucide-react.mjs";
import { n as Route$27 } from "./router-9Rnl3R3s.mjs";
import { i as Badge, t as AppShell } from "./app-shell-CxpRo8VR.mjs";
import { a as getIncidentAnalytics, o as getOptimizationAnalytics, r as getDepotAnalytics, t as exportAnalyticsCsv, u as getServiceMetrics } from "./analytics-fns-BCzaAr19.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-CrkmWf-u.mjs";
import { t as Progress } from "./progress-s8PucG3W.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/analytics.index-Mjo8EvO7.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AnalyticsDashboardPage() {
	const userRole = (Route$27.useRouteContext()?.user)?.role || "MANAGEMENT";
	const [serviceDate, setServiceDate] = (0, import_react.useState)("25 Aug 2026");
	const { data: metrics = {}, isLoading: metricsLoading } = useQuery({
		queryKey: ["service-metrics", serviceDate],
		queryFn: () => getServiceMetrics({ serviceDate })
	});
	const { data: incidentsObj = {} } = useQuery({
		queryKey: ["incident-analytics"],
		queryFn: () => getIncidentAnalytics()
	});
	const { data: optRuns = [] } = useQuery({
		queryKey: ["optimization-runs-analytics"],
		queryFn: () => getOptimizationAnalytics()
	});
	const { data: depotStats = [] } = useQuery({
		queryKey: ["depot-analytics"],
		queryFn: () => getDepotAnalytics()
	});
	const exportCsvMutation = useMutation({
		mutationFn: exportAnalyticsCsv,
		onSuccess: (csvBuffer, type) => {
			const blob = new Blob([csvBuffer], { type: "text/csv;charset=utf-8;" });
			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.setAttribute("href", url);
			link.setAttribute("download", `transitOS_${type}_report.csv`);
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			toast.success("CSV report exported successfully.");
		},
		onError: (err) => {
			toast.error(err.message || "Failed to export CSV report");
		}
	});
	const handleExport = (type) => {
		exportCsvMutation.mutate(type);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		title: "Operations Intelligence",
		subtitle: "Authorized plan-vs-actual telemetry, fleet utilization indices, and disruption resolution metrics.",
		actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
				value: serviceDate,
				onValueChange: setServiceDate,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
					className: "w-36 bg-background/60 h-8.5 text-xs font-mono border-border/80",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
					value: "25 Aug 2026",
					children: "25 Aug 2026"
				}) })]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				onClick: () => handleExport("plan-vs-actual"),
				disabled: exportCsvMutation.isPending,
				variant: "outline",
				size: "sm",
				className: "text-xs h-8.5 border-border/80 bg-card/60 font-semibold",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "mr-1.5 size-3.5" }), " Export CSV"]
			})]
		}),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "glass-panel p-3.5 flex justify-between items-center gap-4 text-xs",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2 font-medium text-foreground",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid size-6 place-items-center rounded-md bg-primary/10 text-primary",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SlidersHorizontal, { className: "size-3.5" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Executive Dashboard View: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Salem Transport Corporation" })] })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							variant: "outline",
							className: "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 text-[10px] font-mono",
							children: "● Live Telemetry"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							variant: "secondary",
							className: "uppercase text-[9px] font-mono font-bold",
							children: userRole
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KPICard, {
							title: "On-Time Rate",
							value: metricsLoading ? "..." : `${metrics.onTimeRate || 94}%`,
							hint: "Tolerance ±5m",
							color: "border-l-emerald-500",
							icon: Clock
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KPICard, {
							title: "Trip Completion",
							value: metricsLoading ? "..." : `${metrics.completionRate || 98}%`,
							hint: "Scheduled vs Done",
							color: "border-l-primary",
							icon: CircleCheck
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KPICard, {
							title: "Cancellation Rate",
							value: metricsLoading ? "..." : `${metrics.cancellationRate || 0}%`,
							hint: "Unserved runs",
							color: "border-l-destructive",
							icon: TriangleAlert,
							isAlert: metrics.cancellationRate > 0
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KPICard, {
							title: "Avg Delay",
							value: metricsLoading ? "..." : `${metrics.averageDelay || 2}m`,
							hint: "Variance buffer",
							color: "border-l-warning",
							icon: TrendingUp
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KPICard, {
							title: "Fleet Utilization",
							value: "84%",
							hint: "Active Hours / Cap",
							color: "border-l-info",
							icon: Bus
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KPICard, {
							title: "Crew Utilization",
							value: "88%",
							hint: "Duty Hours / Shift",
							color: "border-l-secondary",
							icon: Users
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KPICard, {
							title: "Recovery Rate",
							value: `${incidentsObj.recoverySuccessRate || 100}%`,
							hint: "Disruptions resolved",
							color: "border-l-emerald-500",
							icon: ListRestart
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-6 md:grid-cols-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "glass-panel p-5 flex flex-col justify-between space-y-4 hover:border-primary/40 transition-colors",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
											className: "text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Activity, { className: "size-4 text-primary" }), " Service Reliability"]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
											variant: "outline",
											className: "text-[9px] font-mono",
											children: "94% Target"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-muted-foreground leading-relaxed",
										children: "Plan vs Actual departure variance, arrival timelines, and cancel ratios scoped to tenant date ranges."
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "pt-2 space-y-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex justify-between text-[11px] font-mono text-muted-foreground",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Corridor Punctuality:" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "font-bold text-foreground",
												children: "94.2%"
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Progress, {
											value: 94.2,
											className: "h-1.5 bg-secondary"
										})]
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								asChild: true,
								size: "sm",
								variant: "secondary",
								className: "w-full text-xs font-semibold",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
									to: "/analytics/plan-vs-actual",
									children: ["Inspect Plan vs Actual ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpRight, { className: "size-3.5 ml-1" })]
								})
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "glass-panel p-5 flex flex-col justify-between space-y-4 hover:border-primary/40 transition-colors",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
											className: "text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Compass, { className: "size-4 text-info" }), " Route Performance"]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
											variant: "outline",
											className: "text-[9px] font-mono",
											children: "6 Corridors"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-muted-foreground leading-relaxed",
										children: "Completion rates, delay statistics, and passenger headway indexing across active Salem routes."
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "pt-2 space-y-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex justify-between text-[11px] font-mono text-muted-foreground",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Avg Route Headway:" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "font-bold text-foreground",
												children: "15 mins"
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Progress, {
											value: 85,
											className: "h-1.5 bg-secondary"
										})]
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								asChild: true,
								size: "sm",
								variant: "secondary",
								className: "w-full text-xs font-semibold",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
									to: "/analytics/routes",
									children: ["Inspect Route Analytics ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpRight, { className: "size-3.5 ml-1" })]
								})
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "glass-panel p-5 flex flex-col justify-between space-y-4 hover:border-primary/40 transition-colors",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
											className: "text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bus, { className: "size-4 text-warning" }), " Fleet Utilization"]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
											variant: "outline",
											className: "text-[9px] font-mono",
											children: "84% In Use"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-muted-foreground leading-relaxed",
										children: "Operating hours per bus, vehicle breakdown downtime, and maintenance inspection frequencies."
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "pt-2 space-y-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex justify-between text-[11px] font-mono text-muted-foreground",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Fleet Availability:" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "font-bold text-foreground",
												children: "92%"
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Progress, {
											value: 92,
											className: "h-1.5 bg-secondary"
										})]
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								asChild: true,
								size: "sm",
								variant: "secondary",
								className: "w-full text-xs font-semibold",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
									to: "/analytics/fleet",
									children: ["Inspect Fleet Analytics ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpRight, { className: "size-3.5 ml-1" })]
								})
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "glass-panel p-5 flex flex-col justify-between space-y-4 hover:border-primary/40 transition-colors",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
											className: "text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "size-4 text-success" }), " Crew Utilization"]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
											variant: "outline",
											className: "text-[9px] font-mono",
											children: "Compliant"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-muted-foreground leading-relaxed",
										children: "Duty segment durations, unlinked crew segment handovers, and rest compliance checks under MV Act."
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "pt-2 space-y-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex justify-between text-[11px] font-mono text-muted-foreground",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Shift Compliance:" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "font-bold text-emerald-600 dark:text-emerald-400",
												children: "100%"
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Progress, {
											value: 100,
											className: "h-1.5 bg-secondary"
										})]
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								asChild: true,
								size: "sm",
								variant: "secondary",
								className: "w-full text-xs font-semibold",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
									to: "/analytics/crew",
									children: ["Inspect Crew Analytics ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpRight, { className: "size-3.5 ml-1" })]
								})
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "glass-panel p-5 flex flex-col justify-between space-y-4 hover:border-primary/40 transition-colors",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
											className: "text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "size-4 text-destructive" }), " Incidents & Recovery"]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
											variant: "outline",
											className: "text-[9px] font-mono text-emerald-600",
											children: "100% Solved"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-muted-foreground leading-relaxed",
										children: "Disruption recovery success statistics, delay reductions, and algorithmic re-routing records."
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "pt-2 space-y-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex justify-between text-[11px] font-mono text-muted-foreground",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Passenger Delay Saved:" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "font-bold text-foreground",
												children: "45 mins"
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Progress, {
											value: 75,
											className: "h-1.5 bg-secondary"
										})]
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								asChild: true,
								size: "sm",
								variant: "secondary",
								className: "w-full text-xs font-semibold",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
									to: "/analytics/incidents",
									children: ["Inspect Incident Analytics ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpRight, { className: "size-3.5 ml-1" })]
								})
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "glass-panel p-5 flex flex-col justify-between space-y-4 hover:border-primary/40 transition-colors",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
											className: "text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Building2, { className: "size-4 text-primary" }), " Meyyanur Central Depot"]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
											variant: "outline",
											className: "text-[9px] font-mono",
											children: "Hub"
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-muted-foreground leading-relaxed",
										children: "Active fleet inventory, crew distribution, unassigned runs, and dispatch adherence."
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "divide-y divide-border/40 text-[11px] text-muted-foreground pt-1",
									children: depotStats.length > 0 ? depotStats.map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "py-1.5 flex justify-between",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: d.depot }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "font-mono font-bold text-foreground",
											children: [
												"Util: ",
												d.utilizationRate,
												"%"
											]
										})]
									}, d.depot)) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "py-1.5 flex justify-between font-mono",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Meyyanur Central Depot" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-bold text-foreground",
											children: "Util: 88%"
										})]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									asChild: true,
									size: "sm",
									variant: "secondary",
									className: "w-full text-xs font-semibold",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
										to: "/fleet/buses",
										children: "View Depot Fleet"
									})
								})
							]
						})
					]
				})
			]
		})
	});
}
function KPICard({ title, value, hint, icon: Icon, color, isAlert }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("glass-card p-4 rounded-xl border border-l-4 flex flex-col justify-between", color || "border-l-primary"),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between text-muted-foreground",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-[10px] font-bold uppercase tracking-wider",
					children: title
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: cn("size-3.5", isAlert ? "text-destructive" : "text-primary") })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-2 flex items-baseline justify-between",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: cn("text-2xl font-bold font-mono", isAlert ? "text-destructive" : "text-foreground"),
					children: value
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-[10px] text-muted-foreground mt-1 truncate",
				children: hint
			})
		]
	});
}
//#endregion
export { AnalyticsDashboardPage as component };
