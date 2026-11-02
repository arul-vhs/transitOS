import { a as and, l as not, o as eq, r as asc } from "../_libs/drizzle-orm.mjs";
import { a as duties, d as recoveryProposals, f as reschedulingRuns, h as trips, i as crew, l as incidents, n as auditLogs, o as dutyCrewSegments, r as buses, requireAuth, requirePermission, s as dutyTrips, t as db } from "./auth-Bd29LhaF.mjs";
import { t as solveSchedule } from "./solver-BFuBR2n6.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/recovery-engine-eHSBUJiq.js
var RECOVERY_CONFIG = {
	UNASSIGNED_TRIP_PENALTY: 1e3,
	CANCELLATION_WEIGHT: 800,
	DELAY_WEIGHT: 2,
	NEW_BUS_WEIGHT: 150,
	CREW_CHANGE_WEIGHT: 100,
	HANDOVER_WEIGHT: 50,
	DISRUPTION_WEIGHT: 40
};
function calculateRecoveryObjectiveScore(proposedDuties, unassignedTripsCount, originalAssignmentsMap, originalBusesUsedSet) {
	const cfg = RECOVERY_CONFIG;
	const cancellationsCount = unassignedTripsCount;
	const cancellationPenalty = cancellationsCount * cfg.CANCELLATION_WEIGHT;
	const proposedBusesUsed = new Set(proposedDuties.map((d) => d.busId));
	let newBusesCount = 0;
	proposedBusesUsed.forEach((busId) => {
		if (!originalBusesUsedSet.has(busId)) newBusesCount += 1;
	});
	const newBusPenalty = newBusesCount * cfg.NEW_BUS_WEIGHT;
	let crewChangesCount = 0;
	let disruptionPenalty = 0;
	proposedDuties.forEach((d) => {
		d.trips.forEach((t) => {
			const orig = originalAssignmentsMap.get(t.tripId);
			if (orig) {
				let currentDriverId = d.driverId;
				let currentConductorId = d.conductorId;
				if (d.dutyType === "UNLINKED") {
					const seg = d.crewSegments.find((s) => t.sequence >= s.sequence);
					if (seg) {
						currentDriverId = seg.driverId;
						currentConductorId = seg.conductorId;
					}
				}
				const busChanged = orig.busId !== d.busId;
				const driverChanged = orig.driverId !== currentDriverId;
				const conductorChanged = orig.conductorId !== currentConductorId;
				if (busChanged) disruptionPenalty += cfg.DISRUPTION_WEIGHT;
				if (driverChanged || conductorChanged) {
					crewChangesCount += 1;
					disruptionPenalty += cfg.CREW_CHANGE_WEIGHT;
				}
			}
		});
	});
	let handoversCount = 0;
	proposedDuties.forEach((d) => {
		if (d.dutyType === "UNLINKED" && d.crewSegments.length > 1) handoversCount += d.crewSegments.length - 1;
	});
	const handoverPenalty = handoversCount * cfg.HANDOVER_WEIGHT;
	let delayMinutes = 0;
	proposedDuties.forEach((d) => {
		for (let i = 0; i < d.trips.length - 1; i++) {
			const gap = d.trips[i + 1].sequence - d.trips[i].sequence;
			if (gap < 0) delayMinutes += Math.abs(gap);
		}
	});
	const delayPenalty = delayMinutes * cfg.DELAY_WEIGHT;
	const totalScore = cancellationPenalty + newBusPenalty + disruptionPenalty + handoverPenalty + delayPenalty;
	return {
		score: Math.round(totalScore),
		delayMinutes,
		cancellationsCount,
		newBusesCount,
		crewChangesCount,
		handoversCount
	};
}
function generateRecoveryExplanation(proposedDuties, unassignedTrips, originalAssignmentsMap, incident) {
	const parts = [];
	let totalReassignedTrips = 0;
	let busChangeCount = 0;
	let crewChangeCount = 0;
	proposedDuties.forEach((d) => {
		d.trips.forEach((t) => {
			const orig = originalAssignmentsMap.get(t.tripId);
			if (orig) {
				const busChanged = orig.busId !== d.busId;
				const driverChanged = orig.driverId !== d.driverId;
				if (busChanged || driverChanged) {
					totalReassignedTrips++;
					if (busChanged) busChangeCount++;
					if (driverChanged) crewChangeCount++;
				}
			}
		});
	});
	if (totalReassignedTrips > 0) {
		const summaryList = [];
		if (busChangeCount > 0) summaryList.push(`reassigned ${busChangeCount} trip(s) to available reserve vehicles`);
		if (crewChangeCount > 0) summaryList.push(`adjusted crew pairings for ${crewChangeCount} trip(s)`);
		parts.push(`Modified schedule: ${summaryList.join(" and ")}.`);
	} else parts.push("Maintains existing vehicle and crew assignments for operational stability.");
	if (unassignedTrips.length > 0) {
		const cancelledCodes = unassignedTrips.map((u) => u.tripCode).slice(0, 3).join(", ");
		const moreText = unassignedTrips.length > 3 ? ` +${unassignedTrips.length - 3} more` : "";
		parts.push(`${unassignedTrips.length} trip(s) cancelled (${cancelledCodes}${moreText}).`);
	} else parts.push("100% service recovery achieved with 0 cancellations.");
	return parts.join(" ");
}
var MAX_RECOVERY_WINDOW = 240;
async function generateRecoveryProposalsImpl(incidentId) {
	const currentUser = await requireAuth();
	await requirePermission(currentUser.role, "schedule.generate");
	const tenantId = currentUser.tenantId;
	const incidentObj = await db.query.incidents.findFirst({ where: and(eq(incidents.id, incidentId), eq(incidents.tenantId, tenantId)) });
	if (!incidentObj) throw new Error("Incident not found");
	const existingUnappliedRuns = await db.query.reschedulingRuns.findMany({ where: and(eq(reschedulingRuns.incidentId, incidentId), eq(reschedulingRuns.tenantId, tenantId), not(eq(reschedulingRuns.status, "APPLIED"))) });
	for (const oldRun of existingUnappliedRuns) {
		await db.delete(recoveryProposals).where(eq(recoveryProposals.runId, oldRun.id));
		await db.delete(reschedulingRuns).where(eq(reschedulingRuns.id, oldRun.id));
	}
	const [run] = await db.insert(reschedulingRuns).values({
		tenantId,
		incidentId,
		serviceDate: incidentObj.serviceDate,
		status: "RUNNING",
		createdBy: currentUser.id
	}).returning();
	const runId = run.id;
	try {
		const allTrips = await db.query.trips.findMany({
			where: and(eq(trips.tenantId, tenantId), eq(trips.serviceDate, incidentObj.serviceDate)),
			orderBy: asc(trips.startTime)
		});
		const allBuses = await db.query.buses.findMany({ where: eq(buses.tenantId, tenantId) });
		const allCrew = await db.query.crew.findMany({ where: eq(crew.tenantId, tenantId) });
		const allDuties = await db.query.duties.findMany({
			where: and(eq(duties.tenantId, tenantId), eq(duties.serviceDate, incidentObj.serviceDate)),
			with: {
				trips: true,
				crewSegments: true
			}
		});
		const impactStart = incidentObj.startTime;
		const impactEnd = incidentObj.startTime + MAX_RECOVERY_WINDOW;
		const affectedTrips = allTrips.filter((t) => t.startTime >= impactStart && t.startTime <= impactEnd);
		allTrips.filter((t) => t.startTime < impactStart || t.startTime > impactEnd);
		const originalAssignmentsMap = /* @__PURE__ */ new Map();
		const originalBusesUsedSet = /* @__PURE__ */ new Set();
		allDuties.forEach((d) => {
			if (d.busId) originalBusesUsedSet.add(d.busId);
			d.trips.forEach((dt) => {
				originalAssignmentsMap.set(dt.tripId, {
					busId: d.busId,
					driverId: d.driverId,
					conductorId: d.conductorId
				});
			});
		});
		const resourceSnapshot = {
			buses: allBuses.map((b) => ({
				id: b.id,
				status: b.status
			})),
			crew: allCrew.map((c) => ({
				id: c.id,
				status: c.status,
				restUntil: Number(c.restUntil ?? 0)
			})),
			trips: allTrips.map((t) => ({
				id: t.id,
				startTime: Number(t.startTime ?? 0),
				status: t.status
			}))
		};
		const availableBuses = allBuses.filter((b) => {
			if (incidentObj.type === "BUS_BREAKDOWN" && b.id === incidentObj.resourceId) return false;
			if (b.status === "maintenance") return false;
			return true;
		});
		const availableDrivers = allCrew.filter((c) => {
			if (incidentObj.type === "DRIVER_ABSENT" && c.id === incidentObj.resourceId) return false;
			if (c.role !== "driver" || c.status === "leave") return false;
			return true;
		});
		const availableConductors = allCrew.filter((c) => {
			if (incidentObj.type === "CONDUCTOR_ABSENT" && c.id === incidentObj.resourceId) return false;
			if (c.role !== "conductor" || c.status === "leave") return false;
			return true;
		});
		const runSolverOption = (overrideConfig) => {
			const solverInput = {
				serviceDate: incidentObj.serviceDate,
				trips: affectedTrips.map((t) => ({
					id: t.id,
					tripCode: t.tripCode,
					routeId: t.routeId,
					direction: t.direction,
					startTime: t.startTime,
					endTime: t.endTime,
					durationMin: t.durationMin,
					distanceKm: t.distanceKm,
					origin: t.origin,
					destination: t.destination,
					status: t.status,
					serviceDate: t.serviceDate
				})),
				routes: [],
				buses: availableBuses.map((b) => ({
					id: b.id,
					registrationNumber: b.registrationNumber,
					fleetNumber: b.fleetNumber,
					depot: b.depot,
					status: b.status,
					busType: b.busType,
					capacity: b.capacity,
					availableFrom: b.availableFrom
				})),
				drivers: availableDrivers.map((d) => ({
					id: d.id,
					employeeId: d.employeeId,
					name: d.name,
					role: d.role,
					status: d.status,
					depot: d.depot,
					availableFrom: d.availableFrom,
					restUntil: d.restUntil,
					licenseCategory: d.licenseCategory,
					licenseExpiry: d.licenseExpiry
				})),
				conductors: availableConductors.map((c) => ({
					id: c.id,
					employeeId: c.employeeId,
					name: c.name,
					role: c.role,
					status: c.status,
					depot: c.depot,
					availableFrom: c.availableFrom,
					restUntil: c.restUntil,
					licenseCategory: null,
					licenseExpiry: null
				})),
				mode: "HYBRID",
				configuration: {
					MIN_TURNAROUND_MINUTES: 10,
					MAX_DUTY_HOURS: 8,
					MIN_REST_MINUTES: 30,
					MAX_DAILY_WORK_HOURS: 8,
					...overrideConfig
				}
			};
			return solveSchedule(solverInput);
		};
		const resA = runSolverOption({
			UNASSIGNED_TRIP_PENALTY: 1e3,
			BUS_USAGE_WEIGHT: 150,
			HANDOVER_WEIGHT: 50
		});
		const scoreA = calculateRecoveryObjectiveScore(resA.duties, resA.tripsUnassigned, originalAssignmentsMap, originalBusesUsedSet);
		const explA = generateRecoveryExplanation(resA.duties, resA.unassignedTrips, originalAssignmentsMap, incidentObj);
		const resB = runSolverOption({
			UNASSIGNED_TRIP_PENALTY: 5e3,
			BUS_USAGE_WEIGHT: 10,
			HANDOVER_WEIGHT: 100
		});
		const scoreB = calculateRecoveryObjectiveScore(resB.duties, resB.tripsUnassigned, originalAssignmentsMap, originalBusesUsedSet);
		const explB = generateRecoveryExplanation(resB.duties, resB.unassignedTrips, originalAssignmentsMap, incidentObj);
		const resC = runSolverOption({
			UNASSIGNED_TRIP_PENALTY: 800,
			BUS_USAGE_WEIGHT: 800,
			HANDOVER_WEIGHT: 200
		});
		const scoreC = calculateRecoveryObjectiveScore(resC.duties, resC.tripsUnassigned, originalAssignmentsMap, originalBusesUsedSet);
		const explC = generateRecoveryExplanation(resC.duties, resC.unassignedTrips, originalAssignmentsMap, incidentObj);
		await db.transaction(async (tx) => {
			await tx.insert(recoveryProposals).values({
				runId,
				proposalNumber: 1,
				status: "PROPOSED",
				objectiveScore: String(scoreA.score),
				tripsRecovered: scoreA.cancellationsCount === 0 ? affectedTrips.length : affectedTrips.length - scoreA.cancellationsCount,
				tripsUnassigned: scoreA.cancellationsCount,
				busesUsed: resA.busesUsed,
				crewChanges: scoreA.crewChangesCount,
				handovers: scoreA.handoversCount,
				delayMinutes: scoreA.delayMinutes,
				cancellations: scoreA.cancellationsCount,
				explanation: `Option A (Balanced Recovery): Best according to current recovery objective weights. ${explA}`,
				proposalData: resA
			});
			await tx.insert(recoveryProposals).values({
				runId,
				proposalNumber: 2,
				status: "PROPOSED",
				objectiveScore: String(scoreB.score),
				tripsRecovered: scoreB.cancellationsCount === 0 ? affectedTrips.length : affectedTrips.length - scoreB.cancellationsCount,
				tripsUnassigned: scoreB.cancellationsCount,
				busesUsed: resB.busesUsed,
				crewChanges: scoreB.crewChangesCount,
				handovers: scoreB.handoversCount,
				delayMinutes: scoreB.delayMinutes,
				cancellations: scoreB.cancellationsCount,
				explanation: `Option B (Minimize Cancellations): Prioritizes maximum service coverage using spare resources. ${explB}`,
				proposalData: resB
			});
			await tx.insert(recoveryProposals).values({
				runId,
				proposalNumber: 3,
				status: "PROPOSED",
				objectiveScore: String(scoreC.score),
				tripsRecovered: scoreC.cancellationsCount === 0 ? affectedTrips.length : affectedTrips.length - scoreC.cancellationsCount,
				tripsUnassigned: scoreC.cancellationsCount,
				busesUsed: resC.busesUsed,
				crewChanges: scoreC.crewChangesCount,
				handovers: scoreC.handoversCount,
				delayMinutes: scoreC.delayMinutes,
				cancellations: scoreC.cancellationsCount,
				explanation: `Option C (Minimize Resource Changes): Avoids crew shifts, prioritizing pre-incident schedule preservation. ${explC}`,
				proposalData: resC
			});
			await tx.update(reschedulingRuns).set({
				status: "COMPLETED",
				completedAt: /* @__PURE__ */ new Date(),
				tripsAffected: affectedTrips.length,
				tripsRecovered: affectedTrips.length - scoreA.cancellationsCount,
				tripsUnassigned: scoreA.cancellationsCount,
				objectiveScore: String(scoreA.score),
				resourceSnapshot
			}).where(eq(reschedulingRuns.id, runId));
			await tx.update(incidents).set({
				status: "RECOVERY_PROPOSED",
				updatedAt: /* @__PURE__ */ new Date()
			}).where(eq(incidents.id, incidentId));
		});
		await db.insert(auditLogs).values({
			tenantId,
			userId: currentUser.id,
			email: currentUser.email,
			action: "RECOVERY_GENERATED",
			details: `Generated 3 recovery proposals for Incident ID ${incidentId} (Affected trips inside recovery window: ${affectedTrips.length})`
		});
		return {
			runId,
			success: true
		};
	} catch (error) {
		await db.update(reschedulingRuns).set({
			status: "FAILED",
			completedAt: /* @__PURE__ */ new Date()
		}).where(eq(reschedulingRuns.id, runId));
		throw error;
	}
}
async function approveRecoveryProposalImpl(data) {
	const currentUser = await requireAuth();
	await requirePermission(currentUser.role, "schedule.publish");
	const tenantId = currentUser.tenantId;
	const prop = await db.query.recoveryProposals.findFirst({
		where: eq(recoveryProposals.id, data.proposalId),
		with: { run: true }
	});
	if (!prop) throw new Error("Recovery proposal not found");
	if (prop.status === "APPLIED") throw new Error("Proposal already applied.");
	const runObj = prop.run;
	if (!runObj) throw new Error("Associated rescheduling run not found.");
	if (runObj.status === "APPLIED") throw new Error("Recovery run already applied.");
	const currentBuses = await db.query.buses.findMany({ where: eq(buses.tenantId, tenantId) });
	const currentCrew = await db.query.crew.findMany({ where: eq(crew.tenantId, tenantId) });
	const currentTrips = await db.query.trips.findMany({ where: and(eq(trips.tenantId, tenantId), eq(trips.serviceDate, runObj.serviceDate)) });
	const snap = runObj.resourceSnapshot;
	if (snap) {
		const busMap = new Map(currentBuses.map((b) => [b.id, b]));
		const crewMap = new Map(currentCrew.map((c) => [c.id, c]));
		const tripMap = new Map(currentTrips.map((t) => [t.id, t]));
		const busChanged = Array.isArray(snap.buses) && snap.buses.some((sb) => {
			const cb = busMap.get(sb.id);
			if (!cb) return true;
			return sb.status !== cb.status;
		});
		const crewChanged = Array.isArray(snap.crew) && snap.crew.some((sc) => {
			const cc = crewMap.get(sc.id);
			if (!cc) return true;
			const restUntilSnap = Number(sc.restUntil ?? 0);
			const restUntilCurrent = Number(cc.restUntil ?? 0);
			return sc.status !== cc.status || restUntilSnap !== restUntilCurrent;
		});
		const tripsChanged = Array.isArray(snap.trips) && snap.trips.some((st) => {
			const ct = tripMap.get(st.id);
			if (!ct) return true;
			const startTimeSnap = Number(st.startTime ?? 0);
			const startTimeCurrent = Number(ct.startTime ?? 0);
			return st.status !== ct.status || startTimeSnap !== startTimeCurrent;
		});
		if (busChanged || crewChanged || tripsChanged) {
			await db.insert(auditLogs).values({
				tenantId,
				userId: currentUser.id,
				email: currentUser.email,
				action: "RECOVERY_REJECTED",
				details: `Recovery rejected: Operational state changed since this recovery was generated.`
			});
			throw new Error("Operational state changed since this recovery was generated. Please regenerate.");
		}
	}
	const proposalDuties = prop.proposalData.duties;
	await db.transaction(async (tx) => {
		const affectedTripIds = prop.proposalData.assignments.map((a) => a.tripId);
		const unassignedTripIds = prop.proposalData.unassignedTrips.map((u) => u.tripId);
		const totalTargetTripIds = [...affectedTripIds, ...unassignedTripIds];
		if (totalTargetTripIds.length > 0) for (const tripId of totalTargetTripIds) await tx.delete(dutyTrips).where(eq(dutyTrips.tripId, tripId));
		const allTenantDuties = await tx.query.duties.findMany({
			where: and(eq(duties.tenantId, tenantId), eq(duties.serviceDate, runObj.serviceDate)),
			with: { trips: true }
		});
		for (const d of allTenantDuties) if (d.trips.length === 0) await tx.delete(duties).where(eq(duties.id, d.id));
		let dutySeqCounter = 1;
		for (const pDuty of proposalDuties) {
			const dutyCode = `${pDuty.dutyCode.replace(/-R.*$/i, "")}-R${dutySeqCounter++}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
			const [dutyRecord] = await tx.insert(duties).values({
				tenantId,
				dutyCode,
				dutyType: pDuty.dutyType,
				serviceDate: runObj.serviceDate,
				startTime: pDuty.startTime,
				endTime: pDuty.endTime,
				status: "published",
				busId: pDuty.busId,
				driverId: pDuty.driverId,
				conductorId: pDuty.conductorId
			}).returning();
			for (const t of pDuty.trips) {
				await tx.insert(dutyTrips).values({
					tenantId,
					dutyId: dutyRecord.id,
					tripId: t.tripId,
					sequence: t.sequence,
					handoverRequired: t.handoverRequired
				});
				await tx.update(trips).set({
					status: "RECOVERED",
					updatedAt: /* @__PURE__ */ new Date()
				}).where(eq(trips.id, t.tripId));
			}
			if (pDuty.dutyType === "UNLINKED") for (const seg of pDuty.crewSegments) await tx.insert(dutyCrewSegments).values({
				tenantId,
				dutyId: dutyRecord.id,
				driverId: seg.driverId,
				conductorId: seg.conductorId,
				startTime: seg.startTime,
				endTime: seg.endTime,
				sequence: seg.sequence
			});
		}
		for (const tripId of unassignedTripIds) await tx.update(trips).set({
			status: "CANCELLED",
			updatedAt: /* @__PURE__ */ new Date()
		}).where(eq(trips.id, tripId));
		await tx.update(recoveryProposals).set({ status: "APPLIED" }).where(eq(recoveryProposals.id, data.proposalId));
		await tx.update(recoveryProposals).set({ status: "REJECTED" }).where(and(eq(recoveryProposals.runId, runObj.id), not(eq(recoveryProposals.id, data.proposalId))));
		await tx.update(reschedulingRuns).set({ status: "APPLIED" }).where(eq(reschedulingRuns.id, runObj.id));
		await tx.update(incidents).set({
			status: "APPLIED",
			updatedAt: /* @__PURE__ */ new Date()
		}).where(eq(incidents.id, runObj.incidentId));
	});
	await db.insert(auditLogs).values({
		tenantId,
		userId: currentUser.id,
		email: currentUser.email,
		action: "RECOVERY_APPROVED",
		details: `Approved and applied Recovery Proposal Option ${prop.proposalNumber} for Incident ID ${runObj.incidentId}`
	});
	return { success: true };
}
//#endregion
export { approveRecoveryProposalImpl, generateRecoveryProposalsImpl };
