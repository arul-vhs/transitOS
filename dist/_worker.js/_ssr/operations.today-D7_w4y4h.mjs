import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { f as require_jsx_runtime } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { n as cn, r as formatMinutesToTime, t as Button } from "./button-BnVgmmWP.mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { Ct as ArrowUpRight, E as Radio, Q as FileText, T as RefreshCw, V as ListTodo, _t as Bus, c as TriangleAlert, gt as CalendarClock, o as Users, p as Sparkles, rt as Clock, st as CircleCheck, t as Zap } from "../_libs/lucide-react.mjs";
import { i as Badge, t as AppShell } from "./app-shell-CxpRo8VR.mjs";
import { t as Progress } from "./progress-s8PucG3W.mjs";
import { d as getTrips, l as getDuties, m as validateDuty } from "./scheduling-fns-B2JRDpvw.mjs";
import { a as getIncidents } from "./rescheduling-fns-DVTz89rd.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/operations.today-D7_w4y4h.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var SERVICE_DATE = "25 Aug 2026";
function OperationsTodayPage() {
	const [filterTab, setFilterTab] = (0, import_react.useState)("all");
	const { data: tripsList = [], isLoading: tripsLoading } = useQuery({
		queryKey: ["today-trips", SERVICE_DATE],
		queryFn: () => getTrips({ serviceDate: SERVICE_DATE })
	});
	const { data: dutiesList = [], isLoading: dutiesLoading } = useQuery({
		queryKey: ["today-duties", SERVICE_DATE],
		queryFn: () => getDuties({ serviceDate: SERVICE_DATE })
	});
	const { data: incidentsList = [] } = useQuery({
		queryKey: ["today-incidents", SERVICE_DATE],
		queryFn: () => getIncidents({ serviceDate: SERVICE_DATE })
	});
	const { data: dutyValidations = {} } = useQuery({
		queryKey: ["today-duties-validations", dutiesList],
		queryFn: async () => {
			const results = {};
			for (const d of dutiesList) try {
				const res = await validateDuty({ dutyId: d.id });
				results[d.id] = res;
			} catch {
				results[d.id] = {
					isValid: false,
					issues: ["Failed to run validation"]
				};
			}
			return results;
		},
		enabled: dutiesList.length > 0
	});
	const totalTrips = tripsList.length;
	const totalDuties = dutiesList.length;
	const assignedBuses = new Set(dutiesList.map((d) => d.busId).filter(Boolean)).size;
	const assignedDriversSet = /* @__PURE__ */ new Set();
	dutiesList.forEach((d) => {
		if (d.driverId) assignedDriversSet.add(d.driverId);
		if (d.crewSegments) d.crewSegments.forEach((seg) => {
			if (seg.driverId) assignedDriversSet.add(seg.driverId);
		});
	});
	const assignedDriversCount = assignedDriversSet.size;
	const assignedTripIds = /* @__PURE__ */ new Set();
	dutiesList.forEach((d) => {
		if (d.trips) d.trips.forEach((t) => assignedTripIds.add(t.id));
	});
	const unassignedTripsCount = tripsList.filter((t) => !assignedTripIds.has(t.id)).length;
	let totalValidationIssues = 0;
	Object.values(dutyValidations).forEach((v) => {
		totalValidationIssues += v.issues.length;
	});
	const loading = tripsLoading || dutiesLoading;
	const filteredDuties = dutiesList.filter((d) => {
		if (filterTab === "issues") {
			const val = dutyValidations[d.id];
			return val && !val.isValid;
		}
		if (filterTab === "active") return d.status === "published" || d.status === "assigned";
		return true;
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		title: "Active Operations Board",
		subtitle: `Real-time dispatch board, crew shift trackers, and corridor service compliance for ${SERVICE_DATE}.`,
		actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2.5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				asChild: true,
				size: "sm",
				variant: "outline",
				className: "text-xs h-8 border-border/80 bg-card/60",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/operations/incidents",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "size-3.5 mr-1.5 text-warning" }),
						"Disruptions (",
						incidentsList.length,
						")"
					]
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				asChild: true,
				size: "sm",
				className: "text-xs h-8 bg-primary text-primary-foreground font-semibold shadow-md shadow-primary/20",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/operations/duties",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "size-3.5 mr-1.5" }), "Duty Studio"]
				})
			})]
		}),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MetricTile, {
						icon: CalendarClock,
						label: "Service Trips",
						value: loading ? "..." : totalTrips,
						badge: "Scheduled",
						badgeColor: "bg-primary/10 text-primary border-primary/20"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MetricTile, {
						icon: ListTodo,
						label: "Active Duties",
						value: loading ? "..." : totalDuties,
						badge: "On Roster",
						badgeColor: "bg-secondary text-secondary-foreground"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MetricTile, {
						icon: Bus,
						label: "Dispatched Buses",
						value: loading ? "..." : assignedBuses,
						badge: "On Road",
						badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MetricTile, {
						icon: Users,
						label: "Active Crew",
						value: loading ? "..." : assignedDriversCount,
						badge: "On Shift",
						badgeColor: "bg-info/10 text-info border-info/20"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MetricTile, {
						icon: FileText,
						label: "Unassigned Trips",
						value: loading ? "..." : unassignedTripsCount,
						badge: unassignedTripsCount > 0 ? "Pending" : "Complete",
						badgeColor: unassignedTripsCount > 0 ? "bg-warning/10 text-warning border-warning/30" : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MetricTile, {
						icon: TriangleAlert,
						label: "Compliance Alerts",
						value: loading ? "..." : totalValidationIssues,
						badge: totalValidationIssues > 0 ? "Action Req" : "Compliant",
						badgeColor: totalValidationIssues > 0 ? "bg-destructive/10 text-destructive border-destructive/30" : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
						isDestructive: totalValidationIssues > 0
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-6 lg:grid-cols-12",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "glass-panel p-5 lg:col-span-8 space-y-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid size-7 place-items-center rounded-lg bg-primary/10 text-primary",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListTodo, { className: "size-4" })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "text-sm font-bold tracking-tight text-foreground",
								children: "Live Duty Dispatch Board"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[11px] text-muted-foreground",
								children: "Monitors departure blocks, driver sign-ons, and vehicle assignments"
							})] })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center rounded-lg border border-border/70 p-0.5 bg-secondary/30",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => setFilterTab("all"),
									className: cn("px-2.5 py-1 text-xs font-semibold rounded-md transition-all", filterTab === "all" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"),
									children: [
										"All (",
										dutiesList.length,
										")"
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => setFilterTab("active"),
									className: cn("px-2.5 py-1 text-xs font-semibold rounded-md transition-all", filterTab === "active" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"),
									children: "Published"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => setFilterTab("issues"),
									className: cn("px-2.5 py-1 text-xs font-semibold rounded-md transition-all", filterTab === "issues" ? "bg-destructive/15 text-destructive shadow-xs" : "text-muted-foreground hover:text-foreground"),
									children: [
										"Alerts (",
										totalValidationIssues,
										")"
									]
								})
							]
						})]
					}), loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "py-24 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "size-5 animate-spin text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Synchronizing operational duty states..." })]
					}) : filteredDuties.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "py-20 text-center text-xs text-muted-foreground flex flex-col items-center justify-center",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarClock, { className: "size-8 text-muted-foreground/50 mb-2" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-semibold text-foreground",
								children: "No duties matching current filter"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[11px] text-muted-foreground mt-1",
								children: "Switch filter or open Duty Builder to schedule duties."
							})
						]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "space-y-3 max-h-[580px] overflow-y-auto pr-1",
						children: filteredDuties.map((d) => {
							const val = dutyValidations[d.id] || {
								isValid: true,
								issues: []
							};
							const tripCount = d.trips?.length || 0;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: cn("p-4 rounded-xl border transition-all duration-150 flex flex-col gap-3 bg-card/60 hover:border-primary/40", !val.isValid ? "border-destructive/40 bg-destructive/5" : "border-border/70"),
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex flex-wrap items-center justify-between gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-2.5",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "font-mono font-bold text-sm text-foreground",
													children: d.dutyCode
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
													variant: "outline",
													className: "font-mono text-[10px] uppercase font-semibold",
													children: d.dutyType
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
													variant: "secondary",
													className: cn("text-[10px] font-bold uppercase", d.status === "published" ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : ""),
													children: d.status
												})
											]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-3 text-xs",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "font-mono font-semibold text-foreground flex items-center gap-1",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "size-3 text-primary" }),
													formatMinutesToTime(d.startTime),
													" – ",
													formatMinutesToTime(d.endTime)
												]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												asChild: true,
												size: "sm",
												variant: "ghost",
												className: "h-7 text-xs px-2 text-primary hover:bg-primary/10",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
													to: "/operations/duties",
													children: ["Edit ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpRight, { className: "size-3 ml-0.5" })]
												})
											})]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid gap-2 sm:grid-cols-2 text-xs pt-1 border-t border-border/40",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "size-6 rounded-md bg-secondary flex items-center justify-center text-muted-foreground",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bus, { className: "size-3.5" })
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-[10px] uppercase text-muted-foreground font-semibold",
												children: "Vehicle:"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "font-mono font-bold text-foreground text-xs",
												children: d.busRegNumber || "Unassigned"
											})] })]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "size-6 rounded-md bg-secondary flex items-center justify-center text-muted-foreground",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "size-3.5" })
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-[10px] uppercase text-muted-foreground font-semibold",
												children: "Rostered Crew:"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "font-medium text-foreground text-xs",
												children: [d.driverName ? `${d.driverName} (D)` : "No Driver", d.conductorName ? ` · ${d.conductorName} (C)` : ""]
											})] })]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-1.5 pt-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex justify-between text-[11px] text-muted-foreground",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Trips Progress: ", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: [tripCount, " corridor departures"] })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "font-mono text-primary font-semibold",
												children: "100% Scheduled"
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Progress, {
											value: 100,
											className: "h-1.5 bg-secondary"
										})]
									}),
									!val.isValid ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "p-2 rounded-lg bg-destructive/10 text-destructive text-[11px] flex items-center gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "size-3.5 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: val.issues[0] || "Duty rule conflict detected" })]
									}) : null
								]
							}, d.id);
						})
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "glass-panel p-5 lg:col-span-4 space-y-5 flex flex-col justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between border-b border-border/60 pb-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "grid size-7 place-items-center rounded-lg bg-warning/10 text-warning",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Radio, { className: "size-4 animate-pulse" })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "text-sm font-bold tracking-tight text-foreground",
									children: "Disruption Radar"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[11px] text-muted-foreground",
									children: "Real-time incident feed"
								})] })]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
								variant: "outline",
								className: "border-warning/30 text-warning bg-warning/5 text-xs font-mono",
								children: [incidentsList.length, " Logged"]
							})]
						}), incidentsList.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "p-6 rounded-xl border border-dashed border-border/70 text-center text-xs text-muted-foreground bg-background/30",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "size-8 text-emerald-500 mx-auto mb-2 opacity-80" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-semibold text-foreground",
									children: "Zero Active Disruptions"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[11px] text-muted-foreground mt-0.5",
									children: "All scheduled corridors operating within normal headway bounds."
								})
							]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "space-y-2.5 max-h-[380px] overflow-y-auto pr-1",
							children: incidentsList.map((inc) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "p-3 rounded-lg border border-border/70 bg-card/60 text-xs space-y-1.5 hover:border-warning/50 transition-colors",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-bold text-foreground font-mono text-xs",
											children: inc.type
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
											variant: "outline",
											className: cn("text-[9px] uppercase font-mono font-bold", inc.severity === "critical" ? "border-destructive/40 text-destructive bg-destructive/5" : "border-warning/40 text-warning bg-warning/5"),
											children: inc.severity
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[11px] text-muted-foreground leading-tight",
										children: inc.description || "Operational disruption reported on vehicle/crew."
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/40 font-mono",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Time: ", formatMinutesToTime(inc.startTime)] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
											to: "/operations/incidents",
											className: "text-primary font-bold hover:underline",
											children: "Inspect ➔"
										})]
									})
								]
							}, inc.id))
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-2.5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2 text-xs font-bold text-primary",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Zap, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Dispatcher Quick Access" })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[11px] text-muted-foreground",
								children: "Need to re-route or generate algorithmic recovery proposals? Access the Disruption Recovery Engine."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								asChild: true,
								size: "sm",
								className: "w-full text-xs font-semibold bg-primary text-primary-foreground",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/operations/incidents",
									children: "Open Disruption Recovery"
								})
							})
						]
					})]
				})]
			})]
		})
	});
}
function MetricTile({ icon: Icon, label, value, badge, badgeColor, isDestructive }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("glass-card p-4 rounded-xl border flex flex-col justify-between transition-all", isDestructive ? "border-destructive/40 bg-destructive/5" : "border-border/70"),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between text-muted-foreground",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-[10px] font-bold uppercase tracking-wider",
				children: label
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: cn("size-4", isDestructive ? "text-destructive" : "text-primary") })]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-2 flex items-baseline justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: cn("text-2xl font-bold font-mono", isDestructive ? "text-destructive" : "text-foreground"),
				children: value
			}), badge ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: cn("rounded-full border px-1.5 py-0.2 text-[9px] font-mono font-bold", badgeColor),
				children: badge
			}) : null]
		})]
	});
}
//#endregion
export { OperationsTodayPage as component };
