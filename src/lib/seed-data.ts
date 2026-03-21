/**
 * Curated, real-world chronograph reference data for BulletForge ballistics simulator.
 *
 * Primary source: Ammolytics chronograph comparison experiment
 *   https://github.com/ammolytics/experiments/tree/master/chronograph-comparison
 *
 * Barrel-length data: Rifleshooter.com cut-down tests
 *   https://rifleshooter.com/2016/02/6-5-creedmoor-effect-of-barrel-length-on-velocity-cutting-up-a-creedmoor/
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
// Raw velocity strings
// ---------------------------------------------------------------------------

const V_65CM_142SMK_LABRADAR = [
  2755, 2753, 2754, 2751, 2762, 2755, 2751, 2758, 2765, 2754, 2775, 2753,
  2764, 2749, 2758, 2748, 2753, 2764, 2742, 2761, 2754, 2756, 2755,
];

const V_65CM_142SMK_MAGNETOSPEED = [
  2720, 2721, 2715, 2718, 2726, 2715, 2694, 2712, 2716, 2716, 2717, 2714,
  2708, 2722, 2713, 2726, 2721, 2718, 2709, 2713, 2711, 2707, 2709, 2700,
  2712, 2714, 2724, 2724, 2715, 2724,
];

const V_223_77SMK_S1 = [2725, 2769, 2808, 2792, 2782, 2778, 2786, 2772, 2765, 2775];

const V_223_77SMK_S2 = [2750, 2703, 2706, 2736, 2737, 2739, 2732, 2732, 2745, 2717];

const V_223_77TMK_S3 = [2800, 2793, 2810, 2791, 2762, 2802, 2805, 2804, 2795, 2804, 2820];

const V_223_80SMK_S5 = [3189, 3167, 3175, 3192, 3173, 3176, 3179, 3185, 3192, 3210];

// ---------------------------------------------------------------------------
// Chronograph reference data
// ---------------------------------------------------------------------------

export const CHRONO_REFERENCES: ChronoReference[] = [
  {
    id: "ammolytics-65cm-142smk-labradar",
    label: "6.5 CM — 142gr SMK / 41.5gr H4350 (LabRadar)",
    cartridgeShortName: "6.5 CM",
    bulletDescription: "142gr Sierra MatchKing HPBT",
    bulletWeight: 142,
    powderName: "H4350",
    chargeWeight: 41.5,
    primer: "CCI BR-4",
    brass: "Peterson",
    barrelLength: 24,
    device: "LabRadar",
    velocities: V_65CM_142SMK_LABRADAR,
    avgVelocity: avg(V_65CM_142SMK_LABRADAR),
    es: es(V_65CM_142SMK_LABRADAR),
    sd: sd(V_65CM_142SMK_LABRADAR),
    source: "Ammolytics Chronograph Comparison",
    sourceUrl:
      "https://github.com/ammolytics/experiments/tree/master/chronograph-comparison",
    notes: "Bartlein 1:8\" twist barrel",
  },
  {
    id: "ammolytics-65cm-142smk-magnetospeed",
    label: "6.5 CM — 142gr SMK / 41.5gr H4350 (MagnetoSpeed)",
    cartridgeShortName: "6.5 CM",
    bulletDescription: "142gr Sierra MatchKing HPBT",
    bulletWeight: 142,
    powderName: "H4350",
    chargeWeight: 41.5,
    primer: "CCI BR-4",
    brass: "Peterson",
    barrelLength: 24,
    device: "MagnetoSpeed",
    velocities: V_65CM_142SMK_MAGNETOSPEED,
    avgVelocity: avg(V_65CM_142SMK_MAGNETOSPEED),
    es: es(V_65CM_142SMK_MAGNETOSPEED),
    sd: sd(V_65CM_142SMK_MAGNETOSPEED),
    source: "Ammolytics Chronograph Comparison",
    sourceUrl:
      "https://github.com/ammolytics/experiments/tree/master/chronograph-comparison",
    notes:
      "Same load as LabRadar entry — MagnetoSpeed reads ~41 fps lower (barrel-mounted device deflects barrel)",
  },
  {
    id: "ammolytics-223-77smk-magnetospeed-s1",
    label: ".223 Rem — 77gr SMK / Varget (MagnetoSpeed Series 1)",
    cartridgeShortName: ".223 Rem",
    bulletDescription: "77gr Sierra MatchKing",
    bulletWeight: 77,
    powderName: "Varget",
    chargeWeight: 24,
    primer: "CCI #41",
    brass: "Lapua",
    barrelLength: 20,
    device: "MagnetoSpeed",
    velocities: V_223_77SMK_S1,
    avgVelocity: avg(V_223_77SMK_S1),
    es: es(V_223_77SMK_S1),
    sd: sd(V_223_77SMK_S1),
    source: "Ammolytics Chronograph Comparison",
    sourceUrl:
      "https://github.com/ammolytics/experiments/tree/master/chronograph-comparison",
    notes: "Charge weight estimated at 24gr (not published)",
  },
  {
    id: "ammolytics-223-77smk-magnetospeed-s2",
    label: ".223 Rem — 77gr SMK / Varget (MagnetoSpeed Series 2)",
    cartridgeShortName: ".223 Rem",
    bulletDescription: "77gr Sierra MatchKing",
    bulletWeight: 77,
    powderName: "Varget",
    chargeWeight: 24,
    primer: "CCI #41",
    brass: "Lapua",
    barrelLength: 20,
    device: "MagnetoSpeed",
    velocities: V_223_77SMK_S2,
    avgVelocity: avg(V_223_77SMK_S2),
    es: es(V_223_77SMK_S2),
    sd: sd(V_223_77SMK_S2),
    source: "Ammolytics Chronograph Comparison",
    sourceUrl:
      "https://github.com/ammolytics/experiments/tree/master/chronograph-comparison",
    notes: "Same setup as Series 1, different shot string",
  },
  {
    id: "ammolytics-223-77tmk-magnetospeed-s3",
    label: ".223 Rem — 77gr TMK / Varget (MagnetoSpeed Series 3)",
    cartridgeShortName: ".223 Rem",
    bulletDescription: "77gr Sierra Tipped MatchKing",
    bulletWeight: 77,
    powderName: "Varget",
    chargeWeight: 24,
    primer: "CCI #41",
    brass: "Lapua",
    barrelLength: 20,
    device: "MagnetoSpeed",
    velocities: V_223_77TMK_S3,
    avgVelocity: avg(V_223_77TMK_S3),
    es: es(V_223_77TMK_S3),
    sd: sd(V_223_77TMK_S3),
    source: "Ammolytics Chronograph Comparison",
    sourceUrl:
      "https://github.com/ammolytics/experiments/tree/master/chronograph-comparison",
    notes: "Tipped MatchKing variant",
  },
  {
    id: "ammolytics-223-80smk-magnetospeed-s5",
    label: ".223 Rem — 80gr SMK / Varget (MagnetoSpeed Series 5)",
    cartridgeShortName: ".223 Rem",
    bulletDescription: "80gr Sierra MatchKing",
    bulletWeight: 80,
    powderName: "Varget",
    chargeWeight: 24,
    primer: "CCI #41",
    brass: "Lapua",
    barrelLength: 20,
    device: "MagnetoSpeed",
    velocities: V_223_80SMK_S5,
    avgVelocity: avg(V_223_80SMK_S5),
    es: es(V_223_80SMK_S5),
    sd: sd(V_223_80SMK_S5),
    source: "Ammolytics Chronograph Comparison",
    sourceUrl:
      "https://github.com/ammolytics/experiments/tree/master/chronograph-comparison",
    notes:
      "Higher velocity than 77gr loads — lighter projectile or different charge",
  },
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
