import { millerStability } from "../../lib/ballistics.ts";

interface StabilityPanelProps {
  bulletWeight: number;
  bulletDiameter: number;
  twistRate: number;
  altitude: number;
  temperature: number;
  pressure: number;
}

export function StabilityPanel({
  bulletWeight,
  bulletDiameter,
  twistRate,
  altitude,
  temperature,
  pressure,
}: StabilityPanelProps) {
  // Estimate bullet length from weight and diameter
  // density ~ 0.411 lb/in^3 for copper-jacketed lead
  const density = 0.411;
  const weightLbs = bulletWeight / 7000;
  const radius = bulletDiameter / 2;
  const crossSection = Math.PI * radius * radius;
  const bulletLength = weightLbs / (crossSection * density);

  const result = millerStability(
    bulletWeight,
    bulletDiameter,
    bulletLength,
    twistRate,
    altitude,
    temperature,
    pressure,
  );

  const { stabilityFactor, rating, recommendation, minTwist, maxTwist } = result;

  // Semantic color coding for stability zones
  const colorMap: Record<string, string> = {
    "unstable": "var(--c-danger)",
    "marginal": "var(--c-warn)",
    "stable": "var(--c-success)",
    "over-stabilized": "#3b82f6",
  };
  const sgColor = colorMap[rating] || "var(--c-text)";

  // Badge label
  const badgeMap: Record<string, string> = {
    "unstable": "UNSTABLE",
    "marginal": "MARGINAL",
    "stable": "STABLE",
    "over-stabilized": "OVER-STABILIZED",
  };
  const badgeLabel = badgeMap[rating] || rating.toUpperCase();

  // Visual bar: SG on 0-3 scale
  const barPercent = Math.min(Math.max(stabilityFactor / 3, 0), 1) * 100;

  return (
    <div
      className="rounded-md overflow-hidden"
      style={{ background: "var(--c-panel)", border: "1px solid var(--c-border)" }}
    >
      <div className="px-4 pt-3 pb-2">
        <div
          className="text-[11px] font-mono tracking-[2px] uppercase"
          style={{ color: "var(--c-accent)" }}
        >
          Twist Rate Stability
        </div>
      </div>

      <div className="px-4 pb-4">
        {/* Large stability factor */}
        <div className="text-center py-3">
          <div className="text-lg font-bold font-mono" style={{ color: sgColor }}>
            {stabilityFactor.toFixed(2)}
          </div>
          <div
            className="inline-block mt-1 px-2 py-0.5 rounded text-[8px] font-mono font-medium tracking-wider uppercase"
            style={{
              background: `${sgColor}18`,
              color: sgColor,
              border: `1px solid ${sgColor}40`,
            }}
          >
            {badgeLabel}
          </div>
        </div>

        {/* Visual bar — semantic safety colors */}
        <div className="mt-3 mb-3">
          <div
            className="relative h-2 rounded-full overflow-hidden"
            style={{ background: "var(--c-surface)" }}
          >
            {/* Gradient zones */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: "linear-gradient(to right, #ef4444 0%, #f59e0b 30%, #22c55e 47%, #22c55e 60%, #3b82f6 80%, #3b82f6 100%)",
                opacity: 0.3,
              }}
            />
            {/* Current position indicator */}
            <div
              className="absolute top-0 h-full w-1 rounded-full"
              style={{
                left: `${barPercent}%`,
                background: sgColor,
                transform: "translateX(-50%)",
                boxShadow: `0 0 4px ${sgColor}`,
              }}
            />
          </div>
          <div className="flex justify-between mt-1 text-[8px] font-mono" style={{ color: "var(--c-text-faint)" }}>
            <span>0</span>
            <span>1.0</span>
            <span>1.5</span>
            <span>2.0</span>
            <span>3.0</span>
          </div>
        </div>

        {/* Twist rate info */}
        <div
          className="flex items-center justify-center gap-3 py-2 text-[9px] font-mono"
          style={{ borderTop: "1px solid var(--c-surface)", borderBottom: "1px solid var(--c-surface)" }}
        >
          <span style={{ color: "var(--c-text-muted)" }}>
            Current: <span style={{ color: "var(--c-text)" }}>1:{twistRate}</span>
          </span>
          <span style={{ color: "var(--c-text-faint)" }}>|</span>
          <span style={{ color: "var(--c-text-muted)" }}>
            Recommended: <span style={{ color: "var(--c-text)" }}>1:{maxTwist} to 1:{minTwist}</span>
          </span>
        </div>

        {/* Recommendation */}
        <div className="mt-2 text-[9px] font-mono" style={{ color: "var(--c-text-muted)" }}>
          {recommendation}
        </div>

        {/* Bullet length estimate */}
        <div className="mt-2 text-[8px] font-mono" style={{ color: "var(--c-text-faint)" }}>
          Est. bullet length: {bulletLength.toFixed(3)}&Prime;
        </div>
      </div>
    </div>
  );
}
