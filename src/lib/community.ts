/* ─── BulletForge Community Data Layer ───────────────────────────── */
/* Opt-in load sharing, crowd-sourced BCs, and reporting.            */

import { supabase } from "./supabase.ts";
import { useBallisticsStore } from "../store/store.ts";
import type { LoadCalibration } from "./storage.ts";
import type { Bullet } from "./bullets.ts";
import type { Cartridge } from "./cartridges.ts";
import type { InternalBallisticsResult } from "./internal-ballistics.ts";
import type { ConfidenceResult } from "./confidence.ts";

// ─── Interfaces ────────────────────────────────────────────────────

export interface SharedLoad {
  id: string;
  userId: string;
  cartridgeShortName: string;
  bulletName: string;
  bulletManufacturer: string;
  powderName: string;
  chargeWeight: number;
  avgMeasuredMv: number;
  pooledSd: number | null;
  sdHistory: number[];
  sessionCount: number;
  totalRounds: number;
  trueBc: number | null;
  bcCorrectionFactor: number | null;
  confidenceScore: number | null;
  confidenceLevel: string | null;
  barrelLength: number | null;
  coal: number | null;
  notes: string;
  estimatedPressurePsi: number | null;
  saamiMaxPressure: number;
  pressurePercent: number | null;
  flaggedUnsafe: boolean;
  status: "published" | "under_review" | "removed";
  reportCount: number;
  sourceCalibrationId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BCContribution {
  id: string;
  userId: string;
  bulletName: string;
  bulletManufacturer: string;
  bulletCaliber: number;
  bulletWeight: number;
  trueBc: number;
  bcCorrectionFactor: number;
  dragModel: "G1" | "G7";
  sessionCount: number;
  totalRounds: number;
  confidenceScore: number;
  altitude: number | null;
  temperature: number | null;
}

export interface CommunityBCAggregate {
  bulletName: string;
  bulletManufacturer: string;
  bulletCaliber: number;
  bulletWeight: number;
  dragModel: string;
  contributorCount: number;
  weightedAvgBc: number;
  simpleAvgBc: number;
  bcStddev: number | null;
  bcMin: number;
  bcMax: number;
  totalCommunityRounds: number;
}

export type ReportReason = "unsafe" | "inaccurate" | "spam" | "other";

// ─── Field Mappings ────────────────────────────────────────────────

const SHARED_LOAD_FIELDS: Record<string, string> = {
  id: "id",
  userId: "user_id",
  cartridgeShortName: "cartridge_short_name",
  bulletName: "bullet_name",
  bulletManufacturer: "bullet_manufacturer",
  powderName: "powder_name",
  chargeWeight: "charge_weight",
  avgMeasuredMv: "avg_measured_mv",
  pooledSd: "pooled_sd",
  sdHistory: "sd_history",
  sessionCount: "session_count",
  totalRounds: "total_rounds",
  trueBc: "true_bc",
  bcCorrectionFactor: "bc_correction_factor",
  confidenceScore: "confidence_score",
  confidenceLevel: "confidence_level",
  barrelLength: "barrel_length",
  coal: "coal",
  notes: "notes",
  estimatedPressurePsi: "estimated_pressure_psi",
  saamiMaxPressure: "saami_max_pressure",
  pressurePercent: "pressure_percent",
  flaggedUnsafe: "flagged_unsafe",
  status: "status",
  reportCount: "report_count",
  sourceCalibrationId: "source_calibration_id",
  createdAt: "created_at",
  updatedAt: "updated_at",
};

const BC_AGGREGATE_FIELDS: Record<string, string> = {
  bulletName: "bullet_name",
  bulletManufacturer: "bullet_manufacturer",
  bulletCaliber: "bullet_caliber",
  bulletWeight: "bullet_weight",
  dragModel: "drag_model",
  contributorCount: "contributor_count",
  weightedAvgBc: "weighted_avg_bc",
  simpleAvgBc: "simple_avg_bc",
  bcStddev: "bc_stddev",
  bcMin: "bc_min",
  bcMax: "bc_max",
  totalCommunityRounds: "total_community_rounds",
};

function toCamelCase<T>(
  row: Record<string, unknown>,
  fieldMap: Record<string, string>,
): T {
  const result: Record<string, unknown> = {};
  for (const [camel, snake] of Object.entries(fieldMap)) {
    if (snake in row) {
      result[camel] = row[snake];
    }
  }
  return result as T;
}

function getCurrentUserId(): string | null {
  return useBallisticsStore.getState().user?.id ?? null;
}

// ─── Publish / Unpublish ───────────────────────────────────────────

export async function publishLoad(
  calibration: LoadCalibration,
  bullet: Bullet,
  cartridge: Cartridge,
  confidence: ConfidenceResult | null,
  barrelLength: number,
  internalResult?: InternalBallisticsResult | null,
  notes?: string,
): Promise<SharedLoad | null> {
  if (!supabase) return null;
  const userId = getCurrentUserId();
  if (!userId) return null;

  const row = {
    user_id: userId,
    cartridge_short_name: calibration.cartridgeShortName,
    bullet_name: calibration.bulletName,
    bullet_manufacturer: bullet.manufacturer,
    powder_name: calibration.powderName,
    charge_weight: calibration.chargeWeight,
    avg_measured_mv: calibration.avgMeasuredMV,
    pooled_sd: confidence?.pooledSD ?? null,
    sd_history: calibration.sdHistory,
    session_count: calibration.sessionCount,
    total_rounds: confidence?.totalRounds ?? 0,
    true_bc: calibration.trueBC ?? null,
    bc_correction_factor: calibration.bcCorrectionFactor ?? null,
    confidence_score: confidence?.score ?? null,
    confidence_level: confidence?.level ?? null,
    barrel_length: barrelLength,
    notes: notes ?? "",
    estimated_pressure_psi: internalResult?.peakPressure ?? null,
    saami_max_pressure: cartridge.maxPressure,
    source_calibration_id: calibration.id,
  };

  const { data, error } = await supabase
    .from("shared_loads")
    .insert(row)
    .select()
    .single();

  if (error) {
    console.error("[BulletForge] Failed to publish load:", error.message);
    return null;
  }

  // Also submit BC contribution if we have trueBC
  if (calibration.trueBC && calibration.bcCorrectionFactor) {
    await submitBCContribution(calibration, bullet, confidence);
  }

  return toCamelCase<SharedLoad>(data, SHARED_LOAD_FIELDS);
}

export async function unpublishLoad(id: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase
    .from("shared_loads")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("[BulletForge] Failed to unpublish load:", error.message);
    return false;
  }
  return true;
}

