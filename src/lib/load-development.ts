/**
 * BulletForge Load Development Tools
 *
 * Comprehensive library for handloading load development workflows:
 * - Ladder test planning with predicted velocities/pressures
 * - ES/SD analysis and velocity node detection
 * - Seating depth test planning
 * - OCW (Optimal Charge Weight) analysis
 * - Load recipe and range session management
 * - Common primer database
 *
 * All functions are pure (no side effects) except the create* functions
 * that generate unique IDs and timestamps.
 *
 * WARNING: This is a SIMULATOR for educational and comparative purposes
 * only. Always consult published load data from reputable sources and
 * work up loads carefully from minimum starting charges.
 */

import {
  simulateInternal,
  buildConfig,
  CARTRIDGE_INTERNAL_DATA,
  POWDER_INTERNAL_DATA,
} from "./internal-ballistics";

// ---------------------------------------------------------------------------
// Unique ID generation
// ---------------------------------------------------------------------------

/**
 * Generate a unique identifier. Uses `crypto.randomUUID()` when available,
 * otherwise falls back to a simple timestamp + random string.
 */
function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 10);
  return `${ts}-${rand}`;
}

// ---------------------------------------------------------------------------
// 1. Ladder Test Planner
// ---------------------------------------------------------------------------

/** A single step (charge weight) in a ladder test plan. */
export interface LadderStep {
  /** Step number (1-based) */
  stepNumber: number;
  /** Powder charge weight in grains */
  chargeWeight: number;
  /** Predicted muzzle velocity in fps (from internal ballistics sim) */
  predictedVelocity: number;
  /** Predicted peak chamber pressure in psi */
  predictedPressure: number;
  /** Peak pressure as a percentage of SAAMI maximum average pressure */
  saamiPercent: number;
  /** Whether this step exceeds SAAMI maximum pressure */
  overPressure: boolean;
}

/** Complete ladder test plan with all charge steps and round counts. */
export interface LadderTestPlan {
  /** Individual charge weight steps */
  steps: LadderStep[];
  /** Total number of rounds needed */
  totalRounds: number;
  /** Rounds fired at each charge weight */
  roundsPerStep: number;
  /** Starting charge weight in grains */
  startCharge: number;
  /** Maximum charge weight in grains */
  maxCharge: number;
  /** Charge weight increment between steps in grains */
  chargeIncrement: number;
}

/** Options for generating a ladder test plan. */
export interface LadderTestOptions {
  /** Starting charge weight in grains. Defaults to cartridge typicalChargeRange.min */
  startCharge?: number;
  /** Maximum charge weight in grains. Defaults to cartridge typicalChargeRange.max */
  maxCharge?: number;
  /** Charge weight increment between steps in grains. Default: 0.3 */
  increment?: number;
  /** Number of rounds to fire at each charge weight. Default: 3 */
  roundsPerStep?: number;
}

/**
 * Generate a ladder test plan for a given cartridge, powder, and bullet combination.
 *
 * Runs the internal ballistics simulation at each charge step to predict
 * muzzle velocity and peak chamber pressure. Steps that exceed SAAMI maximum
 * average pressure are flagged.
 *
 * @param cartridgeShortName - Cartridge identifier, e.g. "6.5 CM", ".308 Win"
 * @param powderName - Powder name, e.g. "H4350", "Varget"
 * @param bulletWeight - Bullet weight in grains
 * @param bulletDiameter - Bullet diameter in inches
 * @param barrelLength - Barrel length in inches
 * @param options - Optional overrides for charge range, increment, and round count
 * @returns The complete ladder test plan, or null if cartridge/powder not found
 */
