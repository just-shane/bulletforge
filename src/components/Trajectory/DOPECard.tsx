import type { TrajectoryPoint } from "../../lib/ballistics.ts";

interface DOPECardProps {
  points: TrajectoryPoint[];
  cartridgeName: string;
  bulletName: string;
  muzzleVelocity: number;
  zeroRange: number;
  windSpeed: number;
  windAngle: number;
  altitude: number;
  temperature: number;
}

export function DOPECard({
  points,
  cartridgeName,
  bulletName,
  muzzleVelocity,
  zeroRange,
  windSpeed,
  windAngle,
  altitude,
  temperature,
}: DOPECardProps) {
  // Filter to key distances: every 100 yards from 100 to 1200 (or max range)
  const keyDistances = new Set<number>();
  for (let r = 100; r <= 1200; r += 100) keyDistances.add(r);
  const filtered = points.filter((p) => keyDistances.has(p.range));

  return (
    <div
      className="dope-card-print rounded-md overflow-hidden"
      style={{ background: "#141414", border: "1px solid #2a2a2a" }}
    >
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .dope-card-print,
          .dope-card-print * {
            visibility: visible !important;
          }
          .dope-card-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: #fff !important;
            border: 1px solid #ccc !important;
            color: #000 !important;
            font-size: 9px !important;
          }
          .dope-card-print table {
            font-size: 8px !important;
          }
          .dope-card-print th,
          .dope-card-print td {
            color: #000 !important;
            border-bottom: 1px solid #ccc !important;
            padding: 2px 4px !important;
          }
          .dope-card-print .dope-title {
            color: #c00 !important;
          }
          .dope-card-print .dope-header-value {
            color: #000 !important;
          }
          .dope-card-print .dope-header-label {
            color: #555 !important;
          }
          .dope-card-print .dope-print-btn {
            display: none !important;
          }
        }
      `}</style>

      {/* Title bar */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div
          className="dope-title text-[11px] font-mono tracking-[2px] uppercase"
          style={{ color: "#ef4444" }}
        >
          DOPE Card
        </div>
        <button
          type="button"
          className="dope-print-btn text-[10px] font-mono px-2 py-0.5 rounded"
          style={{
            background: "#2a2a2a",
            border: "1px solid #3a3a3a",
            color: "#d4d4d4",
            cursor: "pointer",
          }}
          onClick={() => window.print()}
        >
          Print
        </button>
      </div>

      {/* Header info */}
      <div
        className="px-4 pb-3 grid grid-cols-4 gap-x-4 gap-y-1 text-[9px] font-mono"
        style={{ borderBottom: "1px solid #2a2a2a" }}
      >
        <div>
          <span className="dope-header-label text-neutral-500">Cartridge: </span>
          <span className="dope-header-value text-neutral-300">{cartridgeName}</span>
        </div>
        <div>
          <span className="dope-header-label text-neutral-500">Bullet: </span>
          <span className="dope-header-value text-neutral-300">{bulletName}</span>
        </div>
        <div>
          <span className="dope-header-label text-neutral-500">MV: </span>
          <span className="dope-header-value text-neutral-300">{muzzleVelocity} fps</span>
        </div>
        <div>
          <span className="dope-header-label text-neutral-500">Zero: </span>
          <span className="dope-header-value text-neutral-300">{zeroRange} yds</span>
        </div>
        <div>
          <span className="dope-header-label text-neutral-500">Wind: </span>
          <span className="dope-header-value text-neutral-300">
            {windSpeed} mph @ {windAngle}&deg;
          </span>
        </div>
        <div>
          <span className="dope-header-label text-neutral-500">Altitude: </span>
          <span className="dope-header-value text-neutral-300">{altitude} ft</span>
        </div>
        <div>
          <span className="dope-header-label text-neutral-500">Temp: </span>
          <span className="dope-header-value text-neutral-300">{temperature}&deg;F</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-[10px] font-mono">
          <thead>
            <tr style={{ borderBottom: "1px solid #2a2a2a" }}>
              <th className="px-3 py-2 text-left text-neutral-500 uppercase tracking-wider font-normal">Range</th>
              <th className="px-3 py-2 text-right text-neutral-500 uppercase tracking-wider font-normal">Drop (in)</th>
              <th className="px-3 py-2 text-right text-neutral-500 uppercase tracking-wider font-normal">Drop (MOA)</th>
              <th className="px-3 py-2 text-right text-neutral-500 uppercase tracking-wider font-normal">Drop (MIL)</th>
              <th className="px-3 py-2 text-right text-neutral-500 uppercase tracking-wider font-normal">Wind (in)</th>
              <th className="px-3 py-2 text-right text-neutral-500 uppercase tracking-wider font-normal">Wind (MOA)</th>
              <th className="px-3 py-2 text-right text-neutral-500 uppercase tracking-wider font-normal">Wind (MIL)</th>
              <th className="px-3 py-2 text-right text-neutral-500 uppercase tracking-wider font-normal">Vel</th>
              <th className="px-3 py-2 text-right text-neutral-500 uppercase tracking-wider font-normal">Energy</th>
              <th className="px-3 py-2 text-right text-neutral-500 uppercase tracking-wider font-normal">TOF</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr
                key={p.range}
                style={{
                  borderBottom: "1px solid #1a1a1a",
                  color: "#d4d4d4",
                }}
              >
                <td className="px-3 py-1.5 text-left font-medium">{p.range}</td>
                <td className="px-3 py-1.5 text-right">{p.dropInches.toFixed(1)}</td>
                <td className="px-3 py-1.5 text-right">{p.dropMOA.toFixed(2)}</td>
                <td className="px-3 py-1.5 text-right">{p.dropMIL.toFixed(2)}</td>
                <td className="px-3 py-1.5 text-right">{p.driftInches.toFixed(1)}</td>
                <td className="px-3 py-1.5 text-right">{p.driftMOA.toFixed(2)}</td>
                <td className="px-3 py-1.5 text-right">{p.driftMIL.toFixed(2)}</td>
                <td className="px-3 py-1.5 text-right">{p.velocity.toFixed(0)}</td>
                <td className="px-3 py-1.5 text-right">{p.energy.toFixed(0)}</td>
                <td className="px-3 py-1.5 text-right">{p.time.toFixed(3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="px-4 py-6 text-center text-[11px] font-mono text-neutral-500">
          No data at 100-yard increments
        </div>
      )}
    </div>
  );
}
