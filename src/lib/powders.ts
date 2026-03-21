/**
 * Powder burn rate database
 * Burn rate values are relative (1 = fastest, 200 = slowest)
 */

export type PowderType = "rifle" | "pistol" | "shotgun";
export type TemperatureSensitivity = "low" | "medium" | "high";

export interface Powder {
  name: string;
  manufacturer: string;
  burnRate: number;
  type: PowderType;
  temperatureSensitivity: TemperatureSensitivity;
  description: string;
}

export const POWDERS: Powder[] = [
  // Hodgdon
  {
    name: "H110",
    manufacturer: "Hodgdon",
    burnRate: 28,
    type: "pistol",
    temperatureSensitivity: "medium",
    description: "Spherical magnum pistol/small rifle powder. Standard for .300 Blackout subsonic.",
  },
  {
    name: "H335",
    manufacturer: "Hodgdon",
    burnRate: 70,
    type: "rifle",
    temperatureSensitivity: "medium",
    description: "Spherical powder, military spec, ideal for .223 Rem and 5.56 NATO loads.",
  },
  {
    name: "BL-C(2)",
    manufacturer: "Hodgdon",
    burnRate: 73,
    type: "rifle",
    temperatureSensitivity: "medium",
    description: "Spherical military surplus type powder. Excellent for .223 Rem and .308 Win.",
  },
  {
    name: "CFE 223",
    manufacturer: "Hodgdon",
    burnRate: 75,
    type: "rifle",
    temperatureSensitivity: "low",
    description: "Copper Fouling Eraser technology. Outstanding in .223 Rem and many other cartridges.",
  },
  {
    name: "Varget",
    manufacturer: "Hodgdon",
    burnRate: 82,
    type: "rifle",
    temperatureSensitivity: "low",
    description: "Extreme extruded powder. Insensitive to temperature. Top choice for .308 Win and .223 Rem precision.",
  },
  {
    name: "H4350",
    manufacturer: "Hodgdon",
    burnRate: 95,
    type: "rifle",
    temperatureSensitivity: "low",
    description: "Extreme extruded powder. The #1 choice for 6.5 Creedmoor. Temperature insensitive.",
  },
  {
    name: "H4831",
    manufacturer: "Hodgdon",
    burnRate: 105,
    type: "rifle",
    temperatureSensitivity: "low",
    description: "Extreme extruded powder. Excellent for medium overbore magnums like .270 Win.",
  },
  {
    name: "H1000",
    manufacturer: "Hodgdon",
    burnRate: 118,
    type: "rifle",
    temperatureSensitivity: "low",
    description: "Extreme extruded slow-burning powder. Ideal for heavy bullets in overbore magnums.",
  },
  {
    name: "Retumbo",
    manufacturer: "Hodgdon",
    burnRate: 125,
    type: "rifle",
    temperatureSensitivity: "low",
    description: "Very slow burning, temperature insensitive. Top choice for .300 Win Mag and .338 Lapua.",
  },

  // Alliant
  {
    name: "Power Pro 2000-MR",
    manufacturer: "Alliant",
    burnRate: 85,
    type: "rifle",
    temperatureSensitivity: "low",
    description: "Medium-rate spherical powder. Clean burning, excellent metering for progressive presses.",
  },
  {
    name: "Reloder 16",
    manufacturer: "Alliant",
    burnRate: 92,
    type: "rifle",
    temperatureSensitivity: "low",
    description: "Temperature insensitive extruded powder. Excellent for 6.5 Creedmoor and .260 Rem.",
  },
  {
    name: "Reloder 22",
    manufacturer: "Alliant",
    burnRate: 110,
    type: "rifle",
    temperatureSensitivity: "medium",
    description: "Slow-burning magnum powder. Popular for 7mm Rem Mag and .300 Win Mag.",
  },
  {
    name: "Reloder 26",
    manufacturer: "Alliant",
    burnRate: 120,
    type: "rifle",
    temperatureSensitivity: "low",
    description: "ELD-Temperature technology. Excellent for 6.5 PRC, 7mm Rem Mag with heavy bullets.",
  },

  // Vihtavuori
  {
    name: "N140",
    manufacturer: "Vihtavuori",
    burnRate: 78,
    type: "rifle",
    temperatureSensitivity: "low",
    description: "Benchrest-grade extruded powder. Extremely consistent. Ideal for .223 Rem and .308 Win.",
  },
  {
    name: "N150",
    manufacturer: "Vihtavuori",
    burnRate: 88,
    type: "rifle",
    temperatureSensitivity: "low",
    description: "Versatile medium-burn extruded powder. Excellent for .308 Win and 6.5 Creedmoor.",
  },
  {
    name: "N160",
    manufacturer: "Vihtavuori",
    burnRate: 100,
    type: "rifle",
    temperatureSensitivity: "low",
    description: "Slow-burning extruded powder. Great for .270 Win, .30-06, and similar cartridges.",
  },
  {
    name: "N165",
    manufacturer: "Vihtavuori",
    burnRate: 108,
    type: "rifle",
    temperatureSensitivity: "low",
    description: "Slow-burning for magnum cartridges. Top performer in 7mm Rem Mag.",
  },
  {
    name: "N550",
    manufacturer: "Vihtavuori",
    burnRate: 93,
    type: "rifle",
    temperatureSensitivity: "low",
    description: "High-energy density extruded. The go-to powder for 6.5 Creedmoor in competition.",
  },
  {
    name: "N570",
    manufacturer: "Vihtavuori",
    burnRate: 122,
    type: "rifle",
    temperatureSensitivity: "low",
    description: "Very slow burning, high energy. Designed for large overbore magnums with heavy bullets.",
  },

  // IMR
  {
    name: "IMR 4064",
    manufacturer: "IMR",
    burnRate: 80,
    type: "rifle",
    temperatureSensitivity: "medium",
    description: "Classic extruded powder. Versatile for .223 Rem through .30-06. The original benchrest powder.",
  },
  {
    name: "IMR 4166",
    manufacturer: "IMR",
    burnRate: 84,
    type: "rifle",
    temperatureSensitivity: "low",
    description: "Enduron temperature insensitive. Copper fouling deterrent. Modern replacement for 4064.",
  },
  {
    name: "IMR 4350",
    manufacturer: "IMR",
    burnRate: 96,
    type: "rifle",
    temperatureSensitivity: "medium",
    description: "Classic medium-slow extruded powder. Outstanding in .243 Win and .270 Win.",
  },
  {
    name: "IMR 4831",
    manufacturer: "IMR",
    burnRate: 107,
    type: "rifle",
    temperatureSensitivity: "medium",
    description: "Slow-burning classic. Popular for .25-06, .270 Win, and .30-06 with heavy bullets.",
  },
  {
    name: "IMR 7828",
    manufacturer: "IMR",
    burnRate: 115,
    type: "rifle",
    temperatureSensitivity: "high",
    description: "Very slow burning extruded. Excellent for large magnums: .300 Win Mag, .338 Lapua.",
  },
];

