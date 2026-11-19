import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { isDemoMode } from "@/lib/demo/mode";
import { readStore } from "@/lib/demo/store";
import { createClient } from "@/lib/supabase/server";
import { getPublicProfiles } from "@/lib/public-profiles";
import { sanitizePublicProfile } from "@/lib/security/privacy";

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
    const profiles = await getPublicProfiles(supabase, [id]);
    const profile = profiles.get(id);
    if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ profile, completed_contracts: 0, gigs: [], reviews: [] });
  } catch (profileError) {
    return NextResponse.json(
      { error: profileError instanceof Error ? profileError.message : "Unable to load profile" },
      { status: 500 }
    );
  }
}
