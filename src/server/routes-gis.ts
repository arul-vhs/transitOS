import { eq, and, or, like, asc } from "drizzle-orm";
import { db } from "./db";
import { routes, stops, trips, auditLogs } from "./db/schema";
import { requireAuth, requirePermission } from "./auth";
import { FALLBACK_ROUTES, FALLBACK_STOPS } from "./db/fallback-data";

// ----------------------------------------------------
// GIS & Distance Helpers
// ----------------------------------------------------

function getDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(deltaLambda / 2) *
      Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Spatially interpolates a LineString coordinates array into equidistant points
function interpolateLineString(
  coords: [number, number][],
  intervalMeters = 80,
): [number, number][] {
  if (coords.length === 0) return [];
  const result: [number, number][] = [coords[0]!];
  let carry = 0;

  for (let i = 0; i < coords.length - 1; i++) {
    const start = coords[i]!;
    const end = coords[i + 1]!;
    const dist = getDistanceMeters(start[1], start[0], end[1], end[0]);

    if (dist === 0) continue;

    let currentDist = carry;
    while (currentDist + intervalMeters <= dist) {
      currentDist += intervalMeters;
      const ratio = currentDist / dist;
      const interpolatedLng = start[0] + (end[0] - start[0]) * ratio;
      const interpolatedLat = start[1] + (end[1] - start[1]) * ratio;
      result.push([interpolatedLng, interpolatedLat]);
    }
    carry = dist - currentDist;
  }

  const last = coords[coords.length - 1]!;
  if (result.length > 0) {
    const lastAdded = result[result.length - 1]!;
    if (getDistanceMeters(lastAdded[1], lastAdded[0], last[1], last[0]) > 10) {
      result.push(last);
    }
  } else {
    result.push(last);
  }

  return result;
}

// ----------------------------------------------------
// Route Implementations
// ----------------------------------------------------

export async function getRoutesImpl(filters?: {
  status?: string;
  direction?: string;
  search?: string;
}) {
  const currentUser = await requireAuth();
  await requirePermission(currentUser.role, "routes.view");

  try {
    let conditions = [eq(routes.tenantId, currentUser.tenantId)];

    if (filters?.status && filters.status !== "all") {
      conditions.push(eq(routes.status, filters.status));
    }

    if (filters?.direction && filters.direction !== "all") {
      conditions.push(eq(routes.direction, filters.direction));
    }

    if (filters?.search) {
      const pattern = `%${filters.search}%`;
      conditions.push(
        or(
          like(routes.code, pattern),
          like(routes.name, pattern),
          like(routes.origin, pattern),
          like(routes.destination, pattern),
        )!,
      );
    }

    const rawRoutes = await db
      .select()
      .from(routes)
      .where(and(...conditions))
      .orderBy(routes.code);

    // Load stops count for each route
    const routesWithStopsCount = await Promise.all(
      rawRoutes.map(async (r) => {
        const routeStops = await db
          .select()
          .from(stops)
          .where(
            and(
              eq(stops.routeId, r.id),
              eq(stops.tenantId, currentUser.tenantId),
            ),
          );
        return {
          ...r,
          stopsCount: routeStops.length,
        };
      }),
    );

    if (routesWithStopsCount.length > 0) {
      return routesWithStopsCount;
    }
    throw new Error("No database routes for tenant, using fallback dataset");
  } catch (err) {
    let result = FALLBACK_ROUTES.filter((r) => r.tenantId === currentUser.tenantId);
    if (filters?.status && filters.status !== "all") {
      result = result.filter((r) => r.status === filters.status);
    }
    if (filters?.direction && filters.direction !== "all") {
      result = result.filter((r) => r.direction === filters.direction);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (r) =>
          r.code.toLowerCase().includes(q) ||
          r.name.toLowerCase().includes(q) ||
          r.origin.toLowerCase().includes(q) ||
          r.destination.toLowerCase().includes(q),
      );
    }
    return result as any;
  }
}