/**
 * Get powders sorted by burn rate (fastest to slowest)
 */
export function powdersByBurnRate(): Powder[] {
  return [...POWDERS].sort((a, b) => a.burnRate - b.burnRate);
}

/**
 * Get powders by manufacturer
 */
export function powdersByManufacturer(manufacturer: string): Powder[] {
  return POWDERS.filter((p) => p.manufacturer === manufacturer);
}

// ─── Component Substitution ────────────────────────────────────

export interface PowderSubstitution {
  powder: Powder;
  /** Overall similarity score (0-100, higher is better) */
  score: number;
  /** Burn rate proximity score (0-100) */
  burnRateScore: number;
  /** Temperature sensitivity match score (0-100) */
  tempScore: number;
  /** Burn rate difference (absolute) */
  burnRateDelta: number;
  /** Human-readable assessment */
  assessment: string;
}

/**
 * Find similar powders that could substitute for the given powder.
 * Scores by burn rate proximity (70%) and temperature sensitivity match (30%).
 * Returns up to `limit` results sorted by score, excluding the input powder.
 */
export function findSimilarPowders(
  currentPowder: string,
  limit: number = 5,
): PowderSubstitution[] {
  const current = POWDERS.find((p) => p.name === currentPowder);
  if (!current) return [];

  const tempMap: Record<TemperatureSensitivity, number> = {
    low: 0,
    medium: 1,
    high: 2,
  };

  return POWDERS
    .filter((p) => p.name !== currentPowder && p.type === current.type)
    .map((p) => {
      // Burn rate proximity: perfect match = 100, 30+ difference = 0
      const burnRateDelta = Math.abs(p.burnRate - current.burnRate);
      const burnRateScore = Math.max(0, 100 - (burnRateDelta / 30) * 100);

      // Temperature sensitivity: same = 100, 1 step off = 50, 2 steps = 0
      const tempDelta = Math.abs(tempMap[p.temperatureSensitivity] - tempMap[current.temperatureSensitivity]);
      const tempScore = tempDelta === 0 ? 100 : tempDelta === 1 ? 50 : 0;

      // Weighted: 70% burn rate, 30% temp sensitivity
      const score = Math.round(burnRateScore * 0.7 + tempScore * 0.3);

      // Assessment
      let assessment: string;
      if (score >= 85) assessment = "Excellent substitute — very similar burn rate and characteristics";
      else if (score >= 65) assessment = "Good substitute — close burn rate, may need minor charge adjustment";
      else if (score >= 45) assessment = "Possible substitute — noticeable burn rate difference, work up carefully";
      else assessment = "Poor match — significant differences, treat as a new load development";

      return { powder: p, score, burnRateScore: Math.round(burnRateScore), tempScore, burnRateDelta, assessment };
    })
    .filter((s) => s.score >= 30)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

// ─── Barrel Life Estimation ────────────────────────────────────

/**
 * Empirical barrel life estimates based on cartridge characteristics.
 * Uses overbore ratio (case capacity / bore area) and cartridge category.
 * These are conservative estimates for match-grade accuracy standards.
 *
 * Reference data from competitive shooters and barrel makers (Krieger, Bartlein).
 */
const BARREL_LIFE_TABLE: Record<string, number> = {
  ".22 LR":        50000,   // Rimfire, minimal throat erosion
  ".223 Rem":       5000,   // Moderate overbore, fast powders
  "6mm ARC":        3000,   // High-performance 6mm, fast erosion
  ".243 Win":       3000,   // Hot 6mm, notorious barrel burner
  "6.5 CM":         3000,   // Moderate overbore, good barrel life
  "6.5 PRC":        2000,   // Short-action magnum, more powder
  ".270 Win":       3000,   // Classic, moderate barrel life
  "7mm Rem Mag":    2000,   // Magnum, heavier erosion
  ".308 Win":       5000,   // Efficient case, excellent barrel life
  ".30-06":         4000,   // Classic, good barrel life
  ".300 Win Mag":   2000,   // Hot .30 cal magnum
  ".300 PRC":       1500,   // Very hot .30 cal
  ".338 Lapua":     2500,   // Large bore, moderate overbore
  ".375 H&H":      3000,   // Large bore, efficient case
  ".50 BMG":        5000,   // Massive bore, thick barrel
};

/**
 * Estimate barrel life for a given cartridge.
 * Returns estimated round count for match-grade accuracy (sub-MOA).
 * Hunting accuracy (1.5 MOA) typically lasts 50-100% longer.
 */
export function estimateBarrelLife(cartridgeShortName: string): number {
  return BARREL_LIFE_TABLE[cartridgeShortName] ?? 3000;
}

/**
 * Get barrel condition assessment based on round count vs estimated life.
 */
export function barrelCondition(
  roundCount: number,
  estimatedLife: number,
): { percent: number; rating: string; color: string } {
  const percent = Math.round((roundCount / estimatedLife) * 100);
  if (percent < 50) return { percent, rating: "New", color: "var(--c-success)" };
  if (percent < 75) return { percent, rating: "Good", color: "var(--c-success)" };
  if (percent < 90) return { percent, rating: "Worn", color: "var(--c-warn)" };
  if (percent < 100) return { percent, rating: "End of life", color: "var(--c-error, #e55)" };
  return { percent, rating: "Past life", color: "var(--c-error, #e55)" };
}
