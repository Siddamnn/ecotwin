"use client";

// ─────────────────────────────────────────────────────────────────────────────
// BreakdownDonut — dark-themed Recharts PieChart of per-category emissions, with
// category colours from CATEGORY_META, an animated sweep, and a custom legend
// (Icon + label + formatCo2). The total sits in the donut's hole.
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

import type { EmissionBreakdown } from "@/types";
import { CATEGORIES } from "@/types";
import { CATEGORY_META } from "@/lib/constants";
import { cn, formatCo2 } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";

export interface BreakdownDonutProps {
  breakdown: EmissionBreakdown;
  className?: string;
}

export function BreakdownDonut({ breakdown, className }: BreakdownDonutProps) {
  const data = useMemo(
    () =>
      CATEGORIES.map((cat) => ({
        cat,
        name: CATEGORY_META[cat].label,
        value: Math.max(0, breakdown.perCategory[cat]),
        color: CATEGORY_META[cat].color,
      })).filter((d) => d.value > 0),
    [breakdown],
  );

  const total = breakdown.total;

  return (
    <div className={cn("flex flex-col gap-5 sm:flex-row sm:items-center", className)}>
      <div className="relative mx-auto h-44 w-44 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={56}
              outerRadius={84}
              paddingAngle={3}
              cornerRadius={6}
              stroke="none"
              startAngle={90}
              endAngle={-270}
              animationDuration={900}
              animationEasing="ease-out"
            >
              {data.map((d) => (
                <Cell key={d.cat} fill={d.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="font-mono text-xl font-semibold tabular-nums text-ink">
              {formatCo2(total)}
            </p>
            <p className="text-[0.65rem] uppercase tracking-wider text-faint">per year</p>
          </div>
        </div>
      </div>

      {/* custom legend */}
      <ul className="flex-1 space-y-2">
        {[...data]
          .sort((a, b) => b.value - a.value)
          .map((d) => {
            const pct = total > 0 ? (d.value / total) * 100 : 0;
            return (
              <li key={d.cat} className="flex items-center gap-3">
                <span
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
                  style={{ background: `${d.color}22`, color: d.color }}
                >
                  <Icon name={CATEGORY_META[d.cat].icon} size={16} />
                </span>
                <span className="flex-1 text-sm text-muted">{d.name}</span>
                <span className="font-mono text-sm font-medium tabular-nums text-ink">
                  {formatCo2(d.value)}
                </span>
                <span className="w-10 text-right text-xs tabular-nums text-faint">
                  {pct.toFixed(0)}%
                </span>
              </li>
            );
          })}
      </ul>
    </div>
  );
}

export default BreakdownDonut;
