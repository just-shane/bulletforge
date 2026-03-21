/**
 * Common cartridge database with SAAMI specifications
 */

export type CartridgeType = "rifle" | "pistol" | "rimfire";

export interface Cartridge {
  name: string;
  shortName: string;
  caliber: number;           // inches
  bulletDiameter: number;    // inches
  maxPressure: number;       // psi (SAAMI MAP)
  typicalVelocity: number;   // fps (typical factory load)
  typicalBulletWeight: number; // grains
  typicalBC_G1: number;
  typicalBC_G7: number;
  cartridgeType: CartridgeType;
  description: string;
}

export const CARTRIDGES: Cartridge[] = [
  {
    name: ".22 Long Rifle",
    shortName: ".22 LR",
    caliber: 0.223,
    bulletDiameter: 0.223,
    maxPressure: 24000,
    typicalVelocity: 1255,
    typicalBulletWeight: 40,
    typicalBC_G1: 0.132,
    typicalBC_G7: 0.067,
    cartridgeType: "rimfire",
    description: "The world's most popular rimfire cartridge. Ideal for plinking, small game, and training.",
  },
  {
    name: ".223 Remington",
    shortName: ".223 Rem",
    caliber: 0.224,
    bulletDiameter: 0.224,
    maxPressure: 55000,
    typicalVelocity: 3240,
    typicalBulletWeight: 55,
    typicalBC_G1: 0.243,
    typicalBC_G7: 0.122,
    cartridgeType: "rifle",
    description: "Versatile intermediate cartridge. Military equivalent: 5.56x45mm NATO. Popular for varmint hunting and target shooting.",
  },
  {
    name: "6mm ARC",
    shortName: "6mm ARC",
    caliber: 0.243,
    bulletDiameter: 0.243,
    maxPressure: 52000,
    typicalVelocity: 2750,
    typicalBulletWeight: 108,
    typicalBC_G1: 0.536,
    typicalBC_G7: 0.274,
    cartridgeType: "rifle",
    description: "Advanced Rifle Cartridge by Hornady. AR-15 compatible with excellent long-range performance.",
  },
  {
    name: ".243 Winchester",
    shortName: ".243 Win",
    caliber: 0.243,
    bulletDiameter: 0.243,
    maxPressure: 60000,
    typicalVelocity: 3025,
    typicalBulletWeight: 100,
    typicalBC_G1: 0.405,
    typicalBC_G7: 0.207,
    cartridgeType: "rifle",
    description: "Versatile short-action cartridge. Excellent for deer hunting and varmint shooting with light recoil.",
  },
  {
    name: "6.5 Creedmoor",
    shortName: "6.5 CM",
    caliber: 0.264,
    bulletDiameter: 0.264,
    maxPressure: 62000,
    typicalVelocity: 2700,
    typicalBulletWeight: 140,
    typicalBC_G1: 0.585,
    typicalBC_G7: 0.307,
    cartridgeType: "rifle",
    description: "The gold standard for long-range precision. Excellent BC-to-recoil ratio, inherently accurate.",
  },
  {
    name: "6.5 PRC",
    shortName: "6.5 PRC",
    caliber: 0.264,
    bulletDiameter: 0.264,
    maxPressure: 65000,
    typicalVelocity: 2910,
    typicalBulletWeight: 143,
    typicalBC_G1: 0.625,
    typicalBC_G7: 0.315,
    cartridgeType: "rifle",
    description: "Precision Rifle Cartridge. Faster 6.5mm option for long-range hunting and competition.",
  },
  {
    name: ".270 Winchester",
    shortName: ".270 Win",
    caliber: 0.277,
    bulletDiameter: 0.277,
    maxPressure: 65000,
    typicalVelocity: 3060,
    typicalBulletWeight: 130,
    typicalBC_G1: 0.433,
    typicalBC_G7: 0.221,
    cartridgeType: "rifle",
    description: "Jack O'Connor's favorite. One of the most popular big game cartridges in North America.",
  },
  {
    name: "7mm Remington Magnum",
    shortName: "7mm Rem Mag",
    caliber: 0.284,
    bulletDiameter: 0.284,
    maxPressure: 61000,
    typicalVelocity: 3110,
    typicalBulletWeight: 162,
    typicalBC_G1: 0.534,
    typicalBC_G7: 0.274,
    cartridgeType: "rifle",
    description: "Legendary magnum cartridge. Flat-shooting with excellent long-range energy retention.",
  },
  {
    name: ".308 Winchester",
    shortName: ".308 Win",
    caliber: 0.308,
    bulletDiameter: 0.308,
    maxPressure: 62000,
    typicalVelocity: 2820,
    typicalBulletWeight: 168,
    typicalBC_G1: 0.462,
    typicalBC_G7: 0.243,
    cartridgeType: "rifle",
    description: "Military equivalent: 7.62x51mm NATO. The workhorse of precision rifles and big game hunting.",
  },
  {
    name: ".30-06 Springfield",
    shortName: ".30-06",
    caliber: 0.308,
    bulletDiameter: 0.308,
    maxPressure: 60000,
    typicalVelocity: 2910,
    typicalBulletWeight: 165,
    typicalBC_G1: 0.450,
    typicalBC_G7: 0.230,
    cartridgeType: "rifle",
    description: "America's cartridge since 1906. Versatile and proven on every game animal in North America.",
  },
  {
    name: ".300 Winchester Magnum",
    shortName: ".300 Win Mag",
    caliber: 0.308,
    bulletDiameter: 0.308,
    maxPressure: 64000,
    typicalVelocity: 3000,
    typicalBulletWeight: 190,
    typicalBC_G1: 0.533,
    typicalBC_G7: 0.276,
    cartridgeType: "rifle",
    description: "The most popular .30 caliber magnum worldwide. Excellent for long-range hunting and military sniping.",
  },
  {
    name: ".300 PRC",
    shortName: ".300 PRC",
    caliber: 0.308,
    bulletDiameter: 0.308,
    maxPressure: 65000,
    typicalVelocity: 2810,
    typicalBulletWeight: 225,
    typicalBC_G1: 0.670,
    typicalBC_G7: 0.343,
    cartridgeType: "rifle",
    description: "Precision Rifle Cartridge designed for heavy long-range bullets. Adopted by USSOCOM.",
  },
  {
    name: ".338 Lapua Magnum",
    shortName: ".338 Lapua",
    caliber: 0.338,
    bulletDiameter: 0.338,
    maxPressure: 60916,
    typicalVelocity: 2745,
    typicalBulletWeight: 300,
    typicalBC_G1: 0.768,
    typicalBC_G7: 0.393,
    cartridgeType: "rifle",
    description: "Extreme long-range cartridge. World record shots beyond 2,000 yards. Military anti-materiel round.",
  },
  {
    name: ".375 H&H Magnum",
    shortName: ".375 H&H",
    caliber: 0.375,
    bulletDiameter: 0.375,
    maxPressure: 62000,
    typicalVelocity: 2530,
    typicalBulletWeight: 300,
    typicalBC_G1: 0.398,
    typicalBC_G7: 0.204,
    cartridgeType: "rifle",
    description: "The minimum legal caliber for dangerous game in Africa. A classic since 1912.",
  },
  {
    name: ".50 BMG",
    shortName: ".50 BMG",
    caliber: 0.510,
    bulletDiameter: 0.510,
    maxPressure: 54923,
    typicalVelocity: 2910,
    typicalBulletWeight: 660,
    typicalBC_G1: 1.050,
    typicalBC_G7: 0.536,
    cartridgeType: "rifle",
    description: "Browning Machine Gun cartridge. Anti-materiel and extreme long-range. Effective beyond 2,000 yards.",
  },
];

/**
 * Find a cartridge by short name
 */
export function findCartridge(shortName: string): Cartridge | undefined {
  return CARTRIDGES.find((c) => c.shortName === shortName);
}

/**
 * Get cartridges grouped by type
 */
export function cartridgesByType(): Record<CartridgeType, Cartridge[]> {
  const groups: Record<CartridgeType, Cartridge[]> = {
    rifle: [],
    pistol: [],
    rimfire: [],
  };
  for (const c of CARTRIDGES) {
    groups[c.cartridgeType].push(c);
  }
  return groups;
}
