/* ─── BulletForge Persistence Layer ──────────────────────────────── */
/* localStorage-first with Supabase cloud sync when authenticated.   */
/* All public APIs are unchanged — cloud sync is invisible to        */
/* callers. Anonymous users get localStorage only; signed-in users    */
/* get automatic cloud backup.                                       */

import { supabase } from "./supabase.ts";
import { useBallisticsStore } from "../store/store.ts";

// ─── Interfaces ────────────────────────────────────────────────────

export interface RifleProfile {
  id: string;
  name: string;
  cartridgeShortName: string;
  bulletName: string;
  bulletManufacturer: string;
  muzzleVelocity: number;
  sightHeight: number;
  zeroRange: number;
  barrelLength: number;
  twistRate: number;
  twistDirection: "right" | "left";
  scope?: {
    reticleUnit: "MIL" | "MOA";
    clickValue: number;
    focalPlane: "FFP" | "SFP";
    magnificationMin: number;
    magnificationMax: number;
    calibratedMag: number;
    maxElevationTravel: number;
    maxWindageTravel: number;
  };
  notes: string;
  /** Total rounds fired through this barrel */
  roundCount?: number;
  /** Estimated barrel life in rounds (based on cartridge overbore ratio) */
  estimatedBarrelLife?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ConfigSnapshot {
  cartridgeShortName: string;
  bulletName: string;
  bulletManufacturer: string;
  powderName: string;
  chargeWeight: number;
  muzzleVelocity: number;
  barrelLength: number;
  sightHeight: number;
  zeroRange: number;
  altitude: number;
  temperature: number;
  barometricPressure: number;
  humidity: number;
}

export interface PerformanceRecord {
  id: string;
  rifleProfileId?: string;
  cartridgeShortName: string;
  bulletName: string;
  powderName: string;
  chargeWeight: number;
  velocities: number[];
  es: number;
  sd: number;
  date: string;
  notes: string;
  conditions?: {
    altitude: number;
    temperature: number;
    humidity: number;
  };
  /** Full config snapshot at time of recording (v0.9.3+) */
  configSnapshot?: ConfigSnapshot;
}

export interface LoadCalibration {
  id: string;
  /** Composite key: cartridge|bullet|powder|charge */
  loadKey: string;
  cartridgeShortName: string;
  bulletName: string;
  powderName: string;
  chargeWeight: number;
  /** True BC computed from chrono data */
  trueBC?: number;
  /** Correction factor: trueBC / publishedBC */
  bcCorrectionFactor?: number;
  /** Average measured muzzle velocity across all sessions */
  avgMeasuredMV: number;
  /** SD history from each session */
  sdHistory: number[];
  /** Number of chrono sessions contributing */
  sessionCount: number;
  /** Trajectory verification points: actual drops at distance */
  verificationPoints: TrajectoryVerificationPoint[];
  updatedAt: string;
}

export interface TrajectoryVerificationPoint {
  range: number;         // yards
  actualDropInches: number;
  predictedDropInches?: number;
  deltaInches?: number;
  date: string;
}

// ─── Storage Keys ──────────────────────────────────────────────────

const STORAGE_KEYS = {
  rifles: "bulletforge-rifles",
  performance: "bulletforge-performance",
  calibrations: "bulletforge-calibrations",
} as const;

// ─── Generic localStorage CRUD ─────────────────────────────────────

function readCollection<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    console.warn(`[BulletForge] Failed to read "${key}" from localStorage`);
    return [];
  }
}

function writeCollection<T>(key: string, items: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch (e) {
    console.error(`[BulletForge] Failed to write "${key}" to localStorage`, e);
  }
}

function upsertItem<T extends { id: string }>(key: string, item: T): void {
  const items = readCollection<T>(key);
  const idx = items.findIndex((i) => i.id === item.id);
  if (idx >= 0) {
    items[idx] = item;
  } else {
    items.push(item);
  }
  writeCollection(key, items);
}

function deleteItem(key: string, id: string): void {
  const items = readCollection<{ id: string }>(key);
  writeCollection(
    key,
    items.filter((i) => i.id !== id),
  );
}

function getItem<T extends { id: string }>(key: string, id: string): T | null {
  const items = readCollection<T>(key);
  return items.find((i) => i.id === id) ?? null;
}

// ─── UUID Generator ────────────────────────────────────────────────

export function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ─── Cloud Sync Helpers ────────────────────────────────────────────