export function generateLadderTest(
  cartridgeShortName: string,
  powderName: string,
  bulletWeight: number,
  bulletDiameter: number,
  barrelLength: number,
  options?: LadderTestOptions,
): LadderTestPlan | null {
  const cartridgeData = CARTRIDGE_INTERNAL_DATA[cartridgeShortName];
  const powderData = POWDER_INTERNAL_DATA[powderName];
  if (!cartridgeData || !powderData) {
    return null;
  }

  const increment = options?.increment ?? 0.3;
  const roundsPerStep = options?.roundsPerStep ?? 3;
  const startCharge = options?.startCharge ?? cartridgeData.typicalChargeRange.min;
  const maxCharge = options?.maxCharge ?? cartridgeData.typicalChargeRange.max;

  const steps: LadderStep[] = [];
  let stepNumber = 1;

  for (let charge = startCharge; charge <= maxCharge + 1e-9; charge += increment) {
    const roundedCharge = Math.round(charge * 100) / 100;

    const config = buildConfig(
      cartridgeShortName,
      powderName,
      roundedCharge,
      bulletWeight,
      bulletDiameter,
      barrelLength,
    );

    if (!config) {
      return null;
    }

    const result = simulateInternal(config);
    const saamiPercent = (result.peakPressure / config.saamiMaxPressure) * 100;

    steps.push({
      stepNumber,
      chargeWeight: roundedCharge,
      predictedVelocity: Math.round(result.muzzleVelocity * 10) / 10,
      predictedPressure: Math.round(result.peakPressure),
      saamiPercent: Math.round(saamiPercent * 10) / 10,
      overPressure: result.peakPressure > config.saamiMaxPressure,
    });

    stepNumber++;
  }

  return {
    steps,
    totalRounds: steps.length * roundsPerStep,
    roundsPerStep,
    startCharge,
    maxCharge,
    chargeIncrement: increment,
  };
}

// ---------------------------------------------------------------------------
// 2. ES/SD Calculator
// ---------------------------------------------------------------------------

/** Statistical analysis of a chronograph shot string. */
export interface ShotString {
  /** Raw velocity readings in fps */
  velocities: number[];
  /** Arithmetic mean velocity in fps */
  average: number;
  /** Extreme spread (max - min) in fps */
  extremeSpread: number;
  /** Sample standard deviation in fps */
  standardDeviation: number;
  /** Median velocity in fps */
  median: number;
  /** Number of shots */
  count: number;
}

/**
 * Analyze a chronograph shot string, computing average velocity,
 * extreme spread, standard deviation, median, and shot count.
 *
 * @param velocities - Array of velocity readings in fps
 * @returns Complete shot string statistics
 */
export function analyzeShotString(velocities: number[]): ShotString {
  const count = velocities.length;

  if (count === 0) {
    return {
      velocities: [],
      average: 0,
      extremeSpread: 0,
      standardDeviation: 0,
      median: 0,
      count: 0,
    };
  }

  if (count === 1) {
    return {
      velocities: [...velocities],
      average: velocities[0],
      extremeSpread: 0,
      standardDeviation: 0,
      median: velocities[0],
      count: 1,
    };
  }

  const sum = velocities.reduce((a, b) => a + b, 0);
  const average = sum / count;

  const sorted = [...velocities].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[count - 1];
  const extremeSpread = max - min;

  // Median
  const mid = Math.floor(count / 2);
  const median = count % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];

  // Sample standard deviation (Bessel's correction: N-1)
  const sumSquaredDiff = velocities.reduce((acc, v) => acc + (v - average) ** 2, 0);
  const standardDeviation = Math.sqrt(sumSquaredDiff / (count - 1));

  return {
    velocities: [...velocities],
    average: Math.round(average * 10) / 10,
    extremeSpread: Math.round(extremeSpread * 10) / 10,
    standardDeviation: Math.round(standardDeviation * 10) / 10,
    median: Math.round(median * 10) / 10,
    count,
  };
}

/** A detected velocity node (plateau) in the charge-vs-velocity curve. */
export interface VelocityNode {
  /** Charge weight at the center of the plateau in grains */
  chargeWeight: number;
  /** Average velocity at the node in fps */
  velocity: number;
  /** Width of the plateau in grains */
  plateauWidth: number;
  /** Velocity sensitivity in fps/grain — lower is better */
  sensitivity: number;
}

