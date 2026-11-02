import { v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { f as require_jsx_runtime } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { t as Button } from "./button-BnVgmmWP.mjs";
import { Dt as ArrowLeft, Q as FileText } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/terms-UEv4qRyz.js
var import_jsx_runtime = require_jsx_runtime();
function TermsPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
			className: "border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 sticky top-0 z-20",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/landing",
					className: "flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Back to TransitOS" })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-xs font-mono text-slate-500",
						children: "Document Rev: 2026.1"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						asChild: true,
						size: "sm",
						variant: "outline",
						className: "h-8 text-xs rounded-md",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/login",
							children: "Sign In"
						})
					})]
				})]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
			className: "mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-4 border-b border-slate-200 pb-8 dark:border-slate-800",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "inline-flex items-center gap-1.5 rounded border border-slate-300 bg-slate-100 px-2 py-0.5 text-xs font-mono font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "size-3.5 text-slate-600 dark:text-slate-400" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Enterprise Master Subscription Agreement" })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white",
							children: "TransitOS Terms and Conditions"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-slate-600 dark:text-slate-400",
							children: "Effective Date: January 1, 2026. By accessing TransitOS, the subscribing transit authority agrees to these terms."
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-8 space-y-10 text-sm leading-relaxed text-slate-700 dark:text-slate-300",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "space-y-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-lg font-bold text-slate-900 dark:text-white",
								children: "1. Platform Subscription and License Grant"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Subject to timely payment of subscription fees and compliance with this Agreement, TransitOS grants the Customer a non-exclusive, non-transferable, worldwide license to access and utilize the cloud-hosted TransitOS platform across authorized municipal bus depots, dispatch control rooms, and planning terminals." })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "space-y-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "text-lg font-bold text-slate-900 dark:text-white",
									children: "2. Authorized Roles and Account Responsibilities"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Customer access is governed by role-based credentials. The Customer agrees that:" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
									className: "list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Administrative credentials (Organization Admin) may only be assigned to authorized depot superintendents and designated IT officers." }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Each individual operator must possess distinct authentication credentials. Shared generic logins outside pre-approved training environments are prohibited." }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "The Customer remains responsible for safeguarding access tokens and promptly disabling accounts of departed personnel." })
									]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "space-y-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "text-lg font-bold text-slate-900 dark:text-white",
									children: "3. Operational Dispatcher Responsibility and Regulatory Disclaimer"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "TransitOS incorporates mathematical constraint optimization algorithms (including Google OR-Tools solvers) and automated disruption recovery recommendations. The Customer explicitly acknowledges:" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "rounded-md border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200 space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-semibold uppercase tracking-wider",
										children: "Human-in-the-Loop Operational Mandate:"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Algorithmic duty pairings and incident recovery plans are computer-generated proposals. Final operational publication remains the strict responsibility of the Customer's licensed chief scheduler or depot manager. TransitOS provides decision-support tools but does not replace mandatory human safety verification or physical vehicle roadworthiness inspections." })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-slate-500",
									children: "The Customer retains legal responsibility for ensuring physical driver fitness, physical vehicle brake and tire compliance, and local route transit permits under the Motor Vehicle Act 1988 and municipal transport regulations."
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "space-y-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "text-lg font-bold text-slate-900 dark:text-white",
									children: "4. Data Ownership and Customer IP"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "The Customer retains full, unencumbered ownership of all operational data entered into the platform, including:" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
									className: "list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Fleet registration records, vehicle telemetry, and bus stop GeoJSON coordinates." }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Driver duty histories, shift rosters, and conductor assignment tables." }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Official timetable schedules, headway plans, and historical incident logs." })
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "TransitOS receives only the limited right to process and store customer data to deliver the hosted services and provide system telemetry performance analytics." })
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "space-y-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-lg font-bold text-slate-900 dark:text-white",
								children: "5. Service Level Agreement (SLA) and System Availability"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
								"TransitOS commits to a minimum system availability uptime of ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "99.9%" }),
								" ",
								"during each calendar month, excluding scheduled maintenance windows announced at least 48 hours in advance. Scheduled maintenance is restricted to off-peak hours (01:00 to 04:00 local depot time)."
							] })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "space-y-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-lg font-bold text-slate-900 dark:text-white",
								children: "6. Limitation of Liability"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "To the maximum extent permitted by applicable law, neither party shall be liable for indirect, incidental, punitive, or consequential damages, including loss of passenger revenue, traffic fines, or third-party claims arising from delays. Total aggregate liability under any service order shall not exceed the subscription fees paid by the Customer during the twelve (12) months preceding the incident." })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "space-y-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-lg font-bold text-slate-900 dark:text-white",
								children: "7. Custom Domain and Network Connectivity"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Enterprise tiers support custom domain bindings (e.g. transit.authority.gov). The Customer is responsible for maintaining ownership and DNS propagation of its designated custom domains and third-party telematics SIM/APN data connections." })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "space-y-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-lg font-bold text-slate-900 dark:text-white",
								children: "8. Governing Law and Dispute Resolution"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "This Agreement shall be governed by and construed in accordance with the laws of the jurisdiction specified in the applicable municipal procurement order. Any disputes arising out of or in connection with this agreement shall be settled through binding commercial arbitration." })]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-12 flex items-center justify-between border-t border-slate-200 pt-6 text-xs text-slate-500 dark:border-slate-800",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/privacy",
						className: "font-semibold text-slate-800 hover:underline dark:text-slate-200",
						children: "View Privacy Policy →"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/landing",
						className: "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300",
						children: "Return to Product Homepage"
					})]
				})
			]
		})]
	});
}
//#endregion
export { TermsPage as component };
