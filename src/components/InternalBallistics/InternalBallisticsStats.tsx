import type { InternalBallisticsResult } from "../../lib/internal-ballistics.ts";

interface StatProps {
  label: string;
  value: string;
  unit: string;
  warn?: boolean;
  danger?: boolean;
}

function Stat({ label, value, unit, warn, danger }: StatProps) {
  const valueColor = danger ? "var(--c-danger)" : warn ? "var(--c-warn)" : "var(--c-text)";

  return (
    <div
      className="rounded-md px-3 py-2 flex-1 min-w-28"
      style={{
        background: "var(--c-panel)",
        border: `1px solid ${danger ? "var(--c-danger)" : "var(--c-border)"}`,
      }}
    >
      <div className="text-[9px] uppercase tracking-[1.5px] font-mono mb-0.5" style={{ color: "var(--c-text-dim)" }}>
        {label}
      </div>
      <div className="flex items-baseline gap-0.5">
        <span className="text-lg font-bold" style={{ color: valueColor }}>
          {value}
        </span>
        <span className="text-[10px] font-mono" style={{ color: "var(--c-text-dim)" }}>
          {unit}
        </span>
      </div>
    </div>
  );
}

interface InternalBallisticsStatsProps {
  result: InternalBallisticsResult;
  saamiMaxPressure: number;
}

export function InternalBallisticsStats({ result, saamiMaxPressure }: InternalBallisticsStatsProps) {
  const pressurePercent = (result.peakPressure / saamiMaxPressure) * 100;
  const pressureWarn = pressurePercent > 90;
  const pressureDanger = pressurePercent > 100;

  return (
    <div className="mb-4">
      <div className="flex gap-2 flex-wrap mb-2">
        <Stat
          label="Predicted MV"
          value={result.muzzleVelocity.toFixed(0)}
          unit="fps"
        />
        <Stat
          label="Peak Pressure"
          value={(result.peakPressure / 1000).toFixed(1) + "k"}
          unit="psi"
          warn={pressureWarn}
          danger={pressureDanger}
        />
        <Stat
          label="SAAMI %"
          value={pressurePercent.toFixed(1)}
          unit="%"
          warn={pressureWarn}
          danger={pressureDanger}
        />
        <Stat
          label="Muzzle Energy"
          value={result.muzzleEnergy.toFixed(0)}
          unit="ft-lbs"
        />
      </div>
      <div className="flex gap-2 flex-wrap">
        <Stat
          label="Fill Ratio"
          value={(result.fillRatio * 100).toFixed(1)}
          unit="%"
          warn={result.fillRatio > 1.0}
        />
        <Stat
          label="Barrel Time"
          value={result.exitTime.toFixed(3)}
          unit="ms"
        />
        <Stat
          label="Efficiency"
          value={result.efficiencyPercent.toFixed(1)}
          unit="%"
        />
        <Stat
          label="Burn Complete"
          value={result.burnComplete ? result.burnCompletePosition.toFixed(1) + '"' : "No"}
          unit={result.burnComplete ? "" : "⚠"}
          warn={!result.burnComplete}
        />
      </div>

      {/* Safety warning — semantic danger, always red */}
      {result.overPressure && (
        <div
          className="mt-3 rounded-md px-3 py-2 text-[11px] font-mono"
          style={{
            background: "var(--c-accent-dim)",
            border: "1px solid var(--c-danger)",
            color: "var(--c-danger)",
          }}
        >
          ⚠ OVER-PRESSURE WARNING — Peak pressure ({(result.peakPressure / 1000).toFixed(1)}k psi)
          exceeds {(100 * 0.90).toFixed(0)}% of SAAMI maximum ({(saamiMaxPressure / 1000).toFixed(1)}k psi).
          Reduce charge weight. This simulator is for educational purposes only — always consult
          published load data.
        </div>
      )}

      {/* Muzzle pressure info */}
      <div
        className="mt-2 rounded-md px-3 py-1.5 text-[9px] font-mono"
        style={{ background: "var(--c-surface)", border: "1px solid var(--c-surface)", color: "var(--c-text-dim)" }}
      >
        Peak at {result.peakPressurePosition.toFixed(1)}" from chamber &middot;
        Muzzle pressure: {(result.muzzlePressure / 1000).toFixed(1)}k psi &middot;
        {result.burnComplete
          ? ` Powder consumed at ${result.burnCompletePosition.toFixed(1)}"`
          : " Powder still burning at muzzle exit"}
      </div>
    </div>
  );
}