/**
 * Detect velocity nodes (plateaus) in a charge-vs-velocity data set.
 *
 * A velocity node is a flat spot where velocity changes less than a
 * threshold per grain of charge increase. These are desirable because
 * they indicate charge weights that are insensitive to small charge
 * weight variations, producing more consistent velocities.
 *
 * @param chargeVelocities - Array of { charge, avgVelocity } data points, sorted by charge
 * @param sensitivityThreshold - Max fps/grain to qualify as a node. Default: 15
 * @returns Array of detected velocity nodes
 */
export function velocityNodeDetection(
  chargeVelocities: Array<{ charge: number; avgVelocity: number }>,
  sensitivityThreshold: number = 15,
): VelocityNode[] {
  if (chargeVelocities.length < 3) {
    return [];
  }

  // Sort by charge weight
  const sorted = [...chargeVelocities].sort((a, b) => a.charge - b.charge);

  // Compute local sensitivity (fps/grain) for each adjacent pair
  const sensitivities: Array<{ charge: number; velocity: number; sensitivity: number }> = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const dCharge = sorted[i + 1].charge - sorted[i].charge;
    if (dCharge <= 0) continue;
    const dVel = Math.abs(sorted[i + 1].avgVelocity - sorted[i].avgVelocity);
    const sensitivity = dVel / dCharge;
    const midCharge = (sorted[i].charge + sorted[i + 1].charge) / 2;
    const midVel = (sorted[i].avgVelocity + sorted[i + 1].avgVelocity) / 2;
    sensitivities.push({ charge: midCharge, velocity: midVel, sensitivity });
  }

  // Find contiguous regions below threshold
  const nodes: VelocityNode[] = [];
  let i = 0;
  while (i < sensitivities.length) {
    if (sensitivities[i].sensitivity <= sensitivityThreshold) {
      // Start of a plateau
      const startIdx = i;
      let sumCharge = 0;
      let sumVel = 0;
      let sumSens = 0;
      let count = 0;

      while (i < sensitivities.length && sensitivities[i].sensitivity <= sensitivityThreshold) {
        sumCharge += sensitivities[i].charge;
        sumVel += sensitivities[i].velocity;
        sumSens += sensitivities[i].sensitivity;
        count++;
        i++;
      }

      // Determine plateau width from the original sorted data points
      // that contributed to the low-sensitivity region
      const firstOrigIdx = startIdx;
      const lastOrigIdx = Math.min(startIdx + count, sorted.length - 1);
      const plateauWidth = sorted[lastOrigIdx].charge - sorted[firstOrigIdx].charge;

      nodes.push({
        chargeWeight: Math.round((sumCharge / count) * 100) / 100,
        velocity: Math.round((sumVel / count) * 10) / 10,
        plateauWidth: Math.round(plateauWidth * 100) / 100,
        sensitivity: Math.round((sumSens / count) * 10) / 10,
      });
    } else {
      i++;
    }
  }

  return nodes;
}

// ---------------------------------------------------------------------------
// 3. Seating Depth Tools
// ---------------------------------------------------------------------------

/** A single step in a seating depth test plan. */
export interface SeatingStep {
  /** Distance off the lands (jump) in inches */
  jumpDistance: number;
  /** Resulting overall cartridge length in inches */
  oal: number;
  /** Human-readable label, e.g. '0.020" off' */
  label: string;
}

/** Complete seating depth test plan. */
export interface SeatingDepthPlan {
  /** Individual seating depth steps */
  steps: SeatingStep[];
  /** Overall length when the bullet contacts the lands (jam length) */
  baseOAL: number;
  /** Total number of rounds needed */
  totalRounds: number;
}

/** Options for generating a seating depth test plan. */
export interface SeatingDepthTestOptions {
  /** Jump distances to test in inches. Default: [0, 0.010, 0.020, 0.030, 0.040, 0.060, 0.080, 0.100] */
  jumps?: number[];
  /** Rounds to fire at each seating depth. Default: 3 */
  roundsPerStep?: number;
}

