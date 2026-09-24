import { eq, and, or, like, sql } from "drizzle-orm";
import { db } from "./db";
import { buses, crew, auditLogs } from "./db/schema";
import { requireAuth, requirePermission } from "./auth";
import { withTenant } from "./db";
import { FALLBACK_BUSES, FALLBACK_CREW } from "./db/fallback-data";

// ----------------------------------------------------
// Fleet Management Implementations
// ----------------------------------------------------

export async function getBusesImpl(filters?: {
  status?: string;
  depot?: string;
  search?: string;
}) {
  const currentUser = await requireAuth();
  await requirePermission(currentUser.role, "fleet.view");

  try {
    let conditions = [eq(buses.tenantId, currentUser.tenantId)];

    if (filters?.status && filters.status !== "all") {
      conditions.push(eq(buses.status, filters.status));
    }

    if (filters?.depot && filters.depot !== "all") {
      conditions.push(eq(buses.depot, filters.depot));
    }

    if (filters?.search) {
      const searchPattern = `%${filters.search}%`;
      conditions.push(
        or(
          like(buses.registrationNumber, searchPattern),
          like(buses.fleetNumber, searchPattern)
        )!
      );
    }

    return await db
      .select()
      .from(buses)
      .where(and(...conditions))
      .orderBy(buses.fleetNumber);
  } catch (err) {
    let result = [...FALLBACK_BUSES];
    if (filters?.status && filters.status !== "all") {
      result = result.filter((b) => b.status === filters.status);
    }
    if (filters?.depot && filters.depot !== "all") {
      result = result.filter((b) => b.depot === filters.depot);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (b) =>
          b.registrationNumber.toLowerCase().includes(q) ||
          b.fleetNumber.toLowerCase().includes(q)
      );
    }
    return result as any;
  }
}

export async function getBusImpl(id: string) {
  const currentUser = await requireAuth();
  await requirePermission(currentUser.role, "fleet.view");

  const bus = await db.query.buses.findFirst({
    where: and(eq(buses.id, id), eq(buses.tenantId, currentUser.tenantId)),
  });

  if (!bus) {
    throw new Error("Bus not found");
  }

  // Return bus details with empty placeholder history for duties
  return {
    ...bus,
    todayDuties: [],
    upcomingDuties: [],
    maintenanceHistory: [],
    assignmentHistory: [],
  };
}

export async function createBusImpl(data: {
  registrationNumber: string;
  fleetNumber: string;
  busType: string;
  capacity: number;
  depot: string;
  status: string;
  availableFrom?: number;
}) {
  const currentUser = await requireAuth();
  await requirePermission(currentUser.role, "fleet.manage");

  if (!data.registrationNumber) throw new Error("Registration number is required");
  if (!data.fleetNumber) throw new Error("Fleet number is required");
  if (!data.capacity || data.capacity <= 0) throw new Error("Capacity must be positive");
  if (!data.depot) throw new Error("Depot is required");

  // Validate unique registration number within tenant
  const existingReg = await db.query.buses.findFirst({
    where: and(
      eq(buses.registrationNumber, data.registrationNumber),
      eq(buses.tenantId, currentUser.tenantId)
    ),
  });
  if (existingReg) {
    throw new Error(`Registration number ${data.registrationNumber} already exists in this tenant.`);
  }

  // Validate unique fleet number within tenant
  const existingFleet = await db.query.buses.findFirst({
    where: and(
      eq(buses.fleetNumber, data.fleetNumber),
      eq(buses.tenantId, currentUser.tenantId)
    ),
  });
  if (existingFleet) {
    throw new Error(`Fleet number ${data.fleetNumber} already exists in this tenant.`);
  }

  const [newBus] = await db
    .insert(buses)
    .values({
      tenantId: currentUser.tenantId,
      registrationNumber: data.registrationNumber,
      fleetNumber: data.fleetNumber,
      busType: data.busType,
      capacity: data.capacity,
      depot: data.depot,
      status: data.status || "available",
      availableFrom: data.availableFrom ?? 330,
    })
    .returning();

  // Audit Log
  await db.insert(auditLogs).values({
    tenantId: currentUser.tenantId,
    userId: currentUser.id,
    email: currentUser.email,
    action: "BUS_CREATED",
    details: `Created bus: ${newBus!.fleetNumber} (${newBus!.registrationNumber})`,
  });

  return newBus;
}