export async function getRouteImpl(id: string) {
  const currentUser = await requireAuth();
  await requirePermission(currentUser.role, "routes.view");

  try {
    const route = await db.query.routes.findFirst({
      where: and(eq(routes.id, id), eq(routes.tenantId, currentUser.tenantId)),
    });

    if (route) {
      const routeStops = await db
        .select()
        .from(stops)
        .where(
          and(eq(stops.routeId, id), eq(stops.tenantId, currentUser.tenantId)),
        )
        .orderBy(asc(stops.sequence));

      return {
        ...route,
        stops: routeStops,
      };
    }
  } catch (err) {}

  const fallback = FALLBACK_ROUTES.find((r) => r.id === id && r.tenantId === currentUser.tenantId);
  if (!fallback) {
    throw new Error("Route not found");
  }
  const fallbackStops = FALLBACK_STOPS.filter((s) => s.routeId === id && s.tenantId === currentUser.tenantId);
  return {
    ...fallback,
    stops: fallbackStops,
  } as any;
}

export async function createRouteImpl(data: {
  code: string;
  name: string;
  origin: string;
  destination: string;
  lengthKm: string;
  durationMin: number;
  direction?: string;
  color?: string;
  status?: string;
  peakFrequency?: number;
  offPeakFrequency?: number;
  geometryGeojson?: any;
}) {
  const currentUser = await requireAuth();
  await requirePermission(currentUser.role, "routes.manage");

  if (!data.code) throw new Error("Route code is required");
  if (!data.name) throw new Error("Route name is required");

  // Validate code uniqueness within tenant
  const existing = await db.query.routes.findFirst({
    where: and(
      eq(routes.code, data.code),
      eq(routes.tenantId, currentUser.tenantId),
    ),
  });
  if (existing) {
    throw new Error(
      `Route code ${data.code} already exists in this organization.`,
    );
  }

  const [newRoute] = await db
    .insert(routes)
    .values({
      tenantId: currentUser.tenantId,
      code: data.code,
      name: data.name,
      origin: data.origin || "",
      destination: data.destination || "",
      lengthKm: data.lengthKm || "0.00",
      durationMin: data.durationMin || 0,
      direction: data.direction || "UP",
      color: data.color || "#3B82F6",
      status: data.status || "draft",
      peakFrequency: data.peakFrequency,
      offPeakFrequency: data.offPeakFrequency,
      geometryGeojson: data.geometryGeojson || null,
    })
    .returning();

  // Audit log
  await db.insert(auditLogs).values({
    tenantId: currentUser.tenantId,
    userId: currentUser.id,
    email: currentUser.email,
    action: "ROUTE_CREATED",
    details: `Created route: ${newRoute!.code} (${newRoute!.name})`,
  });

  return newRoute;
}

