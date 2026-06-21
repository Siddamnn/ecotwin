<div align="center">

# 🌱 EcoTwin

### Understand, track, and shrink your carbon footprint — and actually stick with it.

EcoTwin pairs a **Household Twin** (model your lifestyle → get a baseline → run a what-if simulator ranked by *impact per effort*) with a **Habit Game** (quests, streaks, points, levels, badges).

**The twin tells you _what_ to change. The game makes you _stick to it_.**

<br/>

`Next.js 16` · `React 19` · `Tailwind v4` · `Zustand` · `Framer Motion` · `Recharts` · `Vitest`

**185 passing tests** over the carbon math & ranking engine · **Zero backend** · **Local-first**

</div>

---

## Table of contents

- [Why EcoTwin](#why-ecotwin)
- [Features by screen](#features-by-screen)
- [How it works — the science](#how-it-works--the-science)
  - [The carbon engine](#the-carbon-engine)
  - [Emission factors & sources](#emission-factors--sources)
  - [Impact-per-effort ranking](#impact-per-effort-ranking-the-core-idea)
  - [Tangible equivalents & benchmarks](#tangible-equivalents--benchmarks)
- [The habit game](#the-habit-game)
- [Tech stack & architecture](#tech-stack--architecture)
- [Getting started](#getting-started)
- [Testing](#testing)
- [Roadmap](#roadmap--out-of-scope-for-now)
- [Disclaimer](#disclaimer)

---

## Why EcoTwin

Most footprint calculators give you a single scary number and a generic tip list — and then you forget about it. EcoTwin is built around the two things that actually drive behaviour change:

1. **Personalised leverage.** Instead of "fly less" advice that may not apply to you, EcoTwin simulates every available change *against your own twin* and ranks them by how much CO₂ each one saves **per unit of effort**. The highest-leverage move for *your* life rises to the top.
2. **Momentum.** Knowing what to do isn't the same as doing it. Recommended changes become **quests** with a daily check-in, growing **streaks**, **green points**, five ascending **tiers**, and milestone **badges** — so the change actually sticks.

Everything runs on the device. There's no account, no signup, and no data leaves your browser.

---

## Features by screen

| Screen | Route | What it does |
|--------|-------|--------------|
| **Landing** | `/` | Hero with the signature *Living Tree* orbited by category rings; CTA adapts after hydration (build a twin vs. open dashboard). |
| **Onboarding wizard** | `/onboarding` | A 5-step, fully editable wizard (Home, Transport, Flights, Diet, Shopping) seeded from a sensible urban-India default. A live running estimate updates as you go and finishing locks in your baseline. |
| **Dashboard** | `/dashboard` | Footprint hero + the **Living Tree** (it flourishes as your footprint falls from baseline toward target), an emissions breakdown donut, a footprint-over-time trend line, and an editable target card. |
| **What-if simulator** | `/simulator` | A sandbox of live levers (car type & distance, electricity, AC runtime, rooftop solar, diet, eating out, flights, clothing spend). Every move recomputes the twin in real time, animates a before→after comparison bar, and shows a rough ₹/yr money estimate. Nothing saves until you **Apply**. |
| **Quests** | `/quests` | The habit-game hub: your tier/rank, green points, streak flame and daily check-in, **recommended quests** (ranked by impact per effort), **active quests** you can complete, and the **badge wall**. Every reward fires confetti + toasts, with a level-up modal on a tier change. |
| **Insights** | `/insights` | A templated (no-API) "eco coach" read: a verdict vs. the India average, your dominant category, your single highest-leverage action, and a projection if your top-3 ranked moves were all adopted — plus the full ranked list, each card promotable to a quest. |

---

## How it works — the science

EcoTwin's credibility rests on one principle: **the entire carbon model is a small set of transparent, cited constants in a single file**, consumed by pure functions. You can audit every number.

### The carbon engine

`lib/emissions/calculate.ts` turns a `Twin` (your lifestyle model) into an annual breakdown in **kg CO₂e / year**, across five categories:

| Category | How it's computed |
|----------|-------------------|
| **Home & energy** | `electricity kWh/mo × 12 × grid factor` (×0.3 residual if rooftop solar) `+ LPG cylinders/mo × 12 × 14.2 kg × LPG factor`, then **divided by household occupants** (your personal share). |
| **Transport** | `(car km/wk × car-type factor + bike km/wk × bike factor + transit km/wk × transit factor + rideshare km/wk × rideshare factor) × 52`. |
| **Flights** | `short-haul/yr × 500 kg + long-haul/yr × 2500 kg` (per round trip, including radiative forcing). |
| **Diet** | annual diet baseline for your diet type `+ eat-out meals/wk × 52 × 3 kg`. |
| **Shopping** | `clothing ₹/mo × 12 × spend factor + electronics/yr × 100 kg + a consumption baseline (low/avg/high)`. |

The same `calculate()` function is the single source of truth for the baseline **and** for every simulator preview and quest projection — so the number you see is always internally consistent.

### Emission factors & sources

Every factor below is defined and cited in [`lib/emissions/factors.ts`](lib/emissions/factors.ts). Values are India-relevant where possible.

| Factor | Value | Source |
|--------|-------|--------|
| Grid electricity | **0.71 kg CO₂e / kWh** | CEA CO₂ Baseline Database (India national grid) |
| LPG combustion | **2.98 kg CO₂e / kg** | DEFRA / BEIS GHG conversion factors |
| Standard LPG cylinder | **14.2 kg** | Indian domestic LPG cylinder spec |
| Rooftop-solar residual grid draw | **0.3** (30%) | Modelling assumption |
| Car — small / hatchback | **0.12 kg CO₂e / km** | DEFRA / BEIS passenger-vehicle factors (per pax-km) |
| Car — petrol / diesel | **0.17 kg CO₂e / km** | DEFRA / BEIS passenger-vehicle factors |
| Car — EV (grid-charged) | **0.05 kg CO₂e / km** | DEFRA / BEIS, using the India grid factor |
| Motorbike | **0.07 kg CO₂e / km** | DEFRA / BEIS |
| Public transit (bus/metro) | **0.02 kg CO₂e / pax-km** | DEFRA / BEIS public-transport factors |
| Rideshare (incl. deadheading) | **0.20 kg CO₂e / km** | DEFRA / BEIS + deadheading overhead |
| Flight — short-haul (return) | **500 kg CO₂e** | ICAO-style ≈ 0.15–0.18 kg/pax-km over representative distance (e.g. Delhi–Mumbai) |
| Flight — long-haul (return) | **2500 kg CO₂e** | ICAO-style, incl. radiative forcing (e.g. Delhi–London) |
| Diet — heavy-meat | **3300 kg CO₂e / yr** | Poore & Nemecek (*Science*, 2018), scaled to annual diets |
| Diet — omnivore | **2500 kg CO₂e / yr** | Poore & Nemecek (*Science*, 2018) |
| Diet — low-meat | **1900 kg CO₂e / yr** | Poore & Nemecek (*Science*, 2018) |
| Diet — pescatarian | **1700 kg CO₂e / yr** | Poore & Nemecek (*Science*, 2018) |
| Diet — vegetarian | **1700 kg CO₂e / yr** | Poore & Nemecek (*Science*, 2018) |
| Diet — vegan | **1500 kg CO₂e / yr** | Poore & Nemecek (*Science*, 2018) |
| Extra per restaurant meal | **3 kg CO₂e / meal** | Modelling assumption (transport, waste, portion size) |
| Clothing (spend-based) | **0.015 kg CO₂e / ₹** | Spend-based textile factor |
| New electronic device | **100 kg CO₂e each** | Embodied-emissions estimate |
| Consumption baseline | **200 / 500 / 1000 kg CO₂e** (low / avg / high) | Self-reported "everything else" goods & services |

**Reference points** used for comparisons:

| Benchmark | Value | Note |
|-----------|-------|------|
| India per-capita footprint | **1900 kg CO₂e / yr** | Approximate, consumption-based |
| World per-capita footprint | **4700 kg CO₂e / yr** | Approximate |
| Sustainable target | **2000 kg CO₂e / yr** | Per-capita target compatible with 1.5 °C by ≈ 2030 |

### Impact-per-effort ranking (the core idea)

This is what makes EcoTwin smarter than a calculator. The action catalog in [`lib/actions/catalog.ts`](lib/actions/catalog.ts) is a menu of changes (set the AC to 24 °C, swap to LEDs, eat plant-based dinners, take transit, cut a short flight, halve fast-fashion, go EV, install rooftop solar…). Each one is a **pure transform on the twin** plus an `effort` rating (1–5) and a money estimate.

The ranking engine ([`lib/actions/rank.ts`](lib/actions/rank.ts)) evaluates **every** action against **your** twin:

```text
annualSavingKg = calculate(twin).total − calculate(action.apply(twin)).total
score          = annualSavingKg / effort
```

It then drops actions with no meaningful effect on your twin (saving ≤ 0.5 kg) and **sorts by `score` descending**. The result is a personalised, highest-leverage-first list — the top action is the one the coach leads with. Because `effort` is in the denominator, a small, easy change that saves a lot can out-rank a big, hard change that saves only a little: the ranking optimises for *changes you'll actually make*. Where an action has a capital cost (solar, EV), the engine also reports an estimated **payback in months** from the annual rupee savings.

### Tangible equivalents & benchmarks

[`lib/emissions/equivalents.ts`](lib/emissions/equivalents.ts) turns abstract kilograms into things people can feel — mature **trees** needed for a year (21 kg absorbed/tree/yr), equivalent **km driven** in a petrol car (0.17 kg/km), and **smartphone charges** (0.008 kg/charge) — and exposes ratios against the India / world / target benchmarks above.

---

## The habit game

The gamification system lives in [`lib/game/`](lib/game) — all pure logic, fully unit-tested, with the UI consuming the results.

| Module | Responsibility |
|--------|----------------|
| `levels.ts` | Five ascending **tiers** — Seedling (0 pts) → Sapling (150) → Sprout (500) → Tree (1200) → Forest (3000) — plus progress toward the next. |
| `points.ts` | **Green points**: a completed quest pays `effort × 30 + 20`; a daily check-in pays `5 + (streak × 2)`, capped at a `+40` streak bonus. |
| `streak.ts` | Daily **streak** continuity with one forgiving grace day (exactly one missed day keeps the streak alive without growing it). |
| `badges.ts` | Ten milestone **badges** (first quest, quest trio/veteran, streak 3/7/30, 100 kg / 1 tonne saved, 1000 / 3000 points), each pairing display metadata with an unlock predicate so the two can't drift. |
| `juice.ts` | The "game feel" spec — confetti tuning and toast copy per event (`levelUp > questComplete > badgeUnlock > streakMilestone`). The UI owns the cannon; this file is pure data. |

State is unified in [`lib/store/useAppStore.ts`](lib/store/useAppStore.ts) — a Zustand store persisted to `localStorage` — where the twin, the emission engine, and the game meet. Mutating actions return rich result objects (`leveledUp`, `newTier`, `newBadgeIds`, `savedKg`…) so the UI can fire exactly the right celebration.

---

## Tech stack & architecture

**Design principle:** a pure, testable engine in `lib/` that knows nothing about React, wrapped by a thin local-first store, rendered by a `app/` + `components/` design system. No server, no database, no API calls.

| Area | Choice |
|------|--------|
| Framework | **Next.js 16.2.9** (App Router) |
| UI | **React 19.2.4**, **Tailwind CSS v4** |
| State | **Zustand 5** with `persist` → `localStorage` |
| Animation | **Framer Motion 12**, `canvas-confetti` |
| Charts | **Recharts 3** |
| Icons / styling utils | `lucide-react`, `class-variance-authority`, `clsx`, `tailwind-merge` |
| Testing | **Vitest 4**, Testing Library, jsdom |

### Directory map

```text
ecotwin/
├── lib/
│   ├── emissions/
│   │   ├── factors.ts        # cited constants — the entire model is auditable here
│   │   ├── calculate.ts      # pure: Twin → per-category + total kg CO₂e/yr
│   │   └── equivalents.ts    # kg → trees / km / charges, + benchmarks
│   ├── actions/
│   │   ├── catalog.ts        # the menu of changes (pure twin transforms)
│   │   └── rank.ts           # impact-per-effort ranking: score = annualSavingKg / effort
│   ├── game/
│   │   ├── levels.ts · points.ts · streak.ts · badges.ts · juice.ts · index.ts
│   ├── store/useAppStore.ts  # Zustand + persist (localStorage-first)
│   └── constants.ts          # DEFAULT_TWIN + onboarding option metadata
├── types/index.ts            # shared domain model (Twin, EmissionBreakdown, ActionTemplate…)
├── app/                      # landing, onboarding, dashboard, simulator, quests, insights
└── components/
    ├── ui/                   # Button, Slider, Toggle, GlassCard, CountUp, ProgressRing…
    ├── dashboard/            # FootprintHero, LivingTree, BreakdownDonut, TrendLine, TargetCard
    ├── simulator/ · quests/ · insights/ · onboarding/
    ├── game/                 # TierBadge, StreakFlame, BadgeGrid, LevelUpModal, RewardToast…
    └── layout/               # AppShell, AmbientBackground, PageTransition
```

---

## Getting started

**Prerequisites:** Node.js 18.18+ (Node 20 LTS recommended) and npm.

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server (http://localhost:3000)
npm run dev

# 3. Production build
npm run build

# 4. Run the test suite
npm test
```

All scripts (from [`package.json`](package.json)):

| Script | Command | What it does |
|--------|---------|--------------|
| `dev` | `next dev` | Start the dev server with hot reload |
| `build` | `next build` | Production build |
| `start` | `next start` | Serve the production build |
| `lint` | `eslint` | Lint the codebase |
| `typecheck` | `tsc --noEmit` | Type-check without emitting |
| `test` | `vitest run` | Run the test suite once |
| `test:watch` | `vitest` | Run tests in watch mode |

> The app is local-first: there are **no environment variables to configure** and nothing to provision. Your twin and game progress live in `localStorage` under the key `ecotwin-store`.

---

## Testing

The suite runs on **Vitest** with **185 passing tests** across 5 files, focused on the parts where correctness actually matters — the carbon math and the ranking logic:

| Test file | Covers |
|-----------|--------|
| `lib/emissions/calculate.test.ts` | Per-category and total emission math, occupant splitting, solar residual, and the full `Twin → breakdown` pipeline. |
| `lib/emissions/equivalents.test.ts` | Trees / km / charges conversions and benchmark ratios. |
| `lib/actions/catalog.test.ts` | Each action's pure transform and money estimate behave correctly. |
| `lib/actions/rank.test.ts` | `score = annualSavingKg / effort`, filtering of no-effect actions, descending sort, and `topAction`. |
| `lib/game/game.test.ts` | Tiers, points, streaks (incl. the grace day), and badge unlock predicates. |

```bash
npm test          # one-shot
npm run test:watch  # watch mode
```

The engine being pure (no React, no I/O) is what makes this coverage cheap and fast — the whole suite runs in around a second.

---

## Roadmap — out of scope for now

EcoTwin is intentionally a focused, local-first showcase. The following are framed as **future phases**, not gaps in the current build:

- **Phase 2 — Accounts & sync.** Supabase + auth so a twin follows you across devices.
- **Phase 3 — Social.** A squad leaderboard and shared challenges (the points/streak system is already designed to support this).
- **Phase 4 — AI coach.** An optional LLM layer over the existing ranking engine for conversational, context-aware guidance (the current "coach" on Insights is deliberately templated, no API).
- **Phase 5 — Effortless data.** Receipt imports and Google Maps trip imports to keep the twin current without manual entry.

---

## Disclaimer

EcoTwin's emission factors are **approximations intended for guidance and education, not a certified carbon audit**. They are drawn from public sources (CEA, DEFRA/BEIS, Poore & Nemecek 2018, ICAO-style estimates) and simplified for an interactive, India-tuned model. Real-world emissions vary with grid mix, vehicle, supply chain, and behaviour. Use the numbers to find *relative* leverage and direction — not to make absolute claims.

<div align="center">
<br/>
Built as a portfolio project. Every factor is auditable in <code>lib/emissions/factors.ts</code>.
</div>
