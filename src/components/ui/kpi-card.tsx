import * as React from "react";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  icon: Icon,
  hint,
  tone = "neutral",
  className,
}: {
  label: string;
  value: string | number;
  icon?: React.ComponentType<{ className?: string }>;
  hint?: string;
  tone?: "neutral" | "good" | "warn" | "bad";
  className?: string;
}) {
  const toneStyles: Record<typeof tone, string> = {
    neutral: "bg-card",
    good: "bg-emerald-50/60 border-emerald-200/70",
    warn: "bg-amber-50/60 border-amber-200/70",
    bad: "bg-red-50/60 border-red-200/70",
  };
  const iconTones: Record<typeof tone, string> = {
    neutral: "text-cupbop-red bg-red-50",
    good: "text-emerald-700 bg-emerald-100",
    warn: "text-amber-700 bg-amber-100",
    bad: "text-red-700 bg-red-100",
  };
  return (
    <div className={cn("card-shell flex items-start gap-4 p-5", toneStyles[tone], className)}>
      {Icon ? (
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", iconTones[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      ) : null}
      <div className="flex flex-col">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <span className="kpi-num mt-1">{value}</span>
        {hint ? <span className="mt-1 text-xs text-muted-foreground">{hint}</span> : null}
      </div>
    </div>
  );
}
