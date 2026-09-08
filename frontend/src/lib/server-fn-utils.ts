/**
 * Helper to normalize caller arguments into TanStack Start server function options.
 * TanStack Start requires server function payloads to be wrapped in `{ data: ... }`.
 * This helper allows callers to pass direct parameters (e.g. `getBus(id)`)
 * or options objects (e.g. `loginFn({ data: credentials })`), while cleanly
 * passing `undefined` when no argument is provided.
 */
export function toServerFnArgs<T>(arg?: T | { data: T }): { data: T } | undefined {
  if (arg === undefined) return undefined;
  if (typeof arg === "object" && arg !== null && "data" in arg && Object.keys(arg).length === 1) {
    return arg as { data: T };
  }
  return { data: arg as T };
}
