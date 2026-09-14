import { o as __toESM } from "../_runtime.mjs";
import { a as require_jsx_runtime, i as useQueryClient, n as useQuery, o as require_react, t as useMutation } from "../_libs/react+tanstack__react-query.mjs";
import { a as formatPcs, i as formatKg, o as n } from "./format-Bcy9062O.mjs";
import { _ as yieldGap, g as woCompleteCheck } from "./rules-ctSmlA2x.mjs";
import { t as Button } from "./button-BKlCONpI.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { R as listOpenDocs, S as AppShell, w as bookWo } from "./router-Cx8Dk8pR.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/shop-DPF_-sDC.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ShopPage() {
	const qc = useQueryClient();
	const open = (useQuery({
		queryKey: ["docs"],
		queryFn: () => listOpenDocs()
	}).data?.wos ?? []).filter((w) => w.status === "ISSUED" || w.status === "OPEN");
	const [woId, setWoId] = (0, import_react.useState)("");
	const [good, setGood] = (0, import_react.useState)("9820");
	const [rej, setRej] = (0, import_react.useState)("80");
	const [scrap, setScrap] = (0, import_react.useState)("6.400");
	const wo = open.find((w) => String(w.id) === (woId || String(open[0]?.id)));
	const kgPer = n(wo?.kg_per_pc);
	const issued = n(wo?.issued_kg);
	const gate = (0, import_react.useMemo)(() => woCompleteCheck({
		issuedKg: issued,
		goodPcs: n(good),
		rejectPcs: n(rej),
		kgPerPc: kgPer,
		tolerancePct: .5
	}), [
		issued,
		good,
		rej,
		kgPer
	]);
	const gap = (0, import_react.useMemo)(() => yieldGap({
		issuedKg: issued,
		goodKg: n(good) * kgPer,
		rejectKg: n(rej) * kgPer,
		scrapKg: n(scrap)
	}), [
		issued,
		good,
		rej,
		scrap,
		kgPer
	]);
	const mut = useMutation({
		mutationFn: () => bookWo({ data: {
			woId: Number(woId || wo?.id),
			goodPcs: n(good),
			rejectPcs: n(rej),
			scrapKg: n(scrap)
		} }),
		onSuccess: (r) => {
			toast.success(`Booked · FG ${r.fgLotNo ?? "—"} · turning ${r.scrapLotNo ?? "—"} · runner ${r.runnerKg} kg · gap ${r.yieldGapKg} kg`);
			qc.invalidateQueries();
		},
		onError: (e) => toast.error(e.message)
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-xl",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mb-4 text-micro font-medium uppercase tracking-[0.16em] text-brass-deep",
				children: "Shop supervisor"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-3xl text-navy",
				children: "Booking"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mb-5 text-sm text-muted",
				children: "Only good pcs, reject pcs, scrap kg. Nothing else."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "space-y-4 rounded-lg border border-line bg-paper p-5",
				onSubmit: (e) => {
					e.preventDefault();
					mut.mutate();
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "block",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mb-1 block text-micro uppercase tracking-wide text-muted",
							children: "Work order"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
							className: "h-14 w-full rounded-md border border-line bg-cream px-3 text-lg",
							value: woId || String(wo?.id ?? ""),
							onChange: (e) => setWoId(e.target.value),
							children: open.map((w) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
								value: w.id,
								children: [
									w.doc_no,
									" · ",
									w.sku
								]
							}, w.id))
						})]
					}),
					wo ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-2 rounded-md bg-cream px-3 py-2 font-mono text-sm",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								"Issued ",
								formatKg(wo.issued_kg),
								" kg"
							] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								"Plan ",
								formatPcs(wo.qty_pcs),
								" pcs"
							] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								"Theoretical ",
								formatKg(gate.theoreticalKg),
								" kg"
							] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: ["kg/pc ", kgPer.toFixed(3)] })
						]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: "Issue rod to a WO first."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "block",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mb-1 block text-micro uppercase tracking-wide text-muted",
							children: "Good pcs"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "h-16 w-full rounded-md border border-line bg-cream px-3 font-mono text-3xl tabular",
							value: good,
							onChange: (e) => setGood(e.target.value),
							inputMode: "numeric"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "block",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mb-1 block text-micro uppercase tracking-wide text-muted",
							children: "Reject pcs"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "h-16 w-full rounded-md border border-line bg-cream px-3 font-mono text-3xl tabular",
							value: rej,
							onChange: (e) => setRej(e.target.value),
							inputMode: "numeric"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "block",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mb-1 block text-micro uppercase tracking-wide text-muted",
							children: "Scrap kg (turning)"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "h-16 w-full rounded-md border border-line bg-cream px-3 font-mono text-3xl tabular",
							value: scrap,
							onChange: (e) => setScrap(e.target.value),
							inputMode: "decimal"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-md border border-line bg-cream px-3 py-2 font-mono text-sm",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								"Accounted ",
								formatKg(gap.accountedKg),
								" kg"
							] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								"Yield gap ",
								formatKg(gap.remainderKg),
								" kg",
								gap.remainderKg > 5e-4 ? " → runner if backflush on" : ""
							] }),
							!gate.ok ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-1 text-danger",
								children: gate.message
							}) : null
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						size: "shop",
						className: "w-full",
						disabled: mut.isPending || !wo || !gate.ok,
						children: "Post booking"
					})
				]
			})
		]
	}) });
}
//#endregion
export { ShopPage as component };
