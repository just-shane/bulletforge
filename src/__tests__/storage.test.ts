import { describe, it, expect, beforeEach } from "vitest";
import {
  generateId,
  buildLoadKey,
  saveRifleProfile,
  loadRifleProfiles,
  deleteRifleProfile,
  getRifleProfile,
  savePerformanceRecord,
  loadPerformanceRecords,
  deletePerformanceRecord,
  getPerformanceRecordsForLoad,
  saveLoadCalibration,
  loadCalibrations,
  getCalibrationForLoad,
  deleteLoadCalibration,
  type RifleProfile,
  type PerformanceRecord,
  type LoadCalibration,
} from "../lib/storage";

// ─── Helpers ──────────────────────────────────────────────────────

function makeRifle(overrides: Partial<RifleProfile> = {}): RifleProfile {
  return {
    id: generateId(),
    name: "Test Rifle",
    cartridgeShortName: "6.5 CM",
    bulletName: "140 ELD Match",
    bulletManufacturer: "Hornady",
    muzzleVelocity: 2710,
    sightHeight: 1.5,
    zeroRange: 100,
    barrelLength: 24,
    twistRate: 8,
    twistDirection: "right",
    notes: "",
    roundCount: 0,
    estimatedBarrelLife: 3000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeRecord(overrides: Partial<PerformanceRecord> = {}): PerformanceRecord {
  return {
    id: generateId(),
    cartridgeShortName: "6.5 CM",
    bulletName: "140 ELD Match",
    powderName: "H4350",
    chargeWeight: 41.5,
    velocities: [2710, 2715, 2708, 2712, 2709],
    es: 7,
    sd: 3,
    date: new Date().toISOString(),
    notes: "",
    ...overrides,
  };
}

function makeCalibration(overrides: Partial<LoadCalibration> = {}): LoadCalibration {
  const cartridge = overrides.cartridgeShortName ?? "6.5 CM";
  const bullet = overrides.bulletName ?? "140 ELD Match";
  const powder = overrides.powderName ?? "H4350";
  const charge = overrides.chargeWeight ?? 41.5;
  return {
    id: generateId(),
    loadKey: buildLoadKey(cartridge, bullet, powder, charge),
    cartridgeShortName: cartridge,
    bulletName: bullet,
    powderName: powder,
    chargeWeight: charge,
    avgMeasuredMV: 2710,
    sdHistory: [3, 4, 2],
    sessionCount: 3,
    verificationPoints: [],
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

// ─── Clear storage before each test ──────────────────────────────

beforeEach(() => {
  localStorage.clear();
});

// ─── UUID Generation ─────────────────────────────────────────────

describe("generateId", () => {
  it("returns a string", () => {
    expect(typeof generateId()).toBe("string");
  });

  it("returns unique values", () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });

  it("looks like a UUID", () => {
    const id = generateId();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
});

// ─── buildLoadKey ────────────────────────────────────────────────

describe("buildLoadKey", () => {
  it("creates a pipe-delimited key", () => {
    const key = buildLoadKey("6.5 CM", "140 ELD Match", "H4350", 41.5);
    expect(key).toBe("6.5 CM|140 ELD Match|H4350|41.5");
  });

  it("different charges produce different keys", () => {
    const k1 = buildLoadKey("6.5 CM", "140 ELD", "H4350", 41.0);
    const k2 = buildLoadKey("6.5 CM", "140 ELD", "H4350", 41.5);
    expect(k1).not.toBe(k2);
  });
});

// ─── Rifle Profiles CRUD ─────────────────────────────────────────

describe("Rifle Profiles", () => {
  it("starts with empty collection", () => {
    expect(loadRifleProfiles()).toHaveLength(0);
  });

  it("saves and loads a rifle profile", () => {
    const rifle = makeRifle({ name: "PRS Rig" });
    saveRifleProfile(rifle);
    const loaded = loadRifleProfiles();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].name).toBe("PRS Rig");
  });

  it("upserts on matching id", () => {
    const rifle = makeRifle({ name: "Original" });
    saveRifleProfile(rifle);
    saveRifleProfile({ ...rifle, name: "Updated" });
    const loaded = loadRifleProfiles();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].name).toBe("Updated");
  });

  it("saves multiple profiles", () => {
    saveRifleProfile(makeRifle({ name: "Rifle A" }));
    saveRifleProfile(makeRifle({ name: "Rifle B" }));
    expect(loadRifleProfiles()).toHaveLength(2);
  });

  it("retrieves by id", () => {
    const rifle = makeRifle({ name: "Specific" });
    saveRifleProfile(rifle);
    const found = getRifleProfile(rifle.id);
    expect(found).not.toBeNull();
    expect(found!.name).toBe("Specific");
  });

  it("returns null for unknown id", () => {
    expect(getRifleProfile("nonexistent")).toBeNull();
  });

  it("deletes a profile", () => {
    const rifle = makeRifle();
    saveRifleProfile(rifle);
    deleteRifleProfile(rifle.id);
    expect(loadRifleProfiles()).toHaveLength(0);
  });

  it("preserves roundCount and estimatedBarrelLife", () => {
    const rifle = makeRifle({ roundCount: 500, estimatedBarrelLife: 3000 });
    saveRifleProfile(rifle);
    const loaded = getRifleProfile(rifle.id)!;
    expect(loaded.roundCount).toBe(500);
    expect(loaded.estimatedBarrelLife).toBe(3000);
  });

  it("preserves scope data", () => {
    const rifle = makeRifle({
      scope: {
        reticleUnit: "MIL",
        clickValue: 0.1,
        focalPlane: "FFP",
        magnificationMin: 5,
        magnificationMax: 25,
        calibratedMag: 15,
        maxElevationTravel: 30,
        maxWindageTravel: 20,
      },
    });
    saveRifleProfile(rifle);
    const loaded = getRifleProfile(rifle.id)!;
    expect(loaded.scope?.reticleUnit).toBe("MIL");
    expect(loaded.scope?.clickValue).toBe(0.1);
    expect(loaded.scope?.focalPlane).toBe("FFP");
  });
});

// ─── Performance Records CRUD ────────────────────────────────────

describe("Performance Records", () => {
  it("starts empty", () => {
    expect(loadPerformanceRecords()).toHaveLength(0);
  });

  it("saves and loads a record", () => {
    const rec = makeRecord();
    savePerformanceRecord(rec);
    expect(loadPerformanceRecords()).toHaveLength(1);
  });

  it("upserts on matching id", () => {
    const rec = makeRecord({ notes: "first" });
    savePerformanceRecord(rec);
    savePerformanceRecord({ ...rec, notes: "updated" });
    const loaded = loadPerformanceRecords();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].notes).toBe("updated");
  });

  it("deletes a record", () => {
    const rec = makeRecord();
    savePerformanceRecord(rec);
    deletePerformanceRecord(rec.id);
    expect(loadPerformanceRecords()).toHaveLength(0);
  });

  it("filters records by load (cartridge + bullet + powder)", () => {
    savePerformanceRecord(makeRecord({ cartridgeShortName: "6.5 CM", bulletName: "140 ELD", powderName: "H4350" }));
    savePerformanceRecord(makeRecord({ cartridgeShortName: "6.5 CM", bulletName: "140 ELD", powderName: "H4350" }));
    savePerformanceRecord(makeRecord({ cartridgeShortName: ".308 Win", bulletName: "175 SMK", powderName: "Varget" }));
    const cm = getPerformanceRecordsForLoad("6.5 CM", "140 ELD", "H4350");
    expect(cm).toHaveLength(2);
    const win = getPerformanceRecordsForLoad(".308 Win", "175 SMK", "Varget");
    expect(win).toHaveLength(1);
  });

  it("returns empty for unmatched load", () => {
    savePerformanceRecord(makeRecord());
    expect(getPerformanceRecordsForLoad("Fake", "Fake", "Fake")).toHaveLength(0);
  });

  it("preserves configSnapshot", () => {
    const rec = makeRecord({
      configSnapshot: {
        cartridgeShortName: "6.5 CM",
        bulletName: "140 ELD Match",
        bulletManufacturer: "Hornady",
        powderName: "H4350",
        chargeWeight: 41.5,
        muzzleVelocity: 2710,
        barrelLength: 24,
        sightHeight: 1.5,
        zeroRange: 100,
        altitude: 500,
        temperature: 72,
        barometricPressure: 29.92,
        humidity: 50,
      },
    });
    savePerformanceRecord(rec);
    const loaded = loadPerformanceRecords()[0];
    expect(loaded.configSnapshot).toBeDefined();
    expect(loaded.configSnapshot!.chargeWeight).toBe(41.5);
    expect(loaded.configSnapshot!.altitude).toBe(500);
  });

  it("preserves conditions", () => {
    const rec = makeRecord({ conditions: { altitude: 5000, temperature: 85, humidity: 30 } });
    savePerformanceRecord(rec);
    const loaded = loadPerformanceRecords()[0];
    expect(loaded.conditions?.altitude).toBe(5000);
  });
});

