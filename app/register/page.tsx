"use client";

import Link from "next/link";
import Image from "next/image";
import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Briefcase,
  Check,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  User,
  UserCheck,
  LogOut,
  LayoutDashboard,
} from "lucide-react";
import { authApi } from "@/lib/api";
import { useSession } from "@/components/SessionProvider";

type ValidRole = "client" | "freelancer";

function normalizeEthiopianPhone(input: string): string {
  const cleaned = input.trim().replace(/[\s-]/g, "");
  if (!cleaned || cleaned === "+2519" || cleaned === "+2517" || cleaned === "+251" || cleaned === "+") {
    return "";
  }
  if (/^0[97]\d{8}$/.test(cleaned)) {
    return "+251" + cleaned.slice(1);
  }
  if (/^[97]\d{8}$/.test(cleaned)) {
    return "+251" + cleaned;
  }
  if (/^251[97]\d{8}$/.test(cleaned)) {
    return "+" + cleaned;
  }
  if (/^\+251[97]\d{8}$/.test(cleaned)) {
    return cleaned;
  }
  return cleaned;
}

function RegisterForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, logout, refresh } = useSession();

  // Initialize role based on URL query param (?role=client) or default to freelancer
  const initialRole = searchParams.get("role") === "client" ? "client" : "freelancer";
  const [role, setRole] = useState<ValidRole>(initialRole);
  const [full_name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function handleRoleChange(newRole: ValidRole) {
    setRole(newRole);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");

    // Normalize phone number if provided
    const cleanPhone = normalizeEthiopianPhone(phone);
    if (cleanPhone && !/^(\+2519|\+2517)\d{8}$/.test(cleanPhone)) {
      setError("Phone number must match format: 09xxxxxxxx, 07xxxxxxxx, or +2519xxxxxxxx");
      setBusy(false);
      return;
    }

    try {
      await authApi.register({
        full_name: full_name.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: cleanPhone || undefined,
        role,
      });
      await refresh();
      router.push("/onboarding");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed. Please check your credentials.");
    } finally {
      setBusy(false);
    }
  }

  const isFreelancer = role === "freelancer";

  return (
    <div className="relative mx-auto flex max-w-2xl flex-col px-4 py-12 sm:px-6 lg:py-16">
      {/* Header Banner */}
      <div className="relative z-10 text-center">
        {/* Logo Emblem */}
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-brand/30 bg-[#1A222D] p-2 shadow-glow transition hover:scale-105">
          <Image
            src="/logo-emblem.png"
            alt="MudayHub Freelance"
            width={44}
            height={44}
            className="object-contain"
            priority
          />
        </div>

        <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-brand/25 bg-amber-50 px-3.5 py-1 text-xs font-bold text-brand shadow-sm">
          <Sparkles className="h-3.5 w-3.5 text-brand" />
          <span>MudayHub Freelance Network</span>
        </div>

        <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
          Join Muday<span className="text-brand">Hub Freelance</span>
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
          Join verified software engineers, cybersecurity specialists, and hiring clients with automated milestone-based ETB escrow.
        </p>
      </div>

      {/* Active Session Warning Banner (if already logged in) */}
      {user && (
        <div className="relative z-10 mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="font-bold">You are currently signed in as:</span>
            <div className="text-amber-800">
              <strong className="font-extrabold">{user.full_name}</strong> (Role: <span className="capitalize font-semibold">{user.role}</span>)
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-3 py-1.5 font-bold text-white shadow-sm hover:bg-amber-700 transition"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span>Go to Dashboard</span>
            </Link>
            <button
              type="button"
              onClick={async () => {
                await logout();
                await refresh();
              }}
              className="inline-flex items-center gap-1 rounded-xl border border-amber-300 bg-white px-3 py-1.5 font-semibold text-amber-800 hover:bg-amber-100 transition cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Registration Card */}
      <div className="relative z-10 mt-8 rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-9 shadow-sm">
        {error && (
          <div className="mb-5 rounded-2xl border border-rose-500/30 bg-rose-50/90 p-4 text-xs font-semibold text-rose-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            {(error.includes("already exists") || error.includes("already registered") || error.includes("log in")) && (
              <Link
                href="/login"
                className="inline-flex items-center gap-1 text-xs font-extrabold text-brand hover:text-brand-dark underline shrink-0"
              >
                <span>Log in to your account &rarr;</span>
              </Link>
            )}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-6">
          {/* Step 1: Interactive Account Type Switcher */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                1. Choose Your Account Type
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 border border-brand/20 px-2.5 py-0.5 text-xs font-extrabold text-brand-dark">
                Active: <strong>{isFreelancer ? "Freelancer / Specialist" : "Client / Business"}</strong>
              </span>
            </div>

            {/* Top Segmented Tab Pill */}
            <div className="flex flex-col sm:flex-row rounded-2xl bg-slate-100 p-1.5 border border-slate-200 gap-1.5">
              <button
                type="button"
                onClick={() => handleRoleChange("freelancer")}
                className={`flex-1 py-3 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                  isFreelancer
                    ? "bg-white text-brand-dark shadow-sm border border-brand/30 ring-2 ring-brand/10"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                }`}
              >
                <UserCheck className={`h-4 w-4 ${isFreelancer ? "text-brand" : "text-slate-400"}`} />
                <span>I Want to Offer Services (Freelancer)</span>
              </button>
              <button
                type="button"
                onClick={() => handleRoleChange("client")}
                className={`flex-1 py-3 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                  !isFreelancer
                    ? "bg-white text-brand-dark shadow-sm border border-brand/30 ring-2 ring-brand/10"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                }`}
              >
                <Briefcase className={`h-4 w-4 ${!isFreelancer ? "text-brand" : "text-slate-400"}`} />
                <span>I Want to Hire Talent (Client)</span>
              </button>
            </div>

            {/* Clickable Radio Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Freelancer Card */}
              <label
                htmlFor="role-option-freelancer"
                onClick={() => handleRoleChange("freelancer")}
                className={`group relative flex flex-col p-4 sm:p-5 rounded-2xl border-2 transition-all duration-200 cursor-pointer ${
                  isFreelancer
                    ? "border-brand bg-orange-50/60 shadow-sm ring-2 ring-brand/20"
                    : "border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/60"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${
                      isFreelancer
                        ? "bg-brand text-white shadow-ochre"
                        : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                    }`}
                  >
                    <UserCheck className="h-4 w-4" />
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold rounded-lg px-2 py-0.5 border ${
                        isFreelancer
                          ? "bg-brand/10 border-brand/30 text-brand-dark font-extrabold"
                          : "bg-slate-100 border-slate-200 text-slate-600 font-semibold"
                      }`}
                    >
                      Offer Services
                    </span>
                    <input
                      id="role-option-freelancer"
                      type="radio"
                      name="account_role"
                      value="freelancer"
                      checked={isFreelancer}
                      onChange={() => handleRoleChange("freelancer")}
                      className="h-4 w-4 accent-brand cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-extrabold text-slate-900">
                    Freelancer / Specialist
                  </span>
                  {isFreelancer && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand text-white shrink-0">
                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-500 mt-1.5 leading-snug">
                  Publish service packages, submit solution pitches on client RFPs, and receive guaranteed payouts.
                </span>
              </label>

              {/* Client Card */}
              <label
                htmlFor="role-option-client"
                onClick={() => handleRoleChange("client")}
                className={`group relative flex flex-col p-4 sm:p-5 rounded-2xl border-2 transition-all duration-200 cursor-pointer ${
                  !isFreelancer
                    ? "border-brand bg-orange-50/60 shadow-sm ring-2 ring-brand/20"
                    : "border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/60"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${
                      !isFreelancer
                        ? "bg-brand text-white shadow-ochre"
                        : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                    }`}
                  >
                    <Briefcase className="h-4 w-4" />
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold rounded-lg px-2 py-0.5 border ${
                        !isFreelancer
                          ? "bg-brand/10 border-brand/30 text-brand-dark font-extrabold"
                          : "bg-slate-100 border-slate-200 text-slate-600 font-semibold"
                      }`}
                    >
                      Hire Talent
                    </span>
                    <input
                      id="role-option-client"
                      type="radio"
                      name="account_role"
                      value="client"
                      checked={!isFreelancer}
                      onChange={() => handleRoleChange("client")}
                      className="h-4 w-4 accent-brand cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-extrabold text-slate-900">
                    Client / Business
                  </span>
                  {!isFreelancer && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand text-white shrink-0">
                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-500 mt-1.5 leading-snug">
                  Post project RFPs, hire Ethiopian digital specialists, and fund automated milestone escrow.
                </span>
              </label>
            </div>
          </div>

          {/* Hidden input to ensure role is submitted */}
          <input type="hidden" name="role" value={role} />

          {/* Step 2: Form Inputs */}
          <div className="border-t border-slate-100 pt-5 space-y-4">
            <span className="block text-xs font-extrabold uppercase tracking-wider text-slate-800">
              2. Account Credentials
            </span>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                {isFreelancer ? "Full Legal Name" : "Company / Contact Person"}
              </label>
              <div className="relative mt-1.5">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  className="input-field !pl-10 placeholder:text-xs placeholder:text-slate-400 placeholder:font-normal"
                  placeholder={isFreelancer ? "e.g. Abebe Kebede" : "e.g. Almaz Bekele or FinTech Addis"}
                  value={full_name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                {isFreelancer
                  ? "Your legal name for verified payout identity."
                  : "Organization name or primary hiring contact person."}
              </p>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                {isFreelancer ? "Email Address" : "Work / Business Email"}
              </label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  className="input-field !pl-10 placeholder:text-xs placeholder:text-slate-400 placeholder:font-normal"
                  type="email"
                  placeholder={isFreelancer ? "you@gmail.com (personal email welcome)" : "you@company.et (work or company email)"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                {isFreelancer
                  ? "Personal emails welcome (Gmail, Yahoo, Outlook, or custom domain)."
                  : "Company email or primary hiring coordinator address."}
              </p>
            </div>

            {/* Password with Eye Toggle */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Password
              </label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  className="input-field !pl-10 !pr-10 placeholder:text-xs placeholder:text-slate-400 placeholder:font-normal"
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 8 characters"
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Minimum 8 characters for account security.
              </p>
            </div>

            {/* Phone Number */}
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  {isFreelancer ? "Telebirr Payout Phone" : "Official Phone Number"}
                </label>
                <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200/60 rounded px-1.5 py-0.5">
                  Optional
                </span>
              </div>
              <div className="relative mt-1.5">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  className="input-field !pl-10 font-mono placeholder:text-xs placeholder:text-slate-400 placeholder:font-normal"
                  placeholder="0911223344 or +251911223344"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <p className="mt-1 text-[10px] text-slate-500">
                Format: 09xxxxxxxx, 07xxxxxxxx, or +2519xxxxxxxx (Can be configured or updated anytime)
              </p>
            </div>

            {/* Escrow Protection Notice */}
            <div className="rounded-2xl border border-emerald-600/20 bg-emerald-50/80 p-3.5 text-xs text-slate-700 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Automated Escrow Protection</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-600">
                Milestone contracts on MudayHub are secured in ETB escrow before work starts. Freelancers are guaranteed payout upon deliverable approval.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={busy}
              className="btn-primary w-full !py-3.5 font-bold text-xs sm:text-sm shadow-ochre mt-2 flex items-center justify-center gap-2 cursor-pointer"
            >
              {busy ? (
                <span>Creating Your Account…</span>
              ) : (
                <>
                  <span>Register as {isFreelancer ? "Freelancer / Specialist" : "Client / Hiring Business"}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <p className="text-center text-xs text-slate-500 pt-3 border-t border-slate-100">
              Already have an account?{" "}
              <Link href="/login" className="font-bold text-brand hover:text-brand-dark transition">
                Sign In
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center p-8">
          <div className="h-64 w-full max-w-xl animate-pulse rounded-3xl bg-slate-100" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
