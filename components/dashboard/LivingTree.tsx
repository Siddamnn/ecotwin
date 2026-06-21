"use client";

// ─────────────────────────────────────────────────────────────────────────────
// LivingTree — the signature centrepiece. A hand-built organic SVG tree that is
// ALWAYS a living, leafy thing: at progress 0 it's a young but unmistakably alive
// sapling (a rounded canopy of overlapping leaf clusters — never a bare stick),
// and as progress → 1 it grows lush and magnificent — denser foliage, a richer
// emerald→lime gradient, a brighter ambient halo, drifting spores, blossoms, a
// grassy tuft, and a hint of a growing forest (companion saplings) once thriving.
//
// Foliage is built from layered organic leaf CLUSTERS (lobes), not a single
// ellipse of dots, so the silhouette reads as a real canopy. Everything is
// DETERMINISTIC (seeded by index — never Math.random in render) so SSR and client
// match. Growth staggers in; the canopy gently sways and an ambient halo breathes.
// Only transform/opacity animate. Reduced-motion safe. Stable gradient ids via
// useId() so multiple instances (dashboard + simulator) never collide.
//
// Public API is unchanged: <LivingTree progress={0..1} className? />.
// ─────────────────────────────────────────────────────────────────────────────

import { useId, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

export interface LivingTreeProps {
  /** 0..1 — how far the footprint has fallen from baseline toward target. */
  progress: number;
  className?: string;
}

/** Deterministic pseudo-random in [0,1) from an integer seed. */
function seeded(seed: number): number {
  const x = Math.sin(seed * 91.7 + 47.3) * 43758.5453;
  return x - Math.floor(x);
}

// ── canopy geometry ──────────────────────────────────────────────────────────
// The canopy lives around (100, 80) inside a 200×240 viewBox. We model it as a
// set of overlapping "lobes" (organic puffs). Inner lobes are present from the
// very start so even a brand-new sapling has a full little crown; outer/upper
// lobes unlock as progress rises, so the crown widens and lifts as it thrives.

interface Lobe {
  cx: number;
  cy: number;
  /** lobe radius. */
  r: number;
  /** 0..1 — lobe becomes visible once progress passes this. */
  threshold: number;
  /** stagger order for growth. */
  delay: number;
  /** 0..1 — how high/outer this lobe is (drives lime tint + brightness). */
  reach: number;
}

interface Leaf {
  x: number;
  y: number;
  r: number;
  threshold: number;
  delay: number;
  rot: number;
  /** 0..1 vertical-ish placement, drives emerald→lime tint. */
  tint: number;
}

const CANOPY_CX = 100;
const CANOPY_CY = 80;

// Hand-tuned lobe ring layout: a dense core, a mid ring, and an upper crown.
// `reach` rises with height + distance so the top of the tree skews lime.
const LOBE_BLUEPRINT: Array<[cx: number, cy: number, r: number, threshold: number]> = [
  // core crown — ALWAYS present (the sapling's starting canopy)
  [100, 78, 30, 0.0],
  [84, 88, 24, 0.0],
  [116, 88, 24, 0.0],
  [100, 62, 24, 0.0],
  // first expansion — shoulders + a lifted top
  [72, 74, 22, 0.16],
  [128, 74, 22, 0.18],
  [100, 46, 22, 0.22],
  [86, 58, 18, 0.2],
  [114, 58, 18, 0.24],
  // wide mid ring
  [60, 88, 20, 0.34],
  [140, 88, 20, 0.36],
  [74, 56, 17, 0.4],
  [126, 56, 17, 0.42],
  // lush outer + tall crown for a thriving tree
  [52, 70, 18, 0.52],
  [148, 70, 18, 0.54],
  [100, 32, 19, 0.58],
  [82, 42, 15, 0.6],
  [118, 42, 15, 0.62],
  [64, 70, 15, 0.66],
  [136, 70, 15, 0.68],
  // magnificent fringe (only when truly flourishing)
  [46, 86, 14, 0.78],
  [154, 86, 14, 0.8],
  [100, 22, 15, 0.84],
  [70, 38, 12, 0.86],
  [130, 38, 12, 0.88],
];

function buildLobes(): Lobe[] {
  const maxDist = 80;
  return LOBE_BLUEPRINT.map(([cx, cy, r, threshold], i) => {
    const dist = Math.hypot(cx - CANOPY_CX, cy - CANOPY_CY);
    const height = (CANOPY_CY + 30 - cy) / 70; // 0 low → ~1 high
    const reach = Math.max(0, Math.min(1, 0.5 * (dist / maxDist) + 0.5 * height));
    return {
      cx,
      cy,
      r,
      threshold,
      delay: threshold * 0.6 + seeded(i + 5) * 0.18,
      reach,
    };
  });
}

const LEAF_COUNT = 110;

// Leaves are scattered to sit on/around the lobes, sampled within the canopy
// ellipse with a vertical bias toward the lobe band. Each carries a `tint` so
// the upper canopy reads lime and the lower reads deep emerald.
function buildLeaves(): Leaf[] {
  const rx = 58;
  const ry = 52;
  return Array.from({ length: LEAF_COUNT }, (_, i) => {
    const t = seeded(i + 1) * Math.PI * 2;
    const rad = Math.sqrt(seeded(i + 40));
    const x = CANOPY_CX + Math.cos(t) * rx * rad;
    const y = CANOPY_CY - 6 + Math.sin(t) * ry * rad * 0.96;
    // inner leaves fill first; outer leaves unlock later (but core is generous so
    // even progress 0 shows a full little crown).
    const threshold = rad * 0.82;
    const tint = Math.max(0, Math.min(1, (CANOPY_CY + 4 - y) / 70 + rad * 0.18));
    return {
      x,
      y,
      r: 4.5 + seeded(i + 80) * 4,
      threshold,
      delay: rad * 0.5 + seeded(i + 160) * 0.22,
      rot: seeded(i + 200) * 70 - 35,
      tint,
    };
  });
}

/** A self-contained little sapling, used for the companion forest at high progress. */
function CompanionSapling({
  reduce,
  swing,
  delaySway,
}: {
  reduce: boolean | null;
  swing: number;
  delaySway: string;
}) {
  return (
    <g
      style={{
        transformOrigin: "0px 36px",
        animation: reduce ? undefined : `sway ${6.5}s ${delaySway} ease-in-out infinite`,
      }}
    >
      <path d={`M-2 36 C -2 24, -2 18, 0 12 L2 12 C 4 18, 4 24, 4 36 Z`} fill="url(#lt-mini-trunk)" />
      <circle cx={0} cy={6} r={11 + swing} fill="url(#lt-mini-leaf)" />
      <circle cx={-7} cy={11} r={8 + swing} fill="url(#lt-mini-leaf)" />
      <circle cx={8} cy={11} r={8 + swing} fill="url(#lt-mini-leaf)" />
      <circle cx={1} cy={-2} r={8 + swing} fill="url(#lt-mini-leaf)" />
    </g>
  );
}

export function LivingTree({ progress, className }: LivingTreeProps) {
  const reduce = useReducedMotion();
  const p = Math.max(0, Math.min(1, progress));
  const uid = useId();
  // unique, css-safe gradient/filter ids per instance
  const ids = useMemo(() => {
    const base = uid.replace(/[^a-zA-Z0-9_-]/g, "");
    return {
      trunk: `${base}-trunk`,
      foliage: `${base}-foliage`,
      lobe: `${base}-lobe`,
      halo: `${base}-halo`,
      soft: `${base}-soft`,
    };
  }, [uid]);

  const lobes = useMemo(() => buildLobes(), []);
  const leaves = useMemo(() => buildLeaves(), []);

  const visibleLobes = lobes.filter((l) => p >= l.threshold);
  const visibleLeaves = leaves.filter((l) => p >= l.threshold);

  // health drivers
  const haloOpacity = 0.18 + p * 0.5;
  const trunkGrowth = 0.78 + p * 0.22; // trunk thickens slightly as it matures

  // delightful extras unlock progressively
  const blossoms = useMemo(
    () =>
      leaves
        .filter((l) => l.tint > 0.45)
        .slice(0, 7)
        .map((l, i) => ({
          x: l.x + seeded(i + 11) * 6 - 3,
          y: l.y + seeded(i + 22) * 6 - 3,
          // pale-pink/cream blossoms early, warm golden "fruit" later
          color: i % 3 === 0 ? "#fde68a" : "#fbcfe8",
        })),
    [leaves],
  );

  const spores = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => ({
        x: 40 + seeded(i + 300) * 120,
        y: 50 + seeded(i + 330) * 90,
        r: 1 + seeded(i + 360) * 1.6,
        dur: 7 + seeded(i + 390) * 6,
        delay: seeded(i + 420) * 4,
      })),
    [],
  );

  const showBlossoms = p > 0.5;
  const showSpores = p > 0.45;
  const showGrass = p > 0.3;
  const showCompanions = p > 0.8;

  return (
    <div className={cn("relative w-full", className)}>
      {/* ambient halo — intensifies with health */}
      <div
        className="pointer-events-none absolute left-1/2 top-[36%] -z-10 h-[82%] w-[82%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{
          background: `radial-gradient(circle, rgba(52,211,153,${haloOpacity}), rgba(163,230,53,${haloOpacity * 0.4}) 45%, transparent 72%)`,
          animation: reduce ? undefined : "glow-breathe 6s ease-in-out infinite",
        }}
      />

      <motion.svg
        viewBox="0 0 200 240"
        className="w-full overflow-visible"
        initial={reduce ? false : { opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        role="img"
        aria-label={`Living tree, ${Math.round(p * 100)} percent grown`}
      >
        <defs>
          <linearGradient id={ids.trunk} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#3d2b1a" />
            <stop offset="55%" stopColor="#5a4327" />
            <stop offset="100%" stopColor="#6f5535" />
          </linearGradient>

          {/* primary canopy fill — emerald base into lime crown, richer with health */}
          <linearGradient id={ids.foliage} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#0f3b29" />
            <stop offset="38%" stopColor="#16a34a" />
            <stop offset="72%" stopColor="#34d399" />
            <stop offset="100%" stopColor={p > 0.5 ? "#a3e635" : "#6ee7b7"} />
          </linearGradient>

          {/* soft lobe radial — gives each puff a lit, rounded read */}
          <radialGradient id={ids.lobe} cx="42%" cy="34%" r="72%">
            <stop offset="0%" stopColor="#bbf7d0" stopOpacity="0.95" />
            <stop offset="45%" stopColor="#34d399" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#0f3b29" stopOpacity="0.92" />
          </radialGradient>

          <radialGradient id={ids.halo} cx="50%" cy="42%" r="60%">
            <stop offset="0%" stopColor="#1e5b3c" />
            <stop offset="100%" stopColor="#0c2418" />
          </radialGradient>

          {/* companion sapling gradients (shared, lightweight) */}
          <linearGradient id="lt-mini-trunk" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#4a3621" />
            <stop offset="100%" stopColor="#6b5333" />
          </linearGradient>
          <radialGradient id="lt-mini-leaf" cx="42%" cy="34%" r="70%">
            <stop offset="0%" stopColor="#a7f3d0" />
            <stop offset="100%" stopColor="#15803d" />
          </radialGradient>

          <filter id={ids.soft} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="1.4" />
          </filter>
        </defs>

        {/* ground shadow */}
        <ellipse
          cx="100"
          cy="224"
          rx={32 + p * 28}
          ry="7"
          fill="rgba(52,211,153,0.16)"
        />

        {/* grassy ground tuft — sprouts as the soil comes alive */}
        {showGrass && (
          <motion.g
            initial={reduce ? false : { opacity: 0, scaleY: 0 }}
            animate={{ opacity: 1, scaleY: 1 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformOrigin: "100px 220px" }}
            stroke="#4ade80"
            strokeWidth="2.4"
            strokeLinecap="round"
            fill="none"
          >
            {Array.from({ length: 9 }).map((_, i) => {
              const gx = 66 + i * 8.5 + seeded(i + 500) * 3;
              const h = 7 + seeded(i + 520) * 9 + p * 4;
              const lean = seeded(i + 540) * 8 - 4;
              return (
                <path
                  key={i}
                  d={`M${gx} 220 Q ${gx + lean} ${220 - h * 0.6} ${gx + lean * 1.6} ${220 - h}`}
                  opacity={0.5 + seeded(i + 560) * 0.4}
                />
              );
            })}
          </motion.g>
        )}

        {/* companion saplings — a hint of a growing forest when flourishing */}
        {showCompanions && (
          <motion.g
            initial={reduce ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          >
            <g transform="translate(34 188) scale(0.92)">
              <CompanionSapling reduce={reduce} swing={p * 1.5} delaySway="-1.5s" />
            </g>
            <g transform="translate(168 192) scale(0.78)">
              <CompanionSapling reduce={reduce} swing={p * 1.2} delaySway="-3s" />
            </g>
          </motion.g>
        )}

        {/* the main tree sways as one unit */}
        <g
          style={{
            transformOrigin: "100px 220px",
            animation: reduce ? undefined : "sway 7s ease-in-out infinite",
          }}
        >
          {/* roots flare */}
          <path
            d="M94 220 C 88 216, 82 218, 77 222 L123 222 C 118 218, 112 216, 106 220 Z"
            fill={`url(#${ids.trunk})`}
            opacity="0.75"
          />
          {/* trunk — tapered, thickens a touch as it matures */}
          <path
            d={`M${100 - 7 * trunkGrowth} 220 C ${100 - 6 * trunkGrowth} 188, ${100 - 5 * trunkGrowth} 150, ${100 - 3 * trunkGrowth} 118 L${100 + 3 * trunkGrowth} 118 C ${100 + 5 * trunkGrowth} 150, ${100 + 6 * trunkGrowth} 188, ${100 + 7 * trunkGrowth} 220 Z`}
            fill={`url(#${ids.trunk})`}
          />
          {/* a couple of inner branches reaching into the crown (mostly hidden by
              foliage — they just give the silhouette believable structure) */}
          <g stroke={`url(#${ids.trunk})`} strokeLinecap="round" fill="none">
            <path d="M99 124 C 90 112, 80 102, 72 88" strokeWidth="4.5" />
            <path d="M101 124 C 110 112, 120 102, 128 88" strokeWidth="4.5" />
            <path d="M100 120 C 99 104, 99 92, 100 76" strokeWidth="5.5" />
          </g>

          {/* soft canopy backing — a single blurred mass so gaps between lobes
              never show bare branch; grows + brightens with health */}
          <motion.ellipse
            cx={CANOPY_CX}
            cy={CANOPY_CY - 4}
            rx={50 + p * 12}
            ry={46 + p * 12}
            fill={`url(#${ids.halo})`}
            filter={`url(#${ids.soft})`}
            initial={false}
            animate={{ opacity: 0.55 + p * 0.35, scale: 0.9 + p * 0.12 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformOrigin: `${CANOPY_CX}px ${CANOPY_CY}px` }}
          />

          {/* LAYERED LOBES — the body of the canopy. Overlapping organic puffs,
              gradient-tinted toward lime at the top. */}
          {visibleLobes.map((lobe, i) => (
            <motion.g
              key={`lobe-${i}`}
              initial={reduce ? false : { scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={
                reduce
                  ? { duration: 0 }
                  : { type: "spring", stiffness: 200, damping: 18, delay: lobe.delay }
              }
              style={{ transformOrigin: `${lobe.cx}px ${lobe.cy}px` }}
            >
              {/* deep base puff */}
              <circle cx={lobe.cx} cy={lobe.cy} r={lobe.r} fill={`url(#${ids.foliage})`} />
              {/* lit overlay puff — lime where the lobe reaches high/outward */}
              <circle
                cx={lobe.cx - lobe.r * 0.18}
                cy={lobe.cy - lobe.r * 0.22}
                r={lobe.r * 0.78}
                fill={`url(#${ids.lobe})`}
                opacity={0.4 + lobe.reach * 0.35 + p * 0.15}
              />
            </motion.g>
          ))}

          {/* leaf speckle — individual leaves sitting on the lobes for texture +
              a sparkle of brighter tips. deterministic positions. */}
          {visibleLeaves.map((leaf, i) => {
            const lime = leaf.tint > 0.55 && p > 0.35;
            return (
              <motion.circle
                key={`leaf-${i}`}
                cx={leaf.x}
                cy={leaf.y}
                r={leaf.r}
                fill={lime ? "#bef264" : leaf.tint > 0.35 ? "#6ee7b7" : "#34d399"}
                initial={reduce ? false : { scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.55 + leaf.tint * 0.35 }}
                transition={
                  reduce
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 260, damping: 16, delay: 0.1 + leaf.delay }
                }
                style={{
                  transformOrigin: `${leaf.x}px ${leaf.y}px`,
                  transform: `rotate(${leaf.rot}deg)`,
                }}
              />
            );
          })}

          {/* bright highlight tips near the crown when healthy */}
          {p > 0.45 &&
            visibleLeaves
              .filter((l) => l.tint > 0.6)
              .slice(0, 10)
              .map((leaf, i) => (
                <motion.circle
                  key={`hl-${i}`}
                  cx={leaf.x + 1.4}
                  cy={leaf.y - 1.6}
                  r={leaf.r * 0.42}
                  fill="#ecfccb"
                  initial={reduce ? false : { scale: 0 }}
                  animate={{ scale: 1, opacity: 0.85 }}
                  transition={{ delay: 0.4 + i * 0.04, type: "spring", stiffness: 300, damping: 18 }}
                />
              ))}

          {/* blossoms / fruit — a delightful reward as the tree matures */}
          {showBlossoms &&
            blossoms.map((b, i) => (
              <motion.circle
                key={`bloom-${i}`}
                cx={b.x}
                cy={b.y}
                r={2.4 + (p - 0.5) * 2}
                fill={b.color}
                initial={reduce ? false : { scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.95 }}
                transition={{ delay: 0.5 + i * 0.06, type: "spring", stiffness: 280, damping: 16 }}
                style={{
                  filter: "drop-shadow(0 0 2px rgba(253,224,71,0.6))",
                }}
              />
            ))}
        </g>

        {/* drifting spores / fireflies — float across, independent of sway so they
            feel like ambient life. transform/opacity only. */}
        {showSpores &&
          !reduce &&
          spores.map((s, i) => (
            <circle
              key={`spore-${i}`}
              cx={s.x}
              cy={s.y}
              r={s.r}
              fill="#d9f99d"
              opacity={0.7}
              style={{
                transformBox: "fill-box",
                transformOrigin: "center",
                animation: `drift ${s.dur}s ${(-s.delay).toFixed(2)}s ease-in-out infinite`,
                filter: "drop-shadow(0 0 3px rgba(190,242,100,0.8))",
              }}
            />
          ))}
      </motion.svg>
    </div>
  );
}

export default LivingTree;
