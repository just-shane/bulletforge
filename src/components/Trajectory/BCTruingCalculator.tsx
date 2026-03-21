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
    background: "#0f0f0f",
    border: "1px solid #1a1a1a",
    color: "#d4d4d4",
  };

  return (
    <div
      className="rounded-md overflow-hidden"
      style={{ background: "#141414", border: "1px solid #2a2a2a" }}
    >
      <div className="px-4 pt-3 pb-2">
        <div
          className="text-[11px] font-mono tracking-[2px] uppercase"
          style={{ color: "#ef4444" }}
        >
          BC Truing Calculator
        </div>
      </div>

      <div className="px-4 pb-4">
        {/* Inputs grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          <div>
            <label className="block text-[8px] font-mono text-neutral-500 uppercase tracking-wider mb-0.5">
              Muzzle Velocity (fps)
            </label>
            <input
              type="number"
              min={0}
              max={5000}
              step={1}
              value={velocity1}
              onChange={(e) => setVelocity1(Number(e.target.value))}
              className="w-full text-[10px] font-mono rounded px-2 py-1 outline-none focus:border-neutral-500"
              style={inputStyle}
            />
          </div>
          <div>
            <label className="block text-[8px] font-mono text-neutral-500 uppercase tracking-wider mb-0.5">
              Muzzle Distance (yds)
            </label>
            <input
              type="number"
              min={0}
              max={2000}
              step={1}
              value={distance1}
              onChange={(e) => setDistance1(Number(e.target.value))}
              className="w-full text-[10px] font-mono rounded px-2 py-1 outline-none focus:border-neutral-500"
              style={inputStyle}
            />
          </div>
          <div>
            <label className="block text-[8px] font-mono text-neutral-500 uppercase tracking-wider mb-0.5">
              Downrange Velocity (fps)
            </label>
            <input
              type="number"
              min={0}
              max={5000}
              step={1}
              value={velocity2}
              onChange={(e) => setVelocity2(Number(e.target.value))}
              className="w-full text-[10px] font-mono rounded px-2 py-1 outline-none focus:border-neutral-500"
              style={inputStyle}
            />
          </div>
          <div>
            <label className="block text-[8px] font-mono text-neutral-500 uppercase tracking-wider mb-0.5">
              Downrange Distance (yds)
            </label>
            <input
              type="number"
              min={0}
              max={2000}
              step={1}
              value={distance2}
              onChange={(e) => setDistance2(Number(e.target.value))}
              className="w-full text-[10px] font-mono rounded px-2 py-1 outline-none focus:border-neutral-500"
              style={inputStyle}
            />
          </div>
          <div>
            <label className="block text-[8px] font-mono text-neutral-500 uppercase tracking-wider mb-0.5">
              Published BC
            </label>
            <input
              type="number"
              min={0.01}
              max={1.0}
              step={0.001}
              value={publishedBC}
              onChange={(e) => setPublishedBC(Number(e.target.value))}
              className="w-full text-[10px] font-mono rounded px-2 py-1 outline-none focus:border-neutral-500"
              style={inputStyle}
            />
          </div>
          <div>
            <label className="block text-[8px] font-mono text-neutral-500 uppercase tracking-wider mb-0.5">
              Drag Model
            </label>
            <div className="flex gap-1">
              <button
                type="button"
                className="flex-1 text-[10px] font-mono py-1 rounded"
                style={{
                  background: dragModel === "G1" ? "#ef4444" : "#0f0f0f",
                  border: dragModel === "G1" ? "1px solid #ef4444" : "1px solid #1a1a1a",
                  color: dragModel === "G1" ? "#fff" : "#a3a3a3",
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
                  background: dragModel === "G7" ? "#ef4444" : "#0f0f0f",
                  border: dragModel === "G7" ? "1px solid #ef4444" : "1px solid #1a1a1a",
                  color: dragModel === "G7" ? "#fff" : "#a3a3a3",
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
            style={{ borderTop: "1px solid #2a2a2a" }}
          >
            <div className="text-center">
              <div className="text-[8px] font-mono text-neutral-500 uppercase tracking-wider mb-1">
                True BC ({dragModel})
              </div>
              <div className="text-lg font-bold font-mono text-neutral-100">
                {result.trueBC.toFixed(3)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="text-center">
                <div className="text-[8px] font-mono text-neutral-500 uppercase tracking-wider mb-0.5">
                  Correction Factor
                </div>
                <div className="text-[11px] font-mono font-medium text-neutral-300">
                  {result.correctionFactor.toFixed(3)}x
                </div>
              </div>
              <div className="text-center">
                <div className="text-[8px] font-mono text-neutral-500 uppercase tracking-wider mb-0.5">
                  Difference
                </div>
                <div
                  className="text-[11px] font-mono font-medium"
                  style={{
                    color: result.percentDifference <= 0 ? "#22c55e" : "#ef4444",
                  }}
                >
                  {result.percentDifference > 0 ? "+" : ""}
                  {result.percentDifference.toFixed(1)}%
                  <span className="ml-1 text-[8px] text-neutral-500">
                    {result.percentDifference <= 0 ? "(conservative)" : "(optimistic)"}
                  </span>
                </div>
              </div>
            </div>

            <div
              className="mt-3 pt-2 text-[9px] font-mono text-neutral-400"
              style={{ borderTop: "1px solid #1a1a1a" }}
            >
              {result.assessment}
            </div>
          </div>
        )}

        {!inputsValid && (
          <div
            className="mt-4 pt-3 text-center text-[9px] font-mono text-neutral-600"
            style={{ borderTop: "1px solid #2a2a2a" }}
          >
            Enter valid chronograph data to calculate true BC
          </div>
        )}
      </div>
    </div>
  );
}
