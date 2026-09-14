import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Panel({
  title,
  actions,
  children,
  className,
}: {
  title?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-md border border-line bg-paper", className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-3 py-2">
          {title ? <h2 className="text-sm font-semibold text-navy">{title}</h2> : <span />}
          {actions}
        </header>
      )}
      <div className="overflow-x-auto">{children}</div>
    </section>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="px-3 py-8 text-center text-sm text-muted">{children}</p>;
}

export function Stat({
  label,
  value,
  hint,
  warn,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  warn?: boolean;
}) {
  return (
    <div className={cn("rounded-md border border-line bg-paper px-3 py-2.5", warn && "border-warn")}>
      <div className="text-micro font-medium uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-0.5 font-mono text-lg font-medium tabular text-navy">{value}</div>
      {hint ? <div className="text-micro text-muted">{hint}</div> : null}
    </div>
  );
}

export function PageHeader({
  kicker,
  title,
  children,
}: {
  kicker?: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
      <div>
        {kicker ? (
          <div className="text-micro font-medium uppercase tracking-[0.14em] text-brass-deep">{kicker}</div>
        ) : null}
        <h1 className="font-display text-2xl font-semibold text-navy">{title}</h1>
      </div>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

export function linesOf<T>(raw: unknown): T[] {
  if (!raw) return [];
  if (typeof raw === "string") {
    try {
      const v = JSON.parse(raw);
      return Array.isArray(v) ? v : [];
    } catch {
      return [];
    }
  }
  return Array.isArray(raw) ? (raw as T[]) : [];
}
