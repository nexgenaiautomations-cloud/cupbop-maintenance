import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building2, Calendar, ChevronRight, MessageSquare, User2, Wrench, CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea, Select, Input, Label } from "@/components/ui/input";
import { PriorityBadge, StatusBadge } from "@/components/ui/badge";
import { formatDate, formatDateTime, humanDaysUntil } from "@/lib/dates";
import {
  addWorkOrderCommentAction,
  completeWorkOrderAction,
  updateWorkOrderAction,
} from "@/app/actions/work-orders";
import { WORK_ORDER_STATUSES, WORK_ORDER_PRIORITIES, WORK_ORDER_CATEGORIES } from "@/lib/types";

export default async function WorkOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const wo = await prisma.workOrder.findUnique({
    where: { id },
    include: {
      location: true,
      assignedTechnician: true,
      submittedBy: true,
      comments: { include: { user: true }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!wo) notFound();
  if (user.role === "LOCATION_MANAGER" && wo.locationId !== user.locationId) notFound();

  const technicians = await prisma.technician.findMany({ where: { active: true }, orderBy: { name: "asc" } });
  const isReadonly = user.role === "LOCATION_MANAGER";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Link href="/work-orders" className="inline-flex items-center gap-1 hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Work Orders
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span>{wo.location.name}</span>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{wo.title}</h1>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <PriorityBadge priority={wo.priority} />
            <StatusBadge status={wo.status} />
            {wo.category ? (
              <span className="text-xs text-muted-foreground">· {wo.category}</span>
            ) : null}
          </div>
        </div>
        {!isReadonly && wo.status !== "COMPLETE" ? (
          <form action={completeWorkOrderAction}>
            <input type="hidden" name="id" value={wo.id} />
            <Button type="submit" variant="success"><CheckCircle2 className="h-4 w-4" />Mark Complete</Button>
          </form>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Description</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap text-foreground/90">
                {wo.description ?? "—"}
              </p>
              {wo.progressNotes ? (
                <div className="mt-4 rounded-md border bg-muted/30 p-3">
                  <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Progress notes</div>
                  <p className="text-sm whitespace-pre-wrap">{wo.progressNotes}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {!isReadonly ? (
            <Card>
              <CardHeader><CardTitle>Update Work Order</CardTitle></CardHeader>
              <CardContent>
                <form action={updateWorkOrderAction} className="space-y-4">
                  <input type="hidden" name="id" value={wo.id} />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select id="status" name="status" defaultValue={wo.status}>
                        {WORK_ORDER_STATUSES.map((s) => (
                          <option key={s} value={s}>{s.replace("_", " ")}</option>
                        ))}
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="priority">Priority</Label>
                      <Select id="priority" name="priority" defaultValue={wo.priority}>
                        {WORK_ORDER_PRIORITIES.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="assignedTechnicianId">Assigned Technician</Label>
                      <Select id="assignedTechnicianId" name="assignedTechnicianId" defaultValue={wo.assignedTechnicianId ?? ""}>
                        <option value="">— Unassigned —</option>
                        {technicians.map((t) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="dueDate">Due Date</Label>
                      <Input
                        id="dueDate"
                        type="date"
                        name="dueDate"
                        defaultValue={wo.dueDate ? wo.dueDate.toISOString().slice(0, 10) : ""}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="progressNotes">Progress Notes</Label>
                    <Textarea id="progressNotes" name="progressNotes" defaultValue={wo.progressNotes ?? ""} />
                  </div>
                  <Button type="submit" size="sm">Save changes</Button>
                </form>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm">Comments &amp; Timeline ({wo.comments.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form action={addWorkOrderCommentAction} className="space-y-2">
                <input type="hidden" name="workOrderId" value={wo.id} />
                <Textarea name="comment" placeholder="Add a note or update…" required />
                <Button type="submit" size="sm">Post Update</Button>
              </form>
              {wo.comments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No comments yet.</p>
              ) : (
                <ol className="space-y-3">
                  {wo.comments.map((c) => (
                    <li key={c.id} className="rounded-md border bg-muted/30 p-3">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{c.user?.name ?? "System"}</span>
                        <span>{formatDateTime(c.createdAt)}</span>
                      </div>
                      <p className="mt-1 text-sm whitespace-pre-wrap">{c.comment}</p>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-sm">Location</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-muted-foreground" /><span>{wo.location.name}</span></div>
              <div className="text-xs text-muted-foreground">{wo.location.region}</div>
              {wo.location.managerName ? (
                <div className="text-xs text-muted-foreground">Manager: {wo.location.managerName}</div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Assignment</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2"><User2 className="h-4 w-4 text-muted-foreground" /><span>{wo.assignedTechnician?.name ?? "Unassigned"}</span></div>
              <div className="flex items-center gap-2"><Wrench className="h-4 w-4 text-muted-foreground" /><span>{wo.category ?? "General"}</span></div>
              <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /><span>Due: {wo.dueDate ? humanDaysUntil(wo.dueDate) : "—"}</span></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Dates</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Requested</span><span>{formatDate(wo.requestDate)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Due</span><span>{formatDate(wo.dueDate)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Completed</span><span>{formatDate(wo.completedAt)}</span></div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
