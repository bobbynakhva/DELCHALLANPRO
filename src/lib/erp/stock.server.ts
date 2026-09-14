/** Compatibility barrel — the writer lives in modules/inventory/posting.ts. */
export {
  createLot,
  getLot,
  itemBySku,
  linkGenealogy,
  onHandFromMoves,
  onHandKg,
  postMove,
  postStockMove,
  reverseStockMove,
  saveDocSnapshot,
  loadDocSnapshot,
  warehouseByCode,
  withStockTx,
  type LotRow,
  type StockMoveInput,
} from "@/modules/inventory/posting";
