import Link from "next/link";
import { redirect } from "next/navigation";
import { addDays } from "date-fns";
import {
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Plus,
  Sparkles,
  Store,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PriorityBadge, StatusBadge, PmStatusBadge } from "@/components/ui/badge";
import { formatDate, humanDaysUntil } from "@/lib/dates";

export default async function LocationPortal({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  const sp = await searchParams;
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "LOCATION_MANAGER" || !user.locationId) {
    if (user.role === "ADMIN") {
      // Admin can preview — pick first location for demo
      const first = await prisma.location.findFirst({ orderBy: { name: "asc" } });
      if (!first) redirect("/dashboard");
    } else {
      redirect("/");
    }
  }

  const locationId = user.locationId ?? (await prisma.location.findFirstOrThrow({ orderBy: { name: "asc" } })).id;
  const location = await prisma.location.findUniqueOrThrow({ where: { id: locationId } });
  const now = new Date();

  const [openWOs, completedWOs, upcomingPM] = await Promise.all([
    prisma.workOrder.findMany({
      where: { locationId, status: { notIn: ["COMPLETE", "CANCELLED"] } },
      include: { assignedTechnician: true },
      orderBy: { requestDate: "desc" },
      take: 50,
    }),
    prisma.workOrder.findMany({
      where: { locationId, status: "COMPLETE" },
      include: { assignedTechnician: true },
      orderBy: { completedAt: "desc" },
      take: 10,
    }),
    prisma.preventiveTask.findMany({
      where: { locationId, nextServiceDate: { lte: addDays(now, 60) } },
      include: { category: true, assignedTechnician: true },
      orderBy: { nextServiceDate: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-xs text-muted-foreground shadow-sm">
            <Store className="h-3.5 w-3.5" /> Location Portal
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">{location.name}</h1>
          <p className="text-sm text-muted-foreground">{location.region} · Manager: {location.managerName ?? "—"}</p>
        </div>
        <Link href="/work-orders/new">
          <Button size="lg"><Plus className="h-4 w-4" /> Submit Work Order</Button>
        </Link>
      </div>

      {sp.created ? (
        <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <Sparkles className="h-4 w-4" />
          Your work order was submitted. The maintenance team has been notified.
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-5"><div className="text-xs uppercase tracking-wide text-muted-foreground">Open Work Orders</div><div className="kpi-num mt-1">{openWOs.length}</div></CardContent></Card>
        <Card><CardContent className="p-5"><div className="text-xs uppercase tracking-wide text-muted-foreground">Completed (last 10)</div><div className="kpi-num mt-1">{completedWOs.length}</div></CardContent></Card>
        <Card><CardContent className="p-5"><div className="text-xs uppercase tracking-wide text-muted-foreground">PM Coming Up (60 days)</div><div className="kpi-num mt-1">{upcomingPM.length}</div></CardContent></Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Open Work Orders at My Store</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {openWOs.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="No open work orders"
                description="Need something fixed? Submit a request."
                action={
                  <Link href="/work-orders/new"><Button><Plus className="h-4 w-4" /> Submit Work Order</Button></Link>
                }
              />
            ) : (
              openWOs.map((w) => (
                <Link href={`/work-orders/${w.id}`} key={w.id} className="block rounded-md border bg-white p-3 text-sm shadow-sm hover:bg-secondary">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-medium">{w.title}</div>
                    <PriorityBadge priority={w.priority} />
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <StatusBadge status={w.status} />
                    <span>{w.assignedTechnician?.name ?? "Unassigned"}</span>
                    <span>· Requested {formatDate(w.requestDate)}</span>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Upcoming Preventive Maintenance</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {upcomingPM.length === 0 ? (
              <EmptyState icon={CalendarClock} title="All clear" description="No preventive maintenance scheduled in the next 60 days." />
            ) : (
              upcomingPM.map((t) => (
                <div key={t.id} className="rounded-md border bg-white p-3 text-sm shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium">{t.category.name}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        Next service {formatDate(t.nextServiceDate)} · {humanDaysUntil(t.nextServiceDate)}
                      </div>
                    </div>
                    <PmStatusBadge status={t.status} />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Recent History</CardTitle></CardHeader>
        <CardContent>
          {completedWOs.length === 0 ? (
            <EmptyState icon={CheckCircle2} title="No completed history yet" description="Once issues are resolved they'll show up here." />
          ) : (
            <div className="overflow-hidden rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2 text-left">Title</th>
                    <th className="px-4 py-2 text-left">Technician</th>
                    <th className="px-4 py-2 text-left">Completed</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {completedWOs.map((w) => (
                    <tr key={w.id} className="table-row-hover">
                      <td className="px-4 py-2">
                        <Link href={`/work-orders/${w.id}`} className="hover:underline">{w.title}</Link>
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">{w.assignedTechnician?.name ?? "—"}</td>
                      <td className="px-4 py-2 text-muted-foreground">{formatDate(w.completedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