// ─── Load Calibrations CRUD ──────────────────────────────────────

describe("Load Calibrations", () => {
  it("starts empty", () => {
    expect(loadCalibrations()).toHaveLength(0);
  });

  it("saves and loads a calibration", () => {
    const cal = makeCalibration();
    saveLoadCalibration(cal);
    expect(loadCalibrations()).toHaveLength(1);
  });

  it("upserts on matching id", () => {
    const cal = makeCalibration({ sessionCount: 1 });
    saveLoadCalibration(cal);
    saveLoadCalibration({ ...cal, sessionCount: 5 });
    const loaded = loadCalibrations();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].sessionCount).toBe(5);
  });

  it("retrieves calibration by load components", () => {
    const cal = makeCalibration({
      cartridgeShortName: ".308 Win",
      bulletName: "175 SMK",
      powderName: "Varget",
      chargeWeight: 44.0,
    });
    // Rebuild loadKey from overridden values
    cal.loadKey = buildLoadKey(".308 Win", "175 SMK", "Varget", 44.0);
    saveLoadCalibration(cal);
    const found = getCalibrationForLoad(".308 Win", "175 SMK", "Varget", 44.0);
    expect(found).not.toBeNull();
    expect(found!.avgMeasuredMV).toBe(2710);
  });

  it("returns null for unknown load", () => {
    expect(getCalibrationForLoad("Fake", "Fake", "Fake", 0)).toBeNull();
  });

  it("deletes a calibration", () => {
    const cal = makeCalibration();
    saveLoadCalibration(cal);
    deleteLoadCalibration(cal.id);
    expect(loadCalibrations()).toHaveLength(0);
  });

  it("preserves trueBC and bcCorrectionFactor", () => {
    const cal = makeCalibration({ trueBC: 0.612, bcCorrectionFactor: 0.97 });
    saveLoadCalibration(cal);
    const loaded = loadCalibrations()[0];
    expect(loaded.trueBC).toBe(0.612);
    expect(loaded.bcCorrectionFactor).toBe(0.97);
  });

  it("preserves sdHistory array", () => {
    const cal = makeCalibration({ sdHistory: [3, 5, 2, 4, 3] });
    saveLoadCalibration(cal);
    const loaded = loadCalibrations()[0];
    expect(loaded.sdHistory).toEqual([3, 5, 2, 4, 3]);
  });

  it("preserves verification points", () => {
    const cal = makeCalibration({
      verificationPoints: [
        { range: 600, actualDropInches: -108.5, predictedDropInches: -107.2, deltaInches: -1.3, date: "2026-03-15" },
        { range: 1000, actualDropInches: -342.0, date: "2026-03-15" },
      ],
    });
    saveLoadCalibration(cal);
    const loaded = loadCalibrations()[0];
    expect(loaded.verificationPoints).toHaveLength(2);
    expect(loaded.verificationPoints[0].range).toBe(600);
    expect(loaded.verificationPoints[0].deltaInches).toBe(-1.3);
    expect(loaded.verificationPoints[1].predictedDropInches).toBeUndefined();
  });
});

