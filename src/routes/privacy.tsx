import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Shield, Lock, FileText, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy: TransitOS Platform" },
      {
        name: "description",
        content:
          "Privacy policy and data protection standards for TransitOS municipal transit management software.",
      },
      { property: "og:title", content: "Privacy Policy: TransitOS Platform" },
      {
        property: "og:description",
        content:
          "Privacy policy and data protection standards for TransitOS municipal transit management software.",
      },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
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
            <Shield className="size-3.5 text-slate-600 dark:text-slate-400" />
            <span>Legal and Regulatory Compliance</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            TransitOS Privacy Policy
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Effective Date: January 1, 2026. Applicable to all licensed transport corporations,
            municipal transit authorities, and authorized operator personnel.
          </p>
        </div>

        <div className="mt-8 space-y-10 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              1. Scope and Organizational Roles
            </h2>
            <p>
              TransitOS provides multi-tenant operations software designed for municipal transport
              undertakings, regional bus authorities, and licensed transit operators. Under relevant
              data protection regulations (including the Digital Personal Data Protection Act and
              General Data Protection Regulation):
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
              <li>
                <strong>The Customer (Transit Authority / Corporation)</strong> acts as the Data
                Controller with respect to all crew records, vehicle manifests, driver shift
                rosters, and passenger trajectory logs.
              </li>
              <li>
                <strong>TransitOS</strong> acts strictly as the Data Processor, maintaining isolated
                tenant databases and executing automated optimization algorithms on behalf of the
                customer.
              </li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              2. Data Categories Processed
            </h2>
            <p>TransitOS processes the following operational datasets:</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-md border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <h3 className="font-semibold text-slate-900 dark:text-white text-xs uppercase tracking-wide">
                  Operator and Crew Data
                </h3>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                  Full name, employee badge number, heavy passenger vehicle driving license details,
                  shift availability, and duty rest intervals for Motor Vehicle Act compliance.
                </p>
              </div>

              <div className="rounded-md border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <h3 className="font-semibold text-slate-900 dark:text-white text-xs uppercase tracking-wide">
                  Fleet Telematics and Geospatial Logs
                </h3>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                  Vehicle registration numbers, chassis identifiers, GPS coordinate streams, speed
                  telemetry, odometer readings, and depot maintenance status.
                </p>
              </div>

              <div className="rounded-md border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <h3 className="font-semibold text-slate-900 dark:text-white text-xs uppercase tracking-wide">
                  Route and Stop Geometry
                </h3>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                  GeoJSON corridor coordinates, bus stop lat/long identifiers, official timetable
                  departure timestamps, headway spacing, and disruption records.
                </p>
              </div>

              <div className="rounded-md border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <h3 className="font-semibold text-slate-900 dark:text-white text-xs uppercase tracking-wide">
                  Administrative Access Logs
                </h3>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                  Operator IP addresses, HTTP-only session tokens, user role assignments, password
                  hashes (Bcrypt/Argon2), and audit log timestamps for every schedule publish.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              3. Purpose of Processing
            </h2>
            <p>Data ingested into TransitOS is utilized solely for:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
              <li>Executing mathematical duty pairing via Mixed-Integer Linear Programming.</li>
              <li>
                Enforcing mandatory statutory rest ceilings under Motor Vehicle Act 1988 sections.
              </li>
              <li>Calculating real-time plan versus actual departure variances.</li>
              <li>
                Generating algorithmic disruption recovery recommendations during vehicle breakdown.
              </li>
              <li>
                Maintaining immutable audit trails for depot management and government compliance.
              </li>
            </ul>
            <p className="text-xs text-slate-500">
              TransitOS does not sell, broker, or monetize transit telemetry. Ingested operational
              data is never utilized for third-party commercial advertising.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              4. Multi-Tenant Boundary Isolation and Security Controls
            </h2>
            <p>Security and tenant isolation are enforced at the architectural foundation:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
              <li>
                <strong>Database Query Bounds:</strong> Every SQL statement is scoped with mandatory
                tenant foreign keys. Cross-tenant leakage is prevented programmatically.
              </li>
              <li>
                <strong>Encryption:</strong> All telemetry in transit is encrypted using TLS 1.3.
                Persistent database volumes utilize AES-256 block encryption.
              </li>
              <li>
                <strong>Authentication:</strong> Session credentials reside exclusively in secure,
                HTTP-only, SameSite cookies to protect against cross-site scripting (XSS).
              </li>
              <li>
                <strong>Role-Based Access:</strong> Access is segmented across Organization Admin,
                Chief Scheduler, Depot Manager, Route Planner, and Management roles.
              </li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              5. Data Retention and Deletion
            </h2>
            <p>
              Customer transit data is retained for the duration of the active service contract plus
              thirty (30) calendar days. Upon written contract termination or customer request,
              database tenant partitions and linked telemetry tables are permanently purged
              following verified multi-pass cryptographic erasure procedures.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              6. Legal and Compliance Inquiries
            </h2>
            <p>
              For data protection officer correspondence, data processing addendum (DPA) execution,
              or government audit queries, contact:
            </p>
            <div className="rounded-md border border-slate-200 bg-white p-4 font-mono text-xs text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
              TransitOS Legal &amp; Compliance Cell
              <br />
              Attn: Data Protection Officer
              <br />
              Email: legal@transitos.internal
              <br />
              Security Inquiries: security@transitos.internal
            </div>
          </section>
        </div>

        {/* Bottom Nav */}
        <div className="mt-12 flex items-center justify-between border-t border-slate-200 pt-6 text-xs text-slate-500 dark:border-slate-800">
          <Link
            to="/terms"
            className="font-semibold text-slate-800 hover:underline dark:text-slate-200"
          >
            View Terms and Conditions →
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
