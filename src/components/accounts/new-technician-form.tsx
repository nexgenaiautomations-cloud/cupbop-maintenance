"use client";

import { useState } from "react";
import { HardHat, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { createTechnicianAction, type CreateTechnicianResult } from "@/app/actions/accounts";
import { CredentialsCard } from "./credentials-card";

export function NewTechnicianForm() {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<CreateTechnicianResult | null>(null);

  async function onSubmit(formData: FormData) {
    setSubmitting(true);
    const r = await createTechnicianAction(formData);
    setSubmitting(false);
    setResult(r);
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> Add Technician
      </Button>
    );
  }

  if (result?.ok) {
    return (
      <div className="card-shell p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardHat className="h-4 w-4 text-cupbop-red" />
            <span className="text-sm font-semibold">Technician created</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setResult(null);
            }}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <CredentialsCard
          label="New technician login"
          username={result.username}
          password={result.password}
          email={result.email}
          loginUrl={result.loginUrl}
          emailSubject="Your Cupbop Maintenance technician login"
          emailIntro="Welcome to the Cupbop Maintenance team. Your operator account is ready."
        />
      </div>
    );
  }

  return (
    <div className="card-shell p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HardHat className="h-4 w-4 text-cupbop-red" />
          <span className="text-sm font-semibold">Add Technician</span>
        </div>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setResult(null);
          }}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <form action={onSubmit} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="name">Full name</Label>
            <Input id="name" name="name" required placeholder="Hyeong Park" />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" type="tel" placeholder="801-555-0123" />
          </div>
          <div>
            <Label htmlFor="email">Email (optional)</Label>
            <Input id="email" name="email" type="email" placeholder="hyeong@cupbopmaintenance.com" />
            <p className="mt-1 text-[11px] text-muted-foreground">If blank, we&apos;ll use {`{username}@cupbopmaintenance.com`}.</p>
          </div>
          <div>
            <Label htmlFor="username">Username</Label>
            <Input id="username" name="username" required pattern="[a-zA-Z0-9._-]{3,40}" placeholder="hyeong" />
            <p className="mt-1 text-[11px] text-muted-foreground">3–40 chars, letters/numbers/.-_</p>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="text" required minLength={6} placeholder="Temporary password (min 6 chars)" />
            <p className="mt-1 text-[11px] text-muted-foreground">Shown in plain text — you&apos;ll share it with the technician on the next screen.</p>
          </div>
        </div>
        {result && !result.ok ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {result.error}
          </p>
        ) : null}
        <div className="flex items-center gap-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Creating…" : "Create technician + login"}
          </Button>
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
        </div>
      </form>
    </div>
  );
}
