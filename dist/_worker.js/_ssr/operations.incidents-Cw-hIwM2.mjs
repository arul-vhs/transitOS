import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { f as require_jsx_runtime } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { n as cn, t as Button } from "./button-BnVgmmWP.mjs";
import { t as hasPermission } from "./auth-shared-CAbXQXMK.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { B as LoaderCircle, D as Plus, Ot as ArrowDown, Z as Flame, _t as Bus, c as TriangleAlert, ct as CircleCheckBig, kt as Activity, p as Sparkles, pt as Check, st as CircleCheck, v as ShieldAlert } from "../_libs/lucide-react.mjs";
import { n as Route$27 } from "./router-9Rnl3R3s.mjs";
import { i as Badge, t as AppShell } from "./app-shell-CxpRo8VR.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-CrkmWf-u.mjs";
import { t as Label } from "./label-B3t-BMxc.mjs";
import { s as getRoutes } from "./routes-gis-fns-BrjITXAP.mjs";
import { c as getDrivers, i as getBuses } from "./fleet-crew-BrnJaW4J.mjs";
import { t as Input } from "./input-DHIRLsgR.mjs";
import { a as DialogHeader, i as DialogFooter, n as DialogContent, o as DialogTitle, r as DialogDescription, t as Dialog } from "./dialog-BY3bl4Fh.mjs";
import { d as getTrips } from "./scheduling-fns-B2JRDpvw.mjs";
import { a as getIncidents, i as getIncidentDetails, n as createIncident, o as resolveIncident, r as generateRecoveryProposals, t as approveRecoveryProposal } from "./rescheduling-fns-DVTz89rd.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/operations.incidents-Cw-hIwM2.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var DEFAULT_DATE = "25 Aug 2026";
function formatMinutesToTime(totalMin) {
	const hh = Math.floor(totalMin / 60);
	const mm = totalMin % 60;
	return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}
