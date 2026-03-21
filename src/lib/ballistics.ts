/**
 * BulletForge External Ballistics Engine
 *
 * Point-mass trajectory model using 4th-order Runge-Kutta integration
 * with G1/G7 standard drag models, atmospheric corrections, spin drift,
 * and optional Coriolis effect.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DragModel = "G1" | "G7";

export interface TrajectoryConfig {
  muzzleVelocity: number;      // fps
  bulletWeight: number;         // grains
  bulletDiameter: number;       // inches
  bc: number;                   // ballistic coefficient
  dragModel: DragModel;         // G1 or G7
  sightHeight: number;          // inches above bore
  zeroRange: number;            // yards
  windSpeed: number;            // mph
  windAngle: number;            // degrees (0 = headwind, 90 = full cross from right)
  shootingAngle: number;        // degrees (positive = uphill)
  altitude: number;             // feet
  temperature: number;          // degrees F
  barometricPressure: number;   // inHg
  humidity: number;             // 0-1 (0.78 = 78%)
  twistRate?: number;           // inches per turn (e.g., 8 for 1:8)
  twistDirection?: "right" | "left";
  latitude?: number;            // degrees for Coriolis
  azimuth?: number;             // degrees (direction of fire) for Coriolis
  maxRange?: number;            // yards (default 1200)
  stepSize?: number;            // yards between output rows (default 25)
}

export interface TrajectoryPoint {
  range: number;          // yards
  dropInches: number;     // inches (negative = below line of sight)
  dropMOA: number;        // MOA adjustment
  dropMIL: number;        // MIL adjustment
  driftInches: number;    // inches (positive = right)
  driftMOA: number;
  driftMIL: number;
  velocity: number;       // fps
  energy: number;         // ft-lbs
  time: number;           // seconds
  momentum: number;       // lb-s
  machNumber: number;
  spinDrift: number;      // inches
  coriolisInches: number;   // Coriolis horizontal deflection in inches
  aeroJumpInches: number;   // Aerodynamic jump vertical deflection in inches
}

export interface TrajectoryResult {
  points: TrajectoryPoint[];
  zeroAngle: number;          // radians - bore angle to achieve zero
  maxOrdinate: number;        // inches - max height above LOS before zero
  transonicRange: number;     // yards - where bullet drops below Mach 1.2
  subsonicRange: number;      // yards - where bullet drops below Mach 1.0
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GRAVITY = 32.174;           // ft/s^2
const STD_TEMP_F = 59;            // standard atmosphere temp
const STD_PRESSURE_INHG = 29.92;  // standard atmosphere pressure
const STD_ALTITUDE_FT = 0;
const STD_HUMIDITY = 0.78;

// Molecular weights
const M_DRY_AIR = 28.9644;   // g/mol
const M_WATER = 18.0153;     // g/mol
const R_UNIVERSAL = 8314.462; // J/(kmol*K)

// ---------------------------------------------------------------------------
// G1 Drag Coefficient Table (Cd vs Mach)
// ---------------------------------------------------------------------------

const G1_TABLE: [number, number][] = [
  [0.00, 0.2629],
  [0.05, 0.2558],
  [0.10, 0.2487],
  [0.15, 0.2413],
  [0.20, 0.2344],
  [0.25, 0.2278],
  [0.30, 0.2214],
  [0.35, 0.2155],
  [0.40, 0.2104],
  [0.45, 0.2061],
  [0.50, 0.2031],
  [0.55, 0.2013],
  [0.60, 0.2010],
  [0.65, 0.2024],
  [0.70, 0.2051],
  [0.75, 0.2068],
  [0.80, 0.2104],
  [0.85, 0.2188],
  [0.90, 0.2324],
  [0.925, 0.2512],
  [0.95, 0.2719],
  [0.975, 0.3109],
  [1.00, 0.3513],
  [1.025, 0.3742],
  [1.05, 0.3942],
  [1.075, 0.3992],
  [1.10, 0.4033],
  [1.125, 0.3958],
  [1.15, 0.3907],
  [1.20, 0.3845],
  [1.25, 0.3732],
  [1.30, 0.3615],
  [1.35, 0.3503],
  [1.40, 0.3396],
  [1.45, 0.3297],
  [1.50, 0.3209],
  [1.55, 0.3126],
  [1.60, 0.3049],
  [1.65, 0.2978],
  [1.70, 0.2912],
  [1.75, 0.2845],
  [1.80, 0.2789],
  [1.85, 0.2732],
  [1.90, 0.2680],
  [1.95, 0.2621],
  [2.00, 0.2556],
  [2.05, 0.2506],
  [2.10, 0.2457],
  [2.20, 0.2363],
  [2.30, 0.2274],
  [2.40, 0.2217],
  [2.50, 0.2169],
  [2.60, 0.2121],
  [2.70, 0.2073],
  [2.80, 0.2026],
  [2.90, 0.1970],
  [3.00, 0.1913],
  [3.50, 0.1728],
  [4.00, 0.1573],
  [4.50, 0.1442],
  [5.00, 0.1332],
];

// ---------------------------------------------------------------------------
// G7 Drag Coefficient Table (Cd vs Mach)
// ---------------------------------------------------------------------------

const G7_TABLE: [number, number][] = [
  [0.00, 0.1198],
  [0.05, 0.1197],
  [0.10, 0.1196],
  [0.15, 0.1194],
  [0.20, 0.1193],
  [0.25, 0.1194],
  [0.30, 0.1194],
  [0.35, 0.1194],
  [0.40, 0.1193],
  [0.45, 0.1193],
  [0.50, 0.1197],
  [0.55, 0.1196],
  [0.60, 0.1198],
  [0.65, 0.1199],
  [0.70, 0.1203],
  [0.75, 0.1207],
  [0.80, 0.1220],
  [0.825, 0.1232],
  [0.85, 0.1248],
  [0.875, 0.1268],
  [0.90, 0.1295],
  [0.925, 0.1338],
  [0.95, 0.1451],
  [0.975, 0.1618],
  [1.00, 0.1862],
  [1.025, 0.2054],
  [1.05, 0.2214],
  [1.075, 0.2268],
  [1.10, 0.2305],
  [1.125, 0.2285],
  [1.15, 0.2268],
  [1.20, 0.2236],
  [1.25, 0.2191],
  [1.30, 0.2141],
  [1.35, 0.2098],
  [1.40, 0.2053],
  [1.45, 0.2010],
  [1.50, 0.1962],
  [1.55, 0.1923],
  [1.60, 0.1882],
  [1.65, 0.1843],
  [1.70, 0.1804],
  [1.75, 0.1765],
  [1.80, 0.1727],
  [1.85, 0.1691],
  [1.90, 0.1656],
  [1.95, 0.1631],
  [2.00, 0.1609],
  [2.05, 0.1574],
  [2.10, 0.1541],
  [2.20, 0.1479],
  [2.30, 0.1427],
  [2.40, 0.1400],
  [2.50, 0.1375],
  [2.60, 0.1338],
  [2.70, 0.1302],
  [2.80, 0.1268],
  [2.90, 0.1245],
  [3.00, 0.1226],
  [3.50, 0.1120],
  [4.00, 0.1033],
  [4.50, 0.0960],
  [5.00, 0.0900],
];

// ---------------------------------------------------------------------------
// Atmospheric Functions
// ---------------------------------------------------------------------------

/**
 * Speed of sound in fps given temperature in Fahrenheit
 */
