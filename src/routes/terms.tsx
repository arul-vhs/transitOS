import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Shield, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms and Conditions: TransitOS Platform" },
      {
        name: "description",
        content:
          "Enterprise master service agreement, licensing terms, and operational warranties for TransitOS.",
      },
      { property: "og:title", content: "Terms and Conditions: TransitOS Platform" },
      {
        property: "og:description",
        content:
          "Enterprise master service agreement, licensing terms, and operational warranties for TransitOS.",
      },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Top Header */}
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 sticky top-0 z-20">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link
            to="/landing"
            className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            <ArrowLeft className="size-4" />
            <span>Back to TransitOS</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-500">Document Rev: 2026.1</span>
            <Button asChild size="sm" variant="outline" className="h-8 text-xs rounded-md">
              <Link to="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="space-y-4 border-b border-slate-200 pb-8 dark:border-slate-800">
          <div className="inline-flex items-center gap-1.5 rounded border border-slate-300 bg-slate-100 px-2 py-0.5 text-xs font-mono font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <FileText className="size-3.5 text-slate-600 dark:text-slate-400" />
            <span>Enterprise Master Subscription Agreement</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            TransitOS Terms and Conditions
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Effective Date: January 1, 2026. By accessing TransitOS, the subscribing transit
            authority agrees to these terms.
          </p>
        </div>

        <div className="mt-8 space-y-10 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              1. Platform Subscription and License Grant
            </h2>
            <p>
              Subject to timely payment of subscription fees and compliance with this Agreement,
              TransitOS grants the Customer a non-exclusive, non-transferable, worldwide license to
              access and utilize the cloud-hosted TransitOS platform across authorized municipal bus
              depots, dispatch control rooms, and planning terminals.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              2. Authorized Roles and Account Responsibilities
            </h2>
            <p>Customer access is governed by role-based credentials. The Customer agrees that:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
              <li>
                Administrative credentials (Organization Admin) may only be assigned to authorized
                depot superintendents and designated IT officers.
              </li>
              <li>
                Each individual operator must possess distinct authentication credentials. Shared
                generic logins outside pre-approved training environments are prohibited.
              </li>
              <li>
                The Customer remains responsible for safeguarding access tokens and promptly
                disabling accounts of departed personnel.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              3. Operational Dispatcher Responsibility and Regulatory Disclaimer
            </h2>
            <p>
              TransitOS incorporates mathematical constraint optimization algorithms (including
              Google OR-Tools solvers) and automated disruption recovery recommendations. The
              Customer explicitly acknowledges:
            </p>
            <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200 space-y-2">
              <p className="font-semibold uppercase tracking-wider">
                Human-in-the-Loop Operational Mandate:
              </p>
              <p>
                Algorithmic duty pairings and incident recovery plans are computer-generated
                proposals. Final operational publication remains the strict responsibility of the
                Customer&apos;s licensed chief scheduler or depot manager. TransitOS provides
                decision-support tools but does not replace mandatory human safety verification or
                physical vehicle roadworthiness inspections.
              </p>
            </div>
            <p className="text-xs text-slate-500">
              The Customer retains legal responsibility for ensuring physical driver fitness,
              physical vehicle brake and tire compliance, and local route transit permits under the
              Motor Vehicle Act 1988 and municipal transport regulations.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              4. Data Ownership and Customer IP
            </h2>
            <p>
              The Customer retains full, unencumbered ownership of all operational data entered into
              the platform, including:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
              <li>
                Fleet registration records, vehicle telemetry, and bus stop GeoJSON coordinates.
              </li>
              <li>Driver duty histories, shift rosters, and conductor assignment tables.</li>
              <li>Official timetable schedules, headway plans, and historical incident logs.</li>
            </ul>
            <p>
              TransitOS receives only the limited right to process and store customer data to
              deliver the hosted services and provide system telemetry performance analytics.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              5. Service Level Agreement (SLA) and System Availability
            </h2>
            <p>
              TransitOS commits to a minimum system availability uptime of <strong>99.9%</strong>{" "}
              during each calendar month, excluding scheduled maintenance windows announced at least
              48 hours in advance. Scheduled maintenance is restricted to off-peak hours (01:00 to
              04:00 local depot time).
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              6. Limitation of Liability
            </h2>
            <p>
              To the maximum extent permitted by applicable law, neither party shall be liable for
              indirect, incidental, punitive, or consequential damages, including loss of passenger
              revenue, traffic fines, or third-party claims arising from delays. Total aggregate
              liability under any service order shall not exceed the subscription fees paid by the
              Customer during the twelve (12) months preceding the incident.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              7. Custom Domain and Network Connectivity
            </h2>
            <p>
              Enterprise tiers support custom domain bindings (e.g. transit.authority.gov). The
              Customer is responsible for maintaining ownership and DNS propagation of its
              designated custom domains and third-party telematics SIM/APN data connections.
            </p>
          </section>

          {/* Section 8 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              8. Governing Law and Dispute Resolution
            </h2>
            <p>
              This Agreement shall be governed by and construed in accordance with the laws of the
              jurisdiction specified in the applicable municipal procurement order. Any disputes
              arising out of or in connection with this agreement shall be settled through binding
              commercial arbitration.
            </p>
          </section>
        </div>

        {/* Bottom Nav */}
        <div className="mt-12 flex items-center justify-between border-t border-slate-200 pt-6 text-xs text-slate-500 dark:border-slate-800">
          <Link
            to="/privacy"
            className="font-semibold text-slate-800 hover:underline dark:text-slate-200"
          >
            View Privacy Policy →
          </Link>
          <Link
            to="/landing"
            className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
          >
            Return to Product Homepage
          </Link>
        </div>
      </main>
    </div>
  );
}
