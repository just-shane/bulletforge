/**
 * BulletForge Internal Ballistics Engine
 *
 * Models what happens INSIDE the barrel: powder combustion, chamber pressure,
 * bullet acceleration, and predicted muzzle velocity.
 *
 * Uses a simplified thermodynamic model based on the Nobel-Abel equation of
 * state and Vieille's burn rate law — the same approach used by QuickLOAD
 * and GRT (Gordon's Reloading Tool).
 *
 * WARNING: This is a SIMULATOR intended for educational and comparative
 * purposes only. It should NEVER be used as the sole basis for determining
 * safe handloading data. Always consult published load data from reputable
 * sources (e.g., Hodgdon, Sierra, Hornady manuals) and work up loads
 * carefully from minimum starting charges.
 */

import { CARTRIDGES } from "./cartridges";

// ---------------------------------------------------------------------------
// Safety
// ---------------------------------------------------------------------------

/**
 * Safety margin factor. Any load where peak pressure exceeds
 * SAAMI max * SAFETY_MARGIN is flagged as potentially over-pressure.
 */
export const SAFETY_MARGIN = 0.90;

// ---------------------------------------------------------------------------
// Unit Conversion Constants
// ---------------------------------------------------------------------------

/** Grains per pound */
const GR_PER_LB = 7000;

/** Cubic inches per grain of water (water density ≈ 252.891 gr/in³) */
const CUIN_PER_GR_WATER = 1 / 252.891;

/**
 * g_c in imperial: 386.088 in/s² (= 32.174 ft/s² * 12)
 * Used for F = m * a / g_c when m is in lbm and F in lbf
 */
const GC_IN = 386.088;

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

/**
 * Configuration for the internal ballistics simulation.
 * Describes the complete load: cartridge, powder charge, and bullet.
 */
export interface InternalBallisticsConfig {
  /** Powder charge weight in grains */
  chargeWeight: number;

  // --- Powder properties ---
  /**
   * Burn rate coefficient in Vieille's law.
   * Units: 1/(psi^n · s) — gives dz/dt = a * P^n * surfaceFactor
   * where z is the mass fraction burned (0-1).
   */
  burnRateCoeff: number;
  /** Pressure exponent `n` in Vieille's law (typically 0.5-0.95) */
  pressureExponent: number;
  /** Adiabatic flame temperature in degrees Rankine */
  flameTemp: number;
  /** Ratio of specific heats (gamma) for powder gases, typically ~1.2-1.3 */
  gasSpecificHeat: number;
  /** Co-volume of powder gas in in³/lb (finite molecule size correction) */
  covolume: number;
  /** Bulk (loading/packing) density of powder in lb/in³ */
  powderDensity: number;
  /** Grain geometry form factor: 1=cord/extruded, 2=flake, 3=ball/sphere */
  grainFormFactor: number;
  /** Energy content of the powder in ft-lbf/lb */
  energyContent: number;

  // --- Case / chamber ---
  /** Case capacity in grains of water */
  caseCapacity: number;

  // --- Bore geometry ---
  /** Bore diameter (land-to-land) in inches */
  boreDiameter: number;
  /** Barrel length in inches (from breech face to muzzle) */
  barrelLength: number;

  // --- Bullet ---
  /** Bullet weight in grains */
  bulletWeight: number;
  /** Bullet diameter (groove diameter) in inches */
  bulletDiameter: number;

  // --- Resistance ---
  /** Shot start pressure in psi — pressure needed to engrave rifling and begin motion */
  shotStartPressure: number;
  /** Kinetic friction coefficient for bullet in bore (typically 0.01-0.04) */
  frictionCoefficient: number;
  /** Freebore (leade / throat) length in inches — distance bullet travels before engaging rifling */
  freebore: number;

  // --- Safety ---
  /** SAAMI maximum average pressure in psi */
  saamiMaxPressure: number;
}

/**
 * A single data point along the pressure/velocity curve as the bullet
 * travels down the barrel.
 */
export interface PressureCurvePoint {
  /** Bullet position from chamber in inches */
  position: number;
  /** Chamber pressure at this point in psi */
  pressure: number;
  /** Bullet velocity at this point in fps */
  velocity: number;
  /** Time from ignition in milliseconds */
  time: number;
}

/**
 * Complete results from an internal ballistics simulation.
 */