export async function updateRouteImpl(
  id: string,
  data: {
    code: string;
    name: string;
    origin: string;
    destination: string;
    lengthKm: string;
    durationMin: number;
    direction?: string;
    color?: string;
    status?: string;
    peakFrequency?: number;
    offPeakFrequency?: number;
    geometryGeojson?: any;
    stops?: Array<{
      id?: string;
      name: string;
      sequence: number;
      latitude?: string;
      longitude?: string;
    }>;
  },
) {
  const currentUser = await requireAuth();
  await requirePermission(currentUser.role, "routes.manage");

  let route = await db.query.routes.findFirst({
    where: and(eq(routes.id, id), eq(routes.tenantId, currentUser.tenantId)),
  }).catch(() => null);

  const fallbackIdx = FALLBACK_ROUTES.findIndex(
    (r) => r.id === id && r.tenantId === currentUser.tenantId,
  );

  if (!route && fallbackIdx === -1) {
    throw new Error("Route not found");
  }

  // Update in DB if present
  let updatedRoute: any = null;
  if (route) {
    if (data.code !== route.code) {
      const existing = await db.query.routes.findFirst({
        where: and(
          eq(routes.code, data.code),
          eq(routes.tenantId, currentUser.tenantId),
        ),
      });
      if (existing && existing.id !== id) {
        throw new Error(`Route code ${data.code} already exists.`);
      }
    }

    const [dbResult] = await db
      .update(routes)
      .set({
        code: data.code,
        name: data.name,
        origin: data.origin,
        destination: data.destination,
        lengthKm: data.lengthKm,
        durationMin: data.durationMin,
        direction: data.direction,
        color: data.color,
        status: data.status,
        peakFrequency: data.peakFrequency,
        offPeakFrequency: data.offPeakFrequency,
        geometryGeojson: data.geometryGeojson,
        updatedAt: new Date(),
      })
      .where(and(eq(routes.id, id), eq(routes.tenantId, currentUser.tenantId)))
      .returning();
    updatedRoute = dbResult;

    // Synchronize stops in DB if provided
    if (data.stops && Array.isArray(data.stops)) {
      try {
        await db
          .delete(stops)
          .where(and(eq(stops.routeId, id), eq(stops.tenantId, currentUser.tenantId)));

        for (const st of data.stops) {
          await db.insert(stops).values({
            tenantId: currentUser.tenantId,
            routeId: id,
            name: st.name.trim(),
            sequence: st.sequence,
            latitude: String(st.latitude || "13.0827"),
            longitude: String(st.longitude || "80.2707"),
          });
        }
      } catch (stopSyncErr) {
        console.warn("Failed to sync route stops in database:", stopSyncErr);
      }
    }
  }

  // Synchronize in fallback dataset as well
  if (fallbackIdx !== -1) {
    const existingFallback = FALLBACK_ROUTES[fallbackIdx]!;
    FALLBACK_ROUTES[fallbackIdx] = {
      ...existingFallback,
      code: data.code,
      name: data.name,
      origin: data.origin,
      destination: data.destination,
      lengthKm: data.lengthKm,
      distanceKm: data.lengthKm,
      durationMin: data.durationMin,
      runtimeMinutes: data.durationMin,
      direction: data.direction || existingFallback.direction,
      color: data.color || existingFallback.color,
      status: data.status || existingFallback.status,
      peakFrequency: data.peakFrequency ?? existingFallback.peakFrequency,
      offPeakFrequency: data.offPeakFrequency ?? existingFallback.offPeakFrequency,
      stopsCount: data.stops ? data.stops.length : existingFallback.stopsCount,
      updatedAt: new Date().toISOString(),
    };

    if (data.stops && Array.isArray(data.stops)) {
      // Remove old stops for this route from FALLBACK_STOPS
      for (let i = FALLBACK_STOPS.length - 1; i >= 0; i--) {
        if (FALLBACK_STOPS[i]!.routeId === id && FALLBACK_STOPS[i]!.tenantId === currentUser.tenantId) {
          FALLBACK_STOPS.splice(i, 1);
        }
      }
      // Add new stops to FALLBACK_STOPS
      data.stops.forEach((st) => {
        FALLBACK_STOPS.push({
          id: st.id && !st.id.startsWith("pending-") ? st.id : `stop-${id}-${st.sequence}`,
          tenantId: currentUser.tenantId,
          routeId: id,
          name: st.name.trim(),
          code: st.name.trim(),
          sequence: st.sequence,
          sequenceOrder: st.sequence,
          latitude: String(st.latitude || "13.0827"),
          longitude: String(st.longitude || "80.2707"),
          isTimepoint: true,
        });
      });
    }

    if (!updatedRoute) {
      updatedRoute = FALLBACK_ROUTES[fallbackIdx];
    }
  }

  // Audit log
  try {
    await db.insert(auditLogs).values({
      tenantId: currentUser.tenantId,
      userId: currentUser.id,
      email: currentUser.email,
      action: "ROUTE_UPDATED",
      details: `Updated route: ${data.code} (${data.name}) with ${data.stops?.length ?? 0} stops`,
    });
  } catch {}

  return updatedRoute;
}

export async function updateRouteStatusImpl(id: string, status: string) {
  const currentUser = await requireAuth();
  await requirePermission(currentUser.role, "routes.manage");

  const route = await db.query.routes.findFirst({
    where: and(eq(routes.id, id), eq(routes.tenantId, currentUser.tenantId)),
  });
  if (!route) throw new Error("Route not found");

  const [updated] = await db
    .update(routes)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(routes.id, id), eq(routes.tenantId, currentUser.tenantId)))
    .returning();

  // Audit log
  await db.insert(auditLogs).values({
    tenantId: currentUser.tenantId,
    userId: currentUser.id,
    email: currentUser.email,
    action: status === "archived" ? "ROUTE_ARCHIVED" : "ROUTE_STATUS_CHANGED",
    details: `Changed status of route ${route.code} from ${route.status} to ${status}`,
  });

  return updated;
}

