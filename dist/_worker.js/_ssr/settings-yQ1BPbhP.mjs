import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { f as require_jsx_runtime } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { t as Button } from "./button-BnVgmmWP.mjs";
import { t as hasPermission } from "./auth-shared-CAbXQXMK.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { S as Save, _ as ShieldCheck, bt as Bell, rt as Clock, tt as Cpu, vt as Building2 } from "../_libs/lucide-react.mjs";
import { a as TabsList, i as TabsContent, n as Route$27, o as TabsTrigger, r as Tabs } from "./router-9Rnl3R3s.mjs";
import { i as Badge, t as AppShell } from "./app-shell-CxpRo8VR.mjs";
import { t as Label } from "./label-B3t-BMxc.mjs";
import { t as Input } from "./input-DHIRLsgR.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/settings-yQ1BPbhP.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function SettingsPage() {
	const user = Route$27.useRouteContext()?.user;
	const canManage = hasPermission(user?.role || "", "organization.manage");
	const [orgName, setOrgName] = (0, import_react.useState)("Salem Transport Corporation");
	const [depotCode, setDepotCode] = (0, import_react.useState)("SLM-CENTRAL-01");
	const [timezone, setTimezone] = (0, import_react.useState)("Asia/Kolkata (IST +05:30)");
	const [contactEmail, setContactEmail] = (0, import_react.useState)("ops@salemtransport.gov.in");
	const [turnaroundBuffer, setTurnaroundBuffer] = (0, import_react.useState)("15");
	const [reliefWindow, setReliefWindow] = (0, import_react.useState)("20");
	const [garageDepartureBuffer, setGarageDepartureBuffer] = (0, import_react.useState)("10");
	const [maxContinuousDriving, setMaxContinuousDriving] = (0, import_react.useState)("240");
	const [mandatoryRest, setMandatoryRest] = (0, import_react.useState)("480");
	const [maxWeeklyHours, setMaxWeeklyHours] = (0, import_react.useState)("48");
	const [maxSpreadover, setMaxSpreadover] = (0, import_react.useState)("720");
	const [deadheadWeight, setDeadheadWeight] = (0, import_react.useState)("2.5");
	const [handoverWeight, setHandoverWeight] = (0, import_react.useState)("1.8");
	const [solverTimeout, setSolverTimeout] = (0, import_react.useState)("120");
	const [incidentAlerts, setIncidentAlerts] = (0, import_react.useState)(true);
	const [smsDispatch, setSmsDispatch] = (0, import_react.useState)(false);
	const [webhookUrl, setWebhookUrl] = (0, import_react.useState)("https://hooks.slack.com/services/T00/B00/XXXX");
	const [saving, setSaving] = (0, import_react.useState)(false);
	const handleSave = (e) => {
		e.preventDefault();
		setSaving(true);
		setTimeout(() => {
			setSaving(false);
			toast.success("Depot configuration and system parameters updated.");
		}, 450);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		title: "Depot & System Settings",
		subtitle: "Enterprise tenant isolation, Motor Vehicle Act labor parameters, and optimizer solver weights.",
		actions: canManage ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
			onClick: handleSave,
			disabled: saving,
			size: "sm",
			className: "bg-primary text-primary-foreground text-xs font-semibold shadow-md shadow-primary/20 hover:scale-[1.02] transition-all",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { className: "mr-1.5 size-3.5" }), saving ? "Saving Changes..." : "Save Configuration"]
		}) : void 0,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "glass-panel p-4 flex flex-wrap items-center justify-between gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "size-9 rounded-xl bg-primary/10 text-primary grid place-items-center font-bold",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Building2, { className: "size-5" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-sm font-bold text-foreground",
							children: orgName
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							variant: "outline",
							className: "text-[9px] font-mono border-primary/30 text-primary bg-primary/5",
							children: "Enterprise Tier"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-[11px] text-muted-foreground font-mono",
						children: [
							"Depot ID: ",
							depotCode,
							" · Dedicated PostgreSQL Schema"
						]
					})] })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex items-center gap-2",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						variant: "outline",
						className: "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 text-xs font-mono",
						children: "● Tenant Active"
					})
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
				defaultValue: "rules",
				className: "space-y-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, {
						className: "bg-secondary/40 p-1 rounded-xl border border-border/60",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsTrigger, {
								value: "rules",
								className: "text-xs gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-xs",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "size-3.5" }), " Depot Rules & Buffers"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsTrigger, {
								value: "labor",
								className: "text-xs gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-xs",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "size-3.5" }), " Labor & MV Act Limits"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsTrigger, {
								value: "optimizer",
								className: "text-xs gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-xs",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cpu, { className: "size-3.5" }), " Solver Weights"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsTrigger, {
								value: "organization",
								className: "text-xs gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-xs",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Building2, { className: "size-3.5" }), " Organization Profile"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsTrigger, {
								value: "notifications",
								className: "text-xs gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-xs",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bell, { className: "size-3.5" }), " Notifications & Webhooks"]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
						value: "rules",
						className: "space-y-6",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "glass-panel p-6 space-y-5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "border-b border-border/60 pb-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "text-sm font-bold text-foreground",
									children: "Turnaround & Headway Parameters"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-muted-foreground",
									children: "Define depot buffer intervals applied during automatic schedule generation"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid gap-5 sm:grid-cols-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-2",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												className: "text-xs font-semibold",
												children: "Terminal Turnaround Buffer"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "relative",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													type: "number",
													value: turnaroundBuffer,
													onChange: (e) => setTurnaroundBuffer(e.target.value),
													className: "bg-background/60 text-xs font-mono pr-12"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-mono",
													children: "mins"
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[10px] text-muted-foreground",
												children: "Minimum layover between inbound and outbound trips"
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-2",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												className: "text-xs font-semibold",
												children: "Relief Handover Window"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "relative",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													type: "number",
													value: reliefWindow,
													onChange: (e) => setReliefWindow(e.target.value),
													className: "bg-background/60 text-xs font-mono pr-12"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-mono",
													children: "mins"
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[10px] text-muted-foreground",
												children: "Buffer allotted for driver sign-off & ticket audit"
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-2",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												className: "text-xs font-semibold",
												children: "Garage Pull-Out Buffer"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "relative",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													type: "number",
													value: garageDepartureBuffer,
													onChange: (e) => setGarageDepartureBuffer(e.target.value),
													className: "bg-background/60 text-xs font-mono pr-12"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-mono",
													children: "mins"
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[10px] text-muted-foreground",
												children: "Pre-trip inspection time before first departure"
											})
										]
									})
								]
							})]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
						value: "labor",
						className: "space-y-6",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "glass-panel p-6 space-y-5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "border-b border-border/60 pb-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "size-4 text-emerald-500" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "text-sm font-bold text-foreground",
										children: "Motor Vehicles Act (1988) Labor Compliance"
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-muted-foreground",
									children: "Hard and soft constraint thresholds enforced across duty builders and optimizer"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid gap-5 sm:grid-cols-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "p-4 rounded-xl border border-border/70 bg-secondary/20 space-y-2",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex justify-between items-center",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
													className: "text-xs font-semibold text-foreground",
													children: "Max Continuous Driving Stretch"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
													variant: "outline",
													className: "text-[9px] font-mono text-emerald-600 border-emerald-500/30",
													children: "Mandatory"
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "relative",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													type: "number",
													value: maxContinuousDriving,
													onChange: (e) => setMaxContinuousDriving(e.target.value),
													className: "bg-background/60 text-xs font-mono pr-12"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-mono",
													children: "mins"
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[10px] text-muted-foreground",
												children: "Section 13: Drivers must not exceed 4 continuous hours (240 min) without rest"
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "p-4 rounded-xl border border-border/70 bg-secondary/20 space-y-2",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex justify-between items-center",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
													className: "text-xs font-semibold text-foreground",
													children: "Mandatory Shift Recovery Rest"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
													variant: "outline",
													className: "text-[9px] font-mono text-emerald-600 border-emerald-500/30",
													children: "Mandatory"
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "relative",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													type: "number",
													value: mandatoryRest,
													onChange: (e) => setMandatoryRest(e.target.value),
													className: "bg-background/60 text-xs font-mono pr-12"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-mono",
													children: "mins"
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[10px] text-muted-foreground",
												children: "Minimum 8 hours (480 min) off-duty rest required before next sign-on"
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "p-4 rounded-xl border border-border/70 bg-secondary/20 space-y-2",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												className: "text-xs font-semibold text-foreground",
												children: "Maximum Weekly Driving Limit"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "relative",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													type: "number",
													value: maxWeeklyHours,
													onChange: (e) => setMaxWeeklyHours(e.target.value),
													className: "bg-background/60 text-xs font-mono pr-12"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-mono",
													children: "hours"
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[10px] text-muted-foreground",
												children: "Standard 48-hour weekly ceiling per driver roster cycle"
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "p-4 rounded-xl border border-border/70 bg-secondary/20 space-y-2",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												className: "text-xs font-semibold text-foreground",
												children: "Maximum Spreadover Window"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "relative",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													type: "number",
													value: maxSpreadover,
													onChange: (e) => setMaxSpreadover(e.target.value),
													className: "bg-background/60 text-xs font-mono pr-12"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-mono",
													children: "mins"
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[10px] text-muted-foreground",
												children: "Total elapsed time from first sign-on to final sign-off (max 12 hours)"
											})
										]
									})
								]
							})]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
						value: "optimizer",
						className: "space-y-6",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "glass-panel p-6 space-y-5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "border-b border-border/60 pb-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cpu, { className: "size-4 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "text-sm font-bold text-foreground",
										children: "Mathematical Solver Objective Penalties"
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-muted-foreground",
									children: "Tune MILP cost coefficients to prioritize minimal fleet count or crew continuity"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid gap-5 sm:grid-cols-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-2",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												className: "text-xs font-semibold",
												children: "Deadhead Distance Penalty"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												type: "number",
												step: "0.1",
												value: deadheadWeight,
												onChange: (e) => setDeadheadWeight(e.target.value),
												className: "bg-background/60 text-xs font-mono"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[10px] text-muted-foreground",
												children: "Multiplier weighting for non-revenue kilometers"
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-2",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												className: "text-xs font-semibold",
												children: "Relief Handover Cost"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												type: "number",
												step: "0.1",
												value: handoverWeight,
												onChange: (e) => setHandoverWeight(e.target.value),
												className: "bg-background/60 text-xs font-mono"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[10px] text-muted-foreground",
												children: "Penalty against unlinked mid-shift crew swaps"
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-2",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												className: "text-xs font-semibold",
												children: "Solver Timeout Limit"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "relative",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													type: "number",
													value: solverTimeout,
													onChange: (e) => setSolverTimeout(e.target.value),
													className: "bg-background/60 text-xs font-mono pr-12"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-mono",
													children: "sec"
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[10px] text-muted-foreground",
												children: "Maximum branch-and-cut optimization search time"
											})
										]
									})
								]
							})]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
						value: "organization",
						className: "space-y-6",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "glass-panel p-6 space-y-5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "border-b border-border/60 pb-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "text-sm font-bold text-foreground",
									children: "Organization & Tenant Profile"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-muted-foreground",
									children: "Core transit authority details and geographic locality"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid gap-5 sm:grid-cols-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											className: "text-xs font-semibold",
											children: "Tenant Corporation Name"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											value: orgName,
											onChange: (e) => setOrgName(e.target.value),
											className: "bg-background/60 text-xs"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											className: "text-xs font-semibold",
											children: "Primary Depot Code"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											value: depotCode,
											onChange: (e) => setDepotCode(e.target.value),
											className: "bg-background/60 text-xs font-mono"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											className: "text-xs font-semibold",
											children: "Operational Timezone"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											value: timezone,
											onChange: (e) => setTimezone(e.target.value),
											className: "bg-background/60 text-xs font-mono"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											className: "text-xs font-semibold",
											children: "Operations Contact Email"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											value: contactEmail,
											onChange: (e) => setContactEmail(e.target.value),
											className: "bg-background/60 text-xs"
										})]
									})
								]
							})]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
						value: "notifications",
						className: "space-y-6",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "glass-panel p-6 space-y-5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "border-b border-border/60 pb-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "text-sm font-bold text-foreground",
									children: "Incident Telemetry & Webhooks"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-muted-foreground",
									children: "Automated dispatches to operations rooms and field supervisors"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "space-y-4",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											className: "text-xs font-semibold",
											children: "Disruption Webhook Endpoint (Slack / Discord)"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											value: webhookUrl,
											onChange: (e) => setWebhookUrl(e.target.value),
											className: "bg-background/60 text-xs font-mono"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-[10px] text-muted-foreground",
											children: "Payload fired whenever a high or critical incident is logged"
										})
									]
								})
							})]
						})
					})
				]
			})]
		})
	});
}
//#endregion
export { SettingsPage as component };
