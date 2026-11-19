import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { isDemoMode } from "@/lib/demo/mode";
import { readStore, writeStore } from "@/lib/demo/store";
import { createClient } from "@/lib/supabase/server";
import { notificationPatchSchema, parseBody } from "@/lib/security/validation";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (isDemoMode()) {
    const store = readStore();
    const notifications = store.notifications.filter((n) => n.user_id === user.id);
    return NextResponse.json({ notifications });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ notifications: data });
}

export async function PATCH(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = await parseBody(req, notificationPatchSchema);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const { ids, all } = parsed.data;

  if (isDemoMode()) {
    const store = readStore();
    store.notifications.forEach((n) => {
      if (n.user_id === user.id && (all || ids?.includes(n.id))) {
        n.read = true;
      }
    });
    writeStore(store);
    return NextResponse.json({ ok: true });
  }

  const supabase = await createClient();
  let q = supabase.from("notifications").update({ read: true }).eq("user_id", user.id);
  if (!all && ids?.length) q = q.in("id", ids);
  const { error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const all = url.searchParams.get("all") === "true";

  if (isDemoMode()) {
    const store = readStore();
    if (all) {
      store.notifications = store.notifications.filter((n) => n.user_id !== user.id);
    } else if (id) {
      store.notifications = store.notifications.filter((n) => !(n.user_id === user.id && n.id === id));
    }
    writeStore(store);
    return NextResponse.json({ ok: true });
  }

  const supabase = await createClient();
  let q = supabase.from("notifications").delete().eq("user_id", user.id);
  if (!all && id) {
    q = q.eq("id", id);
  }
  const { error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
