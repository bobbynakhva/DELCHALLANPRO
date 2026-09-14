-- Realistic opening books for Tamba Brass Works, Ahmedabad — FY 2026-27

insert into company (name, trade_name, gstin, pan, address_line1, city, state, state_code, pincode, phone, email, lut_arn, bank_name, bank_account, bank_ifsc)
values (
  'Tamba Brass Works Private Limited',
  'Tamba Brass',
  '24AABCT4821M1Z5',
  'AABCT4821M',
  'Plot 41, GIDC Odhav',
  'Ahmedabad',
  'Gujarat',
  '24',
  '382415',
  '+91 79 2287 4400',
  'accounts@tambaerp.in',
  'AD2403250123456',
  'HDFC Bank, Odhav',
  '50200011223344',
  'HDFC0000482'
);

insert into uom (code, name, decimals) values
  ('KG', 'Kilogram', 3),
  ('PCS', 'Pieces', 0);

insert into settings (key, value) values
  ('jw_block_days', '330'),
  ('adjust_dual_approval_paise', '500000'),
  ('fy', '26-27');

insert into number_series (doc_type, prefix, next_no, pad) values
  ('GRN', 'GRN/26-27/', 1, 4),
  ('PO',  'PO/26-27/',  2, 4),
  ('SO',  'SO/26-27/',  2, 4),
  ('WO',  'WO/26-27/',  1, 4),
  ('JW',  'JW/26-27/',  3, 4),
  ('JWR', 'JWR/26-27/', 1, 4),
  ('INV', 'INV/26-27/', 1, 4),
  ('QTN', 'QTN/26-27/', 2, 4),
  ('PL',  'PL/26-27/',  1, 4),
  ('NCR', 'NCR/26-27/', 1, 4),
  ('MEL', 'MEL/26-27/', 1, 4),
  ('QI',  'QI/26-27/',  1, 4),
  ('LOT', 'LOT-26-',    8, 5),
  ('DN',  'DN/26-27/',  1, 4);

insert into alloy (code, name, cu_pct, zn_pct, pb_pct, other_pct, is_scrap, notes) values
  ('C36000', 'Free-cutting brass C36000', 61.500, 35.400, 3.100, 0, false, 'ASTM B16 / C36000'),
  ('CW617N', 'CuZn39Pb3 / CW617N', 58.000, 39.500, 2.500, 0, false, 'EN 12165 forging brass'),
  ('IS319-I', 'IS 319 Grade I', 57.000, 40.000, 3.000, 0, false, 'BIS free-cutting brass'),
  ('SC-C360', 'C36000 scrap family', 61.500, 35.400, 3.100, 0, true, 'Turning / runner / dross inherit C360');

insert into warehouse (code, name, kind, is_customer_owned, is_outside_factory, valuation_eligible) values
  ('RM-ROD', 'Rod store', 'RM', false, false, true),
  ('RM-SCRAP', 'Scrap bay', 'SCRAP', false, false, true),
  ('SFG', 'Machine shop SFG', 'SFG', false, false, true),
  ('FG-DOM', 'Finished goods — domestic', 'FG', false, false, true),
  ('FG-EXP', 'Finished goods — export', 'FG', false, false, true),
  ('FG-HOLD', 'QC hold', 'HOLD', false, false, true),
  ('FG-REJECT', 'Reject cage', 'REJECT', false, false, true),
  ('JW-OUT', 'Job work at vendor', 'JW_OUT', false, true, true),
  ('JW-IN-CUSTOMER', 'Customer metal (job-in)', 'JW_IN', true, false, false),
  ('TOOL', 'Tool crib', 'TOOL', false, false, true);

insert into partner (code, name, is_customer, is_vendor, is_job_worker, gstin, address_line1, city, state, state_code, pincode, country, credit_limit_paise, phone) values
  ('V-RAJESH', 'Rajeshwar Metals', false, true, false, '24AARFR2291C1Z3', 'Jamalpur Metal Market', 'Ahmedabad', 'Gujarat', '24', '380001', 'IN', 0, '079-2211-8800'),
  ('V-KIRAN', 'Kiran Platers', false, true, true, '24AAKPK4410D1Z8', 'Vatva GIDC, Phase II', 'Ahmedabad', 'Gujarat', '24', '382445', 'IN', 0, '079-2583-1190'),
  ('V-AMIT', 'Amit Polishers', false, true, true, '24AABPA8821E1Z2', 'Naroda Road', 'Ahmedabad', 'Gujarat', '24', '382330', 'IN', 0, '079-2281-4402'),
  ('C-GS', 'Gujarat Sanitary', true, false, false, '24AAGCG5520F1Z6', 'Narol-Naroda Highway', 'Ahmedabad', 'Gujarat', '24', '382405', 'IN', 250000000, '079-2571-3000'),
  ('C-GULF', 'Gulf Fittings LLC', true, false, false, null, 'Jebel Ali Industrial 1', 'Dubai', 'Dubai', null, '00000', 'AE', 0, '+971-4-884-2200');

