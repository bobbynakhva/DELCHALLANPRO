import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/shell";
import { PageHeader, Panel } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { getGstSettings, saveGstSettings } from "@/lib/erp/api-gst";
import { formatINR, n } from "@/lib/erp/format";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/settings/gst")({ component: GstSettingsPage });

function GstSettingsPage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["gst-settings"], queryFn: () => getGstSettings() });
  const c = q.data?.company;
  const [form, setForm] = useState({
    legalName: "",
    tradeName: "",
    gstin: "",
    pan: "",
    cin: "",
    iec: "",
    lutArn: "",
    lutValidUntil: "",
    addressLine1: "",
    city: "",
    state: "",
    stateCode: "",
    pincode: "",
    registeredOffice: "",
    phone: "",
    email: "",
    authorisedSignatory: "",
    authorisedDesignation: "",
    composition: false,
    turnoverAbove5Cr: true,
    einvoiceApplicable: true,
    b2cQr: true,
    ewayThresholdPaise: 5_000_000,
    msmeCreditDays: 45,
    bankName: "",
    bankAccount: "",
    bankIfsc: "",
  });
  useEffect(() => {
    if (!c) return;
    setForm({
      legalName: c.legalName,
      tradeName: c.tradeName,
      gstin: c.gstin ?? "",
      pan: c.pan ?? "",
      cin: c.cin ?? "",
      iec: c.iec ?? "",
      lutArn: c.lutArn ?? "",
      lutValidUntil: (c.lutValidUntil ?? "").slice(0, 10),
      addressLine1: c.addressLine1,
      city: c.city,
      state: c.state,
      stateCode: c.stateCode ?? "24",
      pincode: c.pincode,
      registeredOffice: c.registeredOffice ?? "",
      phone: c.phone ?? "",
      email: c.email ?? "",
      authorisedSignatory: c.authorisedSignatory,
      authorisedDesignation: c.authorisedDesignation,
      composition: c.composition,
      turnoverAbove5Cr: c.turnoverAbove5Cr,
      einvoiceApplicable: c.einvoiceApplicable,
      b2cQr: c.b2cQr,
      ewayThresholdPaise: c.ewayThresholdPaise,
      msmeCreditDays: c.msmeCreditDays,
      bankName: c.bankName ?? "",
      bankAccount: c.bankAccount ?? "",
      bankIfsc: c.bankIfsc ?? "",
    });
  }, [c]);

  const save = useMutation({
    mutationFn: () => saveGstSettings({ data: form }),
    onSuccess: (r) => {
      toast.success(`Saved. HSN digits ${r.hsnDigits} (${form.turnoverAbove5Cr ? "> ₹5 Cr" : "≤ ₹5 Cr"})`);
      void qc.invalidateQueries({ queryKey: ["gst-settings"] });
      void qc.invalidateQueries({ queryKey: ["bootstrap"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  return (
    <AppShell>
      <PageHeader kicker="Compliance" title="GST company settings" />
      <p className="mb-3 text-sm text-muted">
        Thresholds that change by notification (e-invoice, HSN digits, ITC-04 frequency, e-way value) live here — not
        hardcoded. Composition dealers issue a bill of supply (Rule 49), not a tax invoice.
      </p>
      {q.data?.nic ? (
        <p className="mb-3 rounded-md border border-line bg-paper px-3 py-2 text-sm text-navy">
          Adapter mode: e-invoice <strong className="font-mono">{q.data.nic.einvoiceMode}</strong> · e-way{" "}
          <strong className="font-mono">{q.data.nic.ewayMode}</strong>. Default is stub (offline). Sandbox needs{" "}
          <span className="font-mono">GST_IRP_*</span> / <span className="font-mono">GST_EWB_*</span> env — never commit
          secrets. This is not a GSTN login.
        </p>
      ) : null}
      <form
        className="grid gap-3 lg:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        <Panel title="Identity">
          <div className="grid gap-2 p-3">
            <Field label="Legal name">
              <Input value={form.legalName} onChange={(e) => set("legalName", e.target.value)} />
            </Field>
            <Field label="Trade name">
              <Input value={form.tradeName} onChange={(e) => set("tradeName", e.target.value)} />
            </Field>
            <Field label="GSTIN (15)">
              <Input value={form.gstin} onChange={(e) => set("gstin", e.target.value.toUpperCase())} maxLength={15} />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="PAN">
                <Input value={form.pan} onChange={(e) => set("pan", e.target.value.toUpperCase())} />
              </Field>
              <Field label="State code">
                <Input value={form.stateCode} onChange={(e) => set("stateCode", e.target.value)} maxLength={2} />
              </Field>
            </div>
            <Field label="CIN">
              <Input value={form.cin} onChange={(e) => set("cin", e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="IEC">
                <Input value={form.iec} onChange={(e) => set("iec", e.target.value)} />
              </Field>
              <Field label="LUT ARN">
                <Input value={form.lutArn} onChange={(e) => set("lutArn", e.target.value)} />
              </Field>
            </div>
            <Field label="LUT valid until">
              <Input type="date" value={form.lutValidUntil} onChange={(e) => set("lutValidUntil", e.target.value)} />
            </Field>
          </div>
        </Panel>
        <Panel title="Address / signatory">
          <div className="grid gap-2 p-3">
            <Field label="Issuing place (address)">
              <Input value={form.addressLine1} onChange={(e) => set("addressLine1", e.target.value)} />
            </Field>
            <div className="grid grid-cols-3 gap-2">
              <Field label="City">
                <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
              </Field>
              <Field label="State">
                <Input value={form.state} onChange={(e) => set("state", e.target.value)} />
              </Field>
              <Field label="PIN">
                <Input value={form.pincode} onChange={(e) => set("pincode", e.target.value)} />
              </Field>
            </div>
            <Field label="Registered office">
              <Input value={form.registeredOffice} onChange={(e) => set("registeredOffice", e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Phone">
                <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
              </Field>
              <Field label="Email">
                <Input value={form.email} onChange={(e) => set("email", e.target.value)} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Authorised signatory">
                <Input value={form.authorisedSignatory} onChange={(e) => set("authorisedSignatory", e.target.value)} />
              </Field>
              <Field label="Designation">
                <Input
                  value={form.authorisedDesignation}
                  onChange={(e) => set("authorisedDesignation", e.target.value)}
                />
              </Field>
            </div>
          </div>
        </Panel>
        <Panel title="Scheme / thresholds">
          <div className="grid gap-2 p-3">
            <Field label="Regular vs composition">
              <Select
                value={form.composition ? "composition" : "regular"}
                onChange={(e) => set("composition", e.target.value === "composition")}
              >
                <option value="regular">Regular — tax invoice (Rule 46)</option>
                <option value="composition">Composition — bill of supply (Rule 49)</option>
              </Select>
            </Field>
            <Field label="Turnover band (HSN digits + ITC-04 frequency)">
              <Select
                value={form.turnoverAbove5Cr ? "above" : "upto"}
                onChange={(e) => set("turnoverAbove5Cr", e.target.value === "above")}
              >
                <option value="upto">≤ ₹5 Cr — HSN 4 digits, ITC-04 annual</option>
                <option value="above">{'>'} ₹5 Cr — HSN 6 digits, ITC-04 half-year</option>
              </Select>
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.einvoiceApplicable}
                onChange={(e) => set("einvoiceApplicable", e.target.checked)}
              />
              e-invoice applicable (IRN QR on invoice face)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.b2cQr} onChange={(e) => set("b2cQr", e.target.checked)} />
              B2C dynamic QR (Rule 46A)
            </label>
            <Field label="E-way threshold (₹)">
              <Input
                value={String(form.ewayThresholdPaise / 100)}
                onChange={(e) => set("ewayThresholdPaise", Math.round(n(e.target.value) * 100))}
              />
            </Field>
            <Field label="MSME credit days">
              <Input
                value={String(form.msmeCreditDays)}
                onChange={(e) => set("msmeCreditDays", Math.round(n(e.target.value)))}
              />
            </Field>
            <p className="text-micro text-muted">
              Current e-way threshold {formatINR(form.ewayThresholdPaise)}. Default UQC on metal/FG lines: NOS + KGS.
            </p>
          </div>
        </Panel>
        <Panel title="Bank (printed on invoice)">
          <div className="grid gap-2 p-3">
            <Field label="Bank">
              <Input value={form.bankName} onChange={(e) => set("bankName", e.target.value)} />
            </Field>
            <Field label="Account">
              <Input value={form.bankAccount} onChange={(e) => set("bankAccount", e.target.value)} />
            </Field>
            <Field label="IFSC">
              <Input value={form.bankIfsc} onChange={(e) => set("bankIfsc", e.target.value)} />
            </Field>
            <Button type="submit" disabled={save.isPending}>
              Save GST settings
            </Button>
          </div>
        </Panel>
      </form>
      <Panel title="Number series (this FY)" className="mt-3">
        <table className="app-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Prefix</th>
              <th>Next</th>
              <th>Pad</th>
              <th>Example</th>
            </tr>
          </thead>
          <tbody>
            {(q.data?.series ?? []).map((s) => {
              const ex = `${s.prefix}${String(s.next_no).padStart(n(s.pad), "0")}`;
              return (
                <tr key={s.doc_type as string}>
                  <td className="font-mono">{s.doc_type as string}</td>
                  <td className="font-mono">{s.prefix as string}</td>
                  <td className="tabular">{s.next_no as number}</td>
                  <td className="tabular">{s.pad as number}</td>
                  <td className="font-mono">
                    {ex} {ex.length > 16 ? " — ILLEGAL >16" : `(${ex.length} chars)`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Panel>
    </AppShell>
  );
}
