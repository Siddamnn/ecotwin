"use client";

// ─────────────────────────────────────────────────────────────────────────────
// TrendLine — the footprint over time. Emerald gradient area, animated draw, and
// a dashed target reference line. Renders gracefully with a single data point
// (shows the dot + a flat baseline so it never looks broken).
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { FootprintPoint } from "@/types";
import { cn, formatCo2 } from "@/lib/utils";

export interface TrendLineProps {
  history: FootprintPoint[];
  targetKg: number;
  className?: string;
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

interface TipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: FootprintPoint }>;
}

function Tip({ active, payload }: TipProps) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="glass-strong rounded-xl px-3 py-2 text-xs shadow-lg">
      <p className="text-faint">{fmtDate(p.date)}</p>
      <p className="font-mono font-semibold text-ink">{formatCo2(p.totalKg)}</p>
    </div>
  );
}

export function TrendLine({ history, targetKg, className }: TrendLineProps) {
  // With a single point, synthesise a flat lead-in so the area has something to draw.
  const data = useMemo(() => {
    if (history.length === 0) return [];
    if (history.length === 1) {
      const only = history[0];
      return [{ date: "start", totalKg: only.totalKg }, only];
    }
    return [...history].sort((a, b) => a.date.localeCompare(b.date));
  }, [history]);

  const values = data.map((d) => d.totalKg).concat(targetKg);
  const min = Math.min(...values) * 0.9;
  const max = Math.max(...values) * 1.08;

  if (data.length === 0) {
    return (
      <div className={cn("grid h-48 place-items-center text-sm text-faint", className)}>
        Your trend will appear as you check in.
      </div>
    );
  }

  return (
    <div className={cn("h-48 w-full", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <defs>
            <linearGradient id="eco-trend" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34d399" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={(v) => (v === "start" ? "" : fmtDate(v))}
            tick={{ fill: "var(--color-faint)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            minTickGap={24}
          />
          <YAxis
            domain={[min, max]}
            tick={{ fill: "var(--color-faint)", fontSize: 11 }}
            tickFormatter={(v) => formatCo2(v)}
            axisLine={false}
            tickLine={false}
            width={56}
          />
          <Tooltip content={<Tip />} cursor={{ stroke: "rgba(255,255,255,0.12)" }} />
          <ReferenceLine
            y={targetKg}
            stroke="var(--color-leaf)"
            strokeDasharray="5 5"
            strokeOpacity={0.8}
            label={{
              value: "target",
              position: "insideTopRight",
              fill: "var(--color-leaf)",
              fontSize: 11,
            }}
          />
          <Area
            type="monotone"
            dataKey="totalKg"
            stroke="#34d399"
            strokeWidth={2.5}
            fill="url(#eco-trend)"
            dot={{ r: 3, fill: "#34d399", strokeWidth: 0 }}
            activeDot={{ r: 5, fill: "#6ee7b7" }}
            animationDuration={1100}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default TrendLine;
