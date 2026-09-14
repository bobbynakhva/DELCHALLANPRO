import { cn } from "@/lib/utils";

const tones: Record<string, string> = {
  AVAILABLE: "bg-ok/15 text-ok",
  QUARANTINE: "bg-hold/15 text-hold",
  HOLD: "bg-hold/15 text-hold",
  REJECTED: "bg-danger/15 text-danger",
  OPEN: "bg-navy/10 text-navy",
  ISSUED: "bg-brass/15 text-brass-deep",
  COMPLETE: "bg-ok/15 text-ok",
  CLOSED: "bg-muted/15 text-muted",
  PARTIAL: "bg-warn/15 text-warn",
  QC_HOLD: "bg-hold/15 text-hold",
  POSTED: "bg-ok/15 text-ok",
  DRAFT: "bg-muted/20 text-muted",
  PASS: "bg-ok/15 text-ok",
  FAIL: "bg-danger/15 text-danger",
  PENDING: "bg-warn/15 text-warn",
  OWN: "bg-navy/10 text-navy",
  CUSTOMER: "bg-brass/15 text-brass-deep",
  APPROVED: "bg-ok/15 text-ok",
};

export function Badge({ children, tone, className }: { children: React.ReactNode; tone?: string; className?: string }) {
  const t = tone ? tones[tone] ?? "bg-cream-deep text-ink" : "bg-cream-deep text-ink";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm px-1.5 py-0.5 text-micro font-semibold uppercase tracking-wide",
        t,
        className,
      )}
    >
      {children}
    </span>
  );
}