export interface InternalBallisticsResult {
  /** Full pressure-velocity-time curve along the barrel */
  pressureCurve: PressureCurvePoint[];
  /** Peak chamber pressure in psi */
  peakPressure: number;
  /** Distance from breech face where peak pressure occurs, in inches */
  peakPressurePosition: number;
  /** Bullet velocity at muzzle exit in fps */
  muzzleVelocity: number;
  /** Pressure at the moment the bullet exits the muzzle, in psi */
  muzzlePressure: number;
  /** Muzzle energy in ft-lbs */
  muzzleEnergy: number;
  /** Pressure at gas port location (for semi-auto rifles), psi. Null if not applicable. */
  portPressure: number | null;
  /** Case fill ratio (0-1): volume of powder / case capacity */
  fillRatio: number;
  /** Whether all powder burned before the bullet exited the barrel */
  burnComplete: boolean;
  /** Position in inches where all powder finished burning (Infinity if incomplete) */
  burnCompletePosition: number;
  /** Total time the bullet spent in the barrel, in milliseconds */
  exitTime: number;
  /** Thermodynamic efficiency: what % of powder energy became bullet kinetic energy */
  efficiencyPercent: number;
  /** Whether the load exceeds the safety margin threshold */
  overPressure: boolean;
}

// ---------------------------------------------------------------------------
// Powder Internal Ballistics Data
// ---------------------------------------------------------------------------

/**
 * Internal ballistics properties for each powder in the database.
 * These supplement the basic Powder data with thermodynamic constants
 * needed for the combustion model.
 */
export interface PowderInternalData {
  /**
   * Burn rate coefficient for Vieille's law.
   * Units: 1/(psi^n · s). Gives dz/dt = burnRateCoeff * P^n * surfaceFactor.
   * Calibrated so that typical loads produce realistic pressure/velocity.
   */
  burnRateCoeff: number;
  /** Pressure exponent `n` in Vieille's law */
  pressureExponent: number;
  /** Adiabatic flame temperature in degrees Rankine */
  flameTemp: number;
  /** Bulk (loading/packing) density in lb/in³ — how the powder fills the case */
  density: number;
  /** Co-volume of gas in in³/lb */
  covolume: number;
  /** Grain form factor: 1=extruded/cord, 2=flake, 3=ball/sphere */
  grainFormFactor: number;
  /** Energy content in ft·lbf/lb */
  energyContent: number;
  /** Ratio of specific heats (gamma) */
  gasSpecificHeat: number;
}

/**
 * Internal ballistics data keyed by powder name.
 *
 * Burn rate coefficients (a) are in units of 1/(psi^n * s) and are
 * calibrated against known load data so the simulation produces
 * realistic pressures and velocities.
 *
 * The relationship dz/dt = a * P^n * surfaceFactor means:
 * - At peak pressure ~60,000 psi with n~0.8: P^n ≈ 11,000
 * - A typical burn completes in ~0.5-1.0 ms
 * - So a ≈ 1/(11000 * 0.001) ≈ 0.09 to 0.18 for medium-rate powders
 *
 * Faster powders have larger coefficients; slower powders have smaller ones.
 *
 * Form factors: 1 = extruded/stick, 2 = flake, 3 = ball/spherical
 */
