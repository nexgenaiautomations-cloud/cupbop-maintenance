import { prisma } from "./db";
import { addDays } from "date-fns";

export type LocationSummaryRow = {
  id: string;
  name: string;
  region: string | null;
  openWO: number;
  urgentWO: number;
  pmOverdue: number;
  pmDueSoon: number;
  nextServiceDate: Date | null;
  nextServiceCategory: string | null;
};

export async function getLocationSummaries(): Promise<LocationSummaryRow[]> {
  const now = new Date();
  const dueSoonCutoff = addDays(now, 14);

  const locations = await prisma.location.findMany({
    where: { status: "ACTIVE" },
    orderBy: { name: "asc" },
    include: {
      workOrders: {
        where: { status: { notIn: ["COMPLETE", "CANCELLED"] } },
        select: { priority: true },
      },
      preventiveTasks: {
        select: { nextServiceDate: true, category: { select: { name: true } } },
        orderBy: { nextServiceDate: "asc" },
      },
    },
  });

  return locations.map((l) => {
    const openWO = l.workOrders.length;
    const urgentWO = l.workOrders.filter((w) => w.priority === "URGENT").length;
    const pmOverdue = l.preventiveTasks.filter((t) => t.nextServiceDate && t.nextServiceDate < now).length;
    const pmDueSoon = l.preventiveTasks.filter(
      (t) => t.nextServiceDate && t.nextServiceDate >= now && t.nextServiceDate <= dueSoonCutoff
    ).length;
    const next = l.preventiveTasks.find((t) => t.nextServiceDate && t.nextServiceDate >= now);
    return {
      id: l.id,
      name: l.name,
      region: l.region,
      openWO,
      urgentWO,
      pmOverdue,
      pmDueSoon,
      nextServiceDate: next?.nextServiceDate ?? null,
      nextServiceCategory: next?.category.name ?? null,
    };
  });
}
