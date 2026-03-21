# BulletForge — Phase 2 Marketing Plan

> Ship what exists. Earn credibility. Then expand.

---

## What We Actually Have (v0.1.0)

Before writing a single post, be honest about the product:

| Feature | Status | Detail |
|---------|--------|--------|
| RK4 external ballistics | ✅ Ship | 4th-order Runge-Kutta, not Euler. Real physics. |
| G1 & G7 drag models | ✅ Ship | Full Cd vs. Mach tables with linear interpolation |
| Atmospheric modeling | ✅ Ship | Air density from altitude, temp, pressure, humidity |
| Wind drift & spin drift | ✅ Ship | Full crosswind decomposition + Litz spin drift |
| 15 cartridges | ✅ Ship | .22 LR through .50 BMG, SAAMI specs |
| 60+ bullets | ✅ Ship | Sierra, Hornady, Berger, Nosler — real BCs |
| 25 powders (database only) | ✅ Ship | Burn rates, temp sensitivity (display only, no internal ballistics) |
| Real-time sliders | ✅ Ship | Every parameter recalculates instantly |
| SVG trajectory chart | ✅ Ship | Bullet path, zero crossing, transonic marker |
| Full data table | ✅ Ship | Drop/drift in inches, MOA, MIL + velocity, energy, TOF, momentum, Mach |
| Transonic/subsonic warnings | ✅ Ship | Exact yardage where bullet goes transonic and subsonic |
| Internal ballistics | ❌ Not yet | No chamber pressure, no burn rate sim |
| Load library / recipes | ❌ Not yet | No save/load/persistence |
| Chrono import / truing | ❌ Not yet | No calibration from real data |
| Inventory / cost tracking | ❌ Not yet | Not built |

**Marketing rule: never claim a feature that isn't in the product.**

---

## Target Audience (Phase 2 — External Ballistics)

| Audience | Why they care | Where they are |
|----------|---------------|----------------|
| Long-range shooters | Wind calls, drop charts, transonic data | r/longrange, Sniper's Hide |
| PRS competitors | Quick MOA/MIL tables for stage planning | r/CompetitionShooting, PRS forums |
| Hunters at distance | Energy at range, ethical kill thresholds | r/hunting, Rokslide, LongRangeHunting.com |
| New rifle owners | "How far does my .308 drop at 300?" | r/guns, r/Firearms |
| Guys stuck on phones | No app, no desktop, just need a number | All of the above |

**Who we are NOT targeting yet:** Reloaders. They'll ask "where's the pressure curve?" and we don't have it. That's Phase 3. Don't poke that bear until the feature exists.

---

## Positioning: What to Say (and What NOT to Say)

### ✅ Say This
- "Free browser-based ballistics calculator — real physics, not lookup tables"
- "RK4 trajectory engine with G1 & G7 drag models"
- "Works on phone, tablet, Mac, PC — no app, no install, no account"
- "60+ bullets from Sierra, Hornady, Berger, Nosler with real BCs"
- "Drop and drift in MOA and MIL — matches your turrets"
- "See exactly where your bullet goes transonic"
- "Atmospheric corrections — altitude, temp, pressure, humidity"
- "Every slider recalculates instantly"
- "Built by engineers, not a spreadsheet with a skin"

### ❌ Don't Say This (Yet)
- ~~"QuickLOAD alternative"~~ → We don't do internal ballistics yet
- ~~"Reloading simulator"~~ → Misleading until we have charge weight / pressure
- ~~"Replace GRT"~~ → Same reason
- ~~"All-in-one reloading tool"~~ → We're a ballistics calculator right now
- ~~"Save your loads"~~ → No persistence yet
- ~~"Chrono integration"~~ → Not built

### The Honest Pitch
> BulletForge is the best free external ballistics calculator on the web. Period. Real RK4 physics, real drag models, real atmospheric corrections — running in your browser with zero install. Pick your cartridge and bullet, dial in your environment, and get a complete trajectory solution from the muzzle to past transonic. Every number updates in real time.
>
> Internal ballistics and load development tools are coming. But the trajectory engine is here now and it's accurate.

---

## Launch Posts

### Reddit — r/longrange

