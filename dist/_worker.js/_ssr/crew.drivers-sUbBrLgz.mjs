import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { f as require_jsx_runtime } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { n as cn, t as Button } from "./button-BnVgmmWP.mjs";
import { t as hasPermission } from "./auth-shared-CAbXQXMK.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { $ as Eye, A as Pen, D as Plus, St as Award, X as Funnel, _ as ShieldCheck, gt as CalendarClock, q as IdCard, rt as Clock, s as UserCog, st as CircleCheck, x as Search } from "../_libs/lucide-react.mjs";
import { n as Route$27 } from "./router-9Rnl3R3s.mjs";
import { a as Sheet, c as SheetHeader, i as Badge, l as SheetTitle, n as Avatar, o as SheetContent, r as AvatarFallback, t as AppShell } from "./app-shell-CxpRo8VR.mjs";
import { a as TableHeader, i as TableHead, n as TableBody, o as TableRow, r as TableCell, t as Table } from "./table-BcOd4hKY.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-CrkmWf-u.mjs";
import { t as Progress } from "./progress-s8PucG3W.mjs";
import { t as Label } from "./label-B3t-BMxc.mjs";
import { c as getDrivers, d as updateCrewMember, f as updateCrewStatus, n as createCrewMember, s as getCrewMember } from "./fleet-crew-BrnJaW4J.mjs";
import { t as Input } from "./input-DHIRLsgR.mjs";
import { a as DialogHeader, i as DialogFooter, n as DialogContent, o as DialogTitle, r as DialogDescription, t as Dialog } from "./dialog-BY3bl4Fh.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/crew.drivers-sUbBrLgz.js
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
		case "available": return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
		case "on-duty": return "bg-primary/10 text-primary border-primary/30";
		case "resting": return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30";
		case "leave": return "bg-destructive/10 text-destructive border-destructive/30";
		case "unavailable": return "bg-muted text-muted-foreground border-border";
		default: return "bg-secondary text-secondary-foreground";
	}
}
function DriversPage() {
	const queryClient = useQueryClient();
	const user = Route$27.useRouteContext()?.user;
	const canManage = hasPermission(user?.role || "", "crew.manage");
	const [search, setSearch] = (0, import_react.useState)("");
	const [statusFilter, setStatusFilter] = (0, import_react.useState)("all");
	const [depotFilter, setDepotFilter] = (0, import_react.useState)("all");
	const [isCreateOpen, setIsCreateOpen] = (0, import_react.useState)(false);
	const [isEditOpen, setIsEditOpen] = (0, import_react.useState)(false);
	const [isDetailsOpen, setIsDetailsOpen] = (0, import_react.useState)(false);
	const [selectedDriverId, setSelectedDriverId] = (0, import_react.useState)(null);
	const [formEmpId, setFormEmpId] = (0, import_react.useState)("");
	const [formName, setFormName] = (0, import_react.useState)("");
	const [formStatus, setFormStatus] = (0, import_react.useState)("available");
	const [formDepot, setFormDepot] = (0, import_react.useState)("Salem Central Depot");
	const [formAvailableFrom, setFormAvailableFrom] = (0, import_react.useState)("05:30");
	const [formRestUntil, setFormRestUntil] = (0, import_react.useState)("05:30");
	const [formLicenseCategory, setFormLicenseCategory] = (0, import_react.useState)("Heavy Passenger Vehicle (HPV)");
	const [formLicenseExpiry, setFormLicenseExpiry] = (0, import_react.useState)("2028-12-31");
	const { data: driversList = [], isLoading } = useQuery({
		queryKey: [
			"drivers",
			statusFilter,
			depotFilter,
			search
		],
		queryFn: () => getDrivers({
			status: statusFilter,
			depot: depotFilter,
			search
		})
	});
	const { data: selectedDriverDetails } = useQuery({
		queryKey: ["crew-member", selectedDriverId],
		queryFn: () => getCrewMember(selectedDriverId),
		enabled: !!selectedDriverId
	});
	const createMutation = useMutation({
		mutationFn: createCrewMember,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["drivers"] });
			queryClient.invalidateQueries({ queryKey: ["crew-availability"] });
			toast.success("Driver created successfully");
			setIsCreateOpen(false);
			resetForm();
		},
		onError: (err) => {
			toast.error(err.message || "Failed to create driver");
		}
	});
	const updateMutation = useMutation({
		mutationFn: updateCrewMember,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["drivers"] });
			queryClient.invalidateQueries({ queryKey: ["crew-availability"] });
			if (selectedDriverId) queryClient.invalidateQueries({ queryKey: ["crew-member", selectedDriverId] });
			toast.success("Driver updated successfully");
			setIsEditOpen(false);
			resetForm();
		},
		onError: (err) => {
			toast.error(err.message || "Failed to update driver");
		}
	});
	const statusMutation = useMutation({
		mutationFn: updateCrewStatus,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["drivers"] });
			queryClient.invalidateQueries({ queryKey: ["crew-availability"] });
			toast.success("Driver status updated successfully");
		},
		onError: (err) => {
			toast.error(err.message || "Failed to update status");
		}
	});
	const resetForm = () => {
		setFormEmpId("");
		setFormName("");
		setFormStatus("available");
		setFormDepot("Salem Central Depot");
		setFormAvailableFrom("05:30");
		setFormRestUntil("05:30");
		setFormLicenseCategory("Heavy Passenger Vehicle (HPV)");
		setFormLicenseExpiry("2028-12-31");
	};
	const handleOpenEdit = (driver) => {
		setSelectedDriverId(driver.id);
		setFormEmpId(driver.employeeId);
		setFormName(driver.name);
		setFormStatus(driver.status);
		setFormDepot(driver.depot);
		setFormAvailableFrom(formatMinutesToTime(driver.availableFrom));
		setFormRestUntil(formatMinutesToTime(driver.restUntil));
		setFormLicenseCategory(driver.licenseCategory || "Heavy Passenger Vehicle (HPV)");
		setFormLicenseExpiry(driver.licenseExpiry ? new Date(driver.licenseExpiry).toISOString().split("T")[0] : "2028-12-31");
		setIsEditOpen(true);
	};
	const handleOpenDetails = (id) => {
		setSelectedDriverId(id);
		setIsDetailsOpen(true);
	};
	const handleCreateSubmit = (e) => {
		e.preventDefault();
		createMutation.mutate({
			employeeId: formEmpId,
			name: formName,
			role: "driver",
			status: formStatus,
			depot: formDepot,
			availableFrom: parseTimeToMinutes(formAvailableFrom),
			restUntil: parseTimeToMinutes(formRestUntil),
			licenseCategory: formLicenseCategory,
			licenseExpiry: new Date(formLicenseExpiry)
		});
	};
	const handleEditSubmit = (e) => {
		e.preventDefault();
		if (!selectedDriverId) return;
		updateMutation.mutate({
			id: selectedDriverId,
			data: {
				employeeId: formEmpId,
				name: formName,
				status: formStatus,
				depot: formDepot,
				availableFrom: parseTimeToMinutes(formAvailableFrom),
				restUntil: parseTimeToMinutes(formRestUntil),
				licenseCategory: formLicenseCategory,
				licenseExpiry: new Date(formLicenseExpiry)
			}
		});
	};
	const totalCount = driversList.length;
	const availableCount = driversList.filter((d) => d.status === "available").length;
	const onDutyCount = driversList.filter((d) => d.status === "on-duty").length;
	const restingCount = driversList.filter((d) => d.status === "resting").length;
	const leaveCount = driversList.filter((d) => d.status === "leave").length;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "Driver Roster & Registry",
		subtitle: "Driver registry, heavy passenger vehicle licensing, availability compliance and shift assignments.",
		actions: canManage ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
			size: "sm",
			onClick: () => {
				resetForm();
				setIsCreateOpen(true);
			},
			className: "bg-primary text-primary-foreground font-semibold shadow-md shadow-primary/20 text-xs hover:scale-[1.02] transition-all",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "mr-1.5 size-4" }), "Add Driver"]
		}) : void 0,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-4 sm:grid-cols-2 md:grid-cols-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "glass-card p-4 rounded-xl border flex flex-col justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[10px] font-bold uppercase tracking-wider text-muted-foreground",
									children: "Total Drivers"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-2xl font-bold font-mono mt-1 text-foreground",
									children: totalCount
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "glass-card p-4 rounded-xl border-l-4 border-l-success flex flex-col justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[10px] font-bold uppercase tracking-wider text-muted-foreground",
									children: "Available"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-2xl font-bold font-mono mt-1 text-success",
									children: availableCount
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "glass-card p-4 rounded-xl border-l-4 border-l-primary flex flex-col justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[10px] font-bold uppercase tracking-wider text-muted-foreground",
									children: "On Active Duty"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-2xl font-bold font-mono mt-1 text-primary",
									children: onDutyCount
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "glass-card p-4 rounded-xl border-l-4 border-l-warning flex flex-col justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[10px] font-bold uppercase tracking-wider text-muted-foreground",
									children: "Mandatory Rest"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-2xl font-bold font-mono mt-1 text-warning",
									children: restingCount
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "glass-card p-4 rounded-xl border-l-4 border-l-destructive flex flex-col justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[10px] font-bold uppercase tracking-wider text-muted-foreground",
									children: "On Leave"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-2xl font-bold font-mono mt-1 text-destructive",
									children: leaveCount
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "glass-panel p-4 flex flex-wrap gap-4 items-center justify-between",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-1 flex-wrap gap-3 items-center min-w-[280px]",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "relative flex-1 max-w-sm min-w-[200px]",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										placeholder: "Search driver name or employee ID...",
										value: search,
										onChange: (e) => setSearch(e.target.value),
										className: "pl-8 bg-background/60 text-xs border-border/80"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Funnel, { className: "size-3.5 text-muted-foreground shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
										value: statusFilter,
										onValueChange: setStatusFilter,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
											className: "w-36 bg-background/60 text-xs border-border/80",
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
												value: "on-duty",
												children: "On Duty"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: "resting",
												children: "Resting"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: "leave",
												children: "Leave"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: "unavailable",
												children: "Unavailable"
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
											className: "w-44 bg-background/60 text-xs border-border/80",
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
						className: "glass-panel overflow-hidden",
						children: isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "py-16 text-center text-xs text-muted-foreground",
							children: "Loading driver registry..."
						}) : driversList.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "py-16 text-center text-xs text-muted-foreground",
							children: "No drivers found matching current search."
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, {
							className: "border-border/60",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
									className: "w-32 text-xs font-bold",
									children: "Emp ID"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
									className: "text-xs font-bold",
									children: "Driver Name"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
									className: "text-xs font-bold",
									children: "Depot Location"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
									className: "text-xs font-bold",
									children: "License Category"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
									className: "text-xs font-bold",
									children: "License Expiry"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
									className: "text-xs font-bold",
									children: "Status"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
									className: "text-xs font-bold",
									children: "Shift / Rest Limit"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
									className: "w-28 text-right text-xs font-bold",
									children: "Actions"
								})
							]
						}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableBody, { children: driversList.map((driver) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, {
							className: "border-border/40 hover:bg-muted/40 transition-colors",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
									className: "font-semibold text-primary font-mono text-xs",
									children: driver.employeeId
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Avatar, {
										className: "size-7",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarFallback, {
											className: "text-[10px] font-bold bg-primary/10 text-primary",
											children: driver.name.split(" ").map((n) => n[0]).join("").toUpperCase()
										})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-bold text-xs text-foreground",
										children: driver.name
									})]
								}) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
									className: "text-xs text-muted-foreground",
									children: driver.depot
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
									className: "text-xs font-medium",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "inline-flex items-center gap-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Award, { className: "size-3 text-primary" }), driver.licenseCategory || "HPV"]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
									className: "text-xs font-mono text-muted-foreground",
									children: driver.licenseExpiry ? new Date(driver.licenseExpiry).toLocaleDateString("en-GB", {
										day: "2-digit",
										month: "short",
										year: "numeric"
									}) : "-"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: canManage ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
									value: driver.status,
									onValueChange: (val) => statusMutation.mutate({
										id: driver.id,
										status: val
									}),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
										className: cn("h-7 w-28 text-[10px] font-semibold uppercase tracking-wider border", getStatusBadgeClass(driver.status)),
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: "available",
											className: "text-xs uppercase text-emerald-600",
											children: "Available"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: "on-duty",
											className: "text-xs uppercase text-primary",
											children: "On Duty"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: "resting",
											className: "text-xs uppercase text-amber-600",
											children: "Resting"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: "leave",
											className: "text-xs uppercase text-destructive",
											children: "Leave"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: "unavailable",
											className: "text-xs uppercase text-muted-foreground",
											children: "Unavailable"
										})
									] })]
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									variant: "outline",
									className: cn("text-[9px] font-semibold uppercase font-mono", getStatusBadgeClass(driver.status)),
									children: driver.status.replace("-", " ")
								}) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
									className: "text-xs text-muted-foreground",
									children: driver.status === "resting" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "flex items-center gap-1 text-amber-600 dark:text-amber-400 font-mono font-medium text-[11px]",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "size-3" }),
											"Rest ends ",
											formatMinutesToTime(driver.restUntil)
										]
									}) : driver.status === "available" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-emerald-600 dark:text-emerald-400 font-medium text-[11px]",
										children: [
											"Ready (from ",
											formatMinutesToTime(driver.availableFrom),
											")"
										]
									}) : driver.status === "on-duty" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-primary font-medium text-[11px]",
										children: "On Active Route"
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-muted-foreground text-[11px]",
										children: "Off Shift"
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
									className: "text-right",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex justify-end gap-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											variant: "ghost",
											size: "icon",
											className: "size-7 text-muted-foreground hover:text-primary rounded-lg",
											onClick: () => handleOpenDetails(driver.id),
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { className: "size-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "sr-only",
												children: "View profile card"
											})]
										}), canManage && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											variant: "ghost",
											size: "icon",
											className: "size-7 text-muted-foreground hover:text-foreground rounded-lg",
											onClick: () => handleOpenEdit(driver),
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pen, { className: "size-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "sr-only",
												children: "Edit driver"
											})]
										})]
									})
								})
							]
						}, driver.id)) })] })
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
				open: isDetailsOpen,
				onOpenChange: setIsDetailsOpen,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetContent, {
					className: "sm:max-w-[480px] p-6 overflow-y-auto",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetHeader, {
						className: "border-b border-border/60 pb-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetTitle, {
							className: "text-lg font-bold flex items-center gap-2 text-foreground",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IdCard, { className: "size-5 text-primary" }), "Driver Profile Card"]
						})
					}), selectedDriverDetails ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-5 space-y-6",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "p-4 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card space-y-4 shadow-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-3.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Avatar, {
										className: "size-14 ring-2 ring-primary/30 shadow-md",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarFallback, {
											className: "text-base font-bold bg-primary text-primary-foreground",
											children: selectedDriverDetails.name.split(" ").map((n) => n[0]).join("").toUpperCase()
										})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "text-base font-bold text-foreground",
											children: selectedDriverDetails.name
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "font-mono text-xs text-primary font-semibold",
											children: selectedDriverDetails.employeeId
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
											variant: "outline",
											className: cn("mt-1 text-[9px] font-mono uppercase font-bold", getStatusBadgeClass(selectedDriverDetails.status)),
											children: selectedDriverDetails.status
										})
									] })]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-2 gap-2 text-xs pt-2 border-t border-border/60 font-mono",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[10px] uppercase text-muted-foreground",
										children: "Depot Base"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-medium text-foreground text-[11px] truncate",
										children: selectedDriverDetails.depot
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[10px] uppercase text-muted-foreground",
										children: "License Type"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-medium text-foreground text-[11px] truncate",
										children: selectedDriverDetails.licenseCategory || "HPV Regular"
									})] })]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "glass-panel p-4 space-y-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h4", {
										className: "text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "size-4 text-success" }), "MV Act Driving Compliance"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-1.5",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex justify-between text-xs font-mono",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-muted-foreground",
													children: "Weekly Driving Log"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "font-bold text-foreground",
													children: "32 / 48 hrs"
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Progress, {
												value: 66,
												className: "h-2 bg-secondary"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[10px] text-muted-foreground",
												children: "16 hours driving buffer remaining this weekly wave."
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "p-2.5 rounded-lg border border-border/60 bg-secondary/20 space-y-1 text-xs",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex justify-between",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-muted-foreground",
												children: "Earliest Available:"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "font-mono font-bold",
												children: formatMinutesToTime(selectedDriverDetails.availableFrom)
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex justify-between",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-muted-foreground",
												children: "Mandatory Rest Until:"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "font-mono font-bold text-amber-600 dark:text-amber-400",
												children: formatMinutesToTime(selectedDriverDetails.restUntil)
											})]
										})]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h4", {
									className: "text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarClock, { className: "size-4 text-primary" }), "Rostered Duty Assignments"]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "p-4 rounded-xl border border-dashed border-border/70 text-center text-xs text-muted-foreground bg-secondary/10",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "size-6 text-emerald-500/60 mx-auto mb-1" }), "Roster wave compliant. Active sign-on recorded for Salem Central morning peak corridor."]
								})]
							})
						]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "py-20 text-center text-muted-foreground text-xs",
						children: "Loading driver profile..."
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: isCreateOpen,
				onOpenChange: setIsCreateOpen,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogContent, {
					className: "sm:max-w-[480px]",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						onSubmit: handleCreateSubmit,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, {
								className: "text-base font-bold flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserCog, { className: "size-4 text-primary" }), "Register New Driver"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, {
								className: "text-xs text-muted-foreground",
								children: "Add an HPV licensed driver to the Salem transport depot registry."
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "py-4 space-y-3.5",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-2 gap-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-1.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												className: "text-xs",
												children: "Employee ID"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												type: "text",
												placeholder: "e.g. EMP-DR-013",
												value: formEmpId,
												onChange: (e) => setFormEmpId(e.target.value),
												className: "font-mono text-xs",
												required: true
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-1.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												className: "text-xs",
												children: "Driver Full Name"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												type: "text",
												placeholder: "e.g. Anand Kumar",
												value: formName,
												onChange: (e) => setFormName(e.target.value),
												className: "text-xs",
												required: true
											})]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-2 gap-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-1.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												className: "text-xs",
												children: "License Category"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
												value: formLicenseCategory,
												onValueChange: setFormLicenseCategory,
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
													className: "text-xs font-mono",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "Heavy Passenger Vehicle (HPV)",
													children: "Heavy Passenger Vehicle (HPV)"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "Commercial Bus Licence",
													children: "Commercial Bus Licence"
												})] })]
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-1.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												className: "text-xs",
												children: "License Expiry Date"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												type: "date",
												value: formLicenseExpiry,
												onChange: (e) => setFormLicenseExpiry(e.target.value),
												className: "font-mono text-xs",
												required: true
											})]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-2 gap-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-1.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												className: "text-xs",
												children: "Shift Starts At"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												type: "time",
												value: formAvailableFrom,
												onChange: (e) => setFormAvailableFrom(e.target.value),
												className: "font-mono text-xs",
												required: true
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-1.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												className: "text-xs",
												children: "Initial Status"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
												value: formStatus,
												onValueChange: setFormStatus,
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
													className: "text-xs font-mono",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
														value: "available",
														children: "Available"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
														value: "on-duty",
														children: "On Duty"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
														value: "resting",
														children: "Resting"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
														value: "leave",
														children: "Leave"
													})
												] })]
											})]
										})]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								variant: "outline",
								onClick: () => setIsCreateOpen(false),
								className: "text-xs",
								children: "Cancel"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "submit",
								disabled: createMutation.isPending,
								className: "bg-primary text-primary-foreground text-xs font-semibold",
								children: createMutation.isPending ? "Creating..." : "Save Driver"
							})] })
						]
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: isEditOpen,
				onOpenChange: setIsEditOpen,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogContent, {
					className: "sm:max-w-[480px]",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						onSubmit: handleEditSubmit,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, {
								className: "text-base font-bold flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pen, { className: "size-4 text-primary" }), "Edit Driver Information"]
							}) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "py-4 space-y-3.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-2 gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-1.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											className: "text-xs",
											children: "Employee ID"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											type: "text",
											value: formEmpId,
											onChange: (e) => setFormEmpId(e.target.value),
											className: "font-mono text-xs",
											required: true
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-1.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											className: "text-xs",
											children: "Driver Full Name"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											type: "text",
											value: formName,
											onChange: (e) => setFormName(e.target.value),
											className: "text-xs",
											required: true
										})]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-2 gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-1.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											className: "text-xs",
											children: "Status"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
											value: formStatus,
											onValueChange: setFormStatus,
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
												className: "text-xs font-mono",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "available",
													children: "Available"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "on-duty",
													children: "On Duty"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "resting",
													children: "Resting"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "leave",
													children: "Leave"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "unavailable",
													children: "Unavailable"
												})
											] })]
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-1.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											className: "text-xs",
											children: "License Expiry Date"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											type: "date",
											value: formLicenseExpiry,
											onChange: (e) => setFormLicenseExpiry(e.target.value),
											className: "font-mono text-xs",
											required: true
										})]
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								variant: "outline",
								onClick: () => setIsEditOpen(false),
								className: "text-xs",
								children: "Cancel"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "submit",
								disabled: updateMutation.isPending,
								className: "bg-primary text-primary-foreground text-xs font-semibold",
								children: updateMutation.isPending ? "Saving..." : "Save Changes"
							})] })
						]
					})
				})
			})
		]
	});
}
//#endregion
export { DriversPage as component };
