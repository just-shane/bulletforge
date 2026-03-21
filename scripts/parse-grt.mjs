#!/usr/bin/env node

/**
 * parse-grt.mjs
 *
 * Parses all GRT XML files from tmp/grt/ and outputs a single normalized
 * JSON file at src/lib/training-data.json.
 *
 * Usage: node scripts/parse-grt.mjs
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { join, basename, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');

const GRT_DIR = join(ROOT, 'tmp', 'grt');
const OUTPUT_FILE = join(ROOT, 'src', 'lib', 'training-data.json');

// ---------------------------------------------------------------------------
// Unit conversion helpers
// ---------------------------------------------------------------------------

const MM_TO_IN = 1 / 25.4;
const G_TO_GR = 15.4324;
const BAR_TO_PSI = 14.5038;

function mmToIn(mm) {
  return mm != null ? round(mm * MM_TO_IN, 5) : null;
}

function gToGr(g) {
  return g != null ? round(g * G_TO_GR, 4) : null;
}

function barToPsi(bar) {
  return bar != null ? round(bar * BAR_TO_PSI, 2) : null;
}

function round(v, decimals = 4) {
  const f = 10 ** decimals;
  return Math.round(v * f) / f;
}

// ---------------------------------------------------------------------------
// XML helpers — regex-based extraction for simple flat XML
// ---------------------------------------------------------------------------

/** Extract all <var name="X" value="Y" .../> pairs into a Map */
function extractVars(xml) {
  const map = new Map();
  const re = /<var\s+name="([^"]*?)"\s+value="([^"]*?)"[^>]*?\/>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    map.set(m[1], m[2]);
  }
  return map;
}

/** Extract all <input name="X" value="Y" .../> pairs into a Map */
function extractInputs(xml) {
  const map = new Map();
  // Handle both self-closing <input .../> and <input ...> (no closing slash)
  const re = /<input\s+name="([^"]*?)"\s+value="([^"]*?)"[^>]*?\/?>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    map.set(m[1], m[2]);
  }
  return map;
}

/** Extract a named XML section's content (e.g. <caliber>...</caliber>) */
function extractSection(xml, tag) {
  const re = new RegExp(`<${tag}>[\\s\\S]*?</${tag}>`, 'i');
  const m = xml.match(re);
  return m ? m[0] : '';
}

/** Safely decode a URL-encoded string */
function decode(val) {
  if (val == null || val === '') return val;
  try {
    return decodeURIComponent(val);
  } catch {
    return val;
  }
}

/** Convert a string to a number, or return null if not numeric */
function toNum(val) {
  if (val == null || val === '') return null;
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
}

/** Get a decoded string from a map */
function str(map, key) {
  const v = map.get(key);
  return v != null ? decode(v) : null;
}

/** Get a number from a map */
function num(map, key) {
  return toNum(map.get(key));
}

// ---------------------------------------------------------------------------
// File readers
// ---------------------------------------------------------------------------

function readFileSafe(filePath) {
  try {
    return readFileSync(filePath, 'utf-8');
  } catch (err) {
    console.warn(`  WARN: Could not read ${filePath}: ${err.message}`);
    return null;
  }
}

function listFiles(dir, ext) {
  if (!existsSync(dir)) {
    console.warn(`  WARN: Directory not found: ${dir}`);
    return [];
  }
  return readdirSync(dir)
    .filter(f => f.endsWith(ext))
    .map(f => join(dir, f));
}

// ---------------------------------------------------------------------------
// Parsers
// ---------------------------------------------------------------------------

function parseProjectile(filePath) {
  const xml = readFileSafe(filePath);
  if (!xml) return null;
  const v = extractVars(xml);
  const file = basename(filePath);

  const gdia_mm = num(v, 'gdia');
  const glen_mm = num(v, 'glen');
  const gmass_gr = num(v, 'gmass');
  const gpressure_bar = num(v, 'gpressure');
  const gtailDiaA_mm = num(v, 'gtailDiaA');
  const gtailDiaB_mm = num(v, 'gtailDiaB');
  const gtailh_mm = num(v, 'gtailh');

  return {
    manufacturer: str(v, 'mname'),
    productName: str(v, 'pname'),
    caliber: str(v, 'caliber'),
    grooveDiameter: { mm: gdia_mm, in: mmToIn(gdia_mm) },
    length: { mm: glen_mm, in: mmToIn(glen_mm) },
    mass: { gr: gmass_gr },
    engravingPressure: { bar: gpressure_bar, psi: barToPsi(gpressure_bar) },
    tailDiameterA: { mm: gtailDiaA_mm, in: mmToIn(gtailDiaA_mm) },
    tailDiameterB: { mm: gtailDiaB_mm, in: mmToIn(gtailDiaB_mm) },
    tailHeight: { mm: gtailh_mm, in: mmToIn(gtailh_mm) },
    tailType: num(v, 'gtailType'),
    g1bc: num(v, 'g1bc'),
    g7bc: num(v, 'g7bc'),
    ubcsCode: str(v, 'gUBCS'),
    createdDate: str(v, 'cdate'),
    createdBy: str(v, 'cby'),
    description: str(v, 'descr'),
    _source: file,
  };
}

