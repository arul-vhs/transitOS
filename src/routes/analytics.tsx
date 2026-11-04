import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { hasPermission } from "@/lib/auth-shared";

export const Route = createFileRoute("/analytics")({
  beforeLoad: ({ context }) => {
    if (!context.user) {
      throw redirect({ to: "/login" });
    }
  },
  head: () => ({
    meta: [
      { title: "Analytics: TransitOS" },
      {
        name: "description",
        content: "Punctuality, utilisation and disruption analytics.",
      },
      { property: "og:title", content: "Analytics: TransitOS" },
      {
        property: "og:description",
        content: "Punctuality, utilisation and disruption analytics.",
      },
    ],
  }),
  component: () => <Outlet />,
});