export function speedOfSound(tempF: number): number {
  const tempR = tempF + 459.67; // Rankine
  return 49.0223 * Math.sqrt(tempR);
}

/**
 * Calculate saturation vapor pressure using the Antoine equation (Tetens)
 * Returns pressure in Pa
 */
function saturationVaporPressure(tempC: number): number {
  return 610.78 * Math.exp((17.27 * tempC) / (tempC + 237.3));
}

/**
 * Calculate air density in lb/ft^3 accounting for altitude, temperature,
 * barometric pressure, and humidity.
 * Uses the ICAO standard atmosphere model with humidity correction.
 */
export function airDensity(
  altitudeFt: number,
  tempF: number,
  pressureInHg: number,
  humidity: number
): number {
  const tempC = (tempF - 32) * (5 / 9);
  const tempK = tempC + 273.15;

  // Convert station pressure from inHg to Pa
  const pressurePa = pressureInHg * 3386.389;

  // Altitude correction using barometric formula
  // Pressure drops ~1 inHg per 1000 ft at low altitudes
  const altCorrPa = pressurePa * Math.exp(-altitudeFt / 27000);

  // Vapor pressure of water at current conditions
  const pSat = saturationVaporPressure(tempC);
  const pVapor = humidity * pSat;

  // Density using ideal gas law with humidity correction
  // ρ = (Pd * Md + Pv * Mv) / (R * T)
  const pDry = altCorrPa - pVapor;
  const densityKgM3 =
    (pDry * M_DRY_AIR + pVapor * M_WATER) / (R_UNIVERSAL * tempK);

  // Convert kg/m^3 to lb/ft^3
  return densityKgM3 * 0.062428;
}

/**
 * Standard air density at sea level, 59°F, 29.92 inHg, 78% humidity
 */
export function standardAirDensity(): number {
  return airDensity(STD_ALTITUDE_FT, STD_TEMP_F, STD_PRESSURE_INHG, STD_HUMIDITY);
}

/**
 * Calculate density altitude — the altitude in standard atmosphere that has
 * the same air density as the current conditions. This is the single number
 * that captures all atmospheric effects on bullet flight.
 *
 * Uses the relationship: ρ = ρ₀ * (1 - L*h/T₀)^(gM/(RL) - 1)
 * where L = lapse rate, T₀ = sea level temp, g = gravity, M = molar mass, R = gas constant
 *
 * Inverted to solve for h given ρ.
 *
 * @param altitudeFt - True altitude in feet
 * @param tempF - Temperature in degrees F
 * @param pressureInHg - Barometric pressure in inHg (station pressure)
 * @param humidity - Relative humidity 0-1
 * @returns Density altitude in feet
 */