function getCurrentUserId(): string | null {
  return useBallisticsStore.getState().user?.id ?? null;
}

// camelCase → snake_case field mapping for Supabase tables
const RIFLE_PROFILE_FIELDS: Record<string, string> = {
  id: "id",
  name: "name",
  cartridgeShortName: "cartridge_short_name",
  bulletName: "bullet_name",
  bulletManufacturer: "bullet_manufacturer",
  muzzleVelocity: "muzzle_velocity",
  sightHeight: "sight_height",
  zeroRange: "zero_range",
  barrelLength: "barrel_length",
  twistRate: "twist_rate",
  twistDirection: "twist_direction",
  scope: "scope",
  notes: "notes",
  roundCount: "round_count",
  estimatedBarrelLife: "estimated_barrel_life",
  createdAt: "created_at",
  updatedAt: "updated_at",
};

const PERFORMANCE_RECORD_FIELDS: Record<string, string> = {
  id: "id",
  rifleProfileId: "rifle_profile_id",
  cartridgeShortName: "cartridge_short_name",
  bulletName: "bullet_name",
  powderName: "powder_name",
  chargeWeight: "charge_weight",
  velocities: "velocities",
  es: "es",
  sd: "sd",
  date: "date",
  notes: "notes",
  conditions: "conditions",
  configSnapshot: "config_snapshot",
};

const LOAD_CALIBRATION_FIELDS: Record<string, string> = {
  id: "id",
  loadKey: "load_key",
  cartridgeShortName: "cartridge_short_name",
  bulletName: "bullet_name",
  powderName: "powder_name",
  chargeWeight: "charge_weight",
  trueBC: "true_bc",
  bcCorrectionFactor: "bc_correction_factor",
  avgMeasuredMV: "avg_measured_mv",
  sdHistory: "sd_history",
  sessionCount: "session_count",
  verificationPoints: "verification_points",
  updatedAt: "updated_at",
};

function toSnakeCase(
  obj: object,
  fieldMap: Record<string, string>,
): Record<string, unknown> {
  const src = obj as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const [camel, snake] of Object.entries(fieldMap)) {
    if (camel in src && src[camel] !== undefined) {
      result[snake] = src[camel];
    }
  }
  return result;
}

function toCamelCase<T>(
  row: Record<string, unknown>,
  fieldMap: Record<string, string>,
): T {
  const result: Record<string, unknown> = {};
  // Build reverse map: snake → camel
  for (const [camel, snake] of Object.entries(fieldMap)) {
    if (snake in row) {
      result[camel] = row[snake];
    }
  }
  return result as T;
}

/** Fire-and-forget cloud upsert — never blocks the caller */
function cloudUpsert(
  table: string,
  row: Record<string, unknown>,
  userId: string,
): void {
  if (!supabase) return;
  const payload = { ...row, user_id: userId };
  supabase
    .from(table)
    .upsert(payload, { onConflict: "id" })
    .then(({ error }) => {
      if (error) console.warn(`[BulletForge] Cloud upsert to ${table} failed:`, error.message);
    });
}

/** Fire-and-forget cloud delete */
function cloudDelete(table: string, id: string, userId: string): void {
  if (!supabase) return;
  supabase
    .from(table)
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
    .then(({ error }) => {
      if (error) console.warn(`[BulletForge] Cloud delete from ${table} failed:`, error.message);
    });
}

// ─── Rifle Profiles ───────────────────────────────────────────────

export function saveRifleProfile(profile: RifleProfile): void {
  upsertItem(STORAGE_KEYS.rifles, profile);
  const userId = getCurrentUserId();
  if (userId) {
    cloudUpsert("rifle_profiles", toSnakeCase(profile, RIFLE_PROFILE_FIELDS), userId);
  }
}

export function loadRifleProfiles(): RifleProfile[] {
  return readCollection<RifleProfile>(STORAGE_KEYS.rifles);
}

export function deleteRifleProfile(id: string): void {
  deleteItem(STORAGE_KEYS.rifles, id);
  const userId = getCurrentUserId();
  if (userId) cloudDelete("rifle_profiles", id, userId);
}

export function getRifleProfile(id: string): RifleProfile | null {
  return getItem<RifleProfile>(STORAGE_KEYS.rifles, id);
}

// ─── Performance Records ──────────────────────────────────────────

export function savePerformanceRecord(record: PerformanceRecord): void {
  upsertItem(STORAGE_KEYS.performance, record);
  const userId = getCurrentUserId();
  if (userId) {
    cloudUpsert("performance_records", toSnakeCase(record, PERFORMANCE_RECORD_FIELDS), userId);
  }
}

