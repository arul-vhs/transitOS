import { createServerFn } from "@tanstack/react-start";
import { toServerFnArgs } from "./server-fn-utils";

const _getTenants = createServerFn({ method: "GET" }).handler(async () => {
  const { getTenantsImpl } = await import("../server/tenant-ops");
  return await getTenantsImpl();
});

export const getTenants = async () => {
  return await _getTenants();
};

const _createTenant = createServerFn({ method: "POST" })
  .validator(
    (data: {
      name: string;
      code: string;
      region: string;
      fleetSize?: number;
    }) => data,
  )
  .handler(async ({ data }) => {
    const { createTenantImpl } = await import("../server/tenant-ops");
    return await createTenantImpl(data);
  });

export const createTenant = async (
  data:
    | {
        name: string;
        code: string;
        region: string;
        fleetSize?: number;
      }
    | {
        data: {
          name: string;
          code: string;
          region: string;
          fleetSize?: number;
        };
      },
) => {
  return await _createTenant(toServerFnArgs(data)!);
};

const _deleteTenant = createServerFn({ method: "POST" })
  .validator((tenantId: string) => tenantId)
  .handler(async ({ data }) => {
    const { deleteTenantImpl } = await import("../server/tenant-ops");
    return await deleteTenantImpl(data);
  });

export const deleteTenant = async (
  tenantId: string | { data: string },
) => {
  return await _deleteTenant(toServerFnArgs(tenantId)!);
};

