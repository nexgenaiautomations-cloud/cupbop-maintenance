"use client";

import { useState } from "react";
import { Store, KeyRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { createLocationLoginAction, type CreateLocationLoginResult } from "@/app/actions/accounts";
import { CredentialsCard } from "./credentials-card";

function suggestUsername(locationName: string) {
  return locationName.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function generatePassword(): string {
  // Friendly-but-random: 2 lowercase words + 4 digits + !
  const words = ["maple", "orbit", "river", "sage", "delta", "ember", "marlin", "zephyr"];
  const w = () => words[Math.floor(Math.random() * words.length)];
  const n = String(Math.floor(1000 + Math.random() * 9000));
  return `${w()}-${w()}-${n}`;
}

export function NewLocationLoginForm({
  locationId,
  locationName,
  existingManager,
}: {
  locationId: string;
  locationName: string;
  existingManager: { name: string | null; email: string | null; username: string | null } | null;
}) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<CreateLocationLoginResult | null>(null);
  const [pw, setPw] = useState(() => generatePassword());

  async function onSubmit(formData: FormData) {
    setSubmitting(true);
    const r = await createLocationLoginAction(formData);
    setSubmitting(false);
    setResult(r);
  }

  if (existingManager?.username && !open && !result) {
    return (
      <div className="card-shell p-5">
        <div className="mb-2 flex items-center gap-2">
          <Store className="h-4 w-4 text-cupbop-red" />
          <span className="text-sm font-semibold">Store manager login</span>
        </div>
        <div className="rounded-md border bg-white p-3 text-sm">
          <div className="font-medium">{existingManager.name ?? locationName + " Manager"}</div>
          <div className="text-xs text-muted-foreground">
            Username: <span className="font-mono">{existingManager.username}</span>
            {existingManager.email ? <> · {existingManager.email}</> : null}
          </div>
        </div>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => setOpen(true)}>
          <KeyRound className="h-3.5 w-3.5" /> Issue another login
        </Button>
      </div>
    );
  }

  if (result?.ok) {
    return (
      <div className="card-shell p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store className="h-4 w-4 text-cupbop-red" />
            <span className="text-sm font-semibold">Login created for {result.locationName}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setResult(null);
              setPw(generatePassword());
            }}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <CredentialsCard
          label={`Location manager login · ${result.locationName}`}
          username={result.username}
          password={result.password}
          email={result.email}
          loginUrl="/login"
          emailSubject={`Your Cupbop Maintenance login — ${result.locationName}`}
          emailIntro={`You can now submit and track maintenance requests for ${result.locationName} through the Cupbop Maintenance portal.`}
        />
      </div>
    );
  }

  return (
    <div className="card-shell p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Store className="h-4 w-4 text-cupbop-red" />
          <span className="text-sm font-semibold">Create store manager login</span>
        </div>
        {existingManager?.username ? (
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setResult(null);
            }}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary"
            aria-label="Cancel"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
      <form action={onSubmit} className="space-y-3">
        <input type="hidden" name="locationId" value={locationId} />
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="name">Manager name</Label>
            <Input id="name" name="name" required defaultValue={existingManager?.name ?? `${locationName} Manager`} />
          </div>
          <div>
            <Label htmlFor="email">Manager email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={existingManager?.email ?? ""}
              placeholder={`${suggestUsername(locationName)}@cupbopmaintenance.com`}
            />
          </div>
          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              required
              pattern="[a-zA-Z0-9._-]{3,40}"
              defaultValue={existingManager?.username ?? suggestUsername(locationName)}
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <div className="flex items-center gap-2">
              <Input
                id="password"
                name="password"
                type="text"
                required
                minLength={6}
                value={pw}
                onChange={(e) => setPw(e.target.value)}
              />
              <Button type="button" variant="outline" size="sm" onClick={() => setPw(generatePassword())}>
                Generate
              </Button>
            </div>
          </div>
        </div>
        {result && !result.ok ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {result.error}
          </p>
        ) : null}
        <div className="flex items-center gap-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Creating…" : "Create login + show credentials"}
          </Button>
          {existingManager?.username ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setOpen(false);
                setResult(null);
              }}
            >
              Cancel
            </Button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
