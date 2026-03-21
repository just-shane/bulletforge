import { useState, useCallback, useRef } from "react";
import { useBallisticsStore } from "../../store/store.ts";
import { CHRONO_REFERENCES, BARREL_LENGTH_REFERENCES } from "../../lib/seed-data.ts";
import type { PerformanceRecord } from "../../lib/storage.ts";
import { savePerformanceRecord, generateId } from "../../lib/storage.ts";

// ─── CSV Parsing ──────────────────────────────────────────────────

interface ParsedSeries {
  seriesNumber: number;
  velocities: number[];
}

interface ParseResult {
  format: "LabRadar" | "MagnetoSpeed";
  deviceInfo: string;
  series: ParsedSeries[];
  totalShots: number;
}

function normalizeLines(raw: string): string[] {
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

function parseLabRadar(raw: string): ParseResult {
  const lines = normalizeLines(raw);
  const velocities: number[] = [];
  let deviceId = "LabRadar";
  let inShotData = false;
  let v0ColIdx = -1;

  for (const line of lines) {
    // Extract device ID
    if (line.toLowerCase().startsWith("device id")) {
      const parts = line.split(";").map((s) => s.trim());
      if (parts[1]) deviceId = parts[1];
      continue;
    }

    // Find the header row containing "Shot ID" and "V0"
    if (line.includes("Shot ID") && line.includes("V0")) {
      const cols = line.split(";").map((s) => s.trim());
      v0ColIdx = cols.indexOf("V0");
      if (v0ColIdx < 0) v0ColIdx = 1; // fallback: V0 is typically column 1
      inShotData = true;
      continue;
    }

    // Parse shot rows
    if (inShotData) {
      const cols = line.split(";").map((s) => s.trim());
      // Shot ID should be a number (first column)
      const shotId = Number(cols[0]);
      if (Number.isNaN(shotId) || shotId <= 0) continue;
      const v0 = Number(cols[v0ColIdx]);
      if (!Number.isNaN(v0) && v0 > 0) {
        velocities.push(Math.round(v0));
      }
    }
  }

  return {
    format: "LabRadar",
    deviceInfo: deviceId,
    series: [{ seriesNumber: 1, velocities }],
    totalShots: velocities.length,
  };
}

function parseMagnetoSpeed(raw: string): ParseResult {
  const lines = normalizeLines(raw);
  const seriesMap = new Map<number, number[]>();
  let deviceInfo = "MagnetoSpeed";

  for (const line of lines) {
    // Match shot data rows: series, shot, speed, optional unit
    // Pattern: number, number, number (comma-separated)
    const match = line.match(/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (match) {
      const seriesNum = Number(match[1]);
      const speed = Number(match[3]);
      if (speed > 0) {
        if (!seriesMap.has(seriesNum)) {
          seriesMap.set(seriesNum, []);
        }
        seriesMap.get(seriesNum)!.push(Math.round(speed));
      }
    }
  }

  const series: ParsedSeries[] = [];
  for (const [num, vels] of Array.from(seriesMap.entries()).sort((a, b) => a[0] - b[0])) {
    series.push({ seriesNumber: num, velocities: vels });
  }

  const totalShots = series.reduce((sum, s) => sum + s.velocities.length, 0);

  return {
    format: "MagnetoSpeed",
    deviceInfo,
    series,
    totalShots,
  };
}

function parseCSV(raw: string): ParseResult | null {
  if (!raw || raw.trim().length === 0) return null;
  const trimmed = raw.trim();
  // Auto-detect: LabRadar files start with "sep=;"
  if (trimmed.startsWith("sep=;")) {
    return parseLabRadar(raw);
  }
  return parseMagnetoSpeed(raw);
}

// ─── Stats helpers ────────────────────────────────────────────────

function calcAvg(v: number[]): number {
  if (v.length === 0) return 0;
  return Math.round(v.reduce((a, b) => a + b, 0) / v.length);
}

function calcES(v: number[]): number {
  if (v.length < 2) return 0;
  return Math.max(...v) - Math.min(...v);
}

function calcSD(v: number[]): number {
  if (v.length < 2) return 0;
  const mean = v.reduce((a, b) => a + b, 0) / v.length;
  const variance = v.reduce((sum, x) => sum + (x - mean) ** 2, 0) / (v.length - 1);
  return Math.round(Math.sqrt(variance) * 10) / 10;
}

// ─── Styles ───────────────────────────────────────────────────────

const sectionHeaderStyle: React.CSSProperties = {
  color: "var(--c-accent)",
  fontSize: 11,
  fontFamily: "monospace",
  letterSpacing: 2,
  textTransform: "uppercase" as const,
};

const dimLabelStyle: React.CSSProperties = {
  color: "var(--c-text-dim)",
  fontSize: 8,
  fontFamily: "monospace",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
};

const statValueStyle: React.CSSProperties = {
  color: "var(--c-text)",
  fontSize: 10,
  fontFamily: "monospace",
};

const cardStyle: React.CSSProperties = {
  background: "var(--c-surface)",
  border: "1px solid var(--c-border)",
  borderRadius: 4,
  padding: "8px 10px",
};

const buttonStyle: React.CSSProperties = {
  background: "var(--c-accent)",
  color: "#000",
  border: "none",
  borderRadius: 4,
  padding: "4px 12px",
  fontSize: 10,
  fontFamily: "monospace",
  textTransform: "uppercase" as const,
  letterSpacing: 1,
  cursor: "pointer",
};

// ─── Component ────────────────────────────────────────────────────

export function ChronoImport() {
  const cartridge = useBallisticsStore((s) => s.cartridge);
  const muzzleVelocity = useBallisticsStore((s) => s.muzzleVelocity);
  const barrelLength = useBallisticsStore((s) => s.barrelLength);
  const bullet = useBallisticsStore((s) => s.bullet);
  const powderName = useBallisticsStore((s) => s.powderName);
  const chargeWeight = useBallisticsStore((s) => s.chargeWeight);

  const [collapsed, setCollapsed] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [activeSeries, setActiveSeries] = useState(0);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── File import handler ───────────────────────────────────────
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text !== "string") return;
      const result = parseCSV(text);
      setParseResult(result);
      setActiveSeries(0);
      setSaved(false);
    };
    reader.readAsText(file);
  }, []);

  // ── Save handler ──────────────────────────────────────────────
  const handleSave = useCallback(() => {
    if (!parseResult) return;
    const series = parseResult.series[activeSeries];
    if (!series || series.velocities.length === 0) return;

    const record: PerformanceRecord = {
      id: generateId(),
      cartridgeShortName: cartridge.shortName,
      bulletName: bullet.name,
      powderName: powderName || "Unknown",
      chargeWeight: chargeWeight || 0,
      velocities: series.velocities,
      es: calcES(series.velocities),
      sd: calcSD(series.velocities),
      date: new Date().toISOString().slice(0, 10),
      notes: `Imported from ${parseResult.format} — ${parseResult.deviceInfo}, Series ${series.seriesNumber}`,
    };
    savePerformanceRecord(record);
    setSaved(true);
  }, [parseResult, activeSeries, cartridge, bullet, powderName, chargeWeight]);

  // ── Reference data ────────────────────────────────────────────
  const matchingRefs = CHRONO_REFERENCES.filter(
    (r) => r.cartridgeShortName === cartridge.shortName,
  );

  const matchingBarrelRefs = BARREL_LENGTH_REFERENCES.filter(
    (r) => r.cartridgeShortName === cartridge.shortName,
  );

  // ── Active velocities from import ─────────────────────────────
  const activeVelocities = parseResult?.series[activeSeries]?.velocities ?? [];

  // ── Delta color helper ────────────────────────────────────────
  function deltaColor(delta: number): string {
    const abs = Math.abs(delta);
    if (abs <= 25) return "var(--c-success, #22c55e)";
    if (abs <= 50) return "var(--c-warn, #eab308)";
    return "var(--c-danger, #ef4444)";
  }

  return (
    <div
      className="rounded-md overflow-hidden"
      style={{ background: "var(--c-panel)", border: "1px solid var(--c-border)" }}
    >
      {/* ── Header ─────────────────────────────────────────────── */}
      <div
        className="px-4 pt-3 pb-2 flex items-center justify-between cursor-pointer select-none"
        onClick={() => setCollapsed((c) => !c)}
      >
        <div style={sectionHeaderStyle}>Chronograph Data</div>
        <div
          className="text-[10px] font-mono"
          style={{ color: "var(--c-text-dim)", transition: "transform 150ms" }}
        >
          {collapsed ? "\u25B6" : "\u25BC"}
        </div>
      </div>

      {!collapsed && (
        <div className="px-4 pb-4">
          {/* ════════════════════════════════════════════════════ */}
          {/* SECTION 1 — CSV Import                              */}
          {/* ════════════════════════════════════════════════════ */}
          <div style={{ marginBottom: 16 }}>
            <div
              className="text-[9px] font-mono tracking-[1.5px] uppercase mb-2"
              style={{ color: "var(--c-text-dim)" }}
            >
              Import CSV
            </div>

            <div
              style={{
                borderBottom: "1px solid var(--c-border)",
                paddingBottom: 12,
                marginBottom: 12,
              }}
            >
              {/* File input */}
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.CSV"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
              <button
                onClick={() => fileRef.current?.click()}
                style={buttonStyle}
              >
                Import .CSV
              </button>
              <span
                className="ml-2 text-[9px] font-mono"
                style={{ color: "var(--c-text-dim)" }}
              >
                LabRadar &amp; MagnetoSpeed supported
              </span>

              {/* ── Parse results ──────────────────────────────── */}
              {parseResult && (
                <div style={{ marginTop: 10 }}>
                  {/* Device / summary */}
                  <div className="flex gap-4 mb-2">
                    <span style={dimLabelStyle}>
                      Format:{" "}
                      <span style={statValueStyle}>{parseResult.format}</span>
                    </span>
                    <span style={dimLabelStyle}>
                      Device:{" "}
                      <span style={statValueStyle}>{parseResult.deviceInfo}</span>
                    </span>
                    <span style={dimLabelStyle}>
                      Series:{" "}
                      <span style={statValueStyle}>{parseResult.series.length}</span>
                    </span>
                    <span style={dimLabelStyle}>
                      Shots:{" "}
                      <span style={statValueStyle}>{parseResult.totalShots}</span>
                    </span>
                  </div>

                  {/* Series tabs (MagnetoSpeed multi-series) */}
                  {parseResult.series.length > 1 && (
                    <div className="flex gap-1 mb-2">
                      {parseResult.series.map((s, idx) => (
                        <button
                          key={s.seriesNumber}
                          onClick={() => {
                            setActiveSeries(idx);
                            setSaved(false);
                          }}
                          className="text-[9px] font-mono px-2 py-0.5 rounded"
                          style={{
                            background:
                              idx === activeSeries
                                ? "var(--c-accent)"
                                : "var(--c-surface)",
                            color:
                              idx === activeSeries
                                ? "#000"
                                : "var(--c-text-dim)",
                            border: "1px solid var(--c-border)",
                            cursor: "pointer",
                          }}
                        >
                          S{s.seriesNumber} ({s.velocities.length})
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Velocity grid */}
                  {activeVelocities.length > 0 && (
                    <>
                      <div
                        className="grid gap-1 mb-2"
                        style={{
                          gridTemplateColumns: "repeat(auto-fill, minmax(48px, 1fr))",
                        }}
                      >
                        {activeVelocities.map((v, i) => (
                          <div
                            key={i}
                            className="text-center text-[9px] font-mono rounded py-0.5"
                            style={{
                              background: "var(--c-surface)",
                              color: "var(--c-text)",
                            }}
                          >
                            {v}
                          </div>
                        ))}
                      </div>

                      {/* Stats row */}
                      <div className="flex gap-4 mb-2">
                        <span style={dimLabelStyle}>
                          Avg:{" "}
                          <span style={statValueStyle}>
                            {calcAvg(activeVelocities)} fps
                          </span>
                        </span>
                        <span style={dimLabelStyle}>
                          ES:{" "}
                          <span style={statValueStyle}>
                            {calcES(activeVelocities)} fps
                          </span>
                        </span>
                        <span style={dimLabelStyle}>
                          SD:{" "}
                          <span style={statValueStyle}>
                            {calcSD(activeVelocities)}
                          </span>
                        </span>
                        <span style={dimLabelStyle}>
                          N:{" "}
                          <span style={statValueStyle}>
                            {activeVelocities.length}
                          </span>
                        </span>
                      </div>

                      {/* Save button */}
                      <button
                        onClick={handleSave}
                        disabled={saved}
                        style={{
                          ...buttonStyle,
                          opacity: saved ? 0.5 : 1,
                          cursor: saved ? "default" : "pointer",
                        }}
                      >
                        {saved ? "Saved" : "Save to Performance Log"}
                      </button>
                    </>
                  )}

                  {activeVelocities.length === 0 && (
                    <div
                      className="text-[9px] font-mono py-2"
                      style={{ color: "var(--c-text-dim)" }}
                    >
                      No velocity data found in file.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ════════════════════════════════════════════════════ */}
          {/* SECTION 2 — Reference Data                          */}
          {/* ════════════════════════════════════════════════════ */}
          <div>
            <div
              className="text-[9px] font-mono tracking-[1.5px] uppercase mb-2"
              style={{ color: "var(--c-text-dim)" }}
            >
              Reference Data
            </div>

            {/* ── Chrono references ─────────────────────────────── */}
            {matchingRefs.length === 0 ? (
              <div
                className="text-[9px] font-mono py-2"
                style={{ color: "var(--c-text-dim)" }}
              >
                No reference data for {cartridge.shortName}
              </div>
            ) : (
              <div className="flex flex-col gap-2 mb-3">
                {matchingRefs.map((ref) => {
                  const delta = ref.avgVelocity - muzzleVelocity;
                  return (
                    <div key={ref.id} style={cardStyle}>
                      <div
                        className="text-[10px] font-mono font-bold mb-1"
                        style={{ color: "var(--c-text)" }}
                      >
                        {ref.label}
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                        <span style={dimLabelStyle}>
                          Bullet:{" "}
                          <span style={statValueStyle}>
                            {ref.bulletDescription}
                          </span>
                        </span>
                        <span style={dimLabelStyle}>
                          Powder:{" "}
                          <span style={statValueStyle}>
                            {ref.powderName}
                            {ref.chargeWeight > 0
                              ? ` / ${ref.chargeWeight}gr`
                              : ""}
                          </span>
                        </span>
                        <span style={dimLabelStyle}>
                          Device:{" "}
                          <span style={statValueStyle}>{ref.device}</span>
                        </span>
                        <span style={dimLabelStyle}>
                          Shots:{" "}
                          <span style={statValueStyle}>
                            {ref.velocities.length}
                          </span>
                        </span>
                      </div>

                      <div
                        className="flex gap-4 mt-1 pt-1"
                        style={{ borderTop: "1px solid var(--c-border)" }}
                      >
                        <span style={dimLabelStyle}>
                          Avg:{" "}
                          <span style={statValueStyle}>
                            {ref.avgVelocity} fps
                          </span>
                        </span>
                        <span style={dimLabelStyle}>
                          ES:{" "}
                          <span style={statValueStyle}>{ref.es}</span>
                        </span>
                        <span style={dimLabelStyle}>
                          SD:{" "}
                          <span style={statValueStyle}>{ref.sd}</span>
                        </span>
                        <span style={dimLabelStyle}>
                          Delta:{" "}
                          <span
                            className="font-bold"
                            style={{
                              ...statValueStyle,
                              color: deltaColor(delta),
                            }}
                          >
                            {delta > 0 ? "+" : ""}
                            {delta} fps
                          </span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Barrel length references ──────────────────────── */}
            {matchingBarrelRefs.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div
                  className="text-[9px] font-mono tracking-[1.5px] uppercase mb-2"
                  style={{ color: "var(--c-text-dim)" }}
                >
                  Barrel Length vs Velocity
                </div>

                {matchingBarrelRefs.map((blRef, refIdx) => {
                  // Find row closest to user's barrel length
                  let closestIdx = 0;
                  let closestDiff = Infinity;
                  blRef.data.forEach((row, i) => {
                    const diff = Math.abs(row.barrelLength - barrelLength);
                    if (diff < closestDiff) {
                      closestDiff = diff;
                      closestIdx = i;
                    }
                  });

                  return (
                    <div key={refIdx} style={{ ...cardStyle, marginBottom: 8 }}>
                      <div
                        className="text-[9px] font-mono mb-1"
                        style={{ color: "var(--c-text-dim)" }}
                      >
                        {blRef.bulletDescription} — {blRef.loadDescription}
                      </div>
                      <table
                        className="w-full text-[9px] font-mono"
                        style={{
                          borderCollapse: "collapse",
                          color: "var(--c-text)",
                        }}
                      >
                        <thead>
                          <tr
                            style={{
                              borderBottom: "1px solid var(--c-border)",
                            }}
                          >
                            <th
                              className="text-left py-0.5 pr-3"
                              style={{ color: "var(--c-text-dim)" }}
                            >
                              Barrel Length
                            </th>
                            <th
                              className="text-right py-0.5 pr-3"
                              style={{ color: "var(--c-text-dim)" }}
                            >
                              Avg Velocity
                            </th>
                            <th
                              className="text-right py-0.5"
                              style={{ color: "var(--c-text-dim)" }}
                            >
                              fps/in loss
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {blRef.data.map((row, i) => {
                            const isClosest = i === closestIdx;
                            return (
                              <tr
                                key={row.barrelLength}
                                style={{
                                  background: isClosest
                                    ? "var(--c-accent)"
                                    : "transparent",
                                  color: isClosest
                                    ? "#000"
                                    : "var(--c-text)",
                                  fontWeight: isClosest ? 700 : 400,
                                }}
                              >
                                <td className="py-0.5 pr-3">
                                  {row.barrelLength}&quot;
                                </td>
                                <td className="text-right py-0.5 pr-3">
                                  {row.avgVelocity} fps
                                </td>
                                <td className="text-right py-0.5">
                                  {row.fpsPerInchLoss != null
                                    ? `${row.fpsPerInchLoss}`
                                    : "\u2014"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      <div
                        className="text-[8px] font-mono mt-1"
                        style={{ color: "var(--c-text-dim)" }}
                      >
                        Source: {blRef.source}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
