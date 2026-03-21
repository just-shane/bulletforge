import type { TrajectoryPoint } from "../../lib/ballistics.ts";

interface TrajectoryChartProps {
  points: TrajectoryPoint[];
  zeroRange: number;
}

export function TrajectoryChart({ points, zeroRange }: TrajectoryChartProps) {
  if (points.length < 2) {
    return (
      <div
        className="rounded-md p-8 text-center text-[11px] font-mono"
        style={{ background: "var(--c-panel)", border: "1px solid var(--c-border)", color: "var(--c-text-dim)" }}
      >
        No trajectory data
      </div>
    );
  }

  const width = 800;
  const height = 300;
  const padding = { top: 20, right: 30, bottom: 40, left: 60 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  const maxRange = points[points.length - 1].range;
  const drops = points.map((p) => p.dropInches);
  const minDrop = Math.min(...drops);
  const maxDrop = Math.max(...drops, 0);
  const dropPadding = Math.max(Math.abs(maxDrop - minDrop) * 0.1, 2);
  const yMin = minDrop - dropPadding;
  const yMax = maxDrop + dropPadding;

  const xScale = (range: number) => padding.left + (range / maxRange) * plotW;
  const yScale = (drop: number) => padding.top + plotH - ((drop - yMin) / (yMax - yMin)) * plotH;

  // Build path
  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xScale(p.range).toFixed(1)} ${yScale(p.dropInches).toFixed(1)}`)
    .join(" ");

  // Gridlines
  const xTicks: number[] = [];
  const xStep = maxRange <= 500 ? 50 : maxRange <= 1000 ? 100 : 200;
  for (let r = 0; r <= maxRange; r += xStep) xTicks.push(r);

  const yRange = yMax - yMin;
  const yStep = yRange > 200 ? 100 : yRange > 100 ? 50 : yRange > 40 ? 20 : yRange > 10 ? 5 : 2;
  const yTicks: number[] = [];
  const yStart = Math.ceil(yMin / yStep) * yStep;
  for (let y = yStart; y <= yMax; y += yStep) yTicks.push(y);

  // Zero line
  const zeroY = yScale(0);

  // Zero range marker
  const zeroX = xScale(zeroRange);

  return (
    <div
      className="rounded-md p-4 overflow-x-auto"
      style={{ background: "var(--c-panel)", border: "1px solid var(--c-border)" }}
    >
      <div className="text-[11px] font-mono tracking-[2px] uppercase mb-3" style={{ color: "var(--c-accent)" }}>
        Trajectory
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ maxHeight: 300 }}
      >
        {/* Grid lines */}
        {xTicks.map((r) => (
          <line
            key={`xg-${r}`}
            x1={xScale(r)}
            y1={padding.top}
            x2={xScale(r)}
            y2={padding.top + plotH}
            stroke="var(--c-chart-grid)"
            strokeWidth="0.5"
          />
        ))}
        {yTicks.map((d) => (
          <line
            key={`yg-${d}`}
            x1={padding.left}
            y1={yScale(d)}
            x2={padding.left + plotW}
            y2={yScale(d)}
            stroke="var(--c-chart-grid)"
            strokeWidth="0.5"
          />
        ))}

        {/* Zero (LOS) line */}
        <line
          x1={padding.left}
          y1={zeroY}
          x2={padding.left + plotW}
          y2={zeroY}
          stroke="var(--c-border-light)"
          strokeWidth="1"
          strokeDasharray="4 4"
        />

        {/* Trajectory curve */}
        <path
          d={pathD}
          fill="none"
          stroke="var(--c-chart-line)"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Zero range marker */}
        {zeroRange <= maxRange && (
          <>
            <line
              x1={zeroX}
              y1={padding.top}
              x2={zeroX}
              y2={padding.top + plotH}
              stroke="var(--c-accent)"
              strokeWidth="1"
              strokeDasharray="3 3"
              opacity="0.5"
            />
            <circle cx={zeroX} cy={zeroY} r="4" fill="var(--c-accent)" />
            <text
              x={zeroX}
              y={padding.top - 5}
              textAnchor="middle"
              fill="var(--c-accent)"
              fontSize="9"
              fontFamily="monospace"
            >
              ZERO
            </text>
          </>
        )}

        {/* X-axis labels */}
        {xTicks.map((r) => (
          <text
            key={`xl-${r}`}
            x={xScale(r)}
            y={height - 8}
            textAnchor="middle"
            fill="var(--c-chart-text)"
            fontSize="9"
            fontFamily="monospace"
          >
            {r}
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
          RANGE (YDS)
        </text>

        {/* Y-axis labels */}
        {yTicks.map((d) => (
          <text
            key={`yl-${d}`}
            x={padding.left - 8}
            y={yScale(d) + 3}
            textAnchor="end"
            fill="var(--c-chart-text)"
            fontSize="9"
            fontFamily="monospace"
          >
            {d}
          </text>
        ))}
        <text
          x={12}
          y={padding.top + plotH / 2}
          textAnchor="middle"
          fill="var(--c-chart-text)"
          fontSize="9"
          fontFamily="monospace"
          transform={`rotate(-90, 12, ${padding.top + plotH / 2})`}
        >
          DROP (IN)
        </text>
      </svg>
    </div>
  );
}
