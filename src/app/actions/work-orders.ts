"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

const CreateWorkOrderSchema = z.object({
  locationId: z.string().min(1),
  title: z.string().min(2).max(200),
  description: z.string().max(2000).optional().nullable(),
  priority: z.enum(["SUBORDINATE", "IMPORTANT", "URGENT"]),
  category: z.string().optional().nullable(),
  assignedTechnicianId: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  photoUrls: z.string().optional().nullable(),
});

export async function createWorkOrderAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const locationId =
    user.role === "LOCATION_MANAGER" && user.locationId
      ? user.locationId
      : String(formData.get("locationId") ?? "");

  const parsed = CreateWorkOrderSchema.parse({
    locationId,
    title: String(formData.get("title") ?? ""),
    description: formData.get("description") ? String(formData.get("description")) : null,
    priority: String(formData.get("priority") ?? "IMPORTANT"),
    category: formData.get("category") ? String(formData.get("category")) : null,
    assignedTechnicianId:
      formData.get("assignedTechnicianId") && String(formData.get("assignedTechnicianId")) !== ""
        ? String(formData.get("assignedTechnicianId"))
        : null,
    dueDate: formData.get("dueDate") ? String(formData.get("dueDate")) : null,
    photoUrls: formData.get("photoUrls") ? String(formData.get("photoUrls")) : null,
  });

  const wo = await prisma.workOrder.create({
    data: {
      locationId: parsed.locationId,
      title: parsed.title,
      description: parsed.description,
      priority: parsed.priority,
      category: parsed.category,
      assignedTechnicianId: parsed.assignedTechnicianId,
      dueDate: parsed.dueDate ? new Date(parsed.dueDate) : null,
      status: parsed.assignedTechnicianId ? "ASSIGNED" : "NEW",
      submittedByUserId: user.id,
      photoUrls: parsed.photoUrls ? JSON.stringify([parsed.photoUrls]) : null,
    },
  });

  revalidatePath("/work-orders");
  revalidatePath("/dashboard");
  if (user.role === "LOCATION_MANAGER") {
    redirect(`/location?created=${wo.id}`);
  }
  redirect(`/work-orders/${wo.id}`);
}

export async function updateWorkOrderAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role === "LOCATION_MANAGER") throw new Error("Forbidden");

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const priority = String(formData.get("priority") ?? "");
  const assignedTechnicianId = String(formData.get("assignedTechnicianId") ?? "");
  const dueDateValue = formData.get("dueDate") ? String(formData.get("dueDate")) : null;
  const title = String(formData.get("title") ?? "");
  const description = formData.get("description") ? String(formData.get("description")) : null;
  const progressNotes = formData.get("progressNotes") ? String(formData.get("progressNotes")) : null;

  const updates: Record<string, unknown> = {};
  if (status) updates.status = status;
  if (priority) updates.priority = priority;
  if (assignedTechnicianId === "") updates.assignedTechnicianId = null;
  else if (assignedTechnicianId) updates.assignedTechnicianId = assignedTechnicianId;
  if (dueDateValue !== null) updates.dueDate = dueDateValue ? new Date(dueDateValue) : null;
  if (title) updates.title = title;
  if (description !== null) updates.description = description;
  if (progressNotes !== null) updates.progressNotes = progressNotes;
  if (status === "COMPLETE") updates.completedAt = new Date();
  if (status && status !== "COMPLETE") updates.completedAt = null;

  await prisma.workOrder.update({ where: { id }, data: updates });
  revalidatePath(`/work-orders/${id}`);
  revalidatePath("/work-orders");
  revalidatePath("/dashboard");
}

export async function addWorkOrderCommentAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const workOrderId = String(formData.get("workOrderId") ?? "");
  const comment = String(formData.get("comment") ?? "").trim();
  if (!workOrderId || !comment) return;
  await prisma.workOrderComment.create({
    data: { workOrderId, userId: user.id, comment },
  });
  revalidatePath(`/work-orders/${workOrderId}`);
}

export async function completeWorkOrderAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const id = String(formData.get("id") ?? "");
  await prisma.workOrder.update({
    where: { id },
    data: { status: "COMPLETE", completedAt: new Date() },
  });
  revalidatePath(`/work-orders/${id}`);
  revalidatePath("/work-orders");
  revalidatePath("/dashboard");
}
