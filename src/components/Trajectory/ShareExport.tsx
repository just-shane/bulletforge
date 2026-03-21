import { useState, useCallback } from "react";
import { useBallisticsStore } from "../../store/store.ts";
import { buildShareURL } from "../../lib/share.ts";

export function ShareExport() {
  const [open, setOpen] = useState(false);
  const [shareURL, setShareURL] = useState("");
  const [copied, setCopied] = useState(false);

  const cartridge = useBallisticsStore((s) => s.cartridge);
  const bullet = useBallisticsStore((s) => s.bullet);
  const muzzleVelocity = useBallisticsStore((s) => s.muzzleVelocity);
  const sightHeight = useBallisticsStore((s) => s.sightHeight);
  const zeroRange = useBallisticsStore((s) => s.zeroRange);
  const windSpeed = useBallisticsStore((s) => s.windSpeed);
  const windAngle = useBallisticsStore((s) => s.windAngle);
  const shootingAngle = useBallisticsStore((s) => s.shootingAngle);
  const altitude = useBallisticsStore((s) => s.altitude);
  const temperature = useBallisticsStore((s) => s.temperature);
  const barometricPressure = useBallisticsStore((s) => s.barometricPressure);
  const humidity = useBallisticsStore((s) => s.humidity);

  const handleGenerate = useCallback(() => {
    const base = window.location.origin + window.location.pathname;
    setShareURL(buildShareURL(base, {
      cartridge, bullet, muzzleVelocity, sightHeight, zeroRange,
      windSpeed, windAngle, shootingAngle,
      altitude, temperature, barometricPressure, humidity,
    }));
  }, [cartridge, bullet, muzzleVelocity, sightHeight, zeroRange,
      windSpeed, windAngle, shootingAngle,
      altitude, temperature, barometricPressure, humidity]);

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
