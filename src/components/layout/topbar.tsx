"use client";

import { Bell, Search, ChevronDown, LogOut } from "lucide-react";
import { useState } from "react";
import { logoutAction } from "@/app/actions/auth";

export function TopBar({ user }: { user: { name: string; email: string; role: string } }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-white/80 px-4 backdrop-blur md:px-6">
      <div className="hidden flex-1 md:flex">
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search locations, work orders…"
            className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
          />
        </div>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-cupbop-red" />
        </button>
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2 rounded-md border bg-background px-2 py-1 text-sm shadow-sm hover:bg-secondary"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-cupbop-black text-white text-xs font-semibold">
              {user.name.slice(0, 1).toUpperCase()}
            </div>
            <div className="hidden text-left leading-tight md:block">
              <div className="text-xs font-medium">{user.name}</div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {user.role.replace("_", " ").toLowerCase()}
              </div>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          {open ? (
            <div className="absolute right-0 mt-2 w-56 rounded-md border bg-white p-2 shadow-lg">
              <div className="px-2 py-1.5 text-xs text-muted-foreground">{user.email}</div>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-secondary"
                >
                  <LogOut className="h-4 w-4" /> Sign out / Switch demo user
                </button>
              </form>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
