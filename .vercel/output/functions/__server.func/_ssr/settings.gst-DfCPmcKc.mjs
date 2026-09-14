import { o as __toESM } from "../_runtime.mjs";
import { a as require_jsx_runtime, i as useQueryClient, n as useQuery, o as require_react, t as useMutation } from "../_libs/react+tanstack__react-query.mjs";
import { o as n, r as formatINR } from "./format-Bcy9062O.mjs";
import { t as Button } from "./button-BKlCONpI.mjs";
import { n as Input, r as Select, t as Field } from "./input-CysPhmQ2.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { S as AppShell, v as PageHeader, y as Panel } from "./router-Cx8Dk8pR.mjs";
import { o as getGstSettings, p as saveGstSettings } from "./api-gst-Smktkco_.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/settings.gst-DfCPmcKc.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function GstSettingsPage() {
	const qc = useQueryClient();
	const q = useQuery({
		queryKey: ["gst-settings"],
		queryFn: () => getGstSettings()
	});
	const c = q.data?.company;
	const [form, setForm] = (0, import_react.useState)({
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
		ewayThresholdPaise: 5e6,
		msmeCreditDays: 45,
		bankName: "",
		bankAccount: "",
		bankIfsc: ""
	});
	(0, import_react.useEffect)(() => {
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
			bankIfsc: c.bankIfsc ?? ""
		});
	}, [c]);
	const save = useMutation({
		mutationFn: () => saveGstSettings({ data: form }),
		onSuccess: (r) => {
			toast.success(`Saved. HSN digits ${r.hsnDigits} (${form.turnoverAbove5Cr ? "> ₹5 Cr" : "≤ ₹5 Cr"})`);
			qc.invalidateQueries({ queryKey: ["gst-settings"] });
			qc.invalidateQueries({ queryKey: ["bootstrap"] });
		},
		onError: (e) => toast.error(e.message)
	});
	function set(k, v) {
		setForm((f) => ({
			...f,
			[k]: v
		}));
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			kicker: "Compliance",
			title: "GST company settings"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mb-3 text-sm text-muted",
			children: "Thresholds that change by notification (e-invoice, HSN digits, ITC-04 frequency, e-way value) live here — not hardcoded. Composition dealers issue a bill of supply (Rule 49), not a tax invoice."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			className: "grid gap-3 lg:grid-cols-2",
			onSubmit: (e) => {
				e.preventDefault();
				save.mutate();
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
					title: "Identity",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-2 p-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Legal name",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: form.legalName,
									onChange: (e) => set("legalName", e.target.value)
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Trade name",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: form.tradeName,
									onChange: (e) => set("tradeName", e.target.value)
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "GSTIN (15)",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: form.gstin,
									onChange: (e) => set("gstin", e.target.value.toUpperCase()),
									maxLength: 15
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-2 gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "PAN",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: form.pan,
										onChange: (e) => set("pan", e.target.value.toUpperCase())
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "State code",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: form.stateCode,
										onChange: (e) => set("stateCode", e.target.value),
										maxLength: 2
									})
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "CIN",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: form.cin,
									onChange: (e) => set("cin", e.target.value)
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-2 gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "IEC",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: form.iec,
										onChange: (e) => set("iec", e.target.value)
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "LUT ARN",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: form.lutArn,
										onChange: (e) => set("lutArn", e.target.value)
									})
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "LUT valid until",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									type: "date",
									value: form.lutValidUntil,
									onChange: (e) => set("lutValidUntil", e.target.value)
								})
							})
						]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
					title: "Address / signatory",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-2 p-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Issuing place (address)",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: form.addressLine1,
									onChange: (e) => set("addressLine1", e.target.value)
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-3 gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
										label: "City",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											value: form.city,
											onChange: (e) => set("city", e.target.value)
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
										label: "State",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											value: form.state,
											onChange: (e) => set("state", e.target.value)
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
										label: "PIN",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											value: form.pincode,
											onChange: (e) => set("pincode", e.target.value)
										})
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Registered office",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: form.registeredOffice,
									onChange: (e) => set("registeredOffice", e.target.value)
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-2 gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "Phone",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: form.phone,
										onChange: (e) => set("phone", e.target.value)
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "Email",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: form.email,
										onChange: (e) => set("email", e.target.value)
									})
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-2 gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "Authorised signatory",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: form.authorisedSignatory,
										onChange: (e) => set("authorisedSignatory", e.target.value)
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "Designation",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: form.authorisedDesignation,
										onChange: (e) => set("authorisedDesignation", e.target.value)
									})
								})]
							})
						]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
					title: "Scheme / thresholds",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-2 p-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Regular vs composition",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
									value: form.composition ? "composition" : "regular",
									onChange: (e) => set("composition", e.target.value === "composition"),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "regular",
										children: "Regular — tax invoice (Rule 46)"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "composition",
										children: "Composition — bill of supply (Rule 49)"
									})]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Turnover band (HSN digits + ITC-04 frequency)",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
									value: form.turnoverAbove5Cr ? "above" : "upto",
									onChange: (e) => set("turnoverAbove5Cr", e.target.value === "above"),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "upto",
										children: "≤ ₹5 Cr — HSN 4 digits, ITC-04 annual"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
										value: "above",
										children: [">", " ₹5 Cr — HSN 6 digits, ITC-04 half-year"]
									})]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "flex items-center gap-2 text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "checkbox",
									checked: form.einvoiceApplicable,
									onChange: (e) => set("einvoiceApplicable", e.target.checked)
								}), "e-invoice applicable (IRN QR on invoice face)"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "flex items-center gap-2 text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "checkbox",
									checked: form.b2cQr,
									onChange: (e) => set("b2cQr", e.target.checked)
								}), "B2C dynamic QR (Rule 46A)"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "E-way threshold (₹)",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: String(form.ewayThresholdPaise / 100),
									onChange: (e) => set("ewayThresholdPaise", Math.round(n(e.target.value) * 100))
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "MSME credit days",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: String(form.msmeCreditDays),
									onChange: (e) => set("msmeCreditDays", Math.round(n(e.target.value)))
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-micro text-muted",
								children: [
									"Current e-way threshold ",
									formatINR(form.ewayThresholdPaise),
									". Default UQC on metal/FG lines: NOS + KGS."
								]
							})
						]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
					title: "Bank (printed on invoice)",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-2 p-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Bank",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: form.bankName,
									onChange: (e) => set("bankName", e.target.value)
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Account",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: form.bankAccount,
									onChange: (e) => set("bankAccount", e.target.value)
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "IFSC",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: form.bankIfsc,
									onChange: (e) => set("bankIfsc", e.target.value)
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "submit",
								disabled: save.isPending,
								children: "Save GST settings"
							})
						]
					})
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
			title: "Number series (this FY)",
			className: "mt-3",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "app-table",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Type" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Prefix" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Next" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Pad" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Example" })
				] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: (q.data?.series ?? []).map((s) => {
					const ex = `${s.prefix}${String(s.next_no).padStart(n(s.pad), "0")}`;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "font-mono",
							children: s.doc_type
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "font-mono",
							children: s.prefix
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "tabular",
							children: s.next_no
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "tabular",
							children: s.pad
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
							className: "font-mono",
							children: [
								ex,
								" ",
								ex.length > 16 ? " — ILLEGAL >16" : `(${ex.length} chars)`
							]
						})
					] }, s.doc_type);
				}) })]
			})
		})
	] });
}
//#endregion
export { GstSettingsPage as component };