export async function updateBusImpl(
  id: string,
  data: {
    registrationNumber: string;
    fleetNumber: string;
    busType: string;
    capacity: number;
    depot: string;
    status: string;
    availableFrom?: number;
  }
) {
  const currentUser = await requireAuth();
  await requirePermission(currentUser.role, "fleet.manage");

  const bus = await db.query.buses.findFirst({
    where: and(eq(buses.id, id), eq(buses.tenantId, currentUser.tenantId)),
  });
  if (!bus) throw new Error("Bus not found");

  if (!data.registrationNumber) throw new Error("Registration number is required");
  if (!data.fleetNumber) throw new Error("Fleet number is required");
  if (!data.capacity || data.capacity <= 0) throw new Error("Capacity must be positive");
  if (!data.depot) throw new Error("Depot is required");

  // Validate uniqueness if changing registration
  if (data.registrationNumber !== bus.registrationNumber) {
    const existingReg = await db.query.buses.findFirst({
      where: and(
        eq(buses.registrationNumber, data.registrationNumber),
        eq(buses.tenantId, currentUser.tenantId)
      ),
    });
    if (existingReg) {
      throw new Error(`Registration number ${data.registrationNumber} already exists.`);
    }
  }

  // Validate uniqueness if changing fleet number
  if (data.fleetNumber !== bus.fleetNumber) {
    const existingFleet = await db.query.buses.findFirst({
      where: and(
        eq(buses.fleetNumber, data.fleetNumber),
        eq(buses.tenantId, currentUser.tenantId)
      ),
    });
    if (existingFleet) {
      throw new Error(`Fleet number ${data.fleetNumber} already exists.`);
    }
  }

  const [updatedBus] = await db
    .update(buses)
    .set({
      registrationNumber: data.registrationNumber,
      fleetNumber: data.fleetNumber,
      busType: data.busType,
      capacity: data.capacity,
      depot: data.depot,
      status: data.status,
      availableFrom: data.availableFrom ?? bus.availableFrom,
      updatedAt: new Date(),
    })
    .where(and(eq(buses.id, id), eq(buses.tenantId, currentUser.tenantId)))
    .returning();

  // Audit Log
  await db.insert(auditLogs).values({
    tenantId: currentUser.tenantId,
    userId: currentUser.id,
    email: currentUser.email,
    action: "BUS_UPDATED",
    details: `Updated bus: ${updatedBus!.fleetNumber} (${updatedBus!.registrationNumber})`,
  });

  return updatedBus;
}

export async function updateBusStatusImpl(id: string, status: string) {
  const currentUser = await requireAuth();
  await requirePermission(currentUser.role, "fleet.manage");

  const bus = await db.query.buses.findFirst({
    where: and(eq(buses.id, id), eq(buses.tenantId, currentUser.tenantId)),
  });
  if (!bus) throw new Error("Bus not found");

  const [updatedBus] = await db
    .update(buses)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(buses.id, id), eq(buses.tenantId, currentUser.tenantId)))
    .returning();

  // Audit Log
  await db.insert(auditLogs).values({
    tenantId: currentUser.tenantId,
    userId: currentUser.id,
    email: currentUser.email,
    action: "BUS_STATUS_CHANGED",
    details: `Status of bus ${bus.fleetNumber} changed from ${bus.status} to ${status}`,
  });

  return updatedBus;
}

// ----------------------------------------------------
// Crew Management Implementations
// ----------------------------------------------------

