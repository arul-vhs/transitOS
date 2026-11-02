import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { v as Link, y as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { f as require_jsx_runtime } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { t as Button } from "./button-BnVgmmWP.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { F as Map, I as MapPin, M as MousePointerClick, S as Save, a as Waypoints, c as TriangleAlert, nt as Compass, p as Sparkles, st as CircleCheck, u as Trash2 } from "../_libs/lucide-react.mjs";
import { i as Badge, t as AppShell } from "./app-shell-CxpRo8VR.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-CrkmWf-u.mjs";
import { t as Label } from "./label-B3t-BMxc.mjs";
import { n as createRoute, r as createStop, s as getRoutes, t as analyzeRouteOverlap } from "./routes-gis-fns-BrjITXAP.mjs";
import { t as Input } from "./input-DHIRLsgR.mjs";
import { a as DialogHeader, i as DialogFooter, n as DialogContent, o as DialogTitle, r as DialogDescription, t as Dialog } from "./dialog-BY3bl4Fh.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/network.planner-BtHD5IXg.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function RoutePlannerPage() {
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const [code, setCode] = (0, import_react.useState)("");
	const [name, setName] = (0, import_react.useState)("");
	const [origin, setOrigin] = (0, import_react.useState)("");
	const [destination, setDestination] = (0, import_react.useState)("");
	const [durationMin, setDurationMin] = (0, import_react.useState)("35");
	const [direction, setDirection] = (0, import_react.useState)("UP");
	const [color, setColor] = (0, import_react.useState)("#F59E0B");
	const [status, setStatus] = (0, import_react.useState)("proposed");
	const [peakFreq, setPeakFreq] = (0, import_react.useState)("15");
	const [offPeakFreq, setOffPeakFreq] = (0, import_react.useState)("30");
	const [isDrawing, setIsDrawing] = (0, import_react.useState)(false);
	const [drawnCoords, setDrawnCoords] = (0, import_react.useState)([]);
	const [localStops, setLocalStops] = (0, import_react.useState)([]);
	const [stopNameInput, setStopNameInput] = (0, import_react.useState)("");
	const [selectedCoordIndex, setSelectedCoordIndex] = (0, import_react.useState)(null);
	const { data: activeRoutes = [] } = useQuery({
		queryKey: ["active-routes-planner"],
		queryFn: () => getRoutes({ status: "active" })
	});
	const analyzeMutation = useMutation({
		mutationFn: async () => {
			if (drawnCoords.length < 2) return [];
			return await analyzeRouteOverlap({
				type: "LineString",
				coordinates: drawnCoords
			});
		},
		onSuccess: (data) => {
			toast.success("Corridor overlap analysis completed.");
		}
	});
	const calculateDistanceKm = () => {
		if (drawnCoords.length < 2) return "0.00";
		let distMeters = 0;
		const R = 6371e3;
		for (let i = 0; i < drawnCoords.length - 1; i++) {
			const start = drawnCoords[i];
			const end = drawnCoords[i + 1];
			const lat1 = start[1] * Math.PI / 180;
			const lat2 = end[1] * Math.PI / 180;
			const deltaLat = (end[1] - start[1]) * Math.PI / 180;
			const deltaLng = (end[0] - start[0]) * Math.PI / 180;
			const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
			const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
			distMeters += R * c;
		}
		return (distMeters / 1e3).toFixed(2);
	};
	const calculatedLength = calculateDistanceKm();
	const [L, setL] = (0, import_react.useState)(null);
	const mapRef = (0, import_react.useRef)(null);
	const mapInstanceRef = (0, import_react.useRef)(null);
	const existingRoutesGroupRef = (0, import_react.useRef)(null);
	const proposedRoutePolylineRef = (0, import_react.useRef)(null);
	const proposedOverlapPolylineRef = (0, import_react.useRef)(null);
	const stopMarkersGroupRef = (0, import_react.useRef)(null);
	const clickMarkersGroupRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		if (typeof window !== "undefined") import("../_libs/leaflet.mjs").then((n) => /* @__PURE__ */ __toESM(n.t())).then((mod) => {
			setL(mod.default);
		});
	}, []);
	(0, import_react.useEffect)(() => {
		if (!L || !mapRef.current) return;
		if (!mapInstanceRef.current) {
			const map = L.map(mapRef.current).setView([11.6673, 78.1424], 13);
			L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap contributors" }).addTo(map);
			mapInstanceRef.current = map;
			existingRoutesGroupRef.current = L.featureGroup().addTo(map);
			proposedRoutePolylineRef.current = L.polyline([], {
				color,
				weight: 6,
				opacity: .9
			}).addTo(map);
			proposedOverlapPolylineRef.current = L.polyline([], {
				color: "#DC2626",
				weight: 8,
				opacity: .8,
				dashArray: "10, 10"
			}).addTo(map);
			stopMarkersGroupRef.current = L.featureGroup().addTo(map);
			clickMarkersGroupRef.current = L.featureGroup().addTo(map);
			map.on("click", (e) => {
				if (mapRef.current?.getAttribute("data-drawing") === "true") {
					const lat = e.latlng.lat;
					const lng = e.latlng.lng;
					setDrawnCoords((prev) => [...prev, [lng, lat]]);
				}
			});
		}
	}, [L]);
	(0, import_react.useEffect)(() => {
		if (mapRef.current) mapRef.current.setAttribute("data-drawing", String(isDrawing));
	}, [isDrawing]);
	(0, import_react.useEffect)(() => {
		if (!L || !mapInstanceRef.current) return;
		mapInstanceRef.current;
		existingRoutesGroupRef.current.clearLayers();
		activeRoutes.forEach((r) => {
			if (r.geometryGeojson?.coordinates?.length > 1) {
				const latlngs = r.geometryGeojson.coordinates.map((c) => [c[1], c[0]]);
				const polyline = L.polyline(latlngs, {
					color: r.color || "#9CA3AF",
					weight: 3,
					opacity: .35
				});
				polyline.bindPopup(`<b>${r.code}</b>: ${r.name}`);
				polyline.addTo(existingRoutesGroupRef.current);
			}
		});
		const latlngs = drawnCoords.map((c) => [c[1], c[0]]);
		proposedRoutePolylineRef.current.setLatLngs(latlngs);
		proposedRoutePolylineRef.current.setStyle({ color });
		clickMarkersGroupRef.current.clearLayers();
		drawnCoords.forEach((c, idx) => {
			const isStop = localStops.some((s) => s.lat === c[1] && s.lng === c[0]);
			const vertexMarker = L.circleMarker([c[1], c[0]], {
				radius: isStop ? 8 : 5,
				fillColor: isStop ? "#FFFFFF" : color,
				color: isStop ? color : "#FFFFFF",
				weight: 2,
				opacity: 1,
				fillOpacity: 1
			});
			vertexMarker.bindPopup(`
        <div class="space-y-1 text-xs">
          <p><b>Vertex ${idx + 1}</b></p>
          <p>${c[1].toFixed(5)}, ${c[0].toFixed(5)}</p>
          ${isStop ? `<p class="text-primary"><b>Stop Node</b></p>` : ""}
        </div>
      `);
			vertexMarker.addTo(clickMarkersGroupRef.current);
		});
		proposedOverlapPolylineRef.current.setLatLngs([]);
		const overlapRes = analyzeMutation.data || [];
		const overlapCoords = [];
		overlapRes.forEach((res) => {
			res.overlapCoordinates.forEach((c) => {
				overlapCoords.push([c[1], c[0]]);
			});
		});
		if (overlapCoords.length > 0) proposedOverlapPolylineRef.current.setLatLngs(overlapCoords);
		stopMarkersGroupRef.current.clearLayers();
		localStops.forEach((stop) => {
			const markerIcon = L.divIcon({
				html: `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 4px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: white; font-size: 9px; font-weight: bold;">${stop.sequence}</div>`,
				className: "custom-stop-marker-planner",
				iconSize: [16, 16],
				iconAnchor: [8, 8]
			});
			const marker = L.marker([stop.lat, stop.lng], { icon: markerIcon });
			marker.bindPopup(`<b>Stop ${stop.sequence}: ${stop.name}</b>`);
			marker.addTo(stopMarkersGroupRef.current);
		});
	}, [
		L,
		activeRoutes,
		drawnCoords,
		color,
		localStops,
		analyzeMutation.data
	]);
	const saveRouteMutation = useMutation({
		mutationFn: async () => {
			if (!code) throw new Error("Route code is required");
			if (!name) throw new Error("Route name is required");
			if (drawnCoords.length < 2) throw new Error("Please draw at least 2 points on the map");
			const newRoute = await createRoute({
				code,
				name,
				origin: origin || localStops[0]?.name || "Salem Origin",
				destination: destination || localStops[localStops.length - 1]?.name || "Salem Destination",
				lengthKm: calculatedLength,
				durationMin: Number(durationMin),
				direction,
				color,
				status,
				peakFrequency: Number(peakFreq),
				offPeakFrequency: Number(offPeakFreq),
				geometryGeojson: {
					type: "LineString",
					coordinates: drawnCoords
				}
			});
			for (const stop of localStops) await createStop({
				routeId: newRoute.id,
				name: stop.name,
				sequence: stop.sequence,
				latitude: String(stop.lat),
				longitude: String(stop.lng)
			});
			return newRoute;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["routes"] });
			toast.success(`Proposed Route ${code} successfully saved to database.`);
			navigate({ to: "/network/routes" });
		},
		onError: (err) => {
			toast.error(err.message || "Failed to save route");
		}
	});
	const handleMarkAsStop = (e) => {
		e.preventDefault();
		if (selectedCoordIndex === null) return;
		const coord = drawnCoords[selectedCoordIndex];
		const newStop = {
			name: stopNameInput,
			lat: coord[1],
			lng: coord[0],
			sequence: localStops.length + 1
		};
		setLocalStops((prev) => [...prev, newStop]);
		setStopNameInput("");
		setSelectedCoordIndex(null);
		toast.success(`Marked Vertex ${selectedCoordIndex + 1} as Stop: "${stopNameInput}"`);
	};
	const handleClearDraw = () => {
		setDrawnCoords([]);
		setLocalStops([]);
		analyzeMutation.reset();
		toast.info("Drawn corridor cleared");
	};
	const getRecommendation = (results) => {
		const maxOverlap = results.reduce((max, r) => Math.max(max, r.overlapPercentage), 0);
		if (maxOverlap > 40) return {
			severity: "HIGH",
			color: "text-destructive border-destructive/20 bg-destructive/5",
			text: "High corridor overlap detected. This proposed route conflicts heavily with existing routes."
		};
		else if (maxOverlap > 10) return {
			severity: "MEDIUM",
			color: "text-warning border-warning/20 bg-warning/5",
			text: "Moderate corridor overlap detected. Consider modifying the proposed corridor."
		};
		else return {
			severity: "LOW",
			color: "text-success border-success/20 bg-success/5",
			text: "Minimal corridor overlap. The proposed corridor is mostly independent."
		};
	};
	const overlapList = analyzeMutation.data || [];
	const recommendation = getRecommendation(overlapList);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "Route Planner",
		subtitle: "Interactive corridor sketching, stop sequencing and topological overlap calculations.",
		actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				asChild: true,
				variant: "outline",
				size: "sm",
				className: "hidden sm:inline-flex text-xs",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/network/routes",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Map, { className: "mr-1.5 size-3.5 text-primary" }), "Route Network"]
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				asChild: true,
				variant: "outline",
				size: "sm",
				className: "hidden sm:inline-flex text-xs",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/scheduling/optimizer",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "mr-1.5 size-3.5 text-primary" }), "Schedule Optimizer"]
				})
			})]
		}),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-6 lg:grid-cols-[400px_1fr]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "glass-panel p-5 space-y-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
							className: "text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 border-b border-border/60 pb-2.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Compass, { className: "size-4 text-primary" }), " Corridor Specifications"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-3.5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-2 gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-1.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "code",
											className: "text-xs",
											children: "Route Code"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											id: "code",
											value: code,
											onChange: (e) => setCode(e.target.value),
											placeholder: "e.g. Route 106",
											className: "font-mono text-xs font-bold text-primary bg-background/60"
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-1.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "direction",
											className: "text-xs",
											children: "Direction"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
											value: direction,
											onValueChange: setDirection,
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
												id: "direction",
												className: "text-xs font-mono bg-background/60",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "UP",
													children: "UP Direction"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "DOWN",
													children: "DOWN Direction"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "CIRCULAR",
													children: "CIRCULAR"
												})
											] })]
										})]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										htmlFor: "name",
										className: "text-xs",
										children: "Route Name"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										id: "name",
										value: name,
										onChange: (e) => setName(e.target.value),
										placeholder: "e.g. Gugai - Alagapuram Loop",
										className: "text-xs bg-background/60"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-2 gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "origin",
											children: "Origin (Auto)"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											id: "origin",
											value: origin,
											onChange: (e) => setOrigin(e.target.value),
											placeholder: localStops[0]?.name || "First Stop Node"
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "destination",
											children: "Destination (Auto)"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											id: "destination",
											value: destination,
											onChange: (e) => setDestination(e.target.value),
											placeholder: localStops[localStops.length - 1]?.name || "Last Stop Node"
										})]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-3 gap-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-1",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												htmlFor: "length",
												children: "Length (Km)"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												id: "length",
												value: calculatedLength,
												readOnly: true,
												className: "bg-muted font-mono"
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-1",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												htmlFor: "duration",
												children: "Est. Min"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												id: "duration",
												type: "number",
												value: durationMin,
												onChange: (e) => setDurationMin(e.target.value),
												className: "font-mono"
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-1",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												htmlFor: "color",
												children: "Color"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												id: "color",
												type: "color",
												value: color,
												onChange: (e) => setColor(e.target.value),
												className: "h-9 p-0.5"
											})]
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-2 gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "peak",
											children: "Peak Freq (min)"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											id: "peak",
											type: "number",
											value: peakFreq,
											onChange: (e) => setPeakFreq(e.target.value),
											className: "font-mono"
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "offpeak",
											children: "Off-Peak (min)"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											id: "offpeak",
											type: "number",
											value: offPeakFreq,
											onChange: (e) => setOffPeakFreq(e.target.value),
											className: "font-mono"
										})]
									})]
								})
							]
						})]
					}),
					drawnCoords.length >= 2 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "panel p-4 space-y-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex justify-between items-center border-b pb-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
								className: "text-sm font-semibold flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Waypoints, { className: "size-4 text-primary" }), " Route Overlap Analysis"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								onClick: () => analyzeMutation.mutate(),
								disabled: analyzeMutation.isPending,
								children: analyzeMutation.isPending ? "Analyzing..." : "Analyze Overlap"
							})]
						}), analyzeMutation.data ? overlapList.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 rounded-lg border border-success/20 bg-success/5 px-4 py-3 text-xs font-semibold text-success",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "size-4" }), " Minimal corridor overlap. Proposed corridor is independent."]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: `flex items-start gap-2.5 rounded-lg border px-4 py-3 text-xs font-medium ${recommendation.color}`,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "size-4 mt-0.5 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "font-bold",
									children: ["Severity: ", recommendation.severity]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-normal mt-0.5",
									children: recommendation.text
								})] })]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "space-y-2",
								children: overlapList.map((res) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between items-center text-xs p-2 rounded bg-secondary/10 border",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-semibold text-foreground",
										children: res.routeCode
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-muted-foreground ml-1 font-normal",
										children: [
											"(",
											res.routeName,
											")"
										]
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "text-right",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "font-semibold font-mono text-primary",
											children: [res.overlapDistanceKm, " km"]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-[10px] text-muted-foreground",
											children: [res.overlapPercentage, "% overlap"]
										})]
									})]
								}, res.routeId))
							})]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "p-4 text-center text-xs text-muted-foreground border border-dashed rounded-md",
							children: "Click \"Analyze Overlap\" to calculate segment proximity."
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "outline",
							className: "flex-1",
							onClick: handleClearDraw,
							disabled: drawnCoords.length === 0,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4 mr-1.5" }), " Clear Path"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							className: "flex-1",
							disabled: drawnCoords.length < 2 || saveRouteMutation.isPending,
							onClick: () => saveRouteMutation.mutate(),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { className: "size-4 mr-1.5" }), " Save Corridor"]
						})]
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "panel overflow-hidden flex flex-col h-[600px]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 bg-secondary/15",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Map, { className: "size-4 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-sm font-semibold",
								children: "Corridor Sketching Canvas"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								variant: isDrawing ? "destructive" : "default",
								onClick: () => setIsDrawing(!isDrawing),
								children: isDrawing ? "Pause Drawing Mode" : "Enable Map Click Drawing"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								variant: "outline",
								children: "OSM tiles"
							})]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex-1 relative z-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							ref: mapRef,
							className: "h-full w-full bg-accent/20"
						}), isDrawing && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "absolute top-3 left-12 bg-background/95 border border-primary/30 p-2.5 rounded-lg shadow-lg max-w-[280px] z-[1000] text-xs space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-1.5 font-bold text-primary",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MousePointerClick, { className: "size-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Drawing Mode Active" })]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-muted-foreground font-normal",
								children: "Click coordinates on the map to add proposed corridor vertex points."
							})]
						})]
					})]
				}), drawnCoords.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "panel p-4 space-y-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
						className: "text-sm font-semibold flex items-center gap-2 border-b pb-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "size-4 text-primary" }), " Drawn Vertices & Stops Mapping"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-6 md:grid-cols-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs font-bold uppercase text-muted-foreground",
								children: "Corridor Vertices"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "max-h-[220px] overflow-y-auto space-y-1 border rounded-md p-1.5 bg-background/50",
								children: drawnCoords.map((c, idx) => {
									const isStop = localStops.some((s) => s.lat === c[1] && s.lng === c[0]);
									return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex justify-between items-center text-xs p-1.5 rounded border border-transparent hover:bg-secondary",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "font-mono",
											children: [
												"Point ",
												idx + 1,
												": ",
												c[1].toFixed(5),
												", ",
												c[0].toFixed(5)
											]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "flex gap-2",
											children: isStop ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
												variant: "secondary",
												className: "text-[9px] uppercase font-bold py-0.5",
												children: "Stop Node"
											}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												size: "sm",
												variant: "outline",
												className: "h-6 py-0 px-2 text-[10px]",
												onClick: () => setSelectedCoordIndex(idx),
												children: "Mark as Stop"
											})
										})]
									}, idx);
								})
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs font-bold uppercase text-muted-foreground",
								children: "Sequenced Stops"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "max-h-[220px] overflow-y-auto space-y-1 border rounded-md p-1.5 bg-background/50",
								children: localStops.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "py-10 text-center text-xs text-muted-foreground",
									children: "No stops defined. Mark a vertex as stop."
								}) : localStops.map((stop) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between items-center text-xs p-1.5 rounded bg-primary/5 border border-primary/10",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-1.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-bold text-primary font-mono",
											children: stop.sequence
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-semibold",
											children: stop.name
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "font-mono text-[10px] text-muted-foreground",
										children: [
											"(",
											stop.lat.toFixed(4),
											", ",
											stop.lng.toFixed(4),
											")"
										]
									})]
								}, stop.sequence))
							})]
						})]
					})]
				})]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
			open: selectedCoordIndex !== null,
			onOpenChange: (val) => {
				if (!val) setSelectedCoordIndex(null);
			},
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogContent, {
				className: "sm:max-w-[360px]",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					onSubmit: handleMarkAsStop,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Mark Coordinate as Stop" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogDescription, { children: [
							"Assign a Stop Node Name to Vertex",
							" ",
							selectedCoordIndex !== null ? selectedCoordIndex + 1 : "",
							"."
						] })] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "py-4 space-y-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "stopNameInput",
								children: "Stop Location Name"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "stopNameInput",
								value: stopNameInput,
								onChange: (e) => setStopNameInput(e.target.value),
								placeholder: "e.g. Old Bypass Junction",
								required: true
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "outline",
							onClick: () => setSelectedCoordIndex(null),
							children: "Cancel"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "submit",
							children: "Assign Stop"
						})] })
					]
				})
			})
		})]
	});
}
//#endregion
export { RoutePlannerPage as component };