export const POWDER_INTERNAL_DATA: Record<string, PowderInternalData> = {
  // --- Hodgdon ---
  // Bulk densities: ball/spherical ~0.034-0.038, extruded ~0.028-0.033
  //
  // burnRateCoeff is calibrated so that dz/dt = a * P^n * surfaceFactor
  // produces realistic burn times (~0.3-1.0 ms total burn duration)
  // at typical operating pressures (40,000-65,000 psi).
  "H110": {
    burnRateCoeff: 2.6,
    pressureExponent: 0.62,
    flameTemp: 3420,
    density: 0.0370,
    covolume: 0.97,
    grainFormFactor: 3,
    energyContent: 1380000,
    gasSpecificHeat: 1.24,
  },
  "H335": {
    burnRateCoeff: 1.10,
    pressureExponent: 0.68,
    flameTemp: 3350,
    density: 0.0360,
    covolume: 0.97,
    grainFormFactor: 3,
    energyContent: 1400000,
    gasSpecificHeat: 1.24,
  },
  "BL-C(2)": {
    burnRateCoeff: 0.95,
    pressureExponent: 0.69,
    flameTemp: 3320,
    density: 0.0355,
    covolume: 0.97,
    grainFormFactor: 3,
    energyContent: 1390000,
    gasSpecificHeat: 1.24,
  },
  "CFE 223": {
    burnRateCoeff: 0.85,
    pressureExponent: 0.70,
    flameTemp: 3300,
    density: 0.0350,
    covolume: 0.97,
    grainFormFactor: 3,
    energyContent: 1395000,
    gasSpecificHeat: 1.24,
  },
  "Varget": {
    burnRateCoeff: 1.30,
    pressureExponent: 0.72,
    flameTemp: 3280,
    density: 0.0340,
    covolume: 0.96,
    grainFormFactor: 1,
    energyContent: 1410000,
    gasSpecificHeat: 1.23,
  },
  "H4350": {
    burnRateCoeff: 0.70,
    pressureExponent: 0.76,
    flameTemp: 3200,
    density: 0.0300,
    covolume: 0.96,
    grainFormFactor: 1,
    energyContent: 1420000,
    gasSpecificHeat: 1.23,
  },
  "H4831": {
    burnRateCoeff: 0.48,
    pressureExponent: 0.79,
    flameTemp: 3150,
    density: 0.0295,
    covolume: 0.96,
    grainFormFactor: 1,
    energyContent: 1430000,
    gasSpecificHeat: 1.22,
  },
  "H1000": {
    burnRateCoeff: 0.36,
    pressureExponent: 0.82,
    flameTemp: 3080,
    density: 0.0290,
    covolume: 0.96,
    grainFormFactor: 1,
    energyContent: 1440000,
    gasSpecificHeat: 1.22,
  },
  "Retumbo": {
    burnRateCoeff: 0.30,
    pressureExponent: 0.84,
    flameTemp: 3050,
    density: 0.0305,
    covolume: 0.96,
    grainFormFactor: 1,
    energyContent: 1450000,
    gasSpecificHeat: 1.22,
  },

  // --- Alliant ---
  "Power Pro 2000-MR": {
    burnRateCoeff: 0.90,
    pressureExponent: 0.73,
    flameTemp: 3260,
    density: 0.0345,
    covolume: 0.97,
    grainFormFactor: 3,
    energyContent: 1400000,
    gasSpecificHeat: 1.23,
  },
  "Reloder 16": {
    burnRateCoeff: 0.72,
    pressureExponent: 0.75,
    flameTemp: 3220,
    density: 0.0305,
    covolume: 0.96,
    grainFormFactor: 1,
    energyContent: 1415000,
    gasSpecificHeat: 1.23,
  },
  "Reloder 22": {
    burnRateCoeff: 0.45,
    pressureExponent: 0.79,
    flameTemp: 3120,
    density: 0.0295,
    covolume: 0.96,
    grainFormFactor: 1,
    energyContent: 1435000,
    gasSpecificHeat: 1.22,
  },
  "Reloder 26": {
    burnRateCoeff: 0.34,
    pressureExponent: 0.83,
    flameTemp: 3060,
    density: 0.0290,
    covolume: 0.96,
    grainFormFactor: 1,
    energyContent: 1445000,
    gasSpecificHeat: 1.22,
  },

  // --- Vihtavuori ---
  "N140": {
    burnRateCoeff: 1.15,
    pressureExponent: 0.70,
    flameTemp: 3310,
    density: 0.0310,
    covolume: 0.96,
    grainFormFactor: 1,
    energyContent: 1405000,
    gasSpecificHeat: 1.24,
  },
  "N150": {
    burnRateCoeff: 0.62,
    pressureExponent: 0.74,
    flameTemp: 3240,
    density: 0.0305,
    covolume: 0.96,
    grainFormFactor: 1,
    energyContent: 1415000,
    gasSpecificHeat: 1.23,
  },
  "N160": {
    burnRateCoeff: 0.55,
    pressureExponent: 0.78,
    flameTemp: 3170,
    density: 0.0300,
    covolume: 0.96,
    grainFormFactor: 1,
    energyContent: 1425000,
    gasSpecificHeat: 1.23,
  },
  "N165": {
    burnRateCoeff: 0.45,
    pressureExponent: 0.80,
    flameTemp: 3110,
    density: 0.0295,
    covolume: 0.96,
    grainFormFactor: 1,
    energyContent: 1435000,
    gasSpecificHeat: 1.22,
  },
  "N550": {
    burnRateCoeff: 0.66,
    pressureExponent: 0.75,
    flameTemp: 3230,
    density: 0.0302,
    covolume: 0.96,
    grainFormFactor: 1,
    energyContent: 1420000,
    gasSpecificHeat: 1.23,
  },
  "N570": {
    burnRateCoeff: 0.32,
    pressureExponent: 0.83,
    flameTemp: 3050,
    density: 0.0288,
    covolume: 0.96,
    grainFormFactor: 1,
    energyContent: 1448000,
    gasSpecificHeat: 1.22,
  },

  // --- IMR ---
  "IMR 4064": {
    burnRateCoeff: 1.20,
    pressureExponent: 0.71,
    flameTemp: 3290,
    density: 0.0310,
    covolume: 0.96,
    grainFormFactor: 1,
    energyContent: 1405000,
    gasSpecificHeat: 1.23,
  },
  "IMR 4166": {
    burnRateCoeff: 1.00,
    pressureExponent: 0.72,
    flameTemp: 3270,
    density: 0.0308,
    covolume: 0.96,
    grainFormFactor: 1,
    energyContent: 1410000,
    gasSpecificHeat: 1.23,
  },
  "IMR 4350": {
    burnRateCoeff: 0.68,
    pressureExponent: 0.76,
    flameTemp: 3190,
    density: 0.0300,
    covolume: 0.96,
    grainFormFactor: 1,
    energyContent: 1420000,
    gasSpecificHeat: 1.23,
  },
  "IMR 4831": {
    burnRateCoeff: 0.47,
    pressureExponent: 0.79,
    flameTemp: 3140,
    density: 0.0295,
    covolume: 0.96,
    grainFormFactor: 1,
    energyContent: 1430000,
    gasSpecificHeat: 1.22,
  },
  "IMR 7828": {
    burnRateCoeff: 0.36,
    pressureExponent: 0.82,
    flameTemp: 3090,
    density: 0.0290,
    covolume: 0.96,
    grainFormFactor: 1,
    energyContent: 1440000,
    gasSpecificHeat: 1.22,
  },
};

