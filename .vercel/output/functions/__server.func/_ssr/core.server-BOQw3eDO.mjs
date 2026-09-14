import { r as __exportAll } from "../_runtime.mjs";
import { t as __exportAll$1 } from "./rolldown-runtime-D7D4PA-g.mjs";
import { r as getSql } from "./db-PusRM2bZ.mjs";
import { n as DEMO_USERS, r as PERMS, t as DEMO_PASSWORD } from "./constants-D3MrD-wy.mjs";
import { r as hashPassword } from "../_libs/better-auth__utils.mjs";
import { randomBytes } from "node:crypto";
//#region node_modules/.nitro/vite/services/ssr/assets/core.server-BOQw3eDO.js
var core_server_BOQw3eDO_exports = /* @__PURE__ */ __exportAll({
	a: () => nextDoc,
	i: () => erpSql,
	n: () => audit,
	o: () => requireStaff,
	r: () => core_server_exports,
	s: () => setting,
	t: () => assertPerm
});
var core_server_exports = /* @__PURE__ */ __exportAll$1({
	assertPerm: () => assertPerm,
	audit: () => audit,
	erpSql: () => erpSql,
	nextDoc: () => nextDoc,
	requireStaff: () => requireStaff,
	setting: () => setting
});
var seedPromise = null;
async function erpSql() {
	const sql = await getSql();
	seedPromise ??= seedDemoUsers(sql).catch((err) => {
		seedPromise = null;
		throw err;
	});
	await seedPromise;
	return sql;
}
async function seedDemoUsers(sql) {
	for (const u of DEMO_USERS) {
		let userId = (await sql.query(`select id from "user" where email = $1`, [u.email]))[0]?.id;
		if (!userId) {
			userId = randomBytes(16).toString("hex");
			const password = await hashPassword(DEMO_PASSWORD);
			const now = /* @__PURE__ */ new Date();
			await sql.query(`insert into "user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
         values ($1, $2, $3, true, $4, $4)`, [
				userId,
				u.name,
				u.email,
				now
			]);
			await sql.query(`insert into account (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
         values ($1, $2, 'credential', $3, $4, $5, $5)`, [
				randomBytes(16).toString("hex"),
				userId,
				userId,
				password,
				now
			]);
		}
		if (!(await sql.query(`select id from staff where email = $1`, [u.email]))[0]) await sql.query(`insert into staff (user_id, name, email, role, active) values ($1, $2, $3, $4, true)
         on conflict (user_id) do nothing`, [
			userId,
			u.name,
			u.email,
			u.role
		]);
		else await sql.query(`update staff set user_id = $1, role = $2, name = $3 where email = $4`, [
			userId,
			u.role,
			u.name,
			u.email
		]);
	}
}
async function requireStaff(userId) {
	const sql = await erpSql();
	const rows = await sql.query(`select id, user_id, name, email, role, active from staff where user_id = $1 and active = true`, [userId]);
	if (rows[0]) return rows[0];
	const u = (await sql.query(`select id, name, email from "user" where id = $1`, [userId]))[0];
	const name = u?.name || "Grok viewer";
	const email = u?.email || `${userId}@tambaerp.in`;
	await sql.query(`insert into staff (user_id, name, email, role, active) values ($1, $2, $3, 'OWNER', true)
     on conflict (user_id) do nothing`, [
		userId,
		name,
		email
	]);
	const again = await sql.query(`select id, user_id, name, email, role, active from staff where user_id = $1`, [userId]);
	if (!again[0]) throw new Error("Could not provision staff profile");
	return again[0];
}
function assertPerm(staff, perm) {
	if (!PERMS[perm].includes(staff.role)) {
		erpSql().then((sql) => audit(sql, {
			userId: staff.user_id,
			action: "PERM_DENY",
			entity: perm,
			after: {
				role: staff.role,
				perm
			}
		})).catch(() => void 0);
		throw new Error(`${staff.role} cannot perform ${perm.replace("_", " ")}`);
	}
}
async function nextDoc(sql, docType) {
	const r = (await sql.query(`update number_series set next_no = next_no + 1 where doc_type = $1
     returning prefix, (next_no - 1)::int as n, pad`, [docType]))[0];
	if (!r) throw new Error(`No number series for ${docType}`);
	return `${r.prefix}${String(r.n).padStart(r.pad, "0")}`;
}
async function audit(sql, opts) {
	await sql.query(`insert into audit_log (user_id, action, entity, entity_id, before_json, after_json)
     values ($1, $2, $3, $4, $5, $6)`, [
		opts.userId ?? null,
		opts.action,
		opts.entity,
		opts.entityId != null ? String(opts.entityId) : null,
		opts.before ? JSON.stringify(opts.before) : null,
		opts.after ? JSON.stringify(opts.after) : null
	]);
}
async function setting(sql, key, fallback) {
	return (await sql.query(`select value from settings where key = $1`, [key]))[0]?.value ?? fallback;
}
//#endregion
export { nextDoc as a, erpSql as i, audit as n, requireStaff as o, core_server_BOQw3eDO_exports as r, setting as s, assertPerm as t };
