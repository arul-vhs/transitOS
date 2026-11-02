import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { f as require_jsx_runtime } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { t as Button } from "./button-BnVgmmWP.mjs";
import { n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { Dt as ArrowLeft, et as Download } from "../_libs/lucide-react.mjs";
import { i as Badge, t as AppShell } from "./app-shell-CxpRo8VR.mjs";
import { a as TableHeader, i as TableHead, n as TableBody, o as TableRow, r as TableCell, t as Table } from "./table-BcOd4hKY.mjs";
import { s as getPlanVsActual, t as exportAnalyticsCsv } from "./analytics-fns-BCzaAr19.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-CrkmWf-u.mjs";
import { t as Label } from "./label-B3t-BMxc.mjs";
import { s as getRoutes } from "./routes-gis-fns-BrjITXAP.mjs";
import { i as getBuses } from "./fleet-crew-BrnJaW4J.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/analytics.plan-vs-actual-BylqyfXI.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function PlanVsActualPage() {
	const [serviceDate, setServiceDate] = (0, import_react.useState)("25 Aug 2026");
	const [routeId, setRouteId] = (0, import_react.useState)("all");
	const [busId, setBusId] = (0, import_react.useState)("all");
	const [status, setStatus] = (0, import_react.useState)("all");
	const { data: pvsList = [], isLoading: listLoading } = useQuery({
		queryKey: [
			"plan-vs-actual-data",
			routeId,
			busId,
			status,
			serviceDate
		],
		queryFn: () => getPlanVsActual({
			routeId: routeId === "all" ? void 0 : routeId,
			busId: busId === "all" ? void 0 : busId,
			status: status === "all" ? void 0 : status,
			serviceDate
		})
	});
	const { data: routesList = [] } = useQuery({
		queryKey: ["routes-filters"],
		queryFn: () => getRoutes()
	});
	const { data: busesList = [] } = useQuery({
		queryKey: ["buses-filters"],
		queryFn: () => getBuses()
	});
	const exportCsvMutation = useMutation({
		mutationFn: exportAnalyticsCsv,
		onSuccess: (csvBuffer) => {
			const blob = new Blob([csvBuffer], { type: "text/csv;charset=utf-8;" });
			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.setAttribute("href", url);
			link.setAttribute("download", `plan_vs_actual_report_${serviceDate}.csv`);
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			toast.success("Plan vs Actual CSV report exported.");
		}
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		title: "Plan vs Actual Analytics",
		subtitle: "Track planned departures, actual timestamps, and variances with visual statuses.",
		actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				asChild: true,
				variant: "outline",
				size: "sm",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/analytics",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "mr-2 size-3.5" }), " Back"]
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				onClick: () => exportCsvMutation.mutate("plan-vs-actual"),
				disabled: exportCsvMutation.isPending,
				size: "sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "mr-2 size-3.5" }), " Export CSV"]
			})]
		}),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "panel p-4 grid gap-4 sm:grid-cols-4 items-end",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							className: "text-xs",
							children: "Service Date"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
							value: serviceDate,
							onValueChange: setServiceDate,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
								className: "bg-background/50 h-9",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: "25 Aug 2026",
								children: "25 Aug 2026"
							}) })]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							className: "text-xs",
							children: "Route Corridor"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
							value: routeId,
							onValueChange: setRouteId,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
								className: "bg-background/50 h-9",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "All Routes" })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: "all",
								children: "All Routes"
							}), routesList.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: r.id,
								children: r.code
							}, r.id))] })]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							className: "text-xs",
							children: "Vehicle Bus"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
							value: busId,
							onValueChange: setBusId,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
								className: "bg-background/50 h-9",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "All Buses" })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: "all",
								children: "All Buses"
							}), busesList.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: b.id,
								children: b.registrationNumber
							}, b.id))] })]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							className: "text-xs",
							children: "State Status"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
							value: status,
							onValueChange: setStatus,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
								className: "bg-background/50 h-9",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "All Statuses" })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: "all",
									children: "All Statuses"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: "completed",
									children: "COMPLETED"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: "recovered",
									children: "RECOVERED"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: "scheduled",
									children: "SCHEDULED"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: "cancelled",
									children: "CANCELLED"
								})
							] })]
						})]
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "panel p-5 space-y-4",
				children: listLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "py-20 text-center text-xs text-muted-foreground",
					children: "Loading plan vs actual logs..."
				}) : pvsList.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "py-20 text-center text-xs text-muted-foreground italic",
					children: "No matching operational records found."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "overflow-x-auto",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Trip Code" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Route" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Dir" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Planned Start" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Actual Start" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Variance" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Planned End" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Actual End" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Status" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Reason" })
					] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableBody, { children: pvsList.map((t) => {
						const varNum = parseInt(t.departureVariance);
						const varColor = isNaN(varNum) ? "text-muted-foreground" : varNum > 5 ? "text-destructive font-bold" : varNum < 0 ? "text-success font-semibold" : "text-muted-foreground";
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
								className: "font-bold text-xs",
								children: t.tripCode
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
								className: "text-xs",
								children: t.routeCode
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
								className: "text-[10px] uppercase font-mono",
								children: t.direction
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
								className: "text-xs font-mono",
								children: t.plannedStart
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
								className: "text-xs font-mono",
								children: t.actualStart
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
								className: `text-xs font-mono ${varColor}`,
								children: t.departureVariance
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
								className: "text-xs font-mono",
								children: t.plannedEnd
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
								className: "text-xs font-mono",
								children: t.actualEnd
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								variant: t.status === "COMPLETED" ? "default" : t.status === "RECOVERED" ? "secondary" : t.status === "CANCELLED" ? "destructive" : "outline",
								className: "text-[9px] uppercase px-1 py-0 h-5",
								children: t.status
							}) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
								className: "text-[10px] text-muted-foreground max-w-[120px] truncate",
								children: t.cancellationReason
							})
						] }, t.tripId);
					}) })] })
				})
			})]
		})
	});
}
//#endregion
export { PlanVsActualPage as component };