function parsePowder(filePath) {
  const xml = readFileSafe(filePath);
  if (!xml) return null;
  const v = extractVars(xml);
  const file = basename(filePath);

  const Qex = num(v, 'Qex');
  const pc = num(v, 'pc');
  const pcd = num(v, 'pcd');
  const pt = num(v, 'pt');

  return {
    manufacturer: str(v, 'mname'),
    productName: str(v, 'pname'),
    lotId: str(v, 'lotid'),
    progressivityFactor: num(v, 'Bp'),
    brisanceFactor: num(v, 'Br'),
    combinedBrisanceProgressivity: num(v, 'Brp'),
    vivacityCoefficient: num(v, 'Ba'),
    specificExplosiveHeat_kJkg: Qex,
    specificHeatRatio: num(v, 'k'),
    baPhiCoefficient: num(v, 'a0'),
    burnUpLimitZ1: num(v, 'z1'),
    burnUpLimitZ2: num(v, 'z2'),
    covolume_cm3g: num(v, 'eta'),
    materialDensity_kgm3: pc,
    bulkDensity_kgm3: pcd,
    temperature_C: pt,
    coldTempCoefficient: num(v, 'tcc'),
    hotTempCoefficient: num(v, 'tch'),
    createdDate: str(v, 'cdate'),
    createdBy: str(v, 'cby'),
    description: str(v, 'descr'),
    _source: file,
  };
}

function parseCaliber(filePath) {
  const xml = readFileSafe(filePath);
  if (!xml) return null;
  const v = extractVars(xml);
  const file = basename(filePath);

  const L3_mm = num(v, 'L3');
  const L6_mm = num(v, 'L6');
  const R_mm = num(v, 'R');
  const R1_mm = num(v, 'R1');
  const E_mm = num(v, 'E');
  const E1_mm = num(v, 'E1');
  const Emin_mm = num(v, 'Emin');
  const Pmax_bar = num(v, 'Pmax');
  const PK_bar = num(v, 'PK');
  const PE_bar = num(v, 'PE');
  const c_u_mm = num(v, 'c_u_');

  return {
    cipName: str(v, 'cipname'),
    altName: str(v, 'altname'),
    standard: str(v, 'standard'),
    cipOrigin: str(v, 'ciporigin'),
    cipType: str(v, 'ciptype'),
    cipDate: str(v, 'cipdate'),
    caseLength: { mm: L3_mm, in: mmToIn(L3_mm) },
    overallLength: { mm: L6_mm, in: mmToIn(L6_mm) },
    caseHeadRadius: { mm: R_mm, in: mmToIn(R_mm) },
    rimDiameter: { mm: R1_mm, in: mmToIn(R1_mm) },
    neckWallThickness: { mm: E_mm, in: mmToIn(E_mm) },
    bodyDiameter: { mm: E1_mm, in: mmToIn(E1_mm) },
    minNeckThickness: { mm: Emin_mm, in: mmToIn(Emin_mm) },
    maxPressure: { bar: Pmax_bar, psi: barToPsi(Pmax_bar) },
    proofPressurePK: { bar: PK_bar, psi: barToPsi(PK_bar) },
    proofPressurePE: { bar: PE_bar, psi: barToPsi(PE_bar) },
    caseVolume: num(v, 'V'),
    caseWeight: num(v, 'M'),
    sebertFactor: num(v, 'sebert'),
    boreArea_mm2: num(v, 'c_Q'),
    grooveCount: num(v, 'c_N'),
    twistRate: { mm: c_u_mm, in: mmToIn(c_u_mm) },
    createdDate: str(v, 'cdate'),
    createdBy: str(v, 'cby'),
    description: str(v, 'descr'),
    _source: file,
  };
}

