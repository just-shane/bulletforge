# BulletForge Testing Guide

This document describes the testing strategy, structure, and conventions for BulletForge — a ballistic calculator and load development app built with Preact + Vite.

---

## Quick Start

```bash
npx vitest run          # run all tests (single pass)
npx vitest              # watch mode during development
npx vitest run --reporter=verbose   # see every test name
```

---

## Test Suite Overview

BulletForge uses **Vitest** with the `jsdom` environment for all tests. Tests live in `src/__tests__/` and cover the core computation libraries and storage layer.

| File | Tests | What it covers |
|------|-------|----------------|
| `ballistics.test.ts` | 54 | External ballistics engine — trajectory, KE, momentum, air density, drag interpolation, Coriolis, aero jump, angle shooting, Miller stability, BC refinement |
| `internal-ballistics.test.ts` | 37 | Internal ballistics simulation — chamber pressure curves, barrel length effects, powder database integrity, temperature sensitivity, safety limits |
| `load-development.test.ts` | 20 | Load development tools — ES/SD calculator, ladder test planner, seating depth optimizer, OCW analysis, load recipes, primer database |
| `powders.test.ts` | 30 | Powder database integrity, burn rate sorting, manufacturer filtering, powder substitution scoring, barrel life estimation, barrel condition assessment |
| `storage.test.ts` | 35 | localStorage persistence layer — CRUD for rifle profiles, performance records, load calibrations; edge cases (corrupted data, upserts, filtering) |
| **Total** | **176** | |

---

## Test Architecture

### What We Test

BulletForge is a **computation-heavy frontend app**. The testing strategy prioritizes:

1. **Physics engine correctness** — Trajectory calculations, ballistic coefficients, atmospheric models, and drag functions must produce accurate results. These are validated against published ballistic tables and known-good reference data.

2. **Data integrity** — The powder database, cartridge data, and primer database must be consistent (no duplicates, valid fields, complete coverage).

3. **Algorithm correctness** — Scoring algorithms (powder substitution), estimation models (barrel life), and statistical functions (ES/SD) must behave predictably across edge cases.

4. **Storage reliability** — The localStorage persistence layer must handle CRUD operations, upserts, corrupted data, and cross-collection independence correctly.

### What We Don't Test (Yet)

- **Component rendering** — UI components use Preact with Zustand. Component tests would require `@testing-library/preact` and are a future addition.
- **E2E flows** — No Playwright/Cypress tests yet. The app is a single-page calculator; manual testing covers the critical paths during development.
- **Visual regression** — Not yet implemented. The theming system (CSS custom properties) would benefit from screenshot testing.

---

## Test Conventions

### File Organization

```
src/
├── __tests__/
│   ├── ballistics.test.ts          ← tests for src/lib/ballistics.ts
│   ├── internal-ballistics.test.ts ← tests for src/lib/internal-ballistics.ts
│   ├── load-development.test.ts    ← tests for src/lib/load-development.ts
│   ├── powders.test.ts             ← tests for src/lib/powders.ts
│   └── storage.test.ts             ← tests for src/lib/storage.ts
├── lib/
│   ├── ballistics.ts
│   ├── internal-ballistics.ts
│   ├── load-development.ts
│   ├── powders.ts
│   └── storage.ts
```

### Naming Pattern

Each test file mirrors a source file in `src/lib/`. Tests are grouped with `describe()` blocks matching the exported function or concept:

```ts
describe("trajectory", () => {
  it("6.5 CM 140gr at 2710fps drops ~35 inches at 300yd", () => { ... });
});
```

### Assertion Style

- **Physics values**: Use `toBeCloseTo(expected, precision)` — ballistic calculations have acceptable tolerance ranges
- **Database checks**: Use `toBeGreaterThanOrEqual()` for minimum counts, `toContain()` for enum validation
- **Exact values**: Use `toBe()` for strings, booleans, and exact numeric lookups
- **Ranges**: Chain `toBeGreaterThan()` / `toBeLessThan()` for sanity bounds

### Test Data

- Real-world ballistic data is used wherever possible (6.5 CM 140gr ELD-M, .308 Win 175gr SMK, .223 Rem 77gr TMK)
- Atmospheric defaults: 59°F, 29.92" Hg, 0% humidity, sea level (ICAO standard atmosphere)
- Factory helpers (`makeRifle()`, `makeRecord()`, `makeCalibration()`) in storage tests ensure consistent test data

---

## Coverage Map

### External Ballistics (`ballistics.test.ts`)

