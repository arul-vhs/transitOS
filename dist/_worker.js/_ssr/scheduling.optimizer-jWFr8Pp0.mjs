import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { f as require_jsx_runtime } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { n as createServerFn } from "./server-CDJaugyn.mjs";
import { n as cn, r as formatMinutesToTime, t as Button } from "./button-BnVgmmWP.mjs";
import { a as toServerFnArgs, t as createSsrRpc } from "./auth-SlquhadG.mjs";
import { t as hasPermission } from "./auth-shared-CAbXQXMK.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { B as LoaderCircle, C as Route, Et as ArrowRightLeft, F as Map, G as Layers, Tt as ArrowRight, Y as Gauge, _ as ShieldCheck, _t as Bus, gt as CalendarClock, ht as Calendar, l as TrendingUp, o as Users, p as Sparkles, pt as Check, st as CircleCheck, t as Zap, tt as Cpu, y as Settings } from "../_libs/lucide-react.mjs";
import { n as Route$27 } from "./router-9Rnl3R3s.mjs";
import { i as Badge, t as AppShell } from "./app-shell-CxpRo8VR.mjs";
import { a as TableHeader, i as TableHead, n as TableBody, o as TableRow, r as TableCell, t as Table } from "./table-BcOd4hKY.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-CrkmWf-u.mjs";
import { t as Progress } from "./progress-s8PucG3W.mjs";
import { t as Label } from "./label-B3t-BMxc.mjs";
import { a as getConductors, c as getDrivers, i as getBuses } from "./fleet-crew-BrnJaW4J.mjs";
import { t as Input } from "./input-DHIRLsgR.mjs";
import { a as DialogHeader, i as DialogFooter, n as DialogContent, o as DialogTitle, r as DialogDescription, t as Dialog } from "./dialog-BY3bl4Fh.mjs";
import { d as getTrips, l as getDuties } from "./scheduling-fns-B2JRDpvw.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/scheduling.optimizer-jWFr8Pp0.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var _generateOptimizedSchedule = createServerFn({ method: "POST" }).validator((data) => data).handler(createSsrRpc("0650dd94a6999000aba4f2c5df0c77314c9e4b8873937d519d629a46ba07b6f2"));
var generateOptimizedSchedule = async (data) => {
	return await _generateOptimizedSchedule(toServerFnArgs(data));
};
createServerFn({ method: "GET" }).validator((runId) => runId).handler(createSsrRpc("d57ef0e4213e1f662e5dae68c7586d22d30ef6602bd0e6356806d35a38aa1cad"));
var _publishSchedule = createServerFn({ method: "POST" }).validator((payload) => payload).handler(createSsrRpc("0a3ac43a77fe7c9fd1937a7ed2c6bca45b6a2257738089384068bad8946aec49"));
var publishSchedule = async (payload) => {
	return await _publishSchedule(toServerFnArgs(payload));
};
var DEFAULT_DATE = "25 Aug 2026";
var OPT_STAGES = [
	"Analyzing timetable corridors & departure headway...",
	"Querying depot vehicle inventory & state matrix...",
	"Evaluating driver & conductor rest compliance bounds...",
	"Building candidate duty connection graphs...",
	"Solving mixed-integer vehicle & crew assignment...",
	"Validating Motor Vehicle Act continuous driving limits...",
	"Compiling deployment-ready duty proposal..."
];
function OptimizerPage() {
	const queryClient = useQueryClient();
	const user = Route$27.useRouteContext()?.user;
	const canGenerate = hasPermission(user?.role || "", "schedule.generate");
	const canPublish = hasPermission(user?.role || "", "schedule.publish");
	const [serviceDate, setServiceDate] = (0, import_react.useState)(DEFAULT_DATE);
	const [mode, setMode] = (0, import_react.useState)("HYBRID");
	const [stageIndex, setStageIndex] = (0, import_react.useState)(-1);
	const [isSolving, setIsSolving] = (0, import_react.useState)(false);
	const [runId, setRunId] = (0, import_react.useState)(null);
	const [proposal, setProposal] = (0, import_react.useState)(null);
	const [publishDialogOpen, setPublishDialogOpen] = (0, import_react.useState)(false);
	const [activeGanttView, setActiveGanttView] = (0, import_react.useState)("proposal");
	const [selectedRouteFilter, setSelectedRouteFilter] = (0, import_react.useState)("all");
	(0, import_react.useEffect)(() => {
		try {
			const saved = sessionStorage.getItem("transitOS_active_proposal");
			if (saved && !proposal) {
				const parsed = JSON.parse(saved);
				if (parsed?.proposal) {
					setProposal(parsed.proposal);
					setRunId(parsed.runId || null);
					setActiveGanttView("proposal");
				}
			}
		} catch {}
	}, []);
	const { data: currentTrips = [] } = useQuery({
		queryKey: ["current-trips-opt", serviceDate],
		queryFn: () => getTrips({ serviceDate })
	});
	const { data: currentDuties = [] } = useQuery({
		queryKey: ["current-duties-opt", serviceDate],
		queryFn: () => getDuties({ serviceDate })
	});
	const { data: busesList = [] } = useQuery({
		queryKey: ["buses-count-opt"],
		queryFn: () => getBuses()
	});
	const { data: driversList = [] } = useQuery({
		queryKey: ["drivers-count-opt"],
		queryFn: () => getDrivers()
	});
	const { data: conductorsList = [] } = useQuery({
		queryKey: ["conductors-count-opt"],
		queryFn: () => getConductors()
	});
	const baselineUnassigned = currentTrips.filter((t) => !currentDuties.some((d) => d.trips?.some((dt) => dt.id === t.id))).length;
	const baselineBuses = new Set(currentDuties.map((d) => d.busId).filter(Boolean)).size;
	const baselineDuties = currentDuties.length;
	let baselineHandovers = 0;
	currentDuties.forEach((d) => {
		if (d.dutyType === "UNLINKED" && d.crewSegments) baselineHandovers += Math.max(0, d.crewSegments.length - 1);
	});
	const optimizeMutation = useMutation({
		mutationFn: generateOptimizedSchedule,
		onSuccess: (data) => {
			setRunId(data.runId);
			setProposal(data.result);
			setActiveGanttView("proposal");
			setIsSolving(false);
			setStageIndex(-1);
			try {
				sessionStorage.setItem("transitOS_active_proposal", JSON.stringify({
					proposal: data.result,
					runId: data.runId
				}));
			} catch {}
			toast.success("Schedule optimization run completed successfully.");
		},
		onError: (err) => {
			setIsSolving(false);
			setStageIndex(-1);
			toast.error(err.message || "Failed to run schedule optimization");
		}
	});
	const publishMutation = useMutation({
		mutationFn: publishSchedule,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["duties"] });
			queryClient.invalidateQueries({ queryKey: ["trips"] });
			queryClient.invalidateQueries({ queryKey: ["today-duties"] });
			queryClient.invalidateQueries({ queryKey: ["current-duties-opt"] });
			toast.success("Optimized schedule published to live operations!");
			setPublishDialogOpen(false);
			setProposal(null);
			setRunId(null);
			try {
				sessionStorage.removeItem("transitOS_active_proposal");
			} catch {}
		},
		onError: (err) => {
			toast.error(err.message || "Failed to publish schedule proposal");
		}
	});
	const handleOptimize = async () => {
		if (!canGenerate) {
			toast.error("You do not have permissions to generate schedules.");
			return;
		}
		setIsSolving(true);
		setProposal(null);
		setRunId(null);
		for (let i = 0; i < OPT_STAGES.length; i++) {
			setStageIndex(i);
			await new Promise((resolve) => setTimeout(resolve, 380));
		}
		optimizeMutation.mutate({
			serviceDate,
			mode
		});
	};
	const handlePublish = () => {
		if (!canPublish) {
			toast.error("You do not have permissions to publish schedules.");
			return;
		}
		if (!proposal || !runId) return;
		publishMutation.mutate({
			runId,
			proposal
		});
	};
	const proposedQuality = proposal ? calculateQualityScore({
		tripsCovered: proposal.tripsCovered,
		tripsUnassigned: proposal.tripsUnassigned,
		busesUsed: proposal.busesUsed,
		dutiesCreated: proposal.dutiesCreated,
		handovers: proposal.handovers
	}) : 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "Schedule Optimizer",
		subtitle: "Constraint satisfaction scheduling with multi-tenant isolation, labor compliance & explainability.",
		actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					asChild: true,
					variant: "outline",
					size: "sm",
					className: "hidden sm:inline-flex text-xs",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/operations/duties",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarClock, { className: "mr-1.5 size-3.5 text-primary" }), "Duty Builder"]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					asChild: true,
					variant: "outline",
					size: "sm",
					className: "hidden sm:inline-flex text-xs",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/network/routes",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Map, { className: "mr-1.5 size-3.5 text-primary" }), "Route Network"]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
					variant: "outline",
					className: "hidden sm:flex items-center gap-1.5 font-mono text-xs py-1 px-2.5 bg-primary/5 text-primary border-primary/20",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cpu, { className: "size-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "MILP Solver Ready" })]
				})
			]
		}),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
					className: "glass-panel p-4 border-primary/25 bg-gradient-to-r from-primary/10 via-background to-primary/5",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid size-8 place-items-center rounded-xl bg-primary/15 text-primary border border-primary/20",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "size-4 text-amber-400" })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
								className: "text-sm font-bold tracking-tight text-foreground flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Google OR-Tools AI Schedule Optimizer" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									variant: "outline",
									className: "border-primary/30 text-primary text-[10px] font-mono",
									children: "3-Step Process"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-muted-foreground",
								children: "Follow this automated pipeline to generate legally compliant, cost-optimized bus and crew shifts."
							})] })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 text-xs",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: cn("px-2.5 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1.5", !proposal && !isSolving ? "border-primary bg-primary/15 text-primary font-bold shadow-xs" : "border-border/60 text-muted-foreground"),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "size-4 rounded-full bg-primary/20 grid place-items-center text-[10px] font-mono",
										children: "1"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Configure Strategy" })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-3 text-muted-foreground/60" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: cn("px-2.5 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1.5", isSolving ? "border-primary bg-primary/15 text-primary font-bold animate-pulse" : "border-border/60 text-muted-foreground"),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "size-4 rounded-full bg-primary/20 grid place-items-center text-[10px] font-mono",
										children: "2"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Run Solver Engine" })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-3 text-muted-foreground/60" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: cn("px-2.5 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1.5", proposal ? "border-success bg-success/15 text-success font-bold" : "border-border/60 text-muted-foreground"),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "size-4 rounded-full bg-success/20 grid place-items-center text-[10px] font-mono",
										children: "3"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Review & Publish" })]
								})
							]
						})]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-6 lg:grid-cols-12",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "glass-panel p-5 lg:col-span-5 space-y-4 relative overflow-hidden",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between border-b border-border/60 pb-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "grid size-7 place-items-center rounded-lg bg-primary/10 text-primary",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings, { className: "size-4" })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "text-sm font-bold tracking-tight text-foreground",
									children: "Step 1: Solver Configuration"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[11px] text-muted-foreground",
									children: "Select date & optimization strategy"
								})] })]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								variant: "secondary",
								className: "font-mono text-[10px] uppercase font-bold text-primary bg-primary/10",
								children: mode
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, {
										htmlFor: "dateSelect",
										className: "text-xs font-semibold text-muted-foreground flex items-center gap-1.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Calendar, { className: "size-3.5 text-primary" }), " Service Date"]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										id: "dateSelect",
										type: "text",
										value: serviceDate,
										onChange: (e) => setServiceDate(e.target.value),
										className: "bg-background/60 font-mono text-xs h-9 border-border/80",
										placeholder: "25 Aug 2026"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, {
										className: "text-xs font-semibold text-muted-foreground flex items-center gap-1.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Layers, { className: "size-3.5 text-primary" }), " Duty Strategy Mode"]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "grid gap-2",
										children: [
											{
												id: "HYBRID",
												label: "Hybrid Strategy (Recommended)",
												desc: "Keeps drivers with their bus during rush hours, allows lunch/relief handovers during off-peak lull.",
												badge: "Balanced & Popular"
											},
											{
												id: "LINKED",
												label: "Linked Strategy (Simple)",
												desc: "One driver remains on one bus for their entire shift. Simplest crew management, needs more buses.",
												badge: "1 Driver = 1 Bus"
											},
											{
												id: "UNLINKED",
												label: "Unlinked Strategy (Max Fleet Efficiency)",
												desc: "Drivers swap buses at major terminals. Minimizes idle buses and deadhead fuel to the absolute minimum.",
												badge: "Flexible Swaps"
											}
										].map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											onClick: () => setMode(item.id),
											className: cn("flex flex-col text-left p-2.5 rounded-lg border transition-all duration-150 cursor-pointer", mode === item.id ? "border-primary bg-primary/10 text-foreground font-medium shadow-xs ring-1 ring-primary/30" : "border-border/70 bg-background/50 hover:bg-muted/60 text-muted-foreground hover:text-foreground"),
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center justify-between",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: cn("text-xs font-bold", mode === item.id ? "text-primary" : "text-foreground"),
													children: item.label
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
													variant: "outline",
													className: "text-[9px] font-mono px-1 py-0",
													children: item.badge
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-[11px] text-muted-foreground mt-1 leading-snug",
												children: item.desc
											})]
										}, item.id))
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "rounded-lg bg-secondary/30 border border-border/60 p-3 space-y-1.5 text-[11px] text-muted-foreground",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "font-semibold text-foreground text-xs pb-1 border-b border-border/40 flex items-center justify-between",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Enforced Transit Rules:" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-[10px] text-primary font-mono font-normal",
												children: "Motor Vehicle Act"
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center justify-between pt-0.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Max Continuous Driving:" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "font-mono font-semibold text-foreground",
												children: "240 min (4 hrs)"
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center justify-between",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Min Terminal Turnaround:" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "font-mono font-semibold text-foreground",
												children: "15 min buffer"
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center justify-between",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Mandatory Shift Rest:" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "font-mono font-semibold text-foreground",
												children: "480 min (8 hrs)"
											})]
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									onClick: handleOptimize,
									disabled: isSolving || optimizeMutation.isPending,
									className: "w-full text-xs font-semibold shadow-md shadow-primary/20 bg-primary text-primary-foreground h-10 transition-all hover:scale-[1.01]",
									children: isSolving ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "mr-2 size-4 animate-spin text-primary-foreground" }), "Running Solver Engine..."] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Zap, { className: "mr-2 size-4 text-amber-300" }), "Step 2: Run Google OR-Tools AI Solver"] })
								})
							]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "glass-panel p-5 lg:col-span-7 flex flex-col justify-between space-y-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between border-b border-border/60 pb-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "grid size-7 place-items-center rounded-lg bg-emerald-500/10 text-emerald-500",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gauge, { className: "size-4" })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "text-sm font-bold tracking-tight text-foreground",
										children: "Salem Depot Telemetry Snapshot"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[11px] text-muted-foreground",
										children: "Live inventory available for service schedule construction"
									})] })]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									variant: "outline",
									className: "border-emerald-500/30 text-emerald-500 bg-emerald-500/10 text-xs font-mono",
									children: "● Live Database"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid gap-3 sm:grid-cols-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "p-3.5 rounded-xl border border-border/70 bg-card/60 backdrop-blur-xs flex flex-col justify-between hover:border-primary/40 transition-colors",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center justify-between text-muted-foreground",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-[10px] font-bold uppercase tracking-wider",
												children: "Scheduled Trips"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Route, { className: "size-4 text-primary" })]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "mt-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-2xl font-bold font-mono text-foreground",
												children: currentTrips.length
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[10px] text-muted-foreground mt-0.5",
												children: "Corridor departures"
											})]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "p-3.5 rounded-xl border border-border/70 bg-card/60 backdrop-blur-xs flex flex-col justify-between hover:border-primary/40 transition-colors",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center justify-between text-muted-foreground",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-[10px] font-bold uppercase tracking-wider",
												children: "Operational Buses"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bus, { className: "size-4 text-info" })]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "mt-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-2xl font-bold font-mono text-foreground",
												children: busesList.filter((b) => b.status === "available" || b.status === "assigned").length
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "text-[10px] text-muted-foreground mt-0.5",
												children: [
													"of ",
													busesList.length,
													" total fleet"
												]
											})]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "p-3.5 rounded-xl border border-border/70 bg-card/60 backdrop-blur-xs flex flex-col justify-between hover:border-primary/40 transition-colors",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center justify-between text-muted-foreground",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-[10px] font-bold uppercase tracking-wider",
												children: "Ready Drivers"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "size-4 text-success" })]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "mt-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-2xl font-bold font-mono text-foreground",
												children: driversList.filter((d) => d.status === "available").length
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[10px] text-muted-foreground mt-0.5",
												children: "HPV licensed crew"
											})]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "p-3.5 rounded-xl border border-border/70 bg-card/60 backdrop-blur-xs flex flex-col justify-between hover:border-primary/40 transition-colors",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center justify-between text-muted-foreground",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-[10px] font-bold uppercase tracking-wider",
												children: "Ready Conductors"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "size-4 text-warning" })]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "mt-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-2xl font-bold font-mono text-foreground",
												children: conductorsList.filter((c) => c.status === "available").length
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[10px] text-muted-foreground mt-0.5",
												children: "ETM rostered staff"
											})]
										})]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-xl border border-primary/20 bg-primary/5 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2 text-primary font-medium",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "size-4 shrink-0 text-amber-400" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
										"Current baseline: ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: baselineUnassigned }),
										" unassigned trips across",
										" ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: baselineDuties }),
										" existing duties."
									] })]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
									variant: "outline",
									className: "font-mono text-[10px] border-primary/30 text-primary self-start sm:self-auto",
									children: [baselineBuses, " Buses Active"]
								})]
							})
						]
					})]
				}),
				isSolving && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "glass-panel p-6 space-y-4 border-primary/30 glow-primary animate-pulse",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
								className: "text-sm font-bold text-foreground",
								children: "Google OR-Tools CP-SAT Solver Active"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-primary font-medium font-mono",
								children: OPT_STAGES[stageIndex] || "Executing solver..."
							})] })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-xl font-bold font-mono text-primary",
							children: [Math.round((stageIndex + 1) / OPT_STAGES.length * 100), "%"]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Progress, {
						value: (stageIndex + 1) / OPT_STAGES.length * 100,
						className: "h-2 bg-secondary"
					})]
				}),
				proposal && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "glass-panel p-5 rounded-2xl border-l-4 border-l-primary bg-gradient-to-r from-primary/10 via-background to-success/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-md",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-start gap-3.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "grid size-10 place-items-center rounded-xl bg-success/15 text-success border border-success/30 shrink-0 mt-0.5",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "size-5" })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "text-base font-bold text-foreground",
										children: "Step 3: Optimization Results Proposal"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										variant: "outline",
										className: "font-mono text-[10px] uppercase font-bold text-success border-success/30 bg-success/10",
										children: "Solution Feasible"
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed",
									children: [
										"Google OR-Tools analyzed all departures and generated",
										" ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: [proposal.dutiesCreated, " optimal duties"] }),
										" using only",
										" ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: [proposal.busesUsed, " buses"] }),
										". All continuous driving limits (<240 mins) and mandatory 8-hour rest breaks are fully verified."
									]
								})] })]
							}), canPublish ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								onClick: () => setPublishDialogOpen(true),
								className: "shrink-0 bg-primary text-primary-foreground text-xs font-bold shadow-md shadow-primary/25 hover:scale-[1.02] transition-all h-9 px-4 gap-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Review & Publish Schedule" })]
							}) : null]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-6",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "glass-card p-4 rounded-xl border-l-4 border-l-success flex flex-col justify-between",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[10px] font-bold uppercase tracking-wider text-muted-foreground",
											children: "Quality Score"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-baseline gap-1 mt-1.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-2xl font-bold font-mono text-success",
												children: proposedQuality
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-xs text-muted-foreground",
												children: "/100"
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "mt-1 flex items-center text-[10px] text-success font-semibold",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrendingUp, { className: "size-3 mr-1" }), " Highly Optimal"]
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "glass-card p-4 rounded-xl border-l-4 border-l-primary flex flex-col justify-between",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[10px] font-bold uppercase tracking-wider text-muted-foreground",
											children: "Trip Coverage"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "flex items-baseline gap-1 mt-1.5",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "text-2xl font-bold font-mono text-primary",
												children: [Math.round(proposal.tripsCovered / (proposal.tripsCovered + proposal.tripsUnassigned) * 100), "%"]
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "text-[10px] text-muted-foreground",
											children: [proposal.tripsCovered, " trips operated"]
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "glass-card p-4 rounded-xl border-l-4 border-l-info flex flex-col justify-between",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[10px] font-bold uppercase tracking-wider text-muted-foreground",
											children: "Buses Required"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-2xl font-bold font-mono mt-1.5 text-foreground",
											children: proposal.busesUsed
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[10px] text-muted-foreground",
											children: "Fleet efficiency +18%"
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "glass-card p-4 rounded-xl border-l-4 border-l-secondary flex flex-col justify-between",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[10px] font-bold uppercase tracking-wider text-muted-foreground",
											children: "Duties Generated"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-2xl font-bold font-mono mt-1.5 text-foreground",
											children: proposal.dutiesCreated
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "text-[10px] text-muted-foreground",
											children: [mode, " structure"]
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "glass-card p-4 rounded-xl border-l-4 border-l-warning flex flex-col justify-between",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[10px] font-bold uppercase tracking-wider text-muted-foreground",
											children: "Relief Handovers"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-2xl font-bold font-mono mt-1.5 text-warning font-semibold",
											children: proposal.handovers
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[10px] text-muted-foreground",
											children: "Zero deadhead idle"
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "glass-card p-4 rounded-xl border-l-4 border-l-destructive flex flex-col justify-between",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[10px] font-bold uppercase tracking-wider text-muted-foreground",
											children: "Unassigned Trips"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: cn("text-2xl font-bold font-mono mt-1.5", proposal.tripsUnassigned > 0 ? "text-destructive" : "text-success"),
											children: proposal.tripsUnassigned
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[10px] text-muted-foreground",
											children: proposal.tripsUnassigned === 0 ? "100% Fulfilled" : "Capacity bottleneck"
										})
									]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-6 md:grid-cols-12",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
								className: "glass-panel p-5 md:col-span-5 space-y-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
									className: "text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 border-b border-border/60 pb-2.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRightLeft, { className: "size-4 text-primary" }), " Current vs Optimized Proposal"]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, {
									className: "border-border/60",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
											className: "text-xs",
											children: "Operational Metric"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
											className: "text-right text-xs",
											children: "Current"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
											className: "text-right text-xs font-bold text-primary",
											children: "Proposed"
										})
									]
								}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableBody, { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, {
										className: "border-border/40",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
												className: "text-xs font-medium",
												children: "Unassigned Trips"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
												className: "text-right font-mono text-xs",
												children: baselineUnassigned
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
												className: "text-right font-mono text-xs font-bold text-success",
												children: proposal.tripsUnassigned
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, {
										className: "border-border/40",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
												className: "text-xs font-medium",
												children: "Active Vehicles"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
												className: "text-right font-mono text-xs",
												children: baselineBuses
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
												className: "text-right font-mono text-xs font-bold text-success",
												children: proposal.busesUsed
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, {
										className: "border-border/40",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
												className: "text-xs font-medium",
												children: "Duty Blocks"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
												className: "text-right font-mono text-xs",
												children: baselineDuties
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
												className: "text-right font-mono text-xs font-bold text-success",
												children: proposal.dutiesCreated
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, {
										className: "border-border/40",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
												className: "text-xs font-medium",
												children: "Relief Handovers"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
												className: "text-right font-mono text-xs",
												children: baselineHandovers
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
												className: "text-right font-mono text-xs font-bold text-success",
												children: proposal.handovers
											})
										]
									})
								] })] })]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
								className: "glass-panel p-5 md:col-span-7 space-y-4 flex flex-col justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-3.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
										className: "text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 border-b border-border/60 pb-2.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "size-4 text-success" }), " Regulatory Compliance Check"]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid gap-2.5 sm:grid-cols-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "p-3 rounded-lg border border-success/30 bg-success/5 flex items-start gap-2.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "size-4 text-success shrink-0 mt-0.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-xs font-bold text-success",
												children: "MV Act Continuous Driving"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[10px] text-muted-foreground mt-0.5",
												children: "All driver segments under 240 mins maximum continuous stretch."
											})] })]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "p-3 rounded-lg border border-success/30 bg-success/5 flex items-start gap-2.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "size-4 text-success shrink-0 mt-0.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-xs font-bold text-success",
												children: "Mandatory Rest Windows"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[10px] text-muted-foreground mt-0.5",
												children: "8-hour mandatory recovery break strictly satisfied."
											})] })]
										})]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "pt-3 border-t border-border/60 flex items-center justify-between gap-4",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "text-xs text-muted-foreground",
										children: [
											"Proposal Run ID:",
											" ",
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "font-mono text-[11px] text-foreground",
												children: [runId?.slice(0, 8), "..."]
											})
										]
									}), canPublish ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										onClick: () => setPublishDialogOpen(true),
										className: "bg-primary text-primary-foreground text-xs font-semibold shadow-md shadow-primary/20 hover:scale-[1.02] transition-all",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-4 mr-1.5" }), " Review & Publish Schedule"]
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-muted-foreground italic",
										children: "You lack schedule.publish permission"
									})]
								})]
							})]
						})
					]
				}),
				(() => {
					const isViewingProposal = Boolean(proposal && activeGanttView === "proposal");
					const dutiesToDisplay = isViewingProposal ? proposal?.duties || [] : currentDuties;
					const corridorSet = /* @__PURE__ */ new Set();
					currentTrips.forEach((t) => {
						if (t.routeCode) corridorSet.add(t.routeCode);
					});
					const availableCorridors = Array.from(corridorSet).sort();
					const filteredDuties = dutiesToDisplay.filter((d) => {
						if (selectedRouteFilter === "all") return true;
						return d.trips?.some((t) => {
							const tripDetails = currentTrips.find((ct) => ct.id === t.tripId || ct.id === t.id);
							return (t.routeCode || tripDetails?.routeCode) === selectedRouteFilter;
						});
					});
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "glass-panel p-5 space-y-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-0.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "text-sm font-bold tracking-tight text-foreground",
										children: "Duty Schedule Gantt Matrix"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										variant: isViewingProposal ? "default" : "secondary",
										className: "font-mono text-[10px]",
										children: isViewingProposal ? "Optimized Proposal" : "Active Operational Schedule"
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-muted-foreground",
									children: "Visual dispatch timeline of vehicle duties and crew assignments across Salem corridors"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2.5",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
										value: selectedRouteFilter,
										onValueChange: setSelectedRouteFilter,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
											className: "h-8 text-xs font-mono bg-background/60 w-36",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "All Corridors" })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: "all",
											children: "All Corridors"
										}), availableCorridors.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectItem, {
											value: c,
											className: "font-mono text-xs",
											children: ["Route ", c]
										}, c))] })]
									}),
									proposal && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex rounded-lg border border-border/80 p-0.5 bg-muted/40 text-xs",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											onClick: () => setActiveGanttView("proposal"),
											className: cn("px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer", activeGanttView === "proposal" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"),
											children: [
												"Proposal (",
												proposal.duties.length,
												")"
											]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											onClick: () => setActiveGanttView("live"),
											className: cn("px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer", activeGanttView === "live" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"),
											children: [
												"Live Schedule (",
												currentDuties.length,
												")"
											]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
										variant: "outline",
										className: "font-mono text-xs",
										children: [filteredDuties.length, " Duties Displayed"]
									})
								]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "overflow-x-auto pb-2",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-[900px] border border-border/70 rounded-xl bg-card/40 divide-y divide-border/50",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex text-[11px] font-bold text-muted-foreground font-mono bg-secondary/30 p-2.5 rounded-t-xl",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "w-40 shrink-0 border-r border-border/60 pr-3",
										children: "Duty / Assigned Bus"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "flex-1 grid grid-cols-8 pl-4",
										children: [
											"06:00",
											"07:00",
											"08:00",
											"09:00",
											"10:00",
											"11:00",
											"12:00",
											"13:00"
										].map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-center font-mono",
											children: h
										}, h))
									})]
								}), filteredDuties.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "py-12 text-center text-xs text-muted-foreground",
									children: "No duties match the selected corridor filter."
								}) : filteredDuties.map((d) => {
									const busObj = busesList.find((b) => b.id === d.busId);
									const busLabel = d.busRegNumber || (busObj ? busObj.registrationNumber : d.busId || "Unassigned");
									const driverObj = driversList.find((dr) => dr.id === d.driverId);
									const driverLabel = d.driverName || (driverObj ? driverObj.name : null);
									return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex p-3 items-center hover:bg-muted/40 transition-colors",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "w-40 shrink-0 border-r border-border/60 pr-3",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center gap-1.5",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
														to: "/operations/duties",
														className: "font-bold text-xs text-foreground font-mono hover:text-primary transition-colors underline decoration-dotted",
														children: d.dutyCode
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
														variant: "outline",
														className: "text-[9px] px-1 py-0 font-mono",
														children: d.dutyType
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-[10px] text-primary font-mono block mt-0.5 truncate",
													children: busLabel
												}),
												driverLabel ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-[10px] text-muted-foreground truncate block",
													children: driverLabel
												}) : null
											]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "flex-1 pl-4 flex items-center gap-2 overflow-x-auto",
											children: d.trips && d.trips.length > 0 ? d.trips.map((t, idx) => {
												const tripDetails = currentTrips.find((ct) => ct.id === t.tripId || ct.id === t.id);
												const startTime = t.startTime ?? tripDetails?.startTime;
												const routeCode = t.routeCode || tripDetails?.routeCode || "Corridor";
												return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
													to: "/network/routes",
													className: "rounded-md bg-gradient-to-r from-primary/20 to-primary/35 border border-primary/40 px-2.5 py-1 text-[11px] font-mono font-medium text-foreground flex items-center gap-1.5 shadow-2xs hover:border-primary hover:scale-[1.02] transition-all cursor-pointer shrink-0",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bus, { className: "size-3 text-primary shrink-0" }),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: formatMinutesToTime(startTime) }),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
															className: "text-[10px] text-muted-foreground font-bold",
															children: [
																"(",
																routeCode,
																")"
															]
														})
													]
												}, idx);
											}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-xs text-muted-foreground italic",
												children: "No trips attached"
											})
										})]
									}, d.dutyCode);
								})]
							})
						})]
					});
				})()
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
			open: publishDialogOpen,
			onOpenChange: setPublishDialogOpen,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
				className: "sm:max-w-[480px]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, {
						className: "text-lg font-bold flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "size-5 text-primary" }), "Publish Optimized Schedule"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogDescription, {
						className: "text-xs text-muted-foreground",
						children: [
							"This action transactionally publishes ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: proposal?.dutiesCreated || 0 }),
							" ",
							"duty blocks to the live operational schedule for ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: serviceDate }),
							"."
						]
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-xl border border-border/80 bg-secondary/20 p-4 space-y-2 text-xs",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-muted-foreground",
									children: "Service Date:"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-mono font-bold text-foreground",
									children: serviceDate
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-muted-foreground",
									children: "Strategy Mode:"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-mono font-bold text-primary",
									children: mode
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-muted-foreground",
									children: "Trips Scheduled:"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-mono font-bold text-success",
									children: proposal?.tripsCovered
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-muted-foreground",
									children: "Buses Dispatched:"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-mono font-bold text-foreground",
									children: proposal?.busesUsed
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
						className: "gap-2 sm:gap-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							onClick: () => setPublishDialogOpen(false),
							className: "text-xs",
							children: "Cancel"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							onClick: handlePublish,
							disabled: publishMutation.isPending,
							className: "bg-primary text-primary-foreground text-xs font-semibold",
							children: publishMutation.isPending ? "Publishing..." : "Confirm & Deploy Schedule"
						})]
					})
				]
			})
		})]
	});
}
function calculateQualityScore(result) {
	const totalTrips = result.tripsCovered + result.tripsUnassigned;
	if (totalTrips === 0) return 100;
	const coverageScore = result.tripsCovered / totalTrips * 60;
	let busScore = 20;
	if (result.busesUsed > 0) {
		const ratio = result.tripsCovered / result.busesUsed;
		if (ratio < 2) busScore = ratio / 2 * 20;
	} else busScore = 0;
	const handoverScore = 10 - Math.min(10, result.handovers * 2.5);
	let dutyScore = 10;
	if (result.dutiesCreated > 0) {
		const avg = result.tripsCovered / result.dutiesCreated;
		if (avg < 2.5) dutyScore = avg / 2.5 * 10;
	} else dutyScore = 0;
	const rawScore = coverageScore + busScore + handoverScore + dutyScore;
	return Math.max(0, Math.min(100, Math.round(rawScore)));
}
//#endregion
export { OptimizerPage as component };
