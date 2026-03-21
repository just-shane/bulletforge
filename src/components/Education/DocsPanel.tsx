import { useState } from "react";
import { useBallisticsStore } from "../../store/store.ts";
import { APP_VERSION } from "../../lib/version.ts";

// ---------- Docs sections ----------

type DocsSection =
  | "getting-started"
  | "engine"
  | "data-sources"
  | "keyboard-shortcuts";

const SECTIONS: { id: DocsSection; title: string }[] = [
  { id: "getting-started", title: "Getting Started" },
  { id: "engine", title: "Engine Details" },
  { id: "data-sources", title: "Data Sources" },
  { id: "keyboard-shortcuts", title: "Keyboard & Tips" },
];

// ---------- Component ----------

export function DocsPanel() {
  const docsOpen = useBallisticsStore((s) => s.docsOpen);
  const setDocsOpen = useBallisticsStore((s) => s.setDocsOpen);
  const [activeSection, setActiveSection] = useState<DocsSection>("getting-started");

  if (!docsOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-12 pb-12"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={(e) => { if (e.target === e.currentTarget) setDocsOpen(false); }}
    >
      <div
        className="w-full max-w-3xl max-h-full overflow-y-auto rounded-lg shadow-2xl"
        style={{ background: "var(--c-bg)", border: "1px solid var(--c-border)" }}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 px-6 py-4 flex items-center justify-between"
          style={{ background: "var(--c-bg)", borderBottom: "1px solid var(--c-border)" }}
        >
          <div>
            <h2
              className="text-[12px] font-mono uppercase tracking-[3px] mb-1"
              style={{ color: "var(--c-accent)" }}
            >
              Documentation
            </h2>
            <div className="text-[9px] font-mono" style={{ color: "var(--c-text-faint)" }}>
              BulletForge v{APP_VERSION}
            </div>
          </div>
          <button
            onClick={() => setDocsOpen(false)}
            className="text-[18px] font-mono cursor-pointer w-8 h-8 flex items-center justify-center rounded"
            style={{ color: "var(--c-text-dim)", background: "transparent", border: "none" }}
          >
            &times;
          </button>
        </div>

        {/* Section tabs */}
        <div className="px-6 py-3 flex gap-2 flex-wrap" style={{ borderBottom: "1px solid var(--c-border)" }}>
          {SECTIONS.map((sec) => (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              className="px-3 py-1.5 rounded text-[10px] font-mono cursor-pointer transition-all"
              style={{
                background: activeSection === sec.id ? "var(--c-accent-dim)" : "var(--c-panel)",
                border: `1px solid ${activeSection === sec.id ? "var(--c-accent)" : "var(--c-border)"}`,
                color: activeSection === sec.id ? "var(--c-accent)" : "var(--c-text-dim)",
              }}
            >
              {sec.title}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          {/* ---- Getting Started ---- */}
          {activeSection === "getting-started" && (
            <div className="flex flex-col gap-5">
              <DocSection title="Overview">
                BulletForge is a free, browser-based ballistics and reloading simulator. No downloads, no subscriptions, no $150 desktop app. It runs entirely in your browser — your data never leaves your device.
              </DocSection>

              <DocSection title="The Three Tabs">
                <div className="flex flex-col gap-2 mt-2">
                  <TabDoc
                    name="External Ballistics"
                    desc="Trajectory prediction. Select your rifle, cartridge, and bullet. Adjust environmental conditions. See the full trajectory chart, ballistic table, DOPE cards, wind drift, and turret corrections. This is where most users spend their time."
                  />
                  <TabDoc
                    name="Internal Ballistics"
                    desc="Pressure and velocity modeling inside the barrel. Select a powder and charge weight to see the predicted pressure curve, muzzle velocity, and safe load indicators. Essential for handloaders developing new loads."
                  />
                  <TabDoc
                    name="Load Development"
                    desc="Tools for the reloading bench. Ladder test planner, ES/SD calculator, seating depth optimizer, OCW analysis, and performance tracking. Import chronograph data from LabRadar or MagnetoSpeed CSV files."
                  />
                </div>
              </DocSection>

              <DocSection title="Rifle Profiles">
                Use Factory Presets to instantly load a complete rifle configuration (Montana Rifle Co. Model 2022 lineup included). Save your own configurations as Saved Profiles — they persist in your browser's localStorage and will be there next time you visit.
              </DocSection>

              <DocSection title="Sharing">
                Open the Share &amp; Export panel on the External Ballistics tab to generate a shareable URL. The URL encodes your complete ballistic setup — anyone who opens it will see your exact configuration.
              </DocSection>
            </div>
          )}

          {/* ---- Engine Details ---- */}
          {activeSection === "engine" && (
            <div className="flex flex-col gap-5">
              <DocSection title="External Ballistics Engine">
                BulletForge uses a 4th-order Runge-Kutta (RK4) numerical integrator to solve the 3D point-mass equations of motion. The solver steps at 0.5-yard increments, computing drag, gravity, wind, Coriolis, and spin drift at each step. This is the same fundamental approach used by military-grade ballistic computers.
              </DocSection>

              <DocSection title="Drag Models">
                Two standard drag models are supported: G1 (flat-base reference projectile) and G7 (boat-tail, secant-ogive reference). The solver interpolates drag coefficients from the standard ICAO tables and scales by the bullet's ballistic coefficient. G7 is preferred for modern match bullets; G1 is better for flat-base hunting bullets.
              </DocSection>

              <DocSection title="Atmospheric Modeling">
                Air density is computed from altitude, temperature, barometric pressure, and humidity using the ICAO standard atmosphere model. Density altitude is derived from station pressure and virtual temperature. All atmospheric corrections follow the Army Research Lab methodology.
              </DocSection>

              <DocSection title="Internal Ballistics Engine">
                The internal ballistics simulator uses the Nobel-Abel equation of state combined with Vieille's burn rate law (geometric burn model). It solves the coupled ODE system of gas generation, pressure rise, and bullet acceleration using RK4 integration with sub-millimeter step sizes. Powder data is parameterized by vivacity, progressivity, and heat of explosion.
              </DocSection>

              <DocSection title="Advanced Corrections">
                <div className="flex flex-col gap-1 mt-1">
                  <CorrectionDoc name="Coriolis / Eotvos" desc="Earth rotation deflection. Uses latitude and fire azimuth. Significant beyond 800 yards." />
                  <CorrectionDoc name="Spin Drift" desc="Litz approximation from gyroscopic stability factor. Grows with time of flight squared." />
                  <CorrectionDoc name="Aerodynamic Jump" desc="Cross-wind induced vertical deflection. Proportional to spin rate and wind speed." />
                  <CorrectionDoc name="Cosine Correction" desc="Shooting angle adjustment. Uses the Improved Rifleman's Rule for steep angles." />
                  <CorrectionDoc name="Miller Stability" desc="Gyroscopic stability factor from twist rate, bullet dimensions, and atmospheric conditions." />
                </div>
              </DocSection>
            </div>
          )}

          {/* ---- Data Sources ---- */}
          {activeSection === "data-sources" && (
            <div className="flex flex-col gap-5">
              <DocSection title="Cartridge Data">
                SAAMI specifications for chamber dimensions, maximum average pressure, and typical factory load performance. 15 cartridges covering rimfire, pistol, intermediate rifle, standard rifle, magnum, and extreme long-range categories.
              </DocSection>

              <DocSection title="Bullet Data">
                Manufacturer-published ballistic coefficients (G1 and G7), weights, dimensions, and sectional densities. 60+ bullets from Sierra, Hornady, Berger, Nosler, and Lapua. BC values are taken from manufacturer specifications — actual performance may vary.
              </DocSection>

              <DocSection title="Powder Data">
                25 powder profiles with vivacity coefficients, burn rate characteristics, and temperature sensitivity data. Sources include published QuickLOAD data, GRT community contributions, and manufacturer specifications.
              </DocSection>

              <DocSection title="ML Training Corpus">
                A 115-record normalized dataset parsed from Gordon's Reloading Tool (GRT) community-contributed XML files. Includes 48 projectile profiles, 12 powder characterizations, 48 caliber specifications, and 7 complete load recipes. CC0 licensed. Used for future predictive features — not displayed directly in the UI.
              </DocSection>

              <DocSection title="Chrono Reference Data">
                30 reference records (353 total shots) sourced from Ammolytics open-data experiments including chronograph comparisons, bullet sorting, brass sorting, and recoil vs. muzzle velocity studies. Used for validating predicted vs. measured velocity in the Chrono Import panel.
              </DocSection>

              <DocSection title="Accuracy Disclaimer">
                All ballistic calculations are approximations. Real-world performance depends on barrel condition, ammunition lot variation, environmental conditions, and dozens of other variables. BulletForge is for educational and comparative purposes. Never use simulation data as the sole basis for safety-critical decisions. Always verify against published load data and real-world chronograph measurements.
              </DocSection>
            </div>
          )}

          {/* ---- Keyboard & Tips ---- */}
          {activeSection === "keyboard-shortcuts" && (
            <div className="flex flex-col gap-5">
              <DocSection title="Print">
                Click "Print Load Card" in the Share &amp; Export panel to open your browser's print dialog. The page is styled for clean printing — trajectory chart, ballistic table, and DOPE card will print on standard letter paper.
              </DocSection>

              <DocSection title="URL Sharing">
                Generated share URLs encode all ballistic parameters as compact query parameters. They work on any device — no account required. Bookmark a URL to save a specific configuration.
              </DocSection>

              <DocSection title="Comparison Mode">
                Click "Snapshot for Comparison" on the External Ballistics tab to capture your current trajectory. Then change any parameter — cartridge, bullet, velocity, environment — and see both trajectories overlaid on the chart with a delta table showing the differences at each range.
              </DocSection>

              <DocSection title="Chrono Import">
                Supports LabRadar (.csv, semicolon-delimited) and MagnetoSpeed (LOG.CSV, comma-delimited) formats. Drag and drop or paste CSV content. Multi-series files are supported with clickable tabs. Imported data can be saved to your performance log for tracking ES/SD trends over time.
              </DocSection>

              <DocSection title="Theme Selection">
                Open the hamburger menu (top right) to choose from 6 themes — 4 dark and 2 light. Your selection is saved in localStorage and persists across sessions.
              </DocSection>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper components
function DocSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-md p-4"
      style={{ background: "var(--c-panel)", border: "1px solid var(--c-border)" }}
    >
      <h3 className="text-[11px] font-mono font-bold mb-2" style={{ color: "var(--c-accent)" }}>
        {title}
      </h3>
      <div className="text-[10px] font-mono leading-relaxed" style={{ color: "var(--c-text-dim)" }}>
        {children}
      </div>
    </div>
  );
}

function TabDoc({ name, desc }: { name: string; desc: string }) {
  return (
    <div className="flex gap-2">
      <span
        className="text-[9px] font-mono px-2 py-0.5 rounded shrink-0 self-start mt-0.5"
        style={{ background: "var(--c-accent-dim)", color: "var(--c-accent)", border: "1px solid var(--c-accent)" }}
      >
        {name}
      </span>
      <span className="text-[10px] font-mono" style={{ color: "var(--c-text-dim)" }}>{desc}</span>
    </div>
  );
}

function CorrectionDoc({ name, desc }: { name: string; desc: string }) {
  return (
    <div className="flex gap-2 text-[10px] font-mono">
      <span className="font-bold shrink-0" style={{ color: "var(--c-text)" }}>{name}:</span>
      <span style={{ color: "var(--c-text-dim)" }}>{desc}</span>
    </div>
  );
}


export default DocsPanel;
