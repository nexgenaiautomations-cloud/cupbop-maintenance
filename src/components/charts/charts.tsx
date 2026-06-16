"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const RED = "#E11D2A";
const YELLOW = "#F8C622";
const GRAY = "#475569";
const COLORS = [RED, YELLOW, GRAY, "#0ea5e9", "#10b981", "#8b5cf6"];

const tooltipStyle = {
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  background: "white",
  fontSize: 12,
};

export function WorkOrdersOverTimeChart({ data }: { data: Array<{ date: string; count: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Line type="monotone" dataKey="count" stroke={RED} strokeWidth={2.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function PreventiveOverTimeChart({ data }: { data: Array<{ month: string; count: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey="count" fill={YELLOW} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function PriorityChart({ data }: { data: Array<{ priority: string; count: number }> }) {
  const palette: Record<string, string> = {
    Urgent: RED,
    Important: YELLOW,
    Subordinate: GRAY,
  };
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="priority" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={palette[d.priority] ?? COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function LocationsChart({ data }: { data: Array<{ location: string; count: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 10, right: 16, left: 50, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
        <YAxis type="category" dataKey="location" tick={{ fontSize: 11 }} width={100} />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey="count" fill={RED} radius={[0, 6, 6, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ComplianceChart({
  data,
}: {
  data: Array<{ location: string; pct: number; total: number }>;
}) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 10, right: 16, left: 50, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
        <YAxis type="category" dataKey="location" tick={{ fontSize: 11 }} width={100} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v}%`} />
        <Bar dataKey="pct" radius={[0, 6, 6, 0]}>
          {data.map((d, i) => (
            <Cell
              key={i}
              fill={d.pct >= 90 ? "#10b981" : d.pct >= 75 ? YELLOW : RED}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
