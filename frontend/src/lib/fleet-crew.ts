import { createServerFn } from "@tanstack/react-start";

const FLEET_CREW_SERVER_PATH = "../server/fleet-crew";

export const getBuses = createServerFn(
  "GET",
  async (filters?: { status?: string; depot?: string; search?: string }) => {
    const { getBusesImpl } = await import(FLEET_CREW_SERVER_PATH);
    return await getBusesImpl(filters);
  }
);

export const getBus = createServerFn("GET", async (id: string) => {
  const { getBusImpl } = await import(FLEET_CREW_SERVER_PATH);
  return await getBusImpl(id);
});

export const createBus = createServerFn(
  "POST",
  async (data: {
    registrationNumber: string;
    fleetNumber: string;
    busType: string;
    capacity: number;
    depot: string;
    status: string;
    availableFrom?: number;
  }) => {
    const { createBusImpl } = await import(FLEET_CREW_SERVER_PATH);
    return await createBusImpl(data);
  }
);

export const updateBus = createServerFn(
  "POST",
  async (payload: {
    id: string;
    data: {
      registrationNumber: string;
      fleetNumber: string;
      busType: string;
      capacity: number;
      depot: string;
      status: string;
      availableFrom?: number;
    };
  }) => {
    const { updateBusImpl } = await import(FLEET_CREW_SERVER_PATH);
    return await updateBusImpl(payload.id, payload.data);
  }
);

export const updateBusStatus = createServerFn(
  "POST",
  async (payload: { id: string; status: string }) => {
    const { updateBusStatusImpl } = await import(FLEET_CREW_SERVER_PATH);
    return await updateBusStatusImpl(payload.id, payload.status);
  }
);

export const getDrivers = createServerFn(
  "GET",
  async (filters?: { search?: string; status?: string; depot?: string }) => {
    const { getDriversImpl } = await import(FLEET_CREW_SERVER_PATH);
    return await getDriversImpl(filters);
  }
);

export const getConductors = createServerFn(
  "GET",
  async (filters?: { search?: string; status?: string; depot?: string }) => {
    const { getConductorsImpl } = await import(FLEET_CREW_SERVER_PATH);
    return await getConductorsImpl(filters);
  }
);

export const getCrewMember = createServerFn("GET", async (id: string) => {
  const { getCrewMemberImpl } = await import(FLEET_CREW_SERVER_PATH);
  return await getCrewMemberImpl(id);
});

export const createCrewMember = createServerFn(
  "POST",
  async (data: {
    employeeId: string;
    name: string;
    role: "driver" | "conductor";
    status: string;
    depot: string;
    availableFrom?: number;
    restUntil?: number;
    licenseCategory?: string | null;
    licenseExpiry?: Date | null;
  }) => {
    const { createCrewMemberImpl } = await import(FLEET_CREW_SERVER_PATH);
    return await createCrewMemberImpl(data);
  }
);

export const updateCrewMember = createServerFn(
  "POST",
  async (payload: {
    id: string;
    data: {
      employeeId: string;
      name: string;
      status: string;
      depot: string;
      availableFrom?: number;
      restUntil?: number;
      licenseCategory?: string | null;
      licenseExpiry?: Date | null;
    };
  }) => {
    const { updateCrewMemberImpl } = await import(FLEET_CREW_SERVER_PATH);
    return await updateCrewMemberImpl(payload.id, payload.data);
  }
);

export const updateCrewStatus = createServerFn(
  "POST",
  async (payload: { id: string; status: string }) => {
    const { updateCrewStatusImpl } = await import(FLEET_CREW_SERVER_PATH);
    return await updateCrewStatusImpl(payload.id, payload.status);
  }
);

export const getCrewAvailability = createServerFn("GET", async () => {
  const { getCrewAvailabilityImpl } = await import(FLEET_CREW_SERVER_PATH);
  return await getCrewAvailabilityImpl();
});
