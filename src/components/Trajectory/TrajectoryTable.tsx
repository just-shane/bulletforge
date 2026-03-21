import type { TrajectoryPoint } from "../../lib/ballistics.ts";

interface TrajectoryTableProps {
  points: TrajectoryPoint[];
  zeroRange: number;
}

export function TrajectoryTable({ points, zeroRange }: TrajectoryTableProps) {
  if (points.length === 0) {
    return (
      <div
        className="rounded-md p-8 text-center text-[11px] font-mono"
        style={{ background: "var(--c-panel)", border: "1px solid var(--c-border)", color: "var(--c-text-dim)" }}
      >
        No trajectory data
      </div>
    );
  }

  return (
    <div
      className="rounded-md overflow-hidden"
      style={{ background: "var(--c-panel)", border: "1px solid var(--c-border)" }}
    >
      <div className="text-[11px] font-mono tracking-[2px] uppercase px-4 pt-3 pb-2" style={{ color: "var(--c-accent)" }}>
        Ballistic Table
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[10px] font-mono">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--c-border)" }}>
              <th className="px-3 py-2 text-left uppercase tracking-wider font-normal" style={{ color: "var(--c-text-dim)" }}>Range</th>
              <th className="px-3 py-2 text-right uppercase tracking-wider font-normal" style={{ color: "var(--c-text-dim)" }}>Drop</th>
              <th className="px-3 py-2 text-right uppercase tracking-wider font-normal" style={{ color: "var(--c-text-dim)" }}>MOA</th>
              <th className="px-3 py-2 text-right uppercase tracking-wider font-normal" style={{ color: "var(--c-text-dim)" }}>MIL</th>
              <th className="px-3 py-2 text-right uppercase tracking-wider font-normal" style={{ color: "var(--c-text-dim)" }}>Drift</th>
              <th className="px-3 py-2 text-right uppercase tracking-wider font-normal" style={{ color: "var(--c-text-dim)" }}>D-MOA</th>
              <th className="px-3 py-2 text-right uppercase tracking-wider font-normal" style={{ color: "var(--c-text-dim)" }}>D-MIL</th>
              <th className="px-3 py-2 text-right uppercase tracking-wider font-normal" style={{ color: "var(--c-text-dim)" }}>Vel</th>
              <th className="px-3 py-2 text-right uppercase tracking-wider font-normal" style={{ color: "var(--c-text-dim)" }}>Energy</th>
              <th className="px-3 py-2 text-right uppercase tracking-wider font-normal" style={{ color: "var(--c-text-dim)" }}>ToF</th>
              <th className="px-3 py-2 text-right uppercase tracking-wider font-normal" style={{ color: "var(--c-text-dim)" }}>Mom</th>
            </tr>
          </thead>
          <tbody>
            {points.map((p) => {
              const isZero = p.range === zeroRange;
              const isTransonic = p.machNumber < 1.2 && p.machNumber >= 1.0;
              const isSubsonic = p.machNumber < 1.0;

              let rowBg = "transparent";
              let textColor = "var(--c-text)";
              if (isZero) {
                rowBg = "var(--c-accent-dim)";
                textColor = "var(--c-accent)";
              } else if (isSubsonic) {
                rowBg = "rgba(239,68,68,0.04)";
                textColor = "var(--c-text-muted)";
              } else if (isTransonic) {
                rowBg = "rgba(245,158,11,0.06)";
                textColor = "var(--c-warn)";
              }

              return (
                <tr
                  key={p.range}
                  style={{
                    background: rowBg,
                    borderBottom: "1px solid var(--c-surface)",
                    color: textColor,
                  }}
                >
                  <td className="px-3 py-1.5 text-left font-medium">
                    {p.range}
                    {isZero && <span className="ml-1 text-[8px]" style={{ color: "var(--c-accent)" }}>ZERO</span>}
                    {isTransonic && !isZero && <span className="ml-1 text-[8px]" style={{ color: "var(--c-warn)" }}>TRANS</span>}
                    {isSubsonic && <span className="ml-1 text-[8px]" style={{ color: "var(--c-danger)" }}>SUB</span>}
                  </td>
                  <td className="px-3 py-1.5 text-right">{p.dropInches.toFixed(1)}</td>
                  <td className="px-3 py-1.5 text-right">{p.dropMOA.toFixed(2)}</td>
                  <td className="px-3 py-1.5 text-right">{p.dropMIL.toFixed(2)}</td>
                  <td className="px-3 py-1.5 text-right">{p.driftInches.toFixed(1)}</td>
                  <td className="px-3 py-1.5 text-right">{p.driftMOA.toFixed(2)}</td>
                  <td className="px-3 py-1.5 text-right">{p.driftMIL.toFixed(2)}</td>
                  <td className="px-3 py-1.5 text-right">{p.velocity.toFixed(0)}</td>
                  <td className="px-3 py-1.5 text-right">{p.energy.toFixed(0)}</td>
                  <td className="px-3 py-1.5 text-right">{p.time.toFixed(3)}</td>
                  <td className="px-3 py-1.5 text-right">{p.momentum.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
