import { o as n$1 } from "./format-Bcy9062O.mjs";
import { s as setting } from "./core.server-BOQw3eDO.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/load-DNjC2Qxz.js
/**
* Quotation engine — alloy chemistry from the master, never a hardcoded 61.5/35.5.
* A SENT quote is a snapshot; changing MetalPrice must not rewrite it.
*/
function n(v) {
	if (v == null || v === "") return 0;
	const x = typeof v === "number" ? v : Number(v);
	return Number.isFinite(x) ? x : 0;
}
var FORMULA_BLEND = "metal = kgPerPc × recoveryFactor × blended(alloy Cu/Zn/Pb × book); unit = metal + conversion + jw + packing + overhead + margin";
var FORMULA_DEALER = "metal = kgPerPc × recoveryFactor × dealer(BRASS_SCRAP_C360_KG); unit = metal + conversion + jw + packing + overhead + margin";
function blendFromAlloy(alloy, book) {
	return Math.round(n(alloy.cuPct) / 100 * n(book.cuPaisePerKg) + n(alloy.znPct) / 100 * n(book.znPaisePerKg) + n(alloy.pbPct) / 100 * n(book.pbPaisePerKg));
}
function metalRatePaisePerKg(opts) {
	if (opts.basis === "ALLOY_DEALER_RATE") return n(opts.book.brassScrapPaisePerKg);
	return blendFromAlloy(opts.alloy, opts.book);
}
function splitTariffs(tariffs) {
	if (!tariffs || tariffs.length === 0) return {
		conversionPaise: 0,
		jwPaise: 0,
		reason: "NO_ROUTING"
	};
	let conversionPaise = 0;
	let jwPaise = 0;
	let reason = null;
	for (const t of tariffs) {
		if (t.source === "NO_ROUTING") reason = "NO_ROUTING";
		if (t.isSubcontract || t.source === "PARTNER_RATE") jwPaise += t.paisePerPc;
		else conversionPaise += t.paisePerPc;
	}
	return {
		conversionPaise,
		jwPaise,
		reason
	};
}
function buildQuote(input) {
	const recovery = n(input.recoveryFactor) || 1.08;
	const kgPer = n(input.kgPerPc);
	const blended = metalRatePaisePerKg({
		alloy: input.alloy,
		book: input.book,
		basis: input.basis
	});
	const metalPaise = Math.round(kgPer * recovery * blended);
	const split = input.tariffs ? splitTariffs(input.tariffs) : {
		conversionPaise: 0,
		jwPaise: 0,
		reason: null
	};
	const conversionPaise = input.tariffs ? split.conversionPaise : n(input.conversionPaise);
	const jwPaise = input.tariffs ? split.jwPaise : n(input.jwPaise);
	const packingPaise = n(input.packingPaise);
	const overheadPaise = n(input.overheadPaise);
	const subtotal = metalPaise + conversionPaise + jwPaise + packingPaise + overheadPaise;
	const marginPct = n(input.marginPct);
	const marginPaise = marginPct > 0 ? Math.round(subtotal * (marginPct / 100)) : n(input.marginPaise);
	const unitPricePaise = subtotal + marginPaise;
	const effectivePct = subtotal > 0 ? marginPaise / subtotal * 100 : 0;
	const working = [];
	working.push(`Alloy ${input.alloy.code}: Cu ${n(input.alloy.cuPct).toFixed(3)}% · Zn ${n(input.alloy.znPct).toFixed(3)}% · Pb ${n(input.alloy.pbPct).toFixed(3)}% (master, not hardcoded)`);
	working.push(`Book ${input.book.asOfDate} (${input.book.source}): Cu ₹${(n(input.book.cuPaisePerKg) / 100).toFixed(2)}/kg · Zn ₹${(n(input.book.znPaisePerKg) / 100).toFixed(2)}/kg · Pb ₹${(n(input.book.pbPaisePerKg) / 100).toFixed(2)}/kg`);
	if (input.basis === "CU_ZN_BLEND") working.push(`Blended = ${n(input.alloy.cuPct).toFixed(3)}%×Cu + ${n(input.alloy.znPct).toFixed(3)}%×Zn + ${n(input.alloy.pbPct).toFixed(3)}%×Pb = ₹${(blended / 100).toFixed(2)}/kg`);
	else working.push(`Dealer brass scrap C360 = ₹${(n(input.book.brassScrapPaisePerKg) / 100).toFixed(2)}/kg`);
	working.push(`Metal = ${kgPer} kg/pc × ${recovery} recovery × ₹${(blended / 100).toFixed(2)} = ₹${(metalPaise / 100).toFixed(2)}`);
	working.push(`Conversion ₹${(conversionPaise / 100).toFixed(2)} · JW/plating ₹${(jwPaise / 100).toFixed(2)} · packing ₹${(packingPaise / 100).toFixed(2)} · overhead ₹${(overheadPaise / 100).toFixed(2)}`);
	working.push(`Margin ${effectivePct.toFixed(2)}% = ₹${(marginPaise / 100).toFixed(2)} → unit ex-GST ₹${(unitPricePaise / 100).toFixed(2)}`);
	return {
		formula: input.basis === "ALLOY_DEALER_RATE" ? FORMULA_DEALER : FORMULA_BLEND,
		alloy: input.alloy.code,
		cu_pct: n(input.alloy.cuPct),
		zn_pct: n(input.alloy.znPct),
		pb_pct: n(input.alloy.pbPct),
		kg_per_pc: kgPer,
		recovery_factor: recovery,
		metal_rate_date: input.book.asOfDate,
		metal_basis: input.basis,
		metal_source: input.book.source,
		cu_paise_per_kg: n(input.book.cuPaisePerKg),
		zn_paise_per_kg: n(input.book.znPaisePerKg),
		pb_paise_per_kg: n(input.book.pbPaisePerKg),
		brass_scrap_paise_per_kg: n(input.book.brassScrapPaisePerKg),
		blended_paise_per_kg: blended,
		metal_paise: metalPaise,
		conversion_paise: conversionPaise,
		jw_paise: jwPaise,
		packing_paise: packingPaise,
		overhead_paise: overheadPaise,
		margin_paise: marginPaise,
		margin_pct: Math.round(effectivePct * 1e3) / 1e3,
		unit_price_paise: unitPricePaise,
		hsn: input.hsn ?? "",
		gst_rate_pct: n(input.gstRatePct) || 18,
		conversion_reason: input.conversionReason ?? split.reason,
		working,
		tariffs: input.tariffs ?? []
	};
}
function assertRateDateNotFuture(rateDate, today) {
	if (rateDate > today) throw new Error(`Metal rate date ${rateDate} is in the future — pick today or earlier`);
}
async function loadMetalBook(sql, asOf) {
	const header = (await sql.query(`select as_of_date, cu_paise_per_kg, zn_paise_per_kg, pb_paise_per_kg, source
         from metal_price where as_of_date <= $1 order by as_of_date desc limit 1`, [asOf]))[0];
	if (!header) throw new Error(`No metal price book on or before ${asOf}`);
	const lines = await sql.query(`select instrument, rate_paise_per_kg, source from metal_price_line where as_of_date = $1`, [header.as_of_date]);
	const pick = (inst, fallback) => n$1(lines.find((l) => l.instrument === inst)?.rate_paise_per_kg) || fallback;
	return {
		asOfDate: String(header.as_of_date).slice(0, 10),
		source: header.source || lines[0]?.source || "manual",
		cuPaisePerKg: pick("CU_INR_KG", header.cu_paise_per_kg),
		znPaisePerKg: pick("ZN_INR_KG", header.zn_paise_per_kg),
		pbPaisePerKg: pick("PB_INR_KG", header.pb_paise_per_kg),
		brassScrapPaisePerKg: pick("BRASS_SCRAP_C360_KG", 41e3)
	};
}
function mapProcess(code) {
	const c = code.toUpperCase();
	if (c === "MACHINE" || c === "TURN" || c === "TURN_AUTO") return "TURN_AUTO";
	if (c === "NI_CR" || c === "PLATE" || c === "PLATE_NICR") return "PLATE_NICR";
	if (c === "POLISH") return "POLISH";
	if (c === "PACK" || c === "PACK_EXPORT") return "PACK_EXPORT";
	return c;
}
async function loadTariffs(sql, opts) {
	const ops = await sql.query(`select ro.process_code, ro.is_subcontract, ro.default_jw_partner_id
       from routing r join routing_op ro on ro.routing_id = r.id
      where r.item_id = $1 and r.status = 'APPROVED'
      order by ro.seq`, [opts.itemId]);
	if (!ops[0]) return {
		bites: [],
		hasRouting: false
	};
	const bites = [];
	for (const op of ops) {
		const code = mapProcess(op.process_code);
		if (op.is_subcontract) {
			const rate = (await sql.query(`select rate_paise_per_pc from partner_process_rate
            where process_code = $1
              and (item_family = $2 or item_family = '')
              and ($3::int is null or partner_id = $3)
            order by case when item_family = $2 then 0 else 1 end, id
            limit 1`, [
				op.process_code,
				opts.family ?? "",
				op.default_jw_partner_id ?? opts.partnerId ?? null
			]))[0];
			bites.push({
				processCode: op.process_code,
				source: "PARTNER_RATE",
				paisePerPc: rate?.rate_paise_per_pc ?? 0,
				isSubcontract: true
			});
		} else {
			const t = (await sql.query(`select rate_paise_per_pc from process_tariff
            where process_code = $1 and (item_family = $2 or item_family = '' or item_id = $3)
              and effective_from <= current_date
              and (effective_to is null or effective_to >= current_date)
            order by case when item_id = $3 then 0 when item_family = $2 then 1 else 2 end
            limit 1`, [
				code,
				opts.family ?? "",
				opts.itemId
			]))[0];
			bites.push({
				processCode: op.process_code,
				source: "OWN_TARIFF",
				paisePerPc: t?.rate_paise_per_pc ?? 0,
				isSubcontract: false
			});
		}
	}
	return {
		bites,
		hasRouting: true
	};
}
async function quoteItem(sql, opts) {
	const item = (await sql.query(`select * from item where id = $1`, [opts.itemId]))[0];
	if (!item) throw new Error("Item not found");
	const alloy = (await sql.query(`select code, cu_pct, zn_pct, pb_pct from alloy where id = $1`, [item.alloy_id]))[0];
	if (!alloy) throw new Error("Item has no alloy — cannot quote anonymous brass");
	const book = await loadMetalBook(sql, opts.asOf);
	const basis = opts.basis ?? await setting(sql, "quote_metal_basis", "CU_ZN_BLEND");
	const recovery = n$1(item.recovery_factor) || n$1(await setting(sql, "default_recovery_factor", "1.08"));
	const { bites, hasRouting } = await loadTariffs(sql, {
		itemId: item.id,
		family: item.family
	});
	const marginPct = opts.marginPct ?? n$1(await setting(sql, "default_margin_pct", "3.9"));
	return buildQuote({
		kgPerPc: n$1(item.kg_per_pc),
		recoveryFactor: recovery,
		alloy: {
			code: alloy.code,
			cuPct: n$1(alloy.cu_pct),
			znPct: n$1(alloy.zn_pct),
			pbPct: n$1(alloy.pb_pct)
		},
		book,
		basis: basis === "ALLOY_DEALER_RATE" ? "ALLOY_DEALER_RATE" : "CU_ZN_BLEND",
		conversionPaise: opts.conversionOverride ?? item.conversion_paise,
		jwPaise: 0,
		packingPaise: item.packing_paise,
		overheadPaise: item.overhead_paise,
		marginPaise: item.default_margin_paise,
		marginPct,
		hsn: item.hsn,
		gstRatePct: 18,
		conversionReason: hasRouting ? null : opts.conversionReason ?? "NO_ROUTING",
		tariffs: hasRouting ? bites : [{
			processCode: "TURN_AUTO",
			source: "NO_ROUTING",
			paisePerPc: opts.conversionOverride ?? item.conversion_paise,
			isSubcontract: false
		}]
	});
}
//#endregion
export { loadMetalBook as n, quoteItem as r, assertRateDateNotFuture as t };
