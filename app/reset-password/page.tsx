"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, KeyRound, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useSession } from "@/components/SessionProvider";

export default function ResetPasswordPage() {
  const [ready, setReady] = useState(false);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const { refresh } = useSession();

  useEffect(() => {
    let active = true;

    // Check for demo or URL token params
    const searchParams = new URLSearchParams(window.location.search);
    const qToken = searchParams.get("token");
    const qEmail = searchParams.get("email");

    if (qToken || qEmail) {
      setToken(qToken);
      setEmail(qEmail);
      setHasRecoverySession(true);
      setReady(true);
      return;
    }

    // Otherwise check Supabase session listener
    let supabase: ReturnType<typeof createClient>;
    try {
      supabase = createClient();
    } catch {
      setError("Password recovery is not configured for this site.");
      setReady(true);
      return;
    }

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && active) setHasRecoverySession(true);
    });

    void supabase.auth
      .getSession()
      .then(({ data, error: sessionError }) => {
        if (!active) return;
        if (sessionError) setError("This reset link is invalid or has expired. Request a new one.");
        setHasRecoverySession(Boolean(data.session));
        setReady(true);
        window.history.replaceState({}, document.title, window.location.pathname);
      })
      .catch(() => {
        if (!active) return;
        setError("This reset link is invalid or has expired. Request a new one.");
        setReady(true);
      });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Use a password with at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/auth/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          email,
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update password");
      }

      setSuccess(true);
      await refresh();
      window.setTimeout(() => router.replace("/login"), 1500);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to update your password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col px-4 py-16 sm:px-6">
      <div className="card-surface rounded-3xl p-7 sm:p-9 border border-slate-200/90 shadow-sm bg-white">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
          <KeyRound className="h-6 w-6" />
        </div>
        <h1 className="mt-5 text-2xl font-bold text-slate-900">Choose a new password</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Set a secure new password for your MudayHub account.
        </p>

        {!ready ? (
          <p className="mt-6 text-sm text-slate-500" role="status">
            Verifying your secure reset link…
          </p>
        ) : success ? (
          <div className="mt-6 rounded-2xl border border-emerald-700/20 bg-emerald-50 p-4 text-sm text-emerald-900 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <span>Your password has been updated successfully! Redirecting to sign in…</span>
          </div>
        ) : !hasRecoverySession ? (
          <div className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-900" role="alert">
            {error || "This reset link is invalid or has expired. Request a new link to continue."}
            <Link href="/forgot-password" className="mt-3 block font-semibold text-brand-dark underline">
              Request a new reset link
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            {error && (
              <p className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-800" role="alert">
                {error}
              </p>
            )}
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700" htmlFor="new-password">
                New password
              </label>
              <input
                id="new-password"
                className="input-field"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700" htmlFor="confirm-password">
                Confirm new password
              </label>
              <input
                id="confirm-password"
                className="input-field"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="••••••••"
              />
            </div>
            <button className="btn-primary w-full !py-3 font-bold text-sm shadow-ochre" type="submit" disabled={busy}>
              {busy ? "Updating password…" : "Save New Password & Sign In"}
            </button>
          </form>
        )}

        {!success && (
          <Link href="/login" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-dark hover:text-brand">
            <ArrowLeft className="h-4 w-4" /> Back to sign in
          </Link>
        )}
      </div>
    </div>
  );
}
