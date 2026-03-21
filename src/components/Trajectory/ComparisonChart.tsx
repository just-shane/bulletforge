import type { TrajectoryPoint } from "../../lib/ballistics.ts";

interface ComparisonChartProps {
  pointsA: TrajectoryPoint[];
  pointsB: TrajectoryPoint[];
  labelA: string;
  labelB: string;
  zeroRange: number;
}

export function ComparisonChart({ pointsA, pointsB, labelA, labelB, zeroRange }: ComparisonChartProps) {
  if (pointsA.length < 2 && pointsB.length < 2) {
    return (
      <div
        className="rounded-md p-8 text-center text-[11px] font-mono text-neutral-500"
        style={{ background: "#141414", border: "1px solid #2a2a2a" }}
      >
        No trajectory data
      </div>
    );
  }

  const width = 800;
  const height = 300;
  const padding = { top: 20, right: 30, bottom: 40, left: 70 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  // Combine both datasets for scale computation
  const allPoints = [...pointsA, ...pointsB];
  const maxRange = Math.max(
    pointsA.length > 0 ? pointsA[pointsA.length - 1].range : 0,
    pointsB.length > 0 ? pointsB[pointsB.length - 1].range : 0,
  );

  if (maxRange === 0) {
    return (
      <div
        className="rounded-md p-8 text-center text-[11px] font-mono text-neutral-500"
        style={{ background: "#141414", border: "1px solid #2a2a2a" }}
      >
        No trajectory data
      </div>
    );
  }

  const drops = allPoints.map((p) => p.dropInches);
  const minDrop = Math.min(...drops);
  const maxDrop = Math.max(...drops, 0);
  const dropPadding = Math.max(Math.abs(maxDrop - minDrop) * 0.1, 2);
  const yMin = minDrop - dropPadding;
  const yMax = maxDrop + dropPadding;

  const xScale = (range: number) => padding.left + (range / maxRange) * plotW;
  const yScale = (drop: number) => padding.top + plotH - ((drop - yMin) / (yMax - yMin)) * plotH;

  // Build paths
  const buildPath = (points: TrajectoryPoint[]) =>
    points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${xScale(p.range).toFixed(1)} ${yScale(p.dropInches).toFixed(1)}`)
      .join(" ");

  const pathA = pointsA.length >= 2 ? buildPath(pointsA) : "";
  const pathB = pointsB.length >= 2 ? buildPath(pointsB) : "";

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

  return (
    <div
      className="rounded-md p-4 overflow-x-auto"
      style={{ background: "#141414", border: "1px solid #2a2a2a" }}
    >
      <div className="text-[11px] font-mono tracking-[2px] uppercase mb-3" style={{ color: "#ef4444" }}>
        Trajectory Comparison
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
            stroke="#1a1a1a"
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
            stroke="#1a1a1a"
            strokeWidth="0.5"
          />
        ))}

        {/* Zero (LOS) line */}
        <line
          x1={padding.left}
          y1={zeroY}
          x2={padding.left + plotW}
          y2={zeroY}
          stroke="#404040"
          strokeWidth="1"
          strokeDasharray="4 4"
        />

        {/* Curve A */}
        {pathA && (
          <path
            d={pathA}
            fill="none"
            stroke="#ef4444"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        )}

        {/* Curve B */}
        {pathB && (
          <path
            d={pathB}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        )}

        {/* Zero range marker */}
        {zeroRange <= maxRange && (
          <line
            x1={xScale(zeroRange)}
            y1={padding.top}
            x2={xScale(zeroRange)}
            y2={padding.top + plotH}
            stroke="#525252"
            strokeWidth="1"
            strokeDasharray="3 3"
            opacity="0.5"
          />
        )}

        {/* X-axis labels */}
        {xTicks.map((r) => (
          <text
            key={`xl-${r}`}
            x={xScale(r)}
            y={height - 8}
            textAnchor="middle"
            fill="#525252"
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
          fill="#525252"
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
            fill="#525252"
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
          fill="#525252"
          fontSize="9"
          fontFamily="monospace"
          transform={`rotate(-90, 12, ${padding.top + plotH / 2})`}
        >
          DROP (IN)
        </text>
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-6 mt-3 px-1">
        <div className="flex items-center gap-2">
          <div className="w-4 h-[2px]" style={{ background: "#ef4444" }} />
          <span className="text-[10px] font-mono text-neutral-400">{labelA}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-[2px]" style={{ background: "#3b82f6" }} />
          <span className="text-[10px] font-mono text-neutral-400">{labelB}</span>
        </div>
      </div>
    </div>
  );
}
