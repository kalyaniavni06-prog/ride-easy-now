// Thin re-export of the Cloud-generated Supabase client so the rest of the app
// keeps a single import seam (`@/lib/supabase`).
import { supabase as cloudClient } from "@/integrations/supabase/client";

const supabaseUrl: string = (import.meta.env["VITE_SUPABASE_URL"] as string | undefined) ?? "";
const supabaseKey: string =
  (import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] as string | undefined) ??
  (import.meta.env["VITE_SUPABASE_ANON_KEY"] as string | undefined) ??
  "";

export const isSupabaseConfigured: boolean = supabaseUrl.length > 0 && supabaseKey.length > 0;
export const supabasePublicUrl: string = supabaseUrl;

export const supabase = isSupabaseConfigured ? cloudClient : null;
