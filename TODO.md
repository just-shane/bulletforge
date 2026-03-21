# 🔴 BulletForge — Roadmap

### Ballistics & reloading simulator. In your browser. No $150 desktop app required.

> **Coming soon:** [https://bulletforge.io](https://bulletforge.io)
> For reloaders, long-range shooters, and gunsmiths who want real physics — not guesswork.

---

## 🔢 Version History

| Version | Phase | What Shipped |
|---------|-------|-------------|
| **v0.1.0** | Phase 1 | RK4 external ballistics engine, G1/G7 drag, 15 cartridges, 60+ bullets, 25 powders, SVG trajectory chart, full data table |
| **v0.2.0** | Phase 2 | BulletForge logo, PWA manifest + service worker, OG image, CI/CD pipeline, .htaccess, SEO meta tags |
| **v0.3.0** | Phase 3 | Internal ballistics engine (Nobel-Abel + Vieille), pressure curve chart, 22 powder profiles, 15 cartridge internal data, tabbed UI, safety warnings, 53 tests |
| **v0.4.0** | Phase 4 | Load development tools — ladder test planner, ES/SD calculator, seating depth optimizer, OCW analysis, load recipe/session types, 15+ primer database, 73 tests |
| **v0.4.1** | Phase 3 cleanup | Barrel length optimizer, burn rate comparison chart, temp sensitivity modeling, hot/cold comparison panel, safe load indicator, 85 tests |
| **v0.5.0** | Phase 5 | Coriolis/Eötvös, aerodynamic jump, density altitude, station-to-absolute pressure, comparison mode with overlay chart + delta table, latitude/azimuth controls, 102 tests |
| **v0.5.1** | Cherry-pick | Miller stability factor, BC truing calculator, DOPE card generator, stability panel UI — low-hanging fruit from Phases 6 & 7, 111 tests |
| **v0.5.2** | Polish | 6-theme system (4 dark + 2 light) with hamburger settings menu, CSS variable theming, per-theme slider styling, Docs & Education stubs |
| **v0.6.0** | Batch A | Steep angle warnings, ogive profiles on all bullets, multi-zero DOPE cards, arm band DOPE format, shooting angle slider |
| **v0.7.0** | Batch B | Scope profile system, turret matching, BDC reticle overlay, custom turret dial builder, FFP/SFP holdover correction |
| **v0.8.0** | Batch C | Rifle profiles (localStorage), performance tracking (ES/SD trends), shareable URLs, export/print, localStorage persistence layer |
| **v0.9.0** | Phase 7 | Chrono data import (LabRadar/MagnetoSpeed CSV), seed reference data (Ammolytics), barrel length validation, predicted vs. measured comparison |
| **v0.9.1** | Phase 8.6 | ML training data ingestion pipeline — GRT XML parser, 115-record normalized corpus (48 projectiles, 12 powders, 48 calibers, 7 loads), typed query utilities |
| **v0.9.2** | Docs & Education | Full Docs panel (4 sections), Education panel (cartridge guide, safari guide, ballistics 101, reloading safety), Glossary (53 terms, 7 categories, search + filter) |

> **Current:** `v0.9.2` — defined in `src/lib/version.ts`
> **Versioning:** Major phases bump minor version. Patches for bugfixes.

---

## 🔑 API Keys & External Services

| Status | Service | Required? | Notes |
|--------|---------|-----------|-------|
| 🔜 | Plausible Analytics | Yes | `@plausible-analytics/tracker` NPM package (wired, needs account) |
| 🔜 | Sentry | Yes | `@sentry/react` (wired, needs DSN) |
| 🔜 | Let's Encrypt | Yes | SSL via WHM AutoSSL (needs cPanel license) |
| 🔜 | Supabase | No | Future: chrono data, user accounts, API backend |

---

## ✅ Phase 1 — Foundation & External Ballistics

> *Day one. RK4 engine. Real drag models. 1000+ yards.*

### 🔬 1.1 Ballistics Engine
- [x] **RK4 integration** — 4th-order Runge-Kutta, not Euler — accurate past 1000 yards
- [x] **G1 & G7 drag models** — Full Cd vs. Mach lookup tables with linear interpolation
- [x] **Atmospheric modeling** — Air density from altitude, temperature, pressure, humidity (Army Metro)
- [x] **Speed of sound** — Temperature-dependent Mach calculation
- [x] **Wind drift** — Full crosswind/headwind/tailwind decomposition from speed + angle
- [x] **Spin drift** — Litz spin drift approximation
- [x] **Zero calculation** — Bisection solver for sight angle at any zero range
- [x] **KE & momentum** — `KE = (m·v²)/450,436` · `p = (m·v)/225,218`

### 📊 1.2 Trajectory Output
- [x] **Drop table** — Every 25 yards to 1500+: drop (in/MOA/MIL), drift (in/MOA/MIL), velocity, energy, TOF, momentum
- [x] **SVG trajectory chart** — Bullet path with zero crossing, gridlines, axis labels
- [x] **Zero range highlighting** — Visual callout in table
- [x] **Transonic marking** — Flag where bullet goes subsonic

### 🗄️ 1.3 Databases
- [x] **15 cartridges** — .22 LR through .50 BMG with SAAMI specs
- [x] **60+ bullets** — Sierra, Hornady, Berger, Nosler across 9 calibers with G1/G7 BCs
- [x] **25 powders** — Hodgdon, Alliant, Vihtavuori, IMR with burn rates & temp sensitivity
- [x] **Sectional density** — Auto-calculated from weight and diameter

### 🎛️ 1.4 Controls & UI
- [x] **Cartridge selector** — Dropdown with descriptions
- [x] **Bullet selector** — Filtered by caliber, shows BC/SD
- [x] **Velocity slider** — 1000–4500 fps
- [x] **Zero range buttons** — 25–500 yards quick select
- [x] **Wind controls** — Speed (0–30 mph) + angle (0–360°)
- [x] **Environment panel** — Altitude, temperature, barometric pressure
- [x] **Stats bar** — Muzzle velocity, energy, zero range, max ordinate, transonic range

### 🧪 1.5 Testing & Build
- [x] **28 unit tests** — KE, momentum, drag interpolation, air density, trajectory accuracy, wind, altitude effects
- [x] **Production build** — 99KB gzipped, Vite + React 19 + TypeScript
- [x] **Sentry + Plausible** — Wired up (needs production DSN/account)

---

## 🔜 Phase 2 — Polish & Deploy

> *Logo. CI/CD. Get it live.*

### 🎨 2.1 Branding
- [x] **BulletForge SVG logo** — Bullet + crosshair reticle with mil-dots, red/dark theme
- [x] **Favicon** — SVG favicon for browser tabs
- [x] **PWA icons** — 192px, 512px, Apple Touch (180px) — generated via sharp script
- [x] **OG image** — 1200×630 social preview card with feature pills
- [x] **Theme color** — `#ef4444` (red) across manifest + meta

### 🚀 2.2 Deploy to bulletforge.io
- [ ] **cPanel account** — Set up bulletforge.io under St. Clair Hosting (needs additional license)
- [ ] **DNS** — Point bulletforge.io to server IP
- [ ] **SSL** — Let's Encrypt wildcard via WHM AutoSSL
- [x] **Apache .htaccess** — HTTPS redirect, security headers, Vite caching, SPA fallback, gzip
- [x] **GitHub Actions CI/CD** — Test → Build → FTPS deploy on push to main
- [ ] **GitHub secrets** — FTP_SERVER, FTP_USERNAME, FTP_PASSWORD
- [ ] **Enable "Require status checks to pass"** — Add to main-protection ruleset once CI/CD deploys are working

### 📊 2.3 Analytics & SEO
- [ ] **Plausible account** — Add bulletforge.io as site
- [ ] **Sentry project** — Create project, add production DSN
- [x] **OG meta tags** — Title, description, image for link sharing
- [x] **Twitter cards** — `summary_large_image`
- [x] **JSON-LD** — WebApplication schema (verified in index.html)

### 📱 2.4 PWA & Offline
- [x] **manifest.json** — App name, icons, standalone display
- [x] **Service worker** — Network-first caching for offline use at the bench
- [x] **Apple web app** — iOS standalone mode meta tags (in index.html)

---

## ✅ Phase 3 — Internal Ballistics (The QuickLOAD Killer)

> *Chamber pressure modeling. Burn rate simulation. This is the moat.*
>
> QuickLOAD charges $150 and looks like Windows 98. We did better.

### 🔥 3.1 Pressure Curve Engine
- [x] **Burn rate simulation** — Nobel-Abel EOS + Vieille's burn rate law, 1µs Euler integration
- [x] **Pressure vs. barrel position** — Full curve: peak pressure, muzzle pressure, position tracking
- [x] **SAAMI pressure limits** — Over-pressure warning at 90% SAAMI MAP with visual alerts
- [x] **Powder charge optimizer** — `findMaxCharge()` binary search for SAAMI max charge
- [x] **Case fill percentage** — Volume calculation from case capacity and powder density
- [x] **Thermodynamic efficiency** — % of powder energy converted to bullet KE
- [x] **Burn completion tracking** — Flag if powder burns completely before muzzle exit

### 📏 3.2 Barrel Length Effects
- [x] **Velocity vs. barrel length** — `velocityForBarrelLength()` multi-simulation
- [x] **Optimal barrel length** — `findOptimalBarrelLength()` with diminishing returns threshold + SVG chart with green/yellow/red fps/inch bars
- [ ] **Compensator/brake effects** — Backpressure modeling for muzzle devices
  > **Deferred (v0.4.1):** Requires extending the Nobel-Abel engine with gas dynamics at the muzzle — modeling backpressure from brakes/comps needs an expansion chamber model with port geometry, baffle count, and exit cone angles. Non-trivial physics extension with limited reloading value (doesn't change load data, only dwell time). Revisit if users request it or when the engine gets a gas system model for semi-auto port pressure tuning.

### 🌡️ 3.3 Temperature Sensitivity
- [x] **Powder temp modeling** — `tempSensitivity` field on all 24 powders (fps/°F), `tempAdjustedVelocity()` function
- [x] **Hot/cold load comparison** — `compareLoadAtTemps()` + interactive TempComparisonPanel with cold/hot sliders, side-by-side velocity/pressure/SAAMI%
- [x] **Temp-stable powder recommendations** — Powder database has temp sensitivity ratings with color-coded assessment

### 📊 3.4 Visualization & UI
- [x] **Pressure curve chart** — SVG: pressure vs. barrel travel with SAAMI max line, peak marker, burn complete marker
- [x] **Internal ballistics tab** — Tabbed UI: External / Internal with shared cartridge/bullet selection
- [x] **Stats dashboard** — Predicted MV, peak pressure, SAAMI %, efficiency, fill ratio, barrel time
- [x] **Safety disclaimer** — Contextual warning on every internal ballistics view
- [x] **Burn rate comparison** — `comparePowders()` engine + overlay SVG chart with up to 4 powders, color-coded legend with peak pressure/MV
- [x] **Safe load indicator** — Green/yellow/red gradient bar with position marker showing charge weight vs. SAAMI % zone

### 🗄️ 3.5 Databases
- [x] **24 powder internal profiles** — Burn rate coefficients, pressure exponents, flame temps, densities, form factors, temp sensitivity
- [x] **15 cartridge internal profiles** — Case capacities, bore areas, freebore, shot start pressures, charge ranges
- [x] **`buildConfig()` convenience** — Assemble full config from cartridge + powder + bullet names

### 🧪 3.6 Testing
- [x] **37 internal ballistics tests** — Database integrity, simulation fundamentals, known load validation, barrel length effects, safety features, physics sanity, temp sensitivity, burn rate comparison, optimal barrel length
- [x] **85 total tests passing** — 28 external + 37 internal + 20 load development

---

## ✅ Phase 4 — Load Development Tools

> *Ladder tests. OCW. Seating depth. The stuff reloaders actually do at the bench.*

### 📐 4.1 Ladder Test Planner
- [x] **Charge weight ladder** — Auto-generate test plan: start → max in 0.3gr steps with predicted MV & pressure
- [x] **Velocity plateau detection** — `velocityNodeDetection()` finds flat spots in charge-vs-velocity curve
- [x] **ES/SD calculator** — Interactive calculator with quality assessment (competition-grade < 8 SD)
- [x] **Round count estimator** — Total rounds calculated from steps × rounds per step

### 🎯 4.2 Seating Depth Optimizer
- [x] **COAL/CBTO calculator** — OAL calculated from base OAL minus jump distance
- [x] **Jump-to-lands table** — 8-step plan: jam → 0.010" → 0.020" → ... → 0.100" off the lands
- [x] **Ogive profile data** — `ogiveType: "secant" | "tangent" | "hybrid"` on all bullets, context-aware seating depth recommendations
  > *Completed in v0.6.0 — per-bullet ogive classification with color-coded guidance in SeatingDepthView (secant=jump-sensitive, tangent=forgiving, hybrid=moderate)*
- [x] **Magazine length check** — `checkMagazineLength()` warns when OAL exceeds max

### 📊 4.3 Optimal Charge Weight (OCW)
- [x] **OCW methodology** — Weighted scoring: 50% group size, 30% SD, 20% POI consistency
- [x] **Group analysis** — `analyzeOCW()` finds optimal charge from test data
- [x] **POI shift tracking** — POI shift included in OCWResult scoring

### 📋 4.4 Load Logbook
- [x] **Load recipes** — `createLoadRecipe()` with full component data, dimensions, performance, notes
- [x] **Session notes** — `createRangeSession()` with date, location, conditions, shot strings, groups
- [x] **Performance tracking** — ES/SD trends over time for a given load, SVG trend charts, localStorage persistence
  > *Completed in v0.8.0 — PerformanceTracker component with velocity entry, history table, SD trend chart, summary stats. localStorage CRUD layer bridges to future Supabase.*
- [x] **Export/share** — Print-friendly load cards, shareable URL links with config state
  > *Completed in v0.8.0 — ShareExport component with URL-encoded state params, clipboard copy, print button. URL hydration on mount restores shared configs.*

### 🗄️ 4.5 Primer Database
- [x] **15+ primers** — CCI, Federal, Remington, Winchester — small/large rifle, magnum, match

### 🎛️ 4.6 UI
- [x] **Load Development tab** — Third tab with sub-navigation: Ladder Test / ES-SD Calc / Seating Depth
- [x] **Ladder test view** — Step table with predicted MV, pressure, SAAMI %, over-pressure flags
- [x] **ES/SD calculator** — Interactive input with quality feedback
- [x] **Seating depth view** — OAL table with jump distances and magazine fit check

### 🧪 4.7 Testing
- [x] **20 load development tests** — ES/SD, ladder planner, seating depth, OCW, load recipe, primers
- [x] **73 total tests passing** — 28 external + 25 internal + 20 load development

---

## ✅ Phase 5 — Advanced Ballistics

> *Coriolis. Spin drift. Density altitude. The stuff that matters past 600 yards.*

### 🌍 5.1 Long-Range Corrections
- [x] **Coriolis effect** — `coriolisAcceleration()` integrated into RK4 solver, latitude + azimuth controls in UI
- [x] **Aerodynamic jump** — `aerodynamicJump()` crosswind-induced vertical shift, shown in trajectory points
- [ ] **Magnus effect** — Spin-induced drift in crosswind
  > **Deferred (v0.5.0):** Magnus effect is a third-order correction that requires the full 6-DOF (six degrees of freedom) projectile model — spin rate decay, yaw of repose, and dynamic stability tracking per time step. The point-mass solver can't model it accurately. Revisit if/when we upgrade to a 6-DOF engine. At typical rifle ranges (<1500 yds), Magnus is sub-MOA and masked by other uncertainties.
- [x] **Eötvös effect** — Earth rotation velocity correction integrated into Coriolis function (vertical component)

### 🏔️ 5.2 Environment
- [x] **Density altitude calculator** — `densityAltitude()` from standard atmosphere inversion, displayed in UI
- [x] **Station pressure vs. absolute** — `stationToAbsolutePressure()` hypsometric conversion
- [ ] **Weather API integration** — Pull current conditions from GPS/location (optional)
  > **Deferred (v0.5.0):** Requires geolocation API permission + a weather data provider (OpenWeatherMap, NWS API, etc.). Natural fit for the mobile/PWA experience in Phase 8. Low priority — shooters at the range know their conditions from a Kestrel or phone.
- [x] **Altitude velocity correction** — `altitudeVelocityCorrection()` empirical MV correction for altitude

### 📐 5.3 Angle Shooting
- [x] **Improved angle correction** — Rifleman's rule cosine correction already in RK4 solver (`gravityEffective = GRAVITY * cosShoot`)
- [x] **Uphill vs. downhill** — Cosine rule applies symmetrically (verified in tests)
- [x] **Steep angle warnings** — Warning badge when |angle| > 15° with cosine factor display and Rifleman's Rule caveat
  > *Completed in v0.6.0 — shooting angle slider (-60° to 60°) added to ControlPanel with live cosine correction display*

### 🔄 5.4 Comparison Mode
- [x] **Side-by-side loads** — Snapshot current trajectory, change setup, compare side-by-side
- [x] **Overlay trajectories** — ComparisonChart with two color-coded curves (red/blue) on shared axes
- [x] **Delta table** — ComparisonTable showing drop/drift/velocity/energy deltas with color-coded advantage indicators

### 🧪 5.5 Testing
- [x] **17 advanced ballistics tests** — Density altitude, station pressure, altitude MV correction, Coriolis, aerodynamic jump, angle shooting
- [x] **102 total tests passing** — 45 external + 37 internal + 20 load development

---

## 🔜 Phase 6 — Rifle & Optic Integration

> *Twist rate. Scope turret matching. DOPE cards.*

### 🔫 6.1 Rifle Profiles
- [x] **Rifle database** — Save rifle configs to localStorage: cartridge, bullet, barrel length, twist rate, sight height, scope profile
  > *Completed in v0.8.0 — RifleProfileManager component with save/load/delete, localStorage persistence layer*
- [x] **Twist rate stability** — Miller stability factor with altitude/temp corrections, color-coded rating, twist rate recommendations (StabilityPanel UI)
  > *Cherry-picked in v0.5.1 — pure math + UI, no persistence dependencies*
- [ ] **Barrel life tracking** — Round count, accuracy degradation estimates
- [x] **Multiple rifle support** — Switch between saved rifles via dropdown in control panel
  > *Completed in v0.8.0 — RifleProfileManager loads full config (cartridge, bullet, velocity, zero, barrel, scope) from saved profiles*

### 🔭 6.2 Optic Integration
- [x] **Turret matching** — TurretMatchTable with drop/drift clicks, cumulative elevation tracking, scope travel warnings
  > *Completed in v0.7.0 — scope profile system with 6 presets (Vortex Razor, Nightforce ATACR, etc.), MIL/MOA toggle, 50/100yd increments*
- [x] **Custom turret builder** — CustomTurretDial SVG generator with range-marked dial, printable, configurable max range
  > *Completed in v0.7.0 — angular mapping of elevation clicks to range labels, print-optimized SVG*
- [x] **BDC reticle overlay** — BDCOverlay comparing BDC dot actual vs intended ranges with error color-coding
  > *Completed in v0.7.0 — 3 built-in reticles (Vortex Dead-Hold, Nikon BDC 600, Burris Ballistic Plex), interpolated range matching*
- [x] **First focal plane vs. second** — SFP holdover correction at non-calibrated magnification, integrated into scope config + turret table
  > *Completed in v0.7.0 — sfpHoldoverCorrection() function, magnification slider for SFP scopes*

### 📋 6.3 DOPE Cards
- [x] **Auto-generated DOPE cards** — Print-ready range cards with @media print CSS, 100-yard increments, drop/drift/velocity/energy (DOPECard UI)
  > *Cherry-picked in v0.5.1 — pure UI component using existing trajectory data*
- [x] **Multiple zero cards** — MultiZeroDOPE component with up to 4 altitude/temp scenarios, recomputed trajectories, Print All
  > *Completed in v0.6.0 — editable scenario labels, altitude, temperature per card*
- [x] **Arm band format** — ArmBandDOPE compact strip for PRS/NRL competition (200px wide, 50-yard increments, 10mph wind holds)
  > *Completed in v0.6.0 — printable wrist card format with date stamp*
- [ ] **QR code cards** — Scan to load exact setup in BulletForge

---

## 💡 Phase 7 — Chronograph Calibration & Learning

> *Same killer concept from StringForge. Feed real data back in. The model gets smarter.*

### 📟 7.1 Chronograph Input
- [x] **Chrono data entry** — Enter shot strings with auto average, ES, SD
  > *Completed in v0.8.0 (PerformanceTracker) and v0.9.0 (ChronoImport CSV parser)*
- [x] **CSV import** — LabRadar Report CSV and MagnetoSpeed LOG.CSV auto-detection and parsing
  > *Completed in v0.9.0 — ChronoImport component with format auto-detect, multi-series support, save to performance log*
- [x] **Multi-session tracking** — Log multiple range sessions per load
  > *Completed in v0.8.0 — PerformanceTracker with localStorage persistence, filtered by load combo*
- [x] **Device tags** — LabRadar, MagnetoSpeed, Caldwell, Garmin Xero C1
  > *Completed in v0.9.0 — device field on ChronoReference, auto-detected from CSV format*
- [ ] **Setup snapshot** — Freeze full config at time of entry

### 📊 7.2 Predicted vs. Actual
- [x] **Velocity delta** — Predicted MV vs. actual MV, % error
  > *Completed in v0.9.0 — ChronoImport reference comparison with color-coded delta (green <25fps, yellow <50, red >50)*
- [ ] **Trajectory verification** — Enter actual drops at distance, compare to model
- [x] **BC refinement** — `refineBCFromVelocity()` RK4 binary search truing from two velocity measurements (BCTruingCalculator UI)
  > *Cherry-picked in v0.5.1 — pure math engine function + self-contained UI calculator*
- [ ] **Environmental correlation** — Track how temp/altitude affect your specific load

### 🧠 7.3 Personal Calibration
- [ ] **BC correction factor** — Auto-calculate true BC from chrono data
- [ ] **Load-specific profiles** — Each load recipe gets its own calibration
- [ ] **Confidence scoring** — `± X fps` uncertainty band that tightens with data
- [ ] **Seasonal tracking** — How does this load perform summer vs. winter?

### 🌐 7.4 Community Learning *(requires backend)*
- [ ] **Anonymous aggregation** — Opt-in upload of load data + chrono results
- [ ] **Crowd-sourced BCs** — True BCs from thousands of users vs. manufacturer claims
- [ ] **Powder lot variation** — Track velocity differences between powder lots
- [ ] **"Real world" comparisons** — _"142gr SMK: published G7 BC 0.264, community-measured 0.259"_
- [ ] **Load recipe sharing** — Browse proven loads from the community

---

## 🔮 Phase 8 — BulletForge API

> *The ballistics engine as a service. Pro shops, apps, and manufacturers plug in.*

### ⚙️ 8.1 Core API
- [ ] **REST API** — Supabase Edge Functions or Express/Fastify
- [ ] **`POST /trajectory`** — Full ballistic solution from config
- [ ] **`POST /internal`** — Chamber pressure simulation (Phase 3)
- [ ] **`POST /stability`** — Twist rate / stability factor
- [ ] **`GET /cartridges`** — Filterable cartridge database
- [ ] **`GET /bullets`** — Filterable bullet database with true BCs
- [ ] **`GET /powders`** — Powder database with burn rates, temp sensitivity
- [ ] **API keys** — Free tier (100 req/day), Pro tier (unlimited)
- [ ] **OpenAPI docs** — Interactive Swagger documentation

### 📡 8.2 Calibration API
- [ ] **`POST /chrono`** — Submit chronograph data
- [ ] **`GET /truebc/{bullet}`** — Community-measured BC for a bullet
- [ ] **`GET /loads/{cartridge}`** — Proven load recipes for a cartridge
- [ ] **Supabase backend** — Postgres for load data, chrono submissions, calibration

### 🏪 8.3 Retail & Shop Integrations
- [ ] **Reloading shop widget** — Embeddable calculator for retail sites
- [ ] **Component finder** — _"Find this powder near you"_ with shop inventory APIs
- [ ] **Affiliate links** — Midway USA, Brownells, Graf & Sons product links → revenue 💸
- [ ] **Gunsmith dashboard** — Load development tracking for customer rifles

### 📱 8.4 Device Integrations
- [ ] **LabRadar Bluetooth** — Direct sync from LabRadar chronograph
- [ ] **MagnetoSpeed sync** — Pull data from MagnetoSpeed app
- [ ] **Garmin Xero C1** — Garmin Connect API integration
- [ ] **Kestrel weather** — Pull environmental data from Kestrel meters
- [ ] **React Native app** — Native mobile app for the range

### 🤝 8.5 Manufacturer Partnerships
- [ ] **Bullet maker data** — Official BCs from Sierra, Hornady, Berger in exchange for "Verified" badges
- [ ] **Powder data** — Official burn rate data from Hodgdon, Alliant, Vihtavuori
- [ ] **Montana Rifle Co.** — Validation partnership: test data from MRC rifles for model accuracy
- [ ] **Embedded calculators** — Manufacturers embed BulletForge on product pages
- [ ] **Barrel maker integration** — Krieger, Bartlein, Proof Research twist rate recommendations

### 🤖 8.6 Advanced Analytics & ML
- [x] **Training data ingestion pipeline** — GRT XML parser (`scripts/parse-grt.mjs`) → normalized JSON corpus, typed TS query utilities, 115 records (48 projectiles, 12 powders, 48 calibers, 7 loads)
- [ ] **True BC prediction** — ML model trained on community chrono data
- [ ] **Load optimization AI** — Suggest optimal charge/seating for a given goal (accuracy vs. velocity)
- [ ] **Barrel life prediction** — Model accuracy degradation from round count + cartridge heat
- [ ] **Component substitution** — _"H4350 out of stock? Try Reloder 16: similar burn rate, 12 fps slower"_

---

## 📣 Phase 9 — Marketing & Monetization

> *The gun crowd spends money. They buy $3,000 scopes and $600 worth of brass. A good tool is worth paying for.*

### 📣 9.1 Marketing Push
- [ ] **Reddit** — r/longrange (~180k), r/reloading (~130k), r/guns (~2.5M), r/PRS, r/NRLhunter
- [ ] **Sniper's Hide** — The #1 long-range shooting forum. Technical crowd. Post in Reloading section.
- [ ] **6.5 Guys mention** — Ryan Cleckner's audience is the exact target market
- [ ] **YouTube demo** — Screen recording with a real load workup
- [ ] **PRS/NRL competition circles** — These shooters LIVE in ballistic calculators
- [ ] **Rokslide** — Western hunting forum, long-range hunting crowd

### 💰 9.2 Monetization
- [ ] **Free tier** — Full external ballistics, basic trajectory, limited saves
- [ ] **Pro tier ($5/mo or $40/yr)** — Internal ballistics, load logbook, unlimited saves, DOPE cards, comparison mode, custom turrets
- [ ] **Stripe integration** — Payment processing
- [ ] **Ko-fi / Patreon** — Donation option for those who want to support
- [ ] **Affiliate revenue** — Midway USA, Brownells, Graf & Sons component links
- [ ] **API access** — Pro tier includes API access for custom integrations

### 🏆 9.3 Competitive Advantages
- [ ] **Free & browser-based** — QuickLOAD is $150 desktop. Applied Ballistics is $30 mobile. We're free in your browser.
- [ ] **Modern UI** — Nobody else has a modern, dark-themed, responsive interface
- [ ] **Community data** — Crowd-sourced true BCs and load recipes don't exist anywhere else
- [ ] **Chrono integration** — Automatic model improvement from real-world data
- [ ] **Open platform** — API access means anyone can build on top of BulletForge

---

## 📚 Docs & Education *(v0.5.2 stubs → v0.9.2 built out)*

> *Accessible from the hamburger settings menu. Full modal panels with tabbed content.*

### 📖 Docs
- [x] **Getting started** — Quick walkthrough of the three tabs, rifle profiles, sharing
- [x] **Engine details** — RK4 solver, drag models, atmospheric modeling, advanced corrections
- [x] **Data sources** — Cartridge/bullet/powder provenance, ML training corpus, chrono reference data
- [x] **Keyboard & tips** — Print, URL sharing, comparison mode, chrono import, themes
- [ ] **API reference** — When Phase 8 API ships, document endpoints here

### 🎓 Education
- [x] **Cartridge guide** — All 15 cartridges with purpose, history, specs, and use-case tags
- [x] **Safari & dangerous game** — Cartridge selection guide, species quick-reference table (Cape buffalo through impala), minimum legal calibers, bullet recommendations, MRC Tsavo callout
- [x] **Ballistics 101** — BC explained, zero range, internal ballistics, density altitude, wind
- [x] **Reloading safety** — Cardinal rules, pressure signs, BulletForge limitations disclaimer, essential equipment
- [ ] **Long-range shooting** — Coriolis, density altitude, spin drift — when they matter and when they don't
- [ ] **Load development guide** — Ladder tests, OCW, seating depth methodology walkthrough

### 📘 Glossary
- [x] **Full glossary** — 53 terms across 7 categories (External Ballistics, Internal Ballistics, Cartridge & Bullet, Optics & Sighting, Reloading, Measurement & Units, Safety), searchable with category filters and abbreviation badges

---

## 📈 Stats

> **Test Suite:** 111 unit tests (Vitest) — 54 external + 37 internal ballistics + 20 load development

> **Stack:** React 19 · TypeScript · Vite · Zustand · Tailwind v4 · RK4 Ballistics Engine

> **Infra:** GitHub Actions CI/CD · FTPS deploy · St. Clair Hosting · Let's Encrypt · Plausible · Sentry

---

## 🔢 Reference Values

| Scenario | Expected |
|----------|----------|
| 6.5 CM 140gr ELD-M @ 2700fps, 100yd zero | ~-36" drop at 500yds |
| .308 Win 175gr SMK @ 2600fps | Transonic ~1000yds |
| .300 WM 190gr Berger VLD @ 2950fps | ~2,500+ ft-lbs at muzzle |
| .338 Lapua 300gr SMK @ 2700fps | Supersonic past 1500yds |
| .22 LR 40gr @ 1050fps | Subsonic at muzzle |
| KE formula | (m·v²) / 450,436 ft-lbs |
| Momentum formula | (m·v) / 225,218 lb·s |
| Standard atmosphere | 59°F, 29.92 inHg, 0ft, 78% humidity |
