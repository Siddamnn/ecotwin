import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

mkdirSync("/tmp/shots", { recursive: true });

const twin = {
  home: { occupants: 3, electricityKwhPerMonth: 250, lpgCylindersPerMonth: 1, acHoursPerDay: 4, hasSolar: false },
  transport: { carType: "petrol", carKmPerWeek: 150, bikeKmPerWeek: 20, publicTransitKmPerWeek: 30, rideshareKmPerWeek: 20 },
  flights: { shortHaulPerYear: 2, longHaulPerYear: 0 },
  diet: { type: "omnivore", eatOutPerWeek: 3 },
  shopping: { clothingSpendPerMonth: 2000, electronicsPerYear: 1, consumption: "average" },
};
const persisted = {
  state: {
    onboarded: true,
    twin,
    baselineKg: 8200,
    targetKg: 5200,
    game: {
      greenPoints: 320,
      currentStreakDays: 4,
      longestStreakDays: 6,
      lastCheckIn: "2025-01-01",
      unlockedBadgeIds: ["first-quest", "streak-3"],
      activeQuests: [{ questId: "veg-dinners", acceptedAt: "2025-12-01", target: 2, progress: 0, status: "active" }],
      completedQuestIds: ["led-swap"],
      footprintHistory: [
        { date: "2026-05-20", totalKg: 8200 },
        { date: "2026-05-30", totalKg: 8050 },
        { date: "2026-06-08", totalKg: 7800 },
        { date: "2026-06-15", totalKg: 7600 },
        { date: "2026-06-20", totalKg: 7445 },
      ],
    },
  },
  version: 0,
};

const seed = JSON.stringify(persisted);
const base = "http://localhost:3210";

const browser = await chromium.launch();

async function shoot(label, viewport, routes) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2 });
  await ctx.addInitScript((s) => {
    try { localStorage.setItem("ecotwin-store", s); } catch {}
  }, seed);
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  for (const [route, name] of routes) {
    await page.goto(base + route, { waitUntil: "networkidle" }).catch(() => {});
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `/tmp/shots/${label}-${name}.png`, fullPage: true });
    console.log(`shot ${label}-${name} (url=${page.url()})`);
  }
  if (errors.length) console.log(`  [${label}] pageerrors:`, [...new Set(errors)].slice(0, 5));
  await ctx.close();
}

await shoot("desk", { width: 1440, height: 900 }, [
  ["/", "landing"],
  ["/onboarding", "onboarding"],
  ["/dashboard", "dashboard"],
  ["/simulator", "simulator"],
  ["/quests", "quests"],
  ["/insights", "insights"],
]);
await shoot("mob", { width: 390, height: 844 }, [
  ["/dashboard", "dashboard"],
  ["/quests", "quests"],
]);

await browser.close();
console.log("done");
