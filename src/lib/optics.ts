export interface ScopeProfile {
  reticleUnit: "MIL" | "MOA";
  clickValue: number;          // e.g., 0.1 for MIL, 0.25 for MOA
  focalPlane: "FFP" | "SFP";
  magnificationMin: number;    // e.g., 6
  magnificationMax: number;    // e.g., 24
  calibratedMag: number;       // For SFP: the mag where reticle subtension is correct (usually max)
  maxElevationTravel: number;  // total elevation travel in the scope's native unit (MOA or MIL)
  maxWindageTravel: number;    // total windage travel
}

export const DEFAULT_SCOPE: ScopeProfile = {
  reticleUnit: "MIL",
  clickValue: 0.1,
  focalPlane: "FFP",
  magnificationMin: 5,
  magnificationMax: 25,
  calibratedMag: 25,
  maxElevationTravel: 30,   // 30 MIL total
  maxWindageTravel: 20,
};

// Common scope presets
export const SCOPE_PRESETS: { name: string; scope: ScopeProfile }[] = [
  { name: "MIL/MIL FFP (Generic)", scope: { ...DEFAULT_SCOPE } },
  { name: "MOA/MOA FFP (Generic)", scope: { reticleUnit: "MOA", clickValue: 0.25, focalPlane: "FFP", magnificationMin: 4, magnificationMax: 16, calibratedMag: 16, maxElevationTravel: 100, maxWindageTravel: 60 } },
  { name: "Vortex Razor HD Gen III 6-36x56 (MIL)", scope: { reticleUnit: "MIL", clickValue: 0.1, focalPlane: "FFP", magnificationMin: 6, magnificationMax: 36, calibratedMag: 36, maxElevationTravel: 29.1, maxWindageTravel: 14.5 } },
  { name: "Nightforce ATACR 7-35x56 (MIL)", scope: { reticleUnit: "MIL", clickValue: 0.1, focalPlane: "FFP", magnificationMin: 7, magnificationMax: 35, calibratedMag: 35, maxElevationTravel: 30.0, maxWindageTravel: 17.5 } },
  { name: "Leupold VX-3HD 4.5-14x40 (MOA SFP)", scope: { reticleUnit: "MOA", clickValue: 0.25, focalPlane: "SFP", magnificationMin: 4.5, magnificationMax: 14, calibratedMag: 14, maxElevationTravel: 64, maxWindageTravel: 36 } },
  { name: "Vortex PST Gen II 5-25x50 (MOA FFP)", scope: { reticleUnit: "MOA", clickValue: 0.25, focalPlane: "FFP", magnificationMin: 5, magnificationMax: 25, calibratedMag: 25, maxElevationTravel: 90, maxWindageTravel: 50 } },
];

/** Convert MOA value to MIL */
export function moaToMil(moa: number): number {
  return moa / 3.43775;
}

/** Convert MIL value to MOA */
export function milToMoa(mil: number): number {
  return mil * 3.43775;
}

/** Calculate clicks needed for a given adjustment */
export function clicksForAdjustment(adjustmentInScopeUnit: number, clickValue: number): number {
  return Math.round(adjustmentInScopeUnit / clickValue);
}

/**
 * For SFP scopes: correct holdover for current magnification.
 * At calibratedMag, holdover is 1:1. At other mags, it scales.
 * Returns the apparent holdover the shooter sees in the reticle.
 */
export function sfpHoldoverCorrection(
  trueHoldover: number,
  currentMag: number,
  calibratedMag: number
): number {
  // The reticle subtension at currentMag appears as:
  // apparent = true * (calibratedMag / currentMag)
  // So to hold the correct amount, the shooter must hold:
  // requiredReticleHolds = true * (currentMag / calibratedMag)
  return trueHoldover * (currentMag / calibratedMag);
}
