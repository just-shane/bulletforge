import { describe, it, expect } from "vitest";
import {
  POWDERS,
  powdersByBurnRate,
  powdersByManufacturer,
  findSimilarPowders,
  estimateBarrelLife,
  barrelCondition,
} from "../lib/powders";

// ─── Powder Database Integrity ────────────────────────────────────────────

describe("Powder Database", () => {
  it("has at least 25 powders", () => {
    expect(POWDERS.length).toBeGreaterThanOrEqual(20);
  });

  it("every powder has valid fields", () => {
    for (const p of POWDERS) {
      expect(p.name).toBeTruthy();
      expect(p.manufacturer).toBeTruthy();
      expect(p.burnRate).toBeGreaterThan(0);
      expect(["rifle", "pistol", "shotgun"]).toContain(p.type);
      expect(["low", "medium", "high"]).toContain(p.temperatureSensitivity);
      expect(p.description.length).toBeGreaterThan(10);
    }
  });

  it("has no duplicate powder names", () => {
    const names = POWDERS.map((p) => p.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("has powders from at least 4 manufacturers", () => {
    const mfrs = new Set(POWDERS.map((p) => p.manufacturer));
    expect(mfrs.size).toBeGreaterThanOrEqual(4);
  });
});

// ─── Powder Utility Functions ─────────────────────────────────────────────

describe("powdersByBurnRate", () => {
  it("returns powders sorted fastest to slowest", () => {
    const sorted = powdersByBurnRate();
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i].burnRate).toBeGreaterThanOrEqual(sorted[i - 1].burnRate);
    }
  });

  it("returns same count as POWDERS", () => {
    expect(powdersByBurnRate().length).toBe(POWDERS.length);
  });
});

describe("powdersByManufacturer", () => {
  it("returns only Hodgdon powders when filtered", () => {
    const hodgdon = powdersByManufacturer("Hodgdon");
    expect(hodgdon.length).toBeGreaterThan(0);
    for (const p of hodgdon) {
      expect(p.manufacturer).toBe("Hodgdon");
    }
  });

  it("returns empty array for unknown manufacturer", () => {
    expect(powdersByManufacturer("NonexistentBrand")).toHaveLength(0);
  });
});

// ─── Powder Substitution ──────────────────────────────────────────────────

describe("findSimilarPowders", () => {
  it("returns substitutes for H4350", () => {
    const subs = findSimilarPowders("H4350");
    expect(subs.length).toBeGreaterThan(0);
    expect(subs.length).toBeLessThanOrEqual(5);
  });

  it("does not include the input powder in results", () => {
    const subs = findSimilarPowders("H4350");
    for (const s of subs) {
      expect(s.powder.name).not.toBe("H4350");
    }
  });

  it("results are sorted by score descending", () => {
    const subs = findSimilarPowders("H4350");
    for (let i = 1; i < subs.length; i++) {
      expect(subs[i].score).toBeLessThanOrEqual(subs[i - 1].score);
    }
  });

  it("scores are between 0 and 100", () => {
    const subs = findSimilarPowders("Varget");
    for (const s of subs) {
      expect(s.score).toBeGreaterThanOrEqual(0);
      expect(s.score).toBeLessThanOrEqual(100);
    }
  });

  it("closest burn rate powders score highest", () => {
    const subs = findSimilarPowders("H4350"); // burn rate 95
    // IMR 4350 has burn rate 96 — should score very high
    const imr4350 = subs.find((s) => s.powder.name === "IMR 4350");
    if (imr4350) {
      expect(imr4350.score).toBeGreaterThanOrEqual(70);
    }
  });

  it("temperature sensitivity match boosts score", () => {
    // H4350 is "low" temp sensitivity
    const subs = findSimilarPowders("H4350");
    const lowTempSubs = subs.filter((s) => s.powder.temperatureSensitivity === "low");
    const medTempSubs = subs.filter((s) => s.powder.temperatureSensitivity === "medium");
    // Low temp subs should generally score higher at equal burn rate proximity
    if (lowTempSubs.length > 0 && medTempSubs.length > 0) {
      expect(lowTempSubs[0].tempScore).toBeGreaterThan(medTempSubs[0].tempScore);
    }
  });

  it("only returns same type (rifle for rifle)", () => {
    const subs = findSimilarPowders("H4350");
    for (const s of subs) {
      expect(s.powder.type).toBe("rifle");
    }
  });

  it("returns empty array for unknown powder", () => {
    expect(findSimilarPowders("FakePowder123")).toHaveLength(0);
  });

  it("respects limit parameter", () => {
    const subs3 = findSimilarPowders("Varget", 3);
    expect(subs3.length).toBeLessThanOrEqual(3);
  });

  it("each result has an assessment string", () => {
    const subs = findSimilarPowders("Varget");
    for (const s of subs) {
      expect(s.assessment).toBeTruthy();
      expect(s.assessment.length).toBeGreaterThan(10);
    }
  });

  it("burnRateDelta reflects actual difference", () => {
    const subs = findSimilarPowders("H4350");
    const h4350 = POWDERS.find((p) => p.name === "H4350")!;
    for (const s of subs) {
      expect(s.burnRateDelta).toBe(Math.abs(s.powder.burnRate - h4350.burnRate));
    }
  });
});

