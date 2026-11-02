//#region node_modules/.nitro/vite/services/ssr/assets/solver-BFuBR2n6.js
function checkBusStatus(bus) {
	return ![
		"maintenance",
		"breakdown",
		"out-of-service"
	].includes(bus.status.toLowerCase());
}
function checkCrewStatus(crewMember) {
	return !["leave", "unavailable"].includes(crewMember.status.toLowerCase());
}
function checkDriverLicense(driver, serviceDateStr) {
	if (!driver.licenseExpiry) return false;
	const serviceDate = new Date(serviceDateStr);
	const expiryDate = new Date(driver.licenseExpiry);
	serviceDate.setHours(0, 0, 0, 0);
	expiryDate.setHours(0, 0, 0, 0);
	return expiryDate.getTime() >= serviceDate.getTime();
}
function checkLicenseCategory(driver, busType) {
	if (!busType) return true;
	const category = driver.licenseCategory || "";
	const isDoubleDecker = busType.toLowerCase().includes("double-decker");
	const isLeyland = busType.toLowerCase().includes("leyland") || busType.toLowerCase().includes("standard");
	if (isDoubleDecker) return category.includes("Heavy Passenger Vehicle") || category.includes("HPV");
	if (isLeyland) return category.includes("Heavy Passenger Vehicle") || category.includes("HPV") || category.includes("Commercial");
	return true;
}
function checkCrewRest(crewMember, startTime) {
	return startTime >= crewMember.restUntil;
}
function checkTurnaround(tripA, tripB, config) {
	const gap = tripB.startTime - tripA.endTime;
	if (gap < 0) return {
		feasible: false,
		gap
	};
	if (tripA.routeId !== tripB.routeId) {
		if (gap < config.MIN_TURNAROUND_MINUTES) return {
			feasible: false,
			gap
		};
	} else if (gap < Math.min(5, config.MIN_TURNAROUND_MINUTES)) return {
		feasible: false,
		gap
	};
	return {
		feasible: true,
		gap
	};
}
function checkDutyDuration(startTime, endTime, config) {
	return endTime - startTime <= config.MAX_DUTY_HOURS * 60;
}
function generateCandidates(input) {
	const { serviceDate, trips, buses, drivers, conductors } = input;
	const validBuses = buses.filter(checkBusStatus);
	const validDrivers = drivers.filter(checkCrewStatus);
	const validConductors = conductors.filter(checkCrewStatus);
	return trips.map((trip) => {
		const tripBuses = validBuses;
		const tripDrivers = validDrivers.filter((driver) => {
			if (!checkDriverLicense(driver, serviceDate)) return false;
			if (!checkCrewRest(driver, trip.startTime)) return false;
			return true;
		});
		const tripConductors = validConductors.filter((conductor) => {
			return checkCrewRest(conductor, trip.startTime);
		});
		return {
			tripId: trip.id,
			compatibleBuses: tripBuses,
			compatibleDrivers: tripDrivers,
			compatibleConductors: tripConductors
		};
	});
}
function calculateObjectiveScore(duties, unassignedTripsCount, input) {
	const cfg = input.configuration;
	const unassignedPenalty = unassignedTripsCount * cfg.UNASSIGNED_TRIP_PENALTY;
	const busCost = new Set(duties.map((d) => d.busId)).size * cfg.BUS_USAGE_WEIGHT;
	const dutyCost = duties.length * cfg.DUTY_COUNT_WEIGHT;
	let handoversCount = 0;
	duties.forEach((d) => {
		if (d.dutyType === "UNLINKED" && d.crewSegments.length > 1) handoversCount += d.crewSegments.length - 1;
	});
	const handoverCost = handoversCount * cfg.HANDOVER_WEIGHT;
	let totalIdleTime = 0;
	duties.forEach((d) => {
		for (let i = 0; i < d.trips.length - 1; i++) {
			const tripIdA = d.trips[i].tripId;
			const tripIdB = d.trips[i + 1].tripId;
			const tripA = input.trips.find((t) => t.id === tripIdA);
			const tripB = input.trips.find((t) => t.id === tripIdB);
			if (tripA && tripB) {
				const gap = tripB.startTime - tripA.endTime;
				if (gap > 0) totalIdleTime += gap;
			}
		}
	});
	const idleCost = totalIdleTime * cfg.IDLE_TIME_WEIGHT;
	let fragmentationScore = 0;
	duties.forEach((d) => {
		if (d.trips.length === 1) fragmentationScore += 1;
	});
	const fragmentationCost = fragmentationScore * cfg.FRAGMENTATION_WEIGHT;
	let crossDepotCount = 0;
	duties.forEach((d) => {
		const bus = input.buses.find((b) => b.id === d.busId);
		if (!bus) return;
		if (d.dutyType === "LINKED") {
			if (d.driverId) {
				const dr = input.drivers.find((driver) => driver.id === d.driverId);
				if (dr && dr.depot !== bus.depot) crossDepotCount += 1;
			}
			if (d.conductorId) {
				const cond = input.conductors.find((c) => c.id === d.conductorId);
				if (cond && cond.depot !== bus.depot) crossDepotCount += 1;
			}
		} else d.crewSegments.forEach((seg) => {
			if (seg.driverId) {
				const dr = input.drivers.find((driver) => driver.id === seg.driverId);
				if (dr && dr.depot !== bus.depot) crossDepotCount += 1;
			}
			if (seg.conductorId) {
				const cond = input.conductors.find((c) => c.id === seg.conductorId);
				if (cond && cond.depot !== bus.depot) crossDepotCount += 1;
			}
		});
	});
	const crossDepotCost = crossDepotCount * cfg.CROSS_DEPOT_PENALTY;
	return unassignedPenalty + busCost + dutyCost + handoverCost + idleCost + fragmentationCost + crossDepotCost;
}
function formatMinutesToTime(totalMin) {
	const hh = Math.floor(totalMin / 60);
	const mm = totalMin % 60;
	return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}
