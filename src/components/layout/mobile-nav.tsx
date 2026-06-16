"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/types";
import { NAV_BY_ROLE } from "./nav-items";

export function MobileNav({ role }: { role: Role }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const items = NAV_BY_ROLE[role];

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close whenever the route changes (skip the initial mount so we don't
  // immediately close a freshly-opened drawer on first render)
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll while open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const drawer =
    mounted && typeof document !== "undefined"
      ? createPortal(
          <>
            <div
              className={cn(
                "fixed inset-0 z-[100] bg-black/50 transition-opacity duration-200 md:hidden",
                open ? "opacity-100" : "pointer-events-none opacity-0"
              )}
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />
            <aside
              id="mobile-nav-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation"
              className={cn(
                "fixed inset-y-0 left-0 z-[101] flex w-72 max-w-[85%] flex-col border-r bg-white shadow-2xl transition-transform duration-200 md:hidden",
                open ? "translate-x-0" : "-translate-x-full"
              )}
            >
              <div className="flex items-center justify-between border-b px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cupbop-red text-white shadow-sm">
                    <span className="text-base font-bold">C</span>
                  </div>
                  <div className="flex flex-col leading-tight">
                    <span className="text-sm font-semibold">Cupbop</span>
                    <span className="text-[11px] text-muted-foreground">
                      Maintenance HQ
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close navigation"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
                {items.map((item) => {
                  const active =
                    pathname === item.href || pathname.startsWith(item.href + "/");
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                        active
                          ? "bg-cupbop-red/10 text-cupbop-red"
                          : "text-foreground/70 hover:bg-secondary hover:text-foreground"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
              <div className="border-t px-4 py-3 text-[11px] text-muted-foreground">
                v0.1 · Command Center
              </div>
            </aside>
          </>,
          document.body
        )
      : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
        aria-expanded={open}
        aria-controls="mobile-nav-drawer"
        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground hover:bg-secondary md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>
      {drawer}
    </>
  );
}
