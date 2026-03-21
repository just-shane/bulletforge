interface SafeLoadIndicatorProps {
  chargeWeight: number;
  minCharge: number;
  maxCharge: number;
  saamiPercent: number;
}

/**
 * Green/yellow/red zone visual indicator for the current charge weight
 * relative to the safe operating range.
 *
 * Zones:
 * - Green: < 85% SAAMI
 * - Yellow: 85-95% SAAMI
 * - Red: > 95% SAAMI
 */
export function SafeLoadIndicator({
  chargeWeight,
  minCharge,
  maxCharge,
  saamiPercent,
}: SafeLoadIndicatorProps) {
  const range = maxCharge - minCharge;
  const position = range > 0 ? ((chargeWeight - minCharge) / range) * 100 : 50;
  const clampedPosition = Math.max(0, Math.min(100, position));

  const zone =
    saamiPercent > 95
      ? "red"
      : saamiPercent > 85
        ? "yellow"
        : "green";

  // Semantic colors: safety zones should always be red/yellow/green
  const zoneColor =
    zone === "red" ? "var(--c-danger)" : zone === "yellow" ? "var(--c-warn)" : "var(--c-success)";

  const zoneLabel =
    zone === "red"
      ? "HIGH PRESSURE"
      : zone === "yellow"
        ? "APPROACHING MAX"
        : "SAFE RANGE";

  return (
    <div
      className="rounded-md px-3 py-2"
      style={{ background: "var(--c-surface)", border: `1px solid ${zone === "red" ? "var(--c-danger)" : "var(--c-surface)"}` }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="text-[9px] font-mono uppercase tracking-[1.5px]" style={{ color: "var(--c-text-dim)" }}>
          Load Safety
        </div>
        <div
          className="text-[9px] font-mono font-bold tracking-wider"
          style={{ color: zoneColor }}
        >
          {zoneLabel}
        </div>
      </div>

      {/* Gradient bar — semantic safety colors, not theme accent */}
      <div className="relative h-2 rounded-full overflow-hidden mb-1.5">
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: "linear-gradient(to right, #22c55e 0%, #22c55e 55%, #f59e0b 75%, #ef4444 90%, #991b1b 100%)",
          }}
        />
        {/* Current position marker */}
        <div
          className="absolute top-[-1px] w-1 h-2.5 rounded-sm"
          style={{
            left: `${clampedPosition}%`,
            transform: "translateX(-50%)",
            background: "#ffffff",
            boxShadow: "0 0 4px rgba(0,0,0,0.8)",
          }}
        />
      </div>

      {/* Labels */}
      <div className="flex justify-between text-[8px] font-mono" style={{ color: "var(--c-text-faint)" }}>
        <span>{minCharge.toFixed(1)}gr</span>
        <span style={{ color: "var(--c-text-dim)" }}>{chargeWeight.toFixed(1)}gr — {saamiPercent.toFixed(1)}% SAAMI</span>
        <span>{maxCharge.toFixed(1)}gr</span>
      </div>
    </div>
  );
}


export default SafeLoadIndicator;