// ---------------------------------------------------------------------------
// Cartridge Internal Ballistics Data
// ---------------------------------------------------------------------------

/**
 * Internal ballistics properties for each cartridge. Supplements the
 * base Cartridge interface with chamber/bore geometry data needed
 * for the combustion simulation.
 */
export interface CartridgeInternalData {
  /** Case water capacity in grains of water */
  caseCapacity: number;
  /** Cross-sectional area of the bore in in² (computed from bore diameter) */
  boreArea: number;
  /** Bore diameter (land-to-land) in inches */
  boreDiameter: number;
  /** Typical factory barrel length in inches */
  typicalBarrelLength: number;
  /** Freebore / leade length in inches */
  freebore: number;
  /** Shot start pressure (psi) — pressure to engrave bullet into rifling */
  shotStartPressure: number;
  /** Typical charge weight range in grains */
  typicalChargeRange: { min: number; max: number };
}

/**
 * Helper: compute bore area from bore (land) diameter.
 * Bore diameter is slightly smaller than bullet/groove diameter.
 */
function computeBoreArea(boreDiameter: number): number {
  return Math.PI * (boreDiameter / 2) ** 2;
}

/**
 * Internal ballistics data keyed by cartridge short name.
 * Bore diameters are land-to-land (slightly smaller than groove/bullet diameter).
 */