export async function deleteRouteImpl(id: string) {
  const currentUser = await requireAuth();
  await requirePermission(currentUser.role, "routes.manage");

  let routeName = id;
  let foundInDb = false;

  try {
    const route = await db.query.routes.findFirst({
      where: and(eq(routes.id, id), eq(routes.tenantId, currentUser.tenantId)),
    });

    if (route) {
      foundInDb = true;
      routeName = `${route.code} (${route.name})`;

      // Delete linked stops and trips to satisfy foreign keys
      await db
        .delete(stops)
        .where(and(eq(stops.routeId, id), eq(stops.tenantId, currentUser.tenantId)));

      await db
        .delete(trips)
        .where(and(eq(trips.routeId, id), eq(trips.tenantId, currentUser.tenantId)));

      await db
        .delete(routes)
        .where(and(eq(routes.id, id), eq(routes.tenantId, currentUser.tenantId)));
    }
  } catch (err) {
    void err;
  }

  // Also remove from fallback and static datasets
  const fbIdx = FALLBACK_ROUTES.findIndex(
    (r) => (r.id === id || r.code === id) && (r.tenantId === currentUser.tenantId || !r.tenantId),
  );
  if (fbIdx !== -1) {
    routeName = `${FALLBACK_ROUTES[fbIdx]!.code} (${FALLBACK_ROUTES[fbIdx]!.name})`;
    FALLBACK_ROUTES.splice(fbIdx, 1);
  }

  const chnIdx = CHENNAI_MTC_ROUTES.findIndex(
    (r) => r.id === id || r.code === id,
  );
  if (chnIdx !== -1) {
    routeName = `${CHENNAI_MTC_ROUTES[chnIdx]!.code} (${CHENNAI_MTC_ROUTES[chnIdx]!.name})`;
    CHENNAI_MTC_ROUTES.splice(chnIdx, 1);
  }

  // Audit log
  try {
    await db.insert(auditLogs).values({
      tenantId: currentUser.tenantId,
      userId: currentUser.id,
      email: currentUser.email,
      action: "ROUTE_ARCHIVED",
      details: `Deleted route: ${routeName}`,
    });
  } catch (e) {
    void e;
  }

  return { success: true };
}

// ----------------------------------------------------
// Stop Implementations
// ----------------------------------------------------

export async function getRouteStopsImpl(routeId: string) {
  const currentUser = await requireAuth();
  await requirePermission(currentUser.role, "routes.view");

  try {
    return await db
      .select()
      .from(stops)
      .where(
        and(
          eq(stops.routeId, routeId),
          eq(stops.tenantId, currentUser.tenantId),
        ),
      )
      .orderBy(asc(stops.sequence));
  } catch (err) {
    const fallback = FALLBACK_STOPS.filter((s) => s.routeId === routeId).sort(
      (a, b) => a.sequenceOrder - b.sequenceOrder,
    );
    return fallback.map((s) => ({
      id: s.id,
      tenantId: s.tenantId,
      routeId: s.routeId,
      name: s.name,
      code: s.code,
      sequence: s.sequenceOrder,
      latitude: s.latitude,
      longitude: s.longitude,
      isTimepoint: s.isTimepoint,
      cumulativeDistanceKm: s.cumulativeDistanceKm,
      cumulativeTimeMinutes: s.cumulativeTimeMinutes,
    })) as unknown as (typeof stops.$inferSelect)[];
  }
}

export async function getAllStopsImpl() {
  const currentUser = await requireAuth();
  await requirePermission(currentUser.role, "routes.view");

  try {
    const dbStops = await db
      .select()
      .from(stops)
      .where(eq(stops.tenantId, currentUser.tenantId))
      .orderBy(asc(stops.sequence));
    if (dbStops.length > 0) return dbStops;
    throw new Error("No database stops for tenant, using fallback dataset");
  } catch (err) {
    return FALLBACK_STOPS.filter((s) => s.tenantId === currentUser.tenantId).map((s) => ({
      id: s.id,
      tenantId: s.tenantId,
      routeId: s.routeId,
      name: s.name,
      code: s.code || s.name,
      sequence: s.sequenceOrder || s.sequence || 1,
      latitude: s.latitude,
      longitude: s.longitude,
      isTimepoint: s.isTimepoint ?? true,
      cumulativeDistanceKm: s.cumulativeDistanceKm,
      cumulativeTimeMinutes: s.cumulativeTimeMinutes,
    })) as unknown as (typeof stops.$inferSelect)[];
  }
}

