import { createServerFn } from "@tanstack/react-start";
import { toServerFnArgs } from "./server-fn-utils";

// 1. Buses
const _getBuses = createServerFn({ method: "GET" })
  .validator((filters?: { status?: string; depot?: string; search?: string }) => filters)
  .handler(async ({ data }) => {
    const { getBusesImpl } = await import("../server/fleet-crew");
    return await getBusesImpl(data);
  });

export const getBuses = async (
  filters?: { status?: string; depot?: string; search?: string } | { data?: { status?: string; depot?: string; search?: string } }
) => {
  return await _getBuses(toServerFnArgs(filters));
};

const _getBus = createServerFn({ method: "GET" })
  .validator((id: string) => id)
  .handler(async ({ data }) => {
    const { getBusImpl } = await import("../server/fleet-crew");
    return await getBusImpl(data);
  });

export const getBus = async (id: string | { data: string }) => {
  return await _getBus(toServerFnArgs(id)!);
};

const _createBus = createServerFn({ method: "POST" })
  .validator(
    (data: {
      registrationNumber: string;
      fleetNumber: string;
      busType: string;
      capacity: number;
      depot: string;
      status: string;
      availableFrom?: number;
    }) => data
  )
  .handler(async ({ data }) => {
    const { createBusImpl } = await import("../server/fleet-crew");
    return await createBusImpl(data);
  });

export const createBus = async (
  data:
    | {
        registrationNumber: string;
        fleetNumber: string;
        busType: string;
        capacity: number;
        depot: string;
        status: string;
        availableFrom?: number;
      }
    | {
        data: {
          registrationNumber: string;
          fleetNumber: string;
          busType: string;
          capacity: number;
          depot: string;
          status: string;
          availableFrom?: number;
        };
      }
) => {
  return await _createBus(toServerFnArgs(data)!);
};

const _updateBus = createServerFn({ method: "POST" })
  .validator(
    (payload: {
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
    }) => payload
  )
  .handler(async ({ data }) => {
    const { updateBusImpl } = await import("../server/fleet-crew");
    return await updateBusImpl(data.id, data.data);
  });

export const updateBus = async (
  payload:
    | {
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
      }
    | {
        data: {
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
        };
      }
) => {
  return await _updateBus(toServerFnArgs(payload)! as any);
};

const _updateBusStatus = createServerFn({ method: "POST" })
  .validator((payload: { id: string; status: string }) => payload)
  .handler(async ({ data }) => {
    const { updateBusStatusImpl } = await import("../server/fleet-crew");
    return await updateBusStatusImpl(data.id, data.status);
  });

export const updateBusStatus = async (
  payload: { id: string; status: string } | { data: { id: string; status: string } }
) => {
  return await _updateBusStatus(toServerFnArgs(payload)!);
};

// 2. Crew
const _getDrivers = createServerFn({ method: "GET" })
  .validator((filters?: { search?: string; status?: string; depot?: string }) => filters)
  .handler(async ({ data }) => {
    const { getDriversImpl } = await import("../server/fleet-crew");
    return await getDriversImpl(data);
  });

export const getDrivers = async (
  filters?: { search?: string; status?: string; depot?: string } | { data?: { search?: string; status?: string; depot?: string } }
) => {
  return await _getDrivers(toServerFnArgs(filters));
};

const _getConductors = createServerFn({ method: "GET" })
  .validator((filters?: { search?: string; status?: string; depot?: string }) => filters)
  .handler(async ({ data }) => {
    const { getConductorsImpl } = await import("../server/fleet-crew");
    return await getConductorsImpl(data);
  });

export const getConductors = async (
  filters?: { search?: string; status?: string; depot?: string } | { data?: { search?: string; status?: string; depot?: string } }
) => {
  return await _getConductors(toServerFnArgs(filters));
};

const _getCrewMember = createServerFn({ method: "GET" })
  .validator((id: string) => id)
  .handler(async ({ data }) => {
    const { getCrewMemberImpl } = await import("../server/fleet-crew");
    return await getCrewMemberImpl(data);
  });

export const getCrewMember = async (id: string | { data: string }) => {
  return await _getCrewMember(toServerFnArgs(id)!);
};

const _createCrewMember = createServerFn({ method: "POST" })
  .validator(
    (data: {
      employeeId: string;
      name: string;
      role: "driver" | "conductor";
      status: string;
      depot: string;
      availableFrom?: number;
      restUntil?: number;
      licenseCategory?: string | null;
      licenseExpiry?: Date | null;
    }) => data
  )
  .handler(async ({ data }) => {
    const { createCrewMemberImpl } = await import("../server/fleet-crew");
    return await createCrewMemberImpl(data);
  });

export const createCrewMember = async (
  data:
    | {
        employeeId: string;
        name: string;
        role: "driver" | "conductor";
        status: string;
        depot: string;
        availableFrom?: number;
        restUntil?: number;
        licenseCategory?: string | null;
        licenseExpiry?: Date | null;
      }
    | {
        data: {
          employeeId: string;
          name: string;
          role: "driver" | "conductor";
          status: string;
          depot: string;
          availableFrom?: number;
          restUntil?: number;
          licenseCategory?: string | null;
          licenseExpiry?: Date | null;
        };
      }
) => {
  return await _createCrewMember(toServerFnArgs(data)!);
};

const _updateCrewMember = createServerFn({ method: "POST" })
  .validator(
    (payload: {
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
    }) => payload
  )
  .handler(async ({ data }) => {
    const { updateCrewMemberImpl } = await import("../server/fleet-crew");
    return await updateCrewMemberImpl(data.id, data.data);
  });

export const updateCrewMember = async (
  payload:
    | {
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
      }
    | {
        data: {
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
        };
      }
) => {
  return await _updateCrewMember(toServerFnArgs(payload)! as any);
};

const _updateCrewStatus = createServerFn({ method: "POST" })
  .validator((payload: { id: string; status: string }) => payload)
  .handler(async ({ data }) => {
    const { updateCrewStatusImpl } = await import("../server/fleet-crew");
    return await updateCrewStatusImpl(data.id, data.status);
  });

export const updateCrewStatus = async (
  payload: { id: string; status: string } | { data: { id: string; status: string } }
) => {
  return await _updateCrewStatus(toServerFnArgs(payload)!);
};

const _getCrewAvailability = createServerFn({ method: "GET" }).handler(async () => {
  const { getCrewAvailabilityImpl } = await import("../server/fleet-crew");
  return await getCrewAvailabilityImpl();
});

export const getCrewAvailability = async () => {
  return await _getCrewAvailability();
};
