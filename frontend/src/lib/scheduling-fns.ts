import { createServerFn } from "@tanstack/react-start";
import { toServerFnArgs } from "./server-fn-utils";

const _getTrips = createServerFn({ method: "GET" })
  .validator((filters?: { serviceDate?: string; routeId?: string; status?: string; direction?: string }) => filters)
  .handler(async ({ data }) => {
    const { getTripsImpl } = await import("../server/scheduling-ops");
    return await getTripsImpl(data);
  });

export const getTrips = async (
  filters?: { serviceDate?: string; routeId?: string; status?: string; direction?: string } | { data?: { serviceDate?: string; routeId?: string; status?: string; direction?: string } }
) => {
  return await _getTrips(toServerFnArgs(filters));
};

const _getTrip = createServerFn({ method: "GET" })
  .validator((id: string) => id)
  .handler(async ({ data }) => {
    const { getTripImpl } = await import("../server/scheduling-ops");
    return await getTripImpl(data);
  });

export const getTrip = async (id: string | { data: string }) => {
  return await _getTrip(toServerFnArgs(id)!);
};

const _createTrip = createServerFn({ method: "POST" })
  .validator(
    (data: {
      routeId: string;
      startTime: number;
      serviceDate: string;
      direction?: string;
      status?: string;
    }) => data
  )
  .handler(async ({ data }) => {
    const { createTripImpl } = await import("../server/scheduling-ops");
    return await createTripImpl(data);
  });

export const createTrip = async (data: any) => {
  return await _createTrip(toServerFnArgs(data)!);
};

const _updateTrip = createServerFn({ method: "POST" })
  .validator(
    (payload: {
      id: string;
      data: {
        startTime: number;
        serviceDate: string;
        direction?: string;
        status?: string;
      };
    }) => payload
  )
  .handler(async ({ data }) => {
    const { updateTripImpl } = await import("../server/scheduling-ops");
    return await updateTripImpl(data.id, data.data);
  });

export const updateTrip = async (payload: any) => {
  return await _updateTrip(toServerFnArgs(payload)!);
};

const _cancelTrip = createServerFn({ method: "POST" })
  .validator((id: string) => id)
  .handler(async ({ data }) => {
    const { cancelTripImpl } = await import("../server/scheduling-ops");
    return await cancelTripImpl(data);
  });

export const cancelTrip = async (id: string | { data: string }) => {
  return await _cancelTrip(toServerFnArgs(id)!);
};

const _generateTrips = createServerFn({ method: "POST" })
  .validator(
    (data: {
      routeId: string;
      serviceDate: string;
      startTime: number;
      endTime: number;
      frequency: number;
      direction?: string;
    }) => data
  )
  .handler(async ({ data }) => {
    const { generateTripsImpl } = await import("../server/scheduling-ops");
    return await generateTripsImpl(data);
  });

export const generateTrips = async (data: any) => {
  return await _generateTrips(toServerFnArgs(data)!);
};

const _getDuties = createServerFn({ method: "GET" })
  .validator((filters?: { serviceDate?: string; status?: string }) => filters)
  .handler(async ({ data }) => {
    const { getDutiesImpl } = await import("../server/scheduling-ops");
    return await getDutiesImpl(data);
  });

export const getDuties = async (
  filters?: { serviceDate?: string; status?: string } | { data?: { serviceDate?: string; status?: string } }
) => {
  return await _getDuties(toServerFnArgs(filters));
};

const _getDuty = createServerFn({ method: "GET" })
  .validator((id: string) => id)
  .handler(async ({ data }) => {
    const { getDutyImpl } = await import("../server/scheduling-ops");
    return await getDutyImpl(data);
  });

export const getDuty = async (id: string | { data: string }) => {
  return await _getDuty(toServerFnArgs(id)!);
};

const _createDuty = createServerFn({ method: "POST" })
  .validator(
    (data: {
      dutyCode: string;
      dutyType: string;
      serviceDate: string;
    }) => data
  )
  .handler(async ({ data }) => {
    const { createDutyImpl } = await import("../server/scheduling-ops");
    return await createDutyImpl(data);
  });

export const createDuty = async (data: any) => {
  return await _createDuty(toServerFnArgs(data)!);
};

const _updateDuty = createServerFn({ method: "POST" })
  .validator(
    (payload: {
      id: string;
      data: {
        dutyCode: string;
        dutyType: string;
        serviceDate: string;
        status: string;
        busId?: string | null;
        driverId?: string | null;
        conductorId?: string | null;
      };
    }) => payload
  )
  .handler(async ({ data }) => {
    const { updateDutyImpl } = await import("../server/scheduling-ops");
    return await updateDutyImpl(data.id, data.data);
  });