export async function createStopImpl(data: {
  routeId: string;
  name: string;
  sequence: number;
  latitude: string;
  longitude: string;
}) {
  const currentUser = await requireAuth();
  await requirePermission(currentUser.role, "routes.manage");

  if (!data.name) throw new Error("Stop name is required");

  const latNum = Number(data.latitude);
  const lngNum = Number(data.longitude);
  if (isNaN(latNum) || latNum < -90 || latNum > 90)
    throw new Error("Latitude must be between -90 and 90");
  if (isNaN(lngNum) || lngNum < -180 || lngNum > 180)
    throw new Error("Longitude must be between -180 and 180");
  if (!data.sequence || data.sequence <= 0)
    throw new Error("Sequence must be a positive integer");

  // Check for duplicate sequence and reorder if needed to make space
  const existingStops = await db
    .select()
    .from(stops)
    .where(
      and(
        eq(stops.routeId, data.routeId),
        eq(stops.tenantId, currentUser.tenantId),
      ),
    )
    .orderBy(asc(stops.sequence));

  const duplicate = existingStops.find((s) => s.sequence === data.sequence);

  if (duplicate) {
    // Shift up all sequences at or after the duplicate sequence
    for (const stop of existingStops) {
      if (stop.sequence >= data.sequence) {
        await db
          .update(stops)
          .set({ sequence: stop.sequence + 1 })
          .where(eq(stops.id, stop.id));
      }
    }
  }

  let newStop: any = null;
  try {
    const [dbResult] = await db
      .insert(stops)
      .values({
        tenantId: currentUser.tenantId,
        routeId: data.routeId,
        name: data.name,
        sequence: data.sequence,
        latitude: data.latitude,
        longitude: data.longitude,
      })
      .returning();
    newStop = dbResult;
  } catch (err) {
    newStop = {
      id: `stop-${data.routeId}-${data.sequence}-${Date.now()}`,
      tenantId: currentUser.tenantId,
      routeId: data.routeId,
      name: data.name,
      code: data.name,
      sequence: data.sequence,
      sequenceOrder: data.sequence,
      latitude: data.latitude,
      longitude: data.longitude,
      isTimepoint: true,
    };
  }

  FALLBACK_STOPS.push({
    id: newStop.id,
    tenantId: currentUser.tenantId,
    routeId: data.routeId,
    name: data.name,
    code: data.name,
    sequence: data.sequence,
    sequenceOrder: data.sequence,
    latitude: data.latitude,
    longitude: data.longitude,
    isTimepoint: true,
  });

  // Audit log
  try {
    await db.insert(auditLogs).values({
      tenantId: currentUser.tenantId,
      userId: currentUser.id,
      email: currentUser.email,
      action: "STOP_CREATED",
      details: `Added stop ${data.name} to route ID ${data.routeId} at sequence ${data.sequence}`,
    });
  } catch {}

  return newStop;
}

