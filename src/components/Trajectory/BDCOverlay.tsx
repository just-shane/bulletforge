import { useState, useMemo } from "react";
import { useBallisticsStore } from "../../store/store.ts";
import type { TrajectoryPoint } from "../../lib/ballistics.ts";

// ---------------------------------------------------------------------------
// BDC Reticle Data
// ---------------------------------------------------------------------------

interface BDCDot {
  label: string;
  moaFromCenter: number;
  intendedRange: number;
}

interface BDCReticle {
  name: string;
  manufacturer: string;
  referenceLoad: string;
  dots: BDCDot[];
}

const BDC_RETICLES: BDCReticle[] = [
  {
    name: "Dead-Hold BDC",
    manufacturer: "Vortex",
    referenceLoad: ".308 Win 168gr @ 2650fps",
    dots: [
      { label: "1", moaFromCenter: 3.7, intendedRange: 200 },
      { label: "2", moaFromCenter: 8.6, intendedRange: 300 },
      { label: "3", moaFromCenter: 15.2, intendedRange: 400 },
      { label: "4", moaFromCenter: 23.8, intendedRange: 500 },
    ],
  },
  {
    name: "BDC 600",
    manufacturer: "Nikon",
    referenceLoad: ".308 Win 168gr @ 2680fps",
    dots: [
      { label: "1", moaFromCenter: 3.9, intendedRange: 200 },
      { label: "2", moaFromCenter: 9.1, intendedRange: 300 },
      { label: "3", moaFromCenter: 16.0, intendedRange: 400 },
      { label: "4", moaFromCenter: 25.0, intendedRange: 500 },
      { label: "5", moaFromCenter: 36.0, intendedRange: 600 },
    ],
  },
  {
    name: "Ballistic Plex",
    manufacturer: "Burris",
    referenceLoad: ".308 Win 150gr @ 2700fps",
    dots: [
      { label: "1", moaFromCenter: 4.5, intendedRange: 200 },
      { label: "2", moaFromCenter: 10.5, intendedRange: 300 },
      { label: "3", moaFromCenter: 18.0, intendedRange: 400 },
      { label: "4", moaFromCenter: 28.0, intendedRange: 500 },
    ],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Given trajectory points and a target MOA drop value, interpolate the range
 * where the trajectory crosses that MOA. dropMOA values from the engine are
 * negative for drops below the line of sight; BDC dots are positive (below
 * center = more drop). We compare absolute values.
 */
function findRangeForMOA(
  points: TrajectoryPoint[],
  targetMOA: number,
): number | null {
  // We look for where |dropMOA| crosses targetMOA.
  // dropMOA is negative for bullet falling below LOS past zero.
  for (let i = 1; i < points.length; i++) {
    const prev = Math.abs(points[i - 1].dropMOA);
    const curr = Math.abs(points[i].dropMOA);

    if (prev <= targetMOA && curr >= targetMOA) {
      // Linear interpolation
      if (curr === prev) return points[i].range;
      const fraction = (targetMOA - prev) / (curr - prev);
      return points[i - 1].range + fraction * (points[i].range - points[i - 1].range);
    }
  }
  // If target MOA exceeds our max drop, return null
  return null;
}

function errorColor(errorYards: number): string {
  const abs = Math.abs(errorYards);
  if (abs <= 25) return "var(--c-green, #4ade80)";
  if (abs <= 50) return "var(--c-yellow, #facc15)";
  return "var(--c-red, #f87171)";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BDCOverlay() {
  const trajectoryResults = useBallisticsStore((s) => s.trajectoryResults);
  const [expanded, setExpanded] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const reticle = BDC_RETICLES[selectedIndex];

  const analysis = useMemo(() => {
    if (!reticle || trajectoryResults.length === 0) return null;

    const dotResults = reticle.dots.map((dot) => {
      const actualRange = findRangeForMOA(trajectoryResults, dot.moaFromCenter);
      const error = actualRange != null ? actualRange - dot.intendedRange : null;
      return { dot, actualRange, error };
    });

    // Determine if user's load is flatter or steeper
    const validErrors = dotResults.filter((d) => d.error != null);
    const avgError =
      validErrors.length > 0
        ? validErrors.reduce((sum, d) => sum + d.error!, 0) / validErrors.length
        : 0;

    let summary: string;
    if (validErrors.length === 0) {
      summary = "Not enough trajectory data to compare.";
    } else if (avgError > 15) {
      summary = "Your load shoots FLATTER than the reference load — BDC dots will correspond to LONGER ranges.";
    } else if (avgError < -15) {
      summary = "Your load drops FASTER than the reference load — BDC dots will correspond to SHORTER ranges.";
    } else {
      summary = "Your load closely matches the BDC reference load.";
    }

    return { dotResults, summary };
  }, [reticle, trajectoryResults]);

  return (
    <div
      className="rounded-md overflow-hidden"
      style={{ background: "var(--c-panel)", border: "1px solid var(--c-border)" }}
    >
      {/* Title bar */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <button
          type="button"
          className="text-[11px] font-mono tracking-[2px] uppercase cursor-pointer bg-transparent border-none p-0"
          style={{ color: "var(--c-accent)" }}
          onClick={() => setExpanded(!expanded)}
        >
          BDC Reticle Overlay {expanded ? "\u25BE" : "\u25B8"}
        </button>
      </div>

      {expanded && (
        <div className="px-4 pb-4">
          {/* Reticle selector */}
          <div className="mb-3">
            <label className="block text-[10px] font-mono mb-1" style={{ color: "var(--c-text-dim)" }}>
              Reticle
            </label>
            <select
              className="w-full rounded px-2 py-1.5 text-[11px] font-mono"
              style={{
                background: "var(--c-surface)",
                border: "1px solid var(--c-border)",
                color: "var(--c-text)",
              }}
              value={selectedIndex}
              onChange={(e) => setSelectedIndex(Number(e.target.value))}
            >
              {BDC_RETICLES.map((r, i) => (
                <option key={r.name} value={i}>
                  {r.manufacturer} {r.name}
                </option>
              ))}
            </select>
            <div className="text-[9px] font-mono mt-1" style={{ color: "var(--c-text-faint)" }}>
              Ref: {reticle.referenceLoad}
            </div>
          </div>

          {/* Results table */}
          {analysis && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-[10px] font-mono">
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--c-border)" }}>
                      <th
                        className="px-3 py-2 text-left uppercase tracking-wider font-normal"
                        style={{ color: "var(--c-text-dim)" }}
                      >
                        Dot
                      </th>
                      <th
                        className="px-3 py-2 text-right uppercase tracking-wider font-normal"
                        style={{ color: "var(--c-text-dim)" }}
                      >
                        MOA
                      </th>
                      <th
                        className="px-3 py-2 text-right uppercase tracking-wider font-normal"
                        style={{ color: "var(--c-text-dim)" }}
                      >
                        Intended
                      </th>
                      <th
                        className="px-3 py-2 text-right uppercase tracking-wider font-normal"
                        style={{ color: "var(--c-text-dim)" }}
                      >
                        Actual
                      </th>
                      <th
                        className="px-3 py-2 text-right uppercase tracking-wider font-normal"
                        style={{ color: "var(--c-text-dim)" }}
                      >
                        Error
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.dotResults.map(({ dot, actualRange, error }) => (
                      <tr
                        key={dot.label}
                        style={{
                          borderBottom: "1px solid var(--c-surface)",
                          color: "var(--c-text)",
                        }}
                      >
                        <td className="px-3 py-1.5 text-left font-medium">{dot.label}</td>
                        <td className="px-3 py-1.5 text-right">{dot.moaFromCenter.toFixed(1)}</td>
                        <td className="px-3 py-1.5 text-right">{dot.intendedRange} yds</td>
                        <td className="px-3 py-1.5 text-right">
                          {actualRange != null ? `${Math.round(actualRange)} yds` : "—"}
                        </td>
                        <td
                          className="px-3 py-1.5 text-right font-medium"
                          style={{ color: error != null ? errorColor(error) : "var(--c-text-dim)" }}
                        >
                          {error != null
                            ? `${error > 0 ? "+" : ""}${Math.round(error)} yds`
                            : "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary */}
              <div
                className="mt-3 rounded px-3 py-2 text-[10px] font-mono"
                style={{
                  background: "var(--c-surface)",
                  border: "1px solid var(--c-border)",
                  color: "var(--c-text-muted)",
                }}
              >
                {analysis.summary}
              </div>
            </>
          )}

          {trajectoryResults.length === 0 && (
            <div
              className="py-6 text-center text-[11px] font-mono"
              style={{ color: "var(--c-text-dim)" }}
            >
              Run a trajectory calculation first
            </div>
          )}
        </div>
      )}
    </div>
  );
}


export default BDCOverlay;
