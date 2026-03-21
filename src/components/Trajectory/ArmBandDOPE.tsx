import { useState, useMemo } from "react";
import { useBallisticsStore } from "../../store/store.ts";
import { trajectory } from "../../lib/ballistics.ts";
import type { TrajectoryConfig } from "../../lib/ballistics.ts";
import { buildShareURL } from "../../lib/share.ts";
import { generateQRSvg } from "../../lib/qr.ts";

export function ArmBandDOPE() {
  const bullet = useBallisticsStore((s) => s.bullet);
  const cartridge = useBallisticsStore((s) => s.cartridge);
  const muzzleVelocity = useBallisticsStore((s) => s.muzzleVelocity);
  const sightHeight = useBallisticsStore((s) => s.sightHeight);
  const zeroRange = useBallisticsStore((s) => s.zeroRange);
  const shootingAngle = useBallisticsStore((s) => s.shootingAngle);
  const altitude = useBallisticsStore((s) => s.altitude);
  const temperature = useBallisticsStore((s) => s.temperature);
  const barometricPressure = useBallisticsStore((s) => s.barometricPressure);
  const humidity = useBallisticsStore((s) => s.humidity);
  const latitude = useBallisticsStore((s) => s.latitude);
  const azimuth = useBallisticsStore((s) => s.azimuth);

  const [expanded, setExpanded] = useState(false);

  // Compute trajectory with 10mph full crosswind for wind hold column
  const armBandPoints = useMemo(() => {
    const config: TrajectoryConfig = {
      muzzleVelocity,
      bulletWeight: bullet.weight,
      bulletDiameter: bullet.diameter,
      bc: bullet.bc_g7 > 0 ? bullet.bc_g7 : bullet.bc_g1,
      dragModel: (bullet.bc_g7 > 0 ? "G7" : "G1") as "G7" | "G1",
      sightHeight,
      zeroRange,
      windSpeed: 10,
      windAngle: 90,
      shootingAngle,
      altitude,
      temperature,
      barometricPressure,
      humidity,
      latitude,
      azimuth,
    };
    const result = trajectory(config);
    // Filter to 50-yard increments from 100 to max range
    const keyDistances = new Set<number>();
    for (let r = 100; r <= (config.maxRange ?? 1200); r += 50) keyDistances.add(r);
    return result.points.filter((p) => keyDistances.has(p.range));
  }, [bullet, muzzleVelocity, sightHeight, zeroRange, shootingAngle, altitude, temperature, barometricPressure, humidity, latitude, azimuth]);

  const today = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  // QR code for this exact setup
  const qrSvg = useMemo(() => {
    try {
      const base = typeof window !== "undefined"
        ? window.location.origin + window.location.pathname
        : "https://bulletforge.io";
      const url = buildShareURL(base, {
        cartridge, bullet,
        muzzleVelocity, sightHeight, zeroRange,
        windSpeed: 10, windAngle: 90, shootingAngle,
        altitude, temperature, barometricPressure, humidity,
      });
      return generateQRSvg(url, 2, 1);
    } catch {
      return null;
    }
  }, [cartridge, bullet, muzzleVelocity, sightHeight, zeroRange,
      shootingAngle, altitude, temperature, barometricPressure, humidity]);

  return (
    <div
      className="armband-dope-print rounded-md overflow-hidden"
      style={{
        background: "var(--c-panel)",
        border: "1px solid var(--c-border)",
      }}
    >
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .armband-dope-print,
          .armband-dope-print * {
            visibility: visible !important;
          }
          .armband-dope-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 200px;
            background: #fff !important;
            border: 2px solid #000 !important;
            color: #000 !important;
            font-size: 9px !important;
          }
          .armband-dope-print table {
            font-size: 9px !important;
          }
          .armband-dope-print th,
          .armband-dope-print td {
            color: #000 !important;
            border-bottom: 1px solid #000 !important;
            padding: 1px 3px !important;
          }
          .armband-dope-print .ab-print-btn {
            display: none !important;
          }
        }
      `}</style>

      {/* Title bar */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <button
          type="button"
          className="text-[11px] font-mono tracking-[2px] uppercase cursor-pointer bg-transparent border-none p-0"
          style={{ color: "var(--c-accent)" }}
          onClick={() => setExpanded(!expanded)}
        >
          Arm Band DOPE {expanded ? "▾" : "▸"}
        </button>
        {expanded && (
          <button
            type="button"
            className="ab-print-btn text-[10px] font-mono px-2 py-0.5 rounded"
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
        )}
      </div>

      {expanded && (
        <div className="px-4 pb-4 flex justify-center">
          <div
            style={{
              width: 200,
              fontFamily: "monospace",
              border: "2px solid var(--c-text)",
              borderRadius: 4,
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "4px 6px",
                borderBottom: "2px solid var(--c-text)",
                background: "var(--c-surface)",
                textAlign: "center",
                lineHeight: 1.4,
              }}
            >
              <div
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: "var(--c-text)" }}
              >
                {cartridge.name}
              </div>
              <div className="text-[8px]" style={{ color: "var(--c-text-dim)" }}>
                {bullet.manufacturer} {bullet.name}
              </div>
              <div className="text-[8px]" style={{ color: "var(--c-text-dim)" }}>
                MV {muzzleVelocity} | Zero {zeroRange}y
              </div>
              <div className="text-[7px]" style={{ color: "var(--c-text-dim)" }}>
                {today}
              </div>
            </div>

            {/* Table */}
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 10,
                fontFamily: "monospace",
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: "2px solid var(--c-text)",
                    background: "var(--c-surface)",
                  }}
                >
                  <th
                    style={{
                      padding: "2px 4px",
                      textAlign: "center",
                      fontWeight: "bold",
                      color: "var(--c-text)",
                      fontSize: 9,
                    }}
                  >
                    YDS
                  </th>
                  <th
                    style={{
                      padding: "2px 4px",
                      textAlign: "center",
                      fontWeight: "bold",
                      color: "var(--c-text)",
                      fontSize: 9,
                    }}
                  >
                    DROP
                  </th>
                  <th
                    style={{
                      padding: "2px 4px",
                      textAlign: "center",
                      fontWeight: "bold",
                      color: "var(--c-text)",
                      fontSize: 9,
                    }}
                  >
                    WIND
                  </th>
                </tr>
              </thead>
              <tbody>
                {armBandPoints.map((p, i) => (
                  <tr
                    key={p.range}
                    style={{
                      borderBottom: "1px solid var(--c-border)",
                      background: i % 2 === 0 ? "transparent" : "var(--c-surface)",
                    }}
                  >
                    <td
                      style={{
                        padding: "2px 4px",
                        textAlign: "center",
                        fontWeight: "bold",
                        color: "var(--c-text)",
                      }}
                    >
                      {p.range}
                    </td>
                    <td
                      style={{
                        padding: "2px 4px",
                        textAlign: "center",
                        color: "var(--c-text)",
                      }}
                    >
                      {p.dropMIL.toFixed(1)}
                    </td>
                    <td
                      style={{
                        padding: "2px 4px",
                        textAlign: "center",
                        color: "var(--c-text)",
                      }}
                    >
                      {p.driftMIL.toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {armBandPoints.length === 0 && (
              <div
                style={{
                  padding: "8px",
                  textAlign: "center",
                  fontSize: 9,
                  color: "var(--c-text-dim)",
                }}
              >
                No data
              </div>
            )}

            {/* QR Code */}
            {qrSvg && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 6px",
                  borderTop: "1px solid var(--c-border)",
                }}
              >
                <div
                  dangerouslySetInnerHTML={{ __html: qrSvg }}
                  style={{ width: 40, height: 40, flexShrink: 0 }}
                />
                <div style={{ fontSize: 7, fontFamily: "monospace", color: "var(--c-text-dim)", lineHeight: 1.3 }}>
                  Scan to load
                  <br />
                  in BulletForge
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
