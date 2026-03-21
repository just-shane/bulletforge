/**
 * Curated, real-world chronograph reference data for BulletForge ballistics simulator.
 *
 * Sources:
 *   Ammolytics chronograph comparison experiment
 *     https://github.com/ammolytics/experiments/tree/master/chronograph-comparison
 *   Ammolytics bullet sorting experiment
 *     https://github.com/ammolytics/experiments/tree/master/bullet-sorting
 *   Ammolytics brass sorting experiment
 *     https://github.com/ammolytics/experiments/tree/master/brass-sorting
 *   Ammolytics recoil vs MV experiment
 *     https://github.com/ammolytics/experiments/tree/master/recoil-velocity
 *   Rifleshooter.com cut-down barrel tests
 *     https://rifleshooter.com/2016/02/6-5-creedmoor-effect-of-barrel-length-on-velocity-cutting-up-a-creedmoor/
 */

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface ChronoReference {
  id: string;
  label: string;
  cartridgeShortName: string;
  bulletDescription: string;
  bulletWeight: number;
  powderName: string;
  chargeWeight: number;
  primer: string;
  brass: string;
  barrelLength: number;
  device: "LabRadar" | "MagnetoSpeed" | "Two-Box" | "Other";
  velocities: number[];
  avgVelocity: number;
  es: number;
  sd: number;
  source: string;
  sourceUrl: string;
  notes: string;
}

export interface BarrelLengthReference {
  cartridgeShortName: string;
  bulletDescription: string;
  loadDescription: string;
  device: string;
  source: string;
  sourceUrl: string;
  data: { barrelLength: number; avgVelocity: number; fpsPerInchLoss?: number }[];
}

// ---------------------------------------------------------------------------
// Helper functions — derive stats from raw velocity arrays
// ---------------------------------------------------------------------------

function avg(v: number[]): number {
  const sum = v.reduce((a, b) => a + b, 0);
  return Math.round(sum / v.length);
}

function es(v: number[]): number {
  return Math.max(...v) - Math.min(...v);
}

function sd(v: number[]): number {
  const mean = v.reduce((a, b) => a + b, 0) / v.length;
  const variance = v.reduce((sum, x) => sum + (x - mean) ** 2, 0) / (v.length - 1);
  return Math.round(Math.sqrt(variance) * 10) / 10;
}

function computeFpsPerInchLoss(
  data: { barrelLength: number; avgVelocity: number }[],
): { barrelLength: number; avgVelocity: number; fpsPerInchLoss?: number }[] {
  const sorted = [...data].sort((a, b) => b.barrelLength - a.barrelLength);
  return sorted.map((entry, i) => {
    if (i === 0) return { ...entry };
    const prev = sorted[i - 1];
    const loss = (prev.avgVelocity - entry.avgVelocity) / (prev.barrelLength - entry.barrelLength);
    return {
      ...entry,
      fpsPerInchLoss: Math.round(loss * 10) / 10,
    };
  });
}

// ---------------------------------------------------------------------------
// Helper to build a ChronoReference from minimal input
// ---------------------------------------------------------------------------

function mkRef(
  partial: Omit<ChronoReference, "avgVelocity" | "es" | "sd">,
): ChronoReference {
  return {
    ...partial,
    avgVelocity: avg(partial.velocities),
    es: es(partial.velocities),
    sd: sd(partial.velocities),
  };
}

// ---------------------------------------------------------------------------
// Common load definitions (to reduce repetition)
// ---------------------------------------------------------------------------

const CHRONO_COMPARISON_SOURCE = "Ammolytics Chrono Comparison";
const CHRONO_COMPARISON_URL =
  "https://github.com/ammolytics/experiments/tree/master/chronograph-comparison";

const BULLET_SORTING_SOURCE = "Ammolytics Bullet Sorting";
const BULLET_SORTING_URL =
  "https://github.com/ammolytics/experiments/tree/master/bullet-sorting";

const BRASS_SORTING_SOURCE = "Ammolytics Brass Sorting";
const BRASS_SORTING_URL =
  "https://github.com/ammolytics/experiments/tree/master/brass-sorting";

const RECOIL_SOURCE = "Ammolytics Recoil vs MV";
const RECOIL_URL =
  "https://github.com/ammolytics/experiments/tree/master/recoil-velocity";

