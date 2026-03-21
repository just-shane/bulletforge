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

          {/* ─── Environmental Correlation ──────────── */}
          {records.length >= 2 && <EnvironmentalCorrelation records={records} />}

          {/* ─── Seasonal Tracking ──────────────────── */}
          {records.length >= 2 && <SeasonalTracking records={records} />}

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

// ─── Environmental Correlation ────────────────────────────────────

interface TempBand {
  label: string;
  min: number;
  max: number;
  records: PerformanceRecord[];
  avgVelocity: number;
  avgSD: number;
}

function EnvironmentalCorrelation({ records }: { records: PerformanceRecord[] }) {
  const [expanded, setExpanded] = useState(false);

  // Group records by temperature bands (using conditions or configSnapshot)
  const bands = useMemo(() => {
    const withTemp = records.filter(
      (r) => r.conditions?.temperature != null || r.configSnapshot?.temperature != null,
    );
    if (withTemp.length < 2) return [];

    const bandDefs = [
      { label: "Cold (<40\u00B0F)", min: -60, max: 40 },
      { label: "Cool (40-60\u00B0F)", min: 40, max: 60 },
      { label: "Mild (60-80\u00B0F)", min: 60, max: 80 },
      { label: "Warm (80-100\u00B0F)", min: 80, max: 100 },
      { label: "Hot (>100\u00B0F)", min: 100, max: 200 },
    ];

    return bandDefs
      .map((def) => {
        const matching = withTemp.filter((r) => {
          const temp = r.configSnapshot?.temperature ?? r.conditions?.temperature ?? 0;
          return temp >= def.min && temp < def.max;
        });
        if (matching.length === 0) return null;

        const allVels = matching.flatMap((r) => r.velocities);
        const avgVelocity = allVels.reduce((a, b) => a + b, 0) / allVels.length;
        const avgSD = matching.reduce((sum, r) => sum + r.sd, 0) / matching.length;

        return {
          ...def,
          records: matching,
          avgVelocity: Math.round(avgVelocity),
          avgSD: Math.round(avgSD * 10) / 10,
        } as TempBand;
      })
      .filter((b): b is TempBand => b !== null);
  }, [records]);

  // Altitude analysis
  const altitudeAnalysis = useMemo(() => {
    const withAlt = records.filter(
      (r) => r.conditions?.altitude != null || r.configSnapshot?.altitude != null,
    );
    if (withAlt.length < 2) return null;

    const altitudes = withAlt.map((r) => r.configSnapshot?.altitude ?? r.conditions?.altitude ?? 0);
    const minAlt = Math.min(...altitudes);
    const maxAlt = Math.max(...altitudes);
    if (maxAlt - minAlt < 500) return null; // Need meaningful altitude variation

    // Split into low and high halves
    const midAlt = (minAlt + maxAlt) / 2;
    const lowRecs = withAlt.filter((r) => (r.configSnapshot?.altitude ?? r.conditions?.altitude ?? 0) < midAlt);
    const highRecs = withAlt.filter((r) => (r.configSnapshot?.altitude ?? r.conditions?.altitude ?? 0) >= midAlt);

    if (lowRecs.length === 0 || highRecs.length === 0) return null;

    const lowAvg = lowRecs.flatMap((r) => r.velocities).reduce((a, b) => a + b, 0) /
      lowRecs.flatMap((r) => r.velocities).length;
    const highAvg = highRecs.flatMap((r) => r.velocities).reduce((a, b) => a + b, 0) /
      highRecs.flatMap((r) => r.velocities).length;

    return {
      lowLabel: `<${Math.round(midAlt).toLocaleString()} ft`,
      highLabel: `\u2265${Math.round(midAlt).toLocaleString()} ft`,
      lowAvg: Math.round(lowAvg),
      highAvg: Math.round(highAvg),
      delta: Math.round(highAvg - lowAvg),
    };
  }, [records]);

  if (bands.length < 2 && !altitudeAnalysis) return null;

  return (
    <div className="mt-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full text-left cursor-pointer"
        style={{ background: "transparent", border: "none", padding: 0 }}
      >
        <span className="text-[10px] uppercase tracking-[2px] font-mono" style={{ color: "var(--c-accent)" }}>
          Environmental Correlation
        </span>
        <span className="text-[10px] font-mono" style={{ color: "var(--c-text-faint)" }}>
          {expanded ? "\u25B4" : "\u25BE"}
        </span>
      </button>

      {!expanded && (
        <div className="text-[8px] font-mono mt-0.5" style={{ color: "var(--c-text-faint)" }}>
          {bands.length} temperature band{bands.length !== 1 ? "s" : ""} with data
          {altitudeAnalysis ? " \u00B7 altitude comparison available" : ""}
        </div>
      )}

      {expanded && (
        <div className="mt-2">
          {/* Temperature bands */}
          {bands.length >= 2 && (
            <div>
              <div className="text-[9px] font-mono mb-1.5" style={{ color: "var(--c-text-dim)" }}>
                Velocity and SD by temperature range
              </div>
              <div
                className="rounded-md overflow-hidden"
                style={{ border: "1px solid var(--c-border)" }}
              >
                <table className="w-full text-[10px] font-mono" style={{ borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "var(--c-surface, var(--c-panel))", color: "var(--c-text-dim)" }}>
                      <th className="text-left px-2 py-1.5">Temp Band</th>
                      <th className="text-right px-2 py-1.5">Sessions</th>
                      <th className="text-right px-2 py-1.5">Avg Vel</th>
                      <th className="text-right px-2 py-1.5">Avg SD</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bands.map((band) => (
                      <tr key={band.label} style={{ borderTop: "1px solid var(--c-border)", color: "var(--c-text)" }}>
                        <td className="px-2 py-1.5">{band.label}</td>
                        <td className="text-right px-2 py-1.5">{band.records.length}</td>
                        <td className="text-right px-2 py-1.5">{band.avgVelocity} fps</td>
                        <td className="text-right px-2 py-1.5 font-bold" style={{ color: sdColor(band.avgSD) }}>
                          {band.avgSD}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {bands.length >= 2 && (
                <div className="text-[8px] font-mono mt-1" style={{ color: "var(--c-text-faint)" }}>
                  Velocity shift: {Math.abs(bands[bands.length - 1].avgVelocity - bands[0].avgVelocity)} fps across{" "}
                  {bands[0].label.split("(")[0].trim()} to {bands[bands.length - 1].label.split("(")[0].trim()} conditions
                </div>
              )}
            </div>
          )}

          {/* Altitude comparison */}
          {altitudeAnalysis && (
            <div className="mt-3">
              <div className="text-[9px] font-mono mb-1.5" style={{ color: "var(--c-text-dim)" }}>
                Altitude effect
              </div>
              <div className="flex gap-2">
                <div className="flex-1 rounded-md p-2 text-center" style={{ background: "var(--c-surface, var(--c-panel))", border: "1px solid var(--c-border)" }}>
                  <div className="text-[8px] font-mono uppercase" style={{ color: "var(--c-text-dim)" }}>{altitudeAnalysis.lowLabel}</div>
                  <div className="text-sm font-bold font-mono" style={{ color: "var(--c-text)" }}>{altitudeAnalysis.lowAvg} fps</div>
                </div>
                <div className="flex items-center text-[9px] font-mono" style={{ color: altitudeAnalysis.delta > 0 ? "var(--c-success)" : "var(--c-warn)" }}>
                  {altitudeAnalysis.delta > 0 ? "+" : ""}{altitudeAnalysis.delta}
                </div>
                <div className="flex-1 rounded-md p-2 text-center" style={{ background: "var(--c-surface, var(--c-panel))", border: "1px solid var(--c-border)" }}>
                  <div className="text-[8px] font-mono uppercase" style={{ color: "var(--c-text-dim)" }}>{altitudeAnalysis.highLabel}</div>
                  <div className="text-sm font-bold font-mono" style={{ color: "var(--c-text)" }}>{altitudeAnalysis.highAvg} fps</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Seasonal Tracking ────────────────────────────────────────────

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const SEASONS: { name: string; months: number[]; color: string }[] = [
  { name: "Winter", months: [11, 0, 1], color: "#6cb4ee" },
  { name: "Spring", months: [2, 3, 4], color: "#7dd87d" },
  { name: "Summer", months: [5, 6, 7], color: "#e8a838" },
  { name: "Fall", months: [8, 9, 10], color: "#d4764e" },
];

function SeasonalTracking({ records }: { records: PerformanceRecord[] }) {
  const [expanded, setExpanded] = useState(false);

  const seasonalData = useMemo(() => {
    if (records.length < 3) return null;

    // Group by month
    const byMonth: Record<number, { velocities: number[]; sds: number[] }> = {};
    for (const r of records) {
      const month = new Date(r.date).getMonth();
      if (!byMonth[month]) byMonth[month] = { velocities: [], sds: [] };
      byMonth[month].velocities.push(...r.velocities);
      byMonth[month].sds.push(r.sd);
    }

    const monthlyStats = Object.entries(byMonth).map(([month, data]) => ({
      month: parseInt(month),
      label: MONTH_NAMES[parseInt(month)],
      avgVelocity: Math.round(data.velocities.reduce((a, b) => a + b, 0) / data.velocities.length),
      avgSD: Math.round((data.sds.reduce((a, b) => a + b, 0) / data.sds.length) * 10) / 10,
      sessions: data.sds.length,
    }));

    // Group by season
    const seasonalStats = SEASONS.map((season) => {
      const monthData = season.months.flatMap((m) => byMonth[m] ? [byMonth[m]] : []);
      if (monthData.length === 0) return null;

      const allVels = monthData.flatMap((d) => d.velocities);
      const allSDs = monthData.flatMap((d) => d.sds);

      return {
        name: season.name,
        color: season.color,
        avgVelocity: Math.round(allVels.reduce((a, b) => a + b, 0) / allVels.length),
        avgSD: Math.round((allSDs.reduce((a, b) => a + b, 0) / allSDs.length) * 10) / 10,
        sessions: allSDs.length,
      };
    }).filter((s) => s !== null);

    if (seasonalStats.length < 2) return null;

    return { monthlyStats, seasonalStats };
  }, [records]);

  if (!seasonalData) return null;

  const { seasonalStats } = seasonalData;
  const maxVel = Math.max(...seasonalStats.map((s) => s!.avgVelocity));
  const minVel = Math.min(...seasonalStats.map((s) => s!.avgVelocity));
  const velRange = maxVel - minVel || 1;

  return (
    <div className="mt-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full text-left cursor-pointer"
        style={{ background: "transparent", border: "none", padding: 0 }}
      >
        <span className="text-[10px] uppercase tracking-[2px] font-mono" style={{ color: "var(--c-accent)" }}>
          Seasonal Tracking
        </span>
        <span className="text-[10px] font-mono" style={{ color: "var(--c-text-faint)" }}>
          {expanded ? "\u25B4" : "\u25BE"}
        </span>
      </button>

      {!expanded && (
        <div className="text-[8px] font-mono mt-0.5" style={{ color: "var(--c-text-faint)" }}>
          {seasonalStats.length} season{seasonalStats.length !== 1 ? "s" : ""} with data
          {velRange > 5 ? ` \u00B7 ${velRange} fps seasonal spread` : ""}
        </div>
      )}

      {expanded && (
        <div className="mt-2">
          <div className="text-[9px] font-mono mb-2" style={{ color: "var(--c-text-dim)" }}>
            How your load performs across seasons. Expect higher velocities in summer (hotter powder) and lower in winter.
          </div>

          {/* Seasonal bars */}
          <div className="flex flex-col gap-1.5 mb-2">
            {seasonalStats.map((season) => {
              if (!season) return null;
              const barWidth = velRange > 0
                ? 30 + ((season.avgVelocity - minVel) / velRange) * 70
                : 50;
              return (
                <div key={season.name} className="flex items-center gap-2">
                  <div className="w-14 text-[9px] font-mono font-bold shrink-0" style={{ color: season.color }}>
                    {season.name}
                  </div>
                  <div className="flex-1 h-4 rounded-sm overflow-hidden" style={{ background: "var(--c-border)" }}>
                    <div
                      className="h-full rounded-sm flex items-center justify-end px-1.5"
                      style={{ width: `${barWidth}%`, background: season.color, opacity: 0.7 }}
                    >
                      <span className="text-[8px] font-mono font-bold" style={{ color: "#000" }}>
                        {season.avgVelocity}
                      </span>
                    </div>
                  </div>
                  <div className="text-[8px] font-mono shrink-0 w-16 text-right" style={{ color: "var(--c-text-dim)" }}>
                    SD {season.avgSD} · {season.sessions}s
                  </div>
                </div>
              );
            })}
          </div>

          {velRange > 5 && (
            <div className="text-[8px] font-mono mt-1" style={{ color: "var(--c-text-faint)" }}>
              Total seasonal velocity spread: {velRange} fps ({((velRange / maxVel) * 100).toFixed(1)}%).
              {velRange > 30 ? " Consider a temperature-insensitive powder." : velRange > 15 ? " Moderate — verify DOPE at temperature extremes." : " Minimal — this load is temperature-stable."}
            </div>
          )}
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
