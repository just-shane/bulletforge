import { useState } from "react";
import { reportLoad } from "../../lib/community.ts";
import type { ReportReason } from "../../lib/community.ts";

interface Props {
  sharedLoadId: string;
  onClose: () => void;
  onReported: () => void;
}

const REASONS: { value: ReportReason; label: string }[] = [
  { value: "unsafe", label: "Potentially unsafe load" },
  { value: "inaccurate", label: "Inaccurate data" },
  { value: "spam", label: "Spam or irrelevant" },
  { value: "other", label: "Other" },
];

export function ReportDialog({ sharedLoadId, onClose, onReported }: Props) {
  const [reason, setReason] = useState<ReportReason>("unsafe");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      const ok = await reportLoad(sharedLoadId, reason, details);
      if (ok) {
        onReported();
      } else {
        setError("Failed to submit report. You may have already reported this load.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Report failed");
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
        className="w-full max-w-sm rounded-lg shadow-2xl"
        style={{ background: "var(--c-bg)", border: "1px solid var(--c-border)" }}
      >
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--c-border)" }}
        >
          <div className="text-sm font-bold font-mono" style={{ color: "var(--c-text)" }}>
            Report Load
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
          <div>
            <label className="block text-[10px] font-mono mb-1" style={{ color: "var(--c-text-dim)" }}>
              Reason
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as ReportReason)}
              className="w-full rounded-md px-3 py-2 text-[10px] font-mono outline-none"
              style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", color: "var(--c-text)" }}
            >
              {REASONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-mono mb-1" style={{ color: "var(--c-text-dim)" }}>
              Details (optional)
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
              className="w-full rounded-md px-3 py-2 text-[10px] font-mono outline-none resize-none"
              style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", color: "var(--c-text)" }}
              placeholder="Any additional context..."
            />
          </div>

          {error && (
            <div
              className="rounded-md px-3 py-2 text-[10px] font-mono"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444" }}
            >
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 rounded-md px-3 py-2 text-[10px] font-mono cursor-pointer"
              style={{ background: "var(--c-panel)", border: "1px solid var(--c-border)", color: "var(--c-text-dim)" }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 rounded-md px-3 py-2 text-[10px] font-mono font-bold cursor-pointer"
              style={{
                background: "rgba(239,68,68,0.15)",
                border: "1px solid rgba(239,68,68,0.4)",
                color: "#ef4444",
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? "Submitting..." : "Submit Report"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
