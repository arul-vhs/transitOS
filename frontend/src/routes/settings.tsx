import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/app-shell";
import { hasPermission } from "@/lib/auth-shared";

export const Route = createFileRoute("/settings")({
  beforeLoad: ({ context }) => {
    if (!context.user || !hasPermission(context.user.role, "organization.view")) {
      throw new Error("Forbidden");
    }
  },
  head: () => ({
    meta: [
      { title: "Settings — TransitOS" },
      { name: "description", content: "Depot rules, constraint limits and user preferences." },
      { property: "og:title", content: "Settings — TransitOS" },
      { property: "og:description", content: "Depot rules, constraint limits and user preferences." },
    ],
  }),
  component: () => <ComingSoon title="Settings" subtitle="Depot rules, constraint limits and user preferences." />,
});