insert into partner_process_rate (partner_id, process_code, item_family, rate_paise_per_pc, rate_paise_per_kg, loss_norm_pct)
select p.id, x.process_code, x.item_family, x.rate_pc, x.rate_kg, x.loss
from partner p
join (values
  ('V-KIRAN', 'NI_CR', 'NIPPLE', 180, 0, 1.500),
  ('V-KIRAN', 'NI_CR', 'INSERT', 90, 0, 1.500),
  ('V-AMIT', 'POLISH', 'UNION', 70, 0, 0.800),
  ('V-AMIT', 'POLISH', 'ELBOW', 55, 0, 0.800)
) as x(code, process_code, item_family, rate_pc, rate_kg, loss)
  on p.code = x.code;

insert into work_center (code, name, kind) values
  ('CNC-1', 'Citizen L20 sliding head', 'MACHINE'),
  ('CNC-2', 'Star SR-20', 'MACHINE'),
  ('FORGE-1', 'Hot forge 150T', 'FOUNDRY'),
  ('MELT-1', 'Oil-fired crucible 300 kg', 'FOUNDRY'),
  ('SUB-PLATE', 'Outward plating', 'SUBCON'),
  ('SUB-POLISH', 'Outward polish', 'SUBCON');

insert into tool_die (code, name, item_family, life_shots, shots_used, status) values
  ('TD-NIP-12', 'Hex nipple 1/2 collet + die', 'NIPPLE', 250000, 18420, 'ACTIVE'),
  ('TD-UN-12', 'Union 1/2 forge die', 'UNION', 80000, 22100, 'ACTIVE');

-- Items: rods, scrap, eight FG
insert into item (sku, name, type, alloy_id, stock_uom, alt_uom, kg_per_pc, recovery_factor, hsn, drawing_no, drawing_rev, make_or_buy, inspection_required, family, size_label, conversion_paise, packing_paise, overhead_paise, default_margin_paise)
select * from (
  select 'ROD-C360-12MM'::text, 'C36000 extruded rod 12 mm'::text, 'RM'::text, a.id, 'KG'::text, 'PCS'::text, null::numeric, 1::numeric,
         '74072110'::text, null::text, null::text, 'BUY'::text, true, 'ROD'::text, '12 mm'::text, 0, 0, 0, 0
  from alloy a where a.code = 'C36000'
  union all
  select 'ROD-C360-19MM', 'C36000 extruded rod 19 mm', 'RM', a.id, 'KG', 'PCS', null, 1,
         '74072110', null, null, 'BUY', true, 'ROD', '19 mm', 0, 0, 0, 0
  from alloy a where a.code = 'C36000'
  union all
  select 'SC-C360-TURN', 'C36000 turning / bushy scrap', 'SCRAP', a.id, 'KG', null, null, 1,
         '74040012', null, null, 'MAKE', false, 'SCRAP', 'turnings', 0, 0, 0, 0
  from alloy a where a.code = 'C36000'
  union all
  select 'SC-C360-RUNNER', 'C36000 runner / flash', 'SCRAP', a.id, 'KG', null, null, 1,
         '74040012', null, null, 'MAKE', false, 'SCRAP', 'runner', 0, 0, 0, 0
  from alloy a where a.code = 'C36000'
  union all
  select 'HEX-NIPPLE-1/2-NCR', 'Hex nipple 1/2" NPT, Ni-Cr plated', 'FG', a.id, 'PCS', 'KG', 0.048000, 1.0800,
         '74122019', 'TBW-NIP-012', 'C', 'MAKE', true, 'NIPPLE', '1/2"', 450, 40, 80, 150
  from alloy a where a.code = 'C36000'
  union all
  select 'HEX-NIPPLE-3/4-NCR', 'Hex nipple 3/4" NPT, Ni-Cr plated', 'FG', a.id, 'PCS', 'KG', 0.078000, 1.0800,
         '74122019', 'TBW-NIP-034', 'B', 'MAKE', true, 'NIPPLE', '3/4"', 620, 45, 90, 180
  from alloy a where a.code = 'C36000'
  union all
  select 'HEX-NIPPLE-1-NCR', 'Hex nipple 1" NPT, Ni-Cr plated', 'FG', a.id, 'PCS', 'KG', 0.125000, 1.0800,
         '74122019', 'TBW-NIP-100', 'B', 'MAKE', true, 'NIPPLE', '1"', 880, 50, 110, 220
  from alloy a where a.code = 'C36000'
  union all
  select 'INSERT-M8-C360', 'Threaded insert M8', 'FG', a.id, 'PCS', 'KG', 0.012000, 1.1200,
         '74153390', 'TBW-INS-M8', 'A', 'MAKE', true, 'INSERT', 'M8', 180, 15, 30, 60
  from alloy a where a.code = 'C36000'
  union all
  select 'INSERT-M10-C360', 'Threaded insert M10', 'FG', a.id, 'PCS', 'KG', 0.018000, 1.1200,
         '74153390', 'TBW-INS-M10', 'A', 'MAKE', true, 'INSERT', 'M10', 210, 15, 35, 70
  from alloy a where a.code = 'C36000'
  union all
  select 'UNION-1/2-FORGED', 'Forged union 1/2"', 'FG', a.id, 'PCS', 'KG', 0.085000, 1.1500,
         '74122019', 'TBW-UN-012', 'D', 'MAKE', true, 'UNION', '1/2"', 720, 55, 100, 200
  from alloy a where a.code = 'CW617N'
  union all
  select 'ELBOW-1/2-CW617', 'Forged elbow 1/2" CW617N', 'FG', a.id, 'PCS', 'KG', 0.062000, 1.1000,
         '74122019', 'TBW-EL-012', 'A', 'MAKE', true, 'ELBOW', '1/2"', 640, 50, 90, 180
  from alloy a where a.code = 'CW617N'
  union all
  select 'BUSH-19-IS319', 'Machined bush 19 mm IS 319 Gr I', 'FG', a.id, 'PCS', 'KG', 0.095000, 1.0800,
         '74122019', 'TBW-BSH-19', 'A', 'MAKE', true, 'BUSH', '19 mm', 500, 40, 80, 140
  from alloy a where a.code = 'IS319-I'
) s;

