import { describe, it, expect } from "vitest";
import {
  homeEmissions,
  transportEmissions,
  flightEmissions,
  dietEmissions,
  shoppingEmissions,
  calculate,
  totalEmissions,
} from "@/lib/emissions/calculate";
import {
  GRID_KG_PER_KWH,
  LPG_KG_PER_KG,
  LPG_CYLINDER_KG,
  SOLAR_RESIDUAL,
  CAR_KG_PER_KM,
  MOTORBIKE_KG_PER_KM,
  TRANSIT_KG_PER_KM,
  RIDESHARE_KG_PER_KM,
  FLIGHT_SHORT_HAUL_KG,
  FLIGHT_LONG_HAUL_KG,
  DIET_ANNUAL_KG,
  EAT_OUT_KG_PER_MEAL,
  CLOTHING_KG_PER_INR,
  ELECTRONICS_KG_EACH,
  CONSUMPTION_BASE_KG,
} from "@/lib/emissions/factors";
import { DEFAULT_TWIN } from "@/lib/constants";
import type {
  HomeProfile,
  TransportProfile,
  FlightProfile,
  DietProfile,
  ShoppingProfile,
} from "@/types";

// ── shared fixtures (cloned per use so a category test never leaks state) ──────
function home(over: Partial<HomeProfile> = {}): HomeProfile {
  return {
    occupants: 1,
    electricityKwhPerMonth: 0,
    lpgCylindersPerMonth: 0,
    acHoursPerDay: 0,
    hasSolar: false,
    ...over,
  };
}
function transport(over: Partial<TransportProfile> = {}): TransportProfile {
  return {
    carType: "petrol",
    carKmPerWeek: 0,
    bikeKmPerWeek: 0,
    publicTransitKmPerWeek: 0,
    rideshareKmPerWeek: 0,
    ...over,
  };
}
function flights(over: Partial<FlightProfile> = {}): FlightProfile {
  return { shortHaulPerYear: 0, longHaulPerYear: 0, ...over };
}
function diet(over: Partial<DietProfile> = {}): DietProfile {
  return { type: "omnivore", eatOutPerWeek: 0, ...over };
}
function shopping(over: Partial<ShoppingProfile> = {}): ShoppingProfile {
  return {
    clothingSpendPerMonth: 0,
    electronicsPerYear: 0,
    consumption: "average",
    ...over,
  };
}

const WEEKS = 52;
const MONTHS = 12;

describe("homeEmissions", () => {
  it("annualises electricity with the grid factor", () => {
    // 100 kWh/mo × 12 × 0.71 = 852 kg, single occupant
    const result = homeEmissions(home({ electricityKwhPerMonth: 100 }));
    expect(result).toBeCloseTo(100 * MONTHS * GRID_KG_PER_KWH, 6);
    expect(result).toBeCloseTo(852, 6);
  });

  it("annualises LPG with cylinder mass × combustion factor", () => {
    // 1 cyl/mo × 12 × 14.2 kg × 2.98 = 507.792 kg
    const result = homeEmissions(home({ lpgCylindersPerMonth: 1 }));
    expect(result).toBeCloseTo(
      1 * MONTHS * LPG_CYLINDER_KG * LPG_KG_PER_KG,
      6,
    );
    expect(result).toBeCloseTo(507.792, 3);
  });

  it("divides total household energy by occupants", () => {
    const single = homeEmissions(
      home({ occupants: 1, electricityKwhPerMonth: 300 }),
    );
    const shared = homeEmissions(
      home({ occupants: 3, electricityKwhPerMonth: 300 }),
    );
    expect(shared).toBeCloseTo(single / 3, 6);
  });

  it("treats occupants < 1 as a single occupant (no divide-by-zero / blow-up)", () => {
    const expected = 200 * MONTHS * GRID_KG_PER_KWH; // divided by max(1, 0) = 1
    expect(homeEmissions(home({ occupants: 0, electricityKwhPerMonth: 200 }))).toBeCloseTo(
      expected,
      6,
    );
  });

  it("applies the SOLAR_RESIDUAL multiplier to electricity when hasSolar", () => {
    const withoutSolar = homeEmissions(
      home({ electricityKwhPerMonth: 250 }),
    );
    const withSolar = homeEmissions(
      home({ electricityKwhPerMonth: 250, hasSolar: true }),
    );
    expect(withSolar).toBeCloseTo(withoutSolar * SOLAR_RESIDUAL, 6);
  });

  it("does NOT discount LPG with solar (solar only offsets grid electricity)", () => {
    const result = homeEmissions(
      home({ lpgCylindersPerMonth: 1, hasSolar: true }),
    );
    expect(result).toBeCloseTo(
      1 * MONTHS * LPG_CYLINDER_KG * LPG_KG_PER_KG,
      6,
    );
  });

  it("returns 0 for a zero-energy home", () => {
    expect(homeEmissions(home())).toBe(0);
  });

  it("matches the hand-computed DEFAULT_TWIN home value", () => {
    // (250×12×0.71 + 1×12×14.2×2.98) / 3 = 2637.792 / 3 = 879.264
    expect(homeEmissions(DEFAULT_TWIN.home)).toBeCloseTo(879.264, 3);
  });
});