export const updateDuty = async (payload: any) => {
  return await _updateDuty(toServerFnArgs(payload)!);
};

const _deleteDuty = createServerFn({ method: "POST" })
  .validator((id: string) => id)
  .handler(async ({ data }) => {
    const { deleteDutyImpl } = await import("../server/scheduling-ops");
    return await deleteDutyImpl(data);
  });

export const deleteDuty = async (id: string | { data: string }) => {
  return await _deleteDuty(toServerFnArgs(id)!);
};

const _addTripToDuty = createServerFn({ method: "POST" })
  .validator((payload: { dutyId: string; tripId: string }) => payload)
  .handler(async ({ data }) => {
    const { addTripToDutyImpl } = await import("../server/scheduling-ops");
    return await addTripToDutyImpl(data.dutyId, data.tripId);
  });

export const addTripToDuty = async (
  payload: { dutyId: string; tripId: string } | { data: { dutyId: string; tripId: string } }
) => {
  return await _addTripToDuty(toServerFnArgs(payload)!);
};

const _removeTripFromDuty = createServerFn({ method: "POST" })
  .validator((payload: { dutyId: string; tripId: string }) => payload)
  .handler(async ({ data }) => {
    const { removeTripFromDutyImpl } = await import("../server/scheduling-ops");
    return await removeTripFromDutyImpl(data.dutyId, data.tripId);
  });

export const removeTripFromDuty = async (
  payload: { dutyId: string; tripId: string } | { data: { dutyId: string; tripId: string } }
) => {
  return await _removeTripFromDuty(toServerFnArgs(payload)!);
};

const _assignBusToDuty = createServerFn({ method: "POST" })
  .validator((payload: { dutyId: string; busId: string | null }) => payload)
  .handler(async ({ data }) => {
    const { assignBusToDutyImpl } = await import("../server/scheduling-ops");
    return await assignBusToDutyImpl(data.dutyId, data.busId);
  });

export const assignBusToDuty = async (
  payload: { dutyId: string; busId: string | null } | { data: { dutyId: string; busId: string | null } }
) => {
  return await _assignBusToDuty(toServerFnArgs(payload)!);
};

const _assignCrewToDuty = createServerFn({ method: "POST" })
  .validator(
    (payload: {
      dutyId: string;
      driverId: string | null;
      conductorId: string | null;
    }) => payload
  )
  .handler(async ({ data }) => {
    const { assignCrewToDutyImpl } = await import("../server/scheduling-ops");
    return await assignCrewToDutyImpl(data.dutyId, data.driverId, data.conductorId);
  });

export const assignCrewToDuty = async (
  payload:
    | {
        dutyId: string;
        driverId: string | null;
        conductorId: string | null;
      }
    | {
        data: {
          dutyId: string;
          driverId: string | null;
          conductorId: string | null;
        };
      }
) => {
  return await _assignCrewToDuty(toServerFnArgs(payload)!);
};

const _createCrewHandover = createServerFn({ method: "POST" })
  .validator(
    (data: {
      dutyId: string;
      driverId: string;
      conductorId: string;
      startTime: number;
      endTime: number;
    }) => data
  )
  .handler(async ({ data }) => {
    const { createCrewHandoverImpl } = await import("../server/scheduling-ops");
    return await createCrewHandoverImpl(data);
  });

export const createCrewHandover = async (data: any) => {
  return await _createCrewHandover(toServerFnArgs(data)!);
};

const _clearHandoverSegments = createServerFn({ method: "POST" })
  .validator((dutyId: string) => dutyId)
  .handler(async ({ data }) => {
    const { clearHandoverSegmentsImpl } = await import("../server/scheduling-ops");
    return await clearHandoverSegmentsImpl(data);
  });

export const clearHandoverSegments = async (dutyId: string | { data: string }) => {
  return await _clearHandoverSegments(toServerFnArgs(dutyId)!);
};

const _validateDuty = createServerFn({ method: "POST" })
  .validator(
    (payload: {
      dutyId: string;
      overrides?: {
        busId?: string | null;
        driverId?: string | null;
        conductorId?: string | null;
        dutyType?: string;
      };
    }) => payload
  )
  .handler(async ({ data }) => {
    const { validateDutyImpl } = await import("../server/scheduling-ops");
    return await validateDutyImpl(data.dutyId, data.overrides);
  });

export const validateDuty = async (payload: any) => {
  return await _validateDuty(toServerFnArgs(payload)!);
};
