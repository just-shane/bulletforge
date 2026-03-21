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
      style={{ background: "#141414", border: "1px solid #2a2a2a" }}
    >
      <div
        className="text-[11px] font-mono tracking-[2px] uppercase mb-3"
        style={{ color: "#ef4444" }}
      >
        Temperature Comparison — {powderName}
      </div>

      {/* Temp sliders */}
      <div className="flex gap-4 mb-4">
        <div className="flex-1">
          <div className="text-[9px] font-mono text-blue-400 mb-1">
            Cold: {coldTemp}°F
          </div>
          <input
            type="range"
            min={-20}
            max={50}
            value={coldTemp}
            onChange={(e) => setColdTemp(Number(e.target.value))}
            className="w-full accent-blue-500"
            style={{ height: 4 }}
          />
        </div>
        <div className="flex-1">
          <div className="text-[9px] font-mono text-red-400 mb-1">
            Hot: {hotTemp}°F
          </div>
          <input
            type="range"
            min={60}
            max={130}
            value={hotTemp}
            onChange={(e) => setHotTemp(Number(e.target.value))}
            className="w-full accent-red-500"
            style={{ height: 4 }}
          />
        </div>
      </div>

      {/* Side-by-side */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* Cold */}
        <div
          className="rounded-md p-3"
          style={{ background: "#0f0f0f", border: "1px solid #1e3a5f" }}
        >
          <div className="text-[10px] font-mono text-blue-400 mb-2">
            {coldTemp}°F — Cold
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-neutral-500">Velocity</span>
              <span className="text-neutral-200">{comparison.cold.velocity} fps</span>
            </div>
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-neutral-500">Pressure</span>
              <span className="text-neutral-200">
                {(comparison.cold.pressure / 1000).toFixed(1)}k psi
              </span>
            </div>
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-neutral-500">SAAMI</span>
              <span style={{ color: coldSaamiPct > 100 ? "#ef4444" : coldSaamiPct > 90 ? "#f59e0b" : "#22c55e" }}>
                {coldSaamiPct.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Hot */}
        <div
          className="rounded-md p-3"
          style={{ background: "#0f0f0f", border: "1px solid #5f1e1e" }}
        >
          <div className="text-[10px] font-mono text-red-400 mb-2">
            {hotTemp}°F — Hot
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-neutral-500">Velocity</span>
              <span className="text-neutral-200">{comparison.hot.velocity} fps</span>
            </div>
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-neutral-500">Pressure</span>
              <span className="text-neutral-200">
                {(comparison.hot.pressure / 1000).toFixed(1)}k psi
              </span>
            </div>
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-neutral-500">SAAMI</span>
              <span style={{ color: hotSaamiPct > 100 ? "#ef4444" : hotSaamiPct > 90 ? "#f59e0b" : "#22c55e" }}>
                {hotSaamiPct.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Delta summary */}
      <div
        className="rounded-md px-3 py-2 text-[9px] font-mono"
        style={{ background: "#0f0f0f", border: "1px solid #1a1a1a" }}
      >
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-neutral-400">
          <span>
            Delta: <span className="text-neutral-200">+{comparison.velocityDelta} fps</span> / <span className="text-neutral-200">+{(comparison.pressureDelta / 1000).toFixed(1)}k psi</span>
          </span>
          <span>
            Temp sensitivity: <span className="text-neutral-200">{sensitivity.toFixed(1)} fps/°F</span>
          </span>
          <span>
            Rating:{" "}
            <span
              style={{
                color: sensitivity <= 0.6 ? "#22c55e" : sensitivity <= 1.0 ? "#f59e0b" : "#ef4444",
              }}
            >
              {sensitivity <= 0.6 ? "Temp-stable" : sensitivity <= 1.0 ? "Moderate" : "Temp-sensitive"}
            </span>
          </span>
        </div>
      </div>

      {/* Hot load warning */}
      {hotSaamiPct > 95 && (
        <div
          className="mt-2 rounded-md px-3 py-2 text-[9px] font-mono"
          style={{
            background: "rgba(239, 68, 68, 0.08)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            color: "#ef4444",
          }}
        >
          Hot-weather load approaches SAAMI limit ({hotSaamiPct.toFixed(1)}%). Consider
          reducing charge 0.3-0.5gr for summer use or switching to a more temp-stable powder.
        </div>
      )}
    </div>
  );
}
