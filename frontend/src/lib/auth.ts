import { createServerFn } from "@tanstack/react-start";
import { toServerFnArgs } from "./server-fn-utils";

const _loginFn = createServerFn({ method: "POST" })
  .validator((credentials: { email: string; password?: string }) => credentials)
  .handler(async ({ data }) => {
    const { loginFnImpl } = await import("../server/auth");
    return await loginFnImpl(data);
  });

export const loginFn = async (
  credentials: { email: string; password?: string } | { data: { email: string; password?: string } }
) => {
  return await _loginFn(toServerFnArgs(credentials)!);
};

const _logoutFn = createServerFn({ method: "POST" }).handler(async () => {
  const { logoutFnImpl } = await import("../server/auth");
  return await logoutFnImpl();
});

export const logoutFn = async () => {
  return await _logoutFn();
};

const _getCurrentUserFn = createServerFn({ method: "GET" }).handler(async () => {
  const { getCurrentUserFnImpl } = await import("../server/auth");
  return await getCurrentUserFnImpl();
});

export const getCurrentUserFn = async () => {
  return await _getCurrentUserFn();
};
