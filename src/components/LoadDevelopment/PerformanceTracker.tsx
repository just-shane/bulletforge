import { useState, useEffect, useMemo, useCallback } from "react";
import { useBallisticsStore } from "../../store/store.ts";
import type { PerformanceRecord, ConfigSnapshot, LoadCalibration } from "../../lib/storage.ts";
import {
  savePerformanceRecord,
  deletePerformanceRecord,
  getPerformanceRecordsForLoad,
  generateId,
  buildLoadKey,
  getCalibrationForLoad,
  saveLoadCalibration,
} from "../../lib/storage.ts";
import { refineBCFromVelocity, trajectory } from "../../lib/ballistics.ts";

// ─── Helpers ──────────────────────────────────────────────────────

function calcStats(velocities: number[]) {
  if (velocities.length === 0) return { avg: 0, es: 0, sd: 0 };
  const avg = velocities.reduce((a, b) => a + b, 0) / velocities.length;
  const min = Math.min(...velocities);
  const max = Math.max(...velocities);
  const es = max - min;
  const variance =
    velocities.reduce((sum, v) => sum + (v - avg) ** 2, 0) / velocities.length;
  const sd = Math.sqrt(variance);
  return { avg, es, sd };
}

function sdColor(sd: number): string {
  if (sd < 8) return "var(--c-success)";
  if (sd <= 15) return "var(--c-warn)";
  return "var(--c-error, #e55)";
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "2-digit",
    });
  } catch {
    return iso;
  }
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) + "\u2026" : s;
}

// ─── SVG Trend Chart ──────────────────────────────────────────────

function SdTrendChart({ records }: { records: PerformanceRecord[] }) {
  const W = 400;
  const H = 120;
  const PAD = { top: 14, right: 12, bottom: 20, left: 32 };

  const sorted = [...records].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  const sds = sorted.map((r) => r.sd);
  const maxSd = Math.max(...sds, 1);
  const minSd = Math.min(...sds, 0);
  const range = maxSd - minSd || 1;

  const xStep =
    sorted.length > 1
      ? (W - PAD.left - PAD.right) / (sorted.length - 1)
      : 0;

  const points = sds.map((sd, i) => ({
    x: PAD.left + i * xStep,
    y: PAD.top + (1 - (sd - minSd) / range) * (H - PAD.top - PAD.bottom),
  }));

  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");

  // Trend direction: compare first half avg to second half avg
  const mid = Math.floor(sds.length / 2);
  const firstHalfAvg =
    sds.slice(0, mid).reduce((a, b) => a + b, 0) / mid || 0;
  const secondHalfAvg =
    sds.slice(mid).reduce((a, b) => a + b, 0) / (sds.length - mid) || 0;
  const improving = secondHalfAvg <= firstHalfAvg;
  const trendColor = improving ? "var(--c-success)" : "var(--c-error, #e55)";

  return (
    <div
      className="rounded-md mt-3 p-2"
      style={{
        background: "var(--c-panel)",
        border: "1px solid var(--c-border)",
      }}
    >
      <div
        className="text-[9px] uppercase tracking-[1.5px] font-mono mb-1"
        style={{ color: "var(--c-text-dim)" }}
      >
        SD Trend{" "}
        <span style={{ color: trendColor }}>
          {improving ? "\u25BC improving" : "\u25B2 worsening"}
        </span>
      </div>
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{ maxWidth: "100%", height: "auto" }}
      >
        {/* Y-axis grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
          const y =
            PAD.top + (1 - frac) * (H - PAD.top - PAD.bottom);
          const val = minSd + frac * range;
          return (
            <g key={frac}>
              <line
                x1={PAD.left}
                y1={y}
                x2={W - PAD.right}
                y2={y}
                stroke="var(--c-border)"
                strokeDasharray="2,3"
              />
              <text
                x={PAD.left - 4}
                y={y + 3}
                textAnchor="end"
                fontSize="8"
                fontFamily="monospace"
                fill="var(--c-text-dim)"
              >
                {val.toFixed(1)}
              </text>
            </g>
          );
        })}

        {/* Line */}
        <polyline
          points={polyline}
          fill="none"
          stroke={trendColor}
          strokeWidth={2}
          strokeLinejoin="round"
        />

        {/* Dots */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={3}
            fill={sdColor(sds[i])}
            stroke="var(--c-panel)"
            strokeWidth={1}
          />
        ))}

        {/* X-axis labels */}
        {sorted.map((r, i) => (
          <text
            key={i}
            x={points[i].x}
            y={H - 4}
            textAnchor="middle"
            fontSize="7"
            fontFamily="monospace"
            fill="var(--c-text-dim)"
          >
            {formatDate(r.date)}
          </text>
        ))}
      </svg>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────

