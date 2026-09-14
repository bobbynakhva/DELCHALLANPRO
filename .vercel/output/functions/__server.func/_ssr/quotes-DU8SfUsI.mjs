import { o as __toESM } from "../_runtime.mjs";
import { a as require_jsx_runtime, i as useQueryClient, n as useQuery, o as require_react, t as useMutation } from "../_libs/react+tanstack__react-query.mjs";
import { y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { c as todayISO, o as n, r as formatINR } from "./format-Bcy9062O.mjs";
import { t as Button } from "./button-BKlCONpI.mjs";
import { n as Input, r as Select, t as Field } from "./input-CysPhmQ2.mjs";
import { o as previewQuote } from "./api-planning-BRCqgLhR.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { F as listMasters, O as getBootstrap, R as listOpenDocs, S as AppShell, v as PageHeader, x as linesOf, y as Panel } from "./router-Cx8Dk8pR.mjs";
import { i as createQuote, o as postMetalPrice } from "./api-sales-Cw_pBp-x.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/quotes-DU8SfUsI.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function QuotesPage() {
	const qc = useQueryClient();
	const masters = useQuery({
		queryKey: ["masters"],
		queryFn: () => listMasters()
	});
	const docs = useQuery({
		queryKey: ["docs"],
		queryFn: () => listOpenDocs()
	});
	const hideMargin = useQuery({
		queryKey: ["bootstrap"],
		queryFn: () => getBootstrap()
	}).data?.staff.role === "SHOP";
	const latest = masters.data?.prices[0];
	const customers = (masters.data?.partners ?? []).filter((p) => p.is_customer);
	const fgs = (masters.data?.items ?? []).filter((i) => i.type === "FG");
	const [cu, setCu] = (0, import_react.useState)("");
	const [zn, setZn] = (0, import_react.useState)("");
	const [scrap, setScrap] = (0, import_react.useState)("");
	const [source, setSource] = (0, import_react.useState)("manual");
	const [partnerId, setPartnerId] = (0, import_react.useState)("");
	const [itemId, setItemId] = (0, import_react.useState)("");
	const [qty, setQty] = (0, import_react.useState)("10000");
	const [asOf, setAsOf] = (0, import_react.useState)(todayISO());
	const [basis, setBasis] = (0, import_react.useState)("CU_ZN_BLEND");
	const [marginPct, setMarginPct] = (0, import_react.useState)("3.9");
	const defItem = fgs.find((i) => i.sku === "HEX-NIPPLE-1/2-NCR")?.id;
	const resolvedItem = Number(itemId || defItem || 0);
	const preview = useQuery({
		queryKey: [
			"preview-quote",
			resolvedItem,
			asOf,
			basis,
			marginPct
		],
		queryFn: () => previewQuote({ data: {
			itemId: resolvedItem,
			asOf,
			basis,
			marginPct: n(marginPct)
		} }),
		enabled: resolvedItem > 0
	});
	const instruments = (0, import_react.useMemo)(() => {
		const date = latest ? String(latest.as_of_date).slice(0, 10) : "";
		return (masters.data?.priceLines ?? []).filter((l) => String(l.as_of_date).slice(0, 10) === date);
	}, [masters.data, latest]);
	const priceMut = useMutation({
		mutationFn: () => postMetalPrice({ data: {
			asOfDate: todayISO(),
			cuPaisePerKg: Math.round(n(cu || n(latest?.cu_paise_per_kg) / 100 + 20) * 100),
			znPaisePerKg: Math.round(n(zn || n(latest?.zn_paise_per_kg) / 100) * 100),
			pbPaisePerKg: n(latest?.pb_paise_per_kg),
			scrapPaisePerKg: Math.round(n(scrap || 410) * 100),
			source
		} }),
		onSuccess: () => {
			toast.success("Price book posted — SENT quotes stay frozen");
			qc.invalidateQueries();
		},
		onError: (e) => toast.error(e.message)
	});
	const qmut = useMutation({
		mutationFn: () => createQuote({ data: {
			partnerId: Number(partnerId || customers.find((c) => c.code === "C-GS")?.id),
			itemId: resolvedItem,
			qtyPcs: n(qty),
			asOf,
			basis,
			marginPct: n(marginPct)
		} }),
		onSuccess: (r) => {
			toast.success(`${r.docNo} frozen ${formatINR(r.unitPricePaise)} on ${r.snapshot.metal_rate_date} — SENT`);
			qc.invalidateQueries();
		},
		onError: (e) => toast.error(e.message)
	});
	const snap = preview.data;
	const firstQuote = [...docs.data?.quotes ?? []].sort((a, b) => n(a.id) - n(b.id))[0];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			kicker: "Sales / accounts",
			title: "Quotations — freeze metal rates",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-sm text-muted",
				children: "Not a tax invoice. SENT snapshot never rewrites."
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-3 lg:grid-cols-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "space-y-2 rounded-md border border-line bg-paper p-3",
				onSubmit: (e) => {
					e.preventDefault();
					priceMut.mutate();
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-sm font-semibold text-navy",
						children: "Metal book — instruments ₹/kg"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-micro text-muted",
						children: ["Live ", latest ? `Cu ${formatINR(latest.cu_paise_per_kg)} · Zn ${formatINR(latest.zn_paise_per_kg)} as of ${String(latest.as_of_date).slice(0, 10)}` : "—"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-2 sm:grid-cols-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Cu ₹/kg (CU_INR_KG)",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: cu,
									placeholder: latest ? String(n(latest.cu_paise_per_kg) / 100 + 20) : "870",
									onChange: (e) => setCu(e.target.value)
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Zn ₹/kg (ZN_INR_KG)",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: zn,
									placeholder: latest ? String(n(latest.zn_paise_per_kg) / 100) : "272",
									onChange: (e) => setZn(e.target.value)
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Scrap ₹/kg (BRASS_SCRAP_C360_KG)",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: scrap,
									placeholder: "410",
									onChange: (e) => setScrap(e.target.value)
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Source",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
									value: source,
									onChange: (e) => setSource(e.target.value),
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "manual",
											children: "manual"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "MCX",
											children: "MCX"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "dealer",
											children: "dealer"
										})
									]
								})
							})
						]
					}),
					instruments.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-mono text-micro text-muted",
						children: instruments.map((i) => `${i.instrument} ${formatINR(i.rate_paise_per_kg)}`).join(" · ")
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						variant: "navy",
						className: "w-full",
						disabled: priceMut.isPending,
						children: "Post new metal rate"
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "space-y-2 rounded-md border border-line bg-paper p-3",
				onSubmit: (e) => {
					e.preventDefault();
					qmut.mutate();
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-sm font-semibold text-navy",
						children: "Live formula — then freeze"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Customer",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Select, {
							value: partnerId || String(customers.find((c) => c.code === "C-GS")?.id ?? ""),
							onChange: (e) => setPartnerId(e.target.value),
							children: customers.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: p.id,
								children: p.name
							}, p.id))
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Item",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Select, {
							value: itemId || String(defItem ?? ""),
							onChange: (e) => setItemId(e.target.value),
							children: fgs.map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: i.id,
								children: i.sku
							}, i.id))
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Qty pcs",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: qty,
								onChange: (e) => setQty(e.target.value)
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Metal rate date (≤ today)",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								type: "date",
								value: asOf,
								max: todayISO(),
								onChange: (e) => setAsOf(e.target.value)
							})
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Quote metal basis",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
								value: basis,
								onChange: (e) => setBasis(e.target.value),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "CU_ZN_BLEND",
									children: "CU_ZN_BLEND (alloy chemistry)"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "ALLOY_DEALER_RATE",
									children: "ALLOY_DEALER_RATE (scrap)"
								})]
							})
						}), hideMargin ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Margin %",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: marginPct,
								onChange: (e) => setMarginPct(e.target.value)
							})
						})]
					}),
					preview.isError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-danger",
						children: preview.error.message
					}) : snap ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-sm border border-line bg-cream px-2 py-2 font-mono text-micro text-navy",
						"data-testid": "quote-working",
						children: [(hideMargin ? snap.working.filter((w) => !/margin/i.test(w)) : snap.working).map((w) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: w }, w)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-1 font-semibold",
							children: hideMargin ? "Unit price hidden for shop" : `Unit ex-GST ${formatINR(snap.unit_price_paise)}`
						})]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: "Pick an item to see the live formula."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						className: "w-full",
						disabled: qmut.isPending,
						children: "Freeze rates & save"
					})
				]
			})]
		}),
		firstQuote && latest ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "mt-3 rounded-md border border-line bg-paper px-3 py-2 font-mono text-sm text-navy",
			children: [
				"Frozen quote ",
				firstQuote.doc_no,
				" Cu ",
				formatINR(firstQuote.cu_paise_per_kg),
				" vs live ",
				formatINR(latest.cu_paise_per_kg),
				n(firstQuote.cu_paise_per_kg) !== n(latest.cu_paise_per_kg) ? " — SENT snapshot unchanged" : ""
			]
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
			title: "Quote register (frozen Cu never rewrites)",
			className: "mt-3",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "app-table",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Doc" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Status" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Customer" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Rate date" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Cu snapshot" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Item" }),
					hideMargin ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Metal" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Unit" })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {})
				] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: (docs.data?.quotes ?? []).map((q) => {
					const ln = linesOf(q.lines)[0];
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "font-mono",
							children: q.doc_no
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "font-mono",
							children: q.status
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: q.partner_name }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "tabular",
							children: String(q.metal_rate_date).slice(0, 10)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "tabular",
							children: formatINR(q.cu_paise_per_kg)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "font-mono",
							children: ln?.sku
						}),
						hideMargin ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "tabular",
							children: formatINR(ln?.metal_paise)
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "tabular font-medium",
							children: formatINR(ln?.unit_price_paise)
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/print/quote/$id",
							params: { id: String(q.id) },
							className: "text-sm text-navy underline",
							children: "Print"
						}) })
					] }, q.id);
				}) })]
			})
		})
	] });
}
//#endregion
export { QuotesPage as component };
