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
        style={{ color: "var(--c-accent)" }}
      >
        Ladder Test Plan
      </div>

      {/* Summary bar */}
      <div className="flex gap-2 flex-wrap mb-4">
        <div
          className="rounded-md px-3 py-2 flex-1 min-w-28"
          style={{ background: "var(--c-panel)", border: "1px solid var(--c-border)" }}
        >
          <div className="text-[9px] uppercase tracking-[1.5px] font-mono mb-0.5" style={{ color: "var(--c-text-dim)" }}>
            Steps
          </div>
          <span className="text-lg font-bold" style={{ color: "var(--c-text)" }}>
            {plan.steps.length}
          </span>
        </div>
        <div
          className="rounded-md px-3 py-2 flex-1 min-w-28"
          style={{ background: "var(--c-panel)", border: "1px solid var(--c-border)" }}
        >
          <div className="text-[9px] uppercase tracking-[1.5px] font-mono mb-0.5" style={{ color: "var(--c-text-dim)" }}>
            Total Rounds
          </div>
          <span className="text-lg font-bold" style={{ color: "var(--c-text)" }}>
            {plan.totalRounds}
          </span>
        </div>
        <div
          className="rounded-md px-3 py-2 flex-1 min-w-28"
          style={{ background: "var(--c-panel)", border: "1px solid var(--c-border)" }}
        >
          <div className="text-[9px] uppercase tracking-[1.5px] font-mono mb-0.5" style={{ color: "var(--c-text-dim)" }}>
            Range
          </div>
          <span className="text-lg font-bold" style={{ color: "var(--c-text)" }}>
            {plan.startCharge}–{plan.maxCharge}
          </span>
          <span className="text-[10px] font-mono" style={{ color: "var(--c-text-dim)" }}> gr</span>
        </div>
        <div
          className="rounded-md px-3 py-2 flex-1 min-w-28"
          style={{ background: "var(--c-panel)", border: "1px solid var(--c-border)" }}
        >
          <div className="text-[9px] uppercase tracking-[1.5px] font-mono mb-0.5" style={{ color: "var(--c-text-dim)" }}>
            Increment
          </div>
          <span className="text-lg font-bold" style={{ color: "var(--c-text)" }}>
            {plan.chargeIncrement}
          </span>
          <span className="text-[10px] font-mono" style={{ color: "var(--c-text-dim)" }}> gr</span>
        </div>
      </div>

      {/* Load info */}
      <div
        className="rounded-md p-2 mb-4 text-[9px] font-mono"
        style={{ background: "var(--c-surface)", border: "1px solid var(--c-surface)", color: "var(--c-text-dim)" }}
      >
        {cartridgeName} &middot; {bulletDescription} &middot; {powderName} &middot;
        {plan.roundsPerStep} rounds per step
      </div>

      {/* Step table */}
      <div
        className="rounded-md overflow-hidden"
        style={{ border: "1px solid var(--c-border)" }}
      >
        <table className="w-full text-[10px] font-mono">
          <thead>
            <tr style={{ background: "var(--c-panel)" }}>
              <th className="px-3 py-2 text-left font-normal" style={{ color: "var(--c-text-dim)" }}>#</th>
              <th className="px-3 py-2 text-right font-normal" style={{ color: "var(--c-text-dim)" }}>Charge (gr)</th>
              <th className="px-3 py-2 text-right font-normal" style={{ color: "var(--c-text-dim)" }}>Pred. MV</th>
              <th className="px-3 py-2 text-right font-normal" style={{ color: "var(--c-text-dim)" }}>Pred. Pressure</th>
              <th className="px-3 py-2 text-right font-normal" style={{ color: "var(--c-text-dim)" }}>SAAMI %</th>
              <th className="px-3 py-2 text-center font-normal" style={{ color: "var(--c-text-dim)" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {plan.steps.map((step) => (
              <tr
                key={step.stepNumber}
                style={{
                  background: step.overPressure ? "rgba(239, 68, 68, 0.06)" : "transparent",
                  borderTop: "1px solid var(--c-surface)",
                }}
              >
                <td className="px-3 py-1.5" style={{ color: "var(--c-text-dim)" }}>{step.stepNumber}</td>
                <td className="px-3 py-1.5 text-right" style={{ color: "var(--c-text)" }}>
                  {step.chargeWeight.toFixed(1)}
                </td>
                <td className="px-3 py-1.5 text-right" style={{ color: "var(--c-text)" }}>
                  {step.predictedVelocity.toFixed(0)} fps
                </td>
                <td className="px-3 py-1.5 text-right" style={{ color: "var(--c-text)" }}>
                  {(step.predictedPressure / 1000).toFixed(1)}k psi
                </td>
                <td
                  className="px-3 py-1.5 text-right"
                  style={{
                    color: step.saamiPercent > 100 ? "var(--c-danger)" : step.saamiPercent > 90 ? "var(--c-warn)" : "var(--c-text-muted)",
                  }}
                >
                  {step.saamiPercent.toFixed(1)}%
                </td>
                <td className="px-3 py-1.5 text-center">
                  {step.overPressure ? (
                    <span style={{ color: "var(--c-danger)" }}>⚠ OVER</span>
                  ) : (
                    <span style={{ color: "var(--c-success)" }}>OK</span>
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
