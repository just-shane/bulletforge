import { useState, useCallback } from "react";
import { useBallisticsStore } from "../../store/store.ts";

// ---------- Compact key mapping ----------
const KEY_MAP = {
  c: "cartridgeShortName",
  b: "bulletName",
  bm: "bulletManufacturer",
  mv: "muzzleVelocity",
  sh: "sightHeight",
  zr: "zeroRange",
  ws: "windSpeed",
  wa: "windAngle",
  sa: "shootingAngle",
  alt: "altitude",
  temp: "temperature",
  bp: "barometricPressure",
  hum: "humidity",
} as const;

type CompactKey = keyof typeof KEY_MAP;

const NUMERIC_FIELDS = new Set([
  "muzzleVelocity",
  "sightHeight",
  "zeroRange",
  "windSpeed",
  "windAngle",
  "shootingAngle",
  "altitude",
  "temperature",
  "barometricPressure",
  "humidity",
]);

// ---------- Public utilities ----------

export interface ShareConfig {
  cartridgeShortName?: string;
  bulletName?: string;
  bulletManufacturer?: string;
  muzzleVelocity?: number;
  sightHeight?: number;
  zeroRange?: number;
  windSpeed?: number;
  windAngle?: number;
  shootingAngle?: number;
  altitude?: number;
  temperature?: number;
  barometricPressure?: number;
  humidity?: number;
}

/** Build a full shareable URL from the current store state. */
export function buildShareURL(base: string, state: {
  cartridge: { shortName: string };
  bullet: { name: string; manufacturer: string };
  muzzleVelocity: number;
  sightHeight: number;
  zeroRange: number;
  windSpeed: number;
  windAngle: number;
  shootingAngle: number;
  altitude: number;
  temperature: number;
  barometricPressure: number;
  humidity: number;
}): string {
  const params = new URLSearchParams();
  params.set("c", state.cartridge.shortName);
  params.set("b", state.bullet.name);
  params.set("bm", state.bullet.manufacturer);
  params.set("mv", String(state.muzzleVelocity));
  params.set("sh", String(state.sightHeight));
  params.set("zr", String(state.zeroRange));
  params.set("ws", String(state.windSpeed));
  params.set("wa", String(state.windAngle));
  params.set("sa", String(state.shootingAngle));
  params.set("alt", String(state.altitude));
  params.set("temp", String(state.temperature));
  params.set("bp", String(state.barometricPressure));
  params.set("hum", String(state.humidity));
  return `${base}?${params.toString()}`;
}

/** Parse a URL query string and return a partial ShareConfig, or null if no share params found. */
export function parseShareURL(search: string): ShareConfig | null {
  const params = new URLSearchParams(search);
  const config: Record<string, string | number> = {};
  let found = false;

  for (const [compact, full] of Object.entries(KEY_MAP) as [CompactKey, string][]) {
    const val = params.get(compact);
    if (val == null) continue;
    found = true;
    config[full] = NUMERIC_FIELDS.has(full) ? Number(val) : val;
  }

  return found ? (config as ShareConfig) : null;
}

// ---------- Component ----------

export function ShareExport() {
  const [open, setOpen] = useState(false);
  const [shareURL, setShareURL] = useState("");
  const [copied, setCopied] = useState(false);

  const state = useBallisticsStore((s) => ({
    cartridge: s.cartridge,
    bullet: s.bullet,
    muzzleVelocity: s.muzzleVelocity,
    sightHeight: s.sightHeight,
    zeroRange: s.zeroRange,
    windSpeed: s.windSpeed,
    windAngle: s.windAngle,
    shootingAngle: s.shootingAngle,
    altitude: s.altitude,
    temperature: s.temperature,
    barometricPressure: s.barometricPressure,
    humidity: s.humidity,
  }));

  const handleGenerate = useCallback(() => {
    const base = window.location.origin + window.location.pathname;
    setShareURL(buildShareURL(base, state));
  }, [state]);

  const handleCopy = useCallback(() => {
    if (!shareURL) return;
    navigator.clipboard.writeText(shareURL).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [shareURL]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const panelStyle: React.CSSProperties = {
    background: "var(--c-panel)",
    border: "1px solid var(--c-border)",
    fontFamily: "monospace",
    fontSize: 10,
    marginTop: 6,
  };

  const headerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "4px 8px",
    cursor: "pointer",
    userSelect: "none",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "var(--c-accent)",
    fontWeight: 700,
  };

  const btnStyle: React.CSSProperties = {
    fontFamily: "monospace",
    fontSize: 10,
    textTransform: "uppercase",
    padding: "3px 8px",
    cursor: "pointer",
    background: "var(--c-panel)",
    color: "var(--c-accent)",
    border: "1px solid var(--c-border)",
    letterSpacing: "0.04em",
  };

  const btnAccentStyle: React.CSSProperties = {
    ...btnStyle,
    background: "var(--c-accent)",
    color: "var(--c-panel)",
    fontWeight: 700,
  };

  return (
    <div style={panelStyle}>
      <div style={headerStyle} onClick={() => setOpen(!open)}>
        <span>SHARE &amp; EXPORT</span>
        <span>{open ? "\u25B2" : "\u25BC"}</span>
      </div>

      {open && (
        <div style={{ padding: "6px 8px", display: "flex", flexDirection: "column", gap: 6 }}>
          {/* Share Link */}
          <div style={{ display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap" }}>
            <button style={btnAccentStyle} onClick={handleGenerate}>
              Generate Share Link
            </button>
            <button style={btnStyle} onClick={handlePrint}>
              Print Load Card
            </button>
          </div>

          {shareURL && (
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <input
                readOnly
                value={shareURL}
                style={{
                  flex: 1,
                  fontFamily: "monospace",
                  fontSize: 10,
                  padding: "3px 6px",
                  background: "var(--c-panel)",
                  color: "var(--c-text, #ccc)",
                  border: "1px solid var(--c-border)",
                  minWidth: 0,
                }}
              />
              <button style={btnStyle} onClick={handleCopy}>
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
