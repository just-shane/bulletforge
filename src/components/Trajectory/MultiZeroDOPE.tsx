import { useState, useMemo } from "react";
import { useBallisticsStore } from "../../store/store.ts";
import { trajectory } from "../../lib/ballistics.ts";
import type { TrajectoryConfig, TrajectoryPoint } from "../../lib/ballistics.ts";

interface Scenario {
  label: string;
  altitude: number;
  temperature: number;
}

export function MultiZeroDOPE() {
  const bullet = useBallisticsStore((s) => s.bullet);
  const muzzleVelocity = useBallisticsStore((s) => s.muzzleVelocity);
  const sightHeight = useBallisticsStore((s) => s.sightHeight);
  const zeroRange = useBallisticsStore((s) => s.zeroRange);
  const windSpeed = useBallisticsStore((s) => s.windSpeed);
  const windAngle = useBallisticsStore((s) => s.windAngle);
  const shootingAngle = useBallisticsStore((s) => s.shootingAngle);
  const altitude = useBallisticsStore((s) => s.altitude);
  const temperature = useBallisticsStore((s) => s.temperature);
  const barometricPressure = useBallisticsStore((s) => s.barometricPressure);
  const humidity = useBallisticsStore((s) => s.humidity);
  const latitude = useBallisticsStore((s) => s.latitude);
  const azimuth = useBallisticsStore((s) => s.azimuth);

  const [scenarios, setScenarios] = useState<Scenario[]>([
    { label: "Current", altitude, temperature },
  ]);

  const [expanded, setExpanded] = useState(false);

  function addScenario() {
    if (scenarios.length >= 4) return;
    setScenarios([
      ...scenarios,
      { label: `Scenario ${scenarios.length + 1}`, altitude: 0, temperature: 59 },
    ]);
  }

  function removeScenario(index: number) {
    if (scenarios.length <= 1) return;
    setScenarios(scenarios.filter((_, i) => i !== index));
  }

  function updateScenario(index: number, field: keyof Scenario, value: string | number) {
    setScenarios(scenarios.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  }

  const scenarioResults = useMemo(() => {
    return scenarios.map((scenario) => {
      const config: TrajectoryConfig = {
        muzzleVelocity,
        bulletWeight: bullet.weight,
        bulletDiameter: bullet.diameter,
        bc: bullet.bc_g7 > 0 ? bullet.bc_g7 : bullet.bc_g1,
        dragModel: (bullet.bc_g7 > 0 ? "G7" : "G1") as "G7" | "G1",
        sightHeight,
        zeroRange,
        windSpeed,
        windAngle,
        shootingAngle,
        altitude: scenario.altitude,
        temperature: scenario.temperature,
        barometricPressure,
        humidity,
        latitude,
        azimuth,
      };
      const result = trajectory(config);
      // Filter to 100-yard increments
      const keyDistances = new Set<number>();
      for (let r = 100; r <= (config.maxRange ?? 1200); r += 100) keyDistances.add(r);
      return result.points.filter((p) => keyDistances.has(p.range));
    });
  }, [scenarios, bullet, muzzleVelocity, sightHeight, zeroRange, windSpeed, windAngle, shootingAngle, barometricPressure, humidity, latitude, azimuth]);

  return (
    <div
      className="multi-zero-dope-print rounded-md overflow-hidden"
      style={{ background: "var(--c-panel)", border: "1px solid var(--c-border)" }}
    >
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .multi-zero-dope-print,
          .multi-zero-dope-print * {
            visibility: visible !important;
          }
          .multi-zero-dope-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: #fff !important;
            border: 1px solid #ccc !important;
            color: #000 !important;
            font-size: 9px !important;
          }
          .multi-zero-dope-print table {
            font-size: 8px !important;
          }
          .multi-zero-dope-print th,
          .multi-zero-dope-print td {
            color: #000 !important;
            border-bottom: 1px solid #ccc !important;
            padding: 2px 4px !important;
          }
          .multi-zero-dope-print .mz-print-btn,
          .multi-zero-dope-print .mz-controls {
            display: none !important;
          }
        }
      `}</style>

      {/* Title bar */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <button
          type="button"
          className="text-[11px] font-mono tracking-[2px] uppercase cursor-pointer bg-transparent border-none p-0"
          style={{ color: "var(--c-accent)" }}
          onClick={() => setExpanded(!expanded)}
        >
          Multi-Zero DOPE {expanded ? "▾" : "▸"}
        </button>
        {expanded && (
          <div className="flex gap-2">
            <button
              type="button"
              className="mz-controls text-[10px] font-mono px-2 py-0.5 rounded"
              style={{
                background: "var(--c-border)",
                border: "1px solid var(--c-border-light)",
                color: "var(--c-text)",
                cursor: "pointer",
                opacity: scenarios.length >= 4 ? 0.4 : 1,
              }}
              onClick={addScenario}
              disabled={scenarios.length >= 4}
            >
              + Add Scenario
            </button>
            <button
              type="button"
              className="mz-print-btn text-[10px] font-mono px-2 py-0.5 rounded"
              style={{
                background: "var(--c-border)",
                border: "1px solid var(--c-border-light)",
                color: "var(--c-text)",
                cursor: "pointer",
              }}
              onClick={() => window.print()}
            >
              Print All
            </button>
          </div>
        )}
      </div>

      {expanded && (
        <div className="px-4 pb-4">
          {scenarios.map((scenario, idx) => (
            <div key={idx} className="mb-4">
              {/* Scenario controls */}
              <div
                className="mz-controls flex items-center gap-3 mb-2 pb-2"
                style={{ borderBottom: "1px solid var(--c-border)" }}
              >
                <input
                  type="text"
                  value={scenario.label}
                  onChange={(e) => updateScenario(idx, "label", e.target.value)}
                  className="text-[10px] font-mono px-2 py-0.5 rounded w-28"
                  style={{
                    background: "var(--c-surface)",
                    border: "1px solid var(--c-border)",
                    color: "var(--c-text)",
                  }}
                />
                <label className="text-[9px] font-mono" style={{ color: "var(--c-text-dim)" }}>
                  Alt (ft):
                  <input
                    type="number"
                    value={scenario.altitude}
                    onChange={(e) => updateScenario(idx, "altitude", Number(e.target.value))}
                    className="ml-1 text-[10px] font-mono px-1 py-0.5 rounded w-16"
                    style={{
                      background: "var(--c-surface)",
                      border: "1px solid var(--c-border)",
                      color: "var(--c-text)",
                    }}
                  />
                </label>
                <label className="text-[9px] font-mono" style={{ color: "var(--c-text-dim)" }}>
                  Temp (°F):
                  <input
                    type="number"
                    value={scenario.temperature}
                    onChange={(e) => updateScenario(idx, "temperature", Number(e.target.value))}
                    className="ml-1 text-[10px] font-mono px-1 py-0.5 rounded w-16"
                    style={{
                      background: "var(--c-surface)",
                      border: "1px solid var(--c-border)",
                      color: "var(--c-text)",
                    }}
                  />
                </label>
                {scenarios.length > 1 && (
                  <button
                    type="button"
                    className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                    style={{
                      background: "var(--c-surface)",
                      border: "1px solid var(--c-border)",
                      color: "var(--c-text-dim)",
                      cursor: "pointer",
                    }}
                    onClick={() => removeScenario(idx)}
                  >
                    Remove
                  </button>
                )}
              </div>

              {/* Scenario header */}
              <div
                className="grid grid-cols-4 gap-x-4 gap-y-1 text-[9px] font-mono mb-1 pb-1"
                style={{ borderBottom: "1px solid var(--c-border)" }}
              >
                <div>
                  <span style={{ color: "var(--c-text-dim)" }}>Label: </span>
                  <span style={{ color: "var(--c-text)" }}>{scenario.label}</span>
                </div>
                <div>
                  <span style={{ color: "var(--c-text-dim)" }}>Alt: </span>
                  <span style={{ color: "var(--c-text)" }}>{scenario.altitude} ft</span>
                </div>
                <div>
                  <span style={{ color: "var(--c-text-dim)" }}>Temp: </span>
                  <span style={{ color: "var(--c-text)" }}>{scenario.temperature}°F</span>
                </div>
                <div>
                  <span style={{ color: "var(--c-text-dim)" }}>Zero: </span>
                  <span style={{ color: "var(--c-text)" }}>{zeroRange} yds</span>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-[10px] font-mono">
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--c-border)" }}>
                      <th className="px-3 py-1.5 text-left uppercase tracking-wider font-normal" style={{ color: "var(--c-text-dim)" }}>Range</th>
                      <th className="px-3 py-1.5 text-right uppercase tracking-wider font-normal" style={{ color: "var(--c-text-dim)" }}>Drop (MIL)</th>
                      <th className="px-3 py-1.5 text-right uppercase tracking-wider font-normal" style={{ color: "var(--c-text-dim)" }}>Wind (MIL)</th>
                      <th className="px-3 py-1.5 text-right uppercase tracking-wider font-normal" style={{ color: "var(--c-text-dim)" }}>Vel</th>
                      <th className="px-3 py-1.5 text-right uppercase tracking-wider font-normal" style={{ color: "var(--c-text-dim)" }}>TOF</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scenarioResults[idx]?.map((p: TrajectoryPoint) => (
                      <tr
                        key={p.range}
                        style={{
                          borderBottom: "1px solid var(--c-surface)",
                          color: "var(--c-text)",
                        }}
                      >
                        <td className="px-3 py-1 text-left font-medium">{p.range}</td>
                        <td className="px-3 py-1 text-right">{p.dropMIL.toFixed(2)}</td>
                        <td className="px-3 py-1 text-right">{p.driftMIL.toFixed(2)}</td>
                        <td className="px-3 py-1 text-right">{p.velocity.toFixed(0)}</td>
                        <td className="px-3 py-1 text-right">{p.time.toFixed(3)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {(!scenarioResults[idx] || scenarioResults[idx].length === 0) && (
                <div className="px-4 py-4 text-center text-[11px] font-mono" style={{ color: "var(--c-text-dim)" }}>
                  No data at 100-yard increments
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
