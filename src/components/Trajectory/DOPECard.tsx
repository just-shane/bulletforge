import { useMemo } from "react";
import type { TrajectoryPoint } from "../../lib/ballistics.ts";
import { buildShareURL } from "../../lib/share.ts";
import { generateQRSvg } from "../../lib/qr.ts";

interface DOPECardProps {
  points: TrajectoryPoint[];
  cartridgeName: string;
  bulletName: string;
  bulletManufacturer?: string;
  muzzleVelocity: number;
  sightHeight?: number;
  zeroRange: number;
  windSpeed: number;
  windAngle: number;
  shootingAngle?: number;
  altitude: number;
  temperature: number;
  barometricPressure?: number;
  humidity?: number;
}

export function DOPECard({
  points,
  cartridgeName,
  bulletName,
  bulletManufacturer = "",
  muzzleVelocity,
  sightHeight = 1.5,
  zeroRange,
  windSpeed,
  windAngle,
  shootingAngle = 0,
  altitude,
  temperature,
  barometricPressure = 29.92,
  humidity = 50,
}: DOPECardProps) {
  // Filter to key distances: every 100 yards from 100 to 1200 (or max range)
  const keyDistances = new Set<number>();
  for (let r = 100; r <= 1200; r += 100) keyDistances.add(r);
  const filtered = points.filter((p) => keyDistances.has(p.range));

  // Generate QR code for this exact setup
  const qrSvg = useMemo(() => {
    try {
      const base = typeof window !== "undefined"
        ? window.location.origin + window.location.pathname
        : "https://bulletforge.io";
      const url = buildShareURL(base, {
        cartridge: { shortName: cartridgeName },
        bullet: { name: bulletName, manufacturer: bulletManufacturer },
        muzzleVelocity, sightHeight, zeroRange,
        windSpeed, windAngle, shootingAngle,
        altitude, temperature, barometricPressure, humidity,
      });
      return generateQRSvg(url, 3, 2);
    } catch {
      return null;
    }
  }, [cartridgeName, bulletName, bulletManufacturer, muzzleVelocity, sightHeight,
      zeroRange, windSpeed, windAngle, shootingAngle, altitude, temperature,
      barometricPressure, humidity]);

  return (
    <div
      className="dope-card-print rounded-md overflow-hidden"
      style={{ background: "var(--c-panel)", border: "1px solid var(--c-border)" }}
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
          style={{ color: "var(--c-accent)" }}
        >
          DOPE Card
        </div>
        <button
          type="button"
          className="dope-print-btn text-[10px] font-mono px-2 py-0.5 rounded"
          style={{
            background: "var(--c-border)",
            border: "1px solid var(--c-border-light)",
            color: "var(--c-text)",
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
        style={{ borderBottom: "1px solid var(--c-border)" }}
      >
        <div>
          <span className="dope-header-label" style={{ color: "var(--c-text-dim)" }}>Cartridge: </span>
          <span className="dope-header-value" style={{ color: "var(--c-text)" }}>{cartridgeName}</span>
        </div>
        <div>
          <span className="dope-header-label" style={{ color: "var(--c-text-dim)" }}>Bullet: </span>
          <span className="dope-header-value" style={{ color: "var(--c-text)" }}>{bulletName}</span>
        </div>
        <div>
          <span className="dope-header-label" style={{ color: "var(--c-text-dim)" }}>MV: </span>
          <span className="dope-header-value" style={{ color: "var(--c-text)" }}>{muzzleVelocity} fps</span>
        </div>
        <div>
          <span className="dope-header-label" style={{ color: "var(--c-text-dim)" }}>Zero: </span>
          <span className="dope-header-value" style={{ color: "var(--c-text)" }}>{zeroRange} yds</span>
        </div>
        <div>
          <span className="dope-header-label" style={{ color: "var(--c-text-dim)" }}>Wind: </span>
          <span className="dope-header-value" style={{ color: "var(--c-text)" }}>
            {windSpeed} mph @ {windAngle}&deg;
          </span>
        </div>
        <div>
          <span className="dope-header-label" style={{ color: "var(--c-text-dim)" }}>Altitude: </span>
          <span className="dope-header-value" style={{ color: "var(--c-text)" }}>{altitude} ft</span>
        </div>
        <div>
          <span className="dope-header-label" style={{ color: "var(--c-text-dim)" }}>Temp: </span>
          <span className="dope-header-value" style={{ color: "var(--c-text)" }}>{temperature}&deg;F</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-[10px] font-mono">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--c-border)" }}>
              <th className="px-3 py-2 text-left uppercase tracking-wider font-normal" style={{ color: "var(--c-text-dim)" }}>Range</th>
              <th className="px-3 py-2 text-right uppercase tracking-wider font-normal" style={{ color: "var(--c-text-dim)" }}>Drop (in)</th>
              <th className="px-3 py-2 text-right uppercase tracking-wider font-normal" style={{ color: "var(--c-text-dim)" }}>Drop (MOA)</th>
              <th className="px-3 py-2 text-right uppercase tracking-wider font-normal" style={{ color: "var(--c-text-dim)" }}>Drop (MIL)</th>
              <th className="px-3 py-2 text-right uppercase tracking-wider font-normal" style={{ color: "var(--c-text-dim)" }}>Wind (in)</th>
              <th className="px-3 py-2 text-right uppercase tracking-wider font-normal" style={{ color: "var(--c-text-dim)" }}>Wind (MOA)</th>
              <th className="px-3 py-2 text-right uppercase tracking-wider font-normal" style={{ color: "var(--c-text-dim)" }}>Wind (MIL)</th>
              <th className="px-3 py-2 text-right uppercase tracking-wider font-normal" style={{ color: "var(--c-text-dim)" }}>Vel</th>
              <th className="px-3 py-2 text-right uppercase tracking-wider font-normal" style={{ color: "var(--c-text-dim)" }}>Energy</th>
              <th className="px-3 py-2 text-right uppercase tracking-wider font-normal" style={{ color: "var(--c-text-dim)" }}>TOF</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr
                key={p.range}
                style={{
                  borderBottom: "1px solid var(--c-surface)",
                  color: "var(--c-text)",
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
        <div className="px-4 py-6 text-center text-[11px] font-mono" style={{ color: "var(--c-text-dim)" }}>
          No data at 100-yard increments
        </div>
      )}

      {/* QR Code — scan to load this exact setup */}
      {qrSvg && (
        <div
          className="flex items-center gap-3 px-4 py-3"
          style={{ borderTop: "1px solid var(--c-border)" }}
        >
          <div
            dangerouslySetInnerHTML={{ __html: qrSvg }}
            style={{ width: 64, height: 64, flexShrink: 0 }}
          />
          <div className="text-[8px] font-mono leading-relaxed" style={{ color: "var(--c-text-dim)" }}>
            Scan to load this exact configuration in BulletForge.
            <br />
            <span style={{ color: "var(--c-text-faint)" }}>bulletforge.io</span>
          </div>
        </div>
      )}
    </div>
  );
}