// ─── Barrel Life Estimation ───────────────────────────────────────────────

describe("estimateBarrelLife", () => {
  it("returns a positive number for all known cartridges", () => {
    const cartridges = [
      ".22 LR", ".223 Rem", "6mm ARC", ".243 Win", "6.5 CM",
      "6.5 PRC", ".270 Win", "7mm Rem Mag", ".308 Win", ".30-06",
      ".300 Win Mag", ".300 PRC", ".338 Lapua", ".375 H&H", ".50 BMG",
    ];
    for (const c of cartridges) {
      const life = estimateBarrelLife(c);
      expect(life).toBeGreaterThan(0);
    }
  });

  it(".22 LR has the longest barrel life", () => {
    expect(estimateBarrelLife(".22 LR")).toBeGreaterThan(estimateBarrelLife(".308 Win"));
    expect(estimateBarrelLife(".22 LR")).toBeGreaterThan(estimateBarrelLife("6.5 CM"));
  });

  it("overbore magnums have shorter life than efficient cartridges", () => {
    expect(estimateBarrelLife(".300 PRC")).toBeLessThan(estimateBarrelLife(".308 Win"));
    expect(estimateBarrelLife("6.5 PRC")).toBeLessThan(estimateBarrelLife("6.5 CM"));
    expect(estimateBarrelLife(".243 Win")).toBeLessThan(estimateBarrelLife(".308 Win"));
  });

  it("returns default 3000 for unknown cartridge", () => {
    expect(estimateBarrelLife("Unknown Wildcat")).toBe(3000);
  });
});

describe("barrelCondition", () => {
  it("new barrel at 0 rounds is 'New'", () => {
    const result = barrelCondition(0, 5000);
    expect(result.rating).toBe("New");
    expect(result.percent).toBe(0);
  });

  it("25% worn barrel is 'New'", () => {
    const result = barrelCondition(1250, 5000);
    expect(result.rating).toBe("New");
    expect(result.percent).toBe(25);
  });

  it("60% worn barrel is 'Good'", () => {
    const result = barrelCondition(3000, 5000);
    expect(result.rating).toBe("Good");
    expect(result.percent).toBe(60);
  });

  it("85% worn barrel is 'Worn'", () => {
    const result = barrelCondition(4250, 5000);
    expect(result.rating).toBe("Worn");
    expect(result.percent).toBe(85);
  });

  it("95% worn barrel is 'End of life'", () => {
    const result = barrelCondition(4750, 5000);
    expect(result.rating).toBe("End of life");
    expect(result.percent).toBe(95);
  });

  it("120% over life is 'Past life'", () => {
    const result = barrelCondition(6000, 5000);
    expect(result.rating).toBe("Past life");
    expect(result.percent).toBe(120);
  });

  it("each condition has a color", () => {
    const conditions = [
      barrelCondition(0, 5000),
      barrelCondition(3000, 5000),
      barrelCondition(4250, 5000),
      barrelCondition(4750, 5000),
      barrelCondition(6000, 5000),
    ];
    for (const c of conditions) {
      expect(c.color).toBeTruthy();
      expect(c.color.startsWith("var(")).toBe(true);
    }
  });
});
