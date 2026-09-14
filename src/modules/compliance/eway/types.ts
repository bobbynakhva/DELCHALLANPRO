export type EwayDocType = "INV" | "CHL" | "BIL" | "BOE" | "CNT" | "OTH";

export type EwayPartA = {
  supplyType: "O" | "I";
  subSupplyType: string;
  subSupplyDesc: string;
  docType: EwayDocType;
  docNo: string;
  docDate: string;
  fromGstin: string;
  fromTrdName: string;
  fromAddr1: string;
  fromPlace: string;
  fromPincode: number;
  fromStateCode: number;
  toGstin: string;
  toTrdName: string;
  toAddr1: string;
  toPlace: string;
  toPincode: number;
  toStateCode: number;
  billToGstin: string;
  shipToGstin: string;
  transType: string;
  transTypeDesc: string;
  totalValue: number;
  cgstValue: number;
  sgstValue: number;
  igstValue: number;
  hsnCode: string;
  quantity: number;
  qtyUnit: "NOS" | "KGS";
};

export type EwayPartB = {
  vehicleNo: string;
  transMode: "1" | "2" | "3" | "4";
  transModeLabel: "Road" | "Rail" | "Air" | "Ship";
  transDistance: number;
  transDocNo?: string;
  skipSameState50km: boolean;
};

export type StubEwayResult = {
  ewbNo: string;
  validFrom: string | null;
  validUntil: string | null;
  partA: EwayPartA;
  partB: EwayPartB | null;
  status: "ACT" | "CNL";
};

export type EwaySimulate = "invalidGstin" | "duplicate";
