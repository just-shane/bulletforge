/* ─── BulletForge Theme Definitions ─────────────────────────────── */

export interface Theme {
  id: string;
  name: string;
  description: string;
  mode: "dark" | "light";
  colors: {
    // Backgrounds (3 levels)
    bg: string;
    panel: string;
    surface: string;

    // Borders (2 levels)
    border: string;
    borderLight: string;

    // Text (4 levels)
    text: string;
    textMuted: string;
    textDim: string;
    textFaint: string;

    // Accent (primary interactive color)
    accent: string;
    accentDim: string;
    accentGlow: string;

    // Semantic
    warn: string;
    danger: string;
    success: string;

    // Logo gradient
    logoFrom: string;
    logoTo: string;

    // Chart-specific
    chartLine: string;
    chartGrid: string;
    chartText: string;
  };
  slider: {
    trackHeight: number;
    thumbSize: number;
    thumbRadius: string;
    trackRadius: string;
  };
}

/* ─── Dark Themes ───────────────────────────────────────────────── */

const gunmetal: Theme = {
  id: "gunmetal",
  name: "Gunmetal",
  description: "Dark steel, red accents",
  mode: "dark",
  colors: {
    bg: "#0c0c0c",
    panel: "#141414",
    surface: "#1a1a1a",
    border: "#2a2a2a",
    borderLight: "#333333",
    text: "#e5e5e5",
    textMuted: "#a3a3a3",
    textDim: "#737373",
    textFaint: "#525252",
    accent: "#ef4444",
    accentDim: "rgba(239, 68, 68, 0.12)",
    accentGlow: "rgba(239, 68, 68, 0.06)",
    warn: "#f59e0b",
    danger: "#ef4444",
    success: "#22c55e",
    logoFrom: "#ef4444",
    logoTo: "#b91c1c",
    chartLine: "#ef4444",
    chartGrid: "#2a2a2a",
    chartText: "#737373",
  },
  slider: {
    trackHeight: 4,
    thumbSize: 14,
    thumbRadius: "50%",
    trackRadius: "2px",
  },
};

const precisionOptic: Theme = {
  id: "precision-optic",
  name: "Precision Optic",
  description: "Slate & amber, premium feel",
  mode: "dark",
  colors: {
    bg: "#0f1218",
    panel: "#161b24",
    surface: "#1e2530",
    border: "#2a3140",
    borderLight: "#354055",
    text: "#e2e8f0",
    textMuted: "#94a3b8",
    textDim: "#64748b",
    textFaint: "#475569",
    accent: "#f59e0b",
    accentDim: "rgba(245, 158, 11, 0.12)",
    accentGlow: "rgba(245, 158, 11, 0.06)",
    warn: "#f59e0b",
    danger: "#ef4444",
    success: "#22c55e",
    logoFrom: "#f59e0b",
    logoTo: "#d97706",
    chartLine: "#f59e0b",
    chartGrid: "#2a3140",
    chartText: "#64748b",
  },
  slider: {
    trackHeight: 3,
    thumbSize: 12,
    thumbRadius: "50%",
    trackRadius: "1.5px",
  },
};

const rangeDay: Theme = {
  id: "range-day",
  name: "Range Day",
  description: "Deep navy, teal accents",
  mode: "dark",
  colors: {
    bg: "#0a1019",
    panel: "#0f172a",
    surface: "#162035",
    border: "#1e3048",
    borderLight: "#264060",
    text: "#e2e8f0",
    textMuted: "#94a3b8",
    textDim: "#64748b",
    textFaint: "#475569",
    accent: "#14b8a6",
    accentDim: "rgba(20, 184, 166, 0.12)",
    accentGlow: "rgba(20, 184, 166, 0.06)",
    warn: "#f59e0b",
    danger: "#ef4444",
    success: "#22c55e",
    logoFrom: "#14b8a6",
    logoTo: "#0d9488",
    chartLine: "#14b8a6",
    chartGrid: "#1e3048",
    chartText: "#64748b",
  },
  slider: {
    trackHeight: 5,
    thumbSize: 16,
    thumbRadius: "3px",
    trackRadius: "3px",
  },
};

