# TransitOS Authentication & Multi-Tenancy Architecture

This document details the authentication mechanism, user session persistence, Role-Based Access Control (RBAC), and logical multi-tenant database isolation.

---

## 1. Authentication Architecture

TransitOS uses a secure, stateless **JWT Session Cookie** approach integrated directly into the **TanStack Start** server-side engine.

```
+------------+               POST /login                +-------------+
|            | ---------------------------------------> |             |
|            |                                          |   PostgreSQL|
|  Browser   | <--------------------------------------- |   Database  |
|            |          Set-Cookie: transitOS_session   +-------------+
+------------+
      |
      | Any Protected Route / API
      | Cookie: transitOS_session
      v
+---------------------------------------------------------------------+
| TanStack Router `beforeLoad` Middleware                              |
|   1. Parse HttpOnly cookie.                                         |
|   2. Verify JWT signature using `jsonwebtoken` & `SESSION_SECRET`.  |
|   3. Fetch user roles & tenant status from DB to ensure validity.   |
|   4. Restrict or permit route loading.                              |
+---------------------------------------------------------------------+
```

### Key Security Configurations
- **HttpOnly**: Session cookie is inaccessible to client-side JavaScript (`document.cookie` cannot read it), preventing cross-site scripting (XSS) session hijacking.
- **SameSite=Lax**: Cookie is sent on same-site requests and top-level cross-site navigations, protecting against cross-site request forgery (CSRF).
- **Secure**: In production environments, the cookie is marked `Secure`, requiring an encrypted HTTPS connection.
- **No plaintext passwords**: User passwords are saved as salted hashes utilizing the `bcryptjs` algorithm (`rounds: 10`).

---

## 2. Session Payload & Database Lookup

The token payload contains:
```json
{
  "userId": "uuid-value",
  "tenantId": "uuid-value",
  "role": "SCHEDULER",
  "email": "scheduler@salemtransport.demo",
  "name": "Suresh Scheduler"
}
```

On every authenticated server action or page transition:
1. The server function `getCurrentUser()` decodes and verifies the token.
2. It queries PostgreSQL:
   ```typescript
   const user = await db.query.users.findFirst({
     where: eq(users.id, session.userId),
     with: { tenant: true }
   });
   ```
3. It confirms that the user exists and their associated organization status is `"active"`.

---

## 3. Role-Based Access Control (RBAC)

TransitOS implements six distinct roles, each mapped to specific granular permissions:

```typescript
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  PLATFORM_ADMIN: [ /* Access to all features */ ],
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
    "fleet.view", "crew.view", "routes.view",
    "schedule.view", "schedule.generate", "schedule.modify", "schedule.publish",
    "reschedule.view", "reschedule.execute", "analytics.view"
  ],
  ROUTE_PLANNER: [
    "routes.view", "routes.manage", "fleet.view", "crew.view", "analytics.view"
  ],
  DEPOT_MANAGER: [
    "fleet.view", "crew.view", "schedule.view", "reschedule.view", "reschedule.execute"
  ],
  MANAGEMENT: [
    "schedule.view", "routes.view", "fleet.view", "crew.view", "analytics.view"
  ]
};
```

---

## 4. Multi-Tenant Database Isolation

Tenant isolation is strictly enforced **on the server**. We do not trust the client to declare their `tenantId`.

- When fetching data, the server function calls the `withTenant(table, tenantId)` helper.
- The `tenantId` is retrieved directly from the verified session payload of `getCurrentUser()`.
- If a client attempts to bypass the UI or query records by providing an arbitrary tenant ID, the query constraint automatically binds to their actual session `tenantId`:

```typescript
// Enforces that only Salem Transport Corporation records are returned
const busesList = await db
  .select()
  .from(buses)
  .where(withTenant(buses, currentUser.tenantId));
```

---

## 5. Audit Logging of Authentication Events

Audit logs are recorded in the `audit_logs` database table. Password attempts are **never** logged to protect credential leaks.

Logged Events:
- **`LOGIN_SUCCESS`**: Logged with user ID, tenant ID, and email.
- **`LOGIN_FAILURE`**: Logged with email and matching tenant/user context if resolved.
- **`LOGOUT`**: Logged with user ID, tenant ID, and email.
