//#region node_modules/.nitro/vite/services/ssr/assets/config-BZ__dBcA.js
/**
* TransitOS Scheduling & Validation Configuration Settings
*/
var SCHEDULING_CONFIG = {
	MIN_TURNAROUND_MINUTES: 10,
	MAX_DUTY_HOURS: 8,
	MIN_REST_MINUTES: 30,
	MAX_DAILY_WORK_HOURS: 8,
	UNASSIGNED_TRIP_PENALTY: 1e3,
	BUS_USAGE_WEIGHT: 100,
	DUTY_COUNT_WEIGHT: 50,
	HANDOVER_WEIGHT: 80,
	IDLE_TIME_WEIGHT: 1,
	FRAGMENTATION_WEIGHT: 10,
	CROSS_DEPOT_PENALTY: 200
};
//#endregion
export { SCHEDULING_CONFIG as t };