export function densityAltitude(
  altitudeFt: number,
  tempF: number,
  pressureInHg: number,
  humidity: number,
): number {
  const rho = airDensity(altitudeFt, tempF, pressureInHg, humidity);
  const rhoStd = standardAirDensity();

  // Standard atmosphere lapse rate model inverted
  // In standard atmosphere: ρ/ρ₀ = (1 - 6.8756e-6 * h)^4.2559
  // Solving for h: h = (1 - (ρ/ρ₀)^(1/4.2559)) / 6.8756e-6
  const ratio = rho / rhoStd;

  if (ratio <= 0 || ratio >= 2) return altitudeFt; // Sanity guard

  const da = (1 - Math.pow(ratio, 1 / 4.2559)) / 6.8756e-6;
  return Math.round(da);
}

/**
 * Convert station pressure to absolute (sea-level corrected) pressure.
 * Station pressure is what a barometer reads at your location.
 * Absolute pressure is corrected to sea level equivalent.
 *
 * @param stationPressureInHg - Local barometer reading in inHg
 * @param altitudeFt - Elevation in feet
 * @param tempF - Temperature in degrees F
 * @returns Sea-level corrected pressure in inHg
 */
export function stationToAbsolutePressure(
  stationPressureInHg: number,
  altitudeFt: number,
  tempF: number,
): number {
  // Hypsometric formula approximation
  const tempC = (tempF - 32) * (5 / 9);
  const tempK = tempC + 273.15;
  const exponent = (altitudeFt * 0.3048 * 0.0289644 * 9.80665) / (8.31447 * tempK);
  return stationPressureInHg * Math.exp(exponent);
}

/**
 * Estimate muzzle velocity correction for shooting at altitude.
 * Higher altitude = less air resistance = slightly higher effective MV.
 * This is a simplified empirical correction.
 *
 * @param baseMV - Muzzle velocity at sea level in fps
 * @param altitudeFt - Shooting altitude in feet
 * @returns Corrected muzzle velocity in fps
 */
export function altitudeVelocityCorrection(
  baseMV: number,
  altitudeFt: number,
): number {
  // Empirical: about 1-2 fps per 1000 ft (from less barrel friction in thinner air)
  // This is a very small effect - the main altitude effect is on drag, already handled
  return baseMV + (altitudeFt / 1000) * 1.5;
}

/**
 * Density ratio relative to standard atmosphere
 */
function densityRatio(
  altitudeFt: number,
  tempF: number,
  pressureInHg: number,
  humidity: number
): number {
  return airDensity(altitudeFt, tempF, pressureInHg, humidity) / standardAirDensity();
}

// ---------------------------------------------------------------------------
// Drag Functions
// ---------------------------------------------------------------------------

/**
 * Linearly interpolate Cd from a drag table given Mach number
 */
export function interpolateCd(table: [number, number][], mach: number): number {
  if (mach <= table[0][0]) return table[0][1];
  if (mach >= table[table.length - 1][0]) return table[table.length - 1][1];

  for (let i = 0; i < table.length - 1; i++) {
    if (mach >= table[i][0] && mach <= table[i + 1][0]) {
      const t =
        (mach - table[i][0]) / (table[i + 1][0] - table[i][0]);
      return table[i][1] + t * (table[i + 1][1] - table[i][1]);
    }
  }
  return table[table.length - 1][1];
}

function getDragTable(model: DragModel): [number, number][] {
  return model === "G1" ? G1_TABLE : G7_TABLE;
}

/**
 * Reference Cd for G1 and G7 standard projectiles at given Mach
 */
function referenceCd(model: DragModel, mach: number): number {
  return interpolateCd(getDragTable(model), mach);
}

/**
 * Sectional density: bullet weight (gr) / (7000 * diameter^2)
 */
export function sectionalDensity(weightGr: number, diameterIn: number): number {
  return weightGr / (7000 * diameterIn * diameterIn);
}

/**
 * Drag retardation (deceleration in ft/s^2) given velocity, atmospheric conditions,
 * and ballistic coefficient.
 *
 * The BC relates the actual bullet drag to the standard projectile:
 *   BC = SD / i, where i = form factor = Cd_bullet / Cd_standard
 *
 * Drag deceleration = (ρ/ρ_std) × (Cd_std(M) × A_std) / (2 × m) × v²
 * Simplified using BC: a_drag = (ρ/ρ_std) × Cd_std(M) / (BC × C_ref) × v²
 * where C_ref = 2 × m / (ρ_std × A_std)
 *
 * In practice with BC in lb/in^2 form:
 *   retardation = (Cd_std(M) × v² × ρ_ratio) / BC  (scaled by reference constants)
 *
 * We use the formulation:
 *   a = v² × (ρ/ρ_std) × Cd_std(M) / (BC × k)
 * where k is a normalisation constant for the standard projectile.
 */
function dragRetardation(
  velocity: number,
  mach: number,
  bc: number,
  dragModel: DragModel,
  rhoRatio: number
): number {
  const cd = referenceCd(dragModel, mach);
  // Standard projectile reference area and mass relationship
  // For G1: 1 inch diameter, 1 lb (7000 gr) projectile
  // The "standard" BC formulation gives: decel = cd * v^2 / (bc * constant)
  // The constant that makes BC work in the standard system is approx 166114.4
  // (derived from reference projectile area / mass ratio in imperial units)
  const K = 166114.4;
  return (cd / bc) * (velocity * velocity / K) * rhoRatio;
}