/**
 * Generate a seating depth test plan starting from the base OAL (jam length).
 *
 * Each step backs the bullet off the lands by the specified jump distance,
 * producing a shorter OAL. The plan includes labels for easy identification
 * at the loading bench.
 *
 * @param baseOAL - Overall length in inches when the bullet just contacts the lands (jam)
 * @param options - Optional jump distances and round count
 * @returns The complete seating depth test plan
 */
export function generateSeatingDepthTest(
  baseOAL: number,
  options?: SeatingDepthTestOptions,
): SeatingDepthPlan {
  const jumps = options?.jumps ?? [0, 0.010, 0.020, 0.030, 0.040, 0.060, 0.080, 0.100];
  const roundsPerStep = options?.roundsPerStep ?? 3;

  const steps: SeatingStep[] = jumps.map((jump) => {
    const oal = Math.round((baseOAL - jump) * 10000) / 10000;
    const label = jump === 0
      ? "Jam (touching lands)"
      : `${jump.toFixed(3)}" off`;

    return {
      jumpDistance: jump,
      oal,
      label,
    };
  });

  return {
    steps,
    baseOAL,
    totalRounds: steps.length * roundsPerStep,
  };
}

/**
 * Check whether a cartridge overall length fits within a rifle's magazine.
 *
 * @param oal - Cartridge overall length in inches
 * @param maxMagazineOAL - Maximum OAL the magazine can accept in inches
 * @returns True if the cartridge fits in the magazine
 */
export function checkMagazineLength(oal: number, maxMagazineOAL: number): boolean {
  return oal <= maxMagazineOAL;
}

// ---------------------------------------------------------------------------
// 4. OCW (Optimal Charge Weight) Analysis
// ---------------------------------------------------------------------------

/** Data from a single charge weight in an OCW test. */
export interface OCWResult {
  /** Powder charge weight in grains */
  chargeWeight: number;
  /** Group size in inches (center-to-center of widest two shots) */
  groupSize: number;
  /** Point-of-impact shift from aim point in inches { x, y } */
  poiShift: { x: number; y: number };
  /** Average velocity in fps */
  velocity: number;
  /** Extreme spread in fps */
  es: number;
  /** Standard deviation in fps */
  sd: number;
}

/** Results of the OCW analysis, including the recommended charge weight. */
export interface OCWAnalysis {
  /** The optimal charge weight in grains */
  optimalCharge: number;
  /** Input data used for the analysis */
  data: OCWResult[];
  /** Human-readable recommendation */
  recommendation: string;
}

/**
 * Analyze OCW (Optimal Charge Weight) test data.
 *
 * Scores each charge weight using a weighted composite of group size,
 * standard deviation, and point-of-impact consistency. The charge weight
 * with the lowest (best) composite score is selected as the OCW.
 *
 * Weighting: 50% group size, 30% SD, 20% POI consistency.
 *
 * @param data - Array of OCW test results at different charge weights
 * @returns Analysis result with the optimal charge and recommendation string
 */
