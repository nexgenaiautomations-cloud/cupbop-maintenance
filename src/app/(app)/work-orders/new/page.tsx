import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createWorkOrderAction } from "@/app/actions/work-orders";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select, Label } from "@/components/ui/input";
import { WORK_ORDER_PRIORITIES, WORK_ORDER_CATEGORIES } from "@/lib/types";

export default async function NewWorkOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ locationId?: string }>;
}) {
  const sp = await searchParams;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const [locations, technicians] = await Promise.all([
    user.role === "LOCATION_MANAGER" && user.locationId
      ? prisma.location.findMany({ where: { id: user.locationId } })
      : prisma.location.findMany({ orderBy: { name: "asc" } }),
    prisma.technician.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  const defaultLocationId =
    user.role === "LOCATION_MANAGER" && user.locationId
      ? user.locationId
      : sp.locationId ?? "";

  const defaultTechId = user.role === "TECHNICIAN" ? user.technicianId ?? "" : "";

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New Work Order</h1>
        <p className="text-sm text-muted-foreground">
          Log a maintenance request. {user.role === "TECHNICIAN" ? "Self-assign or leave unassigned for dispatch." : "Urgent requests notify the manager immediately."}
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle>Request details</CardTitle></CardHeader>
        <CardContent>
          <form action={createWorkOrderAction} className="space-y-5">
            <div>
              <Label htmlFor="locationId">Location</Label>
              <Select id="locationId" name="locationId" required defaultValue={defaultLocationId}>
                {locations.length > 1 ? <option value="">Select a location…</option> : null}
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" required placeholder="e.g. Ice machine not making ice" />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Symptoms, when it started, any troubleshooting tried…"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select id="priority" name="priority" defaultValue="IMPORTANT">
                  {WORK_ORDER_PRIORITIES.map((p) => (
                    <option key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select id="category" name="category" defaultValue="">
                  <option value="">— Optional —</option>
                  {WORK_ORDER_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </Select>
              </div>
            </div>
            {user.role !== "LOCATION_MANAGER" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="assignedTechnicianId">Assign Technician</Label>
                  <Select id="assignedTechnicianId" name="assignedTechnicianId" defaultValue={defaultTechId}>
                    <option value="">— Unassigned —</option>
                    {technicians.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </Select>
                  {user.role === "TECHNICIAN" ? (
                    <p className="mt-1 text-xs text-muted-foreground">Pre-selected to you. Change if dispatching to a teammate.</p>
                  ) : null}
                </div>
                <div>
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input id="dueDate" type="date" name="dueDate" />
                </div>
              </div>
            ) : null}
            <div>
              <Label htmlFor="photoUrls">Photo URL (optional)</Label>
              <Input
                id="photoUrls"
                name="photoUrls"
                type="url"
                placeholder="https://… paste a photo URL"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                In production, this becomes an UploadThing / Supabase Storage upload.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button type="submit">Submit Work Order</Button>
              <Link href="/work-orders" className="text-sm text-muted-foreground hover:text-foreground">Cancel</Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
