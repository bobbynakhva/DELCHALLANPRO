/** Rule 46 / Rule 55(2) — copy watermarks on tax invoice and delivery challan. */
export function CopyWatermark({ text }: { text: string }) {
  return (
    <div
      className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
      aria-hidden
    >
      <div
        className="select-none text-center text-[36px] font-bold uppercase leading-tight tracking-widest text-ink/10"
        style={{ transform: "rotate(-28deg)" }}
      >
        {text}
      </div>
    </div>
  );
}