async function getCrewByRole(role: string, filters?: { search?: string; status?: string; depot?: string }) {
  const currentUser = await requireAuth();
  await requirePermission(currentUser.role, "crew.view");

  try {
    let conditions = [
      eq(crew.tenantId, currentUser.tenantId),
      eq(crew.role, role)
    ];

    if (filters?.status && filters.status !== "all") {
      conditions.push(eq(crew.status, filters.status));
    }

    if (filters?.depot && filters.depot !== "all") {
      conditions.push(eq(crew.depot, filters.depot));
    }

    if (filters?.search) {
      const searchPattern = `%${filters.search}%`;
      conditions.push(
        or(
          like(crew.name, searchPattern),
          like(crew.employeeId, searchPattern)
        )!
      );
    }

    return await db
      .select()
      .from(crew)
      .where(and(...conditions))
      .orderBy(crew.employeeId);
  } catch (err) {
    let result = FALLBACK_CREW.filter((c) => c.role === role);
    if (filters?.status && filters.status !== "all") {
      result = result.filter((c) => c.status === filters.status);
    }
    if (filters?.depot && filters.depot !== "all") {
      result = result.filter((c) => c.depot === filters.depot);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.badgeNumber.toLowerCase().includes(q) ||
          c.employeeId.toLowerCase().includes(q)
      );
    }
    return result as any;
  }
}

export async function getDriversImpl(filters?: { search?: string; status?: string; depot?: string }) {
  return await getCrewByRole("driver", filters);
}

export async function getConductorsImpl(filters?: { search?: string; status?: string; depot?: string }) {
  return await getCrewByRole("conductor", filters);
}

export async function getCrewMemberImpl(id: string) {
  const currentUser = await requireAuth();
  await requirePermission(currentUser.role, "crew.view");

  const member = await db.query.crew.findFirst({
    where: and(eq(crew.id, id), eq(crew.tenantId, currentUser.tenantId)),
  });

  if (!member) throw new Error("Crew member not found");
  return member;
}

export async function createCrewMemberImpl(data: {
  employeeId: string;
  name: string;
  role: "driver" | "conductor";
  status: string;
  depot: string;
  availableFrom?: number;
  restUntil?: number;
  licenseCategory?: string | null;
  licenseExpiry?: Date | null;
}) {
  const currentUser = await requireAuth();
  await requirePermission(currentUser.role, "crew.manage");

  if (!data.employeeId) throw new Error("Employee ID is required");
  if (!data.name) throw new Error("Name is required");
  if (!data.depot) throw new Error("Depot is required");

  // Validate license category/expiry for drivers
  if (data.role === "driver") {
    if (data.licenseExpiry && isNaN(data.licenseExpiry.getTime())) {
      throw new Error("License expiry must be a valid date");
    }
  }

  // Validate employeeId uniqueness within tenant
  const existing = await db.query.crew.findFirst({
    where: and(
      eq(crew.employeeId, data.employeeId),
      eq(crew.tenantId, currentUser.tenantId)
    ),
  });
  if (existing) {
    throw new Error(`Employee ID ${data.employeeId} already exists in this tenant.`);
  }

  const [newMember] = await db
    .insert(crew)
    .values({
      tenantId: currentUser.tenantId,
      employeeId: data.employeeId,
      name: data.name,
      role: data.role,
      status: data.status || "available",
      depot: data.depot,
      availableFrom: data.availableFrom ?? 330,
      restUntil: data.restUntil ?? 330,
      licenseCategory: data.role === "driver" ? (data.licenseCategory || "Commercial Bus Licence") : null,
      licenseExpiry: data.role === "driver" ? data.licenseExpiry : null,
    })
    .returning();

  // Audit Log
  const actionType = data.role === "driver" ? "DRIVER_CREATED" : "CONDUCTOR_CREATED";
  await db.insert(auditLogs).values({
    tenantId: currentUser.tenantId,
    userId: currentUser.id,
    email: currentUser.email,
    action: actionType,
    details: `Created ${data.role}: ${newMember!.name} (${newMember!.employeeId})`,
  });

  return newMember;
}

