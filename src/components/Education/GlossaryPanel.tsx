import { useState } from "react";
import { useBallisticsStore } from "../../store/store.ts";

// ---------- Glossary data ----------

interface GlossaryEntry {
  term: string;
  abbr?: string;
  definition: string;
  category: GlossaryCategory;
}

type GlossaryCategory =
  | "External Ballistics"
  | "Internal Ballistics"
  | "Cartridge & Bullet"
  | "Optics & Sighting"
  | "Reloading"
  | "Measurement & Units"
  | "Safety";

const GLOSSARY: GlossaryEntry[] = [
  // --- External Ballistics ---
  { term: "Ballistic Coefficient", abbr: "BC", definition: "A measure of a bullet's ability to overcome air resistance in flight. Higher BC = less drag = better long-range performance. G1 uses a flat-base reference; G7 uses a boat-tail reference and is preferred for modern match bullets.", category: "External Ballistics" },
  { term: "G1 Drag Model", definition: "The standard drag model based on a flat-base bullet shape. Still used by many manufacturers for BC specifications. Better suited for flat-base hunting bullets.", category: "External Ballistics" },
  { term: "G7 Drag Model", definition: "A drag model based on a long, boat-tail, secant-ogive shape. More accurate for modern VLD and match bullets. Preferred for long-range ballistic calculations.", category: "External Ballistics" },
  { term: "Muzzle Velocity", abbr: "MV", definition: "The speed of the bullet as it exits the muzzle, measured in feet per second (fps). The single most important input for trajectory prediction.", category: "External Ballistics" },
  { term: "Trajectory", definition: "The curved path a bullet follows under the influence of gravity and aerodynamic drag. A bullet begins dropping the instant it leaves the barrel.", category: "External Ballistics" },
  { term: "Drop", definition: "The vertical distance the bullet falls below the line of bore at a given range. Always negative (bullets always fall). Not the same as holdover.", category: "External Ballistics" },
  { term: "Wind Drift", definition: "The lateral deflection of a bullet caused by crosswind. Full-value wind is at 90° to the line of fire. Measured in inches or MIL/MOA.", category: "External Ballistics" },
  { term: "Time of Flight", abbr: "TOF", definition: "The time in seconds for a bullet to travel from the muzzle to a given range. Longer TOF means more drop, more wind drift, and more Coriolis effect.", category: "External Ballistics" },
  { term: "Transonic Range", definition: "The distance at which a bullet decelerates through the transonic zone (roughly Mach 1.2 to Mach 0.8). Bullet stability often degrades here, causing unpredictable flight.", category: "External Ballistics" },
  { term: "Maximum Ordinate", definition: "The highest point of the bullet's trajectory above the line of sight. Occurs roughly halfway between the muzzle and the zero range.", category: "External Ballistics" },
  { term: "Density Altitude", definition: "A corrected altitude that accounts for temperature and pressure deviations from standard atmosphere. Higher density altitude = thinner air = less drag = bullet shoots flatter.", category: "External Ballistics" },
  { term: "Coriolis Effect", definition: "The apparent deflection of a bullet's path caused by the Earth's rotation. Right deflection in the Northern Hemisphere for a westward shot. Negligible under 800 yards.", category: "External Ballistics" },
  { term: "Spin Drift", definition: "The gradual lateral deflection of a spin-stabilized bullet in the direction of its rifling twist. Right-twist barrels produce right spin drift. Grows with distance.", category: "External Ballistics" },
  { term: "Aerodynamic Jump", definition: "An initial angular deflection caused by crosswind acting on a spinning bullet at the muzzle. Causes a vertical shift (up or down) depending on wind direction.", category: "External Ballistics" },
  { term: "Cosine Correction", definition: "When shooting at an angle (uphill or downhill), the effective range for drop purposes is the horizontal distance, not the line-of-sight distance. Multiply slant range by the cosine of the angle.", category: "External Ballistics" },
  { term: "Zero Range", definition: "The distance at which the bullet's trajectory crosses the line of sight on its downward path. The point where holdover/holdunder is zero.", category: "External Ballistics" },

  // --- Internal Ballistics ---
  { term: "Chamber Pressure", definition: "The peak gas pressure inside the cartridge case and chamber when a round is fired. Measured in PSI (SAAMI) or CUP. Exceeding maximum pressure is extremely dangerous.", category: "Internal Ballistics" },
  { term: "SAAMI", definition: "Sporting Arms and Ammunition Manufacturers' Institute. Sets industry standards for chamber dimensions, maximum average pressure (MAP), and overall cartridge specifications.", category: "Internal Ballistics" },
  { term: "Burn Rate", definition: "How quickly a powder converts from solid to gas. Faster powders (e.g., Titegroup) are for small cases/pistols. Slower powders (e.g., H1000) are for large magnum cases.", category: "Internal Ballistics" },
  { term: "Pressure Curve", definition: "A graph of chamber pressure vs. bullet travel distance. A well-designed load builds pressure smoothly, peaks early, and sustains acceleration through the barrel.", category: "Internal Ballistics" },
  { term: "Nobel-Abel Equation", definition: "The equation of state for propellant gas used in internal ballistics modeling. Relates pressure, volume, temperature, and gas mass to predict chamber conditions.", category: "Internal Ballistics" },

  // --- Cartridge & Bullet ---
  { term: "Cartridge", definition: "The complete assembly of case, primer, powder, and bullet. A \"round\" of ammunition. Often incorrectly called a \"bullet.\"", category: "Cartridge & Bullet" },
  { term: "Caliber", definition: "The internal bore diameter of a barrel, or the diameter of a bullet. Expressed in inches (.308) or millimeters (7.62mm). The terms are not always interchangeable.", category: "Cartridge & Bullet" },
  { term: "Sectional Density", abbr: "SD", definition: "Bullet weight divided by the square of its diameter. Higher SD = better penetration. Important for hunting — an SD above 0.250 is considered adequate for most big game.", category: "Cartridge & Bullet" },
  { term: "Ogive", definition: "The curved forward section of a bullet from the bearing surface to the tip. Secant ogives are more aerodynamic; tangent ogives are more forgiving of seating depth.", category: "Cartridge & Bullet" },
  { term: "Boat Tail", definition: "A tapered bullet base that reduces base drag. Improves BC and long-range performance vs. flat-base bullets. Nearly all match bullets are boat-tail.", category: "Cartridge & Bullet" },
  { term: "Bearing Surface", definition: "The cylindrical portion of the bullet that contacts the rifling. Longer bearing surface = more consistent engagement but higher friction and pressure.", category: "Cartridge & Bullet" },
  { term: "Headspace", definition: "The distance from the bolt face to the datum point in the chamber that stops the cartridge's forward movement. Incorrect headspace is a serious safety concern.", category: "Cartridge & Bullet" },

  // --- Optics & Sighting ---
  { term: "Minute of Angle", abbr: "MOA", definition: "An angular measurement equal to 1/60th of a degree. At 100 yards, 1 MOA is approximately 1.047 inches. Used for scope adjustments and measuring group size.", category: "Optics & Sighting" },
  { term: "Milliradian", abbr: "MIL", definition: "An angular measurement equal to 1/1000th of a radian. At 100 yards, 1 MIL is approximately 3.6 inches. Preferred by military and competitive shooters for its math simplicity.", category: "Optics & Sighting" },
  { term: "First Focal Plane", abbr: "FFP", definition: "Reticle is placed in front of the magnification lens. Subtension values (holdovers) are accurate at ALL magnification settings. Preferred for precision shooting.", category: "Optics & Sighting" },
  { term: "Second Focal Plane", abbr: "SFP", definition: "Reticle is behind the magnification lens. Subtension values are only accurate at one specific magnification (usually maximum). Reticle appears the same size at all magnifications.", category: "Optics & Sighting" },
  { term: "Click Value", definition: "The angular change per turret click. Common values: 0.1 MIL per click, or 0.25 MOA per click. Finer clicks allow more precise adjustments.", category: "Optics & Sighting" },
  { term: "DOPE", definition: "Data On Previous Engagement. A record of the elevation and windage corrections needed to hit at various ranges. The core of any precision shooter's range card.", category: "Optics & Sighting" },
  { term: "Sight Height", definition: "The vertical distance from the center of the bore to the center of the scope. Typically 1.5\" to 2.0\". Affects close-range holdover and zero mechanics.", category: "Optics & Sighting" },
  { term: "BDC Reticle", definition: "Bullet Drop Compensator reticle. Has holdover marks calibrated for specific cartridge/velocity combinations. Convenient but only accurate for the load it was designed for.", category: "Optics & Sighting" },

  // --- Reloading ---
  { term: "Charge Weight", definition: "The mass of propellant powder in a cartridge, measured in grains. Must be within published minimum and maximum values for a given cartridge/bullet/powder combination.", category: "Reloading" },
  { term: "Overall Length", abbr: "OAL", definition: "The total length of a loaded cartridge from base to bullet tip. Must not exceed the maximum OAL specified by SAAMI or the firearm's magazine.", category: "Reloading" },
  { term: "Ladder Test", definition: "A load development method where charge weight is increased in small increments (0.2-0.3gr) and shot at long range. Groups of impacts at similar elevation indicate a velocity node.", category: "Reloading" },
  { term: "OCW Method", definition: "Optimal Charge Weight. A load development technique by Dan Newberry where charges are shot in 3-round groups. The charge where groups cluster despite weight changes is the optimal charge.", category: "Reloading" },
  { term: "Extreme Spread", abbr: "ES", definition: "The difference between the fastest and slowest shot in a string. Lower ES = more consistent velocity = tighter groups at distance. Target: under 15 fps.", category: "Reloading" },
  { term: "Standard Deviation", abbr: "SD", definition: "A statistical measure of velocity consistency. Lower SD = more uniform powder burn = better long-range accuracy. Target: single digits.", category: "Reloading" },
  { term: "Seating Depth", definition: "How far the bullet is pushed into the case neck. Measured as distance from the ogive to the rifling lands. Affects accuracy, pressure, and magazine fit.", category: "Reloading" },

  // --- Measurement & Units ---
  { term: "Grain", abbr: "gr", definition: "A unit of mass equal to 1/7000th of a pound. Used for bullet weight and powder charge weight. 1 grain = 64.8 milligrams.", category: "Measurement & Units" },
  { term: "Feet Per Second", abbr: "fps", definition: "The standard unit for muzzle velocity and bullet speed in the US. 1 fps = 0.3048 m/s.", category: "Measurement & Units" },
  { term: "Inches of Mercury", abbr: "inHg", definition: "A unit of barometric pressure. Standard sea-level pressure is 29.92 inHg (1013.25 hPa). Lower pressure = thinner air = less drag.", category: "Measurement & Units" },
  { term: "Foot-Pounds", abbr: "ft-lbs", definition: "A unit of kinetic energy. Calculated from bullet weight and velocity. Used to determine terminal effectiveness at various ranges.", category: "Measurement & Units" },
  { term: "Twist Rate", definition: "The distance in inches for the rifling to complete one full revolution (e.g., 1:8\" means one turn per 8 inches). Faster twist stabilizes longer/heavier bullets.", category: "Measurement & Units" },

  // --- Safety ---
  { term: "Pressure Signs", definition: "Physical evidence of excessive chamber pressure on fired cases: flattened primers, cratered primers, case head expansion, ejector marks, sticky bolt lift. Any one sign demands STOP.", category: "Safety" },
  { term: "Work Up", definition: "The practice of starting at minimum published charge weight and incrementally increasing while watching for pressure signs. Never start at maximum charge. Never exceed published maximums.", category: "Safety" },
  { term: "Proof Load", definition: "A deliberately over-pressure cartridge used to test the structural integrity of a firearm. Produces approximately 30% higher pressure than standard ammunition.", category: "Safety" },
  { term: "Squib Load", definition: "A round with insufficient pressure to push the bullet out of the barrel, leaving it lodged. Firing a subsequent round into a lodged bullet can destroy the firearm and injure the shooter.", category: "Safety" },
  { term: "Overpressure", definition: "Any condition where chamber pressure exceeds SAAMI maximum average pressure. Can cause case failure, bolt failure, or catastrophic firearm failure. The primary risk in handloading.", category: "Safety" },
];

