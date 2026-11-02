import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { f as require_jsx_runtime } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { n as cn, t as Button } from "./button-BnVgmmWP.mjs";
import { t as hasPermission } from "./auth-shared-CAbXQXMK.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { A as Pen, C as Route, D as Plus, F as Map, I as MapPin, U as ListOrdered, X as Funnel, a as Waypoints, c as TriangleAlert, kt as Activity, p as Sparkles, u as Trash2, wt as ArrowUpDown, x as Search } from "../_libs/lucide-react.mjs";
import { a as TabsList, i as TabsContent, n as Route$27, o as TabsTrigger, r as Tabs } from "./router-9Rnl3R3s.mjs";
import { i as Badge, t as AppShell } from "./app-shell-CxpRo8VR.mjs";
import { a as TableHeader, i as TableHead, n as TableBody, o as TableRow, r as TableCell, t as Table } from "./table-BcOd4hKY.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-CrkmWf-u.mjs";
import { t as Label } from "./label-B3t-BMxc.mjs";
import { a as deleteStop, c as updateRoute, i as deleteRoute, l as updateRouteStatus, n as createRoute, o as getRoute, r as createStop, s as getRoutes, t as analyzeRouteOverlap, u as updateStop } from "./routes-gis-fns-BrjITXAP.mjs";
import { t as Input } from "./input-DHIRLsgR.mjs";
import { a as DialogHeader, i as DialogFooter, n as DialogContent, o as DialogTitle, r as DialogDescription, t as Dialog } from "./dialog-BY3bl4Fh.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/network.routes-BkNvtFE2.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function RoutesPage() {
	const queryClient = useQueryClient();
	const user = Route$27.useRouteContext()?.user;
	const canManage = hasPermission(user?.role || "", "routes.manage");
	const [search, setSearch] = (0, import_react.useState)("");
	const [statusFilter, setStatusFilter] = (0, import_react.useState)("all");
	const [directionFilter, setDirectionFilter] = (0, import_react.useState)("all");
	const [selectedRouteId, setSelectedRouteId] = (0, import_react.useState)(null);
	const [activeTab, setActiveTab] = (0, import_react.useState)("map");
	const [isCreateOpen, setIsCreateOpen] = (0, import_react.useState)(false);
	const [isEditOpen, setIsEditOpen] = (0, import_react.useState)(false);
	const [isAddStopOpen, setIsAddStopOpen] = (0, import_react.useState)(false);
	const [formCode, setFormCode] = (0, import_react.useState)("");
	const [formName, setFormName] = (0, import_react.useState)("");
	const [formOrigin, setFormOrigin] = (0, import_react.useState)("");
	const [formDestination, setFormDestination] = (0, import_react.useState)("");
	const [formLengthKm, setFormLengthKm] = (0, import_react.useState)("10.00");
	const [formDurationMin, setFormDurationMin] = (0, import_react.useState)("30");
	const [formDirection, setFormDirection] = (0, import_react.useState)("UP");
	const [formColor, setFormColor] = (0, import_react.useState)("#3B82F6");
	const [formStatus, setFormStatus] = (0, import_react.useState)("draft");
	const [formPeakFreq, setFormPeakFreq] = (0, import_react.useState)("15");
	const [formOffPeakFreq, setFormOffPeakFreq] = (0, import_react.useState)("30");
	const [stopName, setStopName] = (0, import_react.useState)("");
	const [stopSeq, setStopSeq] = (0, import_react.useState)("");
	const [stopLat, setStopLat] = (0, import_react.useState)("11.6673");
	const [stopLng, setStopLng] = (0, import_react.useState)("78.1424");
	const { data: routesList = [], isLoading } = useQuery({
		queryKey: [
			"routes",
			statusFilter,
			directionFilter,
			search
		],
		queryFn: () => getRoutes({
			status: statusFilter,
			direction: directionFilter,
			search
		})
	});
	(0, import_react.useEffect)(() => {
		if (routesList.length > 0 && !selectedRouteId) setSelectedRouteId(routesList[0].id);
	}, [routesList, selectedRouteId]);
	const { data: selectedRouteDetails } = useQuery({
		queryKey: ["route", selectedRouteId],
		queryFn: () => getRoute(selectedRouteId),
		enabled: !!selectedRouteId,
		placeholderData: (previousData) => previousData
	});
	const { data: overlapResults = [], refetch: runOverlapCheck } = useQuery({
		queryKey: ["route-overlap-analysis", selectedRouteId],
		queryFn: () => analyzeRouteOverlap(selectedRouteDetails?.geometryGeojson),
		enabled: !!selectedRouteDetails?.geometryGeojson
	});
	const [L, setL] = (0, import_react.useState)(null);
	const mapRef = (0, import_react.useRef)(null);
	const mapInstanceRef = (0, import_react.useRef)(null);
	const polylineGroupRef = (0, import_react.useRef)(null);
	const markerGroupRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		if (typeof window !== "undefined") import("../_libs/leaflet.mjs").then((n) => /* @__PURE__ */ __toESM(n.t())).then((mod) => {
			setL(mod.default);
		});
	}, []);
	(0, import_react.useEffect)(() => {
		if (!L || !mapRef.current) return;
		let map = mapInstanceRef.current;
		if (!map || map.getContainer() !== mapRef.current) {
			if (map) {
				try {
					map.remove();
				} catch {}
				mapInstanceRef.current = null;
			}
			if (mapRef.current) delete mapRef.current._leaflet_id;
			map = L.map(mapRef.current).setView([11.6673, 78.1424], 13);
			L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap contributors" }).addTo(map);
			mapInstanceRef.current = map;
			polylineGroupRef.current = L.featureGroup().addTo(map);
			markerGroupRef.current = L.featureGroup().addTo(map);
		}
		if (!polylineGroupRef.current || !markerGroupRef.current) {
			polylineGroupRef.current = L.featureGroup().addTo(map);
			markerGroupRef.current = L.featureGroup().addTo(map);
		}
		polylineGroupRef.current.clearLayers();
		markerGroupRef.current.clearLayers();
		routesList.forEach((r) => {
			if (r.geometryGeojson?.coordinates?.length > 1) {
				const latlngs = r.geometryGeojson.coordinates.filter((c) => Array.isArray(c) && !isNaN(Number(c[0])) && !isNaN(Number(c[1]))).map((c) => [Number(c[1]), Number(c[0])]);
				if (latlngs.length > 1) {
					const active = r.id === selectedRouteId;
					const polyline = L.polyline(latlngs, {
						color: r.color || "#3B82F6",
						weight: active ? 6 : 3,
						opacity: active ? 1 : .4
					});
					polyline.bindPopup(`<b>${r.code}</b><br/>${r.name}`);
					polyline.addTo(polylineGroupRef.current);
				}
			}
		});
		if (selectedRouteDetails?.stops) {
			selectedRouteDetails.stops.forEach((stop) => {
				const lat = Number(stop.latitude);
				const lng = Number(stop.longitude);
				if (!isNaN(lat) && !isNaN(lng)) {
					const markerIcon = L.divIcon({
						html: `<div style="background-color: ${selectedRouteDetails.color || "#3B82F6"}; width: 14px; height: 14px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 1px 4px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: white; font-size: 8px; font-weight: bold;">${stop.sequence}</div>`,
						className: "custom-stop-marker",
						iconSize: [14, 14],
						iconAnchor: [7, 7]
					});
					const marker = L.marker([lat, lng], {
						icon: markerIcon,
						draggable: canManage
					});
					marker.bindPopup(`<b>Stop ${stop.sequence}: ${stop.name}</b><br/>Sequence: ${stop.sequence}<br/>Drag to move stop position`);
					if (canManage) marker.on("dragend", async (event) => {
						const newLatLng = event.target.getLatLng();
						try {
							await updateStop({
								id: stop.id,
								data: {
									name: stop.name,
									sequence: stop.sequence,
									latitude: String(newLatLng.lat.toFixed(6)),
									longitude: String(newLatLng.lng.toFixed(6))
								}
							});
							queryClient.invalidateQueries({ queryKey: ["route", selectedRouteId] });
							toast.success(`Position of stop "${stop.name}" updated.`);
						} catch (err) {
							toast.error(err.message || "Failed to update stop position");
						}
					});
					marker.addTo(markerGroupRef.current);
				}
			});
			if (selectedRouteDetails.geometryGeojson?.coordinates?.length > 1) try {
				const latlngs = selectedRouteDetails.geometryGeojson.coordinates.filter((c) => Array.isArray(c) && !isNaN(Number(c[0])) && !isNaN(Number(c[1]))).map((c) => [Number(c[1]), Number(c[0])]);
				if (latlngs.length > 0) {
					const bounds = L.latLngBounds(latlngs);
					if (bounds.isValid()) map.fitBounds(bounds, {
						padding: [40, 40],
						maxZoom: 15
					});
				}
			} catch (err) {
				console.warn("fitBounds warning:", err);
			}
		}
		const timer = setTimeout(() => {
			try {
				mapInstanceRef.current?.invalidateSize();
			} catch {}
		}, 100);
		return () => clearTimeout(timer);
	}, [
		L,
		routesList,
		selectedRouteId,
		selectedRouteDetails,
		canManage,
		activeTab
	]);
	const createRouteMutation = useMutation({
		mutationFn: createRoute,
		onSuccess: (newR) => {
			queryClient.invalidateQueries({ queryKey: ["routes"] });
			setSelectedRouteId(newR.id);
			toast.success("Route created successfully");
			setIsCreateOpen(false);
			resetForm();
		},
		onError: (err) => {
			toast.error(err.message || "Failed to create route");
		}
	});
	const updateRouteMutation = useMutation({
		mutationFn: updateRoute,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["routes"] });
			queryClient.invalidateQueries({ queryKey: ["route", selectedRouteId] });
			toast.success("Route updated successfully");
			setIsEditOpen(false);
		},
		onError: (err) => {
			toast.error(err.message || "Failed to update route");
		}
	});
	const deleteRouteMutation = useMutation({
		mutationFn: deleteRoute,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["routes"] });
			setSelectedRouteId(null);
			toast.success("Route archived successfully");
		},
		onError: (err) => {
			toast.error(err.message || "Failed to archive route");
		}
	});
	const statusMutation = useMutation({
		mutationFn: updateRouteStatus,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["routes"] });
			queryClient.invalidateQueries({ queryKey: ["route", selectedRouteId] });
			toast.success("Route status updated");
		},
		onError: (err) => {
			toast.error(err.message || "Failed to update status");
		}
	});
	const createStopMutation = useMutation({
		mutationFn: createStop,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["route", selectedRouteId] });
			toast.success("Stop added successfully");
			setIsAddStopOpen(false);
			setStopName("");
			setStopSeq("");
		},
		onError: (err) => {
			toast.error(err.message || "Failed to add stop");
		}
	});
	const deleteStopMutation = useMutation({
		mutationFn: deleteStop,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["route", selectedRouteId] });
			toast.success("Stop deleted and sequence re-numbered");
		},
		onError: (err) => {
			toast.error(err.message || "Failed to delete stop");
		}
	});
	const shiftStopSequenceMutation = useMutation({
		mutationFn: async (payload) => {
			const stopsList = selectedRouteDetails?.stops || [];
			const index = stopsList.findIndex((s) => s.id === payload.stop.id);
			if (index === -1) return;
			const swapIndex = payload.direction === "up" ? index - 1 : index + 1;
			if (swapIndex < 0 || swapIndex >= stopsList.length) return;
			const currentStop = stopsList[index];
			const targetStop = stopsList[swapIndex];
			await updateStop({
				id: targetStop.id,
				data: {
					name: targetStop.name,
					sequence: currentStop.sequence,
					latitude: targetStop.latitude,
					longitude: targetStop.longitude
				}
			});
			await updateStop({
				id: currentStop.id,
				data: {
					name: currentStop.name,
					sequence: targetStop.sequence,
					latitude: currentStop.latitude,
					longitude: currentStop.longitude
				}
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["route", selectedRouteId] });
			toast.success("Stop sequence reordered");
		},
		onError: (err) => {
			toast.error(err.message || "Failed to shift sequence");
		}
	});
	const resetForm = () => {
		setFormCode("");
		setFormName("");
		setFormOrigin("");
		setFormDestination("");
		setFormLengthKm("10.00");
		setFormDurationMin("30");
		setFormDirection("UP");
		setFormColor("#3B82F6");
		setFormStatus("draft");
		setFormPeakFreq("15");
		setFormOffPeakFreq("30");
	};
	const handleOpenEdit = () => {
		if (!selectedRouteDetails) return;
		setFormCode(selectedRouteDetails.code);
		setFormName(selectedRouteDetails.name);
		setFormOrigin(selectedRouteDetails.origin || "");
		setFormDestination(selectedRouteDetails.destination || "");
		setFormLengthKm(selectedRouteDetails.lengthKm);
		setFormDurationMin(String(selectedRouteDetails.durationMin));
		setFormDirection(selectedRouteDetails.direction || "UP");
		setFormColor(selectedRouteDetails.color || "#3B82F6");
		setFormStatus(selectedRouteDetails.status);
		setFormPeakFreq(String(selectedRouteDetails.peakFrequency || 15));
		setFormOffPeakFreq(String(selectedRouteDetails.offPeakFrequency || 30));
		setIsEditOpen(true);
	};
	const handleCreateSubmit = (e) => {
		e.preventDefault();
		createRouteMutation.mutate({
			code: formCode,
			name: formName,
			origin: formOrigin,
			destination: formDestination,
			lengthKm: formLengthKm,
			durationMin: Number(formDurationMin),
			direction: formDirection,
			color: formColor,
			status: formStatus,
			peakFrequency: Number(formPeakFreq),
			offPeakFrequency: Number(formOffPeakFreq),
			geometryGeojson: {
				type: "LineString",
				coordinates: [[78.1424, 11.6673], [78.1573, 11.6795]]
			}
		});
	};
	const handleEditSubmit = (e) => {
		e.preventDefault();
		if (!selectedRouteId) return;
		updateRouteMutation.mutate({
			id: selectedRouteId,
			data: {
				code: formCode,
				name: formName,
				origin: formOrigin,
				destination: formDestination,
				lengthKm: formLengthKm,
				durationMin: Number(formDurationMin),
				direction: formDirection,
				color: formColor,
				status: formStatus,
				peakFrequency: Number(formPeakFreq),
				offPeakFrequency: Number(formOffPeakFreq),
				geometryGeojson: selectedRouteDetails?.geometryGeojson
			}
		});
	};
	const handleAddStopSubmit = (e) => {
		e.preventDefault();
		if (!selectedRouteId) return;
		createStopMutation.mutate({
			routeId: selectedRouteId,
			name: stopName,
			sequence: Number(stopSeq || selectedRouteDetails?.stops?.length + 1 || 1),
			latitude: stopLat,
			longitude: stopLng
		});
	};
	const totalRoutes = routesList.length;
	const activeRoutes = routesList.filter((r) => r.status === "active").length;
	const draftRoutes = routesList.filter((r) => r.status === "draft").length;
	const proposedRoutes = routesList.filter((r) => r.status === "proposed").length;
	const avgLength = totalRoutes > 0 ? (routesList.reduce((acc, r) => acc + Number(r.lengthKm), 0) / totalRoutes).toFixed(1) : "0";
	const avgDuration = totalRoutes > 0 ? Math.round(routesList.reduce((acc, r) => acc + r.durationMin, 0) / totalRoutes) : 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "Route Network",
		subtitle: "Operational corridor registries, coordinate stop sequencing, and geographic maps.",
		actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					asChild: true,
					variant: "outline",
					size: "sm",
					className: "hidden sm:inline-flex text-xs",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/network/planner",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Route, { className: "mr-1.5 size-3.5 text-primary" }), "Route Planner"]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					asChild: true,
					variant: "outline",
					size: "sm",
					className: "hidden sm:inline-flex text-xs",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/scheduling/optimizer",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "mr-1.5 size-3.5 text-primary" }), "Schedule Optimizer"]
					})
				}),
				canManage && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					size: "sm",
					onClick: () => {
						resetForm();
						setIsCreateOpen(true);
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "mr-2 size-4" }), "Create Route"]
				})
			]
		}),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "glass-card p-4 rounded-xl border flex flex-col justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[10px] font-bold uppercase tracking-wider text-muted-foreground",
									children: "Total Corridors"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-2xl font-bold font-mono mt-1 text-foreground",
									children: totalRoutes
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "glass-card p-4 rounded-xl border-l-4 border-l-success flex flex-col justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[10px] font-bold uppercase tracking-wider text-muted-foreground",
									children: "Active"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-2xl font-bold font-mono mt-1 text-success",
									children: activeRoutes
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "glass-card p-4 rounded-xl border-l-4 border-l-info flex flex-col justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[10px] font-bold uppercase tracking-wider text-muted-foreground",
									children: "Draft"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-2xl font-bold font-mono mt-1 text-info",
									children: draftRoutes
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "glass-card p-4 rounded-xl border-l-4 border-l-warning flex flex-col justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[10px] font-bold uppercase tracking-wider text-muted-foreground",
									children: "Proposed"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-2xl font-bold font-mono mt-1 text-warning",
									children: proposedRoutes
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "glass-card p-4 rounded-xl border-l-4 border-l-primary flex flex-col justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[10px] font-bold uppercase tracking-wider text-muted-foreground",
									children: "Avg Length"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-2xl font-bold font-mono mt-1 text-foreground",
									children: [avgLength, " km"]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "glass-card p-4 rounded-xl border-l-4 border-l-secondary flex flex-col justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[10px] font-bold uppercase tracking-wider text-muted-foreground",
									children: "Avg Duration"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-2xl font-bold font-mono mt-1 text-foreground",
									children: [avgDuration, " min"]
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
										placeholder: "Search route code, name, stops...",
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
												value: "active",
												children: "Active"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: "draft",
												children: "Draft"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: "proposed",
												children: "Proposed"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: "suspended",
												children: "Suspended"
											})
										] })]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex items-center gap-2",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
										value: directionFilter,
										onValueChange: setDirectionFilter,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
											className: "w-36 bg-background/60 text-xs border-border/80",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Direction" })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: "all",
												children: "All Directions"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: "UP",
												children: "Up direction"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: "DOWN",
												children: "Down direction"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: "CIRCULAR",
												children: "Circular"
											})
										] })]
									})
								})
							]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-6 lg:grid-cols-[380px_1fr]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "glass-panel p-3.5 h-fit space-y-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "px-1 text-xs font-bold uppercase tracking-wider text-muted-foreground",
								children: [
									"Corridor Registers (",
									routesList.length,
									")"
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "max-h-[540px] overflow-y-auto space-y-1.5 pr-1",
								children: isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "py-10 text-center text-xs text-muted-foreground",
									children: "Loading corridors..."
								}) : routesList.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "py-10 text-center text-xs text-muted-foreground",
									children: "No corridors match filters."
								}) : routesList.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									onClick: () => setSelectedRouteId(r.id),
									className: cn("w-full rounded-xl p-3 text-left transition-all duration-150 flex items-center justify-between border cursor-pointer", r.id === selectedRouteId ? "bg-primary/10 border-primary shadow-xs ring-1 ring-primary/30" : "hover:bg-muted/60 bg-card/50 border-border/70"),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "size-3 rounded-full border border-white/40 shadow-xs shrink-0",
												style: { backgroundColor: r.color || "#3B82F6" }
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "font-bold text-xs font-mono text-foreground",
												children: r.code
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
												variant: "outline",
												className: "text-[9px] px-1 py-0 uppercase font-mono",
												children: r.direction
											})
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-[11px] text-muted-foreground mt-1 truncate max-w-[220px]",
										children: [
											r.origin,
											" ➔ ",
											r.destination
										]
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "text-right text-[10px] font-mono text-muted-foreground",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [r.lengthKm, " km"] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [r.durationMin, " min"] })]
									})]
								}, r.id))
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "space-y-4",
							children: selectedRouteDetails ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "panel p-4 flex flex-wrap items-center justify-between gap-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "size-4 rounded-full border border-white",
											style: { backgroundColor: selectedRouteDetails.color || "#3B82F6" }
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
											className: "text-lg font-bold text-foreground",
											children: selectedRouteDetails.code
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
											variant: "secondary",
											className: "uppercase text-[9px] h-5 px-1 font-semibold",
											children: selectedRouteDetails.direction
										})
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm text-muted-foreground mt-0.5",
									children: selectedRouteDetails.name
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex gap-2",
									children: canManage && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
											value: selectedRouteDetails.status,
											onValueChange: (val) => statusMutation.mutate({
												id: selectedRouteDetails.id,
												status: val
											}),
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
												className: "h-8 w-[120px] text-xs uppercase font-semibold bg-background/50",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "active",
													className: "text-xs uppercase",
													children: "Active"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "draft",
													className: "text-xs uppercase",
													children: "Draft"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "proposed",
													className: "text-xs uppercase",
													children: "Proposed"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "suspended",
													className: "text-xs uppercase",
													children: "Suspended"
												})
											] })]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											size: "sm",
											variant: "outline",
											onClick: handleOpenEdit,
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pen, { className: "size-3.5 mr-1" }), " Edit"]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											size: "sm",
											variant: "destructive",
											onClick: () => {
												if (confirm(`Archive route ${selectedRouteDetails.code}?`)) deleteRouteMutation.mutate(selectedRouteDetails.id);
											},
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-3.5 mr-1" }), " Archive"]
										})
									] })
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
								value: activeTab,
								onValueChange: setActiveTab,
								className: "w-full",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, {
										className: "bg-muted p-1 rounded-md",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsTrigger, {
												value: "map",
												className: "flex items-center gap-1",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Map, { className: "size-3.5" }), " Map Network"]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsTrigger, {
												value: "stops",
												className: "flex items-center gap-1",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListOrdered, { className: "size-3.5" }),
													" Stops CRUD (",
													selectedRouteDetails.stops?.length || 0,
													")"
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsTrigger, {
												value: "overlap",
												className: "flex items-center gap-1",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Waypoints, { className: "size-3.5" }), " Overlap Analysis"]
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
										value: "map",
										forceMount: true,
										className: cn("mt-4", activeTab !== "map" && "hidden"),
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
											className: "panel overflow-hidden",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "bg-secondary/40 px-4 py-2 text-xs text-muted-foreground flex justify-between items-center",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Salem OpenStreetMap grid" }), canManage && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-primary font-medium",
													children: "Draggable Stop Pins Mode Active"
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												ref: mapRef,
												className: "h-[400px] w-full bg-accent/20 z-0"
											})]
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
										value: "stops",
										className: "mt-4 space-y-4",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "panel p-4 space-y-4",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex justify-between items-center border-b pb-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
													className: "text-sm font-semibold flex items-center gap-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "size-4 text-primary" }), " Stop Nodes Registry"]
												}), canManage && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
													size: "sm",
													onClick: () => setIsAddStopOpen(true),
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-3.5 mr-1" }), " Add Stop Node"]
												})]
											}), selectedRouteDetails.stops?.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "p-8 text-center text-xs text-muted-foreground border border-dashed rounded-md",
												children: "No stops defined for this corridor."
											}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "border rounded-md overflow-hidden bg-background/50",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
														className: "w-[80px]",
														children: "Sequence"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Stop Name" }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Latitude" }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Longitude" }),
													canManage && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
														className: "w-[180px] text-right",
														children: "Actions"
													})
												] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableBody, { children: selectedRouteDetails.stops.map((stop, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
														className: "font-mono font-bold text-primary",
														children: stop.sequence
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
														className: "font-semibold text-sm",
														children: stop.name
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
														className: "font-mono text-xs",
														children: Number(stop.latitude).toFixed(6)
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
														className: "font-mono text-xs",
														children: Number(stop.longitude).toFixed(6)
													}),
													canManage && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
														className: "text-right",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "flex justify-end gap-1.5",
															children: [
																/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
																	variant: "ghost",
																	size: "icon",
																	className: "h-8 w-8 text-muted-foreground",
																	disabled: idx === 0,
																	onClick: () => shiftStopSequenceMutation.mutate({
																		stop,
																		direction: "up"
																	}),
																	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpDown, { className: "size-3.5 rotate-180" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																		className: "sr-only",
																		children: "Move Up"
																	})]
																}),
																/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
																	variant: "ghost",
																	size: "icon",
																	className: "h-8 w-8 text-muted-foreground",
																	disabled: idx === selectedRouteDetails.stops.length - 1,
																	onClick: () => shiftStopSequenceMutation.mutate({
																		stop,
																		direction: "down"
																	}),
																	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpDown, { className: "size-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																		className: "sr-only",
																		children: "Move Down"
																	})]
																}),
																/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
																	variant: "ghost",
																	size: "icon",
																	className: "h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10",
																	onClick: () => {
																		if (confirm(`Delete stop ${stop.name}?`)) deleteStopMutation.mutate(stop.id);
																	},
																	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																		className: "sr-only",
																		children: "Delete Stop"
																	})]
																})
															]
														})
													})
												] }, stop.id)) })] })
											})]
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
										value: "overlap",
										className: "mt-4 space-y-4",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
											className: "panel p-4 space-y-4",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex justify-between items-center border-b pb-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
													className: "text-sm font-semibold",
													children: "Geometric Overlap Analysis"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-xs text-muted-foreground",
													children: "Calculates corridor overlap against other active corridors in this tenant registry."
												})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
													size: "sm",
													onClick: () => runOverlapCheck(),
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Activity, { className: "size-3.5 mr-1" }), " Re-Analyze"]
												})]
											}), overlapResults.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "p-8 text-center text-xs text-success border border-dashed rounded-md bg-success/5 border-success/20",
												children: "No overlapping segments detected. This corridor runs independently."
											}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "space-y-4",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "grid gap-4 sm:grid-cols-2",
													children: overlapResults.map((result) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "panel p-3 border-l-4 space-y-2 bg-secondary/15",
														style: { borderLeftColor: result.severity === "HIGH" ? "var(--color-destructive)" : result.severity === "MEDIUM" ? "var(--color-warning)" : "var(--color-success)" },
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "flex justify-between items-start",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
																className: "text-sm font-bold text-foreground",
																children: result.routeCode
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
																className: "text-xs text-muted-foreground",
																children: result.routeName
															})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
																className: result.severity === "HIGH" ? "bg-destructive/15 text-destructive border-destructive/25" : result.severity === "MEDIUM" ? "bg-warning/15 text-warning border-warning/25" : "bg-success/15 text-success border-success/25",
																children: result.severity
															})]
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "flex justify-between text-xs pt-1",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Overlap length: ", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("b", { children: [result.overlapDistanceKm, " km"] })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Overlap ratio: ", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("b", { children: [result.overlapPercentage, "%"] })] })]
														})]
													}, result.routeId))
												}), overlapResults.some((r) => r.severity === "HIGH" || r.severity === "MEDIUM") && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-start gap-2.5 rounded-lg border border-warning/25 bg-warning/5 px-4 py-3 text-sm text-warning font-medium",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "size-4 mt-0.5 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Moderate/High Corridor Overlaps Detected" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "text-xs text-warning/80 font-normal mt-0.5",
														children: "Multiple segments of this route conflict with existing corridors. Consider adjusting the corridor coordinates or stop placements."
													})] })]
												})]
											})]
										})
									})
								]
							})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "panel py-20 text-center text-muted-foreground text-sm",
								children: "No route selected. Select a route from the sidebar registry or create a new proposed corridor."
							})
						})]
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
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Create Route Corridor" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Add a new transit route profile. Planners can draw the route points on the planner map afterwards." })] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid gap-4 py-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-4 items-center gap-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "code",
											className: "text-right",
											children: "Route Code"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											id: "code",
											value: formCode,
											onChange: (e) => setFormCode(e.target.value),
											placeholder: "e.g. Route 106",
											className: "col-span-3 font-semibold text-primary",
											required: true
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-4 items-center gap-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "name",
											className: "text-right",
											children: "Route Name"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											id: "name",
											value: formName,
											onChange: (e) => setFormName(e.target.value),
											placeholder: "Salem Central → Hasthampatti",
											className: "col-span-3",
											required: true
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-4 items-center gap-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "origin",
											className: "text-right",
											children: "Origin"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											id: "origin",
											value: formOrigin,
											onChange: (e) => setFormOrigin(e.target.value),
											placeholder: "Salem Central",
											className: "col-span-3"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-4 items-center gap-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "destination",
											className: "text-right",
											children: "Destination"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											id: "destination",
											value: formDestination,
											onChange: (e) => setFormDestination(e.target.value),
											placeholder: "Hasthampatti",
											className: "col-span-3"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-4 items-center gap-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "length",
											className: "text-right",
											children: "Length (Km)"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											id: "length",
											value: formLengthKm,
											onChange: (e) => setFormLengthKm(e.target.value),
											className: "col-span-3 font-mono",
											required: true
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-4 items-center gap-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "duration",
											className: "text-right text-xs",
											children: "Duration (Min)"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											id: "duration",
											type: "number",
											value: formDurationMin,
											onChange: (e) => setFormDurationMin(e.target.value),
											className: "col-span-3 font-mono",
											required: true
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-4 items-center gap-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "direction",
											className: "text-right",
											children: "Direction"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
											value: formDirection,
											onValueChange: setFormDirection,
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
												className: "col-span-3",
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
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-4 items-center gap-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "color",
											className: "text-right",
											children: "Map Color"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											id: "color",
											type: "color",
											value: formColor,
											onChange: (e) => setFormColor(e.target.value),
											className: "col-span-3 h-9 p-0.5",
											required: true
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
													value: "draft",
													children: "Draft"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "active",
													children: "Active"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "proposed",
													children: "Proposed"
												})
											] })]
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
								disabled: createRouteMutation.isPending,
								children: createRouteMutation.isPending ? "Creating..." : "Save Route"
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
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Edit Route Corridor" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogDescription, { children: [
								"Modify specifications of route corridor `",
								formCode,
								"`."
							] })] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid gap-4 py-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-4 items-center gap-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "editCode",
											className: "text-right",
											children: "Route Code"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											id: "editCode",
											value: formCode,
											onChange: (e) => setFormCode(e.target.value),
											className: "col-span-3 font-semibold text-primary",
											required: true
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-4 items-center gap-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "editName",
											className: "text-right",
											children: "Route Name"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											id: "editName",
											value: formName,
											onChange: (e) => setFormName(e.target.value),
											className: "col-span-3",
											required: true
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-4 items-center gap-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "editOrigin",
											className: "text-right",
											children: "Origin"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											id: "editOrigin",
											value: formOrigin,
											onChange: (e) => setFormOrigin(e.target.value),
											className: "col-span-3"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-4 items-center gap-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "editDestination",
											className: "text-right",
											children: "Destination"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											id: "editDestination",
											value: formDestination,
											onChange: (e) => setFormDestination(e.target.value),
											className: "col-span-3"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-4 items-center gap-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "editLength",
											className: "text-right",
											children: "Length (Km)"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											id: "editLength",
											value: formLengthKm,
											onChange: (e) => setFormLengthKm(e.target.value),
											className: "col-span-3 font-mono",
											required: true
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-4 items-center gap-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "editDuration",
											className: "text-right text-xs",
											children: "Duration (Min)"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											id: "editDuration",
											type: "number",
											value: formDurationMin,
											onChange: (e) => setFormDurationMin(e.target.value),
											className: "col-span-3 font-mono",
											required: true
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-4 items-center gap-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "editDirection",
											className: "text-right",
											children: "Direction"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
											value: formDirection,
											onValueChange: setFormDirection,
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
												className: "col-span-3",
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
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-4 items-center gap-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "editColor",
											className: "text-right",
											children: "Map Color"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											id: "editColor",
											type: "color",
											value: formColor,
											onChange: (e) => setFormColor(e.target.value),
											className: "col-span-3 h-9 p-0.5",
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
								disabled: updateRouteMutation.isPending,
								children: updateRouteMutation.isPending ? "Saving..." : "Save Changes"
							})] })
						]
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: isAddStopOpen,
				onOpenChange: setIsAddStopOpen,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogContent, {
					className: "sm:max-w-[425px]",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						onSubmit: handleAddStopSubmit,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Add Stop Node" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogDescription, { children: [
								"Assign a stop location and sequencing order to route corridor `",
								selectedRouteDetails?.code,
								"`."
							] })] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid gap-4 py-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-4 items-center gap-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "stopName",
											className: "text-right",
											children: "Stop Name"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											id: "stopName",
											value: stopName,
											onChange: (e) => setStopName(e.target.value),
											placeholder: "e.g. Hasthampatti Circle",
											className: "col-span-3",
											required: true
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-4 items-center gap-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "stopSeq",
											className: "text-right text-xs",
											children: "Seq. Order"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											id: "stopSeq",
											type: "number",
											min: "1",
											value: stopSeq,
											onChange: (e) => setStopSeq(e.target.value),
											placeholder: String((selectedRouteDetails?.stops?.length || 0) + 1),
											className: "col-span-3 font-mono"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-4 items-center gap-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "stopLat",
											className: "text-right",
											children: "Latitude"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											id: "stopLat",
											value: stopLat,
											onChange: (e) => setStopLat(e.target.value),
											placeholder: "11.6673",
											className: "col-span-3 font-mono",
											required: true
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-4 items-center gap-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "stopLng",
											className: "text-right",
											children: "Longitude"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											id: "stopLng",
											value: stopLng,
											onChange: (e) => setStopLng(e.target.value),
											placeholder: "78.1424",
											className: "col-span-3 font-mono",
											required: true
										})]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								variant: "outline",
								onClick: () => setIsAddStopOpen(false),
								children: "Cancel"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "submit",
								disabled: createStopMutation.isPending,
								children: createStopMutation.isPending ? "Adding..." : "Add Stop"
							})] })
						]
					})
				})
			})
		]
	});
}
//#endregion
export { RoutesPage as component };
