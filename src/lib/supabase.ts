/* ─── BulletForge Supabase Client ─────────────────────────────── */
/* Singleton client + auth helpers                                 */

import { createClient } from "@supabase/supabase-js";
import type { User, Session, AuthChangeEvent } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    "[BulletForge] Supabase credentials missing — cloud sync disabled. " +
    "Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env"
  );
}

export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// ─── Auth helpers ────────────────────────────────────────────────

export async function signUp(email: string, password: string) {
  if (!supabase) throw new Error("Supabase not configured");
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  if (!supabase) throw new Error("Supabase not configured");
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signInWithMagicLink(email: string) {
  if (!supabase) throw new Error("Supabase not configured");
  const { error } = await supabase.auth.signInWithOtp({ email });
  if (error) throw error;
}

export async function signOut() {
  if (!supabase) throw new Error("Supabase not configured");
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getUser(): Promise<User | null> {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void,
) {
  if (!supabase) return { data: { subscription: { unsubscribe: () => {} } } };
  return supabase.auth.onAuthStateChange(callback);
}

export type { User, Session };
