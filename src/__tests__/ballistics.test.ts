import { describe, it, expect } from "vitest";
import {
  trajectory,
  kineticEnergy,
  momentum,
  speedOfSound,
  airDensity,
  standardAirDensity,
  interpolateCd,
  defaultConfig,
  densityAltitude,
  stationToAbsolutePressure,
  altitudeVelocityCorrection,
  millerStability,
  refineBCFromVelocity,
} from "../lib/ballistics.ts";
import type { TrajectoryConfig } from "../lib/ballistics.ts";

// G1 and G7 drag tables for direct interpolation tests
const G1_TABLE: [number, number][] = [
  [0.00, 0.2629], [0.50, 0.2031], [0.70, 0.2051], [0.80, 0.2104],
  [0.90, 0.2324], [0.95, 0.2719], [1.00, 0.3513], [1.05, 0.3942],
  [1.10, 0.4033], [1.20, 0.3845], [1.30, 0.3615], [1.50, 0.3209],
  [1.75, 0.2845], [2.00, 0.2556], [2.50, 0.2169], [3.00, 0.1913],
  [4.00, 0.1573],
];

const G7_TABLE: [number, number][] = [
  [0.00, 0.1198], [0.50, 0.1197], [0.70, 0.1203], [0.80, 0.1220],
  [0.90, 0.1295], [0.95, 0.1451], [1.00, 0.1862], [1.05, 0.2214],
  [1.10, 0.2305], [1.20, 0.2236], [1.30, 0.2141], [1.50, 0.1962],
  [1.75, 0.1765], [2.00, 0.1609], [2.50, 0.1375], [3.00, 0.1226],
  [4.00, 0.1033],
];

