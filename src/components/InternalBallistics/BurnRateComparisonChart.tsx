import { useMemo } from "react";
import {
  comparePowders,
  POWDER_INTERNAL_DATA,
  CARTRIDGE_INTERNAL_DATA,
} from "../../lib/internal-ballistics.ts";

interface BurnRateComparisonChartProps {
  cartridgeShortName: string;
  currentPowder: string;
  chargeWeight: number;
  bulletWeight: number;
  bulletDiameter: number;
  barrelLength: number;
}

const COMPARISON_COLORS = [
  "var(--c-accent)", // current powder uses theme accent
  "#3b82f6", // blue
  "var(--c-success)", // green
  "var(--c-warn)", // amber
  "#8b5cf6", // violet
  "#ec4899", // pink
];

export function BurnRateComparisonChart({
  cartridgeShortName,
  currentPowder,
  chargeWeight,
  bulletWeight,
  bulletDiameter,
  barrelLength,
}: BurnRateComparisonChartProps) {
  // Pick up to 5 other powders that have internal data
  const powderNames = useMemo(() => {
    const cartData = CARTRIDGE_INTERNAL_DATA[cartridgeShortName];
    if (!cartData) return [currentPowder];
    const all = Object.keys(POWDER_INTERNAL_DATA);
    // Start with current, then add others
    const selected = [currentPowder];
    for (const name of all) {
      if (name !== currentPowder && selected.length < 4) {
        selected.push(name);
      }
    }
    return selected;
  }, [cartridgeShortName, currentPowder]);

  const results = useMemo(
    () =>
      comparePowders(
        cartridgeShortName,
        powderNames,
        chargeWeight,
        bulletWeight,
        bulletDiameter,
        barrelLength,
      ),
    [cartridgeShortName, powderNames, chargeWeight, bulletWeight, bulletDiameter, barrelLength],
  );

  const validResults = results
    .map((r, i) => (r ? { ...r, color: COMPARISON_COLORS[i % COMPARISON_COLORS.length] } : null))
    .filter((r): r is NonNullable<typeof r> => r !== null);

  if (validResults.length === 0) return null;

  const width = 800;
  const height = 300;
  const padding = { top: 20, right: 30, bottom: 40, left: 70 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  // Find global scales across all curves
  const allPoints = validResults.flatMap((r) =>
    r.result.pressureCurve.filter((p) => p.position <= barrelLength),
  );
  const xMax = barrelLength;
  const yMax = Math.max(...allPoints.map((p) => p.pressure)) * 1.1;

  const xScale = (pos: number) => padding.left + (pos / xMax) * plotW;
  const yScale = (psi: number) => padding.top + plotH - (psi / yMax) * plotH;

  // X ticks
  const xTicks: number[] = [];
  const xStep = barrelLength <= 10 ? 1 : barrelLength <= 20 ? 2 : 5;
  for (let x = 0; x <= barrelLength; x += xStep) xTicks.push(x);

  // Y ticks
  const yTicks: number[] = [];
  const yStep = yMax > 100_000 ? 20_000 : yMax > 50_000 ? 10_000 : 5_000;
  for (let y = 0; y <= yMax; y += yStep) yTicks.push(y);
  const fmtPsi = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`);

  return (
    <div
      className="rounded-md p-4 overflow-x-auto"
      style={{ background: "var(--c-panel)", border: "1px solid var(--c-border)" }}
    >
      <div
        className="text-[11px] font-mono tracking-[2px] uppercase mb-3"
        style={{ color: "var(--c-accent)" }}
      >
        Burn Rate Comparison — {chargeWeight}gr charge
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ maxHeight: 300 }}>
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

        {/* Pressure curves */}
        {validResults.map((r) => {
          const pathD = r.result.pressureCurve
            .filter((p) => p.position <= barrelLength)
            .map(
              (p, i) =>
                `${i === 0 ? "M" : "L"} ${xScale(p.position).toFixed(1)} ${yScale(p.pressure).toFixed(1)}`,
            )
            .join(" ");
          return (
            <path
              key={r.powderName}
              d={pathD}
              fill="none"
              stroke={r.color}
              strokeWidth={r.powderName === currentPowder ? "2.5" : "1.5"}
              strokeLinejoin="round"
              opacity={r.powderName === currentPowder ? 1 : 0.7}
            />
          );
        })}

        {/* X-axis */}
        {xTicks.map((x) => (
          <text
            key={`xl-${x}`}
            x={xScale(x)} y={height - 8}
            textAnchor="middle" fill="var(--c-chart-text)" fontSize="9" fontFamily="monospace"
          >
            {x}
          </text>
        ))}
        <text
          x={padding.left + plotW / 2} y={height}
          textAnchor="middle" fill="var(--c-chart-text)" fontSize="9" fontFamily="monospace"
        >
          BARREL POSITION (IN)
        </text>

        {/* Y-axis */}
        {yTicks.map((y) => (
          <text
            key={`yl-${y}`}
            x={padding.left - 8} y={yScale(y) + 3}
            textAnchor="end" fill="var(--c-chart-text)" fontSize="9" fontFamily="monospace"
          >
            {fmtPsi(y)}
          </text>
        ))}
        <text
          x={14} y={padding.top + plotH / 2}
          textAnchor="middle" fill="var(--c-chart-text)" fontSize="9" fontFamily="monospace"
          transform={`rotate(-90, 14, ${padding.top + plotH / 2})`}
        >
          PRESSURE (PSI)
        </text>
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
        {validResults.map((r) => (
          <div key={r.powderName} className="flex items-center gap-1.5 text-[9px] font-mono" style={{ color: "var(--c-text-muted)" }}>
            <span
              className="inline-block w-3 h-0.5 rounded"
              style={{
                background: r.color,
                height: r.powderName === currentPowder ? 3 : 2,
              }}
            />
            <span style={{ color: r.powderName === currentPowder ? "var(--c-text)" : undefined }}>
              {r.powderName}
            </span>
            <span style={{ color: "var(--c-text-faint)" }}>
              {(r.result.peakPressure / 1000).toFixed(1)}k psi / {r.result.muzzleVelocity.toFixed(0)} fps
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
