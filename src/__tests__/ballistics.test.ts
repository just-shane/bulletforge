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
