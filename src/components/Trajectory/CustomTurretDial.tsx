import React, { useState, useMemo, useRef } from "react";
import { useBallisticsStore } from "../../store/store.ts";
import type { TrajectoryPoint } from "../../lib/ballistics.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * For a given range, interpolate the drop in MOA from trajectory points.
 * Returns absolute MOA (positive = clicks up).
 */
function getDropMOAAtRange(points: TrajectoryPoint[], range: number): number | null {
  if (range <= 0) return 0;
  for (let i = 0; i < points.length; i++) {
    if (points[i].range === range) return Math.abs(points[i].dropMOA);
    if (points[i].range > range && i > 0) {
      const prev = points[i - 1];
      const curr = points[i];
      const fraction = (range - prev.range) / (curr.range - prev.range);
      return Math.abs(prev.dropMOA + fraction * (curr.dropMOA - prev.dropMOA));
    }
  }
  return null;
}

function getDropMILAtRange(points: TrajectoryPoint[], range: number): number | null {
  if (range <= 0) return 0;
  for (let i = 0; i < points.length; i++) {
    if (points[i].range === range) return Math.abs(points[i].dropMIL);
    if (points[i].range > range && i > 0) {
      const prev = points[i - 1];
      const curr = points[i];
      const fraction = (range - prev.range) / (curr.range - prev.range);
      return Math.abs(prev.dropMIL + fraction * (curr.dropMIL - prev.dropMIL));
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CustomTurretDial() {
  const trajectoryResults = useBallisticsStore((s) => s.trajectoryResults);
  const cartridge = useBallisticsStore((s) => s.cartridge);
  const bullet = useBallisticsStore((s) => s.bullet);
  const muzzleVelocity = useBallisticsStore((s) => s.muzzleVelocity);
  const zeroRange = useBallisticsStore((s) => s.zeroRange);

  // Try to read scope from store; fall back to defaults if not yet available
  const scope = useBallisticsStore((s) => s.scope);
  const reticleUnit: "MIL" | "MOA" = scope?.reticleUnit ?? "MOA";
  const clickValue: number = scope?.clickValue ?? (reticleUnit === "MOA" ? 0.25 : 0.1);

  const [expanded, setExpanded] = useState(false);
  const [maxDialRange, setMaxDialRange] = useState(800);
  const svgRef = useRef<SVGSVGElement>(null);

  // Build range marks at 100-yard increments from zero to maxDialRange
  const rangeMarks = useMemo(() => {
    if (trajectoryResults.length === 0) return [];

    const marks: { range: number; adjustment: number; clicks: number }[] = [];

    for (let r = zeroRange; r <= maxDialRange; r += 100) {
      if (r <= 0) continue;
      const dropMOA = getDropMOAAtRange(trajectoryResults, r);
      const dropMIL = getDropMILAtRange(trajectoryResults, r);
      if (dropMOA == null || dropMIL == null) break;

      const adjustment = reticleUnit === "MOA" ? dropMOA : dropMIL;
      const clicks = Math.round(adjustment / clickValue);
      marks.push({ range: r, adjustment, clicks });
    }

    return marks;
  }, [trajectoryResults, zeroRange, maxDialRange, reticleUnit, clickValue]);

  // SVG dial geometry
  const size = 300;
  const center = size / 2;
  const outerRadius = 135;
  const tickOuterRadius = 128;
  const tickInnerRadius = 118;
  const labelRadius = 105;
  const unitLabelRadius = 92;
  const innerRingRadius = 80;

  // Total clicks from zero to max range
  const maxClicks = rangeMarks.length > 0 ? rangeMarks[rangeMarks.length - 1].clicks : 0;
  // Degrees per click — use 270 degrees of arc to leave room for the "zero zone"
  const totalArcDeg = 270;
  const degPerClick = maxClicks > 0 ? totalArcDeg / maxClicks : 1;
  // Start angle: 12 o'clock = -90deg, we start from there going clockwise
  const startAngleDeg = -90;

  function clicksToAngle(clicks: number): number {
    return startAngleDeg + clicks * degPerClick;
  }

  function polarToXY(angleDeg: number, radius: number): { x: number; y: number } {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: center + radius * Math.cos(rad), y: center + radius * Math.sin(rad) };
  }

  function handlePrint() {
    const svgEl = svgRef.current;
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html>
        <head><title>Custom Turret Dial</title>
          <style>
            body { margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; }
            svg { width: 4in; height: 4in; }
            @media print { @page { size: 5in 5in; margin: 0.5in; } }
          </style>
        </head>
        <body>${svgData}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
  }

  return (
    <div
      className="custom-turret-dial-print rounded-md overflow-hidden"
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
          Custom Turret Dial {expanded ? "\u25BE" : "\u25B8"}
        </button>
        {expanded && (
          <button
            type="button"
            className="turret-print-btn text-[10px] font-mono px-2 py-0.5 rounded"
            style={{
              background: "var(--c-border)",
              border: "1px solid var(--c-border-light)",
              color: "var(--c-text)",
              cursor: "pointer",
            }}
            onClick={handlePrint}
          >
            Print Dial
          </button>
        )}
      </div>

      {expanded && (
        <div className="px-4 pb-4">
          {/* Max range selector */}
          <div className="mb-3 flex items-center gap-3">
            <label className="text-[10px] font-mono" style={{ color: "var(--c-text-dim)" }}>
              Max Range
            </label>
            <select
              className="rounded px-2 py-1 text-[11px] font-mono"
              style={{
                background: "var(--c-surface)",
                border: "1px solid var(--c-border)",
                color: "var(--c-text)",
              }}
              value={maxDialRange}
              onChange={(e) => setMaxDialRange(Number(e.target.value))}
            >
              {[400, 500, 600, 700, 800, 900, 1000, 1200].map((r) => (
                <option key={r} value={r}>
                  {r} yds
                </option>
              ))}
            </select>
            <span className="text-[9px] font-mono" style={{ color: "var(--c-text-faint)" }}>
              {reticleUnit} / {clickValue} {reticleUnit} clicks
            </span>
          </div>

          {trajectoryResults.length > 0 && rangeMarks.length > 0 ? (
            <div className="flex justify-center">
              <svg
                ref={svgRef}
                viewBox={`0 0 ${size} ${size}`}
                width={size}
                height={size}
                xmlns="http://www.w3.org/2000/svg"
                style={{ maxWidth: "100%" }}
              >
                {/* Background circle */}
                <circle
                  cx={center}
                  cy={center}
                  r={outerRadius}
                  fill="none"
                  stroke="var(--c-border)"
                  strokeWidth="2"
                />

                {/* Inner ring */}
                <circle
                  cx={center}
                  cy={center}
                  r={innerRingRadius}
                  fill="none"
                  stroke="var(--c-border)"
                  strokeWidth="1"
                  strokeDasharray="2,2"
                />

                {/* Tick marks for each click between range marks */}
                {(() => {
                  const ticks: React.ReactElement[] = [];
                  const totalTicks = maxClicks;
                  for (let c = 0; c <= totalTicks; c++) {
                    const angle = clicksToAngle(c);
                    const isMajor = rangeMarks.some((m) => m.clicks === c);
                    const outerR = isMajor ? outerRadius : tickOuterRadius;
                    const innerR = isMajor ? tickInnerRadius - 4 : tickInnerRadius;
                    const p1 = polarToXY(angle, outerR);
                    const p2 = polarToXY(angle, innerR);
                    // Only draw every Nth tick to avoid clutter
                    const skipInterval = maxClicks > 100 ? 5 : maxClicks > 50 ? 2 : 1;
                    if (!isMajor && c % skipInterval !== 0) continue;
                    ticks.push(
                      <line
                        key={`tick-${c}`}
                        x1={p1.x}
                        y1={p1.y}
                        x2={p2.x}
                        y2={p2.y}
                        stroke={isMajor ? "var(--c-accent)" : "var(--c-text-dim)"}
                        strokeWidth={isMajor ? 2 : 0.75}
                      />
                    );
                  }
                  return ticks;
                })()}

                {/* Range labels */}
                {rangeMarks.map((mark) => {
                  const angle = clicksToAngle(mark.clicks);
                  const lp = polarToXY(angle, labelRadius);
                  const up = polarToXY(angle, unitLabelRadius);
                  const isZero = mark.clicks === 0;
                  return (
                    <g key={`label-${mark.range}`}>
                      <text
                        x={lp.x}
                        y={lp.y}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill={isZero ? "var(--c-accent)" : "var(--c-text)"}
                        fontSize="11"
                        fontFamily="monospace"
                        fontWeight={isZero ? "bold" : "normal"}
                      >
                        {isZero ? "ZERO" : mark.range}
                      </text>
                      {!isZero && (
                        <text
                          x={up.x}
                          y={up.y}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill="var(--c-text-dim)"
                          fontSize="7"
                          fontFamily="monospace"
                        >
                          {mark.adjustment.toFixed(1)}
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* Center info */}
                <text
                  x={center}
                  y={center - 14}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="var(--c-accent)"
                  fontSize="9"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {cartridge.shortName}
                </text>
                <text
                  x={center}
                  y={center + 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="var(--c-text)"
                  fontSize="8"
                  fontFamily="monospace"
                >
                  {bullet.weight}gr {bullet.name}
                </text>
                <text
                  x={center}
                  y={center + 16}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="var(--c-text-dim)"
                  fontSize="7"
                  fontFamily="monospace"
                >
                  {muzzleVelocity} fps
                </text>
                <text
                  x={center}
                  y={center + 28}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="var(--c-text-faint)"
                  fontSize="6"
                  fontFamily="monospace"
                >
                  Zero: {zeroRange} yds
                </text>

                {/* Center dot */}
                <circle cx={center} cy={center - 30} r="2" fill="var(--c-accent)" />
              </svg>
            </div>
          ) : (
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
