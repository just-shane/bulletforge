import { useMemo } from "react";
import { POWDERS } from "../../lib/powders.ts";
import {
  CARTRIDGE_INTERNAL_DATA,
  POWDER_INTERNAL_DATA,
} from "../../lib/internal-ballistics.ts";
import { Slider } from "../ControlPanel/Slider.tsx";

interface InternalBallisticsPanelProps {
  cartridgeShortName: string;
  powderName: string;
  chargeWeight: number;
  barrelLength: number;
  onPowderChange: (name: string) => void;
  onChargeWeightChange: (weight: number) => void;
  onBarrelLengthChange: (length: number) => void;
}

export function InternalBallisticsPanel({
  cartridgeShortName,
  powderName,
  chargeWeight,
  barrelLength,
  onPowderChange,
  onChargeWeightChange,
  onBarrelLengthChange,
}: InternalBallisticsPanelProps) {
  const cartridgeData = CARTRIDGE_INTERNAL_DATA[cartridgeShortName];

  // Filter to powders that have internal ballistics data
  const availablePowders = useMemo(
    () => POWDERS.filter((p) => p.name in POWDER_INTERNAL_DATA && p.type === "rifle"),
    [],
  );

  // Group powders by manufacturer
  const groupedPowders = useMemo(() => {
    const groups: Record<string, typeof availablePowders> = {};
    for (const p of availablePowders) {
      if (!groups[p.manufacturer]) groups[p.manufacturer] = [];
      groups[p.manufacturer].push(p);
    }
    return groups;
  }, [availablePowders]);

  const chargeRange = cartridgeData?.typicalChargeRange ?? { min: 20, max: 60 };
  const fillWarning = chargeWeight > chargeRange.max * 1.05;

  return (
    <>
      {/* Section header */}
      <div
        className="text-[10px] tracking-[2px] font-mono uppercase mb-3 mt-4 pt-4"
        style={{ color: "#ef4444", borderTop: "1px solid #2a2a2a" }}
      >
        Internal Ballistics
      </div>

      {/* Powder Selection */}
      <div className="mb-4">
        <div className="text-[11px] mb-1 text-neutral-400">Powder</div>
        <select
          value={powderName}
          onChange={(e) => onPowderChange(e.target.value)}
          className="w-full rounded-md px-2 py-1.5 text-[11px] font-mono cursor-pointer"
          style={{
            background: "#141414",
            border: "1px solid #2a2a2a",
            color: "#e5e5e5",
          }}
        >
          {Object.entries(groupedPowders).map(([manufacturer, powders]) => (
            <optgroup key={manufacturer} label={manufacturer}>
              {powders.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        {POWDERS.find((p) => p.name === powderName) && (
          <div className="text-[9px] font-mono mt-1 px-1 text-neutral-500">
            {POWDERS.find((p) => p.name === powderName)?.description}
          </div>
        )}
      </div>

      {/* Charge Weight */}
      <Slider
        label="Charge Weight"
        value={chargeWeight}
        min={Math.max(chargeRange.min * 0.8, 1)}
        max={chargeRange.max * 1.15}
        step={0.1}
        unit=" gr"
        onChange={onChargeWeightChange}
      />
      {fillWarning && (
        <div
          className="text-[9px] font-mono px-1 -mt-1 mb-2"
          style={{ color: "#f59e0b" }}
        >
          ⚠ Charge exceeds typical max for this cartridge
        </div>
      )}
      {cartridgeData && (
        <div className="text-[9px] font-mono px-1 -mt-1 mb-3 text-neutral-600">
          Typical: {chargeRange.min}–{chargeRange.max} gr
        </div>
      )}

      {/* Barrel Length */}
      <Slider
        label="Barrel Length"
        value={barrelLength}
        min={10}
        max={30}
        step={0.5}
        unit={'"'}
        onChange={onBarrelLengthChange}
      />

      {/* Case capacity info */}
      {cartridgeData && (
        <div
          className="rounded-md p-2 mt-2 text-[9px] font-mono text-neutral-500"
          style={{ background: "#0f0f0f", border: "1px solid #1a1a1a" }}
        >
          Case: {cartridgeData.caseCapacity} gr H₂O &middot;
          Bore: {cartridgeData.boreDiameter}" &middot;
          Freebore: {cartridgeData.freebore}"
        </div>
      )}
    </>
  );
}
