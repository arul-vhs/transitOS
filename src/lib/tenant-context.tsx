import { useState, useEffect, useMemo } from "react";
import { switchTenantFn } from "@/lib/auth";

export interface DepotDetail {
  id: string;
  name: string;
  code: string;
  capacity: number;
  activeBuses: number;
}

export interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  code: string;
  region: string;
  depots: DepotDetail[];
  activeDepot: string;
  fleetCount: number;
  fleetSize: number;
  routesCount: number;
  status: "active" | "standby";
}

export const CHENNAI_MTC_TENANT_ID = "69000000-0000-4000-8000-000000000069";
export const SALEM_TENANT_ID = "c4ab681d-7b82-4674-bb8a-14ef96de6d23";

export const INITIAL_TENANTS: TenantInfo[] = [
  {
    id: CHENNAI_MTC_TENANT_ID,
    name: "Chennai Metropolitan Transport Corporation",
    slug: "chennai-mtc",
    code: "TN-MTC-CHN",
    region: "Chennai Metropolitan Area, Tamil Nadu",
    depots: [
      {
        id: "depot-chn-01",
        name: "Central / Broadway Depot",
        code: "CHN-BDW-01",
        capacity: 85,
        activeBuses: 78,
      },
      {
        id: "depot-chn-02",
        name: "Adyar Depot",
        code: "CHN-ADY-02",
        capacity: 70,
        activeBuses: 64,
      },
      {
        id: "depot-chn-03",
        name: "Annanagar West Depot",
        code: "CHN-ANW-03",
        capacity: 75,
        activeBuses: 68,
      },
      {
        id: "depot-chn-04",
        name: "Alandur Depot",
        code: "CHN-ALN-04",
        capacity: 60,
        activeBuses: 55,
      },
      {
        id: "depot-chn-05",
        name: "Madhavaram Depot",
        code: "CHN-MDV-05",
        capacity: 65,
        activeBuses: 58,
      },
      {
        id: "depot-chn-06",
        name: "Vadapalani Depot",
        code: "CHN-VDP-06",
        capacity: 80,
        activeBuses: 74,
      },
      {
        id: "depot-chn-07",
        name: "Tambaram Depot",
        code: "CHN-TBM-07",
        capacity: 90,
        activeBuses: 82,
      },
      {
        id: "depot-chn-08",
        name: "CMBT Koyambedu Depot",
        code: "CHN-CMB-08",
        capacity: 100,
        activeBuses: 92,
      },
    ],
    activeDepot: "Central / Broadway Depot",
    fleetCount: 50,
    fleetSize: 50,
    routesCount: 80,
    status: "active",
  },
  {
    id: SALEM_TENANT_ID,
    name: "Salem Transport Corporation",
    slug: "salem-transport",
    code: "TN-STC-SLM",
    region: "Salem, Tamil Nadu",
    depots: [
      {
        id: "depot-slm-01",
        name: "Meyyanur Central Depot",
        code: "SLM-MEY-01",
        capacity: 48,
        activeBuses: 24,
      },
      {
        id: "depot-slm-02",
        name: "Salem Junction Depot",
        code: "SLM-JNC-02",
        capacity: 35,
        activeBuses: 20,
      },
      {
        id: "depot-slm-03",
        name: "Suramangalam Depot",
        code: "SLM-SUR-03",
        capacity: 30,
        activeBuses: 18,
      },
    ],
    activeDepot: "Meyyanur Central Depot",
    fleetCount: 24,
    fleetSize: 24,
    routesCount: 8,
    status: "active",
  },
];

const TENANT_STORAGE_KEY = "transitos_active_tenant_id";
const DEPOT_STORAGE_KEY = "transitos_active_depot_name";
const CUSTOM_TENANTS_KEY = "transitos_custom_tenants";

