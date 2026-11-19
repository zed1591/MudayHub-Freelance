import { NextResponse } from "next/server";
import { isDemoMode } from "@/lib/demo/mode";
import { readStore } from "@/lib/demo/store";
import { createClient } from "@/lib/supabase/server";
import { sanitizePublicProfile } from "@/lib/security/privacy";
import type { Profile } from "@/lib/types";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.toLowerCase();
  const skill = searchParams.get("skill")?.toLowerCase();
  const verified = searchParams.get("verified") === "true";
  const minRating = Number(searchParams.get("min_rating") || 0);

  if (isDemoMode()) {
    const store = readStore();
    let freelancers = store.users
      .filter((u) => u.profile.role === "freelancer")
      .map((u) => {
        const completedContracts = store.contracts.filter(
          (c) => c.freelancer_id === u.id && c.escrow_status === "completed"
        ).length;
        const activeGigs = (store.gigs || []).filter((g) => g.freelancer_id === u.id).length;
        const reviews = (store.reviews || []).filter((r) => r.target_id === u.id);

        return {
          profile: sanitizePublicProfile(u.profile),
          completed_contracts: completedContracts,
          active_gigs: activeGigs,
          reviews_count: reviews.length,
        };
      });

    if (q) {
      freelancers = freelancers.filter(
        (f) =>
          (f.profile.full_name || "").toLowerCase().includes(q) ||
          (f.profile.bio || "").toLowerCase().includes(q) ||
          (f.profile.skills || []).some((s) => (s || "").toLowerCase().includes(q))
      );
    }

    if (skill) {
      freelancers = freelancers.filter((f) =>
        (f.profile.skills || []).some((s) => (s || "").toLowerCase().includes(skill))
      );
    }

    if (verified) freelancers = freelancers.filter((f) => f.profile.is_verified);
    if (Number.isFinite(minRating) && minRating > 0) {
      freelancers = freelancers.filter((f) => Number(f.profile.rating) >= minRating);
    }

    freelancers.sort((a, b) =>
      Number(b.profile.is_verified) - Number(a.profile.is_verified) ||
      Number(b.profile.rating) - Number(a.profile.rating) ||
      b.completed_contracts - a.completed_contracts
    );

    return NextResponse.json({ talent: freelancers });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_public_profiles", { p_ids: null });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const profiles = (data || []) as Pick<Profile, "id" | "role" | "full_name" | "bio" | "skills" | "rating" | "is_verified" | "created_at">[];
  return NextResponse.json({
    talent: profiles
      .filter((p) => p.role === "freelancer")
      .filter((p) =>
        !q ||
        (p.full_name || "").toLowerCase().includes(q) ||
        (p.bio || "").toLowerCase().includes(q) ||
        (p.skills || []).some((s) => (s || "").toLowerCase().includes(q))
      )
      .filter((p) => !skill || (p.skills || []).some((s) => (s || "").toLowerCase().includes(skill)))
      .filter((p) => !verified || p.is_verified)
      .filter((p) => !Number.isFinite(minRating) || minRating <= 0 || Number(p.rating) >= minRating)
      .sort((a, b) => Number(b.is_verified) - Number(a.is_verified) || Number(b.rating) - Number(a.rating))
      .map((p) => ({
        profile: p,
        completed_contracts: 0,
        active_gigs: 0,
        reviews_count: 0,
      })),
  });
}