export function analyzeOCW(data: OCWResult[]): OCWAnalysis {
  if (data.length === 0) {
    return {
      optimalCharge: 0,
      data: [],
      recommendation: "No data provided for OCW analysis.",
    };
  }

  if (data.length === 1) {
    return {
      optimalCharge: data[0].chargeWeight,
      data,
      recommendation:
        `Only one charge weight tested (${data[0].chargeWeight} gr). ` +
        `Test additional charge weights for a meaningful OCW analysis.`,
    };
  }

  // Normalize each metric to 0-1 range (0 = best, 1 = worst)
  const maxGroupSize = Math.max(...data.map((d) => d.groupSize));
  const maxSD = Math.max(...data.map((d) => d.sd));
  const poiMagnitudes = data.map((d) => Math.sqrt(d.poiShift.x ** 2 + d.poiShift.y ** 2));
  const maxPOI = Math.max(...poiMagnitudes);

  const scores = data.map((d, i) => {
    const normGroup = maxGroupSize > 0 ? d.groupSize / maxGroupSize : 0;
    const normSD = maxSD > 0 ? d.sd / maxSD : 0;
    const normPOI = maxPOI > 0 ? poiMagnitudes[i] / maxPOI : 0;

    // Weighted composite: 50% group, 30% SD, 20% POI
    const composite = 0.50 * normGroup + 0.30 * normSD + 0.20 * normPOI;

    return { chargeWeight: d.chargeWeight, score: composite };
  });

  // Find the charge with the lowest score
  scores.sort((a, b) => a.score - b.score);
  const best = scores[0];
  const bestData = data.find((d) => d.chargeWeight === best.chargeWeight)!;

  const recommendation =
    `Optimal charge weight: ${best.chargeWeight} gr. ` +
    `Group size: ${bestData.groupSize}" | ` +
    `ES: ${bestData.es} fps | SD: ${bestData.sd} fps | ` +
    `Velocity: ${bestData.velocity} fps. ` +
    `This charge showed the best combination of accuracy, velocity consistency, and POI stability.`;

  return {
    optimalCharge: best.chargeWeight,
    data,
    recommendation,
  };
}

// ---------------------------------------------------------------------------
// 5. Load Recipe / Logbook Types
// ---------------------------------------------------------------------------

/** A complete handload recipe with components, dimensions, and performance data. */
export interface LoadRecipe {
  /** Unique identifier */
  id: string;
  /** User-assigned name for this load */
  name: string;
  /** Creation timestamp (ms since epoch) */
  createdAt: number;
  /** Last update timestamp (ms since epoch) */
  updatedAt: number;

  // --- Components ---
  /** Cartridge identifier, e.g. "6.5 CM" */
  cartridgeShortName: string;
  /** Bullet manufacturer, e.g. "Hornady" */
  bulletManufacturer: string;
  /** Bullet product name, e.g. "ELD Match" */
  bulletName: string;
  /** Bullet weight in grains */
  bulletWeight: number;
  /** Powder name, e.g. "H4350" */
  powderName: string;
  /** Powder charge weight in grains */
  chargeWeight: number;
  /** Primer type/model, e.g. "CCI 200", "Federal 210M" */
  primerType: string;
  /** Brass manufacturer, e.g. "Lapua" */
  brassManufacturer: string;
  /** Brass trim length in inches */
  brassTrimLength: number;

  // --- Dimensions ---
  /** Cartridge overall length in inches */
  oal: number;
  /** Cartridge base to ogive measurement in inches */
  cbto: number;

  // --- Performance (optional, filled after testing) ---
  /** Average velocity in fps */
  velocityAvg?: number;
  /** Extreme spread in fps */
  velocityES?: number;
  /** Standard deviation in fps */
  velocitySD?: number;
  /** Best group size in inches */
  groupSize?: number;

  // --- Notes ---
  /** Free-form notes */
  notes: string;
  /** Barrel length in inches */
  barrelLength: number;
  /** Description of the rifle used */
  rifleDescription: string;
}

/** A range session recording conditions and results for a specific load. */
export interface RangeSession {
  /** Unique identifier */
  id: string;
  /** ID of the load recipe tested */
  loadRecipeId: string;
  /** Session date timestamp (ms since epoch) */
  date: number;
  /** Range/location name */
  location: string;

  // --- Conditions ---
  /** Ambient temperature in degrees Fahrenheit */
  temperature: number;
  /** Altitude in feet above sea level */
  altitude: number;
  /** Wind speed in mph */
  windSpeed: number;

  // --- Results ---
  /** Groups of velocity readings (each sub-array is one group) */
  shotStrings: number[][];
  /** Group sizes in inches */
  groupSizes: number[];
  /** Free-form notes */
  notes: string;
}