export function useActiveTenant() {
  const [tenantsList, setTenantsList] = useState<TenantInfo[]>(() => {
    if (typeof window === "undefined") return INITIAL_TENANTS;
    try {
      const stored = localStorage.getItem(CUSTOM_TENANTS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return [...INITIAL_TENANTS, ...parsed];
      }
    } catch (e) {
      void e;
    }
    return INITIAL_TENANTS;
  });

  const [activeTenantId, setActiveTenantIdState] = useState<string>(() => {
    if (typeof window === "undefined") return INITIAL_TENANTS[0]!.id;
    return localStorage.getItem(TENANT_STORAGE_KEY) || INITIAL_TENANTS[0]!.id;
  });

  const currentTenant = useMemo(() => {
    return tenantsList.find((t) => t.id === activeTenantId) || tenantsList[0]!;
  }, [tenantsList, activeTenantId]);

  const [activeDepotName, setActiveDepotName] = useState<string>(() => {
    if (typeof window === "undefined") return currentTenant.activeDepot;
    return localStorage.getItem(DEPOT_STORAGE_KEY) || currentTenant.activeDepot;
  });

  const currentDepotDetail: DepotDetail = useMemo(() => {
    const matched = currentTenant.depots.find(
      (d) =>
        d.name === activeDepotName ||
        d.code === activeDepotName ||
        d.id === activeDepotName,
    );
    return (
      matched ||
      currentTenant.depots[0] || {
        id: "depot-default",
        name: currentTenant.activeDepot,
        code: `${currentTenant.code}-MAIN-01`,
        capacity: 45,
        activeBuses: 38,
      }
    );
  }, [currentTenant, activeDepotName]);

  useEffect(() => {
    const handleStorageChange = () => {
      const savedTenantId = localStorage.getItem(TENANT_STORAGE_KEY);
      const savedDepot = localStorage.getItem(DEPOT_STORAGE_KEY);
      if (savedTenantId) setActiveTenantIdState(savedTenantId);
      if (savedDepot) setActiveDepotName(savedDepot);
    };

    window.addEventListener("transitos_tenant_change", handleStorageChange);
    return () => {
      window.removeEventListener(
        "transitos_tenant_change",
        handleStorageChange,
      );
    };
  }, []);

  const switchTenant = async (tenantId: string) => {
    const target = tenantsList.find((t) => t.id === tenantId);
    if (!target) return;

    setActiveTenantIdState(target.id);
    setActiveDepotName(target.activeDepot);
    if (typeof window !== "undefined") {
      localStorage.setItem(TENANT_STORAGE_KEY, target.id);
      localStorage.setItem(DEPOT_STORAGE_KEY, target.activeDepot);
      window.dispatchEvent(new Event("transitos_tenant_change"));
    }

    try {
      await switchTenantFn({ tenantId: target.id });
      // Invalidate window to ensure all server loaders refresh immediately
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    } catch (err) {
      console.error("Failed to switch tenant on server", err);
    }
  };

  const switchDepot = (depotNameOrId: string) => {
    const matched = currentTenant.depots.find(
      (d) =>
        d.name === depotNameOrId ||
        d.code === depotNameOrId ||
        d.id === depotNameOrId,
    );
    const resolvedName = matched ? matched.name : depotNameOrId;
    setActiveDepotName(resolvedName);
    if (typeof window !== "undefined") {
      localStorage.setItem(DEPOT_STORAGE_KEY, resolvedName);
      window.dispatchEvent(new Event("transitos_tenant_change"));
    }
  };

  const registerTenant = (newTenantData: {
    name: string;
    code: string;
    region: string;
    fleetSize: number;
    routesCount?: number;
    depots?: DepotDetail[];
  }) => {
    const newId = `tenant-${Date.now()}`;
    const defaultDepots: DepotDetail[] =
      newTenantData.depots && newTenantData.depots.length > 0
        ? newTenantData.depots
        : [
            {
              id: `depot-${Date.now()}`,
              name: `${newTenantData.name} Central Depot`,
              code: `${newTenantData.code}-MAIN-01`,
              capacity: 50,
              activeBuses: Math.floor(newTenantData.fleetSize * 0.8),
            },
          ];

    const newTenant: TenantInfo = {
      id: newId,
      name: newTenantData.name,
      slug: newTenantData.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      code: newTenantData.code,
      region: newTenantData.region,
      depots: defaultDepots,
      activeDepot: defaultDepots[0]!.name,
      fleetCount: newTenantData.fleetSize,
      fleetSize: newTenantData.fleetSize,
      routesCount: newTenantData.routesCount || 8,
      status: "active",
    };

    const updated = [...tenantsList, newTenant];
    setTenantsList(updated);
    switchTenant(newId);

    if (typeof window !== "undefined") {
      try {
        const customOnly = updated.filter(
          (t) => !INITIAL_TENANTS.some((init) => init.id === t.id),
        );
        localStorage.setItem(CUSTOM_TENANTS_KEY, JSON.stringify(customOnly));
      } catch (e) {
        void e;
      }
    }

    return newTenant;
  };

  return {
    allTenants: tenantsList,
    tenants: tenantsList,
    currentTenant,
    activeTenant: currentTenant,
    currentDepot: currentDepotDetail.name,
    activeDepot: currentDepotDetail,
    switchTenant,
    setActiveTenantId: switchTenant,
    switchDepot,
    setActiveDepotId: switchDepot,
    addTenant: registerTenant,
    registerTenant,
    corporationCount: tenantsList.length,
  };
}
