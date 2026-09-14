import { o as __toESM } from "../_runtime.mjs";
import { a as require_jsx_runtime, o as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { x as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as ROLE_LABEL, n as DEMO_USERS, t as DEMO_PASSWORD } from "./constants-D3MrD-wy.mjs";
import { r as signIn, t as authClient } from "./client-CVqXY6bk.mjs";
import { t as GROK_PROVIDERS } from "./server-C-lEYxUh.mjs";
import { r as useCurrentUserState } from "./utils-C_uf36nf.mjs";
import { t as Button } from "./button-BKlCONpI.mjs";
import { n as Input, t as Field } from "./input-CysPhmQ2.mjs";
import { n as toast } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/login-XbgoU5uP.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Login() {
	const { user, isPending } = useCurrentUserState();
	const navigate = useNavigate();
	const [email, setEmail] = (0, import_react.useState)("owner@tambaerp.in");
	const [password, setPassword] = (0, import_react.useState)(DEMO_PASSWORD);
	const [busy, setBusy] = (0, import_react.useState)(false);
	if (!isPending && user) navigate({ to: "/" });
	async function onEmail(e) {
		e.preventDefault();
		setBusy(true);
		try {
			const { error } = await authClient.signIn.email({
				email,
				password
			});
			if (error) throw new Error(error.message ?? "Sign-in failed");
			toast.success("Signed in");
			await navigate({ to: "/" });
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Sign-in failed");
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "grid min-h-screen bg-navy lg:grid-cols-[1.1fr_0.9fr]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "hidden flex-col justify-between p-10 text-cream lg:flex",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "font-display text-4xl text-brass-soft",
				children: "Tamba ERP"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 max-w-md text-sm text-cream/70",
				children: "Brass parts books of record — dual UOM, alloy lots, job-work challans, GST tax invoices. Ahmedabad. FY 2026-27."
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
				className: "max-w-sm space-y-2 text-sm text-cream/80",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "kg for melt, scrap and valuation · pcs for customers and packing" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Scrap is inventory of the same alloy, never an expense dump" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Our metal at a vendor stays on our books in JW-OUT" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Customer metal is qty-tracked and does not inflate value" })
				]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
			className: "flex items-center justify-center bg-cream p-6",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "w-full max-w-md space-y-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "font-display text-3xl text-navy lg:hidden",
							children: "Tamba ERP"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "text-xl font-semibold text-navy",
							children: "Sign in"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-sm text-muted",
							children: ["Seeded shop logins share password ", DEMO_PASSWORD]
						})
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						onSubmit: onEmail,
						className: "space-y-3 rounded-md border border-line bg-paper p-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Email",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: email,
									onChange: (e) => setEmail(e.target.value),
									autoComplete: "username"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Password",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									type: "password",
									value: password,
									onChange: (e) => setPassword(e.target.value),
									autoComplete: "current-password"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "submit",
								className: "w-full",
								disabled: busy,
								children: busy ? "Signing in…" : "Sign in with password"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex flex-wrap gap-1.5",
						children: DEMO_USERS.map((u) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => {
								setEmail(u.email);
								setPassword(DEMO_PASSWORD);
							},
							className: "rounded-sm border border-line bg-paper px-2 py-1 text-micro text-navy hover:border-brass",
							children: ROLE_LABEL[u.role]
						}, u.email))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-center text-micro uppercase tracking-wide text-muted",
							children: "or"
						}), GROK_PROVIDERS.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							type: "button",
							variant: "ghost",
							className: "w-full",
							onClick: () => signIn(p.providerId, { callbackURL: "/" }),
							children: ["Continue with ", p.label]
						}, p.providerId))]
					})
				]
			})
		})]
	});
}
//#endregion
export { Login as component };
