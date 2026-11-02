import { v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { f as require_jsx_runtime } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { t as Button } from "./button-BnVgmmWP.mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { C as Route, F as Map, Tt as ArrowRight, _t as Bus, c as TriangleAlert, gt as CalendarClock, i as Workflow, m as SlidersVertical, o as Users, ot as CirclePlay, t as Zap, tt as Cpu } from "../_libs/lucide-react.mjs";
import { t as Route$26 } from "./router-9Rnl3R3s.mjs";
import { i as Badge, t as AppShell } from "./app-shell-CxpRo8VR.mjs";
import { s as getRoutes } from "./routes-gis-fns-BrjITXAP.mjs";
import { i as getBuses, o as getCrewAvailability } from "./fleet-crew-BrnJaW4J.mjs";
import { d as getTrips } from "./scheduling-fns-B2JRDpvw.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-BhaFZZbf.js
var import_jsx_runtime = require_jsx_runtime();
var SCHEDULE_DATE = "25 Aug 2026";
var minutes = (h, m = 0) => h * 60 + m;
var driverNames = [
	"Murugesan K.",
	"Selvam R.",
	"Palanisamy M.",
	"Arumugam V.",
	"Senthilkumar P.",
	"Dhanapal S.",
	"Anbarasan T.",
	"Ramasamy K.",
	"Marimuthu N.",
	"Velusamy K.",
	"Subramani P.",
	"Boopathi M.",
	"Thangavel S.",
	"Saravanan C.",
	"Manikandan G.",
	"Nataraj P.",
	"Sivakumar V.",
	"Ramesh K.",
	"Sridhar M.",
	"Vignesh R.",
	"Jayakumar S.",
	"Chandran M.",
	"Kathirvel P.",
	"Ilango T."
];
var conductorNames = [
	"Muthusamy G.",
	"Natarajan S.",
	"Balamurali K.",
	"Madhavan P.",
	"Krishnan R.",
	"Chinnasamy T.",
	"Ganesan V.",
	"Rajendran S.",
	"Govindaraj M.",
	"Sivakumar A.",
	"Balakrishnan E.",
	"Shanmugam P.",
	"Ravi V.",
	"Mohanraj K.",
	"Duraisamy T.",
	"Elango N.",
	"Kumaravel S.",
	"Kandasamy R.",
	"Sadasivam M.",
	"Loganathan C.",
	"Pandian M.",
	"Vetrivel S.",
	"Vijayaraghavan R.",
	"Sengottaiyan P."
];
var busRegistrations = [
	"TN-30-N-0412",
	"TN-30-N-0589",
	"TN-30-N-0631",
	"TN-30-N-0744",
	"TN-30-N-0812",
	"TN-30-N-0955",
	"TN-27-N-1102",
	"TN-30-AA-1420",
	"TN-30-N-1205",
	"TN-30-N-1342",
	"TN-30-N-1488",
	"TN-27-N-1590",
	"TN-30-AA-2101",
	"TN-30-N-1677",
	"TN-30-N-2108",
	"TN-30-N-2254",
	"TN-30-N-2390",
	"TN-27-N-2412",
	"TN-30-AA-3150",
	"TN-30-N-3120",
	"TN-30-N-3285",
	"TN-30-N-3341",
	"TN-27-N-3450",
	"TN-30-AA-4201"
];
var depots = [
	"Meyyanur Depot",
	"Johnsonpet Depot",
	"Hasthampatti Depot",
	"Steel Plant Depot"
];
var BUSES = busRegistrations.map((reg, i) => ({
	id: `B${String(i + 1).padStart(3, "0")}`,
	registrationNumber: reg,
	depot: depots[i % depots.length],
	status: i === 6 ? "maintenance" : i === 13 ? "breakdown" : i === 18 ? "out-of-service" : "available",
	availableFrom: minutes(5, 30)
}));
var DRIVERS = driverNames.map((name, i) => ({
	id: `DR${String(i + 1).padStart(3, "0")}`,
	name,
	role: "driver",
	status: i === 6 ? "resting" : i === 7 ? "leave" : i === 18 ? "unavailable" : "available",
	availableFrom: minutes(5, 30),
	restUntil: minutes(5, 30)
}));
var CONDUCTORS = conductorNames.map((name, i) => ({
	id: `CN${String(i + 1).padStart(3, "0")}`,
	name,
	role: "conductor",
	status: i === 6 ? "resting" : i === 7 ? "leave" : i === 18 ? "unavailable" : "available",
	availableFrom: minutes(5, 30),
	restUntil: minutes(5, 30)
}));
var stops = (names) => names.map((n, i) => ({
	id: `S${i}-${n}`,
	name: n
}));
var ROUTES = [
	{
		id: "R1",
		code: "Route 1",
		name: "Town Bus Stand ⇄ Salem Junction",
		lengthKm: 7.2,
		durationMin: 25,
		dailyTrips: 12,
		stops: stops([
			"Town Bus Stand",
			"Collectorate",
			"Four Roads",
			"Five Roads",
			"Suramangalam",
			"Salem Junction"
		])
	},
	{
		id: "R13",
		code: "Route 13",
		name: "Town Bus Stand ⇄ Yercaud Foothills",
		lengthKm: 12.8,
		durationMin: 40,
		dailyTrips: 10,
		stops: stops([
			"Town Bus Stand",
			"Collectorate",
			"Sundar Lodge",
			"Hasthampatti Roundana",
			"Gorimedu (Arts College)",
			"Kannankurichi Lake",
			"Yercaud Foothills"
		])
	},
	{
		id: "R4",
		code: "Route 4",
		name: "Town Bus Stand ⇄ Kondalampatti",
		lengthKm: 6.5,
		durationMin: 22,
		dailyTrips: 10,
		stops: stops([
			"Town Bus Stand",
			"Shevapet Market",
			"Gugai Handloom Colony",
			"Dadagapatti",
			"Trichy Main Road",
			"Kondalampatti Roundana"
		])
	},
	{
		id: "R33",
		code: "Route 33",
		name: "MGR Central Bus Stand ⇄ Steel Plant",
		lengthKm: 14.6,
		durationMin: 45,
		dailyTrips: 8,
		stops: stops([
			"MGR Central Bus Stand",
			"Meyyanur",
			"Five Roads",
			"Salem Junction",
			"Mamangam",
			"Jagir Ammapalayam",
			"Steel Plant Township"
		])
	},
	{
		id: "R8",
		code: "Route 8",
		name: "MGR Central Bus Stand ⇄ Ammapet Colony",
		lengthKm: 10.2,
		durationMin: 32,
		dailyTrips: 8,
		stops: stops([
			"MGR Central Bus Stand",
			"Five Roads",
			"Four Roads",
			"Town Bus Stand",
			"Pattai Koil",
			"Ammapet Main Road",
			"Ammapet Colony Terminus"
		])
	},
	{
		id: "R74",
		code: "Route 74",
		name: "Town Bus Stand ⇄ Omalur Bus Stand",
		lengthKm: 16.5,
		durationMin: 50,
		dailyTrips: 8,
		stops: stops([
			"Town Bus Stand",
			"Four Roads",
			"MGR Central Bus Stand",
			"Mamangam",
			"Karuppur (Periyar Univ)",
			"Toll Gate (Omalur)",
			"Omalur Town Bus Stand"
		])
	},
	{
		id: "R55",
		code: "Route 55",
		name: "MGR Central Bus Stand ⇄ Seelanaickenpatti",
		lengthKm: 8.4,
		durationMin: 28,
		dailyTrips: 8,
		stops: stops([
			"MGR Central Bus Stand",
			"Meyyanur",
			"Four Roads",
			"Gugai Handloom Colony",
			"Annathanapatti",
			"Seelanaickenpatti Bypass"
		])
	},
	{
		id: "R2A",
		code: "Route 2A",
		name: "Salem Junction ⇄ Ayothiapattinam",
		lengthKm: 15.2,
		durationMin: 48,
		dailyTrips: 8,
		stops: stops([
			"Salem Junction",
			"Suramangalam",
			"Five Roads",
			"Four Roads",
			"Town Bus Stand",
			"Ammapet Main Road",
			"Udayapatti",
			"Ayothiapattinam Bus Stand"
		])
	}
];
var PILLARS = [
	{
		title: "1. SCHEDULE OPTIMIZER",
		icon: Cpu,
		badge: "Constraint Solver",
		text: "Solves vehicle and crew duty pairing mathematically. Enforces statutory rest windows and eliminates deadhead mileage.",
		to: "/scheduling/optimizer"
	},
	{
		title: "2. DUTY BUILDER",
		icon: CalendarClock,
		badge: "Labor Compliance",
		text: "Assemble linked or unlinked shifts with drag-and-drop controls, verified against Motor Vehicle Act rest regulations.",
		to: "/operations/duties"
	},
	{
		title: "3. DISRUPTION RADAR",
		icon: TriangleAlert,
		badge: "Live Recovery",
		text: "When breakdowns happen, calculates optimal vehicle swaps and short-turns with minimal passenger wait impact.",
		to: "/operations/incidents"
	}
];
function Dashboard() {
	const user = Route$26.useRouteContext()?.user;
	const orgName = user?.tenantName || "Salem Transport Corporation";
	const depotName = user?.depotName || "Meyyanur Depot";
	const { data: buses = [] } = useQuery({
		queryKey: ["buses-dashboard"],
		queryFn: () => getBuses()
	});
	const { data: crewList = [] } = useQuery({
		queryKey: ["crew-dashboard"],
		queryFn: () => getCrewAvailability()
	});
	const { data: routesList = [] } = useQuery({
		queryKey: ["routes-dashboard"],
		queryFn: () => getRoutes()
	});
	const { data: tripsList = [] } = useQuery({
		queryKey: ["trips-dashboard"],
		queryFn: () => getTrips({ serviceDate: SCHEDULE_DATE })
	});
	const totalBuses = buses.length || BUSES.length;
	const totalCrew = crewList.length || DRIVERS.length + CONDUCTORS.length;
	const totalRoutes = routesList.length || ROUTES.length;
	const totalTrips = tripsList.length || 40;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		title: "Operations Command Center",
		subtitle: `${orgName} · ${depotName} · ${SCHEDULE_DATE}`,
		actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					asChild: true,
					size: "sm",
					variant: "outline",
					className: "text-xs rounded-md border-slate-300 dark:border-slate-700 bg-background hover:bg-muted",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/simulation",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CirclePlay, { className: "mr-1.5 size-3.5 text-blue-600 dark:text-blue-400" }), "Live Simulator"]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					asChild: true,
					size: "sm",
					variant: "outline",
					className: "text-xs rounded-md border-border hover:bg-muted",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/operations/trips",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Route, { className: "mr-1.5 size-3.5 text-primary" }), "Bus Timetable"]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					asChild: true,
					size: "sm",
					className: "bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-xs cursor-pointer",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/scheduling/optimizer",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SlidersVertical, { className: "mr-1.5 size-3.5" }), "Run Schedule Solver"]
					})
				})
			]
		}),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-6 max-w-7xl mx-auto",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "relative overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "max-w-2xl space-y-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "inline-flex items-center gap-2 rounded border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:text-slate-300",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Salem City Bus Operations Platform" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-slate-400",
											children: "|"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Active Production Depot" })
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
									className: "text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground",
									children: "TransitOS Operations Command Center"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm text-muted-foreground leading-relaxed",
									children: "Centralized transit network operations. Monitor on-road fleet locations, configure daily departure headways, generate labor-compliant crew duty rosters via constraint optimization, and deploy standby units during corridor disruptions."
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap gap-2 md:justify-end",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									asChild: true,
									size: "sm",
									className: "rounded-md text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
										to: "/simulation",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CirclePlay, { className: "size-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Launch Simulator" })]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									asChild: true,
									variant: "outline",
									size: "sm",
									className: "rounded-md text-xs gap-1.5 border-border hover:border-primary/40 bg-card",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
										to: "/fleet/buses",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bus, { className: "size-3.5 text-emerald-600 dark:text-emerald-400" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "24 Fleet Units" })]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									asChild: true,
									variant: "outline",
									size: "sm",
									className: "rounded-md text-xs gap-1.5 border-border hover:border-primary/40 bg-card",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
										to: "/crew/drivers",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "size-3.5 text-blue-600 dark:text-blue-400" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "48 Active Crew" })]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									asChild: true,
									variant: "outline",
									size: "sm",
									className: "rounded-md text-xs gap-1.5 border-border hover:border-primary/40 bg-card",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
										to: "/network/routes",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Map, { className: "size-3.5 text-slate-600 dark:text-slate-300" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "8 Corridors" })]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									asChild: true,
									size: "sm",
									className: "rounded-md text-xs gap-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-semibold shadow-xs",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
										to: "/scheduling/optimizer",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SlidersVertical, { className: "size-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Constraint Solver" })]
									})
								})
							]
						})]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "relative overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-6 shadow-xs",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2 max-w-3xl",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-wrap items-center gap-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
											className: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800 text-[10px] font-mono font-bold uppercase tracking-wider rounded",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CirclePlay, { className: "mr-1 size-3" }), "Corridor Simulator"]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
											variant: "outline",
											className: "text-[10px] font-mono border-border text-muted-foreground rounded",
											children: "Time Scrubber 05:30 - 23:00"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
											variant: "outline",
											className: "text-[10px] font-mono border-border text-muted-foreground rounded",
											children: "Disruption Injection"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
											variant: "outline",
											className: "text-[10px] font-mono border-border text-muted-foreground rounded",
											children: "Speed 1x to 60x"
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "text-xl sm:text-2xl font-bold tracking-tight text-foreground",
									children: "Corridor Trajectory and Operations Simulation"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs sm:text-sm text-muted-foreground leading-relaxed",
									children: "Inspect 7 active buses driving Salem corridors in real time. Scrub through dawn launch to night shift, test what happens when an engine breakdown occurs at Five Roads, trigger automated standby vehicle replacement, and inspect timetable adherence."
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex flex-wrap items-center gap-3 shrink-0",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								asChild: true,
								size: "default",
								className: "rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-5 h-10 shadow-xs",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
									to: "/simulation",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CirclePlay, { className: "mr-2 size-4" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Launch Simulation Deck" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "ml-2 size-4" })
									]
								})
							})
						})]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KpiTile, {
							icon: Bus,
							color: "emerald",
							label: "Bus Fleet",
							value: totalBuses,
							badge: "18 In Service",
							hint: "24 Ashok Leyland & Starbus registered",
							to: "/fleet/buses"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KpiTile, {
							icon: Users,
							color: "blue",
							label: "Crew & Drivers",
							value: totalCrew,
							badge: "100% Compliant",
							hint: "Drivers & conductors with rest limits",
							to: "/crew/drivers"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KpiTile, {
							icon: Map,
							color: "cyan",
							label: "Corridors & Routes",
							value: totalRoutes,
							badge: "54 Bus Stops",
							hint: "Salem Junction, Omalur, Gorimedu",
							to: "/network/routes"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KpiTile, {
							icon: Zap,
							color: "amber",
							label: "Scheduled Departures",
							value: totalTrips,
							badge: "Peak & Off-Peak",
							hint: "Generated daily timetable runs",
							to: "/operations/trips"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4 shadow-xs",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
							className: "text-base font-bold tracking-tight text-foreground flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Workflow, { className: "size-4 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Standard Operating Workflow" })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted-foreground mt-0.5",
							children: "Sequential operational pipeline: register corridor geometry, set departure headways, solve compliant duty pairings, and monitor on-road vehicles."
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							asChild: true,
							variant: "ghost",
							size: "sm",
							className: "text-xs text-primary font-semibold rounded-md",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: "/scheduling/optimizer",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Open Duty Solver" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-3 ml-1" })]
							})
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: "/network/routes",
								className: "p-4 rounded-md border border-slate-200 dark:border-slate-800 bg-card hover:border-slate-400 dark:hover:border-slate-600 transition-colors group flex flex-col justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "inline-flex items-center justify-center size-6 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold font-mono",
											children: "1"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
											variant: "outline",
											className: "text-[10px] font-mono border-border text-muted-foreground rounded",
											children: [totalRoutes, " Routes"]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "font-bold text-sm text-foreground group-hover:text-primary transition-colors mt-2.5",
										children: "1. Routes & Fleet"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-muted-foreground mt-1 leading-relaxed",
										children: "View Salem's 8 transit corridors and verify available buses and drivers across the 4 city depots."
									})
								] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-4 pt-2.5 border-t border-border/60 flex items-center justify-between text-xs text-primary font-semibold",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "View Network" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-3 group-hover:translate-x-1 transition-transform" })]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: "/operations/trips",
								className: "p-4 rounded-md border border-slate-200 dark:border-slate-800 bg-card hover:border-slate-400 dark:hover:border-slate-600 transition-colors group flex flex-col justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "inline-flex items-center justify-center size-6 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold font-mono",
											children: "2"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
											variant: "outline",
											className: "text-[10px] font-mono border-border text-muted-foreground rounded",
											children: [totalTrips, " Trips"]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "font-bold text-sm text-foreground group-hover:text-primary transition-colors mt-2.5",
										children: "2. Departure Timetable"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-muted-foreground mt-1 leading-relaxed",
										children: "Generate trips at 15 or 30-min intervals. Inspect departure times, distances, and peak hours."
									})
								] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-4 pt-2.5 border-t border-border/60 flex items-center justify-between text-xs text-primary font-semibold",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Open Timetable" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-3 group-hover:translate-x-1 transition-transform" })]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: "/scheduling/optimizer",
								className: "p-4 rounded-md border border-blue-300 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 hover:border-blue-500 transition-colors group flex flex-col justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "inline-flex items-center justify-center size-6 rounded bg-blue-600 text-white text-xs font-bold font-mono",
											children: "3"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
											className: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 border-blue-200 text-[10px] font-mono font-bold rounded",
											children: "Solver"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "font-bold text-sm text-foreground group-hover:text-primary transition-colors mt-2.5",
										children: "3. Duty Schedule Solver"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-muted-foreground mt-1 leading-relaxed",
										children: "Formulate mathematical constraint model to assemble all trips into compliant, fuel-efficient driver shifts."
									})
								] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-4 pt-2.5 border-t border-blue-200 dark:border-blue-900 flex items-center justify-between text-xs text-blue-600 dark:text-blue-400 font-bold",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Run Schedule Solver" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-3 group-hover:translate-x-1 transition-transform" })]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: "/operations/duties",
								className: "p-4 rounded-md border border-slate-200 dark:border-slate-800 bg-card hover:border-slate-400 dark:hover:border-slate-600 transition-colors group flex flex-col justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "inline-flex items-center justify-center size-6 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold font-mono",
											children: "4"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
											variant: "outline",
											className: "text-[10px] font-mono border-border text-muted-foreground rounded",
											children: "Live Dispatch"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "font-bold text-sm text-foreground group-hover:text-emerald-500 transition-colors mt-2.5",
										children: "4. Driver Shifts & Radar"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-muted-foreground mt-1 leading-relaxed",
										children: "Assign drivers to vehicles, audit statutory rest compliance, and utilize the Radar to handle breakdowns instantly."
									})
								] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-4 pt-2.5 border-t border-border/60 flex items-center justify-between text-xs text-primary font-semibold",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Manage Shifts" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-3 group-hover:translate-x-1 transition-transform" })]
								})]
							})
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid gap-4 md:grid-cols-3",
					children: PILLARS.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: p.to,
						className: "rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 hover:border-slate-400 dark:hover:border-slate-600 transition-colors group block cursor-pointer",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "grid size-9 place-items-center rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-colors",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(p.icon, { className: "size-4.5" })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-sm font-bold text-foreground group-hover:text-primary transition-colors",
										children: p.title
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									variant: "outline",
									className: "border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-mono rounded",
									children: p.badge
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3.5 text-xs text-muted-foreground leading-relaxed",
								children: p.text
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-4 flex items-center gap-1.5 text-xs font-bold text-primary",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Open Console" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-3.5 group-hover:translate-x-1 transition-transform" })]
							})
						]
					}, p.title))
				})
			]
		})
	});
}
function KpiTile({ icon: Icon, color, label, value, badge, hint, to }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
		to,
		className: "rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 hover:border-slate-400 dark:hover:border-slate-600 transition-colors group block cursor-pointer",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: `grid size-10 place-items-center rounded border ${{
					emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
					blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
					cyan: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
					amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
				}[color]}`,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-5" })
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-mono font-medium text-slate-600 dark:text-slate-400",
				children: badge
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-semibold text-muted-foreground uppercase tracking-wider",
					children: label
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-3xl font-extrabold tracking-tight text-foreground mt-0.5",
					children: value
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-muted-foreground mt-1 truncate",
					children: hint
				})
			]
		})]
	});
}
//#endregion
export { Dashboard as component };