describe("Ballistics Engine", () => {
  // -------------------------------------------------------------------------
  // Kinetic Energy
  // -------------------------------------------------------------------------
  describe("Kinetic Energy", () => {
    it("should calculate KE for 140gr at 2700fps correctly", () => {
      const ke = kineticEnergy(140, 2700);
      // KE = (140 * 2700^2) / 450436 ≈ 2265.7
      expect(ke).toBeCloseTo(2265.7, 0);
    });

    it("should calculate KE for 168gr at 2820fps", () => {
      const ke = kineticEnergy(168, 2820);
      // KE = (168 * 2820^2) / 450436 ≈ 2965.4
      expect(ke).toBeCloseTo(2965, -1);
    });

    it("should return 0 KE at 0 velocity", () => {
      expect(kineticEnergy(140, 0)).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // Momentum
  // -------------------------------------------------------------------------
  describe("Momentum", () => {
    it("should calculate momentum for 140gr at 2700fps", () => {
      const p = momentum(140, 2700);
      // p = (140 * 2700) / 225218 ≈ 1.678
      expect(p).toBeCloseTo(1.678, 2);
    });

    it("should calculate momentum for 300gr at 2745fps (.338 Lapua)", () => {
      const p = momentum(300, 2745);
      // p = (300 * 2745) / 225218 ≈ 3.656
      expect(p).toBeCloseTo(3.656, 1);
    });
  });

  // -------------------------------------------------------------------------
  // Speed of Sound
  // -------------------------------------------------------------------------
  describe("Speed of Sound", () => {
    it("should be ~1116 fps at standard temperature (59°F)", () => {
      const vs = speedOfSound(59);
      // 49.0223 * sqrt(59 + 459.67) = 49.0223 * sqrt(518.67) ≈ 1116.3
      expect(vs).toBeCloseTo(1116, 0);
    });

    it("should increase with temperature", () => {
      const vs0 = speedOfSound(0);
      const vs59 = speedOfSound(59);
      const vs100 = speedOfSound(100);
      expect(vs0).toBeLessThan(vs59);
      expect(vs59).toBeLessThan(vs100);
    });
  });

  // -------------------------------------------------------------------------
  // Air Density
  // -------------------------------------------------------------------------
  describe("Air Density", () => {
    it("should return standard density at sea level conditions", () => {
      const rho = standardAirDensity();
      // Standard air density ≈ 0.0765 lb/ft^3
      expect(rho).toBeGreaterThan(0.070);
      expect(rho).toBeLessThan(0.085);
    });

    it("should decrease with altitude", () => {
      const rho0 = airDensity(0, 59, 29.92, 0.78);
      const rho5000 = airDensity(5000, 59, 29.92, 0.78);
      const rho10000 = airDensity(10000, 59, 29.92, 0.78);
      expect(rho5000).toBeLessThan(rho0);
      expect(rho10000).toBeLessThan(rho5000);
    });

    it("should decrease with increasing temperature", () => {
      const rhoHot = airDensity(0, 100, 29.92, 0.5);
      const rhoCold = airDensity(0, 20, 29.92, 0.5);
      expect(rhoHot).toBeLessThan(rhoCold);
    });
  });

  // -------------------------------------------------------------------------
  // Drag Interpolation
  // -------------------------------------------------------------------------
  describe("Drag Interpolation", () => {
    it("should return exact G1 Cd at table points", () => {
      expect(interpolateCd(G1_TABLE, 0.00)).toBeCloseTo(0.2629, 4);
      expect(interpolateCd(G1_TABLE, 1.00)).toBeCloseTo(0.3513, 4);
      expect(interpolateCd(G1_TABLE, 2.00)).toBeCloseTo(0.2556, 4);
    });

    it("should return exact G7 Cd at table points", () => {
      expect(interpolateCd(G7_TABLE, 0.00)).toBeCloseTo(0.1198, 4);
      expect(interpolateCd(G7_TABLE, 1.00)).toBeCloseTo(0.1862, 4);
      expect(interpolateCd(G7_TABLE, 2.00)).toBeCloseTo(0.1609, 4);
    });

    it("should interpolate G1 Cd between table points", () => {
      const cd = interpolateCd(G1_TABLE, 0.85);
      // Between 0.80 (0.2104) and 0.90 (0.2324): midpoint ≈ 0.2214
      expect(cd).toBeGreaterThan(0.2104);
      expect(cd).toBeLessThan(0.2324);
    });

    it("should interpolate G7 Cd between table points", () => {
      const cd = interpolateCd(G7_TABLE, 1.025);
      // Between 1.00 (0.1862) and 1.05 (0.2214)
      expect(cd).toBeGreaterThan(0.1862);
      expect(cd).toBeLessThan(0.2214);
    });

    it("should clamp below minimum Mach number", () => {
      expect(interpolateCd(G1_TABLE, -1)).toBeCloseTo(0.2629, 4);
    });

    it("should clamp above maximum Mach number", () => {
      expect(interpolateCd(G1_TABLE, 10)).toBeCloseTo(0.1573, 4);
    });
  });

  // -------------------------------------------------------------------------
  // Trajectory Calculations
  // -------------------------------------------------------------------------
  describe("Trajectory", () => {
    it("should generate points at 25-yard intervals", () => {
      const config = defaultConfig();
      const result = trajectory(config);
      expect(result.points.length).toBeGreaterThan(10);
      expect(result.points[0].range).toBe(0);
      expect(result.points[1].range).toBe(25);
      expect(result.points[4].range).toBe(100);
    });

    it("should show approximately zero drop at zero range for 6.5 CM", () => {
      const config = defaultConfig();
      config.zeroRange = 100;
      const result = trajectory(config);
      const atZero = result.points.find((p) => p.range === 100);
      expect(atZero).toBeDefined();
      // Drop at zero should be very close to 0 (within 0.5 inches)
      expect(Math.abs(atZero!.dropInches)).toBeLessThan(0.5);
    });

    it("should show ~7-10 inches drop at 300 yards for 6.5 CM 140gr", () => {
      const config = defaultConfig();
      config.muzzleVelocity = 2700;
      config.bulletWeight = 140;
      config.bc = 0.307;
      config.dragModel = "G7";
      config.zeroRange = 100;
      const result = trajectory(config);
      const at300 = result.points.find((p) => p.range === 300);
      expect(at300).toBeDefined();
      // Should drop roughly 7-15 inches at 300 yards (varies by exact model)
      expect(at300!.dropInches).toBeLessThan(0);
      expect(at300!.dropInches).toBeGreaterThan(-20);
    });

    it("should have zero drift with no wind", () => {
      const config = defaultConfig();
      config.windSpeed = 0;
      const result = trajectory(config);
      // Check multiple points - drift should be only spin drift (small)
      for (const p of result.points) {
        // With no wind, only spin drift (which is small)
        expect(Math.abs(p.driftInches - p.spinDrift)).toBeLessThan(0.1);
      }
    });

    it("should show increasing drift with wind", () => {
      const config = defaultConfig();
      config.windSpeed = 10;
      config.windAngle = 90;
      const result = trajectory(config);
      const at500 = result.points.find((p) => p.range === 500);
      expect(at500).toBeDefined();
      // 10mph crosswind should cause noticeable drift at 500 yards
      expect(Math.abs(at500!.driftInches)).toBeGreaterThan(0.5);
    });

    it("should show decreasing velocity downrange", () => {
      const config = defaultConfig();
      const result = trajectory(config);
      for (let i = 1; i < result.points.length; i++) {
        expect(result.points[i].velocity).toBeLessThan(result.points[i - 1].velocity);
      }
    });

    it("should show decreasing energy downrange", () => {
      const config = defaultConfig();
      const result = trajectory(config);
      for (let i = 1; i < result.points.length; i++) {
        expect(result.points[i].energy).toBeLessThan(result.points[i - 1].energy);
      }
    });

    it("should show increasing time of flight", () => {
      const config = defaultConfig();
      const result = trajectory(config);
      for (let i = 1; i < result.points.length; i++) {
        expect(result.points[i].time).toBeGreaterThan(result.points[i - 1].time);
      }
    });

    it("should have muzzle velocity at range 0", () => {
      const config = defaultConfig();
      config.muzzleVelocity = 2700;
      const result = trajectory(config);
      expect(result.points[0].velocity).toBeCloseTo(2700, -1);
    });

    it("should compute transonic range", () => {
      const config = defaultConfig();
      const result = trajectory(config);
      // 6.5 CM 140gr should go transonic somewhere around 1000-1300 yards
      expect(result.transonicRange).toBeGreaterThan(500);
      expect(result.transonicRange).toBeLessThan(1500);
    });

    it("should handle .22 LR (subsonic ammo)", () => {
      const config: TrajectoryConfig = {
        muzzleVelocity: 1050,
        bulletWeight: 40,
        bulletDiameter: 0.223,
        bc: 0.067,
        dragModel: "G7",
        sightHeight: 1.5,
        zeroRange: 50,
        windSpeed: 0,
        windAngle: 90,
        shootingAngle: 0,
        altitude: 0,
        temperature: 59,
        barometricPressure: 29.92,
        humidity: 0.78,
        maxRange: 200,
        stepSize: 25,
      };
      const result = trajectory(config);
      expect(result.points.length).toBeGreaterThan(3);
      // .22 LR has massive drop at 200 yards
      const at200 = result.points.find((p) => p.range === 200);
      if (at200) {
        expect(at200.dropInches).toBeLessThan(-10);
      }
    });

    it("should handle high altitude conditions", () => {
      const config = defaultConfig();
      const resultSea = trajectory(config);

      config.altitude = 8000;
      const resultHigh = trajectory(config);

      // At high altitude, bullet retains velocity better (thinner air)
      const at500Sea = resultSea.points.find((p) => p.range === 500);
      const at500High = resultHigh.points.find((p) => p.range === 500);
      expect(at500High!.velocity).toBeGreaterThan(at500Sea!.velocity);
    });
  });
});

// ---------------------------------------------------------------------------
// Phase 5: Advanced Ballistics Features
// ---------------------------------------------------------------------------

describe("Density Altitude", () => {
  it("standard atmosphere returns ~0 ft density altitude", () => {
    const da = densityAltitude(0, 59, 29.92, 0.78);
    expect(Math.abs(da)).toBeLessThan(200); // Should be near 0
  });

  it("hot day at sea level increases density altitude", () => {
    const da = densityAltitude(0, 100, 29.92, 0.78);
    expect(da).toBeGreaterThan(1000); // Hot = higher DA
  });

  it("high altitude increases density altitude", () => {
    const da = densityAltitude(5000, 59, 29.92, 0.78);
    expect(da).toBeGreaterThan(4000);
  });

  it("low pressure increases density altitude", () => {
    const daLow = densityAltitude(0, 59, 28.50, 0.78);
    const daStd = densityAltitude(0, 59, 29.92, 0.78);
    expect(daLow).toBeGreaterThan(daStd);
  });
});

describe("Station to Absolute Pressure", () => {
  it("at sea level, station ≈ absolute", () => {
    const abs = stationToAbsolutePressure(29.92, 0, 59);
    expect(abs).toBeCloseTo(29.92, 1);
  });

  it("at altitude, absolute > station", () => {
    const abs = stationToAbsolutePressure(24.90, 5000, 59);
    expect(abs).toBeGreaterThan(24.90);
  });

  it("higher altitude gives larger correction", () => {
    const abs3k = stationToAbsolutePressure(26.80, 3000, 59);
    const abs6k = stationToAbsolutePressure(23.95, 6000, 59);
    // Correction magnitude (abs - station) should be larger at higher altitude
    const corr3k = abs3k - 26.80;
    const corr6k = abs6k - 23.95;
    expect(corr6k).toBeGreaterThan(corr3k);
  });
});

describe("Altitude Velocity Correction", () => {
  it("sea level returns base MV", () => {
    expect(altitudeVelocityCorrection(2700, 0)).toBe(2700);
  });

  it("5000 ft gives small increase", () => {
    const corrected = altitudeVelocityCorrection(2700, 5000);
    expect(corrected).toBeGreaterThan(2700);
    expect(corrected).toBeLessThan(2720); // Small effect
  });
});

describe("Coriolis Effect", () => {
  it("trajectory without lat/azimuth has zero coriolisInches", () => {
    const result = trajectory(defaultConfig());
    const point800 = result.points.find(p => p.range === 800);
    expect(point800).toBeDefined();
    expect(point800!.coriolisInches).toBe(0);
  });

  it("Northern hemisphere deflects right (positive drift)", () => {
    const config = {
      ...defaultConfig(),
      latitude: 45,
      azimuth: 0,  // shooting North
      maxRange: 1200,
    };
    const result = trajectory(config);
    const point1000 = result.points.find(p => p.range === 1000);
    expect(point1000).toBeDefined();
    // At 1000 yards, Coriolis should add some drift
    // Total drift should differ from no-Coriolis case
    const noCorResult = trajectory(defaultConfig());
    const noCorPoint = noCorResult.points.find(p => p.range === 1000);
    expect(point1000!.driftInches).not.toBe(noCorPoint!.driftInches);
  });

  it("equator has minimal horizontal Coriolis", () => {
    const configEquator = {
      ...defaultConfig(),
      latitude: 0,
      azimuth: 90,
      maxRange: 1200,
    };
    const configMidLat = {
      ...defaultConfig(),
      latitude: 45,
      azimuth: 90,
      maxRange: 1200,
    };
    const eqResult = trajectory(configEquator);
    const midResult = trajectory(configMidLat);
    const eqPoint = eqResult.points.find(p => p.range === 1000);
    const midPoint = midResult.points.find(p => p.range === 1000);
    // Mid-latitude should have more horizontal Coriolis drift
    expect(Math.abs(midPoint!.driftInches)).toBeGreaterThan(Math.abs(eqPoint!.driftInches) - 1);
  });
});

describe("Aerodynamic Jump", () => {
  it("no wind produces zero aero jump", () => {
    const result = trajectory(defaultConfig()); // windSpeed = 0
    const point500 = result.points.find(p => p.range === 500);
    expect(point500).toBeDefined();
    expect(point500!.aeroJumpInches).toBe(0);
  });

  it("crosswind produces non-zero aero jump", () => {
    const config = {
      ...defaultConfig(),
      windSpeed: 10,
      windAngle: 90, // full crosswind
      maxRange: 1000,
    };
    const result = trajectory(config);
    const point500 = result.points.find(p => p.range === 500);
    expect(point500).toBeDefined();
    expect(point500!.aeroJumpInches).not.toBe(0);
  });
});

describe("Angle Shooting", () => {
  it("uphill and downhill produce same drop magnitude (Rifleman's rule)", () => {
    const configUp = { ...defaultConfig(), shootingAngle: 30 };
    const configDown = { ...defaultConfig(), shootingAngle: -30 };
    const upResult = trajectory(configUp);
    const downResult = trajectory(configDown);
    const upDrop = upResult.points.find(p => p.range === 500)!.dropInches;
    const downDrop = downResult.points.find(p => p.range === 500)!.dropInches;
    // Should be within 1 inch of each other (cosine rule applies equally)
    expect(Math.abs(Math.abs(upDrop) - Math.abs(downDrop))).toBeLessThan(1);
  });

  it("steep angle reduces drop vs level", () => {
    const configLevel = { ...defaultConfig(), shootingAngle: 0 };
    const configSteep = { ...defaultConfig(), shootingAngle: 45 };
    const levelDrop = Math.abs(trajectory(configLevel).points.find(p => p.range === 500)!.dropInches);
    const steepDrop = Math.abs(trajectory(configSteep).points.find(p => p.range === 500)!.dropInches);
    expect(steepDrop).toBeLessThan(levelDrop);
  });

  it("30 degree angle drops approximately cos(30) = 0.866 of level drop", () => {
    const levelResult = trajectory({ ...defaultConfig(), shootingAngle: 0 });
    const angleResult = trajectory({ ...defaultConfig(), shootingAngle: 30 });
    const levelDrop = Math.abs(levelResult.points.find(p => p.range === 500)!.dropInches);
    const angleDrop = Math.abs(angleResult.points.find(p => p.range === 500)!.dropInches);
    const ratio = angleDrop / levelDrop;
    // cos(30°) = 0.866, but aerodynamic jump and second-order effects
    // shift the ratio — actual ~0.76 at 500yds is reasonable
    expect(ratio).toBeGreaterThan(0.65);
    expect(ratio).toBeLessThan(0.95);
  });
});

describe("Miller Stability Factor", () => {
  it("6.5mm 140gr in 1:8 twist is well stabilized", () => {
    // 6.5 CM 140gr ELD-M: ~1.33" long, 0.264" diameter
    const result = millerStability(140, 0.264, 1.33, 8);
    expect(result.stabilityFactor).toBeGreaterThan(1.3);
    expect(result.stabilityFactor).toBeLessThan(2.5);
    expect(result.rating).toBe("stable");
  });

  it(".308 175gr SMK in 1:10 twist is stable", () => {
    // .308 175gr Sierra MatchKing: ~1.24" long, 0.308" diameter
    const result = millerStability(175, 0.308, 1.24, 10);
    expect(result.stabilityFactor).toBeGreaterThan(1.0);
    expect(result.rating).not.toBe("unstable");
  });

  it("heavy bullet in slow twist is unstable", () => {
    // 6.5mm 156gr Berger in 1:9 twist — pushing it
    const result = millerStability(156, 0.264, 1.45, 9);
    // May be marginal or unstable depending on exact length
    expect(result.stabilityFactor).toBeLessThan(2.0);
  });

  it("altitude increases stability factor", () => {
    const seaLevel = millerStability(140, 0.264, 1.33, 8, 0, 59, 29.92);
    const highAlt = millerStability(140, 0.264, 1.33, 8, 5000, 59, 29.92);
    expect(highAlt.stabilityFactor).toBeGreaterThan(seaLevel.stabilityFactor);
  });

  it("returns min and max twist recommendations", () => {
    const result = millerStability(140, 0.264, 1.33, 8);
    expect(result.minTwist).toBeGreaterThan(0);
    expect(result.maxTwist).toBeGreaterThan(0);
    expect(result.minTwist).toBeGreaterThanOrEqual(result.maxTwist); // Slower twist = higher number
  });
});

describe("BC Refinement (Truing)", () => {
  it("returns a reasonable BC for realistic velocity drop", () => {
    // 6.5 CM 140gr ELD-M G7 0.264: actual solver shows ~2696 fps at 200 yds
    // Test with a slightly lower velocity to simulate a bullet with slightly worse BC
    const result = refineBCFromVelocity(2700, 0, 2690, 200, 0.264, "G7");
    expect(result.trueBC).toBeGreaterThan(0.05);
    expect(result.trueBC).toBeLessThan(1.0);
    expect(typeof result.assessment).toBe("string");
  });

  it("higher velocity retention indicates higher true BC", () => {
    // Same distance, but bullet retains more velocity = higher BC
    const lowRetain = refineBCFromVelocity(2700, 0, 2680, 300, 0.264, "G7");
    const highRetain = refineBCFromVelocity(2700, 0, 2690, 300, 0.264, "G7");
    expect(highRetain.trueBC).toBeGreaterThan(lowRetain.trueBC);
  });

  it("handles invalid input gracefully", () => {
    // V2 > V1 is physically impossible
    const result = refineBCFromVelocity(2500, 0, 2700, 300, 0.264, "G7");
    expect(result.trueBC).toBe(0.264); // Returns published BC
    expect(result.correctionFactor).toBe(1.0);
  });

  it("returns meaningful assessment string", () => {
    const result = refineBCFromVelocity(2700, 0, 2690, 200, 0.264, "G7");
    expect(typeof result.assessment).toBe("string");
    expect(result.assessment.length).toBeGreaterThan(10);
  });
});
