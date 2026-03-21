import type { LadderTestPlan } from "../../lib/load-development.ts";

interface LadderTestViewProps {
  plan: LadderTestPlan;
  cartridgeName: string;
  powderName: string;
  bulletDescription: string;
}

export function LadderTestView({ plan, cartridgeName, powderName, bulletDescription }: LadderTestViewProps) {
  return (
    <div>
      {/* Header */}
      <div
        className="text-[10px] tracking-[2px] font-mono uppercase mb-3"
        style={{ color: "#ef4444" }}
      >
        Ladder Test Plan
      </div>

      {/* Summary bar */}
      <div className="flex gap-2 flex-wrap mb-4">
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
        <div
          className="rounded-md px-3 py-2 flex-1 min-w-28"
          style={{ background: "#141414", border: "1px solid #2a2a2a" }}
        >
          <div className="text-[9px] uppercase tracking-[1.5px] font-mono mb-0.5 text-neutral-500">
            Range
          </div>
          <span className="text-lg font-bold text-neutral-200">
            {plan.startCharge}–{plan.maxCharge}
          </span>
          <span className="text-[10px] font-mono text-neutral-500"> gr</span>
        </div>
        <div
          className="rounded-md px-3 py-2 flex-1 min-w-28"
          style={{ background: "#141414", border: "1px solid #2a2a2a" }}
        >
          <div className="text-[9px] uppercase tracking-[1.5px] font-mono mb-0.5 text-neutral-500">
            Increment
          </div>
          <span className="text-lg font-bold text-neutral-200">
            {plan.chargeIncrement}
          </span>
          <span className="text-[10px] font-mono text-neutral-500"> gr</span>
        </div>
      </div>

      {/* Load info */}
      <div
        className="rounded-md p-2 mb-4 text-[9px] font-mono text-neutral-500"
        style={{ background: "#0f0f0f", border: "1px solid #1a1a1a" }}
      >
        {cartridgeName} &middot; {bulletDescription} &middot; {powderName} &middot;
        {plan.roundsPerStep} rounds per step
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
              <th className="px-3 py-2 text-right text-neutral-500 font-normal">Charge (gr)</th>
              <th className="px-3 py-2 text-right text-neutral-500 font-normal">Pred. MV</th>
              <th className="px-3 py-2 text-right text-neutral-500 font-normal">Pred. Pressure</th>
              <th className="px-3 py-2 text-right text-neutral-500 font-normal">SAAMI %</th>
              <th className="px-3 py-2 text-center text-neutral-500 font-normal">Status</th>
            </tr>
          </thead>
          <tbody>
            {plan.steps.map((step) => (
              <tr
                key={step.stepNumber}
                style={{
                  background: step.overPressure ? "rgba(239, 68, 68, 0.06)" : "transparent",
                  borderTop: "1px solid #1a1a1a",
                }}
              >
                <td className="px-3 py-1.5 text-neutral-500">{step.stepNumber}</td>
                <td className="px-3 py-1.5 text-right text-neutral-200">
                  {step.chargeWeight.toFixed(1)}
                </td>
                <td className="px-3 py-1.5 text-right text-neutral-200">
                  {step.predictedVelocity.toFixed(0)} fps
                </td>
                <td className="px-3 py-1.5 text-right text-neutral-200">
                  {(step.predictedPressure / 1000).toFixed(1)}k psi
                </td>
                <td
                  className="px-3 py-1.5 text-right"
                  style={{
                    color: step.saamiPercent > 100 ? "#ef4444" : step.saamiPercent > 90 ? "#f59e0b" : "#a3a3a3",
                  }}
                >
                  {step.saamiPercent.toFixed(1)}%
                </td>
                <td className="px-3 py-1.5 text-center">
                  {step.overPressure ? (
                    <span style={{ color: "#ef4444" }}>⚠ OVER</span>
                  ) : (
                    <span style={{ color: "#22c55e" }}>OK</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