const CATEGORIES: GlossaryCategory[] = [
  "External Ballistics",
  "Internal Ballistics",
  "Cartridge & Bullet",
  "Optics & Sighting",
  "Reloading",
  "Measurement & Units",
  "Safety",
];

// ---------- Component ----------

export function GlossaryPanel() {
  const glossaryOpen = useBallisticsStore((s) => s.glossaryOpen);
  const setGlossaryOpen = useBallisticsStore((s) => s.setGlossaryOpen);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<GlossaryCategory | "All">("All");

  if (!glossaryOpen) return null;

  const filtered = GLOSSARY.filter((entry) => {
    const matchesCategory = activeCategory === "All" || entry.category === activeCategory;
    const matchesSearch =
      !search ||
      entry.term.toLowerCase().includes(search.toLowerCase()) ||
      entry.definition.toLowerCase().includes(search.toLowerCase()) ||
      (entry.abbr && entry.abbr.toLowerCase().includes(search.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Group by category for display
  const grouped = new Map<string, GlossaryEntry[]>();
  for (const entry of filtered) {
    const cat = entry.category;
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(entry);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-12 pb-12"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={(e) => { if (e.target === e.currentTarget) setGlossaryOpen(false); }}
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
              Glossary
            </h2>
            <div className="text-[10px] font-mono" style={{ color: "var(--c-text-dim)" }}>
              {filtered.length} of {GLOSSARY.length} terms
            </div>
          </div>
          <button
            onClick={() => setGlossaryOpen(false)}
            className="text-[18px] font-mono cursor-pointer w-8 h-8 flex items-center justify-center rounded"
            style={{ color: "var(--c-text-dim)", background: "transparent", border: "none" }}
          >
            &times;
          </button>
        </div>

        {/* Search + Category filter */}
        <div className="px-6 py-3" style={{ borderBottom: "1px solid var(--c-border)" }}>
          <input
            type="text"
            placeholder="Search terms..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded px-3 py-2 text-[11px] font-mono mb-3"
            style={{
              background: "var(--c-surface, var(--c-panel))",
              border: "1px solid var(--c-border)",
              color: "var(--c-text)",
              outline: "none",
            }}
          />
          <div className="flex gap-1 flex-wrap">
            <button
              onClick={() => setActiveCategory("All")}
              className="px-2 py-1 rounded text-[9px] font-mono cursor-pointer transition-all"
              style={{
                background: activeCategory === "All" ? "var(--c-accent-dim)" : "var(--c-panel)",
                border: `1px solid ${activeCategory === "All" ? "var(--c-accent)" : "var(--c-border)"}`,
                color: activeCategory === "All" ? "var(--c-accent)" : "var(--c-text-dim)",
              }}
            >
              All
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="px-2 py-1 rounded text-[9px] font-mono cursor-pointer transition-all"
                style={{
                  background: activeCategory === cat ? "var(--c-accent-dim)" : "var(--c-panel)",
                  border: `1px solid ${activeCategory === cat ? "var(--c-accent)" : "var(--c-border)"}`,
                  color: activeCategory === cat ? "var(--c-accent)" : "var(--c-text-dim)",
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Entries */}
        <div className="px-6 py-4">
          {[...grouped.entries()].map(([category, entries]) => (
            <div key={category} className="mb-6">
              <h3
                className="text-[10px] font-mono uppercase tracking-[2px] mb-3 pb-1"
                style={{ color: "var(--c-accent)", borderBottom: "1px solid var(--c-border)" }}
              >
                {category}
              </h3>
              <div className="flex flex-col gap-3">
                {entries.map((entry) => (
                  <div key={entry.term}>
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <span className="text-[11px] font-mono font-bold" style={{ color: "var(--c-text)" }}>
                        {entry.term}
                      </span>
                      {entry.abbr && (
                        <span
                          className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                          style={{
                            background: "var(--c-accent-dim)",
                            color: "var(--c-accent)",
                            border: "1px solid var(--c-accent)",
                          }}
                        >
                          {entry.abbr}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] font-mono leading-relaxed" style={{ color: "var(--c-text-dim)" }}>
                      {entry.definition}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-8 text-[11px] font-mono" style={{ color: "var(--c-text-faint)" }}>
              No terms match your search.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


export default GlossaryPanel;