// Shared load: 6.5 CM 142gr SMK / 41.5gr H4350 / CCI BR-4 / Peterson / 24"
const LOAD_65CM_142SMK = {
  cartridgeShortName: "6.5 CM" as const,
  bulletDescription: "142gr Sierra MatchKing HPBT",
  bulletWeight: 142,
  powderName: "H4350",
  chargeWeight: 41.5,
  primer: "CCI BR-4",
  brass: "Peterson",
  barrelLength: 24,
};

// Shared load: .223 Rem 77gr SMK / Varget / CCI #41 / Lapua / 20"
const LOAD_223_77SMK = {
  cartridgeShortName: ".223 Rem" as const,
  bulletDescription: "77gr Sierra MatchKing",
  bulletWeight: 77,
  powderName: "Varget",
  chargeWeight: 24,
  primer: "CCI #41",
  brass: "Lapua",
  barrelLength: 20,
};

// ---------------------------------------------------------------------------
// Chronograph reference data — 30 entries
// ---------------------------------------------------------------------------

export const CHRONO_REFERENCES: ChronoReference[] = [
  // =========================================================================
  // 1. Chrono Comparison — 6.5 CM LabRadar (SR0003)
  // =========================================================================
  mkRef({
    id: "ammo-chrono-65cm-lr",
    label: "6.5 CM 142gr SMK — LabRadar (Chrono Comparison)",
    ...LOAD_65CM_142SMK,
    device: "LabRadar",
    velocities: [
      2755, 2753, 2754, 2751, 2762, 2755, 2751, 2758, 2765, 2754, 2775, 2753,
      2764, 2749, 2758, 2748, 2753, 2764, 2742, 2761, 2754, 2756, 2755,
    ],
    source: CHRONO_COMPARISON_SOURCE,
    sourceUrl: CHRONO_COMPARISON_URL,
    notes: "Bartlein 1:8 twist, Spartan Precision Rifles build",
  }),

  // =========================================================================
  // 2. Chrono Comparison — 6.5 CM MagnetoSpeed Series 20 (30 shots)
  // =========================================================================
  mkRef({
    id: "ammo-chrono-65cm-ms-s20",
    label: "6.5 CM 142gr SMK — MagnetoSpeed (Chrono Comparison, Series 20)",
    ...LOAD_65CM_142SMK,
    device: "MagnetoSpeed",
    velocities: [
      2720, 2721, 2715, 2718, 2726, 2715, 2694, 2712, 2716, 2716, 2717, 2714,
      2708, 2722, 2713, 2726, 2721, 2718, 2709, 2713, 2711, 2707, 2709, 2700,
      2712, 2714, 2724, 2724, 2715, 2724,
    ],
    source: CHRONO_COMPARISON_SOURCE,
    sourceUrl: CHRONO_COMPARISON_URL,
    notes: "Same load as LabRadar — MagnetoSpeed reads ~41 fps lower (barrel-mounted deflection)",
  }),

  // =========================================================================
  // 3. Chrono Comparison — 6.5 CM MagnetoSpeed Series 33 (25 shots)
  // =========================================================================
  mkRef({
    id: "ammo-chrono-65cm-ms-s33",
    label: "6.5 CM 142gr SMK — MagnetoSpeed (Chrono Comparison, Series 33)",
    ...LOAD_65CM_142SMK,
    device: "MagnetoSpeed",
    velocities: [
      2753, 2745, 2735, 2751, 2735, 2768, 2756, 2735, 2754, 2735, 2748, 2757,
      2733, 2752, 2769, 2755, 2750, 2744, 2746, 2742, 2743, 2753, 2749, 2751,
      2746,
    ],
    source: CHRONO_COMPARISON_SOURCE,
    sourceUrl: CHRONO_COMPARISON_URL,
    notes: "25-shot string, very consistent — SD ~9.4",
  }),

  // =========================================================================
  // 4. .223 Rem 77gr SMK — MagnetoSpeed Series 1 (10 shots)
  // =========================================================================
  mkRef({
    id: "ammo-chrono-223-77smk-s1",
    label: ".223 Rem 77gr SMK — MagnetoSpeed (Series 1)",
    ...LOAD_223_77SMK,
    device: "MagnetoSpeed",
    velocities: [2725, 2769, 2808, 2792, 2782, 2778, 2786, 2772, 2765, 2775],
    source: CHRONO_COMPARISON_SOURCE,
    sourceUrl: CHRONO_COMPARISON_URL,
    notes: "",
  }),

  // =========================================================================
  // 5. .223 Rem 77gr SMK — MagnetoSpeed Series 2 (10 shots)
  // =========================================================================
  mkRef({
    id: "ammo-chrono-223-77smk-s2",
    label: ".223 Rem 77gr SMK — MagnetoSpeed (Series 2)",
    ...LOAD_223_77SMK,
    device: "MagnetoSpeed",
    velocities: [2750, 2703, 2706, 2736, 2737, 2739, 2732, 2732, 2745, 2717],
    source: CHRONO_COMPARISON_SOURCE,
    sourceUrl: CHRONO_COMPARISON_URL,
    notes: "",
  }),

  // =========================================================================
  // 6. .223 Rem 77gr TMK — MagnetoSpeed Series 3 (11 shots)
  // =========================================================================
  mkRef({
    id: "ammo-chrono-223-77tmk-s3",
    label: ".223 Rem 77gr Tipped MatchKing — MagnetoSpeed (Series 3)",
    ...LOAD_223_77SMK,
    bulletDescription: "77gr Sierra Tipped MatchKing",
    device: "MagnetoSpeed",
    velocities: [2800, 2793, 2810, 2791, 2762, 2802, 2805, 2804, 2795, 2804, 2820],
    source: CHRONO_COMPARISON_SOURCE,
    sourceUrl: CHRONO_COMPARISON_URL,
    notes: "",
  }),

  // =========================================================================
  // 7. .223 Rem 80gr SMK — MagnetoSpeed Series 5 (10 shots)
  // =========================================================================
  mkRef({
    id: "ammo-chrono-223-80smk-s5",
    label: ".223 Rem 80gr SMK — MagnetoSpeed (Series 5)",
    ...LOAD_223_77SMK,
    bulletDescription: "80gr Sierra MatchKing",
    bulletWeight: 80,
    device: "MagnetoSpeed",
    velocities: [3189, 3167, 3175, 3192, 3173, 3176, 3179, 3185, 3192, 3210],
    source: CHRONO_COMPARISON_SOURCE,
    sourceUrl: CHRONO_COMPARISON_URL,
    notes: "",
  }),

  // =========================================================================
  // 8. .223 Rem — MagnetoSpeed Series 16 (5 shots)
  // =========================================================================
  mkRef({
    id: "ammo-chrono-223-ms-s16",
    label: ".223 Rem 77gr SMK — MagnetoSpeed (Series 16)",
    ...LOAD_223_77SMK,
    device: "MagnetoSpeed",
    velocities: [2625, 2618, 2635, 2625, 2630],
    source: CHRONO_COMPARISON_SOURCE,
    sourceUrl: CHRONO_COMPARISON_URL,
    notes: "",
  }),

  // =========================================================================
  // 9. .223 Rem — MagnetoSpeed Series 17 (5 shots)
  // =========================================================================
  mkRef({
    id: "ammo-chrono-223-ms-s17",
    label: ".223 Rem 77gr SMK — MagnetoSpeed (Series 17)",
    ...LOAD_223_77SMK,
    device: "MagnetoSpeed",
    velocities: [2674, 2664, 2672, 2684, 2669],
    source: CHRONO_COMPARISON_SOURCE,
    sourceUrl: CHRONO_COMPARISON_URL,
    notes: "",
  }),

  // =========================================================================
  // 10. .223 Rem — MagnetoSpeed Series 18 (5 shots)
  // =========================================================================
  mkRef({
    id: "ammo-chrono-223-ms-s18",
    label: ".223 Rem 77gr SMK — MagnetoSpeed (Series 18)",
    ...LOAD_223_77SMK,
    device: "MagnetoSpeed",
    velocities: [2700, 2693, 2686, 2693, 2690],
    source: CHRONO_COMPARISON_SOURCE,
    sourceUrl: CHRONO_COMPARISON_URL,
    notes: "",
  }),

  // =========================================================================
  // 11. .223 Rem — MagnetoSpeed Series 19 (5 shots)
  // =========================================================================
  mkRef({
    id: "ammo-chrono-223-ms-s19",
    label: ".223 Rem 77gr SMK — MagnetoSpeed (Series 19)",
    ...LOAD_223_77SMK,
    device: "MagnetoSpeed",
    velocities: [2735, 2728, 2718, 2705, 2723],
    source: CHRONO_COMPARISON_SOURCE,
    sourceUrl: CHRONO_COMPARISON_URL,
    notes: "",
  }),

  // =========================================================================
  // 12. .223 Rem — MagnetoSpeed Series 21 (5 shots)
  // =========================================================================
  mkRef({
    id: "ammo-chrono-223-ms-s21",
    label: ".223 Rem 77gr SMK — MagnetoSpeed (Series 21)",
    ...LOAD_223_77SMK,
    device: "MagnetoSpeed",
    velocities: [2591, 2570, 2585, 2583, 2577],
    source: CHRONO_COMPARISON_SOURCE,
    sourceUrl: CHRONO_COMPARISON_URL,
    notes: "",
  }),

  // =========================================================================
  // 13. .223 Rem — MagnetoSpeed Series 22 (5 shots)
  // =========================================================================
  mkRef({
    id: "ammo-chrono-223-ms-s22",
    label: ".223 Rem 77gr SMK — MagnetoSpeed (Series 22)",
    ...LOAD_223_77SMK,
    device: "MagnetoSpeed",
    velocities: [2646, 2657, 2639, 2669, 2628],
    source: CHRONO_COMPARISON_SOURCE,
    sourceUrl: CHRONO_COMPARISON_URL,
    notes: "",
  }),

  // =========================================================================
  // 14. .223 Rem — MagnetoSpeed Series 23 (5 shots)
  // =========================================================================
  mkRef({
    id: "ammo-chrono-223-ms-s23",
    label: ".223 Rem 77gr SMK — MagnetoSpeed (Series 23)",
    ...LOAD_223_77SMK,
    device: "MagnetoSpeed",
    velocities: [2723, 2719, 2692, 2690, 2716],
    source: CHRONO_COMPARISON_SOURCE,
    sourceUrl: CHRONO_COMPARISON_URL,
    notes: "",
  }),

  // =========================================================================
  // 15. .223 Rem — MagnetoSpeed Series 24 (5 shots)
  // =========================================================================
  mkRef({
    id: "ammo-chrono-223-ms-s24",
    label: ".223 Rem 77gr SMK — MagnetoSpeed (Series 24)",
    ...LOAD_223_77SMK,
    device: "MagnetoSpeed",
    velocities: [2732, 2751, 2746, 2753, 2727],
    source: CHRONO_COMPARISON_SOURCE,
    sourceUrl: CHRONO_COMPARISON_URL,
    notes: "",
  }),

  // =========================================================================
  // 16. .223 Rem — MagnetoSpeed Series 25 (5 shots)
  // =========================================================================
  mkRef({
    id: "ammo-chrono-223-ms-s25",
    label: ".223 Rem 77gr SMK — MagnetoSpeed (Series 25)",
    ...LOAD_223_77SMK,
    device: "MagnetoSpeed",
    velocities: [2781, 2799, 2761, 2789, 2763],
    source: CHRONO_COMPARISON_SOURCE,
    sourceUrl: CHRONO_COMPARISON_URL,
    notes: "",
  }),

  // =========================================================================
  // 17. .223 Rem — MagnetoSpeed Series 26 (10 shots)
  // =========================================================================
  mkRef({
    id: "ammo-chrono-223-ms-s26",
    label: ".223 Rem 77gr SMK — MagnetoSpeed (Series 26)",
    ...LOAD_223_77SMK,
    device: "MagnetoSpeed",
    velocities: [2723, 2741, 2727, 2742, 2743, 2723, 2712, 2750, 2720, 2722],
    source: CHRONO_COMPARISON_SOURCE,
    sourceUrl: CHRONO_COMPARISON_URL,
    notes: "",
  }),

  // =========================================================================
  // 18. .223 Rem — MagnetoSpeed Series 28 (5 shots)
  // =========================================================================
  mkRef({
    id: "ammo-chrono-223-ms-s28",
    label: ".223 Rem 77gr SMK — MagnetoSpeed (Series 28)",
    ...LOAD_223_77SMK,
    device: "MagnetoSpeed",
    velocities: [2596, 2608, 2617, 2614, 2616],
    source: CHRONO_COMPARISON_SOURCE,
    sourceUrl: CHRONO_COMPARISON_URL,
    notes: "",
  }),

  // =========================================================================
  // 19. .223 Rem — MagnetoSpeed Series 29 (5 shots)
  // =========================================================================
  mkRef({
    id: "ammo-chrono-223-ms-s29",
    label: ".223 Rem 77gr SMK — MagnetoSpeed (Series 29)",
    ...LOAD_223_77SMK,
    device: "MagnetoSpeed",
    velocities: [2820, 2745, 2750, 2748, 2789],
    source: CHRONO_COMPARISON_SOURCE,
    sourceUrl: CHRONO_COMPARISON_URL,
    notes: "",
  }),

  // =========================================================================
  // 20. .223 Rem — MagnetoSpeed Series 31 (10 shots)
  // =========================================================================
  mkRef({
    id: "ammo-chrono-223-ms-s31",
    label: ".223 Rem 77gr SMK — MagnetoSpeed (Series 31)",
    ...LOAD_223_77SMK,
    device: "MagnetoSpeed",
    velocities: [2674, 2695, 2706, 2702, 2702, 2697, 2704, 2706, 2709, 2708],
    source: CHRONO_COMPARISON_SOURCE,
    sourceUrl: CHRONO_COMPARISON_URL,
    notes: "",
  }),

  // =========================================================================
  // 21. .223 Rem — MagnetoSpeed Series 32 (10 shots)
  // =========================================================================
  mkRef({
    id: "ammo-chrono-223-ms-s32",
    label: ".223 Rem 77gr SMK — MagnetoSpeed (Series 32)",
    ...LOAD_223_77SMK,
    device: "MagnetoSpeed",
    velocities: [2740, 2700, 2716, 2703, 2707, 2714, 2718, 2730, 2724, 2720],
    source: CHRONO_COMPARISON_SOURCE,
    sourceUrl: CHRONO_COMPARISON_URL,
    notes: "",
  }),

  // =========================================================================
  // 22. Bullet Sorting — 6.5 CM LabRadar SR0085 (cleaned)
  // =========================================================================
  mkRef({
    id: "ammo-bullet-65cm-lr-085",
    label: "6.5 CM 142gr SMK — LabRadar (Bullet Sorting Experiment)",
    ...LOAD_65CM_142SMK,
    device: "LabRadar",
    velocities: [
      2771, 2779, 2773, 2766, 2765, 2770, 2758, 2765, 2770, 2771, 2775, 2779,
      2775, 2769, 2775, 2768, 2765, 2766, 2771, 2774, 2782, 2772, 2774, 2783,
    ],
    source: BULLET_SORTING_SOURCE,
    sourceUrl: BULLET_SORTING_URL,
    notes: "LabRadar errors on shots 1,2,6,9,10 filtered out. Bullet weight listed as 180gr in LabRadar (likely wrong config) — actual load is 142gr SMK",
  }),

  // =========================================================================
  // 23. Bullet Sorting — 6.5 CM LabRadar SR0087 (3 shots)
  // =========================================================================
  mkRef({
    id: "ammo-bullet-65cm-lr-087",
    label: "6.5 CM 142gr SMK — LabRadar (Bullet Sorting, 3-shot group)",
    ...LOAD_65CM_142SMK,
    device: "LabRadar",
    velocities: [2761, 2762, 2758],
    source: BULLET_SORTING_SOURCE,
    sourceUrl: BULLET_SORTING_URL,
    notes: "Incredibly tight 3-shot group — ES 4.5 fps",
  }),

  // =========================================================================
  // 24. Bullet Sorting — 6.5 CM LabRadar SR0088 (4 shots)
  // =========================================================================
  mkRef({
    id: "ammo-bullet-65cm-lr-088",
    label: "6.5 CM 142gr SMK — LabRadar (Bullet Sorting, 4-shot group)",
    ...LOAD_65CM_142SMK,
    device: "LabRadar",
    velocities: [2782, 2773, 2766, 2784],
    source: BULLET_SORTING_SOURCE,
    sourceUrl: BULLET_SORTING_URL,
    notes: "4-shot follow-up group",
  }),

  // =========================================================================
  // 25. Brass Sorting — 6.5 CM MagnetoSpeed Feb 2020 (25 shots)
  // =========================================================================
  mkRef({
    id: "ammo-brass-65cm-ms-feb20",
    label: "6.5 CM 142gr SMK — MagnetoSpeed (Brass Sorting, Feb 2020)",
    ...LOAD_65CM_142SMK,
    device: "MagnetoSpeed",
    velocities: [
      2732, 2735, 2727, 2739, 2730, 2726, 2733, 2742, 2746, 2741, 2749, 2741,
      2738, 2744, 2743, 2732, 2737, 2727, 2735, 2724, 2737, 2733, 2757, 2740,
      2745,
    ],
    source: BRASS_SORTING_SOURCE,
    sourceUrl: BRASS_SORTING_URL,
    notes: "Microstamped brass, 600yd session, Feb 2020",
  }),

  // =========================================================================
  // 26. Brass Sorting — 6.5 CM MagnetoSpeed Feb 2020 Series 20 (24 shots)
  // =========================================================================
  mkRef({
    id: "ammo-brass-65cm-ms-feb20-s20",
    label: "6.5 CM 142gr SMK — MagnetoSpeed (Brass Sorting, Feb 2020, Series 20)",
    ...LOAD_65CM_142SMK,
    device: "MagnetoSpeed",
    velocities: [
      2723, 2732, 2740, 2725, 2735, 2736, 2733, 2725, 2730, 2729, 2728, 2734,
      2730, 2719, 2740, 2730, 2728, 2728, 2732, 2735, 2744, 2728, 2727, 2734,
    ],
    source: BRASS_SORTING_SOURCE,
    sourceUrl: BRASS_SORTING_URL,
    notes: "Second session same day — SD 5.6, excellent consistency",
  }),

  // =========================================================================
  // 27. Brass Sorting — 6.5 CM MagnetoSpeed May 2020 (25 shots)
  // =========================================================================
  mkRef({
    id: "ammo-brass-65cm-ms-may20",
    label: "6.5 CM 142gr SMK — MagnetoSpeed (Brass Sorting, May 2020)",
    ...LOAD_65CM_142SMK,
    device: "MagnetoSpeed",
    velocities: [
      2756, 2772, 2767, 2758, 2764, 2758, 2777, 2777, 2778, 2776, 2771, 2781,
      2770, 2765, 2765, 2757, 2777, 2770, 2770, 2772, 2768, 2776, 2774, 2763,
      2784,
    ],
    source: BRASS_SORTING_SOURCE,
    sourceUrl: BRASS_SORTING_URL,
    notes: "Microstamped brass, 600yd session, May 2020 — warmer conditions, ~30 fps higher than Feb",
  }),

  // =========================================================================
  // 28. Brass Sorting — 6.5 CM MagnetoSpeed May 2020 Series 22 (24 shots)
  // =========================================================================
  mkRef({
    id: "ammo-brass-65cm-ms-may20-s22",
    label: "6.5 CM 142gr SMK — MagnetoSpeed (Brass Sorting, May 2020, Series 22)",
    ...LOAD_65CM_142SMK,
    device: "MagnetoSpeed",
    velocities: [
      2772, 2767, 2779, 2782, 2776, 2783, 2789, 2789, 2783, 2769, 2781, 2791,
      2776, 2780, 2791, 2777, 2774, 2789, 2792, 2789, 2785, 2788, 2789, 2783,
    ],
    source: BRASS_SORTING_SOURCE,
    sourceUrl: BRASS_SORTING_URL,
    notes: "Second session same day, May 2020 — SD 7.2",
  }),

  // =========================================================================
  // 29. Recoil Experiment — preloaded bipod (10 shots)
  // =========================================================================
  mkRef({
    id: "ammo-recoil-65cm-preload",
    label: "6.5 CM 142gr SMK — MagnetoSpeed (Recoil Exp, Preloaded Bipod)",
    ...LOAD_65CM_142SMK,
    chargeWeight: 41.6,
    brass: "Lapua",
    device: "MagnetoSpeed",
    velocities: [2768, 2740, 2774, 2787, 2788, 2776, 2791, 2777, 2781, 2737],
    source: RECOIL_SOURCE,
    sourceUrl: RECOIL_URL,
    notes: "Preloaded bipod technique, 41.6gr H4350 (slightly higher charge than other experiments)",
  }),

  // =========================================================================
  // 30. Recoil Experiment — free recoil (10 shots)
  // =========================================================================
  mkRef({
    id: "ammo-recoil-65cm-freerecoil",
    label: "6.5 CM 142gr SMK — MagnetoSpeed (Recoil Exp, Free Recoil)",
    ...LOAD_65CM_142SMK,
    chargeWeight: 41.6,
    brass: "Lapua",
    device: "MagnetoSpeed",
    velocities: [2767, 2777, 2778, 2773, 2769, 2778, 2781, 2775, 2780, 2789],
    source: RECOIL_SOURCE,
    sourceUrl: RECOIL_URL,
    notes: "Free recoil technique — tighter SD than preloaded bipod (6.2 vs 18.9)",
  }),
];

