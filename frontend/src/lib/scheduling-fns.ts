import { createServerFn } from "@tanstack/react-start";

const SCHEDULING_OPS_SERVER_PATH = "../server/scheduling-ops";

export const getTrips = createServerFn(
  "GET",
  async (filters?: { serviceDate?: string; routeId?: string; status?: string; direction?: string }) => {
    const { getTripsImpl } = await import(SCHEDULING_OPS_SERVER_PATH);
    return await getTripsImpl(filters);
  }
);

export const getTrip = createServerFn("GET", async (id: string) => {
  const { getTripImpl } = await import(SCHEDULING_OPS_SERVER_PATH);
  return await getTripImpl(id);
});

export const createTrip = createServerFn(
  "POST",
  async (data: {
    routeId: string;
    startTime: number;
    serviceDate: string;
    direction?: string;
    status?: string;
  }) => {
    const { createTripImpl } = await import(SCHEDULING_OPS_SERVER_PATH);
    return await createTripImpl(data);
  }
);

export const updateTrip = createServerFn(
  "POST",
  async (payload: {
    id: string;
    data: {
      startTime: number;
      serviceDate: string;
      direction?: string;
      status?: string;
    };
  }) => {
    const { updateTripImpl } = await import(SCHEDULING_OPS_SERVER_PATH);
    return await updateTripImpl(payload.id, payload.data);
  }
);

export const cancelTrip = createServerFn("POST", async (id: string) => {
  const { cancelTripImpl } = await import(SCHEDULING_OPS_SERVER_PATH);
  return await cancelTripImpl(id);
});

export const generateTrips = createServerFn(
  "POST",
  async (data: {
    routeId: string;
    serviceDate: string;
    startTime: number;
    endTime: number;
    frequency: number;
    direction?: string;
  }) => {
    const { generateTripsImpl } = await import(SCHEDULING_OPS_SERVER_PATH);
    return await generateTripsImpl(data);
  }
);

export const getDuties = createServerFn(
  "GET",
  async (filters?: { serviceDate?: string; status?: string }) => {
    const { getDutiesImpl } = await import(SCHEDULING_OPS_SERVER_PATH);
    return await getDutiesImpl(filters);
  }
);

export const getDuty = createServerFn("GET", async (id: string) => {
  const { getDutyImpl } = await import(SCHEDULING_OPS_SERVER_PATH);
  return await getDutyImpl(id);
});

export const createDuty = createServerFn(
  "POST",
  async (data: {
    dutyCode: string;
    dutyType: string;
    serviceDate: string;
  }) => {
    const { createDutyImpl } = await import(SCHEDULING_OPS_SERVER_PATH);
    return await createDutyImpl(data);
  }
);

export const updateDuty = createServerFn(
  "POST",
  async (payload: {
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
  }) => {
    const { updateDutyImpl } = await import(SCHEDULING_OPS_SERVER_PATH);
    return await updateDutyImpl(payload.id, payload.data);
  }
);

export const deleteDuty = createServerFn("POST", async (id: string) => {
  const { deleteDutyImpl } = await import(SCHEDULING_OPS_SERVER_PATH);
  return await deleteDutyImpl(id);
});

export const addTripToDuty = createServerFn(
  "POST",
  async (payload: { dutyId: string; tripId: string }) => {
    const { addTripToDutyImpl } = await import(SCHEDULING_OPS_SERVER_PATH);
    return await addTripToDutyImpl(payload.dutyId, payload.tripId);
  }
);

export const removeTripFromDuty = createServerFn(
  "POST",
  async (payload: { dutyId: string; tripId: string }) => {
    const { removeTripFromDutyImpl } = await import(SCHEDULING_OPS_SERVER_PATH);
    return await removeTripFromDutyImpl(payload.dutyId, payload.tripId);
  }
);

export const assignBusToDuty = createServerFn(
  "POST",
  async (payload: { dutyId: string; busId: string | null }) => {
    const { assignBusToDutyImpl } = await import(SCHEDULING_OPS_SERVER_PATH);
    return await assignBusToDutyImpl(payload.dutyId, payload.busId);
  }
);

export const assignCrewToDuty = createServerFn(
  "POST",
  async (payload: { dutyId: string; driverId: string | null; conductorId: string | null }) => {
    const { assignCrewToDutyImpl } = await import(SCHEDULING_OPS_SERVER_PATH);
    return await assignCrewToDutyImpl(payload.dutyId, payload.driverId, payload.conductorId);
  }
);

export const createCrewHandover = createServerFn(
  "POST",
  async (data: {
    dutyId: string;
    driverId: string;
    conductorId: string;
    startTime: number;
    endTime: number;
  }) => {
    const { createCrewHandoverImpl } = await import(SCHEDULING_OPS_SERVER_PATH);
    return await createCrewHandoverImpl(data);
  }
);

export const clearHandoverSegments = createServerFn("POST", async (dutyId: string) => {
  const { clearHandoverSegmentsImpl } = await import(SCHEDULING_OPS_SERVER_PATH);
  return await clearHandoverSegmentsImpl(dutyId);
});

export const validateDuty = createServerFn(
  "POST",
  async (payload: {
    dutyId: string;
    overrides?: {
      busId?: string | null;
      driverId?: string | null;
      conductorId?: string | null;
      dutyType?: string;
    };
  }) => {
    const { validateDutyImpl } = await import(SCHEDULING_OPS_SERVER_PATH);
    return await validateDutyImpl(payload.dutyId, payload.overrides);
  }
);