-- BOM for HEX-NIPPLE-1/2-NCR (drawing rev C) — rod input + turning/runner co-products
insert into bom (item_id, drawing_rev, status, approved_by, approved_at)
select id, 'C', 'APPROVED', 'seed', now() from item where sku = 'HEX-NIPPLE-1/2-NCR';

insert into bom_line (bom_id, component_item_id, qty_per, qty_uom, scrap_pct, is_co_product, line_no)
select b.id, i.id, 0.051840, 'KG', 0, false, 10
from bom b
join item fg on fg.id = b.item_id and fg.sku = 'HEX-NIPPLE-1/2-NCR'
join item i on i.sku = 'ROD-C360-12MM';

insert into bom_line (bom_id, component_item_id, qty_per, qty_uom, scrap_pct, is_co_product, line_no)
select b.id, i.id, 0.000640, 'KG', 0, true, 20
from bom b
join item fg on fg.id = b.item_id and fg.sku = 'HEX-NIPPLE-1/2-NCR'
join item i on i.sku = 'SC-C360-TURN';

insert into bom_line (bom_id, component_item_id, qty_per, qty_uom, scrap_pct, is_co_product, line_no)
select b.id, i.id, 0.003680, 'KG', 0, true, 30
from bom b
join item fg on fg.id = b.item_id and fg.sku = 'HEX-NIPPLE-1/2-NCR'
join item i on i.sku = 'SC-C360-RUNNER';

insert into routing (item_id, drawing_rev, status)
select id, 'C', 'APPROVED' from item where sku = 'HEX-NIPPLE-1/2-NCR';

insert into routing_op (routing_id, seq, work_center_id, process_code, is_subcontract, default_jw_partner_id, run_sec_per_pc)
select r.id, 10, wc.id, 'MACHINE', false, null, 18
from routing r
join item i on i.id = r.item_id and i.sku = 'HEX-NIPPLE-1/2-NCR'
join work_center wc on wc.code = 'CNC-1';

insert into routing_op (routing_id, seq, work_center_id, process_code, is_subcontract, default_jw_partner_id, run_sec_per_pc)
select r.id, 20, wc.id, 'NI_CR', true, p.id, 0
from routing r
join item i on i.id = r.item_id and i.sku = 'HEX-NIPPLE-1/2-NCR'
join work_center wc on wc.code = 'SUB-PLATE'
join partner p on p.code = 'V-KIRAN';

