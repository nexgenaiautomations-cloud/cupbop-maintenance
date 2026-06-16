import { prisma } from "./db";
import { range, type DateRange } from "./dates";
import { differenceInCalendarDays, format, subDays, eachDayOfInterval, startOfMonth, addDays } from "date-fns";

export async function getWorkOrderCompletionStats(dr: DateRange) {
  const count = await prisma.workOrder.count({
    where: { status: "COMPLETE", completedAt: { gte: dr.from, lte: dr.to } },
  });
  return count;
}

export async function getPreventiveCompletionStats(dr: DateRange) {
  const count = await prisma.preventiveTaskCompletion.count({
    where: { completedAt: { gte: dr.from, lte: dr.to } },
  });
  return count;
}

export async function getDashboardKpis() {
  const week = range("week");
  const month = range("month");
  const year = range("year");
  const now = new Date();
  const dueSoonCutoff = addDays(now, 14);

  const [
    woWeek,
    woMonth,
    woYear,
    pmWeek,
    pmMonth,
    pmYear,
    openWO,
    urgentWO,
    overduePM,
    dueSoonPM,
  ] = await Promise.all([
    getWorkOrderCompletionStats(week),
    getWorkOrderCompletionStats(month),
    getWorkOrderCompletionStats(year),
    getPreventiveCompletionStats(week),
    getPreventiveCompletionStats(month),
    getPreventiveCompletionStats(year),
    prisma.workOrder.count({ where: { status: { notIn: ["COMPLETE", "CANCELLED"] } } }),
    prisma.workOrder.count({
      where: { priority: "URGENT", status: { notIn: ["COMPLETE", "CANCELLED"] } },
    }),
    prisma.preventiveTask.count({ where: { nextServiceDate: { lt: now } } }),
    prisma.preventiveTask.count({
      where: { nextServiceDate: { gte: now, lte: dueSoonCutoff } },
    }),
  ]);

  return {
    woWeek,
    woMonth,
    woYear,
    pmWeek,
    pmMonth,
    pmYear,
    openWO,
    urgentWO,
    overduePM,
    dueSoonPM,
  };
}

export async function getWorkOrdersOverTime(days = 30) {
  const from = subDays(new Date(), days);
  const rows = await prisma.workOrder.findMany({
    where: { status: "COMPLETE", completedAt: { gte: from } },
    select: { completedAt: true },
  });
  const buckets: Record<string, number> = {};
  for (const day of eachDayOfInterval({ start: from, end: new Date() })) {
    buckets[format(day, "MMM d")] = 0;
  }
  for (const r of rows) {
    if (!r.completedAt) continue;
    const k = format(r.completedAt, "MMM d");
    if (k in buckets) buckets[k] += 1;
  }
  return Object.entries(buckets).map(([date, count]) => ({ date, count }));
}

export async function getPreventiveOverTime(days = 90) {
  const from = subDays(new Date(), days);
  const rows = await prisma.preventiveTaskCompletion.findMany({
    where: { completedAt: { gte: from } },
    select: { completedAt: true },
  });
  // Group by month
  const buckets: Record<string, number> = {};
  for (let i = days; i >= 0; i -= 30) {
    const d = subDays(new Date(), i);
    buckets[format(startOfMonth(d), "MMM yyyy")] = 0;
  }
  for (const r of rows) {
    const k = format(startOfMonth(r.completedAt), "MMM yyyy");
    if (k in buckets) buckets[k] += 1;
  }
  return Object.entries(buckets).map(([month, count]) => ({ month, count }));
}

export async function getOpenWorkOrdersByPriority() {
  const rows = await prisma.workOrder.groupBy({
    by: ["priority"],
    where: { status: { notIn: ["COMPLETE", "CANCELLED"] } },
    _count: { _all: true },
  });
  const map: Record<string, number> = { URGENT: 0, IMPORTANT: 0, SUBORDINATE: 0 };
  for (const r of rows) map[r.priority] = r._count._all;
  return [
    { priority: "Urgent", count: map.URGENT },
    { priority: "Important", count: map.IMPORTANT },
    { priority: "Subordinate", count: map.SUBORDINATE },
  ];
}

export async function getWorkOrdersByLocation(limit = 8) {
  const rows = await prisma.workOrder.groupBy({
    by: ["locationId"],
    _count: { _all: true },
  });
  const locs = await prisma.location.findMany({
    where: { id: { in: rows.map((r) => r.locationId) } },
    select: { id: true, name: true },
  });
  const byId = new Map(locs.map((l) => [l.id, l.name]));
  return rows
    .map((r) => ({ location: byId.get(r.locationId) ?? "?", count: r._count._all }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export async function getPreventiveComplianceByLocation() {
  const completions = await prisma.preventiveTaskCompletion.findMany({
    include: { preventiveTask: true, location: { select: { name: true } } },
  });
  type Bucket = { onTime: number; total: number };
  const byLocation = new Map<string, Bucket>();
  for (const c of completions) {
    const due = c.preventiveTask.nextServiceDate;
    const completedOnTime =
      !due || c.completedAt.getTime() <= due.getTime();
    const key = c.location.name;
    const b = byLocation.get(key) ?? { onTime: 0, total: 0 };
    b.total++;
    if (completedOnTime) b.onTime++;
    byLocation.set(key, b);
  }
  return Array.from(byLocation.entries())
    .map(([location, b]) => ({
      location,
      pct: b.total === 0 ? 0 : Math.round((b.onTime / b.total) * 100),
      total: b.total,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);
}

export async function getOverdueTasks() {
  return prisma.preventiveTask.findMany({
    where: { nextServiceDate: { lt: new Date() } },
    include: { location: true, category: true, assignedTechnician: true },
    orderBy: { nextServiceDate: "asc" },
  });
}

export async function getDueSoonTasks(days = 14) {
  const cutoff = addDays(new Date(), days);
  return prisma.preventiveTask.findMany({
    where: { nextServiceDate: { gte: new Date(), lte: cutoff } },
    include: { location: true, category: true, assignedTechnician: true },
    orderBy: { nextServiceDate: "asc" },
  });
}

export async function getUrgentOpenWorkOrders(limit = 10) {
  return prisma.workOrder.findMany({
    where: { priority: "URGENT", status: { notIn: ["COMPLETE", "CANCELLED"] } },
    include: { location: true, assignedTechnician: true },
    orderBy: { requestDate: "desc" },
    take: limit,
  });
}

export async function getAverageCompletionTime() {
  const rows = await prisma.workOrder.findMany({
    where: { status: "COMPLETE", completedAt: { not: null } },
    select: { requestDate: true, completedAt: true },
  });
  if (rows.length === 0) return 0;
  const sum = rows.reduce(
    (acc, r) =>
      acc +
      Math.max(
        0,
        differenceInCalendarDays(r.completedAt as Date, r.requestDate)
      ),
    0
  );
  return Math.round((sum / rows.length) * 10) / 10;
}

export async function getOnTimeCompliance() {
  const completions = await prisma.preventiveTaskCompletion.findMany({
    include: { preventiveTask: { select: { nextServiceDate: true } } },
  });
  if (completions.length === 0) return 0;
  const onTime = completions.filter(
    (c) => !c.preventiveTask.nextServiceDate ||
      c.completedAt.getTime() <= c.preventiveTask.nextServiceDate.getTime()
  ).length;
  return Math.round((onTime / completions.length) * 100);
}