describe("transportEmissions", () => {
  it("sums each mode × its per-km factor, annualised over 52 weeks", () => {
    const t = transport({
      carType: "petrol",
      carKmPerWeek: 150,
      bikeKmPerWeek: 20,
      publicTransitKmPerWeek: 30,
      rideshareKmPerWeek: 20,
    });
    const expected =
      (150 * CAR_KG_PER_KM.petrol +
        20 * MOTORBIKE_KG_PER_KM +
        30 * TRANSIT_KG_PER_KM +
        20 * RIDESHARE_KG_PER_KM) *
      WEEKS;
    expect(transportEmissions(t)).toBeCloseTo(expected, 6);
    expect(transportEmissions(t)).toBeCloseTo(1638, 6);
  });

  it("uses the car-type factor (a 'none' car contributes nothing)", () => {
    const t = transport({ carType: "none", carKmPerWeek: 200 });
    expect(transportEmissions(t)).toBe(0);
  });

  it("an EV emits less per km than a petrol car for the same distance", () => {
    const petrol = transportEmissions(
      transport({ carType: "petrol", carKmPerWeek: 100 }),
    );
    const ev = transportEmissions(
      transport({ carType: "ev", carKmPerWeek: 100 }),
    );
    expect(ev).toBeLessThan(petrol);
    expect(ev).toBeCloseTo(100 * CAR_KG_PER_KM.ev * WEEKS, 6);
  });

  it("returns 0 for an empty transport profile", () => {
    expect(transportEmissions(transport())).toBe(0);
  });
});

describe("flightEmissions", () => {
  it("weights short- and long-haul trips by their factors", () => {
    const result = flightEmissions(
      flights({ shortHaulPerYear: 2, longHaulPerYear: 1 }),
    );
    expect(result).toBeCloseTo(
      2 * FLIGHT_SHORT_HAUL_KG + 1 * FLIGHT_LONG_HAUL_KG,
      6,
    );
    expect(result).toBeCloseTo(3500, 6);
  });

  it("returns 0 when no flights are taken", () => {
    expect(flightEmissions(flights())).toBe(0);
  });
});

