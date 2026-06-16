"use client";

import { useState } from "react";
import { Check, Copy, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  label: string;
  username: string;
  password: string;
  email?: string;
  loginUrl: string;
  emailSubject?: string;
  emailIntro?: string;
};

export function CredentialsCard({ label, username, password, email, loginUrl, emailSubject, emailIntro }: Props) {
  const [copied, setCopied] = useState<string | null>(null);
  const fullLoginUrl =
    typeof window !== "undefined" ? window.location.origin + loginUrl : loginUrl;

  function copy(value: string, key: string) {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    });
  }

  const body = [
    emailIntro ?? `You have a Cupbop Maintenance account.`,
    "",
    `Sign-in page: ${fullLoginUrl}`,
    `Username: ${username}`,
    `Password: ${password}`,
    "",
    "Please change your password after first login.",
    "— Cupbop Maintenance",
  ].join("\n");
  const mailto =
    email
      ? `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(emailSubject ?? "Your Cupbop Maintenance login")}&body=${encodeURIComponent(body)}`
      : undefined;

  function Row({ k, v }: { k: string; v: string }) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-md border bg-white px-3 py-2 text-sm">
        <div className="min-w-0 flex-1">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{k}</div>
          <div className="truncate font-mono text-sm">{v}</div>
        </div>
        <button
          type="button"
          onClick={() => copy(v, k)}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md border text-muted-foreground hover:bg-secondary"
          aria-label={`Copy ${k}`}
        >
          {copied === k ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
        <ShieldCheck className="h-4 w-4" /> {label}
      </div>
      <p className="text-xs text-emerald-800/80">
        Copy these credentials and send them to the user. The password is shown <strong>once</strong> — store it now if you need a copy.
      </p>
      <div className="space-y-2">
        <Row k="Username" v={username} />
        <Row k="Password" v={password} />
        {email ? <Row k="Email" v={email} /> : null}
        <Row k="Login URL" v={fullLoginUrl} />
      </div>
      <div className="flex flex-wrap gap-2">
        {mailto ? (
          <a href={mailto}>
            <Button type="button" size="sm">
              <Mail className="h-3.5 w-3.5" /> Send via email
            </Button>
          </a>
        ) : null}
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() =>
            copy(
              `Login: ${fullLoginUrl}\nUsername: ${username}\nPassword: ${password}`,
              "all"
            )
          }
        >
          {copied === "all" ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-600" /> Copied
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" /> Copy all
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
