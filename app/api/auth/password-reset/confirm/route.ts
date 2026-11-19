import { NextResponse } from "next/server";
import { isDemoMode } from "@/lib/demo/mode";
import { readStore, writeStore } from "@/lib/demo/store";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  let body: { token?: string; email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }

  const { token, email, password } = body;
  if (!password || password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters long." },
      { status: 400 }
    );
  }

  if (isDemoMode()) {
    const store = readStore();
    store.passwordResets = store.passwordResets || {};

    let matchedUserId: string | null = null;

    if (token && store.passwordResets[token]) {
      const reset = store.passwordResets[token];
      if (Date.now() > reset.expiresAt) {
        delete store.passwordResets[token];
        writeStore(store);
        return NextResponse.json(
          { error: "This password reset token has expired. Please request a new link." },
          { status: 400 }
        );
      }
      matchedUserId = reset.userId;
      delete store.passwordResets[token];
    } else if (email) {
      const user = store.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (user) matchedUserId = user.id;
    }

    if (!matchedUserId) {
      return NextResponse.json(
        { error: "Invalid or expired password reset link. Please request a new one." },
        { status: 400 }
      );
    }

    const user = store.users.find((u) => u.id === matchedUserId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    user.password = password;
    writeStore(store);

    return NextResponse.json({
      ok: true,
      message: "Password updated successfully. You can now log in.",
    });
  }

  // Supabase Mode
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ ok: true, message: "Password updated successfully." });
  } catch {
    return NextResponse.json(
      { error: "Failed to update password. Please try again." },
      { status: 500 }
    );
  }
}
