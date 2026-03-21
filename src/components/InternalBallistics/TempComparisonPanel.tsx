import { useMemo, useState } from "react";
import type { InternalBallisticsConfig } from "../../lib/internal-ballistics.ts";
import { compareLoadAtTemps, POWDER_INTERNAL_DATA } from "../../lib/internal-ballistics.ts";

interface TempComparisonPanelProps {
  config: InternalBallisticsConfig;
  powderName: string;
  saamiMaxPressure: number;
}

export function TempComparisonPanel({
  config,
  powderName,
  saamiMaxPressure,
}: TempComparisonPanelProps) {
  const [coldTemp, setColdTemp] = useState(20);
  const [hotTemp, setHotTemp] = useState(100);

  const comparison = useMemo(
    () => compareLoadAtTemps(config, powderName, coldTemp, hotTemp, 59),
    [config, powderName, coldTemp, hotTemp],
  );

  const powder = POWDER_INTERNAL_DATA[powderName];
  const sensitivity = powder?.tempSensitivity ?? 0;

  const coldSaamiPct = (comparison.cold.pressure / saamiMaxPressure) * 100;
  const hotSaamiPct = (comparison.hot.pressure / saamiMaxPressure) * 100;

  return (
    <div
      className="rounded-md p-4"
      style={{ background: "var(--c-panel)", border: "1px solid var(--c-border)" }}
    >
      <div
        className="text-[11px] font-mono tracking-[2px] uppercase mb-3"
        style={{ color: "var(--c-accent)" }}
      >
        Temperature Comparison — {powderName}
      </div>

      {/* Temp sliders — these use semantic blue/red for cold/hot, not theme accent */}
      <div className="flex gap-4 mb-4">
        <div className="flex-1">
          <div className="text-[9px] font-mono mb-1" style={{ color: "#60a5fa" }}>
            Cold: {coldTemp}°F
          </div>
          <input
            type="range"
            min={-20}
            max={50}
            value={coldTemp}
            onChange={(e) => setColdTemp(Number(e.target.value))}
            className="w-full"
          />
        </div>
        <div className="flex-1">
          <div className="text-[9px] font-mono mb-1" style={{ color: "#f87171" }}>
            Hot: {hotTemp}°F
          </div>
          <input
            type="range"
            min={60}
            max={130}
            value={hotTemp}
            onChange={(e) => setHotTemp(Number(e.target.value))}
            className="w-full"
          />
        </div>
      </div>

      {/* Side-by-side */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* Cold */}
        <div
          className="rounded-md p-3"
          style={{ background: "var(--c-surface)", border: "1px solid #1e3a5f" }}
        >
          <div className="text-[10px] font-mono mb-2" style={{ color: "#60a5fa" }}>
            {coldTemp}°F — Cold
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-mono">
              <span style={{ color: "var(--c-text-dim)" }}>Velocity</span>
              <span style={{ color: "var(--c-text)" }}>{comparison.cold.velocity} fps</span>
            </div>
            <div className="flex justify-between text-[10px] font-mono">
              <span style={{ color: "var(--c-text-dim)" }}>Pressure</span>
              <span style={{ color: "var(--c-text)" }}>
                {(comparison.cold.pressure / 1000).toFixed(1)}k psi
              </span>
            </div>
            <div className="flex justify-between text-[10px] font-mono">
              <span style={{ color: "var(--c-text-dim)" }}>SAAMI</span>
              <span style={{ color: coldSaamiPct > 100 ? "var(--c-danger)" : coldSaamiPct > 90 ? "var(--c-warn)" : "var(--c-success)" }}>
                {coldSaamiPct.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Hot */}
        <div
          className="rounded-md p-3"
          style={{ background: "var(--c-surface)", border: "1px solid #5f1e1e" }}
        >
          <div className="text-[10px] font-mono mb-2" style={{ color: "#f87171" }}>
            {hotTemp}°F — Hot
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-mono">
              <span style={{ color: "var(--c-text-dim)" }}>Velocity</span>
              <span style={{ color: "var(--c-text)" }}>{comparison.hot.velocity} fps</span>
            </div>
            <div className="flex justify-between text-[10px] font-mono">
              <span style={{ color: "var(--c-text-dim)" }}>Pressure</span>
              <span style={{ color: "var(--c-text)" }}>
                {(comparison.hot.pressure / 1000).toFixed(1)}k psi
              </span>
            </div>
            <div className="flex justify-between text-[10px] font-mono">
              <span style={{ color: "var(--c-text-dim)" }}>SAAMI</span>
              <span style={{ color: hotSaamiPct > 100 ? "var(--c-danger)" : hotSaamiPct > 90 ? "var(--c-warn)" : "var(--c-success)" }}>
                {hotSaamiPct.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Delta summary */}
      <div
        className="rounded-md px-3 py-2 text-[9px] font-mono"
        style={{ background: "var(--c-surface)", border: "1px solid var(--c-surface)" }}
      >
        <div className="flex flex-wrap gap-x-4 gap-y-1" style={{ color: "var(--c-text-muted)" }}>
          <span>
            Delta: <span style={{ color: "var(--c-text)" }}>+{comparison.velocityDelta} fps</span> / <span style={{ color: "var(--c-text)" }}>+{(comparison.pressureDelta / 1000).toFixed(1)}k psi</span>
          </span>
          <span>
            Temp sensitivity: <span style={{ color: "var(--c-text)" }}>{sensitivity.toFixed(1)} fps/°F</span>
          </span>
          <span>
            Rating:{" "}
            <span
              style={{
                color: sensitivity <= 0.6 ? "var(--c-success)" : sensitivity <= 1.0 ? "var(--c-warn)" : "var(--c-danger)",
              }}
            >
              {sensitivity <= 0.6 ? "Temp-stable" : sensitivity <= 1.0 ? "Moderate" : "Temp-sensitive"}
            </span>
          </span>
        </div>
      </div>

      {/* Hot load warning — semantic danger */}
      {hotSaamiPct > 95 && (
        <div
          className="mt-2 rounded-md px-3 py-2 text-[9px] font-mono"
          style={{
            background: "var(--c-accent-dim)",
            border: "1px solid var(--c-danger)",
            color: "var(--c-danger)",
          }}
        >
          Hot-weather load approaches SAAMI limit ({hotSaamiPct.toFixed(1)}%). Consider
          reducing charge 0.3-0.5gr for summer use or switching to a more temp-stable powder.
        </div>
      )}
    </div>
  );
}
