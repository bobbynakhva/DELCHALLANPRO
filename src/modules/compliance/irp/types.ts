/** Official-shaped IRP (NIC e-invoice) payload. Not a GSTN login. */

export type IrpSupTyp = "B2B" | "SEZWP" | "SEZWOP" | "EXPWP" | "EXPWOP" | "DEXP";
export type IrpDocTyp = "INV" | "CRN" | "DBN";

export type IrpParty = {
  Gstin: string;
  LglNm: string;
  TrdNm?: string | null;
  Addr1: string;
  Addr2?: string | null;
  Loc: string;
  Pin: number;
  Stcd: string;
  Ph?: string | null;
  Em?: string | null;
  Pos?: string;
};

export type IrpItem = {
  SlNo: string;
  PrdDesc: string;
  IsServc: "Y" | "N";
  HsnCd: string;
  Qty: number;
  Unit: "NOS" | "KGS";
  UnitPrice: number;
  TotAmt: number;
  Discount: number;
  PreTaxVal: number;
  AssAmt: number;
  GstRt: number;
  IgstAmt: number;
  CgstAmt: number;
  SgstAmt: number;
  TotItemVal: number;
};

export type IrpValDtls = {
  AssVal: number;
  CgstVal: number;
  SgstVal: number;
  IgstVal: number;
  Discount: number;
  OthChrg: number;
  RndOffAmt: number;
  TotInvVal: number;
};

export type IrpPayload = {
  Version: "1.1";
  TranDtls: {
    TaxSch: "GST";
    SupTyp: IrpSupTyp;
    RegRev: "Y" | "N";
    IgstOnIntra: "Y" | "N";
  };
  DocDtls: { Typ: IrpDocTyp; No: string; Dt: string };
  SellerDtls: IrpParty;
  BuyerDtls: IrpParty;
  ShipDtls?: IrpParty | null;
  ItemList: IrpItem[];
  ValDtls: IrpValDtls;
};

export type StubIrnResult = {
  Irn: string;
  AckNo: string;
  AckDt: string;
  SignedQR: string;
  Status: "ACT" | "CNL";
};

export type NicMode = "stub" | "sandbox" | "off";
export type IrpSimulate = "duplicate" | "invalidGstin";
