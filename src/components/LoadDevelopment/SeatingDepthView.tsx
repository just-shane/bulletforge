import type { SeatingDepthPlan } from "../../lib/load-development.ts";
import { useBallisticsStore } from "../../store/store.ts";

interface SeatingDepthViewProps {
  plan: SeatingDepthPlan;
  maxMagazineOAL?: number;
}

const OGIVE_INFO = {
  secant: {
    title: "Secant Ogive \u2014 Jump Sensitive",
    message:
      'VLD-style bullets are sensitive to seating depth changes. Test in 0.005" increments near the lands. Most secant ogive bullets prefer 0.010"\u20130.030" off the lands.',
    color: "var(--c-warn)",
  },
  tangent: {
    title: "Tangent Ogive \u2014 Forgiving",
    message:
      'Traditional ogive bullets are less sensitive to jump distance. The 0.020" step size in this plan is appropriate. Most tangent ogive bullets perform well anywhere from jam to 0.050" off the lands.',
    color: "var(--c-success)",
  },
  hybrid: {
    title: "Hybrid Ogive \u2014 Moderate Sensitivity",
    message:
      'Hybrid ogive bullets combine characteristics of both profiles. Start with the standard 0.020" steps, then refine around your best group in 0.010" increments.',
    color: "var(--c-accent)",
  },
} as const;

export function SeatingDepthView({ plan, maxMagazineOAL }: SeatingDepthViewProps) {
  const bullet = useBallisticsStore((s) => s.bullet);
  const ogive = bullet ? OGIVE_INFO[bullet.ogiveType] : null;

  return (
    <div>
      <div
        className="text-[10px] tracking-[2px] font-mono uppercase mb-3"
        style={{ color: "var(--c-accent)" }}
      >
        Seating Depth Test Plan
      </div>

      {/* Ogive recommendation panel */}
      {ogive && (
        <div
          className="rounded-md px-3 py-2.5 mb-4"
          style={{
            background: "var(--c-panel)",
            border: `1px solid ${ogive.color}`,
            borderLeft: `3px solid ${ogive.color}`,
          }}
        >
          <div
            className="text-[10px] tracking-[1.5px] font-mono uppercase font-bold mb-1"
            style={{ color: ogive.color }}
          >
            {ogive.title}
          </div>
          <div
            className="text-[10px] font-mono leading-relaxed"
            style={{ color: "var(--c-text-dim)" }}
          >
            {ogive.message}
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="flex gap-2 flex-wrap mb-4">
        <div
          className="rounded-md px-3 py-2 flex-1 min-w-28"
          style={{ background: "var(--c-panel)", border: "1px solid var(--c-border)" }}
        >
          <div className="text-[9px] uppercase tracking-[1.5px] font-mono mb-0.5" style={{ color: "var(--c-text-dim)" }}>
            Base OAL (Jam)
          </div>
          <span className="text-lg font-bold" style={{ color: "var(--c-text)" }}>
            {plan.baseOAL.toFixed(3)}
          </span>
          <span className="text-[10px] font-mono" style={{ color: "var(--c-text-dim)" }}>"</span>
        </div>
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
              <th className="px-3 py-2 text-right font-normal" style={{ color: "var(--c-text-dim)" }}>Jump</th>
              <th className="px-3 py-2 text-right font-normal" style={{ color: "var(--c-text-dim)" }}>OAL</th>
              <th className="px-3 py-2 text-left font-normal" style={{ color: "var(--c-text-dim)" }}>Description</th>
              {maxMagazineOAL !== undefined && (
                <th className="px-3 py-2 text-center font-normal" style={{ color: "var(--c-text-dim)" }}>Mag Fit</th>
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
                    borderTop: "1px solid var(--c-surface)",
                    background: step.jumpDistance === 0 ? "rgba(239, 68, 68, 0.04)" : "transparent",
                  }}
                >
                  <td className="px-3 py-1.5" style={{ color: "var(--c-text-dim)" }}>{i + 1}</td>
                  <td className="px-3 py-1.5 text-right" style={{ color: "var(--c-text)" }}>
                    {step.jumpDistance.toFixed(3)}"
                  </td>
                  <td className="px-3 py-1.5 text-right" style={{ color: "var(--c-accent)" }}>
                    {step.oal.toFixed(3)}"
                  </td>
                  <td className="px-3 py-1.5" style={{ color: "var(--c-text-muted)" }}>
                    {step.label}
                  </td>
                  {maxMagazineOAL !== undefined && (
                    <td className="px-3 py-1.5 text-center">
                      {fitsInMag ? (
                        <span style={{ color: "var(--c-success)" }}>Yes</span>
                      ) : (
                        <span style={{ color: "var(--c-warn)" }}>No</span>
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
        className="mt-3 rounded-md p-2 text-[9px] font-mono"
        style={{ background: "var(--c-surface)", border: "1px solid var(--c-surface)", color: "var(--c-text-dim)" }}
      >
        Measure OAL to the ogive (CBTO) for consistency — not the bullet tip.
        Use a comparator with your bullet's caliber insert.
        Start at 0.020" off the lands and work in both directions.
      </div>
    </div>
  );
}