export const CARTRIDGE_INTERNAL_DATA: Record<string, CartridgeInternalData> = {
  ".22 LR": {
    caseCapacity: 1.0,
    boreDiameter: 0.217,
    boreArea: computeBoreArea(0.217),
    typicalBarrelLength: 18,
    freebore: 0.050,
    shotStartPressure: 3000,
    typicalChargeRange: { min: 1.0, max: 2.0 },
  },
  ".223 Rem": {
    caseCapacity: 28.8,
    boreDiameter: 0.219,
    boreArea: computeBoreArea(0.219),
    typicalBarrelLength: 20,
    freebore: 0.025,
    shotStartPressure: 3500,
    typicalChargeRange: { min: 20.0, max: 28.0 },
  },
  "6mm ARC": {
    caseCapacity: 34.0,
    boreDiameter: 0.237,
    boreArea: computeBoreArea(0.237),
    typicalBarrelLength: 24,
    freebore: 0.040,
    shotStartPressure: 4000,
    typicalChargeRange: { min: 26.0, max: 33.0 },
  },
  ".243 Win": {
    caseCapacity: 53.5,
    boreDiameter: 0.237,
    boreArea: computeBoreArea(0.237),
    typicalBarrelLength: 24,
    freebore: 0.050,
    shotStartPressure: 4000,
    typicalChargeRange: { min: 36.0, max: 46.0 },
  },
  "6.5 CM": {
    caseCapacity: 52.5,
    boreDiameter: 0.256,
    boreArea: computeBoreArea(0.256),
    typicalBarrelLength: 24,
    freebore: 0.060,
    shotStartPressure: 4500,
    typicalChargeRange: { min: 36.0, max: 43.0 },
  },
  "6.5 PRC": {
    caseCapacity: 68.0,
    boreDiameter: 0.256,
    boreArea: computeBoreArea(0.256),
    typicalBarrelLength: 26,
    freebore: 0.070,
    shotStartPressure: 4500,
    typicalChargeRange: { min: 48.0, max: 58.0 },
  },
  ".270 Win": {
    caseCapacity: 67.0,
    boreDiameter: 0.270,
    boreArea: computeBoreArea(0.270),
    typicalBarrelLength: 24,
    freebore: 0.060,
    shotStartPressure: 4500,
    typicalChargeRange: { min: 48.0, max: 60.0 },
  },
  "7mm Rem Mag": {
    caseCapacity: 82.0,
    boreDiameter: 0.277,
    boreArea: computeBoreArea(0.277),
    typicalBarrelLength: 26,
    freebore: 0.070,
    shotStartPressure: 5000,
    typicalChargeRange: { min: 56.0, max: 68.0 },
  },
  ".308 Win": {
    caseCapacity: 56.0,
    boreDiameter: 0.300,
    boreArea: computeBoreArea(0.300),
    typicalBarrelLength: 22,
    freebore: 0.050,
    shotStartPressure: 4500,
    typicalChargeRange: { min: 39.0, max: 48.0 },
  },
  ".30-06": {
    caseCapacity: 68.0,
    boreDiameter: 0.300,
    boreArea: computeBoreArea(0.300),
    typicalBarrelLength: 24,
    freebore: 0.060,
    shotStartPressure: 4500,
    typicalChargeRange: { min: 46.0, max: 60.0 },
  },
  ".300 Win Mag": {
    caseCapacity: 91.5,
    boreDiameter: 0.300,
    boreArea: computeBoreArea(0.300),
    typicalBarrelLength: 26,
    freebore: 0.070,
    shotStartPressure: 5000,
    typicalChargeRange: { min: 63.0, max: 78.0 },
  },
  ".300 PRC": {
    caseCapacity: 82.0,
    boreDiameter: 0.300,
    boreArea: computeBoreArea(0.300),
    typicalBarrelLength: 26,
    freebore: 0.080,
    shotStartPressure: 5000,
    typicalChargeRange: { min: 68.0, max: 80.0 },
  },
  ".338 Lapua": {
    caseCapacity: 114.2,
    boreDiameter: 0.330,
    boreArea: computeBoreArea(0.330),
    typicalBarrelLength: 27,
    freebore: 0.080,
    shotStartPressure: 5500,
    typicalChargeRange: { min: 83.0, max: 96.0 },
  },
  ".375 H&H": {
    caseCapacity: 95.0,
    boreDiameter: 0.366,
    boreArea: computeBoreArea(0.366),
    typicalBarrelLength: 24,
    freebore: 0.070,
    shotStartPressure: 5000,
    typicalChargeRange: { min: 70.0, max: 90.0 },
  },
  ".50 BMG": {
    caseCapacity: 290.0,
    boreDiameter: 0.500,
    boreArea: computeBoreArea(0.500),
    typicalBarrelLength: 45,
    freebore: 0.100,
    shotStartPressure: 6000,
    typicalChargeRange: { min: 195.0, max: 240.0 },
  },
};

// ---------------------------------------------------------------------------
// Core Simulation
// ---------------------------------------------------------------------------

/**
 * Simulate the internal ballistics of a firearm discharge.
 *
 * Uses a time-stepping Euler integration of the coupled ODEs governing:
 * - Propellant combustion (Vieille's burn rate law)
 * - Gas thermodynamics (Nobel-Abel equation of state with energy tracking)
 * - Bullet dynamics (Newton's second law with bore friction)
 *
 * The simulation proceeds from primer ignition until the bullet exits
 * the muzzle (position >= barrel length).
 *
 * @param config - Complete load specification
 * @returns Full simulation results including pressure curve, velocities, and diagnostics
 */