// ---------------------------------------------------------------------------
// Barrel-length reference data
// ---------------------------------------------------------------------------

const BARREL_65CM_120AMAX_RAW = [
  { barrelLength: 27, avgVelocity: 2961 },
  { barrelLength: 26, avgVelocity: 2939 },
  { barrelLength: 25, avgVelocity: 2917 },
  { barrelLength: 24, avgVelocity: 2896 },
  { barrelLength: 23, avgVelocity: 2874 },
  { barrelLength: 22, avgVelocity: 2852 },
  { barrelLength: 21, avgVelocity: 2831 },
  { barrelLength: 20, avgVelocity: 2809 },
  { barrelLength: 19, avgVelocity: 2787 },
  { barrelLength: 18, avgVelocity: 2766 },
  { barrelLength: 17, avgVelocity: 2744 },
  { barrelLength: 16, avgVelocity: 2723 },
];

const BARREL_65CM_142SMK_RAW = [
  { barrelLength: 27, avgVelocity: 2663 },
  { barrelLength: 26, avgVelocity: 2677 },
  { barrelLength: 25, avgVelocity: 2680 },
  { barrelLength: 24, avgVelocity: 2683 },
  { barrelLength: 23, avgVelocity: 2669 },
  { barrelLength: 22, avgVelocity: 2654 },
  { barrelLength: 21, avgVelocity: 2640 },
  { barrelLength: 20, avgVelocity: 2625 },
  { barrelLength: 19, avgVelocity: 2611 },
  { barrelLength: 18, avgVelocity: 2596 },
  { barrelLength: 17, avgVelocity: 2582 },
  { barrelLength: 16, avgVelocity: 2505 },
];