export function PerformanceTracker() {
  const cartridge = useBallisticsStore((s) => s.cartridge);
  const bullet = useBallisticsStore((s) => s.bullet);
  const powderName = useBallisticsStore((s) => s.powderName);
  const chargeWeight = useBallisticsStore((s) => s.chargeWeight);
  const muzzleVelocity = useBallisticsStore((s) => s.muzzleVelocity);
  const barrelLength = useBallisticsStore((s) => s.barrelLength);
  const sightHeight = useBallisticsStore((s) => s.sightHeight);
  const zeroRange = useBallisticsStore((s) => s.zeroRange);
  const altitude = useBallisticsStore((s) => s.altitude);
  const temperature = useBallisticsStore((s) => s.temperature);
  const barometricPressure = useBallisticsStore((s) => s.barometricPressure);
  const humidity = useBallisticsStore((s) => s.humidity);

  const [collapsed, setCollapsed] = useState(false);
  const [velocityInput, setVelocityInput] = useState("");
  const [notes, setNotes] = useState("");
  const [records, setRecords] = useState<PerformanceRecord[]>([]);
  const [calibration, setCalibration] = useState<LoadCalibration | null>(null);

  // ─── Trajectory Verification State ─────────────────────────────
  const [verifRange, setVerifRange] = useState("500");
  const [verifDrop, setVerifDrop] = useState("");

  // Parsed velocities and live stats
  const parsed = useMemo(() => {
    return velocityInput
      .split(/[,\s\n]+/)
      .map((s) => parseFloat(s.trim()))
      .filter((v) => !isNaN(v) && v > 0);
  }, [velocityInput]);

  const liveStats = useMemo(() => calcStats(parsed), [parsed]);

  // Load records for current load combo + calibration
  const refreshRecords = useCallback(() => {
    const recs = getPerformanceRecordsForLoad(
      cartridge.shortName,
      bullet.name,
      powderName,
    );
    // Sort chronologically
    recs.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    setRecords(recs);
    setCalibration(
      getCalibrationForLoad(cartridge.shortName, bullet.name, powderName, chargeWeight),
    );
  }, [cartridge.shortName, bullet.name, powderName, chargeWeight]);

  useEffect(() => {
    refreshRecords();
  }, [refreshRecords]);

  // Summary stats
  const summary = useMemo(() => {
    if (records.length === 0) return null;
    const sds = records.map((r) => r.sd);
    const bestSd = Math.min(...sds);
    const avgSd = sds.reduce((a, b) => a + b, 0) / sds.length;
    const totalRounds = records.reduce(
      (sum, r) => sum + r.velocities.length,
      0,
    );
    return { bestSd, avgSd, totalRounds };
  }, [records]);

  // Save handler — captures config snapshot and updates load calibration
  const handleSave = useCallback(() => {
    if (parsed.length < 2) return;
    const { avg, es, sd } = calcStats(parsed);

    // Capture full config snapshot
    const snapshot: ConfigSnapshot = {
      cartridgeShortName: cartridge.shortName,
      bulletName: bullet.name,
      bulletManufacturer: bullet.manufacturer,
      powderName,
      chargeWeight,
      muzzleVelocity,
      barrelLength,
      sightHeight,
      zeroRange,
      altitude,
      temperature,
      barometricPressure,
      humidity,
    };

    const record: PerformanceRecord = {
      id: generateId(),
      cartridgeShortName: cartridge.shortName,
      bulletName: bullet.name,
      powderName,
      chargeWeight,
      velocities: parsed,
      es: Math.round(es * 10) / 10,
      sd: Math.round(sd * 10) / 10,
      date: new Date().toISOString(),
      notes,
      conditions: { altitude, temperature, humidity },
      configSnapshot: snapshot,
    };
    savePerformanceRecord(record);

    // Update load calibration profile
    const loadKey = buildLoadKey(cartridge.shortName, bullet.name, powderName, chargeWeight);
    const existing = getCalibrationForLoad(cartridge.shortName, bullet.name, powderName, chargeWeight);

    // Compute running average MV across all sessions including this one
    const allRecs = getPerformanceRecordsForLoad(cartridge.shortName, bullet.name, powderName)
      .filter((r) => r.chargeWeight === chargeWeight);
    const allVelocities = [...allRecs.flatMap((r) => r.velocities), ...parsed];
    const avgMV = allVelocities.reduce((a, b) => a + b, 0) / allVelocities.length;

    const sdHistory = [...(existing?.sdHistory ?? []), Math.round(sd * 10) / 10];
    const sessionCount = (existing?.sessionCount ?? 0) + 1;

    // Auto-compute true BC if we have chrono data: use muzzle velocity vs. measured avg
    // This approximates a near-muzzle measurement
    let trueBC = existing?.trueBC;
    let bcCorrectionFactor = existing?.bcCorrectionFactor;
    if (avg > 0 && muzzleVelocity > 0 && Math.abs(avg - muzzleVelocity) > 5) {
      try {
        const bc = bullet.bc_G7 || bullet.bc_G1;
        const dragModel = bullet.bc_G7 ? "G7" as const : "G1" as const;
        if (bc) {
          const result = refineBCFromVelocity(
            muzzleVelocity, 0,
            avg, 100,
            bc, dragModel,
            altitude, temperature, barometricPressure, humidity,
          );
          if (result.trueBC > 0 && result.correctionFactor > 0.5 && result.correctionFactor < 2.0) {
            trueBC = Math.round(result.trueBC * 10000) / 10000;
            bcCorrectionFactor = Math.round(result.correctionFactor * 1000) / 1000;
          }
        }
      } catch {
        // BC refinement failed — keep existing values
      }
    }

    const cal: LoadCalibration = {
      id: existing?.id ?? generateId(),
      loadKey,
      cartridgeShortName: cartridge.shortName,
      bulletName: bullet.name,
      powderName,
      chargeWeight,
      trueBC,
      bcCorrectionFactor,
      avgMeasuredMV: Math.round(avgMV),
      sdHistory,
      sessionCount,
      verificationPoints: existing?.verificationPoints ?? [],
      updatedAt: new Date().toISOString(),
    };
    saveLoadCalibration(cal);

    setVelocityInput("");
    setNotes("");
    refreshRecords();
  }, [parsed, cartridge, bullet, powderName, chargeWeight, muzzleVelocity, barrelLength,
      sightHeight, zeroRange, altitude, temperature, barometricPressure, humidity, notes, refreshRecords]);

  // Delete handler
  const handleDelete = useCallback(
    (id: string) => {
      deletePerformanceRecord(id);
      refreshRecords();
    },
    [refreshRecords],
  );

  return (
    <div
      className="rounded-md font-mono"
      style={{
        background: "var(--c-panel)",
        border: "1px solid var(--c-border)",
      }}
    >
      {/* Collapsible Header */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center justify-between px-3 py-2 cursor-pointer"
        style={{
          background: "transparent",
          border: "none",
          color: "var(--c-accent)",
        }}
      >
        <span className="text-[10px] uppercase tracking-[2px] font-mono">
          Performance Tracking
        </span>
        <span className="text-[10px] font-mono" style={{ color: "var(--c-text-dim)" }}>
          {collapsed ? "\u25B6" : "\u25BC"}
        </span>
      </button>

      {!collapsed && (
        <div className="px-3 pb-3">
          {/* ─── Record Entry ─────────────────────── */}
          <div className="mb-4">
            <div
              className="text-[10px] uppercase tracking-[2px] font-mono mb-2"
              style={{ color: "var(--c-accent)" }}
            >
              New Record
            </div>

            <div
              className="text-[10px] mb-1 font-mono"
              style={{ color: "var(--c-text-muted)" }}
            >
              Shot velocities (fps) — comma or space separated
            </div>
            <input
              type="text"
              value={velocityInput}
              onChange={(e) => setVelocityInput(e.target.value)}
              placeholder="2705, 2712, 2698, 2710, 2703"
              className="w-full rounded-md px-3 py-1.5 text-[10px] font-mono"
              style={{
                background: "var(--c-surface, var(--c-panel))",
                border: "1px solid var(--c-border)",
                color: "var(--c-text)",
              }}
            />

            {/* Live preview */}
            {parsed.length >= 2 && (
              <div className="flex gap-2 mt-2 flex-wrap">
                <MiniStat label="Avg" value={liveStats.avg.toFixed(1)} unit="fps" />
                <MiniStat label="ES" value={liveStats.es.toFixed(1)} unit="fps" />
                <MiniStat
                  label="SD"
                  value={liveStats.sd.toFixed(1)}
                  unit="fps"
                  color={sdColor(liveStats.sd)}
                />
                <MiniStat label="Shots" value={String(parsed.length)} unit="" />
              </div>
            )}

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes (optional)"
              rows={2}
              className="w-full rounded-md px-3 py-1.5 text-[10px] font-mono mt-2 resize-none"
              style={{
                background: "var(--c-surface, var(--c-panel))",
                border: "1px solid var(--c-border)",
                color: "var(--c-text)",
              }}
            />

            <button
              onClick={handleSave}
              disabled={parsed.length < 2}
              className="mt-2 px-4 py-1.5 rounded-md text-[10px] font-mono cursor-pointer transition-all"
              style={{
                background:
                  parsed.length >= 2
                    ? "var(--c-accent-dim)"
                    : "var(--c-surface, var(--c-panel))",
                border: `1px solid ${parsed.length >= 2 ? "var(--c-accent)" : "var(--c-border)"}`,
                color:
                  parsed.length >= 2
                    ? "var(--c-accent)"
                    : "var(--c-text-dim)",
                opacity: parsed.length >= 2 ? 1 : 0.5,
              }}
            >
              Save Record
            </button>
          </div>

          {/* ─── Summary Stats ────────────────────── */}
          {summary && (
            <div className="flex gap-2 mb-4 flex-wrap">
              <MiniStat
                label="Best SD"
                value={summary.bestSd.toFixed(1)}
                unit="fps"
                color={sdColor(summary.bestSd)}
              />
              <MiniStat
                label="Avg SD"
                value={summary.avgSd.toFixed(1)}
                unit="fps"
                color={sdColor(summary.avgSd)}
              />
              <MiniStat
                label="Total Rounds"
                value={String(summary.totalRounds)}
                unit=""
              />
            </div>
          )}

          {/* ─── Trend Chart ──────────────────────── */}
          {records.length >= 2 && <SdTrendChart records={records} />}

          {/* ─── History Table ────────────────────── */}
          {records.length > 0 && (
            <div className="mt-4">
              <div
                className="text-[10px] uppercase tracking-[2px] font-mono mb-2"
                style={{ color: "var(--c-accent)" }}
              >
                History
              </div>
              <div
                className="rounded-md overflow-hidden"
                style={{ border: "1px solid var(--c-border)" }}
              >
                <table
                  className="w-full text-[10px] font-mono"
                  style={{ borderCollapse: "collapse" }}
                >
                  <thead>
                    <tr
                      style={{
                        background: "var(--c-surface, var(--c-panel))",
                        color: "var(--c-text-dim)",
                      }}
                    >
                      <th className="text-left px-2 py-1.5">Date</th>
                      <th className="text-right px-2 py-1.5">Charge</th>
                      <th className="text-right px-2 py-1.5">Avg Vel</th>
                      <th className="text-right px-2 py-1.5">ES</th>
                      <th className="text-right px-2 py-1.5">SD</th>
                      <th className="text-right px-2 py-1.5">Shots</th>
                      <th className="text-left px-2 py-1.5">Notes</th>
                      <th className="px-2 py-1.5" />
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((r) => {
                      const avg =
                        r.velocities.reduce((a, b) => a + b, 0) /
                        r.velocities.length;
                      return (
                        <tr
                          key={r.id}
                          style={{
                            borderTop: "1px solid var(--c-border)",
                            color: "var(--c-text)",
                          }}
                        >
                          <td className="px-2 py-1.5">{formatDate(r.date)}</td>
                          <td className="text-right px-2 py-1.5">
                            {r.chargeWeight}gr
                          </td>
                          <td className="text-right px-2 py-1.5">
                            {avg.toFixed(0)}
                          </td>
                          <td className="text-right px-2 py-1.5">
                            {r.es.toFixed(1)}
                          </td>
                          <td
                            className="text-right px-2 py-1.5 font-bold"
                            style={{ color: sdColor(r.sd) }}
                          >
                            {r.sd.toFixed(1)}
                          </td>
                          <td className="text-right px-2 py-1.5">
                            {r.velocities.length}
                          </td>
                          <td
                            className="px-2 py-1.5"
                            style={{ color: "var(--c-text-dim)" }}
                          >
                            {r.notes ? truncate(r.notes, 24) : "\u2014"}
                          </td>
                          <td className="px-2 py-1.5">
                            <button
                              onClick={() => handleDelete(r.id)}
                              className="cursor-pointer text-[9px] font-mono px-1.5 py-0.5 rounded"
                              style={{
                                background: "transparent",
                                border: "1px solid var(--c-border)",
                                color: "var(--c-text-dim)",
                              }}
                              title="Delete record"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Empty state */}
          {records.length === 0 && (
            <div
              className="text-[10px] font-mono py-4 text-center"
              style={{ color: "var(--c-text-dim)" }}
            >
              No records yet for {cartridge.shortName} / {bullet.name} /{" "}
              {powderName}. Enter velocities above to start tracking.
            </div>
          )}

          {/* ─── Load Calibration Profile ─────────── */}
          {calibration && (
            <div className="mt-4">
              <div
                className="text-[10px] uppercase tracking-[2px] font-mono mb-2"
                style={{ color: "var(--c-accent)" }}
              >
                Load Calibration
              </div>
              <div className="flex gap-2 mb-3 flex-wrap">
                <MiniStat
                  label="Measured MV"
                  value={String(calibration.avgMeasuredMV)}
                  unit="fps"
                />
                <MiniStat
                  label="Sessions"
                  value={String(calibration.sessionCount)}
                  unit=""
                />
                {calibration.trueBC != null && (
                  <MiniStat
                    label="True BC"
                    value={calibration.trueBC.toFixed(4)}
                    unit={bullet.bc_G7 ? "G7" : "G1"}
                    color={
                      calibration.bcCorrectionFactor != null
                        ? calibration.bcCorrectionFactor < 1
                          ? "var(--c-warn)"
                          : "var(--c-success)"
                        : undefined
                    }
                  />
                )}
                {calibration.bcCorrectionFactor != null && (
                  <MiniStat
                    label="BC Factor"
                    value={calibration.bcCorrectionFactor.toFixed(3)}
                    unit="×"
                    color={
                      calibration.bcCorrectionFactor < 1
                        ? "var(--c-warn)"
                        : "var(--c-success)"
                    }
                  />
                )}
              </div>

              {/* SD History sparkline */}
              {calibration.sdHistory.length >= 2 && (
                <div
                  className="text-[9px] font-mono mb-2"
                  style={{ color: "var(--c-text-dim)" }}
                >
                  SD History:{" "}
                  {calibration.sdHistory.map((sd, i) => (
                    <span key={i}>
                      <span style={{ color: sdColor(sd) }}>{sd.toFixed(1)}</span>
                      {i < calibration.sdHistory.length - 1 ? " → " : ""}
                    </span>
                  ))}
                </div>
              )}

              {/* Trajectory Verification Points */}
              {calibration.verificationPoints.length > 0 && (
                <div
                  className="rounded-md overflow-hidden mt-2"
                  style={{ border: "1px solid var(--c-border)" }}
                >
                  <table className="w-full text-[10px] font-mono" style={{ borderCollapse: "collapse" }}>
                    <thead>
                      <tr
                        style={{
                          background: "var(--c-surface, var(--c-panel))",
                          color: "var(--c-text-dim)",
                        }}
                      >
                        <th className="text-left px-2 py-1.5">Range</th>
                        <th className="text-right px-2 py-1.5">Actual</th>
                        <th className="text-right px-2 py-1.5">Predicted</th>
                        <th className="text-right px-2 py-1.5">Delta</th>
                        <th className="text-left px-2 py-1.5">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calibration.verificationPoints.map((vp, i) => (
                        <tr key={i} style={{ borderTop: "1px solid var(--c-border)", color: "var(--c-text)" }}>
                          <td className="px-2 py-1.5">{vp.range} yds</td>
                          <td className="text-right px-2 py-1.5">{vp.actualDropInches.toFixed(1)}"</td>
                          <td className="text-right px-2 py-1.5">{vp.predictedDropInches?.toFixed(1) ?? "—"}"</td>
                          <td
                            className="text-right px-2 py-1.5 font-bold"
                            style={{
                              color:
                                vp.deltaInches != null
                                  ? Math.abs(vp.deltaInches) <= 1
                                    ? "var(--c-success)"
                                    : Math.abs(vp.deltaInches) <= 3
                                      ? "var(--c-warn)"
                                      : "var(--c-error, #e55)"
                                  : "var(--c-text-dim)",
                            }}
                          >
                            {vp.deltaInches != null ? `${vp.deltaInches > 0 ? "+" : ""}${vp.deltaInches.toFixed(1)}"` : "—"}
                          </td>
                          <td className="px-2 py-1.5" style={{ color: "var(--c-text-dim)" }}>{formatDate(vp.date)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ─── Trajectory Verification Entry ──────── */}
          <div className="mt-4">
            <div
              className="text-[10px] uppercase tracking-[2px] font-mono mb-2"
              style={{ color: "var(--c-accent)" }}
            >
              Trajectory Verification
            </div>
            <div
              className="text-[9px] font-mono mb-2"
              style={{ color: "var(--c-text-dim)" }}
            >
              Enter actual drop at a known distance to compare against the model prediction.
            </div>
            <div className="flex gap-2 items-end flex-wrap">
              <div className="flex-1 min-w-[80px]">
                <div className="text-[9px] font-mono mb-1" style={{ color: "var(--c-text-muted)" }}>
                  Range (yds)
                </div>
                <input
                  type="number"
                  value={verifRange}
                  onChange={(e) => setVerifRange(e.target.value)}
                  className="w-full rounded-md px-2 py-1.5 text-[10px] font-mono"
                  style={{
                    background: "var(--c-surface, var(--c-panel))",
                    border: "1px solid var(--c-border)",
                    color: "var(--c-text)",
                  }}
                />
              </div>
              <div className="flex-1 min-w-[80px]">
                <div className="text-[9px] font-mono mb-1" style={{ color: "var(--c-text-muted)" }}>
                  Actual Drop (inches)
                </div>
                <input
                  type="number"
                  value={verifDrop}
                  onChange={(e) => setVerifDrop(e.target.value)}
                  placeholder="-36.5"
                  className="w-full rounded-md px-2 py-1.5 text-[10px] font-mono"
                  style={{
                    background: "var(--c-surface, var(--c-panel))",
                    border: "1px solid var(--c-border)",
                    color: "var(--c-text)",
                  }}
                />
              </div>
              <button
                onClick={() => {
                  const range = parseFloat(verifRange);
                  const drop = parseFloat(verifDrop);
                  if (isNaN(range) || isNaN(drop) || range <= 0) return;

                  // Run trajectory prediction for this range
                  const bc = bullet.bc_G7 || bullet.bc_G1;
                  const dragModel = bullet.bc_G7 ? "G7" as const : "G1" as const;
                  if (!bc) return;

                  const result = trajectory({
                    muzzleVelocity,
                    bulletWeight: bullet.weight,
                    bulletDiameter: bullet.diameter,
                    bc,
                    dragModel,
                    sightHeight,
                    zeroRange,
                    windSpeed: 0,
                    windAngle: 0,
                    shootingAngle: 0,
                    altitude,
                    temperature,
                    barometricPressure,
                    humidity,
                    maxRange: range + 50,
                    stepSize: 25,
                  });

                  // Find closest point to the requested range
                  const closest = result.points.reduce((best, p) =>
                    Math.abs(p.range - range) < Math.abs(best.range - range) ? p : best,
                  );
                  const predicted = closest.dropInches;
                  const delta = Math.round((drop - predicted) * 10) / 10;

                  const vp = {
                    range,
                    actualDropInches: drop,
                    predictedDropInches: Math.round(predicted * 10) / 10,
                    deltaInches: delta,
                    date: new Date().toISOString(),
                  };

                  // Update calibration
                  const loadKey = buildLoadKey(cartridge.shortName, bullet.name, powderName, chargeWeight);
                  const existing = getCalibrationForLoad(cartridge.shortName, bullet.name, powderName, chargeWeight);
                  const cal: LoadCalibration = {
                    id: existing?.id ?? generateId(),
                    loadKey,
                    cartridgeShortName: cartridge.shortName,
                    bulletName: bullet.name,
                    powderName,
                    chargeWeight,
                    trueBC: existing?.trueBC,
                    bcCorrectionFactor: existing?.bcCorrectionFactor,
                    avgMeasuredMV: existing?.avgMeasuredMV ?? muzzleVelocity,
                    sdHistory: existing?.sdHistory ?? [],
                    sessionCount: existing?.sessionCount ?? 0,
                    verificationPoints: [...(existing?.verificationPoints ?? []), vp],
                    updatedAt: new Date().toISOString(),
                  };
                  saveLoadCalibration(cal);
                  setVerifDrop("");
                  refreshRecords();
                }}
                disabled={!verifDrop || !verifRange}
                className="px-3 py-1.5 rounded-md text-[10px] font-mono cursor-pointer transition-all shrink-0"
                style={{
                  background: verifDrop ? "var(--c-accent-dim)" : "var(--c-surface, var(--c-panel))",
                  border: `1px solid ${verifDrop ? "var(--c-accent)" : "var(--c-border)"}`,
                  color: verifDrop ? "var(--c-accent)" : "var(--c-text-dim)",
                  opacity: verifDrop ? 1 : 0.5,
                }}
              >
                Verify
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Mini Stat Box ────────────────────────────────────────────────

function MiniStat({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: string;
  unit: string;
  color?: string;
}) {
  return (
    <div
      className="rounded-md px-2 py-1.5 flex-1 min-w-[70px]"
      style={{
        background: "var(--c-surface, var(--c-panel))",
        border: "1px solid var(--c-border)",
      }}
    >
      <div
        className="text-[8px] uppercase tracking-[1px] font-mono"
        style={{ color: "var(--c-text-dim)" }}
      >
        {label}
      </div>
      <div className="flex items-baseline gap-0.5">
        <span
          className="text-sm font-bold"
          style={{ color: color ?? "var(--c-text)" }}
        >
          {value}
        </span>
        {unit && (
          <span
            className="text-[9px] font-mono"
            style={{ color: "var(--c-text-dim)" }}
          >
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}