// ---------------------------------------------------------------------------
// Ballistic Calculations
// ---------------------------------------------------------------------------

/**
 * Kinetic energy in ft-lbs
 * KE = (m_grains * v_fps^2) / 450436
 */
export function kineticEnergy(weightGr: number, velocityFps: number): number {
  return (weightGr * velocityFps * velocityFps) / 450436;
}

/**
 * Momentum in lb-s
 * p = (m_grains * v_fps) / (7000 * 32.174)
 * Simplified: p = (m_grains * v_fps) / 225218
 */
export function momentum(weightGr: number, velocityFps: number): number {
  return (weightGr * velocityFps) / 225218;
}

/**
 * Convert inches of drop to MOA at a given range in yards
 * MOA = drop_inches / (range_yards * tan(1 MOA))
 * 1 MOA ≈ 1.047" at 100 yards
 */
function inchesToMOA(inches: number, rangeYards: number): number {
  if (rangeYards <= 0) return 0;
  return inches / (rangeYards * 1.047 / 100);
}

/**
 * Convert inches to MIL at a given range
 * 1 MIL = 3.6" at 100 yards
 */
function inchesToMIL(inches: number, rangeYards: number): number {
  if (rangeYards <= 0) return 0;
  return inches / (rangeYards * 3.6 / 100);
}

/**
 * Litz spin drift approximation
 * SD = 1.25 * (SG + 1.2) * t^1.83
 * where SG is gyroscopic stability factor (approximate as 1.5 for stable bullet)
 * and t is time of flight in seconds.
 * Returns drift in inches (positive = direction of twist).
 */
function spinDrift(time: number, twistRate?: number): number {
  if (!twistRate || twistRate <= 0 || time <= 0) return 0;
  // Approximate SG - tighter twist = higher SG
  const sg = 1.5; // Assume stable bullet
  return 1.25 * (sg + 1.2) * Math.pow(time, 1.83);
}

/**
 * Coriolis acceleration components for a projectile.
 *
 * The Coriolis effect has two components for a bullet:
 * - Horizontal deflection: 2 * Ω * vx * sin(lat) — deflects right in Northern hemisphere
 * - Vertical (Eötvös) effect: 2 * Ω * vx * cos(lat) * sin(azimuth) — affects drop
 *
 * Ω = Earth's rotation rate = 7.2921e-5 rad/s
 *
 * @param vx - Downrange velocity in fps
 * @param latitude - Shooter's latitude in degrees (positive = North)
 * @param azimuth - Direction of fire in degrees (0 = North, 90 = East)
 * @returns { horizontal: ft/s², vertical: ft/s² } accelerations
 */
function coriolisAcceleration(
  vx: number,
  latitude: number,
  azimuth: number,
): { horizontal: number; vertical: number } {
  const OMEGA = 7.2921e-5; // Earth rotation rate rad/s
  const latRad = (latitude * Math.PI) / 180;
  const azRad = (azimuth * Math.PI) / 180;

  // Horizontal deflection (right in Northern hemisphere)
  const horizontal = 2 * OMEGA * vx * Math.sin(latRad);

  // Eötvös effect — vertical acceleration change when shooting East/West
  const vertical = 2 * OMEGA * vx * Math.cos(latRad) * Math.sin(azRad);

  return { horizontal, vertical };
}

/**
 * Aerodynamic jump — crosswind-induced vertical deflection.
 * When a spinning bullet enters a crosswind, the aerodynamic moment
 * causes a precession that tilts the nose, creating a vertical deflection
 * component. This is VERTICAL shift caused by HORIZONTAL wind.
 *
 * Approximation: aeroJump ≈ (crosswind / muzzleVelocity) * range * factor
 * where factor depends on stability. Typical: 0.5-1.0 inches per 10mph
 * crosswind per 100 yards for a stable bullet.
 *
 * @param crossWindFps - Crosswind component in fps
 * @param muzzleVelocity - Muzzle velocity in fps
 * @param time - Time of flight in seconds
 * @param twistRate - Barrel twist rate in inches/turn
 * @returns Vertical deflection in inches (positive = up for right-twist, right crosswind)
 */
function aerodynamicJump(
  crossWindFps: number,
  muzzleVelocity: number,
  time: number,
  twistRate?: number,
): number {
  if (!twistRate || twistRate <= 0 || time <= 0) return 0;
  // Stability-dependent factor — tighter twist = more effect
  // Typical SG ≈ 1.5 for well-stabilized bullet
  const sg = 1.5;
  // Deflection accumulates with time squared (angular rate * time = angle, angle * distance = offset)
  const factor = 0.01 * (sg / twistRate);
  return factor * (crossWindFps / muzzleVelocity) * Math.pow(time, 2) * muzzleVelocity * 12;
}

// ---------------------------------------------------------------------------
// Core Trajectory Solver
// ---------------------------------------------------------------------------

