import { createServerFn } from "@tanstack/react-start";

// Use dynamic variables to prevent static import-protection analysis on client builds
const AUTH_SERVER_PATH = "../server/auth";

export const loginFn = createServerFn("POST", async (credentials: { email: string; password?: string }) => {
  const { loginFnImpl } = await import(AUTH_SERVER_PATH);
  return await loginFnImpl(credentials);
});

export const logoutFn = createServerFn("POST", async () => {
  const { logoutFnImpl } = await import(AUTH_SERVER_PATH);
  return await logoutFnImpl();
});

export const getCurrentUserFn = createServerFn("GET", async () => {
  const { getCurrentUserFnImpl } = await import(AUTH_SERVER_PATH);
  return await getCurrentUserFnImpl();
});
