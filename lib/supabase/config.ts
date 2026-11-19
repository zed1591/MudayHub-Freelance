/**
 * Normalizes Supabase environment variables across client and server.
 * Handles common configuration pitfalls:
 * - Missing https:// protocol
 * - Surrounding quotes or trailing spaces
 * - Accidental insertion of direct Postgres connection URIs
 */
export function getSanitizedSupabaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  if (!raw) return "";

  let cleaned = raw.trim().replace(/^["']+|["']+$/g, "");

  // If user accidentally pasted the Postgres connection string:
  if (cleaned.startsWith("postgresql://") || cleaned.startsWith("postgres://")) {
    const match = cleaned.match(/@db\.([a-z0-9]+)\.supabase\.co/);
    if (match) {
      return `https://${match[1]}.supabase.co`;
    }
  }

  // Ensure https:// protocol is present
  if (!/^https?:\/\//i.test(cleaned)) {
    cleaned = `https://${cleaned}`;
  }

  // Remove any trailing slash
  return cleaned.replace(/\/+$/, "");
}

export function getSanitizedSupabaseAnonKey(): string {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  return raw.trim().replace(/^["']+|["']+$/g, "");
}

export function getSanitizedSupabaseServiceRoleKey(): string {
  const raw = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return raw.trim().replace(/^["']+|["']+$/g, "");
}