| Function | Tests | Key validations |
|----------|-------|-----------------|
| `kineticEnergy` | 3 | Known .308 value, zero-mass edge case, lightweight .22 LR |
| `momentum` | 2 | Standard computation, zero velocity |
| `speedOfSound` | 3 | Standard atmosphere, cold/hot extremes |
| `airDensity` | 3 | Standard conditions, high altitude, humidity effects |
| `interpolateCd` | 4 | Below/above table, mid-range interpolation, Mach transitions |
| `trajectory` | 16 | Zero crossing, drop at distance, multi-cartridge validation, wind deflection, spin drift, extreme range, time of flight |
| `densityAltitude` | 3 | Sea level baseline, Denver high altitude, cold dense air |
| `stationPressure` | 2 | Sea level identity, altitude reduction |
| `altitudeVelocity` | 2 | Sea level baseline, high altitude velocity gain |
| `coriolisDeflection` | 3 | Equator (zero), mid-latitude, direction sign |
| `aerodynamicJump` | 2 | Standard crosswind jump, zero-wind (no jump) |
| `angleShootingCosine` | 3 | Level (1.0), 30° up, 45° down |
| `millerStability` | 3 | 6.5mm stable, .30-cal marginal, fast twist over-stable |
| `refineBCFromVelocity` | 5 | Standard refinement, velocity loss bounds, multiple BCs |

### Internal Ballistics (`internal-ballistics.test.ts`)

| Area | Tests | Key validations |
|------|-------|-----------------|
| Database integrity | 5 | Minimum load count, required fields, no duplicates, cartridge coverage |
| Simulation fundamentals | 8 | Pressure curves, peak timing, realistic velocity, energy conservation |
| Known load validation | 6 | .223 Rem, 6.5 CM, .308 Win against published data |
| Barrel length effects | 5 | Longer = more velocity, short barrel penalty, diminishing returns |
| Safety | 6 | Over-max pressure warnings, pressure signs, safe operating margins |
| Temperature sensitivity | 4 | Cold/hot velocity shifts, pressure variation |

### Load Development (`load-development.test.ts`)

| Function | Tests | Key validations |
|----------|-------|-----------------|
| ES/SD calculator | 4 | Known velocity strings, single shot (SD=0), large spreads |
| Ladder test planner | 4 | Step generation, charge weight ranges, count accuracy |
| Seating depth | 3 | COAL calculations, jump/jam distances, ogive measurements |
| OCW analysis | 4 | Node detection, plateau identification, optimal charge selection |
| Load recipe | 3 | Recipe generation, component lists, safety notes |
| Primers | 2 | Database integrity, coverage of standard/magnum types |

### Powders (`powders.test.ts`)

| Function | Tests | Key validations |
|----------|-------|-----------------|
| POWDERS database | 4 | Minimum count, valid fields, no duplicates, manufacturer diversity |
| `powdersByBurnRate` | 2 | Sort order (fastest→slowest), complete coverage |
| `powdersByManufacturer` | 2 | Correct filtering, empty result for unknown |
| `findSimilarPowders` | 11 | Substitution scoring, burn rate proximity, temp sensitivity boost, type filtering, limit parameter, assessment strings, delta accuracy |
| `estimateBarrelLife` | 4 | Known cartridges positive, .22 LR longest, magnums shorter, default for unknown |
| `barrelCondition` | 7 | All condition ratings (New→Past life), percentage accuracy, CSS color variables |

### Storage (`storage.test.ts`)

| Area | Tests | Key validations |
|------|-------|-----------------|
| `generateId` | 3 | Returns string, uniqueness (100 IDs), UUID v4 format |
| `buildLoadKey` | 2 | Pipe-delimited format, charge differentiation |
| Rifle profiles | 9 | CRUD, upsert, multi-profile, by-ID lookup, delete, scope data, barrel tracking fields |
| Performance records | 8 | CRUD, upsert, delete, load filtering, configSnapshot, conditions |
| Load calibrations | 9 | CRUD, upsert, load lookup, delete, trueBC, sdHistory, verification points |
| Edge cases | 4 | Corrupted JSON, non-array data, delete from empty, collection independence |

---

## Adding New Tests

When adding a new computation function to `src/lib/`:

1. Add tests to the corresponding `src/__tests__/*.test.ts` file (or create a new one if it's a new module)
2. Include at least:
   - A **happy path** test with real-world ballistic data
   - An **edge case** (zero, negative, empty, unknown input)
   - A **bounds check** (output is within physically reasonable range)
3. For physics functions, validate against published reference data when available
4. Run `npx vitest run` before committing — all 176 tests must pass

---

## CI Integration

Tests run on every push via the standard Vitest runner:

```json
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest"
}
```

The test suite completes in ~1 second. No external services, network calls, or browser instances are required.

---

## Future Testing Roadmap

- [ ] **Component tests** — Add `@testing-library/preact` for critical UI components (PerformanceTracker, RifleProfileManager, BallisticChart)
- [ ] **Playwright E2E** — Smoke tests for core workflows (create rifle profile → run trajectory → save performance record)
- [ ] **Visual regression** — Screenshot tests for theme consistency across light/dark/field modes
- [ ] **Coverage reporting** — Enable `vitest --coverage` and set minimum thresholds
