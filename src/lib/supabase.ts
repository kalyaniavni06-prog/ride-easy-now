import { createClient } from "@supabase/supabase-js";

// Cast to string — bracket notation satisfies noPropertyAccessFromIndexSignature.
// Vite statically replaces VITE_* at build time even with bracket notation when cast.
const supabaseUrl: string = (import.meta.env["VITE_SUPABASE_URL"] as string | undefined) ?? "";
const supabaseAnonKey: string = (import.meta.env["VITE_SUPABASE_ANON_KEY"] as string | undefined) ?? "";

export const isSupabaseConfigured: boolean = supabaseUrl.length > 0 && supabaseAnonKey.length > 0;
export const supabasePublicUrl: string = supabaseUrl;

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;
