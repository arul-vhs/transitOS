import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { f as require_jsx_runtime } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { n as cn, r as formatMinutesToTime, t as Button } from "./button-BnVgmmWP.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { E as Radio, K as Info, O as Play, Tt as ArrowRight, j as Pause, m as SlidersVertical, rt as Clock, w as RotateCcw } from "../_libs/lucide-react.mjs";
import { i as Badge, t as AppShell } from "./app-shell-CxpRo8VR.mjs";
import { t as Progress } from "./progress-s8PucG3W.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/simulation-D5Er2doB.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var SALEM_CORRIDORS = [
	{
		id: "r1",
		code: "Route 1",
		name: "Town Bus Stand ⇄ Salem Junction",
		color: "#3B82F6",
		stops: [
			"Town Bus Stand",
			"Collectorate",
			"Four Roads",
			"Five Roads",
			"Suramangalam",
			"Salem Junction"
		],
		coords: [
			[11.6528, 78.1591],
			[11.658, 78.155],
			[11.6668, 78.1565],
			[11.6705, 78.1437],
			[11.6718, 78.117],
			[11.6714, 78.1132]
		]
	},
	{
		id: "r13",
		code: "Route 13",
		name: "Town Bus Stand ⇄ Yercaud Foothills",
		color: "#10B981",
		stops: [
			"Town Bus Stand",
			"Collectorate",
			"Sundar Lodge",
			"Hasthampatti",
			"Gorimedu",
			"Kannankurichi",
			"Yercaud Foothills"
		],
		coords: [
			[11.6528, 78.1591],
			[11.658, 78.155],
			[11.6625, 78.156],
			[11.6795, 78.1573],
			[11.6965, 78.1635],
			[11.6989, 78.179],
			[11.7125, 78.1885]
		]
	},
	{
		id: "r4",
		code: "Route 4",
		name: "Town Bus Stand ⇄ Kondalampatti",
		color: "#F43F5E",
		stops: [
			"Town Bus Stand",
			"Shevapet Market",
			"Gugai",
			"Dadagapatti",
			"Trichy Main Rd",
			"Kondalampatti"
		],
		coords: [
			[11.6528, 78.1591],
			[11.652, 78.143],
			[11.6432, 78.1508],
			[11.636, 78.148],
			[11.6315, 78.138],
			[11.6305, 78.1248]
		]
	},
	{
		id: "r33",
		code: "Route 33",
		name: "MGR Central Bus Stand ⇄ Steel Plant",
		color: "#0284C7",
		stops: [
			"MGR Central",
			"Meyyanur",
			"Five Roads",
			"Salem Junction",
			"Mamangam",
			"Jagir Ammapalayam",
			"Steel Plant"
		],
		coords: [
			[11.6673, 78.1424],
			[11.6685, 78.138],
			[11.6705, 78.1437],
			[11.6714, 78.1132],
			[11.685, 78.115],
			[11.678, 78.102],
			[11.671, 78.094]
		]
	},
	{
		id: "r74",
		code: "Route 74",
		name: "Town Bus Stand ⇄ Omalur Bus Stand",
		color: "#06B6D4",
		stops: [
			"Town Bus Stand",
			"Four Roads",
			"MGR Central",
			"Mamangam",
			"Karuppur",
			"Omalur Toll",
			"Omalur Town"
		],
		coords: [
			[11.6528, 78.1591],
			[11.6668, 78.1565],
			[11.6673, 78.1424],
			[11.685, 78.115],
			[11.718, 78.078],
			[11.732, 78.058],
			[11.7436, 78.0476]
		]
	}
];
var INITIAL_FLEET = [
	{
		id: "b1",
		fleetNumber: "SLM-MY-101",
		regNumber: "TN-30-N-0412",
		routeId: "r1",
		routeName: "Route 1: Town ⇄ Junction",
		routeColor: "#3B82F6",
		depot: "Meyyanur Depot",
		driver: "Murugesan K.",
		conductor: "Muthusamy G.",
		driverDrivingMinutes: 145,
		passengerCount: 38,
		capacity: 48,
		speedKmH: 32,
		fuelBatteryPct: 88,
		status: "on-route",
		currentPosition: [11.658, 78.155],
		nextStop: "Four Roads",
		varianceMinutes: 0,
		progressAlongRoute: .25,
		direction: "outbound",
		origin: "Town Bus Stand",
		destination: "Salem Junction",
		completedTrips: 2
	},
	{
		id: "b2",
		fleetNumber: "SLM-MY-102",
		regNumber: "TN-30-N-0589",
		routeId: "r13",
		routeName: "Route 13: Town ⇄ Yercaud",
		routeColor: "#10B981",
		depot: "Meyyanur Depot",
		driver: "Selvam R.",
		conductor: "Natarajan S.",
		driverDrivingMinutes: 190,
		passengerCount: 41,
		capacity: 42,
		speedKmH: 28,
		fuelBatteryPct: 76,
		status: "on-route",
		currentPosition: [11.6795, 78.1573],
		nextStop: "Gorimedu (Arts College)",
		varianceMinutes: 1,
		progressAlongRoute: .5,
		direction: "outbound",
		origin: "Town Bus Stand",
		destination: "Yercaud Foothills",
		completedTrips: 1
	},
	{
		id: "b3",
		fleetNumber: "SLM-MY-104",
		regNumber: "TN-30-N-0744",
		routeId: "r1",
		routeName: "Route 1: Town ⇄ Junction",
		routeColor: "#3B82F6",
		depot: "Meyyanur Depot",
		driver: "Arumugam V.",
		conductor: "Madhavan P.",
		driverDrivingMinutes: 210,
		passengerCount: 44,
		capacity: 48,
		speedKmH: 35,
		fuelBatteryPct: 69,
		status: "on-route",
		currentPosition: [11.6705, 78.1437],
		nextStop: "Four Roads",
		varianceMinutes: -1,
		progressAlongRoute: .4,
		direction: "return",
		origin: "Salem Junction",
		destination: "Town Bus Stand",
		completedTrips: 3
	},
	{
		id: "b4",
		fleetNumber: "SLM-JP-201",
		regNumber: "TN-30-N-1205",
		routeId: "r4",
		routeName: "Route 4: Town ⇄ Kondalampatti",
		routeColor: "#F43F5E",
		depot: "Johnsonpet Depot",
		driver: "Marimuthu N.",
		conductor: "Balamurali K.",
		driverDrivingMinutes: 80,
		passengerCount: 29,
		capacity: 48,
		speedKmH: 30,
		fuelBatteryPct: 92,
		status: "on-route",
		currentPosition: [11.6432, 78.1508],
		nextStop: "Dadagapatti",
		varianceMinutes: 0,
		progressAlongRoute: .4,
		direction: "outbound",
		origin: "Town Bus Stand",
		destination: "Kondalampatti",
		completedTrips: 2
	},
	{
		id: "b5",
		fleetNumber: "SLM-SP-401",
		regNumber: "TN-30-N-3120",
		routeId: "r33",
		routeName: "Route 33: Central ⇄ Steel Plant",
		routeColor: "#8B5CF6",
		depot: "Steel Plant Depot",
		driver: "Vignesh R.",
		conductor: "Ganesan P.",
		driverDrivingMinutes: 160,
		passengerCount: 46,
		capacity: 48,
		speedKmH: 38,
		fuelBatteryPct: 81,
		status: "on-route",
		currentPosition: [11.678, 78.102],
		nextStop: "Salem Junction",
		varianceMinutes: 0,
		progressAlongRoute: .45,
		direction: "return",
		origin: "Steel Plant",
		destination: "MGR Central Bus Stand",
		completedTrips: 2
	},
	{
		id: "b6",
		fleetNumber: "SLM-HP-301",
		regNumber: "TN-30-N-2108",
		routeId: "r74",
		routeName: "Route 74: Town ⇄ Omalur",
		routeColor: "#06B6D4",
		depot: "Hasthampatti Depot",
		driver: "Manikandan G.",
		conductor: "Krishnan S.",
		driverDrivingMinutes: 120,
		passengerCount: 34,
		capacity: 48,
		speedKmH: 42,
		fuelBatteryPct: 85,
		status: "on-route",
		currentPosition: [11.718, 78.078],
		nextStop: "Omalur Toll",
		varianceMinutes: 2,
		progressAlongRoute: .65,
		direction: "outbound",
		origin: "Town Bus Stand",
		destination: "Omalur Town",
		completedTrips: 1
	},
	{
		id: "b7",
		fleetNumber: "SLM-MY-108",
		regNumber: "TN-30-AA-1420",
		routeId: "standby",
		routeName: "Standby Reserve (Meyyanur)",
		routeColor: "#64748B",
		depot: "Meyyanur Depot",
		driver: "Dhanapal S.",
		conductor: "Saravanan T.",
		driverDrivingMinutes: 0,
		passengerCount: 0,
		capacity: 48,
		speedKmH: 0,
		fuelBatteryPct: 100,
		status: "standby",
		currentPosition: [11.6685, 78.138],
		nextStop: "Depot Standby Bay 3",
		varianceMinutes: 0,
		progressAlongRoute: 0,
		direction: "outbound",
		origin: "Meyyanur Depot",
		destination: "Standby Bay",
		completedTrips: 0
	}
];
function getInterpolatedPosition(coords, progress) {
	if (!coords || coords.length === 0) return [11.6673, 78.1424];
	if (coords.length === 1) return [coords[0][0], coords[0][1]];
	const totalSegments = coords.length - 1;
	const scaledProgress = Math.min(1, Math.max(0, progress)) * totalSegments;
	const index = Math.floor(scaledProgress);
	const frac = scaledProgress - index;
	const p1 = coords[Math.min(index, coords.length - 1)];
	const p2 = coords[Math.min(index + 1, coords.length - 1)];
	return [p1[0] + (p2[0] - p1[0]) * frac, p1[1] + (p2[1] - p1[1]) * frac];
}
function SimulationPage() {
	const [currentMinutes, setCurrentMinutes] = (0, import_react.useState)(510);
	const [isPlaying, setIsPlaying] = (0, import_react.useState)(true);
	const [simSpeed, setSimSpeed] = (0, import_react.useState)(5);
	const [fleet, setFleet] = (0, import_react.useState)(INITIAL_FLEET);
	const [selectedBusId, setSelectedBusId] = (0, import_react.useState)("b3");
	const [activeScenario, setActiveScenario] = (0, import_react.useState)(null);
	const [activeTab, setActiveTab] = (0, import_react.useState)("controls");
	const [eventLogs, setEventLogs] = (0, import_react.useState)([
		{
			id: "1",
			time: "08:15 AM",
			text: "Dispatch check: 6 vehicles active on Salem corridors, 1 standby bus at Meyyanur Depot.",
			type: "info"
		},
		{
			id: "2",
			time: "08:22 AM",
			text: "Driver Murugesan K. (SLM-MY-101) outbound to Salem Junction passed Four Roads with 0 departure variance.",
			type: "success"
		},
		{
			id: "3",
			time: "08:28 AM",
			text: "SLM-MY-104 on return journey to Town Bus Stand approaching Five Roads.",
			type: "info"
		}
	]);
	const mapRef = (0, import_react.useRef)(null);
	const mapInstanceRef = (0, import_react.useRef)(null);
	const [L, setL] = (0, import_react.useState)(null);
	const busMarkersRef = (0, import_react.useRef)({});
	const polylineGroupRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		if (typeof window !== "undefined") import("../_libs/leaflet.mjs").then((n) => /* @__PURE__ */ __toESM(n.t())).then((mod) => {
			setL(mod.default);
		});
	}, []);
	(0, import_react.useEffect)(() => {
		if (!isPlaying) return;
		const interval = setInterval(() => {
			setCurrentMinutes((prev) => {
				const next = prev + simSpeed * .1;
				return next >= 1380 ? 330 : next;
			});
			setFleet((prevFleet) => {
				const arrivalEvents = [];
				const updatedFleet = prevFleet.map((bus) => {
					if (bus.status === "breakdown" || bus.status === "standby") return bus;
					const corridor = SALEM_CORRIDORS.find((c) => c.id === bus.routeId);
					if (!corridor) return bus;
					const stepDelta = bus.speedKmH / 60 * .002 * simSpeed;
					let newProgress = bus.progressAlongRoute + stepDelta;
					let newDirection = bus.direction;
					let completedTrips = bus.completedTrips;
					let newOrigin = bus.origin;
					let newDestination = bus.destination;
					const startTerminal = corridor.stops[0];
					const endTerminal = corridor.stops[corridor.stops.length - 1];
					if (newProgress >= 1) {
						completedTrips += 1;
						const arrivedAt = newDestination;
						if (bus.direction === "outbound") {
							newDirection = "return";
							newOrigin = endTerminal;
							newDestination = startTerminal;
						} else {
							newDirection = "outbound";
							newOrigin = startTerminal;
							newDestination = endTerminal;
						}
						arrivalEvents.push({
							fleetNumber: bus.fleetNumber,
							terminal: arrivedAt,
							nextDir: newDirection === "return" ? "Return" : "Outbound",
							nextDest: newDestination
						});
						newProgress = newProgress - 1;
					}
					const activeCoords = newDirection === "outbound" ? corridor.coords : [...corridor.coords].reverse();
					const activeStops = newDirection === "outbound" ? corridor.stops : [...corridor.stops].reverse();
					const newPos = getInterpolatedPosition(activeCoords, newProgress);
					const stopIdx = Math.floor(newProgress * (activeStops.length - 1));
					const nextStop = activeStops[Math.min(stopIdx + 1, activeStops.length - 1)];
					return {
						...bus,
						direction: newDirection,
						origin: newOrigin,
						destination: newDestination,
						completedTrips,
						progressAlongRoute: newProgress,
						currentPosition: newPos,
						nextStop,
						driverDrivingMinutes: Math.min(360, bus.driverDrivingMinutes + simSpeed * .05)
					};
				});
				if (arrivalEvents.length > 0) setEventLogs((prev) => [...arrivalEvents.map((evt) => ({
					id: String(Date.now() + Math.random()),
					time: formatMinutesToTime(Math.floor(currentMinutes)),
					text: `[TURNAROUND] ${evt.fleetNumber} arrived at ${evt.terminal}. Turned around for ${evt.nextDir} trip ➔ ${evt.nextDest}.`,
					type: "info"
				})), ...prev.slice(0, 45)]);
				return updatedFleet;
			});
		}, 100);
		return () => clearInterval(interval);
	}, [
		isPlaying,
		simSpeed,
		currentMinutes
	]);
	(0, import_react.useEffect)(() => {
		if (!L || !mapRef.current) return;
		let map = mapInstanceRef.current;
		if (!map || map.getContainer() !== mapRef.current) {
			if (map) try {
				map.remove();
			} catch {}
			if (mapRef.current) delete mapRef.current._leaflet_id;
			map = L.map(mapRef.current).setView([11.6673, 78.1424], 13);
			L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap contributors" }).addTo(map);
			mapInstanceRef.current = map;
			polylineGroupRef.current = L.featureGroup().addTo(map);
		}
		if (polylineGroupRef.current) {
			polylineGroupRef.current.clearLayers();
			SALEM_CORRIDORS.forEach((corridor) => {
				L.polyline(corridor.coords, {
					color: corridor.color,
					weight: 4,
					opacity: .75,
					dashArray: corridor.id === "r74" ? "4, 6" : void 0
				}).addTo(polylineGroupRef.current);
				corridor.coords.forEach((coord, i) => {
					L.circleMarker(coord, {
						radius: 4,
						fillColor: corridor.color,
						fillOpacity: .9,
						color: "#ffffff",
						weight: 1.5
					}).bindTooltip(`${corridor.code}: ${corridor.stops[i]}`, {
						direction: "top",
						offset: [0, -5]
					}).addTo(polylineGroupRef.current);
				});
			});
		}
	}, [L]);
	(0, import_react.useEffect)(() => {
		if (!L || !mapInstanceRef.current) return;
		const map = mapInstanceRef.current;
		fleet.forEach((bus) => {
			const isSelected = bus.id === selectedBusId;
			const isBreakdown = bus.status === "breakdown";
			const isStandby = bus.status === "standby";
			const dirArrow = bus.direction === "return" ? "◀" : "▶";
			const dirText = bus.direction === "return" ? "Return" : "Outbound";
			const markerHtml = `
        <div class="relative flex items-center justify-center transition-transform ${isSelected ? "scale-125 z-50" : "scale-100"}">
          <div class="size-7 rounded-xl flex items-center justify-center text-white text-[10px] font-mono font-bold shadow-lg border-2 ${isBreakdown ? "bg-rose-600 border-white animate-bounce" : isStandby ? "bg-slate-500 border-white opacity-85" : isSelected ? "bg-primary border-white ring-2 ring-primary ring-offset-2" : "bg-slate-900 border-white"}">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-white"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C18.1 6.7 17.1 6 16 6H4c-1.1 0-2.1.7-2.4 1.8l-1.4 5C0.1 13.2 0 13.6 0 14c0 .4.1.8.2 1.2.3 1.1.8 2.8.8 2.8h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/></svg>
          </div>
          <div class="absolute -bottom-4 px-1.5 py-0.2 rounded bg-slate-900/90 text-white font-mono text-[9px] whitespace-nowrap shadow border border-white/20 flex items-center gap-1">
            <span>${bus.fleetNumber.split("-")[2]}</span>
            ${!isStandby ? `<span class="text-[8px] font-bold ${bus.direction === "return" ? "text-amber-400" : "text-emerald-400"}">${dirArrow}</span>` : ""}
          </div>
        </div>
      `;
			const icon = L.divIcon({
				html: markerHtml,
				className: "custom-bus-marker",
				iconSize: [28, 28],
				iconAnchor: [14, 14]
			});
			const tooltipContent = isStandby ? `<strong>${bus.fleetNumber}</strong><br/>Standby Reserve at ${bus.depot}` : `<strong>${bus.fleetNumber}</strong> (${dirText} Trip)<br/>Heading to: <strong>${bus.destination}</strong><br/>Next Stop: ${bus.nextStop}<br/>Trip #${bus.completedTrips + 1}`;
			if (busMarkersRef.current[bus.id]) {
				busMarkersRef.current[bus.id].setLatLng(bus.currentPosition);
				busMarkersRef.current[bus.id].setIcon(icon);
				busMarkersRef.current[bus.id].setTooltipContent(tooltipContent);
			} else {
				const marker = L.marker(bus.currentPosition, { icon }).bindTooltip(tooltipContent, {
					direction: "top",
					offset: [0, -16]
				}).on("click", () => {
					setSelectedBusId(bus.id);
				}).addTo(map);
				busMarkersRef.current[bus.id] = marker;
			}
		});
	}, [
		L,
		fleet,
		selectedBusId
	]);
	const selectedBus = fleet.find((b) => b.id === selectedBusId) || fleet[0] || INITIAL_FLEET[0];
	const timePhase = (0, import_react.useMemo)(() => {
		const h = Math.floor(currentMinutes / 60);
		if (h < 7) return {
			title: "Dawn Launch & Depots Pull-Out",
			badge: "Morning Rollout",
			color: "text-amber-500"
		};
		if (h < 10) return {
			title: "Morning Peak Commute (Heavy Load)",
			badge: "Peak Rush",
			color: "text-rose-500 font-bold"
		};
		if (h < 16) return {
			title: "Steady Daytime Service",
			badge: "Normal Operations",
			color: "text-emerald-500"
		};
		if (h < 20) return {
			title: "Evening Return Peak (Heavy Load)",
			badge: "Evening Peak",
			color: "text-primary font-bold"
		};
		return {
			title: "Late Night Wind-down & Depot Influx",
			badge: "Night Shift",
			color: "text-indigo-400"
		};
	}, [currentMinutes]);
	const triggerBreakdownScenario = () => {
		setActiveScenario("breakdown");
		setIsPlaying(false);
		setFleet((prev) => prev.map((b) => b.id === "b3" ? {
			...b,
			status: "breakdown",
			speedKmH: 0,
			varianceMinutes: 18
		} : b));
		setSelectedBusId("b3");
		toast.error("[EMERGENCY] Bus SLM-MY-104 reported engine temperature failure at Five Roads!", { duration: 6e3 });
		setEventLogs((prev) => [{
			id: String(Date.now()),
			time: formatMinutesToTime(Math.floor(currentMinutes)),
			text: "[BREAKDOWN ALERT] Bus SLM-MY-104 stalled at Five Roads. Disruption Radar triggered.",
			type: "alert"
		}, ...prev]);
	};
	const resolveBreakdownRecovery = () => {
		setFleet((prev) => prev.map((b) => {
			if (b.id === "b3") return {
				...b,
				status: "standby",
				routeName: "Towed to Meyyanur Bay 2"
			};
			if (b.id === "b7") return {
				...b,
				status: "on-route",
				routeId: "r1",
				routeName: "Route 1: Town ⇄ Junction (Relief Run)",
				routeColor: "#3B82F6",
				direction: "return",
				origin: "Salem Junction",
				destination: "Town Bus Stand",
				completedTrips: 1,
				currentPosition: [11.6705, 78.1437],
				speedKmH: 34,
				passengerCount: 44,
				varianceMinutes: 3,
				progressAlongRoute: .4,
				nextStop: "Four Roads"
			};
			return b;
		}));
		setSelectedBusId("b7");
		setActiveScenario(null);
		setIsPlaying(true);
		toast.success("[RECOVERY DEPLOYED] Standby Bus SLM-MY-108 dispatched on Return trip to Town Bus Stand!", { duration: 6e3 });
		setEventLogs((prev) => [{
			id: String(Date.now()),
			time: formatMinutesToTime(Math.floor(currentMinutes)),
			text: "[INCIDENT RESOLVED] Standby Bus SLM-MY-108 accepted Route 1 duty. 0 passengers stranded.",
			type: "recovery"
		}, ...prev]);
	};
	const triggerTrafficScenario = () => {
		setActiveScenario("traffic");
		setFleet((prev) => prev.map((b) => b.id === "b1" ? {
			...b,
			speedKmH: 12,
			varianceMinutes: 14
		} : b));
		setSelectedBusId("b1");
		toast.warning("[CONGESTION SPIKE] Junction corridor gridlock detected. Arrival variance +14 min.", { duration: 5e3 });
		setEventLogs((prev) => [{
			id: String(Date.now()),
			time: formatMinutesToTime(Math.floor(currentMinutes)),
			text: "[TRAFFIC ALERT] SLM-MY-101 speed dropped to 12 km/h. Headway regulator deployed.",
			type: "alert"
		}, ...prev]);
	};
	const triggerDriverRestScenario = () => {
		setActiveScenario("driver-rest");
		setFleet((prev) => prev.map((b) => b.id === "b1" ? {
			...b,
			driverDrivingMinutes: 245
		} : b));
		setSelectedBusId("b1");
		toast.info("[COMPLIANCE ALERT] Driver Murugesan K. reached 240 mins continuous driving limit!", { duration: 6e3 });
		setEventLogs((prev) => [{
			id: String(Date.now()),
			time: formatMinutesToTime(Math.floor(currentMinutes)),
			text: "[MVA COMPLIANCE] Driver Murugesan reached 4.0 hr limit. Mandating relief handover.",
			type: "info"
		}, ...prev]);
	};
	const resolveDriverHandover = () => {
		setFleet((prev) => prev.map((b) => b.id === "b1" ? {
			...b,
			driver: "Palanisamy M. (Relief Driver)",
			driverDrivingMinutes: 15
		} : b));
		setActiveScenario(null);
		toast.success("[HANDOVER COMPLETED] Driver Palanisamy M. took over at Town Bus Stand.", { duration: 5e3 });
		setEventLogs((prev) => [{
			id: String(Date.now()),
			time: formatMinutesToTime(Math.floor(currentMinutes)),
			text: "[HANDOVER VERIFIED] Palanisamy M. logged as active driver. Murugesan K. on mandatory rest.",
			type: "success"
		}, ...prev]);
	};
	const resetSimulation = () => {
		setCurrentMinutes(510);
		setFleet(INITIAL_FLEET);
		setSelectedBusId("b3");
		setActiveScenario(null);
		setIsPlaying(true);
		toast.info("Simulation clock reset to 08:30 AM.");
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		title: "Interactive Operations Simulator",
		subtitle: "Experience TransitOS in action: real-time vehicle dispatch, telemetry streaming, and automated disruption healing.",
		actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
				variant: "outline",
				className: "font-mono text-xs border-indigo-500/30 text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 gap-1.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-2 rounded-full bg-indigo-500 animate-ping" }), "Simulation Deck"]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				variant: "outline",
				size: "sm",
				onClick: resetSimulation,
				className: "text-xs h-8 gap-1.5 cursor-pointer",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: "size-3.5" }), "Reset 08:30 AM"]
			})]
		}),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "glass-panel p-4 sm:p-5 rounded-3xl bg-linear-to-r from-card via-card to-primary/5 border border-border/80 shadow-md",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center justify-between gap-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "size-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xs",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "size-6 animate-pulse" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-3xl font-extrabold font-mono tracking-tight text-foreground",
								children: formatMinutesToTime(Math.floor(currentMinutes))
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								variant: "outline",
								className: cn("text-[11px] font-semibold px-2 py-0.5", timePhase.color),
								children: timePhase.badge
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted-foreground mt-0.5",
							children: timePhase.title
						})] })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex items-center bg-muted/60 p-1 rounded-xl border border-border/60",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: isPlaying ? "default" : "ghost",
								size: "sm",
								onClick: () => setIsPlaying(!isPlaying),
								className: "h-8 px-3 rounded-lg text-xs gap-1.5 font-semibold cursor-pointer",
								children: isPlaying ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, { className: "size-3.5" }), "Pause"] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "size-3.5" }), "Resume"] })
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex items-center bg-muted/60 p-1 rounded-xl border border-border/60",
							children: [
								{
									label: "1x",
									val: 1
								},
								{
									label: "5x",
									val: 5
								},
								{
									label: "15x",
									val: 15
								},
								{
									label: "60x",
									val: 60
								}
							].map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: simSpeed === s.val ? "default" : "ghost",
								size: "sm",
								onClick: () => setSimSpeed(s.val),
								className: "h-8 px-2.5 rounded-lg text-xs font-mono font-bold cursor-pointer",
								children: s.label
							}, s.val))
						})]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 pt-3 border-t border-border/50",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between text-[11px] font-mono text-muted-foreground mb-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "05:30 AM (Start)" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-semibold text-primary",
								children: "Time Scrubber (Drag to fast-forward)"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "11:00 PM (Depot Pull-in)" })
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "range",
						min: 330,
						max: 1380,
						value: Math.floor(currentMinutes),
						onChange: (e) => setCurrentMinutes(Number(e.target.value)),
						className: "w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
					})]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-1 lg:grid-cols-12 gap-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "lg:col-span-7 space-y-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "glass-panel p-4 rounded-3xl relative overflow-hidden flex flex-col h-[520px]",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between pb-3 border-b border-border/50 z-10",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-2.5 rounded-full bg-emerald-500 animate-ping" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-xs font-bold text-foreground",
										children: "Salem City Corridors (Live Fleet Map)"
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2 text-[11px] font-mono text-muted-foreground",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [fleet.filter((b) => b.status === "on-route").length, " Moving"] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "•" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [fleet.filter((b) => b.status === "standby").length, " Standby"] })
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								ref: mapRef,
								className: "flex-1 w-full rounded-2xl z-0 mt-2"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-2 pt-2 border-t border-border/50 flex flex-wrap items-center gap-3 text-[11px] font-mono",
								children: SALEM_CORRIDORS.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "size-2 rounded-full",
										style: { backgroundColor: c.color }
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-muted-foreground",
										children: c.code
									})]
								}, c.id))
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid grid-cols-3 sm:grid-cols-6 gap-2",
						children: fleet.map((bus) => {
							const isSelected = bus.id === selectedBusId;
							const isBreakdown = bus.status === "breakdown";
							const isStandby = bus.status === "standby";
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: () => setSelectedBusId(bus.id),
								className: cn("p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between", isSelected ? "border-primary bg-primary/10 shadow-sm" : isBreakdown ? "border-rose-500/50 bg-rose-500/10 animate-pulse" : isStandby ? "border-border/60 bg-muted/40" : "border-border/60 bg-card hover:border-border"),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-mono text-xs font-bold text-foreground",
										children: bus.fleetNumber.split("-")[2]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("size-2 rounded-full", isBreakdown ? "bg-rose-500" : isStandby ? "bg-slate-400" : "bg-emerald-500") })]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between mt-1 text-[10px] text-muted-foreground",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "truncate",
										children: isBreakdown ? "Breakdown" : isStandby ? "Standby" : bus.routeName.split(":")[0]
									}), !isStandby && !isBreakdown && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: cn("font-mono text-[9px] font-bold ml-1", bus.direction === "return" ? "text-amber-500" : "text-emerald-500"),
										children: bus.direction === "return" ? "◀" : "▶"
									})]
								})]
							}, bus.id);
						})
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "lg:col-span-5 space-y-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center bg-muted/60 p-1 rounded-md border border-border/60",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									onClick: () => setActiveTab("controls"),
									className: cn("flex-1 py-1.5 text-xs font-semibold rounded transition-all cursor-pointer flex items-center justify-center gap-1.5", activeTab === "controls" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SlidersVertical, { className: "size-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Test Scenarios" })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									onClick: () => setActiveTab("walkthrough"),
									className: cn("flex-1 py-1.5 text-xs font-semibold rounded transition-all cursor-pointer flex items-center justify-center gap-1.5", activeTab === "walkthrough" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, { className: "size-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "4-Step Tour" })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									onClick: () => setActiveTab("telemetry"),
									className: cn("flex-1 py-1.5 text-xs font-semibold rounded transition-all cursor-pointer flex items-center justify-center gap-1.5", activeTab === "telemetry" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Radio, { className: "size-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
										"Radio Log (",
										eventLogs.length,
										")"
									] })]
								})
							]
						}),
						activeTab === "controls" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "glass-panel p-4 rounded-3xl border-primary/30 relative overflow-hidden",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-start justify-between",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-2",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
													className: "font-extrabold text-base text-foreground font-mono",
													children: selectedBus.fleetNumber
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
													variant: "outline",
													className: cn("text-[10px] font-mono uppercase px-1.5 py-0.2", selectedBus.status === "breakdown" ? "border-rose-500/40 text-rose-500 bg-rose-500/10" : selectedBus.status === "standby" ? "border-slate-500/40 text-slate-500 bg-slate-500/10" : "border-emerald-500/40 text-emerald-600 bg-emerald-500/10"),
													children: selectedBus.status
												}),
												selectedBus.status !== "standby" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
													variant: "outline",
													className: cn("text-[10px] font-mono px-1.5 py-0.2", selectedBus.direction === "return" ? "border-amber-500/40 text-amber-600 bg-amber-500/10" : "border-indigo-500/40 text-indigo-600 bg-indigo-500/10"),
													children: selectedBus.direction === "return" ? "◀ Return Trip" : "▶ Outbound Trip"
												})
											]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs text-muted-foreground mt-0.5",
											children: selectedBus.routeName
										})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "text-right",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "text-xs font-bold font-mono text-foreground",
												children: [selectedBus.speedKmH, " km/h"]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[10px] text-muted-foreground",
												children: "Speed Telemetry"
											})]
										})]
									}),
									selectedBus.status !== "standby" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-3 p-2.5 rounded-2xl bg-muted/30 border border-border/60 space-y-1.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center justify-between text-xs",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-1.5 min-w-0",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "font-bold text-foreground truncate",
														children: selectedBus.origin
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "text-muted-foreground",
														children: "➔"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "font-bold text-primary truncate",
														children: selectedBus.destination
													})
												]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
												variant: "secondary",
												className: "text-[10px] font-mono shrink-0",
												children: ["Trip #", selectedBus.completedTrips + 1]
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-1",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Progress, {
												value: Math.round(selectedBus.progressAlongRoute * 100),
												className: "h-1.5"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center justify-between text-[10px] text-muted-foreground font-mono",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Dep: ", selectedBus.origin.split(" ")[0]] }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [Math.round(selectedBus.progressAlongRoute * 100), "% route complete"] }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Term: ", selectedBus.destination.split(" ")[0]] })
												]
											})]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-border/50 text-xs",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "p-2 rounded-xl bg-muted/40",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-[10px] text-muted-foreground",
													children: "Next Stop"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "font-semibold text-foreground truncate mt-0.5",
													children: selectedBus.nextStop
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "p-2 rounded-xl bg-muted/40",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-[10px] text-muted-foreground",
													children: "Passenger Load"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
													className: "font-semibold text-foreground mt-0.5",
													children: [
														selectedBus.passengerCount,
														" / ",
														selectedBus.capacity,
														" (",
														Math.round(selectedBus.passengerCount / selectedBus.capacity * 100),
														"%)"
													]
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "p-2 rounded-xl bg-muted/40",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-[10px] text-muted-foreground",
													children: "Driver"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "font-semibold text-foreground truncate mt-0.5",
													children: selectedBus.driver
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "p-2 rounded-xl bg-muted/40",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-[10px] text-muted-foreground",
													children: "Continuous Driving"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
													className: cn("font-semibold mt-0.5 font-mono", selectedBus.driverDrivingMinutes >= 240 ? "text-rose-500 font-bold" : "text-foreground"),
													children: [
														Math.floor(selectedBus.driverDrivingMinutes),
														" mins",
														" ",
														selectedBus.driverDrivingMinutes >= 240 && "[REST EXCEEDED]"
													]
												})]
											})
										]
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "glass-panel p-4 rounded-lg space-y-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-1.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SlidersVertical, { className: "size-4 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-xs font-bold text-foreground",
												children: "Interactive Scenarios (Click to Inject)"
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
											variant: "outline",
											className: "text-[10px] text-muted-foreground font-mono",
											children: "Real-World Demos"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-muted-foreground",
										children: "Click any real-world incident below to see how TransitOS's AI Disruption Radar and Rescheduling Engine respond in real-time:"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-2",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "p-3 rounded-2xl border border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10 transition-colors",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-start justify-between gap-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex items-center gap-1.5",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-2 rounded-full bg-rose-500" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "text-xs font-bold text-foreground",
															children: "Scenario 1: Vehicle Engine Breakdown"
														})]
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "text-[11px] text-muted-foreground mt-0.5",
														children: "Bus SLM-MY-104 suffers engine failure on Route 1 at Five Roads."
													})] }), activeScenario === "breakdown" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
														size: "sm",
														variant: "default",
														onClick: resolveBreakdownRecovery,
														className: "text-xs h-7 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer whitespace-nowrap",
														children: "Accept Auto-Recovery"
													}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
														size: "sm",
														variant: "outline",
														onClick: triggerBreakdownScenario,
														className: "text-xs h-7 border-rose-500/40 text-rose-600 hover:bg-rose-500/10 cursor-pointer whitespace-nowrap",
														children: "Trigger Breakdown"
													})]
												})
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "p-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 transition-colors",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-start justify-between gap-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex items-center gap-1.5",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-2 rounded-full bg-amber-500" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "text-xs font-bold text-foreground",
															children: "Scenario 2: Traffic Congestion Spike"
														})]
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "text-[11px] text-muted-foreground mt-0.5",
														children: "Spikes arrival variance by +14 min on Salem Junction corridor."
													})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
														size: "sm",
														variant: "outline",
														onClick: triggerTrafficScenario,
														className: "text-xs h-7 border-amber-500/40 text-amber-600 hover:bg-amber-500/10 cursor-pointer whitespace-nowrap",
														children: "Inject Traffic"
													})]
												})
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "p-3 rounded-2xl border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-start justify-between gap-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex items-center gap-1.5",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-2 rounded-full bg-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "text-xs font-bold text-foreground",
															children: "Scenario 3: Driver 4-Hour Limit Handover"
														})]
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "text-[11px] text-muted-foreground mt-0.5",
														children: "Driver hits 240 mins continuous steering limit; mandates relief handover."
													})] }), activeScenario === "driver-rest" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
														size: "sm",
														variant: "default",
														onClick: resolveDriverHandover,
														className: "text-xs h-7 bg-primary text-primary-foreground cursor-pointer whitespace-nowrap",
														children: "Swap Relief Driver"
													}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
														size: "sm",
														variant: "outline",
														onClick: triggerDriverRestScenario,
														className: "text-xs h-7 border-primary/40 text-primary hover:bg-primary/10 cursor-pointer whitespace-nowrap",
														children: "Simulate Fatigue"
													})]
												})
											})
										]
									})
								]
							})]
						}),
						activeTab === "walkthrough" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "glass-panel p-5 rounded-3xl space-y-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "size-7 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs",
										children: "1"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
										className: "font-bold text-sm text-foreground",
										children: "1. Network & Timetable Architecture"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[11px] text-muted-foreground",
										children: "Defining corridors, stops, and departure headway."
									})] })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-muted-foreground leading-relaxed pl-9",
									children: "Operators configure routes (like Route 1: Town ⇄ Junction), geo-located bus stops, and generate the daily departure timetable."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "pl-9",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
										to: "/operations/trips",
										className: "text-xs font-semibold text-primary hover:underline flex items-center gap-1",
										children: ["Open Timetable & Departures ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-3" })]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "pt-3 border-t border-border/50 flex items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "size-7 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs",
										children: "2"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
										className: "font-bold text-sm text-foreground",
										children: "2. Google OR-Tools AI Schedule Optimization"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[11px] text-muted-foreground",
										children: "Solving mixed-integer vehicle & crew duties."
									})] })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-muted-foreground leading-relaxed pl-9",
									children: "Instead of manual guesswork, the AI solver batches trips into legal shifts, guaranteeing drivers never exceed 240 mins continuous driving and get 8h mandatory rest."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "pl-9",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
										to: "/scheduling/optimizer",
										className: "text-xs font-semibold text-primary hover:underline flex items-center gap-1",
										children: ["Open AI Schedule Optimizer ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-3" })]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "pt-3 border-t border-border/50 flex items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "size-7 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs",
										children: "3"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
										className: "font-bold text-sm text-foreground",
										children: "3. Real-Time Fleet Dispatch & Live Tracking"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[11px] text-muted-foreground",
										children: "Monitoring vehicles, passenger load, and adherence."
									})] })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-muted-foreground leading-relaxed pl-9",
									children: "The operations desk tracks buses moving across Salem corridors, alerting dispatchers if a bus falls behind schedule by more than 5 minutes."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "pl-9",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
										to: "/operations/today",
										className: "text-xs font-semibold text-primary hover:underline flex items-center gap-1",
										children: ["Open Live Dispatch Board ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-3" })]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "pt-3 border-t border-border/50 flex items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "size-7 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs",
										children: "4"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
										className: "font-bold text-sm text-foreground",
										children: "4. Automated Disruption Recovery"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[11px] text-muted-foreground",
										children: "Instant self-healing when vehicles break down."
									})] })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-muted-foreground leading-relaxed pl-9",
									children: "When a breakdown occurs, Disruption Radar generates candidate recovery plans, automatically recommending the lowest-delay standby vehicle dispatch."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "pl-9",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
										to: "/operations/incidents",
										className: "text-xs font-semibold text-primary hover:underline flex items-center gap-1",
										children: ["Open Disruption Radar ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-3" })]
									})
								})
							]
						}),
						activeTab === "telemetry" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "glass-panel p-4 rounded-3xl space-y-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Radio, { className: "size-4 text-emerald-500 animate-pulse" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-xs font-bold text-foreground",
										children: "Live Telemetry & Radio Dispatch Feed"
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "ghost",
									size: "sm",
									onClick: () => setEventLogs([]),
									className: "text-[10px] h-6 px-2 text-muted-foreground",
									children: "Clear Feed"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "space-y-2 max-h-[360px] overflow-y-auto pr-1",
								children: eventLogs.map((log) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: cn("p-2.5 rounded-xl border text-xs leading-relaxed", log.type === "alert" ? "border-rose-500/30 bg-rose-500/5 text-rose-700 dark:text-rose-300" : log.type === "recovery" || log.type === "success" ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300" : "border-border/60 bg-muted/30 text-muted-foreground"),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between font-mono text-[10px] text-muted-foreground mb-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: log.time }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "uppercase font-semibold tracking-wider",
											children: log.type
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-sans text-xs",
										children: log.text
									})]
								}, log.id))
							})]
						})
					]
				})]
			})]
		})
	});
}
//#endregion
export { SimulationPage as component };
