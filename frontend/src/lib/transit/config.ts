/**
 * TransitOS Scheduling & Validation Configuration Settings
 */
export const SCHEDULING_CONFIG = {
  // Minimum turnaround buffer in minutes required when transitioning between trips
  MIN_TURNAROUND_MINUTES: 10,

  // Maximum continuous work duration in hours for a crew member or duty block
  MAX_DUTY_HOURS: 8, // 8 hours = 480 minutes

  // Minimum rest period in minutes required between duties/shifts
  MIN_REST_MINUTES: 30,

  // Maximum daily total work hours allowed per driver or conductor
  MAX_DAILY_WORK_HOURS: 8,

  // Soft constraints optimization weights (Primary optimization target is cost minimization)
  UNASSIGNED_TRIP_PENALTY: 1000,
  BUS_USAGE_WEIGHT: 100,
  DUTY_COUNT_WEIGHT: 50,
  HANDOVER_WEIGHT: 80,
  IDLE_TIME_WEIGHT: 1,
  FRAGMENTATION_WEIGHT: 10,
  CROSS_DEPOT_PENALTY: 200,
};
