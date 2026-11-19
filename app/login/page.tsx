"use client";

import Link from "next/link";
import Image from "next/image";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Briefcase,
  Code,
  Lock,
  Mail,
  Sparkles,
} from "lucide-react";
import { authApi } from "@/lib/api";
import { useSession } from "@/components/SessionProvider";
import { isDemoMode } from "@/lib/demo/mode";

const DEMO_ACCOUNTS = [
  {
    role: "Client",
    name: "Selam Tech PLC",
    email: "client@mudayhub.et",
    icon: Briefcase,
    desc: "Post project requests, order service packages, and manage project work",
    badge: "Verified Client",
    tone: "border-brand/30 hover:border-brand bg-white",
  },
  {
    role: "Freelance",
    name: "Abebe Kebede",
    email: "freelancer@mudayhub.et",
    icon: Code,
    desc: "Certified software engineer with live service offerings & bids",
    badge: "Verified Freelance",
    tone: "border-emerald-500/30 hover:border-emerald-500 bg-white",
  },
];

export default function LoginPage() {
  const demoMode = isDemoMode();
  const [email, setEmail] = useState(demoMode ? "client@mudayhub.et" : "");
  const [password, setPassword] = useState(demoMode ? "demo1234" : "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { refresh } = useSession();
  const router = useRouter();

  async function loginWithCredentials(userEmail: string, userPass: string) {
    setBusy(true);
    setError("");
    try {
      await authApi.login(userEmail, userPass);
      await refresh();
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setBusy(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await loginWithCredentials(email, password);
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col px-4 py-16 sm:px-6">
      <div className="text-center">
        {/* Logo Emblem */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-brand/30 bg-[#1A222D] p-2 shadow-glow">
          <Image
            src="/logo-emblem.png"
            alt="MudayHub Freelance"
            width={48}
            height={48}
            className="object-contain"
          />
        </div>

        <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
          Sign In to Muday<span className="text-brand">Hub</span>
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-slate-600">
          Access your secured Ethiopian escrow workspace, project bids, and verified deliverables.
        </p>
      </div>

      {demoMode && (
        <div className="mt-8 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-brand flex items-center gap-1.5">
              <Sparkles className="h-4 w-4" />
              <span>Instant 1-Click Demo Profiles</span>
            </p>
            <span className="text-[11px] text-slate-500 font-medium">Zero password needed</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {DEMO_ACCOUNTS.map((acc) => {
              const Icon = acc.icon;
              return (
                <button
                  key={acc.email}
                  type="button"
                  disabled={busy}
                  onClick={() => loginWithCredentials(acc.email, "demo1234")}
                  className={`card-surface group flex flex-col items-start rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${acc.tone}`}
                >
                  <div className="flex w-full items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-50 text-brand group-hover:bg-brand group-hover:text-white transition">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 group-hover:text-brand transition">
                          {acc.name}
                        </p>
                        <p className="text-[10px] text-slate-500 font-medium">{acc.role}</p>
                      </div>
                    </div>
                    <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-600">
                      {acc.badge}
                    </span>
                  </div>
                  <p className="mt-2.5 text-[11px] leading-relaxed text-slate-600">
                    {acc.desc}
                  </p>
                  <span className="mt-3 text-[11px] font-bold text-brand group-hover:text-brand-dark inline-flex items-center gap-1">
                    <span>Sign in as {acc.name.split(" ")[0]}</span>
                    <ArrowRight className="h-3 w-3" />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Divider */}
      {demoMode && (
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-canvas px-4 font-semibold uppercase tracking-wider text-slate-500">
              Or sign in with credentials
            </span>
          </div>
        </div>
      )}

      {/* Standard Form */}
      <form onSubmit={onSubmit} className="card-surface rounded-3xl p-6 sm:p-8 space-y-4 border border-slate-200/90 shadow-sm bg-white">
        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-50 p-3.5 text-xs font-medium text-rose-700">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Email Address
          </label>
          <div className="relative mt-1.5">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field !pl-10 placeholder:text-xs placeholder:text-slate-400 placeholder:font-normal"
              placeholder="name@domain.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Password
          </label>
          <div className="relative mt-1.5">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field !pl-10 placeholder:text-xs placeholder:text-slate-400 placeholder:font-normal"
              placeholder="••••••••"
            />
          </div>
            <div className="flex justify-end mt-1.5">
              <Link href="/forgot-password" className="text-xs font-semibold text-brand hover:text-brand-dark">
                Forgot password?
              </Link>
            </div>
        </div>

        <button
          type="submit"
          disabled={busy}
          className="btn-primary w-full !py-3 font-bold text-sm shadow-ochre mt-2"
        >
          {busy ? "Authenticating…" : "Sign In to Muday-Freelance"}
        </button>

        <p className="text-center text-xs text-slate-500 pt-2">
          Don&apos;t have an account yet?{" "}
          <Link href="/register" className="font-bold text-brand hover:text-brand-dark">
            Create an account
          </Link>
        </p>
      </form>
    </div>
  );
}