/**
 * Find the bore angle (in radians) needed to zero at the specified range.
 * Uses iterative bisection.
 */
function findZeroAngle(config: TrajectoryConfig, rhoRatio: number, vs: number): number {
  const zeroRangeFt = config.zeroRange * 3;

  let loAngle = 0;
  let hiAngle = 0.01; // ~0.57 degrees - sufficient for most rifle cartridges

  // Ensure bracket is wide enough
  for (let attempt = 0; attempt < 10; attempt++) {
    const drop = simulateDrop(config, hiAngle, rhoRatio, vs, zeroRangeFt);
    if (drop > 0) break;
    hiAngle *= 2;
  }

  // Bisection: find angle where bullet y = 0 at zero range
  for (let i = 0; i < 50; i++) {
    const midAngle = (loAngle + hiAngle) / 2;
    const drop = simulateDrop(config, midAngle, rhoRatio, vs, zeroRangeFt);
    if (drop > 0) {
      hiAngle = midAngle;
    } else {
      loAngle = midAngle;
    }
  }

  return (loAngle + hiAngle) / 2;
}

/**
 * Simulate bullet drop (vertical position in ft) at a given downrange distance,
 * with bore elevated at boreAngle radians.
 * Returns the vertical position relative to bore line at the given range.
 */
function simulateDrop(
  config: TrajectoryConfig,
  boreAngle: number,
  rhoRatio: number,
  vs: number,
  rangeFt: number
): number {
  const dt = 0.0005; // time step in seconds (0.5ms for accuracy)

  const cosShoot = Math.cos((config.shootingAngle * Math.PI) / 180);
  const sinShoot = Math.sin((config.shootingAngle * Math.PI) / 180);

  // Initial velocity components (bore axis)
  let vx = config.muzzleVelocity * Math.cos(boreAngle) * cosShoot;
  let vy = config.muzzleVelocity * Math.sin(boreAngle) - config.muzzleVelocity * Math.cos(boreAngle) * sinShoot * 0; // simplified
  vy = config.muzzleVelocity * Math.sin(boreAngle);

  let x = 0; // downrange (ft)
  let y = 0; // vertical from bore line (ft)

  // RK4 integration
  while (x < rangeFt) {
    const v = Math.sqrt(vx * vx + vy * vy);
    const mach = v / vs;
    const drag = dragRetardation(v, mach, config.bc, config.dragModel, rhoRatio);

    // Drag components proportional to velocity direction
    const ax1 = -drag * (vx / v);
    const ay1 = -drag * (vy / v) - GRAVITY;

    const v2x = vx + ax1 * dt / 2;
    const v2y = vy + ay1 * dt / 2;
    const v2 = Math.sqrt(v2x * v2x + v2y * v2y);
    const m2 = v2 / vs;
    const d2 = dragRetardation(v2, m2, config.bc, config.dragModel, rhoRatio);
    const ax2 = -d2 * (v2x / v2);
    const ay2 = -d2 * (v2y / v2) - GRAVITY;

    const v3x = vx + ax2 * dt / 2;
    const v3y = vy + ay2 * dt / 2;
    const v3 = Math.sqrt(v3x * v3x + v3y * v3y);
    const m3 = v3 / vs;
    const d3 = dragRetardation(v3, m3, config.bc, config.dragModel, rhoRatio);
    const ax3 = -d3 * (v3x / v3);
    const ay3 = -d3 * (v3y / v3) - GRAVITY;

    const v4x = vx + ax3 * dt;
    const v4y = vy + ay3 * dt;
    const v4 = Math.sqrt(v4x * v4x + v4y * v4y);
    const m4 = v4 / vs;
    const d4 = dragRetardation(v4, m4, config.bc, config.dragModel, rhoRatio);
    const ax4 = -d4 * (v4x / v4);
    const ay4 = -d4 * (v4y / v4) - GRAVITY;

    vx += (dt / 6) * (ax1 + 2 * ax2 + 2 * ax3 + ax4);
    vy += (dt / 6) * (ay1 + 2 * ay2 + 2 * ay3 + ay4);
    x += vx * dt;
    y += vy * dt;
  }

  return y;
}

/**
 * Main trajectory computation.
 * Returns trajectory points at every stepSize yards from 0 to maxRange.
 */
