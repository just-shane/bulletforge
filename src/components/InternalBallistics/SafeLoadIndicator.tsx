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

  const zoneColor =
    zone === "red" ? "#ef4444" : zone === "yellow" ? "#f59e0b" : "#22c55e";

  const zoneLabel =
    zone === "red"
      ? "HIGH PRESSURE"
      : zone === "yellow"
        ? "APPROACHING MAX"
        : "SAFE RANGE";

  return (
    <div
      className="rounded-md px-3 py-2"
      style={{ background: "#0f0f0f", border: `1px solid ${zone === "red" ? "#ef4444" : "#1a1a1a"}` }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="text-[9px] font-mono uppercase tracking-[1.5px] text-neutral-500">
          Load Safety
        </div>
        <div
          className="text-[9px] font-mono font-bold tracking-wider"
          style={{ color: zoneColor }}
        >
          {zoneLabel}
        </div>
      </div>

      {/* Gradient bar */}
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
      <div className="flex justify-between text-[8px] font-mono text-neutral-600">
        <span>{minCharge.toFixed(1)}gr</span>
        <span className="text-neutral-500">{chargeWeight.toFixed(1)}gr — {saamiPercent.toFixed(1)}% SAAMI</span>
        <span>{maxCharge.toFixed(1)}gr</span>
      </div>
    </div>
  );
}
