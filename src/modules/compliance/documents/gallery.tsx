import { BillOfSupply } from "./bill-of-supply";
import { CertificateOfConformance } from "./coc";
import { ConversionInvoice } from "./conversion-invoice";
import { CreditDebitNote } from "./credit-debit-note";
import { DeliveryChallan } from "./delivery-challan";
import { EwayForm } from "./eway";
import {
  DOC_INDEX,
  FIX_BOS,
  FIX_CHALLAN_OUT,
  FIX_CHALLAN_RETURN,
  FIX_CN,
  FIX_COC,
  FIX_CONVERSION,
  FIX_DN,
  FIX_EWAY,
  FIX_EXPORT_IGST,
  FIX_EXPORT_LUT,
  FIX_GRN,
  FIX_INVOICE_GJ,
  FIX_INVOICE_MH,
  FIX_KNOCKOUT,
  FIX_PACKING,
  FIX_POUR,
  FIX_QUOTE,
  FIX_SERIAL_BLOCK,
} from "./fixtures";
import { GrnSlip } from "./grn-slip";
import { KnockoutSlip } from "./knockout-slip";
import { PackingList } from "./packing-list";
import { PourSlip } from "./pour-slip";
import { QuotationDocView } from "./quotation";
import { RegistersView } from "./registers";
import { TaxInvoice } from "./tax-invoice";

export { DOC_INDEX };

export function GstDocPreview({ slug }: { slug: string }) {
  switch (slug) {
    case "invoice":
      return <TaxInvoice doc={FIX_INVOICE_GJ} />;
    case "invoice-mh":
      return <TaxInvoice doc={FIX_INVOICE_MH} />;
    case "export-lut":
      return <TaxInvoice doc={FIX_EXPORT_LUT} />;
    case "export-igst":
      return <TaxInvoice doc={FIX_EXPORT_IGST} />;
    case "challan":
      return <DeliveryChallan doc={FIX_CHALLAN_OUT} />;
    case "challan-return":
      return <DeliveryChallan doc={FIX_CHALLAN_RETURN} />;
    case "eway":
      return <EwayForm doc={FIX_EWAY} />;
    case "cn":
      return <CreditDebitNote doc={FIX_CN} />;
    case "dn":
      return <CreditDebitNote doc={FIX_DN} />;
    case "packing":
      return <PackingList doc={FIX_PACKING} />;
    case "grn":
      return <GrnSlip doc={FIX_GRN} />;
    case "coc":
      return <CertificateOfConformance doc={FIX_COC} />;
    case "quote":
      return <QuotationDocView doc={FIX_QUOTE} />;
    case "conversion":
      return <ConversionInvoice doc={FIX_CONVERSION} />;
    case "bos":
      return <BillOfSupply doc={FIX_BOS} />;
    case "registers":
      return <RegistersView />;
    case "serial-block":
      return <TaxInvoice doc={FIX_SERIAL_BLOCK} />;
    case "pour":
      return <PourSlip doc={FIX_POUR} />;
    case "knockout":
      return <KnockoutSlip doc={FIX_KNOCKOUT} />;
    default:
      return (
        <div className="p-8 text-sm text-muted">
          Unknown document <span className="font-mono">{slug}</span>.
        </div>
      );
  }
}
