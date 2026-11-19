"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Search, ArrowRight, Lock, CheckCircle2, Award } from "lucide-react";

export default function VerifyPortalPage() {
  const router = useRouter();
  const [hashInput, setHashInput] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = hashInput.trim();
    if (!trimmed) return;
    router.push(`/verify/${trimmed}`);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 text-center">
      <div className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-4 py-1.5 text-xs font-bold text-brand-dark">
        <Lock className="h-3.5 w-3.5 text-brand" />
        <span>MudayHub Cryptographic Verification</span>
      </div>

      <h1 className="mt-4 text-3xl sm:text-5xl font-black tracking-tight text-slate-900">
        Verify Cryptographic Trust Deeds
      </h1>
      <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
        C²SA INTEL mints an immutable, content-addressed cryptographic certificate for every completed
        contract and escrow milestone. Verify specialist credentials and delivered work proof.
      </p>

      {/* Lookup Form */}
      <form onSubmit={handleSearch} className="mt-10 max-w-2xl mx-auto">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              value={hashInput}
              onChange={(e) => setHashInput(e.target.value)}
              placeholder="Paste SHA-256 Deed Hash (e.g. 7f8a3b...)"
              className="input-field !pl-12 !py-3.5 text-xs sm:text-sm font-mono w-full"
            />
          </div>
          <button
            type="submit"
            disabled={!hashInput.trim()}
            className="btn-c2sa !py-3.5 !px-8 text-xs sm:text-sm font-bold shadow-ochre inline-flex items-center justify-center gap-2"
          >
            <span>Verify Deed</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </form>

      {/* Trust Invariants */}
      <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <h3 className="mt-4 text-sm font-bold text-slate-900">Tamper-Proof Invariants</h3>
          <p className="mt-1 text-xs text-slate-600 leading-relaxed">
            Deeds are hashed using SHA-256 over contract ID, specialist ID, ETB value, and delivery date.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            <Award className="h-5 w-5" />
          </div>
          <h3 className="mt-4 text-sm font-bold text-slate-900">Portable Reputation</h3>
          <p className="mt-1 text-xs text-slate-600 leading-relaxed">
            Freelancers own their verifiable track record and can share certificate URLs with enterprise clients.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
          </div>
          <h3 className="mt-4 text-sm font-bold text-slate-900">Escrow Cleared</h3>
          <p className="mt-1 text-xs text-slate-600 leading-relaxed">
            Every deed represents verified Ethiopian Birr released through Telebirr or domestic bank rails.
          </p>
        </div>
      </div>
    </div>
  );
}
