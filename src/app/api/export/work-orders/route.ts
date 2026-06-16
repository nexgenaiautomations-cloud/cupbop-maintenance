import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function csvCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v).replace(/"/g, '""');
  return `"${s}"`;
}

export async function GET() {
  const orders = await prisma.workOrder.findMany({
    include: { location: true, assignedTechnician: true },
    orderBy: { requestDate: "desc" },
  });
  const headers = [
    "Location",
    "Title",
    "Description",
    "Priority",
    "Status",
    "Category",
    "Assigned Technician",
    "Request Date",
    "Due Date",
    "Completed Date",
  ];
  const rows = orders.map((w) =>
    [
      w.location.name,
      w.title,
      w.description ?? "",
      w.priority,
      w.status,
      w.category ?? "",
      w.assignedTechnician?.name ?? "",
      w.requestDate.toISOString().slice(0, 10),
      w.dueDate?.toISOString().slice(0, 10) ?? "",
      w.completedAt?.toISOString().slice(0, 10) ?? "",
    ].map(csvCell).join(",")
  );
  const csv = [headers.join(","), ...rows].join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="work-orders-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