export function trajectory(config: TrajectoryConfig): TrajectoryResult {
  const maxRange = config.maxRange ?? 1200;
  const stepSize = config.stepSize ?? 25;

  const rhoRatio = densityRatio(
    config.altitude,
    config.temperature,
    config.barometricPressure,
    config.humidity
  );
  const vs = speedOfSound(config.temperature);

  // Find zero angle
  const zeroAngle = findZeroAngle(config, rhoRatio, vs);

  const dt = 0.0005; // 0.5ms time step

  const sightHeightFt = config.sightHeight / 12;

  // Wind components (convert mph to fps)
  const windFps = config.windSpeed * (5280 / 3600);
  const windAngleRad = (config.windAngle * Math.PI) / 180;
  const crossWind = windFps * Math.sin(windAngleRad);  // fps, positive = from right
  const headWind = windFps * Math.cos(windAngleRad);    // fps, positive = headwind

  const cosShoot = Math.cos((config.shootingAngle * Math.PI) / 180);

  // Initial velocity components
  let vx = config.muzzleVelocity * Math.cos(zeroAngle);
  let vy = config.muzzleVelocity * Math.sin(zeroAngle);
  let vz = 0; // lateral (wind drift axis)

  let x = 0;  // downrange ft
  let y = 0;  // vertical ft (relative to bore)
  let z = 0;  // lateral ft
  let t = 0;  // time

  const points: TrajectoryPoint[] = [];
  let nextRange = 0; // next range to output (yards)

  let maxOrdinate = 0;
  let transonicRange = maxRange;
  let subsonicRange = maxRange;
  let foundTransonic = false;
  let foundSubsonic = false;

  // Gravity correction for shooting angle (Rifleman's rule)
  const gravityEffective = GRAVITY * cosShoot;

  while (nextRange <= maxRange) {
    const rangeYards = x / 3;

    if (rangeYards >= nextRange) {
      const v = Math.sqrt(vx * vx + vy * vy + vz * vz);
      const mach = v / vs;

      // Drop relative to line of sight.
      // y tracks bullet position (ft) from bore start. Sight is sightHeight above bore.
      // LOS from (0, sightHeight) to (zeroRange, 0): LOS(r) = sightHeight * (1 - r/zeroRange)
      // Drop = (bullet_y - LOS_y) converted to inches.
      const losAtRange = sightHeightFt * (1 - rangeYards / config.zeroRange);
      const dropInches = (y - losAtRange) * 12;

      // Wind drift in inches
      const driftInches = z * 12;

      // Spin drift
      const sd = spinDrift(t, config.twistRate);
      const sdSign = config.twistDirection === "left" ? -1 : 1;
      const totalDrift = driftInches + sd * sdSign;

      // Aerodynamic jump — crosswind-induced vertical shift
      const aeroJumpInches = aerodynamicJump(crossWind, config.muzzleVelocity, t, config.twistRate);

      if (rangeYards <= config.zeroRange && dropInches > maxOrdinate) {
        maxOrdinate = dropInches;
      }

      if (!foundTransonic && mach < 1.2 && rangeYards > 0) {
        transonicRange = rangeYards;
        foundTransonic = true;
      }
      if (!foundSubsonic && mach < 1.0 && rangeYards > 0) {
        subsonicRange = rangeYards;
        foundSubsonic = true;
      }

      points.push({
        range: nextRange,
        dropInches: nextRange === 0 ? 0 : dropInches + aeroJumpInches * sdSign,
        dropMOA: inchesToMOA(dropInches, rangeYards),
        dropMIL: inchesToMIL(dropInches, rangeYards),
        driftInches: totalDrift,
        driftMOA: inchesToMOA(totalDrift, rangeYards),
        driftMIL: inchesToMIL(totalDrift, rangeYards),
        velocity: v,
        energy: kineticEnergy(config.bulletWeight, v),
        time: t,
        momentum: momentum(config.bulletWeight, v),
        machNumber: mach,
        spinDrift: sd * sdSign,
        coriolisInches: 0,  // Coriolis is already integrated into the z-axis, this is for display
        aeroJumpInches: nextRange === 0 ? 0 : aeroJumpInches * sdSign,
      });

      nextRange += stepSize;
    }

    // RK4 integration step
    // Coriolis setup (only if lat/azimuth provided)
    const hasCoriolis = config.latitude != null && config.azimuth != null;

    const doStep = () => {
      // Wind affects the bullet by changing the relative airspeed
      // The drag acts on the velocity relative to the air
      const vrx = vx - (-headWind); // relative to air (headwind reduces groundspeed)
      const vry = vy;
      const vrz = vz - (-crossWind); // crosswind
      const vr = Math.sqrt(vrx * vrx + vry * vry + vrz * vrz);
      const machR = vr / vs;
      const dragR = dragRetardation(vr, machR, config.bc, config.dragModel, rhoRatio);

      const ax = -dragR * (vrx / (vr || 1));
      let ay = -dragR * (vry / (vr || 1)) - gravityEffective;
      let az = -dragR * (vrz / (vr || 1));

      // Coriolis + Eötvös
      if (hasCoriolis) {
        const cor = coriolisAcceleration(vx, config.latitude!, config.azimuth!);
        az += cor.horizontal;  // Horizontal deflection
        ay += cor.vertical;    // Eötvös vertical effect
      }

      return { ax, ay, az };
    };

    // k1
    const k1 = doStep();
    const savedVx = vx, savedVy = vy, savedVz = vz;

    // k2
    vx = savedVx + k1.ax * dt / 2;
    vy = savedVy + k1.ay * dt / 2;
    vz = savedVz + k1.az * dt / 2;
    const k2 = doStep();

    // k3
    vx = savedVx + k2.ax * dt / 2;
    vy = savedVy + k2.ay * dt / 2;
    vz = savedVz + k2.az * dt / 2;
    const k3 = doStep();

    // k4
    vx = savedVx + k3.ax * dt;
    vy = savedVy + k3.ay * dt;
    vz = savedVz + k3.az * dt;
    const k4 = doStep();

    // Update velocities
    vx = savedVx + (dt / 6) * (k1.ax + 2 * k2.ax + 2 * k3.ax + k4.ax);
    vy = savedVy + (dt / 6) * (k1.ay + 2 * k2.ay + 2 * k3.ay + k4.ay);
    vz = savedVz + (dt / 6) * (k1.az + 2 * k2.az + 2 * k3.az + k4.az);

    // Update positions
    x += vx * dt;
    y += vy * dt;
    z += vz * dt;
    t += dt;

    // Safety: prevent infinite loop if bullet stalls
    if (vx < 10) break;
  }

  return {
    points,
    zeroAngle,
    maxOrdinate,
    transonicRange,
    subsonicRange,
  };
}

