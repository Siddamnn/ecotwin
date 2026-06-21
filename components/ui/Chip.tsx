"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Chip — a small glass pill. Optional lucide icon (by string name) or any leading
// node. Three tones so chips can carry a little semantic colour.
// ─────────────────────────────────────────────────────────────────────────────

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Icon } from "./Icon";

export type ChipTone = "default" | "canopy" | "warn";

export interface ChipProps {
  /** lucide-react icon name rendered before the label. */
  icon?: string;
  /** Custom leading node (overrides `icon`). */
  leading?: ReactNode;
  tone?: ChipTone;
  className?: string;
  children: ReactNode;
}

const TONES: Record<ChipTone, string> = {
  default: "glass text-muted",
  canopy: "border border-canopy/25 bg-canopy/10 text-canopy-soft",
  warn: "border border-warn/25 bg-warn/10 text-warn",
};

export function Chip({ icon, leading, tone = "default", className, children }: ChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium",
        "backdrop-blur-md",
        TONES[tone],
        className,
      )}
    >
      {leading ?? (icon ? <Icon name={icon} size={14} className="shrink-0" /> : null)}
      {children}
    </span>
  );
}

export default Chip;
