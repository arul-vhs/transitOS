import { useState, useEffect, useMemo } from "react";

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

export const INITIAL_TENANTS: TenantInfo[] = [
  {
    id: "6fcb73df-750e-4fe5-b0cb-456b119dcd64",
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
        activeBuses: 42,
      },
      {
        id: "depot-slm-02",
        name: "Salem Junction Depot",
        code: "SLM-JNC-02",
        capacity: 35,
        activeBuses: 30,
      },
      {
        id: "depot-slm-03",
        name: "Suramangalam Depot",
        code: "SLM-SUR-03",
        capacity: 30,
        activeBuses: 26,
      },
    ],
    activeDepot: "Meyyanur Central Depot",
    fleetCount: 48,
    fleetSize: 48,
    routesCount: 8,
    status: "active",
  },
  {
    id: "cbe-750e-4fe5-b0cb-456b119dcd65",
    name: "Coimbatore City Transit",
    slug: "cbe-transit",
    code: "TN-CCT-CBE",
    region: "Coimbatore, Tamil Nadu",
    depots: [
      {
        id: "depot-cbe-01",
        name: "Gandhipuram Depot",
        code: "CBE-GND-01",
        capacity: 55,
        activeBuses: 48,
      },
      {
        id: "depot-cbe-02",
        name: "Ukkadam Depot",
        code: "CBE-UKD-02",
        capacity: 40,
        activeBuses: 35,
      },
      {
        id: "depot-cbe-03",
        name: "Singanallur Depot",
        code: "CBE-SNG-03",
        capacity: 35,
        activeBuses: 30,
      },
    ],
    activeDepot: "Gandhipuram Depot",
    fleetCount: 55,
    fleetSize: 55,
    routesCount: 12,
    status: "active",
  },
  {
    id: "mdu-750e-4fe5-b0cb-456b119dcd66",
    name: "Madurai Metro Bus",
    slug: "madurai-metro",
    code: "TN-MMB-MDU",
    region: "Madurai, Tamil Nadu",
    depots: [
      {
        id: "depot-mdu-01",
        name: "Mattuthavani Central Depot",
        code: "MDU-MAT-01",
        capacity: 50,
        activeBuses: 44,
      },
      {
        id: "depot-mdu-02",
        name: "Periyar Depot",
        code: "MDU-PER-02",
        capacity: 42,
        activeBuses: 36,
      },
      {
        id: "depot-mdu-03",
        name: "Arappalayam Depot",
        code: "MDU-ARP-03",
        capacity: 38,
        activeBuses: 32,
      },
    ],
    activeDepot: "Mattuthavani Central Depot",
    fleetCount: 50,
    fleetSize: 50,
    routesCount: 10,
    status: "active",
  },
  {
    id: "try-750e-4fe5-b0cb-456b119dcd67",
    name: "Tiruchirappalli Regional Transit",
    slug: "trichy-transit",
    code: "TN-TRT-TPJ",
    region: "Tiruchirappalli, Tamil Nadu",
    depots: [
      {
        id: "depot-try-01",
        name: "Central Bus Stand Depot",
        code: "TPJ-CBS-01",
        capacity: 40,
        activeBuses: 34,
      },
      {
        id: "depot-try-02",
        name: "Chathiram Depot",
        code: "TPJ-CHT-02",
        capacity: 32,
        activeBuses: 28,
      },
    ],
    activeDepot: "Central Bus Stand Depot",
    fleetCount: 40,
    fleetSize: 40,
    routesCount: 7,
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

  const switchTenant = (tenantId: string) => {
    const target = tenantsList.find((t) => t.id === tenantId);
    if (!target) return;

    setActiveTenantIdState(target.id);
    setActiveDepotName(target.activeDepot);
    if (typeof window !== "undefined") {
      localStorage.setItem(TENANT_STORAGE_KEY, target.id);
      localStorage.setItem(DEPOT_STORAGE_KEY, target.activeDepot);
      window.dispatchEvent(new Event("transitos_tenant_change"));
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
    // Standard names
    allTenants: tenantsList,
    tenants: tenantsList,
    currentTenant,
    activeTenant: currentTenant,
    currentDepot: currentDepotDetail.name,
    activeDepot: currentDepotDetail,
    // Operations
    switchTenant,
    setActiveTenantId: switchTenant,
    switchDepot,
    setActiveDepotId: switchDepot,
    addTenant: registerTenant,
    registerTenant,
    corporationCount: tenantsList.length,
  };
}
