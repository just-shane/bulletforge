import { useState, useEffect } from "react";
import { useBallisticsStore } from "../../store/store.ts";
import type { RifleProfile } from "../../lib/storage.ts";
import {
  saveRifleProfile,
  loadRifleProfiles,
  deleteRifleProfile,
  generateId,
} from "../../lib/storage.ts";
import { CARTRIDGES } from "../../lib/cartridges.ts";
import { bulletsByCaliber } from "../../lib/bullets.ts";

// ---------- Factory presets ----------
interface RiflePreset {
  name: string;
  cartridgeShortName: string;
  bulletName: string;
  bulletManufacturer: string;
  muzzleVelocity: number;
  sightHeight: number;
  zeroRange: number;
  barrelLength: number;
  twistRate: number;
  twistDirection: "right" | "left";
}

const RIFLE_PRESETS: RiflePreset[] = [
  // --- Montana Rifle Co. Model 2022 ---
  {
    name: "MRC Highline — 6.5 CM",
    cartridgeShortName: "6.5 CM",
    bulletName: "140gr ELD-M",
    bulletManufacturer: "Hornady",
    muzzleVelocity: 2710,
    sightHeight: 1.5,
    zeroRange: 100,
    barrelLength: 24,
    twistRate: 8,
    twistDirection: "right",
  },
  {
    name: "MRC Highline — .308 Win",
    cartridgeShortName: ".308 Win",
    bulletName: "168gr MatchKing HPBT",
    bulletManufacturer: "Sierra",
    muzzleVelocity: 2680,
    sightHeight: 1.5,
    zeroRange: 100,
    barrelLength: 24,
    twistRate: 10,
    twistDirection: "right",
  },
  {
    name: "MRC Highline — 6.5 PRC",
    cartridgeShortName: "6.5 PRC",
    bulletName: "143gr ELD-X",
    bulletManufacturer: "Hornady",
    muzzleVelocity: 2960,
    sightHeight: 1.5,
    zeroRange: 100,
    barrelLength: 24,
    twistRate: 8,
    twistDirection: "right",
  },
  {
    name: "MRC Highline — .300 Win Mag",
    cartridgeShortName: ".300 Win Mag",
    bulletName: "165gr AccuBond",
    bulletManufacturer: "Nosler",
    muzzleVelocity: 2960,
    sightHeight: 1.5,
    zeroRange: 100,
    barrelLength: 26,
    twistRate: 10,
    twistDirection: "right",
  },
  {
    name: "MRC Junction — 6.5 CM",
    cartridgeShortName: "6.5 CM",
    bulletName: "140gr ELD-M",
    bulletManufacturer: "Hornady",
    muzzleVelocity: 2710,
    sightHeight: 1.5,
    zeroRange: 100,
    barrelLength: 24,
    twistRate: 8,
    twistDirection: "right",
  },
  {
    name: "MRC Junction — .308 Win",
    cartridgeShortName: ".308 Win",
    bulletName: "168gr MatchKing HPBT",
    bulletManufacturer: "Sierra",
    muzzleVelocity: 2680,
    sightHeight: 1.5,
    zeroRange: 100,
    barrelLength: 24,
    twistRate: 10,
    twistDirection: "right",
  },
  {
    name: "MRC Junction — .300 Win Mag",
    cartridgeShortName: ".300 Win Mag",
    bulletName: "165gr AccuBond",
    bulletManufacturer: "Nosler",
    muzzleVelocity: 2960,
    sightHeight: 1.5,
    zeroRange: 100,
    barrelLength: 26,
    twistRate: 10,
    twistDirection: "right",
  },
  {
    name: "MRC Tsavo — .375 H&H",
    cartridgeShortName: ".375 H&H",
    bulletName: "300gr Partition",
    bulletManufacturer: "Nosler",
    muzzleVelocity: 2500,
    sightHeight: 1.5,
    zeroRange: 100,
    barrelLength: 23,
    twistRate: 12,
    twistDirection: "right",
  },
  // --- Montana Rifle Co. Legacy ---
  {
    name: "MRC Xtreme X3 — 6.5 CM",
    cartridgeShortName: "6.5 CM",
    bulletName: "140gr ELD-M",
    bulletManufacturer: "Hornady",
    muzzleVelocity: 2710,
    sightHeight: 1.5,
    zeroRange: 100,
    barrelLength: 24,
    twistRate: 8,
    twistDirection: "right",
  },
];

