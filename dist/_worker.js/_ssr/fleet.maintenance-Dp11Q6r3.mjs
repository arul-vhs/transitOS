import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { f as require_jsx_runtime } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { t as Button } from "./button-BnVgmmWP.mjs";
import { t as hasPermission } from "./auth-shared-CAbXQXMK.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { D as Plus, Y as Gauge, _ as ShieldCheck, c as TriangleAlert, ct as CircleCheckBig, r as Wrench, st as CircleCheck, x as Search } from "../_libs/lucide-react.mjs";
import { n as Route$27 } from "./router-9Rnl3R3s.mjs";
import { i as Badge, t as AppShell } from "./app-shell-CxpRo8VR.mjs";
import { a as TableHeader, i as TableHead, n as TableBody, o as TableRow, r as TableCell, t as Table } from "./table-BcOd4hKY.mjs";
import { i as getBuses, u as updateBusStatus } from "./fleet-crew-BrnJaW4J.mjs";
import { t as Input } from "./input-DHIRLsgR.mjs";
import { a as DialogHeader, i as DialogFooter, n as DialogContent, o as DialogTitle, r as DialogDescription, t as Dialog } from "./dialog-BY3bl4Fh.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/fleet.maintenance-Dp11Q6r3.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function MaintenancePage() {
	const queryClient = useQueryClient();
	const user = Route$27.useRouteContext()?.user;
	const canManage = hasPermission(user?.role || "", "fleet.manage");
	const [isScheduleOpen, setIsScheduleOpen] = (0, import_react.useState)(false);
	const [search, setSearch] = (0, import_react.useState)("");
	const [selectedBusId, setSelectedBusId] = (0, import_react.useState)(null);
	const { data: busesList = [], isLoading } = useQuery({
		queryKey: ["buses-maintenance"],
		queryFn: () => getBuses()
	});
	const busesInMaintenance = busesList.filter((b) => b.status === "maintenance");
	const busesRequiringMaintenance = busesList.filter((b) => b.status === "breakdown");
	const availableBuses = busesList.filter((b) => b.status === "available" || b.status === "assigned" || b.status === "in-service");
	const filteredAvailableBuses = availableBuses.filter((b) => b.registrationNumber.toLowerCase().includes(search.toLowerCase()) || (b.fleetNumber || "").toLowerCase().includes(search.toLowerCase()));
	const statusMutation = useMutation({
		mutationFn: updateBusStatus,
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: ["buses-maintenance"] });
			queryClient.invalidateQueries({ queryKey: ["buses"] });
			if ((variables?.status || variables?.data?.status) === "maintenance") {
				toast.success("Bus successfully sent to maintenance docking.");
				setIsScheduleOpen(false);
			} else toast.success("Bus successfully returned to active service.");
		},
		onError: (err) => {
			toast.error(err.message || "Failed to update bus maintenance status");
		}
	});
	const fleetHealthPercent = busesList.length > 0 ? Math.round(availableBuses.length / busesList.length * 100) : 100;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "Maintenance & Fleet Health",
		subtitle: "Track active service docking, breakdown defect reports, and depot inspection readiness.",
		actions: canManage ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
			size: "sm",
			onClick: () => setIsScheduleOpen(true),
			className: "bg-primary text-primary-foreground text-xs font-semibold shadow-md shadow-primary/20 hover:scale-[1.02] transition-all",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "mr-1.5 size-4" }), "Dock Vehicle in Bay"]
		}) : void 0,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "glass-card p-4 rounded-xl border-l-4 border-l-primary flex flex-col justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between text-muted-foreground",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[10px] font-bold uppercase tracking-wider",
									children: "Fleet Readiness"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gauge, { className: "size-4 text-primary" })]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-2 flex items-baseline gap-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-2xl font-bold font-mono text-primary",
									children: [fleetHealthPercent, "%"]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[10px] text-muted-foreground",
									children: "operational rate"
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "glass-card p-4 rounded-xl border-l-4 border-l-warning flex flex-col justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between text-muted-foreground",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[10px] font-bold uppercase tracking-wider",
									children: "In Docking (Bays)"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wrench, { className: "size-4 text-warning" })]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-2 flex items-baseline justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-2xl font-bold font-mono text-warning",
									children: busesInMaintenance.length
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									variant: "outline",
									className: "border-warning/30 text-warning bg-warning/5 text-[9px] font-mono",
									children: "Active Bay"
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "glass-card p-4 rounded-xl border-l-4 border-l-destructive flex flex-col justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between text-muted-foreground",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[10px] font-bold uppercase tracking-wider",
									children: "Defects / Breakdowns"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "size-4 text-destructive" })]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-2 flex items-baseline justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-2xl font-bold font-mono text-destructive",
									children: busesRequiringMaintenance.length
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									variant: "outline",
									className: "border-destructive/30 text-destructive bg-destructive/5 text-[9px] font-mono",
									children: "Action Req"
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "glass-card p-4 rounded-xl border-l-4 border-l-success flex flex-col justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between text-muted-foreground",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[10px] font-bold uppercase tracking-wider",
									children: "Available Fleet"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "size-4 text-success" })]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-2 flex items-baseline justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-2xl font-bold font-mono text-success",
									children: availableBuses.length
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-[10px] text-muted-foreground font-mono",
									children: [
										"of ",
										busesList.length,
										" total"
									]
								})]
							})]
						})
					]
				}),
				busesRequiringMaintenance.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "glass-panel p-5 space-y-3 border-destructive/40 bg-destructive/5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 text-destructive",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "size-4.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "text-sm font-bold tracking-tight",
								children: "Vehicles Reporting Defects or Road Breakdowns"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
							variant: "outline",
							className: "border-destructive/40 text-destructive font-mono text-xs",
							children: [busesRequiringMaintenance.length, " Grounded"]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-3 pt-1",
						children: busesRequiringMaintenance.map((bus) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "p-3.5 rounded-xl border border-destructive/30 bg-card/80 flex items-center justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-bold text-xs text-foreground font-mono",
									children: bus.registrationNumber
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									variant: "outline",
									className: "text-[9px] font-mono",
									children: bus.fleetNumber
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-[10px] text-muted-foreground mt-0.5",
								children: [
									bus.busType,
									" · ",
									bus.depot
								]
							})] }), canManage && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								size: "sm",
								onClick: () => statusMutation.mutate({
									id: bus.id,
									status: "maintenance"
								}),
								disabled: statusMutation.isPending,
								className: "bg-warning text-warning-foreground text-[11px] h-7 px-2.5 font-semibold",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wrench, { className: "size-3 mr-1" }), " Send to Bay"]
							})]
						}, bus.id))
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "glass-panel p-5 space-y-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between border-b border-border/60 pb-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid size-7 place-items-center rounded-lg bg-warning/10 text-warning",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wrench, { className: "size-4" })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "text-sm font-bold tracking-tight text-foreground",
								children: "Currently Docked for Servicing"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[11px] text-muted-foreground",
								children: "Depot mechanics inspection and overhaul bay"
							})] })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
							variant: "outline",
							className: "font-mono text-xs",
							children: [busesInMaintenance.length, " Vehicles In Bay"]
						})]
					}), isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "py-16 text-center text-xs text-muted-foreground",
						children: "Loading maintenance database..."
					}) : busesInMaintenance.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "py-16 text-center text-xs text-muted-foreground flex flex-col items-center justify-center",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "size-8 text-emerald-500/60 mb-2" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-semibold text-foreground",
								children: "All Bays Clear"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[11px] text-muted-foreground mt-0.5",
								children: "No vehicles currently docked for scheduled or emergency overhaul."
							})
						]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, {
						className: "border-border/60",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
								className: "text-xs font-bold",
								children: "Fleet No"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
								className: "text-xs font-bold",
								children: "Registration"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
								className: "text-xs font-bold",
								children: "Bus Type"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
								className: "text-xs font-bold",
								children: "Depot Location"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
								className: "text-xs font-bold",
								children: "Status"
							}),
							canManage && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
								className: "text-right text-xs font-bold",
								children: "Actions"
							})
						]
					}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableBody, { children: busesInMaintenance.map((bus) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, {
						className: "border-border/40 hover:bg-muted/40 transition-colors",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
								className: "font-semibold text-primary font-mono text-xs",
								children: bus.fleetNumber
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
								className: "font-mono text-xs font-bold",
								children: bus.registrationNumber
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
								className: "text-xs",
								children: bus.busType
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
								className: "text-xs text-muted-foreground",
								children: bus.depot
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								variant: "outline",
								className: "bg-warning/10 text-warning border-warning/30 text-[9px] font-mono uppercase font-bold",
								children: "Maintenance"
							}) }),
							canManage && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
								className: "text-right",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									variant: "outline",
									size: "sm",
									className: "h-7 text-xs border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 font-semibold",
									onClick: () => statusMutation.mutate({
										id: bus.id,
										status: "available"
									}),
									disabled: statusMutation.isPending,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheckBig, { className: "mr-1 size-3.5" }), "Release to Service"]
								})
							})
						]
					}, bus.id)) })] })]
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
			open: isScheduleOpen,
			onOpenChange: setIsScheduleOpen,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
				className: "sm:max-w-[480px]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, {
						className: "text-base font-bold flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wrench, { className: "size-4 text-warning" }), "Dock Vehicle in Maintenance Bay"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, {
						className: "text-xs text-muted-foreground",
						children: "Select an available bus to transition to maintenance docking status."
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "py-3 space-y-3.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								type: "text",
								placeholder: "Search by registration or fleet number...",
								value: search,
								onChange: (e) => setSearch(e.target.value),
								className: "pl-8 text-xs font-mono"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "space-y-1.5 max-h-56 overflow-y-auto border rounded-xl p-2 bg-secondary/10",
							children: filteredAvailableBuses.map((bus) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between p-2 rounded-lg hover:bg-card border border-transparent hover:border-border transition-all",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "text-xs",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-bold font-mono text-foreground",
										children: bus.registrationNumber
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-[10px] text-muted-foreground ml-2 font-mono",
										children: [
											"(",
											bus.fleetNumber || bus.busType,
											")"
										]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "sm",
									onClick: () => statusMutation.mutate({
										id: bus.id,
										status: "maintenance"
									}),
									disabled: statusMutation.isPending,
									className: "h-7 text-[11px] bg-warning text-warning-foreground font-semibold",
									children: "Dock"
								})]
							}, bus.id))
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogFooter, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						onClick: () => setIsScheduleOpen(false),
						className: "text-xs",
						children: "Close"
					}) })
				]
			})
		})]
	});
}
//#endregion
export { MaintenancePage as component };
