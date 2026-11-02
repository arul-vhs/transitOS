import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { f as require_jsx_runtime } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { t as Button } from "./button-BnVgmmWP.mjs";
import { t as hasPermission } from "./auth-shared-CAbXQXMK.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { $ as Eye, A as Pen, D as Plus, X as Funnel, _t as Bus, c as TriangleAlert, r as Wrench, rt as Clock, st as CircleCheck, x as Search } from "../_libs/lucide-react.mjs";
import { n as Route$27 } from "./router-9Rnl3R3s.mjs";
import { a as Sheet, c as SheetHeader, i as Badge, l as SheetTitle, o as SheetContent, t as AppShell } from "./app-shell-CxpRo8VR.mjs";
import { a as TableHeader, i as TableHead, n as TableBody, o as TableRow, r as TableCell, t as Table } from "./table-BcOd4hKY.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-CrkmWf-u.mjs";
import { t as Label } from "./label-B3t-BMxc.mjs";
import { i as getBuses, l as updateBus, r as getBus, t as createBus, u as updateBusStatus } from "./fleet-crew-BrnJaW4J.mjs";
import { t as Input } from "./input-DHIRLsgR.mjs";
import { a as DialogHeader, i as DialogFooter, n as DialogContent, o as DialogTitle, r as DialogDescription, t as Dialog } from "./dialog-BY3bl4Fh.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/fleet.buses-BhByNnwk.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function formatMinutesToTime(min) {
	const h = Math.floor(min / 60);
	const m = min % 60;
	return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
