"use client";

// ─────────────────────────────────────────────────────────────────────────────
// FootprintHero — the headline number. A huge animated CountUp of the annual
// total (shown in tonnes), a one-line verdict vs the India average, and three
// tangible equivalents as chips.
// ─────────────────────────────────────────────────────────────────────────────

import { equivalents, vsIndiaAverage } from "@/lib/emissions/equivalents";
import { cn } from "@/lib/utils";
import { CountUp } from "@/components/ui/CountUp";
import { Chip } from "@/components/ui/Chip";

export interface FootprintHeroProps {
  total: number;
  className?: string;
}

function verdict(ratio: number): { text: string; tone: "good" | "warn" } {
  if (ratio <= 1) {
    return {
      text: `${(ratio * 100).toFixed(0)}% of the India average — well done`,
      tone: "good",
    };
  }
  return { text: `${ratio.toFixed(1)}× the India average`, tone: "warn" };
}

function compact(n: number) {
  if (n >= 1000) return n.toLocaleString("en-IN");
  return n.toString();
}

export function FootprintHero({ total, className }: FootprintHeroProps) {
  const tonnes = total / 1000;
  const v = verdict(vsIndiaAverage(total));
  const equiv = equivalents(total);

  return (
    <div className={cn("flex flex-col gap-5", className)}>
      <div>
        <p className="text-sm font-medium uppercase tracking-wider text-faint">
          Your annual footprint
        </p>
        <div className="mt-1 flex items-end gap-2">
          <span className="font-mono text-6xl font-semibold leading-none tracking-tight text-gradient sm:text-7xl">
            <CountUp value={tonnes} format={(n) => n.toFixed(2)} />
          </span>
          <span className="mb-2 text-2xl font-medium text-muted">t CO₂</span>
        </div>
        <p
          className={cn(
            "mt-3 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium",
            v.tone === "good"
              ? "border-canopy/30 bg-canopy/10 text-canopy-soft"
              : "border-warn/30 bg-warn/10 text-warn",
          )}
        >
          {v.text}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {equiv.map((e) => (
          <Chip key={e.label} icon={e.icon} tone="default">
            <span className="font-mono font-semibold text-ink">{compact(e.value)}</span>
            <span className="text-faint">{e.label}</span>
          </Chip>
        ))}
      </div>
    </div>
  );
}

export default FootprintHero;