-- Metal prices: June frozen book + current September book
insert into metal_price (as_of_date, cu_paise_per_kg, zn_paise_per_kg, pb_paise_per_kg, posted_by) values
  ('2026-06-01', 81000, 26500, 18500, 'seed'),
  ('2026-09-01', 85000, 27200, 18800, 'seed');

-- Opening lots
insert into stock_lot (lot_no, item_id, warehouse_id, alloy_id, heat_no, qty_kg, qty_pcs, status, owner_type, unit_value_paise_per_kg, source_type)
select 'LOT-26-00001', i.id, w.id, i.alloy_id, 'H24-1182', 85.250, 0, 'AVAILABLE', 'OWN', 62000, 'OPENING'
from item i, warehouse w where i.sku = 'ROD-C360-12MM' and w.code = 'RM-ROD';

insert into stock_lot (lot_no, item_id, warehouse_id, alloy_id, heat_no, qty_kg, qty_pcs, status, owner_type, unit_value_paise_per_kg, source_type)
select 'LOT-26-00002', i.id, w.id, i.alloy_id, 'H24-1090', 210.000, 0, 'AVAILABLE', 'OWN', 61800, 'OPENING'
from item i, warehouse w where i.sku = 'ROD-C360-19MM' and w.code = 'RM-ROD';

insert into stock_lot (lot_no, item_id, warehouse_id, alloy_id, heat_no, qty_kg, qty_pcs, status, owner_type, owner_partner_id, unit_value_paise_per_kg, source_type)
select 'LOT-26-00003', i.id, w.id, i.alloy_id, 'GS-HEAT-44', 40.000, 0, 'AVAILABLE', 'CUSTOMER', p.id, 0, 'OPENING'
from item i, warehouse w, partner p
where i.sku = 'ROD-C360-12MM' and w.code = 'JW-IN-CUSTOMER' and p.code = 'C-GS';

insert into stock_lot (lot_no, item_id, warehouse_id, alloy_id, heat_no, qty_kg, qty_pcs, status, owner_type, unit_value_paise_per_kg, source_type)
select 'LOT-26-00004', i.id, w.id, i.alloy_id, 'H23-8801', 127.500, 1500, 'AVAILABLE', 'OWN', 72000, 'OPENING'
from item i, warehouse w where i.sku = 'UNION-1/2-FORGED' and w.code = 'JW-OUT';

insert into stock_lot (lot_no, item_id, warehouse_id, alloy_id, heat_no, qty_kg, qty_pcs, status, owner_type, unit_value_paise_per_kg, source_type)
select 'LOT-26-00005', i.id, w.id, i.alloy_id, 'H24-2011', 9.600, 800, 'AVAILABLE', 'OWN', 78000, 'OPENING'
from item i, warehouse w where i.sku = 'INSERT-M8-C360' and w.code = 'JW-OUT';

insert into stock_lot (lot_no, item_id, warehouse_id, alloy_id, heat_no, qty_kg, qty_pcs, status, owner_type, unit_value_paise_per_kg, source_type)
select 'LOT-26-00006', i.id, w.id, i.alloy_id, null, 12.400, 0, 'AVAILABLE', 'OWN', 41000, 'OPENING'
from item i, warehouse w where i.sku = 'SC-C360-TURN' and w.code = 'RM-SCRAP';

insert into stock_lot (lot_no, item_id, warehouse_id, alloy_id, heat_no, qty_kg, qty_pcs, status, owner_type, unit_value_paise_per_kg, source_type)
select 'LOT-26-00007', i.id, w.id, i.alloy_id, null, 0, 0, 'AVAILABLE', 'OWN', 39000, 'OPENING'
from item i, warehouse w where i.sku = 'SC-C360-RUNNER' and w.code = 'RM-SCRAP';

insert into stock_move (move_type, item_id, lot_id, warehouse_id, qty_kg, qty_pcs, value_paise, ref_type, notes, alloy_id)
select 'OPENING', l.item_id, l.id, l.warehouse_id, l.qty_kg, l.qty_pcs,
       (l.qty_kg * l.unit_value_paise_per_kg)::bigint, 'OPENING', 'Opening balance FY 26-27', l.alloy_id
from stock_lot l;

