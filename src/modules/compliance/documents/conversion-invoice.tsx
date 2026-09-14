/** CGST Act s.31 · Rule 46 service tax invoice. SAC 9988 manufacturing services on physical inputs owned by others. */
import { TaxInvoice } from "./tax-invoice";
import type { ConversionInvoiceDoc } from "./types";

export function ConversionInvoice({ doc }: { doc: ConversionInvoiceDoc }) {
  return (
    <TaxInvoice
      doc={doc}
      citation="CGST Act s.31 · Rule 46 (service) · SAC 9988"
    />
  );
}
