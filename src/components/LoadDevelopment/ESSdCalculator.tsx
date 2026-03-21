import { useState, useCallback } from "react";
import { analyzeShotString, type ShotString } from "../../lib/load-development.ts";

export function ESSdCalculator() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<ShotString | null>(null);

  const calculate = useCallback(() => {
    // Parse comma or whitespace-separated velocity values
    const velocities = input
      .split(/[,\s\n]+/)
      .map((s) => parseFloat(s.trim()))
      .filter((v) => !isNaN(v) && v > 0);

    if (velocities.length === 0) {
      setResult(null);
      return;
    }

    setResult(analyzeShotString(velocities));
  }, [input]);

  return (
    <div>
      <div
        className="text-[10px] tracking-[2px] font-mono uppercase mb-3"
        style={{ color: "var(--c-accent)" }}
      >
        ES / SD Calculator
      </div>

      {/* Input area */}
      <div className="mb-4">
        <div className="text-[11px] mb-1" style={{ color: "var(--c-text-muted)" }}>
          Enter velocities (fps) — comma or space separated
        </div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onBlur={calculate}
          placeholder="2705, 2712, 2698, 2710, 2703"
          rows={3}
          className="w-full rounded-md px-3 py-2 text-[11px] font-mono resize-none"
          style={{
            background: "var(--c-panel)",
            border: "1px solid var(--c-border)",
            color: "var(--c-text)",
          }}
        />
        <button
          onClick={calculate}
          className="mt-2 px-4 py-1.5 rounded-md text-[11px] font-mono cursor-pointer transition-all"
          style={{
            background: "var(--c-accent-dim)",
            border: "1px solid var(--c-accent)",
            color: "var(--c-accent)",
          }}
        >
          Calculate
        </button>
      </div>

      {/* Results */}
      {result && result.count > 0 && (
        <div className="flex gap-2 flex-wrap">
          <StatBox label="Average" value={result.average.toFixed(1)} unit="fps" />
          <StatBox label="ES" value={result.extremeSpread.toFixed(1)} unit="fps"
            warn={result.extremeSpread > 30} />
          <StatBox label="SD" value={result.standardDeviation.toFixed(1)} unit="fps"
            warn={result.standardDeviation > 15} good={result.standardDeviation < 8} />
          <StatBox label="Median" value={result.median.toFixed(1)} unit="fps" />
          <StatBox label="Shots" value={String(result.count)} unit="" />
        </div>
      )}

      {result && result.count > 0 && (
        <div
          className="mt-3 rounded-md p-2 text-[9px] font-mono"
          style={{ background: "var(--c-surface)", border: "1px solid var(--c-surface)", color: "var(--c-text-dim)" }}
        >
          {result.standardDeviation < 8
            ? "Excellent consistency — SD under 8 fps is competition-grade."
            : result.standardDeviation < 15
              ? "Good consistency — SD under 15 fps is solid for hunting and general precision."
              : result.standardDeviation < 25
                ? "Moderate consistency — consider fine-tuning charge weight or seating depth."
                : "High variation — check for component inconsistencies, seating depth, or primer issues."}
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value, unit, warn, good }: {
  label: string;
  value: string;
  unit: string;
  warn?: boolean;
  good?: boolean;
}) {
  const color = warn ? "var(--c-warn)" : good ? "var(--c-success)" : "var(--c-text)";
  return (
    <div
      className="rounded-md px-3 py-2 flex-1 min-w-24"
      style={{ background: "var(--c-panel)", border: "1px solid var(--c-border)" }}
    >
      <div className="text-[9px] uppercase tracking-[1.5px] font-mono mb-0.5" style={{ color: "var(--c-text-dim)" }}>
        {label}
      </div>
      <div className="flex items-baseline gap-0.5">
        <span className="text-lg font-bold" style={{ color }}>{value}</span>
        {unit && <span className="text-[10px] font-mono" style={{ color: "var(--c-text-dim)" }}>{unit}</span>}
      </div>
    </div>
  );
}
