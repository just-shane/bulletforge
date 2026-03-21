# 🔴 BulletForge — Roadmap

### Ballistics & reloading simulator. In your browser. No $150 desktop app required.

> **Coming soon:** [https://bulletforge.io](https://bulletforge.io)
> For reloaders, long-range shooters, and gunsmiths who want real physics — not guesswork.

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
- [ ] **Optimal barrel length** — Point of diminishing returns for a given cartridge (UI)
- [ ] **Compensator/brake effects** — Backpressure modeling for muzzle devices

### 🌡️ 3.3 Temperature Sensitivity
- [ ] **Powder temp modeling** — Velocity shift per degree F for each powder
- [ ] **Hot/cold load comparison** — Side-by-side: same load at 20°F vs. 100°F
- [x] **Temp-stable powder recommendations** — Powder database has temp sensitivity ratings

### 📊 3.4 Visualization & UI
- [x] **Pressure curve chart** — SVG: pressure vs. barrel travel with SAAMI max line, peak marker, burn complete marker
- [x] **Internal ballistics tab** — Tabbed UI: External / Internal with shared cartridge/bullet selection
- [x] **Stats dashboard** — Predicted MV, peak pressure, SAAMI %, efficiency, fill ratio, barrel time
- [x] **Safety disclaimer** — Contextual warning on every internal ballistics view
- [ ] **Burn rate comparison** — Overlay multiple powders for same cartridge
- [ ] **Safe load indicator** — Green/yellow/red zone visual for charge weight slider

### 🗄️ 3.5 Databases
- [x] **22 powder internal profiles** — Burn rate coefficients, pressure exponents, flame temps, densities, form factors
- [x] **15 cartridge internal profiles** — Case capacities, bore areas, freebore, shot start pressures, charge ranges
- [x] **`buildConfig()` convenience** — Assemble full config from cartridge + powder + bullet names

### 🧪 3.6 Testing
- [x] **25 internal ballistics tests** — Database integrity, simulation fundamentals, known load validation, barrel length effects, safety features, physics sanity checks
- [x] **53 total tests passing** — 28 external + 25 internal

---

## 🔜 Phase 4 — Load Development Tools

> *Ladder tests. OCW. Seating depth. The stuff reloaders actually do at the bench.*

### 📐 4.1 Ladder Test Planner
- [ ] **Charge weight ladder** — Auto-generate test plan: start charge → max charge in 0.3gr steps
- [ ] **Velocity plateau detection** — Input chrono data, find the flat spot (velocity node)
- [ ] **ES/SD calculator** — Extreme spread and standard deviation from shot strings
- [ ] **Round count estimator** — How many rounds needed for the test, component cost estimate

### 🎯 4.2 Seating Depth Optimizer
- [ ] **COAL/CBTO calculator** — Cartridge overall length and base-to-ogive
- [ ] **Jump-to-lands table** — Generate test plan from jam → 0.020" → 0.040" → 0.060" off
- [ ] **Ogive profile data** — Secant vs. tangent ogive behavior differences
- [ ] **Magazine length check** — Warning when COAL exceeds magazine box length

### 📊 4.3 Optimal Charge Weight (OCW)
- [ ] **OCW methodology** — Dan Newberry's method with step-by-step guide
- [ ] **Group analysis** — Input group sizes at each charge weight, find the sweet spot
- [ ] **POI shift tracking** — Plot point-of-impact shift across charge weights

### 📋 4.4 Load Logbook
- [ ] **Load recipes** — Save complete load data: cartridge, brass, primer, powder, charge, bullet, COAL, velocity
- [ ] **Session notes** — Date, range, conditions, rifle, barrel round count
- [ ] **Performance tracking** — ES/SD trends over time for a given load
- [ ] **Export/share** — Print-friendly load cards, share links

---

## 🔜 Phase 5 — Advanced Ballistics

> *Coriolis. Spin drift. Density altitude. The stuff that matters past 600 yards.*

### 🌍 5.1 Long-Range Corrections
- [ ] **Coriolis effect** — Latitude and azimuth-dependent drift (matters at 800+ yards)
- [ ] **Aerodynamic jump** — Crosswind-induced vertical shift
- [ ] **Magnus effect** — Spin-induced drift in crosswind
- [ ] **Eötvös effect** — Earth rotation velocity correction for extreme range

### 🏔️ 5.2 Environment
- [ ] **Density altitude calculator** — Single number that captures all atmospheric effects
- [ ] **Station pressure vs. absolute** — Proper conversion for altitude
- [ ] **Weather API integration** — Pull current conditions from GPS/location (optional)
- [ ] **Altitude velocity correction** — Auto-adjust MV for shooting altitude

### 📐 5.3 Angle Shooting
- [ ] **Improved angle correction** — Rifleman's rule with cosine indicator
- [ ] **Uphill vs. downhill** — Separate calculations showing it's the same correction
- [ ] **Steep angle warnings** — Alert when cosine error becomes significant

### 🔄 5.4 Comparison Mode
- [ ] **Side-by-side loads** — Compare two complete setups: cartridge, bullet, velocity, trajectory
- [ ] **Overlay trajectories** — Same chart, two curves, different colors
- [ ] **Delta table** — Show differences in drop, drift, energy at each range

---

## 🔜 Phase 6 — Rifle & Optic Integration

> *Twist rate. Scope turret matching. DOPE cards.*

### 🔫 6.1 Rifle Profiles
- [ ] **Rifle database** — Save rifle configs: caliber, barrel length, twist rate, sight height
- [ ] **Twist rate stability** — Miller/Greenhill stability factor calculator
- [ ] **Barrel life tracking** — Round count, accuracy degradation estimates
- [ ] **Multiple rifle support** — Switch between saved rifles

### 🔭 6.2 Optic Integration
- [ ] **Turret matching** — MOA or MIL adjustments matched to your scope's click value
- [ ] **Custom turret builder** — Generate custom turret dial markings for your load
- [ ] **BDC reticle overlay** — Show where your BDC dots actually land with your load (vs. manufacturer's assumption)
- [ ] **First focal plane vs. second** — Magnification-dependent holdover for SFP scopes

### 📋 6.3 DOPE Cards
- [ ] **Auto-generated DOPE cards** — Print-ready range cards with drop/wind at key distances
- [ ] **Multiple zero cards** — Different altitude/temp DOPE for travel
- [ ] **Arm band format** — Compact format for PRS/NRL competition
- [ ] **QR code cards** — Scan to load exact setup in BulletForge

---

## 💡 Phase 7 — Chronograph Calibration & Learning

> *Same killer concept from StringForge. Feed real data back in. The model gets smarter.*

### 📟 7.1 Chronograph Input
- [ ] **Chrono data entry** — Enter shot strings with auto average, ES, SD
- [ ] **Multi-session tracking** — Log multiple range sessions per load
- [ ] **Device tags** — LabRadar, MagnetoSpeed, Caldwell, Garmin Xero C1
- [ ] **Setup snapshot** — Freeze full config at time of entry

### 📊 7.2 Predicted vs. Actual
- [ ] **Velocity delta** — Predicted MV vs. actual MV, % error
- [ ] **Trajectory verification** — Enter actual drops at distance, compare to model
- [ ] **BC refinement** — Back-calculate actual BC from velocity at two distances (truing)
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

## 📈 Stats

> **Test Suite:** 53 unit tests (Vitest) — 28 external + 25 internal ballistics

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
