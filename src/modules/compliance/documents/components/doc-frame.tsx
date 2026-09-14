import { Button } from "@/components/ui/button";
import { CopyWatermark } from "./copy-watermark";
import type { GstIssue } from "../../gst/validate";

export function DocFrame({
  citation,
  copies,
  copy,
  onCopy,
  issues,
  children,
}: {
  citation: string;
  copies?: readonly string[];
  copy?: string;
  onCopy?: (c: string) => void;
  issues?: GstIssue[];
  children: React.ReactNode;
}) {
  const blocks = (issues ?? []).filter((i) => i.level === "block");
  const warns = (issues ?? []).filter((i) => i.level === "warn");
  const blocked = blocks.length > 0;
  return (
    <div className="bg-cream p-3 print:bg-white print:p-0">
      <div className="no-print mb-3 flex flex-wrap items-center gap-2">
        <Button onClick={() => window.print()} disabled={blocked}>
          Print / Save PDF
        </Button>
        <Button variant="ghost" onClick={() => history.back()}>
          Back
        </Button>
        {copies?.length ? (
          <select
            className="h-9 rounded-sm border border-line bg-paper px-2 text-sm"
            value={copy}
            onChange={(e) => onCopy?.(e.target.value)}
          >
            {copies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        ) : null}
        <span className="text-micro text-muted">{citation}</span>
      </div>
      {blocked ? (
        <div className="no-print mb-2 border border-danger bg-danger/10 px-3 py-2 text-sm text-danger">
          <strong>BLOCK PRINT.</strong>{" "}
          {blocks.map((b) => b.message).join(" · ")}
        </div>
      ) : null}
      {warns.length ? (
        <div className="no-print mb-2 border border-warn bg-warn/10 px-3 py-2 text-sm text-warn">
          {warns.map((w) => w.message).join(" · ")}
        </div>
      ) : null}
      <article className="doc-gst relative mx-auto bg-white text-ink shadow-sm print:shadow-none">
        {copy ? <CopyWatermark text={copy} /> : null}
        <div className="relative">{children}</div>
      </article>
    </div>
  );
}
