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
  rating: number;
  is_verified: boolean;
  created_at: string;
};

type RpcClient = {
  rpc: (
    name: string,
    args: Record<string, unknown>
  ) => PromiseLike<{ data: PublicProfile[] | null; error: { message: string } | null }>;
};

export async function getPublicProfiles(client: RpcClient, ids: string[]) {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  if (uniqueIds.length === 0) return new Map<string, PublicProfile>();
  const { data, error } = await client.rpc("get_public_profiles", { p_ids: uniqueIds });
  if (error) throw new Error(error.message);
  return new Map((data || []).map((profile) => [profile.id, profile]));
}
