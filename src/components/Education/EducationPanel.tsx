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
  | "long-range"
  | "load-development"
  | "reloading-safety";

const SECTIONS: { id: EducationSection; title: string; icon: string }[] = [
  { id: "cartridge-guide", title: "Cartridge Guide", icon: ">" },
  { id: "safari-guide", title: "Safari & Dangerous Game", icon: ">" },
  { id: "ballistics-101", title: "Ballistics 101", icon: ">" },
  { id: "long-range", title: "Long-Range Shooting", icon: ">" },
  { id: "load-development", title: "Load Development", icon: ">" },
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

          {/* ---- Long-Range Shooting ---- */}
          {activeSection === "long-range" && (
            <div className="flex flex-col gap-5">
              <div
                className="rounded-md p-4"
                style={{
                  background: "var(--c-accent-glow, var(--c-panel))",
                  border: "1px solid var(--c-accent)",
                }}
              >
                <p className="text-[10px] font-mono leading-relaxed" style={{ color: "var(--c-text-dim)" }}>
                  Beyond 600 yards, the atmosphere becomes the dominant variable. Understanding when advanced corrections matter — and when they don't — separates consistent hits from frustrating misses.
                </p>
              </div>

              <Section title="When Do Advanced Corrections Matter?">
                At 100-300 yards, none of these effects matter. Bullet drop and a basic wind call are enough. At 300-600 yards, density altitude and accurate wind reading become critical. Beyond 600 yards, spin drift, Coriolis, and aerodynamic jump start to add up. Past 1,000 yards, ignoring any of these can mean a miss by feet, not inches. BulletForge models all of them — use the comparison mode to see exactly how much each correction contributes at your target distance.
              </Section>

              <Section title="Spin Drift">
                A bullet spinning from a right-hand twist barrel will drift to the right over distance (left for left-twist). This is caused by the yaw of repose — the bullet's nose precessing slightly to the right as it tracks the arc of its trajectory. At 1,000 yards with a typical .308 load, spin drift can account for 6-10 inches of rightward deflection. It is consistent and predictable, which means you can dial for it.
              </Section>

              <Section title="Coriolis Effect">
                The Earth is rotating underneath the bullet while it's in flight. In the Northern Hemisphere, Coriolis deflects the bullet slightly to the right; in the Southern Hemisphere, to the left. The magnitude depends on your latitude, the direction you're shooting (azimuth), and time of flight. At 1,000 yards it is typically 2-4 inches — small but additive with spin drift. Shooting due north or south produces the maximum horizontal deflection; shooting east or west minimizes it.
              </Section>

              <Section title="Eötvös Effect">
                The vertical component of Coriolis. Shooting east (with Earth's rotation), the bullet effectively weighs less and drops less. Shooting west (against rotation), it drops more. This is the Eötvös effect. At typical rifle ranges it is very small — under an inch at 1,000 yards — but BulletForge includes it for completeness. ELR shooters past 1,500 yards should account for it.
              </Section>

              <Section title="Aerodynamic Jump">
                When a crosswind hits a spinning bullet, the bullet's nose yaws into the wind. Due to gyroscopic precession, this yaw converts into a vertical deflection — the bullet impacts high or low depending on wind direction and twist. This is aerodynamic jump. It is proportional to crosswind speed and inversely proportional to muzzle velocity. A 10 mph crosswind can cause 1-3 inches of vertical shift at 1,000 yards. If your groups are vertically strung on windy days, aerodynamic jump may be the reason.
              </Section>

              <Section title="Density Altitude — The Hidden Variable">
                Two shooters at the same GPS altitude can get different trajectories if their atmospheric conditions differ. Density altitude collapses temperature, barometric pressure, and humidity into a single equivalent altitude. A hot summer day at 2,000 feet elevation might have a density altitude of 5,000 feet — meaning the air is as thin as it would be at 5,000 feet on a standard day. Thinner air means less drag, flatter trajectory, and less wind drift. Always compute density altitude, not just elevation, for your DOPE cards.
              </Section>

              <Section title="Practical Tips for Long-Range Shooting">
                1. Build DOPE cards at multiple density altitudes — a sea-level card is useless at 7,000 feet. 2. Zero at the density altitude you'll be shooting at, or true your BC with a chronograph at distance. 3. Spin drift and Coriolis are additive for right-twist barrels shooting in the Northern Hemisphere — they both push right. 4. Wind is still your biggest variable; a 1 mph wind reading error matters more than Coriolis at most distances. 5. Use BulletForge's comparison mode to isolate each effect: run one trajectory with Coriolis on, one with it off, and see the actual delta for your specific setup.
              </Section>
            </div>
          )}

          {/* ---- Load Development Guide ---- */}
          {activeSection === "load-development" && (
            <div className="flex flex-col gap-5">
              <div
                className="rounded-md p-4"
                style={{
                  background: "var(--c-accent-glow, var(--c-panel))",
                  border: "1px solid var(--c-accent)",
                }}
              >
                <p className="text-[10px] font-mono leading-relaxed" style={{ color: "var(--c-text-dim)" }}>
                  Load development is the systematic process of finding the optimal combination of components and dimensions for your specific rifle. Every barrel is different — the goal is to find what YOUR rifle shoots best.
                </p>
              </div>

              <Section title="The Load Development Process">
                The general sequence is: 1. Select your components (brass, primer, powder, bullet). 2. Find a safe starting charge from published load data. 3. Run a ladder or charge weight test to find a velocity node. 4. Optimize seating depth around that charge. 5. Fine-tune charge weight in small increments. 6. Validate with a larger sample size. BulletForge's Load Development tab walks you through each step with predicted pressures and velocities.
              </Section>

              <Section title="Ladder Test Method">
                A ladder test fires single rounds at incrementally increasing charge weights, typically in 0.3-grain steps from minimum to near-maximum. You're looking for a velocity plateau — a range of charge weights where velocity changes very little despite increasing powder. This "node" indicates the barrel's natural harmonic convergence point. Loads developed at a node tend to be more consistent and less sensitive to small charge weight variations. BulletForge's ladder planner generates the step table with predicted velocity and pressure for each increment.
              </Section>

              <Section title="Optimal Charge Weight (OCW)">
                OCW is Dan Newberry's method. Fire 3-round groups at each charge weight in your ladder. The optimal charge is where groups are tight AND point of impact (POI) doesn't shift between adjacent charge weights. BulletForge scores OCW results using a weighted formula: 50% group size, 30% standard deviation, 20% POI consistency. The best charge is one that shoots well AND tolerates slight variations — a "forgiving" node.
              </Section>

              <Section title="Seating Depth Optimization">
                Once your charge weight is locked, fine-tune bullet seating depth. Start with the bullet touching the rifling lands (jam) and work back in 0.010-inch increments to 0.100 inches off the lands. Secant ogive bullets (like Berger VLDs and Hornady ELD-M) are more sensitive to seating depth — small changes produce big accuracy differences. Tangent ogive bullets (like Sierra MatchKing) are more forgiving. BulletForge knows each bullet's ogive type and adjusts its recommendations accordingly.
              </Section>

              <Section title="ES and SD — Measuring Consistency">
                Extreme Spread (ES) is the difference between your fastest and slowest shot. Standard Deviation (SD) measures how tightly your velocities cluster around the mean. For precision rifle work, an SD under 10 fps is good, under 8 fps is competition-grade, and under 5 fps is exceptional. ES should be under 25 fps. A chronograph is essential — without one, you're guessing. BulletForge's ES/SD calculator grades your strings and tracks trends over time.
              </Section>

              <Section title="The Role of Brass Preparation">
                Consistent brass is the foundation of consistent ammunition. Key steps: 1. Sort brass by headstamp (or ideally by weight). 2. Full-length size or neck-size only (neck-sizing gives better consistency but may cause chambering issues after several firings). 3. Trim to uniform length. 4. Deburr and chamfer case mouths. 5. Uniform flash holes and primer pockets. Each of these steps reduces one variable — and load development is all about isolating variables.
              </Section>

              <Section title="Working Up Safely">
                Always start at the minimum published charge weight, not the middle or the max. Increase in 0.3-grain increments for most cartridges (0.5 grains for magnums with large case capacity). Watch for pressure signs at every step. BulletForge's internal ballistics engine can predict approximate pressures, but YOUR barrel, chamber, brass, and components will differ from the model. The simulator shows trends — your chronograph and your brass show reality.
              </Section>

              <Section title="Validating Your Load">
                Once you've found an accurate charge weight and seating depth, validate with a minimum of 20-round test group, ideally 30-50 rounds across multiple range sessions and different temperatures. A 3-round group can lie; a 30-round aggregate tells the truth. Log your chrono data in BulletForge's performance tracker to build a statistical picture of your load's true consistency.
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