export async function updateStopImpl(
  id: string,
  data: {
    name: string;
    sequence: number;
    latitude: string;
    longitude: string;
  },
) {
  const currentUser = await requireAuth();
  await requirePermission(currentUser.role, "routes.manage");

  if (!data.name) throw new Error("Stop name is required");
  const latNum = Number(data.latitude);
  const lngNum = Number(data.longitude);
  if (isNaN(latNum) || latNum < -90 || latNum > 90)
    throw new Error("Latitude must be between -90 and 90");
  if (isNaN(lngNum) || lngNum < -180 || lngNum > 180)
    throw new Error("Longitude must be between -180 and 180");

  let stopRecord = await db.query.stops.findFirst({
    where: and(eq(stops.id, id), eq(stops.tenantId, currentUser.tenantId)),
  }).catch(() => null);

  const fallbackIdx = FALLBACK_STOPS.findIndex(
    (s) => s.id === id && s.tenantId === currentUser.tenantId,
  );

  if (!stopRecord && fallbackIdx === -1) {
    throw new Error("Stop not found");
  }

  const oldName = stopRecord ? stopRecord.name : FALLBACK_STOPS[fallbackIdx]!.name;
  const newName = data.name.trim();

  let updatedStop: any = null;

  if (stopRecord) {
    const [dbResult] = await db
      .update(stops)
      .set({
        name: newName,
        sequence: data.sequence,
        latitude: data.latitude,
        longitude: data.longitude,
      })
      .where(and(eq(stops.id, id), eq(stops.tenantId, currentUser.tenantId)))
      .returning();
    updatedStop = dbResult;
  }

  // Update in fallback data
  if (fallbackIdx !== -1) {
    FALLBACK_STOPS[fallbackIdx] = {
      ...FALLBACK_STOPS[fallbackIdx]!,
      name: newName,
      code: newName,
      sequence: data.sequence,
      sequenceOrder: data.sequence,
      latitude: data.latitude,
      longitude: data.longitude,
    };
    if (!updatedStop) {
      updatedStop = FALLBACK_STOPS[fallbackIdx];
    }
  }

  if (oldName !== newName) {
    // Propagate in DB
    try {
      await db
        .update(stops)
        .set({ name: newName })
        .where(
          and(
            eq(stops.tenantId, currentUser.tenantId),
            eq(stops.name, oldName),
          ),
        );

      await db
        .update(routes)
        .set({ origin: newName })
        .where(
          and(
            eq(routes.tenantId, currentUser.tenantId),
            eq(routes.origin, oldName),
          ),
        );

      await db
        .update(routes)
        .set({ destination: newName })
        .where(
          and(
            eq(routes.tenantId, currentUser.tenantId),
            eq(routes.destination, oldName),
          ),
        );

      await db
        .update(trips)
        .set({ origin: newName })
        .where(
          and(
            eq(trips.tenantId, currentUser.tenantId),
            eq(trips.origin, oldName),
          ),
        );

      await db
        .update(trips)
        .set({ destination: newName })
        .where(
          and(
            eq(trips.tenantId, currentUser.tenantId),
            eq(trips.destination, oldName),
          ),
        );
    } catch (propagationErr) {
      console.warn("Failed to propagate stop rename across related tables:", propagationErr);
    }

    // Propagate in fallback datasets
    FALLBACK_STOPS.forEach((s) => {
      if (s.tenantId === currentUser.tenantId && s.name === oldName) {
        s.name = newName;
      }
    });
    FALLBACK_ROUTES.forEach((r) => {
      if (r.tenantId === currentUser.tenantId) {
        if (r.origin === oldName) r.origin = newName;
        if (r.destination === oldName) r.destination = newName;
      }
    });
  }

  // Audit log
  try {
    await db.insert(auditLogs).values({
      tenantId: currentUser.tenantId,
      userId: currentUser.id,
      email: currentUser.email,
      action: "STOP_UPDATED",
      details: `Updated stop ${data.name} (renamed from ${oldName})`,
    });
  } catch {}

  return updatedStop;
}

export async function deleteStopImpl(id: string) {
  const currentUser = await requireAuth();
  await requirePermission(currentUser.role, "routes.manage");

  let stopRecord = await db.query.stops.findFirst({
    where: and(eq(stops.id, id), eq(stops.tenantId, currentUser.tenantId)),
  }).catch(() => null);

  const fallbackIdx = FALLBACK_STOPS.findIndex(
    (s) => s.id === id && s.tenantId === currentUser.tenantId,
  );

  if (!stopRecord && fallbackIdx === -1) {
    throw new Error("Stop not found");
  }

  if (stopRecord) {
    await db
      .delete(stops)
      .where(and(eq(stops.id, id), eq(stops.tenantId, currentUser.tenantId)));

    // Renumber remaining stops sequence sequentially
    const remainingStops = await db
      .select()
      .from(stops)
      .where(
        and(
          eq(stops.routeId, stopRecord.routeId),
          eq(stops.tenantId, currentUser.tenantId),
        ),
      )
      .orderBy(asc(stops.sequence));

    let index = 1;
    for (const s of remainingStops) {
      await db.update(stops).set({ sequence: index }).where(eq(stops.id, s.id));
      index++;
    }
  }

  if (fallbackIdx !== -1) {
    FALLBACK_STOPS.splice(fallbackIdx, 1);
  }

  // Audit log
  try {
    await db.insert(auditLogs).values({
      tenantId: currentUser.tenantId,
      userId: currentUser.id,
      email: currentUser.email,
      action: "STOP_DELETED",
      details: `Deleted stop ID ${id}`,
    });
  } catch {}

  return { success: true };
}

