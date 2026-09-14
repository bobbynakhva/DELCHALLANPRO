import { Link, useRouterState } from "@tanstack/react-router";
import { RedirectToSignIn, UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getBootstrap } from "@/lib/erp/api";
import { ROLE_LABEL, type Role } from "@/lib/erp/constants";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import {
  Boxes,
  ClipboardCheck,
  Factory,
  FileText,
  LayoutDashboard,
  Menu,
  Package,
  Scale,
  ShoppingCart,
  Truck,
  Wrench,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";

const NAV = [
  {
    label: "Floor",
    items: [
      { to: "/", label: "Board", icon: LayoutDashboard },
      { to: "/planning", label: "Planning / MRP", icon: Factory },
      { to: "/journeys", label: "32 journeys", icon: ClipboardCheck },
      { to: "/dev/journeys", label: "Journey pack", icon: ClipboardCheck },
      { to: "/shop", label: "Shop booking", icon: Factory },
    ],
  },
  {
    label: "Stock",
    items: [
      { to: "/stock", label: "On-hand lots", icon: Boxes },
      { to: "/moves", label: "Stock ledger", icon: Scale },
      { to: "/grn", label: "GRN", icon: Package },
      { to: "/qc", label: "QC release", icon: ClipboardCheck },
    ],
  },
  {
    label: "Orders",
    items: [
      { to: "/po", label: "Purchase", icon: Truck },
      { to: "/so", label: "Sales orders", icon: ShoppingCart },
      { to: "/wo", label: "Work orders", icon: Wrench },
      { to: "/quotes", label: "Quotations", icon: FileText },
      { to: "/dispatch", label: "Invoice / packing", icon: Package },
      { to: "/bills", label: "AR / AP", icon: Scale },
    ],
  },
  {
    label: "Job work & quality",
    items: [
      { to: "/jw", label: "JW OUT / return", icon: Truck },
      { to: "/ncr", label: "NCR", icon: ClipboardCheck },
      { to: "/foundry", label: "Foundry", icon: Factory },
    ],
  },
  {
    label: "Books",
    items: [
      { to: "/masters", label: "Masters", icon: Boxes },
      { to: "/books", label: "COA / journals", icon: Scale },
      { to: "/audit", label: "Audit / variance", icon: FileText },
      { to: "/cutover", label: "Cutover", icon: FileText },
      { to: "/admin/permissions", label: "Permissions", icon: ClipboardCheck },
    ],
  },
  {
    label: "Compliance",
    items: [
      { to: "/dev/docs", label: "GST documents", icon: FileText },
      { to: "/registers", label: "Registers", icon: Scale },
      { to: "/gst", label: "GST worksheets", icon: FileText },
      { to: "/settings/gst", label: "GST settings", icon: FileText },
    ],
  },
];

const SHOP_HIDDEN = new Set([
  "/so",
  "/quotes",
  "/dispatch",
  "/books",
  "/gst",
  "/bills",
  "/admin/permissions",
  "/cutover",
]);

function navFor(role: Role, foundryEnabled = true) {
  return NAV.map((g) => ({
    ...g,
    items: g.items.filter((it) => {
      if (role === "SHOP" && SHOP_HIDDEN.has(it.to)) return false;
      if (it.to === "/foundry" && !foundryEnabled) return false;
      return true;
    }),
  })).filter((g) => g.items.length);
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user, isPending } = useCurrentUserState();
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const boot = useQuery({
    queryKey: ["bootstrap"],
    queryFn: () => getBootstrap(),
    enabled: Boolean(user),
  });

  if (isPending) {
    return (
      <div className="flex min-h-screen bg-cream">
        <div className="hidden w-nav bg-navy md:block" />
        <div className="flex-1 p-6">
          <div className="font-display text-xl text-navy">Tamba ERP</div>
          <p className="mt-1 text-sm text-muted">Loading the books…</p>
          <div className="mt-4 h-40 animate-pulse rounded-md bg-cream-deep" />
        </div>
      </div>
    );
  }
  if (!user) return <RedirectToSignIn />;

  const role = (boot.data?.staff.role ?? "OWNER") as Role;
  const company = boot.data?.company as { trade_name?: string; gstin?: string } | undefined;
  const foundryOn = boot.data?.foundryEnabled !== false;

  return (
    <div className="min-h-screen bg-cream text-ink md:pl-nav print:pl-0">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-nav flex-col bg-navy text-cream",
          "transition-transform duration-200 md:translate-x-0 print:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
          <Link to="/" className="min-w-0" onClick={() => setOpen(false)}>
            <div className="font-display text-xl leading-none text-brass-soft">Tamba</div>
            <div className="text-micro uppercase tracking-[0.18em] text-cream/60">Brass parts ERP</div>
          </Link>
          <button type="button" className="md:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
            <X className="size-5" />
          </button>
        </div>
        <nav className="flex flex-1 flex-col gap-4 overflow-y-auto px-3 py-3">
          {navFor(role, foundryOn).map((g) => (
            <div key={g.label}>
              <div className="px-2 pb-1 text-micro font-semibold uppercase tracking-[0.16em] text-brass-soft/80">
                {g.label}
              </div>
              <ul className="space-y-0.5">
                {g.items.map((it) => {
                  const active = it.to === "/" ? pathname === "/" : pathname.startsWith(it.to);
                  const Icon = it.icon;
                  return (
                    <li key={it.to}>
                      <Link
                        to={it.to}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm",
                          active ? "bg-brass text-navy-deep" : "text-cream/85 hover:bg-navy-mid",
                        )}
                      >
                        <Icon className="size-3.5 shrink-0" />
                        {it.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
        <div className="border-t border-white/10 px-3 py-3 text-micro text-cream/70">
          <div className="truncate">{boot.data?.staff.name ?? user.displayName}</div>
          <div className="text-brass-soft">{ROLE_LABEL[role] ?? role}</div>
        </div>
      </aside>
      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-ink/40 md:hidden"
          aria-label="Close menu overlay"
          onClick={() => setOpen(false)}
        />
      ) : null}
      <header className="sticky top-0 z-20 flex h-12 items-center justify-between gap-3 border-b border-line bg-cream/95 px-3 backdrop-blur print:hidden md:px-5">
        <button type="button" className="md:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
          <Menu className="size-5" />
        </button>
        <div className="hidden text-sm text-muted md:block">
          {company ? (
            <>
              <span className="font-medium text-navy">{company.trade_name}</span>
              <span className="mx-2 text-line">|</span>
              GSTIN {company.gstin}
              <span className="mx-2 text-line">|</span>
              FY 26-27
            </>
          ) : (
            "Tamba Brass Works"
          )}
        </div>
        <div className="ml-auto flex items-center gap-3">
          <div className="hidden text-right text-micro text-muted sm:block">
            <div className="text-navy">{user.primaryEmail}</div>
            <div>{ROLE_LABEL[role] ?? role}</div>
          </div>
          <div className="flex h-8 min-w-8 items-center">
            <UserButton />
          </div>
        </div>
      </header>
      <main className="px-3 py-4 md:px-5">{children}</main>
    </div>
  );
}
