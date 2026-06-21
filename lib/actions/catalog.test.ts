import { describe, it, expect } from "vitest";
import { ACTION_CATALOG, getAction } from "@/lib/actions/catalog";
import { calculate } from "@/lib/emissions/calculate";
import { DEFAULT_TWIN } from "@/lib/constants";
import type { Twin } from "@/types";

const EPSILON = 1e-6;

// A few extra twins so we exercise apply() against varied inputs, not just one.
const TWINS: Record<string, Twin> = {
  default: DEFAULT_TWIN,
  heavyMeat: {
    ...DEFAULT_TWIN,
    diet: { type: "heavy-meat", eatOutPerWeek: 5 },
  },
  vegan: {
    ...DEFAULT_TWIN,
    diet: { type: "vegan", eatOutPerWeek: 0 },
  },
  noCar: {
    ...DEFAULT_TWIN,
    transport: { ...DEFAULT_TWIN.transport, carType: "none", carKmPerWeek: 0 },
  },
  solarAlready: {
    ...DEFAULT_TWIN,
    home: { ...DEFAULT_TWIN.home, hasSolar: true },
  },
  evAlready: {
    ...DEFAULT_TWIN,
    transport: { ...DEFAULT_TWIN.transport, carType: "ev" },
  },
};

describe("ACTION_CATALOG integrity", () => {
  it("has at least one action", () => {
    expect(ACTION_CATALOG.length).toBeGreaterThan(0);
  });

  it("every action id is unique", () => {
    const ids = ACTION_CATALOG.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every action effort is an integer in 1..5", () => {
    for (const action of ACTION_CATALOG) {
      expect(Number.isInteger(action.effort)).toBe(true);
      expect(action.effort).toBeGreaterThanOrEqual(1);
      expect(action.effort).toBeLessThanOrEqual(5);
    }
  });

  it("every action carries the required display metadata", () => {
    for (const action of ACTION_CATALOG) {
      expect(action.title.length).toBeGreaterThan(0);
      expect(action.description.length).toBeGreaterThan(0);
      expect(action.icon.length).toBeGreaterThan(0);
      expect(action.quest.target).toBeGreaterThan(0);
      expect(action.quest.unit.length).toBeGreaterThan(0);
      expect(typeof action.apply).toBe("function");
      expect(typeof action.annualSavingInr).toBe("function");
    }
  });

  it("getAction resolves a known id and returns undefined for an unknown one", () => {
    expect(getAction(ACTION_CATALOG[0].id)).toBe(ACTION_CATALOG[0]);
    expect(getAction("does-not-exist")).toBeUndefined();
  });
});

describe("apply() purity", () => {
  for (const action of ACTION_CATALOG) {
    for (const [name, twin] of Object.entries(TWINS)) {
      it(`'${action.id}' does not mutate the input twin (${name})`, () => {
        const snapshot = structuredClone(twin);
        action.apply(twin);
        expect(twin).toEqual(snapshot);
      });
    }
  }
});

describe("apply() never increases the footprint", () => {
  for (const action of ACTION_CATALOG) {
    for (const [name, twin] of Object.entries(TWINS)) {
      it(`'${action.id}' keeps total ≤ baseline + ε (${name})`, () => {
        const before = calculate(twin).total;
        const after = calculate(action.apply(twin)).total;
        expect(after).toBeLessThanOrEqual(before + EPSILON);
      });
    }
  }
});

describe("annualSavingInr() is finite and non-negative for the default twin", () => {
  for (const action of ACTION_CATALOG) {
    it(`'${action.id}' returns a finite money estimate`, () => {
      const inr = action.annualSavingInr(DEFAULT_TWIN);
      expect(Number.isFinite(inr)).toBe(true);
      expect(inr).toBeGreaterThanOrEqual(0);
    });
  }
});
