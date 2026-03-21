import { useState } from "react";
import { useBallisticsStore } from "../../store/store.ts";
import { SCOPE_PRESETS } from "../../lib/optics.ts";
import type { ScopeProfile } from "../../lib/optics.ts";

export function ScopeConfig() {
  const scope = useBallisticsStore((s) => s.scope);
  const currentMagnification = useBallisticsStore((s) => s.currentMagnification);
  const setScope = useBallisticsStore((s) => s.setScope);
  const setCurrentMagnification = useBallisticsStore((s) => s.setCurrentMagnification);

  const [expanded, setExpanded] = useState(false);

  function handlePreset(index: number) {
    if (index < 0 || index >= SCOPE_PRESETS.length) return;
    const preset = SCOPE_PRESETS[index];
    setScope(preset.scope);
    // Reset magnification to midpoint of new scope
    setCurrentMagnification(
      Math.round((preset.scope.magnificationMin + preset.scope.magnificationMax) / 2)
    );
  }

  function updateScope(partial: Partial<ScopeProfile>) {
    setScope({ ...scope, ...partial });
  }

  return (
    <div>
      {/* Header / toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full text-left cursor-pointer"
        style={{ background: "transparent", border: "none", padding: 0 }}
      >
        <span
          className="text-[10px] tracking-[2px] font-mono uppercase"
          style={{ color: "var(--c-accent)" }}
        >
          Optics
        </span>
        <span
          className="text-[10px] font-mono"
          style={{ color: "var(--c-text-faint)" }}
        >
          {expanded ? "\u25B4" : "\u25BE"}
        </span>
      </button>

      {/* Summary line when collapsed */}
      {!expanded && (
        <div className="text-[9px] font-mono mt-1" style={{ color: "var(--c-text-muted)" }}>
          {scope.reticleUnit} / {scope.clickValue} click / {scope.focalPlane}
          {" "}&middot;{" "}
          {scope.magnificationMin}-{scope.magnificationMax}x
        </div>
      )}

      {expanded && (
        <div className="mt-2">
          {/* Preset selector */}
          <div className="mb-2">
            <div className="text-[9px] font-mono mb-0.5" style={{ color: "var(--c-text-muted)" }}>
              Preset
            </div>
            <select
              value={-1}
              onChange={(e) => handlePreset(Number(e.target.value))}
              className="w-full rounded text-[10px] font-mono px-2 py-1 cursor-pointer"
              style={{
                background: "var(--c-surface)",
                border: "1px solid var(--c-border)",
                color: "var(--c-text)",
              }}
            >
              <option value={-1}>Select a preset...</option>
              {SCOPE_PRESETS.map((p, i) => (
                <option key={i} value={i}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Reticle unit toggle */}
          <div className="mb-2">
            <div className="text-[9px] font-mono mb-0.5" style={{ color: "var(--c-text-muted)" }}>
              Reticle Unit
            </div>
            <div className="flex gap-1">
              {(["MIL", "MOA"] as const).map((unit) => (
                <button
                  key={unit}
                  onClick={() => updateScope({
                    reticleUnit: unit,
                    clickValue: unit === "MIL" ? 0.1 : 0.25,
                    maxElevationTravel: unit === "MIL" ? 30 : 100,
                    maxWindageTravel: unit === "MIL" ? 20 : 60,
                  })}
                  className="flex-1 rounded text-[10px] font-mono py-1 cursor-pointer transition-colors"
                  style={{
                    background: scope.reticleUnit === unit ? "var(--c-accent-dim)" : "var(--c-surface)",
                    border: `1px solid ${scope.reticleUnit === unit ? "var(--c-accent)" : "var(--c-border)"}`,
                    color: scope.reticleUnit === unit ? "var(--c-accent)" : "var(--c-text-muted)",
                  }}
                >
                  {unit}
                </button>
              ))}
            </div>
          </div>

          {/* Click value */}
          <div className="mb-2">
            <div className="flex justify-between text-[9px] font-mono mb-0.5">
              <span style={{ color: "var(--c-text-muted)" }}>Click Value ({scope.reticleUnit})</span>
              <span style={{ color: "var(--c-accent)" }}>{scope.clickValue}</span>
            </div>
            <input
              type="number"
              step={scope.reticleUnit === "MIL" ? 0.05 : 0.125}
              min={0.01}
              max={scope.reticleUnit === "MIL" ? 1 : 4}
              value={scope.clickValue}
              onChange={(e) => updateScope({ clickValue: Number(e.target.value) })}
              className="w-full rounded text-[10px] font-mono px-2 py-1"
              style={{
                background: "var(--c-surface)",
                border: "1px solid var(--c-border)",
                color: "var(--c-text)",
              }}
            />
          </div>

          {/* Focal plane toggle */}
          <div className="mb-2">
            <div className="text-[9px] font-mono mb-0.5" style={{ color: "var(--c-text-muted)" }}>
              Focal Plane
            </div>
            <div className="flex gap-1">
              {(["FFP", "SFP"] as const).map((fp) => (
                <button
                  key={fp}
                  onClick={() => updateScope({ focalPlane: fp })}
                  className="flex-1 rounded text-[10px] font-mono py-1 cursor-pointer transition-colors"
                  style={{
                    background: scope.focalPlane === fp ? "var(--c-accent-dim)" : "var(--c-surface)",
                    border: `1px solid ${scope.focalPlane === fp ? "var(--c-accent)" : "var(--c-border)"}`,
                    color: scope.focalPlane === fp ? "var(--c-accent)" : "var(--c-text-muted)",
                  }}
                >
                  {fp}
                </button>
              ))}
            </div>
          </div>

          {/* SFP magnification slider */}
          {scope.focalPlane === "SFP" && (
            <div className="mb-2">
              <div className="flex justify-between text-[9px] font-mono mb-0.5">
                <span style={{ color: "var(--c-text-muted)" }}>Current Magnification</span>
                <span style={{ color: "var(--c-accent)" }}>{currentMagnification}x</span>
              </div>
              <input
                type="range"
                min={scope.magnificationMin}
                max={scope.magnificationMax}
                step={0.5}
                value={currentMagnification}
                onChange={(e) => setCurrentMagnification(Number(e.target.value))}
                className="w-full"
              />
              <div
                className="text-[8px] font-mono mt-0.5 px-1 rounded py-0.5"
                style={{ color: "var(--c-text-faint)", background: "var(--c-surface)" }}
              >
                Holdovers adjusted for {currentMagnification}x (calibrated at {scope.calibratedMag}x)
              </div>
            </div>
          )}

          {/* Max elevation travel */}
          <div className="mb-2">
            <div className="flex justify-between text-[9px] font-mono mb-0.5">
              <span style={{ color: "var(--c-text-muted)" }}>Max Elev Travel ({scope.reticleUnit})</span>
              <span style={{ color: "var(--c-accent)" }}>{scope.maxElevationTravel}</span>
            </div>
            <input
              type="number"
              step={scope.reticleUnit === "MIL" ? 0.5 : 5}
              min={0}
              value={scope.maxElevationTravel}
              onChange={(e) => updateScope({ maxElevationTravel: Number(e.target.value) })}
              className="w-full rounded text-[10px] font-mono px-2 py-1"
              style={{
                background: "var(--c-surface)",
                border: "1px solid var(--c-border)",
                color: "var(--c-text)",
              }}
            />
          </div>

          {/* Max windage travel */}
          <div className="mb-2">
            <div className="flex justify-between text-[9px] font-mono mb-0.5">
              <span style={{ color: "var(--c-text-muted)" }}>Max Wind Travel ({scope.reticleUnit})</span>
              <span style={{ color: "var(--c-accent)" }}>{scope.maxWindageTravel}</span>
            </div>
            <input
              type="number"
              step={scope.reticleUnit === "MIL" ? 0.5 : 5}
              min={0}
              value={scope.maxWindageTravel}
              onChange={(e) => updateScope({ maxWindageTravel: Number(e.target.value) })}
              className="w-full rounded text-[10px] font-mono px-2 py-1"
              style={{
                background: "var(--c-surface)",
                border: "1px solid var(--c-border)",
                color: "var(--c-text)",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
