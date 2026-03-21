/**
 * Comprehensive tests for the BulletForge Internal Ballistics Engine.
 *
 * Tests cover database integrity, simulation fundamentals, known load
 * validation against published data, barrel length effects, safety
 * features, and physics sanity checks.
 */

import { describe, it, expect } from "vitest";
import {
  simulateInternal,
  buildConfig,
  velocityForBarrelLength,
  findMaxCharge,
  getPowderInternalData,
  getCartridgeInternalData,
  availableInternalPowders,
  availableInternalCartridges,
  tempAdjustedVelocity,
  compareLoadAtTemps,
  comparePowders,
  findOptimalBarrelLength,
  POWDER_INTERNAL_DATA,
  type InternalBallisticsConfig,
} from "../lib/internal-ballistics";

// ---------------------------------------------------------------------------
// 1. Database Integrity (5 tests)
// ---------------------------------------------------------------------------

describe("Database integrity", () => {
  it("all powders have valid burn rate coefficients > 0", () => {
    const powders = availableInternalPowders();
    expect(powders.length).toBeGreaterThanOrEqual(22);

    for (const name of powders) {
      const data = getPowderInternalData(name);
      expect(data).toBeDefined();
      expect(data!.burnRateCoeff).toBeGreaterThan(0);
    }
  });

  it("all 15 cartridges have valid case capacities > 0", () => {
    const cartridges = availableInternalCartridges();
    expect(cartridges).toHaveLength(15);

    for (const name of cartridges) {
      const data = getCartridgeInternalData(name);
      expect(data).toBeDefined();
      expect(data!.caseCapacity).toBeGreaterThan(0);
    }
  });

  it("all cartridge bore areas are positive", () => {
    const cartridges = availableInternalCartridges();

    for (const name of cartridges) {
      const data = getCartridgeInternalData(name);
      expect(data).toBeDefined();
      expect(data!.boreArea).toBeGreaterThan(0);
    }
  });

  it("buildConfig returns null for unknown cartridge", () => {
    const config = buildConfig("9mm Fantasy Magnum", "H4350", 40, 140, 0.264);
    expect(config).toBeNull();
  });

  it("buildConfig returns valid config for known cartridge + powder", () => {
    const config = buildConfig("6.5 CM", "H4350", 41.5, 140, 0.264);
    expect(config).not.toBeNull();
    expect(config!.chargeWeight).toBe(41.5);
    expect(config!.bulletWeight).toBe(140);
    expect(config!.bulletDiameter).toBe(0.264);
    expect(config!.barrelLength).toBe(24); // typical for 6.5 CM
    expect(config!.saamiMaxPressure).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// 2. Simulation Fundamentals (6 tests)
// ---------------------------------------------------------------------------

describe("Simulation fundamentals", () => {
  // Build a standard 6.5 CM load for these tests
  const config = buildConfig("6.5 CM", "H4350", 41.5, 140, 0.264, 24)!;

  it("muzzle velocity is positive for a valid load", () => {
    const result = simulateInternal(config);
    expect(result.muzzleVelocity).toBeGreaterThan(0);
  });

  it("peak pressure is positive and occurs before muzzle exit", () => {
    const result = simulateInternal(config);
    expect(result.peakPressure).toBeGreaterThan(0);
    expect(result.peakPressurePosition).toBeLessThan(config.barrelLength);
  });

  it("peak pressure position is between 0 and barrel length", () => {
    const result = simulateInternal(config);
    expect(result.peakPressurePosition).toBeGreaterThanOrEqual(0);
    expect(result.peakPressurePosition).toBeLessThanOrEqual(config.barrelLength);
  });

  it("pressure curve has multiple points", () => {
    const result = simulateInternal(config);
    // At least initial point, some intermediate points, and the final muzzle point
    expect(result.pressureCurve.length).toBeGreaterThan(10);
  });

  it("exit time is positive and reasonable (< 5 ms)", () => {
    const result = simulateInternal(config);
    expect(result.exitTime).toBeGreaterThan(0);
    expect(result.exitTime).toBeLessThan(5);
  });

  it("fill ratio is between 0 and 1", () => {
    const result = simulateInternal(config);
    expect(result.fillRatio).toBeGreaterThan(0);
    expect(result.fillRatio).toBeLessThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// 3. Known Load Validation (4 tests)
// ---------------------------------------------------------------------------

describe("Known load validation", () => {
  it("6.5 CM / H4350 / 41.5gr / 140gr / 24in -> MV 2400-2900, peak 50k-70k", () => {
    const config = buildConfig("6.5 CM", "H4350", 41.5, 140, 0.264, 24)!;
    expect(config).not.toBeNull();

    const result = simulateInternal(config);
    expect(result.muzzleVelocity).toBeGreaterThanOrEqual(2400);
    expect(result.muzzleVelocity).toBeLessThanOrEqual(2900);
    expect(result.peakPressure).toBeGreaterThanOrEqual(50000);
    expect(result.peakPressure).toBeLessThanOrEqual(70000);
  });

  it(".308 Win / Varget / 44gr / 168gr / 22in -> MV 2300-2800, peak 45k-65k", () => {
    const config = buildConfig(".308 Win", "Varget", 44, 168, 0.308, 22)!;
    expect(config).not.toBeNull();

    const result = simulateInternal(config);
    expect(result.muzzleVelocity).toBeGreaterThanOrEqual(2300);
    expect(result.muzzleVelocity).toBeLessThanOrEqual(2800);
    expect(result.peakPressure).toBeGreaterThanOrEqual(45000);
    expect(result.peakPressure).toBeLessThanOrEqual(65000);
  });

  it(".223 Rem / Varget / 25gr / 55gr / 20in -> MV 2800-3400, peak 40k-65k", () => {
    const config = buildConfig(".223 Rem", "Varget", 25, 55, 0.224, 20)!;
    expect(config).not.toBeNull();

    const result = simulateInternal(config);
    expect(result.muzzleVelocity).toBeGreaterThanOrEqual(2800);
    expect(result.muzzleVelocity).toBeLessThanOrEqual(3400);
    expect(result.peakPressure).toBeGreaterThanOrEqual(40000);
    expect(result.peakPressure).toBeLessThanOrEqual(65000);
  });

  it(".300 Win Mag / Retumbo / 73gr / 190gr / 26in -> MV 2700-3100, peak 55k-72k", () => {
    const config = buildConfig(".300 Win Mag", "Retumbo", 73, 190, 0.308, 26)!;
    expect(config).not.toBeNull();

    const result = simulateInternal(config);
    expect(result.muzzleVelocity).toBeGreaterThanOrEqual(2700);
    expect(result.muzzleVelocity).toBeLessThanOrEqual(3100);
    expect(result.peakPressure).toBeGreaterThanOrEqual(55000);
    expect(result.peakPressure).toBeLessThanOrEqual(72000);
  });
});

// ---------------------------------------------------------------------------
// 4. Barrel Length Effects (3 tests)
// ---------------------------------------------------------------------------

describe("Barrel length effects", () => {
  const config = buildConfig("6.5 CM", "H4350", 41.5, 140, 0.264, 24)!;

  it("longer barrel produces higher velocity", () => {
    const short = simulateInternal({ ...config, barrelLength: 20 });
    const long = simulateInternal({ ...config, barrelLength: 26 });
    expect(long.muzzleVelocity).toBeGreaterThan(short.muzzleVelocity);
  });

  it("velocityForBarrelLength returns correct number of results", () => {
    const lengths = [18, 20, 22, 24, 26];
    const results = velocityForBarrelLength(config, lengths);
    expect(results).toHaveLength(lengths.length);

    for (const r of results) {
      expect(r.barrelLength).toBeGreaterThan(0);
      expect(r.velocity).toBeGreaterThan(0);
    }
  });

  it("velocity gain per inch diminishes with barrel length (diminishing returns)", () => {
    const lengths = [18, 22, 26, 30];
    const results = velocityForBarrelLength(config, lengths);

    // Gain from 18->22 (per inch)
    const gain1 = (results[1].velocity - results[0].velocity) / (lengths[1] - lengths[0]);
    // Gain from 22->26 (per inch)
    const gain2 = (results[2].velocity - results[1].velocity) / (lengths[2] - lengths[1]);
    // Gain from 26->30 (per inch)
    const gain3 = (results[3].velocity - results[2].velocity) / (lengths[3] - lengths[2]);

    // Each successive gain per inch should be smaller
    expect(gain1).toBeGreaterThan(gain2);
    expect(gain2).toBeGreaterThan(gain3);
  });
});

// ---------------------------------------------------------------------------
// 5. Safety Features (3 tests)
// ---------------------------------------------------------------------------

describe("Safety features", () => {
  it("extremely hot load (150% charge) flags overPressure = true", () => {
    const baseConfig = buildConfig("6.5 CM", "H4350", 41.5, 140, 0.264, 24)!;
    // 150% of 41.5 gr = 62.25 gr -- wildly over-charged
    const hotConfig: InternalBallisticsConfig = { ...baseConfig, chargeWeight: 41.5 * 1.5 };
    const result = simulateInternal(hotConfig);
    expect(result.overPressure).toBe(true);
  });

  it("normal load within SAAMI should NOT flag overPressure", () => {
    // Use a moderate load well within published data
    const config = buildConfig("6.5 CM", "H4350", 38.0, 140, 0.264, 24)!;
    const result = simulateInternal(config);
    expect(result.overPressure).toBe(false);
  });

  it("findMaxCharge returns a charge weight greater than minimum", () => {
    const config = buildConfig("6.5 CM", "H4350", 41.5, 140, 0.264, 24)!;
    const maxCharge = findMaxCharge(config);

    // Max charge should be a reasonable positive number above the
    // typical minimum range for 6.5 CM (~36 gr)
    expect(maxCharge).toBeGreaterThan(36);
    // And it should not be absurdly high
    expect(maxCharge).toBeLessThan(80);
  });
});

// ---------------------------------------------------------------------------
// 6. Physics Sanity (4 tests)
// ---------------------------------------------------------------------------

describe("Physics sanity", () => {
  it("heavier bullet produces lower velocity (same charge)", () => {
    const lightConfig = buildConfig("6.5 CM", "H4350", 41.5, 120, 0.264, 24)!;
    const heavyConfig = buildConfig("6.5 CM", "H4350", 41.5, 147, 0.264, 24)!;

    const lightResult = simulateInternal(lightConfig);
    const heavyResult = simulateInternal(heavyConfig);

    expect(lightResult.muzzleVelocity).toBeGreaterThan(heavyResult.muzzleVelocity);
  });

  it("more powder produces higher velocity (same bullet)", () => {
    const lessConfig = buildConfig("6.5 CM", "H4350", 38.0, 140, 0.264, 24)!;
    const moreConfig = buildConfig("6.5 CM", "H4350", 42.0, 140, 0.264, 24)!;

    const lessResult = simulateInternal(lessConfig);
    const moreResult = simulateInternal(moreConfig);

    expect(moreResult.muzzleVelocity).toBeGreaterThan(lessResult.muzzleVelocity);
  });

  it("more powder produces higher peak pressure", () => {
    const lessConfig = buildConfig("6.5 CM", "H4350", 38.0, 140, 0.264, 24)!;
    const moreConfig = buildConfig("6.5 CM", "H4350", 42.0, 140, 0.264, 24)!;

    const lessResult = simulateInternal(lessConfig);
    const moreResult = simulateInternal(moreConfig);

    expect(moreResult.peakPressure).toBeGreaterThan(lessResult.peakPressure);
  });

  it("efficiency is between 10% and 45% (realistic range for firearms)", () => {
    const config = buildConfig("6.5 CM", "H4350", 41.5, 140, 0.264, 24)!;
    const result = simulateInternal(config);

    expect(result.efficiencyPercent).toBeGreaterThanOrEqual(10);
    expect(result.efficiencyPercent).toBeLessThanOrEqual(45);
  });
});

// ---------------------------------------------------------------------------
// 7. Temperature Sensitivity (4 tests)
// ---------------------------------------------------------------------------

describe("Temperature sensitivity", () => {
  it("tempAdjustedVelocity returns higher velocity at higher temp", () => {
    const result = tempAdjustedVelocity(2700, "H4350", 59, 100);
    expect(result).toBeGreaterThan(2700);
  });

  it("tempAdjustedVelocity returns lower velocity at lower temp", () => {
    const result = tempAdjustedVelocity(2700, "H4350", 59, 0);
    expect(result).toBeLessThan(2700);
  });

  it("tempAdjustedVelocity returns baseMV for unknown powder", () => {
    const result = tempAdjustedVelocity(2700, "FakePowder", 59, 100);
    expect(result).toBe(2700);
  });

  it("compareLoadAtTemps returns velocity and pressure deltas", () => {
    const config = buildConfig("6.5 CM", "H4350", 41.5, 140, 0.264, 24)!;
    const result = compareLoadAtTemps(config, "H4350", 20, 100, 59);

    expect(result.hot.velocity).toBeGreaterThan(result.cold.velocity);
    expect(result.velocityDelta).toBeGreaterThan(0);
    expect(result.pressureDelta).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// 8. Burn Rate Comparison (3 tests)
// ---------------------------------------------------------------------------

describe("Burn rate comparison", () => {
  it("comparePowders returns results for valid powders", () => {
    const results = comparePowders("6.5 CM", ["H4350", "Varget"], 41.5, 140, 0.264, 24);
    expect(results).toHaveLength(2);

    for (const r of results) {
      expect(r).not.toBeNull();
    }

    expect(results[0]!.result.muzzleVelocity).not.toBe(results[1]!.result.muzzleVelocity);
  });

  it("comparePowders returns null for unknown powder", () => {
    const results = comparePowders("6.5 CM", ["H4350", "FakePowder"], 41.5, 140, 0.264, 24);
    expect(results).toHaveLength(2);
    expect(results[0]).not.toBeNull();
    expect(results[1]).toBeNull();
  });

  it("comparePowders results have pressure curves", () => {
    const results = comparePowders("6.5 CM", ["H4350", "Varget"], 41.5, 140, 0.264, 24);

    for (const r of results) {
      if (r !== null) {
        expect(r.result.pressureCurve.length).toBeGreaterThan(0);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// 9. Optimal Barrel Length (3 tests)
// ---------------------------------------------------------------------------

describe("Optimal barrel length", () => {
  const config = buildConfig("6.5 CM", "H4350", 41.5, 140, 0.264, 24)!;

  it("findOptimalBarrelLength returns data for each length", () => {
    const result = findOptimalBarrelLength(config);
    expect(result.data).toHaveLength(15); // 16" to 30"
  });

  it("findOptimalBarrelLength velocity increases with length", () => {
    const result = findOptimalBarrelLength(config);

    for (let i = 1; i < result.data.length; i++) {
      expect(result.data[i].velocity).toBeGreaterThanOrEqual(result.data[i - 1].velocity);
    }
  });

  it("findOptimalBarrelLength finds a reasonable optimal length", () => {
    const result = findOptimalBarrelLength(config);
    expect(result.optimalLength).toBeGreaterThanOrEqual(16);
    expect(result.optimalLength).toBeLessThanOrEqual(30);
  });
});

// ---------------------------------------------------------------------------
// 10. Powder Temperature Sensitivity Data (2 tests)
// ---------------------------------------------------------------------------

describe("Powder temperature sensitivity data", () => {
  it("all powders have tempSensitivity field", () => {
    for (const [name, data] of Object.entries(POWDER_INTERNAL_DATA)) {
      expect(data.tempSensitivity, `${name} should have tempSensitivity`).toBeDefined();
      expect(typeof data.tempSensitivity).toBe("number");
      expect(data.tempSensitivity, `${name} tempSensitivity should be > 0`).toBeGreaterThan(0);
    }
  });

  it("Vihtavuori powders are more temp-stable than ball powders", () => {
    const n150 = POWDER_INTERNAL_DATA["N150"];
    const blc2 = POWDER_INTERNAL_DATA["BL-C(2)"];

    expect(n150).toBeDefined();
    expect(blc2).toBeDefined();
    expect(n150.tempSensitivity).toBeLessThan(blc2.tempSensitivity);
  });
});
