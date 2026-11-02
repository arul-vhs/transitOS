import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { b as useRouter, d as useRouterState, v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { f as require_jsx_runtime, n as AvatarFallback$1, r as AvatarImage$1, t as Avatar$1 } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { n as cn, t as Button } from "./button-BnVgmmWP.mjs";
import { i as logoutFn } from "./auth-SlquhadG.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { C as Route, F as Map, P as Menu, R as LogOut, W as Lightbulb, Y as Gauge, _ as ShieldCheck, _t as Bus, at as CircleQuestionMark, c as TriangleAlert, gt as CalendarClock, i as Workflow, it as Circle, mt as ChartColumn, n as X, nt as Compass, o as Users, ot as CirclePlay, p as Sparkles, pt as Check, r as Wrench, s as UserCog, ut as ChevronRight, y as Settings, yt as BookOpen } from "../_libs/lucide-react.mjs";
import { a as DialogOverlay, c as DialogTrigger, i as DialogDescription, n as DialogClose, o as DialogPortal, r as DialogContent, s as DialogTitle, t as Dialog } from "../_libs/@radix-ui/react-dialog+[...].mjs";
import { a as Label2, c as Root2, d as SubTrigger2, f as Trigger, i as ItemIndicator2, l as Separator2, n as Content2, o as Portal2, r as Item2, s as RadioItem2, t as CheckboxItem2, u as SubContent2 } from "../_libs/@radix-ui/react-dropdown-menu+[...].mjs";
import { n as Route$27 } from "./router-9Rnl3R3s.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/app-shell-CxpRo8VR.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var Sheet = Dialog;
var SheetTrigger = DialogTrigger;
var SheetPortal = DialogPortal;
var SheetOverlay = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay, {
	className: cn("fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0", className),
	...props,
	ref
}));
SheetOverlay.displayName = DialogOverlay.displayName;
var sheetVariants = cva("fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500 data-[state=open]:animate-in data-[state=closed]:animate-out", {
	variants: { side: {
		top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
		bottom: "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
		left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
		right: "inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm"
	} },
	defaultVariants: { side: "right" }
});
var SheetContent = import_react.forwardRef(({ side = "right", className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetPortal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetOverlay, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
	ref,
	className: cn(sheetVariants({ side }), className),
	...props,
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogClose, {
		className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background cursor-pointer transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-4 w-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "sr-only",
			children: "Close"
		})]
	}), children]
})] }));
SheetContent.displayName = DialogContent.displayName;
var SheetHeader = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	className: cn("flex flex-col space-y-2 text-center sm:text-left", className),
	...props
});
SheetHeader.displayName = "SheetHeader";
var SheetFooter = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	className: cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className),
	...props
});
SheetFooter.displayName = "SheetFooter";
var SheetTitle = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
	ref,
	className: cn("text-lg font-semibold text-foreground", className),
	...props
}));
SheetTitle.displayName = DialogTitle.displayName;
var SheetDescription = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, {
	ref,
	className: cn("text-sm text-muted-foreground", className),
	...props
}));
SheetDescription.displayName = DialogDescription.displayName;
var badgeVariants = cva("inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", {
	variants: { variant: {
		default: "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
		secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
		destructive: "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
		outline: "text-foreground"
	} },
	defaultVariants: { variant: "default" }
});
function Badge({ className, variant, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn(badgeVariants({ variant }), className),
		...props
	});
}
var DropdownMenu = Root2;
var DropdownMenuTrigger = Trigger;
var DropdownMenuSubTrigger = import_react.forwardRef(({ className, inset, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SubTrigger2, {
	ref,
	className: cn("flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0", inset && "pl-8", className),
	...props,
	children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "ml-auto" })]
}));
DropdownMenuSubTrigger.displayName = SubTrigger2.displayName;
var DropdownMenuSubContent = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SubContent2, {
	ref,
	className: cn("z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-dropdown-menu-content-transform-origin)", className),
	...props
}));
DropdownMenuSubContent.displayName = SubContent2.displayName;
var DropdownMenuContent = import_react.forwardRef(({ className, sideOffset = 4, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Portal2, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Content2, {
	ref,
	sideOffset,
	className: cn("z-50 max-h-[var(--radix-dropdown-menu-content-available-height)] min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md", "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-dropdown-menu-content-transform-origin)", className),
	...props
}) }));
DropdownMenuContent.displayName = Content2.displayName;
var DropdownMenuItem = import_react.forwardRef(({ className, inset, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Item2, {
	ref,
	className: cn("relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0", inset && "pl-8", className),
	...props
}));
DropdownMenuItem.displayName = Item2.displayName;
var DropdownMenuCheckboxItem = import_react.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CheckboxItem2, {
	ref,
	className: cn("relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className),
	...props,
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ItemIndicator2, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-4 w-4" }) })
	}), children]
}));
DropdownMenuCheckboxItem.displayName = CheckboxItem2.displayName;
var DropdownMenuRadioItem = import_react.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(RadioItem2, {
	ref,
	className: cn("relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className),
	...props,
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ItemIndicator2, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Circle, { className: "h-2 w-2 fill-current" }) })
	}), children]
}));
DropdownMenuRadioItem.displayName = RadioItem2.displayName;
var DropdownMenuLabel = import_react.forwardRef(({ className, inset, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label2, {
	ref,
	className: cn("px-2 py-1.5 text-sm font-semibold", inset && "pl-8", className),
	...props
}));
DropdownMenuLabel.displayName = Label2.displayName;
var DropdownMenuSeparator = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Separator2, {
	ref,
	className: cn("-mx-1 my-1 h-px bg-muted", className),
	...props
}));
DropdownMenuSeparator.displayName = Separator2.displayName;
var DropdownMenuShortcut = ({ className, ...props }) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("ml-auto text-xs tracking-widest opacity-60", className),
		...props
	});
};
DropdownMenuShortcut.displayName = "DropdownMenuShortcut";
var Avatar = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Avatar$1, {
	ref,
	className: cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className),
	...props
}));
Avatar.displayName = Avatar$1.displayName;
var AvatarImage = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarImage$1, {
	ref,
	className: cn("aspect-square h-full w-full", className),
	...props
}));
AvatarImage.displayName = AvatarImage$1.displayName;
var AvatarFallback = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarFallback$1, {
	ref,
	className: cn("flex h-full w-full items-center justify-center rounded-full bg-muted", className),
	...props
}));
AvatarFallback.displayName = AvatarFallback$1.displayName;
var NAV = [
	{
		title: "Command Center",
		items: [
			{
				label: "Executive Dashboard",
				to: "/",
				icon: Gauge
			},
			{
				label: "Live Simulation Deck",
				to: "/simulation",
				icon: CirclePlay,
				badge: "Sim",
				badgeColor: "bg-indigo-500/20 text-indigo-500 border-indigo-500/30"
			},
			{
				label: "Product Overview",
				to: "/landing",
				icon: Compass,
				badge: "Tour",
				badgeColor: "bg-cyan-500/15 text-cyan-500 border-cyan-500/30"
			}
		]
	},
	{
		title: "Daily Operations",
		items: [
			{
				label: "Live Fleet Tracking",
				to: "/operations/today",
				icon: CalendarClock,
				badge: "Live",
				badgeColor: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30"
			},
			{
				label: "Timetable & Departures",
				to: "/operations/trips",
				icon: Route
			},
			{
				label: "Driver Shifts (Duties)",
				to: "/operations/duties",
				icon: CalendarClock
			},
			{
				label: "AI Auto-Scheduler",
				to: "/scheduling/optimizer",
				icon: Sparkles,
				badge: "AI",
				badgeColor: "bg-primary/20 text-primary border-primary/30"
			},
			{
				label: "Disruption Radar",
				to: "/operations/incidents",
				icon: TriangleAlert,
				badge: "Radar",
				badgeColor: "bg-destructive/15 text-destructive border-destructive/30"
			}
		]
	},
	{
		title: "Buses & Vehicles",
		items: [{
			label: "Bus Fleet & Health",
			to: "/fleet/buses",
			icon: Bus
		}, {
			label: "Maintenance Bays",
			to: "/fleet/maintenance",
			icon: Wrench
		}]
	},
	{
		title: "Drivers & Crew",
		items: [
			{
				label: "Drivers & Licenses",
				to: "/crew/drivers",
				icon: UserCog
			},
			{
				label: "Conductors",
				to: "/crew/conductors",
				icon: Users
			},
			{
				label: "Crew Availability",
				to: "/crew/availability",
				icon: CalendarClock
			}
		]
	},
	{
		title: "Routes & Stops",
		items: [{
			label: "Routes & Stops Map",
			to: "/network/routes",
			icon: Map
		}, {
			label: "Route Builder",
			to: "/network/planner",
			icon: Route
		}]
	},
	{
		title: "System Insights",
		items: [{
			label: "Analytics & Telemetry",
			to: "/analytics",
			icon: ChartColumn
		}, {
			label: "Settings & Access",
			to: "/settings",
			icon: Settings
		}]
	}
];
function isNavVisible(role, to) {
	if (!role || role === "PLATFORM_ADMIN" || role === "ORGANIZATION_ADMIN") return true;
	switch (to) {
		case "/":
		case "/simulation": return true;
		case "/operations/today":
		case "/operations/trips":
		case "/operations/duties":
		case "/scheduling/optimizer":
		case "/operations/incidents": return [
			"SCHEDULER",
			"DEPOT_MANAGER",
			"ROUTE_PLANNER",
			"MANAGEMENT"
		].includes(role);
		case "/fleet/buses": return [
			"SCHEDULER",
			"DEPOT_MANAGER",
			"ROUTE_PLANNER",
			"MANAGEMENT"
		].includes(role);
		case "/fleet/maintenance": return ["DEPOT_MANAGER", "SCHEDULER"].includes(role);
		case "/crew/drivers":
		case "/crew/conductors":
		case "/crew/availability": return [
			"SCHEDULER",
			"DEPOT_MANAGER",
			"ROUTE_PLANNER",
			"MANAGEMENT"
		].includes(role);
		case "/network/routes": return [
			"SCHEDULER",
			"ROUTE_PLANNER",
			"DEPOT_MANAGER",
			"MANAGEMENT"
		].includes(role);
		case "/network/planner": return [
			"ROUTE_PLANNER",
			"SCHEDULER",
			"DEPOT_MANAGER"
		].includes(role);
		case "/analytics": return [
			"SCHEDULER",
			"ROUTE_PLANNER",
			"MANAGEMENT",
			"DEPOT_MANAGER"
		].includes(role);
		case "/settings": return ["ORGANIZATION_ADMIN", "PLATFORM_ADMIN"].includes(role);
		default: return true;
	}
}
function SidebarContent({ onNavigate }) {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const user = Route$27.useRouteContext()?.user;
	const role = user?.role || "";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-full flex-col bg-sidebar text-sidebar-foreground select-none",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-3 border-b border-sidebar-border px-5 py-4.5 bg-sidebar/90 backdrop-blur-md",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative flex size-10 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bus, { className: "size-5.5 text-white" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "absolute -bottom-0.5 -right-0.5 flex size-2.5",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "relative inline-flex size-2 rounded-full bg-emerald-500" })
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0 flex-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-base font-extrabold tracking-tight text-sidebar-foreground",
							children: "TransitOS"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "rounded bg-slate-800 px-1.5 py-0.2 text-[9px] font-mono font-bold text-slate-300 uppercase border border-slate-700",
							children: "OPERATIONS"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11px] font-medium text-sidebar-foreground/60 truncate",
						title: user?.tenantName,
						children: user?.tenantName || "Salem Transport Corp."
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
				className: "flex-1 space-y-5 overflow-y-auto px-3 py-4",
				children: NAV.map((group, gi) => {
					const visibleItems = group.items.filter((item) => isNavVisible(role, item.to));
					if (visibleItems.length === 0) return null;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1",
						children: [group.title ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "px-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/45",
							children: group.title
						}) : null, visibleItems.map((item) => {
							const active = item.to === "/" ? pathname === "/" : pathname === item.to || pathname.startsWith(item.to + "/");
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: item.to,
								onClick: onNavigate,
								className: cn("group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-all duration-150", active ? "bg-sidebar-primary/15 text-sidebar-primary font-semibold shadow-xs" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"),
								children: [
									active ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-sidebar-primary" }) : null,
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(item.icon, { className: cn("size-4 shrink-0 transition-transform duration-150 group-hover:scale-110", active ? "text-sidebar-primary" : "text-sidebar-foreground/60") }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "truncate",
										children: item.label
									}),
									item.badge ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: cn("ml-auto rounded-full border px-1.5 py-0.2 text-[9px] font-bold font-mono tracking-tight", item.badgeColor || "bg-sidebar-accent text-sidebar-accent-foreground"),
										children: item.badge
									}) : active ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "ml-auto size-3.5 opacity-60" }) : null
								]
							}, item.to);
						})]
					}, group.title || gi);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "border-t border-sidebar-border p-3.5 bg-sidebar/50",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between rounded-lg bg-sidebar-accent/40 p-2 text-xs",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2 min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "relative flex size-2 shrink-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "relative inline-flex size-2 rounded-full bg-emerald-500" })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-mono text-[11px] font-medium text-sidebar-foreground/80 truncate",
							children: "Telemetry Online"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						variant: "outline",
						className: "border-sidebar-border bg-sidebar text-[10px] font-mono text-sidebar-foreground/70",
						children: "25 Aug"
					})]
				})
			})
		]
	});
}
function AppShell({ title, subtitle, actions, children }) {
	const [open, setOpen] = (0, import_react.useState)(false);
	const [helpOpen, setHelpOpen] = (0, import_react.useState)(false);
	const router = useRouter();
	const user = Route$27.useRouteContext()?.user;
	const handleLogout = async () => {
		try {
			await logoutFn();
			toast.success("Logged out successfully");
			await router.invalidate();
			await router.navigate({ to: "/login" });
		} catch (err) {
			console.error("Logout error", err);
			toast.error("Failed to log out");
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-background text-foreground",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("aside", {
			className: "fixed inset-y-0 left-0 hidden w-64 border-r border-sidebar-border shadow-xl shadow-black/5 lg:block z-30",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SidebarContent, {})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "lg:pl-64 flex flex-col min-h-screen",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
				className: "sticky top-0 z-20 border-b border-border/80 bg-background/85 backdrop-blur-md transition-all",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3 px-4 py-3.5 sm:px-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Sheet, {
							open,
							onOpenChange: setOpen,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetTrigger, {
								asChild: true,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									variant: "outline",
									size: "icon",
									className: "lg:hidden shrink-0",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "sr-only",
										children: "Open navigation"
									})]
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetContent, {
								side: "left",
								className: "w-64 border-0 p-0",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SidebarContent, { onNavigate: () => setOpen(false) })
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0 flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2.5",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
										className: "truncate text-lg font-bold tracking-tight sm:text-xl text-foreground",
										children: title
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										variant: "secondary",
										className: "hidden sm:inline-flex text-[10px] font-mono font-semibold uppercase tracking-wider bg-primary/10 text-primary border-primary/20",
										children: "Salem Central"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "hidden md:inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-1.5 rounded-full bg-emerald-500 animate-pulse" }), "24 Buses Active"]
									})
								]
							}), subtitle ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-0.5 text-xs text-muted-foreground truncate",
								children: subtitle
							}) : null]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex shrink-0 items-center gap-2.5",
							children: [
								actions ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex items-center gap-2",
									children: actions
								}) : null,
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									asChild: true,
									variant: "outline",
									size: "sm",
									className: "h-8 gap-1.5 border-indigo-500/30 text-indigo-600 dark:text-indigo-400 bg-indigo-500/5 hover:bg-indigo-500/15 hover:border-indigo-500/50 text-xs font-semibold cursor-pointer shadow-2xs",
									title: "Launch Live Simulation Deck",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
										to: "/simulation",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CirclePlay, { className: "size-3.5 text-indigo-500 animate-pulse" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "hidden sm:inline",
											children: "Simulator"
										})]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Sheet, {
									open: helpOpen,
									onOpenChange: setHelpOpen,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetTrigger, {
										asChild: true,
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											variant: "outline",
											size: "sm",
											className: "h-8 gap-1.5 border-primary/30 text-primary bg-primary/5 hover:bg-primary/10 hover:border-primary/50 text-xs font-semibold cursor-pointer shadow-2xs",
											title: "Open TransitOS Operations Guide & Glossary",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleQuestionMark, { className: "size-3.5 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "hidden md:inline",
												children: "Quick Guide"
											})]
										})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetContent, {
										side: "right",
										className: "w-full sm:max-w-lg overflow-y-auto p-6 space-y-6",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetHeader, {
												className: "text-left space-y-2 border-b border-border/70 pb-4",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center gap-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "grid size-8 place-items-center rounded-xl bg-primary/10 text-primary border border-primary/20",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookOpen, { className: "size-4" })
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetTitle, {
														className: "text-base font-bold text-foreground",
														children: "TransitOS Operations Guide"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetDescription, {
														className: "text-xs text-muted-foreground",
														children: "Understand how transit features connect and what every operational term means."
													})] })]
												})
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-3.5 space-y-2",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex items-center justify-between",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "flex items-center gap-2",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "flex size-2 rounded-full bg-blue-600" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "text-xs font-bold text-foreground",
																children: "Corridor Simulation Deck"
															})]
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
															className: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800 text-[10px] rounded",
															children: "Live Demo"
														})]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "text-xs text-muted-foreground leading-relaxed",
														children: "Inspect corridor operations in real time. Scrub through 24-hour schedules, test engine breakdown scenarios, and inspect automated standby bus dispatch."
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
														asChild: true,
														size: "sm",
														className: "w-full h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-xs",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
															to: "/simulation",
															onClick: () => setHelpOpen(false),
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CirclePlay, { className: "size-3.5 mr-1.5" }), "Launch Live Simulation"]
														})
													})
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "space-y-3",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Workflow, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "The 5-Step Operational Flow" })]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "text-xs text-muted-foreground",
														children: "Follow this recommended path to take your depot from raw timetable data to live on-time dispatch:"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "space-y-2.5",
														children: [
															{
																step: "1",
																title: "Corridors & Fleet",
																desc: "Register routes, stops, bus inventory, and driver rosters with legal rest limits.",
																to: "/network/routes",
																badge: "Setup"
															},
															{
																step: "2",
																title: "Trip Timetable",
																desc: "Define scheduled departures. Use 'Generate Timetable' to create trips at 15/30-min intervals.",
																to: "/operations/trips",
																badge: "Planning"
															},
															{
																step: "3",
																title: "AI Schedule Optimizer",
																desc: "Run Google OR-Tools to mathematically chain trips into optimal shifts (duties) and bus assignments.",
																to: "/scheduling/optimizer",
																badge: "AI Optimization"
															},
															{
																step: "4",
																title: "Duty Dispatch & Today",
																desc: "Review crew shifts, fine-tune manual assignments, and monitor live vehicles on duty.",
																to: "/operations/duties",
																badge: "Dispatch"
															},
															{
																step: "5",
																title: "Disruption Radar",
																desc: "When a bus breaks down or delays occur, generate instant recovery options with zero guesswork.",
																to: "/operations/incidents",
																badge: "Recovery"
															}
														].map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
															to: item.to,
															onClick: () => setHelpOpen(false),
															className: "group flex items-start gap-3 p-3 rounded-xl border border-border/70 bg-card/60 hover:border-primary/50 hover:bg-muted/50 transition-all cursor-pointer",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
																className: "size-6 rounded-full bg-primary/10 text-primary font-bold text-xs grid place-items-center shrink-0 font-mono group-hover:bg-primary group-hover:text-primary-foreground transition-colors",
																children: item.step
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "flex-1 min-w-0",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																	className: "flex items-center justify-between gap-1",
																	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
																		className: "text-xs font-bold text-foreground group-hover:text-primary transition-colors",
																		children: item.title
																	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
																		variant: "outline",
																		className: "text-[9px] font-mono px-1 py-0 text-muted-foreground border-border/80",
																		children: item.badge
																	})]
																}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
																	className: "text-[11px] text-muted-foreground mt-0.5 leading-relaxed",
																	children: item.desc
																})]
															})]
														}, item.step))
													})
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "space-y-3 pt-2 border-t border-border/70",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lightbulb, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Transit Terms Simplified" })]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "grid gap-2 text-xs",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "p-2.5 rounded-lg border border-border/60 bg-muted/30",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "font-bold text-foreground",
																children: "Trip: "
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "text-muted-foreground",
																children: "A single one-way bus journey between an origin and destination at a fixed time."
															})]
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "p-2.5 rounded-lg border border-border/60 bg-muted/30",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "font-bold text-foreground",
																children: "Duty (Shift): "
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "text-muted-foreground",
																children: "A full work shift for a crew member or bus, packaging multiple trips and required rest pauses."
															})]
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "p-2.5 rounded-lg border border-border/60 bg-muted/30",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "font-bold text-foreground",
																children: "Deadhead: "
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "text-muted-foreground",
																children: "Driving an empty bus from depot to the first stop. The AI optimizer minimizes this to save fuel."
															})]
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "p-2.5 rounded-lg border border-border/60 bg-muted/30",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "font-bold text-foreground",
																children: "Continuous Driving: "
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "text-muted-foreground",
																children: "Motor Vehicle Act rule limiting a driver to 240 mins (4 hrs) maximum continuous driving before a break."
															})]
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "p-2.5 rounded-lg border border-border/60 bg-muted/30",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "font-bold text-foreground",
																children: "Spreadover: "
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "text-muted-foreground",
																children: "Total elapsed time from driver clock-in to clock-out, including split-shift idle periods."
															})]
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "p-2.5 rounded-lg border border-border/60 bg-muted/30",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "font-bold text-foreground",
																children: "Linked vs Unlinked: "
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "text-muted-foreground",
																children: "Linked pairs a driver with one bus all day. Unlinked allows relief drivers to swap buses at major terminals."
															})]
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "p-2.5 rounded-lg border border-border/60 bg-muted/30",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "font-bold text-foreground",
																children: "Google OR-Tools: "
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "text-muted-foreground",
																children: "An open-source mathematical solver by Google that finds the highest-quality schedule out of millions of combinations."
															})]
														})
													]
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "pt-2 border-t border-border/70 flex items-center justify-between text-xs text-muted-foreground",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "flex items-center gap-1.5 font-medium",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "size-4 text-emerald-500" }), " Multi-Tenant ISO Secure"]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
													variant: "ghost",
													size: "sm",
													onClick: () => setHelpOpen(false),
													className: "text-xs h-7 text-primary hover:text-primary hover:bg-primary/10",
													children: "Close Guide"
												})]
											})
										]
									})]
								}),
								user && user.name && user.role ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenu, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuTrigger, {
									asChild: true,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										className: "flex items-center gap-2.5 rounded-md p-1 pl-2.5 hover:bg-muted/70 transition-colors border border-border/60 focus:outline-hidden",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "text-right hidden md:block",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-xs font-semibold leading-tight text-foreground",
												children: user.name
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[10px] font-mono text-muted-foreground uppercase",
												children: user.role.replace("_", " ")
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Avatar, {
											className: "size-8 ring-2 ring-primary/20 shadow-xs",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarFallback, {
												className: "bg-gradient-to-br from-primary/80 to-primary text-primary-foreground font-bold text-xs",
												children: user.name ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase() : "U"
											})
										})]
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuContent, {
									className: "w-60 shadow-xl border-border/80",
									align: "end",
									forceMount: true,
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuLabel, {
											className: "font-normal p-3",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex flex-col space-y-1",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "text-sm font-bold text-foreground leading-none",
														children: user.name
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "text-xs font-mono text-muted-foreground",
														children: user.email
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "mt-1 flex items-center gap-1.5",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-1.5 rounded-full bg-emerald-500" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "text-[10px] font-semibold text-primary",
															children: user.tenantName
														})]
													})
												]
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuSeparator, {}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuItem, {
											asChild: true,
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
												to: "/settings",
												className: "w-full flex items-center cursor-pointer",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings, { className: "mr-2.5 size-4 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "System Settings" })]
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuSeparator, {}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuItem, {
											onClick: handleLogout,
											className: "text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { className: "mr-2.5 size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Sign Out" })]
										})
									]
								})] }) : null
							]
						})
					]
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "flex-1 px-4 py-6 sm:px-6 lg:px-8 max-w-7xl w-full mx-auto",
				children
			})]
		})]
	});
}
//#endregion
export { Sheet as a, SheetHeader as c, Badge as i, SheetTitle as l, Avatar as n, SheetContent as o, AvatarFallback as r, SheetDescription as s, AppShell as t };
