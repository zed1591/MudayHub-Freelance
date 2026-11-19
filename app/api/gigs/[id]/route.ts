import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { isDemoMode } from "@/lib/demo/mode";
import { readStore, writeStore } from "@/lib/demo/store";
import { createClient } from "@/lib/supabase/server";
import { getPublicProfiles } from "@/lib/public-profiles";
import { sanitizePublicProfile } from "@/lib/security/privacy";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (isDemoMode()) {
    const store = readStore();
    const gig = (store.gigs || []).find((g) => g.id === id || g.slug === id);
    if (!gig) return NextResponse.json({ error: "Gig not found" }, { status: 404 });

    const freelancerUser = store.users.find((u) => u.id === gig.freelancer_id);
    const reviews = (store.reviews || []).filter(
      (r) => r.gig_id === gig.id || r.target_id === gig.freelancer_id
    );

    return NextResponse.json({
      gig: {
        ...gig,
        freelancer: freelancerUser?.profile ? sanitizePublicProfile(freelancerUser.profile) : undefined,
      },
      reviews,
    });
  }

  const supabase = await createClient();
  const { data: gig, error } = await supabase
    .from("gigs")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !gig) return NextResponse.json({ error: "Gig not found" }, { status: 404 });
  try {
    const [{ data: reviews, error: reviewsError }, profiles] = await Promise.all([
      supabase.from("reviews").select("*").eq("gig_id", gig.id).order("created_at", { ascending: false }),
      getPublicProfiles(supabase, [gig.freelancer_id]),
    ]);
    if (reviewsError) return NextResponse.json({ error: reviewsError.message }, { status: 500 });
    const authors = await getPublicProfiles(supabase, (reviews || []).map((review) => review.author_id));
    return NextResponse.json({
      gig: { ...gig, freelancer: profiles.get(gig.freelancer_id) },
      reviews: (reviews || []).map((review) => ({ ...review, author: authors.get(review.author_id) })),
    });
  } catch (profileError) {
    return NextResponse.json({ error: profileError instanceof Error ? profileError.message : "Unable to load profile" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (isDemoMode()) {
    const store = readStore();
    const idx = (store.gigs || []).findIndex((g) => g.id === id);
    if (idx === -1) return NextResponse.json({ error: "Gig not found" }, { status: 404 });
    if (store.gigs[idx].freelancer_id !== user.id && user.profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    store.gigs.splice(idx, 1);
    writeStore(store);
    return NextResponse.json({ ok: true });
  }

  const supabase = await createClient();
  const { data: gig } = await supabase.from("gigs").select("freelancer_id").eq("id", id).single();
  if (!gig) return NextResponse.json({ error: "Gig not found" }, { status: 404 });
  if (gig.freelancer_id !== user.id && user.profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabase.from("gigs").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
