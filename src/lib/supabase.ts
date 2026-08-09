/**
 * Supabase client — browser + SSR safe.
 *
 * Environment variables (set in Vercel dashboard — never commit to git):
 *   VITE_SUPABASE_URL      — Project URL, e.g. https://xyz.supabase.co
 *   VITE_SUPABASE_ANON_KEY — Project anon/public key (safe to expose in browser)
 *
 * IMPORTANT: Vite replaces import.meta.env.VITE_* only when accessed via
 * dot-notation (import.meta.env.VITE_FOO), NOT bracket notation
 * (import.meta.env["VITE_FOO"]). Using bracket notation causes the value
 * to be undefined in the production bundle, which was the root cause of
 * the app silently falling back to localStorage demo auth instead of Supabase.
 */
import { createClient } from "@supabase/supabase-js";

// ✅ Dot-notation — Vite statically replaces these at build time
const supabaseUrl: string = import.meta.env.VITE_SUPABASE_URL ?? "";
const supabaseAnonKey: string = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured: boolean =
  supabaseUrl.length > 0 && supabaseAnonKey.length > 0;

// Single shared client instance — null only when env vars are missing
// (local dev without .env file, or Vercel preview without vars set).
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        // Store session in localStorage so it survives page refreshes
        persistSession: true,
        // Auto-refresh the JWT before it expires
        autoRefreshToken: true,
        // Detect session from URL hash after email confirmation redirect
        detectSessionInUrl: true,
      },
    })
  : null;
