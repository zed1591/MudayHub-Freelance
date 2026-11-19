import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { isDemoMode } from "@/lib/demo/mode";
import { demoAddReview, readStore } from "@/lib/demo/store";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPublicProfiles } from "@/lib/public-profiles";
import { parseBody, reviewSchema } from "@/lib/security/validation";
import { sanitizePublicProfile } from "@/lib/security/privacy";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const targetId = searchParams.get("target_id");
  const gigId = searchParams.get("gig_id");
  const contractId = searchParams.get("contract_id");

  if (isDemoMode()) {
    const store = readStore();
    let list = store.reviews || [];
    if (targetId) list = list.filter((r) => r.target_id === targetId);
    if (gigId) list = list.filter((r) => r.gig_id === gigId);
    if (contractId) list = list.filter((r) => r.contract_id === contractId);

    const enriched = list.map((rev) => {
      const authorUser = store.users.find((u) => u.id === rev.author_id);
      return {
        ...rev,
        author: authorUser?.profile ? sanitizePublicProfile(authorUser.profile) : undefined,
      };
    });
    return NextResponse.json({ reviews: enriched });
  }

  const supabase = await createClient();
  let query = supabase.from("reviews").select("*").order("created_at", { ascending: false });
  if (targetId) query = query.eq("target_id", targetId);
  if (gigId) query = query.eq("gig_id", gigId);
  if (contractId) query = query.eq("contract_id", contractId);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  try {
    const authors = await getPublicProfiles(supabase, (data || []).map((review) => review.author_id));
    return NextResponse.json({ reviews: (data || []).map((review) => ({ ...review, author: authors.get(review.author_id) })) });
  } catch (profileError) {
    return NextResponse.json({ error: profileError instanceof Error ? profileError.message : "Unable to load review authors" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = await parseBody(req, reviewSchema);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const body = parsed.data;

  if (isDemoMode()) {
    try {
      const review = demoAddReview({
        contractId: body.contract_id,
        authorId: user.id,
        rating: Number(body.rating),
        comment: body.comment,
      });
      return NextResponse.json({ review }, { status: 201 });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to add review";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  }

  const admin = createAdminClient();
  const { data: review, error } = await admin.rpc("submit_review", {
    p_contract: body.contract_id,
    p_actor: user.id,
    p_rating: Number(body.rating),
    p_comment: body.comment.trim(),
  });
  if (error || !review) {
    const message = error?.message || "Unable to submit review";
    return NextResponse.json({ error: message }, { status: /not authorized/i.test(message) ? 403 : 400 });
  }
  return NextResponse.json({ review }, { status: 201 });
}
