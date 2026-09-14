import { a as require_jsx_runtime, i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/react+tanstack__react-query.mjs";
import { i as formatKg, o as n, r as formatINR } from "./format-Bcy9062O.mjs";
import { d as postReceipt, f as postVendorBill, o as listArAp } from "./api-finance-DafwBR3A.mjs";
import { t as Button } from "./button-BKlCONpI.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { S as AppShell, _ as Empty, v as PageHeader, y as Panel } from "./router-Cx8Dk8pR.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/bills-DgsqiKUw.js
var import_jsx_runtime = require_jsx_runtime();
function BillsPage() {
	const qc = useQueryClient();
	const q = useQuery({
		queryKey: ["arap"],
		queryFn: () => listArAp()
	});
	const bill = useMutation({
		mutationFn: (grnId) => postVendorBill({ data: { grnId } }),
		onSuccess: (r) => {
			toast.success(`${r.docNo} · ${formatKg(r.qty)} kg`);
			qc.invalidateQueries();
		},
		onError: (e) => toast.error(e.message)
	});
	const rct = useMutation({
		mutationFn: (p) => postReceipt({ data: p }),
		onSuccess: (r) => {
			toast.success(`${r.docNo} allocated ${formatINR(r.applied)}`);
			qc.invalidateQueries();
		},
		onError: (e) => toast.error(e.message)
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			kicker: "Accounts",
			title: "AR / AP — 3-way bills and FIFO receipts"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
			title: "Unbilled GRNs",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "app-table",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "GRN" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Vendor" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Net kg" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {})
				] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: (q.data?.grns ?? []).map((g) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "font-mono",
						children: g.doc_no
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: g.partner }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular",
						children: formatKg(g.net_kg)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: g.billed ? "Billed" : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						disabled: bill.isPending,
						onClick: () => bill.mutate(g.id),
						children: "3-way bill"
					}) })
				] }, g.id)) })]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
			title: "Vendor bills (MSME due = bill + 45d)",
			className: "mt-3",
			children: (q.data?.bills ?? []).length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "app-table",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Bill" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Vendor" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Due" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Age" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Total" })
				] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: q.data.bills.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "font-mono",
						children: b.doc_no
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", { children: [b.partner_name, b.is_msme ? " · MSME" : ""] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: String(b.due_date).slice(0, 10) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "font-mono",
						children: b.age_band
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular",
						children: formatINR(b.total_paise)
					})
				] }, b.id)) })]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { children: "No vendor bills" })
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
			title: "Open invoices (FIFO receipt)",
			className: "mt-3",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "app-table",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Invoice" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Customer" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Total" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Received" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {})
				] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: (q.data?.invoices ?? []).map((inv) => {
					const open = n(inv.total_paise) - n(inv.received_paise);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "font-mono",
							children: inv.doc_no
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: inv.partner_name }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "tabular",
							children: formatINR(inv.total_paise)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "tabular",
							children: formatINR(inv.received_paise)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: open > 0 && inv.status === "POSTED" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							disabled: rct.isPending,
							onClick: () => rct.mutate({
								partnerId: inv.partner_id,
								amountPaise: open,
								invoiceId: inv.id
							}),
							children: "Receipt"
						}) : "Cleared" })
					] }, inv.id);
				}) })]
			})
		})
	] });
}
//#endregion
export { BillsPage as component };
