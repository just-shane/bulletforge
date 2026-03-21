import { useState } from "react";
import { useBallisticsStore } from "../../store/store.ts";
import { clicksForAdjustment, sfpHoldoverCorrection } from "../../lib/optics.ts";

export function TurretMatchTable() {
  const trajectoryResults = useBallisticsStore((s) => s.trajectoryResults);
  const scope = useBallisticsStore((s) => s.scope);
  const currentMagnification = useBallisticsStore((s) => s.currentMagnification);

  const [expanded, setExpanded] = useState(true);
  const [increment, setIncrement] = useState<50 | 100>(100);

  const isMil = scope.reticleUnit === "MIL";
  const isSfp = scope.focalPlane === "SFP";
  const isNonCalibratedSfp = isSfp && currentMagnification !== scope.calibratedMag;
  const unitLabel = isMil ? "MIL" : "MOA";

  // Filter to chosen increment
  const filtered = trajectoryResults.filter((p) => p.range > 0 && p.range % increment === 0);

  // Build table rows with cumulative elevation
  const rows = filtered.map((p) => {
    const drop = isMil ? p.dropMIL : p.dropMOA;
    const drift = isMil ? p.driftMIL : p.driftMOA;
    const dropClicks = clicksForAdjustment(Math.abs(drop), scope.clickValue);
    const driftClicks = clicksForAdjustment(Math.abs(drift), scope.clickValue);
    const cumulativeElev = Math.abs(drop);

    const exceedsElev = cumulativeElev > scope.maxElevationTravel;
    const exceedsWind = Math.abs(drift) > scope.maxWindageTravel;

    // SFP holdover correction
    let holdover: number | null = null;
    if (isNonCalibratedSfp) {
      holdover = sfpHoldoverCorrection(Math.abs(drop), currentMagnification, scope.calibratedMag);
    }

    return {
      range: p.range,
      drop,
      dropClicks,
      drift,
      driftClicks,
      cumulativeElev,
      exceedsElev,
      exceedsWind,
      holdover,
    };
  });

  const configSummary = `${scope.reticleUnit} / ${scope.clickValue} click / ${scope.focalPlane}`;

  return (
    <div
      className="rounded-md overflow-hidden"
      style={{ background: "var(--c-panel)", border: "1px solid var(--c-border)" }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full px-4 pt-3 pb-2 text-left cursor-pointer"
        style={{ background: "transparent", border: "none" }}
      >
        <div>
          <div
            className="text-[11px] font-mono tracking-[2px] uppercase"
            style={{ color: "var(--c-accent)" }}
          >
            Turret Match
          </div>
          <div className="text-[9px] font-mono mt-0.5" style={{ color: "var(--c-text-muted)" }}>
            {configSummary}
            {isSfp && ` @ ${currentMagnification}x`}
          </div>
        </div>
        <span
          className="text-[10px] font-mono"
          style={{ color: "var(--c-text-faint)" }}
        >
          {expanded ? "\u25B4" : "\u25BE"}
        </span>
      </button>

      {expanded && (
        <div className="px-4 pb-4">
          {/* Increment toggle */}
          <div className="flex gap-1 mb-3">
            {([50, 100] as const).map((inc) => (
              <button
                key={inc}
                onClick={() => setIncrement(inc)}
                className="rounded text-[9px] font-mono px-2 py-0.5 cursor-pointer transition-colors"
                style={{
                  background: increment === inc ? "var(--c-accent-dim)" : "var(--c-surface)",
                  border: `1px solid ${increment === inc ? "var(--c-accent)" : "var(--c-border)"}`,
                  color: increment === inc ? "var(--c-accent)" : "var(--c-text-muted)",
                }}
              >
                {inc}yd
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-[10px] font-mono" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--c-border)" }}>
                  <th className="text-left py-1 pr-2" style={{ color: "var(--c-text-muted)" }}>Range</th>
                  <th className="text-right py-1 px-2" style={{ color: "var(--c-text-muted)" }}>Drop ({unitLabel})</th>
                  <th className="text-right py-1 px-2" style={{ color: "var(--c-text-muted)" }}>Clicks</th>
                  <th className="text-right py-1 px-2" style={{ color: "var(--c-text-muted)" }}>Drift ({unitLabel})</th>
                  <th className="text-right py-1 px-2" style={{ color: "var(--c-text-muted)" }}>W Clicks</th>
                  <th className="text-right py-1 px-2" style={{ color: "var(--c-text-muted)" }}>Cum Elev</th>
                  {isNonCalibratedSfp && (
                    <th className="text-right py-1 pl-2" style={{ color: "var(--c-text-muted)" }}>Holdover</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.range}
                    style={{ borderBottom: "1px solid var(--c-surface)" }}
                  >
                    <td className="py-1 pr-2" style={{ color: "var(--c-text)" }}>{row.range}</td>
                    <td className="text-right py-1 px-2" style={{ color: "var(--c-text-dim)" }}>
                      {Math.abs(row.drop).toFixed(1)}
                    </td>
                    <td className="text-right py-1 px-2" style={{ color: "var(--c-accent)" }}>
                      {row.dropClicks}
                    </td>
                    <td className="text-right py-1 px-2" style={{ color: "var(--c-text-dim)" }}>
                      {Math.abs(row.drift).toFixed(1)}{row.drift > 0 ? "R" : row.drift < 0 ? "L" : ""}
                    </td>
                    <td className="text-right py-1 px-2" style={{ color: "var(--c-accent)" }}>
                      {row.driftClicks}{row.drift > 0 ? "R" : row.drift < 0 ? "L" : ""}
                    </td>
                    <td
                      className="text-right py-1 px-2"
                      style={{ color: row.exceedsElev ? "var(--c-danger)" : "var(--c-text-dim)" }}
                    >
                      {row.exceedsElev && "\u26A0 "}
                      {row.cumulativeElev.toFixed(1)}
                    </td>
                    {isNonCalibratedSfp && (
                      <td className="text-right py-1 pl-2" style={{ color: "var(--c-warn)" }}>
                        {row.holdover !== null ? row.holdover.toFixed(1) : "-"}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend / notes */}
          <div className="mt-2 text-[8px] font-mono" style={{ color: "var(--c-text-faint)" }}>
            {scope.maxElevationTravel > 0 && (
              <span>Max elev travel: {scope.maxElevationTravel} {unitLabel} &middot; </span>
            )}
            {scope.maxWindageTravel > 0 && (
              <span>Max wind travel: {scope.maxWindageTravel} {unitLabel}</span>
            )}
          </div>
          {rows.some((r) => r.exceedsElev) && (
            <div
              className="mt-1 text-[8px] font-mono px-2 py-1 rounded"
              style={{
                color: "var(--c-danger)",
                background: "var(--c-surface)",
                border: "1px solid var(--c-border)",
              }}
            >
              Warning: Elevation exceeds scope travel at marked ranges
            </div>
          )}
        </div>
      )}
    </div>
  );
}
