import { a as and, i as desc, o as eq } from "../_libs/drizzle-orm.mjs";
import { a as duties, c as incidentImpacts, f as reschedulingRuns, h as trips, l as incidents, n as auditLogs, requireAuth, requirePermission, t as db } from "./auth-Bd29LhaF.mjs";
import { t as SCHEDULING_CONFIG } from "./config-BZ__dBcA.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/incident-manager-CpQS-rfm.js
async function analyzeIncidentImpactImpl(incident) {
	const { tenantId, serviceDate, startTime } = incident;
	const dayDuties = await db.query.duties.findMany({
		where: and(eq(duties.tenantId, tenantId), eq(duties.serviceDate, serviceDate)),
		with: {
			trips: { with: { trip: true } },
			crewSegments: true
		}
	});
	const dayTrips = await db.query.trips.findMany({ where: and(eq(trips.tenantId, tenantId), eq(trips.serviceDate, serviceDate)) });
	const impacts = [];
	const addImpact = (item) => {
		if (!impacts.some((imp) => imp.tripId === item.tripId && imp.dutyId === item.dutyId && imp.impactType === item.impactType)) impacts.push(item);
	};
	if (incident.type === "BUS_BREAKDOWN" || incident.type === "BUS_UNAVAILABLE") {
		const targetBusId = incident.resourceId;
		if (targetBusId) dayDuties.filter((d) => d.busId === targetBusId).forEach((d) => {
			d.trips.map((dt) => dt.trip).filter((t) => t && t.startTime >= startTime).sort((a, b) => a.startTime - b.startTime).forEach((t) => {
				addImpact({
					tripId: t.id,
					dutyId: d.id,
					busId: targetBusId,
					driverId: d.driverId,
					conductorId: d.conductorId,
					impactType: "BUS_LOST",
					impactLevel: "DIRECT",
					reason: `Bus ${targetBusId} broke down/unavailable at ${startTime} minutes.`
				});
				if (d.driverId) addImpact({
					tripId: t.id,
					dutyId: d.id,
					busId: null,
					driverId: d.driverId,
					conductorId: null,
					impactType: "CREW_LOST",
					impactLevel: "DOWNSTREAM",
					reason: `Driver displaced because assigned bus is unavailable.`
				});
				if (d.conductorId) addImpact({
					tripId: t.id,
					dutyId: d.id,
					busId: null,
					driverId: null,
					conductorId: d.conductorId,
					impactType: "CREW_LOST",
					impactLevel: "DOWNSTREAM",
					reason: `Conductor displaced because assigned bus is unavailable.`
				});
			});
		});
	}
	if (incident.type === "DRIVER_ABSENT" || incident.type === "CONDUCTOR_ABSENT" || incident.type === "CREW_EMERGENCY") {
		const targetCrewId = incident.resourceId;
		if (targetCrewId) dayDuties.filter((d) => {
			if (incident.type === "DRIVER_ABSENT" && d.driverId === targetCrewId) return true;
			if (incident.type === "CONDUCTOR_ABSENT" && d.conductorId === targetCrewId) return true;
			return d.crewSegments?.some((seg) => incident.type === "DRIVER_ABSENT" && seg.driverId === targetCrewId || incident.type === "CONDUCTOR_ABSENT" && seg.conductorId === targetCrewId);
		}).forEach((d) => {
			d.trips.map((dt) => dt.trip).filter((t) => t && t.startTime >= startTime).forEach((t) => {
				addImpact({
					tripId: t.id,
					dutyId: d.id,
					busId: d.busId,
					driverId: incident.type === "DRIVER_ABSENT" ? targetCrewId : null,
					conductorId: incident.type === "CONDUCTOR_ABSENT" ? targetCrewId : null,
					impactType: "CREW_LOST",
					impactLevel: "DIRECT",
					reason: `Assigned crew member absent/unavailable starting at ${startTime} minutes.`
				});
			});
		});
	}
	if (incident.type === "TRIP_DELAY" && incident.tripId) {
		const delayMin = incident.startTime;
		const directTrip = dayTrips.find((t) => t.id === incident.tripId);
		if (directTrip) {
			const dutyObj = dayDuties.find((d) => d.trips?.some((dt) => dt.tripId === directTrip.id));
			const dutyId = dutyObj ? dutyObj.id : null;
			addImpact({
				tripId: directTrip.id,
				dutyId,
				busId: dutyObj?.busId || null,
				driverId: dutyObj?.driverId || null,
				conductorId: dutyObj?.conductorId || null,
				impactType: "DELAYED",
				impactLevel: "DIRECT",
				reason: `Trip ${directTrip.tripCode} delayed by ${delayMin} minutes.`
			});
			if (dutyObj) {
				const sortedTripsInDuty = [...dutyObj.trips].map((dt) => dt.trip).filter((t) => t).sort((a, b) => a.startTime - b.startTime);
				const startIndex = sortedTripsInDuty.findIndex((t) => t.id === directTrip.id);
				let accumulatedDelay = delayMin;
				for (let i = startIndex + 1; i < sortedTripsInDuty.length; i++) {
					const prevTrip = sortedTripsInDuty[i - 1];
					const currentTrip = sortedTripsInDuty[i];
					currentTrip.startTime - prevTrip.endTime;
					const newPrevArrival = prevTrip.endTime + accumulatedDelay;
					const newGap = currentTrip.startTime - newPrevArrival;
					if (newGap < 0) {
						accumulatedDelay = Math.abs(newGap);
						addImpact({
							tripId: currentTrip.id,
							dutyId: dutyObj.id,
							busId: dutyObj.busId,
							driverId: dutyObj.driverId,
							conductorId: dutyObj.conductorId,
							impactType: "DELAYED",
							impactLevel: "DOWNSTREAM",
							reason: `Downstream impact: Delayed by ${accumulatedDelay} mins due to previous trip delay.`
						});
					} else if (newGap < SCHEDULING_CONFIG.MIN_TURNAROUND_MINUTES && currentTrip.routeId !== prevTrip.routeId) addImpact({
						tripId: currentTrip.id,
						dutyId: dutyObj.id,
						busId: dutyObj.busId,
						driverId: dutyObj.driverId,
						conductorId: dutyObj.conductorId,
						impactType: "TURNAROUND_VIOLATION",
						impactLevel: "DOWNSTREAM",
						reason: `Turnaround buffer of ${SCHEDULING_CONFIG.MIN_TURNAROUND_MINUTES} mins violated between routes.`
					});
				}
			}
		}
	}
	if (incident.type === "TRIP_CANCELLED" && incident.tripId) {
		const targetTrip = dayTrips.find((t) => t.id === incident.tripId);
		if (targetTrip) {
			const dutyObj = dayDuties.find((d) => d.trips?.some((dt) => dt.tripId === targetTrip.id));
			addImpact({
				tripId: targetTrip.id,
				dutyId: dutyObj ? dutyObj.id : null,
				busId: dutyObj?.busId || null,
				driverId: dutyObj?.driverId || null,
				conductorId: dutyObj?.conductorId || null,
				impactType: "CANCELLED",
				impactLevel: "DIRECT",
				reason: `Trip ${targetTrip.tripCode} cancelled by dispatcher.`
			});
		}
	}
	if (incident.type === "ROUTE_BLOCKED" && incident.routeId) {
		const endBlockTime = incident.expectedEndTime || 1440;
		dayTrips.filter((t) => t.routeId === incident.routeId && t.startTime >= startTime && t.startTime <= endBlockTime).forEach((t) => {
			const dutyObj = dayDuties.find((d) => d.trips?.some((dt) => dt.tripId === t.id));
			addImpact({
				tripId: t.id,
				dutyId: dutyObj ? dutyObj.id : null,
				busId: dutyObj?.busId || null,
				driverId: dutyObj?.driverId || null,
				conductorId: dutyObj?.conductorId || null,
				impactType: "CANCELLED",
				impactLevel: "DIRECT",
				reason: `Route blocked from ${startTime} to ${endBlockTime} minutes.`
			});
		});
	}
	return impacts;
}
async function createIncidentImpl(data) {
	const currentUser = await requireAuth();
	await requirePermission(currentUser.role, "schedule.generate");
	const tenantId = currentUser.tenantId;
	const [newIncident] = await db.insert(incidents).values({
		tenantId,
		type: data.type,
		status: "OPEN",
		severity: data.severity,
		serviceDate: data.serviceDate,
		resourceType: data.resourceType,
		resourceId: data.resourceId,
		tripId: data.tripId,
		routeId: data.routeId,
		reportedBy: currentUser.id,
		startTime: data.startTime,
		expectedEndTime: data.expectedEndTime,
		location: data.location,
		description: data.description
	}).returning();
	const incidentId = newIncident.id;
	await db.insert(auditLogs).values({
		tenantId,
		userId: currentUser.id,
		email: currentUser.email,
		action: "INCIDENT_CREATED",
		details: `Created disruption incident of type ${data.type} (Severity: ${data.severity}) at ${data.startTime} minutes`
	});
	const impactSummaryList = await analyzeIncidentImpactImpl(newIncident);
	if (impactSummaryList.length > 0) {
		await db.transaction(async (tx) => {
			for (const imp of impactSummaryList) await tx.insert(incidentImpacts).values({
				incidentId,
				tripId: imp.tripId,
				dutyId: imp.dutyId,
				busId: imp.busId,
				driverId: imp.driverId,
				conductorId: imp.conductorId,
				impactType: imp.impactType,
				impactLevel: imp.impactLevel,
				reason: imp.reason
			});
			await tx.update(incidents).set({
				status: "ANALYZING",
				updatedAt: /* @__PURE__ */ new Date()
			}).where(eq(incidents.id, incidentId));
		});
		await db.insert(auditLogs).values({
			tenantId,
			userId: currentUser.id,
			email: currentUser.email,
			action: "IMPACT_ANALYZED",
			details: `Disruption impact analysis finished: Identified ${impactSummaryList.length} affected schedule variables`
		});
	}
	return {
		incident: newIncident,
		impacts: impactSummaryList
	};
}
async function getIncidentsImpl(data) {
	const currentUser = await requireAuth();
	await requirePermission(currentUser.role, "schedule.view");
	return await db.query.incidents.findMany({
		where: and(eq(incidents.tenantId, currentUser.tenantId), eq(incidents.serviceDate, data.serviceDate)),
		orderBy: desc(incidents.reportedAt),
		with: { reporter: { columns: {
			name: true,
			email: true
		} } }
	});
}
async function getIncidentDetailsImpl(incidentId) {
	const currentUser = await requireAuth();
	await requirePermission(currentUser.role, "schedule.view");
	const incidentObj = await db.query.incidents.findFirst({
		where: and(eq(incidents.id, incidentId), eq(incidents.tenantId, currentUser.tenantId)),
		with: {
			reporter: true,
			impacts: { with: {
				trip: true,
				duty: true,
				bus: true,
				driver: true,
				conductor: true
			} },
			reschedulingRuns: {
				orderBy: desc(reschedulingRuns.createdAt),
				with: { proposals: true }
			}
		}
	});
	if (!incidentObj) throw new Error("Incident not found");
	return incidentObj;
}
async function resolveIncidentImpl(incidentId) {
	const currentUser = await requireAuth();
	await requirePermission(currentUser.role, "schedule.generate");
	const tenantId = currentUser.tenantId;
	await db.update(incidents).set({
		status: "RESOLVED",
		resolvedAt: /* @__PURE__ */ new Date(),
		updatedAt: /* @__PURE__ */ new Date()
	}).where(and(eq(incidents.id, incidentId), eq(incidents.tenantId, tenantId)));
	await db.insert(auditLogs).values({
		tenantId,
		userId: currentUser.id,
		email: currentUser.email,
		action: "INCIDENT_RESOLVED",
		details: `Incident ID ${incidentId} marked as RESOLVED by dispatcher`
	});
	return { success: true };
}
//#endregion
export { createIncidentImpl, getIncidentDetailsImpl, getIncidentsImpl, resolveIncidentImpl };
