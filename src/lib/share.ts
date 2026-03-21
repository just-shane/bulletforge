/* ─── URL Sharing Utilities ──────────────────────────────────────── */

const KEY_MAP = {
  c: "cartridgeShortName",
  b: "bulletName",
  bm: "bulletManufacturer",
  mv: "muzzleVelocity",
  sh: "sightHeight",
  zr: "zeroRange",
  ws: "windSpeed",
  wa: "windAngle",
  sa: "shootingAngle",
  alt: "altitude",
  temp: "temperature",
  bp: "barometricPressure",
  hum: "humidity",
} as const;

type CompactKey = keyof typeof KEY_MAP;

const NUMERIC_FIELDS = new Set([
  "muzzleVelocity",
  "sightHeight",
  "zeroRange",
  "windSpeed",
  "windAngle",
  "shootingAngle",
  "altitude",
  "temperature",
  "barometricPressure",
  "humidity",
]);

export interface ShareConfig {
  cartridgeShortName?: string;
  bulletName?: string;
  bulletManufacturer?: string;
  muzzleVelocity?: number;
  sightHeight?: number;
  zeroRange?: number;
  windSpeed?: number;
  windAngle?: number;
  shootingAngle?: number;
  altitude?: number;
  temperature?: number;
  barometricPressure?: number;
  humidity?: number;
}

/** Build a full shareable URL from the current store state. */
export function buildShareURL(base: string, state: {
  cartridge: { shortName: string };
  bullet: { name: string; manufacturer: string };
  muzzleVelocity: number;
  sightHeight: number;
  zeroRange: number;
  windSpeed: number;
  windAngle: number;
  shootingAngle: number;
  altitude: number;
  temperature: number;
  barometricPressure: number;
  humidity: number;
}): string {
  const params = new URLSearchParams();
  params.set("c", state.cartridge.shortName);
  params.set("b", state.bullet.name);
  params.set("bm", state.bullet.manufacturer);
  params.set("mv", String(state.muzzleVelocity));
  params.set("sh", String(state.sightHeight));
  params.set("zr", String(state.zeroRange));
  params.set("ws", String(state.windSpeed));
  params.set("wa", String(state.windAngle));
  params.set("sa", String(state.shootingAngle));
  params.set("alt", String(state.altitude));
  params.set("temp", String(state.temperature));
  params.set("bp", String(state.barometricPressure));
  params.set("hum", String(state.humidity));
  return `${base}?${params.toString()}`;
}

/** Parse a URL query string and return a partial ShareConfig, or null if no share params found. */
export function parseShareURL(search: string): ShareConfig | null {
  const params = new URLSearchParams(search);
  const config: Record<string, string | number> = {};
  let found = false;

  for (const [compact, full] of Object.entries(KEY_MAP) as [CompactKey, string][]) {
    const val = params.get(compact);
    if (val == null) continue;
    found = true;
    config[full] = NUMERIC_FIELDS.has(full) ? Number(val) : val;
  }

  return found ? (config as ShareConfig) : null;
}
