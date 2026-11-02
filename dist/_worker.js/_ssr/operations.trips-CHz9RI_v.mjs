import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { f as require_jsx_runtime } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { r as formatMinutesToTime, t as Button } from "./button-BnVgmmWP.mjs";
import { t as hasPermission } from "./auth-shared-CAbXQXMK.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { D as Plus, Tt as ArrowRight, W as Lightbulb, X as Funnel, ht as Calendar, nt as Compass, p as Sparkles, x as Search, xt as Ban } from "../_libs/lucide-react.mjs";
import { n as Route$27 } from "./router-9Rnl3R3s.mjs";
import { i as Badge, t as AppShell } from "./app-shell-CxpRo8VR.mjs";
import { a as TableHeader, i as TableHead, n as TableBody, o as TableRow, r as TableCell, t as Table } from "./table-BcOd4hKY.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-CrkmWf-u.mjs";
import { t as Label } from "./label-B3t-BMxc.mjs";
import { s as getRoutes } from "./routes-gis-fns-BrjITXAP.mjs";
import { t as Input } from "./input-DHIRLsgR.mjs";
import { a as DialogHeader, i as DialogFooter, n as DialogContent, o as DialogTitle, r as DialogDescription, t as Dialog } from "./dialog-BY3bl4Fh.mjs";
import { c as generateTrips, d as getTrips, n as cancelTrip, o as createTrip } from "./scheduling-fns-B2JRDpvw.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/operations.trips-CHz9RI_v.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var DEFAULT_DATE = "25 Aug 2026";
function parseTimeToMinutes(timeStr) {
	const [hStr, mStr] = timeStr.split(":");
	return Number(hStr || 0) * 60 + Number(mStr || 0);
}
function TripsPage() {
	const queryClient = useQueryClient();
	const user = Route$27.useRouteContext()?.user;
	const canModify = hasPermission(user?.role || "", "schedule.modify");
	const [serviceDate, setServiceDate] = (0, import_react.useState)(DEFAULT_DATE);
	const [routeId, setRouteId] = (0, import_react.useState)("all");
	const [status, setStatus] = (0, import_react.useState)("all");
	const [direction, setDirection] = (0, import_react.useState)("all");
	const [searchQuery, setSearchQuery] = (0, import_react.useState)("");
	const [isCreateOpen, setIsCreateOpen] = (0, import_react.useState)(false);
	const [isGeneratorOpen, setIsGeneratorOpen] = (0, import_react.useState)(false);
	const [formRouteId, setFormRouteId] = (0, import_react.useState)("");
	const [formStartTime, setFormStartTime] = (0, import_react.useState)("06:00");
	const [formServiceDate, setFormServiceDate] = (0, import_react.useState)(DEFAULT_DATE);
	const [formDirection, setFormDirection] = (0, import_react.useState)("OUTBOUND");
	const [genRouteId, setGenRouteId] = (0, import_react.useState)("");
	const [genStartTime, setGenStartTime] = (0, import_react.useState)("06:00");
	const [genEndTime, setGenEndTime] = (0, import_react.useState)("10:00");
	const [genFrequency, setGenFrequency] = (0, import_react.useState)("30");
	const [genDirection, setGenDirection] = (0, import_react.useState)("OUTBOUND");
	const { data: routesList = [] } = useQuery({
		queryKey: ["active-routes-trips"],
		queryFn: () => getRoutes({ status: "active" })
	});
	(0, import_react.useEffect)(() => {
		if (routesList.length > 0) {
			if (!formRouteId) setFormRouteId(routesList[0].id);
			if (!genRouteId) setGenRouteId(routesList[0].id);
		}
	}, [routesList]);
	const { data: tripsList = [], isLoading } = useQuery({
		queryKey: [
			"trips",
			serviceDate,
			routeId,
			status,
			direction
		],
		queryFn: () => getTrips({
			serviceDate,
			routeId,
			status,
			direction
		})
	});
	const createTripMutation = useMutation({
		mutationFn: createTrip,
		onSuccess: (newT) => {
			queryClient.invalidateQueries({ queryKey: ["trips"] });
			toast.success(`Trip ${newT.tripCode} created successfully.`);
			setIsCreateOpen(false);
			setFormStartTime("06:00");
		},
		onError: (err) => {
			toast.error(err.message || "Failed to create trip");
		}
	});
	const generateTripsMutation = useMutation({
		mutationFn: generateTrips,
		onSuccess: (tripsArray) => {
			queryClient.invalidateQueries({ queryKey: ["trips"] });
			toast.success(`Generated ${tripsArray.length} trips successfully.`);
			setIsGeneratorOpen(false);
		},
		onError: (err) => {
			toast.error(err.message || "Failed to generate trips");
		}
	});
	const cancelTripMutation = useMutation({
		mutationFn: cancelTrip,
		onSuccess: (updatedT) => {
			queryClient.invalidateQueries({ queryKey: ["trips"] });
			toast.success(`Trip ${updatedT.tripCode} cancelled successfully.`);
		},
		onError: (err) => {
			toast.error(err.message || "Failed to cancel trip");
		}
	});
	const handleCreateSubmit = (e) => {
		e.preventDefault();
		createTripMutation.mutate({
			routeId: formRouteId,
			startTime: parseTimeToMinutes(formStartTime),
			serviceDate: formServiceDate,
			direction: formDirection,
			status: "planned"
		});
	};
	const handleGeneratorSubmit = (e) => {
		e.preventDefault();
		generateTripsMutation.mutate({
			routeId: genRouteId,
			serviceDate,
			startTime: parseTimeToMinutes(genStartTime),
			endTime: parseTimeToMinutes(genEndTime),
			frequency: Number(genFrequency),
			direction: genDirection
		});
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "Trip Management",
		subtitle: "Timetable corridors, scheduled trips, and automatic schedule generators.",
		actions: canModify ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				size: "sm",
				variant: "outline",
				onClick: () => setIsGeneratorOpen(true),
				className: "bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "mr-2 size-4" }), "Generate Timetable"]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				size: "sm",
				onClick: () => setIsCreateOpen(true),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "mr-2 size-4" }), "Create Trip"]
			})]
		}) : void 0,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-xl border border-primary/25 bg-gradient-to-r from-primary/10 via-background to-primary/5 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid size-8 place-items-center rounded-lg bg-primary/15 text-primary shrink-0 mt-0.5",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lightbulb, { className: "size-4" })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "text-xs",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "font-bold text-foreground flex items-center gap-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Timetable Management Guide" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										variant: "outline",
										className: "text-[9px] font-mono border-primary/30 text-primary",
										children: "Step 2 of 4"
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-muted-foreground mt-0.5 leading-relaxed",
									children: [
										"A ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Trip" }),
										" is a single one-way bus journey at a scheduled departure time. Once trips are listed here, open the ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "AI Schedule Optimizer" }),
										" to group them into driver shifts (duties) and bus rosters with zero legal rest violations."
									]
								})]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 shrink-0",
							children: [canModify && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								size: "sm",
								variant: "outline",
								onClick: () => setIsGeneratorOpen(true),
								className: "text-xs h-8 border-primary/30 text-primary bg-primary/5 hover:bg-primary/15",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "mr-1.5 size-3.5" }), "Generate Timetable"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								asChild: true,
								size: "sm",
								className: "text-xs h-8 gap-1.5 bg-primary text-primary-foreground",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
									to: "/scheduling/optimizer",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Run AI Optimizer" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-3" })]
								})
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "panel p-4 flex flex-wrap gap-4 items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-1 flex-wrap gap-3 items-center min-w-[280px]",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "relative flex-1 min-w-[180px] max-w-xs",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										type: "text",
										placeholder: "Search trip code or corridor...",
										value: searchQuery,
										onChange: (e) => setSearchQuery(e.target.value),
										className: "pl-8 bg-background/50 h-9 text-xs"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Calendar, { className: "size-4 text-muted-foreground shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										type: "text",
										placeholder: "25 Aug 2026",
										value: serviceDate,
										onChange: (e) => setServiceDate(e.target.value),
										className: "w-[140px] bg-background/50 h-9 text-xs font-mono"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Compass, { className: "size-4 text-muted-foreground shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
										value: routeId,
										onValueChange: setRouteId,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
											className: "w-[180px] bg-background/50 h-9 text-xs",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "All Routes" })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: "all",
											children: "All Corridors"
										}), routesList.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectItem, {
											value: r.id,
											children: [
												r.code,
												" · ",
												r.name
											]
										}, r.id))] })]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Funnel, { className: "size-4 text-muted-foreground shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
										value: status,
										onValueChange: setStatus,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
											className: "w-[130px] bg-background/50 h-9 text-xs",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Status" })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: "all",
												children: "All Statuses"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: "draft",
												children: "Draft"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: "planned",
												children: "Planned"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: "scheduled",
												children: "Scheduled"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: "cancelled",
												children: "Cancelled"
											})
										] })]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex items-center gap-2",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
										value: direction,
										onValueChange: setDirection,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
											className: "w-[130px] bg-background/50 h-9 text-xs",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Direction" })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: "all",
												children: "All Directions"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: "OUTBOUND",
												children: "Outbound"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: "INBOUND",
												children: "Inbound"
											})
										] })]
									})
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
							variant: "outline",
							className: "font-mono text-xs border-primary/30 text-primary",
							children: [
								tripsList.filter((t) => {
									if (!searchQuery.trim()) return true;
									const q = searchQuery.toLowerCase();
									return t.tripCode?.toLowerCase().includes(q) || t.routeCode?.toLowerCase().includes(q) || t.routeName?.toLowerCase().includes(q);
								}).length,
								" ",
								"Trips Displayed"
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
						className: "panel overflow-hidden",
						children: isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "py-20 text-center text-xs text-muted-foreground",
							children: "Loading scheduled trips..."
						}) : tripsList.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "py-20 text-center text-xs text-muted-foreground",
							children: "No trips scheduled for this date matching the filters. Click \"Generate Timetable\" to populate."
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
								className: "w-[120px]",
								children: "Trip Code"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Route Code" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Route Name" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
								className: "w-[120px]",
								children: "Direction"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
								className: "w-[100px]",
								children: "Start Time"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
								className: "w-[100px]",
								children: "End Time"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
								className: "w-[100px]",
								children: "Duration"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
								className: "w-[100px]",
								children: "Distance"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
								className: "w-[110px]",
								children: "Status"
							}),
							canModify && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
								className: "w-[80px] text-right",
								children: "Actions"
							})
						] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableBody, { children: tripsList.filter((t) => {
							if (!searchQuery.trim()) return true;
							const q = searchQuery.toLowerCase();
							return t.tripCode?.toLowerCase().includes(q) || t.routeCode?.toLowerCase().includes(q) || t.routeName?.toLowerCase().includes(q);
						}).map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, {
							className: t.status === "cancelled" ? "opacity-60 bg-muted/5" : "",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
									className: "font-mono font-bold text-primary",
									children: t.tripCode
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
									className: "font-semibold text-xs",
									children: t.routeCode
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
									className: "text-sm font-medium",
									children: t.routeName
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									variant: "outline",
									className: "text-[9px] uppercase font-bold px-1.5 h-5",
									children: t.direction
								}) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
									className: "font-mono font-semibold",
									children: formatMinutesToTime(t.startTime)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
									className: "font-mono text-muted-foreground",
									children: formatMinutesToTime(t.endTime)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, {
									className: "font-mono text-xs",
									children: [t.durationMin, " min"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, {
									className: "font-mono text-xs",
									children: [t.distanceKm, " km"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									variant: t.status === "cancelled" ? "destructive" : t.status === "planned" ? "secondary" : "default",
									className: "text-[9px] uppercase font-bold py-0.5",
									children: t.status
								}) }),
								canModify && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
									className: "text-right",
									children: t.status !== "cancelled" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										variant: "ghost",
										size: "icon",
										className: "h-8 w-8 text-destructive hover:bg-destructive/10",
										onClick: () => {
											if (confirm(`Cancel trip ${t.tripCode}?`)) cancelTripMutation.mutate(t.id);
										},
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ban, { className: "size-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "sr-only",
											children: "Cancel Trip"
										})]
									})
								})
							]
						}, t.id)) })] })
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: isCreateOpen,
				onOpenChange: setIsCreateOpen,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogContent, {
					className: "sm:max-w-[400px]",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						onSubmit: handleCreateSubmit,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Create Scheduled Trip" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Schedule an individual trip. Code, duration and endpoints are auto-resolved from route geometries." })] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid gap-4 py-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-4 items-center gap-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "route",
											className: "text-right",
											children: "Route"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
											value: formRouteId,
											onValueChange: setFormRouteId,
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
												id: "route",
												className: "col-span-3",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: routesList.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectItem, {
												value: r.id,
												children: [
													r.code,
													" · ",
													r.name
												]
											}, r.id)) })]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-4 items-center gap-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "start",
											className: "text-right",
											children: "Start Time"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											id: "start",
											type: "time",
											value: formStartTime,
											onChange: (e) => setFormStartTime(e.target.value),
											className: "col-span-3 font-mono",
											required: true
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-4 items-center gap-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "date",
											className: "text-right text-xs",
											children: "Service Date"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											id: "date",
											value: formServiceDate,
											onChange: (e) => setFormServiceDate(e.target.value),
											className: "col-span-3",
											required: true
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-4 items-center gap-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "directionForm",
											className: "text-right",
											children: "Direction"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
											value: formDirection,
											onValueChange: setFormDirection,
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
												id: "directionForm",
												className: "col-span-3",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: "OUTBOUND",
												children: "OUTBOUND"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: "INBOUND",
												children: "INBOUND"
											})] })]
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
								disabled: createTripMutation.isPending,
								children: createTripMutation.isPending ? "Creating..." : "Save Trip"
							})] })
						]
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: isGeneratorOpen,
				onOpenChange: setIsGeneratorOpen,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogContent, {
					className: "sm:max-w-[400px]",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						onSubmit: handleGeneratorSubmit,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Generate Route Timetable" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogDescription, { children: [
								"Generate multiple sequential trips for date ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: serviceDate }),
								" at a custom frequency interval."
							] })] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid gap-4 py-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-4 items-center gap-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "genRoute",
											className: "text-right",
											children: "Route"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
											value: genRouteId,
											onValueChange: setGenRouteId,
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
												id: "genRoute",
												className: "col-span-3",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: routesList.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectItem, {
												value: r.id,
												children: [
													r.code,
													" · ",
													r.name
												]
											}, r.id)) })]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-4 items-center gap-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "genStart",
											className: "text-right text-xs",
											children: "Start Limit"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											id: "genStart",
											type: "time",
											value: genStartTime,
											onChange: (e) => setGenStartTime(e.target.value),
											className: "col-span-3 font-mono",
											required: true
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-4 items-center gap-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "genEnd",
											className: "text-right text-xs",
											children: "End Limit"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											id: "genEnd",
											type: "time",
											value: genEndTime,
											onChange: (e) => setGenEndTime(e.target.value),
											className: "col-span-3 font-mono",
											required: true
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-4 items-center gap-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "genFreq",
											className: "text-right text-xs",
											children: "Freq (min)"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											id: "genFreq",
											type: "number",
											min: "5",
											value: genFrequency,
											onChange: (e) => setGenFrequency(e.target.value),
											className: "col-span-3 font-mono",
											required: true
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-4 items-center gap-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "genDirection",
											className: "text-right",
											children: "Direction"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
											value: genDirection,
											onValueChange: setGenDirection,
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
												id: "genDirection",
												className: "col-span-3",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: "OUTBOUND",
												children: "OUTBOUND"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: "INBOUND",
												children: "INBOUND"
											})] })]
										})]
									}),
									(() => {
										const startM = parseTimeToMinutes(genStartTime);
										const endM = parseTimeToMinutes(genEndTime);
										const freqM = Math.max(5, Number(genFrequency) || 30);
										const estTrips = startM < endM ? Math.floor((endM - startM) / freqM) + 1 : 0;
										const durationHours = startM < endM ? ((endM - startM) / 60).toFixed(1) : "0";
										const selectedRouteObj = routesList.find((r) => r.id === genRouteId);
										return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-1.5 text-xs",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center justify-between text-primary font-bold",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "flex items-center gap-1.5",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "size-3.5 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Generator Live Preview" })]
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
														variant: "outline",
														className: "font-mono text-[10px] border-primary/40 text-primary bg-primary/10",
														children: [
															"~",
															estTrips,
															" Trips to Create"
														]
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
													className: "text-[11px] text-muted-foreground leading-snug",
													children: [
														"Corridor:",
														" ",
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
															className: "text-foreground",
															children: selectedRouteObj ? `${selectedRouteObj.code} (${selectedRouteObj.name})` : "Selected Route"
														}),
														" ",
														"(",
														genDirection,
														")"
													]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
													className: "text-[11px] text-muted-foreground leading-snug",
													children: [
														"Frequency: Every ",
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", {
															className: "text-foreground",
															children: [freqM, " minutes"]
														}),
														" ",
														"across a ",
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", {
															className: "text-foreground",
															children: [durationHours, " hr"]
														}),
														" ",
														"service window (",
														genStartTime,
														" to ",
														genEndTime,
														")."
													]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-[10px] text-muted-foreground pt-1 border-t border-border",
													children: "Tip: Peak traffic headway is typically 15-20 min; off-peak is 30-45 min."
												})
											]
										});
									})()
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								variant: "outline",
								onClick: () => setIsGeneratorOpen(false),
								children: "Cancel"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "submit",
								disabled: generateTripsMutation.isPending,
								children: generateTripsMutation.isPending ? "Generating..." : "Generate Timetable"
							})] })
						]
					})
				})
			})
		]
	});
}
//#endregion
export { TripsPage as component };
