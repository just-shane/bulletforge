import { useState, useEffect, useMemo, useCallback } from "react";
import { useBallisticsStore } from "../../store/store.ts";
import type { PerformanceRecord } from "../../lib/storage.ts";
import {
  savePerformanceRecord,
  deletePerformanceRecord,
  getPerformanceRecordsForLoad,
  generateId,
} from "../../lib/storage.ts";

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

  const [collapsed, setCollapsed] = useState(false);
  const [velocityInput, setVelocityInput] = useState("");
  const [notes, setNotes] = useState("");
  const [records, setRecords] = useState<PerformanceRecord[]>([]);

  // Parsed velocities and live stats
  const parsed = useMemo(() => {
    return velocityInput
      .split(/[,\s\n]+/)
      .map((s) => parseFloat(s.trim()))
      .filter((v) => !isNaN(v) && v > 0);
  }, [velocityInput]);

  const liveStats = useMemo(() => calcStats(parsed), [parsed]);

  // Load records for current load combo
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
  }, [cartridge.shortName, bullet.name, powderName]);

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

  // Save handler
  const handleSave = useCallback(() => {
    if (parsed.length < 2) return;
    const { es, sd } = calcStats(parsed);
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
    };
    savePerformanceRecord(record);
    setVelocityInput("");
    setNotes("");
    refreshRecords();
  }, [parsed, cartridge, bullet, powderName, chargeWeight, notes, refreshRecords]);

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
