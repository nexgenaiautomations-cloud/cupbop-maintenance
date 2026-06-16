import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { HardHat } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

export default async function TechniciansPage() {
  const technicians = await prisma.technician.findMany({
    include: {
      _count: { select: { workOrders: true, preventiveTasks: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Technicians</h1>
        <p className="text-sm text-muted-foreground">{technicians.length} active technicians and vendors</p>
      </div>
      {technicians.length === 0 ? (
        <EmptyState icon={HardHat} title="No technicians yet" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {technicians.map((t) => (
            <Card key={t.id}>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cupbop-black text-white">
                    <HardHat className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-medium">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.email ?? "No email"}</div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-md border bg-muted/30 p-3">
                    <div className="text-xs text-muted-foreground">Work Orders</div>
                    <div className="text-lg font-semibold">{t._count.workOrders}</div>
                  </div>
                  <div className="rounded-md border bg-muted/30 p-3">
                    <div className="text-xs text-muted-foreground">PM Tasks</div>
                    <div className="text-lg font-semibold">{t._count.preventiveTasks}</div>
                  </div>
                </div>
                <div className="mt-3 text-xs text-muted-foreground">{t.phone ?? ""}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