describe("dietEmissions", () => {
  it("returns the annual diet baseline plus eating-out overhead", () => {
    const result = dietEmissions(diet({ type: "omnivore", eatOutPerWeek: 3 }));
    expect(result).toBeCloseTo(
      DIET_ANNUAL_KG.omnivore + 3 * WEEKS * EAT_OUT_KG_PER_MEAL,
      6,
    );
    expect(result).toBeCloseTo(2968, 6);
  });

  it("uses the diet-type baseline with no eating out", () => {
    expect(dietEmissions(diet({ type: "vegan", eatOutPerWeek: 0 }))).toBeCloseTo(
      DIET_ANNUAL_KG.vegan,
      6,
    );
  });

  it("a more plant-forward diet has a lower baseline", () => {
    expect(DIET_ANNUAL_KG.vegan).toBeLessThan(DIET_ANNUAL_KG["heavy-meat"]);
    expect(dietEmissions(diet({ type: "vegan" }))).toBeLessThan(
      dietEmissions(diet({ type: "heavy-meat" })),
    );
  });
});

describe("shoppingEmissions", () => {
  it("sums clothing spend, electronics, and the consumption baseline", () => {
    const s = shopping({
      clothingSpendPerMonth: 2000,
      electronicsPerYear: 1,
      consumption: "average",
    });
    const expected =
      2000 * MONTHS * CLOTHING_KG_PER_INR +
      1 * ELECTRONICS_KG_EACH +
      CONSUMPTION_BASE_KG.average;
    expect(shoppingEmissions(s)).toBeCloseTo(expected, 6);
    expect(shoppingEmissions(s)).toBeCloseTo(960, 6);
  });

  it("never falls below the consumption baseline (zero spend & devices)", () => {
    const s = shopping({ consumption: "low" });
    expect(shoppingEmissions(s)).toBeCloseTo(CONSUMPTION_BASE_KG.low, 6);
  });

  it("higher consumption level adds a larger baseline", () => {
    expect(shoppingEmissions(shopping({ consumption: "high" }))).toBeGreaterThan(
      shoppingEmissions(shopping({ consumption: "low" })),
    );
  });
});

describe("calculate", () => {
  it("returns a per-category breakdown matching each category function", () => {
    const breakdown = calculate(DEFAULT_TWIN);
    expect(breakdown.perCategory.home).toBeCloseTo(
      homeEmissions(DEFAULT_TWIN.home),
      6,
    );
    expect(breakdown.perCategory.transport).toBeCloseTo(
      transportEmissions(DEFAULT_TWIN.transport),
      6,
    );
    expect(breakdown.perCategory.flights).toBeCloseTo(
      flightEmissions(DEFAULT_TWIN.flights),
      6,
    );
    expect(breakdown.perCategory.diet).toBeCloseTo(
      dietEmissions(DEFAULT_TWIN.diet),
      6,
    );
    expect(breakdown.perCategory.shopping).toBeCloseTo(
      shoppingEmissions(DEFAULT_TWIN.shopping),
      6,
    );
  });

  it("total equals the sum of perCategory", () => {
    const breakdown = calculate(DEFAULT_TWIN);
    const sum = Object.values(breakdown.perCategory).reduce(
      (acc, kg) => acc + kg,
      0,
    );
    expect(breakdown.total).toBeCloseTo(sum, 6);
  });

  it("matches the fully hand-computed DEFAULT_TWIN total", () => {
    // home 879.264 + transport 1638 + flights 1000 + diet 2968 + shopping 960
    const expected = 879.264 + 1638 + 1000 + 2968 + 960;
    expect(calculate(DEFAULT_TWIN).total).toBeCloseTo(expected, 3);
    expect(calculate(DEFAULT_TWIN).total).toBeCloseTo(7445.264, 3);
  });

  it("does not mutate the input twin", () => {
    const snapshot = structuredClone(DEFAULT_TWIN);
    calculate(DEFAULT_TWIN);
    expect(DEFAULT_TWIN).toEqual(snapshot);
  });
});

describe("totalEmissions", () => {
  it("equals calculate(twin).total", () => {
    expect(totalEmissions(DEFAULT_TWIN)).toBeCloseTo(
      calculate(DEFAULT_TWIN).total,
      6,
    );
  });
});
