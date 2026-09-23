export const ROLE_PERMISSIONS: Record<string, string[]> = {
  PLATFORM_ADMIN: [
    "organization.view", "organization.manage",
    "users.view", "users.manage",
    "fleet.view", "fleet.manage",
    "crew.view", "crew.manage",
    "routes.view", "routes.manage",
    "schedule.view", "schedule.generate", "schedule.modify", "schedule.publish",
    "reschedule.view", "reschedule.execute", "reschedule.approve",
    "analytics.view", "audit.view"
  ],
  ORGANIZATION_ADMIN: [
    "organization.view", "organization.manage",
    "users.view", "users.manage",
    "fleet.view", "fleet.manage",
    "crew.view", "crew.manage",
    "routes.view", "routes.manage",
    "schedule.view", "schedule.generate", "schedule.modify", "schedule.publish",
    "reschedule.view", "reschedule.execute", "reschedule.approve",
    "analytics.view", "audit.view"
  ],
  SCHEDULER: [
    "fleet.view", "fleet.manage",
    "crew.view",
    "routes.view", "routes.manage",
    "schedule.view", "schedule.generate", "schedule.modify", "schedule.publish",
    "reschedule.view", "reschedule.execute", "reschedule.approve",
    "analytics.view"
  ],
  ROUTE_PLANNER: [
    "routes.view", "routes.manage",
    "fleet.view", "crew.view",
    "schedule.view",
    "reschedule.view",
    "analytics.view"
  ],
  DEPOT_MANAGER: [
    "fleet.view", "fleet.manage",
    "crew.view", "crew.manage",
    "routes.view",
    "schedule.view",
    "reschedule.view", "reschedule.execute",
    "analytics.view"
  ],
  MANAGEMENT: [
    "schedule.view",
    "routes.view",
    "fleet.view",
    "crew.view",
    "analytics.view",
    "reschedule.view",
    "audit.view"
  ]
};

export function hasPermission(role: string, permission: string): boolean {
  if (role === "PLATFORM_ADMIN") return true;
  const permissions = ROLE_PERMISSIONS[role];
  return permissions ? permissions.includes(permission) : false;
}