/**
 * Create a new load recipe with generated ID and timestamps.
 *
 * All fields in `data` are optional; unspecified fields receive sensible
 * defaults (empty strings, zeros). The `id`, `createdAt`, and `updatedAt`
 * fields are always generated fresh.
 *
 * @param data - Partial load recipe data
 * @returns A complete LoadRecipe with generated ID and timestamps
 */
export function createLoadRecipe(data: Partial<LoadRecipe>): LoadRecipe {
  const now = Date.now();
  return {
    id: generateId(),
    name: data.name ?? "",
    createdAt: now,
    updatedAt: now,
    cartridgeShortName: data.cartridgeShortName ?? "",
    bulletManufacturer: data.bulletManufacturer ?? "",
    bulletName: data.bulletName ?? "",
    bulletWeight: data.bulletWeight ?? 0,
    powderName: data.powderName ?? "",
    chargeWeight: data.chargeWeight ?? 0,
    primerType: data.primerType ?? "",
    brassManufacturer: data.brassManufacturer ?? "",
    brassTrimLength: data.brassTrimLength ?? 0,
    oal: data.oal ?? 0,
    cbto: data.cbto ?? 0,
    velocityAvg: data.velocityAvg,
    velocityES: data.velocityES,
    velocitySD: data.velocitySD,
    groupSize: data.groupSize,
    notes: data.notes ?? "",
    barrelLength: data.barrelLength ?? 0,
    rifleDescription: data.rifleDescription ?? "",
  };
}

/**
 * Create a new range session with generated ID and timestamp.
 *
 * All fields in `data` are optional; unspecified fields receive sensible
 * defaults. The `id` field is always generated fresh.
 *
 * @param data - Partial range session data
 * @returns A complete RangeSession with generated ID
 */
export function createRangeSession(data: Partial<RangeSession>): RangeSession {
  return {
    id: generateId(),
    loadRecipeId: data.loadRecipeId ?? "",
    date: data.date ?? Date.now(),
    location: data.location ?? "",
    temperature: data.temperature ?? 70,
    altitude: data.altitude ?? 0,
    windSpeed: data.windSpeed ?? 0,
    shotStrings: data.shotStrings ?? [],
    groupSizes: data.groupSizes ?? [],
    notes: data.notes ?? "",
  };
}

// ---------------------------------------------------------------------------
// 6. Common Primer Database
// ---------------------------------------------------------------------------

/** A primer entry with manufacturer, type classification, and description. */
export interface Primer {
  /** Full primer name/model, e.g. "CCI 200" */
  name: string;
  /** Manufacturer name */
  manufacturer: string;
  /** Primer size and type classification */
  type:
    | "small_rifle"
    | "large_rifle"
    | "small_rifle_magnum"
    | "large_rifle_magnum"
    | "small_pistol"
    | "large_pistol"
    | "rimfire";
  /** Brief description */
  description: string;
}

