"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wrench,
  CalendarCheck,
  Building2,
  HardHat,
  BarChart3,
  Upload,
  Settings,
  Store,
  ClipboardList,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/types";

const NAV_BY_ROLE: Record<Role, Array<{ href: string; label: string; icon: React.ComponentType<{ className?: string }> }>> = {
  ADMIN: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/work-orders", label: "Work Orders", icon: Wrench },
    { href: "/maintenance", label: "Preventive Maintenance", icon: CalendarCheck },
    { href: "/locations", label: "Locations", icon: Building2 },
    { href: "/technicians", label: "Technicians", icon: HardHat },
    { href: "/reports", label: "Reports", icon: BarChart3 },
    { href: "/import", label: "Import", icon: Upload },
    { href: "/settings", label: "Settings", icon: Settings },
  ],
  TECHNICIAN: [
    { href: "/technician", label: "My Work", icon: ClipboardList },
    { href: "/work-orders", label: "Work Orders", icon: Wrench },
    { href: "/work-orders/new", label: "Create Work Order", icon: Plus },
    { href: "/maintenance", label: "Preventive Maintenance", icon: CalendarCheck },
  ],
  LOCATION_MANAGER: [
    { href: "/location", label: "My Location", icon: Store },
  ],
};

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = NAV_BY_ROLE[role];
  return (
    <aside className="hidden w-60 shrink-0 border-r bg-white md:flex md:flex-col">
      <div className="flex items-center gap-3 border-b px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cupbop-red text-white shadow-sm">
          <span className="text-base font-bold">C</span>
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold">Cupbop</span>
          <span className="text-[11px] text-muted-foreground">Maintenance HQ</span>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-cupbop-red/10 text-cupbop-red"
                  : "text-foreground/70 hover:bg-secondary hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t px-4 py-3 text-[11px] text-muted-foreground">
        v0.1 · Command Center
      </div>
    </aside>
  );
}
