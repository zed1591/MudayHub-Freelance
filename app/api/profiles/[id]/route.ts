import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { isDemoMode } from "@/lib/demo/mode";
import { readStore } from "@/lib/demo/store";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPublicProfiles } from "@/lib/public-profiles";
import { sanitizePublicProfile } from "@/lib/security/privacy";
import type { Gig, Job, Profile, Review } from "@/lib/types";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const currentUser = await getSessionUser();

  if (isDemoMode()) {
    const store = readStore();
    const user = store.users.find((u) => u.id === id);
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const isClient = user.profile.role === "client";
    const completed = store.contracts.filter(
      (c) => (isClient ? c.client_id === id : c.freelancer_id === id) && c.escrow_status === "completed"
    ).length;
    const gigs = isClient ? [] : (store.gigs || []).filter((g) => g.freelancer_id === id);
    const jobs = isClient ? (store.jobs || []).filter((j) => j.client_id === id) : [];
    const reviews = (store.reviews || [])
      .filter((r) => r.target_id === id)
      .map((r) => {
        const author = store.users.find((u) => u.id === r.author_id)?.profile;
        return {
          ...r,
          author: author ? sanitizePublicProfile(author) : undefined,
        };
      });

    // Privacy by Design: Only profile owner or platform admin may see private contact/payout info
    const canSeePrivate = currentUser && (currentUser.id === id || currentUser.profile.role === "admin");
    const profile = canSeePrivate ? user.profile : sanitizePublicProfile(user.profile);

    return NextResponse.json({
      profile,
      completed_contracts: completed,
      gigs,
      jobs,
      reviews,
    });
  }

  const supabase = await createClient();
  try {
    let rawProfile: Profile | null = null;

    // 1. First attempt: Read directly using admin client to ensure we can load any valid profile regardless of RLS
    try {
      const admin = createAdminClient();
      const { data, error } = await admin.from("profiles").select("*").eq("id", id).maybeSingle();
      if (!error && data) rawProfile = data as Profile;
    } catch {
      // If service role key is not configured, fall back to current user client
      const { data } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
      if (data) rawProfile = data as Profile;
    }

    // 2. Second attempt: try getPublicProfiles RPC
    if (!rawProfile) {
      try {
        const publicProfiles = await getPublicProfiles(supabase, [id]);
        const p = publicProfiles.get(id);
        if (p) rawProfile = p as unknown as Profile;
      } catch {
        /* ignore */
      }
    }

    if (!rawProfile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Determine privacy rights: Only profile owner or platform admin may see private contact/payout info
    const canSeePrivate = Boolean(
      currentUser && (currentUser.id === id || currentUser.profile.role === "admin")
    );
    const profile = canSeePrivate ? rawProfile : sanitizePublicProfile(rawProfile);

    // Fetch related gigs, jobs, completed contracts, and reviews in parallel
    let completed = 0;
    let gigs: Gig[] = [];
    let jobs: Job[] = [];
    let reviews: Review[] = [];

    try {
      const dbClient = (() => {
        try { return createAdminClient(); } catch { return supabase; }
      })();

      const isClient = rawProfile.role === "client";
      const [contractsRes, gigsRes, jobsRes, reviewsRes] = await Promise.all([
        dbClient.from("contracts").select("id").eq(isClient ? "client_id" : "freelancer_id", id).eq("escrow_status", "completed"),
        isClient ? Promise.resolve({ data: [] }) : dbClient.from("gigs").select("*").eq("freelancer_id", id),
        isClient ? dbClient.from("jobs").select("*").eq("client_id", id) : Promise.resolve({ data: [] }),
        dbClient.from("reviews").select("*").eq("target_id", id),
      ]);

      completed = (contractsRes.data || []).length;
      gigs = (gigsRes.data || []) as Gig[];
      jobs = (jobsRes.data || []) as Job[];
      reviews = (reviewsRes.data || []) as Review[];
    } catch {
      /* ignore related stats failures */
    }

    return NextResponse.json({
      profile,
      completed_contracts: completed,
      gigs,
      jobs,
      reviews,
    });
  } catch (profileError) {
    return NextResponse.json(
      { error: profileError instanceof Error ? profileError.message : "Unable to load profile" },
      { status: 500 }
    );
  }
}
