import Link from "next/link";
import {
  AlertTriangle,
  CalendarClock,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  Flame,
  Wrench,
  Activity,
  Gauge,
  ChevronRight,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/ui/kpi-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PriorityBadge, StatusBadge, PmStatusBadge } from "@/components/ui/badge";
import {
  ComplianceChart,
  LocationsChart,
  PreventiveOverTimeChart,
  PriorityChart,
  WorkOrdersOverTimeChart,
} from "@/components/charts/charts";
import {
  getAverageCompletionTime,
  getDashboardKpis,
  getDueSoonTasks,
  getOnTimeCompliance,
  getOpenWorkOrdersByPriority,
  getOverdueTasks,
  getPreventiveComplianceByLocation,
  getPreventiveOverTime,
  getUrgentOpenWorkOrders,
  getWorkOrdersByLocation,
  getWorkOrdersOverTime,
} from "@/lib/metrics";
import { getLocationSummaries } from "@/lib/location-summary";
import { formatDate, humanDaysUntil } from "@/lib/dates";

export default async function DashboardPage() {
  const [
    kpis,
    woOverTime,
    pmOverTime,
    priority,
    byLocation,
    compliance,
    urgentOpen,
    overdue,
    dueSoon,
    avg,
    onTime,
    locationRows,
  ] = await Promise.all([
    getDashboardKpis(),
    getWorkOrdersOverTime(30),
    getPreventiveOverTime(180),
    getOpenWorkOrdersByPriority(),
    getWorkOrdersByLocation(8),
    getPreventiveComplianceByLocation(),
    getUrgentOpenWorkOrders(8),
    getOverdueTasks(),
    getDueSoonTasks(14),
    getAverageCompletionTime(),
    getOnTimeCompliance(),
    getLocationSummaries(),
  ]);

  const sortedLocations = [...locationRows].sort((a, b) => {
    if (a.urgentWO !== b.urgentWO) return b.urgentWO - a.urgentWO;
    if (a.pmOverdue !== b.pmOverdue) return b.pmOverdue - a.pmOverdue;
    if (a.openWO !== b.openWO) return b.openWO - a.openWO;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Maintenance Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Live view across {locationRows.length} active locations · avg completion {avg} days · on-time PM {onTime}%
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/work-orders/new"><Button><Wrench className="h-4 w-4" />New Work Order</Button></Link>
          <Link href="/maintenance"><Button variant="outline"><CalendarCheck className="h-4 w-4" />Maintenance</Button></Link>
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Work Orders Completed</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <KpiCard label="This Week" value={kpis.woWeek} icon={CheckCircle2} tone="good" />
          <KpiCard label="This Month" value={kpis.woMonth} icon={CheckCircle2} tone="good" />
          <KpiCard label="This Year" value={kpis.woYear} icon={CheckCircle2} tone="good" />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Preventive Maintenance Completed</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <KpiCard label="This Week" value={kpis.pmWeek} icon={CalendarClock} />
          <KpiCard label="This Month" value={kpis.pmMonth} icon={CalendarClock} />
          <KpiCard label="This Year" value={kpis.pmYear} icon={CalendarClock} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Open &amp; At-Risk</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Open Work Orders" value={kpis.openWO} icon={ClipboardList} />
          <KpiCard label="Urgent Work Orders" value={kpis.urgentWO} icon={Flame} tone={kpis.urgentWO > 0 ? "bad" : "neutral"} />
          <KpiCard label="Overdue Preventive" value={kpis.overduePM} icon={AlertTriangle} tone={kpis.overduePM > 0 ? "bad" : "good"} />
          <KpiCard label="Due Soon Preventive" value={kpis.dueSoonPM} icon={Gauge} tone={kpis.dueSoonPM > 0 ? "warn" : "neutral"} />
        </div>
      </section>

      <section>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Locations at a Glance</CardTitle>
            <Link href="/locations" className="text-xs font-medium text-cupbop-red hover:underline">View all locations</Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2 text-left">Location</th>
                    <th className="px-4 py-2 text-left">Region</th>
                    <th className="px-4 py-2 text-right">Open WO</th>
                    <th className="px-4 py-2 text-right">Urgent</th>
                    <th className="px-4 py-2 text-right">PM Overdue</th>
                    <th className="px-4 py-2 text-right">PM Due Soon</th>
                    <th className="px-4 py-2 text-left">Next PM Due</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {sortedLocations.map((l) => {
                    const hot = l.urgentWO > 0 || l.pmOverdue > 0;
                    return (
                      <tr key={l.id} className={`table-row-hover ${hot ? "bg-red-50/30" : ""}`}>
                        <td className="px-4 py-2 font-medium">
                          <Link href={`/locations/${encodeURIComponent(l.name)}`} className="hover:underline">{l.name}</Link>
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">{l.region ?? "—"}</td>
                        <td className="px-4 py-2 text-right">{l.openWO}</td>
                        <td className="px-4 py-2 text-right">
                          {l.urgentWO > 0 ? (
                            <span className="font-semibold text-cupbop-red">{l.urgentWO}</span>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {l.pmOverdue > 0 ? (
                            <span className="font-semibold text-cupbop-red">{l.pmOverdue}</span>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {l.pmDueSoon > 0 ? (
                            <span className="font-semibold text-amber-700">{l.pmDueSoon}</span>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex flex-col leading-tight">
                            <span className="text-foreground">{formatDate(l.nextServiceDate)}</span>
                            <span className="text-xs text-muted-foreground">
                              {l.nextServiceCategory ?? "—"}{l.nextServiceDate ? ` · ${humanDaysUntil(l.nextServiceDate)}` : ""}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-right">
                          <Link href={`/locations/${encodeURIComponent(l.name)}`} className="inline-flex items-center text-muted-foreground hover:text-cupbop-red">
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Completed Work Orders · last 30 days</CardTitle>
          </CardHeader>
          <CardContent><WorkOrdersOverTimeChart data={woOverTime} /></CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Preventive Maintenance Completed · last 6 months</CardTitle>
          </CardHeader>
          <CardContent><PreventiveOverTimeChart data={pmOverTime} /></CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Open by Priority</CardTitle></CardHeader>
          <CardContent><PriorityChart data={priority} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Work Orders by Location</CardTitle></CardHeader>
          <CardContent><LocationsChart data={byLocation} /></CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Preventive Compliance · % on time</CardTitle>
          </CardHeader>
          <CardContent><ComplianceChart data={compliance} /></CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Urgent Open Work Orders</CardTitle>
            <Link href="/work-orders?priority=URGENT" className="text-xs font-medium text-cupbop-red hover:underline">View all</Link>
          </CardHeader>
          <CardContent>
            {urgentOpen.length === 0 ? (
              <EmptyState icon={Activity} title="No urgent work orders" description="All urgent tickets are completed. Nice work." />
            ) : (
              <div className="overflow-hidden rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-left">Location</th>
                      <th className="px-3 py-2 text-left">Request</th>
                      <th className="px-3 py-2 text-left">Technician</th>
                      <th className="px-3 py-2 text-left">Due</th>
                      <th className="px-3 py-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {urgentOpen.map((w) => (
                      <tr key={w.id} className="table-row-hover">
                        <td className="px-3 py-2 font-medium">{w.location.name}</td>
                        <td className="px-3 py-2">
                          <Link href={`/work-orders/${w.id}`} className="hover:underline">
                            {w.title}
                          </Link>
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">{w.assignedTechnician?.name ?? "Unassigned"}</td>
                        <td className="px-3 py-2 text-muted-foreground">{formatDate(w.dueDate)}</td>
                        <td className="px-3 py-2"><StatusBadge status={w.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Preventive Maintenance · Due Soon &amp; Overdue</CardTitle>
            <Link href="/maintenance" className="text-xs font-medium text-cupbop-red hover:underline">View all</Link>
          </CardHeader>
          <CardContent>
            {overdue.length === 0 && dueSoon.length === 0 ? (
              <EmptyState icon={CheckCircle2} title="Nothing due" description="All preventive maintenance is up to date." />
            ) : (
              <div className="overflow-hidden rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-left">Location</th>
                      <th className="px-3 py-2 text-left">Category</th>
                      <th className="px-3 py-2 text-left">Last Service</th>
                      <th className="px-3 py-2 text-left">Next Service</th>
                      <th className="px-3 py-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {[...overdue, ...dueSoon].slice(0, 8).map((t) => (
                      <tr key={t.id} className="table-row-hover">
                        <td className="px-3 py-2 font-medium">{t.location.name}</td>
                        <td className="px-3 py-2 text-muted-foreground">{t.category.name}</td>
                        <td className="px-3 py-2 text-muted-foreground">{formatDate(t.lastServiceDate)}</td>
                        <td className="px-3 py-2">
                          <div className="flex flex-col leading-tight">
                            <span>{formatDate(t.nextServiceDate)}</span>
                            <span className="text-xs text-muted-foreground">{humanDaysUntil(t.nextServiceDate)}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2"><PmStatusBadge status={t.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
