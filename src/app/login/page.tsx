import { loginAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { KeyRound } from "lucide-react";

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
          <p>Cupbop Maintenance Command Center</p>
        </div>
        <div className="pointer-events-none absolute -right-32 -bottom-32 h-96 w-96 rounded-full bg-cupbop-red/30 blur-3xl" />
        <div className="pointer-events-none absolute right-10 top-10 h-48 w-48 rounded-full bg-cupbop-yellow/20 blur-3xl" />
      </section>
      <section className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-semibold tracking-tight">Sign in</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter your username and password to continue.
          </p>

          <form action={loginAction} className="mt-6 space-y-4 rounded-xl border bg-white p-6 shadow-sm">
            <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <KeyRound className="h-3.5 w-3.5" /> Account login
            </div>
            <div>
              <Label htmlFor="identifier">Username</Label>
              <Input
                id="identifier"
                name="identifier"
                required
                autoComplete="username"
                placeholder="username"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
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
              Don&apos;t have an account? Ask your maintenance manager to set one up for you.
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}
