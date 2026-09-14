import { r as __exportAll } from "../_runtime.mjs";
import { t as __exportAll$1 } from "./rolldown-runtime-D7D4PA-g.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/constants-D3MrD-wy.js
var constants_D3MrD_wy_exports = /* @__PURE__ */ __exportAll({
	a: () => constants_exports,
	i: () => ROLE_LABEL,
	n: () => DEMO_USERS,
	r: () => PERMS,
	t: () => DEMO_PASSWORD
});
var constants_exports = /* @__PURE__ */ __exportAll$1({
	DEMO_PASSWORD: () => DEMO_PASSWORD,
	DEMO_USERS: () => DEMO_USERS,
	PERMS: () => PERMS,
	ROLES: () => ROLES,
	ROLE_LABEL: () => ROLE_LABEL
});
var ROLES = [
	"OWNER",
	"PPC",
	"STORES",
	"PURCHASE",
	"SALES",
	"QC",
	"ACCOUNTS",
	"SHOP",
	"ADMIN"
];
var ROLE_LABEL = {
	OWNER: "Owner / GM",
	PPC: "PPC",
	STORES: "Stores",
	PURCHASE: "Purchase",
	SALES: "Sales",
	QC: "QC",
	ACCOUNTS: "Accounts",
	SHOP: "Shop supervisor",
	ADMIN: "Admin"
};
var DEMO_PASSWORD = "Tamba@2026";
var DEMO_USERS = [
	{
		email: "owner@tambaerp.in",
		name: "Kavita Mehta",
		role: "OWNER"
	},
	{
		email: "ppc@tambaerp.in",
		name: "Jignesh Rana",
		role: "PPC"
	},
	{
		email: "stores@tambaerp.in",
		name: "Rakesh Solanki",
		role: "STORES"
	},
	{
		email: "purchase@tambaerp.in",
		name: "Meena Desai",
		role: "PURCHASE"
	},
	{
		email: "sales@tambaerp.in",
		name: "Farhan Qureshi",
		role: "SALES"
	},
	{
		email: "qc@tambaerp.in",
		name: "Anjali Trivedi",
		role: "QC"
	},
	{
		email: "accounts@tambaerp.in",
		name: "Suresh Iyer",
		role: "ACCOUNTS"
	},
	{
		email: "shop@tambaerp.in",
		name: "Dinesh Chauhan",
		role: "SHOP"
	},
	{
		email: "admin@tambaerp.in",
		name: "IT Admin",
		role: "ADMIN"
	}
];
var PERMS = {
	price_edit: [
		"OWNER",
		"ACCOUNTS",
		"ADMIN",
		"PURCHASE"
	],
	stock_adjust: [
		"OWNER",
		"STORES",
		"ADMIN"
	],
	qc_release: [
		"OWNER",
		"QC",
		"ADMIN"
	],
	booking: [
		"OWNER",
		"SHOP",
		"PPC",
		"ADMIN"
	],
	jw: [
		"OWNER",
		"PPC",
		"STORES",
		"ADMIN"
	],
	sales: [
		"OWNER",
		"SALES",
		"ADMIN",
		"PPC"
	],
	purchase: [
		"OWNER",
		"PURCHASE",
		"STORES",
		"ADMIN"
	],
	invoice: [
		"OWNER",
		"ACCOUNTS",
		"SALES",
		"ADMIN"
	],
	masters: [
		"OWNER",
		"ADMIN",
		"PPC"
	],
	view: ROLES
};
//#endregion
export { constants_D3MrD_wy_exports as a, ROLE_LABEL as i, DEMO_USERS as n, PERMS as r, DEMO_PASSWORD as t };
