import { n as createServerFn } from "./server-CDJaugyn.mjs";
import { t as createServerRpc } from "./createServerRpc-BIfrKr7v.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/scheduling-fns-nwg1XxYz.js
var _getTrips_createServerFn_handler = createServerRpc({
	id: "3f2e08f88cb10692c3a9adee45bc15d0d79ef665c6dfaf491ad835c8fd5bc6d8",
	name: "_getTrips",
	filename: "src/lib/scheduling-fns.ts"
}, (opts) => _getTrips.__executeServer(opts));
var _getTrips = createServerFn({ method: "GET" }).validator((filters) => filters).handler(_getTrips_createServerFn_handler, async ({ data }) => {
	const { getTripsImpl } = await import("./scheduling-ops-sozCwNQC.mjs");
	return await getTripsImpl(data);
});
var _getTrip_createServerFn_handler = createServerRpc({
	id: "840f5e99d659122d277fe666fa0e7b74707711e04effc241643e33a1d054aa4b",
	name: "_getTrip",
	filename: "src/lib/scheduling-fns.ts"
}, (opts) => _getTrip.__executeServer(opts));
var _getTrip = createServerFn({ method: "GET" }).validator((id) => id).handler(_getTrip_createServerFn_handler, async ({ data }) => {
	const { getTripImpl } = await import("./scheduling-ops-sozCwNQC.mjs");
	return await getTripImpl(data);
});
var _createTrip_createServerFn_handler = createServerRpc({
	id: "4fdc321b1e5ee3d8247d54a543adac5c48e28d934d4905ef14a8145989c4fb67",
	name: "_createTrip",
	filename: "src/lib/scheduling-fns.ts"
}, (opts) => _createTrip.__executeServer(opts));
var _createTrip = createServerFn({ method: "POST" }).validator((data) => data).handler(_createTrip_createServerFn_handler, async ({ data }) => {
	const { createTripImpl } = await import("./scheduling-ops-sozCwNQC.mjs");
	return await createTripImpl(data);
});
var _updateTrip_createServerFn_handler = createServerRpc({
	id: "0cf9bc8254946f5d2d69e9d2114abf77706aab9a1ea8f06fce95afbc0e6d4f4c",
	name: "_updateTrip",
	filename: "src/lib/scheduling-fns.ts"
}, (opts) => _updateTrip.__executeServer(opts));
var _updateTrip = createServerFn({ method: "POST" }).validator((payload) => payload).handler(_updateTrip_createServerFn_handler, async ({ data }) => {
	const { updateTripImpl } = await import("./scheduling-ops-sozCwNQC.mjs");
	return await updateTripImpl(data.id, data.data);
});
var _cancelTrip_createServerFn_handler = createServerRpc({
	id: "76380e953ca50b7f86846be6874a896fb760b8e3018d3e689db119305ebe9a7f",
	name: "_cancelTrip",
	filename: "src/lib/scheduling-fns.ts"
}, (opts) => _cancelTrip.__executeServer(opts));
var _cancelTrip = createServerFn({ method: "POST" }).validator((id) => id).handler(_cancelTrip_createServerFn_handler, async ({ data }) => {
	const { cancelTripImpl } = await import("./scheduling-ops-sozCwNQC.mjs");
	return await cancelTripImpl(data);
});
var _generateTrips_createServerFn_handler = createServerRpc({
	id: "f38b297a0184e42588573ff8f514397cb2bb3be6c4f914967540458f86b6b81f",
	name: "_generateTrips",
	filename: "src/lib/scheduling-fns.ts"
}, (opts) => _generateTrips.__executeServer(opts));
var _generateTrips = createServerFn({ method: "POST" }).validator((data) => data).handler(_generateTrips_createServerFn_handler, async ({ data }) => {
	const { generateTripsImpl } = await import("./scheduling-ops-sozCwNQC.mjs");
	return await generateTripsImpl(data);
});
var _getDuties_createServerFn_handler = createServerRpc({
	id: "1594ce52a3cf67078ac0563b02587e0f4036d6521a89bab635e700cd8a2a1629",
	name: "_getDuties",
	filename: "src/lib/scheduling-fns.ts"
}, (opts) => _getDuties.__executeServer(opts));
var _getDuties = createServerFn({ method: "GET" }).validator((filters) => filters).handler(_getDuties_createServerFn_handler, async ({ data }) => {
	const { getDutiesImpl } = await import("./scheduling-ops-sozCwNQC.mjs");
	return await getDutiesImpl(data);
});
var _getDuty_createServerFn_handler = createServerRpc({
	id: "7e8080ff23760c50af2d0327c804701cc1ecab10254daed0cfc03ee1b3800a0e",
	name: "_getDuty",
	filename: "src/lib/scheduling-fns.ts"
}, (opts) => _getDuty.__executeServer(opts));
var _getDuty = createServerFn({ method: "GET" }).validator((id) => id).handler(_getDuty_createServerFn_handler, async ({ data }) => {
	const { getDutyImpl } = await import("./scheduling-ops-sozCwNQC.mjs");
	return await getDutyImpl(data);
});
var _createDuty_createServerFn_handler = createServerRpc({
	id: "c507ce6032f4054875e5825a3d0da38a438c039406b05425e3434c271a6bc3d4",
	name: "_createDuty",
	filename: "src/lib/scheduling-fns.ts"
}, (opts) => _createDuty.__executeServer(opts));
var _createDuty = createServerFn({ method: "POST" }).validator((data) => data).handler(_createDuty_createServerFn_handler, async ({ data }) => {
	const { createDutyImpl } = await import("./scheduling-ops-sozCwNQC.mjs");
	return await createDutyImpl(data);
});
var _updateDuty_createServerFn_handler = createServerRpc({
	id: "36840a86ba70569ce464f093296cacfdfaea93bda511a7cb133584c65c246988",
	name: "_updateDuty",
	filename: "src/lib/scheduling-fns.ts"
}, (opts) => _updateDuty.__executeServer(opts));
var _updateDuty = createServerFn({ method: "POST" }).validator((payload) => payload).handler(_updateDuty_createServerFn_handler, async ({ data }) => {
	const { updateDutyImpl } = await import("./scheduling-ops-sozCwNQC.mjs");
	return await updateDutyImpl(data.id, data.data);
});
var _deleteDuty_createServerFn_handler = createServerRpc({
	id: "80f2d3c081f06e19563c2b2dad27fa21946689d77bbf5ec9b0540b48a0ccd04b",
	name: "_deleteDuty",
	filename: "src/lib/scheduling-fns.ts"
}, (opts) => _deleteDuty.__executeServer(opts));
var _deleteDuty = createServerFn({ method: "POST" }).validator((id) => id).handler(_deleteDuty_createServerFn_handler, async ({ data }) => {
	const { deleteDutyImpl } = await import("./scheduling-ops-sozCwNQC.mjs");
	return await deleteDutyImpl(data);
});
var _addTripToDuty_createServerFn_handler = createServerRpc({
	id: "f57ff9b3b3bf6cf1aa00550d9c1368cc05b3ed2347a11ca99bed2d6d42e15132",
	name: "_addTripToDuty",
	filename: "src/lib/scheduling-fns.ts"
}, (opts) => _addTripToDuty.__executeServer(opts));
var _addTripToDuty = createServerFn({ method: "POST" }).validator((payload) => payload).handler(_addTripToDuty_createServerFn_handler, async ({ data }) => {
	const { addTripToDutyImpl } = await import("./scheduling-ops-sozCwNQC.mjs");
	return await addTripToDutyImpl(data.dutyId, data.tripId);
});
var _removeTripFromDuty_createServerFn_handler = createServerRpc({
	id: "c654197ed3b0bf02e7a843a01dd71267bfa965c998d3cfe0a8387633ecd7dbe3",
	name: "_removeTripFromDuty",
	filename: "src/lib/scheduling-fns.ts"
}, (opts) => _removeTripFromDuty.__executeServer(opts));
var _removeTripFromDuty = createServerFn({ method: "POST" }).validator((payload) => payload).handler(_removeTripFromDuty_createServerFn_handler, async ({ data }) => {
	const { removeTripFromDutyImpl } = await import("./scheduling-ops-sozCwNQC.mjs");
	return await removeTripFromDutyImpl(data.dutyId, data.tripId);
});
var _assignBusToDuty_createServerFn_handler = createServerRpc({
	id: "947f908c08bebf2b85ae83bade1e984cfaa5786b3bad4aed975b3bff7ef32331",
	name: "_assignBusToDuty",
	filename: "src/lib/scheduling-fns.ts"
}, (opts) => _assignBusToDuty.__executeServer(opts));
var _assignBusToDuty = createServerFn({ method: "POST" }).validator((payload) => payload).handler(_assignBusToDuty_createServerFn_handler, async ({ data }) => {
	const { assignBusToDutyImpl } = await import("./scheduling-ops-sozCwNQC.mjs");
	return await assignBusToDutyImpl(data.dutyId, data.busId);
});
var _assignCrewToDuty_createServerFn_handler = createServerRpc({
	id: "8489bb140930fcde14c932f12d3af059d6f0781f62cd44033683f2add877c118",
	name: "_assignCrewToDuty",
	filename: "src/lib/scheduling-fns.ts"
}, (opts) => _assignCrewToDuty.__executeServer(opts));
var _assignCrewToDuty = createServerFn({ method: "POST" }).validator((payload) => payload).handler(_assignCrewToDuty_createServerFn_handler, async ({ data }) => {
	const { assignCrewToDutyImpl } = await import("./scheduling-ops-sozCwNQC.mjs");
	return await assignCrewToDutyImpl(data.dutyId, data.driverId, data.conductorId);
});
var _createCrewHandover_createServerFn_handler = createServerRpc({
	id: "af46a3e8392898ef94c8f00866fdf995324b11385d13177752771113ab451a7a",
	name: "_createCrewHandover",
	filename: "src/lib/scheduling-fns.ts"
}, (opts) => _createCrewHandover.__executeServer(opts));
var _createCrewHandover = createServerFn({ method: "POST" }).validator((data) => data).handler(_createCrewHandover_createServerFn_handler, async ({ data }) => {
	const { createCrewHandoverImpl } = await import("./scheduling-ops-sozCwNQC.mjs");
	return await createCrewHandoverImpl(data);
});
var _clearHandoverSegments_createServerFn_handler = createServerRpc({
	id: "e185f7a9de00551f33c2fec515c356534a1f05524ade1af4993a4e84542a0e6b",
	name: "_clearHandoverSegments",
	filename: "src/lib/scheduling-fns.ts"
}, (opts) => _clearHandoverSegments.__executeServer(opts));
var _clearHandoverSegments = createServerFn({ method: "POST" }).validator((dutyId) => dutyId).handler(_clearHandoverSegments_createServerFn_handler, async ({ data }) => {
	const { clearHandoverSegmentsImpl } = await import("./scheduling-ops-sozCwNQC.mjs");
	return await clearHandoverSegmentsImpl(data);
});
var _validateDuty_createServerFn_handler = createServerRpc({
	id: "660ca9a01ecc8845d7d13a31a05a94e1c00ba843fd1f34d695d6421d1e39b6e3",
	name: "_validateDuty",
	filename: "src/lib/scheduling-fns.ts"
}, (opts) => _validateDuty.__executeServer(opts));
var _validateDuty = createServerFn({ method: "POST" }).validator((payload) => payload).handler(_validateDuty_createServerFn_handler, async ({ data }) => {
	const { validateDutyImpl } = await import("./scheduling-ops-sozCwNQC.mjs");
	return await validateDutyImpl(data.dutyId, data.overrides);
});
//#endregion
export { _addTripToDuty_createServerFn_handler, _assignBusToDuty_createServerFn_handler, _assignCrewToDuty_createServerFn_handler, _cancelTrip_createServerFn_handler, _clearHandoverSegments_createServerFn_handler, _createCrewHandover_createServerFn_handler, _createDuty_createServerFn_handler, _createTrip_createServerFn_handler, _deleteDuty_createServerFn_handler, _generateTrips_createServerFn_handler, _getDuties_createServerFn_handler, _getDuty_createServerFn_handler, _getTrip_createServerFn_handler, _getTrips_createServerFn_handler, _removeTripFromDuty_createServerFn_handler, _updateDuty_createServerFn_handler, _updateTrip_createServerFn_handler, _validateDuty_createServerFn_handler };