export function simulateInternal(config: InternalBallisticsConfig): InternalBallisticsResult {
  // --- Convert units to consistent system (inches, lbm, seconds, psi) ---

  const chargeMassLb = config.chargeWeight / GR_PER_LB;
  const bulletMassLb = config.bulletWeight / GR_PER_LB;

  // Cross-sectional area of bore using bullet (groove) diameter,
  // since the bullet obturates to seal against the grooves
  const boreAreaIn2 = Math.PI * (config.bulletDiameter / 2) ** 2;

  // Case volume in cubic inches
  const caseVolumeIn3 = config.caseCapacity * CUIN_PER_GR_WATER;

  // Volume of solid propellant charge (using bulk/loading density)
  const powderVolumeIn3 = chargeMassLb / config.powderDensity;

  // Fill ratio: how much of the case is occupied by powder
  const fillRatio = Math.min(powderVolumeIn3 / caseVolumeIn3, 1.0);

  // Ratio of specific heats
  const gamma = config.gasSpecificHeat;

  // Per-pound energy content in in·lbf (convert from ft·lbf).
  // Apply a heat loss factor to account for energy lost to barrel/chamber
  // walls via convective and radiative heat transfer. In typical sporting
  // rifles, 15-25% of the gas thermal energy is lost to the barrel.
  // Smaller bores lose proportionally more heat (higher surface/volume ratio).
  const baseHeatLoss = 0.82;
  const boreSizeCorrection = Math.min(config.bulletDiameter / 0.308, 1.0);
  const HEAT_LOSS_FACTOR = baseHeatLoss * (0.85 + 0.15 * boreSizeCorrection);
  const energyPerLb_inlbf = config.energyContent * 12 * HEAT_LOSS_FACTOR;

  // --- Simulation state ---
  let t = 0;                     // time (seconds)
  let x = 0;                     // bullet position from chamber (inches)
  let v = 0;                     // bullet velocity (in/s)
  let z = 0;                     // mass fraction of charge burned (0-1)
  let bulletMoving = false;      // has bullet started moving?

  /**
   * Gas energy in in·lbf (= psi·in³).
   *
   * We track the total internal energy of the gas and use the Noble-Abel
   * energy-based EOS:
   *   P = gasEnergy * (gamma - 1) / V_effective
   *
   * where V_effective = V_free - gasMass * covolume.
   *
   * This naturally accounts for gas cooling as it does expansion work
   * on the bullet.
   */
  let gasEnergy = 0;
  let P = 0; // current pressure (psi)

  // Time step: 1 microsecond for good accuracy
  const dt = 1e-6; // seconds

  // Results tracking
  const pressureCurve: PressureCurvePoint[] = [];
  let peakPressure = 0;
  let peakPressurePosition = 0;
  let burnComplete = false;
  let burnCompletePosition = Infinity;

  // Record a data point roughly every 0.10 inches of bullet travel
  let nextRecordPosition = 0;
  const recordInterval = 0.10; // inches

  // Maximum iterations safety limit
  const maxIterations = 3_000_000; // 3 seconds at 1µs steps
  let iter = 0;

  // --- Primer ignition ---
  // The primer flash ignites a small fraction of the charge nearly
  // instantaneously (~50µs). We use a small seed fraction; the main
  // combustion then builds via the pressure-driven Vieille burn law.
  // This gives a realistic pressure ramp-up rather than an instantaneous spike.
  const primerIgnitionFraction = 0.008;
  z = primerIgnitionFraction;
  const totalChargeEnergy = chargeMassLb * energyPerLb_inlbf;
  gasEnergy = z * totalChargeEnergy;

  // Record the initial state
  pressureCurve.push({ position: 0, pressure: 0, velocity: 0, time: 0 });

  // --- Main simulation loop ---
  while (x < config.barrelLength && iter < maxIterations) {
    iter++;

    // Current gas mass (lb)
    const gasMass = z * chargeMassLb;

    // Remaining solid propellant volume
    const solidVolume = (1 - z) * powderVolumeIn3;

    // Free volume = case + bore swept by bullet - solid propellant remaining
    // For compressed loads, the initial case free volume may be near zero,
    // but the freebore always provides additional gas expansion space.
    const boreSwept = boreAreaIn2 * (x + config.freebore);
    const totalFreeVolume = Math.max(caseVolumeIn3 - solidVolume, 0) + boreSwept;

    // Noble-Abel EOS: P = E*(gamma-1) / (V_free - m_gas * b)
    const covolTerm = gasMass * config.covolume;
    const effectiveVolume = Math.max(totalFreeVolume - covolTerm, 0.001);
    P = (gasEnergy * (gamma - 1)) / effectiveVolume;

    // Clamp to prevent numerical explosion
    if (P > config.saamiMaxPressure * 3.0) {
      P = config.saamiMaxPressure * 3.0;
    }
    if (P < 0) P = 0;

    // --- Propellant combustion (Vieille's law) ---
    if (z < 1.0 && P > 100) {
      // Surface factor models how grain surface area changes as it burns.
      // Extruded grains (form=1) burn roughly at constant surface (neutral).
      // Flake and ball grains have degressive burning.
      const remaining = 1 - z;
      let surfaceFactor: number;

      if (config.grainFormFactor <= 1) {
        // Extruded: roughly constant surface, slight decrease near end
        surfaceFactor = Math.pow(remaining, 0.15);
      } else if (config.grainFormFactor === 2) {
        // Flake: surface decreases moderately
        surfaceFactor = Math.pow(remaining, 0.4);
      } else {
        // Ball/sphere: surface decreases as r² where r ∝ remaining^(1/3)
        surfaceFactor = Math.pow(remaining, 0.65);
      }

      // Vieille's law: dz/dt = a * P^n * surfaceFactor
      const dz_dt = config.burnRateCoeff * Math.pow(P, config.pressureExponent) * surfaceFactor;

      const prevZ = z;
      z = Math.min(z + dz_dt * dt, 1.0);

      // Energy released by newly burned propellant
      const dMass = (z - prevZ) * chargeMassLb;
      if (dMass > 0) {
        gasEnergy += dMass * energyPerLb_inlbf;
      }

      // Mark burn completion
      if (z >= 0.999 && !burnComplete) {
        burnComplete = true;
        burnCompletePosition = x;
      }
    }

    // --- Bullet motion ---
    if (!bulletMoving && P >= config.shotStartPressure) {
      bulletMoving = true;
    }

    if (bulletMoving) {
      // Net force on bullet base: pressure force minus bore friction
      const pressureForce = P * boreAreaIn2; // lbf
      const frictionForce = pressureForce * config.frictionCoefficient;
      const netForce = Math.max(pressureForce - frictionForce, 0); // lbf

      // Use effective mass (bullet + 1/3 charge gas) per Lagrange gradient.
      // This accounts for the gas column accelerating alongside the bullet.
      const effectiveMassLb = bulletMassLb + chargeMassLb / 3;

      // a = F * g_c / m (converts lbf to lbm·in/s²)
      const accel = (netForce * GC_IN) / effectiveMassLb; // in/s²

      // Symplectic Euler: update velocity first, then position
      v += accel * dt;
      const dx = v * dt;
      x += dx;

      // Work-energy: the expanding gas does PdV work.
      // Only the fraction that goes into gas internal energy change is subtracted.
      // The Lagrange model already accounts for gas column KE in the effective
      // mass, so we subtract only the "useful" work = net force * displacement,
      // which represents the kinetic energy gained by the bullet+gas system.
      // The remaining PdV work (friction losses) is also subtracted.
      if (dx > 0) {
        const work = pressureForce * dx; // total PdV work (in·lbf)
        gasEnergy = Math.max(gasEnergy - work, 0);
      }
    }

    // --- Track peak pressure ---
    if (P > peakPressure) {
      peakPressure = P;
      peakPressurePosition = x;
    }

    // --- Record data points ---
    if (bulletMoving && x >= nextRecordPosition) {
      pressureCurve.push({
        position: x,
        pressure: P,
        velocity: v / 12, // in/s → fps
        time: t * 1000,   // s → ms
      });
      nextRecordPosition = x + recordInterval;
    }

    t += dt;
  }

  // --- Final point at muzzle exit ---
  const muzzleVelocityFps = v / 12;
  pressureCurve.push({
    position: x,
    pressure: P,
    velocity: muzzleVelocityFps,
    time: t * 1000,
  });

  // Muzzle energy: KE = weight(gr) * v(fps)² / 450436
  const muzzleEnergy = (config.bulletWeight * muzzleVelocityFps * muzzleVelocityFps) / 450436;

  // Thermodynamic efficiency
  const totalChemicalEnergy = chargeMassLb * config.energyContent; // ft·lbf
  const efficiencyPercent = totalChemicalEnergy > 0
    ? (muzzleEnergy / totalChemicalEnergy) * 100
    : 0;

  // Over-pressure check
  const overPressure = peakPressure > config.saamiMaxPressure * SAFETY_MARGIN;

  return {
    pressureCurve,
    peakPressure,
    peakPressurePosition,
    muzzleVelocity: muzzleVelocityFps,
    muzzlePressure: P,
    muzzleEnergy,
    portPressure: null,
    fillRatio,
    burnComplete,
    burnCompletePosition: burnComplete ? burnCompletePosition : Infinity,
    exitTime: t * 1000,
    efficiencyPercent,
    overPressure,
  };
}

