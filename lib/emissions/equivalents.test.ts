import { describe, it, expect } from "vitest";
import {
  treesForYear,
  kmDriven,
  smartphoneCharges,
  vsIndiaAverage,
  equivalents,
} from "@/lib/emissions/equivalents";
import {
  TREE_KG_PER_YEAR,
  EQUIV_CAR_KG_PER_KM,
  SMARTPHONE_CHARGE_KG,
  INDIA_AVERAGE_KG,
} from "@/lib/emissions/factors";

describe("treesForYear", () => {
  it("divides kg by the per-tree annual absorption", () => {
    expect(treesForYear(210)).toBeCloseTo(210 / TREE_KG_PER_YEAR, 6);
    expect(treesForYear(210)).toBeCloseTo(10, 6);
  });

  it("returns 0 for 0 kg", () => {
    expect(treesForYear(0)).toBe(0);
  });
});

describe("kmDriven", () => {
  it("divides kg by the per-km car factor", () => {
    expect(kmDriven(17)).toBeCloseTo(17 / EQUIV_CAR_KG_PER_KM, 6);
    expect(kmDriven(17)).toBeCloseTo(100, 6);
  });
});

describe("smartphoneCharges", () => {
  it("divides kg by the per-charge factor", () => {
    expect(smartphoneCharges(8)).toBeCloseTo(8 / SMARTPHONE_CHARGE_KG, 6);
    expect(smartphoneCharges(8)).toBeCloseTo(1000, 6);
  });
});

describe("vsIndiaAverage", () => {
  it("expresses the footprint as a multiple of the India average", () => {
    expect(vsIndiaAverage(INDIA_AVERAGE_KG)).toBeCloseTo(1, 6);
    expect(vsIndiaAverage(2 * INDIA_AVERAGE_KG)).toBeCloseTo(2, 6);
    expect(vsIndiaAverage(INDIA_AVERAGE_KG / 2)).toBeCloseTo(0.5, 6);
  });
});

describe("equivalents", () => {
  it("returns exactly 3 items", () => {
    expect(equivalents(5000)).toHaveLength(3);
  });

  it("returns rounded (integer) values", () => {
    for (const eq of equivalents(5000)) {
      expect(Number.isInteger(eq.value)).toBe(true);
    }
  });

  it("returns positive values for a positive footprint", () => {
    for (const eq of equivalents(5000)) {
      expect(eq.value).toBeGreaterThan(0);
    }
  });

  it("each item carries an icon and a label", () => {
    for (const eq of equivalents(5000)) {
      expect(typeof eq.icon).toBe("string");
      expect(eq.icon.length).toBeGreaterThan(0);
      expect(typeof eq.label).toBe("string");
      expect(eq.label.length).toBeGreaterThan(0);
    }
  });

  it("values are the rounded outputs of the underlying conversions", () => {
    const kg = 5000;
    const [trees, km, charges] = equivalents(kg);
    expect(trees.value).toBe(Math.round(treesForYear(kg)));
    expect(km.value).toBe(Math.round(kmDriven(kg)));
    expect(charges.value).toBe(Math.round(smartphoneCharges(kg)));
  });
});
