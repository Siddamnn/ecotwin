// ─────────────────────────────────────────────────────────────────────────────
// The intellectual core: rank actions by impact-per-effort. This is what makes
// EcoTwin smarter than a calculator — it tells you the *highest-leverage* change
// for YOUR life, not a generic tip list.
// ─────────────────────────────────────────────────────────────────────────────

import type { ActionTemplate, RankedAction, Twin } from "@/types";
import { calculate } from "@/lib/emissions/calculate";
import { ACTION_CATALOG } from "./catalog";

/** Evaluate a single action against a twin. */
export function evaluateAction(twin: Twin, template: ActionTemplate): RankedAction {
  const baseTotal = calculate(twin).total;
  const afterTotal = calculate(template.apply(twin)).total;
  const annualSavingKg = Math.max(0, baseTotal - afterTotal);
  const annualSavingInr = Math.max(0, template.annualSavingInr(twin));
  const paybackMonths =
    template.capitalCostInr && annualSavingInr > 0
      ? (template.capitalCostInr / annualSavingInr) * 12
      : undefined;

  return {
    template,
    annualSavingKg,
    annualSavingInr,
    paybackMonths,
    score: annualSavingKg / template.effort,
  };
}

/**
 * Rank every applicable action for this twin, best impact-per-effort first.
 * Actions with no effect on this particular twin are dropped.
 */
export function rankActions(
  twin: Twin,
  catalog: ActionTemplate[] = ACTION_CATALOG,
): RankedAction[] {
  return catalog
    .map((template) => evaluateAction(twin, template))
    .filter((ranked) => ranked.annualSavingKg > 0.5)
    .sort((a, b) => b.score - a.score);
}

/** The single highest-leverage action — the one the coach leads with. */
export function topAction(twin: Twin): RankedAction | undefined {
  return rankActions(twin)[0];
}
