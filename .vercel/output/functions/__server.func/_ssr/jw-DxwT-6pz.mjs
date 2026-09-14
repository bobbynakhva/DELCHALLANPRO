import { o as __toESM } from "../_runtime.mjs";
import { a as require_jsx_runtime, i as useQueryClient, n as useQuery, o as require_react, t as useMutation } from "../_libs/react+tanstack__react-query.mjs";
import { y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { r as createServerFn } from "./ssr.mjs";
import { a as formatPcs, i as formatKg, n as authMiddleware, o as n, r as formatINR, s as roundKg } from "./format-Bcy9062O.mjs";
import { t as createSsrRpc } from "./createSsrRpc-B2Izd0c7.mjs";
import { _n as object, bn as string } from "../_libs/@better-auth/core+[...].mjs";
import { n as number } from "../_libs/zod.mjs";
import { d as jwLossWorking } from "./rules-ctSmlA2x.mjs";
import { t as Button } from "./button-BKlCONpI.mjs";
import { n as Input, r as Select, t as Field } from "./input-CysPhmQ2.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { F as listMasters, L as listOnHand, P as listJobWork, S as AppShell, g as Badge, v as PageHeader, x as linesOf, y as Panel } from "./router-Cx8Dk8pR.mjs";
import { m as stubEway, t as deemedSupply } from "./api-gst-Smktkco_.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/jw-DxwT-6pz.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var issueJobWork = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	partnerId: number(),
	processCode: string().min(1),
	lotId: number(),
	qtyPcs: number().positive(),
	vehicleNo: string().optional(),
	expectedDays: number().min(1).default(14)
})).handler(createSsrRpc("037449f58b34ac7a0ea456be98a230cdfc363672635ba9ba543a5b7bf6056ace"));
var returnJobWork = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	challanId: number(),
	goodPcs: number().min(0),
	rejectPcs: number().min(0),
	shortPcs: number().min(0),
	scrapReturnedKg: number().min(0).default(0),
	scrapRetainedKg: number().min(0).default(0)
})).handler(createSsrRpc("8d5bb1e0d90f1e3d5bd764832304ed31b81cde781078567c532aa5cc736fbd21"));
var receiveCustomerMetal = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	partnerId: number(),
	itemId: number(),
	heatNo: string().min(1),
	qtyKg: number().positive(),
	qtyPcs: number().min(0).default(0)
})).handler(createSsrRpc("dcafefd676d434c8ab10767c96d0d478ee0db47cf6e255a1baa57961479674da"));
var consumeCustomerMetal = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	lotId: number(),
	qtyKg: number().positive(),
	qtyPcs: number().min(0).default(0)
})).handler(createSsrRpc("5faca6e55e412aa96a3c0739aff6a9ddf5d2c96330d41520f86dbf04581a0d43"));
var returnCustomerFg = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	lotId: number(),
	qtyKg: number().positive(),
	qtyPcs: number().min(0).default(0)
})).handler(createSsrRpc("98ef5f7cd6542123f51338b9ca1bd5a5026b44e28a8d4a436ab57b724dc88ce7"));
createServerFn({ method: "GET" }).middleware([authMiddleware]).validator(object({ id: number() })).handler(createSsrRpc("7ed3a66492bd27b1e274017d88864301f385eea06578842b7f006e2fa638e3d0"));
function JwPage() {
	const qc = useQueryClient();
	const jw = useQuery({
		queryKey: ["jw"],
		queryFn: () => listJobWork()
	});
	const masters = useQuery({
		queryKey: ["masters"],
		queryFn: () => listMasters()
	});
	const lots = useQuery({
		queryKey: ["onhand"],
		queryFn: () => listOnHand()
	});
	const workers = (masters.data?.partners ?? []).filter((p) => p.is_job_worker);
	const kiran = workers.find((p) => p.code === "V-KIRAN");
	const sourceLots = (lots.data ?? []).filter((l) => l.status === "AVAILABLE" && l.owner_type === "OWN" && n(l.qty_pcs) > 0 && l.warehouse !== "JW-OUT");
	const openChallans = (jw.data?.challans ?? []).filter((c) => c.status !== "CLOSED");
	const defaultReturn = openChallans.find((c) => {
		return linesOf(c.lines)[0]?.sku === "HEX-NIPPLE-1/2-NCR";
	}) ?? openChallans[0];
	const [partnerId, setPartnerId] = (0, import_react.useState)("");
	const [lotId, setLotId] = (0, import_react.useState)("");
	const [pcs, setPcs] = (0, import_react.useState)("9820");
	const [process, setProcess] = (0, import_react.useState)("NI_CR");
	const [challanId, setChallanId] = (0, import_react.useState)("");
	const [good, setGood] = (0, import_react.useState)("9700");
	const [rej, setRej] = (0, import_react.useState)("80");
	const [short, setShort] = (0, import_react.useState)("40");
	const [scrapReturned, setScrapReturned] = (0, import_react.useState)("0");
	const [scrapRetained, setScrapRetained] = (0, import_react.useState)("0");
	const [inPartner, setInPartner] = (0, import_react.useState)("");
	const [inItem, setInItem] = (0, import_react.useState)("");
	const [inHeat, setInHeat] = (0, import_react.useState)("GS-HEAT-NEW");
	const [inKg, setInKg] = (0, import_react.useState)("100.000");
	const [custLot, setCustLot] = (0, import_react.useState)("");
	const [custKg, setCustKg] = (0, import_react.useState)("10.000");
	const selectedChallan = openChallans.find((c) => String(c.id) === (challanId || String(defaultReturn?.id))) ?? defaultReturn;
	const chLine = selectedChallan ? linesOf(selectedChallan.lines)[0] : void 0;
	const sentKg = n(chLine?.qty_kg);
	const sentPcs = n(chLine?.qty_pcs);
	const kgPer = sentPcs > 0 ? sentKg / sentPcs : .048;
	const liveWorking = jwLossWorking({
		sentKg,
		goodKg: roundKg(n(good) * kgPer),
		rejectKg: roundKg(n(rej) * kgPer),
		scrapReturnedKg: n(scrapReturned),
		scrapRetainedKg: n(scrapRetained),
		lossNormPct: n(selectedChallan?.loss_norm_pct ?? 1.5)
	});
	const customers = (masters.data?.partners ?? []).filter((p) => p.is_customer);
	const rods = (masters.data?.items ?? []).filter((i) => i.type === "RM");
	const gs = customers.find((p) => p.code === "C-GS");
	const rod12 = rods.find((i) => i.sku === "ROD-C360-12MM");
	const customerLots = (lots.data ?? []).filter((l) => l.owner_type === "CUSTOMER" && n(l.qty_kg) > 0);
	const out = useMutation({
		mutationFn: () => issueJobWork({ data: {
			partnerId: Number(partnerId || kiran?.id),
			lotId: Number(lotId || sourceLots[0]?.id),
			qtyPcs: n(pcs),
			processCode: process
		} }),
		onSuccess: (r) => {
			toast.success(`${r.docNo} · ${r.qtyKg} kg in JW-OUT · due ${r.statutoryDue}`);
			qc.invalidateQueries();
		},
		onError: (e) => toast.error(e.message)
	});
	const ret = useMutation({
		mutationFn: () => returnJobWork({ data: {
			challanId: Number(challanId || defaultReturn?.id),
			goodPcs: n(good),
			rejectPcs: n(rej),
			shortPcs: n(short),
			scrapReturnedKg: n(scrapReturned),
			scrapRetainedKg: n(scrapRetained)
		} }),
		onSuccess: (r) => {
			toast.success(`${r.docNo} · sent ${r.working.sentKg} accounted ${r.working.accountedKg} loss ${r.working.actualLossKg} excess ${r.working.excessLossKg} · DN ${r.debitNoteNo}`);
			qc.invalidateQueries();
		},
		onError: (e) => toast.error(e.message)
	});
	const receiveIn = useMutation({
		mutationFn: () => receiveCustomerMetal({ data: {
			partnerId: Number(inPartner || gs?.id),
			itemId: Number(inItem || rod12?.id),
			heatNo: inHeat,
			qtyKg: n(inKg)
		} }),
		onSuccess: (r) => {
			toast.success(`JW-IN ${r.lotNo} · ${r.qtyKg} kg · value ₹0`);
			qc.invalidateQueries();
		},
		onError: (e) => toast.error(e.message)
	});
	const consumeIn = useMutation({
		mutationFn: () => consumeCustomerMetal({ data: {
			lotId: Number(custLot || customerLots[0]?.id),
			qtyKg: n(custKg)
		} }),
		onSuccess: (r) => {
			toast.success(`Consumed ${r.qtyKg} kg from ${r.lotNo} · value ₹0`);
			qc.invalidateQueries();
		},
		onError: (e) => toast.error(e.message)
	});
	const returnIn = useMutation({
		mutationFn: () => returnCustomerFg({ data: {
			lotId: Number(custLot || customerLots[0]?.id),
			qtyKg: n(custKg)
		} }),
		onSuccess: (r) => {
			toast.success(`Returned ${r.qtyKg} kg from ${r.lotNo} to customer`);
			qc.invalidateQueries();
		},
		onError: (e) => toast.error(e.message)
	});
	const deemed = useMutation({
		mutationFn: (id) => deemedSupply({ data: { challanId: id } }),
		onSuccess: (r) => {
			toast.success(`Deemed-supply DRAFT ${r.docNo} dated original challan — not posted`);
			qc.invalidateQueries();
		},
		onError: (e) => toast.error(e.message)
	});
	const eway = useMutation({
		mutationFn: (id) => stubEway({ data: {
			docType: "CHALLAN",
			docId: id,
			reasonCode: "3",
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
			kicker: "Job work is manufacturing",
			title: "Outward challans, 365-day clock, returns"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-3 lg:grid-cols-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "space-y-2 rounded-md border border-line bg-paper p-3",
				onSubmit: (e) => {
					e.preventDefault();
					out.mutate();
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-sm font-semibold text-navy",
						children: "Issue JW OUT"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Job worker",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Select, {
							value: partnerId || String(kiran?.id ?? ""),
							onChange: (e) => setPartnerId(e.target.value),
							children: workers.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: p.id,
								children: p.name
							}, p.id))
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Process",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
							value: process,
							onChange: (e) => setProcess(e.target.value),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "NI_CR",
								children: "Ni-Cr plate"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "POLISH",
								children: "Polish"
							})]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Source lot (AVAILABLE, in factory)",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Select, {
							value: lotId || String(sourceLots[0]?.id ?? ""),
							onChange: (e) => setLotId(e.target.value),
							children: sourceLots.map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
								value: l.id,
								children: [
									l.lot_no,
									" · ",
									l.sku,
									" · ",
									formatPcs(l.qty_pcs),
									" pcs"
								]
							}, l.id))
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Pcs",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: pcs,
							onChange: (e) => setPcs(e.target.value)
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						className: "w-full",
						disabled: out.isPending,
						children: "Issue challan"
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "space-y-2 rounded-md border border-line bg-paper p-3",
				onSubmit: (e) => {
					e.preventDefault();
					ret.mutate();
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-sm font-semibold text-navy",
						children: "Return from vendor"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Open challan",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Select, {
							value: challanId || String(defaultReturn?.id ?? ""),
							onChange: (e) => setChallanId(e.target.value),
							children: openChallans.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
								value: c.id,
								children: [
									c.doc_no,
									" · ",
									c.partner_name,
									" · ",
									c.age_days,
									"d"
								]
							}, c.id))
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-3 gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Good pcs",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: good,
									onChange: (e) => setGood(e.target.value)
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Reject pcs",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: rej,
									onChange: (e) => setRej(e.target.value)
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Short pcs",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: short,
									onChange: (e) => setShort(e.target.value)
								})
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Scrap returned kg",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: scrapReturned,
								onChange: (e) => setScrapReturned(e.target.value)
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Scrap retained kg",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: scrapRetained,
								onChange: (e) => setScrapRetained(e.target.value)
							})
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-md border border-line bg-cream px-3 py-2 font-mono text-xs leading-5",
						"data-testid": "jw-working",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								"sent ",
								formatKg(liveWorking.sentKg),
								" kg"
							] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								"accounted ",
								formatKg(liveWorking.accountedKg),
								" kg = good + reject + scrap returned + scrap retained"
							] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								"actualLoss ",
								formatKg(liveWorking.actualLossKg),
								" kg = sent − accounted"
							] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								"norm ",
								formatKg(liveWorking.normKg),
								" kg (",
								n(selectedChallan?.loss_norm_pct ?? 1.5).toFixed(1),
								"%)"
							] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								"excess ",
								formatKg(liveWorking.excessLossKg),
								" kg = max(0, actualLoss − norm)"
							] })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						className: "w-full",
						disabled: ret.isPending,
						children: "Post return + debit draft"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-micro text-muted",
						children: "Excess vs vendor loss-norm drafts a debit note. Scrap retained stays on books until invoiced (s.143(5))."
					})
				]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
			title: "Job work IN — customer metal (value ₹0)",
			className: "mt-3",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3 p-3 md:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					className: "space-y-2",
					onSubmit: (e) => {
						e.preventDefault();
						receiveIn.mutate();
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-sm font-semibold text-navy",
							children: "Receive customer metal"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Customer",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Select, {
								value: inPartner || String(gs?.id ?? ""),
								onChange: (e) => setInPartner(e.target.value),
								children: customers.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: p.id,
									children: p.name
								}, p.id))
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Item",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Select, {
								value: inItem || String(rod12?.id ?? ""),
								onChange: (e) => setInItem(e.target.value),
								children: rods.map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: i.id,
									children: i.sku
								}, i.id))
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Heat",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: inHeat,
								onChange: (e) => setInHeat(e.target.value)
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "kg",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: inKg,
								onChange: (e) => setInKg(e.target.value)
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "submit",
							disabled: receiveIn.isPending,
							children: "Receive to JW-IN-CUSTOMER"
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					className: "space-y-2",
					onSubmit: (e) => {
						e.preventDefault();
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-sm font-semibold text-navy",
							children: "Consume / return leftover"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Customer lot",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Select, {
								value: custLot || String(customerLots[0]?.id ?? ""),
								onChange: (e) => setCustLot(e.target.value),
								children: customerLots.map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
									value: l.id,
									children: [
										l.lot_no,
										" · ",
										l.sku,
										" · ",
										formatKg(l.qty_kg),
										" kg"
									]
								}, l.id))
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "kg",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: custKg,
								onChange: (e) => setCustKg(e.target.value)
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								disabled: consumeIn.isPending || !customerLots.length,
								onClick: () => consumeIn.mutate(),
								children: "Consume"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								variant: "ghost",
								disabled: returnIn.isPending || !customerLots.length,
								onClick: () => returnIn.mutate(),
								children: "Return leftover"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-micro text-muted",
							children: "Valuation reports exclude JW-IN-CUSTOMER. Bill conversion as SAC 9988, not the metal."
						})
					]
				})]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
			title: "Challans",
			className: "mt-3",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "app-table",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Doc" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Vendor" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Process" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Age" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Line" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "kg" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Due +365d" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {})
				] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: (jw.data?.challans ?? []).map((c) => {
					const lines = linesOf(c.lines);
					const age = n(c.age_days);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "font-mono",
							children: c.doc_no
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: c.partner_name }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: c.process_code }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
							className: "tabular",
							children: [
								age,
								" d ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									tone: age >= 270 ? "HOLD" : "AVAILABLE",
									children: age >= 330 ? "BLOCK" : age >= 180 ? "watch" : "ok"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
							className: "font-mono",
							children: [
								lines[0]?.sku,
								" × ",
								formatPcs(lines[0]?.qty_pcs)
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "tabular",
							children: formatKg(lines[0]?.qty_kg)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "tabular",
							children: String(c.statutory_due).slice(0, 10)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/print/challan/$id",
								params: { id: String(c.id) },
								className: "text-sm text-navy underline",
								children: "GST challan"
							}),
							age >= 330 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "ml-2 text-sm text-danger underline",
								onClick: () => deemed.mutate(c.id),
								children: "Deemed supply draft"
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "ml-2 text-sm text-navy underline",
								onClick: () => eway.mutate(c.id),
								children: "e-way stub"
							})
						] })
					] }, c.id);
				}) })]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
			title: "Returns / debit drafts",
			className: "mt-3",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "app-table",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Doc" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Challan" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Good" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Reject" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Short" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Loss % / norm" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "DN" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Debit" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {})
				] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: (jw.data?.returns ?? []).map((r) => {
					const loss = r.loss;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "font-mono",
							children: r.doc_no
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "font-mono",
							children: r.challan_no
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "tabular",
							children: formatPcs(r.good_pcs)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "tabular",
							children: formatPcs(r.reject_pcs)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "tabular",
							children: formatPcs(r.short_pcs)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
							className: "tabular",
							children: [
								n(loss?.actual_loss_pct).toFixed(2),
								"% / ",
								n(loss?.norm_pct).toFixed(2),
								"%"
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
							className: "font-mono",
							children: [
								loss?.debit_note_no,
								" ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									tone: loss?.debit_status,
									children: loss?.debit_status
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "tabular",
							children: formatINR(loss?.debit_paise)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/print/return/$id",
							params: { id: String(r.id) },
							className: "text-sm text-navy underline",
							children: "Return challan"
						}) })
					] }, r.id);
				}) })]
			})
		})
	] });
}
//#endregion
export { JwPage as component };
