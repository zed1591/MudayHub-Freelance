import { NextResponse } from "next/server";
import { isDemoMode } from "@/lib/demo/mode";
import { DEMO_COOKIE } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  if (isDemoMode()) {
    const res = NextResponse.json({ ok: true });
    res.cookies.set(DEMO_COOKIE, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });
    return res;
  }
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