export function RifleProfileManager() {
  const [expanded, setExpanded] = useState(false);
  const [profiles, setProfiles] = useState<RifleProfile[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [naming, setNaming] = useState(false);
  const [newName, setNewName] = useState("");

  // Store selectors
  const cartridge = useBallisticsStore((s) => s.cartridge);
  const bullet = useBallisticsStore((s) => s.bullet);
  const muzzleVelocity = useBallisticsStore((s) => s.muzzleVelocity);
  const sightHeight = useBallisticsStore((s) => s.sightHeight);
  const zeroRange = useBallisticsStore((s) => s.zeroRange);
  const barrelLength = useBallisticsStore((s) => s.barrelLength);
  const scope = useBallisticsStore((s) => s.scope);

  const setCartridge = useBallisticsStore((s) => s.setCartridge);
  const setBullet = useBallisticsStore((s) => s.setBullet);
  const setVelocity = useBallisticsStore((s) => s.setVelocity);
  const setSightHeight = useBallisticsStore((s) => s.setSightHeight);
  const setZero = useBallisticsStore((s) => s.setZero);
  const setBarrelLength = useBallisticsStore((s) => s.setBarrelLength);
  const setScope = useBallisticsStore((s) => s.setScope);

  // Load profiles from localStorage on mount
  useEffect(() => {
    setProfiles(loadRifleProfiles());
  }, []);

  function refreshProfiles() {
    const updated = loadRifleProfiles();
    setProfiles(updated);
  }

  function handleSave() {
    if (!naming) {
      setNaming(true);
      setNewName("");
      return;
    }

    const trimmed = newName.trim();
    if (!trimmed) return;

    const now = new Date().toISOString();
    const profile: RifleProfile = {
      id: generateId(),
      name: trimmed,
      cartridgeShortName: cartridge.shortName,
      bulletName: bullet.name,
      bulletManufacturer: bullet.manufacturer,
      muzzleVelocity,
      sightHeight,
      zeroRange,
      barrelLength,
      twistRate: 8,
      twistDirection: "right",
      scope: {
        reticleUnit: scope.reticleUnit,
        clickValue: scope.clickValue,
        focalPlane: scope.focalPlane,
        magnificationMin: scope.magnificationMin,
        magnificationMax: scope.magnificationMax,
        calibratedMag: scope.calibratedMag,
        maxElevationTravel: scope.maxElevationTravel,
        maxWindageTravel: scope.maxWindageTravel,
      },
      notes: "",
      createdAt: now,
      updatedAt: now,
    };

    saveRifleProfile(profile);
    refreshProfiles();
    setSelectedId(profile.id);
    setNaming(false);
    setNewName("");
  }

  function handleDelete() {
    if (!selectedId) return;
    deleteRifleProfile(selectedId);
    setSelectedId("");
    refreshProfiles();
  }

  function handleLoad(id: string) {
    setSelectedId(id);
    if (!id) return;

    const profile = profiles.find((p) => p.id === id);
    if (!profile) return;

    // Find matching cartridge
    const matchedCartridge = CARTRIDGES.find(
      (c) => c.shortName === profile.cartridgeShortName
    );
    if (matchedCartridge) {
      setCartridge(matchedCartridge);

      // Find matching bullet from that caliber
      const bullets = bulletsByCaliber(matchedCartridge.bulletDiameter);
      const matchedBullet = bullets.find(
        (b) =>
          b.name === profile.bulletName &&
          b.manufacturer === profile.bulletManufacturer
      );
      if (matchedBullet) {
        setBullet(matchedBullet);
      }
    }

    setVelocity(profile.muzzleVelocity);
    setSightHeight(profile.sightHeight);
    setZero(profile.zeroRange);
    setBarrelLength(profile.barrelLength);

    if (profile.scope) {
      setScope({
        reticleUnit: profile.scope.reticleUnit,
        clickValue: profile.scope.clickValue,
        focalPlane: profile.scope.focalPlane,
        magnificationMin: profile.scope.magnificationMin,
        magnificationMax: profile.scope.magnificationMax,
        calibratedMag: profile.scope.calibratedMag,
        maxElevationTravel: profile.scope.maxElevationTravel,
        maxWindageTravel: profile.scope.maxWindageTravel,
      });
    }
  }

  function handleLoadPreset(index: number) {
    if (index < 0 || index >= RIFLE_PRESETS.length) return;
    const preset = RIFLE_PRESETS[index];

    const matchedCartridge = CARTRIDGES.find(
      (c) => c.shortName === preset.cartridgeShortName
    );
    if (matchedCartridge) {
      setCartridge(matchedCartridge);
      const bullets = bulletsByCaliber(matchedCartridge.bulletDiameter);
      const matchedBullet = bullets.find(
        (b) =>
          b.name === preset.bulletName &&
          b.manufacturer === preset.bulletManufacturer
      );
      if (matchedBullet) setBullet(matchedBullet);
    }

    setVelocity(preset.muzzleVelocity);
    setSightHeight(preset.sightHeight);
    setZero(preset.zeroRange);
    setBarrelLength(preset.barrelLength);
    setSelectedId("");
  }

  function handleNameKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setNaming(false);
      setNewName("");
    }
  }

  // Find last updated date across all profiles
  const lastUpdated = profiles.length
    ? profiles.reduce((latest, p) =>
        p.updatedAt > latest ? p.updatedAt : latest,
      profiles[0].updatedAt)
    : null;

  const buttonStyle: React.CSSProperties = {
    background: "var(--c-panel)",
    border: "1px solid var(--c-border)",
    color: "var(--c-text-dim)",
    cursor: "pointer",
    fontFamily: "monospace",
    fontSize: "10px",
    textTransform: "uppercase",
    letterSpacing: "1px",
    padding: "3px 8px",
    borderRadius: "3px",
  };

  return (
    <div>
      {/* Header / toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full text-left cursor-pointer"
        style={{ background: "transparent", border: "none", padding: 0 }}
      >
        <span
          className="text-[10px] tracking-[2px] font-mono uppercase"
          style={{ color: "var(--c-accent)" }}
        >
          Rifle Profiles
        </span>
        <span
          className="text-[10px] font-mono"
          style={{ color: "var(--c-text-faint)" }}
        >
          {expanded ? "\u25B4" : "\u25BE"}
        </span>
      </button>

      {/* Summary when collapsed */}
      {!expanded && (
        <div
          className="text-[9px] font-mono mt-1"
          style={{ color: "var(--c-text-muted)" }}
        >
          {profiles.length} profile{profiles.length !== 1 ? "s" : ""} saved
          {lastUpdated && (
            <>
              {" "}&middot;{" "}
              last updated {new Date(lastUpdated).toLocaleDateString()}
            </>
          )}
        </div>
      )}

      {expanded && (
        <div className="mt-2">
          {/* Factory presets */}
          <div className="mb-2">
            <div className="text-[9px] font-mono mb-0.5" style={{ color: "var(--c-text-muted)" }}>
              Factory Preset
            </div>
            <select
              defaultValue={-1}
              onChange={(e) => handleLoadPreset(Number(e.target.value))}
              className="w-full rounded text-[10px] font-mono px-2 py-1 cursor-pointer"
              style={{
                background: "var(--c-surface, var(--c-panel))",
                border: "1px solid var(--c-border)",
                color: "var(--c-text)",
              }}
            >
              <option value={-1}>Select a rifle...</option>
              {RIFLE_PRESETS.map((p, i) => (
                <option key={i} value={i}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* User saved profiles */}
          <div className="mb-2">
            <div className="text-[9px] font-mono mb-0.5" style={{ color: "var(--c-text-muted)" }}>
              Saved Profile
            </div>
            <select
              value={selectedId}
              onChange={(e) => handleLoad(e.target.value)}
              className="w-full rounded text-[10px] font-mono px-2 py-1 cursor-pointer"
              style={{
                background: "var(--c-surface, var(--c-panel))",
                border: "1px solid var(--c-border)",
                color: "var(--c-text)",
              }}
            >
              <option value="">Select a profile...</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.cartridgeShortName})
                </option>
              ))}
            </select>
          </div>

          {/* Inline name input when saving */}
          {naming && (
            <div className="mb-2 flex gap-1">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={handleNameKeyDown}
                placeholder="Profile name..."
                autoFocus
                className="flex-1 rounded text-[10px] font-mono px-2 py-1"
                style={{
                  background: "var(--c-surface, var(--c-panel))",
                  border: "1px solid var(--c-accent)",
                  color: "var(--c-text)",
                  outline: "none",
                }}
              />
              <button
                onClick={() => {
                  setNaming(false);
                  setNewName("");
                }}
                style={{
                  ...buttonStyle,
                  color: "var(--c-text-faint)",
                }}
              >
                Cancel
              </button>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-1.5 mb-2">
            <button onClick={handleSave} style={buttonStyle}>
              {naming ? "Confirm" : "Save Current"}
            </button>
            <button
              onClick={handleDelete}
              style={{
                ...buttonStyle,
                opacity: selectedId ? 1 : 0.4,
                pointerEvents: selectedId ? "auto" : "none",
              }}
            >
              Delete
            </button>
          </div>

          {/* Profile count and last updated */}
          <div
            className="text-[9px] font-mono"
            style={{ color: "var(--c-text-dim)" }}
          >
            {profiles.length} profile{profiles.length !== 1 ? "s" : ""}
            {lastUpdated && (
              <>
                {" "}&middot;{" "}
                updated {new Date(lastUpdated).toLocaleDateString()}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
