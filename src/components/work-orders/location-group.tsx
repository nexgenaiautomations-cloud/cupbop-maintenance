import Link from "next/link";
import { MapPin, ChevronRight, Wrench } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PriorityBadge, StatusBadge } from "@/components/ui/badge";
import { formatDate, humanDaysUntil } from "@/lib/dates";

type WO = {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  category: string | null;
  requestDate: Date;
  dueDate: Date | null;
  completedAt: Date | null;
  assignedTechnician: { name: string } | null;
};

export function WorkOrderLocationGroup({
  locationName,
  region,
  orders,
}: {
  locationName: string;
  region?: string | null;
  orders: WO[];
}) {
  const urgent = orders.filter((o) => o.priority === "URGENT" && o.status !== "COMPLETE" && o.status !== "CANCELLED").length;
  const open = orders.filter((o) => o.status !== "COMPLETE" && o.status !== "CANCELLED").length;
  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-red-50 text-cupbop-red">
            <MapPin className="h-4 w-4" />
          </div>
          <div>
            <div className="text-base font-semibold">{locationName}</div>
            {region ? <div className="text-xs text-muted-foreground">{region}</div> : null}
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {urgent > 0 ? (
            <span className="rounded-full bg-red-50 px-2.5 py-0.5 font-medium text-red-700 border border-red-200">
              {urgent} urgent
            </span>
          ) : null}
          <span className="rounded-full bg-muted px-2.5 py-0.5 font-medium text-foreground/70 border">
            {open} open · {orders.length} total
          </span>
          <Link
            href={`/locations/${encodeURIComponent(locationName)}`}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
          >
            View store <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
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
                  <td className="px-4 py-2">
                    <Link href={`/work-orders/${w.id}`} className="hover:underline">
                      <span className="font-medium">{w.title}</span>
                    </Link>
                    {w.category ? (
                      <span className="ml-2 text-xs text-muted-foreground">· {w.category}</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-2"><PriorityBadge priority={w.priority} /></td>
                  <td className="px-4 py-2"><StatusBadge status={w.status} /></td>
                  <td className="px-4 py-2 text-muted-foreground">{w.assignedTechnician?.name ?? "Unassigned"}</td>
                  <td className="px-4 py-2 text-muted-foreground">{formatDate(w.requestDate)}</td>
                  <td className="px-4 py-2 text-muted-foreground">{w.dueDate ? humanDaysUntil(w.dueDate) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
