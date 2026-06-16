import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle } from "lucide-react";

const WO_COLUMNS = [
  "Location",
  "Request",
  "Photo",
  "Priority/Subordinate",
  "Request Date",
  "Due Date",
  "Assigned Technician",
  "Progress",
  "Completion Date",
];

const PM_COLUMNS = [
  "Location",
  "Maintenance Item",
  "Frequency Months",
  "Last Service Date",
  "Next Service Due",
];

export default function ImportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Import</h1>
        <p className="text-sm text-muted-foreground">
          Migrate the legacy Excel workbooks. Validation runs against your existing locations and technicians.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <div className="rounded-md bg-red-50 p-2 text-cupbop-red"><FileSpreadsheet className="h-5 w-5" /></div>
            <CardTitle>Work Orders CSV</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Expected columns (in order):</p>
            <ul className="space-y-1 text-sm">
              {WO_COLUMNS.map((c) => (
                <li key={c} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-cupbop-red" />
                  {c}
                </li>
              ))}
            </ul>
            <ImportStub kind="work-orders" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <div className="rounded-md bg-amber-50 p-2 text-amber-700"><FileSpreadsheet className="h-5 w-5" /></div>
            <CardTitle>Preventive Maintenance CSV</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Expected columns (in order):</p>
            <ul className="space-y-1 text-sm">
              {PM_COLUMNS.map((c) => (
                <li key={c} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  {c}
                </li>
              ))}
            </ul>
            <ImportStub kind="maintenance" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm">Validation pipeline (architecture)</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2 text-sm">
            <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Parse CSV with PapaParse</li>
            <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Normalize location names &amp; lookup by case-insensitive match</li>
            <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Validate technician names against directory</li>
            <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Coerce dates (Excel serial &amp; ISO)</li>
            <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Preview with per-row errors</li>
            <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Commit in single transaction</li>
          </ol>
          <p className="mt-3 text-xs text-muted-foreground">
            The UI flow above is scaffolded. Final upload/preview/commit endpoints will be enabled in the next sprint.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function ImportStub({ kind }: { kind: "work-orders" | "maintenance" }) {
  return (
    <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-center">
      <Upload className="mx-auto h-6 w-6 text-muted-foreground" />
      <p className="mt-2 text-sm font-medium">Drag &amp; drop or browse CSV</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {kind === "work-orders" ? "Maps rows into work_orders." : "Maps rows into preventive_tasks."}
      </p>
      <button
        type="button"
        disabled
        className="mt-3 inline-flex h-8 cursor-not-allowed items-center justify-center rounded-md border bg-background px-3 text-xs font-medium opacity-60"
      >
        Coming soon
      </button>
    </div>
  );
}
