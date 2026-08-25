import { createFileRoute, Outlet } from "@tanstack/react-router";
import { hasPermission } from "@/lib/auth-shared";

export const Route = createFileRoute("/analytics")({
  beforeLoad: ({ context }) => {
    if (!context.user || !hasPermission(context.user.role, "analytics.view")) {
      throw new Error("Forbidden");
    }
  },
  head: () => ({
    meta: [
      { title: "Analytics — TransitOS" },
      { name: "description", content: "Punctuality, utilisation and disruption analytics." },
      { property: "og:title", content: "Analytics — TransitOS" },
      { property: "og:description", content: "Punctuality, utilisation and disruption analytics." },
    ],
  }),
  component: () => <Outlet />,
});
