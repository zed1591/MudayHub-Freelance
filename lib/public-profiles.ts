import type { Profile } from "./types";

export type PublicProfile = {
  id: string;
  role: "client" | "freelancer" | "admin";
  full_name: string;
  headline?: string | null;
  bio: string;
  skills: string[];
  github_url?: string | null;
  portfolio_url?: string | null;
  linkedin_url?: string | null;
  past_projects?: Profile["past_projects"];
  experience?: Profile["experience"];
  education?: Profile["education"];
  certifications?: Profile["certifications"];
  avatar_url?: string | null;
  rating: number;
  is_verified: boolean;
  created_at: string;
};

type RpcClient = {
  rpc: (
    name: string,
    args?: Record<string, unknown>
  ) => PromiseLike<{ data: PublicProfile[] | null; error: { message: string } | null }>;
};

export async function getPublicProfiles(client: RpcClient, ids: string[]) {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  if (uniqueIds.length === 0) return new Map<string, PublicProfile>();

  // 1. Try parameterized RPC: get_public_profiles(p_ids: UUID[])
  try {
    const res = await client.rpc("get_public_profiles", { p_ids: uniqueIds });
    if (!res.error && res.data && Array.isArray(res.data) && res.data.length > 0) {
      return new Map(res.data.map((profile) => [profile.id, profile]));
    }
  } catch {
    /* fallback to parameterless RPC */
  }

  // 2. Try parameterless RPC: get_public_profiles() from migration 011
  try {
    const res = await client.rpc("get_public_profiles");
    if (!res.error && res.data && Array.isArray(res.data)) {
      const idSet = new Set(uniqueIds);
      const matched = res.data.filter((p) => idSet.has(p.id));
      return new Map(matched.map((profile) => [profile.id, profile]));
    }
  } catch {
    /* ignore fallback error */
  }

  return new Map<string, PublicProfile>();
}
