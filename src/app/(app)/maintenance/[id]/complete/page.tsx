import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/input";
import { completePreventiveTaskAction } from "@/app/actions/maintenance";
import { getChecklistFor } from "@/lib/checklists";
import { calculateNextServiceDate, formatDate } from "@/lib/dates";

export default async function CompletePreventivePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role === "LOCATION_MANAGER") notFound();

  const task = await prisma.preventiveTask.findUnique({
    where: { id },
    include: { location: true, category: true, assignedTechnician: true },
  });
  if (!task) notFound();

  const checklist = getChecklistFor(task.category.name);
  const today = new Date().toISOString().slice(0, 10);
  const projectedNext = calculateNextServiceDate(new Date(), task.frequencyMonths);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link href="/maintenance" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to maintenance
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Complete Preventive Task</h1>
        <p className="text-sm text-muted-foreground">
          {task.category.name} · {task.location.name} · every {task.frequencyMonths} months
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle>Service Checklist</CardTitle></CardHeader>
        <CardContent>
          {checklist.length === 0 ? (
            <p className="text-sm text-muted-foreground">No standard checklist defined for this category.</p>
          ) : (
            <ul className="space-y-2">
              {checklist.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> {item}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Confirm completion</CardTitle></CardHeader>
        <CardContent>
          <form action={completePreventiveTaskAction} className="space-y-4">
            <input type="hidden" name="taskId" value={task.id} />
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="completedAt">Completion Date</Label>
                <Input id="completedAt" type="date" name="completedAt" defaultValue={today} required />
              </div>
              <div>
                <Label>Next service auto-set to</Label>
                <Input value={formatDate(projectedNext)} readOnly className="bg-muted/50" />
              </div>
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" placeholder="Filter sizes used, readings, anything unusual…" />
            </div>
            <div>
              <Label htmlFor="photoUrl">Photo URL (optional)</Label>
              <Input id="photoUrl" name="photoUrl" type="url" placeholder="Paste a photo URL of the completed work" />
            </div>
            <div className="flex items-center gap-2">
              <Button type="submit" variant="success"><CheckCircle2 className="h-4 w-4" />Confirm Completion</Button>
              <Link href="/maintenance" className="text-sm text-muted-foreground hover:text-foreground">Cancel</Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