function parseTimeToMinutes(time) {
	if (!time) return 330;
	const [h, m] = time.split(":").map(Number);
	if (isNaN(h || 0) || isNaN(m || 0)) return 330;
	return (h || 0) * 60 + (m || 0);
}
function getStatusBadgeClass(status) {
	switch (status) {
		case "available": return "bg-success/10 text-success border-success/20";
		case "assigned": return "bg-info/10 text-info border-info/20";
		case "in-service": return "bg-primary/10 text-primary border-primary/20";
		case "maintenance": return "bg-warning/10 text-warning border-warning/20";
		case "breakdown": return "bg-destructive/10 text-destructive border-destructive/20 animate-pulse";
		case "out-of-service": return "bg-muted text-muted-foreground border-border";
		default: return "bg-secondary text-secondary-foreground";
	}
}
function BusesPage() {
	const queryClient = useQueryClient();
	const user = Route$27.useRouteContext()?.user;
	const canManage = hasPermission(user?.role || "", "fleet.manage");
	const [search, setSearch] = (0, import_react.useState)("");
	const [statusFilter, setStatusFilter] = (0, import_react.useState)("all");
	const [depotFilter, setDepotFilter] = (0, import_react.useState)("all");
	const [isCreateOpen, setIsCreateOpen] = (0, import_react.useState)(false);
	const [isEditOpen, setIsEditOpen] = (0, import_react.useState)(false);
	const [isDetailsOpen, setIsDetailsOpen] = (0, import_react.useState)(false);
	const [isConfirmStatusOpen, setIsConfirmStatusOpen] = (0, import_react.useState)(false);
	const [selectedBusId, setSelectedBusId] = (0, import_react.useState)(null);
	const [pendingStatusChange, setPendingStatusChange] = (0, import_react.useState)(null);
	const [formRegNum, setFormRegNum] = (0, import_react.useState)("");
	const [formFleetNum, setFormFleetNum] = (0, import_react.useState)("");
	const [formBusType, setFormBusType] = (0, import_react.useState)("Standard Single Decker");
	const [formCapacity, setFormCapacity] = (0, import_react.useState)("40");
	const [formDepot, setFormDepot] = (0, import_react.useState)("Meyyanur Depot");
	const [formStatus, setFormStatus] = (0, import_react.useState)("available");
	const [formAvailableFrom, setFormAvailableFrom] = (0, import_react.useState)("05:30");
	const { data: busesList = [], isLoading } = useQuery({
		queryKey: [
			"buses",
			statusFilter,
			depotFilter,
			search
		],
		queryFn: () => getBuses({
			status: statusFilter,
			depot: depotFilter,
			search
		})
	});
	const { data: selectedBusDetails } = useQuery({
		queryKey: ["bus", selectedBusId],
		queryFn: () => getBus(selectedBusId),
		enabled: !!selectedBusId
	});
	const createMutation = useMutation({
		mutationFn: createBus,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["buses"] });
			toast.success("Bus created successfully");
			setIsCreateOpen(false);
			resetForm();
		},
		onError: (err) => {
			toast.error(err.message || "Failed to create bus");
		}
	});
	const updateMutation = useMutation({
		mutationFn: updateBus,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["buses"] });
			if (selectedBusId) queryClient.invalidateQueries({ queryKey: ["bus", selectedBusId] });
			toast.success("Bus updated successfully");
			setIsEditOpen(false);
			resetForm();
		},
		onError: (err) => {
			toast.error(err.message || "Failed to update bus");
		}
	});
	const statusMutation = useMutation({
		mutationFn: updateBusStatus,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["buses"] });
			if (selectedBusId) queryClient.invalidateQueries({ queryKey: ["bus", selectedBusId] });
			toast.success("Bus status updated successfully");
			setIsConfirmStatusOpen(false);
			setPendingStatusChange(null);
		},
		onError: (err) => {
			toast.error(err.message || "Failed to update status");
		}
	});
	const resetForm = () => {
		setFormRegNum("");
		setFormFleetNum("");
		setFormBusType("Standard Single Decker");
		setFormCapacity("40");
		setFormDepot("Meyyanur Depot");
		setFormStatus("available");
		setFormAvailableFrom("05:30");
	};
	const handleOpenEdit = (bus) => {
		setSelectedBusId(bus.id);
		setFormRegNum(bus.registrationNumber);
		setFormFleetNum(bus.fleetNumber || "");
		setFormBusType(bus.busType || "Standard Single Decker");
		setFormCapacity(String(bus.capacity || 40));
		setFormDepot(bus.depot);
		setFormStatus(bus.status);
		setFormAvailableFrom(formatMinutesToTime(bus.availableFrom));
		setIsEditOpen(true);
	};
	const handleOpenDetails = (busId) => {
		setSelectedBusId(busId);
		setIsDetailsOpen(true);
	};
	const handleCreateSubmit = (e) => {
		e.preventDefault();
		createMutation.mutate({
			registrationNumber: formRegNum,
			fleetNumber: formFleetNum,
			busType: formBusType,
			capacity: Number(formCapacity),
			depot: formDepot,
			status: formStatus,
			availableFrom: parseTimeToMinutes(formAvailableFrom)
		});
	};
	const handleEditSubmit = (e) => {
		e.preventDefault();
		if (!selectedBusId) return;
		updateMutation.mutate({
			id: selectedBusId,
			data: {
				registrationNumber: formRegNum,
				fleetNumber: formFleetNum,
				busType: formBusType,
				capacity: Number(formCapacity),
				depot: formDepot,
				status: formStatus,
				availableFrom: parseTimeToMinutes(formAvailableFrom)
			}
		});
	};
	const handleStatusSelect = (id, currentReg, currentFleet, newStatus) => {
		if (newStatus === "breakdown" || newStatus === "out-of-service") {
			setPendingStatusChange({
				id,
				regNum: currentReg,
				fleetNum: currentFleet,
				status: newStatus
			});
			setIsConfirmStatusOpen(true);
		} else statusMutation.mutate({
			id,
			status: newStatus
		});
	};
	const totalBuses = busesList.length;
	const availableBuses = busesList.filter((b) => b.status === "available").length;
	const assignedBuses = busesList.filter((b) => b.status === "assigned").length;
	const inServiceBuses = busesList.filter((b) => b.status === "in-service").length;
	const maintenanceBuses = busesList.filter((b) => b.status === "maintenance").length;
	const breakdownBuses = busesList.filter((b) => b.status === "breakdown").length;
	const outOfServiceBuses = busesList.filter((b) => b.status === "out-of-service").length;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "Fleet Management",
		subtitle: "Manage your depot fleet registers and live bus status contexts.",
		actions: canManage ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
			size: "sm",
			onClick: () => {
				resetForm();
				setIsCreateOpen(true);
			},
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "mr-2 size-4" }), "Create Bus"]
		}) : void 0,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-3.5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-2xl border border-border/80 bg-card p-4 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[11px] font-semibold text-muted-foreground uppercase tracking-wider",
											children: "Total Fleet"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bus, { className: "size-4 text-primary" })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-3xl font-extrabold tracking-tight mt-2 text-foreground",
										children: totalBuses
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[11px] text-muted-foreground mt-1",
										children: "Salem City Fleet"
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider",
											children: "Available"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-2 rounded-full bg-emerald-500 animate-pulse" })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-3xl font-extrabold tracking-tight mt-2 text-emerald-600 dark:text-emerald-400",
										children: availableBuses
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[11px] text-muted-foreground mt-1",
										children: "Ready to dispatch"
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider",
											children: "In Service"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-2 rounded-full bg-cyan-500" })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-3xl font-extrabold tracking-tight mt-2 text-cyan-600 dark:text-cyan-400",
										children: inServiceBuses + assignedBuses
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[11px] text-muted-foreground mt-1",
										children: "On road or assigned"
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider",
											children: "Maintenance"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wrench, { className: "size-4 text-amber-500" })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-3xl font-extrabold tracking-tight mt-2 text-amber-600 dark:text-amber-400",
										children: maintenanceBuses
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[11px] text-muted-foreground mt-1",
										children: "In workshop bays"
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[11px] font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider",
											children: "Breakdown"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "size-4 text-rose-500" })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-3xl font-extrabold tracking-tight mt-2 text-rose-600 dark:text-rose-400",
										children: breakdownBuses
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[11px] text-muted-foreground mt-1",
										children: "Needs recovery"
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-2xl border border-border/70 bg-muted/30 p-4 flex flex-col justify-between shadow-2xs",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[11px] font-semibold text-muted-foreground uppercase tracking-wider",
											children: "Standby"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-2 rounded-full bg-muted-foreground" })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-3xl font-extrabold tracking-tight mt-2 text-muted-foreground",
										children: outOfServiceBuses
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[11px] text-muted-foreground mt-1",
										children: "Depot reserve"
									})
								]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "panel p-4 flex flex-wrap gap-4 items-center justify-between",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-1 flex-wrap gap-3 items-center min-w-[280px]",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "relative flex-1 max-w-sm min-w-[200px]",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										placeholder: "Search registration or fleet number...",
										value: search,
										onChange: (e) => setSearch(e.target.value),
										className: "pl-9 bg-background/50"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Funnel, { className: "size-4 text-muted-foreground shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
										value: statusFilter,
										onValueChange: setStatusFilter,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
											className: "w-[140px] bg-background/50",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Status" })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: "all",
												children: "All Statuses"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: "available",
												children: "Available"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: "assigned",
												children: "Assigned"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: "in-service",
												children: "In Service"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: "maintenance",
												children: "Maintenance"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: "breakdown",
												children: "Breakdown"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: "out-of-service",
												children: "Out of Service"
											})
										] })]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex items-center gap-2",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
										value: depotFilter,
										onValueChange: setDepotFilter,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
											className: "w-[180px] bg-background/50",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Depot" })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: "all",
												children: "All Depots"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: "Meyyanur Depot",
												children: "Meyyanur Depot"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: "Johnsonpet Depot",
												children: "Johnsonpet Depot"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: "Hasthampatti Depot",
												children: "Hasthampatti Depot"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: "Steel Plant Depot",
												children: "Steel Plant Depot"
											})
										] })]
									})
								})
							]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "panel overflow-hidden",
						children: isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "py-10 text-center text-muted-foreground",
							children: "Loading fleet records..."
						}) : busesList.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "py-10 text-center text-muted-foreground",
							children: "No buses found. Add a bus to populate your fleet database."
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
								className: "w-[120px]",
								children: "Fleet Number"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Registration" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Bus Type" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
								className: "text-right",
								children: "Capacity"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Depot" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Status" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Available From" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
								className: "w-[200px] text-right",
								children: "Actions"
							})
						] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableBody, { children: busesList.map((bus) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
								className: "font-semibold text-primary",
								children: bus.fleetNumber || "-"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
								className: "font-mono text-sm",
								children: bus.registrationNumber
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
								className: "text-sm",
								children: bus.busType || "Standard"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
								className: "text-right text-sm",
								children: bus.capacity || 40
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
								className: "text-xs text-muted-foreground",
								children: bus.depot
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: canManage ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
								value: bus.status,
								onValueChange: (val) => handleStatusSelect(bus.id, bus.registrationNumber, bus.fleetNumber || "", val),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
									className: `h-7 w-[130px] text-xs font-semibold uppercase tracking-wider border ${getStatusBadgeClass(bus.status)}`,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "available",
										className: "text-xs uppercase tracking-wider text-success",
										children: "Available"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "assigned",
										className: "text-xs uppercase tracking-wider text-info",
										children: "Assigned"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "in-service",
										className: "text-xs uppercase tracking-wider text-primary",
										children: "In Service"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "maintenance",
										className: "text-xs uppercase tracking-wider text-warning",
										children: "Maintenance"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "breakdown",
										className: "text-xs uppercase tracking-wider text-destructive",
										children: "Breakdown"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "out-of-service",
										className: "text-xs uppercase tracking-wider text-muted-foreground",
										children: "Out of Service"
									})
								] })]
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								variant: "outline",
								className: `h-6 text-[10px] font-semibold uppercase tracking-wider border ${getStatusBadgeClass(bus.status)}`,
								children: bus.status.replace("-", " ")
							}) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
								className: "text-xs font-mono text-muted-foreground",
								children: formatMinutesToTime(bus.availableFrom)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
								className: "text-right",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-end gap-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										variant: "ghost",
										size: "icon",
										className: "h-8 w-8 text-muted-foreground",
										onClick: () => handleOpenDetails(bus.id),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "sr-only",
											children: "View Details"
										})]
									}), canManage && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										variant: "ghost",
										size: "icon",
										className: "h-8 w-8 text-muted-foreground",
										onClick: () => handleOpenEdit(bus),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pen, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "sr-only",
											children: "Edit Bus"
										})]
									})]
								})
							})
						] }, bus.id)) })] })
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: isCreateOpen,
				onOpenChange: setIsCreateOpen,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogContent, {
					className: "sm:max-w-[425px]",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						onSubmit: handleCreateSubmit,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Create New Bus" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Add a new verified passenger bus vehicle to this organization's database fleet registry." })] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid gap-4 py-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-4 items-center gap-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "regNum",
											className: "text-right",
											children: "Registration"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											id: "regNum",
											value: formRegNum,
											onChange: (e) => setFormRegNum(e.target.value),
											placeholder: "TN-30-AB-1234",
											className: "col-span-3 font-mono",
											required: true
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-4 items-center gap-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "fleetNum",
											className: "text-right",
											children: "Fleet No."
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											id: "fleetNum",
											value: formFleetNum,
											onChange: (e) => setFormFleetNum(e.target.value),
											placeholder: "F-120",
											className: "col-span-3 font-semibold text-primary",
											required: true
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-4 items-center gap-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "busType",
											className: "text-right",
											children: "Bus Type"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
											value: formBusType,
											onValueChange: setFormBusType,
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
												className: "col-span-3",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "Standard Single Decker",
													children: "Standard Single Decker"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "Minibus",
													children: "Minibus"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "Electric Single Decker",
													children: "Electric Single Decker"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "Double Decker",
													children: "Double Decker"
												})
											] })]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-4 items-center gap-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "capacity",
											className: "text-right",
											children: "Capacity"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											id: "capacity",
											type: "number",
											min: "1",
											value: formCapacity,
											onChange: (e) => setFormCapacity(e.target.value),
											className: "col-span-3",
											required: true
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-4 items-center gap-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "depot",
											className: "text-right",
											children: "Depot"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
											value: formDepot,
											onValueChange: setFormDepot,
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
												className: "col-span-3",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "Meyyanur Depot",
													children: "Meyyanur Depot"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "Johnsonpet Depot",
													children: "Johnsonpet Depot"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "Hasthampatti Depot",
													children: "Hasthampatti Depot"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "Steel Plant Depot",
													children: "Steel Plant Depot"
												})
											] })]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-4 items-center gap-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "status",
											className: "text-right",
											children: "Status"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
											value: formStatus,
											onValueChange: setFormStatus,
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
												className: "col-span-3",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "available",
													children: "Available"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "assigned",
													children: "Assigned"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "in-service",
													children: "In Service"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "maintenance",
													children: "Maintenance"
												})
											] })]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-4 items-center gap-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "availFrom",
											className: "text-right text-xs",
											children: "Available From"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											id: "availFrom",
											type: "time",
											value: formAvailableFrom,
											onChange: (e) => setFormAvailableFrom(e.target.value),
											className: "col-span-3 font-mono",
											required: true
										})]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								variant: "outline",
								onClick: () => setIsCreateOpen(false),
								children: "Cancel"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "submit",
								disabled: createMutation.isPending,
								children: createMutation.isPending ? "Creating..." : "Save Bus"
							})] })
						]
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: isEditOpen,
				onOpenChange: setIsEditOpen,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogContent, {
					className: "sm:max-w-[425px]",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						onSubmit: handleEditSubmit,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Edit Bus Details" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogDescription, { children: [
								"Modify properties of bus vehicle `",
								formFleetNum,
								"`."
							] })] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid gap-4 py-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-4 items-center gap-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "editRegNum",
											className: "text-right",
											children: "Registration"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											id: "editRegNum",
											value: formRegNum,
											onChange: (e) => setFormRegNum(e.target.value),
											className: "col-span-3 font-mono",
											required: true
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-4 items-center gap-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "editFleetNum",
											className: "text-right",
											children: "Fleet No."
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											id: "editFleetNum",
											value: formFleetNum,
											onChange: (e) => setFormFleetNum(e.target.value),
											className: "col-span-3 font-semibold text-primary",
											required: true
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-4 items-center gap-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "editBusType",
											className: "text-right",
											children: "Bus Type"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
											value: formBusType,
											onValueChange: setFormBusType,
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
												className: "col-span-3",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "Standard Single Decker",
													children: "Standard Single Decker"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "Minibus",
													children: "Minibus"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "Electric Single Decker",
													children: "Electric Single Decker"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "Double Decker",
													children: "Double Decker"
												})
											] })]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-4 items-center gap-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "editCapacity",
											className: "text-right",
											children: "Capacity"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											id: "editCapacity",
											type: "number",
											min: "1",
											value: formCapacity,
											onChange: (e) => setFormCapacity(e.target.value),
											className: "col-span-3",
											required: true
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-4 items-center gap-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "editDepot",
											className: "text-right",
											children: "Depot"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
											value: formDepot,
											onValueChange: setFormDepot,
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
												className: "col-span-3",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "Meyyanur Depot",
													children: "Meyyanur Depot"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "Johnsonpet Depot",
													children: "Johnsonpet Depot"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "Hasthampatti Depot",
													children: "Hasthampatti Depot"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "Steel Plant Depot",
													children: "Steel Plant Depot"
												})
											] })]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-4 items-center gap-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "editStatus",
											className: "text-right",
											children: "Status"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
											value: formStatus,
											onValueChange: setFormStatus,
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
												className: "col-span-3",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "available",
													children: "Available"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "assigned",
													children: "Assigned"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "in-service",
													children: "In Service"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "maintenance",
													children: "Maintenance"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "breakdown",
													children: "Breakdown"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "out-of-service",
													children: "Out of Service"
												})
											] })]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-4 items-center gap-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "editAvailFrom",
											className: "text-right text-xs",
											children: "Available From"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											id: "editAvailFrom",
											type: "time",
											value: formAvailableFrom,
											onChange: (e) => setFormAvailableFrom(e.target.value),
											className: "col-span-3 font-mono",
											required: true
										})]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								variant: "outline",
								onClick: () => setIsEditOpen(false),
								children: "Cancel"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "submit",
								disabled: updateMutation.isPending,
								children: updateMutation.isPending ? "Saving..." : "Save Changes"
							})] })
						]
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: isConfirmStatusOpen,
				onOpenChange: setIsConfirmStatusOpen,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
					className: "sm:max-w-[400px]",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, {
							className: "flex items-center gap-2 text-destructive",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "size-5" }), "Confirm Status Change"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogDescription, {
							className: "pt-2 text-foreground font-semibold",
							children: [
								"Mark ",
								pendingStatusChange?.fleetNum || "bus",
								" (",
								pendingStatusChange?.regNum,
								") as",
								" ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "capitalize text-destructive font-bold",
									children: pendingStatusChange?.status.replace("-", " ")
								}),
								"?"
							]
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "py-2 text-sm text-muted-foreground",
							children: "This action will mark the vehicle as unavailable in the fleet schedule."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
							className: "gap-2 sm:gap-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "outline",
								onClick: () => {
									setIsConfirmStatusOpen(false);
									setPendingStatusChange(null);
								},
								children: "Cancel"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "destructive",
								onClick: () => {
									if (pendingStatusChange) statusMutation.mutate({
										id: pendingStatusChange.id,
										status: pendingStatusChange.status
									});
								},
								disabled: statusMutation.isPending,
								children: statusMutation.isPending ? "Updating..." : "Confirm"
							})]
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
				open: isDetailsOpen,
				onOpenChange: setIsDetailsOpen,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetContent, {
					className: "sm:max-w-[450px]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetTitle, {
						className: "text-xl font-bold flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bus, { className: "size-5 text-primary" }), "Bus Details"]
					}) }), selectedBusDetails ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-6 space-y-6",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "panel p-4 space-y-3 bg-secondary/20",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex justify-between items-center",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-xs text-muted-foreground",
											children: "Fleet Number"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-bold text-primary",
											children: selectedBusDetails.fleetNumber || "-"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex justify-between items-center",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-xs text-muted-foreground",
											children: "Registration"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-mono text-sm font-semibold",
											children: selectedBusDetails.registrationNumber
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex justify-between items-center",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-xs text-muted-foreground",
											children: "Status"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
											variant: "outline",
											className: `h-6 text-[10px] font-semibold uppercase tracking-wider border ${getStatusBadgeClass(selectedBusDetails.status)}`,
											children: selectedBusDetails.status.replace("-", " ")
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex justify-between items-center",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-xs text-muted-foreground",
											children: "Capacity"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "text-sm font-semibold",
											children: [selectedBusDetails.capacity, " seats"]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex justify-between items-center",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-xs text-muted-foreground",
											children: "Depot"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-sm font-medium",
											children: selectedBusDetails.depot
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex justify-between items-center",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-xs text-muted-foreground",
											children: "Available From"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-sm font-mono",
											children: formatMinutesToTime(selectedBusDetails.availableFrom)
										})]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
									className: "text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "size-4 text-success" }), "Today's Duties"]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "border border-dashed border-border rounded-md p-4 text-center text-xs text-muted-foreground bg-background/50",
									children: "No duties scheduled for the service day."
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
									className: "text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wrench, { className: "size-4 text-warning" }), "Maintenance Logs"]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "border border-dashed border-border rounded-md p-4 text-center text-xs text-muted-foreground bg-background/50",
									children: "No active or past maintenance reports found."
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
									className: "text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "size-4 text-info" }), "Assignment History"]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "border border-dashed border-border rounded-md p-4 text-center text-xs text-muted-foreground bg-background/50",
									children: "No past roster allocation records found."
								})]
							})
						]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "py-20 text-center text-muted-foreground text-sm",
						children: "Loading bus details..."
					})]
				})
			})
		]
	});
}
//#endregion
export { BusesPage as component };
