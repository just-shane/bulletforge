import { describe, it, expect } from "vitest";
import {
  generateLadderTest,
  analyzeShotString,
  generateSeatingDepthTest,
  checkMagazineLength,
  analyzeOCW,
  createLoadRecipe,
  createRangeSession,
  PRIMERS,
  type OCWResult,
} from "../lib/load-development";

// ─── ES/SD Calculator ───────────────────────────────────────────────────────

describe("ES/SD Calculator", () => {
  const velocities = [2700, 2710, 2695, 2705, 2690];

  it("calculates correct average for known velocities", () => {
    const result = analyzeShotString(velocities);
    expect(result.average).toBeCloseTo(2700, 0);
  });

  it("calculates ES as max minus min", () => {
    const result = analyzeShotString(velocities);
    expect(result.extremeSpread).toBe(2710 - 2690);
  });

  it("SD is less than ES", () => {
    const result = analyzeShotString(velocities);
    expect(result.standardDeviation).toBeLessThan(result.extremeSpread);
    expect(result.standardDeviation).toBeGreaterThan(0);
  });

  it("single shot returns ES=0 and SD=0", () => {
    const result = analyzeShotString([2700]);
    expect(result.extremeSpread).toBe(0);
    expect(result.standardDeviation).toBe(0);
  });

  it("empty array returns count=0", () => {
    const result = analyzeShotString([]);
    expect(result.count).toBe(0);
  });
});

// ─── Ladder Test Planner ────────────────────────────────────────────────────

describe("Ladder Test Planner", () => {
  it("generates correct number of steps for 6.5 CM / H4350 / 140gr", () => {
    const plan = generateLadderTest("6.5 CM", "H4350", 140, 0.264, 24);
    expect(plan).not.toBeNull();
    expect(plan!.steps.length).toBeGreaterThanOrEqual(8);
  });

  it("each step has increasing charge weight", () => {
    const plan = generateLadderTest("6.5 CM", "H4350", 140, 0.264, 24);
    expect(plan).not.toBeNull();
    for (let i = 1; i < plan!.steps.length; i++) {
      expect(plan!.steps[i].chargeWeight).toBeGreaterThan(
        plan!.steps[i - 1].chargeWeight,
      );
    }
  });

  it("first step charge is at or above cartridge minimum", () => {
    const plan = generateLadderTest("6.5 CM", "H4350", 140, 0.264, 24);
    expect(plan).not.toBeNull();
    expect(plan!.steps[0].chargeWeight).toBeGreaterThan(30);
  });

  it("last step has overPressure property", () => {
    const plan = generateLadderTest("6.5 CM", "H4350", 140, 0.264, 24);
    expect(plan).not.toBeNull();
    const lastStep = plan!.steps[plan!.steps.length - 1];
    expect(lastStep).toHaveProperty("overPressure");
  });
});

// ─── Seating Depth ──────────────────────────────────────────────────────────

describe("Seating Depth", () => {
  it("default plan has 8 steps", () => {
    const plan = generateSeatingDepthTest(2.800);
    expect(plan.steps).toHaveLength(8);
  });

  it("each step OAL is shorter than previous (more jump = shorter OAL)", () => {
    const plan = generateSeatingDepthTest(2.800);
    for (let i = 1; i < plan.steps.length; i++) {
      expect(plan.steps[i].oal).toBeLessThan(plan.steps[i - 1].oal);
    }
  });

  it("magazine check returns false when OAL exceeds max", () => {
    expect(checkMagazineLength(2.900, 2.850)).toBe(false);
    expect(checkMagazineLength(2.800, 2.850)).toBe(true);
  });
});

// ─── OCW Analysis ───────────────────────────────────────────────────────────

describe("OCW Analysis", () => {
  const mockData: OCWResult[] = [
    { chargeWeight: 41.0, groupSize: 0.95, velocity: 2680, es: 18, sd: 8, poiShift: { x: 0.2, y: 0.3 } },
    { chargeWeight: 41.5, groupSize: 0.42, velocity: 2710, es: 12, sd: 5, poiShift: { x: 0.1, y: 0.1 } },
    { chargeWeight: 42.0, groupSize: 0.78, velocity: 2740, es: 15, sd: 7, poiShift: { x: 0.3, y: 0.2 } },
    { chargeWeight: 42.5, groupSize: 1.10, velocity: 2770, es: 22, sd: 11, poiShift: { x: 0.5, y: 0.4 } },
  ];

  it("finds optimal charge from mock data (smallest group wins)", () => {
    const analysis = analyzeOCW(mockData);
    expect(analysis.optimalCharge).toBeCloseTo(41.5, 1);
  });

  it("returns a recommendation string", () => {
    const analysis = analyzeOCW(mockData);
    expect(typeof analysis.recommendation).toBe("string");
    expect(analysis.recommendation.length).toBeGreaterThan(0);
  });

  it("handles single data point without error", () => {
    const single: OCWResult[] = [
      { chargeWeight: 41.0, groupSize: 0.80, velocity: 2680, es: 14, sd: 6, poiShift: { x: 0.1, y: 0.1 } },
    ];
    const analysis = analyzeOCW(single);
    expect(analysis.optimalCharge).toBeCloseTo(41.0, 1);
  });
});

// ─── Load Recipe ────────────────────────────────────────────────────────────

describe("Load Recipe", () => {
  it("creates recipe with generated ID", () => {
    const recipe = createLoadRecipe({
      cartridgeShortName: "6.5 CM",
      powderName: "H4350",
      chargeWeight: 41.5,
      bulletName: "ELD-M",
      primerType: "CCI BR-2",
      oal: 2.800,
    });
    expect(recipe.id).toBeDefined();
    expect(typeof recipe.id).toBe("string");
    expect(recipe.id.length).toBeGreaterThan(0);
  });

  it("timestamps are set", () => {
    const recipe = createLoadRecipe({
      cartridgeShortName: "6.5 CM",
      powderName: "H4350",
      chargeWeight: 41.5,
    });
    expect(recipe.createdAt).toBeDefined();
    expect(recipe.updatedAt).toBeDefined();
    expect(recipe.createdAt).toBeGreaterThan(0);
  });

  it("createRangeSession generates unique ID", () => {
    const session1 = createRangeSession({ date: Date.now(), location: "Range A" });
    const session2 = createRangeSession({ date: Date.now(), location: "Range A" });
    expect(session1.id).toBeDefined();
    expect(session2.id).toBeDefined();
    expect(session1.id).not.toBe(session2.id);
  });
});

// ─── Primer Database ────────────────────────────────────────────────────────

describe("Primer Database", () => {
  it("PRIMERS has at least 15 entries", () => {
    expect(Array.isArray(PRIMERS)).toBe(true);
    expect(PRIMERS.length).toBeGreaterThanOrEqual(15);
  });

  it("each primer has name, manufacturer, and type", () => {
    for (const primer of PRIMERS) {
      expect(primer).toHaveProperty("name");
      expect(primer).toHaveProperty("manufacturer");
      expect(primer).toHaveProperty("type");
      expect(typeof primer.name).toBe("string");
      expect(typeof primer.manufacturer).toBe("string");
      expect(typeof primer.type).toBe("string");
    }
  });
});
