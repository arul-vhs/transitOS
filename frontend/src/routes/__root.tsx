import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  redirect,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { getCurrentUserFn } from "../lib/auth";

import { Toaster } from "@/components/ui/sonner";
import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  const isForbidden = error?.message === "Forbidden" || error?.message?.includes("Forbidden");

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
          {isForbidden ? "403" : "500"}
        </h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">
          {isForbidden ? "Access Denied" : "This page didn't load"}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {isForbidden
            ? "You don't have permission to perform this action."
            : "Something went wrong on our end. You can try refreshing or head back home."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {!isForbidden ? (
            <button
              onClick={() => {
                router.invalidate();
                reset();
              }}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Try again
            </button>
          ) : null}
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export interface RouterContext {
  queryClient: QueryClient;
  user?: any;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: async ({ location }) => {
    // Skip protection checks for the login page to prevent redirect loops
    if (location.pathname === "/login") {
      return { user: undefined };
    }

    try {
      const user = await getCurrentUserFn();
      if (!user) {
        throw redirect({
          to: "/login",
          search: {
            redirect: location.href,
          },
        });
      }
      return { user };
    } catch (err: any) {
      // Re-throw redirect exceptions to let router navigate
      if (err?.message === "Redirect" || err?.status === 302 || err?.status === 307) {
        throw err;
      }
      throw redirect({
        to: "/login",
      });
    }
  },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "TransitOS Dashboard — Salem Transport Corporation" },
      {
        name: "description",
        content:
          "Operations overview for Salem City corridors: fleet, crew, routes and automated schedule generation.",
      },
      { name: "author", content: "TransitOS" },
      { property: "og:title", content: "TransitOS Dashboard — Salem Transport Corporation" },
      {
        property: "og:description",
        content: "Operations overview for Salem City corridors: fleet, crew, routes and automated schedule generation.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "TransitOS Dashboard — Salem Transport Corporation" },
      { name: "twitter:description", content: "Operations overview for Salem City corridors: fleet, crew, routes and automated schedule generation." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/d041b90887e7a711faa065e0fda47a56/id-preview-cd6ee54a--58367c15-2ef6-4ecd-a290-483f899f251d.lovable.app-1786603811558.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/d041b90887e7a711faa065e0fda47a56/id-preview-cd6ee54a--58367c15-2ef6-4ecd-a290-483f899f251d.lovable.app-1786603811558.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "icon", href: "/logo.svg", type: "image/svg+xml" },
      { rel: "manifest", href: "/site.webmanifest" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  );
}
