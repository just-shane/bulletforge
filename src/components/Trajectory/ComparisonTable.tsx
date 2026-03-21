import type { TrajectoryPoint } from "../../lib/ballistics.ts";

interface ComparisonTableProps {
  pointsA: TrajectoryPoint[];
  pointsB: TrajectoryPoint[];
  labelA: string;
  labelB: string;
}

function deltaColor(delta: number, positiveIsBetter: boolean): string {
  if (Math.abs(delta) < 0.01) return "#d4d4d4";
  const aIsBetter = positiveIsBetter ? delta > 0 : delta < 0;
  return aIsBetter ? "#22c55e" : "#ef4444";
}

export function ComparisonTable({ pointsA, pointsB, labelA, labelB }: ComparisonTableProps) {
  // Build range lookup maps
  const mapA = new Map<number, TrajectoryPoint>();
  for (const p of pointsA) mapA.set(p.range, p);
  const mapB = new Map<number, TrajectoryPoint>();
  for (const p of pointsB) mapB.set(p.range, p);

  // Find matching ranges (present in both datasets)
  const matchedRanges: number[] = [];
  for (const p of pointsA) {
    if (mapB.has(p.range)) matchedRanges.push(p.range);
  }

  // Determine step filtering: if step size appears to be 25, show every other row (50yd steps)
  let displayRanges = matchedRanges;
  if (matchedRanges.length >= 3) {
    const step = matchedRanges[1] - matchedRanges[0];
    if (step === 25) {
      displayRanges = matchedRanges.filter((r) => r % 50 === 0);
    }
  }

  if (displayRanges.length === 0) {
    return (
      <div
        className="rounded-md p-8 text-center text-[11px] font-mono text-neutral-500"
        style={{ background: "#141414", border: "1px solid #2a2a2a" }}
      >
        No comparison data — no matching ranges found
      </div>
    );
  }

  const thClass = "px-2 py-2 text-[9px] uppercase tracking-wider font-normal text-neutral-500";

  return (
    <div
      className="rounded-md overflow-hidden"
      style={{ background: "#141414", border: "1px solid #2a2a2a" }}
    >
      <div className="text-[11px] font-mono tracking-[2px] uppercase px-4 pt-3 pb-2" style={{ color: "#ef4444" }}>
        Comparison Table
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[10px] font-mono">
          <thead>
            <tr style={{ borderBottom: "1px solid #2a2a2a" }}>
              <th className={`${thClass} text-left`}>Range</th>
              <th className={`${thClass} text-right`}>Drop A</th>
              <th className={`${thClass} text-right`}>Drop B</th>
              <th className={`${thClass} text-right`} style={{ color: "#a3a3a3" }}>&Delta; Drop</th>
              <th className={`${thClass} text-right`}>Drift A</th>
              <th className={`${thClass} text-right`}>Drift B</th>
              <th className={`${thClass} text-right`} style={{ color: "#a3a3a3" }}>&Delta; Drift</th>
              <th className={`${thClass} text-right`}>Vel A</th>
              <th className={`${thClass} text-right`}>Vel B</th>
              <th className={`${thClass} text-right`} style={{ color: "#a3a3a3" }}>&Delta; Vel</th>
              <th className={`${thClass} text-right`}>Energy A</th>
              <th className={`${thClass} text-right`}>Energy B</th>
              <th className={`${thClass} text-right`} style={{ color: "#a3a3a3" }}>&Delta; Energy</th>
            </tr>
          </thead>
          <tbody>
            {displayRanges.map((range, idx) => {
              const a = mapA.get(range)!;
              const b = mapB.get(range)!;

              const deltaDrop = a.dropInches - b.dropInches;
              const deltaDrift = a.driftInches - b.driftInches;
              const deltaVel = a.velocity - b.velocity;
              const deltaEnergy = a.energy - b.energy;

              // For drop: less negative (higher value) is better, so positive delta = A is better
              // For drift: less absolute drift is better — use abs comparison; positive delta means A has more drift
              // For velocity: more is better, so positive delta = A is better
              // For energy: more is better, so positive delta = A is better
              const dropColor = deltaColor(deltaDrop, true);
              const driftColor = deltaColor(Math.abs(a.driftInches) - Math.abs(b.driftInches), false);
              const velColor = deltaColor(deltaVel, true);
              const energyColor = deltaColor(deltaEnergy, true);

              const rowBg = idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)";

              return (
                <tr
                  key={range}
                  style={{
                    background: rowBg,
                    borderBottom: "1px solid #1a1a1a",
                    color: "#d4d4d4",
                  }}
                >
                  <td className="px-2 py-1.5 text-left font-medium">{range}</td>
                  <td className="px-2 py-1.5 text-right">{a.dropInches.toFixed(1)}</td>
                  <td className="px-2 py-1.5 text-right">{b.dropInches.toFixed(1)}</td>
                  <td className="px-2 py-1.5 text-right font-medium" style={{ color: dropColor }}>
                    {deltaDrop > 0 ? "+" : ""}{deltaDrop.toFixed(1)}
                  </td>
                  <td className="px-2 py-1.5 text-right">{a.driftInches.toFixed(1)}</td>
                  <td className="px-2 py-1.5 text-right">{b.driftInches.toFixed(1)}</td>
                  <td className="px-2 py-1.5 text-right font-medium" style={{ color: driftColor }}>
                    {deltaDrift > 0 ? "+" : ""}{deltaDrift.toFixed(1)}
                  </td>
                  <td className="px-2 py-1.5 text-right">{a.velocity.toFixed(0)}</td>
                  <td className="px-2 py-1.5 text-right">{b.velocity.toFixed(0)}</td>
                  <td className="px-2 py-1.5 text-right font-medium" style={{ color: velColor }}>
                    {deltaVel > 0 ? "+" : ""}{deltaVel.toFixed(0)}
                  </td>
                  <td className="px-2 py-1.5 text-right">{a.energy.toFixed(0)}</td>
                  <td className="px-2 py-1.5 text-right">{b.energy.toFixed(0)}</td>
                  <td className="px-2 py-1.5 text-right font-medium" style={{ color: energyColor }}>
                    {deltaEnergy > 0 ? "+" : ""}{deltaEnergy.toFixed(0)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
