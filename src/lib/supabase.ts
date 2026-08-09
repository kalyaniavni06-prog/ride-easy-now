/**
 * Supabase client — browser + SSR safe.
 *
 * Required environment variables (set in Vercel dashboard, NOT committed to git):
 *   VITE_SUPABASE_URL      — your project URL, e.g. https://xyz.supabase.co
 *   VITE_SUPABASE_ANON_KEY — your project anon/public key
 *
 * These are prefixed with VITE_ so Vite injects them into the browser bundle.
 * They are the PUBLIC keys — safe to expose in the client.
 * Never use the service-role key on the client side.
 */
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env["VITE_SUPABASE_URL"] as string | undefined;
const supabaseAnonKey = import.meta.env["VITE_SUPABASE_ANON_KEY"] as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// If env vars are not set, return a null client — the app falls back to
// localStorage-based demo auth so the UI never breaks.
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;