// ─── Edge Cases ──────────────────────────────────────────────────

describe("Storage edge cases", () => {
  it("handles corrupted localStorage gracefully", () => {
    localStorage.setItem("bulletforge-rifles", "not-json!!!");
    expect(loadRifleProfiles()).toEqual([]);
  });

  it("handles non-array JSON in localStorage", () => {
    localStorage.setItem("bulletforge-rifles", JSON.stringify({ foo: "bar" }));
    expect(loadRifleProfiles()).toEqual([]);
  });

  it("delete on empty collection does not throw", () => {
    expect(() => deleteRifleProfile("nonexistent")).not.toThrow();
  });

  it("multiple collections are independent", () => {
    saveRifleProfile(makeRifle());
    savePerformanceRecord(makeRecord());
    saveLoadCalibration(makeCalibration());
    expect(loadRifleProfiles()).toHaveLength(1);
    expect(loadPerformanceRecords()).toHaveLength(1);
    expect(loadCalibrations()).toHaveLength(1);
    // Deleting from one doesn't affect others
    localStorage.removeItem("bulletforge-rifles");
    expect(loadRifleProfiles()).toHaveLength(0);
    expect(loadPerformanceRecords()).toHaveLength(1);
    expect(loadCalibrations()).toHaveLength(1);
  });
});
