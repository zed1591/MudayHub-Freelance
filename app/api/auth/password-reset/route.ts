import { NextResponse } from "next/server";
import { isDemoMode } from "@/lib/demo/mode";
import { readStore, writeStore } from "@/lib/demo/store";
import { createClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  let email: string;
  try {
    const body = (await req.json()) as { email?: string };
    email = body.email?.trim().toLowerCase() || "";
  } catch {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  // 1. In Demo Mode, simulate instant password recovery token
  if (isDemoMode()) {
    const store = readStore();
    const user = store.users.find((u) => u.email.toLowerCase() === email);

    if (user) {
      const resetToken = randomUUID();
      store.passwordResets = store.passwordResets || {};
      store.passwordResets[resetToken] = {
        userId: user.id,
        email: user.email,
        expiresAt: Date.now() + 3600000, // 1 hour
      };
      writeStore(store);

      const resetLink = `/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`;
      return NextResponse.json({
        ok: true,
        resetLink,
        message: "A password reset link has been generated.",
      });
    }

    // Generic response if email not registered (prevents enumeration)
    return NextResponse.json({
      ok: true,
      message: "If an account exists for that email, a password reset link is on its way.",
    });
  }

  // 2. In Supabase Mode, dispatch remote recovery email
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  let redirectTo: string;
  try {
    const base = new URL(appUrl);
    redirectTo = new URL("/reset-password", base.origin).toString();
  } catch {
    redirectTo = "http://localhost:3000/reset-password";
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) {
      return NextResponse.json(
        { error: "We could not send a reset link. Check your email configuration and try again." },
        { status: 400 }
      );
    }
    return NextResponse.json({
      ok: true,
      message: "If an account exists for that email, a password reset link is on its way.",
    });
  } catch {
    return NextResponse.json(
      { error: "Password recovery is temporarily unavailable." },
      { status: 500 }
    );
  }
}
