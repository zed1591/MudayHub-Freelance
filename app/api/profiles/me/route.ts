import { NextResponse } from "next/server";
import { getSessionUser, DEMO_COOKIE } from "@/lib/auth/session";
import { isDemoMode } from "@/lib/demo/mode";
import { readStore, writeStore } from "@/lib/demo/store";
import { isValidPhone } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import { parseBody, profileUpdateSchema } from "@/lib/security/validation";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ profile: user.profile, email: user.email });
}

export async function PATCH(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = await parseBody(req, profileUpdateSchema);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const body = parsed.data;

  if (body.phone && !isValidPhone(body.phone)) {
    return NextResponse.json(
      { error: "Phone must match +2519xxxxxxxx or +2517xxxxxxxx" },
      { status: 400 }
    );
  }
  if (body.telebirr_number && !isValidPhone(body.telebirr_number)) {
    return NextResponse.json(
      { error: "Telebirr number must match +2519xxxxxxxx or +2517xxxxxxxx" },
      { status: 400 }
    );
  }

  if (isDemoMode()) {
    const store = readStore();
    const u = store.users.find((x) => x.id === user.id);
    if (!u) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (body.phone) {
      const conflict = store.users.find(
        (x) => x.id !== user.id && (x.profile.phone === body.phone || x.profile.telebirr_number === body.phone)
      );
      if (conflict) {
        return NextResponse.json(
          { error: "This phone number is already linked to another account." },
          { status: 409 }
        );
      }
    }

    if (body.telebirr_number) {
      const conflict = store.users.find(
        (x) => x.id !== user.id && (x.profile.telebirr_number === body.telebirr_number || x.profile.phone === body.telebirr_number)
      );
      if (conflict) {
        return NextResponse.json(
          { error: "This Telebirr number is already linked to another account." },
          { status: 409 }
        );
      }
    }

    if (body.full_name !== undefined) u.profile.full_name = body.full_name;
    if (body.headline !== undefined) u.profile.headline = body.headline;
    if (body.avatar_url !== undefined) u.profile.avatar_url = body.avatar_url;
    if (body.bio !== undefined) u.profile.bio = body.bio;
    if (body.skills !== undefined) u.profile.skills = body.skills;
    if (body.phone !== undefined) u.profile.phone = body.phone;
    if (body.telebirr_number !== undefined) u.profile.telebirr_number = body.telebirr_number;
    if (body.telegram_chat_id !== undefined) u.profile.telegram_chat_id = body.telegram_chat_id;
    if (body.telegram_username !== undefined) u.profile.telegram_username = body.telegram_username;
    if (body.github_url !== undefined) u.profile.github_url = body.github_url;
    if (body.portfolio_url !== undefined) u.profile.portfolio_url = body.portfolio_url;
    if (body.linkedin_url !== undefined) u.profile.linkedin_url = body.linkedin_url;
    if (body.past_projects !== undefined) u.profile.past_projects = body.past_projects;
    if (body.experience !== undefined) u.profile.experience = body.experience;
    if (body.education !== undefined) u.profile.education = body.education;
    if (body.certifications !== undefined) u.profile.certifications = body.certifications;
    if (body.payment_methods !== undefined) u.profile.payment_methods = body.payment_methods;
    if (body.role !== undefined && u.profile.role !== "admin") u.profile.role = body.role;
    writeStore(store);
    return NextResponse.json({ profile: u.profile });
  }

  const supabase = await createClient();

  if (body.phone) {
    const { data: conflict } = await supabase
      .from("profiles")
      .select("id")
      .neq("id", user.id)
      .eq("phone", body.phone)
      .maybeSingle();
    if (conflict) {
      return NextResponse.json(
        { error: "This phone number is already linked to another account." },
        { status: 409 }
      );
    }
  }

  if (body.telebirr_number) {
    const { data: conflict } = await supabase
      .from("profiles")
      .select("id")
      .neq("id", user.id)
      .eq("telebirr_number", body.telebirr_number)
      .maybeSingle();
    if (conflict) {
      return NextResponse.json(
        { error: "This Telebirr number is already linked to another account." },
        { status: 409 }
      );
    }
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({
      ...(body.full_name !== undefined ? { full_name: body.full_name } : {}),
      ...(body.headline !== undefined ? { headline: body.headline } : {}),
      ...(body.avatar_url !== undefined ? { avatar_url: body.avatar_url } : {}),
      ...(body.bio !== undefined ? { bio: body.bio } : {}),
      ...(body.skills !== undefined ? { skills: body.skills } : {}),
      ...(body.phone !== undefined ? { phone: body.phone } : {}),
      ...(body.telebirr_number !== undefined
        ? { telebirr_number: body.telebirr_number }
        : {}),
      ...(body.telegram_chat_id !== undefined
        ? { telegram_chat_id: body.telegram_chat_id }
        : {}),
      ...(body.telegram_username !== undefined
        ? { telegram_username: body.telegram_username }
        : {}),
      ...(body.github_url !== undefined ? { github_url: body.github_url } : {}),
      ...(body.portfolio_url !== undefined ? { portfolio_url: body.portfolio_url } : {}),
      ...(body.linkedin_url !== undefined ? { linkedin_url: body.linkedin_url } : {}),
      ...(body.past_projects !== undefined ? { past_projects: body.past_projects } : {}),
      ...(body.experience !== undefined ? { experience: body.experience } : {}),
      ...(body.education !== undefined ? { education: body.education } : {}),
      ...(body.certifications !== undefined ? { certifications: body.certifications } : {}),
      ...(body.payment_methods !== undefined ? { payment_methods: body.payment_methods } : {}),
      ...(body.role !== undefined && user.profile.role !== "admin"
        ? { role: body.role }
        : {}),
    })
    .eq("id", user.id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ profile: data });
}

export async function DELETE() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (isDemoMode()) {
    const store = readStore();
    const activeContracts = store.contracts.filter(
      (c) =>
        (c.client_id === user.id || c.freelancer_id === user.id) &&
        ["awaiting_deposit", "funded", "work_submitted", "disputed"].includes(c.escrow_status)
    );
    if (activeContracts.length > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete account while you have ${activeContracts.length} active escrow contract(s) in progress. Please complete, release, or refund them before deleting your account.`,
        },
        { status: 400 }
      );
    }

    // Remove user and all associated data from demo store
    store.users = store.users.filter((u) => u.id !== user.id);
    for (const [token, uid] of Object.entries(store.sessions)) {
      if (uid === user.id) delete store.sessions[token];
    }
    store.jobs = store.jobs.filter((j) => j.client_id !== user.id);
    store.gigs = store.gigs.filter((g) => g.freelancer_id !== user.id);
    store.proposals = store.proposals.filter((p) => p.freelancer_id !== user.id);
    writeStore(store);

    const res = NextResponse.json({ ok: true, message: "Account deleted successfully." });
    res.cookies.set(DEMO_COOKIE, "", { path: "/", maxAge: 0 });
    return res;
  }

  const supabase = await createClient();
  const { data: activeContracts } = await supabase
    .from("contracts")
    .select("id, status")
    .or(`client_id.eq.${user.id},freelancer_id.eq.${user.id}`)
    .in("status", ["awaiting_deposit", "funded", "work_submitted", "disputed"]);

  if (activeContracts && activeContracts.length > 0) {
    return NextResponse.json(
      {
        error: `Cannot delete account while you have ${activeContracts.length} active escrow contract(s) in progress. Please complete, release, or refund them before deleting your account.`,
      },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("profiles").delete().eq("id", user.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.auth.signOut();
  return NextResponse.json({ ok: true, message: "Account deleted successfully." });
}