// ---------------------------------------------------------------------------
// Miller Stability Factor
// ---------------------------------------------------------------------------

/**
 * Miller stability factor — determines if a twist rate properly stabilizes a bullet.
 *
 * Uses the Miller twist rule formula:
 *   SG = (30 * W) / (T² * D³ * L * (1 + L²))
 * where:
 *   W = bullet weight in grains
 *   T = twist rate in calibers per turn
 *   D = bullet diameter in inches
 *   L = bullet length in calibers (length / diameter)
 *
 * Stability ranges:
 *   SG < 1.0  — Unstable (bullet will tumble)
 *   1.0-1.3   — Marginally stable (accuracy suffers)
 *   1.3-2.0   — Well stabilized (ideal for most shooting)
 *   > 2.0     — Over-stabilized (may not transition well to sleep)
 *
 * Corrected for altitude and temperature:
 *   SG_corrected = SG * (T_actual / T_std) * (P_std / P_actual)
 *
 * @param bulletWeight - Weight in grains
 * @param bulletDiameter - Diameter in inches
 * @param bulletLength - Length in inches (if not known, estimate from weight and diameter)
 * @param twistRate - Barrel twist rate in inches per turn (e.g., 8 for 1:8)
 * @param altitude - Altitude in feet (default 0)
 * @param temperature - Temperature in degrees F (default 59)
 * @param pressure - Barometric pressure in inHg (default 29.92)
 * @returns Object with stability factor, rating, and recommended twist range
 */
export function millerStability(
  bulletWeight: number,
  bulletDiameter: number,
  bulletLength: number,
  twistRate: number,
  altitude: number = 0,
  temperature: number = 59,
  pressure: number = 29.92,
): {
  stabilityFactor: number;
  rating: "unstable" | "marginal" | "stable" | "over-stabilized";
  recommendation: string;
  minTwist: number;  // Slowest twist that gives SG >= 1.4
  maxTwist: number;  // Fastest reasonable twist (SG ~2.0)
} {
  // Convert twist rate to calibers per turn
  const twistCalibers = twistRate / bulletDiameter;

  // Bullet length in calibers
  const lengthCalibers = bulletLength / bulletDiameter;

  // Miller formula (simplified)
  const sg = (30 * bulletWeight) / (
    twistCalibers * twistCalibers *
    bulletDiameter * bulletDiameter * bulletDiameter *
    lengthCalibers * (1 + lengthCalibers * lengthCalibers)
  );

  // Altitude/temperature correction
  // Higher altitude = thinner air = easier to stabilize
  const tempRatio = (temperature + 459.67) / (59 + 459.67); // Rankine ratio
  const pressureRatio = 29.92 / pressure;
  const altFactor = Math.exp(altitude / 27000); // Density decreases with altitude
  const sgCorrected = sg * tempRatio * pressureRatio * altFactor;

  // Rating
  let rating: "unstable" | "marginal" | "stable" | "over-stabilized";
  let recommendation: string;

  if (sgCorrected < 1.0) {
    rating = "unstable";
    recommendation = `Bullet will tumble. Need faster twist rate (lower number). Try 1:${Math.floor(twistRate * Math.sqrt(sgCorrected / 1.5))}".`;
  } else if (sgCorrected < 1.3) {
    rating = "marginal";
    recommendation = `Marginally stable. Accuracy may suffer in cold/dense air. Consider 1:${Math.floor(twistRate * Math.sqrt(sgCorrected / 1.5))}" for better stability.`;
  } else if (sgCorrected <= 2.0) {
    rating = "stable";
    recommendation = "Well stabilized. Good balance of stability and precision.";
  } else {
    rating = "over-stabilized";
    recommendation = `SG ${sgCorrected.toFixed(1)} is high. Bullet may not transition to sleep. A slower twist (1:${Math.ceil(twistRate * Math.sqrt(sgCorrected / 1.8))}") could improve long-range accuracy.`;
  }

  // Calculate min/max twist recommendations
  // For SG = 1.4: solve T = sqrt(30 * W / (SG * D^3 * L * (1+L^2))) * D
  const calcTwist = (targetSG: number) => {
    const tCal = Math.sqrt((30 * bulletWeight) / (targetSG * bulletDiameter * bulletDiameter * bulletDiameter * lengthCalibers * (1 + lengthCalibers * lengthCalibers)));
    return tCal * bulletDiameter;
  };

  const minTwist = Math.round(calcTwist(1.4) * 2) / 2; // Round to nearest 0.5"
  const maxTwist = Math.round(calcTwist(2.0) * 2) / 2;

  return {
    stabilityFactor: Math.round(sgCorrected * 100) / 100,
    rating,
    recommendation,
    minTwist,
    maxTwist,
  };
}

