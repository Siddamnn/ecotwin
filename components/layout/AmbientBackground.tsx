"use client";

// ─────────────────────────────────────────────────────────────────────────────
// AmbientBackground — fixed, behind everything. Layered radial glows + a small,
// capped set of slow-drifting "spores". Particles are DETERMINISTIC (seeded by
// index, never Math.random) so SSR and client agree. Disabled under reduced
// motion. Lightweight: pure CSS/SVG, no canvas, no rAF.
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo } from "react";
import { useReducedMotion } from "framer-motion";

const PARTICLE_COUNT = 18;

/** Deterministic pseudo-random in [0,1) from an integer seed (no global state). */
function seeded(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

interface Spore {
  left: number;
  top: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
}

export function AmbientBackground() {
  const reduce = useReducedMotion();

  const spores = useMemo<Spore[]>(
    () =>
      Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
        left: seeded(i + 1) * 100,
        top: seeded(i + 50) * 100,
        size: 3 + seeded(i + 100) * 7,
        duration: 14 + seeded(i + 150) * 16,
        delay: -seeded(i + 200) * 20,
        opacity: 0.12 + seeded(i + 250) * 0.3,
      })),
    [],
  );

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* layered radial glows — the "ambient organism" */}
      <div
        className="absolute -left-[15%] -top-[20%] h-[55vh] w-[55vh] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(52,211,153,0.22), transparent 65%)",
          animation: reduce ? undefined : "glow-breathe 11s ease-in-out infinite",
        }}
      />
      <div
        className="absolute -right-[10%] top-[5%] h-[48vh] w-[48vh] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(45,212,191,0.18), transparent 60%)",
          animation: reduce
            ? undefined
            : "glow-breathe 13s ease-in-out infinite 2s",
        }}
      />
      <div
        className="absolute bottom-[-20%] left-1/3 h-[60vh] w-[60vh] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(163,230,53,0.12), transparent 60%)",
          animation: reduce
            ? undefined
            : "glow-breathe 15s ease-in-out infinite 4s",
        }}
      />

      {/* drifting spores */}
      {!reduce &&
        spores.map((s, i) => (
          <span
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: s.size,
              height: s.size,
              opacity: s.opacity,
              background:
                "radial-gradient(circle, rgba(167,243,208,0.9), rgba(52,211,153,0.2) 70%, transparent)",
              boxShadow: "0 0 8px rgba(110,231,183,0.6)",
              animation: `drift ${s.duration}s ease-in-out ${s.delay}s infinite`,
              willChange: "transform",
            }}
          />
        ))}

      {/* faint grain for depth */}
      <div className="bg-grain absolute inset-0 opacity-[0.035] mix-blend-soft-light" />
    </div>
  );
}

export default AmbientBackground;
