import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSanitizedSupabaseAnonKey, getSanitizedSupabaseUrl } from "./config";

export async function createClient() {
  const url = getSanitizedSupabaseUrl();
  const key = getSanitizedSupabaseAnonKey();
  if (!url || !key) {
    throw new Error("Supabase env vars missing");
  }

  const cookieStore = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          /* Server Component — ignore */
        }
      },
    },
  });
}
