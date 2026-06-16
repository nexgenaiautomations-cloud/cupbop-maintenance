import { prisma } from "@/lib/db";
import { range } from "@/lib/dates";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/ui/kpi-card";
import { BarChart3, CalendarRange, CheckCircle2, Gauge, Download } from "lucide-react";
import { getAverageCompletionTime, getOnTimeCompliance, getWorkOrdersByLocation } from "@/lib/metrics";

const COMPLETION_LABEL: Record<string, string> = {
  week: "This Week",
  month: "This Month",
  year: "This Year",
};

async function summary(scope: "week" | "month" | "year") {
  const dr = range(scope);
  const [wo, pm] = await Promise.all([
    prisma.workOrder.count({
      where: { status: "COMPLETE", completedAt: { gte: dr.from, lte: dr.to } },
    }),
    prisma.preventiveTaskCompletion.count({
      where: { completedAt: { gte: dr.from, lte: dr.to } },
    }),
  ]);
  return { wo, pm, label: COMPLETION_LABEL[scope] };
}

export default async function ReportsPage() {
  const [week, month, year, avg, compliance, byLocation, overdueCount, urgentCount] = await Promise.all([
    summary("week"),
    summary("month"),
    summary("year"),
    getAverageCompletionTime(),
    getOnTimeCompliance(),
    getWorkOrdersByLocation(10),
    prisma.preventiveTask.count({ where: { nextServiceDate: { lt: new Date() } } }),
    prisma.workOrder.count({ where: { priority: "URGENT", status: { notIn: ["COMPLETE", "CANCELLED"] } } }),
  ]);

  const categoryFreq = await prisma.workOrder.groupBy({
    by: ["category"],
    _count: { _all: true },
    where: { category: { not: null } },
  });
  const topCategories = categoryFreq
    .map((c) => ({ name: c.category ?? "—", count: c._count._all }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground">
          Maintenance summaries, productivity, and compliance. Export to CSV from any section.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard label="Avg WO Completion" value={`${avg}d`} icon={Gauge} />
        <KpiCard label="On-Time PM" value={`${compliance}%`} icon={CheckCircle2} tone={compliance >= 80 ? "good" : "warn"} />
        <KpiCard label="Overdue PM" value={overdueCount} icon={CalendarRange} tone={overdueCount === 0 ? "good" : "bad"} />
        <KpiCard label="Open Urgent WOs" value={urgentCount} icon={BarChart3} tone={urgentCount === 0 ? "good" : "bad"} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[week, month, year].map((s) => (
          <Card key={s.label}>
            <CardHeader><CardTitle>{s.label} Summary</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Work Orders Completed</span><span className="font-semibold">{s.wo}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Preventive Tasks Completed</span><span className="font-semibold">{s.pm}</span></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Most Active Locations</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 text-left">Location</th>
                  <th className="px-4 py-2 text-right">Total Work Orders</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {byLocation.map((r) => (
                  <tr key={r.location} className="table-row-hover">
                    <td className="px-4 py-2 font-medium">{r.location}</td>
                    <td className="px-4 py-2 text-right">{r.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Most Common Issue Categories</CardTitle></CardHeader>
        <CardContent>
          {topCategories.length === 0 ? (
            <p className="text-sm text-muted-foreground">No categorized data yet.</p>
          ) : (
            <ul className="divide-y rounded-md border">
              {topCategories.map((c) => (
                <li key={c.name} className="flex items-center justify-between px-4 py-2">
                  <span>{c.name}</span>
                  <span className="text-sm font-semibold">{c.count}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Export &amp; Share with Owners</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            <a
              href="/api/export/work-orders"
              className="group flex items-center justify-between rounded-lg border bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-cupbop-red hover:shadow-md"
            >
              <div>
                <div className="text-sm font-semibold">Work Orders CSV</div>
                <div className="text-xs text-muted-foreground">All requests · status · technician · dates</div>
              </div>
              <Download className="h-5 w-5 text-cupbop-red transition-transform group-hover:translate-y-0.5" />
            </a>
            <a
              href="/api/export/maintenance"
              className="group flex items-center justify-between rounded-lg border bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-cupbop-red hover:shadow-md"
            >
              <div>
                <div className="text-sm font-semibold">Preventive Maintenance CSV</div>
                <div className="text-xs text-muted-foreground">Last service · next service · status per location</div>
              </div>
              <Download className="h-5 w-5 text-cupbop-red transition-transform group-hover:translate-y-0.5" />
            </a>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Files open directly in Excel, Google Sheets, or any spreadsheet app — perfect for sharing with ownership.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
