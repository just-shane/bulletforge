import type { PressureCurvePoint } from "../../lib/internal-ballistics.ts";

interface PressureCurveChartProps {
  pressureCurve: PressureCurvePoint[];
  saamiMaxPressure: number;
  peakPressure: number;
  peakPressurePosition: number;
  barrelLength: number;
  burnCompletePosition: number;
}

export function PressureCurveChart({
  pressureCurve,
  saamiMaxPressure,
  peakPressure,
  peakPressurePosition,
  barrelLength,
  burnCompletePosition,
}: PressureCurveChartProps) {
  if (pressureCurve.length < 2) {
    return (
      <div
        className="rounded-md p-8 text-center text-[11px] font-mono"
        style={{ background: "var(--c-panel)", border: "1px solid var(--c-border)", color: "var(--c-text-dim)" }}
      >
        No pressure data
      </div>
    );
  }

  const width = 800;
  const height = 300;
  const padding = { top: 20, right: 30, bottom: 40, left: 70 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  // Scales
  const xMax = barrelLength;
  const yMax = Math.max(peakPressure * 1.1, saamiMaxPressure * 1.1);

  const xScale = (pos: number) => padding.left + (pos / xMax) * plotW;
  const yScale = (psi: number) => padding.top + plotH - (psi / yMax) * plotH;

  // Build pressure curve path
  const pathD = pressureCurve
    .filter((p) => p.position <= barrelLength)
    .map(
      (p, i) =>
        `${i === 0 ? "M" : "L"} ${xScale(p.position).toFixed(1)} ${yScale(p.pressure).toFixed(1)}`,
    )
    .join(" ");

  // X-axis ticks
  const xTicks: number[] = [];
  const xStep =
    barrelLength <= 10 ? 1 : barrelLength <= 20 ? 2 : barrelLength <= 30 ? 5 : 10;
  for (let x = 0; x <= barrelLength; x += xStep) xTicks.push(x);
  if (xTicks[xTicks.length - 1] < barrelLength) xTicks.push(barrelLength);

  // Y-axis ticks
  const yTicks: number[] = [];
  const yRange = yMax;
  const yStep =
    yRange > 100_000 ? 20_000 : yRange > 50_000 ? 10_000 : yRange > 20_000 ? 5_000 : 2_000;
  for (let y = 0; y <= yMax; y += yStep) yTicks.push(y);

  // Format large psi values (e.g. 60000 -> "60k")
  const fmtPsi = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`);

  // Peak pressure point
  const peakX = xScale(peakPressurePosition);
  const peakY = yScale(peakPressure);

  // SAAMI line
  const saamiY = yScale(saamiMaxPressure);

  // Burn complete
  const burnComplete = isFinite(burnCompletePosition) && burnCompletePosition < barrelLength;
  const burnX = burnComplete ? xScale(burnCompletePosition) : 0;

  return (
    <div
      className="rounded-md p-4 overflow-x-auto"
      style={{ background: "var(--c-panel)", border: "1px solid var(--c-border)" }}
    >
      <div
        className="text-[11px] font-mono tracking-[2px] uppercase mb-3"
        style={{ color: "var(--c-accent)" }}
      >
        Chamber Pressure vs. Barrel Position
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ maxHeight: 300 }}>
        {/* Gridlines */}
        {xTicks.map((x) => (
          <line
            key={`xg-${x}`}
            x1={xScale(x)}
            y1={padding.top}
            x2={xScale(x)}
            y2={padding.top + plotH}
            stroke="var(--c-chart-grid)"
            strokeWidth="0.5"
          />
        ))}
        {yTicks.map((y) => (
          <line
            key={`yg-${y}`}
            x1={padding.left}
            y1={yScale(y)}
            x2={padding.left + plotW}
            y2={yScale(y)}
            stroke="var(--c-chart-grid)"
            strokeWidth="0.5"
          />
        ))}

        {/* SAAMI max pressure line — semantic warning color */}
        <line
          x1={padding.left}
          y1={saamiY}
          x2={padding.left + plotW}
          y2={saamiY}
          stroke="var(--c-warn)"
          strokeWidth="1"
          strokeDasharray="6 3"
          opacity="0.8"
        />
        <text
          x={padding.left + plotW - 4}
          y={saamiY - 5}
          textAnchor="end"
          fill="var(--c-warn)"
          fontSize="9"
          fontFamily="monospace"
        >
          SAAMI MAX {fmtPsi(saamiMaxPressure)} psi
        </text>

        {/* Burn complete position — semantic success color */}
        {burnComplete && (
          <>
            <line
              x1={burnX}
              y1={padding.top}
              x2={burnX}
              y2={padding.top + plotH}
              stroke="var(--c-success)"
              strokeWidth="1"
              strokeDasharray="4 3"
              opacity="0.7"
            />
            <text
              x={burnX + 4}
              y={padding.top + 12}
              textAnchor="start"
              fill="var(--c-success)"
              fontSize="9"
              fontFamily="monospace"
            >
              BURN COMPLETE
            </text>
          </>
        )}

        {/* Pressure curve */}
        <path d={pathD} fill="none" stroke="var(--c-chart-line)" strokeWidth="2" strokeLinejoin="round" />

        {/* Peak pressure marker */}
        <circle cx={peakX} cy={peakY} r="4" fill="var(--c-accent)" />
        <text
          x={peakX + 8}
          y={peakY - 8}
          textAnchor="start"
          fill="var(--c-text)"
          fontSize="9"
          fontFamily="monospace"
        >
          {peakPressure.toLocaleString()} psi @ {peakPressurePosition.toFixed(1)}"
        </text>

        {/* X-axis labels */}
        {xTicks.map((x) => (
          <text
            key={`xl-${x}`}
            x={xScale(x)}
            y={height - 8}
            textAnchor="middle"
            fill="var(--c-chart-text)"
            fontSize="9"
            fontFamily="monospace"
          >
            {x}
          </text>
        ))}
        <text
          x={padding.left + plotW / 2}
          y={height}
          textAnchor="middle"
          fill="var(--c-chart-text)"
          fontSize="9"
          fontFamily="monospace"
        >
          BARREL POSITION (IN)
        </text>

        {/* Y-axis labels */}
        {yTicks.map((y) => (
          <text
            key={`yl-${y}`}
            x={padding.left - 8}
            y={yScale(y) + 3}
            textAnchor="end"
            fill="var(--c-chart-text)"
            fontSize="9"
            fontFamily="monospace"
          >
            {fmtPsi(y)}
          </text>
        ))}
        <text
          x={14}
          y={padding.top + plotH / 2}
          textAnchor="middle"
          fill="var(--c-chart-text)"
          fontSize="9"
          fontFamily="monospace"
          transform={`rotate(-90, 14, ${padding.top + plotH / 2})`}
        >
          PRESSURE (PSI)
        </text>
      </svg>
    </div>
  );
}
