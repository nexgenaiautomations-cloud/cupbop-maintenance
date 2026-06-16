import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Building2, Plus, Wrench } from "lucide-react";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LocationGroup } from "@/components/maintenance/location-group";
import { WorkOrderLocationGroup } from "@/components/work-orders/location-group";
import { EmptyState } from "@/components/ui/empty-state";
import { KpiCard } from "@/components/ui/kpi-card";
import { NewLocationLoginForm } from "@/components/accounts/new-location-login-form";

export default async function LocationDetailPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const locationName = decodeURIComponent(name);
  const location = await prisma.location.findUnique({ where: { name: locationName } });
  if (!location) notFound();
  if (user.role === "LOCATION_MANAGER" && user.locationId !== location.id) notFound();

  const existingManager = await prisma.user.findFirst({
    where: { locationId: location.id, role: "LOCATION_MANAGER" },
    select: { name: true, email: true, username: true },
  });

  const [openOrders, completedOrders, pmTasks] = await Promise.all([
    prisma.workOrder.findMany({
      where: { locationId: location.id, status: { notIn: ["COMPLETE", "CANCELLED"] } },
      include: { assignedTechnician: true, location: true },
      orderBy: [{ priority: "asc" }, { requestDate: "desc" }],
    }),
    prisma.workOrder.findMany({
      where: { locationId: location.id, status: "COMPLETE" },
      include: { assignedTechnician: true, location: true },
      orderBy: { completedAt: "desc" },
      take: 10,
    }),
    prisma.preventiveTask.findMany({
      where: { locationId: location.id },
      include: { category: true, assignedTechnician: true, location: true },
      orderBy: { nextServiceDate: "asc" },
    }),
  ]);

  const urgent = openOrders.filter((o) => o.priority === "URGENT").length;
  const overdue = pmTasks.filter((p) => p.status === "OVERDUE").length;
  const dueSoon = pmTasks.filter((p) => p.status === "DUE_SOON").length;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/locations" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> All locations
        </Link>
        <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{location.name}</h1>
            <p className="text-sm text-muted-foreground">
              {location.region ?? ""} · Manager: {location.managerName ?? "—"}
            </p>
          </div>
          {user.role !== "LOCATION_MANAGER" ? (
            <Link href={`/work-orders/new?locationId=${location.id}`}>
              <Button><Plus className="h-4 w-4" /> New Work Order</Button>
            </Link>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Open Work Orders" value={openOrders.length} icon={Wrench} />
        <KpiCard label="Urgent Open" value={urgent} icon={Wrench} tone={urgent > 0 ? "bad" : "good"} />
        <KpiCard label="PM Overdue" value={overdue} icon={Building2} tone={overdue > 0 ? "bad" : "good"} />
        <KpiCard label="PM Due Soon" value={dueSoon} icon={Building2} tone={dueSoon > 0 ? "warn" : "neutral"} />
      </div>

      {user.role !== "LOCATION_MANAGER" ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Store Manager Access</h2>
          <NewLocationLoginForm
            locationId={location.id}
            locationName={location.name}
            existingManager={existingManager}
          />
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Open Work Orders</h2>
        {openOrders.length === 0 ? (
          <EmptyState icon={Wrench} title="No open work orders" description="This store has nothing open right now." />
        ) : (
          <WorkOrderLocationGroup locationName={location.name} region={location.region} orders={openOrders} />
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Preventive Maintenance</h2>
        <LocationGroup
          locationName={location.name}
          region={location.region}
          tasks={pmTasks}
          canComplete={user.role !== "LOCATION_MANAGER"}
          showLink={false}
        />
      </section>

      {completedOrders.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Recently Completed</h2>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2 text-left">Title</th>
                      <th className="px-4 py-2 text-left">Technician</th>
                      <th className="px-4 py-2 text-left">Completed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {completedOrders.map((w) => (
                      <tr key={w.id} className="table-row-hover">
                        <td className="px-4 py-2"><Link href={`/work-orders/${w.id}`} className="hover:underline">{w.title}</Link></td>
                        <td className="px-4 py-2 text-muted-foreground">{w.assignedTechnician?.name ?? "—"}</td>
                        <td className="px-4 py-2 text-muted-foreground">{w.completedAt?.toDateString() ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>
      ) : null}
    </div>
  );
}
