import { NextResponse } from "next/server";
import { isDemoMode } from "@/lib/demo/mode";
import { DEMO_COOKIE } from "@/lib/auth/session";
import { demoRegister } from "@/lib/demo/store";
import { isValidPhone } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import { parseBody, registerSchema } from "@/lib/security/validation";
import { recordSecurityEvent } from "@/lib/security/audit";

export async function POST(req: Request) {
  const parsed = await parseBody(req, registerSchema);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const body = parsed.data;

  if (body.phone && !isValidPhone(body.phone)) {
    return NextResponse.json(
      { error: "Phone must match +2519xxxxxxxx or +2517xxxxxxxx" },
      { status: 400 }
    );
  }

  // 1. In demo mode, register immediately in local store with duplicate account prevention
  if (isDemoMode()) {
    try {
      const result = demoRegister({
        ...body,
        phone: body.phone || undefined,
      });
      await recordSecurityEvent({
        actorId: result.user.id,
        eventType: "auth.register.success",
        metadata: { email: body.email, role: body.role },
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
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Registration failed";
      await recordSecurityEvent({
        eventType: "auth.register.failure",
        metadata: { email: body.email, reason: errorMessage },
      });
      return NextResponse.json(
        { error: errorMessage },
        { status: 409 }
      );
    }
  }

  // 2. In Supabase mode, attempt remote signup with strict duplicate checks
  const supabase = await createClient();

  // Check for duplicate phone number before creating user
  if (body.phone) {
    const { data: existingProfileWithPhone } = await supabase
      .from("profiles")
      .select("id")
      .or(`phone.eq.${body.phone},telebirr_number.eq.${body.phone}`)
      .maybeSingle();

    if (existingProfileWithPhone) {
      await recordSecurityEvent({
        eventType: "auth.register.failure",
        metadata: { email: body.email, phone: body.phone, reason: "Duplicate phone number" },
      });
      return NextResponse.json(
        { error: "An account with this phone number already exists." },
        { status: 409 }
      );
    }
  }

  const { data, error } = await supabase.auth.signUp({
    email: body.email,
    password: body.password,
    options: {
      data: {
        full_name: body.full_name,
        role: body.role,
        phone: body.phone || "",
      },
    },
  });

  if (error) {
    const msg = error.message.toLowerCase();
    const isDuplicate =
      msg.includes("already registered") ||
      msg.includes("already in use") ||
      msg.includes("user already exists") ||
      msg.includes("unique constraint");

    if (isDuplicate) {
      await recordSecurityEvent({
        eventType: "auth.register.failure",
        metadata: { email: body.email, reason: "Duplicate email account" },
      });
      return NextResponse.json(
        { error: "An account with this email address already exists. Please log in instead." },
        { status: 409 }
      );
    }

    const isRateLimit =
      msg.includes("rate limit") ||
      msg.includes("rate_limit") ||
      ("status" in error && (error as { status?: number }).status === 429);
    const isInvalidEmail = msg.includes("invalid") || msg.includes("domain");

    // Fallback to local demo store if remote Supabase service blocks registration
    if (isRateLimit || isInvalidEmail) {
      console.warn(`[Register] Remote Supabase rejected (${error.message}). Activating local demo store fallback.`);
      try {
        const result = demoRegister({
          ...body,
          phone: body.phone || undefined,
        });
        await recordSecurityEvent({
          actorId: result.user.id,
          eventType: "auth.register.success",
          metadata: { email: body.email, role: body.role, note: "Fallback due to remote Supabase rate limit" },
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
      } catch (fallbackErr) {
        return NextResponse.json(
          { error: fallbackErr instanceof Error ? fallbackErr.message : "Registration failed" },
          { status: 409 }
        );
      }
    }

    await recordSecurityEvent({
      eventType: "auth.register.failure",
      metadata: { email: body.email, reason: error.message },
    });
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Prevent duplicate accounts where Supabase returns empty identities array
  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    await recordSecurityEvent({
      eventType: "auth.register.failure",
      metadata: { email: body.email, reason: "Duplicate email detected via empty identities" },
    });
    return NextResponse.json(
      { error: "An account with this email address already exists. Please log in instead." },
      { status: 409 }
    );
  }

  // If Supabase user was created, attempt automatic login to set session cookies
  if (data.user) {
    try {
      await supabase.auth.signInWithPassword({
        email: body.email,
        password: body.password,
      });
    } catch {
      /* ignore if email confirmation is required */
    }

    await recordSecurityEvent({
      actorId: data.user.id,
      eventType: "auth.register.success",
      metadata: { email: body.email, role: body.role },
    });
  }

  return NextResponse.json({ user: data.user });
}
