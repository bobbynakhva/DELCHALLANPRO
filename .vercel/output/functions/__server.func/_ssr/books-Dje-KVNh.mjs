import { a as require_jsx_runtime, i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/react+tanstack__react-query.mjs";
import { r as formatINR } from "./format-Bcy9062O.mjs";
import { a as getTrialBalance, c as listPeriods, p as setPeriodStatus, s as listJournals } from "./api-finance-DafwBR3A.mjs";
import { t as Button } from "./button-BKlCONpI.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { S as AppShell, _ as Empty, v as PageHeader, y as Panel } from "./router-Cx8Dk8pR.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/books-Dje-KVNh.js
var import_jsx_runtime = require_jsx_runtime();
function BooksPage() {
	const qc = useQueryClient();
	const tb = useQuery({
		queryKey: ["tb"],
		queryFn: () => getTrialBalance()
	});
	const jv = useQuery({
		queryKey: ["journals"],
		queryFn: () => listJournals()
	});
	const periods = useQuery({
		queryKey: ["periods"],
		queryFn: () => listPeriods()
	});
	const lock = useMutation({
		mutationFn: (p) => setPeriodStatus({ data: p }),
		onSuccess: (r) => {
			toast.success(`${r.yearMonth} → ${r.status}`);
			qc.invalidateQueries({ queryKey: ["periods"] });
		},
		onError: (e) => toast.error(e.message)
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			kicker: "Accounts",
			title: "Chart of accounts and journals",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-sm text-muted",
				children: tb.data?.balanced ? "Trial balance in square" : "Trial balance out of square"
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
			title: "Trial balance (paise)",
			children: !tb.data?.rows.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { children: "No journals yet" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "app-table",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Code" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Account" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Dr" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Cr" })
				] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", { children: [tb.data.rows.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "font-mono",
						children: r.code
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: r.name }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular",
						children: formatINR(r.debit)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular",
						children: formatINR(r.credit)
					})
				] }, r.code)), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						colSpan: 2,
						className: "font-semibold",
						children: "Total"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular font-semibold",
						children: formatINR(tb.data.debit)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular font-semibold",
						children: formatINR(tb.data.credit)
					})
				] })] })]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
			title: "Period lock",
			className: "mt-3",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "app-table",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Month" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Status" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {})
				] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: (periods.data ?? []).map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "font-mono",
						children: String(p.year_month)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: String(p.status) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "space-x-1",
						children: [
							"OPEN",
							"SOFT_CLOSE",
							"LOCKED"
						].map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: "ghost",
							disabled: lock.isPending,
							onClick: () => lock.mutate({
								yearMonth: String(p.year_month),
								status: s
							}),
							children: s
						}, s))
					})
				] }, String(p.year_month))) })]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
			title: "Recent journals",
			className: "mt-3",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "app-table",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "JV" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Date" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Narration" })
				] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: (jv.data?.headers ?? []).map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "font-mono",
						children: h.doc_no
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: String(h.jv_date).slice(0, 10) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: h.narration })
				] }, h.id)) })]
			})
		})
	] });
}
//#endregion
export { BooksPage as component };
