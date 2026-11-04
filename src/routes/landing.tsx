import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/components/landing-page";
import { getCurrentUserFn } from "@/lib/auth";

export const Route = createFileRoute("/landing")({
  beforeLoad: async () => {
    try {
      const user = await getCurrentUserFn();
      return { user: user ?? undefined };
    } catch {
      return { user: undefined };
    }
  },
  head: () => ({
    meta: [
      {
        title:
          "TransitOS: Automated Bus Timetable & Crew Duty Scheduling System",
      },
      {
        name: "description",
        content:
          "Operations management platform for municipal transit networks: automated timetable solving, GIS corridor audits, crew duty compliance, and incident recovery.",
      },
      {
        property: "og:title",
        content:
          "TransitOS: Automated Bus Timetable & Crew Duty Scheduling System",
      },
      {
        property: "og:description",
        content:
          "Operations management platform for municipal transit networks: automated timetable solving, GIS corridor audits, crew duty compliance, and incident recovery.",
      },
    ],
  }),
  component: LandingRouteComponent,
});

function LandingRouteComponent() {
  const context = Route.useRouteContext();
  return <LandingPage currentUser={context?.user} />;
}