function generateExplanations(unassignedTripIds, input, candidatesMap) {
	return unassignedTripIds.map((tripId) => {
		const trip = input.trips.find((t) => t.id === tripId);
		const cand = candidatesMap.get(tripId);
		let reason = "Insufficient resources due to timeline overlap with active duties.";
		if (!cand) return {
			tripId,
			tripCode: trip.tripCode,
			reason: "No resource candidates resolved for this date."
		};
		const { compatibleBuses, compatibleDrivers, compatibleConductors } = cand;
		if (compatibleBuses.length === 0) reason = "No active buses available in the fleet registry.";
		else if (compatibleDrivers.length === 0) reason = "No active drivers available. Check for expired licenses or status locks.";
		else if (compatibleConductors.length === 0) reason = "No active conductors available in the crew registry.";
		else {
			const departureStr = formatMinutesToTime(trip.startTime);
			const arrivalStr = formatMinutesToTime(trip.endTime);
			const driversUnderRest = input.drivers.filter((d) => d.status === "available" && d.restUntil > trip.startTime);
			driversUnderRest.length, input.drivers.length;
			compatibleDrivers.filter((d) => {
				return input.drivers.filter((drv) => drv.licenseCategory?.includes("Heavy") || drv.licenseCategory?.includes("HPV")).length === 0;
			});
			if (driversUnderRest.length > 0 && compatibleDrivers.every((d) => d.restUntil > trip.startTime)) reason = `No driver available. Drivers exist, but they are under mandatory rest until ${formatMinutesToTime(Math.min(...compatibleDrivers.map((d) => d.restUntil)))}.`;
			else if (input.trips.filter((t) => t.id !== trip.id && t.serviceDate === trip.serviceDate && t.endTime > trip.startTime - input.configuration.MIN_TURNAROUND_MINUTES).length > 0) reason = `Buses exist, but turnaround transitions from their previous routes require a ${input.configuration.MIN_TURNAROUND_MINUTES}-minute buffer.`;
			else reason = `No compatible bus or crew segment was free between ${departureStr} and ${arrivalStr}.`;
		}
		return {
			tripId,
			tripCode: trip.tripCode,
			reason
		};
	});
}
function solveSchedule(input) {
	const sortedTrips = [...input.trips].sort((a, b) => a.startTime - b.startTime);
	const candidates = generateCandidates(input);
	const candidatesMap = new Map(candidates.map((c) => [c.tripId, c]));
	const busSchedules = /* @__PURE__ */ new Map();
	const crewSchedules = /* @__PURE__ */ new Map();
	input.buses.forEach((b) => busSchedules.set(b.id, []));
	input.drivers.forEach((d) => crewSchedules.set(d.id, []));
	input.conductors.forEach((c) => crewSchedules.set(c.id, []));
	const state = {
		duties: [],
		assignments: [],
		unassignedTrips: []
	};
	const isResourceAvailable = (resourceId, start, end, scheduleMap) => {
		const list = scheduleMap.get(resourceId) || [];
		for (const item of list) if (start < item.endTime && end > item.startTime) return false;
		return true;
	};
	const reserveResource = (resourceId, start, end, scheduleMap) => {
		const list = scheduleMap.get(resourceId) || [];
		list.push({
			startTime: start,
			endTime: end
		});
		scheduleMap.set(resourceId, list);
	};
	const routeMap = /* @__PURE__ */ new Map();
	input.routes.forEach((r) => routeMap.set(r.id, r.code));
	const getRouteCode = (routeId) => routeMap.get(routeId) || "Corridor";
	for (const trip of sortedTrips) {
		const cand = candidatesMap.get(trip.id);
		if (!cand) {
			state.unassignedTrips.push(trip.id);
			continue;
		}
		let assigned = false;
		const sortedDuties = [...state.duties.filter((d) => d.trips.length > 0)].sort((a, b) => b.endTime - a.endTime);
		for (const duty of sortedDuties) {
			const bus = input.buses.find((b) => b.id === duty.busId);
			if (!bus) continue;
			const lastTripId = duty.trips[duty.trips.length - 1].tripId;
			const lastTrip = input.trips.find((t) => t.id === lastTripId);
			if (!lastTrip) continue;
			if (!checkTurnaround(lastTrip, trip, input.configuration).feasible) continue;
			if (!checkDutyDuration(duty.startTime, trip.endTime, input.configuration)) continue;
			if (input.mode === "LINKED" || input.mode === "HYBRID" && duty.dutyType === "LINKED") {
				const driverId = duty.driverId;
				const conductorId = duty.conductorId;
				const isDriverOk = cand.compatibleDrivers.some((d) => d.id === driverId);
				const isConductorOk = cand.compatibleConductors.some((c) => c.id === conductorId);
				if (isDriverOk && isConductorOk) {
					if (isResourceAvailable(driverId, lastTrip.endTime, trip.endTime, crewSchedules) && isResourceAvailable(conductorId, lastTrip.endTime, trip.endTime, crewSchedules)) {
						reserveResource(driverId, lastTrip.endTime, trip.endTime, crewSchedules);
						reserveResource(conductorId, lastTrip.endTime, trip.endTime, crewSchedules);
						duty.trips.push({
							tripId: trip.id,
							tripCode: trip.tripCode,
							sequence: duty.trips.length + 1,
							handoverRequired: false
						});
						duty.endTime = trip.endTime;
						state.assignments.push({
							tripId: trip.id,
							busId: duty.busId,
							driverId,
							conductorId,
							handoverRequired: false
						});
						assigned = true;
						break;
					}
				}
			} else {
				const currentDriverId = duty.crewSegments[duty.crewSegments.length - 1].driverId;
				const currentConductorId = duty.crewSegments[duty.crewSegments.length - 1].conductorId;
				const keepDriver = cand.compatibleDrivers.some((d) => d.id === currentDriverId);
				const keepConductor = cand.compatibleConductors.some((c) => c.id === currentConductorId);
				if (keepDriver && keepConductor) {
					if (isResourceAvailable(currentDriverId, lastTrip.endTime, trip.endTime, crewSchedules) && isResourceAvailable(currentConductorId, lastTrip.endTime, trip.endTime, crewSchedules)) {
						reserveResource(currentDriverId, lastTrip.endTime, trip.endTime, crewSchedules);
						reserveResource(currentConductorId, lastTrip.endTime, trip.endTime, crewSchedules);
						const lastSeg = duty.crewSegments[duty.crewSegments.length - 1];
						lastSeg.endTime = trip.endTime;
						duty.trips.push({
							tripId: trip.id,
							tripCode: trip.tripCode,
							sequence: duty.trips.length + 1,
							handoverRequired: false,
							startTime: trip.startTime,
							endTime: trip.endTime,
							routeCode: getRouteCode(trip.routeId),
							origin: trip.origin,
							destination: trip.destination
						});
						duty.endTime = trip.endTime;
						state.assignments.push({
							tripId: trip.id,
							busId: duty.busId,
							driverId: currentDriverId,
							conductorId: currentConductorId,
							handoverRequired: false
						});
						assigned = true;
						break;
					}
				} else {
					const newDriver = cand.compatibleDrivers.find((d) => isResourceAvailable(d.id, trip.startTime, trip.endTime, crewSchedules) && checkLicenseCategory(d, bus.busType));
					const newConductor = cand.compatibleConductors.find((c) => isResourceAvailable(c.id, trip.startTime, trip.endTime, crewSchedules));
					if (newDriver && newConductor) {
						reserveResource(newDriver.id, trip.startTime, trip.endTime, crewSchedules);
						reserveResource(newConductor.id, trip.startTime, trip.endTime, crewSchedules);
						duty.trips[duty.trips.length - 1].handoverRequired = true;
						duty.trips.push({
							tripId: trip.id,
							tripCode: trip.tripCode,
							sequence: duty.trips.length + 1,
							handoverRequired: false,
							startTime: trip.startTime,
							endTime: trip.endTime,
							routeCode: getRouteCode(trip.routeId),
							origin: trip.origin,
							destination: trip.destination
						});
						duty.endTime = trip.endTime;
						duty.crewSegments.push({
							driverId: newDriver.id,
							conductorId: newConductor.id,
							startTime: trip.startTime,
							endTime: trip.endTime,
							sequence: duty.crewSegments.length + 1
						});
						state.assignments.push({
							tripId: trip.id,
							busId: duty.busId,
							driverId: newDriver.id,
							conductorId: newConductor.id,
							handoverRequired: true
						});
						assigned = true;
						break;
					}
				}
			}
		}
		if (assigned) continue;
		const availableBus = cand.compatibleBuses.find((b) => isResourceAvailable(b.id, trip.startTime, trip.endTime, busSchedules));
		if (availableBus) {
			const availableDriver = cand.compatibleDrivers.find((d) => isResourceAvailable(d.id, trip.startTime, trip.endTime, crewSchedules) && checkLicenseCategory(d, availableBus.busType));
			const availableConductor = cand.compatibleConductors.find((c) => isResourceAvailable(c.id, trip.startTime, trip.endTime, crewSchedules));
			if (availableDriver && availableConductor) {
				reserveResource(availableBus.id, trip.startTime, trip.endTime, busSchedules);
				reserveResource(availableDriver.id, trip.startTime, trip.endTime, crewSchedules);
				reserveResource(availableConductor.id, trip.startTime, trip.endTime, crewSchedules);
				const dutyTypeDecision = input.mode === "UNLINKED" ? "UNLINKED" : "LINKED";
				const newDuty = {
					dutyCode: `${dutyTypeDecision === "LINKED" ? "L" : "U"}-${String(101 + state.duties.length)}`,
					dutyType: dutyTypeDecision,
					busId: availableBus.id,
					driverId: dutyTypeDecision === "LINKED" ? availableDriver.id : null,
					conductorId: dutyTypeDecision === "LINKED" ? availableConductor.id : null,
					startTime: trip.startTime,
					endTime: trip.endTime,
					trips: [{
						tripId: trip.id,
						tripCode: trip.tripCode,
						sequence: 1,
						handoverRequired: false,
						startTime: trip.startTime,
						endTime: trip.endTime,
						routeCode: getRouteCode(trip.routeId),
						origin: trip.origin,
						destination: trip.destination
					}],
					crewSegments: [{
						driverId: availableDriver.id,
						conductorId: availableConductor.id,
						startTime: trip.startTime,
						endTime: trip.endTime,
						sequence: 1
					}]
				};
				state.duties.push(newDuty);
				state.assignments.push({
					tripId: trip.id,
					busId: availableBus.id,
					driverId: availableDriver.id,
					conductorId: availableConductor.id,
					handoverRequired: false
				});
				assigned = true;
			}
		}
		if (!assigned) state.unassignedTrips.push(trip.id);
	}
	const tripsCovered = state.assignments.length;
	const tripsUnassigned = state.unassignedTrips.length;
	const busesUsed = new Set(state.duties.map((d) => d.busId)).size;
	const driversUsedSet = /* @__PURE__ */ new Set();
	const conductorsUsedSet = /* @__PURE__ */ new Set();
	state.duties.forEach((d) => {
		if (d.driverId) driversUsedSet.add(d.driverId);
		if (d.conductorId) conductorsUsedSet.add(d.conductorId);
		d.crewSegments.forEach((seg) => {
			if (seg.driverId) driversUsedSet.add(seg.driverId);
			if (seg.conductorId) conductorsUsedSet.add(seg.conductorId);
		});
	});
	const dutiesCreated = state.duties.length;
	const linkedDuties = state.duties.filter((d) => d.dutyType === "LINKED").length;
	const unlinkedDuties = state.duties.filter((d) => d.dutyType === "UNLINKED").length;
	let handovers = 0;
	state.duties.forEach((d) => {
		if (d.dutyType === "UNLINKED" && d.crewSegments.length > 1) handovers += d.crewSegments.length - 1;
	});
	const objectiveScore = calculateObjectiveScore(state.duties, tripsUnassigned, input);
	const solverStatus = tripsUnassigned === 0 ? "FEASIBLE" : tripsCovered > 0 ? "PARTIAL" : "INFEASIBLE";
	const unassignedTripsExplanations = generateExplanations(state.unassignedTrips, input, candidatesMap);
	return {
		status: solverStatus,
		tripsCovered,
		tripsUnassigned,
		busesUsed,
		driversUsed: driversUsedSet.size,
		conductorsUsed: conductorsUsedSet.size,
		dutiesCreated,
		linkedDuties,
		unlinkedDuties,
		handovers,
		objectiveScore,
		assignments: state.assignments,
		duties: state.duties,
		unassignedTrips: unassignedTripsExplanations,
		violations: [],
		explanations: unassignedTripsExplanations.map((u) => `${u.tripCode}: ${u.reason}`)
	};
}
//#endregion
export { solveSchedule as t };
