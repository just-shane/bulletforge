import { useState } from "react";
import { useBallisticsStore } from "../../store/store.ts";
import { CARTRIDGES } from "../../lib/cartridges.ts";

// ---------- Cartridge guide data ----------

interface CartridgeGuide {
  shortName: string;
  purpose: string;
  bestFor: string[];
  history: string;
  safariBrief?: string;
}

const CARTRIDGE_GUIDES: CartridgeGuide[] = [
  {
    shortName: ".22 LR",
    purpose: "Training, small game, plinking",
    bestFor: ["Squirrel / rabbit", "New shooter training", "Suppressed shooting", "Affordable practice"],
    history: "Introduced in 1887 by J. Stevens Arms. The world's most popular and widely produced cartridge. Low recoil and cost make it the universal starting point for new shooters.",
  },
  {
    shortName: ".223 Rem",
    purpose: "Varmint hunting, target shooting, home defense",
    bestFor: ["Prairie dogs / coyotes", "AR-15 platform", "Service rifle competition", "Youth deer (check regulations)"],
    history: "Developed by Remington in 1964 as the commercial version of the 5.56x45mm NATO. The most popular centerfire rifle cartridge in the US. Versatile with bullet weights from 40gr to 77gr.",
  },
  {
    shortName: "6mm ARC",
    purpose: "Long-range precision in the AR-15 platform",
    bestFor: ["PRS / NRL competition (gas gun)", "Medium game to 400 yds", "Military designated marksman role", "AR-15 bolt-face compatible"],
    history: "Designed by Hornady in 2020 for the US DOD. Fits in an AR-15 magazine but delivers 6.5 Creedmoor-class ballistics. Rapidly adopted by the precision rifle gas gun community.",
  },
  {
    shortName: ".243 Win",
    purpose: "Deer hunting, varmint hunting, youth rifle",
    bestFor: ["Whitetail deer", "Pronghorn antelope", "Low-recoil hunting", "Dual-purpose (varmint + deer)"],
    history: "Introduced in 1955 by Winchester. A necked-down .308 Winchester. Loved for its mild recoil and flat trajectory. The classic \"first centerfire\" for young hunters.",
  },
  {
    shortName: "6.5 CM",
    purpose: "Long-range precision, hunting, competition",
    bestFor: ["PRS / NRL competition", "Elk to 500 yds", "Long-range target shooting", "All-around do-everything rifle"],
    history: "Designed by Hornady in 2007. Offers an exceptional BC-to-recoil ratio. Dominates precision rifle competition. Has largely replaced .308 Win for long-range work. The modern standard.",
  },
  {
    shortName: "6.5 PRC",
    purpose: "Extended-range hunting, magnum-class precision",
    bestFor: ["Elk / mule deer at extended range", "Mountain hunting (flat trajectory)", "Long-range steel", "When 6.5 CM isn't enough velocity"],
    history: "Designed by Hornady in 2018 as a short-action magnum companion to the 6.5 Creedmoor. Pushes the same high-BC bullets 200+ fps faster. Growing rapidly in hunting markets.",
  },
  {
    shortName: ".270 Win",
    purpose: "Big game hunting, all-around sporting rifle",
    bestFor: ["Mule deer / elk", "Open-country hunting", "Pronghorn at range", "The classic American hunting cartridge"],
    history: "Introduced by Winchester in 1925. Championed by outdoor writer Jack O'Connor for decades. A flat-shooting, hard-hitting round that has taken every species of North American game.",
  },
  {
    shortName: "7mm Rem Mag",
    purpose: "Long-range big game, versatile magnum",
    bestFor: ["Elk at extended range", "Moose / caribou", "African plains game", "Long-range hunting in open country"],
    history: "Introduced by Remington in 1962. One of the most popular magnum cartridges ever made. Excellent long-range trajectory with manageable recoil. A true do-anything magnum.",
  },
  {
    shortName: ".308 Win",
    purpose: "Military, law enforcement, hunting, competition",
    bestFor: ["Tactical / sniper platforms", "Whitetail to elk", "Palma / F-class competition", "The workhorse that does everything"],
    history: "Introduced in 1952, adopted by NATO as 7.62x51mm. The most versatile .30 caliber cartridge. Thousands of factory loads, dozens of platforms. If you can only own one centerfire rifle, this is it.",
  },
  {
    shortName: ".30-06",
    purpose: "All-around big game, military heritage",
    bestFor: ["Every North American big game species", "Brown bear / moose", "Versatile bullet weight range (110-220gr)", "The cartridge your grandfather trusted"],
    history: "Adopted by the US military in 1906. Served through both World Wars. Can drive bullets from 110gr to 220gr, covering everything from varmints to grizzly bears. America's cartridge.",
  },
  {
    shortName: ".300 Win Mag",
    purpose: "Extended-range big game, long-range target",
    bestFor: ["Elk / moose at 500+ yds", "African plains game", "Long-range precision (military)", "When .308 needs more reach"],
    history: "Introduced by Winchester in 1963. The most popular .30 caliber magnum worldwide. Military snipers, African hunters, and elk guides all agree on the .300 Win Mag.",
    safariBrief: "A favorite for African plains game — kudu, eland, wildebeest, and zebra. Adequate for non-dangerous game at any reasonable distance. Many PHs consider it the minimum for large plains game.",
  },
  {
    shortName: ".300 PRC",
    purpose: "Extreme long-range precision, heavy bullets",
    bestFor: ["ELR competition (1500+ yds)", "Military long-range precision", "Heavy 220-230gr match bullets", "When .300 Win Mag runs out of case capacity"],
    history: "Designed by Hornady in 2018 specifically for 225gr+ heavy match bullets. The .300 PRC was built from scratch with optimal chamber geometry for long, high-BC projectiles.",
  },
  {
    shortName: ".338 Lapua",
    purpose: "Extreme long-range, anti-materiel, military",
    bestFor: ["Shots beyond 1500 yards", "Military sniper platforms", "World-record distance shooting", "Hard-target interdiction"],
    history: "Developed in the 1980s for military long-range sniping. Holds multiple confirmed kill records beyond 2,000 meters. The benchmark for extreme long-range cartridge performance.",
    safariBrief: "Overkill for plains game but used by some for dangerous game in a pinch. Not a traditional safari cartridge but absolutely effective on anything that walks.",
  },
  {
    shortName: ".375 H&H",
    purpose: "Dangerous game, African safari, big bears",
    bestFor: ["Cape buffalo", "Elephant (solids)", "Hippo, lion, leopard", "Alaskan brown bear / coastal grizzly"],
    history: "Introduced by Holland & Holland in 1912. The minimum legal caliber for dangerous game in most African countries. Over a century of proven performance on the world's most dangerous animals.",
    safariBrief: "THE safari cartridge. Required as minimum for dangerous game in Zimbabwe, Tanzania, Botswana, and most of Africa. With 300gr solids it will stop a charging Cape buffalo. With 270gr soft points it is a superb plains game round. Every professional hunter in Africa trusts the .375 H&H. Montana Rifle Co. builds the Tsavo specifically for this cartridge.",
  },
  {
    shortName: ".50 BMG",
    purpose: "Anti-materiel, extreme long range, recreational",
    bestFor: ["ELR shooting (2000+ yds)", "Anti-materiel applications", "The ultimate long-range experience", "Because you can"],
    history: "Designed by John Browning in 1921 for the M2 machine gun. Adopted for long-range sniping in the 1980s. Effective against light vehicles, structures, and at extreme distances.",
  },
];

