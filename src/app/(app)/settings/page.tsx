import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Building2, HardHat, ListChecks } from "lucide-react";
import { InstallAppCard } from "@/components/settings/install-app-card";

export default async function SettingsPage() {
  const [locations, technicians, categories] = await Promise.all([
    prisma.location.count(),
    prisma.technician.count(),
    prisma.maintenanceCategory.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your organization, technicians, and maintenance defaults.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-red-50 p-2 text-cupbop-red"><Building2 className="h-5 w-5" /></div>
              <div>
                <div className="text-xs text-muted-foreground">Locations</div>
                <div className="text-2xl font-semibold">{locations}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-amber-50 p-2 text-amber-700"><HardHat className="h-5 w-5" /></div>
              <div>
                <div className="text-xs text-muted-foreground">Technicians</div>
                <div className="text-2xl font-semibold">{technicians}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-emerald-50 p-2 text-emerald-700"><ListChecks className="h-5 w-5" /></div>
              <div>
                <div className="text-xs text-muted-foreground">Categories</div>
                <div className="text-2xl font-semibold">{categories.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Maintenance Categories &amp; Default Frequencies</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 text-left">Category</th>
                  <th className="px-4 py-2 text-left">Description</th>
                  <th className="px-4 py-2 text-right">Default Frequency</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {categories.map((c) => (
                  <tr key={c.id}>
                    <td className="px-4 py-2 font-medium">{c.name}</td>
                    <td className="px-4 py-2 text-muted-foreground">{c.description ?? "—"}</td>
                    <td className="px-4 py-2 text-right">{c.defaultFrequencyMonths} months</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <InstallAppCard />

      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm">Notification Settings · Coming soon</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Email and SMS notifications for new urgent work orders and overdue preventive maintenance are wired in the data model
          and will be enabled in the next release. Vendor dispatching, QR codes, and AI categorization placeholders are
          architected but disabled.
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Company Profile</CardTitle></CardHeader>
        <CardContent className="space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Company</span><span>Cupbop</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">App version</span><span>0.1.0</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Environment</span><span>Local (SQLite)</span></div>
        </CardContent>
      </Card>
    </div>
  );
}
