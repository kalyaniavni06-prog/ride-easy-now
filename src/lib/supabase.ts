/**
 * Supabase client.
 *
 * Set in Vercel dashboard (never commit to git):
 *   VITE_SUPABASE_URL      — e.g. https://xyz.supabase.co
 *   VITE_SUPABASE_ANON_KEY — anon/public key (safe for browser)
 */
import { createClient } from "@supabase/supabase-js";

const supabaseUrl: string = import.meta.env.VITE_SUPABASE_URL ?? "";
const supabaseAnonKey: string = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured: boolean =
  supabaseUrl.length > 0 && supabaseAnonKey.length > 0;

// Export the URL so the login page can show it for diagnostics (not a secret)
export const supabasePublicUrl: string = supabaseUrl;

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
