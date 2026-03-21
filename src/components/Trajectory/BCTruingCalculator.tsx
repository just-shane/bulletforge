import { useState } from "react";
import { refineBCFromVelocity } from "../../lib/ballistics.ts";
import type { DragModel } from "../../lib/ballistics.ts";

export function BCTruingCalculator() {
  const [velocity1, setVelocity1] = useState(2700);
  const [distance1, setDistance1] = useState(0);
  const [velocity2, setVelocity2] = useState(2450);
  const [distance2, setDistance2] = useState(300);
  const [publishedBC, setPublishedBC] = useState(0.264);
  const [dragModel, setDragModel] = useState<DragModel>("G7");

  const inputsValid =
    velocity1 > 0 &&
    velocity2 > 0 &&
    velocity2 < velocity1 &&
    distance2 > distance1 &&
    publishedBC > 0;

  const result = inputsValid
    ? refineBCFromVelocity(velocity1, distance1, velocity2, distance2, publishedBC, dragModel)
    : null;

  const inputStyle = {
    background: "var(--c-surface)",
    border: "1px solid var(--c-surface)",
    color: "var(--c-text)",
  };

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
          BC Truing Calculator
        </div>
      </div>

      <div className="px-4 pb-4">
        {/* Inputs grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          <div>
            <label className="block text-[8px] font-mono uppercase tracking-wider mb-0.5" style={{ color: "var(--c-text-dim)" }}>
              Muzzle Velocity (fps)
            </label>
            <input
              type="number"
              min={0}
              max={5000}
              step={1}
              value={velocity1}
              onChange={(e) => setVelocity1(Number(e.target.value))}
              className="w-full text-[10px] font-mono rounded px-2 py-1 outline-none"
              style={inputStyle}
            />
          </div>
          <div>
            <label className="block text-[8px] font-mono uppercase tracking-wider mb-0.5" style={{ color: "var(--c-text-dim)" }}>
              Muzzle Distance (yds)
            </label>
            <input
              type="number"
              min={0}
              max={2000}
              step={1}
              value={distance1}
              onChange={(e) => setDistance1(Number(e.target.value))}
              className="w-full text-[10px] font-mono rounded px-2 py-1 outline-none"
              style={inputStyle}
            />
          </div>
          <div>
            <label className="block text-[8px] font-mono uppercase tracking-wider mb-0.5" style={{ color: "var(--c-text-dim)" }}>
              Downrange Velocity (fps)
            </label>
            <input
              type="number"
              min={0}
              max={5000}
              step={1}
              value={velocity2}
              onChange={(e) => setVelocity2(Number(e.target.value))}
              className="w-full text-[10px] font-mono rounded px-2 py-1 outline-none"
              style={inputStyle}
            />
          </div>
          <div>
            <label className="block text-[8px] font-mono uppercase tracking-wider mb-0.5" style={{ color: "var(--c-text-dim)" }}>
              Downrange Distance (yds)
            </label>
            <input
              type="number"
              min={0}
              max={2000}
              step={1}
              value={distance2}
              onChange={(e) => setDistance2(Number(e.target.value))}
              className="w-full text-[10px] font-mono rounded px-2 py-1 outline-none"
              style={inputStyle}
            />
          </div>
          <div>
            <label className="block text-[8px] font-mono uppercase tracking-wider mb-0.5" style={{ color: "var(--c-text-dim)" }}>
              Published BC
            </label>
            <input
              type="number"
              min={0.01}
              max={1.0}
              step={0.001}
              value={publishedBC}
              onChange={(e) => setPublishedBC(Number(e.target.value))}
              className="w-full text-[10px] font-mono rounded px-2 py-1 outline-none"
              style={inputStyle}
            />
          </div>
          <div>
            <label className="block text-[8px] font-mono uppercase tracking-wider mb-0.5" style={{ color: "var(--c-text-dim)" }}>
              Drag Model
            </label>
            <div className="flex gap-1">
              <button
                type="button"
                className="flex-1 text-[10px] font-mono py-1 rounded"
                style={{
                  background: dragModel === "G1" ? "var(--c-accent)" : "var(--c-surface)",
                  border: dragModel === "G1" ? "1px solid var(--c-accent)" : "1px solid var(--c-surface)",
                  color: dragModel === "G1" ? "#fff" : "var(--c-text-muted)",
                  cursor: "pointer",
                }}
                onClick={() => setDragModel("G1")}
              >
                G1
              </button>
              <button
                type="button"
                className="flex-1 text-[10px] font-mono py-1 rounded"
                style={{
                  background: dragModel === "G7" ? "var(--c-accent)" : "var(--c-surface)",
                  border: dragModel === "G7" ? "1px solid var(--c-accent)" : "1px solid var(--c-surface)",
                  color: dragModel === "G7" ? "#fff" : "var(--c-text-muted)",
                  cursor: "pointer",
                }}
                onClick={() => setDragModel("G7")}
              >
                G7
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        {result && (
          <div
            className="mt-4 pt-3"
            style={{ borderTop: "1px solid var(--c-border)" }}
          >
            <div className="text-center">
              <div className="text-[8px] font-mono uppercase tracking-wider mb-1" style={{ color: "var(--c-text-dim)" }}>
                True BC ({dragModel})
              </div>
              <div className="text-lg font-bold font-mono" style={{ color: "var(--c-text)" }}>
                {result.trueBC.toFixed(3)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="text-center">
                <div className="text-[8px] font-mono uppercase tracking-wider mb-0.5" style={{ color: "var(--c-text-dim)" }}>
                  Correction Factor
                </div>
                <div className="text-[11px] font-mono font-medium" style={{ color: "var(--c-text)" }}>
                  {result.correctionFactor.toFixed(3)}x
                </div>
              </div>
              <div className="text-center">
                <div className="text-[8px] font-mono uppercase tracking-wider mb-0.5" style={{ color: "var(--c-text-dim)" }}>
                  Difference
                </div>
                <div
                  className="text-[11px] font-mono font-medium"
                  style={{
                    color: result.percentDifference <= 0 ? "var(--c-success)" : "var(--c-danger)",
                  }}
                >
                  {result.percentDifference > 0 ? "+" : ""}
                  {result.percentDifference.toFixed(1)}%
                  <span className="ml-1 text-[8px]" style={{ color: "var(--c-text-dim)" }}>
                    {result.percentDifference <= 0 ? "(conservative)" : "(optimistic)"}
                  </span>
                </div>
              </div>
            </div>

            <div
              className="mt-3 pt-2 text-[9px] font-mono"
              style={{ borderTop: "1px solid var(--c-surface)", color: "var(--c-text-muted)" }}
            >
              {result.assessment}
            </div>
          </div>
        )}

        {!inputsValid && (
          <div
            className="mt-4 pt-3 text-center text-[9px] font-mono"
            style={{ borderTop: "1px solid var(--c-border)", color: "var(--c-text-faint)" }}
          >
            Enter valid chronograph data to calculate true BC
          </div>
        )}
      </div>
    </div>
  );
}
