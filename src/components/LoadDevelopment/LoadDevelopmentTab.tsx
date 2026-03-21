import { useState, useMemo } from "react";
import { useBallisticsStore } from "../../store/store.ts";
import { generateLadderTest, generateSeatingDepthTest } from "../../lib/load-development.ts";
import { LadderTestView } from "./LadderTestView.tsx";
import { ESSdCalculator } from "./ESSdCalculator.tsx";
import { SeatingDepthView } from "./SeatingDepthView.tsx";

type LoadDevSubTab = "ladder" | "essd" | "seating";

export function LoadDevelopmentTab() {
  const [subTab, setSubTab] = useState<LoadDevSubTab>("ladder");

  const cartridge = useBallisticsStore((s) => s.cartridge);
  const bullet = useBallisticsStore((s) => s.bullet);
  const powderName = useBallisticsStore((s) => s.powderName);
  const barrelLength = useBallisticsStore((s) => s.barrelLength);

  // Generate ladder test plan
  const ladderPlan = useMemo(() => {
    if (subTab !== "ladder") return null;
    try {
      return generateLadderTest(
        cartridge.shortName,
        powderName,
        bullet.weight,
        bullet.diameter,
        barrelLength,
      );
    } catch {
      return null;
    }
  }, [subTab, cartridge.shortName, powderName, bullet.weight, bullet.diameter, barrelLength]);

  // Generate seating depth plan (using a default OAL based on bullet length + case)
  const seatingPlan = useMemo(() => {
    if (subTab !== "seating") return null;
    // Approximate base OAL: caliber-specific typical lengths
    const typicalOAL: Record<string, number> = {
      ".22 LR": 1.000,
      ".223 Rem": 2.260,
      "6mm ARC": 2.260,
      ".243 Win": 2.710,
      "6.5 CM": 2.800,
      "6.5 PRC": 2.955,
      ".270 Win": 3.340,
      "7mm Rem Mag": 3.290,
      ".308 Win": 2.810,
      ".30-06": 3.340,
      ".300 Win Mag": 3.340,
      ".300 PRC": 3.700,
      ".338 Lapua": 3.681,
      ".375 H&H": 3.600,
      ".50 BMG": 5.450,
    };
    const baseOAL = typicalOAL[cartridge.shortName] ?? 2.800;
    return generateSeatingDepthTest(baseOAL);
  }, [subTab, cartridge.shortName]);

  const subTabs: { id: LoadDevSubTab; label: string }[] = [
    { id: "ladder", label: "Ladder Test" },
    { id: "essd", label: "ES / SD Calc" },
    { id: "seating", label: "Seating Depth" },
  ];

  return (
    <div>
      {/* Sub-tab navigation */}
      <div className="flex gap-1 mb-4">
        {subTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id)}
            className="px-3 py-1.5 rounded-md text-[10px] font-mono cursor-pointer transition-all"
            style={{
              background: subTab === tab.id ? "rgba(239, 68, 68, 0.15)" : "#141414",
              border: `1px solid ${subTab === tab.id ? "#ef4444" : "#2a2a2a"}`,
              color: subTab === tab.id ? "#ef4444" : "#737373",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {subTab === "ladder" && ladderPlan && (
        <LadderTestView
          plan={ladderPlan}
          cartridgeName={cartridge.name}
          powderName={powderName}
          bulletDescription={`${bullet.manufacturer} ${bullet.name}`}
        />
      )}

      {subTab === "ladder" && !ladderPlan && (
        <div className="text-neutral-600 font-mono text-sm py-8 text-center">
          Select a cartridge and powder to generate a ladder test plan
        </div>
      )}

      {subTab === "essd" && <ESSdCalculator />}

      {subTab === "seating" && seatingPlan && (
        <SeatingDepthView plan={seatingPlan} />
      )}
    </div>
  );
}