// ---------------------------------------------------------------------------
// Convenience: Build Config from Database Lookups
// ---------------------------------------------------------------------------

/**
 * Build an InternalBallisticsConfig from a cartridge short name, powder name,
 * charge weight, and bullet weight/diameter. Looks up powder and cartridge
 * data from the internal databases.
 *
 * @param cartridgeShortName - e.g. "6.5 CM", ".308 Win"
 * @param powderName - e.g. "H4350", "Varget"
 * @param chargeWeight - charge weight in grains
 * @param bulletWeight - bullet weight in grains
 * @param bulletDiameter - bullet diameter in inches
 * @param barrelLength - optional override for barrel length (inches)
 * @returns A complete config, or null if cartridge/powder not found
 */
export function buildConfig(
  cartridgeShortName: string,
  powderName: string,
  chargeWeight: number,
  bulletWeight: number,
  bulletDiameter: number,
  barrelLength?: number,
): InternalBallisticsConfig | null {
  const cartridge = CARTRIDGES.find((c) => c.shortName === cartridgeShortName);
  const cartridgeData = CARTRIDGE_INTERNAL_DATA[cartridgeShortName];
  const powderData = POWDER_INTERNAL_DATA[powderName];

  if (!cartridge || !cartridgeData || !powderData) {
    return null;
  }

  return {
    chargeWeight,
    burnRateCoeff: powderData.burnRateCoeff,
    pressureExponent: powderData.pressureExponent,
    flameTemp: powderData.flameTemp,
    gasSpecificHeat: powderData.gasSpecificHeat,
    covolume: powderData.covolume,
    powderDensity: powderData.density,
    grainFormFactor: powderData.grainFormFactor,
    energyContent: powderData.energyContent,
    caseCapacity: cartridgeData.caseCapacity,
    boreDiameter: cartridgeData.boreDiameter,
    barrelLength: barrelLength ?? cartridgeData.typicalBarrelLength,
    bulletWeight,
    bulletDiameter,
    shotStartPressure: cartridgeData.shotStartPressure,
    frictionCoefficient: 0.02,
    freebore: cartridgeData.freebore,
    saamiMaxPressure: cartridge.maxPressure,
  };
}

