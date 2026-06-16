import Link from "next/link";
import { CheckCircle2, MapPin, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PmStatusBadge } from "@/components/ui/badge";
import { formatDate, humanDaysUntil } from "@/lib/dates";

type Task = {
  id: string;
  status: string;
  frequencyMonths: number;
  lastServiceDate: Date | null;
  nextServiceDate: Date | null;
  category: { name: string };
  assignedTechnician: { name: string } | null;
};

export function LocationGroup({
  locationName,
  region,
  tasks,
  canComplete = true,
  showLink = true,
}: {
  locationName: string;
  region?: string | null;
  tasks: Task[];
  canComplete?: boolean;
  showLink?: boolean;
}) {
  const overdue = tasks.filter((t) => t.status === "OVERDUE").length;
  const dueSoon = tasks.filter((t) => t.status === "DUE_SOON").length;

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
          {overdue > 0 ? (
            <span className="rounded-full bg-red-50 px-2.5 py-0.5 font-medium text-red-700 border border-red-200">
              {overdue} overdue
            </span>
          ) : null}
          {dueSoon > 0 ? (
            <span className="rounded-full bg-amber-50 px-2.5 py-0.5 font-medium text-amber-800 border border-amber-200">
              {dueSoon} due soon
            </span>
          ) : null}
          {showLink ? (
            <Link
              href={`/locations/${encodeURIComponent(locationName)}`}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
            >
              View store <ChevronRight className="h-3 w-3" />
            </Link>
          ) : null}
        </div>
      </div>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left">Category</th>
                <th className="px-4 py-2 text-left">Frequency</th>
                <th className="px-4 py-2 text-left">Last Service</th>
                <th className="px-4 py-2 text-left">Next Service</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Technician</th>
                {canComplete ? <th className="px-4 py-2 text-right">Action</th> : null}
              </tr>
            </thead>
            <tbody className="divide-y">
              {tasks.map((t) => (
                <tr key={t.id} className="table-row-hover">
                  <td className="px-4 py-2 font-medium">{t.category.name}</td>
                  <td className="px-4 py-2 text-muted-foreground">Every {t.frequencyMonths} mo</td>
                  <td className="px-4 py-2 text-muted-foreground">{formatDate(t.lastServiceDate)}</td>
                  <td className="px-4 py-2">
                    <div className="flex flex-col leading-tight">
                      <span>{formatDate(t.nextServiceDate)}</span>
                      <span className="text-xs text-muted-foreground">{humanDaysUntil(t.nextServiceDate)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2"><PmStatusBadge status={t.status} /></td>
                  <td className="px-4 py-2 text-muted-foreground">{t.assignedTechnician?.name ?? "—"}</td>
                  {canComplete ? (
                    <td className="px-4 py-2 text-right">
                      <Link href={`/maintenance/${t.id}/complete`}>
                        <Button size="sm" variant="success">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Complete
                        </Button>
                      </Link>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
