import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { GROK_PROVIDERS, authClient, authEnabled, signIn } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { DEMO_PASSWORD, DEMO_USERS, ROLE_LABEL } from "@/lib/erp/constants";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const { user, isPending } = useCurrentUserState();
  const navigate = useNavigate();
  const [email, setEmail] = useState("owner@tambaerp.in");
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [busy, setBusy] = useState(false);

  if (!isPending && user) {
    void navigate({ to: "/" });
  }

  async function onEmail(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await authClient.signIn.email({ email, password });
      if (error) throw new Error(error.message ?? "Sign-in failed");
      toast.success("Signed in");
      await navigate({ to: "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-navy lg:grid-cols-[1.1fr_0.9fr]">
      <section className="hidden flex-col justify-between p-10 text-cream lg:flex">
        <div>
          <div className="font-display text-4xl text-brass-soft">Tamba ERP</div>
          <p className="mt-2 max-w-md text-sm text-cream/70">
            Brass parts books of record — dual UOM, alloy lots, job-work challans, GST tax
            invoices. Ahmedabad. FY 2026-27.
          </p>
        </div>
        <ul className="max-w-sm space-y-2 text-sm text-cream/80">
          <li>kg for melt, scrap and valuation · pcs for customers and packing</li>
          <li>Scrap is inventory of the same alloy, never an expense dump</li>
          <li>Our metal at a vendor stays on our books in JW-OUT</li>
          <li>Customer metal is qty-tracked and does not inflate value</li>
        </ul>
      </section>
      <section className="flex items-center justify-center bg-cream p-6">
        <div className="w-full max-w-md space-y-5">
          <div>
            <div className="font-display text-3xl text-navy lg:hidden">Tamba ERP</div>
            <h1 className="text-xl font-semibold text-navy">Sign in</h1>
            <p className="text-sm text-muted">Seeded shop logins share password {DEMO_PASSWORD}</p>
          </div>
          <form onSubmit={onEmail} method="post" className="space-y-3 rounded-md border border-line bg-paper p-4">
            <Field label="Email">
              <Input value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
            </Field>
            <Field label="Password">
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </Field>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Signing in…" : "Sign in with password"}
            </Button>
          </form>
          <div className="flex flex-wrap gap-1.5">
            {DEMO_USERS.map((u) => (
              <button
                key={u.email}
                type="button"
                onClick={() => {
                  setEmail(u.email);
                  setPassword(DEMO_PASSWORD);
                }}
                className="rounded-sm border border-line bg-paper px-2 py-1 text-micro text-navy hover:border-brass"
              >
                {ROLE_LABEL[u.role]}
              </button>
            ))}
          </div>
          {authEnabled ? (
            <div className="space-y-2">
              <div className="text-center text-micro uppercase tracking-wide text-muted">or</div>
              {GROK_PROVIDERS.map((p) => (
                <Button
                  key={p.providerId}
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => signIn(p.providerId, { callbackURL: "/" })}
                >
                  Continue with {p.label}
                </Button>
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
