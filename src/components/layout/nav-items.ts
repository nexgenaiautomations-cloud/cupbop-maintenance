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
  CalendarDays,
} from "lucide-react";
import type { Role } from "@/lib/types";

export type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

// Admin + Technician now share the SAME combined operator nav. Location
// managers stay separate with the simple store portal.
const OPERATOR_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/technician", label: "My Work", icon: ClipboardList },
  { href: "/planner", label: "Daily & Weekly", icon: CalendarDays },
  { href: "/work-orders", label: "Work Orders", icon: Wrench },
  { href: "/work-orders/new", label: "Create Work Order", icon: Plus },
  { href: "/maintenance", label: "Preventive Maintenance", icon: CalendarCheck },
  { href: "/locations", label: "Locations", icon: Building2 },
  { href: "/technicians", label: "Technicians", icon: HardHat },
  { href: "/reports", label: "Reports & Export", icon: BarChart3 },
  { href: "/import", label: "Import", icon: Upload },
  { href: "/settings", label: "Settings", icon: Settings },
];

export const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  ADMIN: OPERATOR_NAV,
  TECHNICIAN: OPERATOR_NAV,
  LOCATION_MANAGER: [{ href: "/location", label: "My Location", icon: Store }],
};
