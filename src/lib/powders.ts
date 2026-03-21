/**
 * Powder burn rate database
 * Burn rate values are relative (1 = fastest, 200 = slowest)
 */

export type PowderType = "rifle" | "pistol" | "shotgun";
export type TemperatureSensitivity = "low" | "medium" | "high";

export interface Powder {
  name: string;
  manufacturer: string;
  burnRate: number;
  type: PowderType;
  temperatureSensitivity: TemperatureSensitivity;
  description: string;
}

export const POWDERS: Powder[] = [
  // Hodgdon
  {
    name: "H110",
    manufacturer: "Hodgdon",
    burnRate: 28,
    type: "pistol",
    temperatureSensitivity: "medium",
    description: "Spherical magnum pistol/small rifle powder. Standard for .300 Blackout subsonic.",
  },
  {
    name: "H335",
    manufacturer: "Hodgdon",
    burnRate: 70,
    type: "rifle",
    temperatureSensitivity: "medium",
    description: "Spherical powder, military spec, ideal for .223 Rem and 5.56 NATO loads.",
  },
  {
    name: "BL-C(2)",
    manufacturer: "Hodgdon",
    burnRate: 73,
    type: "rifle",
    temperatureSensitivity: "medium",
    description: "Spherical military surplus type powder. Excellent for .223 Rem and .308 Win.",
  },
  {
    name: "CFE 223",
    manufacturer: "Hodgdon",
    burnRate: 75,
    type: "rifle",
    temperatureSensitivity: "low",
    description: "Copper Fouling Eraser technology. Outstanding in .223 Rem and many other cartridges.",
  },
  {
    name: "Varget",
    manufacturer: "Hodgdon",
    burnRate: 82,
    type: "rifle",
    temperatureSensitivity: "low",
    description: "Extreme extruded powder. Insensitive to temperature. Top choice for .308 Win and .223 Rem precision.",
  },
  {
    name: "H4350",
    manufacturer: "Hodgdon",
    burnRate: 95,
    type: "rifle",
    temperatureSensitivity: "low",
    description: "Extreme extruded powder. The #1 choice for 6.5 Creedmoor. Temperature insensitive.",
  },
  {
    name: "H4831",
    manufacturer: "Hodgdon",
    burnRate: 105,
    type: "rifle",
    temperatureSensitivity: "low",
    description: "Extreme extruded powder. Excellent for medium overbore magnums like .270 Win.",
  },
  {
    name: "H1000",
    manufacturer: "Hodgdon",
    burnRate: 118,
    type: "rifle",
    temperatureSensitivity: "low",
    description: "Extreme extruded slow-burning powder. Ideal for heavy bullets in overbore magnums.",
  },
  {
    name: "Retumbo",
    manufacturer: "Hodgdon",
    burnRate: 125,
    type: "rifle",
    temperatureSensitivity: "low",
    description: "Very slow burning, temperature insensitive. Top choice for .300 Win Mag and .338 Lapua.",
  },

  // Alliant
  {
    name: "Power Pro 2000-MR",
    manufacturer: "Alliant",
    burnRate: 85,
    type: "rifle",
    temperatureSensitivity: "low",
    description: "Medium-rate spherical powder. Clean burning, excellent metering for progressive presses.",
  },
  {
    name: "Reloder 16",
    manufacturer: "Alliant",
    burnRate: 92,
    type: "rifle",
    temperatureSensitivity: "low",
    description: "Temperature insensitive extruded powder. Excellent for 6.5 Creedmoor and .260 Rem.",
  },
  {
    name: "Reloder 22",
    manufacturer: "Alliant",
    burnRate: 110,
    type: "rifle",
    temperatureSensitivity: "medium",
    description: "Slow-burning magnum powder. Popular for 7mm Rem Mag and .300 Win Mag.",
  },
  {
    name: "Reloder 26",
    manufacturer: "Alliant",
    burnRate: 120,
    type: "rifle",
    temperatureSensitivity: "low",
    description: "ELD-Temperature technology. Excellent for 6.5 PRC, 7mm Rem Mag with heavy bullets.",
  },

  // Vihtavuori
  {
    name: "N140",
    manufacturer: "Vihtavuori",
    burnRate: 78,
    type: "rifle",
    temperatureSensitivity: "low",
    description: "Benchrest-grade extruded powder. Extremely consistent. Ideal for .223 Rem and .308 Win.",
  },
  {
    name: "N150",
    manufacturer: "Vihtavuori",
    burnRate: 88,
    type: "rifle",
    temperatureSensitivity: "low",
    description: "Versatile medium-burn extruded powder. Excellent for .308 Win and 6.5 Creedmoor.",
  },
  {
    name: "N160",
    manufacturer: "Vihtavuori",
    burnRate: 100,
    type: "rifle",
    temperatureSensitivity: "low",
    description: "Slow-burning extruded powder. Great for .270 Win, .30-06, and similar cartridges.",
  },
  {
    name: "N165",
    manufacturer: "Vihtavuori",
    burnRate: 108,
    type: "rifle",
    temperatureSensitivity: "low",
    description: "Slow-burning for magnum cartridges. Top performer in 7mm Rem Mag.",
  },
  {
    name: "N550",
    manufacturer: "Vihtavuori",
    burnRate: 93,
    type: "rifle",
    temperatureSensitivity: "low",
    description: "High-energy density extruded. The go-to powder for 6.5 Creedmoor in competition.",
  },
  {
    name: "N570",
    manufacturer: "Vihtavuori",
    burnRate: 122,
    type: "rifle",
    temperatureSensitivity: "low",
    description: "Very slow burning, high energy. Designed for large overbore magnums with heavy bullets.",
  },

  // IMR
  {
    name: "IMR 4064",
    manufacturer: "IMR",
    burnRate: 80,
    type: "rifle",
    temperatureSensitivity: "medium",
    description: "Classic extruded powder. Versatile for .223 Rem through .30-06. The original benchrest powder.",
  },
  {
    name: "IMR 4166",
    manufacturer: "IMR",
    burnRate: 84,
    type: "rifle",
    temperatureSensitivity: "low",
    description: "Enduron temperature insensitive. Copper fouling deterrent. Modern replacement for 4064.",
  },
  {
    name: "IMR 4350",
    manufacturer: "IMR",
    burnRate: 96,
    type: "rifle",
    temperatureSensitivity: "medium",
    description: "Classic medium-slow extruded powder. Outstanding in .243 Win and .270 Win.",
  },
  {
    name: "IMR 4831",
    manufacturer: "IMR",
    burnRate: 107,
    type: "rifle",
    temperatureSensitivity: "medium",
    description: "Slow-burning classic. Popular for .25-06, .270 Win, and .30-06 with heavy bullets.",
  },
  {
    name: "IMR 7828",
    manufacturer: "IMR",
    burnRate: 115,
    type: "rifle",
    temperatureSensitivity: "high",
    description: "Very slow burning extruded. Excellent for large magnums: .300 Win Mag, .338 Lapua.",
  },
];

/**
 * Get powders sorted by burn rate (fastest to slowest)
 */
export function powdersByBurnRate(): Powder[] {
  return [...POWDERS].sort((a, b) => a.burnRate - b.burnRate);
}

/**
 * Get powders by manufacturer
 */
export function powdersByManufacturer(manufacturer: string): Powder[] {
  return POWDERS.filter((p) => p.manufacturer === manufacturer);
}
