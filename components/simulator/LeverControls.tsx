"use client";

// ─────────────────────────────────────────────────────────────────────────────
// LeverControls — the small building blocks the simulator composes:
//   • LeverSection : a category-titled GlassCard wrapper (icon on its tint disc)
//   • OptionChips  : a segmented pill control for enum levers (car type, diet)
// Kept generic so every category section reads the same. Reduced-motion handled
// by the shared kit (Button/GlassCard) and the active-pill layout animation.
// ─────────────────────────────────────────────────────────────────────────────

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

import type { Category } from "@/types";
import { CATEGORY_META } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/ui/GlassCard";
import { Icon } from "@/components/ui/Icon";

export function LeverSection({
  category,
  children,
}: {
  category: Category;
  children: ReactNode;
}) {
  const meta = CATEGORY_META[category];
  return (
    <GlassCard className="h-full">
      <div className="mb-5 flex items-center gap-2.5">
        <span
          className="grid h-9 w-9 place-items-center rounded-xl"
          style={{
            backgroundColor: `${meta.color}1f`,
            color: meta.color,
            boxShadow: `inset 0 0 0 1px ${meta.color}40`,
          }}
        >
          <Icon name={meta.icon} size={18} />
        </span>
        <h3 className="text-sm font-semibold text-ink">{meta.label}</h3>
      </div>
      <div className="space-y-5">{children}</div>
    </GlassCard>
  );
}

export interface OptionChipsProps<T extends string> {
  label?: string;
  value: T;
  options: { value: T; label: string; emoji?: string }[];
  onChange: (next: T) => void;
  layoutId: string;
}

export function OptionChips<T extends string>({
  label,
  value,
  options,
  onChange,
  layoutId,
}: OptionChipsProps<T>) {
  const reduce = useReducedMotion();

  return (
    <div>
      {label && (
        <p className="mb-2.5 text-sm font-medium text-muted">{label}</p>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              aria-pressed={active}
              className={cn(
                "relative inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-colors",
                active ? "text-canopy-soft" : "text-muted hover:text-ink",
              )}
            >
              {active && (
                <motion.span
                  layoutId={layoutId}
                  className="absolute inset-0 -z-10 rounded-xl border border-canopy/35 bg-canopy/12"
                  transition={
                    reduce ? { duration: 0 } : { type: "spring", stiffness: 480, damping: 36 }
                  }
                />
              )}
              {opt.emoji && <span aria-hidden>{opt.emoji}</span>}
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