**Title:** Built a free browser-based ballistics calculator with RK4 physics and G1/G7 drag — looking for feedback from people who actually shoot past 600

**Body:**

I built a ballistics calculator called **BulletForge** that runs entirely in your browser. No install, no account, works on your phone.

**What it does:**

- Full trajectory solution — drop and drift in inches, MOA, and MIL out to 1500+ yards
- 4th-order Runge-Kutta integration (not simplified Euler)
- G1 and G7 drag models with real Cd vs. Mach lookup tables
- Atmospheric corrections — altitude, temperature, barometric pressure, humidity
- Full wind modeling — speed + angle, crosswind and headwind decomposition
- Spin drift (Litz formula)
- 15 cartridges (.22 LR through .50 BMG) and 60+ bullets from Sierra, Hornady, Berger, Nosler
- Transonic range warning — see exactly where your bullet enters the transonic zone
- Every parameter has a real-time slider that recalculates the entire trajectory instantly

**What it doesn't do (yet):**

- No internal ballistics / chamber pressure (that's the next major phase)
- No saved loads or load library
- No chrono import or model truing

This is an external ballistics engine. It takes your muzzle velocity and gives you a trajectory. If you want to figure out what charge weight produces that velocity, that's coming — but I wanted to get the trajectory math right first.

I'd love feedback from people who can actually compare this against their DOPE or AB Kestrel data. The 6.5 Creedmoor defaults (140gr ELD-M at 2700 fps, 100 yd zero) should give you roughly -36" at 500 and transonic around 1200. If your real data disagrees, I want to know.

**https://bulletforge.io**

Free, no signup, runs in any browser.

---

### Reddit — r/guns or r/Firearms (simpler, broader audience)

**Title:** Free web-based ballistics calculator — drop tables, wind drift, energy at distance for 15 cartridges

**Body:**

Made a free tool called **BulletForge** for checking trajectory data on any device.

Pick your cartridge and bullet, set your zero and environment, and get a full drop table — inches, MOA, MIL — plus velocity, energy, wind drift, and time of flight at every 25 yards.

15 cartridges from .22 LR to .50 BMG, 60+ bullets with real ballistic coefficients. Works on your phone, nothing to install.

**https://bulletforge.io**

Useful if you're sighting in a new rifle, planning a hunt at altitude, or just curious how much your .308 drops at 400.

---

### Sniper's Hide (Precision Rifle Forum)

**Title:** BulletForge — Free Browser-Based Ballistics Calculator (RK4 / G1+G7 / Atmospheric)

**Body:**

Gents,

Built a trajectory calculator that runs in your browser — BulletForge. Figured this crowd would be the right group to validate the math.

**Engine:**
- 4th-order Runge-Kutta numerical integration
- G1 and G7 standard drag models — full Cd vs. Mach tables with linear interpolation, not single-BC shortcuts
- Army Metro atmospheric model — air density from station pressure, temperature, altitude, humidity
- Speed of sound recalculated from temperature at every integration step
- Wind decomposition (crosswind + head/tail) and Litz spin drift

**Output at every 25 yards:**
- Drop: inches, MOA, MIL
- Drift: inches, MOA, MIL
- Velocity (fps), Energy (ft-lbs), Momentum (lb-s)
- Mach number, Time of flight
- Transonic and subsonic range markers

**Database:**
- 15 cartridges (.22 LR through .50 BMG) with SAAMI specs
- 60+ bullets — Sierra MatchKing/GameKing, Hornady ELD-X/ELD-M/A-MAX, Berger VLD/Hybrid/OTM, Nosler AccuBond/Partition/RDF
- G1 and G7 BCs, sectional density displayed for every bullet

**What it's not (yet):** Not an internal ballistics simulator. No pressure curves, no charge weight optimization. That's the next development phase. Right now it takes your MV as input and gives you a trajectory.

Runs on any device, no account, no install: **https://bulletforge.io**

If anyone wants to spot-check against AB Kestrel, BallisticsARC, or real DOPE cards, I'd appreciate the feedback. Especially interested in long-range (800+) accuracy against known data.

---

### Twitter/X (Short)

Free browser-based ballistics calculator — RK4 engine, G1/G7 drag models, 60+ bullets, 15 cartridges. Drop tables in MOA and MIL, wind drift, atmospheric corrections. No install, works on your phone.

https://bulletforge.io

**Hashtags:** #longrange #precisionrifle #ballistics #shooting #reloading #PRS #bulletforge

---

## SEO Keywords (for bulletforge.io meta tags and content)

### Primary (target these in title tags and H1)
- free ballistics calculator
- online ballistics calculator
- browser ballistics calculator
- ballistic trajectory calculator

### Secondary (for content and blog posts)
- G1 G7 drag model calculator
- MOA MIL drop chart
- bullet drop calculator online
- wind drift calculator shooting
- 6.5 Creedmoor ballistics
- .308 Winchester trajectory
- long range shooting calculator
- bullet energy at distance

### Long-tail (for blog content when we start writing)
- "how much does 6.5 Creedmoor drop at 1000 yards"
- "308 vs 6.5 Creedmoor wind drift comparison"
- "free alternative to Applied Ballistics"
- "ballistics calculator that works on phone"

### Don't target yet (until internal ballistics ships)
- ~~"QuickLOAD alternative"~~
- ~~"reloading software"~~
- ~~"chamber pressure calculator"~~
- ~~"load development software"~~

---

## Posting Strategy

### Week 1: Soft Launch
1. **r/longrange** — Main post (morning EST, weekday). This is the core audience.
2. **Sniper's Hide** — Same day or next. Technical crowd, slower but stickier.
3. **Twitter/X** — Short post with screenshot.

### Week 2: Broader Push
4. **r/guns or r/Firearms** — Simpler post for broader audience.
5. **r/hunting** — Only if we add an "ethical range" feature (min KE threshold marker).
6. **LongRangeHunting.com forum** — Hunting-angle post.

### Week 3+: Engage and Iterate
- **Respond to every comment** for the first 48 hours. This is the entire launch.
- **If someone posts DOPE data that disagrees**, investigate immediately and fix or explain. Credibility is everything.
- **Screenshot comparisons** with Applied Ballistics or Hornady 4DOF will generate engagement.
- **Do NOT cross-post r/reloading** until Phase 3 ships.

### Content to Prepare Before Posting
- [ ] 3-4 screenshots showing: cartridge selection, trajectory chart, data table, mobile view
- [ ] 30-second screen recording (slider manipulation showing real-time updates)
- [ ] One comparison: BulletForge vs. published data for 6.5 CM 140gr ELD-M at standard conditions
- [ ] og-image.png designed and deployed (for link previews)

---

## Success Metrics

| Metric | Target (30 days) | How to measure |
|--------|------------------|----------------|
| Unique visitors | 1,000+ | Plausible analytics |
| Reddit post upvotes | 50+ on r/longrange | Reddit |
| Sniper's Hide replies | 10+ substantive | Forum |
| Bug reports from real shooters | 5+ (means people are actually using it) | GitHub issues or forum replies |
| Accuracy complaints | < 3 (means the physics is solid) | Forum feedback |
| "Can you add X" requests | 10+ (means people want more) | All channels |

---

## Phase 3 Marketing Preview (Internal Ballistics — DO NOT PUBLISH YET)

Once chamber pressure simulation, charge weight optimization, and chrono truing ship, THEN we pivot messaging to:

- "The QuickLOAD alternative that runs in your browser"
- "GRT died. BulletForge picked up where it left off."
- Target r/reloading, AccurateShooter forums, Rokslide reloading threads
- Direct comparison posts: "I ran the same load through QuickLOAD and BulletForge — here are the numbers"
- Content marketing: "Why your QuickLOAD predictions don't match your chrono (and how to fix it)"

That marketing will be 10x more powerful if we already have credibility from the external ballistics launch. Build the reputation first.

---

## Rules

1. Never claim features that aren't shipped
2. Never compare to QuickLOAD/GRT until we compete on their turf (internal ballistics)
3. Always include "what it doesn't do yet" — transparency builds trust with this crowd
4. Respond to every piece of feedback personally in the first two weeks
5. If a shooter proves our numbers are wrong, fix it publicly and thank them
6. Screenshots > words. Screen recordings > screenshots. Comparison data > everything.
