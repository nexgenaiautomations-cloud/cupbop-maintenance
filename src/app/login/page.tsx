import { loginAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { ShieldCheck, Store, ArrowRight, KeyRound } from "lucide-react";

const DEMO_ACCOUNTS = [
  {
    label: "Maintenance Manager",
    sub: "Full operator · all locations, KPIs, reports, technician queue",
    email: "admin@cupbopmaintenance.com",
    icon: ShieldCheck,
    accent: "bg-cupbop-red text-white",
  },
  {
    label: "Location Manager (Provo)",
    sub: "Store portal · submit work orders",
    email: "provo@cupbopmaintenance.com",
    icon: Store,
    accent: "bg-cupbop-black text-white",
  },
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;
  return (
    <main className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <section className="relative hidden bg-cupbop-black p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cupbop-red">
            <span className="text-lg font-bold">C</span>
          </div>
          <span className="text-lg font-semibold">Cupbop Maintenance</span>
        </div>
        <div>
          <h1 className="text-4xl font-bold leading-tight">
            Replace the spreadsheet.
            <br />
            <span className="text-cupbop-yellow">Run the line.</span>
          </h1>
          <p className="mt-4 max-w-md text-sm text-white/70">
            Preventive maintenance, work orders, technician dispatch and store-level reporting — across every Cupbop location.
          </p>
        </div>
        <div className="text-xs text-white/60">
          <p>Demo build · Cupbop Maintenance Command Center</p>
        </div>
        <div className="pointer-events-none absolute -right-32 -bottom-32 h-96 w-96 rounded-full bg-cupbop-red/30 blur-3xl" />
        <div className="pointer-events-none absolute right-10 top-10 h-48 w-48 rounded-full bg-cupbop-yellow/20 blur-3xl" />
      </section>
      <section className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-semibold tracking-tight">Sign in</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Use your username/password — or click a demo account below for instant access.
          </p>

          <form action={loginAction} className="mt-6 space-y-3 rounded-xl border bg-white p-5 shadow-sm">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <KeyRound className="h-3.5 w-3.5" /> Username &amp; password
            </div>
            <div>
              <Label htmlFor="identifier">Username or email</Label>
              <Input
                id="identifier"
                name="identifier"
                required
                autoComplete="username"
                placeholder="RCB123"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
              />
            </div>
            {sp.error ? (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {sp.error}
              </p>
            ) : null}
            <Button type="submit" className="w-full" size="lg">
              Sign in
            </Button>
            <p className="text-[11px] text-muted-foreground">
              <strong className="text-foreground">Rodney&apos;s account:</strong> username <code className="rounded bg-muted px-1">RCB123</code> · password <code className="rounded bg-muted px-1">RCB123</code>
            </p>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            OR USE A DEMO ACCOUNT
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="space-y-2">
            {DEMO_ACCOUNTS.map((d) => {
              const Icon = d.icon;
              return (
                <form key={d.email} action={loginAction}>
                  <input type="hidden" name="identifier" value={d.email} />
                  <button
                    type="submit"
                    className="group flex w-full cursor-pointer items-center justify-between rounded-xl border bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-cupbop-red hover:shadow-md"
                  >
                    <span className="flex items-center gap-3">
                      <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${d.accent}`}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="flex flex-col leading-tight">
                        <span className="text-sm font-semibold">Sign in as {d.label}</span>
                        <span className="text-xs text-muted-foreground">{d.sub}</span>
                      </span>
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-cupbop-red" />
                  </button>
                </form>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