export async function reorderStopsImpl(routeId: string, stopIds: string[]) {
  const currentUser = await requireAuth();
  await requirePermission(currentUser.role, "routes.manage");

  let index = 1;
  for (const stopId of stopIds) {
    await db
      .update(stops)
      .set({ sequence: index })
      .where(
        and(
          eq(stops.id, stopId),
          eq(stops.routeId, routeId),
          eq(stops.tenantId, currentUser.tenantId),
        ),
      );
    index++;
  }

  // Audit log
  await db.insert(auditLogs).values({
    tenantId: currentUser.tenantId,
    userId: currentUser.id,
    email: currentUser.email,
    action: "STOP_REORDERED",
    details: `Reordered stop sequence parameters for route ID ${routeId}`,
  });

  return { success: true };
}

// ----------------------------------------------------
// Route Overlap Calculation
// ----------------------------------------------------

export interface OverlapResult {
  routeId: string;
  routeCode: string;
  routeName: string;
  overlapDistanceKm: number;
  overlapPercentage: number;
  severity: "LOW" | "MEDIUM" | "HIGH";
  overlapCoordinates: [number, number][]; // coordinates that overlap
}

export async function analyzeRouteOverlapImpl(proposedGeojson: any) {
  const currentUser = await requireAuth();
  await requirePermission(currentUser.role, "routes.view");

  if (
    !proposedGeojson ||
    proposedGeojson.type !== "LineString" ||
    !proposedGeojson.coordinates
  ) {
    return [];
  }

  const proposedCoords: [number, number][] = proposedGeojson.coordinates;
  if (proposedCoords.length < 2) return [];

  // Spatially interpolate proposed route at ~80m spacing
  const proposedPoints = interpolateLineString(proposedCoords);
  if (proposedPoints.length === 0) return [];

  // Calculate approximate proposed route total distance
  let proposedTotalDist = 0;
  for (let i = 0; i < proposedCoords.length - 1; i++) {
    proposedTotalDist += getDistanceMeters(
      proposedCoords[i]![1],
      proposedCoords[i]![0],
      proposedCoords[i + 1]![1],
      proposedCoords[i + 1]![0],
    );
  }
  const proposedTotalDistKm = proposedTotalDist / 1000;

  // Retrieve active/draft routes for this tenant
  const activeRoutes = await db
    .select()
    .from(routes)
    .where(
      and(
        eq(routes.tenantId, currentUser.tenantId),
        or(eq(routes.status, "active"), eq(routes.status, "draft"))!,
      ),
    );

  const overlapThresholdMeters = 50; // Tolerance is 50 meters
  const results: OverlapResult[] = [];

  for (const r of activeRoutes) {
    const geo = r.geometryGeojson as any;
    if (!geo || geo.type !== "LineString" || !geo.coordinates) {
      continue;
    }

    const existingCoords: [number, number][] = geo.coordinates;
    const existingPoints = interpolateLineString(existingCoords);
    if (existingPoints.length === 0) continue;

    // Count how many proposed points are within 50m of any existing point
    let overlappingPointsCount = 0;
    const overlappingCoords: [number, number][] = [];

    for (const p of proposedPoints) {
      let isOverlapping = false;
      for (const e of existingPoints) {
        if (
          getDistanceMeters(p[1], p[0], e[1], e[0]) <= overlapThresholdMeters
        ) {
          isOverlapping = true;
          break;
        }
      }
      if (isOverlapping) {
        overlappingPointsCount++;
        overlappingCoords.push(p);
      }
    }

    if (overlappingPointsCount > 0) {
      const overlapPercentage = overlappingPointsCount / proposedPoints.length;
      const overlapDistanceKm = overlapPercentage * proposedTotalDistKm;

      let severity: "LOW" | "MEDIUM" | "HIGH" = "LOW";
      if (overlapPercentage > 0.4) {
        severity = "HIGH";
      } else if (overlapPercentage > 0.1) {
        severity = "MEDIUM";
      }

      results.push({
        routeId: r.id,
        routeCode: r.code,
        routeName: r.name,
        overlapDistanceKm: parseFloat(overlapDistanceKm.toFixed(2)),
        overlapPercentage: parseFloat((overlapPercentage * 100).toFixed(0)),
        severity,
        overlapCoordinates: overlappingCoords,
      });
    }
  }

  // Audit log overlap analyzed
  await db.insert(auditLogs).values({
    tenantId: currentUser.tenantId,
    userId: currentUser.id,
    email: currentUser.email,
    action: "ROUTE_OVERLAP_ANALYZED",
    details: `Analyzed route overlap: proposed route segment points checked against active networks`,
  });

  return results;
}
