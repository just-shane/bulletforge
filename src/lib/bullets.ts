/**
 * Popular bullet database organized by manufacturer and caliber
 */

export type BulletType =
  | "FMJ" | "HP" | "BTHP" | "ELD-X" | "ELD-M" | "A-MAX"
  | "SMK" | "VLD" | "AccuBond" | "Partition" | "TMK"
  | "GameKing" | "MatchKing" | "Pro-Hunter" | "SST"
  | "InterLock" | "CX" | "LRX" | "TTSX" | "E-Tip"
  | "Hybrid" | "OTM" | "RN" | "SP" | "LR";

export interface Bullet {
  name: string;
  manufacturer: string;
  caliber: number;        // nominal (e.g., .264)
  weight: number;         // grains
  bc_g1: number;
  bc_g7: number;
  type: BulletType;
  diameter: number;       // inches
  length: number;         // inches (approximate)
  sectionalDensity: number;
}

export const BULLETS: Bullet[] = [
  // =========================================================================
  // .224 caliber (5.56mm)
  // =========================================================================
  { name: "55gr FMJ-BT", manufacturer: "Hornady", caliber: 0.224, weight: 55, bc_g1: 0.243, bc_g7: 0.122, type: "FMJ", diameter: 0.224, length: 0.740, sectionalDensity: 0.157 },
  { name: "62gr SS109 FMJ", manufacturer: "Sierra", caliber: 0.224, weight: 62, bc_g1: 0.274, bc_g7: 0.140, type: "FMJ", diameter: 0.224, length: 0.800, sectionalDensity: 0.177 },
  { name: "69gr MatchKing HPBT", manufacturer: "Sierra", caliber: 0.224, weight: 69, bc_g1: 0.301, bc_g7: 0.153, type: "SMK", diameter: 0.224, length: 0.870, sectionalDensity: 0.197 },
  { name: "73gr ELD-M", manufacturer: "Hornady", caliber: 0.224, weight: 73, bc_g1: 0.390, bc_g7: 0.200, type: "ELD-M", diameter: 0.224, length: 0.935, sectionalDensity: 0.208 },
  { name: "77gr MatchKing HPBT", manufacturer: "Sierra", caliber: 0.224, weight: 77, bc_g1: 0.372, bc_g7: 0.190, type: "SMK", diameter: 0.224, length: 0.960, sectionalDensity: 0.219 },
  { name: "75gr BTHP Match", manufacturer: "Hornady", caliber: 0.224, weight: 75, bc_g1: 0.395, bc_g7: 0.202, type: "BTHP", diameter: 0.224, length: 0.950, sectionalDensity: 0.214 },
  { name: "80gr VLD Target", manufacturer: "Berger", caliber: 0.224, weight: 80, bc_g1: 0.420, bc_g7: 0.215, type: "VLD", diameter: 0.224, length: 0.990, sectionalDensity: 0.228 },

  // =========================================================================
  // .243 caliber (6mm)
  // =========================================================================
  { name: "87gr V-MAX", manufacturer: "Hornady", caliber: 0.243, weight: 87, bc_g1: 0.400, bc_g7: 0.205, type: "HP", diameter: 0.243, length: 0.990, sectionalDensity: 0.210 },
  { name: "95gr SST", manufacturer: "Hornady", caliber: 0.243, weight: 95, bc_g1: 0.430, bc_g7: 0.220, type: "SST", diameter: 0.243, length: 1.040, sectionalDensity: 0.230 },
  { name: "103gr ELD-X", manufacturer: "Hornady", caliber: 0.243, weight: 103, bc_g1: 0.512, bc_g7: 0.262, type: "ELD-X", diameter: 0.243, length: 1.100, sectionalDensity: 0.249 },
  { name: "105gr Hybrid Target", manufacturer: "Berger", caliber: 0.243, weight: 105, bc_g1: 0.533, bc_g7: 0.272, type: "Hybrid", diameter: 0.243, length: 1.110, sectionalDensity: 0.254 },
  { name: "108gr ELD-M", manufacturer: "Hornady", caliber: 0.243, weight: 108, bc_g1: 0.536, bc_g7: 0.274, type: "ELD-M", diameter: 0.243, length: 1.130, sectionalDensity: 0.261 },
  { name: "107gr MatchKing HPBT", manufacturer: "Sierra", caliber: 0.243, weight: 107, bc_g1: 0.527, bc_g7: 0.269, type: "SMK", diameter: 0.243, length: 1.120, sectionalDensity: 0.259 },
  { name: "100gr Partition", manufacturer: "Nosler", caliber: 0.243, weight: 100, bc_g1: 0.384, bc_g7: 0.196, type: "Partition", diameter: 0.243, length: 1.050, sectionalDensity: 0.242 },

  // =========================================================================
  // .264 caliber (6.5mm)
  // =========================================================================
  { name: "120gr GMX", manufacturer: "Hornady", caliber: 0.264, weight: 120, bc_g1: 0.410, bc_g7: 0.210, type: "CX", diameter: 0.264, length: 1.145, sectionalDensity: 0.246 },
  { name: "130gr ELD-M", manufacturer: "Hornady", caliber: 0.264, weight: 130, bc_g1: 0.520, bc_g7: 0.266, type: "ELD-M", diameter: 0.264, length: 1.200, sectionalDensity: 0.266 },
  { name: "140gr ELD-M", manufacturer: "Hornady", caliber: 0.264, weight: 140, bc_g1: 0.585, bc_g7: 0.307, type: "ELD-M", diameter: 0.264, length: 1.300, sectionalDensity: 0.287 },
  { name: "140gr ELD-X", manufacturer: "Hornady", caliber: 0.264, weight: 140, bc_g1: 0.553, bc_g7: 0.291, type: "ELD-X", diameter: 0.264, length: 1.280, sectionalDensity: 0.287 },
  { name: "140gr MatchKing HPBT", manufacturer: "Sierra", caliber: 0.264, weight: 140, bc_g1: 0.535, bc_g7: 0.284, type: "SMK", diameter: 0.264, length: 1.260, sectionalDensity: 0.287 },
  { name: "143gr ELD-X", manufacturer: "Hornady", caliber: 0.264, weight: 143, bc_g1: 0.625, bc_g7: 0.315, type: "ELD-X", diameter: 0.264, length: 1.330, sectionalDensity: 0.293 },
  { name: "140gr Hybrid Target", manufacturer: "Berger", caliber: 0.264, weight: 140, bc_g1: 0.586, bc_g7: 0.311, type: "Hybrid", diameter: 0.264, length: 1.310, sectionalDensity: 0.287 },
  { name: "130gr AccuBond", manufacturer: "Nosler", caliber: 0.264, weight: 130, bc_g1: 0.488, bc_g7: 0.249, type: "AccuBond", diameter: 0.264, length: 1.190, sectionalDensity: 0.266 },

  // =========================================================================
  // .277 caliber
  // =========================================================================
  { name: "130gr InterLock SP", manufacturer: "Hornady", caliber: 0.277, weight: 130, bc_g1: 0.409, bc_g7: 0.209, type: "InterLock", diameter: 0.277, length: 1.180, sectionalDensity: 0.242 },
  { name: "130gr AccuBond", manufacturer: "Nosler", caliber: 0.277, weight: 130, bc_g1: 0.435, bc_g7: 0.222, type: "AccuBond", diameter: 0.277, length: 1.200, sectionalDensity: 0.242 },
  { name: "140gr ELD-X", manufacturer: "Hornady", caliber: 0.277, weight: 140, bc_g1: 0.480, bc_g7: 0.245, type: "ELD-X", diameter: 0.277, length: 1.250, sectionalDensity: 0.261 },
  { name: "145gr ELD-X", manufacturer: "Hornady", caliber: 0.277, weight: 145, bc_g1: 0.536, bc_g7: 0.274, type: "ELD-X", diameter: 0.277, length: 1.290, sectionalDensity: 0.270 },
  { name: "150gr Partition", manufacturer: "Nosler", caliber: 0.277, weight: 150, bc_g1: 0.465, bc_g7: 0.238, type: "Partition", diameter: 0.277, length: 1.280, sectionalDensity: 0.279 },
  { name: "140gr GameKing BTSP", manufacturer: "Sierra", caliber: 0.277, weight: 140, bc_g1: 0.460, bc_g7: 0.235, type: "GameKing", diameter: 0.277, length: 1.240, sectionalDensity: 0.261 },

  // =========================================================================
  // .284 caliber (7mm)
  // =========================================================================
  { name: "150gr SST", manufacturer: "Hornady", caliber: 0.284, weight: 150, bc_g1: 0.425, bc_g7: 0.217, type: "SST", diameter: 0.284, length: 1.240, sectionalDensity: 0.266 },
  { name: "162gr ELD-X", manufacturer: "Hornady", caliber: 0.284, weight: 162, bc_g1: 0.564, bc_g7: 0.288, type: "ELD-X", diameter: 0.284, length: 1.350, sectionalDensity: 0.287 },
  { name: "168gr MatchKing HPBT", manufacturer: "Sierra", caliber: 0.284, weight: 168, bc_g1: 0.545, bc_g7: 0.279, type: "SMK", diameter: 0.284, length: 1.370, sectionalDensity: 0.298 },
  { name: "175gr ELD-X", manufacturer: "Hornady", caliber: 0.284, weight: 175, bc_g1: 0.617, bc_g7: 0.315, type: "ELD-X", diameter: 0.284, length: 1.410, sectionalDensity: 0.310 },
  { name: "180gr VLD Hunting", manufacturer: "Berger", caliber: 0.284, weight: 180, bc_g1: 0.659, bc_g7: 0.337, type: "VLD", diameter: 0.284, length: 1.440, sectionalDensity: 0.319 },
  { name: "160gr AccuBond", manufacturer: "Nosler", caliber: 0.284, weight: 160, bc_g1: 0.531, bc_g7: 0.271, type: "AccuBond", diameter: 0.284, length: 1.320, sectionalDensity: 0.283 },

  // =========================================================================
  // .308 caliber (7.62mm)
  // =========================================================================
  { name: "147gr FMJ M80", manufacturer: "Sierra", caliber: 0.308, weight: 147, bc_g1: 0.393, bc_g7: 0.201, type: "FMJ", diameter: 0.308, length: 1.140, sectionalDensity: 0.221 },
  { name: "168gr MatchKing HPBT", manufacturer: "Sierra", caliber: 0.308, weight: 168, bc_g1: 0.462, bc_g7: 0.243, type: "SMK", diameter: 0.308, length: 1.215, sectionalDensity: 0.253 },
  { name: "175gr MatchKing HPBT", manufacturer: "Sierra", caliber: 0.308, weight: 175, bc_g1: 0.496, bc_g7: 0.260, type: "SMK", diameter: 0.308, length: 1.240, sectionalDensity: 0.264 },
  { name: "178gr ELD-X", manufacturer: "Hornady", caliber: 0.308, weight: 178, bc_g1: 0.535, bc_g7: 0.276, type: "ELD-X", diameter: 0.308, length: 1.295, sectionalDensity: 0.268 },
  { name: "190gr MatchKing HPBT", manufacturer: "Sierra", caliber: 0.308, weight: 190, bc_g1: 0.533, bc_g7: 0.276, type: "SMK", diameter: 0.308, length: 1.310, sectionalDensity: 0.286 },
  { name: "200gr ELD-X", manufacturer: "Hornady", caliber: 0.308, weight: 200, bc_g1: 0.597, bc_g7: 0.310, type: "ELD-X", diameter: 0.308, length: 1.370, sectionalDensity: 0.301 },
  { name: "208gr ELD-M", manufacturer: "Hornady", caliber: 0.308, weight: 208, bc_g1: 0.670, bc_g7: 0.343, type: "ELD-M", diameter: 0.308, length: 1.450, sectionalDensity: 0.313 },
  { name: "215gr Hybrid Target", manufacturer: "Berger", caliber: 0.308, weight: 215, bc_g1: 0.691, bc_g7: 0.354, type: "Hybrid", diameter: 0.308, length: 1.470, sectionalDensity: 0.323 },
  { name: "165gr AccuBond", manufacturer: "Nosler", caliber: 0.308, weight: 165, bc_g1: 0.475, bc_g7: 0.243, type: "AccuBond", diameter: 0.308, length: 1.210, sectionalDensity: 0.248 },

  // =========================================================================
  // .338 caliber
  // =========================================================================
  { name: "225gr ELD-M", manufacturer: "Hornady", caliber: 0.338, weight: 225, bc_g1: 0.571, bc_g7: 0.292, type: "ELD-M", diameter: 0.338, length: 1.470, sectionalDensity: 0.281 },
  { name: "250gr MatchKing HPBT", manufacturer: "Sierra", caliber: 0.338, weight: 250, bc_g1: 0.587, bc_g7: 0.300, type: "SMK", diameter: 0.338, length: 1.530, sectionalDensity: 0.313 },
  { name: "285gr ELD-M", manufacturer: "Hornady", caliber: 0.338, weight: 285, bc_g1: 0.720, bc_g7: 0.368, type: "ELD-M", diameter: 0.338, length: 1.650, sectionalDensity: 0.356 },
  { name: "300gr Hybrid OTM Tactical", manufacturer: "Berger", caliber: 0.338, weight: 300, bc_g1: 0.768, bc_g7: 0.393, type: "Hybrid", diameter: 0.338, length: 1.700, sectionalDensity: 0.375 },
  { name: "300gr MatchKing HPBT", manufacturer: "Sierra", caliber: 0.338, weight: 300, bc_g1: 0.745, bc_g7: 0.381, type: "SMK", diameter: 0.338, length: 1.680, sectionalDensity: 0.375 },
  { name: "250gr Partition", manufacturer: "Nosler", caliber: 0.338, weight: 250, bc_g1: 0.473, bc_g7: 0.242, type: "Partition", diameter: 0.338, length: 1.450, sectionalDensity: 0.313 },

  // =========================================================================
  // .375 caliber
  // =========================================================================
  { name: "250gr GMX", manufacturer: "Hornady", caliber: 0.375, weight: 250, bc_g1: 0.340, bc_g7: 0.174, type: "CX", diameter: 0.375, length: 1.400, sectionalDensity: 0.254 },
  { name: "270gr InterLock SP-RP", manufacturer: "Hornady", caliber: 0.375, weight: 270, bc_g1: 0.370, bc_g7: 0.189, type: "InterLock", diameter: 0.375, length: 1.430, sectionalDensity: 0.274 },
  { name: "300gr Partition", manufacturer: "Nosler", caliber: 0.375, weight: 300, bc_g1: 0.398, bc_g7: 0.204, type: "Partition", diameter: 0.375, length: 1.510, sectionalDensity: 0.305 },
  { name: "300gr DGX Bonded", manufacturer: "Hornady", caliber: 0.375, weight: 300, bc_g1: 0.336, bc_g7: 0.172, type: "FMJ", diameter: 0.375, length: 1.490, sectionalDensity: 0.305 },
  { name: "300gr MatchKing HPBT", manufacturer: "Sierra", caliber: 0.375, weight: 300, bc_g1: 0.420, bc_g7: 0.215, type: "SMK", diameter: 0.375, length: 1.520, sectionalDensity: 0.305 },

  // =========================================================================
  // .510 caliber (50 BMG)
  // =========================================================================
  { name: "647gr M33 Ball FMJ", manufacturer: "Sierra", caliber: 0.510, weight: 647, bc_g1: 0.950, bc_g7: 0.486, type: "FMJ", diameter: 0.510, length: 2.310, sectionalDensity: 0.355 },
  { name: "660gr FMJ-BT M33", manufacturer: "Hornady", caliber: 0.510, weight: 660, bc_g1: 1.050, bc_g7: 0.536, type: "FMJ", diameter: 0.510, length: 2.350, sectionalDensity: 0.362 },
  { name: "750gr A-MAX", manufacturer: "Hornady", caliber: 0.510, weight: 750, bc_g1: 1.050, bc_g7: 0.537, type: "A-MAX", diameter: 0.510, length: 2.550, sectionalDensity: 0.412 },
  { name: "700gr VLD", manufacturer: "Berger", caliber: 0.510, weight: 700, bc_g1: 1.020, bc_g7: 0.522, type: "VLD", diameter: 0.510, length: 2.450, sectionalDensity: 0.384 },
  { name: "800gr MatchKing", manufacturer: "Sierra", caliber: 0.510, weight: 800, bc_g1: 1.140, bc_g7: 0.583, type: "SMK", diameter: 0.510, length: 2.620, sectionalDensity: 0.439 },
];

/**
 * Get bullets matching a given caliber (diameter)
 */
export function bulletsByCaliber(diameter: number): Bullet[] {
  return BULLETS.filter((b) => Math.abs(b.diameter - diameter) < 0.002);
}

/**
 * Get all unique calibers
 */
export function uniqueCalibers(): number[] {
  const set = new Set(BULLETS.map((b) => b.caliber));
  return [...set].sort((a, b) => a - b);
}