export const BARREL_LENGTH_REFERENCES: BarrelLengthReference[] = [
  {
    cartridgeShortName: "6.5 CM",
    bulletDescription: "120gr Hornady A-MAX",
    loadDescription: "Factory Hornady Match 120gr A-MAX",
    device: "MagnetoSpeed V3",
    source: "Rifleshooter.com",
    sourceUrl:
      "https://rifleshooter.com/2016/02/6-5-creedmoor-effect-of-barrel-length-on-velocity-cutting-up-a-creedmoor/",
    data: computeFpsPerInchLoss(BARREL_65CM_120AMAX_RAW),
  },
  {
    cartridgeShortName: "6.5 CM",
    bulletDescription: "142gr Sierra MatchKing HPBT",
    loadDescription:
      "142gr Sierra MatchKing HPBT, 41.8gr H4350, CCI #200, Hornady brass",
    device: "MagnetoSpeed V3",
    source: "Rifleshooter.com",
    sourceUrl:
      "https://rifleshooter.com/2016/02/6-5-creedmoor-effect-of-barrel-length-on-velocity-cutting-up-a-creedmoor/",
    data: computeFpsPerInchLoss(BARREL_65CM_142SMK_RAW),
  },
];

// ---------------------------------------------------------------------------
// Dataset summary (computed at module load)
// ---------------------------------------------------------------------------

export const SEED_DATA_SUMMARY = {
  totalRecords: CHRONO_REFERENCES.length,
  totalShots: CHRONO_REFERENCES.reduce((sum, r) => sum + r.velocities.length, 0),
  cartridges: [...new Set(CHRONO_REFERENCES.map(r => r.cartridgeShortName))],
  devices: [...new Set(CHRONO_REFERENCES.map(r => r.device))],
};
