"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Slider — a styled range input. Emerald track-fill (driven by the live value),
// glowing thumb, label + formatted value readout. Controlled. Pass 2's simulator
// leans on this heavily, so it stays generic: bring your own min/max/step/format.
// ─────────────────────────────────────────────────────────────────────────────

import { useId } from "react";

import { cn } from "@/lib/utils";

export interface SliderProps {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Label shown above the track. */
  label?: string;
  /** Format the value readout (default: as-is + optional unit). */
  format?: (value: number) => string;
  /** Short unit appended to the default readout, e.g. "km/wk". */
  unit?: string;
  disabled?: boolean;
  className?: string;
}

export function Slider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  format,
  unit,
  disabled,
  className,
}: SliderProps) {
  const id = useId();
  const pct = max > min ? ((value - min) / (max - min)) * 100 : 0;
  const readout = format
    ? format(value)
    : `${value.toLocaleString("en-IN")}${unit ? ` ${unit}` : ""}`;

  return (
    <div className={cn("w-full", className)}>
      {(label || readout) && (
        <div className="mb-2.5 flex items-baseline justify-between gap-3">
          {label && (
            <label htmlFor={id} className="text-sm font-medium text-muted">
              {label}
            </label>
          )}
          <span className="font-mono text-sm font-semibold tabular-nums text-canopy-soft">
            {readout}
          </span>
        </div>
      )}
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className={cn("eco-range", disabled && "opacity-50 pointer-events-none")}
        style={
          {
            // The fill is painted by a hard gradient stop at `pct`.
            "--eco-fill": `${pct}%`,
          } as React.CSSProperties
        }
      />
    </div>
  );
}

export default Slider;
