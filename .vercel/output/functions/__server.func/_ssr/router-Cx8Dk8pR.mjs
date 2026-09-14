import { o as __toESM } from "../_runtime.mjs";
import { t as __exportAll } from "./rolldown-runtime-D7D4PA-g.mjs";
import { a as require_jsx_runtime, n as useQuery, o as require_react, r as QueryClientProvider } from "../_libs/react+tanstack__react-query.mjs";
import { S as useRouter, _ as createFileRoute, b as Navigate, d as HeadContent, f as useRouterState, g as lazyRouteComponent, h as Outlet, m as createRouter, u as Scripts, v as createRootRoute, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { r as createServerFn } from "./ssr.mjs";
import { a as formatPcs, i as formatKg, n as authMiddleware } from "./format-Bcy9062O.mjs";
import { i as ROLE_LABEL } from "./constants-D3MrD-wy.mjs";
import { t as createSsrRpc } from "./createSsrRpc-B2Izd0c7.mjs";
import { _n as object, bn as string, gn as number, ln as _enum, mn as literal, xn as union } from "../_libs/@better-auth/core+[...].mjs";
import { n as number$1 } from "../_libs/zod.mjs";
import { i as signOut } from "./client-CVqXY6bk.mjs";
import { a as hasGateSessionMarker, n as auth$1 } from "./server-C-lEYxUh.mjs";
import { n as useCurrentUser, r as useCurrentUserState, t as cn } from "./utils-C_uf36nf.mjs";
import { a as ShoppingCart, c as Menu, d as Factory, f as ClipboardCheck, h as Boxes, i as TriangleAlert, l as LayoutDashboard, n as Wrench, o as Scale, r as Truck, s as Package, t as X, u as FileText } from "../_libs/lucide-react.mjs";
import { t as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { t as Toaster } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/shell-CEyIydVv.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var subscribeToNothing = () => () => {};
var noGateSessionOnServer = () => false;
/**
* Auth state components — plain wrappers around `useCurrentUserState()`.
*
* With auth on, visitors are signed out until they authenticate — in the sandbox
* live preview too, which does real sign-in. The shared dev user appears only
* when auth is disabled (`VITE_AUTH_ENABLED=false`, the shipped default).
* While the session is still resolving, gates that care about signed-out state
* render nothing so there's no signed-out flash on hard reload.
*/
/** Where `RedirectToSignIn` sends signed-out visitors. Create this route. */
var SIGN_IN_PATH = "/login";
/**
* Client-side redirect to the sign-in route (TanStack `<Navigate>` — NOT a full
* `window.location` reload). A hard navigation re-bootstraps the SPA and re-runs
* session loading, which feels like a second "Loading…" on /login.
*
* Guard routes by waiting out `isPending` first (see `use-current-user`), then
* render this.
*/
function RedirectToSignIn({ to = SIGN_IN_PATH }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, { to });
}
/**
* Minimal signed-in identity chip + sign-out. Restyle freely (see the
* `design-ui` skill). Sign-out is only shown when auth is enabled (the
* disabled-auth dev user has nothing to sign out of) and the session is not
* gate-materialized — behind the gate the next request signs the viewer
* straight back in, so a sign-out control there is a broken loop.
*/
function UserButton() {
	const user = useCurrentUser();
	const [signingOut, setSigningOut] = (0, import_react.useState)(false);
	const gateSession = (0, import_react.useSyncExternalStore)(subscribeToNothing, hasGateSessionMarker, noGateSessionOnServer);
	if (!user) return null;
	const label = user.displayName ?? user.primaryEmail ?? "Account";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-2",
		children: [
			user.profileImageUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: user.profileImageUrl,
				alt: "",
				className: "h-8 w-8 rounded-full object-cover"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "grid h-8 w-8 place-items-center rounded-full bg-black/10 text-sm font-medium dark:bg-white/20",
				children: label.charAt(0).toUpperCase()
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-sm font-medium",
				children: label
			}),
			!gateSession && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				disabled: signingOut,
				onClick: () => {
					setSigningOut(true);
					signOut().catch(() => setSigningOut(false));
				},
				className: "cursor-pointer text-sm underline-offset-4 opacity-70 hover:underline disabled:cursor-wait disabled:no-underline",
				children: signingOut ? "Signing out…" : "Sign out"
			})
		]
	});
}
var auth = [authMiddleware];
function idSchema() {
	return object({ id: number$1() });
}
var getBootstrap = createServerFn({ method: "GET" }).middleware(auth).handler(createSsrRpc("99ebf663435a057263e2a810747080542f90b50bfea38bbe05a73d9d222ac14e"));
var getDashboard = createServerFn({ method: "GET" }).middleware(auth).handler(createSsrRpc("b0f91fdba740888ca42fd4d6604cea0542d5370207323f1c67d7ec34f06e9bfd"));
var listOnHand = createServerFn({ method: "GET" }).middleware(auth).handler(createSsrRpc("e311d1a6091c7c9f651ce2da0126a25ec4bfa763162762edadaefca275439df4"));
var listMoves = createServerFn({ method: "GET" }).middleware(auth).validator(object({
	lotId: number$1().optional(),
	reasonCode: string().optional()
}).optional()).handler(createSsrRpc("d1d21819deff787f75bccb1edf652f0d621f3d58f68771659fb8d99043321b12"));
var getLotLedger = createServerFn({ method: "GET" }).middleware(auth).validator(object({ lotId: number$1() })).handler(createSsrRpc("2cfbdb7527381e92bf80b3316589e77b82ee4e863c335df22db195aab50168bd"));
var listMasters = createServerFn({ method: "GET" }).middleware(auth).handler(createSsrRpc("53804c1b40f15bd860cb987f51c6d0a1e4adb3a21720f3e2a285b908e6b91379"));
var listOpenDocs = createServerFn({ method: "GET" }).middleware(auth).handler(createSsrRpc("4d199d802c9a7ba5c698074c53d7ccc1e529f34be4a6fcea6ee954fbf05df846"));
var listJobWork = createServerFn({ method: "GET" }).middleware(auth).handler(createSsrRpc("2bfccac46b259a2df939f0f720dd9a912193a7dc30c76db3abafff6a33b62958"));
var getGenealogy = createServerFn({ method: "GET" }).middleware(auth).validator(idSchema()).handler(createSsrRpc("2a993c0cfc8bf6df6b61b0fa60d16e60c5a043501d4c50983b2c286fd80d2863"));
var getJourneys = createServerFn({ method: "GET" }).middleware(auth).handler(createSsrRpc("ce32278bd9fb31790c223d31c596f1f9f1522aa65825fa7bb697fb50f37c6785"));
var explodeSo = createServerFn({ method: "POST" }).middleware(auth).validator(object({
	soId: number$1(),
	lineId: number$1()
})).handler(createSsrRpc("c8a23d7eae705aea6e72aeced1ee09606757728f3f494ee0b7fd5975bd10bc04"));
var postGrn = createServerFn({ method: "POST" }).middleware(auth).validator(object({
	partnerId: number$1(),
	poId: number$1().optional(),
	itemId: number$1(),
	heatNo: string().min(1),
	grossKg: number$1().positive(),
	tareKg: number$1().min(0).default(0),
	vehicleNo: string().optional(),
	grnDate: string().optional()
})).handler(createSsrRpc("39a08218128e662786ec60e00f350ae56aa10322ca4d845710fcfb935ccc0e94"));
var releaseLot = createServerFn({ method: "POST" }).middleware(auth).validator(object({
	inspectionId: number$1(),
	result: _enum(["PASS", "FAIL"]),
	notes: string().optional(),
	spectroCu: number$1().optional(),
	spectroZn: number$1().optional(),
	spectroPb: number$1().optional()
})).handler(createSsrRpc("e93c7dea806ea0ca8a482481a00caeac642a8616ae5cc9d7607e9ee6e6823057"));
var createSalesOrder = createServerFn({ method: "POST" }).middleware(auth).validator(object({
	partnerId: number$1(),
	itemId: number$1(),
	qtyPcs: number$1().positive(),
	unitPricePaise: number$1().min(0).default(0),
	notes: string().optional()
})).handler(createSsrRpc("29af64e96889453314a80302b9ff2909c04f340ea191e564edb56d41bb98cea6"));
var createWorkOrder = createServerFn({ method: "POST" }).middleware(auth).validator(object({
	soId: number$1(),
	lineId: number$1()
})).handler(createSsrRpc("f51d021e78840d06c59d8011580a41953b819ed4204330326e464f4842810f9e"));
var issueToWo = createServerFn({ method: "POST" }).middleware(auth).validator(object({
	woId: number$1(),
	lotId: number$1(),
	qtyKg: number$1().positive()
})).handler(createSsrRpc("c702b8a5874015c724307dc9fdac5c25d8a444a6b6a9e66e5fe406d516b78b32"));
var bookWo = createServerFn({ method: "POST" }).middleware(auth).validator(object({
	woId: number$1(),
	goodPcs: number$1().min(0),
	rejectPcs: number$1().min(0),
	scrapKg: number$1().min(0)
})).handler(createSsrRpc("b1b591d8c20874f3e8c9b2df229a6a6a5c27a1f26f2e79b105ca3dbc441738b1"));
var requestStockAdjust = createServerFn({ method: "POST" }).middleware(auth).validator(object({
	lotId: number$1(),
	qtyKg: number$1(),
	qtyPcs: number$1().default(0),
	reason: string().min(3),
	reasonCode: _enum([
		"ADJ-COUNT",
		"ADJ-UOM-ERROR",
		"ADJ-THEFT-INVESTIGATE"
	]).default("ADJ-COUNT")
})).handler(createSsrRpc("d534ec36077ab69ba158f92bc4afe4a244365bbf7b8351b59d41dc397f1ecfc6"));
var approveStockAdjust = createServerFn({ method: "POST" }).middleware(auth).validator(object({
	id: number$1(),
	decision: _enum(["APPROVE", "REJECT"])
})).handler(createSsrRpc("c6f981083003ff788b943df83e911bc6039befe24e024375b56da06ec558a31f"));
var reverseGrn = createServerFn({ method: "POST" }).middleware(auth).validator(object({ grnId: number$1() })).handler(createSsrRpc("d119ccf47b096492d2ce9d638bf07dc52b6fac8947a5faa6d11d6c5d2897423e"));
var NAV = [
	{
		label: "Floor",
		items: [
			{
				to: "/",
				label: "Board",
				icon: LayoutDashboard
			},
			{
				to: "/planning",
				label: "Planning / MRP",
				icon: Factory
			},
			{
				to: "/journeys",
				label: "17 journeys",
				icon: ClipboardCheck
			},
			{
				to: "/dev/journeys",
				label: "Journey pack",
				icon: ClipboardCheck
			},
			{
				to: "/shop",
				label: "Shop booking",
				icon: Factory
			}
		]
	},
	{
		label: "Stock",
		items: [
			{
				to: "/stock",
				label: "On-hand lots",
				icon: Boxes
			},
			{
				to: "/moves",
				label: "Stock ledger",
				icon: Scale
			},
			{
				to: "/grn",
				label: "GRN",
				icon: Package
			},
			{
				to: "/qc",
				label: "QC release",
				icon: ClipboardCheck
			}
		]
	},
	{
		label: "Orders",
		items: [
			{
				to: "/po",
				label: "Purchase",
				icon: Truck
			},
			{
				to: "/so",
				label: "Sales orders",
				icon: ShoppingCart
			},
			{
				to: "/wo",
				label: "Work orders",
				icon: Wrench
			},
			{
				to: "/quotes",
				label: "Quotations",
				icon: FileText
			},
			{
				to: "/dispatch",
				label: "Invoice / packing",
				icon: Package
			},
			{
				to: "/bills",
				label: "AR / AP",
				icon: Scale
			}
		]
	},
	{
		label: "Job work & quality",
		items: [
			{
				to: "/jw",
				label: "JW OUT / return",
				icon: Truck
			},
			{
				to: "/ncr",
				label: "NCR",
				icon: ClipboardCheck
			},
			{
				to: "/foundry",
				label: "Foundry lite",
				icon: Factory
			}
		]
	},
	{
		label: "Books",
		items: [
			{
				to: "/masters",
				label: "Masters",
				icon: Boxes
			},
			{
				to: "/books",
				label: "COA / journals",
				icon: Scale
			},
			{
				to: "/audit",
				label: "Audit / variance",
				icon: FileText
			},
			{
				to: "/admin/permissions",
				label: "Permissions",
				icon: ClipboardCheck
			}
		]
	},
	{
		label: "Compliance",
		items: [
			{
				to: "/dev/docs",
				label: "GST documents",
				icon: FileText
			},
			{
				to: "/registers",
				label: "Registers",
				icon: Scale
			},
			{
				to: "/gst",
				label: "GST worksheets",
				icon: FileText
			},
			{
				to: "/settings/gst",
				label: "GST settings",
				icon: FileText
			}
		]
	}
];
var SHOP_HIDDEN = /* @__PURE__ */ new Set([
	"/so",
	"/quotes",
	"/dispatch",
	"/books",
	"/gst",
	"/bills",
	"/admin/permissions"
]);
function navFor(role) {
	return NAV.map((g) => ({
		...g,
		items: g.items.filter((it) => role === "SHOP" ? !SHOP_HIDDEN.has(it.to) : true)
	})).filter((g) => g.items.length);
}
function AppShell({ children }) {
	const { user, isPending } = useCurrentUserState();
	const [open, setOpen] = (0, import_react.useState)(false);
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const boot = useQuery({
		queryKey: ["bootstrap"],
		queryFn: () => getBootstrap(),
		enabled: Boolean(user)
	});
	if (isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-screen bg-cream",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "hidden w-nav bg-navy md:block" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex-1 p-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "font-display text-xl text-navy",
					children: "Tamba ERP"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted",
					children: "Loading the books…"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mt-4 h-40 animate-pulse rounded-md bg-cream-deep" })
			]
		})]
	});
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RedirectToSignIn, {});
	const role = boot.data?.staff.role ?? "OWNER";
	const company = boot.data?.company;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-cream text-ink md:pl-nav print:pl-0",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
				className: cn("fixed inset-y-0 left-0 z-40 flex w-nav flex-col bg-navy text-cream", "transition-transform duration-200 md:translate-x-0 print:hidden", open ? "translate-x-0" : "-translate-x-full"),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between gap-2 border-b border-white/10 px-4 py-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/",
							className: "min-w-0",
							onClick: () => setOpen(false),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "font-display text-xl leading-none text-brass-soft",
								children: "Tamba"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-micro uppercase tracking-[0.18em] text-cream/60",
								children: "Brass parts ERP"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "md:hidden",
							onClick: () => setOpen(false),
							"aria-label": "Close menu",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-5" })
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
						className: "flex flex-1 flex-col gap-4 overflow-y-auto px-3 py-3",
						children: navFor(role).map((g) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "px-2 pb-1 text-micro font-semibold uppercase tracking-[0.16em] text-brass-soft/80",
							children: g.label
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "space-y-0.5",
							children: g.items.map((it) => {
								const active = it.to === "/" ? pathname === "/" : pathname.startsWith(it.to);
								const Icon = it.icon;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
									to: it.to,
									onClick: () => setOpen(false),
									className: cn("flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm", active ? "bg-brass text-navy-deep" : "text-cream/85 hover:bg-navy-mid"),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-3.5 shrink-0" }), it.label]
								}) }, it.to);
							})
						})] }, g.label))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "border-t border-white/10 px-3 py-3 text-micro text-cream/70",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "truncate",
							children: boot.data?.staff.name ?? user.displayName
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-brass-soft",
							children: ROLE_LABEL[role] ?? role
						})]
					})
				]
			}),
			open ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "fixed inset-0 z-30 bg-ink/40 md:hidden",
				"aria-label": "Close menu overlay",
				onClick: () => setOpen(false)
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "sticky top-0 z-20 flex h-12 items-center justify-between gap-3 border-b border-line bg-cream/95 px-3 backdrop-blur print:hidden md:px-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "md:hidden",
						onClick: () => setOpen(true),
						"aria-label": "Open menu",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, { className: "size-5" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "hidden text-sm text-muted md:block",
						children: company ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-medium text-navy",
								children: company.trade_name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mx-2 text-line",
								children: "|"
							}),
							"GSTIN ",
							company.gstin,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mx-2 text-line",
								children: "|"
							}),
							"FY 26-27"
						] }) : "Tamba Brass Works"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "ml-auto flex items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "hidden text-right text-micro text-muted sm:block",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-navy",
								children: user.primaryEmail
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: ROLE_LABEL[role] ?? role })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex h-8 min-w-8 items-center",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserButton, {})
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "px-3 py-4 md:px-5",
				children
			})
		]
	});
}
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/data-table-BX2j2kgV.js
function Panel({ title, actions, children, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: cn("rounded-md border border-line bg-paper", className),
		children: [(title || actions) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "flex flex-wrap items-center justify-between gap-2 border-b border-line px-3 py-2",
			children: [title ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-sm font-semibold text-navy",
				children: title
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {}), actions]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "overflow-x-auto",
			children
		})]
	});
}
function Empty({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "px-3 py-8 text-center text-sm text-muted",
		children
	});
}
function Stat({ label, value, hint, warn }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("rounded-md border border-line bg-paper px-3 py-2.5", warn && "border-warn"),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-micro font-medium uppercase tracking-wide text-muted",
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-0.5 font-mono text-lg font-medium tabular text-navy",
				children: value
			}),
			hint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-micro text-muted",
				children: hint
			}) : null
		]
	});
}
function PageHeader({ kicker, title, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mb-3 flex flex-wrap items-end justify-between gap-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [kicker ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "text-micro font-medium uppercase tracking-[0.14em] text-brass-deep",
			children: kicker
		}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "font-display text-2xl font-semibold text-navy",
			children: title
		})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex flex-wrap items-center gap-2",
			children
		})]
	});
}
function linesOf(raw) {
	if (!raw) return [];
	if (typeof raw === "string") try {
		const v = JSON.parse(raw);
		return Array.isArray(v) ? v : [];
	} catch {
		return [];
	}
	return Array.isArray(raw) ? raw : [];
}
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/badge-Bgo8Jb8B.js
var tones = {
	AVAILABLE: "bg-ok/15 text-ok",
	QUARANTINE: "bg-hold/15 text-hold",
	HOLD: "bg-hold/15 text-hold",
	REJECTED: "bg-danger/15 text-danger",
	OPEN: "bg-navy/10 text-navy",
	ISSUED: "bg-brass/15 text-brass-deep",
	COMPLETE: "bg-ok/15 text-ok",
	CLOSED: "bg-muted/15 text-muted",
	PARTIAL: "bg-warn/15 text-warn",
	QC_HOLD: "bg-hold/15 text-hold",
	POSTED: "bg-ok/15 text-ok",
	DRAFT: "bg-muted/20 text-muted",
	PASS: "bg-ok/15 text-ok",
	FAIL: "bg-danger/15 text-danger",
	PENDING: "bg-warn/15 text-warn",
	OWN: "bg-navy/10 text-navy",
	CUSTOMER: "bg-brass/15 text-brass-deep",
	APPROVED: "bg-ok/15 text-ok"
};
function Badge({ children, tone, className }) {
	const t = tone ? tones[tone] ?? "bg-cream-deep text-ink" : "bg-cream-deep text-ink";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("inline-flex items-center rounded-sm px-1.5 py-0.5 text-micro font-semibold uppercase tracking-wide", t, className),
		children
	});
}
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/router-Cx8Dk8pR.js
var FALLBACK_MESSAGE = "An unexpected error occurred. Try reloading the page.";
function errorMessage(error) {
	if (error instanceof Error && error.message) return error.message;
	if (typeof error === "string" && error) return error;
	return FALLBACK_MESSAGE;
}
function AppErrorComponent({ error }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-red-500",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, {
					className: "size-10",
					strokeWidth: 2
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-lg font-semibold",
				children: "Something went wrong"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "max-w-md text-sm break-words text-zinc-500 dark:text-zinc-400",
				children: errorMessage(error)
			})
		]
	});
}
/**
* App-wide client provider mounted once near the root (in `src/routes/__root.tsx`):
*
*   <AuthProvider><Outlet /></AuthProvider>
*
* Better Auth's React client (`@/lib/auth/client`) needs NO context provider —
* its `useSession()` works standalone — so this is a passthrough today. It's
* kept as the single, stable mount point for any future client-side providers
* (e.g. a toast or theme provider) without churning the root shell.
*/
function AuthProvider({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
}
var CONNECTOR_TOKEN_READY_EVENT = "grok:connector-token-ready";
function isGrokEmbedderOrigin(origin) {
	try {
		const url = new URL(origin);
		if (url.protocol !== "https:" && url.protocol !== "http:") return false;
		const host = url.hostname.toLowerCase();
		if (host === "grok.com" || host.endsWith(".grok.com")) return true;
		if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") return true;
		return false;
	} catch {
		return false;
	}
}
function isSandboxPreviewGuestHost(hostname) {
	const host = hostname.toLowerCase();
	return host === "grok-sandbox.com" || host.endsWith(".grok-sandbox.com");
}
function isRemintPreviewPair(guestHost, parentHost) {
	const guest = guestHost.toLowerCase();
	const parent = parentHost.toLowerCase();
	const i = guest.indexOf(".preview.");
	if (i <= 0) return false;
	const label = guest.slice(0, i);
	const rest = guest.slice(i + 9);
	if (label.includes(".") || !rest.includes(".")) return false;
	return parent === rest || parent === `grok.${rest}`;
}
function resolveParentEmbedderOrigin(parentIsSelf, referrer, ancestorOrigin, guestHostname = "") {
	if (parentIsSelf) return null;
	for (const candidate of [referrer, ancestorOrigin ?? ""].filter(Boolean)) try {
		const url = new URL(candidate.includes("://") ? candidate : `https://${candidate}`);
		if (url.protocol !== "https:" && url.protocol !== "http:") continue;
		if (isGrokEmbedderOrigin(url.origin)) return url.origin;
		if (isSandboxPreviewGuestHost(guestHostname) || isRemintPreviewPair(guestHostname, url.hostname)) return url.origin;
	} catch {}
	return null;
}
/**
* Guest side of the grok-web ↔ sandbox preview postMessage bridge.
*
* Activates only when this page is framed by an allowlisted Grok embedder.
* Top-level runs (download/export, local `npm run dev`, deployed sites) noop.
*/
var PREVIEW_BRIDGE_CHANNEL = "grok-preview-bridge";
var EnvelopeSchema = object({
	channel: literal(PREVIEW_BRIDGE_CHANNEL),
	version: number().int().positive(),
	type: string().min(1)
});
var HelloSchema = EnvelopeSchema.extend({ type: literal("hello") });
var NavigateSchema = EnvelopeSchema.extend({
	type: literal("navigate"),
	path: string().min(1)
});
var HistorySchema = EnvelopeSchema.extend({
	type: literal("history"),
	delta: union([literal(-1), literal(1)])
});
var ConnectorTokenReadySchema = EnvelopeSchema.extend({ type: literal("connector-token-ready") });
function isSafeBridgePath(path) {
	if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return false;
	try {
		return new URL(path, "https://preview.invalid").origin === "https://preview.invalid";
	} catch {
		return false;
	}
}
/**
* Origin of the Grok embedder framing this page, or null when the page runs
* top-level (download/export, local `npm run dev`, deployed sites) or under a
* non-Grok parent. Client-only; null during SSR.
*/
function resolveCurrentEmbedderOrigin() {
	if (typeof window === "undefined") return null;
	const ancestorOrigin = typeof location.ancestorOrigins !== "undefined" && location.ancestorOrigins.length > 0 ? location.ancestorOrigins[0] : null;
	return resolveParentEmbedderOrigin(window.parent === window, document.referrer, ancestorOrigin, window.location.hostname);
}
/**
* Install host↔guest messaging. Returns a dispose function.
* Noops (returns a no-op dispose) when not embedded under a Grok parent.
*/
function installPreviewHostBridge(options = {}) {
	const parentOrigin = resolveCurrentEmbedderOrigin();
	if (parentOrigin === null) return () => {};
	const ROOT_STATE_KEY = "__grokPreviewBridgeRoot";
	const originalPushState = window.history.pushState.bind(window.history);
	const originalReplaceState = window.history.replaceState.bind(window.history);
	const isAtHistoryRoot = () => {
		const state = window.history.state;
		return Boolean(state && typeof state === "object" && state[ROOT_STATE_KEY] === true);
	};
	try {
		const current = window.history.state;
		if (!(current !== null && typeof current === "object" && Object.prototype.hasOwnProperty.call(current, ROOT_STATE_KEY))) {
			const isRoot = window.history.length <= 1;
			originalReplaceState(current && typeof current === "object" ? {
				...current,
				[ROOT_STATE_KEY]: isRoot
			} : { [ROOT_STATE_KEY]: isRoot }, "", window.location.href);
		}
	} catch {}
	const post = (message) => {
		window.parent.postMessage(message, parentOrigin);
	};
	const reportLocation = () => {
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "location",
			path: window.location.pathname || "/",
			search: window.location.search,
			hash: window.location.hash
		});
	};
	const reportRoutes = () => {
		const paths = options.getRoutePaths?.() ?? [];
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "routes",
			paths
		});
	};
	const defaultNavigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		try {
			const url = new URL(path, window.location.origin);
			if (url.origin !== window.location.origin) return;
			const next = `${url.pathname}${url.search}${url.hash}`;
			window.history.pushState(window.history.state, "", next);
			window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
		} catch {}
	};
	const navigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		if (options.navigate) {
			options.navigate(path);
			return;
		}
		defaultNavigate(path);
	};
	const announce = () => {
		reportLocation();
		reportRoutes();
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "ready"
		});
	};
	const onHello = (data) => {
		if (!HelloSchema.safeParse(data).success) return;
		announce();
	};
	const onNavigate = (data) => {
		const parsed = NavigateSchema.safeParse(data);
		if (!parsed.success) return;
		navigate(parsed.data.path);
		queueMicrotask(reportLocation);
	};
	const onHistory = (data) => {
		const parsed = HistorySchema.safeParse(data);
		if (!parsed.success) return;
		if (parsed.data.delta === -1 && isAtHistoryRoot()) return;
		window.history.go(parsed.data.delta);
	};
	const onConnectorTokenReady = (data) => {
		if (!ConnectorTokenReadySchema.safeParse(data).success) return;
		window.dispatchEvent(new Event(CONNECTOR_TOKEN_READY_EVENT));
	};
	const hostMessageHandlers = /* @__PURE__ */ new Map([
		["hello", onHello],
		["navigate", onNavigate],
		["history", onHistory],
		["connector-token-ready", onConnectorTokenReady]
	]);
	const onMessage = (event) => {
		if (event.source !== window.parent) return;
		if (event.origin !== parentOrigin) return;
		const envelope = EnvelopeSchema.safeParse(event.data);
		if (!envelope.success || envelope.data.version !== 1) return;
		hostMessageHandlers.get(envelope.data.type)?.(event.data);
	};
	const onPopState = () => {
		reportLocation();
	};
	const onHashChange = () => {
		reportLocation();
	};
	window.history.pushState = (data, unused, url) => {
		const next = data && typeof data === "object" ? {
			...data,
			[ROOT_STATE_KEY]: false
		} : data;
		originalPushState(next, unused, url);
		reportLocation();
	};
	window.history.replaceState = (data, unused, url) => {
		const next = isAtHistoryRoot() ? {
			...data && typeof data === "object" ? data : {},
			[ROOT_STATE_KEY]: true
		} : data;
		originalReplaceState(next, unused, url);
		reportLocation();
	};
	window.addEventListener("message", onMessage);
	window.addEventListener("popstate", onPopState);
	window.addEventListener("hashchange", onHashChange);
	announce();
	return () => {
		window.removeEventListener("message", onMessage);
		window.removeEventListener("popstate", onPopState);
		window.removeEventListener("hashchange", onHashChange);
		window.history.pushState = originalPushState;
		window.history.replaceState = originalReplaceState;
	};
}
/** Collect static path patterns from a TanStack route tree (best-effort). */
function collectRoutePathsFromTree(routeTree) {
	const paths = /* @__PURE__ */ new Set();
	const walk = (node) => {
		if (!node || typeof node !== "object") return;
		const record = node;
		const full = typeof record.fullPath === "string" ? record.fullPath : typeof record.path === "string" ? record.path : null;
		if (full !== null && full !== "") paths.add(full.startsWith("/") ? full : `/${full}`);
		else if (full === "") paths.add("/");
		const children = record.children;
		if (Array.isArray(children)) for (const child of children) walk(child);
		else if (children && typeof children === "object") for (const child of Object.values(children)) walk(child);
	};
	walk(routeTree);
	return [...paths];
}
/**
* Mount once in `__root.tsx` so the Grok preview chrome can drive navigation
* (and later receive registered routes). Noops when the app is not embedded.
*/
function PreviewHostBridge() {
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		return installPreviewHostBridge({
			navigate: (path) => {
				router.history.push(path);
			},
			getRoutePaths: () => collectRoutePathsFromTree(router.routeTree)
		});
	}, [router]);
	return null;
}
function AppProviders({ children }) {
	const [client] = (0, import_react.useState)(() => new QueryClient({ defaultOptions: { queries: {
		staleTime: 4e3,
		retry: 1
	} } }));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(QueryClientProvider, {
		client,
		children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
			position: "top-right",
			richColors: true,
			closeButton: true
		})]
	});
}
var styles_default = "/assets/styles-BAMRTkBK.css";
var APP_NAME = "Tamba ERP";
var fetchSessionUser = createServerFn({ method: "GET" }).handler(createSsrRpc("2c4985e96c199268f7f639534cb5e8e31d6b19d43286bf77416413db60ffde26"));
var Route$44 = createRootRoute({
	beforeLoad: async () => ({ sessionUser: await fetchSessionUser() }),
	errorComponent: AppErrorComponent,
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: APP_NAME },
			{
				name: "description",
				content: "Tamba ERP — brass parts manufacturing books: dual UOM, lots, job work, GST."
			},
			{
				name: "theme-color",
				content: "#1B2A4A"
			}
		],
		links: [
			{
				rel: "icon",
				type: "image/svg+xml",
				href: "/favicon.svg"
			},
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "manifest",
				href: "/__grok/manifest.webmanifest"
			},
			{
				rel: "apple-touch-icon",
				href: "/__grok/icon-180.png"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600;700&family=Source+Serif+4:opsz,wght@8..60,600;8..60,700&display=swap"
			}
		]
	}),
	component: RootDocument
});
function RootDocument() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en-IN",
		suppressHydrationWarning: true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", {
			className: "min-h-screen bg-cream text-ink antialiased",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PreviewHostBridge, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppProviders, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}) }) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})
			]
		})]
	});
}
var $$splitComponentImporter$42 = () => import("./routes-vwHIStD-.mjs");
var Route$43 = createFileRoute("/")({ component: lazyRouteComponent($$splitComponentImporter$42, "component") });
var $$splitComponentImporter$41 = () => import("./audit-C4nCAAcY.mjs");
var Route$42 = createFileRoute("/audit")({ component: lazyRouteComponent($$splitComponentImporter$41, "component") });
var $$splitComponentImporter$40 = () => import("./bills-DgsqiKUw.mjs");
var Route$41 = createFileRoute("/bills")({ component: lazyRouteComponent($$splitComponentImporter$40, "component") });
var $$splitComponentImporter$39 = () => import("./books-Dje-KVNh.mjs");
var Route$40 = createFileRoute("/books")({ component: lazyRouteComponent($$splitComponentImporter$39, "component") });
var $$splitComponentImporter$38 = () => import("./dispatch-CcW5ucj2.mjs");
var Route$39 = createFileRoute("/dispatch")({ component: lazyRouteComponent($$splitComponentImporter$38, "component") });
var $$splitComponentImporter$37 = () => import("./foundry-DB9nzw4C.mjs");
var Route$38 = createFileRoute("/foundry")({ component: lazyRouteComponent($$splitComponentImporter$37, "component") });
var $$splitComponentImporter$36 = () => import("./grn-C8XV9wPi.mjs");
var Route$37 = createFileRoute("/grn")({ component: lazyRouteComponent($$splitComponentImporter$36, "component") });
var $$splitComponentImporter$35 = () => import("./gst-RtUWJB0a.mjs");
var Route$36 = createFileRoute("/gst")({ component: lazyRouteComponent($$splitComponentImporter$35, "component") });
var $$splitComponentImporter$34 = () => import("./healthz-DSX4d31d.mjs");
var Route$35 = createFileRoute("/healthz")({ component: lazyRouteComponent($$splitComponentImporter$34, "component") });
var $$splitComponentImporter$33 = () => import("./journeys-BXBVED_w.mjs");
var Route$34 = createFileRoute("/journeys")({ component: lazyRouteComponent($$splitComponentImporter$33, "component") });
var $$splitComponentImporter$32 = () => import("./jw-DxwT-6pz.mjs");
var Route$33 = createFileRoute("/jw")({ component: lazyRouteComponent($$splitComponentImporter$32, "component") });
var $$splitComponentImporter$31 = () => import("./login-XbgoU5uP.mjs");
var Route$32 = createFileRoute("/login")({ component: lazyRouteComponent($$splitComponentImporter$31, "component") });
var $$splitComponentImporter$30 = () => import("./masters-CQSos-AD.mjs");
var Route$31 = createFileRoute("/masters")({ component: lazyRouteComponent($$splitComponentImporter$30, "component") });
var $$splitComponentImporter$29 = () => import("./moves-D7edW3WE.mjs");
var Route$30 = createFileRoute("/moves")({ component: lazyRouteComponent($$splitComponentImporter$29, "component") });
var $$splitComponentImporter$28 = () => import("./ncr-CLSYoi8w.mjs");
var Route$29 = createFileRoute("/ncr")({ component: lazyRouteComponent($$splitComponentImporter$28, "component") });
var $$splitComponentImporter$27 = () => import("./planning-CQ0VeU6W.mjs");
var Route$28 = createFileRoute("/planning")({ component: lazyRouteComponent($$splitComponentImporter$27, "component") });
var $$splitComponentImporter$26 = () => import("./po-CmeogCF7.mjs");
var Route$27 = createFileRoute("/po")({ component: lazyRouteComponent($$splitComponentImporter$26, "component") });
var $$splitComponentImporter$25 = () => import("./qc-DMTfvZs9.mjs");
var Route$26 = createFileRoute("/qc")({ component: lazyRouteComponent($$splitComponentImporter$25, "component") });
var $$splitComponentImporter$24 = () => import("./quotes-DU8SfUsI.mjs");
var Route$25 = createFileRoute("/quotes")({ component: lazyRouteComponent($$splitComponentImporter$24, "component") });
var $$splitComponentImporter$23 = () => import("./registers-imYicwjC.mjs");
var Route$24 = createFileRoute("/registers")({ component: lazyRouteComponent($$splitComponentImporter$23, "component") });
var $$splitComponentImporter$22 = () => import("./shop-DPF_-sDC.mjs");
var Route$23 = createFileRoute("/shop")({ component: lazyRouteComponent($$splitComponentImporter$22, "component") });
var $$splitComponentImporter$21 = () => import("./so-ChNkspSw.mjs");
var Route$22 = createFileRoute("/so")({ component: lazyRouteComponent($$splitComponentImporter$21, "component") });
var $$splitComponentImporter$20 = () => import("./stock-BMr7_a3Q.mjs");
var Route$21 = createFileRoute("/stock")({ component: lazyRouteComponent($$splitComponentImporter$20, "component") });
var $$splitComponentImporter$19 = () => import("./wo-BaP-Pp00.mjs");
var Route$20 = createFileRoute("/wo")({ component: lazyRouteComponent($$splitComponentImporter$19, "component") });
var $$splitComponentImporter$18 = () => import("./admin.permissions-DfRfYiNK.mjs");
var Route$19 = createFileRoute("/admin/permissions")({ component: lazyRouteComponent($$splitComponentImporter$18, "component") });
var $$splitComponentImporter$17 = () => import("./dev.docs-BtjLfuhl.mjs");
var Route$18 = createFileRoute("/dev/docs")({ component: lazyRouteComponent($$splitComponentImporter$17, "component") });
var $$splitComponentImporter$16 = () => import("./dev.journeys-CS8-rych.mjs");
var Route$17 = createFileRoute("/dev/journeys")({ component: lazyRouteComponent($$splitComponentImporter$16, "component") });
var $$splitComponentImporter$15 = () => import("./genealogy._lotId-Cqmzqwaj.mjs");
var Route$16 = createFileRoute("/genealogy/$lotId")({ component: lazyRouteComponent($$splitComponentImporter$15, "component") });
function GenealogyView({ lotId }) {
	const q = useQuery({
		queryKey: ["gene", lotId],
		queryFn: () => getGenealogy({ data: { id: Number(lotId) } })
	});
	const g = q.data;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
		kicker: "Genealogy",
		title: g ? String(g.lot.lot_no) : `Lot ${lotId}`,
		children: g ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "font-mono text-sm",
			children: [
				g.lot.sku,
				" · heat ",
				g.lot.heat_no ?? "—",
				" · ",
				g.lot.alloy,
				" ",
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/print/coc/$id",
					params: { id: lotId },
					className: "ml-2 text-navy underline",
					children: "CoC"
				})
			]
		}) : null
	}), q.isError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm text-danger",
		children: q.error.message
	}) : g ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-3 lg:grid-cols-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "This lot",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
					className: "grid grid-cols-2 gap-2 p-3 text-sm",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
							className: "text-muted",
							children: "Warehouse"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
							className: "font-mono",
							children: g.lot.warehouse
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
							className: "text-muted",
							children: "kg / pcs"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dd", {
							className: "tabular",
							children: [
								formatKg(g.lot.qty_kg),
								" / ",
								formatPcs(g.lot.qty_pcs)
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
							className: "text-muted",
							children: "Status"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							tone: g.lot.status,
							children: g.lot.status
						}) }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
							className: "text-muted",
							children: "Heat / GRN"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
							className: "font-mono",
							children: g.lot.heat_no ?? "—"
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "Moves on this lot",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "app-table",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Type" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "kg" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "pcs" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Whs" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Consumed" })
					] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: (g.moves ?? []).map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "font-mono",
							children: m.move_type
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "tabular",
							children: formatKg(m.qty_kg)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "tabular",
							children: formatPcs(m.qty_pcs)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "font-mono",
							children: m.warehouse
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "font-mono",
							children: m.consumed_lot_id ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: "/stock/lots/$lotId/genealogy",
								params: { lotId: String(m.consumed_lot_id) },
								className: "underline",
								children: ["lot ", m.consumed_lot_id]
							}) : "—"
						})
					] }, m.id)) })]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "Cartons (if packed)",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "app-table",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Carton" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Pcs" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Net kg" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Packing" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Invoice" })
					] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: g.cartons.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "font-mono",
							children: c.carton_no
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "tabular",
							children: formatPcs(c.qty_pcs)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "tabular",
							children: formatKg(c.net_kg)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "font-mono",
							children: c.packing_no
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "font-mono",
							children: c.invoice_no
						})
					] }, c.carton_no)) })]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "Parents (what went into this lot)",
				children: g.parents.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "app-table",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Lot" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "SKU" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Heat" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "kg" })
					] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: g.parents.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "font-mono",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/stock/lots/$lotId/genealogy",
								params: { lotId: String(p.id) },
								className: "underline",
								children: p.lot_no
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "font-mono",
							children: p.sku
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "font-mono",
							children: p.heat_no
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "tabular",
							children: formatKg(p.qty_kg)
						})
					] }, p.id)) })]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "p-3 text-sm text-muted",
					children: "No parent lots — opening lot or not yet issued through a WO."
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "Walk back to rod / heat / GRN / JW",
				children: g.ancestors.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
					className: "space-y-1 p-3 font-mono text-sm",
					children: g.ancestors.map((a, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
						"—".repeat(nDepth(a.depth)),
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/stock/lots/$lotId/genealogy",
							params: { lotId: String(a.id) },
							className: "underline",
							children: [
								a.sku,
								" ",
								a.lot_no
							]
						}),
						" ",
						"heat ",
						a.heat_no,
						" ",
						formatKg(a.qty_kg),
						" kg"
					] }, `${a.id}-${i}`))
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "p-3 text-sm text-muted",
					children: "No upstream chain on this lot yet. FG receipts after a WO issue walk back to the rod / heat."
				})
			})
		]
	}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-muted",
		children: "Loading genealogy…"
	})] });
}
function nDepth(v) {
	const n = Number(v);
	return Number.isFinite(n) ? n : 1;
}
var $$splitComponentImporter$14 = () => import("./settings.gst-DfCPmcKc.mjs");
var Route$15 = createFileRoute("/settings/gst")({ component: lazyRouteComponent($$splitComponentImporter$14, "component") });
var $$splitComponentImporter$13 = () => import("./stock.index-rej_q-OA.mjs");
var Route$14 = createFileRoute("/stock/")({ component: lazyRouteComponent($$splitComponentImporter$13, "component") });
var Route$13 = createFileRoute("/api/auth/$")({ server: { handlers: {
	GET: ({ request }) => auth$1.handler(request),
	POST: ({ request }) => auth$1.handler(request)
} } });
var $$splitComponentImporter$12 = () => import("./dev.docs.index-BMOvJeqx.mjs");
var Route$12 = createFileRoute("/dev/docs/")({ component: lazyRouteComponent($$splitComponentImporter$12, "component") });
var $$splitComponentImporter$11 = () => import("./dev.docs._slug-Sd5jEnwd.mjs");
var Route$11 = createFileRoute("/dev/docs/$slug")({ component: lazyRouteComponent($$splitComponentImporter$11, "component") });
var $$splitComponentImporter$10 = () => import("./print.challan._id-NYd6MDGX.mjs");
var Route$10 = createFileRoute("/print/challan/$id")({ component: lazyRouteComponent($$splitComponentImporter$10, "component") });
var $$splitComponentImporter$9 = () => import("./print.cn._id-51uidDYU.mjs");
var Route$9 = createFileRoute("/print/cn/$id")({ component: lazyRouteComponent($$splitComponentImporter$9, "component") });
var $$splitComponentImporter$8 = () => import("./print.coc._id-CMF0PNsf.mjs");
var Route$8 = createFileRoute("/print/coc/$id")({ component: lazyRouteComponent($$splitComponentImporter$8, "component") });
var $$splitComponentImporter$7 = () => import("./print.dn._id-CpyGQ7bK.mjs");
var Route$7 = createFileRoute("/print/dn/$id")({ component: lazyRouteComponent($$splitComponentImporter$7, "component") });
var $$splitComponentImporter$6 = () => import("./print.eway._id-ByzhWQsU.mjs");
var Route$6 = createFileRoute("/print/eway/$id")({ component: lazyRouteComponent($$splitComponentImporter$6, "component") });
var $$splitComponentImporter$5 = () => import("./print.grn._id-unIQGREo.mjs");
var Route$5 = createFileRoute("/print/grn/$id")({ component: lazyRouteComponent($$splitComponentImporter$5, "component") });
var $$splitComponentImporter$4 = () => import("./print.invoice._id-kvE86WPD.mjs");
var Route$4 = createFileRoute("/print/invoice/$id")({ component: lazyRouteComponent($$splitComponentImporter$4, "component") });
var $$splitComponentImporter$3 = () => import("./print.packing._id-Ge8_zeWe.mjs");
var Route$3 = createFileRoute("/print/packing/$id")({ component: lazyRouteComponent($$splitComponentImporter$3, "component") });
var $$splitComponentImporter$2 = () => import("./print.quote._id-C8E_G26k.mjs");
var Route$2 = createFileRoute("/print/quote/$id")({ component: lazyRouteComponent($$splitComponentImporter$2, "component") });
var $$splitComponentImporter$1 = () => import("./print.return._id-B7XTn2LT.mjs");
var Route$1 = createFileRoute("/print/return/$id")({ component: lazyRouteComponent($$splitComponentImporter$1, "component") });
var $$splitComponentImporter = () => import("./stock.lots._lotId.genealogy-aTSf6qmP.mjs");
var Route = createFileRoute("/stock/lots/$lotId/genealogy")({ component: lazyRouteComponent($$splitComponentImporter, "component") });
var IndexRoute = Route$43.update({
	id: "/",
	path: "/",
	getParentRoute: () => Route$44
});
var AuditRoute = Route$42.update({
	id: "/audit",
	path: "/audit",
	getParentRoute: () => Route$44
});
var BillsRoute = Route$41.update({
	id: "/bills",
	path: "/bills",
	getParentRoute: () => Route$44
});
var BooksRoute = Route$40.update({
	id: "/books",
	path: "/books",
	getParentRoute: () => Route$44
});
var DispatchRoute = Route$39.update({
	id: "/dispatch",
	path: "/dispatch",
	getParentRoute: () => Route$44
});
var FoundryRoute = Route$38.update({
	id: "/foundry",
	path: "/foundry",
	getParentRoute: () => Route$44
});
var GrnRoute = Route$37.update({
	id: "/grn",
	path: "/grn",
	getParentRoute: () => Route$44
});
var GstRoute = Route$36.update({
	id: "/gst",
	path: "/gst",
	getParentRoute: () => Route$44
});
var HealthzRoute = Route$35.update({
	id: "/healthz",
	path: "/healthz",
	getParentRoute: () => Route$44
});
var JourneysRoute = Route$34.update({
	id: "/journeys",
	path: "/journeys",
	getParentRoute: () => Route$44
});
var JwRoute = Route$33.update({
	id: "/jw",
	path: "/jw",
	getParentRoute: () => Route$44
});
var LoginRoute = Route$32.update({
	id: "/login",
	path: "/login",
	getParentRoute: () => Route$44
});
var MastersRoute = Route$31.update({
	id: "/masters",
	path: "/masters",
	getParentRoute: () => Route$44
});
var MovesRoute = Route$30.update({
	id: "/moves",
	path: "/moves",
	getParentRoute: () => Route$44
});
var NcrRoute = Route$29.update({
	id: "/ncr",
	path: "/ncr",
	getParentRoute: () => Route$44
});
var PlanningRoute = Route$28.update({
	id: "/planning",
	path: "/planning",
	getParentRoute: () => Route$44
});
var PoRoute = Route$27.update({
	id: "/po",
	path: "/po",
	getParentRoute: () => Route$44
});
var QcRoute = Route$26.update({
	id: "/qc",
	path: "/qc",
	getParentRoute: () => Route$44
});
var QuotesRoute = Route$25.update({
	id: "/quotes",
	path: "/quotes",
	getParentRoute: () => Route$44
});
var RegistersRoute = Route$24.update({
	id: "/registers",
	path: "/registers",
	getParentRoute: () => Route$44
});
var ShopRoute = Route$23.update({
	id: "/shop",
	path: "/shop",
	getParentRoute: () => Route$44
});
var SoRoute = Route$22.update({
	id: "/so",
	path: "/so",
	getParentRoute: () => Route$44
});
var StockRoute = Route$21.update({
	id: "/stock",
	path: "/stock",
	getParentRoute: () => Route$44
});
var WoRoute = Route$20.update({
	id: "/wo",
	path: "/wo",
	getParentRoute: () => Route$44
});
var AdminPermissionsRoute = Route$19.update({
	id: "/admin/permissions",
	path: "/admin/permissions",
	getParentRoute: () => Route$44
});
var DevDocsRoute = Route$18.update({
	id: "/dev/docs",
	path: "/dev/docs",
	getParentRoute: () => Route$44
});
var DevJourneysRoute = Route$17.update({
	id: "/dev/journeys",
	path: "/dev/journeys",
	getParentRoute: () => Route$44
});
var GenealogyLotIdRoute = Route$16.update({
	id: "/genealogy/$lotId",
	path: "/genealogy/$lotId",
	getParentRoute: () => Route$44
});
var SettingsGstRoute = Route$15.update({
	id: "/settings/gst",
	path: "/settings/gst",
	getParentRoute: () => Route$44
});
var StockIndexRoute = Route$14.update({
	id: "/",
	path: "/",
	getParentRoute: () => StockRoute
});
var ApiAuthSplatRoute = Route$13.update({
	id: "/api/auth/$",
	path: "/api/auth/$",
	getParentRoute: () => Route$44
});
var DevDocsIndexRoute = Route$12.update({
	id: "/",
	path: "/",
	getParentRoute: () => DevDocsRoute
});
var DevDocsSlugRoute = Route$11.update({
	id: "/$slug",
	path: "/$slug",
	getParentRoute: () => DevDocsRoute
});
var PrintChallanIdRoute = Route$10.update({
	id: "/print/challan/$id",
	path: "/print/challan/$id",
	getParentRoute: () => Route$44
});
var PrintCnIdRoute = Route$9.update({
	id: "/print/cn/$id",
	path: "/print/cn/$id",
	getParentRoute: () => Route$44
});
var PrintCocIdRoute = Route$8.update({
	id: "/print/coc/$id",
	path: "/print/coc/$id",
	getParentRoute: () => Route$44
});
var PrintDnIdRoute = Route$7.update({
	id: "/print/dn/$id",
	path: "/print/dn/$id",
	getParentRoute: () => Route$44
});
var PrintEwayIdRoute = Route$6.update({
	id: "/print/eway/$id",
	path: "/print/eway/$id",
	getParentRoute: () => Route$44
});
var PrintGrnIdRoute = Route$5.update({
	id: "/print/grn/$id",
	path: "/print/grn/$id",
	getParentRoute: () => Route$44
});
var PrintInvoiceIdRoute = Route$4.update({
	id: "/print/invoice/$id",
	path: "/print/invoice/$id",
	getParentRoute: () => Route$44
});
var PrintPackingIdRoute = Route$3.update({
	id: "/print/packing/$id",
	path: "/print/packing/$id",
	getParentRoute: () => Route$44
});
var PrintQuoteIdRoute = Route$2.update({
	id: "/print/quote/$id",
	path: "/print/quote/$id",
	getParentRoute: () => Route$44
});
var PrintReturnIdRoute = Route$1.update({
	id: "/print/return/$id",
	path: "/print/return/$id",
	getParentRoute: () => Route$44
});
var StockRouteChildren = {
	StockIndexRoute,
	StockLotsLotIdGenealogyRoute: Route.update({
		id: "/lots/$lotId/genealogy",
		path: "/lots/$lotId/genealogy",
		getParentRoute: () => StockRoute
	})
};
var StockRouteWithChildren = StockRoute._addFileChildren(StockRouteChildren);
var DevDocsRouteChildren = {
	DevDocsSlugRoute,
	DevDocsIndexRoute
};
var rootRouteChildren = {
	IndexRoute,
	AuditRoute,
	BillsRoute,
	BooksRoute,
	DispatchRoute,
	FoundryRoute,
	GrnRoute,
	GstRoute,
	HealthzRoute,
	JourneysRoute,
	JwRoute,
	LoginRoute,
	MastersRoute,
	MovesRoute,
	NcrRoute,
	PlanningRoute,
	PoRoute,
	QcRoute,
	QuotesRoute,
	RegistersRoute,
	ShopRoute,
	SoRoute,
	StockRoute: StockRouteWithChildren,
	WoRoute,
	AdminPermissionsRoute,
	DevDocsRoute: DevDocsRoute._addFileChildren(DevDocsRouteChildren),
	DevJourneysRoute,
	GenealogyLotIdRoute,
	SettingsGstRoute,
	ApiAuthSplatRoute,
	PrintChallanIdRoute,
	PrintCnIdRoute,
	PrintCocIdRoute,
	PrintDnIdRoute,
	PrintEwayIdRoute,
	PrintGrnIdRoute,
	PrintInvoiceIdRoute,
	PrintPackingIdRoute,
	PrintQuoteIdRoute,
	PrintReturnIdRoute
};
var routeTree = Route$44._addFileChildren(rootRouteChildren)._addFileTypes();
var router_exports = /* @__PURE__ */ __exportAll({ getRouter: () => getRouter });
function getRouter() {
	return createRouter({
		routeTree,
		defaultErrorComponent: AppErrorComponent
	});
}
//#endregion
export { getGenealogy as A, releaseLot as B, approveStockAdjust as C, explodeSo as D, createWorkOrder as E, listMasters as F, reverseGrn as H, listMoves as I, listOnHand as L, getLotLedger as M, issueToWo as N, getBootstrap as O, listJobWork as P, listOpenDocs as R, AppShell as S, createSalesOrder as T, requestStockAdjust as V, Empty as _, Route$3 as a, Stat as b, Route$6 as c, Route$9 as d, Route$10 as f, Badge as g, Route$16 as h, Route$2 as i, getJourneys as j, getDashboard as k, Route$7 as l, GenealogyView as m, Route as n, Route$4 as o, Route$11 as p, Route$1 as r, Route$5 as s, router_exports as t, Route$8 as u, PageHeader as v, bookWo as w, linesOf as x, Panel as y, postGrn as z };
