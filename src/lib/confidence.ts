/**
 * Confidence scoring for load calibration data.
 *
 * Computes a velocity uncertainty band (± X fps) that tightens as more
 * chrono data accumulates. Uses pooled standard deviation across sessions
 * and a t-distribution approximation for small sample sizes.
 */

// ─── Student's t critical values (two-tailed, 95% confidence) ───────
// For df = 1..30, then 40, 60, 120, ∞
const T_TABLE_95: [number, number][] = [
  [1, 12.706], [2, 4.303], [3, 3.182], [4, 2.776], [5, 2.571],
  [6, 2.447], [7, 2.365], [8, 2.306], [9, 2.262], [10, 2.228],
  [11, 2.201], [12, 2.179], [13, 2.160], [14, 2.145], [15, 2.131],
  [16, 2.120], [17, 2.110], [18, 2.101], [19, 2.093], [20, 2.086],
  [25, 2.060], [30, 2.042], [40, 2.021], [60, 2.000], [120, 1.980],
  [Infinity, 1.960],
];

function tCritical95(df: number): number {
  if (df <= 0) return 12.706;
  for (let i = 0; i < T_TABLE_95.length; i++) {
    if (df <= T_TABLE_95[i][0]) {
      if (i === 0) return T_TABLE_95[0][1];
      // Interpolate
      const [df0, t0] = T_TABLE_95[i - 1];
      const [df1, t1] = T_TABLE_95[i];
      const frac = (df - df0) / (df1 - df0);
      return t0 + frac * (t1 - t0);
    }
  }
  return 1.96; // Normal distribution limit
}

// ─── Interfaces ──────────────────────────────────────────────────────

export interface ConfidenceResult {
  /** Uncertainty band: mean velocity ± this value (fps) */
  uncertaintyFps: number;
  /** Confidence level label */
  level: "Low" | "Moderate" | "Good" | "High" | "Very High";
  /** Numeric confidence score 0-100 */
  score: number;
  /** Color for display (CSS variable) */
  color: string;
  /** Human-readable description */
  description: string;
  /** Total rounds contributing to the estimate */
  totalRounds: number;
  /** Number of independent sessions */
  sessionCount: number;
  /** Pooled standard deviation across all sessions */
  pooledSD: number;
  /** Degrees of freedom used for t-distribution */
  degreesOfFreedom: number;
}

// ─── Main Function ───────────────────────────────────────────────────

/**
 * Compute confidence scoring for a load's velocity data.
 *
 * @param velocitySets - Array of velocity arrays from each chrono session
 * @param sdHistory - SD values from each session (for consistency check)
 * @returns Confidence result with uncertainty band and scoring
 */
export function computeConfidence(
  velocitySets: number[][],
  sdHistory: number[],
): ConfidenceResult | null {
  const totalRounds = velocitySets.reduce((sum, v) => sum + v.length, 0);
  const sessionCount = velocitySets.length;

  if (totalRounds < 3 || sessionCount < 1) return null;

  // Pool all velocities for grand mean
  const allVelocities = velocitySets.flat();
  const grandMean = allVelocities.reduce((a, b) => a + b, 0) / allVelocities.length;

  // Pooled standard deviation (treating all shots as one sample)
  const variance = allVelocities.reduce((sum, v) => sum + (v - grandMean) ** 2, 0) / (totalRounds - 1);
  const pooledSD = Math.sqrt(variance);

  // Degrees of freedom
  const df = totalRounds - 1;

  // t-critical for 95% confidence
  const t = tCritical95(df);

  // Standard error of the mean
  const sem = pooledSD / Math.sqrt(totalRounds);

  // Uncertainty band (95% confidence interval for the true mean)
  const uncertaintyFps = Math.round(t * sem * 10) / 10;

  // SD consistency check: coefficient of variation of SD values
  let sdConsistency = 1.0; // Perfect if only 1 session
  if (sdHistory.length >= 2) {
    const avgSD = sdHistory.reduce((a, b) => a + b, 0) / sdHistory.length;
    if (avgSD > 0) {
      const sdOfSDs = Math.sqrt(
        sdHistory.reduce((sum, s) => sum + (s - avgSD) ** 2, 0) / sdHistory.length,
      );
      sdConsistency = Math.max(0, 1 - sdOfSDs / avgSD); // 1 = perfectly consistent, 0 = wild variation
    }
  }

  // Confidence score: weighted combination
  // 40% sample size, 30% session diversity, 30% SD consistency
  const sampleScore = Math.min(100, (totalRounds / 50) * 100);       // 50 rounds = max
  const sessionScore = Math.min(100, (sessionCount / 5) * 100);      // 5 sessions = max
  const consistencyScore = sdConsistency * 100;
  const score = Math.round(sampleScore * 0.4 + sessionScore * 0.3 + consistencyScore * 0.3);

  // Level and color
  let level: ConfidenceResult["level"];
  let color: string;
  if (score >= 85) {
    level = "Very High";
    color = "var(--c-success)";
  } else if (score >= 70) {
    level = "High";
    color = "var(--c-success)";
  } else if (score >= 50) {
    level = "Good";
    color = "var(--c-warn)";
  } else if (score >= 30) {
    level = "Moderate";
    color = "var(--c-warn)";
  } else {
    level = "Low";
    color = "var(--c-error, #e55)";
  }

  // Description
  let description: string;
  if (uncertaintyFps <= 2) {
    description = `True mean velocity is within ±${uncertaintyFps} fps (95% CI). Excellent data — DOPE cards can be trusted.`;
  } else if (uncertaintyFps <= 5) {
    description = `Uncertainty band: ±${uncertaintyFps} fps. Good data for reliable trajectory predictions.`;
  } else if (uncertaintyFps <= 10) {
    description = `Uncertainty band: ±${uncertaintyFps} fps. Adequate for hunting, more data needed for competition use.`;
  } else if (uncertaintyFps <= 20) {
    description = `Uncertainty band: ±${uncertaintyFps} fps. Need more chrono sessions to narrow this down.`;
  } else {
    description = `Wide uncertainty: ±${uncertaintyFps} fps. Insufficient data — collect more chrono sessions before trusting trajectory predictions.`;
  }

  return {
    uncertaintyFps,
    level,
    score,
    color,
    description,
    totalRounds,
    sessionCount,
    pooledSD: Math.round(pooledSD * 10) / 10,
    degreesOfFreedom: df,
  };
}