// ---------------------------------------------------------------------------
// BC Refinement (Truing) Calculator
// ---------------------------------------------------------------------------

/**
 * Back-calculate the true ballistic coefficient from two velocity measurements
 * at different distances. This is "truing" — using real-world data to correct
 * the manufacturer's published BC.
 *
 * Uses the relationship: BC = f(v1, v2, distance, drag_model)
 * where the drag function integral between v1 and v2 over the distance
 * determines the actual BC.
 *
 * @param velocity1 - Velocity at first distance (fps) — typically muzzle velocity
 * @param distance1 - First measurement distance (yards) — typically 0 (muzzle)
 * @param velocity2 - Velocity at second distance (fps) — from downrange chrono
 * @param distance2 - Second measurement distance (yards)
 * @param publishedBC - Manufacturer's published BC for reference
 * @param dragModel - G1 or G7
 * @param altitude - Shooting altitude in feet (default 0)
 * @param temperature - Temperature in degrees F (default 59)
 * @param pressure - Barometric pressure in inHg (default 29.92)
 * @param humidity - Relative humidity 0-1 (default 0.78)
 * @returns Object with true BC, correction factor, and comparison
 */
export function refineBCFromVelocity(
  velocity1: number,
  distance1: number,
  velocity2: number,
  distance2: number,
  publishedBC: number,
  dragModel: DragModel = "G7",
  altitude: number = 0,
  temperature: number = 59,
  pressure: number = 29.92,
  humidity: number = 0.78,
): {
  trueBC: number;
  correctionFactor: number;  // trueBC / publishedBC
  percentDifference: number; // how far off the published BC is
  assessment: string;
} {
  const rhoRatio = airDensity(altitude, temperature, pressure, humidity) / standardAirDensity();
  const vs = speedOfSound(temperature);
  const distanceFt = (distance2 - distance1) * 3; // yards to feet

  if (distanceFt <= 0 || velocity1 <= 0 || velocity2 <= 0 || velocity2 >= velocity1) {
    return {
      trueBC: publishedBC,
      correctionFactor: 1.0,
      percentDifference: 0,
      assessment: "Invalid input — V2 must be less than V1 and distance must be positive.",
    };
  }

  // Binary search for the BC that produces the observed velocity drop
  let lo = 0.01;
  let hi = publishedBC * 5.0;

  for (let i = 0; i < 40; i++) {
    const midBC = (lo + hi) / 2;

    // Simulate with this BC using RK4 (matching main solver accuracy)
    const dt = 0.0005;
    let vx = velocity1;
    let x = 0;

    while (x < distanceFt && vx > 100) {
      const accel = (v: number) => {
        const m = v / vs;
        return -dragRetardation(v, m, midBC, dragModel, rhoRatio);
      };

      const k1 = accel(vx);
      const k2 = accel(vx + k1 * dt / 2);
      const k3 = accel(vx + k2 * dt / 2);
      const k4 = accel(vx + k3 * dt);

      vx += (dt / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
      x += vx * dt;
    }

    if (vx > velocity2) {
      // BC too high (not enough drag) — need lower BC
      hi = midBC;
    } else {
      // BC too low (too much drag) — need higher BC
      lo = midBC;
    }
  }

  const trueBC = Math.round(((lo + hi) / 2) * 1000) / 1000;
  const correctionFactor = Math.round((trueBC / publishedBC) * 1000) / 1000;
  const percentDiff = Math.round((correctionFactor - 1) * 1000) / 10;

  let assessment: string;
  if (Math.abs(percentDiff) < 2) {
    assessment = "Published BC is accurate. No correction needed.";
  } else if (percentDiff < 0) {
    assessment = `Published BC is ${Math.abs(percentDiff).toFixed(1)}% optimistic. True BC is lower — expect more drop than published data suggests.`;
  } else {
    assessment = `Published BC is ${percentDiff.toFixed(1)}% conservative. Bullet performs better than published — you have a slight advantage.`;
  }

  return {
    trueBC,
    correctionFactor,
    percentDifference: percentDiff,
    assessment,
  };
}

// ---------------------------------------------------------------------------
// Convenience: default config
// ---------------------------------------------------------------------------

export function defaultConfig(): TrajectoryConfig {
  return {
    muzzleVelocity: 2700,
    bulletWeight: 140,
    bulletDiameter: 0.264,
    bc: 0.307,
    dragModel: "G7",
    sightHeight: 1.5,
    zeroRange: 100,
    windSpeed: 0,
    windAngle: 90,
    shootingAngle: 0,
    altitude: 0,
    temperature: 59,
    barometricPressure: 29.92,
    humidity: 0.78,
    twistRate: 8,
    twistDirection: "right",
    maxRange: 1200,
    stepSize: 25,
  };
}