-- Open PO: Rajeshwar 2000 kg 12 mm rod
insert into purchase_order (doc_no, partner_id, status, order_date, expected_date, notes, created_by)
select 'PO/26-27/0001', p.id, 'OPEN', '2026-09-08', '2026-09-16', 'C360 12 mm — mill length', 'seed'
from partner p where p.code = 'V-RAJESH';

insert into po_line (po_id, item_id, qty_kg, rate_paise_per_kg)
select po.id, i.id, 2000.000, 62000
from purchase_order po, item i
where po.doc_no = 'PO/26-27/0001' and i.sku = 'ROD-C360-12MM';

-- Open SO: Gulf Fittings elbows (not the 10k nipple journey)
insert into sales_order (doc_no, partner_id, status, order_date, notes, created_by)
select 'SO/26-27/0001', p.id, 'OPEN', '2026-09-10', 'Export — LUT, 2000 elbows', 'seed'
from partner p where p.code = 'C-GULF';

insert into so_line (so_id, item_id, qty_pcs, unit_price_paise, gst_pct)
select so.id, i.id, 2000, 4850, 0
from sales_order so, item i
where so.doc_no = 'SO/26-27/0001' and i.sku = 'ELBOW-1/2-CW617';

-- Frozen June quote for Gujarat Sanitary / HEX-NIPPLE
insert into quotation (doc_no, partner_id, quote_date, valid_until, status, metal_rate_date, cu_paise_per_kg, zn_paise_per_kg, pb_paise_per_kg, formula_snapshot, notes, created_by)
select 'QTN/26-27/0001', p.id, '2026-06-04', '2026-07-04', 'OPEN', '2026-06-01', 81000, 26500, 18500,
  '{"formula":"metal = kgPerPc * recoveryFactor * blended Cu/Zn/Pb; unitPrice = metal + conversion + jw + packing + overhead + margin","cu_pct":61.5,"zn_pct":35.4,"pb_pct":3.1,"kg_per_pc":0.048,"recovery":1.08,"blended_paise_per_kg":59196,"metal_paise":3069,"conversion_paise":450,"jw_paise":180,"packing_paise":40,"overhead_paise":80,"margin_paise":150,"unit_price_paise":3969}',
  'Frozen June LME book — do not rewrite', 'seed'
from partner p where p.code = 'C-GS';

insert into quotation_line (quotation_id, item_id, qty_pcs, kg_per_pc, recovery_factor, metal_paise, conversion_paise, jw_paise, packing_paise, overhead_paise, margin_paise, unit_price_paise, gst_pct)
select q.id, i.id, 10000, 0.048000, 1.0800, 3069, 450, 180, 40, 80, 150, 3969, 18
from quotation q, item i
where q.doc_no = 'QTN/26-27/0001' and i.sku = 'HEX-NIPPLE-1/2-NCR';

-- JW challan aged 280 days — Amit Polishers, unions still outside
insert into job_work_challan (doc_no, partner_id, process_code, issued_at, expected_return_at, statutory_due, status, notes, created_by, loss_norm_pct)
select 'JW/26-27/0001', p.id, 'POLISH',
       now() - interval '280 days',
       (now() - interval '268 days')::date,
       ((now() - interval '280 days') + interval '365 days')::date,
       'OPEN', 'Seeded 280-day open challan', 'seed', 0.800
from partner p where p.code = 'V-AMIT';

insert into job_work_challan_line (challan_id, item_id, jw_lot_id, qty_pcs, qty_kg, hsn)
select c.id, i.id, l.id, 1500, 127.500, i.hsn
from job_work_challan c, item i, stock_lot l
where c.doc_no = 'JW/26-27/0001' and i.sku = 'UNION-1/2-FORGED' and l.lot_no = 'LOT-26-00004';

-- Recent JW challan — Kiran, inserts
insert into job_work_challan (doc_no, partner_id, process_code, issued_at, expected_return_at, statutory_due, status, notes, created_by, loss_norm_pct)
select 'JW/26-27/0002', p.id, 'NI_CR',
       now() - interval '12 days',
       (now() + interval '3 days')::date,
       ((now() - interval '12 days') + interval '365 days')::date,
       'OPEN', 'Open Ni-Cr inserts', 'seed', 1.500
from partner p where p.code = 'V-KIRAN';

insert into job_work_challan_line (challan_id, item_id, jw_lot_id, qty_pcs, qty_kg, hsn)
select c.id, i.id, l.id, 800, 9.600, i.hsn
from job_work_challan c, item i, stock_lot l
where c.doc_no = 'JW/26-27/0002' and i.sku = 'INSERT-M8-C360' and l.lot_no = 'LOT-26-00005';
