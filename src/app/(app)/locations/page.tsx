import Link from "next/link";
import { prisma } from "@/lib/db";
import { Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/dates";

export default async function LocationsPage() {
  const locations = await prisma.location.findMany({
    include: {
      _count: {
        select: { workOrders: true, preventiveTasks: true },
      },
    },
    orderBy: { name: "asc" },
  });

  if (locations.length === 0) {
    return <EmptyState icon={Building2} title="No locations yet" description="Seed the database to populate." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Locations</h1>
        <p className="text-sm text-muted-foreground">{locations.length} stores tracked</p>
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Region</th>
                  <th className="px-4 py-2 text-left">Manager</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-right">Open WOs</th>
                  <th className="px-4 py-2 text-right">PM Tasks</th>
                  <th className="px-4 py-2 text-right">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {locations.map((l) => (
                  <tr key={l.id} className="table-row-hover">
                    <td className="px-4 py-2 font-medium">
                      <Link href={`/locations/${encodeURIComponent(l.name)}`} className="hover:underline">
                        {l.name}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">{l.region}</td>
                    <td className="px-4 py-2 text-muted-foreground">{l.managerName ?? "—"}</td>
                    <td className="px-4 py-2 text-muted-foreground">{l.status}</td>
                    <td className="px-4 py-2 text-right">{l._count.workOrders}</td>
                    <td className="px-4 py-2 text-right">{l._count.preventiveTasks}</td>
                    <td className="px-4 py-2 text-right text-muted-foreground">{formatDate(l.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