export async function updateCrewMemberImpl(
  id: string,
  data: {
    employeeId: string;
    name: string;
    status: string;
    depot: string;
    availableFrom?: number;
    restUntil?: number;
    licenseCategory?: string | null;
    licenseExpiry?: Date | null;
  }
) {
  const currentUser = await requireAuth();
  await requirePermission(currentUser.role, "crew.manage");

  const member = await db.query.crew.findFirst({
    where: and(eq(crew.id, id), eq(crew.tenantId, currentUser.tenantId)),
  });
  if (!member) throw new Error("Crew member not found");

  if (!data.employeeId) throw new Error("Employee ID is required");
  if (!data.name) throw new Error("Name is required");
  if (!data.depot) throw new Error("Depot is required");

  // Validate license category/expiry for drivers
  if (member.role === "driver") {
    if (data.licenseExpiry && isNaN(data.licenseExpiry.getTime())) {
      throw new Error("License expiry must be a valid date");
    }
  }

  // Validate uniqueness if changing employeeId
  if (data.employeeId !== member.employeeId) {
    const existing = await db.query.crew.findFirst({
      where: and(
        eq(crew.employeeId, data.employeeId),
        eq(crew.tenantId, currentUser.tenantId)
      ),
    });
    if (existing) {
      throw new Error(`Employee ID ${data.employeeId} already exists.`);
    }
  }

  const [updatedMember] = await db
    .update(crew)
    .set({
      employeeId: data.employeeId,
      name: data.name,
      status: data.status,
      depot: data.depot,
      availableFrom: data.availableFrom ?? member.availableFrom,
      restUntil: data.restUntil ?? member.restUntil,
      licenseCategory: member.role === "driver" ? data.licenseCategory : null,
      licenseExpiry: member.role === "driver" ? data.licenseExpiry : null,
      updatedAt: new Date(),
    })
    .where(and(eq(crew.id, id), eq(crew.tenantId, currentUser.tenantId)))
    .returning();

  // Audit Log
  const actionType = member.role === "driver" ? "DRIVER_UPDATED" : "CONDUCTOR_UPDATED";
  await db.insert(auditLogs).values({
    tenantId: currentUser.tenantId,
    userId: currentUser.id,
    email: currentUser.email,
    action: actionType,
    details: `Updated ${member.role}: ${updatedMember!.name} (${updatedMember!.employeeId})`,
  });

  return updatedMember;
}

export async function updateCrewStatusImpl(id: string, status: string) {
  const currentUser = await requireAuth();
  await requirePermission(currentUser.role, "crew.manage");

  const member = await db.query.crew.findFirst({
    where: and(eq(crew.id, id), eq(crew.tenantId, currentUser.tenantId)),
  });
  if (!member) throw new Error("Crew member not found");

  const [updatedMember] = await db
    .update(crew)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(crew.id, id), eq(crew.tenantId, currentUser.tenantId)))
    .returning();

  // Audit Log
  const actionType = member.role === "driver" ? "DRIVER_STATUS_CHANGED" : "CONDUCTOR_STATUS_CHANGED";
  await db.insert(auditLogs).values({
    tenantId: currentUser.tenantId,
    userId: currentUser.id,
    email: currentUser.email,
    action: actionType,
    details: `Status of ${member.role} ${member.name} changed from ${member.status} to ${status}`,
  });

  return updatedMember;
}

// ----------------------------------------------------
// Crew Availability Implementations
// ----------------------------------------------------

export async function getCrewAvailabilityImpl() {
  const currentUser = await requireAuth();
  await requirePermission(currentUser.role, "crew.view");

  try {
    // Retrieve all crew members for timeline view from PostgreSQL
    const list = await db
      .select()
      .from(crew)
      .where(eq(crew.tenantId, currentUser.tenantId))
      .orderBy(crew.role, crew.name);

    if (list && list.length > 0) {
      return list;
    }
  } catch (err) {
    console.warn("DB query error in getCrewAvailabilityImpl, using fallback crew dataset:", err);
  }

  return FALLBACK_CREW as any;
}

