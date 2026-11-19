"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowLeft, Mail, ShieldCheck } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [demoResetLink, setDemoResetLink] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      const response = await fetch("/api/auth/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await response.json()) as { error?: string; resetLink?: string };
      if (!response.ok) throw new Error(data.error || "Unable to send the reset link.");
      if (data.resetLink) setDemoResetLink(data.resetLink);
      setSent(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to send the reset link.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col px-4 py-16 sm:px-6">
      <div className="card-surface rounded-3xl p-7 sm:p-9 border border-slate-200/90 shadow-sm bg-white">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h1 className="mt-5 text-2xl font-bold text-slate-900">Reset your password</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Enter the email address on your account. We’ll send a secure link back to this MudayHub site.
        </p>

        {sent ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-emerald-700/20 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900" role="status">
              If an account exists for that email, a password reset link is on its way. Check your inbox and spam folder.
            </div>
            {demoResetLink && (
              <div className="rounded-2xl border border-brand/30 bg-orange-50/80 p-4 text-xs">
                <p className="font-bold text-brand-dark mb-1">Instant Recovery Link (Test Mode):</p>
                <p className="text-slate-600 mb-3">Since you are testing in offline/sandbox mode, you can immediately choose your new password below:</p>
                <Link
                  href={demoResetLink}
                  className="btn-primary !py-2 !px-4 text-xs font-bold inline-flex items-center gap-1.5 shadow-ochre"
                >
                  <span>Choose New Password &rarr;</span>
                </Link>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            {error && <p className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-800" role="alert">{error}</p>}
            <label className="block text-sm font-semibold text-slate-700" htmlFor="reset-email">Email address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="reset-email"
                className="input-field !pl-10"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <button className="btn-primary w-full !py-3" type="submit" disabled={busy}>
              {busy ? "Sending link…" : "Send reset link"}
            </button>
          </form>
        )}

        <Link href="/login" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-dark hover:text-brand">
          <ArrowLeft className="h-4 w-4" /> Back to sign in
        </Link>
      </div>
    </div>
  );
}
