import { n as createServerFn } from "./server-CDJaugyn.mjs";
import { t as createServerRpc } from "./createServerRpc-BIfrKr7v.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/fleet-crew-C59ekwiA.js
var _getBuses_createServerFn_handler = createServerRpc({
	id: "9202c99368769df7aed0725032629b1698168cd0b40140da98e782b8e708dcbf",
	name: "_getBuses",
	filename: "src/lib/fleet-crew.ts"
}, (opts) => _getBuses.__executeServer(opts));
var _getBuses = createServerFn({ method: "GET" }).validator((filters) => filters).handler(_getBuses_createServerFn_handler, async ({ data }) => {
	const { getBusesImpl } = await import("./fleet-crew-46gs5X6H.mjs");
	return await getBusesImpl(data);
});
var _getBus_createServerFn_handler = createServerRpc({
	id: "9c052936497adc0e4ba2a0d04c83a0a18577ccf4946953e223a3ec175d0ba2a1",
	name: "_getBus",
	filename: "src/lib/fleet-crew.ts"
}, (opts) => _getBus.__executeServer(opts));
var _getBus = createServerFn({ method: "GET" }).validator((id) => id).handler(_getBus_createServerFn_handler, async ({ data }) => {
	const { getBusImpl } = await import("./fleet-crew-46gs5X6H.mjs");
	return await getBusImpl(data);
});
var _createBus_createServerFn_handler = createServerRpc({
	id: "5f1b3cedb8b51fb5aca9ac4b28eeb0773f7c389bcf4fb17ab6443d1cd0dabca9",
	name: "_createBus",
	filename: "src/lib/fleet-crew.ts"
}, (opts) => _createBus.__executeServer(opts));
var _createBus = createServerFn({ method: "POST" }).validator((data) => data).handler(_createBus_createServerFn_handler, async ({ data }) => {
	const { createBusImpl } = await import("./fleet-crew-46gs5X6H.mjs");
	return await createBusImpl(data);
});
var _updateBus_createServerFn_handler = createServerRpc({
	id: "88d12e72901dd4d1da7049f187420d1efdc1ee6e3fa42ad637cea58ff5ae32af",
	name: "_updateBus",
	filename: "src/lib/fleet-crew.ts"
}, (opts) => _updateBus.__executeServer(opts));
var _updateBus = createServerFn({ method: "POST" }).validator((payload) => payload).handler(_updateBus_createServerFn_handler, async ({ data }) => {
	const { updateBusImpl } = await import("./fleet-crew-46gs5X6H.mjs");
	return await updateBusImpl(data.id, data.data);
});
var _updateBusStatus_createServerFn_handler = createServerRpc({
	id: "4bd8e36f04c0abec28e5964cb82f99675fbbe558ad98990a1bf00928385e41ca",
	name: "_updateBusStatus",
	filename: "src/lib/fleet-crew.ts"
}, (opts) => _updateBusStatus.__executeServer(opts));
var _updateBusStatus = createServerFn({ method: "POST" }).validator((payload) => payload).handler(_updateBusStatus_createServerFn_handler, async ({ data }) => {
	const { updateBusStatusImpl } = await import("./fleet-crew-46gs5X6H.mjs");
	return await updateBusStatusImpl(data.id, data.status);
});
var _getDrivers_createServerFn_handler = createServerRpc({
	id: "345c342cd80e04a0b14f87a62b5b83175856025dbcd9bb6ae2cea87199fcc5a3",
	name: "_getDrivers",
	filename: "src/lib/fleet-crew.ts"
}, (opts) => _getDrivers.__executeServer(opts));
var _getDrivers = createServerFn({ method: "GET" }).validator((filters) => filters).handler(_getDrivers_createServerFn_handler, async ({ data }) => {
	const { getDriversImpl } = await import("./fleet-crew-46gs5X6H.mjs");
	return await getDriversImpl(data);
});
var _getConductors_createServerFn_handler = createServerRpc({
	id: "04bea6f9cae95242cbaae8330d951e41c960b1dc8600c1e983f9fc7a1bf45b17",
	name: "_getConductors",
	filename: "src/lib/fleet-crew.ts"
}, (opts) => _getConductors.__executeServer(opts));
var _getConductors = createServerFn({ method: "GET" }).validator((filters) => filters).handler(_getConductors_createServerFn_handler, async ({ data }) => {
	const { getConductorsImpl } = await import("./fleet-crew-46gs5X6H.mjs");
	return await getConductorsImpl(data);
});
var _getCrewMember_createServerFn_handler = createServerRpc({
	id: "209f18375e0fff08bf6331c7b1d7c0b35022a655d191e3caa92806051908b539",
	name: "_getCrewMember",
	filename: "src/lib/fleet-crew.ts"
}, (opts) => _getCrewMember.__executeServer(opts));
var _getCrewMember = createServerFn({ method: "GET" }).validator((id) => id).handler(_getCrewMember_createServerFn_handler, async ({ data }) => {
	const { getCrewMemberImpl } = await import("./fleet-crew-46gs5X6H.mjs");
	return await getCrewMemberImpl(data);
});
var _createCrewMember_createServerFn_handler = createServerRpc({
	id: "6effb70a6a3db0566cd9f278ce58476665b55df9e11d813f10055a55bd52d4a7",
	name: "_createCrewMember",
	filename: "src/lib/fleet-crew.ts"
}, (opts) => _createCrewMember.__executeServer(opts));
var _createCrewMember = createServerFn({ method: "POST" }).validator((data) => data).handler(_createCrewMember_createServerFn_handler, async ({ data }) => {
	const { createCrewMemberImpl } = await import("./fleet-crew-46gs5X6H.mjs");
	return await createCrewMemberImpl(data);
});
var _updateCrewMember_createServerFn_handler = createServerRpc({
	id: "1a4f29812f1bdc130b7350a635355cc76d8b4faf0277c545d6e2940927472cca",
	name: "_updateCrewMember",
	filename: "src/lib/fleet-crew.ts"
}, (opts) => _updateCrewMember.__executeServer(opts));
var _updateCrewMember = createServerFn({ method: "POST" }).validator((payload) => payload).handler(_updateCrewMember_createServerFn_handler, async ({ data }) => {
	const { updateCrewMemberImpl } = await import("./fleet-crew-46gs5X6H.mjs");
	return await updateCrewMemberImpl(data.id, data.data);
});
var _updateCrewStatus_createServerFn_handler = createServerRpc({
	id: "7ff41e22aa4ccd321bb986651db3c0b8c69c4b4ae328b2aeb384776c08cf00db",
	name: "_updateCrewStatus",
	filename: "src/lib/fleet-crew.ts"
}, (opts) => _updateCrewStatus.__executeServer(opts));
var _updateCrewStatus = createServerFn({ method: "POST" }).validator((payload) => payload).handler(_updateCrewStatus_createServerFn_handler, async ({ data }) => {
	const { updateCrewStatusImpl } = await import("./fleet-crew-46gs5X6H.mjs");
	return await updateCrewStatusImpl(data.id, data.status);
});
var _getCrewAvailability_createServerFn_handler = createServerRpc({
	id: "1bae259e8b0499791ccc0dda56ccf334603904ad35ec48172b958d82026f716b",
	name: "_getCrewAvailability",
	filename: "src/lib/fleet-crew.ts"
}, (opts) => _getCrewAvailability.__executeServer(opts));
var _getCrewAvailability = createServerFn({ method: "GET" }).handler(_getCrewAvailability_createServerFn_handler, async () => {
	const { getCrewAvailabilityImpl } = await import("./fleet-crew-46gs5X6H.mjs");
	return await getCrewAvailabilityImpl();
});
//#endregion
export { _createBus_createServerFn_handler, _createCrewMember_createServerFn_handler, _getBus_createServerFn_handler, _getBuses_createServerFn_handler, _getConductors_createServerFn_handler, _getCrewAvailability_createServerFn_handler, _getCrewMember_createServerFn_handler, _getDrivers_createServerFn_handler, _updateBusStatus_createServerFn_handler, _updateBus_createServerFn_handler, _updateCrewMember_createServerFn_handler, _updateCrewStatus_createServerFn_handler };
