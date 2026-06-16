"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Circle, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const CHECKLIST_ITEMS = [
  { id: "truck-stocked", label: "Service truck stocked (filters, gaskets, tools, PPE)" },
  { id: "safety-check", label: "Safety check — first aid kit, fire extinguisher, gloves" },
  { id: "route-loaded", label: "Today's route loaded in maps + locations confirmed open" },
  { id: "phones-charged", label: "Phone + tablet charged, hotspot ready" },
  { id: "ppe", label: "PPE on hand — gloves, eye protection, knee pads" },
  { id: "spare-parts", label: "Spare parts pulled for assigned jobs" },
  { id: "morning-checkin", label: "Morning check-in with maintenance manager" },
  { id: "review-pms", label: "Review today's preventive maintenance and assigned WOs" },
];

const STORAGE_KEY = "cupbop-daily-checklist";

type Persisted = { date: string; checked: Record<string, boolean> };

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function DailyChecklist() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: Persisted = JSON.parse(raw);
        // Reset when the day rolls over
        if (parsed.date === todayKey()) setChecked(parsed.checked);
      }
    } catch {
      // ignore
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const payload: Persisted = { date: todayKey(), checked };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore
    }
  }, [checked, loaded]);

  function toggle(id: string) {
    setChecked((c) => ({ ...c, [id]: !c[id] }));
  }

  function reset() {
    setChecked({});
  }

  const completedCount = CHECKLIST_ITEMS.filter((i) => checked[i.id]).length;
  const total = CHECKLIST_ITEMS.length;
  const pct = total === 0 ? 0 : Math.round((completedCount / total) * 100);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm">
          <span className="font-semibold">{completedCount}</span>
          <span className="text-muted-foreground"> of {total} complete · {pct}%</span>
        </div>
        <Button variant="ghost" size="sm" onClick={reset} className="text-xs">
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </Button>
      </div>
      <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-emerald-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <ul className="space-y-1.5">
        {CHECKLIST_ITEMS.map((item) => {
          const done = !!checked[item.id];
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => toggle(item.id)}
                className={cn(
                  "flex w-full cursor-pointer items-center gap-3 rounded-md border bg-white px-3 py-2.5 text-left text-sm transition-colors hover:bg-secondary/50",
                  done && "border-emerald-200 bg-emerald-50/40"
                )}
              >
                {done ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                ) : (
                  <Circle className="h-5 w-5 shrink-0 text-muted-foreground" />
                )}
                <span className={cn(done && "text-muted-foreground line-through")}>{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
