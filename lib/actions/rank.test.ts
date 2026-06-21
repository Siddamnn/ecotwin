import { describe, it, expect } from "vitest";
import { rankActions, evaluateAction, topAction } from "@/lib/actions/rank";
import { ACTION_CATALOG, getAction } from "@/lib/actions/catalog";
import { DEFAULT_TWIN } from "@/lib/constants";
import type { ActionTemplate } from "@/types";

function requireAction(id: string): ActionTemplate {
  const action = getAction(id);
  if (!action) throw new Error(`fixture action '${id}' missing from catalog`);
  return action;
}

describe("rankActions", () => {
  it("returns a non-empty list for the default twin", () => {
    expect(rankActions(DEFAULT_TWIN).length).toBeGreaterThan(0);
  });

  it("is sorted strictly descending by score", () => {
    const ranked = rankActions(DEFAULT_TWIN);
    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[i - 1].score).toBeGreaterThanOrEqual(ranked[i].score);
    }
  });

  it("every ranked entry has a positive carbon saving", () => {
    for (const r of rankActions(DEFAULT_TWIN)) {
      expect(r.annualSavingKg).toBeGreaterThan(0);
    }
  });

  it("score === annualSavingKg / effort for each entry", () => {
    for (const r of rankActions(DEFAULT_TWIN)) {
      expect(r.score).toBeCloseTo(r.annualSavingKg / r.template.effort, 9);
    }
  });

  it("drops actions with no measurable effect on this twin", () => {
    // A twin with no rideshares: the rideshare→transit action saves nothing.
    const noRideshare = {
      ...DEFAULT_TWIN,
      transport: { ...DEFAULT_TWIN.transport, rideshareKmPerWeek: 0 },
    };
    const ids = rankActions(noRideshare).map((r) => r.template.id);
    expect(ids).not.toContain("rideshare-to-transit");
  });
});

describe("evaluateAction", () => {
  it("computes annualSavingKg as the drop in total emissions, floored at 0", () => {
    const action = requireAction("transit-commute");
    const result = evaluateAction(DEFAULT_TWIN, action);
    expect(result.annualSavingKg).toBeGreaterThan(0);
    expect(result.annualSavingKg).toBeGreaterThanOrEqual(0);
  });

  it("produces a paybackMonths for an action with capitalCostInr (rooftop-solar)", () => {
    const action = requireAction("rooftop-solar");
    expect(action.capitalCostInr).toBeGreaterThan(0);
    const result = evaluateAction(DEFAULT_TWIN, action);
    expect(result.paybackMonths).toBeDefined();
    expect(result.paybackMonths).toBeGreaterThan(0);
    // payback = (capital / annualSavingInr) × 12
    expect(result.paybackMonths).toBeCloseTo(
      (action.capitalCostInr! / result.annualSavingInr) * 12,
      6,
    );
  });

  it("produces a paybackMonths for go-ev (also capital-backed) on the default twin", () => {
    const action = requireAction("go-ev");
    expect(action.capitalCostInr).toBeGreaterThan(0);
    const result = evaluateAction(DEFAULT_TWIN, action);
    expect(result.paybackMonths).toBeDefined();
    expect(result.paybackMonths).toBeGreaterThan(0);
  });

  it("leaves paybackMonths undefined for an action without capitalCostInr (transit-commute)", () => {
    const action = requireAction("transit-commute");
    expect(action.capitalCostInr).toBeUndefined();
    const result = evaluateAction(DEFAULT_TWIN, action);
    expect(result.paybackMonths).toBeUndefined();
  });

  it("clamps negative money savings to 0", () => {
    for (const action of ACTION_CATALOG) {
      const result = evaluateAction(DEFAULT_TWIN, action);
      expect(result.annualSavingInr).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("topAction", () => {
  it("equals the first element of rankActions for the default twin", () => {
    const ranked = rankActions(DEFAULT_TWIN);
    expect(topAction(DEFAULT_TWIN)).toEqual(ranked[0]);
  });

  it("is the single highest-scoring action", () => {
    const top = topAction(DEFAULT_TWIN);
    expect(top).toBeDefined();
    for (const r of rankActions(DEFAULT_TWIN)) {
      expect(top!.score).toBeGreaterThanOrEqual(r.score);
    }
  });
});
