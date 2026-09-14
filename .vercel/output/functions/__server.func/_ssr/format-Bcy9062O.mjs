import { n as createMiddleware } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/format-Bcy9062O.js
/**
* Auth middleware for server functions — the standard way to get the caller's
* verified user id. When deployed the session cookie is same-origin and rides
* along automatically. In the live preview the client also forwards the bearer
* token (partitioned cookies) via the `.client` hook below — call sites do not
* thread it themselves.
*
*   import { createServerFn } from "@tanstack/react-start";
*   import { getSql } from "@/lib/db";
*   import { authMiddleware } from "@/lib/auth/middleware";
*
*   export const listTodos = createServerFn({ method: "GET" })
*     .middleware([authMiddleware])
*     .handler(async ({ context }) => {
*       const sql = await getSql();
*       return sql`select * from todos where user_id = ${context.userId}`;
*     });
*
* Signed out with auth on (live preview included) -> throws `UnauthorizedError`
* (see `verify.server.ts`). With auth disabled (`VITE_AUTH_ENABLED=false`, the
* shipped default) it resolves the shared dev user — but throws instead when a
* `DATABASE_URL` is also set, so an app without sign-in must not use this at
* all. On the auth-on path, use it on every server function that touches
* per-user data and scope every query by `context.userId`.
*/
var authMiddleware = createMiddleware({ type: "function" }).client(async ({ next }) => {
	const { getBearerToken } = await import("./client-CVqXY6bk.mjs").then((n) => n.n).then((n) => n.n);
	return next({ sendContext: { bearerToken: getBearerToken() ?? void 0 } });
}).server(async ({ next, context }) => {
	const { assertSameSiteRequest } = await import("./isolation.server-CGNg1r0B.mjs");
	const { requireUserId } = await import("./verify.server-CbSjgVJZ.mjs");
	assertSameSiteRequest();
	return next({ context: { userId: await requireUserId(context.bearerToken) } });
});
function n(v) {
	if (v == null || v === "") return 0;
	const x = typeof v === "number" ? v : Number(v);
	return Number.isFinite(x) ? x : 0;
}
function roundKg(v) {
	return Math.round(v * 1e3) / 1e3;
}
function formatKg(v) {
	return n(v).toLocaleString("en-IN", {
		minimumFractionDigits: 3,
		maximumFractionDigits: 3
	});
}
function formatPcs(v) {
	return n(v).toLocaleString("en-IN", { maximumFractionDigits: 0 });
}
function formatINR(paise) {
	return new Intl.NumberFormat("en-IN", {
		style: "currency",
		currency: "INR"
	}).format(n(paise) / 100);
}
function todayISO() {
	return (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
}
function addDaysISO(iso, days) {
	const d = /* @__PURE__ */ new Date(iso + "T00:00:00Z");
	d.setUTCDate(d.getUTCDate() + days);
	return d.toISOString().slice(0, 10);
}
//#endregion
export { formatPcs as a, todayISO as c, formatKg as i, authMiddleware as n, n as o, formatINR as r, roundKg as s, addDaysISO as t };