/** Database of common primers used in handloading. */
export const PRIMERS: Primer[] = [
  // --- CCI ---
  {
    name: "CCI 200",
    manufacturer: "CCI",
    type: "large_rifle",
    description: "Standard large rifle primer. Reliable general-purpose primer for most rifle cartridges.",
  },
  {
    name: "CCI 250",
    manufacturer: "CCI",
    type: "large_rifle_magnum",
    description: "Large rifle magnum primer. Hotter flame for large-capacity magnum cases and ball powders.",
  },
  {
    name: "CCI BR-2",
    manufacturer: "CCI",
    type: "large_rifle",
    description: "Benchrest large rifle primer. Tighter tolerances for improved consistency in precision loads.",
  },
  {
    name: "CCI 400",
    manufacturer: "CCI",
    type: "small_rifle",
    description: "Standard small rifle primer. Widely used in .223 Rem, 6mm ARC, and similar cartridges.",
  },
  {
    name: "CCI 450",
    manufacturer: "CCI",
    type: "small_rifle_magnum",
    description: "Small rifle magnum primer. Recommended for ball powders in small rifle cases.",
  },
  {
    name: "CCI BR-4",
    manufacturer: "CCI",
    type: "small_rifle",
    description: "Benchrest small rifle primer. Precision-made for minimal velocity variation.",
  },
  {
    name: "CCI 500",
    manufacturer: "CCI",
    type: "small_pistol",
    description: "Standard small pistol primer. Common choice for 9mm, .38 Special, and similar.",
  },
  {
    name: "CCI 300",
    manufacturer: "CCI",
    type: "large_pistol",
    description: "Standard large pistol primer. Used in .45 ACP, .44 Magnum, and similar.",
  },

  // --- Federal ---
  {
    name: "Federal 210",
    manufacturer: "Federal",
    type: "large_rifle",
    description: "Standard large rifle primer. Known for soft cup and reliable ignition.",
  },
  {
    name: "Federal 210M",
    manufacturer: "Federal",
    type: "large_rifle",
    description: "Gold Medal large rifle match primer. The benchmark for precision rifle loading.",
  },
  {
    name: "Federal 215",
    manufacturer: "Federal",
    type: "large_rifle_magnum",
    description: "Large rifle magnum primer. Hot ignition for large overbore magnum cartridges.",
  },
  {
    name: "Federal 215M",
    manufacturer: "Federal",
    type: "large_rifle_magnum",
    description: "Gold Medal large rifle magnum match primer. Consistent ignition for precision magnum loads.",
  },
  {
    name: "Federal 205",
    manufacturer: "Federal",
    type: "small_rifle",
    description: "Standard small rifle primer. Reliable choice for small rifle cartridges.",
  },
  {
    name: "Federal 205M",
    manufacturer: "Federal",
    type: "small_rifle",
    description: "Gold Medal small rifle match primer. Consistent ignition for precision small-bore loads.",
  },

  // --- Remington ---
  {
    name: "Remington 9½",
    manufacturer: "Remington",
    type: "large_rifle",
    description: "Standard large rifle primer. Dependable ignition across a wide range of loads.",
  },
  {
    name: "Remington 9½M",
    manufacturer: "Remington",
    type: "large_rifle_magnum",
    description: "Large rifle magnum primer. Hotter flame for complete powder ignition in magnum cases.",
  },

  // --- Winchester ---
  {
    name: "Winchester WLR",
    manufacturer: "Winchester",
    type: "large_rifle",
    description: "Standard large rifle primer. Non-corrosive and non-mercuric.",
  },
  {
    name: "Winchester WLRM",
    manufacturer: "Winchester",
    type: "large_rifle_magnum",
    description: "Large rifle magnum primer. Recommended for slow-burning powders in large cases.",
  },
  {
    name: "Winchester WSR",
    manufacturer: "Winchester",
    type: "small_rifle",
    description: "Standard small rifle primer. Popular in .223 Rem and 5.56 NATO loads.",
  },
];

/**
 * Look up a primer by name (case-insensitive).
 *
 * @param name - Primer name to search for, e.g. "CCI 200"
 * @returns The matching Primer or undefined if not found
 */
export function getPrimer(name: string): Primer | undefined {
  const lower = name.toLowerCase();
  return PRIMERS.find((p) => p.name.toLowerCase() === lower);
}

/**
 * Get all primers matching a given type classification.
 *
 * @param type - Primer type to filter by
 * @returns Array of matching primers
 */
export function getPrimersByType(type: Primer["type"]): Primer[] {
  return PRIMERS.filter((p) => p.type === type);
}

/**
 * Get all primers from a specific manufacturer.
 *
 * @param manufacturer - Manufacturer name (case-insensitive)
 * @returns Array of matching primers
 */
export function getPrimersByManufacturer(manufacturer: string): Primer[] {
  const lower = manufacturer.toLowerCase();
  return PRIMERS.filter((p) => p.manufacturer.toLowerCase() === lower);
}
