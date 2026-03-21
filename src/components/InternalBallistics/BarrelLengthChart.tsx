import { useMemo } from "react";
import type { InternalBallisticsConfig } from "../../lib/internal-ballistics.ts";
import { findOptimalBarrelLength } from "../../lib/internal-ballistics.ts";

interface BarrelLengthChartProps {
  config: InternalBallisticsConfig;
}

export function BarrelLengthChart({ config }: BarrelLengthChartProps) {
  const analysis = useMemo(
    () => findOptimalBarrelLength(config),
    [config],
  );

  const { data, optimalLength } = analysis;

  if (data.length < 2) return null;

  const width = 800;
  const height = 280;
  const padding = { top: 20, right: 30, bottom: 40, left: 70 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  const xMin = data[0].length;
  const xMax = data[data.length - 1].length;
  const vMin = Math.floor(data[0].velocity / 50) * 50;
  const vMax = Math.ceil(data[data.length - 1].velocity / 50) * 50;

  const xScale = (len: number) =>
    padding.left + ((len - xMin) / (xMax - xMin)) * plotW;
  const yScale = (vel: number) =>
    padding.top + plotH - ((vel - vMin) / (vMax - vMin)) * plotH;

  // Velocity curve path
  const pathD = data
    .map(
      (d, i) =>
        `${i === 0 ? "M" : "L"} ${xScale(d.length).toFixed(1)} ${yScale(d.velocity).toFixed(1)}`,
    )
    .join(" ");

  // fps/inch bar data (skip first)
  const maxFpsPerInch = Math.max(...data.slice(1).map((d) => d.fpsPerInch));

  // X ticks
  const xTicks: number[] = [];
  for (let x = xMin; x <= xMax; x += 2) xTicks.push(x);

  // Y ticks
  const yTicks: number[] = [];
  const yStep = vMax - vMin > 400 ? 100 : vMax - vMin > 200 ? 50 : 25;
  for (let y = vMin; y <= vMax; y += yStep) yTicks.push(y);

  // Optimal point
  const optPoint = data.find((d) => d.length === optimalLength);

  return (
    <div
      className="rounded-md p-4 overflow-x-auto"
      style={{ background: "var(--c-panel)", border: "1px solid var(--c-border)" }}
    >
      <div
        className="text-[11px] font-mono tracking-[2px] uppercase mb-3"
        style={{ color: "var(--c-accent)" }}
      >
        Barrel Length Optimization
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ maxHeight: 280 }}>
        {/* Gridlines */}
        {xTicks.map((x) => (
          <line
            key={`xg-${x}`}
            x1={xScale(x)} y1={padding.top}
            x2={xScale(x)} y2={padding.top + plotH}
            stroke="var(--c-chart-grid)" strokeWidth="0.5"
          />
        ))}
        {yTicks.map((y) => (
          <line
            key={`yg-${y}`}
            x1={padding.left} y1={yScale(y)}
            x2={padding.left + plotW} y2={yScale(y)}
            stroke="var(--c-chart-grid)" strokeWidth="0.5"
          />
        ))}

        {/* fps/inch bars (background) — semantic colors for performance zones */}
        {data.slice(1).map((d) => {
          const barH = maxFpsPerInch > 0
            ? (d.fpsPerInch / maxFpsPerInch) * (plotH * 0.3)
            : 0;
          const barColor = d.fpsPerInch >= 10 ? "var(--c-success)" : d.fpsPerInch >= 5 ? "var(--c-warn)" : "var(--c-danger)";
          return (
            <rect
              key={`bar-${d.length}`}
              x={xScale(d.length) - 4}
              y={padding.top + plotH - barH}
              width={8}
              height={barH}
              fill={barColor}
              opacity="0.2"
              rx="1"
            />
          );
        })}

        {/* Velocity curve */}
        <path d={pathD} fill="none" stroke="var(--c-chart-line)" strokeWidth="2" strokeLinejoin="round" />

        {/* Data points */}
        {data.map((d) => (
          <circle
            key={`pt-${d.length}`}
            cx={xScale(d.length)}
            cy={yScale(d.velocity)}
            r="3"
            fill={d.length === optimalLength ? "var(--c-success)" : "var(--c-accent)"}
            stroke={d.length === optimalLength ? "var(--c-success)" : "none"}
            strokeWidth="2"
          />
        ))}

        {/* Optimal length marker */}
        {optPoint && (
          <>
            <line
              x1={xScale(optimalLength)} y1={padding.top}
              x2={xScale(optimalLength)} y2={padding.top + plotH}
              stroke="var(--c-success)" strokeWidth="1" strokeDasharray="4 3" opacity="0.6"
            />
            <text
              x={xScale(optimalLength) + 6}
              y={padding.top + 14}
              fill="var(--c-success)" fontSize="9" fontFamily="monospace"
            >
              OPTIMAL {optimalLength}" ({optPoint.velocity.toFixed(0)} fps)
            </text>
          </>
        )}

        {/* X-axis */}
        {xTicks.map((x) => (
          <text
            key={`xl-${x}`}
            x={xScale(x)} y={height - 8}
            textAnchor="middle" fill="var(--c-chart-text)" fontSize="9" fontFamily="monospace"
          >
            {x}"
          </text>
        ))}
        <text
          x={padding.left + plotW / 2} y={height}
          textAnchor="middle" fill="var(--c-chart-text)" fontSize="9" fontFamily="monospace"
        >
          BARREL LENGTH (IN)
        </text>

        {/* Y-axis */}
        {yTicks.map((y) => (
          <text
            key={`yl-${y}`}
            x={padding.left - 8} y={yScale(y) + 3}
            textAnchor="end" fill="var(--c-chart-text)" fontSize="9" fontFamily="monospace"
          >
            {y}
          </text>
        ))}
        <text
          x={14} y={padding.top + plotH / 2}
          textAnchor="middle" fill="var(--c-chart-text)" fontSize="9" fontFamily="monospace"
          transform={`rotate(-90, 14, ${padding.top + plotH / 2})`}
        >
          VELOCITY (FPS)
        </text>
      </svg>

      {/* Legend */}
      <div className="flex gap-4 mt-2 text-[9px] font-mono" style={{ color: "var(--c-text-dim)" }}>
        <span><span style={{ color: "var(--c-success)" }}>&#9632;</span> &ge;10 fps/in</span>
        <span><span style={{ color: "var(--c-warn)" }}>&#9632;</span> 5-10 fps/in</span>
        <span><span style={{ color: "var(--c-danger)" }}>&#9632;</span> &lt;5 fps/in (diminishing returns)</span>
      </div>
    </div>
  );
}


export default BarrelLengthChart;
