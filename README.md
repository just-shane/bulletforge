# 🔴 BulletForge

### Ballistics & reloading simulator. In your browser. No $150 desktop app.

> **Coming soon:** [https://bulletforge.io](https://bulletforge.io)
> For reloaders, long-range shooters, and gunsmiths who want real physics — not a spreadsheet.

<p align="center">
  <strong>v0.1.0</strong> &nbsp;&middot;&nbsp; React 19 + TypeScript &nbsp;&middot;&nbsp; Vite &nbsp;&middot;&nbsp; Zustand &nbsp;&middot;&nbsp; Tailwind v4<br/>
  <em>28 tests passing &nbsp;&middot;&nbsp; RK4 ballistics engine &nbsp;&middot;&nbsp; G1 & G7 drag models</em>
</p>

---

## What Is This?

BulletForge is a browser-based ballistics calculator and reloading simulator built for people who care about the **math behind the shot**. Not a toy. Not a lookup table. A real physics engine running in your browser.

Dial in your cartridge, bullet, velocity, zero, wind, and environment. Get a full trajectory solution — drop in inches, MOA, and MILs — from the muzzle to past transonic. Every slider recalculates instantly via 4th-order Runge-Kutta integration with real drag models.

QuickLOAD costs $150 and looks like Windows 98. Applied Ballistics costs $30 and lives on your phone. BulletForge is **free**, runs **everywhere**, and gets **smarter** over time.

---

## ⚡ At a Glance

| | |
|---|---|
| 🎯 **RK4 Ballistics Engine** | 4th-order Runge-Kutta integration — accurate past 1500 yards |
| 📊 **G1 & G7 Drag Models** | Full Cd vs. Mach lookup tables with linear interpolation |
| 🌡️ **Atmospheric Modeling** | Air density from altitude, temp, pressure, humidity (Army Metro) |
| 💨 **Wind & Spin Drift** | Full crosswind decomposition + Litz spin drift formula |
| 🔫 **15 Cartridges** | .22 LR through .50 BMG — SAAMI specs, typical loads |
| 🎯 **60+ Bullets** | Sierra, Hornady, Berger, Nosler — real G1/G7 BCs |
| 🧪 **25 Powders** | Hodgdon, Alliant, Vihtavuori, IMR — burn rates & temp sensitivity |

---

## 🔬 The Physics

This isn't your uncle's drop chart taped to the stock. Every number comes from real models.

### External Ballistics — RK4 Integration
```
F_drag = ½ × ρ × v² × Cd(Mach) × A
```
4th-order Runge-Kutta numerical integration — not Euler. Drag coefficient interpolated from standard G1/G7 tables at the bullet's current Mach number. This matters past 600 yards where Euler solutions start drifting.

### Atmospheric Density
```
ρ = (P × M_dry) / (R × T) × [1 - (0.3783 × e/P)]
```
Full Army Metro atmospheric model. Air density calculated from station pressure, temperature, and humidity. Speed of sound varies with temperature: `a = 49.0223 × √(T_rankine)`. Mach number updates every integration step.

### Kinetic Energy & Momentum
```
KE = (m × v²) / 450,436     [ft-lbs, with grains and fps]
p  = (m × v) / 225,218      [lb·s]
```
Calculated at every range increment. See exactly where your bullet drops below ethical hunting thresholds.

### Wind Drift
```
drift = wind_speed × sin(wind_angle) × [TOF - range/v₀]
```
Full decomposition: crosswind component drives lateral drift, headwind/tailwind affects velocity. Wind angle from 0° (headwind) through 90° (full cross) to 180° (tailwind).

### Spin Drift (Litz)
```
d_spin = 1.25 × (SG + 1.2) × TOF^1.83
```
Bryan Litz's empirical spin drift formula. Small at 400 yards, significant past 800. Included in every solution.

### Reference Benchmarks

| Scenario | Expected |
|----------|----------|
| 6.5 CM 140gr ELD-M @ 2700fps, 100yd zero | ~-36" at 500yds, transonic ~1200yds |
| .308 Win 175gr SMK @ 2600fps | Transonic ~1000yds |
| .300 WM 190gr VLD @ 2950fps | ~2,500 ft-lbs at muzzle |
| .338 Lapua 300gr @ 2700fps | Supersonic past 1500yds |
| Standard atmosphere | 59°F, 29.92 inHg, 0ft, 78% humidity |

---

## 🧰 Feature Breakdown

### 🎯 Trajectory Solution
- **Full ballistic table** — Range, drop (in/MOA/MIL), drift (in/MOA/MIL), velocity, energy, TOF, momentum
- **Every 25 yards** to 1500+ yards — not just the convenient round numbers
- **SVG trajectory chart** — Bullet path with zero crossing, gridlines, and transonic marker
- **Zero range highlighting** — Visual callout at your zero distance
- **Transonic warning** — Know exactly where your bullet goes subsonic

### 🔫 Cartridge & Bullet Selection
- **15 cartridges** — .22 LR, .223 Rem, 6mm ARC, .243 Win, 6.5 CM, 6.5 PRC, .270 Win, 7mm Rem Mag, .308 Win, .30-06, .300 WM, .300 PRC, .338 Lapua, .375 H&H, .50 BMG
- **60+ bullets** — Sierra MatchKing, Hornady ELD-X/ELD-M, Berger VLD/Hybrid, Nosler AccuBond/Partition
- **Auto-filter** — Select a cartridge, see only compatible bullets
- **BC display** — G1 and G7 BCs shown with sectional density

### 🌡️ Environmental Controls
- **Altitude** — 0 to 15,000 ft — affects air density and speed of sound
- **Temperature** — -20°F to 120°F — affects air density, powder temp, and Mach
- **Barometric pressure** — 25–32 inHg — station pressure for your location
- **Density altitude** — The single number that captures it all (coming soon)

### 💨 Wind
- **Wind speed** — 0–30 mph with full crosswind decomposition
- **Wind angle** — 0–360° — headwind, quartering, full cross, tailwind
- **Drift in MOA and MIL** — Matches your turret adjustments

### 🧪 Powder Database
- **25 powders** — Hodgdon, Alliant, Vihtavuori, IMR
- **Relative burn rates** — Compare powders at a glance
- **Temperature sensitivity** — Know which powders shift with the weather
- **Future:** Internal ballistics with chamber pressure simulation

---

## 🗄️ Databases

### Cartridges
| Cartridge | Caliber | Max Pressure | Typical Load |
|-----------|---------|-------------|--------------|
| .22 LR | .224" | 24,000 psi | 40gr @ 1050fps |
| .223 Remington | .224" | 55,000 psi | 55gr @ 3240fps |
| 6.5 Creedmoor | .264" | 62,000 psi | 140gr @ 2700fps |
| .308 Winchester | .308" | 62,000 psi | 175gr @ 2600fps |
| .300 Win Mag | .308" | 64,000 psi | 190gr @ 2900fps |
| .338 Lapua | .338" | 61,000 psi | 300gr @ 2700fps |
| .50 BMG | .510" | 55,000 psi | 750gr @ 2800fps |
| + 8 more | | | |

### Bullets by Manufacturer
| Manufacturer | Calibers | Types | Count |
|-------------|----------|-------|-------|
| 🟢 **Sierra** | .224–.338 | MatchKing (SMK), GameKing | 15+ |
| 🔴 **Hornady** | .224–.338 | ELD-X, ELD-M, A-MAX, V-MAX | 15+ |
| 🟡 **Berger** | .224–.308 | VLD Hunting, Hybrid Target, OTM | 15+ |
| 🔵 **Nosler** | .224–.338 | AccuBond, Partition, RDF, ABLR | 15+ |

### Powders
| Manufacturer | Powders | Best Known For |
|-------------|---------|----------------|
| **Hodgdon** | H4350, Varget, H4831, Retumbo, H1000, H110, H335, BL-C(2), CFE 223 | 6.5 CM (H4350), .308 (Varget) |
| **Alliant** | Reloder 16, 22, 26, Power Pro 2000-MR | Long-range precision |
| **Vihtavuori** | N140, N150, N160, N165, N550, N570 | Temperature stability |
| **IMR** | 4064, 4166, 4350, 4831, 7828 | Classic rifle powders |

---

## 🛠️ Tech Stack

| Layer | Tech |
|-------|------|
| ⚛️ UI | React 19 + TypeScript (strict) |
| ⚡ Build | Vite — sub-second HMR, tree-shaken production builds |
| 🧠 State | Zustand — single store, reactive trajectory recalculation |
| 🎨 Styling | Tailwind CSS v4 — dark theme, mono data display |
| 📐 Charts | Pure inline SVG — scales perfectly, razor sharp |
| 🔬 Physics | RK4 integration, G1/G7 drag tables, atmospheric modeling |
| 🧪 Tests | Vitest — 28 tests covering ballistics accuracy |
| 🔄 CI/CD | GitHub Actions (coming soon) |
| 📱 PWA | Coming soon — installable, works offline at the reloading bench |

---

## 🚀 Quick Start

```bash
git clone https://github.com/just-shane/bulletforge.git
cd bulletforge
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and start calculating.

### Commands

```bash
npm run dev         # Development server with HMR
npm run build       # Production build (99KB gzipped)
npm run preview     # Preview production build
npm run test        # Run 28 unit tests
npm run lint        # ESLint check
```

---

## 📁 Project Structure

```
src/
├── lib/
│   ├── ballistics.ts       # RK4 engine — G1/G7 drag, atmosphere, wind, spin drift
│   ├── cartridges.ts       # 15 cartridges with SAAMI specs
│   ├── bullets.ts          # 60+ bullets — Sierra, Hornady, Berger, Nosler
│   ├── powders.ts          # 25 powders — burn rates, temp sensitivity
│   └── version.ts          # App version single source of truth
├── components/
│   ├── Layout/
│   │   └── Header.tsx      # BF logo, title, nav buttons
│   ├── ControlPanel/
│   │   ├── ControlPanel.tsx # Cartridge, bullet, velocity, wind, environment
│   │   └── Slider.tsx      # Reusable slider component
│   ├── StatsBar/
│   │   └── StatsBar.tsx    # Muzzle velocity, energy, zero, transonic range
│   └── Trajectory/
│       ├── TrajectoryChart.tsx  # SVG bullet path visualization
│       └── TrajectoryTable.tsx  # Full ballistic data table
├── store/
│   └── store.ts            # Zustand store — all ballistic parameters + results
├── __tests__/
│   └── ballistics.test.ts  # 28 tests — KE, drag, atmosphere, trajectory accuracy
├── App.tsx                 # Root layout — header, stats, controls, trajectory
├── main.tsx                # Entry — Sentry, Plausible, ErrorBoundary
└── index.css               # Tailwind v4 import
```

---

## 🗺️ Roadmap

See [TODO.md](TODO.md) for the full 9-phase roadmap, including:

| Phase | What |
|-------|------|
| ✅ 1 | External ballistics engine, trajectory table, databases |
| 🔜 2 | Logo, CI/CD, deploy to bulletforge.io |
| 🔜 3 | **Internal ballistics** — chamber pressure simulation (QuickLOAD killer) |
| 🔜 4 | Load development tools — ladder tests, OCW, seating depth |
| 🔜 5 | Advanced ballistics — Coriolis, aerodynamic jump, density altitude |
| 🔜 6 | Rifle & optic integration — DOPE cards, custom turrets, twist rate |
| 💡 7 | Chronograph calibration — feed real data, model gets smarter |
| 🔮 8 | BulletForge API — physics engine as a service |
| 📣 9 | Marketing & monetization — r/longrange, Sniper's Hide, PRS crowd |

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/my-thing`)
3. Write tests for new physics or UI features
4. Make sure all tests pass (`npm run test`)
5. Open a PR with a clear description

---

## 📄 License

MIT — do what you want, just don't blame us for your load data.

---

<p align="center">
  <strong>Built with 🔴 by BulletForge.io</strong><br/>
  <em>Because if you can't calculate it, you can't repeat it.</em>
</p>
