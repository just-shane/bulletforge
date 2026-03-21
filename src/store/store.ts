import { create } from "zustand";
import type { TrajectoryPoint } from "../lib/ballistics.ts";
import type { Cartridge } from "../lib/cartridges.ts";
import type { Bullet } from "../lib/bullets.ts";
import { CARTRIDGES } from "../lib/cartridges.ts";
import { BULLETS, bulletsByCaliber } from "../lib/bullets.ts";

// Default cartridge: 6.5 Creedmoor
const defaultCartridge = CARTRIDGES.find((c) => c.shortName === "6.5 CM")!;
const defaultBullets = bulletsByCaliber(defaultCartridge.bulletDiameter);
const defaultBullet = defaultBullets.find((b) => b.name === "140gr ELD-M" && b.manufacturer === "Hornady") ?? defaultBullets[0];

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

  // Results
  trajectoryResults: TrajectoryPoint[];
  maxOrdinate: number;
  transonicRange: number;
  subsonicRange: number;

  // UI state
  glossaryOpen: boolean;
  docsOpen: boolean;

  // Actions
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

  glossaryOpen: false,
  docsOpen: false,

  setCartridge: (cartridge) => {
    const available = bulletsByCaliber(cartridge.bulletDiameter);
    const closestBullet = available.find(
      (b) => Math.abs(b.weight - cartridge.typicalBulletWeight) < 5
    ) ?? available[0] ?? BULLETS[0];
    set({
      cartridge,
      availableBullets: available,
      bullet: closestBullet,
      muzzleVelocity: cartridge.typicalVelocity,
    });
  },

  setBullet: (bullet) => set({ bullet }),

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

  setGlossaryOpen: (open) => set({ glossaryOpen: open }),

  setDocsOpen: (open) => set({ docsOpen: open }),
}));
