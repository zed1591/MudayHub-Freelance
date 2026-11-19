"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  Copy,
  ExternalLink,
  Award,
  Calendar,
  Lock,
  AlertTriangle,
  ArrowLeft,
} from "lucide-react";
import { formatEtb } from "@/lib/utils";
import type { TrustDeed } from "@/lib/types";

export default function VerifyDeedPage() {
  const { hash } = useParams<{ hash: string }>();
  const [deed, setDeed] = useState<TrustDeed | null>(null);
  const [verification, setVerification] = useState<{
    isValid: boolean;
    tampered: boolean;
    hash: string;
    signature: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!hash) return;
    setLoading(true);
    fetch(`/api/verify/deed/${hash}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setDeed(data.deed);
          setVerification(data.verification);
        }
      })
      .catch(() => setError("Failed to verify deed cryptographic certificate."))
      .finally(() => setLoading(false));
  }, [hash]);

  function copyLink() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#C8102E] transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to C²SA INTEL Grid</span>
        </Link>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#C8102E] border-t-transparent" />
          <p className="mt-4 text-sm font-semibold text-slate-700">
            Verifying cryptographic proof against C²SA INTEL sovereign ledger...
          </p>
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50/60 p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-slate-900">Certificate Not Found</h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
            {error || "The cryptographic deed hash provided does not match any verified C²SA INTEL records."}
          </p>
          <div className="mt-6">
            <Link href="/verify" className="btn-secondary !text-xs !py-2.5 !px-5 font-bold">
              Search by another Deed Hash
            </Link>
          </div>
        </div>
      ) : deed && verification ? (
        <div className="space-y-6">
          {/* Official Verification Certificate */}
          <div className="relative overflow-hidden rounded-3xl border-2 border-emerald-500/40 bg-gradient-to-b from-emerald-50/50 via-white to-slate-50 p-6 sm:p-10 shadow-xl">
            {/* Top Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-100 pb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand shadow-sm border border-brand/20">
                  <ShieldCheck className="h-7 w-7 text-emerald-600" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                    MudayHub Escrow Trust Registry
                  </span>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                    Verified Cryptographic Trust Deed
                  </h1>
                </div>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-100 px-3.5 py-1.5 text-xs font-bold text-emerald-800">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Valid &amp; Cryptographically Untampered</span>
              </div>
            </div>

            {/* Main Certificate Body */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Project Deliverable
                  </span>
                  <h2 className="mt-1 text-lg font-bold text-slate-900">{deed.project_title}</h2>
                  <span className="inline-block mt-1 text-xs font-semibold text-[#C8102E] bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-200">
                    {deed.category}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Verified Specialist
                  </span>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-base font-bold text-slate-900">{deed.freelancer_name}</span>
                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800">
                      C²SA Vetted Specialist
                    </span>
                  </div>
                </div>

                {deed.client_name && (
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Commissioned By Client
                    </span>
                    <p className="mt-1 text-sm font-semibold text-slate-700">{deed.client_name}</p>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Total Verified Value (Escrow Cleared)
                  </span>
                  <p className="mt-1 text-2xl font-black text-slate-900 font-mono">
                    {formatEtb(deed.amount_etb)}
                  </p>
                  <span className="text-[11px] text-slate-500">
                    7% sovereign platform trust fee cleared
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span>
                    Settled on{" "}
                    <strong>{new Date(deed.completed_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Award className="h-4 w-4 text-slate-400" />
                  <span>
                    Milestones Delivered: <strong>{deed.milestone_count}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Cryptographic Proof Section */}
            <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-900 p-5 text-white space-y-3 font-mono">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="inline-flex items-center gap-1.5 font-bold uppercase">
                  <Lock className="h-3.5 w-3.5 text-emerald-400" />
                  <span>SHA-256 Content-Addressed Hash</span>
                </span>
                <span className="text-[10px] text-emerald-400">Verified by C²SA INTEL Grid Node</span>
              </div>
              <p className="break-all text-xs text-emerald-300 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                {deed.deed_hash}
              </p>

              <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                <span>HMAC Digital Seal:</span>
                <span className="truncate max-w-[280px] text-slate-300 font-xs">
                  {deed.signature}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-slate-200">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={copyLink}
                  className="btn-c2sa !text-xs !py-2.5 !px-5 font-bold inline-flex items-center gap-2 shadow-ochre"
                >
                  {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  <span>{copied ? "Link Copied!" : "Copy Verification Certificate Link"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn-secondary !text-xs !py-2.5 !px-4 font-bold"
                >
                  Print Official Deed
                </button>
              </div>

              <Link
                href={`/contracts/${deed.contract_id}`}
                className="btn-secondary !text-xs !py-2.5 !px-4 inline-flex items-center gap-1.5"
              >
                <span>View Related Contract</span>
                <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
