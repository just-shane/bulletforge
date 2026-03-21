import { useState, useEffect } from "react";
import { useBallisticsStore } from "../../store/store.ts";
import { fetchSharedLoads } from "../../lib/community.ts";
import type { SharedLoad, SortField } from "../../lib/community.ts";
import { CARTRIDGES } from "../../lib/cartridges.ts";
import { ReportDialog } from "./ReportDialog.tsx";

function safetyColor(pressurePercent: number | null, flaggedUnsafe: boolean): string {
  if (flaggedUnsafe) return "#ef4444";
  if (pressurePercent === null) return "var(--c-text-dim)";
  if (pressurePercent > 100) return "#ef4444";
  if (pressurePercent > 90) return "#eab308";
  return "var(--c-success)";
}

function safetyLabel(pressurePercent: number | null, flaggedUnsafe: boolean): string {
  if (flaggedUnsafe) return "OVER PRESSURE";
  if (pressurePercent === null) return "N/A";
  if (pressurePercent > 100) return `${pressurePercent.toFixed(0)}% SAAMI`;
  if (pressurePercent > 90) return `${pressurePercent.toFixed(0)}% SAAMI`;
  return `${pressurePercent.toFixed(0)}% SAAMI`;
}

function confidenceColor(level: string | null): string {
  switch (level) {
    case "Very High":
    case "High":
      return "var(--c-success)";
    case "Good":
    case "Moderate":
      return "var(--c-warn)";
    default:
      return "var(--c-text-dim)";
  }
}

