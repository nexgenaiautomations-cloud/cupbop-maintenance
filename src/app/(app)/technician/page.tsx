import Link from "next/link";
import { ClipboardList, MapPin, PhoneCall, AlertTriangle, CalendarClock, CheckCircle2, Plus } from "lucide-react";
import { redirect } from "next/navigation";
import { addDays } from "date-fns";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/ui/kpi-card";
import { EmptyState } from "@/components/ui/empty-state";
import { PriorityBadge, StatusBadge, PmStatusBadge } from "@/components/ui/badge";
import { formatDate, humanDaysUntil, range } from "@/lib/dates";

export default async function TechnicianPortal() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role === "LOCATION_MANAGER") redirect("/location");

  const techId = user.technicianId;
  const week = range("week");
  const month = range("month");
  const year = range("year");
  const now = new Date();

  const baseWhere = techId ? { assignedTechnicianId: techId } : {};

  const [openWOs, pmTasks, completedWeek, completedMonth, completedYear, overdue] = await Promise.all([
    prisma.workOrder.findMany({
      where: { ...baseWhere, status: { notIn: ["COMPLETE", "CANCELLED"] } },
      include: { location: true },
      orderBy: [{ priority: "asc" }, { dueDate: "asc" }],
    }),
    prisma.preventiveTask.findMany({
      where: { ...baseWhere, nextServiceDate: { lte: addDays(now, 30) } },
      include: { location: true, category: true },
      orderBy: { nextServiceDate: "asc" },
    }),
    prisma.workOrder.count({
      where: { ...baseWhere, status: "COMPLETE", completedAt: { gte: week.from, lte: week.to } },
    }),
    prisma.workOrder.count({
      where: { ...baseWhere, status: "COMPLETE", completedAt: { gte: month.from, lte: month.to } },
    }),
    prisma.workOrder.count({
      where: { ...baseWhere, status: "COMPLETE", completedAt: { gte: year.from, lte: year.to } },
    }),
    prisma.preventiveTask.count({
      where: { ...baseWhere, nextServiceDate: { lt: now } },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Work</h1>
          <p className="text-sm text-muted-foreground">Today&apos;s assignments and upcoming preventive maintenance.</p>
        </div>
        <Link href="/work-orders/new">
          <Button size="lg"><Plus className="h-4 w-4" /> Create Work Order</Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Open Work Orders" value={openWOs.length} icon={ClipboardList} />
        <KpiCard label="Overdue PM" value={overdue} icon={AlertTriangle} tone={overdue > 0 ? "bad" : "good"} />
        <KpiCard label="Completed · Week" value={completedWeek} icon={CheckCircle2} tone="good" />
        <KpiCard label="Completed · Year" value={completedYear} icon={CheckCircle2} hint={`${completedMonth} this month`} />
      </div>

      <Card>
        <CardHeader><CardTitle>Work Order Queue</CardTitle></CardHeader>
        <CardContent>
          {openWOs.length === 0 ? (
            <EmptyState icon={CheckCircle2} title="Inbox zero." description="No assigned work orders open right now." />
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {openWOs.map((w) => (
                <Card key={w.id} className="border-l-4" style={{ borderLeftColor: w.priority === "URGENT" ? "#E11D2A" : w.priority === "IMPORTANT" ? "#F8C622" : "#94a3b8" }}>
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link href={`/work-orders/${w.id}`} className="font-medium hover:underline">
                          {w.title}
                        </Link>
                        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" /> {w.location.name}
                        </div>
                      </div>
                      <PriorityBadge priority={w.priority} />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <StatusBadge status={w.status} />
                      <span>Due {w.dueDate ? humanDaysUntil(w.dueDate) : "—"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/work-orders/${w.id}`}><Button size="sm" variant="outline">Open</Button></Link>
                      <Button size="sm" variant="ghost"><PhoneCall className="h-3.5 w-3.5" /> Call store</Button>
                      <Button size="sm" variant="ghost"><MapPin className="h-3.5 w-3.5" /> Maps</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Preventive Maintenance · Next 30 days</CardTitle></CardHeader>
        <CardContent>
          {pmTasks.length === 0 ? (
            <EmptyState icon={CalendarClock} title="Nothing scheduled" description="No preventive tasks in the next 30 days." />
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {pmTasks.map((t) => (
                <Card key={t.id}>
                  <CardContent className="space-y-2 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-medium">{t.category.name}</div>
                        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" /> {t.location.name}
                        </div>
                      </div>
                      <PmStatusBadge status={t.status} />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Next: {formatDate(t.nextServiceDate)} · {humanDaysUntil(t.nextServiceDate)}
                    </div>
                    <Link href={`/maintenance/${t.id}/complete`}>
                      <Button size="sm" variant="success" className="w-full">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Mark Complete
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
