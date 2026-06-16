import Link from "next/link";
import { redirect } from "next/navigation";
import { addDays, format, isSameDay, startOfDay } from "date-fns";
import {
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  ChevronRight,
  MapPin,
  Wrench,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PriorityBadge, PmStatusBadge } from "@/components/ui/badge";
import { DailyChecklist } from "@/components/planner/daily-checklist";
import { formatDate } from "@/lib/dates";

export default async function PlannerPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role === "LOCATION_MANAGER") redirect("/location");

  const today = startOfDay(new Date());
  const weekEnd = addDays(today, 7);

  // If user has a technicianId, scope to them; otherwise show everything (admin view)
  const techScope = user.technicianId ? { assignedTechnicianId: user.technicianId } : {};

  const [workOrders, pmTasks] = await Promise.all([
    prisma.workOrder.findMany({
      where: {
        ...techScope,
        status: { notIn: ["COMPLETE", "CANCELLED"] },
        OR: [{ dueDate: { gte: today, lte: weekEnd } }, { dueDate: null }],
      },
      include: { location: true, assignedTechnician: true },
      orderBy: [{ priority: "asc" }, { dueDate: "asc" }],
    }),
    prisma.preventiveTask.findMany({
      where: {
        ...techScope,
        nextServiceDate: { lte: weekEnd },
      },
      include: { location: true, category: true, assignedTechnician: true },
      orderBy: { nextServiceDate: "asc" },
    }),
  ]);

  // Build 7-day buckets
  type DayBucket = {
    date: Date;
    label: string;
    isToday: boolean;
    workOrders: typeof workOrders;
    pmTasks: typeof pmTasks;
  };

  const days: DayBucket[] = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(today, i);
    return {
      date,
      label: format(date, "EEEE"),
      isToday: i === 0,
      workOrders: [],
      pmTasks: [],
    };
  });

  for (const w of workOrders) {
    if (!w.dueDate) continue;
    const idx = days.findIndex((d) => isSameDay(d.date, w.dueDate as Date));
    if (idx >= 0) days[idx].workOrders.push(w);
  }
  const overdueWos = workOrders.filter((w) => w.dueDate && w.dueDate < today);
  const noDateWos = workOrders.filter((w) => !w.dueDate);

  for (const t of pmTasks) {
    if (!t.nextServiceDate) continue;
    const idx = days.findIndex((d) => isSameDay(d.date, t.nextServiceDate as Date));
    if (idx >= 0) days[idx].pmTasks.push(t);
  }
  const overduePms = pmTasks.filter((t) => t.nextServiceDate && t.nextServiceDate < today);

  return (
    <div className="space-y-6">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-xs text-muted-foreground shadow-sm">
          <CalendarDays className="h-3.5 w-3.5" /> Daily &amp; Weekly Planner
        </div>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">
          {user.technicianId ? "My Day" : "Operations Plan"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {format(today, "EEEE, MMMM d, yyyy")}
          {user.technicianId ? null : (
            <span className="ml-1">· showing all assigned work across technicians</span>
          )}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Today&apos;s Checklist
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DailyChecklist />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-cupbop-red" /> Today&apos;s Jobs
            </CardTitle>
            <span className="text-xs text-muted-foreground">
              {days[0].workOrders.length} work orders · {days[0].pmTasks.length} PMs
            </span>
          </CardHeader>
          <CardContent>
            {days[0].workOrders.length === 0 && days[0].pmTasks.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title="Nothing scheduled for today"
                description="Look ahead with the weekly view below, or add a work order."
              />
            ) : (
              <div className="space-y-2">
                {days[0].workOrders.map((w) => (
                  <Link
                    key={w.id}
                    href={`/work-orders/${w.id}`}
                    className="flex items-start justify-between gap-3 rounded-md border bg-white px-3 py-2.5 text-sm shadow-sm hover:bg-secondary/40"
                  >
                    <div>
                      <div className="font-medium">{w.title}</div>
                      <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" /> {w.location.name}
                        <span>·</span>
                        <span>{w.assignedTechnician?.name ?? "Unassigned"}</span>
                      </div>
                    </div>
                    <PriorityBadge priority={w.priority} />
                  </Link>
                ))}
                {days[0].pmTasks.map((t) => (
                  <Link
                    key={t.id}
                    href={`/maintenance/${t.id}/complete`}
                    className="flex items-start justify-between gap-3 rounded-md border bg-white px-3 py-2.5 text-sm shadow-sm hover:bg-secondary/40"
                  >
                    <div>
                      <div className="font-medium">{t.category.name}</div>
                      <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CalendarCheck className="h-3.5 w-3.5" /> {t.location.name}
                        <span>·</span>
                        <span>{t.assignedTechnician?.name ?? "Unassigned"}</span>
                      </div>
                    </div>
                    <PmStatusBadge status={t.status} />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {overdueWos.length > 0 || overduePms.length > 0 ? (
        <Card className="border-red-200 bg-red-50/30">
          <CardHeader>
            <CardTitle className="text-sm text-red-700">
              ⚠ {overdueWos.length + overduePms.length} item(s) past due
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {overdueWos.map((w) => (
              <Link key={w.id} href={`/work-orders/${w.id}`} className="flex items-center justify-between rounded-md border bg-white px-3 py-2 text-sm hover:bg-secondary/40">
                <span><span className="font-medium">{w.title}</span> · {w.location.name}</span>
                <span className="text-xs text-red-600">due {formatDate(w.dueDate)}</span>
              </Link>
            ))}
            {overduePms.map((t) => (
              <Link key={t.id} href={`/maintenance/${t.id}/complete`} className="flex items-center justify-between rounded-md border bg-white px-3 py-2 text-sm hover:bg-secondary/40">
                <span><span className="font-medium">{t.category.name}</span> · {t.location.name}</span>
                <span className="text-xs text-red-600">due {formatDate(t.nextServiceDate)}</span>
              </Link>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" /> This Week
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {days.map((d) => (
              <div
                key={d.date.toISOString()}
                className={
                  "rounded-lg border bg-white p-3 shadow-sm " +
                  (d.isToday ? "border-cupbop-red/40 ring-1 ring-cupbop-red/30" : "")
                }
              >
                <div className="mb-2 flex items-baseline justify-between">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {d.label}
                    </div>
                    <div className="text-base font-semibold">
                      {format(d.date, "MMM d")}
                      {d.isToday ? <span className="ml-2 rounded-full bg-cupbop-red/10 px-2 py-0.5 text-[10px] font-semibold text-cupbop-red">TODAY</span> : null}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {d.workOrders.length + d.pmTasks.length}
                  </span>
                </div>
                {d.workOrders.length === 0 && d.pmTasks.length === 0 ? (
                  <div className="rounded-md border border-dashed bg-muted/30 px-2 py-3 text-center text-xs text-muted-foreground">
                    Nothing scheduled
                  </div>
                ) : (
                  <ul className="space-y-1.5">
                    {d.workOrders.map((w) => (
                      <li key={w.id}>
                        <Link
                          href={`/work-orders/${w.id}`}
                          className="flex items-start gap-2 rounded-md border bg-white px-2 py-1.5 text-xs hover:bg-secondary/40"
                        >
                          <Wrench className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cupbop-red" />
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-medium">{w.title}</div>
                            <div className="truncate text-[11px] text-muted-foreground">{w.location.name}</div>
                          </div>
                          <ChevronRight className="h-3 w-3 text-muted-foreground" />
                        </Link>
                      </li>
                    ))}
                    {d.pmTasks.map((t) => (
                      <li key={t.id}>
                        <Link
                          href={`/maintenance/${t.id}/complete`}
                          className="flex items-start gap-2 rounded-md border bg-white px-2 py-1.5 text-xs hover:bg-secondary/40"
                        >
                          <CalendarCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-medium">{t.category.name}</div>
                            <div className="truncate text-[11px] text-muted-foreground">{t.location.name}</div>
                          </div>
                          <ChevronRight className="h-3 w-3 text-muted-foreground" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {noDateWos.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" /> Assigned Work Orders Without Due Date
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {noDateWos.map((w) => (
              <Link
                key={w.id}
                href={`/work-orders/${w.id}`}
                className="flex items-center justify-between rounded-md border bg-white px-3 py-2 text-sm hover:bg-secondary/40"
              >
                <span>
                  <span className="font-medium">{w.title}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{w.location.name}</span>
                </span>
                <Button size="sm" variant="outline">Schedule</Button>
              </Link>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
