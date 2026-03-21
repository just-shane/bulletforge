interface StatProps {
  label: string;
  value: string;
  unit: string;
  accent?: boolean;
  warn?: boolean;
}

function Stat({ label, value, unit, accent, warn }: StatProps) {
  const valueColor = warn ? "#f59e0b" : accent ? "#ef4444" : "#e5e5e5";

  return (
    <div
      className="rounded-md px-3 py-2 flex-1 min-w-30"
      style={{
        background: "#141414",
        border: "1px solid #2a2a2a",
      }}
      role="status"
      aria-label={`${label}: ${value} ${unit}`}
    >
      <div className="text-[9px] uppercase tracking-[1.5px] font-mono mb-0.5 text-neutral-500">
        {label}
      </div>
      <div className="flex items-baseline gap-0.5">
        <span className="text-xl font-bold" style={{ color: valueColor }}>
          {value}
        </span>
        <span className="text-[10px] font-mono text-neutral-500">
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
