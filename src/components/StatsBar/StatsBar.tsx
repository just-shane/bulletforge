interface StatProps {
  label: string;
  value: string;
  unit: string;
  accent?: boolean;
  warn?: boolean;
}

function Stat({ label, value, unit, accent, warn }: StatProps) {
  const valueColor = warn ? "var(--c-warn)" : accent ? "var(--c-accent)" : "var(--c-text)";

  return (
    <div
      className="rounded-md px-3 py-2 flex-1 min-w-30"
      style={{
        background: "var(--c-panel)",
        border: "1px solid var(--c-border)",
      }}
      role="status"
      aria-label={`${label}: ${value} ${unit}`}
    >
      <div className="text-[9px] uppercase tracking-[1.5px] font-mono mb-0.5" style={{ color: "var(--c-text-dim)" }}>
        {label}
      </div>
      <div className="flex items-baseline gap-0.5">
        <span className="text-xl font-bold" style={{ color: valueColor }}>
          {value}
        </span>
        <span className="text-[10px] font-mono" style={{ color: "var(--c-text-dim)" }}>
          {unit}
        </span>
      </div>
    </div>
  );
}

interface StatsBarProps {
  muzzleVelocity: number;
  muzzleEnergy: number;
  zeroRange: number;
  maxOrdinate: number;
  transonicRange: number;
}

export function StatsBar({
  muzzleVelocity,
  muzzleEnergy,
  zeroRange,
  maxOrdinate,
  transonicRange,
}: StatsBarProps) {
  return (
    <div className="flex gap-2 mb-4 flex-wrap" role="region" aria-label="Key metrics dashboard">
      <Stat
        label="Muzzle Velocity"
        value={muzzleVelocity.toFixed(0)}
        unit="fps"
        accent
      />
      <Stat
        label="Muzzle Energy"
        value={muzzleEnergy.toFixed(0)}
        unit="ft-lbs"
      />
      <Stat
        label="Zero Range"
        value={zeroRange.toFixed(0)}
        unit="yds"
      />
      <Stat
        label="Max Ordinate"
        value={maxOrdinate.toFixed(2)}
        unit="in"
      />
      <Stat
        label="Transonic Range"
        value={transonicRange.toFixed(0)}
        unit="yds"
        warn={transonicRange < 800}
      />
    </div>
  );
}
