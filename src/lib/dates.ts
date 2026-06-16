import {
  addMonths as fnsAddMonths,
  differenceInCalendarDays,
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subDays,
} from "date-fns";
import type { PreventiveStatus } from "./types";

export const formatDate = (d: Date | string | null | undefined) =>
  d ? format(typeof d === "string" ? new Date(d) : d, "MMM d, yyyy") : "—";

export const formatDateTime = (d: Date | string | null | undefined) =>
  d ? format(typeof d === "string" ? new Date(d) : d, "MMM d, yyyy h:mm a") : "—";

export function calculateNextServiceDate(
  lastServiceDate: Date | string,
  frequencyMonths: number
): Date {
  const last =
    typeof lastServiceDate === "string" ? new Date(lastServiceDate) : lastServiceDate;
  return fnsAddMonths(last, frequencyMonths);
}

export function getPreventiveTaskStatus(
  nextServiceDate: Date | null | undefined,
  lastServiceDate: Date | null | undefined,
  daysToDueSoon = 14
): PreventiveStatus {
  if (!lastServiceDate && !nextServiceDate) return "NOT_STARTED";
  if (!nextServiceDate) return "NOT_STARTED";
  const now = new Date();
  const diff = differenceInCalendarDays(
    typeof nextServiceDate === "string" ? new Date(nextServiceDate) : nextServiceDate,
    now
  );
  if (diff < 0) return "OVERDUE";
  if (diff <= daysToDueSoon) return "DUE_SOON";
  return "UPCOMING";
}

export function daysUntil(date: Date | string | null | undefined): number | null {
  if (!date) return null;
  return differenceInCalendarDays(
    typeof date === "string" ? new Date(date) : date,
    new Date()
  );
}

export type DateRange = { from: Date; to: Date; label: string };

export function range(label: "today" | "week" | "month" | "year" | "ytd"): DateRange {
  const now = new Date();
  switch (label) {
    case "today":
      return { from: new Date(now.setHours(0, 0, 0, 0)), to: new Date(), label: "Today" };
    case "week":
      return { from: startOfWeek(new Date()), to: endOfWeek(new Date()), label: "This Week" };
    case "month":
      return { from: startOfMonth(new Date()), to: endOfMonth(new Date()), label: "This Month" };
    case "year":
    case "ytd":
      return { from: startOfYear(new Date()), to: endOfYear(new Date()), label: "This Year" };
  }
}

export function lastNDays(n: number): DateRange {
  return { from: subDays(new Date(), n), to: new Date(), label: `Last ${n} days` };
}

export function humanDaysUntil(d: Date | string | null | undefined): string {
  const v = daysUntil(d);
  if (v === null) return "—";
  if (v === 0) return "Today";
  if (v === 1) return "1 day";
  if (v === -1) return "1 day overdue";
  if (v > 0) return `${v} days`;
  return `${Math.abs(v)} days overdue`;
}
