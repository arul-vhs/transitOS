import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { b as useRouter, v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { f as require_jsx_runtime } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { t as Button } from "./button-BnVgmmWP.mjs";
import { r as loginFn } from "./auth-SlquhadG.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { B as LoaderCircle, Dt as ArrowLeft, L as Mail, _t as Bus, z as Lock } from "../_libs/lucide-react.mjs";
import { t as Label } from "./label-B3t-BMxc.mjs";
import { t as Input } from "./input-DHIRLsgR.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/login-B3sVsgzK.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function LoginPage() {
	const router = useRouter();
	const [email, setEmail] = (0, import_react.useState)("");
	const [password, setPassword] = (0, import_react.useState)("");
	const [rememberMe, setRememberMe] = (0, import_react.useState)(false);
	const [loading, setLoading] = (0, import_react.useState)(false);
	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!email || !password) {
			toast.error("Please enter email and password.");
			return;
		}
		setLoading(true);
		try {
			const res = await loginFn({ data: {
				email,
				password
			} });
			if (res.success) {
				toast.success(`Welcome back, ${res.user.name || "User"}!`);
				await router.invalidate();
				await router.navigate({ to: "/" });
			}
		} catch (err) {
			console.error(err);
			toast.error(err.message || "Invalid email or password.");
		} finally {
			setLoading(false);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8 bg-[radial-gradient(circle_at_top_right,var(--color-accent),transparent_45%)]",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-md space-y-8",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col items-center text-center",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/landing",
							className: "mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "size-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Back to TransitOS Overview" })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex size-12 items-center justify-center rounded-lg bg-primary text-primary-foreground",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bus, { className: "size-6 animate-pulse" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "mt-6 text-3xl font-extrabold tracking-tight text-foreground",
							children: "TransitOS"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1.5 text-sm text-muted-foreground",
							children: "Intelligent Transport Operations Platform"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "panel p-6 sm:p-8 bg-card",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						className: "space-y-6",
						onSubmit: handleSubmit,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										htmlFor: "email",
										children: "Email address"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "relative",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mail, { className: "absolute left-3 top-2.5 size-4 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											id: "email",
											name: "email",
											type: "email",
											autoComplete: "email",
											required: true,
											className: "pl-10",
											placeholder: "name@company.com",
											value: email,
											onChange: (e) => setEmail(e.target.value),
											disabled: loading
										})]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "password",
											children: "Password"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: () => toast.info("Contact system administrator to reset password."),
											className: "text-xs font-semibold text-primary hover:underline",
											children: "Forgot password?"
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "relative",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "absolute left-3 top-2.5 size-4 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											id: "password",
											name: "password",
											type: "password",
											autoComplete: "current-password",
											required: true,
											className: "pl-10",
											placeholder: "••••••••",
											value: password,
											onChange: (e) => setPassword(e.target.value),
											disabled: loading
										})]
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex items-center justify-between",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										id: "remember-me",
										name: "remember-me",
										type: "checkbox",
										className: "size-4 rounded border-gray-300 text-primary focus:ring-primary",
										checked: rememberMe,
										onChange: (e) => setRememberMe(e.target.checked),
										disabled: loading
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										htmlFor: "remember-me",
										className: "text-xs text-muted-foreground select-none cursor-pointer",
										children: "Remember my session"
									})]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "submit",
								className: "w-full",
								disabled: loading,
								children: loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "mr-2 size-4 animate-spin" }), "Signing in..."] }) : "Sign In"
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-6 pt-5 border-t border-border/60",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-center mb-3",
							children: "Quick Demo Logins (password: password123)"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid grid-cols-2 gap-2",
							children: [
								{
									label: "System Admin",
									email: "admin@salemtransport.demo"
								},
								{
									label: "Scheduler",
									email: "scheduler@salemtransport.demo"
								},
								{
									label: "Depot Manager",
									email: "depot@salemtransport.demo"
								},
								{
									label: "Route Planner",
									email: "planner@salemtransport.demo"
								}
							].map((account) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => {
									setEmail(account.email);
									setPassword("password123");
									toast.info(`Filled ${account.label} credentials`);
								},
								className: "rounded-lg border border-border/80 bg-background/50 hover:bg-muted/70 hover:border-primary/40 px-2.5 py-1.5 text-left text-xs transition-colors flex flex-col cursor-pointer",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-semibold text-foreground text-[11px]",
									children: account.label
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-mono text-[9px] text-muted-foreground truncate",
									children: account.email
								})]
							}, account.email))
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-center text-xs text-muted-foreground",
					children: "Demo Build · Local PostgreSQL Authentication"
				})
			]
		})
	});
}
//#endregion
export { LoginPage as component };
