import type { TrajectoryPoint } from "../../lib/ballistics.ts";

interface TrajectoryTableProps {
  points: TrajectoryPoint[];
  zeroRange: number;
}

export function TrajectoryTable({ points, zeroRange }: TrajectoryTableProps) {
  if (points.length === 0) {
    return (
      <div
        className="rounded-md p-8 text-center text-[11px] font-mono text-neutral-500"
        style={{ background: "#141414", border: "1px solid #2a2a2a" }}
      >
        No trajectory data
      </div>
    );
  }

  return (
    <div
      className="rounded-md overflow-hidden"
      style={{ background: "#141414", border: "1px solid #2a2a2a" }}
    >
      <div className="text-[11px] font-mono tracking-[2px] uppercase px-4 pt-3 pb-2" style={{ color: "#ef4444" }}>
        Ballistic Table
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[10px] font-mono">
          <thead>
            <tr style={{ borderBottom: "1px solid #2a2a2a" }}>
              <th className="px-3 py-2 text-left text-neutral-500 uppercase tracking-wider font-normal">Range</th>
              <th className="px-3 py-2 text-right text-neutral-500 uppercase tracking-wider font-normal">Drop</th>
              <th className="px-3 py-2 text-right text-neutral-500 uppercase tracking-wider font-normal">MOA</th>
              <th className="px-3 py-2 text-right text-neutral-500 uppercase tracking-wider font-normal">MIL</th>
              <th className="px-3 py-2 text-right text-neutral-500 uppercase tracking-wider font-normal">Drift</th>
              <th className="px-3 py-2 text-right text-neutral-500 uppercase tracking-wider font-normal">D-MOA</th>
              <th className="px-3 py-2 text-right text-neutral-500 uppercase tracking-wider font-normal">D-MIL</th>
              <th className="px-3 py-2 text-right text-neutral-500 uppercase tracking-wider font-normal">Vel</th>
              <th className="px-3 py-2 text-right text-neutral-500 uppercase tracking-wider font-normal">Energy</th>
              <th className="px-3 py-2 text-right text-neutral-500 uppercase tracking-wider font-normal">ToF</th>
              <th className="px-3 py-2 text-right text-neutral-500 uppercase tracking-wider font-normal">Mom</th>
            </tr>
          </thead>
          <tbody>
            {points.map((p) => {
              const isZero = p.range === zeroRange;
              const isTransonic = p.machNumber < 1.2 && p.machNumber >= 1.0;
              const isSubsonic = p.machNumber < 1.0;

              let rowBg = "transparent";
              let textColor = "#d4d4d4";
              if (isZero) {
                rowBg = "rgba(239,68,68,0.08)";
                textColor = "#ef4444";
              } else if (isSubsonic) {
                rowBg = "rgba(239,68,68,0.04)";
                textColor = "#a3a3a3";
              } else if (isTransonic) {
                rowBg = "rgba(245,158,11,0.06)";
                textColor = "#f59e0b";
              }

              return (
                <tr
                  key={p.range}
                  style={{
                    background: rowBg,
                    borderBottom: "1px solid #1a1a1a",
                    color: textColor,
                  }}
                >
                  <td className="px-3 py-1.5 text-left font-medium">
                    {p.range}
                    {isZero && <span className="ml-1 text-[8px] text-red-500">ZERO</span>}
                    {isTransonic && !isZero && <span className="ml-1 text-[8px] text-amber-500">TRANS</span>}
                    {isSubsonic && <span className="ml-1 text-[8px] text-red-400">SUB</span>}
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
