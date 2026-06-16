import Link from "next/link";
import { Plus, ClipboardList, Filter, LayoutGrid, ListOrdered } from "lucide-react";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PriorityBadge, StatusBadge } from "@/components/ui/badge";
import { formatDate, humanDaysUntil } from "@/lib/dates";
import { WORK_ORDER_PRIORITIES, WORK_ORDER_STATUSES } from "@/lib/types";
import { WorkOrderLocationGroup } from "@/components/work-orders/location-group";

type SearchParams = Promise<{
  location?: string;
  priority?: string;
  status?: string;
  technician?: string;
  q?: string;
  scope?: "open" | "complete" | "all" | "urgent";
  view?: "by-location" | "table";
}>;

export default async function WorkOrdersPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const user = await getSessionUser();
  if (!user) return null;

  const view = sp.view ?? "by-location";

  const [locations, technicians] = await Promise.all([
    prisma.location.findMany({ orderBy: { name: "asc" } }),
    prisma.technician.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  const where: Record<string, unknown> = {};
  if (sp.location && sp.location !== "all") where.locationId = sp.location;
  if (sp.priority && sp.priority !== "all") where.priority = sp.priority;
  if (sp.status && sp.status !== "all") where.status = sp.status;
  if (sp.technician && sp.technician !== "all") where.assignedTechnicianId = sp.technician;
  if (sp.q && sp.q.trim()) {
    where.OR = [
      { title: { contains: sp.q } },
      { description: { contains: sp.q } },
    ];
  }
  if (sp.scope === "open") where.status = { notIn: ["COMPLETE", "CANCELLED"] };
  if (sp.scope === "complete") where.status = "COMPLETE";
  if (sp.scope === "urgent") {
    where.priority = "URGENT";
    where.status = { notIn: ["COMPLETE", "CANCELLED"] };
  }
  if (user.role === "TECHNICIAN" && user.technicianId) where.assignedTechnicianId = user.technicianId;
  if (user.role === "LOCATION_MANAGER" && user.locationId) where.locationId = user.locationId;

  const orders = await prisma.workOrder.findMany({
    where,
    include: { location: true, assignedTechnician: true },
    orderBy: [{ requestDate: "desc" }],
    take: 500,
  });

  type Grouped = {
    locationId: string;
    locationName: string;
    region: string | null;
    orders: typeof orders;
  };
  const grouped: Grouped[] = [];
  const byId = new Map<string, Grouped>();
  for (const o of orders) {
    let g = byId.get(o.locationId);
    if (!g) {
      g = { locationId: o.locationId, locationName: o.location.name, region: o.location.region, orders: [] };
      byId.set(o.locationId, g);
      grouped.push(g);
    }
    g.orders.push(o);
  }
  grouped.sort((a, b) => {
    const urgA = a.orders.filter((o) => o.priority === "URGENT" && o.status !== "COMPLETE" && o.status !== "CANCELLED").length;
    const urgB = b.orders.filter((o) => o.priority === "URGENT" && o.status !== "COMPLETE" && o.status !== "CANCELLED").length;
    if (urgA !== urgB) return urgB - urgA;
    return a.locationName.localeCompare(b.locationName);
  });

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
          <h1 className="text-2xl font-semibold tracking-tight">Work Orders</h1>
          <p className="text-sm text-muted-foreground">
            {orders.length} matching across {grouped.length} locations · sorted urgent-first then by store
          </p>
        </div>
        {user.role !== "LOCATION_MANAGER" ? (
          <Link href="/work-orders/new">
            <Button><Plus className="h-4 w-4" /> New Work Order</Button>
          </Link>
        ) : null}
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
          <form method="get" className="grid grid-cols-1 gap-3 md:grid-cols-6">
            <input type="hidden" name="view" value={view} />
            <input
              name="q"
              defaultValue={sp.q ?? ""}
              placeholder="Search title/description"
              className="field-input"
            />
            {user.role === "ADMIN" ? (
              <select name="location" defaultValue={sp.location ?? "all"} className="field-input">
                <option value="all">All Locations</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            ) : null}
            <select name="priority" defaultValue={sp.priority ?? "all"} className="field-input">
              <option value="all">All Priorities</option>
              {WORK_ORDER_PRIORITIES.map((p) => (
                <option key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</option>
              ))}
            </select>
            <select name="status" defaultValue={sp.status ?? "all"} className="field-input">
              <option value="all">All Statuses</option>
              {WORK_ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>{s.replace("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}</option>
              ))}
            </select>
            {user.role === "ADMIN" ? (
              <select name="technician" defaultValue={sp.technician ?? "all"} className="field-input">
                <option value="all">All Technicians</option>
                {technicians.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            ) : null}
            <select name="scope" defaultValue={sp.scope ?? "all"} className="field-input">
              <option value="all">All Records</option>
              <option value="open">Open Only</option>
              <option value="urgent">Urgent Only</option>
              <option value="complete">Completed</option>
            </select>
            <div className="md:col-span-6 flex items-center gap-2">
              <Button type="submit" size="sm">Apply</Button>
              <Link href="/work-orders" className="text-xs text-muted-foreground hover:text-foreground">Clear</Link>
            </div>
          </form>
        </CardContent>
      </Card>

      {orders.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No work orders match"
          description="Try clearing filters or creating a new request."
          action={
            user.role !== "LOCATION_MANAGER" ? (
              <Link href="/work-orders/new"><Button><Plus className="h-4 w-4" />New Work Order</Button></Link>
            ) : null
          }
        />
      ) : view === "by-location" ? (
        <div className="space-y-4">
          {grouped.map((g) => (
            <WorkOrderLocationGroup
              key={g.locationId}
              locationName={g.locationName}
              region={g.region}
              orders={g.orders}
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
                    <th className="px-4 py-2 text-left">Request</th>
                    <th className="px-4 py-2 text-left">Priority</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Technician</th>
                    <th className="px-4 py-2 text-left">Requested</th>
                    <th className="px-4 py-2 text-left">Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {orders.map((w) => (
                    <tr key={w.id} className="table-row-hover">
                      <td className="px-4 py-2 font-medium">{w.location.name}</td>
                      <td className="px-4 py-2">
                        <Link href={`/work-orders/${w.id}`} className="text-foreground hover:underline">
                          {w.title}
                        </Link>
                        {w.category ? (
                          <span className="ml-2 text-xs text-muted-foreground">· {w.category}</span>
                        ) : null}
                      </td>
                      <td className="px-4 py-2"><PriorityBadge priority={w.priority} /></td>
                      <td className="px-4 py-2"><StatusBadge status={w.status} /></td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {w.assignedTechnician?.name ?? "Unassigned"}
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">{formatDate(w.requestDate)}</td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {w.dueDate ? humanDaysUntil(w.dueDate) : "—"}
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