const milSpec: Theme = {
  id: "mil-spec",
  name: "Mil-Spec",
  description: "OD green & tan, field-grade",
  mode: "dark",
  colors: {
    bg: "#101208",
    panel: "#181c10",
    surface: "#1f2418",
    border: "#2e3424",
    borderLight: "#3d4632",
    text: "#d4d4c8",
    textMuted: "#a3a38e",
    textDim: "#737360",
    textFaint: "#525240",
    accent: "#65a30d",
    accentDim: "rgba(101, 163, 13, 0.12)",
    accentGlow: "rgba(101, 163, 13, 0.06)",
    warn: "#d4a54a",
    danger: "#dc5050",
    success: "#65a30d",
    logoFrom: "#65a30d",
    logoTo: "#4d7c0f",
    chartLine: "#65a30d",
    chartGrid: "#2e3424",
    chartText: "#737360",
  },
  slider: {
    trackHeight: 6,
    thumbSize: 14,
    thumbRadius: "2px",
    trackRadius: "1px",
  },
};

/* ─── Light Themes ──────────────────────────────────────────────── */

const benchrest: Theme = {
  id: "benchrest",
  name: "Benchrest",
  description: "Clean white, steel blue",
  mode: "light",
  colors: {
    bg: "#f8fafc",
    panel: "#ffffff",
    surface: "#f1f5f9",
    border: "#e2e8f0",
    borderLight: "#cbd5e1",
    text: "#1e293b",
    textMuted: "#475569",
    textDim: "#64748b",
    textFaint: "#94a3b8",
    accent: "#2563eb",
    accentDim: "rgba(37, 99, 235, 0.08)",
    accentGlow: "rgba(37, 99, 235, 0.04)",
    warn: "#d97706",
    danger: "#dc2626",
    success: "#16a34a",
    logoFrom: "#2563eb",
    logoTo: "#1d4ed8",
    chartLine: "#2563eb",
    chartGrid: "#e2e8f0",
    chartText: "#64748b",
  },
  slider: {
    trackHeight: 4,
    thumbSize: 16,
    thumbRadius: "50%",
    trackRadius: "9999px",
  },
};

const parchment: Theme = {
  id: "parchment",
  name: "Parchment",
  description: "Warm cream, copper tones",
  mode: "light",
  colors: {
    bg: "#faf6f1",
    panel: "#ffffff",
    surface: "#f5efe8",
    border: "#e5ddd3",
    borderLight: "#d4c9bb",
    text: "#2c2418",
    textMuted: "#5c4f3e",
    textDim: "#7d7060",
    textFaint: "#a09484",
    accent: "#b45309",
    accentDim: "rgba(180, 83, 9, 0.08)",
    accentGlow: "rgba(180, 83, 9, 0.04)",
    warn: "#d97706",
    danger: "#dc2626",
    success: "#15803d",
    logoFrom: "#b45309",
    logoTo: "#92400e",
    chartLine: "#b45309",
    chartGrid: "#e5ddd3",
    chartText: "#7d7060",
  },
  slider: {
    trackHeight: 4,
    thumbSize: 14,
    thumbRadius: "50%",
    trackRadius: "9999px",
  },
};

/* ─── Exports ───────────────────────────────────────────────────── */

export const THEMES: Theme[] = [
  gunmetal,
  precisionOptic,
  rangeDay,
  milSpec,
  benchrest,
  parchment,
];

export function getThemeById(id: string): Theme {
  return THEMES.find((t) => t.id === id) ?? gunmetal;
}

export function loadThemeId(): string {
  try {
    return localStorage.getItem("bulletforge-theme") ?? "gunmetal";
  } catch {
    return "gunmetal";
  }
}

export function saveThemeId(id: string): void {
  try {
    localStorage.setItem("bulletforge-theme", id);
  } catch {
    // localStorage unavailable
  }
}
