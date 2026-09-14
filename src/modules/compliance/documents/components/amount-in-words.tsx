import { amountInWordsINR, formatInrGrouped } from "../../gst/words";

export function AmountInWordsINR({ paise }: { paise: number }) {
  return (
    <div className="border border-ink px-2 py-1 text-[10px] leading-snug">
      <span className="font-semibold">Amount in words: </span>
      {amountInWordsINR(paise)} ({formatInrGrouped(paise)})
    </div>
  );
}
