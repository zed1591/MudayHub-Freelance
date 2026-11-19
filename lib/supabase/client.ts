import { createBrowserClient } from "@supabase/ssr";
import { getSanitizedSupabaseAnonKey, getSanitizedSupabaseUrl } from "./config";

export function createClient() {
  const url = getSanitizedSupabaseUrl();
  const key = getSanitizedSupabaseAnonKey();
  if (!url || !key) {
    throw new Error("Supabase env vars missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, or use DEMO_MODE=true.");
  }
  return createBrowserClient(url, key);
}
