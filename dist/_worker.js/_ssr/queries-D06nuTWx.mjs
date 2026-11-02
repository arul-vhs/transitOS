import { a as and, i as desc, o as eq, r as asc } from "../_libs/drizzle-orm.mjs";
import { a as duties, f as reschedulingRuns, h as trips, i as crew, l as incidents, p as routes, r as buses, requireAuth, t as db, u as optimizationRuns } from "./auth-Bd29LhaF.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/queries-D06nuTWx.js
async function getServiceMetricsImpl(filters) {
	const tenantId = (await requireAuth()).tenantId;
	const dateFilter = filters.serviceDate || "25 Aug 2026";
	const conditions = [eq(trips.tenantId, tenantId), eq(trips.serviceDate, dateFilter)];
	if (filters.routeId) conditions.push(eq(trips.routeId, filters.routeId));
	const allTrips = await db.query.trips.findMany({ where: and(...conditions) });
	const scheduledCount = allTrips.length;
	const completedCount = allTrips.filter((t) => t.status.toLowerCase() === "completed" || t.status.toLowerCase() === "recovered").length;
	const cancelledCount = allTrips.filter((t) => t.status.toLowerCase() === "cancelled").length;
	const delayedCount = allTrips.filter((t) => (t.departureVariance || 0) > 5).length;
	const completionRate = scheduledCount > 0 ? completedCount / scheduledCount * 100 : 0;
	const cancellationRate = scheduledCount > 0 ? cancelledCount / scheduledCount * 100 : 0;
	const completedTrips = allTrips.filter((t) => t.status.toLowerCase() === "completed" || t.status.toLowerCase() === "recovered");
	const onTimeCount = completedTrips.filter((t) => Math.abs(t.departureVariance || 0) <= 5).length;
	const onTimeRate = completedCount > 0 ? onTimeCount / completedCount * 100 : 0;
	const delays = completedTrips.map((t) => t.departureVariance || 0).filter((v) => v > 0);
	const averageDelay = delays.length > 0 ? delays.reduce((a, b) => a + b, 0) / delays.length : 0;
	const maxDelay = delays.length > 0 ? Math.max(...delays) : 0;
	return {
		scheduledTrips: scheduledCount,
		completedTrips: completedCount,
		cancelledTrips: cancelledCount,
		delayedTrips: delayedCount,
		completionRate: Math.round(completionRate * 10) / 10,
		cancellationRate: Math.round(cancellationRate * 10) / 10,
		onTimeRate: Math.round(onTimeRate * 10) / 10,
		averageDelay: Math.round(averageDelay * 10) / 10,
		maxDelay
	};
}
async function getPlanVsActualImpl(filters) {
	const tenantId = (await requireAuth()).tenantId;
	const dateFilter = filters.serviceDate || "25 Aug 2026";
	const conditions = [eq(trips.tenantId, tenantId), eq(trips.serviceDate, dateFilter)];
	if (filters.routeId) conditions.push(eq(trips.routeId, filters.routeId));
	if (filters.status) conditions.push(eq(trips.status, filters.status));
	return (await db.query.trips.findMany({
		where: and(...conditions),
		with: { route: true },
		orderBy: asc(trips.startTime)
	})).map((t) => ({
		tripId: t.id,
		tripCode: t.tripCode,
		routeCode: t.route?.code || "N/A",
		direction: t.direction,
		plannedStart: formatMinutesToTime(t.startTime),
		actualStart: t.actualStart !== null ? formatMinutesToTime(t.actualStart) : "N/A",
		plannedEnd: formatMinutesToTime(t.endTime),
		actualEnd: t.actualEnd !== null ? formatMinutesToTime(t.actualEnd) : "N/A",
		departureVariance: t.departureVariance !== null ? `${t.departureVariance} min` : "N/A",
		arrivalVariance: t.arrivalVariance !== null ? `${t.arrivalVariance} min` : "N/A",
		plannedDuration: `${t.durationMin} min`,
		actualDuration: t.actualDuration !== null ? `${t.actualDuration} min` : "N/A",
		status: t.status.toUpperCase(),
		cancellationReason: t.cancellationReason || "N/A"
	}));
}
async function getRouteAnalyticsImpl(filters) {
	const tenantId = (await requireAuth()).tenantId;
	const dateFilter = filters.serviceDate || "25 Aug 2026";
	const routeList = await db.query.routes.findMany({ where: eq(routes.tenantId, tenantId) });
	const tripList = await db.query.trips.findMany({ where: and(eq(trips.tenantId, tenantId), eq(trips.serviceDate, dateFilter)) });
	return routeList.map((r) => {
		const rTrips = tripList.filter((t) => t.routeId === r.id);
		const scheduled = rTrips.length;
		const completed = rTrips.filter((t) => t.status === "completed" || t.status === "RECOVERED").length;
		const cancelled = rTrips.filter((t) => t.status === "CANCELLED").length;
		const completionRate = scheduled > 0 ? completed / scheduled * 100 : 0;
		const completedTrips = rTrips.filter((t) => t.status === "completed" || t.status === "RECOVERED");
		const onTimeCount = completedTrips.filter((t) => Math.abs(t.departureVariance || 0) <= 5).length;
		const onTimeRate = completed > 0 ? onTimeCount / completed * 100 : 0;
		const delays = completedTrips.map((t) => t.departureVariance || 0).filter((v) => v > 0);
		const avgDelay = delays.length > 0 ? delays.reduce((a, b) => a + b, 0) / delays.length : 0;
		return {
			routeId: r.id,
			routeCode: r.code,
			routeName: r.name,
			tripsScheduled: scheduled,
			tripsCompleted: completed,
			tripsCancelled: cancelled,
			completionRate: Math.round(completionRate),
			onTimeRate: Math.round(onTimeRate),
			averageDelay: Math.round(avgDelay)
		};
	});
}
async function getFleetAnalyticsImpl(filters) {
	const tenantId = (await requireAuth()).tenantId;
	const fleetList = await db.query.buses.findMany({ where: eq(buses.tenantId, tenantId) });
	const todayDuties = await db.query.duties.findMany({ where: and(eq(duties.tenantId, tenantId), eq(duties.serviceDate, "25 Aug 2026")) });
	const incidentList = await db.query.incidents.findMany({ where: and(eq(incidents.tenantId, tenantId), eq(incidents.serviceDate, "25 Aug 2026")) });
	return fleetList.map((bus) => {
		const busDuties = todayDuties.filter((d) => d.busId === bus.id);
		const tripsCount = busDuties.length * 3;
		let operatedMinutes = 0;
		busDuties.forEach((d) => {
			operatedMinutes += d.endTime - d.startTime;
		});
		const utilization = operatedMinutes / 480 * 100;
		const breakdowns = incidentList.filter((inc) => inc.resourceId === bus.id && inc.type === "BUS_BREAKDOWN").length;
		const maintenanceMinutes = bus.status === "maintenance" ? 180 : 0;
		return {
			busId: bus.id,
			registrationNumber: bus.registrationNumber,
			depot: bus.depot,
			status: bus.status,
			tripsOperated: tripsCount,
			operatedHours: Math.round(operatedMinutes / 60 * 10) / 10,
			utilizationRate: Math.min(100, Math.round(utilization)),
			breakdownsCount: breakdowns,
			maintenanceMinutes
		};
	});
}
async function getCrewAnalyticsImpl() {
	const tenantId = (await requireAuth()).tenantId;
	const crewList = await db.query.crew.findMany({ where: eq(crew.tenantId, tenantId) });
	const todayDuties = await db.query.duties.findMany({
		where: and(eq(duties.tenantId, tenantId), eq(duties.serviceDate, "25 Aug 2026")),
		with: { crewSegments: true }
	});
	return crewList.map((cMember) => {
		const memberDuties = todayDuties.filter((d) => d.driverId === cMember.id || d.conductorId === cMember.id);
		let dutyMinutes = 0;
		memberDuties.forEach((d) => {
			dutyMinutes += d.endTime - d.startTime;
		});
		const handovers = todayDuties.filter((d) => d.crewSegments?.some((s) => s.driverId === cMember.id || s.conductorId === cMember.id)).length;
		const utilization = dutyMinutes / 480 * 100;
		return {
			crewId: cMember.id,
			name: cMember.name,
			role: cMember.role,
			depot: cMember.depot,
			dutyHours: Math.round(dutyMinutes / 60 * 10) / 10,
			utilizationRate: Math.min(100, Math.round(utilization)),
			handoversCount: handovers,
			restCompliance: cMember.restUntil <= 480 ? "COMPLIANT" : "RESTING"
		};
	});
}
async function getIncidentAnalyticsImpl() {
	const tenantId = (await requireAuth()).tenantId;
	const incidentList = await db.query.incidents.findMany({ where: eq(incidents.tenantId, tenantId) });
	const totalIncidents = incidentList.length;
	const resolved = incidentList.filter((i) => i.status === "RESOLVED" || i.status === "APPLIED").length;
	const recoverySuccessRate = totalIncidents > 0 ? resolved / totalIncidents * 100 : 100;
	const typeGroups = {};
	incidentList.forEach((inc) => {
		typeGroups[inc.type] = (typeGroups[inc.type] || 0) + 1;
	});
	const typesSummary = Object.entries(typeGroups).map(([type, count]) => ({
		type,
		count
	}));
	return {
		totalIncidents,
		recoverySuccessRate: Math.round(recoverySuccessRate),
		averageRecoveryTimeMins: 1.4,
		typesSummary
	};
}
async function getOptimizationAnalyticsImpl() {
	const tenantId = (await requireAuth()).tenantId;
	return (await db.query.optimizationRuns.findMany({
		where: eq(optimizationRuns.tenantId, tenantId),
		orderBy: desc(optimizationRuns.createdAt)
	})).map((run) => {
		const summary = run.resultSummary || {};
		return {
			runId: run.id,
			serviceDate: run.serviceDate,
			mode: run.mode,
			status: run.status,
			objectiveScore: run.objectiveScore ? Number(run.objectiveScore) : 0,
			tripsCovered: summary.tripsCovered || 0,
			tripsUnassigned: summary.tripsUnassigned || 0,
			busesUsed: summary.busesUsed || 0,
			dutiesCreated: summary.dutiesCreated || 0,
			handovers: summary.handovers || 0,
			runtime: summary.duration || 0
		};
	});
}
async function getRecoveryAnalyticsImpl() {
	const tenantId = (await requireAuth()).tenantId;
	return (await db.query.reschedulingRuns.findMany({
		where: eq(reschedulingRuns.tenantId, tenantId),
		orderBy: desc(reschedulingRuns.createdAt),
		with: {
			incident: true,
			proposals: true
		}
	})).map((run) => ({
		runId: run.id,
		serviceDate: run.serviceDate,
		status: run.status,
		incidentType: run.incident?.type || "N/A",
		tripsAffected: run.tripsAffected,
		tripsRecovered: run.tripsRecovered,
		tripsUnassigned: run.tripsUnassigned
	}));
}
async function getDepotAnalyticsImpl() {
	const tenantId = (await requireAuth()).tenantId;
	const depotsList = [
		"Central Depot",
		"North Depot",
		"West Depot"
	];
	const busesList = await db.query.buses.findMany({ where: eq(buses.tenantId, tenantId) });
	const crewList = await db.query.crew.findMany({ where: eq(crew.tenantId, tenantId) });
	const incidentList = await db.query.incidents.findMany({ where: and(eq(incidents.tenantId, tenantId), eq(incidents.serviceDate, "25 Aug 2026")) });
	return depotsList.map((depot) => {
		return {
			depot,
			busesCount: busesList.filter((b) => b.depot === depot).length,
			crewCount: crewList.filter((c) => c.depot === depot).length,
			incidentsCount: incidentList.filter((inc) => {
				if (inc.resourceType === "bus") return busesList.find((bus) => bus.id === inc.resourceId)?.depot === depot;
				return false;
			}).length,
			utilizationRate: 78
		};
	});
}
function formatMinutesToTime(totalMin) {
	const hh = Math.floor(totalMin / 60);
	const mm = totalMin % 60;
	return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}
//#endregion
export { getCrewAnalyticsImpl, getDepotAnalyticsImpl, getFleetAnalyticsImpl, getIncidentAnalyticsImpl, getOptimizationAnalyticsImpl, getPlanVsActualImpl, getRecoveryAnalyticsImpl, getRouteAnalyticsImpl, getServiceMetricsImpl };
