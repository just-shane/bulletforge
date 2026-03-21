/* ─── BulletForge localStorage Persistence Layer ────────────────── */
/* Bridges to future Supabase backend. All keys are namespaced     */
/* under the `bulletforge-` prefix.                                 */

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
  createdAt: string;
  updatedAt: string;
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
}

// ─── Storage Keys ──────────────────────────────────────────────────

const STORAGE_KEYS = {
  rifles: "bulletforge-rifles",
  performance: "bulletforge-performance",
} as const;

// ─── Generic CRUD Layer ────────────────────────────────────────────

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
  // crypto.randomUUID where available, fallback for older browsers
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // RFC-4122 v4 fallback
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ─── Rifle Profiles ───────────────────────────────────────────────

export function saveRifleProfile(profile: RifleProfile): void {
  upsertItem(STORAGE_KEYS.rifles, profile);
}

export function loadRifleProfiles(): RifleProfile[] {
  return readCollection<RifleProfile>(STORAGE_KEYS.rifles);
}

export function deleteRifleProfile(id: string): void {
  deleteItem(STORAGE_KEYS.rifles, id);
}

export function getRifleProfile(id: string): RifleProfile | null {
  return getItem<RifleProfile>(STORAGE_KEYS.rifles, id);
}

// ─── Performance Records ──────────────────────────────────────────

export function savePerformanceRecord(record: PerformanceRecord): void {
  upsertItem(STORAGE_KEYS.performance, record);
}

export function loadPerformanceRecords(): PerformanceRecord[] {
  return readCollection<PerformanceRecord>(STORAGE_KEYS.performance);
}

export function deletePerformanceRecord(id: string): void {
  deleteItem(STORAGE_KEYS.performance, id);
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
