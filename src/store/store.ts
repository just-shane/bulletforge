import { create } from "zustand";
import type { TrajectoryPoint } from "../lib/ballistics.ts";
import type { Cartridge } from "../lib/cartridges.ts";
import type { Bullet } from "../lib/bullets.ts";
import type { InternalBallisticsResult } from "../lib/internal-ballistics.ts";
import { CARTRIDGES } from "../lib/cartridges.ts";
import { BULLETS, bulletsByCaliber } from "../lib/bullets.ts";
import { CARTRIDGE_INTERNAL_DATA } from "../lib/internal-ballistics.ts";

// Default cartridge: 6.5 Creedmoor
const defaultCartridge = CARTRIDGES.find((c) => c.shortName === "6.5 CM")!;
const defaultBullets = bulletsByCaliber(defaultCartridge.bulletDiameter);
const defaultBullet = defaultBullets.find((b) => b.name === "140gr ELD-M" && b.manufacturer === "Hornady") ?? defaultBullets[0];
const defaultCartridgeInternal = CARTRIDGE_INTERNAL_DATA["6.5 CM"];

export type AppTab = "external" | "internal" | "loaddev";

export interface BallisticsStore {
  // Selections
  cartridge: Cartridge;
  bullet: Bullet;
  availableBullets: Bullet[];

  // Ballistic parameters
  muzzleVelocity: number;
  sightHeight: number;       // inches
  zeroRange: number;          // yards
  windSpeed: number;          // mph
  windAngle: number;          // degrees
  shootingAngle: number;      // degrees
  altitude: number;           // feet
  temperature: number;        // degrees F
  barometricPressure: number; // inHg
  humidity: number;           // 0-1

  // External ballistics results
  trajectoryResults: TrajectoryPoint[];
  maxOrdinate: number;
  transonicRange: number;
  subsonicRange: number;

  // Internal ballistics parameters
  powderName: string;
  chargeWeight: number;       // grains
  barrelLength: number;       // inches

  // Internal ballistics results
  internalResult: InternalBallisticsResult | null;

  // UI state
  activeTab: AppTab;
  glossaryOpen: boolean;
  docsOpen: boolean;

  // Actions — External
  setCartridge: (cartridge: Cartridge) => void;
  setBullet: (bullet: Bullet) => void;
  setVelocity: (velocity: number) => void;
  setSightHeight: (height: number) => void;
  setZero: (range: number) => void;
  setWind: (speed: number, angle: number) => void;
  setWindSpeed: (speed: number) => void;
  setWindAngle: (angle: number) => void;
  setShootingAngle: (angle: number) => void;
  setEnvironment: (altitude: number, temperature: number, pressure: number) => void;
  setAltitude: (altitude: number) => void;
  setTemperature: (temperature: number) => void;
  setBarometricPressure: (pressure: number) => void;
  setTrajectoryResults: (
    results: TrajectoryPoint[],
    maxOrdinate: number,
    transonicRange: number,
    subsonicRange: number
  ) => void;

  // Actions — Internal
  setPowderName: (name: string) => void;
  setChargeWeight: (weight: number) => void;
  setBarrelLength: (length: number) => void;
  setInternalResult: (result: InternalBallisticsResult | null) => void;

  // Actions — UI
  setActiveTab: (tab: AppTab) => void;
  setGlossaryOpen: (open: boolean) => void;
  setDocsOpen: (open: boolean) => void;
}

export const useBallisticsStore = create<BallisticsStore>((set) => ({
  // Default state
  cartridge: defaultCartridge,
  bullet: defaultBullet,
  availableBullets: defaultBullets,

  muzzleVelocity: defaultCartridge.typicalVelocity,
  sightHeight: 1.5,
  zeroRange: 100,
  windSpeed: 0,
  windAngle: 90,
  shootingAngle: 0,
  altitude: 0,
  temperature: 59,
  barometricPressure: 29.92,
  humidity: 0.78,

  trajectoryResults: [],
  maxOrdinate: 0,
  transonicRange: 0,
  subsonicRange: 0,

  // Internal ballistics defaults (6.5 CM + H4350)
  powderName: "H4350",
  chargeWeight: 41.5,
  barrelLength: defaultCartridgeInternal?.typicalBarrelLength ?? 24,

  internalResult: null,

  // UI
  activeTab: "external",
  glossaryOpen: false,
  docsOpen: false,

  setCartridge: (cartridge) => {
    const available = bulletsByCaliber(cartridge.bulletDiameter);
    const closestBullet = available.find(
      (b) => Math.abs(b.weight - cartridge.typicalBulletWeight) < 5
    ) ?? available[0] ?? BULLETS[0];
    const internalData = CARTRIDGE_INTERNAL_DATA[cartridge.shortName];
    const midCharge = internalData
      ? (internalData.typicalChargeRange.min + internalData.typicalChargeRange.max) / 2
      : 40;
    set({
      cartridge,
      availableBullets: available,
      bullet: closestBullet,
      muzzleVelocity: cartridge.typicalVelocity,
      chargeWeight: Math.round(midCharge * 10) / 10,
      barrelLength: internalData?.typicalBarrelLength ?? 24,
      internalResult: null,
    });
  },

  setBullet: (bullet) => set({ bullet, internalResult: null }),

  setVelocity: (velocity) => set({ muzzleVelocity: velocity }),

  setSightHeight: (height) => set({ sightHeight: height }),

  setZero: (range) => set({ zeroRange: range }),

  setWind: (speed, angle) => set({ windSpeed: speed, windAngle: angle }),

  setWindSpeed: (speed) => set({ windSpeed: speed }),

  setWindAngle: (angle) => set({ windAngle: angle }),

  setShootingAngle: (angle) => set({ shootingAngle: angle }),

  setEnvironment: (altitude, temperature, pressure) =>
    set({ altitude, temperature, barometricPressure: pressure }),

  setAltitude: (altitude) => set({ altitude }),

  setTemperature: (temperature) => set({ temperature }),

  setBarometricPressure: (pressure) => set({ barometricPressure: pressure }),

  setTrajectoryResults: (results, maxOrdinate, transonicRange, subsonicRange) =>
    set({ trajectoryResults: results, maxOrdinate, transonicRange, subsonicRange }),

  // Internal ballistics actions
  setPowderName: (name) => set({ powderName: name, internalResult: null }),

  setChargeWeight: (weight) => set({ chargeWeight: weight, internalResult: null }),

  setBarrelLength: (length) => set({ barrelLength: length, internalResult: null }),

  setInternalResult: (result) => set({ internalResult: result }),

  // UI actions
  setActiveTab: (tab) => set({ activeTab: tab }),

  setGlossaryOpen: (open) => set({ glossaryOpen: open }),

  setDocsOpen: (open) => set({ docsOpen: open }),
}));