// ---------------------------------------------------------------------------
// Multi-Barrel-Length Velocity
// ---------------------------------------------------------------------------

/**
 * Run the internal ballistics simulation for multiple barrel lengths and
 * return the predicted muzzle velocity at each.
 *
 * Useful for answering "how much velocity do I gain/lose per inch of barrel?"
 *
 * @param config - Base configuration (barrelLength field will be overridden)
 * @param lengths - Array of barrel lengths in inches to simulate
 * @returns Array of { barrelLength, velocity } pairs
 */
export function velocityForBarrelLength(
  config: InternalBallisticsConfig,
  lengths: number[],
): Array<{ barrelLength: number; velocity: number }> {
  return lengths.map((len) => {
    const result = simulateInternal({ ...config, barrelLength: len });
    return {
      barrelLength: len,
      velocity: result.muzzleVelocity,
    };
  });
}

// ---------------------------------------------------------------------------
// Max Charge Finder
// ---------------------------------------------------------------------------

/**
 * Use binary search to find the charge weight (in grains) that produces
 * a peak pressure equal to the SAAMI maximum average pressure for the
 * cartridge.
 *
 * This represents the absolute maximum charge — in practice, published
 * max loads target somewhat below SAAMI MAP.
 *
 * WARNING: This is a mathematical result from a simplified model. Never
 * use this as the sole basis for determining a safe maximum charge.
 * Always consult published load data and work up from minimum charges.
 *
 * @param config - Base configuration (chargeWeight will be varied)
 * @returns The charge weight in grains that produces peak pressure ≈ SAAMI max
 */
export function findMaxCharge(config: InternalBallisticsConfig): number {
  const targetPressure = config.saamiMaxPressure;

  // Search bounds
  let lo = config.chargeWeight * 0.3;
  let hi = config.chargeWeight * 2.0;

  // Ensure hi produces over-pressure
  const hiResult = simulateInternal({ ...config, chargeWeight: hi });
  if (hiResult.peakPressure < targetPressure) {
    return hi; // Even double charge doesn't reach SAAMI max
  }

  // Ensure lo produces under-pressure
  const loResult = simulateInternal({ ...config, chargeWeight: lo });
  if (loResult.peakPressure > targetPressure) {
    return lo; // Even 30% exceeds SAAMI max
  }

  // Binary search: 25 iterations gives ~3e-8 relative precision
  for (let i = 0; i < 25; i++) {
    const mid = (lo + hi) / 2;
    const result = simulateInternal({ ...config, chargeWeight: mid });

    if (result.peakPressure > targetPressure) {
      hi = mid;
    } else {
      lo = mid;
    }
  }

  return (lo + hi) / 2;
}

// ---------------------------------------------------------------------------
// Lookup Helpers
// ---------------------------------------------------------------------------

/**
 * Get internal ballistics powder data by powder name.
 * Returns undefined if the powder is not in the internal ballistics database.
 */
export function getPowderInternalData(name: string): PowderInternalData | undefined {
  return POWDER_INTERNAL_DATA[name];
}

/**
 * Get internal ballistics cartridge data by short name.
 * Returns undefined if the cartridge is not in the internal ballistics database.
 */
export function getCartridgeInternalData(name: string): CartridgeInternalData | undefined {
  return CARTRIDGE_INTERNAL_DATA[name];
}

/**
 * List all powder names that have internal ballistics data available.
 */
export function availableInternalPowders(): string[] {
  return Object.keys(POWDER_INTERNAL_DATA);
}

/**
 * List all cartridge short names that have internal ballistics data available.
 */
export function availableInternalCartridges(): string[] {
  return Object.keys(CARTRIDGE_INTERNAL_DATA);
}
