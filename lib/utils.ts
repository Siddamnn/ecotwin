import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes safely (clsx + tailwind-merge). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Clamp a number into [min, max]. */
export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

/** Format a kg CO2e value into a compact human string (e.g. "1.8 t" or "640 kg"). */
export function formatCo2(kg: number) {
  if (kg >= 1000) return `${(kg / 1000).toFixed(kg >= 10000 ? 0 : 1)} t`;
  return `${Math.round(kg)} kg`;
}

/** Format Indian rupees compactly (₹1.2L, ₹8,400). */
export function formatInr(amount: number) {
  const rounded = Math.round(amount);
  if (rounded >= 100000) return `₹${(rounded / 100000).toFixed(1)}L`;
  return `₹${rounded.toLocaleString("en-IN")}`;
}

/** Today's date as a yyyy-mm-dd string in local time. */
export function todayIso(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

/** Whole-day difference between two yyyy-mm-dd strings (b - a). */
export function daysBetween(a: string, b: string) {
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return Math.round(ms / 86_400_000);
}
