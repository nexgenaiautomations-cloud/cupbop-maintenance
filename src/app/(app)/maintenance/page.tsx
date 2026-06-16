import Link from "next/link";
import { CalendarCheck, Filter, CheckCircle2, LayoutGrid, ListOrdered } from "lucide-react";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { addDays } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PmStatusBadge } from "@/components/ui/badge";
import { formatDate, humanDaysUntil } from "@/lib/dates";
import { LocationGroup } from "@/components/maintenance/location-group";

type SearchParams = Promise<{
  location?: string;
  category?: string;
  status?: string;
  technician?: string;
  scope?: "week" | "month" | "overdue" | "all";
  view?: "by-location" | "table";
}>;

export default async function MaintenancePage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const user = await getSessionUser();
  if (!user) return null;

  const view = sp.view ?? "by-location";

  const [locations, categories, technicians] = await Promise.all([
    prisma.location.findMany({ orderBy: { name: "asc" } }),
    prisma.maintenanceCategory.findMany({ orderBy: { name: "asc" } }),
    prisma.technician.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  const where: Record<string, unknown> = {};
  if (sp.location && sp.location !== "all") where.locationId = sp.location;
  if (sp.category && sp.category !== "all") where.categoryId = sp.category;
  if (sp.status && sp.status !== "all") where.status = sp.status;
  if (sp.technician && sp.technician !== "all") where.assignedTechnicianId = sp.technician;
  if (user.role === "TECHNICIAN" && user.technicianId) where.assignedTechnicianId = user.technicianId;
  if (user.role === "LOCATION_MANAGER" && user.locationId) where.locationId = user.locationId;

  if (sp.scope === "overdue") where.nextServiceDate = { lt: new Date() };
  if (sp.scope === "week") where.nextServiceDate = { gte: new Date(), lte: addDays(new Date(), 7) };
  if (sp.scope === "month") where.nextServiceDate = { gte: new Date(), lte: addDays(new Date(), 30) };

  const tasks = await prisma.preventiveTask.findMany({
    where,
    include: { location: true, category: true, assignedTechnician: true },
    orderBy: [{ nextServiceDate: "asc" }],
  });

  // Group by location
  type Grouped = {
    locationId: string;
    locationName: string;
    region: string | null;
    tasks: typeof tasks;
  };
  const grouped: Grouped[] = [];
  const byId = new Map<string, Grouped>();
  for (const t of tasks) {
    let g = byId.get(t.locationId);
    if (!g) {
      g = { locationId: t.locationId, locationName: t.location.name, region: t.location.region, tasks: [] };
      byId.set(t.locationId, g);
      grouped.push(g);
    }
    g.tasks.push(t);
  }
  grouped.sort((a, b) => a.locationName.localeCompare(b.locationName));

  // Helper to build query strings preserving current filters
  function withParam(key: string, value: string): string {
    const params = new URLSearchParams();
    Object.entries(sp).forEach(([k, v]) => { if (v) params.set(k, String(v)); });
    params.set(key, value);
    return `?${params.toString()}`;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Preventive Maintenance</h1>
          <p className="text-sm text-muted-foreground">
            {tasks.length} recurring tasks across {grouped.length} locations · grouped by store
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/maintenance?scope=overdue"><Button variant="outline" size="sm">Overdue</Button></Link>
          <Link href="/maintenance?scope=week"><Button variant="outline" size="sm">Due This Week</Button></Link>
          <Link href="/maintenance?scope=month"><Button variant="outline" size="sm">Due This Month</Button></Link>
          <Link href="/maintenance"><Button variant="ghost" size="sm">All</Button></Link>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm">Filters</CardTitle>
          </div>
          <div className="inline-flex rounded-md border bg-background p-0.5 text-xs">
            <Link
              href={withParam("view", "by-location")}
              className={`inline-flex items-center gap-1 rounded px-2.5 py-1 ${view === "by-location" ? "bg-cupbop-red text-white" : "text-muted-foreground hover:text-foreground"}`}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> By Location
            </Link>
            <Link
              href={withParam("view", "table")}
              className={`inline-flex items-center gap-1 rounded px-2.5 py-1 ${view === "table" ? "bg-cupbop-red text-white" : "text-muted-foreground hover:text-foreground"}`}
            >
              <ListOrdered className="h-3.5 w-3.5" /> Flat Table
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <form method="get" className="grid grid-cols-1 gap-3 md:grid-cols-5">
            <input type="hidden" name="view" value={view} />
            {user.role === "ADMIN" ? (
              <select name="location" defaultValue={sp.location ?? "all"} className="field-input">
                <option value="all">All Locations</option>
                {locations.map((l) => (<option key={l.id} value={l.id}>{l.name}</option>))}
              </select>
            ) : null}
            <select name="category" defaultValue={sp.category ?? "all"} className="field-input">
              <option value="all">All Categories</option>
              {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
            </select>
            <select name="status" defaultValue={sp.status ?? "all"} className="field-input">
              <option value="all">All Statuses</option>
              <option value="OVERDUE">Overdue</option>
              <option value="DUE_SOON">Due Soon</option>
              <option value="UPCOMING">Upcoming</option>
              <option value="COMPLETED">Completed</option>
              <option value="NOT_STARTED">Not Started</option>
            </select>
            {user.role === "ADMIN" ? (
              <select name="technician" defaultValue={sp.technician ?? "all"} className="field-input">
                <option value="all">All Technicians</option>
                {technicians.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}
              </select>
            ) : null}
            <Button type="submit" size="sm">Apply</Button>
          </form>
        </CardContent>
      </Card>

      {tasks.length === 0 ? (
        <EmptyState icon={CalendarCheck} title="No preventive tasks match" description="Try clearing filters or check back later." />
      ) : view === "by-location" ? (
        <div className="space-y-4">
          {grouped.map((g) => (
            <LocationGroup
              key={g.locationId}
              locationName={g.locationName}
              region={g.region}
              tasks={g.tasks}
              canComplete={user.role !== "LOCATION_MANAGER"}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2 text-left">Location</th>
                    <th className="px-4 py-2 text-left">Category</th>
                    <th className="px-4 py-2 text-left">Frequency</th>
                    <th className="px-4 py-2 text-left">Last Service</th>
                    <th className="px-4 py-2 text-left">Next Service</th>
                    <th className="px-4 py-2 text-left">Days</th>
                    <th className="px-4 py-2 text-left">Technician</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {tasks.map((t) => (
                    <tr key={t.id} className="table-row-hover">
                      <td className="px-4 py-2 font-medium">{t.location.name}</td>
                      <td className="px-4 py-2 text-muted-foreground">{t.category.name}</td>
                      <td className="px-4 py-2 text-muted-foreground">{t.frequencyMonths} mo</td>
                      <td className="px-4 py-2 text-muted-foreground">{formatDate(t.lastServiceDate)}</td>
                      <td className="px-4 py-2 text-muted-foreground">{formatDate(t.nextServiceDate)}</td>
                      <td className="px-4 py-2 text-muted-foreground">{humanDaysUntil(t.nextServiceDate)}</td>
                      <td className="px-4 py-2 text-muted-foreground">{t.assignedTechnician?.name ?? "—"}</td>
                      <td className="px-4 py-2"><PmStatusBadge status={t.status} /></td>
                      <td className="px-4 py-2 text-right">
                        {user.role !== "LOCATION_MANAGER" ? (
                          <Link href={`/maintenance/${t.id}/complete`}>
                            <Button size="sm" variant="success"><CheckCircle2 className="h-3.5 w-3.5" /> Complete</Button>
                          </Link>
                        ) : (
                          <span className="text-xs text-muted-foreground">View only</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