function IncidentsPage() {
	const queryClient = useQueryClient();
	const user = Route$27.useRouteContext()?.user;
	const canGenerate = hasPermission(user?.role || "", "schedule.generate");
	const canPublish = hasPermission(user?.role || "", "schedule.publish");
	const [selectedIncidentId, setSelectedIncidentId] = (0, import_react.useState)(null);
	const [showReportDialog, setShowReportDialog] = (0, import_react.useState)(false);
	const [type, setType] = (0, import_react.useState)("BUS_BREAKDOWN");
	const [severity, setSeverity] = (0, import_react.useState)("medium");
	const [resourceType, setResourceType] = (0, import_react.useState)("bus");
	const [resourceId, setResourceId] = (0, import_react.useState)("");
	const [tripId, setTripId] = (0, import_react.useState)("");
	const [routeId, setRouteId] = (0, import_react.useState)("");
	const [startTime, setStartTime] = (0, import_react.useState)(500);
	const [expectedEndTime, setExpectedEndTime] = (0, import_react.useState)(740);
	const [locationName, setLocationName] = (0, import_react.useState)("");
	const [descriptionText, setDescriptionText] = (0, import_react.useState)("");
	const { data: incidentsList = [], isLoading: listLoading } = useQuery({
		queryKey: ["incidents-list", DEFAULT_DATE],
		queryFn: () => getIncidents({ serviceDate: DEFAULT_DATE })
	});
	const { data: selectedIncident, isLoading: detailsLoading } = useQuery({
		queryKey: ["incident-details", selectedIncidentId],
		queryFn: () => getIncidentDetails(selectedIncidentId),
		enabled: !!selectedIncidentId
	});
	const { data: busesList = [] } = useQuery({
		queryKey: ["buses-dropdown"],
		queryFn: () => getBuses()
	});
	const { data: driversList = [] } = useQuery({
		queryKey: ["drivers-dropdown"],
		queryFn: () => getDrivers()
	});
	const { data: tripsList = [] } = useQuery({
		queryKey: ["trips-dropdown"],
		queryFn: () => getTrips({ serviceDate: DEFAULT_DATE })
	});
	const { data: routesList = [] } = useQuery({
		queryKey: ["routes-dropdown"],
		queryFn: () => getRoutes()
	});
	const createIncidentMutation = useMutation({
		mutationFn: createIncident,
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: ["incidents-list"] });
			queryClient.invalidateQueries({ queryKey: ["today-incidents"] });
			setSelectedIncidentId(data.incident.id);
			setShowReportDialog(false);
			toast.success("Disruption incident logged and impacts pre-analyzed.");
		},
		onError: (err) => {
			toast.error(err.message || "Failed to log incident");
		}
	});
	const generateProposalsMutation = useMutation({
		mutationFn: generateRecoveryProposals,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["incident-details", selectedIncidentId] });
			toast.success("Recovery proposals generated successfully.");
		},
		onError: (err) => {
			toast.error(err.message || "Failed to generate recovery options");
		}
	});
	const approveProposalMutation = useMutation({
		mutationFn: approveRecoveryProposal,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["incident-details", selectedIncidentId] });
			queryClient.invalidateQueries({ queryKey: ["incidents-list"] });
			toast.success("Recovery action plan approved and applied transactionally!");
		},
		onError: (err) => {
			const errMsg = err.message || "Failed to apply recovery proposal";
			if (errMsg.includes("Operational state changed")) toast.error(errMsg, {
				action: {
					label: "Regenerate Now",
					onClick: () => {
						if (selectedIncidentId) generateProposalsMutation.mutate(selectedIncidentId);
					}
				},
				duration: 8e3
			});
			else toast.error(errMsg);
		}
	});
	const resolveIncidentMutation = useMutation({
		mutationFn: resolveIncident,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["incidents-list"] });
			queryClient.invalidateQueries({ queryKey: ["incident-details", selectedIncidentId] });
			toast.success("Incident status updated to RESOLVED.");
		}
	});
	if (incidentsList.length > 0 && !selectedIncidentId) setSelectedIncidentId(incidentsList[0].id);
	const handleReportIncident = (e) => {
		e.preventDefault();
		if (!canGenerate) {
			toast.error("Permissions denied to log incidents.");
			return;
		}
		createIncidentMutation.mutate({
			type,
			severity,
			serviceDate: DEFAULT_DATE,
			resourceType: resourceType === "none" ? null : resourceType,
			resourceId: resourceId || null,
			tripId: tripId || null,
			routeId: routeId || null,
			startTime: Number(startTime),
			expectedEndTime: expectedEndTime ? Number(expectedEndTime) : null,
			location: locationName || null,
			description: descriptionText || null
		});
	};
	const proposals = (selectedIncident?.reschedulingRuns?.[0])?.proposals || [];
	const recommendedProposalId = [...proposals].sort((a, b) => Number(a.objectiveScore) - Number(b.objectiveScore))[0]?.id;
	const selectedIncidentObj = selectedIncident;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "Disruption Recovery Manager",
		subtitle: "Algorithmic incident triage, passenger delay containment, and automated multi-option recovery schedules.",
		actions: canGenerate && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
			onClick: () => setShowReportDialog(true),
			size: "sm",
			className: "bg-destructive text-destructive-foreground font-semibold shadow-md shadow-destructive/20 text-xs hover:scale-[1.02] transition-all",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "mr-1.5 size-4" }), " Report Disruption"]
		}),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-xl border border-destructive/25 bg-gradient-to-r from-destructive/10 via-background to-primary/5 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-2xs",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid size-8 place-items-center rounded-lg bg-destructive/15 text-destructive shrink-0 mt-0.5",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "size-4" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "font-bold text-foreground flex items-center gap-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Disruption Recovery Workflow" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							variant: "outline",
							className: "text-[9px] font-mono border-destructive/40 text-destructive bg-destructive/10",
							children: "Incident Radar"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-muted-foreground mt-0.5 leading-relaxed",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Step 1:" }),
							" Log or select an active breakdown. ➔",
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Step 2:" }),
							" TransitOS evaluates cascade impacts across all downline trips and computes automated recovery options (short-turns, vehicle swaps, or deadhead injection)."
						]
					})] })]
				}), canGenerate && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					onClick: () => setShowReportDialog(true),
					size: "sm",
					className: "shrink-0 bg-destructive text-destructive-foreground font-semibold shadow-md shadow-destructive/20 text-xs hover:scale-[1.02] transition-all gap-1.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Report Disruption" })]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-6 lg:grid-cols-12",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "lg:col-span-4 space-y-4",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "glass-panel p-4 space-y-3 flex flex-col h-[740px]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between border-b border-border/60 pb-2.5 px-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									variant: "secondary",
									className: "font-mono text-[9px] font-bold text-destructive bg-destructive/15 px-1 py-0",
									children: "Step 1"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
									className: "text-xs font-bold uppercase tracking-wider text-foreground",
									children: [
										"Active Disruptions (",
										incidentsList.length,
										")"
									]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								variant: "outline",
								className: "text-[10px] font-mono",
								children: DEFAULT_DATE
							})]
						}), listLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "py-20 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2 flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-5 animate-spin text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Loading disruptions log..." })]
						}) : incidentsList.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "py-20 text-center text-xs text-muted-foreground italic flex-1 flex flex-col items-center justify-center p-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheckBig, { className: "size-8 text-emerald-500/60 mb-2" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-semibold text-foreground",
									children: "No Incidents Logged"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[11px] text-muted-foreground mt-0.5",
									children: "Click 'Report Disruption' to record an incident."
								})
							]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "space-y-2.5 overflow-y-auto flex-1 pr-1",
							children: incidentsList.map((inc) => {
								const isSelected = selectedIncidentId === inc.id;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									onClick: () => setSelectedIncidentId(inc.id),
									className: cn("w-full p-3 rounded-xl border text-left transition-all duration-150 flex flex-col gap-2 cursor-pointer", isSelected ? "border-destructive bg-destructive/10 shadow-xs ring-1 ring-destructive/30" : "border-border/70 bg-card/60 hover:bg-muted/60"),
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex justify-between items-center gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
												variant: "outline",
												className: cn("text-[9px] uppercase font-bold font-mono px-1.5 py-0", inc.severity === "critical" ? "border-destructive/40 text-destructive bg-destructive/10" : "border-warning/40 text-warning bg-warning/10"),
												children: inc.type.replace("_", " ")
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-[10px] font-mono text-muted-foreground",
												children: formatMinutesToTime(inc.startTime)
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs font-bold truncate text-foreground",
											children: inc.description || "Operational disruption reported on vehicle/crew."
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex justify-between items-center text-[10px] text-muted-foreground font-mono pt-1 border-t border-border/40",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
												"Status:",
												" ",
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
													className: "text-foreground uppercase",
													children: inc.status
												})
											] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: cn("font-bold uppercase", inc.severity === "critical" ? "text-destructive" : "text-warning"),
												children: inc.severity
											})]
										})
									]
								}, inc.id);
							})
						})]
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "lg:col-span-8 space-y-6",
					children: detailsLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "glass-panel p-24 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-6 animate-spin text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Analyzing disruption chain..." })]
					}) : !selectedIncidentObj ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "glass-panel p-24 text-center text-xs text-muted-foreground flex flex-col items-center justify-center",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldAlert, { className: "size-10 text-muted-foreground/40 mb-2" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-semibold text-foreground",
								children: "No Disruption Selected"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[11px] text-muted-foreground mt-0.5",
								children: "Select an incident from the left to inspect downline impacts."
							})
						]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-6",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
								className: "glass-panel p-5 space-y-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-wrap justify-between items-start gap-4 border-b border-border/60 pb-3.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2.5",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
												className: "text-lg font-bold text-foreground font-mono",
												children: selectedIncidentObj.type.replace("_", " ")
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
												variant: "outline",
												className: cn("uppercase text-[9px] font-mono font-bold", selectedIncidentObj.severity === "critical" ? "border-destructive/40 text-destructive bg-destructive/10" : "border-warning/40 text-warning bg-warning/10"),
												children: [selectedIncidentObj.severity, " Severity"]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
												variant: "secondary",
												className: "uppercase text-[9px] font-bold",
												children: selectedIncidentObj.status
											})
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-xs text-muted-foreground mt-1",
										children: [
											"Logged at ",
											formatMinutesToTime(selectedIncidentObj.startTime),
											" · Location:",
											" ",
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
												className: "text-foreground",
												children: selectedIncidentObj.location || "En Route Corridor"
											})
										]
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex gap-2",
										children: [canGenerate && selectedIncidentObj.status !== "APPLIED" && selectedIncidentObj.status !== "RESOLVED" && selectedIncidentObj.status !== "CANCELLED" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											onClick: () => generateProposalsMutation.mutate(selectedIncidentObj.id),
											disabled: generateProposalsMutation.isPending,
											size: "sm",
											className: "bg-primary text-primary-foreground text-xs font-semibold shadow-md shadow-primary/20",
											children: generateProposalsMutation.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "mr-1.5 size-3.5 animate-spin" }), " Solving..."] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "mr-1.5 size-3.5" }), proposals.length > 0 ? "Regenerate Options" : "Solve Disruption"] })
										}) : null, selectedIncidentObj.status !== "RESOLVED" && selectedIncidentObj.status !== "CANCELLED" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											onClick: () => resolveIncidentMutation.mutate(selectedIncidentObj.id),
											disabled: resolveIncidentMutation.isPending,
											variant: "outline",
											size: "sm",
											className: "text-xs text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-3.5 mr-1" }), " Mark Resolved"]
										})]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid gap-3 sm:grid-cols-3 text-xs bg-secondary/30 rounded-xl p-3 border border-border/60",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[10px] uppercase font-bold text-muted-foreground",
											children: "Resource Affected:"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "font-mono font-bold text-foreground mt-0.5",
											children: [
												selectedIncidentObj.resourceType === "bus" ? "Bus Vehicle" : "Crew Member",
												" ",
												"(",
												selectedIncidentObj.resourceId || "N/A",
												")"
											]
										})] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[10px] uppercase font-bold text-muted-foreground",
											children: "Expected Duration:"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "font-mono font-bold text-foreground mt-0.5",
											children: selectedIncidentObj.expectedEndTime ? `${selectedIncidentObj.expectedEndTime - selectedIncidentObj.startTime} mins` : "Indefinite"
										})] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[10px] uppercase font-bold text-muted-foreground",
											children: "Description:"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-muted-foreground mt-0.5 italic truncate",
											children: selectedIncidentObj.description || "Standard delay logged"
										})] })
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
								className: "glass-panel p-5 space-y-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
									className: "text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Activity, { className: "size-4 text-warning" }), " Disruption Downstream Propagation Chain"]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-col gap-2.5 max-w-xl mx-auto py-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "p-3.5 rounded-xl border border-destructive/30 bg-destructive/5 flex items-center gap-3",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "size-8 rounded-lg bg-destructive/10 text-destructive grid place-items-center shrink-0",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flame, { className: "size-4.5" })
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "text-xs font-bold text-destructive",
												children: ["Origin Incident: ", selectedIncidentObj.type]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "text-[10px] text-muted-foreground mt-0.5",
												children: [
													"Reported at ",
													formatMinutesToTime(selectedIncidentObj.startTime),
													" at",
													" ",
													selectedIncidentObj.location || "Salem Corridor"
												]
											})] })]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "flex justify-center my-0.5",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowDown, { className: "size-4 text-muted-foreground/60" })
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "p-3.5 rounded-xl border border-border/70 bg-card/60 flex items-center gap-3",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "size-8 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bus, { className: "size-4.5" })
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-xs font-bold text-foreground",
												children: "Direct Resource Immobilized"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[10px] text-muted-foreground mt-0.5",
												children: "Assigned duty block trips blocked from subsequent on-time departure"
											})] })]
										}),
										selectedIncidentObj.impacts?.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "flex justify-center my-0.5",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowDown, { className: "size-4 text-muted-foreground/60" })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "p-3.5 rounded-xl border border-warning/30 bg-warning/5 space-y-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-2 text-xs font-bold text-warning",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
													"Downstream Cascade Impact (",
													selectedIncidentObj.impacts.length,
													" trips affected)"
												] })]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "divide-y divide-border/40 text-[11px] text-muted-foreground",
												children: selectedIncidentObj.impacts.map((imp) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "py-1.5 flex justify-between gap-4 font-mono",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
														"Trip ",
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: imp.trip?.tripCode || "Departure" }),
														" (",
														imp.impactType,
														")"
													] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "font-bold text-warning uppercase text-[10px]",
														children: imp.impactLevel
													})]
												}, imp.id))
											})]
										})] })
									]
								})]
							}),
							proposals.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
								className: "glass-panel p-5 space-y-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between border-b border-border/60 pb-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
											variant: "secondary",
											className: "font-mono text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-1 py-0",
											children: "Step 2"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "text-sm font-bold tracking-tight text-foreground",
											children: "Algorithmic Recovery Options"
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-xs text-muted-foreground mt-0.5",
										children: [
											"Compare options and click ",
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Approve & Dispatch" }),
											" to apply the selected solution live."
										]
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
											variant: "outline",
											className: "font-mono text-xs text-primary border-primary/30",
											children: [proposals.length, " Proposals Generated"]
										}), canGenerate && selectedIncidentObj.status !== "APPLIED" && selectedIncidentObj.status !== "RESOLVED" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											onClick: () => generateProposalsMutation.mutate(selectedIncidentObj.id),
											disabled: generateProposalsMutation.isPending,
											size: "sm",
											variant: "outline",
											className: "text-xs h-7 gap-1",
											children: [generateProposalsMutation.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-3 animate-spin text-primary" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "size-3 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Regenerate" })]
										})]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "grid gap-4 md:grid-cols-3",
									children: proposals.map((prop) => {
										const isRecommended = prop.id === recommendedProposalId;
										return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: cn("p-4 rounded-xl border flex flex-col justify-between relative transition-all duration-150", isRecommended ? "border-emerald-500/50 bg-emerald-500/5 shadow-md shadow-emerald-500/5 ring-1 ring-emerald-500/30" : "border-border/70 bg-card/60 hover:border-border"),
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "space-y-3",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex items-start justify-between gap-1",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
															className: "text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono",
															children: ["Option ", prop.proposalNumber]
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
															className: "text-lg font-bold font-mono mt-0.5 text-primary",
															children: ["Score: ", prop.objectiveScore]
														})] }), isRecommended ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
															className: "bg-emerald-600 text-white hover:bg-emerald-600 text-[9px] font-mono font-bold px-1.5 py-0.5",
															children: "Recommended"
														}) : prop.cancellations === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
															variant: "outline",
															className: "text-[9px] font-mono text-emerald-600 border-emerald-500/40 px-1 py-0",
															children: "0 Cancellations"
														}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
															variant: "outline",
															className: "text-[9px] font-mono text-muted-foreground px-1 py-0",
															children: "Alternative"
														})]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "space-y-1.5 text-xs border-y border-border/60 py-2.5 my-2 font-mono",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "flex justify-between",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																	className: "text-muted-foreground",
																	children: "Trips Recovered:"
																}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																	className: "font-bold text-emerald-600 dark:text-emerald-400",
																	children: prop.tripsRecovered
																})]
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "flex justify-between",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																	className: "text-muted-foreground",
																	children: "Cancellations:"
																}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																	className: cn("font-bold", prop.cancellations > 0 ? "text-destructive" : "text-emerald-500"),
																	children: prop.cancellations
																})]
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "flex justify-between",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																	className: "text-muted-foreground",
																	children: "Relief Handovers:"
																}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																	className: "font-bold text-foreground",
																	children: prop.handovers
																})]
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "flex justify-between",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																	className: "text-muted-foreground",
																	children: "Reserve Buses:"
																}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																	className: "font-bold text-foreground",
																	children: prop.busesUsed
																})]
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "flex justify-between",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																	className: "text-muted-foreground",
																	children: "Net Delay:"
																}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																	className: "font-bold text-warning",
																	children: [prop.delayMinutes, " min"]
																})]
															})
														]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
														className: "text-[11px] text-muted-foreground leading-relaxed italic bg-muted/30 p-2 rounded-lg border border-border/50",
														children: [
															"\"",
															prop.explanation,
															"\""
														]
													})
												]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "pt-4 mt-auto",
												children: canPublish ? prop.status === "APPLIED" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
													disabled: true,
													className: "w-full text-xs font-semibold h-8.5 bg-emerald-600 text-white opacity-100",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "mr-1.5 size-3.5" }), " Applied & Dispatched"]
												}) : selectedIncidentObj.status === "APPLIED" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
													disabled: true,
													variant: "outline",
													className: "w-full text-xs font-semibold h-8.5 text-muted-foreground",
													children: "Superseded"
												}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
													onClick: () => approveProposalMutation.mutate({ proposalId: prop.id }),
													disabled: approveProposalMutation.isPending || generateProposalsMutation.isPending,
													className: cn("w-full text-xs font-semibold h-8.5 cursor-pointer", isRecommended ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-500/20" : ""),
													variant: isRecommended ? "default" : "outline",
													children: approveProposalMutation.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "mr-1.5 size-3.5 animate-spin" }),
														" ",
														"Applying..."
													] }) : "Approve & Dispatch"
												}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-[10px] text-center text-muted-foreground italic",
													children: "Lacks schedule.publish permission"
												})
											})]
										}, prop.id);
									})
								})]
							})
						]
					})
				})]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
			open: showReportDialog,
			onOpenChange: setShowReportDialog,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogContent, {
				className: "sm:max-w-[480px]",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					onSubmit: handleReportIncident,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, {
							className: "text-base font-bold flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "size-4 text-destructive" }), "Report Operational Disruption"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, {
							className: "text-xs text-muted-foreground",
							children: "Record an incident to compute downstream ripple effects and recovery options."
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
											children: "Disruption Category"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
											value: type,
											onValueChange: setType,
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
												className: "text-xs font-mono",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "BUS_BREAKDOWN",
													children: "Bus Mechanical Breakdown"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "TRAFFIC_DELAY",
													children: "Heavy Corridor Traffic"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "CREW_ABSENCE",
													children: "Crew Medical Absence"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "ACCIDENT",
													children: "Corridor Collision / Blockage"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "ROAD_BLOCK",
													children: "Road Closure / Detour"
												})
											] })]
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-1.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											className: "text-xs",
											children: "Incident Severity"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
											value: severity,
											onValueChange: (val) => setSeverity(val),
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
												className: "text-xs font-mono",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "low",
													children: "Low (Minor Delay)"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "medium",
													children: "Medium (Trip Impact)"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "high",
													children: "High (Corridor Blocked)"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "critical",
													children: "Critical (Fleet Grounded)"
												})
											] })]
										})]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										className: "text-xs",
										children: "Location / Road Milestone"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										type: "text",
										placeholder: "e.g. Salem 4-Roads Junction",
										value: locationName,
										onChange: (e) => setLocationName(e.target.value),
										className: "text-xs",
										required: true
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-2 gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-1.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											className: "text-xs",
											children: "Impact Start Time"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											type: "time",
											value: formatMinutesToTime(startTime),
											onChange: (e) => setStartTime(parseTimeToMinutes(e.target.value)),
											className: "font-mono text-xs",
											required: true
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-1.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											className: "text-xs",
											children: "Expected Clearance Time"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											type: "time",
											value: formatMinutesToTime(expectedEndTime || startTime + 120),
											onChange: (e) => setExpectedEndTime(parseTimeToMinutes(e.target.value)),
											className: "font-mono text-xs"
										})]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										className: "text-xs",
										children: "Incident Notes / Details"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										type: "text",
										placeholder: "e.g. Radiator overheat; bus stopped at platform 3",
										value: descriptionText,
										onChange: (e) => setDescriptionText(e.target.value),
										className: "text-xs"
									})]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "outline",
							onClick: () => setShowReportDialog(false),
							className: "text-xs",
							children: "Cancel"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "submit",
							disabled: createIncidentMutation.isPending,
							className: "bg-destructive text-destructive-foreground text-xs font-semibold",
							children: createIncidentMutation.isPending ? "Logging..." : "Record Disruption"
						})] })
					]
				})
			})
		})]
	});
}
function parseTimeToMinutes(timeStr) {
	const [hStr, mStr] = timeStr.split(":");
	return Number(hStr || 0) * 60 + Number(mStr || 0);
}
//#endregion
export { IncidentsPage as component };