export function CommunityBrowser() {
  const currentCartridge = useBallisticsStore((s) => s.cartridge);
  const user = useBallisticsStore((s) => s.user);

  const [cartridgeFilter, setCartridgeFilter] = useState(currentCartridge.shortName);
  const [sort, setSort] = useState<SortField>("confidence_score");
  const [loads, setLoads] = useState<SharedLoad[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reportingId, setReportingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async data fetch requires setState in callback
    setLoading(true);
    fetchSharedLoads(cartridgeFilter || undefined, sort).then((data) => {
      if (!cancelled) {
        setLoads(data);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [cartridgeFilter, sort]);

  const reload = () => {
    fetchSharedLoads(cartridgeFilter || undefined, sort).then(setLoads);
  };

  return (
    <div>
      <div
        className="text-[10px] uppercase tracking-[2px] font-mono mb-3"
        style={{ color: "var(--c-accent)" }}
      >
        Community Loads
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <select
          value={cartridgeFilter}
          onChange={(e) => setCartridgeFilter(e.target.value)}
          className="rounded-md px-3 py-1.5 text-[10px] font-mono outline-none"
          style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", color: "var(--c-text)" }}
        >
          <option value="">All Cartridges</option>
          {CARTRIDGES.map((c) => (
            <option key={c.shortName} value={c.shortName}>{c.shortName}</option>
          ))}
        </select>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortField)}
          className="rounded-md px-3 py-1.5 text-[10px] font-mono outline-none"
          style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", color: "var(--c-text)" }}
        >
          <option value="confidence_score">Sort: Confidence</option>
          <option value="charge_weight">Sort: Charge Weight</option>
          <option value="avg_measured_mv">Sort: Velocity</option>
          <option value="created_at">Sort: Newest</option>
        </select>
      </div>

      {/* Results */}
      {loading ? (
        <div className="text-[10px] font-mono py-8 text-center" style={{ color: "var(--c-text-faint)" }}>
          Loading community loads...
        </div>
      ) : loads.length === 0 ? (
        <div
          className="rounded-md p-6 text-center"
          style={{ background: "var(--c-panel)", border: "1px solid var(--c-border)" }}
        >
          <div className="text-[11px] font-mono mb-1" style={{ color: "var(--c-text-dim)" }}>
            No community loads {cartridgeFilter ? `for ${cartridgeFilter}` : ""} yet
          </div>
          <div className="text-[9px] font-mono" style={{ color: "var(--c-text-faint)" }}>
            Be the first to share! Record chrono sessions in the Performance tab, then publish your proven loads.
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {loads.map((load) => {
            const expanded = expandedId === load.id;
            return (
              <div
                key={load.id}
                className="rounded-md overflow-hidden"
                style={{ background: "var(--c-panel)", border: "1px solid var(--c-border)" }}
              >
                {/* Summary row */}
                <button
                  onClick={() => setExpandedId(expanded ? null : load.id)}
                  className="w-full text-left px-3 py-2.5 cursor-pointer"
                  style={{ background: "transparent", border: "none" }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-mono font-bold truncate" style={{ color: "var(--c-text)" }}>
                        {load.bulletManufacturer} {load.bulletName}
                      </div>
                      <div className="text-[9px] font-mono" style={{ color: "var(--c-text-dim)" }}>
                        {load.chargeWeight}gr {load.powderName} &middot; {load.avgMeasuredMv} fps
                        {load.pooledSd != null && ` \u00b7 SD ${load.pooledSd.toFixed(1)}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Confidence badge */}
                      {load.confidenceLevel && (
                        <span
                          className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded"
                          style={{
                            color: confidenceColor(load.confidenceLevel),
                            background: "var(--c-surface)",
                            border: `1px solid ${confidenceColor(load.confidenceLevel)}`,
                          }}
                        >
                          {load.confidenceLevel}
                        </span>
                      )}
                      {/* Safety indicator */}
                      <span
                        className="text-[8px] font-mono font-bold"
                        style={{ color: safetyColor(load.pressurePercent, load.flaggedUnsafe) }}
                      >
                        {safetyLabel(load.pressurePercent, load.flaggedUnsafe)}
                      </span>
                      {/* Expand arrow */}
                      <span
                        className="text-[10px] transition-transform"
                        style={{
                          color: "var(--c-text-faint)",
                          transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                          display: "inline-block",
                        }}
                      >
                        &#9660;
                      </span>
                    </div>
                  </div>
                </button>

                {/* Expanded details */}
                {expanded && (
                  <div
                    className="px-3 pb-3 pt-1 space-y-2"
                    style={{ borderTop: "1px solid var(--c-border)" }}
                  >
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[9px] font-mono">
                      <DetailRow label="Cartridge" value={load.cartridgeShortName} />
                      <DetailRow label="Charge" value={`${load.chargeWeight}gr ${load.powderName}`} />
                      <DetailRow label="Avg MV" value={`${load.avgMeasuredMv} fps`} />
                      <DetailRow label="Sessions" value={String(load.sessionCount)} />
                      <DetailRow label="Total Rounds" value={String(load.totalRounds)} />
                      {load.pooledSd != null && <DetailRow label="Pooled SD" value={`${load.pooledSd.toFixed(1)} fps`} />}
                      {load.trueBc != null && <DetailRow label="True BC" value={load.trueBc.toFixed(4)} />}
                      {load.barrelLength != null && <DetailRow label="Barrel" value={`${load.barrelLength}"`} />}
                      {load.coal != null && <DetailRow label="COAL" value={`${load.coal}"`} />}
                    </div>

                    {load.notes && (
                      <div className="text-[9px] font-mono" style={{ color: "var(--c-text-dim)" }}>
                        {load.notes}
                      </div>
                    )}

                    {/* Unsafe warning */}
                    {load.flaggedUnsafe && (
                      <div
                        className="rounded-md px-2 py-1.5 text-[9px] font-mono"
                        style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444" }}
                      >
                        This load may exceed SAAMI maximum pressure. Use extreme caution.
                      </div>
                    )}

                    {/* Report button */}
                    {user && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setReportingId(load.id); }}
                        className="text-[9px] font-mono cursor-pointer"
                        style={{ color: "var(--c-text-faint)", background: "none", border: "none" }}
                      >
                        Report this load
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Not signed in notice */}
      {!user && (
        <div className="text-[9px] font-mono mt-4 text-center" style={{ color: "var(--c-text-faint)" }}>
          Sign in to share your loads and report inaccurate data.
        </div>
      )}

      {/* Report dialog */}
      {reportingId && (
        <ReportDialog
          sharedLoadId={reportingId}
          onClose={() => setReportingId(null)}
          onReported={() => { setReportingId(null); reload(); }}
        />
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span style={{ color: "var(--c-text-faint)" }}>{label}</span>
      <span style={{ color: "var(--c-text)" }}>{value}</span>
    </div>
  );
}
