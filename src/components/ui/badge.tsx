import * as React from "react";
import { cn } from "@/lib/utils";
import type { PreventiveStatus, WorkOrderPriority, WorkOrderStatus } from "@/lib/types";

const baseClass =
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium";

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn(baseClass, className)} {...props} />;
}

const PRIORITY_STYLES: Record<WorkOrderPriority, string> = {
  URGENT: "bg-red-50 text-red-700 border-red-200",
  IMPORTANT: "bg-amber-50 text-amber-800 border-amber-200",
  SUBORDINATE: "bg-slate-100 text-slate-700 border-slate-200",
};

export function PriorityBadge({ priority }: { priority: string }) {
  const p = (priority as WorkOrderPriority) ?? "IMPORTANT";
  const label = p.charAt(0) + p.slice(1).toLowerCase();
  return <Badge className={PRIORITY_STYLES[p]}>{label}</Badge>;
}

const STATUS_STYLES: Record<WorkOrderStatus, string> = {
  NEW: "bg-blue-50 text-blue-700 border-blue-200",
  ASSIGNED: "bg-violet-50 text-violet-700 border-violet-200",
  ORDERED: "bg-indigo-50 text-indigo-700 border-indigo-200",
  SCHEDULED: "bg-sky-50 text-sky-700 border-sky-200",
  IN_PROGRESS: "bg-amber-50 text-amber-800 border-amber-200",
  WAITING_ON_VENDOR: "bg-orange-50 text-orange-700 border-orange-200",
  COMPLETE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-slate-100 text-slate-600 border-slate-200",
};

const STATUS_LABELS: Record<WorkOrderStatus, string> = {
  NEW: "New",
  ASSIGNED: "Assigned",
  ORDERED: "Ordered",
  SCHEDULED: "Scheduled",
  IN_PROGRESS: "In Progress",
  WAITING_ON_VENDOR: "Waiting on Vendor",
  COMPLETE: "Complete",
  CANCELLED: "Cancelled",
};

export function StatusBadge({ status }: { status: string }) {
  const s = (status as WorkOrderStatus) ?? "NEW";
  return <Badge className={STATUS_STYLES[s] ?? STATUS_STYLES.NEW}>{STATUS_LABELS[s] ?? s}</Badge>;
}

const PM_STATUS_STYLES: Record<PreventiveStatus, string> = {
  NOT_STARTED: "bg-slate-100 text-slate-700 border-slate-200",
  UPCOMING: "bg-sky-50 text-sky-700 border-sky-200",
  DUE_SOON: "bg-amber-50 text-amber-800 border-amber-200",
  OVERDUE: "bg-red-50 text-red-700 border-red-200",
  COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const PM_STATUS_LABELS: Record<PreventiveStatus, string> = {
  NOT_STARTED: "Not Started",
  UPCOMING: "Upcoming",
  DUE_SOON: "Due Soon",
  OVERDUE: "Overdue",
  COMPLETED: "Completed",
};

export function PmStatusBadge({ status }: { status: string }) {
  const s = (status as PreventiveStatus) ?? "UPCOMING";
  return <Badge className={PM_STATUS_STYLES[s]}>{PM_STATUS_LABELS[s]}</Badge>;
}
