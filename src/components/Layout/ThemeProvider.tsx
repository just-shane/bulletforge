import { useEffect } from "react";
import { useBallisticsStore } from "../../store/store";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useBallisticsStore((s) => s.theme);

  useEffect(() => {
    const root = document.documentElement;
    const c = theme.colors;
    const sl = theme.slider;

    // Backgrounds
    root.style.setProperty("--c-bg", c.bg);
    root.style.setProperty("--c-panel", c.panel);
    root.style.setProperty("--c-surface", c.surface);

    // Borders
    root.style.setProperty("--c-border", c.border);
    root.style.setProperty("--c-border-light", c.borderLight);

    // Text
    root.style.setProperty("--c-text", c.text);
    root.style.setProperty("--c-text-muted", c.textMuted);
    root.style.setProperty("--c-text-dim", c.textDim);
    root.style.setProperty("--c-text-faint", c.textFaint);

    // Accent
    root.style.setProperty("--c-accent", c.accent);
    root.style.setProperty("--c-accent-dim", c.accentDim);
    root.style.setProperty("--c-accent-glow", c.accentGlow);

    // Semantic
    root.style.setProperty("--c-warn", c.warn);
    root.style.setProperty("--c-danger", c.danger);
    root.style.setProperty("--c-success", c.success);

    // Logo
    root.style.setProperty("--c-logo-from", c.logoFrom);
    root.style.setProperty("--c-logo-to", c.logoTo);

    // Chart
    root.style.setProperty("--c-chart-line", c.chartLine);
    root.style.setProperty("--c-chart-grid", c.chartGrid);
    root.style.setProperty("--c-chart-text", c.chartText);

    // Slider
    root.style.setProperty("--slider-track-height", `${sl.trackHeight}px`);
    root.style.setProperty("--slider-thumb-size", `${sl.thumbSize}px`);
    root.style.setProperty("--slider-thumb-radius", sl.thumbRadius);
    root.style.setProperty("--slider-track-radius", sl.trackRadius);

    // Root element
    root.style.backgroundColor = c.bg;
    root.style.color = c.text;
  }, [theme]);

  return <>{children}</>;
}
