import { createClient } from "@supabase/supabase-js";
import { getSanitizedSupabaseServiceRoleKey, getSanitizedSupabaseUrl } from "./config";

export function createAdminClient() {
  const url = getSanitizedSupabaseUrl();
  const key = getSanitizedSupabaseServiceRoleKey();
  if (!url || !key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY / URL required for escrow service");
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