// ─── Fetch Shared Loads ────────────────────────────────────────────

export type SortField = "confidence_score" | "charge_weight" | "created_at" | "avg_measured_mv";

export async function fetchSharedLoads(
  cartridgeShortName?: string,
  sort: SortField = "confidence_score",
  ascending: boolean = false,
  limit: number = 50,
): Promise<SharedLoad[]> {
  if (!supabase) return [];

  let query = supabase
    .from("shared_loads")
    .select("*")
    .eq("status", "published")
    .order(sort, { ascending, nullsFirst: false })
    .limit(limit);

  if (cartridgeShortName) {
    query = query.eq("cartridge_short_name", cartridgeShortName);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[BulletForge] Failed to fetch shared loads:", error.message);
    return [];
  }

  return (data ?? []).map((row: Record<string, unknown>) =>
    toCamelCase<SharedLoad>(row, SHARED_LOAD_FIELDS),
  );
}

export async function fetchMySharedLoads(): Promise<SharedLoad[]> {
  if (!supabase) return [];
  const userId = getCurrentUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from("shared_loads")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[BulletForge] Failed to fetch my shared loads:", error.message);
    return [];
  }

  return (data ?? []).map((row: Record<string, unknown>) =>
    toCamelCase<SharedLoad>(row, SHARED_LOAD_FIELDS),
  );
}

// ─── BC Contributions ──────────────────────────────────────────────

async function submitBCContribution(
  calibration: LoadCalibration,
  bullet: Bullet,
  confidence: ConfidenceResult | null,
): Promise<void> {
  if (!supabase) return;
  const userId = getCurrentUserId();
  if (!userId) return;
  if (!calibration.trueBC || !calibration.bcCorrectionFactor) return;

  const dragModel = bullet.bc_g7 > 0 ? "G7" : "G1";

  const row = {
    user_id: userId,
    bullet_name: bullet.name,
    bullet_manufacturer: bullet.manufacturer,
    bullet_caliber: bullet.caliber,
    bullet_weight: bullet.weight,
    true_bc: calibration.trueBC,
    bc_correction_factor: calibration.bcCorrectionFactor,
    drag_model: dragModel,
    session_count: calibration.sessionCount,
    total_rounds: confidence?.totalRounds ?? 0,
    confidence_score: confidence?.score ?? 0,
  };

  const { error } = await supabase
    .from("community_bc_contributions")
    .upsert(row, { onConflict: "user_id,bullet_name,bullet_manufacturer,drag_model" });

  if (error) {
    console.warn("[BulletForge] Failed to submit BC contribution:", error.message);
  }
}

export async function fetchCommunityBC(
  bulletName: string,
  bulletManufacturer: string,
): Promise<CommunityBCAggregate | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("community_bc_aggregates")
    .select("*")
    .eq("bullet_name", bulletName)
    .eq("bullet_manufacturer", bulletManufacturer)
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  return toCamelCase<CommunityBCAggregate>(data as Record<string, unknown>, BC_AGGREGATE_FIELDS);
}

// ─── Reporting ─────────────────────────────────────────────────────

export async function reportLoad(
  sharedLoadId: string,
  reason: ReportReason,
  details: string = "",
): Promise<boolean> {
  if (!supabase) return false;
  const userId = getCurrentUserId();
  if (!userId) return false;

  const { error } = await supabase
    .from("load_reports")
    .insert({
      reporter_id: userId,
      shared_load_id: sharedLoadId,
      reason,
      details,
    });

  if (error) {
    console.error("[BulletForge] Failed to report load:", error.message);
    return false;
  }
  return true;
}
