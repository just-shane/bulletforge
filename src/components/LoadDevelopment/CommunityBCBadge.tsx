import { useState, useEffect } from "react";
import { fetchCommunityBC } from "../../lib/community.ts";
import type { CommunityBCAggregate } from "../../lib/community.ts";

interface Props {
  bulletName: string;
  bulletManufacturer: string;
  manufacturerBC: number;
  dragModel: "G1" | "G7";
}

export function CommunityBCBadge({ bulletName, bulletManufacturer, manufacturerBC, dragModel }: Props) {
  const [data, setData] = useState<CommunityBCAggregate | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchCommunityBC(bulletName, bulletManufacturer).then((result) => {
      if (!cancelled) setData(result);
    });
    return () => { cancelled = true; };
  }, [bulletName, bulletManufacturer]);

  if (!data) return null;

  const isInconsistent = data.bcStddev != null && data.weightedAvgBc > 0
    && (data.bcStddev / data.weightedAvgBc) > 0.15;

  const diff = data.weightedAvgBc - manufacturerBC;
  const diffPercent = manufacturerBC > 0 ? (diff / manufacturerBC) * 100 : 0;
  const diffColor = Math.abs(diffPercent) < 3
    ? "var(--c-success)"
    : Math.abs(diffPercent) < 8
      ? "var(--c-warn)"
      : "var(--c-error, #e55)";

  return (
    <div
      className="rounded-md px-2 py-1.5 mt-1"
      style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)" }}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[8px] font-mono uppercase tracking-[1px]" style={{ color: "var(--c-text-faint)" }}>
          Community BC
        </span>
        <span className="text-[10px] font-mono font-bold" style={{ color: "var(--c-accent)" }}>
          {data.weightedAvgBc.toFixed(4)} {dragModel}
        </span>
      </div>
      <div className="flex items-baseline justify-between gap-2 mt-0.5">
        <span className="text-[8px] font-mono" style={{ color: "var(--c-text-faint)" }}>
          {data.contributorCount} contributor{data.contributorCount !== 1 ? "s" : ""} &middot; {data.totalCommunityRounds} rounds
        </span>
        <span className="text-[8px] font-mono" style={{ color: diffColor }}>
          {diff >= 0 ? "+" : ""}{diffPercent.toFixed(1)}% vs mfr
        </span>
      </div>
      {isInconsistent && (
        <div className="text-[7px] font-mono mt-0.5" style={{ color: "var(--c-warn)" }}>
          High variance in community data
        </div>
      )}
    </div>
  );
}
