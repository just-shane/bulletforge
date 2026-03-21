import type { SeatingDepthPlan } from "../../lib/load-development.ts";

interface SeatingDepthViewProps {
  plan: SeatingDepthPlan;
  maxMagazineOAL?: number;
}

export function SeatingDepthView({ plan, maxMagazineOAL }: SeatingDepthViewProps) {
  return (
    <div>
      <div
        className="text-[10px] tracking-[2px] font-mono uppercase mb-3"
        style={{ color: "#ef4444" }}
      >
        Seating Depth Test Plan
      </div>

      {/* Summary */}
      <div className="flex gap-2 flex-wrap mb-4">
        <div
          className="rounded-md px-3 py-2 flex-1 min-w-28"
          style={{ background: "#141414", border: "1px solid #2a2a2a" }}
        >
          <div className="text-[9px] uppercase tracking-[1.5px] font-mono mb-0.5 text-neutral-500">
            Base OAL (Jam)
          </div>
          <span className="text-lg font-bold text-neutral-200">
            {plan.baseOAL.toFixed(3)}
          </span>
          <span className="text-[10px] font-mono text-neutral-500">"</span>
        </div>
        <div
          className="rounded-md px-3 py-2 flex-1 min-w-28"
          style={{ background: "#141414", border: "1px solid #2a2a2a" }}
        >
          <div className="text-[9px] uppercase tracking-[1.5px] font-mono mb-0.5 text-neutral-500">
            Steps
          </div>
          <span className="text-lg font-bold text-neutral-200">
            {plan.steps.length}
          </span>
        </div>
        <div
          className="rounded-md px-3 py-2 flex-1 min-w-28"
          style={{ background: "#141414", border: "1px solid #2a2a2a" }}
        >
          <div className="text-[9px] uppercase tracking-[1.5px] font-mono mb-0.5 text-neutral-500">
            Total Rounds
          </div>
          <span className="text-lg font-bold text-neutral-200">
            {plan.totalRounds}
          </span>
        </div>
      </div>

      {/* Step table */}
      <div
        className="rounded-md overflow-hidden"
        style={{ border: "1px solid #2a2a2a" }}
      >
        <table className="w-full text-[10px] font-mono">
          <thead>
            <tr style={{ background: "#141414" }}>
              <th className="px-3 py-2 text-left text-neutral-500 font-normal">#</th>
              <th className="px-3 py-2 text-right text-neutral-500 font-normal">Jump</th>
              <th className="px-3 py-2 text-right text-neutral-500 font-normal">OAL</th>
              <th className="px-3 py-2 text-left text-neutral-500 font-normal">Description</th>
              {maxMagazineOAL !== undefined && (
                <th className="px-3 py-2 text-center text-neutral-500 font-normal">Mag Fit</th>
              )}
            </tr>
          </thead>
          <tbody>
            {plan.steps.map((step, i) => {
              const fitsInMag = maxMagazineOAL === undefined || step.oal <= maxMagazineOAL;
              return (
                <tr
                  key={i}
                  style={{
                    borderTop: "1px solid #1a1a1a",
                    background: step.jumpDistance === 0 ? "rgba(239, 68, 68, 0.04)" : "transparent",
                  }}
                >
                  <td className="px-3 py-1.5 text-neutral-500">{i + 1}</td>
                  <td className="px-3 py-1.5 text-right text-neutral-200">
                    {step.jumpDistance.toFixed(3)}"
                  </td>
                  <td className="px-3 py-1.5 text-right" style={{ color: "#ef4444" }}>
                    {step.oal.toFixed(3)}"
                  </td>
                  <td className="px-3 py-1.5 text-neutral-400">
                    {step.label}
                  </td>
                  {maxMagazineOAL !== undefined && (
                    <td className="px-3 py-1.5 text-center">
                      {fitsInMag ? (
                        <span style={{ color: "#22c55e" }}>Yes</span>
                      ) : (
                        <span style={{ color: "#f59e0b" }}>No</span>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Notes */}
      <div
        className="mt-3 rounded-md p-2 text-[9px] font-mono text-neutral-500"
        style={{ background: "#0f0f0f", border: "1px solid #1a1a1a" }}
      >
        Measure OAL to the ogive (CBTO) for consistency — not the bullet tip.
        Use a comparator with your bullet's caliber insert.
        Start at 0.020" off the lands and work in both directions.
      </div>
    </div>
  );
}
