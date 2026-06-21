"use client";

// ─────────────────────────────────────────────────────────────────────────────
// CountUp — animates a number from its previous value to the next using a
// motion value + tween, pushing each frame through `format`. Drives the big
// footprint hero. Under reduced motion it renders the target directly (no
// animation, no setState-in-effect).
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { animate, useMotionValue, useReducedMotion } from "framer-motion";

export interface CountUpProps {
  value: number;
  /** Animation duration in seconds (default 1.1). */
  duration?: number;
  /** Format the live number (default: rounded + en-IN grouping). */
  format?: (value: number) => string;
  className?: string;
}

const defaultFormat = (n: number) => Math.round(n).toLocaleString("en-IN");

export function CountUp({
  value,
  duration = 1.1,
  format = defaultFormat,
  className,
}: CountUpProps) {
  const reduce = useReducedMotion();
  const mv = useMotionValue(value);
  // The frame-by-frame string. Seeded with the first value so SSR/first paint is
  // already correct; the effect only updates it *asynchronously* during a tween.
  const [display, setDisplay] = useState(() => format(value));

  useEffect(() => {
    if (reduce) {
      mv.jump(value);
      // async update — not a synchronous cascading render
      requestAnimationFrame(() => setDisplay(format(value)));
      return;
    }
    const controls = animate(mv, value, {
      duration,
      ease: [0.16, 1, 0.3, 1], // ease-out-expo
      onUpdate: (v) => setDisplay(format(v)),
    });
    return () => controls.stop();
  }, [value, duration, reduce, mv, format]);

  return (
    <span className={className} aria-label={format(value)}>
      {display}
    </span>
  );
}

export default CountUp;