function parseLoad(filePath) {
  const xml = readFileSafe(filePath);
  if (!xml) return null;
  const file = basename(filePath);

  // Extract sections — grtload files use <input> inside named sections
  const caliberSection = extractSection(xml, 'caliber');
  const gunSection = extractSection(xml, 'gun');
  const projectileSection = extractSection(xml, 'projectile');
  const propellantSection = extractSection(xml, 'propellant');

  const cal = extractInputs(caliberSection);
  const gun = extractInputs(gunSection);
  const proj = extractInputs(projectileSection);
  const prop = extractInputs(propellantSection);

  const oal_mm = num(cal, 'oal');
  const caselen_mm = num(cal, 'caselen');
  const Dz_mm = num(cal, 'Dz');
  const Aeff_mm2 = num(cal, 'Aeff');
  const pMaxZul_bar = num(cal, 'pMaxZul');
  const xe_mm = num(gun, 'xe');
  const twistlen_mm = num(gun, 'twistlen');
  const mgun_kg = num(gun, 'mgun');
  const Dbul_mm = num(proj, 'Dbul');
  const mp_g = num(proj, 'mp');
  const glen_mm = num(proj, 'glen');
  const gpressure_bar = num(proj, 'gpressure');
  const mc_g = num(prop, 'mc');

  return {
    caliber: {
      name: str(cal, 'CaliberName'),
      overallLength: { mm: oal_mm, in: mmToIn(oal_mm) },
      caseLength: { mm: caselen_mm, in: mmToIn(caselen_mm) },
      caseVolume_cm3: num(cal, 'casevol'),
      grooveCaliber: { mm: Dz_mm, in: mmToIn(Dz_mm) },
      effectiveArea_mm2: Aeff_mm2,
      maxPressure: { bar: pMaxZul_bar, psi: barToPsi(pMaxZul_bar) },
    },
    gun: {
      barrelLength: { mm: xe_mm, in: mmToIn(xe_mm) },
      twistRate: { mm: twistlen_mm, in: mmToIn(twistlen_mm) },
      weight_kg: mgun_kg,
    },
    projectile: {
      manufacturer: str(proj, 'mname'),
      productName: str(proj, 'pname'),
      diameter: { mm: Dbul_mm, in: mmToIn(Dbul_mm) },
      weight: { g: mp_g, gr: gToGr(mp_g) },
      length: { mm: glen_mm, in: mmToIn(glen_mm) },
      g1bc: num(proj, 'g1bc'),
      g7bc: num(proj, 'g7bc'),
      engravingPressure: { bar: gpressure_bar, psi: barToPsi(gpressure_bar) },
    },
    propellant: {
      manufacturer: str(prop, 'mname'),
      productName: str(prop, 'pname'),
      vivacityCoefficient: num(prop, 'Ba'),
      specificExplosiveHeat_kJkg: num(prop, 'Qex'),
      specificHeatRatio: num(prop, 'k'),
      baPhiCoefficient: num(prop, 'a0'),
      burnUpLimitZ1: num(prop, 'z1'),
      burnUpLimitZ2: num(prop, 'z2'),
      covolume_cm3g: num(prop, 'eta'),
      materialDensity_kgm3: num(prop, 'pc'),
      bulkDensity_kgm3: num(prop, 'pcd'),
      chargeMass: { g: mc_g, gr: gToGr(mc_g) },
      temperature_C: num(prop, 'pt'),
      coldTempCoefficient: num(prop, 'tcc'),
      hotTempCoefficient: num(prop, 'tch'),
    },
    _source: file,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function parseAll(dir, ext, parser, label) {
  const files = listFiles(dir, ext);
  console.log(`Parsing ${files.length} ${label} files...`);
  const results = [];
  let skipped = 0;
  for (const f of files) {
    try {
      const obj = parser(f);
      if (obj) results.push(obj);
      else skipped++;
    } catch (err) {
      console.warn(`  WARN: Failed to parse ${basename(f)}: ${err.message}`);
      skipped++;
    }
  }
  if (skipped > 0) console.warn(`  Skipped ${skipped} ${label} file(s).`);
  console.log(`  -> ${results.length} ${label} records parsed.`);
  return results;
}

function main() {
  console.log('GRT XML Parser');
  console.log(`Source: ${GRT_DIR}`);
  console.log(`Output: ${OUTPUT_FILE}`);
  console.log('');

  if (!existsSync(GRT_DIR)) {
    console.error(`ERROR: GRT directory not found: ${GRT_DIR}`);
    process.exit(1);
  }

  const projectiles = parseAll(
    join(GRT_DIR, 'projectiles'), '.projectile', parseProjectile, 'projectile'
  );
  const powders = parseAll(
    join(GRT_DIR, 'powders'), '.propellant', parsePowder, 'powder'
  );
  const calibers = parseAll(
    join(GRT_DIR, 'calibers'), '.caliber', parseCaliber, 'caliber'
  );
  const loads = parseAll(
    join(GRT_DIR, 'loads'), '.grtload', parseLoad, 'load'
  );

  const output = {
    meta: {
      source: 'GRT Community Discord (zen/grt_databases)',
      sourceUrl: 'https://github.com/zen/grt_databases',
      license: 'CC0-1.0',
      disclaimer:
        'Community-contributed data. Measurements must be verified independently. BulletForge does not guarantee accuracy.',
      parsedAt: new Date().toISOString(),
      counts: {
        projectiles: projectiles.length,
        powders: powders.length,
        calibers: calibers.length,
        loads: loads.length,
      },
    },
    projectiles,
    powders,
    calibers,
    loads,
  };

  // Ensure output directory exists
  const outDir = dirname(OUTPUT_FILE);
  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
  }

  writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf-8');
  console.log('');
  console.log(`Done. Wrote ${OUTPUT_FILE}`);
  console.log(
    `  ${projectiles.length} projectiles, ${powders.length} powders, ` +
    `${calibers.length} calibers, ${loads.length} loads`
  );
}

main();