// ---------- Education sections ----------

type EducationSection =
  | "cartridge-guide"
  | "ballistics-101"
  | "safari-guide"
  | "reloading-safety";

const SECTIONS: { id: EducationSection; title: string; icon: string }[] = [
  { id: "cartridge-guide", title: "Cartridge Guide", icon: ">" },
  { id: "safari-guide", title: "Safari & Dangerous Game", icon: ">" },
  { id: "ballistics-101", title: "Ballistics 101", icon: ">" },
  { id: "reloading-safety", title: "Reloading Safety", icon: ">" },
];

// ---------- Component ----------

export function EducationPanel() {
  const educationOpen = useBallisticsStore((s) => s.educationOpen);
  const setEducationOpen = useBallisticsStore((s) => s.setEducationOpen);
  const [activeSection, setActiveSection] = useState<EducationSection>("cartridge-guide");

  if (!educationOpen) return null;

  const safariCartridges = CARTRIDGE_GUIDES.filter((g) => g.safariBrief);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-12 pb-12"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={(e) => { if (e.target === e.currentTarget) setEducationOpen(false); }}
    >
      <div
        className="w-full max-w-4xl max-h-full overflow-y-auto rounded-lg shadow-2xl"
        style={{ background: "var(--c-bg)", border: "1px solid var(--c-border)" }}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 px-6 py-4 flex items-center justify-between"
          style={{ background: "var(--c-bg)", borderBottom: "1px solid var(--c-border)" }}
        >
          <h2
            className="text-[12px] font-mono uppercase tracking-[3px]"
            style={{ color: "var(--c-accent)" }}
          >
            Education
          </h2>
          <button
            onClick={() => setEducationOpen(false)}
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
          {/* ---- Cartridge Guide ---- */}
          {activeSection === "cartridge-guide" && (
            <div>
              <p className="text-[11px] font-mono leading-relaxed mb-5" style={{ color: "var(--c-text-dim)" }}>
                Every cartridge has a job. Choosing the right one depends on your quarry, your range, and your recoil tolerance. Below is every cartridge in BulletForge with its intended purpose, best applications, and a brief history.
              </p>

              <div className="flex flex-col gap-4">
                {CARTRIDGE_GUIDES.map((guide) => {
                  const cartridge = CARTRIDGES.find((c) => c.shortName === guide.shortName);
                  return (
                    <div
                      key={guide.shortName}
                      className="rounded-md p-4"
                      style={{ background: "var(--c-panel)", border: "1px solid var(--c-border)" }}
                    >
                      <div className="flex items-baseline gap-3 mb-2">
                        <span className="text-[13px] font-mono font-bold" style={{ color: "var(--c-accent)" }}>
                          {cartridge?.name || guide.shortName}
                        </span>
                        <span className="text-[9px] font-mono uppercase tracking-wider" style={{ color: "var(--c-text-faint)" }}>
                          {guide.purpose}
                        </span>
                      </div>

                      {/* Specs bar */}
                      {cartridge && (
                        <div
                          className="flex gap-4 mb-3 text-[9px] font-mono py-1.5 px-2 rounded"
                          style={{ background: "var(--c-surface, var(--c-bg))", color: "var(--c-text-muted)" }}
                        >
                          <span>Typical MV: {cartridge.typicalVelocity} fps</span>
                          <span>Bullet: {cartridge.typicalBulletWeight}gr</span>
                          <span>SAAMI MAP: {cartridge.maxPressure.toLocaleString()} psi</span>
                          <span>BC G7: {cartridge.typicalBC_G7}</span>
                        </div>
                      )}

                      <p className="text-[10px] font-mono leading-relaxed mb-2" style={{ color: "var(--c-text-dim)" }}>
                        {guide.history}
                      </p>

                      <div className="flex gap-1.5 flex-wrap">
                        {guide.bestFor.map((use) => (
                          <span
                            key={use}
                            className="text-[9px] font-mono px-2 py-0.5 rounded"
                            style={{
                              background: "var(--c-accent-dim)",
                              color: "var(--c-accent)",
                              border: "1px solid var(--c-accent)",
                            }}
                          >
                            {use}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ---- Safari & Dangerous Game ---- */}
          {activeSection === "safari-guide" && (
            <div>
              <div
                className="rounded-md p-4 mb-5"
                style={{
                  background: "var(--c-accent-glow, var(--c-panel))",
                  border: "1px solid var(--c-accent)",
                }}
              >
                <h3 className="text-[11px] font-mono font-bold mb-2" style={{ color: "var(--c-accent)" }}>
                  Choosing a Safari Cartridge
                </h3>
                <p className="text-[10px] font-mono leading-relaxed" style={{ color: "var(--c-text-dim)" }}>
                  Africa divides game into two categories: plains game (antelope, zebra, warthog) and dangerous game (Cape buffalo, elephant, hippo, lion, leopard). Most countries legally require a minimum of .375 caliber (9.3mm in some jurisdictions) for dangerous game. Your professional hunter (PH) will advise, but the .375 H&amp;H Magnum has been the gold standard for over a century.
                </p>
              </div>

              <h3
                className="text-[10px] font-mono uppercase tracking-[2px] mb-3"
                style={{ color: "var(--c-accent)" }}
              >
                Recommended Safari Cartridges
              </h3>

              <div className="flex flex-col gap-4 mb-6">
                {safariCartridges.map((guide) => {
                  const cartridge = CARTRIDGES.find((c) => c.shortName === guide.shortName);
                  return (
                    <div
                      key={guide.shortName}
                      className="rounded-md p-4"
                      style={{ background: "var(--c-panel)", border: "1px solid var(--c-border)" }}
                    >
                      <div className="flex items-baseline gap-3 mb-2">
                        <span className="text-[13px] font-mono font-bold" style={{ color: "var(--c-accent)" }}>
                          {cartridge?.name || guide.shortName}
                        </span>
                        {guide.shortName === ".375 H&H" && (
                          <span
                            className="text-[8px] font-mono uppercase px-2 py-0.5 rounded font-bold"
                            style={{ background: "var(--c-accent)", color: "var(--c-panel)" }}
                          >
                            Dangerous Game Minimum
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] font-mono leading-relaxed" style={{ color: "var(--c-text-dim)" }}>
                        {guide.safariBrief}
                      </p>
                    </div>
                  );
                })}
              </div>

              <h3
                className="text-[10px] font-mono uppercase tracking-[2px] mb-3"
                style={{ color: "var(--c-accent)" }}
              >
                Dangerous Game Quick Reference
              </h3>
              <div
                className="rounded-md overflow-hidden"
                style={{ border: "1px solid var(--c-border)" }}
              >
                <table className="w-full text-[10px] font-mono">
                  <thead>
                    <tr style={{ background: "var(--c-panel)" }}>
                      <th className="text-left px-3 py-2" style={{ color: "var(--c-accent)" }}>Species</th>
                      <th className="text-left px-3 py-2" style={{ color: "var(--c-accent)" }}>Minimum</th>
                      <th className="text-left px-3 py-2" style={{ color: "var(--c-accent)" }}>Recommended</th>
                      <th className="text-left px-3 py-2" style={{ color: "var(--c-accent)" }}>Bullet</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Cape Buffalo", ".375 H&H (legal min)", ".375 H&H / .416 Rigby", "300gr+ premium solid + soft"],
                      ["Elephant", ".375 H&H (legal min)", ".416 Rigby / .458 Lott", "400gr+ monolithic solid"],
                      ["Lion", ".375 H&H (legal min)", ".375 H&H", "300gr premium soft point"],
                      ["Hippo", ".375 H&H (legal min)", ".375 H&H / .416", "300gr+ solid (brain shot)"],
                      ["Kudu / Eland", ".270 Win", ".300 Win Mag / .375 H&H", "180-300gr premium bonded"],
                      ["Wildebeest / Zebra", ".270 Win", ".308 Win / .300 Win Mag", "165-180gr bonded soft point"],
                      ["Impala / Springbok", ".243 Win", ".270 Win / .308 Win", "130-165gr soft point"],
                    ].map(([species, min, rec, bullet]) => (
                      <tr key={species} style={{ borderTop: "1px solid var(--c-border)" }}>
                        <td className="px-3 py-2" style={{ color: "var(--c-text)" }}>{species}</td>
                        <td className="px-3 py-2" style={{ color: "var(--c-text-dim)" }}>{min}</td>
                        <td className="px-3 py-2" style={{ color: "var(--c-text-dim)" }}>{rec}</td>
                        <td className="px-3 py-2" style={{ color: "var(--c-text-dim)" }}>{bullet}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div
                className="mt-4 rounded-md p-3 text-[9px] font-mono"
                style={{ background: "var(--c-surface, var(--c-panel))", color: "var(--c-text-faint)" }}
              >
                Always confirm legal minimum caliber requirements with your outfitter and the specific country's wildlife authority. Regulations vary by jurisdiction and species. Premium controlled-expansion bullets (Swift A-Frame, Nosler Partition, Barnes TSX) are strongly recommended for all African game.
              </div>
            </div>
          )}

          {/* ---- Ballistics 101 ---- */}
          {activeSection === "ballistics-101" && (
            <div className="flex flex-col gap-5">
              <Section title="What is External Ballistics?">
                External ballistics is the study of a projectile's behavior after it leaves the barrel and before it hits the target. The three primary forces acting on a bullet in flight are gravity (pulls it down), aerodynamic drag (slows it down), and wind (pushes it sideways). BulletForge models all three using a 4th-order Runge-Kutta numerical solver.
              </Section>

              <Section title="Ballistic Coefficient (BC)">
                BC is the single most important number for predicting long-range trajectory. It measures how well a bullet resists air drag compared to a standard reference projectile. A higher BC means less drag, less drop, less wind drift, and more retained energy at distance. The two common drag models are G1 (flat-base reference) and G7 (boat-tail reference). For modern match bullets, G7 is more accurate.
              </Section>

              <Section title="Why Zero Range Matters">
                Your zero range determines where your bullet's trajectory crosses your line of sight. A 100-yard zero is the most common for hunting rifles. Some shooters prefer a 200-yard zero for flatter trajectory at mid-range, accepting that the bullet will impact slightly high at 100 yards (typically 1.5-2 inches). Choose a zero range that minimizes the holdover for your most likely engagement distance.
              </Section>

              <Section title="What is Internal Ballistics?">
                Internal ballistics is the study of what happens inside the barrel. When the primer ignites the powder, it converts to high-pressure gas that accelerates the bullet down the bore. The pressure curve — how quickly pressure builds and decays — determines muzzle velocity, barrel harmonics, and safety. BulletForge uses the Nobel-Abel equation of state and Vieille's burn rate law to model this process.
              </Section>

              <Section title="Density Altitude & Atmospheric Effects">
                Air density affects drag. Hot, high-altitude, low-pressure air is thinner — the bullet experiences less drag and shoots flatter. Cold, sea-level, high-pressure air is denser — more drag, more drop. Density altitude combines all three atmospheric variables into a single number. A 5,000-foot density altitude difference can change your drop by several inches at 1,000 yards.
              </Section>

              <Section title="Wind: The Shooter's Biggest Challenge">
                Wind drift is the primary source of misses at long range — not drop. Drop is consistent and predictable; wind is neither. A 10 mph full-value crosswind can push a .308 bullet over 70 inches at 1,000 yards. Reading wind is an acquired skill. BulletForge can show you how much drift to expect, but only you can read the wind at your location.
              </Section>
            </div>
          )}

          {/* ---- Reloading Safety ---- */}
          {activeSection === "reloading-safety" && (
            <div className="flex flex-col gap-5">
              <div
                className="rounded-md p-4"
                style={{
                  background: "var(--c-accent-glow, var(--c-panel))",
                  border: "1px solid var(--c-warn, var(--c-accent))",
                }}
              >
                <p className="text-[11px] font-mono font-bold mb-2" style={{ color: "var(--c-warn, var(--c-accent))" }}>
                  Reloading Safety is Non-Negotiable
                </p>
                <p className="text-[10px] font-mono leading-relaxed" style={{ color: "var(--c-text-dim)" }}>
                  Handloading ammunition involves working with explosive materials and generating pressures exceeding 60,000 PSI. A mistake can destroy your firearm and cause serious injury or death. Never substitute simulation data for published load manuals. Always work up from minimum charges. Always inspect every round.
                </p>
              </div>

              <Section title="The Cardinal Rules">
                1. Never exceed published maximum charges. 2. Always start at the minimum published charge and work up in small increments (0.2-0.3 grains). 3. Watch for pressure signs after every shot: flattened primers, cratered primers, case head expansion, ejector marks, sticky bolt lift. 4. Never mix powders. 5. Never use a powder you cannot positively identify. 6. Verify every charge on a scale — never trust a measure blindly.
              </Section>

              <Section title="Pressure Signs — Know When to Stop">
                Flattened primers are the first warning. Cratered primers (where the firing pin impression shows sharp edges) indicate even higher pressure. Case head expansion (measure with calipers) means you are at or near maximum. Ejector swipe marks on the case head are serious. A sticky or hard bolt lift means STOP IMMEDIATELY. Any single pressure sign means reduce your charge.
              </Section>

              <Section title="What BulletForge Can and Cannot Do">
                BulletForge's internal ballistics simulator can predict approximate pressures and velocities for educational and comparative purposes. It CANNOT replace published load data from Hodgdon, Sierra, Hornady, Nosler, or other reputable sources. Simulations use idealized models — your barrel, chamber, brass, primers, lot-to-lot powder variation, temperature, and altitude all affect real-world pressure. Use BulletForge to understand trends and compare options, then verify against published data before loading a single round.
              </Section>

              <Section title="Essential Equipment">
                At minimum: a quality press (single-stage recommended for beginners), dies matched to your cartridge, a beam or electronic scale accurate to 0.1 grain, calipers, a powder measure, a case trimmer, a priming tool, and at least two published load manuals from different manufacturers. A chronograph (LabRadar or MagnetoSpeed) is strongly recommended to verify actual velocities against predicted values.
              </Section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper component for content sections
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-md p-4"
      style={{ background: "var(--c-panel)", border: "1px solid var(--c-border)" }}
    >
      <h3 className="text-[11px] font-mono font-bold mb-2" style={{ color: "var(--c-accent)" }}>
        {title}
      </h3>
      <p className="text-[10px] font-mono leading-relaxed" style={{ color: "var(--c-text-dim)" }}>
        {children}
      </p>
    </div>
  );
}
