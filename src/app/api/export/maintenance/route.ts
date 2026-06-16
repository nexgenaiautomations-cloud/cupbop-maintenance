import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function csvCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v).replace(/"/g, '""');
  return `"${s}"`;
}

export async function GET() {
  const tasks = await prisma.preventiveTask.findMany({
    include: { location: true, category: true, assignedTechnician: true },
    orderBy: { nextServiceDate: "asc" },
  });
  const headers = [
    "Location",
    "Category",
    "Task",
    "Frequency Months",
    "Last Service Date",
    "Next Service Date",
    "Assigned Technician",
    "Status",
  ];
  const rows = tasks.map((t) =>
    [
      t.location.name,
      t.category.name,
      t.taskName,
      t.frequencyMonths,
      t.lastServiceDate?.toISOString().slice(0, 10) ?? "",
      t.nextServiceDate?.toISOString().slice(0, 10) ?? "",
      t.assignedTechnician?.name ?? "",
      t.status,
    ].map(csvCell).join(",")
  );
  const csv = [headers.join(","), ...rows].join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="preventive-maintenance-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
