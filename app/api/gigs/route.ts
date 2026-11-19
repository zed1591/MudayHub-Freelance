import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getSessionUser } from "@/lib/auth/session";
import { isDemoMode } from "@/lib/demo/mode";
import { readStore, writeStore } from "@/lib/demo/store";
import { createClient } from "@/lib/supabase/server";
import { getPublicProfiles } from "@/lib/public-profiles";
import { gigSchema, parseBody } from "@/lib/security/validation";
import { sanitizePublicProfile } from "@/lib/security/privacy";
import type { Gig } from "@/lib/types";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const q = searchParams.get("q")?.toLowerCase();
  const freelancerId = searchParams.get("freelancer_id");
  const minPrice = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : null;
  const maxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : null;

  if (isDemoMode()) {
    const store = readStore();
    let gigs = store.gigs || [];

    if (category && category !== "All Categories") {
      gigs = gigs.filter((g) => g.category.toLowerCase() === category.toLowerCase());
    }

    if (freelancerId) {
      gigs = gigs.filter((g) => g.freelancer_id === freelancerId);
    }

    if (q) {
      gigs = gigs.filter(
        (g) =>
          g.title.toLowerCase().includes(q) ||
          g.description.toLowerCase().includes(q) ||
          g.tags.some((t) => t.toLowerCase().includes(q)) ||
          g.category.toLowerCase().includes(q)
      );
    }

    if (minPrice !== null) {
      gigs = gigs.filter((g) => g.packages.basic.price_etb >= minPrice);
    }
    if (maxPrice !== null) {
      gigs = gigs.filter((g) => g.packages.basic.price_etb <= maxPrice);
    }

    const enriched = gigs.map((gig) => {
      const freelancerUser = store.users.find((u) => u.id === gig.freelancer_id);
      return {
        ...gig,
        freelancer: freelancerUser?.profile ? sanitizePublicProfile(freelancerUser.profile) : undefined,
      };
    });

    return NextResponse.json({ gigs: enriched });
  }

  // Supabase fallback
  const supabase = await createClient();
  let query = supabase.from("gigs").select("*");
  if (category && category !== "All Categories") query = query.eq("category", category);
  if (freelancerId) query = query.eq("freelancer_id", freelancerId);
  if (q) query = query.ilike("title", `%${q}%`);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  try {
    const profiles = await getPublicProfiles(supabase, (data || []).map((gig) => gig.freelancer_id));
    return NextResponse.json({ gigs: (data || []).map((gig) => ({ ...gig, freelancer: profiles.get(gig.freelancer_id) })) });
  } catch (profileError) {
    return NextResponse.json({ error: profileError instanceof Error ? profileError.message : "Unable to load profiles" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.profile.role !== "freelancer" && user.profile.role !== "admin") {
    return NextResponse.json({ error: "Only freelancers can publish gigs" }, { status: 403 });
  }

  const parsed = await parseBody(req, gigSchema);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const body = parsed.data;

  const id = "gig-" + randomUUID().slice(0, 8);
  const slug =
    body.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || `gig-${Date.now()}`;

  const newGig: Gig = {
    id,
    freelancer_id: user.id,
    title: body.title,
    slug,
    category: body.category,
    description: body.description,
    cover_image:
      body.cover_image ||
      "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80",
    gallery:
      body.gallery && body.gallery.length > 0
        ? body.gallery
        : [
            body.cover_image ||
              "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80",
          ],
    tags: body.tags || [],
    packages: {
      basic: { ...body.packages.basic, name: "basic", features: body.packages.basic.features || [] },
      standard: { ...body.packages.standard, name: "standard", features: body.packages.standard.features || [] },
      premium: { ...body.packages.premium, name: "premium", features: body.packages.premium.features || [] },
    },
    rating: 5.0,
    reviews_count: 0,
    orders_completed: 0,
    created_at: new Date().toISOString(),
  };

  if (isDemoMode()) {
    const store = readStore();
    if (!store.gigs) store.gigs = [];
    store.gigs.unshift(newGig);
    writeStore(store);
    return NextResponse.json({ gig: newGig }, { status: 201 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from("gigs").insert(newGig).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ gig: data }, { status: 201 });
}
