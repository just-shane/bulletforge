import { useState } from "react";
import type { LoadCalibration } from "../../lib/storage.ts";
import type { Bullet } from "../../lib/bullets.ts";
import type { Cartridge } from "../../lib/cartridges.ts";
import type { InternalBallisticsResult } from "../../lib/internal-ballistics.ts";
import type { ConfidenceResult } from "../../lib/confidence.ts";
import { publishLoad } from "../../lib/community.ts";

interface Props {
  calibration: LoadCalibration;
  bullet: Bullet;
  cartridge: Cartridge;
  confidence: ConfidenceResult | null;
  barrelLength: number;
  internalResult: InternalBallisticsResult | null;
  onClose: () => void;
  onPublished: () => void;
}

export function PublishLoadDialog({
  calibration,
  bullet,
  cartridge,
  confidence,
  barrelLength,
  internalResult,
  onClose,
  onPublished,
}: Props) {
  const [notes, setNotes] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const pressurePercent = internalResult
    ? (internalResult.peakPressure / cartridge.maxPressure) * 100
    : null;
  const isOverPressure = pressurePercent !== null && pressurePercent > 100;
  const isNearMax = pressurePercent !== null && pressurePercent > 90 && !isOverPressure;

  const handlePublish = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await publishLoad(
        calibration,
        bullet,
        cartridge,
        confidence,
        barrelLength,
        internalResult,
        notes,
      );
      if (result) {
        onPublished();
      } else {
        setError("Failed to publish. Make sure you're signed in.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publish failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-md rounded-lg shadow-2xl max-h-[90vh] overflow-y-auto"
        style={{ background: "var(--c-bg)", border: "1px solid var(--c-border)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--c-border)" }}
        >
          <div className="text-sm font-bold font-mono" style={{ color: "var(--c-text)" }}>
            Share Load with Community
          </div>
          <button
            onClick={onClose}
            className="text-lg cursor-pointer"
            style={{ color: "var(--c-text-dim)", background: "none", border: "none" }}
          >
            &times;
          </button>
        </div>

        <div className="p-5 space-y-3">
          {/* Safety warnings */}
          {isOverPressure && (
            <div
              className="rounded-md px-3 py-2 text-[10px] font-mono"
              style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", color: "#ef4444" }}
            >
              WARNING: This load exceeds SAAMI maximum pressure ({pressurePercent?.toFixed(0)}% of {cartridge.maxPressure.toLocaleString()} psi). It will be flagged as potentially unsafe.
            </div>
          )}
          {isNearMax && (
            <div
              className="rounded-md px-3 py-2 text-[10px] font-mono"
              style={{ background: "rgba(234,179,8,0.15)", border: "1px solid rgba(234,179,8,0.4)", color: "#eab308" }}
            >
              Note: This load is at {pressurePercent?.toFixed(0)}% of SAAMI maximum pressure.
            </div>
          )}

          {/* Data preview */}
          <div
            className="rounded-md p-3 text-[10px] font-mono space-y-1"
            style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)" }}
          >
            <div className="text-[9px] uppercase tracking-[1.5px] mb-2" style={{ color: "var(--c-accent)" }}>
              Data to Share
            </div>
            <Row label="Cartridge" value={cartridge.shortName} />
            <Row label="Bullet" value={`${bullet.manufacturer} ${bullet.name}`} />
            <Row label="Powder" value={`${calibration.chargeWeight}gr ${calibration.powderName}`} />
            <Row label="Avg MV" value={`${calibration.avgMeasuredMV} fps`} />
            <Row label="Sessions" value={String(calibration.sessionCount)} />
            {confidence && <Row label="Confidence" value={`${confidence.level} (${confidence.score}/100)`} />}
            {confidence && <Row label="Pooled SD" value={`${confidence.pooledSD} fps`} />}
            {calibration.trueBC != null && <Row label="True BC" value={calibration.trueBC.toFixed(4)} />}
            <Row label="Barrel" value={`${barrelLength}"`} />
            {internalResult && <Row label="Est. Pressure" value={`${internalResult.peakPressure.toLocaleString()} psi`} />}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[10px] font-mono mb-1" style={{ color: "var(--c-text-dim)" }}>
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full rounded-md px-3 py-2 text-[10px] font-mono outline-none resize-none"
              style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", color: "var(--c-text)" }}
              placeholder="Rifle, primer, brass prep, seating depth, etc."
            />
          </div>

          {/* Agreement checkbox */}
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5"
            />
            <span className="text-[10px] font-mono" style={{ color: "var(--c-text-dim)" }}>
              I understand this data will be visible to other BulletForge users
            </span>
          </label>

          {error && (
            <div
              className="rounded-md px-3 py-2 text-[10px] font-mono"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444" }}
            >
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={onClose}
              className="flex-1 rounded-md px-3 py-2 text-[10px] font-mono cursor-pointer"
              style={{ background: "var(--c-panel)", border: "1px solid var(--c-border)", color: "var(--c-text-dim)" }}
            >
              Cancel
            </button>
            <button
              onClick={handlePublish}
              disabled={!agreed || loading}
              className="flex-1 rounded-md px-3 py-2.5 text-[10px] font-mono font-bold tracking-wide cursor-pointer"
              style={{
                background: agreed ? "var(--c-accent)" : "var(--c-panel)",
                border: "none",
                color: agreed ? "#fff" : "var(--c-text-faint)",
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? "Publishing..." : "Publish"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span style={{ color: "var(--c-text-dim)" }}>{label}</span>
      <span style={{ color: "var(--c-text)" }}>{value}</span>
    </div>
  );
}