export function loadPerformanceRecords(): PerformanceRecord[] {
  return readCollection<PerformanceRecord>(STORAGE_KEYS.performance);
}

export function deletePerformanceRecord(id: string): void {
  deleteItem(STORAGE_KEYS.performance, id);
  const userId = getCurrentUserId();
  if (userId) cloudDelete("performance_records", id, userId);
}

export function getPerformanceRecordsForLoad(
  cartridge: string,
  bullet: string,
  powder: string,
): PerformanceRecord[] {
  return loadPerformanceRecords().filter(
    (r) =>
      r.cartridgeShortName === cartridge &&
      r.bulletName === bullet &&
      r.powderName === powder,
  );
}

// ─── Load Calibrations ──────────────────────────────────────────

export function buildLoadKey(
  cartridge: string,
  bullet: string,
  powder: string,
  charge: number,
): string {
  return `${cartridge}|${bullet}|${powder}|${charge}`;
}

export function saveLoadCalibration(cal: LoadCalibration): void {
  upsertItem(STORAGE_KEYS.calibrations, cal);
  const userId = getCurrentUserId();
  if (userId) {
    cloudUpsert("load_calibrations", toSnakeCase(cal, LOAD_CALIBRATION_FIELDS), userId);
  }
}

export function loadCalibrations(): LoadCalibration[] {
  return readCollection<LoadCalibration>(STORAGE_KEYS.calibrations);
}

export function getCalibrationForLoad(
  cartridge: string,
  bullet: string,
  powder: string,
  charge: number,
): LoadCalibration | null {
  const key = buildLoadKey(cartridge, bullet, powder, charge);
  const all = loadCalibrations();
  return all.find((c) => c.loadKey === key) ?? null;
}

export function deleteLoadCalibration(id: string): void {
  deleteItem(STORAGE_KEYS.calibrations, id);
  const userId = getCurrentUserId();
  if (userId) cloudDelete("load_calibrations", id, userId);
}

// ─── Cloud Sync (called on sign-in) ──────────────────────────────

/**
 * Sync localStorage ↔ Supabase on sign-in.
 * - Fetches cloud data and merges into localStorage (cloud wins on ID conflicts)
 * - Pushes localStorage-only records to Supabase (anonymous → signed-in migration)
 */
export async function syncOnLogin(userId: string): Promise<void> {
  if (!supabase) return;

  await syncCollection<RifleProfile>(
    "rifle_profiles",
    STORAGE_KEYS.rifles,
    RIFLE_PROFILE_FIELDS,
    userId,
  );
  await syncCollection<PerformanceRecord>(
    "performance_records",
    STORAGE_KEYS.performance,
    PERFORMANCE_RECORD_FIELDS,
    userId,
  );
  await syncCollection<LoadCalibration>(
    "load_calibrations",
    STORAGE_KEYS.calibrations,
    LOAD_CALIBRATION_FIELDS,
    userId,
  );

  console.log("[BulletForge] Cloud sync complete");
}

async function syncCollection<T extends { id: string }>(
  table: string,
  localKey: string,
  fieldMap: Record<string, string>,
  userId: string,
): Promise<void> {
  if (!supabase) return;

  // 1. Fetch all cloud records for this user
  const { data: cloudRows, error } = await supabase
    .from(table)
    .select("*")
    .eq("user_id", userId);

  if (error) {
    console.warn(`[BulletForge] Failed to fetch ${table} from cloud:`, error.message);
    return;
  }

  const cloudItems = (cloudRows ?? []).map((row: Record<string, unknown>) =>
    toCamelCase<T>(row, fieldMap),
  );
  const localItems = readCollection<T>(localKey);

  // 2. Build merged set: cloud wins on ID conflicts
  const mergedMap = new Map<string, T>();
  for (const item of localItems) mergedMap.set(item.id, item);
  for (const item of cloudItems) mergedMap.set(item.id, item); // cloud overwrites

  const merged = Array.from(mergedMap.values());
  writeCollection(localKey, merged);

  // 3. Push local-only records to cloud
  const cloudIds = new Set(cloudItems.map((i) => i.id));
  const localOnly = localItems.filter((i) => !cloudIds.has(i.id));

  for (const item of localOnly) {
    const row = toSnakeCase(item, fieldMap);
    cloudUpsert(table, row, userId);
  }
}
