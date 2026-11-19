import { NextResponse } from "next/server";
import { isDemoMode } from "@/lib/demo/mode";
import { DEMO_COOKIE } from "@/lib/auth/session";
import { demoLogin } from "@/lib/demo/store";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, parseBody } from "@/lib/security/validation";
import { recordSecurityEvent } from "@/lib/security/audit";

export async function POST(req: Request) {
  const parsed = await parseBody(req, loginSchema);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const body = parsed.data;

  if (isDemoMode()) {
    const result = demoLogin(body.email, body.password);
    if (!result) {
      await recordSecurityEvent({
        eventType: "auth.login.failure",
        metadata: { email: body.email, reason: "Invalid credentials" },
      });
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }
    await recordSecurityEvent({
      actorId: result.user.id,
      eventType: "auth.login.success",
      metadata: { email: body.email, role: result.user.profile.role },
    });
    const res = NextResponse.json({
      user: {
        id: result.user.id,
        email: result.user.email,
        profile: result.user.profile,
      },
    });
    const isHttps = req.url.startsWith("https://");
    res.cookies.set(DEMO_COOKIE, result.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: isHttps,
      path: "/",
      maxAge: 60 * 60 * 24 * 14,
    });
    return res;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: body.email,
    password: body.password,
  });
  if (error) {
    await recordSecurityEvent({
      eventType: "auth.login.failure",
      metadata: { email: body.email, reason: error.message },
    });
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  await recordSecurityEvent({
    actorId: data.user.id,
    eventType: "auth.login.success",
    metadata: { email: body.email },
  });

  return NextResponse.json({ user: data.user });
}
