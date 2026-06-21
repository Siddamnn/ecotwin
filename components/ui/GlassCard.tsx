"use client";

// ─────────────────────────────────────────────────────────────────────────────
// GlassCard — the canonical frosted surface. Rounded-2xl glass with comfortable
// padding. Pass `glow` for the canopy halo, `as="..."` to change the element,
// and any motion props (it renders as a motion element so cards can animate in).
// ─────────────────────────────────────────────────────────────────────────────

import { forwardRef } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";

import { cn } from "@/lib/utils";

export interface GlassCardProps extends Omit<HTMLMotionProps<"div">, "ref"> {
  /** Add the canopy glow ring + shadow. */
  glow?: boolean;
  /** Use the heavier, more opaque glass treatment. */
  strong?: boolean;
  /** Tighten the default padding (good for chips / small cards). */
  compact?: boolean;
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  function GlassCard(
    { glow, strong, compact, className, children, ...rest },
    ref,
  ) {
    return (
      <motion.div
        ref={ref}
        className={cn(
          strong ? "glass-strong" : "glass",
          "rounded-2xl",
          compact ? "p-4" : "p-5 sm:p-6",
          glow && "glow-canopy",
          className,
        )}
        {...rest}
      >
        {children}
      </motion.div>
    );
  },
);

export default GlassCard;
