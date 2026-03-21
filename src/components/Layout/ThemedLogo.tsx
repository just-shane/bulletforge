import { useEffect, useState } from "react";

/**
 * Loads /logo.svg once, swaps hardcoded fills with CSS custom properties,
 * and renders it inline so it recolors with the active theme.
 *
 * SVG color mapping:
 *   #e8872a (orange accent) → var(--c-accent)
 *   #a6a6a6 (gray body)     → var(--c-text-dim)
 */
export function ThemedLogo({ size = 40 }: { size?: number }) {
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/logo.svg")
      .then((r) => r.text())
      .then((raw) => {
        if (cancelled) return;
        // Strip the embedded c2pa metadata (huge, not needed for display)
        let cleaned = raw.replace(/<metadata>[\s\S]*?<\/metadata>/, "");
        // Replace hardcoded fills with CSS custom properties
        cleaned = cleaned.replace(/fill="#e8872a"/gi, 'fill="var(--c-accent)"');
        cleaned = cleaned.replace(/fill="#a6a6a6"/gi, 'fill="var(--c-text-dim)"');
        // Remove fixed width/height so we can control via CSS
        cleaned = cleaned.replace(/width="2000"/, "");
        cleaned = cleaned.replace(/height="2000"/, "");
        setSvg(cleaned);
      });
    return () => { cancelled = true; };
  }, []);

  if (!svg) {
    // Fallback placeholder while loading
    return (
      <div
        className="rounded-md flex items-center justify-center font-bold text-sm shrink-0"
        style={{
          width: size,
          height: size,
          background: "linear-gradient(135deg, var(--c-logo-from), var(--c-logo-to))",
          color: "#fff",
        }}
      >
        BF
      </div>
    );
  }

  return (
    <div
      className="shrink-0"
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
