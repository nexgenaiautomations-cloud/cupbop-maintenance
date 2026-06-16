"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { calculateNextServiceDate, getPreventiveTaskStatus } from "@/lib/dates";

export async function completePreventiveTaskAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role === "LOCATION_MANAGER") throw new Error("Forbidden");

  const taskId = String(formData.get("taskId") ?? "");
  const notes = formData.get("notes") ? String(formData.get("notes")) : null;
  const completedAtRaw = String(formData.get("completedAt") ?? "");
  const completedAt = completedAtRaw ? new Date(completedAtRaw) : new Date();
  const photoUrl = formData.get("photoUrl") ? String(formData.get("photoUrl")) : null;

  const task = await prisma.preventiveTask.findUnique({ where: { id: taskId } });
  if (!task) throw new Error("Task not found");

  const next = calculateNextServiceDate(completedAt, task.frequencyMonths);

  await prisma.preventiveTaskCompletion.create({
    data: {
      preventiveTaskId: task.id,
      locationId: task.locationId,
      categoryId: task.categoryId,
      completedById: user.id,
      completedAt,
      nextServiceDateGenerated: next,
      notes,
      photoUrls: photoUrl ? JSON.stringify([photoUrl]) : null,
    },
  });

  await prisma.preventiveTask.update({
    where: { id: task.id },
    data: {
      lastServiceDate: completedAt,
      nextServiceDate: next,
      status: getPreventiveTaskStatus(next, completedAt),
    },
  });

  revalidatePath("/maintenance");
  revalidatePath("/dashboard");
  revalidatePath("/technician");
  redirect("/maintenance?completed=1");
}

export async function assignPreventiveTaskAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role === "LOCATION_MANAGER") throw new Error("Forbidden");
  const taskId = String(formData.get("taskId") ?? "");
  const technicianId = String(formData.get("technicianId") ?? "");
  await prisma.preventiveTask.update({
    where: { id: taskId },
    data: { assignedTechnicianId: technicianId || null },
  });
  revalidatePath("/maintenance");
}
