import { a as require_jsx_runtime, i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/react+tanstack__react-query.mjs";
import { y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as formatPcs, i as formatKg, o as n, r as formatINR } from "./format-Bcy9062O.mjs";
import { r as getRoleBoard } from "./api-planning-BRCqgLhR.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { O as getBootstrap, S as AppShell, _ as Empty, b as Stat, g as Badge, j as getJourneys, k as getDashboard, v as PageHeader, y as Panel } from "./router-Cx8Dk8pR.mjs";
import { t as deemedSupply } from "./api-gst-Smktkco_.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-vwHIStD-.js
var import_jsx_runtime = require_jsx_runtime();
function Dashboard() {
	const qc = useQueryClient();
	const dash = useQuery({
		queryKey: ["dashboard"],
		queryFn: () => getDashboard()
	});
	const journeys = useQuery({
		queryKey: ["journeys"],
		queryFn: () => getJourneys()
	});
	const board = useQuery({
		queryKey: ["role-board"],
		queryFn: () => getRoleBoard()
	});
	const hideSales = useQuery({
		queryKey: ["bootstrap"],
		queryFn: () => getBootstrap()
	}).data?.staff.role === "SHOP";
	const d = dash.data;
	const done = journeys.data?.steps.filter((s) => s.done).length ?? 0;
	const deemed = useMutation({
		mutationFn: (id) => deemedSupply({ data: { challanId: id } }),
		onSuccess: (r) => {
			toast.success(`Deemed-supply DRAFT ${r.docNo} — dated original challan, not posted`);
			qc.invalidateQueries();
		},
		onError: (e) => toast.error(e.message)
	});
	const b = board.data;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			kicker: "Owner / GM board",
			title: "Metal, lots, and metal outside the factory",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "text-sm text-muted",
				children: [done, "/10 live · CLI pack 17 at Journey pack"]
			})
		}),
		n(d?.onhand.outside_kg) > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-3 rounded-md border border-warn bg-paper px-3 py-2 font-mono text-sm text-navy",
			"data-testid": "metal-outside",
			children: [
				"Metal outside factory: ",
				formatKg(d?.onhand.outside_kg),
				" kg"
			]
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
					label: "Own metal on books",
					value: `${formatKg(d?.onhand.kg)} kg`,
					hint: "Customer metal excluded from value"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
					label: "Inventory value",
					value: formatINR(d?.onhand.value_paise),
					hint: "Weighted avg · own lots only"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
					label: "Metal outside factory",
					value: `${formatKg(d?.onhand.outside_kg)} kg`,
					hint: "Sum of JW-OUT — still our metal",
					warn: n(d?.onhand.outside_kg) > 0
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
					label: "Customer-owned metal",
					value: `${formatKg(d?.onhand.customer_kg)} kg`,
					hint: "Qty-tracked · value = ₹0"
				})
			]
		}),
		b?.owner ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "mb-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mb-2 font-display text-lg text-navy",
				children: "Owner / GM"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OwnerCards, { owner: b.owner })]
		}) : null,
		b?.ppc ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "mb-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mb-2 font-display text-lg text-navy",
				children: "PPC"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PpcCards, { ppc: b.ppc })]
		}) : null,
		b?.stores ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "mb-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mb-2 font-display text-lg text-navy",
				children: "Stores"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoresCards, { stores: b.stores })]
		}) : null,
		b?.qc ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "mb-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mb-2 font-display text-lg text-navy",
				children: "QC"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QcCards, { qc: b.qc })]
		}) : null,
		b?.purchase ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "mb-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mb-2 font-display text-lg text-navy",
				children: "Purchase"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PurchaseCards, { purchase: b.purchase })]
		}) : null,
		b?.sales && !hideSales ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "mb-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mb-2 font-display text-lg text-navy",
				children: "Sales"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SalesCards, { sales: b.sales })]
		}) : null,
		b?.accounts && !hideSales ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "mb-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mb-2 font-display text-lg text-navy",
				children: "Accounts"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AccountsCards, { accounts: b.accounts })]
		}) : null,
		b?.shop ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "mb-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mb-2 font-display text-lg text-navy",
				children: "Shop"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShopCards, { shop: b.shop })]
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-3 grid gap-3 lg:grid-cols-[1.3fr_0.7fr]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "Job-work ageing (180 / 270 / 330 day clock)",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "app-table",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Challan" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Vendor" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Age" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Open pcs" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "kg at vendor" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Statutory due" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Band" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {})
					] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: (d?.ageing ?? []).map((c) => {
						const age = n(c.age_days);
						const band = age >= 330 ? "BLOCK" : age >= 270 ? "330d" : age >= 180 ? "270d" : "OK";
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "font-mono",
								children: c.doc_no
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: c.partner }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
								className: "tabular",
								children: [age, " d"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "tabular",
								children: c.open_pcs
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "tabular",
								children: formatKg(c.kg)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "tabular",
								children: String(c.statutory_due).slice(0, 10)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								tone: age >= 270 ? "HOLD" : "AVAILABLE",
								children: band
							}) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
								className: "whitespace-nowrap",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/print/challan/$id",
									params: { id: String(c.id) },
									className: "text-sm text-navy underline",
									children: "Challan"
								}), age >= 330 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "ml-2 text-sm text-danger underline",
									onClick: () => deemed.mutate(c.id),
									children: "Deemed supply"
								}) : null]
							})
						] }, c.id);
					}) })]
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
					title: "Metal price book (latest)",
					children: d?.price ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-3 gap-2 p-3 font-mono text-sm",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-micro text-muted",
								children: "Cu"
							}), formatINR(d.price.cu_paise_per_kg)] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-micro text-muted",
								children: "Zn"
							}), formatINR(d.price.zn_paise_per_kg)] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-micro text-muted",
								children: "As of"
							}), String(d.price.as_of_date).slice(0, 10)] })
						]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "p-3 text-sm text-muted",
						children: "No price book"
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
					title: "Alloy kg on hand",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "app-table",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Alloy" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "kg" })] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: (d?.alloys ?? []).map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "font-mono",
							children: a.code
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "tabular",
							children: formatKg(a.kg)
						})] }, a.code)) })]
					})
				})]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
			title: "Warehouse kg / pcs",
			className: "mt-3",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "app-table",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Warehouse" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "kg" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "pcs" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {})
				] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: (d?.byWh ?? []).map((w) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-mono",
						children: w.code
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "ml-2 text-muted",
						children: w.name
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular",
						children: formatKg(w.kg)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular",
						children: n(w.pcs).toLocaleString("en-IN")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: w.is_outside_factory ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						tone: "HOLD",
						children: "outside factory"
					}) : null })
				] }, w.code)) })]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "mt-3 text-sm text-muted",
			children: [
				"Walk the seeded books on the",
				" ",
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/journeys",
					className: "text-navy underline",
					children: "10 journeys"
				}),
				" ",
				"board — each step posts real stock. Last CLI pack:",
				" ",
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/dev/journeys",
					className: "text-navy underline",
					children: "/dev/journeys"
				}),
				"."
			]
		})
	] });
}
function DocTable({ rows, empty, cols }) {
	if (!rows.length) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { children: empty });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
		className: "app-table",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: cols.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: c.h }, c.k)) }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: rows.map((r, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: cols.map((c) => {
			const href = c.href?.(r);
			const text = c.fmt ? c.fmt(r[c.k]) : String(r[c.k] ?? "—");
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "font-mono",
				children: href ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
					href: href.to.replace("$id", href.params?.id ?? "").replace("$lotId", href.params?.lotId ?? ""),
					className: "underline",
					children: text
				}) : text
			}, c.k);
		}) }, r.id ?? i)) })]
	});
}
function OwnerCards({ owner }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mb-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
				label: "Booked 30d",
				value: formatINR(owner.bookedPaise),
				hint: "Open SO value"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
				label: "Invoiced 30d",
				value: formatINR(owner.invoicedPaise)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
				label: "OTIF 30d",
				value: owner.otif == null ? "—" : `${owner.otif}%`,
				hint: owner.otifN ? `${owner.otifN} lines` : "No SO in window"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
				label: "Open AR",
				value: formatINR(owner.openArPaise)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
				label: "JW-OUT kg",
				value: `${formatKg(owner.jwKg)} kg`
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
				label: "Inventory (ex JW-IN-CUSTOMER)",
				value: formatINR(owner.inventoryPaise)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
				label: "Latest yield",
				value: owner.yield ? n(owner.yield.variance).toFixed(3) : "—",
				hint: owner.yield ? String(owner.yield.notes) : "No yield pack yet"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
				label: "JW loss ₹ (draft DN)",
				value: formatINR(owner.jwLossPaise)
			}),
			owner.aged270.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "sm:col-span-2",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
					title: "Challans >270d",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DocTable, {
						rows: owner.aged270,
						empty: "No challans over 270 days",
						cols: [
							{
								k: "doc_no",
								h: "Challan",
								href: (r) => ({
									to: "/print/challan/$id",
									params: { id: String(r.id) }
								})
							},
							{
								k: "partner",
								h: "Vendor"
							},
							{
								k: "age_days",
								h: "Age"
							}
						]
					})
				})
			}) : null
		]
	});
}
function PpcCards({ ppc }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mb-3 grid gap-3 lg:grid-cols-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "Latest MRP shortages",
				actions: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/planning",
					className: "text-sm text-navy underline",
					children: "Planning"
				}),
				children: ppc.emptyMrp ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { children: ppc.emptyMrp }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DocTable, {
					rows: ppc.shortages,
					empty: "No shortages",
					cols: [
						{
							k: "sku",
							h: "SKU"
						},
						{
							k: "action",
							h: "Action"
						},
						{
							k: "shortfall_qty",
							h: "Short",
							fmt: (v) => String(v)
						}
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "WOs due this week",
				actions: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/wo",
					className: "text-sm text-navy underline",
					children: "WOs"
				}),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DocTable, {
					rows: ppc.wosThisWeek,
					empty: "No WOs due this week",
					cols: [
						{
							k: "doc_no",
							h: "WO"
						},
						{
							k: "sku",
							h: "SKU"
						},
						{
							k: "due_date",
							h: "Due",
							fmt: (v) => v ? String(v).slice(0, 10) : "—"
						}
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "SO with no promise date",
				actions: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/so",
					className: "text-sm text-navy underline",
					children: "ATP"
				}),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DocTable, {
					rows: ppc.noPromise,
					empty: "All open SO have a promise date",
					cols: [{
						k: "doc_no",
						h: "SO"
					}, {
						k: "sku",
						h: "SKU"
					}]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "Bottleneck %",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DocTable, {
					rows: ppc.bottleneck,
					empty: "No work centres",
					cols: [
						{
							k: "code",
							h: "WC"
						},
						{
							k: "load_pct",
							h: "Load %",
							fmt: (v) => `${n(v).toFixed(1)}%`
						},
						{
							k: "queue_days",
							h: "Queue d"
						}
					]
				})
			})
		]
	});
}
function StoresCards({ stores }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mb-3 grid gap-3 lg:grid-cols-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "GRN pending QC",
				actions: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/qc",
					className: "text-sm underline",
					children: "QC"
				}),
				children: stores.emptyQc ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { children: stores.emptyQc }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DocTable, {
					rows: stores.grnQc,
					empty: stores.emptyQc ?? "",
					cols: [
						{
							k: "doc_no",
							h: "QI"
						},
						{
							k: "lot_no",
							h: "Lot"
						},
						{
							k: "sku",
							h: "SKU"
						}
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "HOLD / QUARANTINE lots",
				actions: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/stock",
					className: "text-sm underline",
					children: "Lots"
				}),
				children: stores.emptyHold ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { children: stores.emptyHold }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DocTable, {
					rows: stores.hold,
					empty: stores.emptyHold ?? "",
					cols: [
						{
							k: "lot_no",
							h: "Lot"
						},
						{
							k: "sku",
							h: "SKU"
						},
						{
							k: "warehouse",
							h: "Whs"
						}
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "Below min kg",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DocTable, {
					rows: stores.belowMin,
					empty: "No RM below min",
					cols: [
						{
							k: "sku",
							h: "SKU"
						},
						{
							k: "kg",
							h: "On hand",
							fmt: (v) => formatKg(v)
						},
						{
							k: "min_qty_kg",
							h: "Min",
							fmt: (v) => formatKg(v)
						}
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "JW returns due",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DocTable, {
					rows: stores.jwDue,
					empty: "No JW returns due",
					cols: [
						{
							k: "doc_no",
							h: "Challan"
						},
						{
							k: "partner",
							h: "Vendor"
						},
						{
							k: "expected_return_at",
							h: "Due",
							fmt: (v) => String(v).slice(0, 10)
						}
					]
				})
			})
		]
	});
}
function QcCards({ qc }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mb-3 grid gap-3 lg:grid-cols-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
			title: "QUARANTINE",
			actions: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/qc",
				className: "text-sm underline",
				children: "QC"
			}),
			children: qc.emptyQ ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { children: qc.emptyQ }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DocTable, {
				rows: qc.quarantine,
				empty: qc.emptyQ ?? "",
				cols: [
					{
						k: "lot_no",
						h: "Lot"
					},
					{
						k: "sku",
						h: "SKU"
					},
					{
						k: "warehouse",
						h: "Whs"
					}
				]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
			title: "Open NCR",
			actions: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/ncr",
				className: "text-sm underline",
				children: "NCR"
			}),
			children: qc.emptyNcr ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { children: qc.emptyNcr }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DocTable, {
				rows: qc.ncr,
				empty: qc.emptyNcr ?? "",
				cols: [{
					k: "doc_no",
					h: "NCR"
				}, {
					k: "description",
					h: "Desc"
				}]
			})
		})]
	});
}
function PurchaseCards({ purchase }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mb-3 grid gap-3 lg:grid-cols-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
			title: "CREATE_PO lines",
			actions: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/planning",
				className: "text-sm underline",
				children: "MRP"
			}),
			children: purchase.emptyPo ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { children: purchase.emptyPo }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DocTable, {
				rows: purchase.createPo,
				empty: purchase.emptyPo ?? "",
				cols: [{
					k: "sku",
					h: "SKU"
				}, {
					k: "suggested_qty",
					h: "Qty",
					fmt: (v) => formatKg(v)
				}]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
			title: "Last GRN",
			actions: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/grn",
				className: "text-sm underline",
				children: "GRN"
			}),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DocTable, {
				rows: purchase.lastGrn,
				empty: "No GRN yet",
				cols: [
					{
						k: "doc_no",
						h: "GRN"
					},
					{
						k: "sku",
						h: "SKU"
					},
					{
						k: "partner",
						h: "Vendor"
					},
					{
						k: "net_kg",
						h: "kg",
						fmt: (v) => formatKg(v)
					}
				]
			})
		})]
	});
}
function SalesCards({ sales }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mb-3 grid gap-3 lg:grid-cols-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "Quotes expiring 7d",
				actions: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/quotes",
					className: "text-sm underline",
					children: "Quotes"
				}),
				children: sales.emptyExp ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { children: sales.emptyExp }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DocTable, {
					rows: sales.expiring,
					empty: sales.emptyExp ?? "",
					cols: [
						{
							k: "doc_no",
							h: "QTN"
						},
						{
							k: "partner",
							h: "Customer"
						},
						{
							k: "valid_until",
							h: "Until",
							fmt: (v) => String(v).slice(0, 10)
						}
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "Credit-blocked SO",
				children: sales.emptyBlocked ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { children: sales.emptyBlocked }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DocTable, {
					rows: sales.blocked,
					empty: sales.emptyBlocked ?? "",
					cols: [{
						k: "doc_no",
						h: "SO"
					}, {
						k: "partner",
						h: "Customer"
					}]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "Late SO",
				actions: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/so",
					className: "text-sm underline",
					children: "SO"
				}),
				children: sales.emptyLate ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { children: sales.emptyLate }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DocTable, {
					rows: sales.late,
					empty: sales.emptyLate ?? "",
					cols: [
						{
							k: "doc_no",
							h: "SO"
						},
						{
							k: "sku",
							h: "SKU"
						},
						{
							k: "promise_date",
							h: "Promise",
							fmt: (v) => String(v).slice(0, 10)
						}
					]
				})
			})
		]
	});
}
function AccountsCards({ accounts }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mb-3 grid gap-3 lg:grid-cols-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "Unbilled FG receipts",
				actions: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/bills",
					className: "text-sm underline",
					children: "AR / AP"
				}),
				children: accounts.emptyUnbilled ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { children: accounts.emptyUnbilled }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DocTable, {
					rows: accounts.unbilled,
					empty: accounts.emptyUnbilled ?? "",
					cols: [
						{
							k: "lot_no",
							h: "Lot"
						},
						{
							k: "sku",
							h: "SKU"
						},
						{
							k: "qty_pcs",
							h: "Pcs",
							fmt: (v) => formatPcs(v)
						}
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "Unmatched GRN",
				actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "space-x-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/books",
						className: "text-sm underline",
						children: "Books"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/gst",
						className: "text-sm underline",
						children: "GST worksheets"
					})]
				}),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DocTable, {
					rows: accounts.unmatchedGrn,
					empty: "No unmatched GRN",
					cols: [{
						k: "doc_no",
						h: "GRN"
					}, {
						k: "partner",
						h: "Vendor"
					}]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "Challans >270d",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DocTable, {
					rows: accounts.aged270,
					empty: "No challans over 270 days",
					cols: [{
						k: "doc_no",
						h: "Challan",
						href: (r) => ({
							to: "/print/challan/$id",
							params: { id: String(r.id) }
						})
					}, {
						k: "age_days",
						h: "Age"
					}]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "Draft debit notes",
				children: accounts.emptyDn ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { children: accounts.emptyDn }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DocTable, {
					rows: accounts.draftDn,
					empty: accounts.emptyDn ?? "",
					cols: [
						{
							k: "doc_no",
							h: "DN"
						},
						{
							k: "original_invoice_no",
							h: "Against"
						},
						{
							k: "total_paise",
							h: "₹",
							fmt: (v) => formatINR(v)
						}
					]
				})
			})
		]
	});
}
function ShopCards({ shop }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mb-3 grid gap-3 lg:grid-cols-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
			title: "My open WOs",
			actions: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/shop",
				className: "text-sm underline",
				children: "Shop"
			}),
			children: shop.emptyWo ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { children: shop.emptyWo }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DocTable, {
				rows: shop.openWos,
				empty: shop.emptyWo ?? "",
				cols: [
					{
						k: "doc_no",
						h: "WO"
					},
					{
						k: "sku",
						h: "SKU"
					},
					{
						k: "qty_pcs",
						h: "Pcs",
						fmt: (v) => formatPcs(v)
					}
				]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
			label: "Yesterday scrap vs issued",
			value: `${formatKg(shop.yesterdayScrapKg)} kg`,
			hint: `issued ${formatKg(shop.yesterdayIssuedKg)} kg`
		})]
	});
}
//#endregion
export { Dashboard as component };
