import { useState, useRef, useEffect } from "react";

const SPONSORS = [
  {
    name: "GitHub Sponsors",
    url: "https://github.com/sponsors/just-shane",
    primary: true,
    enabled: true,
  },
  {
    name: "Ko-fi",
    url: "#",
    primary: false,
    enabled: false,
  },
  {
    name: "Buy Me a Coffee",
    url: "#",
    primary: false,
    enabled: false,
  },
];

export function TipButton() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Click-outside to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Escape to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  return (
    <div ref={ref} className="tip-button-no-print fixed bottom-4 right-4 z-40">
      {/* Popover */}
      {open && (
        <div
          className="absolute bottom-full right-0 mb-2 w-56 rounded-lg shadow-2xl overflow-hidden"
          style={{ background: "var(--c-panel)", border: "1px solid var(--c-border-light)" }}
        >
          <div
            className="px-3 pt-3 pb-1.5 text-[9px] font-mono tracking-[2px] uppercase"
            style={{ color: "var(--c-accent)" }}
          >
            Support BulletForge
          </div>

          <div className="px-3 pb-3 flex flex-col gap-2">
            {SPONSORS.map((s) =>
              s.enabled ? (
                <a
                  key={s.name}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-md px-3 py-2 text-[10px] font-mono tracking-wide no-underline transition-colors"
                  style={{
                    background: s.primary ? "var(--c-accent-dim)" : "var(--c-surface)",
                    border: `1px solid ${s.primary ? "var(--c-accent)" : "var(--c-border)"}`,
                    color: s.primary ? "var(--c-accent)" : "var(--c-text)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span style={{ fontWeight: s.primary ? 700 : 400 }}>{s.name}</span>
                    {s.primary && (
                      <span
                        className="text-[8px] px-1.5 py-0.5 rounded-full"
                        style={{ background: "var(--c-accent)", color: "var(--c-panel)" }}
                      >
                        Preferred
                      </span>
                    )}
                  </div>
                </a>
              ) : (
                <div
                  key={s.name}
                  className="rounded-md px-3 py-2 text-[10px] font-mono tracking-wide"
                  style={{
                    background: "var(--c-surface)",
                    border: "1px solid var(--c-border)",
                    color: "var(--c-text-faint)",
                    opacity: 0.5,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span>{s.name}</span>
                    <span className="text-[8px]">Coming Soon</span>
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="rounded-full px-3 py-2 text-[10px] font-mono tracking-wide cursor-pointer transition-colors shadow-lg flex items-center gap-1.5"
        style={{
          background: open ? "var(--c-accent-dim)" : "var(--c-panel)",
          border: `1px solid ${open ? "var(--c-accent)" : "var(--c-border)"}`,
          color: open ? "var(--c-accent)" : "var(--c-text-dim)",
        }}
      >
        <span style={{ color: "var(--c-accent)", fontSize: 12 }}>&hearts;</span>
        <span>Support</span>
      </button>
    </div>
  );
}

export default TipButton;
