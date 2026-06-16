import { redirect } from "next/navigation";
import { addDays, startOfDay } from "date-fns";
import { Map as MapIcon } from "lucide-react";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import type { AssignedJob, LocationPoint } from "@/components/map/route-planner";
import { ClientRoutePlanner } from "@/components/map/client-route-planner";

export default async function MapPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role === "LOCATION_MANAGER") redirect("/location");

  const today = startOfDay(new Date());
  const weekEnd = addDays(today, 7);

  const locations = await prisma.location.findMany({
    where: { status: "ACTIVE", latitude: { not: null }, longitude: { not: null } },
    orderBy: { name: "asc" },
    include: {
      workOrders: {
        where: { status: { notIn: ["COMPLETE", "CANCELLED"] } },
        select: { priority: true },
      },
      preventiveTasks: {
        select: { nextServiceDate: true },
      },
    },
  });

  const points: LocationPoint[] = locations
    .filter((l) => l.latitude !== null && l.longitude !== null)
    .map((l) => ({
      id: l.id,
      name: l.name,
      region: l.region,
      latitude: l.latitude as number,
      longitude: l.longitude as number,
      openWorkOrders: l.workOrders.length,
      urgentWorkOrders: l.workOrders.filter((w) => w.priority === "URGENT").length,
      pmOverdue: l.preventiveTasks.filter((t) => t.nextServiceDate && t.nextServiceDate < today).length,
    }));

  const jobScope = user.technicianId ? { assignedTechnicianId: user.technicianId } : {};
  const rawJobs = await prisma.workOrder.findMany({
    where: {
      ...jobScope,
      status: { notIn: ["COMPLETE", "CANCELLED"] },
      OR: [{ dueDate: { gte: today, lte: weekEnd } }, { dueDate: null }],
    },
    include: { location: { select: { name: true } } },
    orderBy: [{ priority: "asc" }, { dueDate: "asc" }],
    take: 30,
  });

  const todaysJobs: AssignedJob[] = rawJobs.map((w) => ({
    id: w.id,
    title: w.title,
    priority: w.priority,
    locationId: w.locationId,
    locationName: w.location.name,
  }));

  return (
    <div className="space-y-6">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-xs text-muted-foreground shadow-sm">
          <MapIcon className="h-3.5 w-3.5" /> Field map &amp; route planner
        </div>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">Locations &amp; Route Planner</h1>
        <p className="text-sm text-muted-foreground">
          All {points.length} Cupbop stores pinned. Pick a start location, click pins to add stops,
          and drive times appear leg-by-leg. Plan multi-store days or whole weeks.
        </p>
      </div>
      <ClientRoutePlanner locations={points} todaysJobs={todaysJobs} />
    </div>
  );
}
