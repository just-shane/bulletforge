import { useEffect, useRef } from "react";
import { useBallisticsStore } from "../../store/store";
import { THEMES } from "../../lib/themes";
import { APP_VERSION, APP_NAME } from "../../lib/version";

export function HamburgerMenu() {
  const menuOpen = useBallisticsStore((s) => s.menuOpen);
  const setMenuOpen = useBallisticsStore((s) => s.setMenuOpen);
  const theme = useBallisticsStore((s) => s.theme);
  const setTheme = useBallisticsStore((s) => s.setTheme);
  const setDocsOpen = useBallisticsStore((s) => s.setDocsOpen);
  const setEducationOpen = useBallisticsStore((s) => s.setEducationOpen);
  const setGlossaryOpen = useBallisticsStore((s) => s.setGlossaryOpen);
  const panelRef = useRef<HTMLDivElement>(null);

  /* close on click-outside */
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen, setMenuOpen]);

  /* close on Escape */
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [menuOpen, setMenuOpen]);

  const darkThemes = THEMES.filter((t) => t.mode === "dark");
  const lightThemes = THEMES.filter((t) => t.mode === "light");

  return (
    <div ref={panelRef} className="relative">
      {/* Hamburger button */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="w-8 h-8 flex flex-col items-center justify-center gap-[5px] rounded-md cursor-pointer transition-colors"
        style={{
          background: menuOpen ? "var(--c-accent-dim)" : "transparent",
          border: `1px solid ${menuOpen ? "var(--c-accent)" : "var(--c-border)"}`,
        }}
        aria-label="Settings menu"
        aria-expanded={menuOpen}
      >
        <span
          className="block w-3.5 h-[1.5px] transition-all duration-200"
          style={{
            background: menuOpen ? "var(--c-accent)" : "var(--c-text-dim)",
            transform: menuOpen
              ? "rotate(45deg) translate(2px, 2px)"
              : "none",
          }}
        />
        <span
          className="block w-3.5 h-[1.5px] transition-all duration-200"
          style={{
            background: menuOpen ? "var(--c-accent)" : "var(--c-text-dim)",
            opacity: menuOpen ? 0 : 1,
          }}
        />
        <span
          className="block w-3.5 h-[1.5px] transition-all duration-200"
          style={{
            background: menuOpen ? "var(--c-accent)" : "var(--c-text-dim)",
            transform: menuOpen
              ? "rotate(-45deg) translate(2px, -2px)"
              : "none",
          }}
        />
      </button>

      {/* Dropdown panel */}
      {menuOpen && (
        <div
          className="absolute right-0 top-10 w-72 rounded-lg shadow-2xl z-50"
          style={{
            background: "var(--c-panel)",
            border: `1px solid var(--c-border-light)`,
          }}
        >
          {/* Header */}
          <div
            className="px-4 py-3 text-[10px] font-mono uppercase tracking-[2px]"
            style={{
              color: "var(--c-accent)",
              borderBottom: `1px solid var(--c-border)`,
            }}
          >
            Settings
          </div>

          {/* Dark themes */}
          <div className="p-3 pb-1">
            <div
              className="text-[10px] font-mono uppercase tracking-wider mb-2"
              style={{ color: "var(--c-text-dim)" }}
            >
              Dark Themes
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {darkThemes.map((t) => {
                const active = theme.id === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-md text-left cursor-pointer transition-all"
                    style={{
                      background: active
                        ? "var(--c-accent-dim)"
                        : "var(--c-surface)",
                      border: `1px solid ${active ? "var(--c-accent)" : "var(--c-border)"}`,
                    }}
                  >
                    <div className="flex gap-0.5 shrink-0">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ background: t.colors.accent }}
                      />
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{
                          background: t.colors.bg,
                          border: `1px solid ${t.colors.border}`,
                        }}
                      />
                    </div>
                    <div className="min-w-0">
                      <div
                        className="text-[11px] font-medium truncate"
                        style={{
                          color: active
                            ? "var(--c-accent)"
                            : "var(--c-text)",
                        }}
                      >
                        {t.name}
                      </div>
                      <div
                        className="text-[9px] truncate"
                        style={{ color: "var(--c-text-dim)" }}
                      >
                        {t.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Light themes */}
          <div className="p-3 pt-2">
            <div
              className="text-[10px] font-mono uppercase tracking-wider mb-2"
              style={{ color: "var(--c-text-dim)" }}
            >
              Light Themes
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {lightThemes.map((t) => {
                const active = theme.id === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-md text-left cursor-pointer transition-all"
                    style={{
                      background: active
                        ? "var(--c-accent-dim)"
                        : "var(--c-surface)",
                      border: `1px solid ${active ? "var(--c-accent)" : "var(--c-border)"}`,
                    }}
                  >
                    <div className="flex gap-0.5 shrink-0">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ background: t.colors.accent }}
                      />
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{
                          background: t.colors.bg,
                          border: `1px solid ${t.colors.border}`,
                        }}
                      />
                    </div>
                    <div className="min-w-0">
                      <div
                        className="text-[11px] font-medium truncate"
                        style={{
                          color: active
                            ? "var(--c-accent)"
                            : "var(--c-text)",
                        }}
                      >
                        {t.name}
                      </div>
                      <div
                        className="text-[9px] truncate"
                        style={{ color: "var(--c-text-dim)" }}
                      >
                        {t.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Links */}
          <div
            className="p-3 pt-2 flex flex-col gap-1"
            style={{ borderTop: `1px solid var(--c-border)` }}
          >
            <button
              onClick={() => { setDocsOpen(true); setMenuOpen(false); }}
              className="flex items-center gap-2 px-2.5 py-2 rounded-md text-left cursor-pointer transition-all w-full"
              style={{
                background: "var(--c-surface)",
                border: "1px solid var(--c-border)",
              }}
            >
              <span className="text-[11px]" style={{ color: "var(--c-text)" }}>
                Docs
              </span>
            </button>
            <button
              onClick={() => { setEducationOpen(true); setMenuOpen(false); }}
              className="flex items-center gap-2 px-2.5 py-2 rounded-md text-left cursor-pointer transition-all w-full"
              style={{
                background: "var(--c-surface)",
                border: "1px solid var(--c-border)",
              }}
            >
              <span className="text-[11px]" style={{ color: "var(--c-text)" }}>
                Education
              </span>
            </button>
            <button
              onClick={() => { setGlossaryOpen(true); setMenuOpen(false); }}
              className="flex items-center gap-2 px-2.5 py-2 rounded-md text-left cursor-pointer transition-all w-full"
              style={{
                background: "var(--c-surface)",
                border: "1px solid var(--c-border)",
              }}
            >
              <span className="text-[11px]" style={{ color: "var(--c-text)" }}>
                Glossary
              </span>
              <span className="text-[9px] ml-auto" style={{ color: "var(--c-text-faint)" }}>
                50+ terms
              </span>
            </button>

            <a
              href="https://github.com/just-shane/bulletforge"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 px-2.5 py-2 rounded-md text-left cursor-pointer transition-all w-full no-underline"
              style={{
                background: "var(--c-surface)",
                border: "1px solid var(--c-border)",
              }}
            >
              <span className="text-[11px]" style={{ color: "var(--c-text)" }}>
                Developer Docs
              </span>
              <span className="text-[9px] ml-auto" style={{ color: "var(--c-text-faint)" }}>
                GitHub
              </span>
            </a>
          </div>

          {/* Footer */}
          <div
            className="px-4 py-2 text-[9px] font-mono"
            style={{
              color: "var(--c-text-faint)",
              borderTop: `1px solid var(--c-border)`,
            }}
          >
            v{APP_VERSION} — {APP_NAME}
          </div>
        </div>
      )}
    </div>
  );
}
