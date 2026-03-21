import { describe, it, expect } from "vitest";
import { computeConfidence } from "../lib/confidence";

// ─── Helpers ──────────────────────────────────────────────────────

function makeVelocities(avg: number, sd: number, count: number): number[] {
  // Generate a simple spread: avg ± offsets that approximate the given SD
  const vels: number[] = [];
  for (let i = 0; i < count; i++) {
    // Alternate above/below mean with controlled spread
    const offset = (i % 2 === 0 ? 1 : -1) * sd * ((i + 1) / count);
    vels.push(Math.round(avg + offset));
  }
  return vels;
}

// ─── Null / Edge Cases ────────────────────────────────────────────

describe("computeConfidence edge cases", () => {
  it("returns null with no data", () => {
    expect(computeConfidence([], [])).toBeNull();
  });

  it("returns null with fewer than 3 total rounds", () => {
    expect(computeConfidence([[2700, 2710]], [5])).toBeNull();
  });

  it("returns a result with exactly 3 rounds", () => {
    const result = computeConfidence([[2700, 2710, 2705]], [4]);
    expect(result).not.toBeNull();
  });
});

// ─── Uncertainty Band Behavior ────────────────────────────────────

describe("uncertainty band", () => {
  it("single session of 5 shots has wider band than 50 shots", () => {
    const small = computeConfidence([makeVelocities(2710, 8, 5)], [8]);
    const large = computeConfidence([makeVelocities(2710, 8, 50)], [8]);
    expect(small).not.toBeNull();
    expect(large).not.toBeNull();
    expect(small!.uncertaintyFps).toBeGreaterThan(large!.uncertaintyFps);
  });

  it("tighter SD produces tighter uncertainty band", () => {
    const tight = computeConfidence([makeVelocities(2710, 3, 10)], [3]);
    const loose = computeConfidence([makeVelocities(2710, 20, 10)], [20]);
    expect(tight).not.toBeNull();
    expect(loose).not.toBeNull();
    expect(tight!.uncertaintyFps).toBeLessThan(loose!.uncertaintyFps);
  });

  it("more sessions tighten the band", () => {
    const oneSession = computeConfidence(
      [makeVelocities(2710, 8, 10)],
      [8],
    );
    const fiveSessions = computeConfidence(
      Array.from({ length: 5 }, () => makeVelocities(2710, 8, 10)),
      [8, 7, 9, 8, 7],
    );
    expect(oneSession).not.toBeNull();
    expect(fiveSessions).not.toBeNull();
    expect(fiveSessions!.uncertaintyFps).toBeLessThan(oneSession!.uncertaintyFps);
  });

  it("uncertainty is always positive", () => {
    const result = computeConfidence([makeVelocities(2710, 5, 20)], [5]);
    expect(result!.uncertaintyFps).toBeGreaterThan(0);
  });
});

// ─── Confidence Score ─────────────────────────────────────────────

describe("confidence score", () => {
  it("score is between 0 and 100", () => {
    const result = computeConfidence([makeVelocities(2710, 8, 10)], [8]);
    expect(result!.score).toBeGreaterThanOrEqual(0);
    expect(result!.score).toBeLessThanOrEqual(100);
  });

  it("more data yields higher score", () => {
    const small = computeConfidence([makeVelocities(2710, 8, 5)], [8]);
    const large = computeConfidence(
      Array.from({ length: 5 }, () => makeVelocities(2710, 8, 10)),
      [8, 7, 9, 8, 7],
    );
    expect(large!.score).toBeGreaterThan(small!.score);
  });

  it("consistent SD history boosts score", () => {
    // Same total rounds, but one has consistent SDs and one has wild variation
    const consistent = computeConfidence(
      Array.from({ length: 3 }, () => makeVelocities(2710, 8, 10)),
      [8, 8, 8],
    );
    const inconsistent = computeConfidence(
      Array.from({ length: 3 }, () => makeVelocities(2710, 8, 10)),
      [3, 20, 5],
    );
    expect(consistent!.score).toBeGreaterThan(inconsistent!.score);
  });
});

// ─── Confidence Levels ────────────────────────────────────────────

describe("confidence levels", () => {
  it("assigns 'Low' or 'Moderate' to minimal data", () => {
    const result = computeConfidence([makeVelocities(2710, 15, 3)], [15]);
    expect(["Low", "Moderate"]).toContain(result!.level);
    expect(result!.score).toBeLessThan(50);
  });

  it("assigns higher level to abundant data", () => {
    const result = computeConfidence(
      Array.from({ length: 5 }, () => makeVelocities(2710, 5, 10)),
      [5, 5, 5, 5, 5],
    );
    expect(["High", "Very High"]).toContain(result!.level);
  });

  it("has a color string", () => {
    const result = computeConfidence([makeVelocities(2710, 8, 10)], [8]);
    expect(result!.color).toBeTruthy();
    expect(result!.color.startsWith("var(")).toBe(true);
  });

  it("has a non-empty description", () => {
    const result = computeConfidence([makeVelocities(2710, 8, 10)], [8]);
    expect(result!.description.length).toBeGreaterThan(20);
  });
});

// ─── Output Fields ────────────────────────────────────────────────

describe("output fields", () => {
  it("reports correct totalRounds", () => {
    const result = computeConfidence(
      [makeVelocities(2710, 8, 5), makeVelocities(2710, 7, 10)],
      [8, 7],
    );
    expect(result!.totalRounds).toBe(15);
  });

  it("reports correct sessionCount", () => {
    const result = computeConfidence(
      [makeVelocities(2710, 8, 5), makeVelocities(2710, 7, 10), makeVelocities(2710, 6, 8)],
      [8, 7, 6],
    );
    expect(result!.sessionCount).toBe(3);
  });

  it("pooledSD is positive", () => {
    const result = computeConfidence([makeVelocities(2710, 8, 10)], [8]);
    expect(result!.pooledSD).toBeGreaterThan(0);
  });

  it("degreesOfFreedom equals totalRounds - 1", () => {
    const result = computeConfidence(
      [makeVelocities(2710, 8, 5), makeVelocities(2710, 7, 10)],
      [8, 7],
    );
    expect(result!.degreesOfFreedom).toBe(14); // 15 - 1
  });
});
