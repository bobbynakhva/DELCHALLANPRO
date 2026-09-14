import { o as __toESM } from "../_runtime.mjs";
import { a as require_jsx_runtime, i as useQueryClient, n as useQuery, o as require_react, t as useMutation } from "../_libs/react+tanstack__react-query.mjs";
import { y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as formatPcs, i as formatKg, o as n, r as formatINR } from "./format-Bcy9062O.mjs";
import { t as Button } from "./button-BKlCONpI.mjs";
import { n as Input, r as Select, t as Field } from "./input-CysPhmQ2.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { L as listOnHand, O as getBootstrap, R as listOpenDocs, S as AppShell, v as PageHeader, x as linesOf, y as Panel } from "./router-Cx8Dk8pR.mjs";
import { a as dispatchSo, c as stubIrn } from "./api-sales-Cw_pBp-x.mjs";
import { m as stubEway } from "./api-gst-Smktkco_.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/dispatch-CcW5ucj2.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function DispatchPage() {
	const qc = useQueryClient();
	const docs = useQuery({
		queryKey: ["docs"],
		queryFn: () => listOpenDocs()
	});
	const lots = useQuery({
		queryKey: ["onhand"],
		queryFn: () => listOnHand()
	});
	const boot = useQuery({
		queryKey: ["bootstrap"],
		queryFn: () => getBootstrap()
	});
	const [soId, setSoId] = (0, import_react.useState)("");
	const [lotId, setLotId] = (0, import_react.useState)("");
	const [qty, setQty] = (0, import_react.useState)("5000");
	const [ownerOverride, setOwnerOverride] = (0, import_react.useState)(false);
	const sos = docs.data?.sos ?? [];
	const nippleSo = sos.find((s) => linesOf(s.lines)[0]?.sku === "HEX-NIPPLE-1/2-NCR");
	const selectedSo = sos.find((s) => String(s.id) === (soId || String(nippleSo?.id ?? sos[0]?.id))) ?? sos[0];
	const soSku = linesOf(selectedSo?.lines)[0]?.sku;
	const fgLots = (lots.data ?? []).filter((l) => l.status === "AVAILABLE" && n(l.qty_pcs) > 0 && (l.warehouse === "FG-DOM" || l.warehouse === "FG-EXP") && (!soSku || l.sku === soSku));
	const mut = useMutation({
		mutationFn: () => dispatchSo({ data: {
			soId: Number(soId || selectedSo?.id),
			lotId: Number(lotId || fgLots[0]?.id),
			qtyPcs: n(qty),
			ownerOverride
		} }),
		onSuccess: (r) => {
			toast.success(`${r.invoiceNo} net ${r.netKg} kg = packing ${r.packingNetKg} kg`);
			qc.invalidateQueries();
		},
		onError: (e) => toast.error(e.message)
	});
	const irn = useMutation({
		mutationFn: (invoiceId) => stubIrn({ data: { invoiceId } }),
		onSuccess: (r) => {
			toast.success(`IRP stub IRN ${r.irn}`);
			qc.invalidateQueries();
		},
		onError: (e) => toast.error(e.message)
	});
	const eway = useMutation({
		mutationFn: (invoiceId) => stubEway({ data: {
			docType: "INVOICE",
			docId: invoiceId,
			reasonCode: "1",
			vehicle: "GJ01AB4421",
			distanceKm: 18
		} }),
		onSuccess: (r) => {
			toast.success(`e-way stub ${r.stubNo} — not NIC-signed`);
			qc.invalidateQueries();
		},
		onError: (e) => toast.error(e.message)
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			kicker: "Sales / accounts",
			title: "Dispatch — tax invoice + packing list"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mb-2 text-micro text-muted",
			children: "IRN cannot be cancelled after 24 hours — use a credit / debit note (s.34). e-way and IRN are stubs, not NIC."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			className: "mb-3 grid gap-2 rounded-md border border-line bg-paper p-3 md:grid-cols-4",
			onSubmit: (e) => {
				e.preventDefault();
				mut.mutate();
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Sales order",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Select, {
						value: soId || String(selectedSo?.id ?? ""),
						onChange: (e) => setSoId(e.target.value),
						children: sos.map((s) => {
							const ln = linesOf(s.lines)[0];
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
								value: s.id,
								children: [
									s.doc_no,
									" · ",
									ln?.sku
								]
							}, s.id);
						})
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "FG lot (AVAILABLE)",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Select, {
						value: lotId || String(fgLots[0]?.id ?? ""),
						onChange: (e) => setLotId(e.target.value),
						children: fgLots.map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
							value: l.id,
							children: [
								l.lot_no,
								" · ",
								l.sku,
								" · ",
								formatPcs(l.qty_pcs)
							]
						}, l.id))
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Pcs",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: qty,
						onChange: (e) => setQty(e.target.value)
					})
				}),
				boot.data?.staff.role === "OWNER" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "flex items-end gap-2 pb-2 text-sm text-navy",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "checkbox",
						checked: ownerOverride,
						onChange: (e) => setOwnerOverride(e.target.checked)
					}), "Override credit / overdue"]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "self-end pb-2 text-micro text-muted",
					children: "Credit / overdue blocks dispatch unless Owner overrides."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex items-end",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						className: "w-full",
						disabled: mut.isPending,
						children: "Dispatch + invoice"
					})
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
			title: "Invoices",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "app-table",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Invoice" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Customer" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Taxable" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "GST" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Total" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Net kg" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Packing kg" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "IRN" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {})
				] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: (docs.data?.invoices ?? []).map((inv) => {
					const gst = n(inv.cgst_paise) + n(inv.sgst_paise) + n(inv.igst_paise);
					const match = n(inv.net_kg) === n(inv.packing_net_kg);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "font-mono",
							children: inv.doc_no
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: inv.partner_name }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "tabular",
							children: formatINR(inv.taxable_paise)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "tabular",
							children: formatINR(gst)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "tabular",
							children: formatINR(inv.total_paise)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "tabular",
							children: formatKg(inv.net_kg)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
							className: "tabular",
							children: [
								formatKg(inv.packing_net_kg),
								" ",
								match ? "✓" : "≠"
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "max-w-32 truncate font-mono text-micro",
							children: inv.irn ?? "—"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
							className: "space-x-2 whitespace-nowrap",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/print/invoice/$id",
									params: { id: String(inv.id) },
									className: "text-navy underline",
									children: "Invoice"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/print/packing/$id",
									params: { id: String(inv.id) },
									className: "text-navy underline",
									children: "Packing"
								}),
								!inv.irn ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "sm",
									variant: "ghost",
									onClick: () => irn.mutate(inv.id),
									children: "IRP stub"
								}) : null,
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "sm",
									variant: "ghost",
									onClick: () => eway.mutate(inv.id),
									children: "e-way stub"
								})
							]
						})
					] }, inv.id);
				}) })]
			})
		})
	] });
}
//#endregion
export { DispatchPage as component };
