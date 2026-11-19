"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Wallet,
  Calendar,
  Share2,
  Check,
} from "lucide-react";
import { formatEtb, formatMemberSince, relativeTime } from "@/lib/utils";
import type { Job, Profile, Proposal } from "@/lib/types";

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<(Job & { profiles?: Profile }) | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [me, setMe] = useState<{ id: string; profile: Profile } | null>(null);
  const [bid, setBid] = useState("");
  const [days, setDays] = useState("14");
  const [letter, setLetter] = useState("");
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  function copyShareLink() {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function load() {
    fetch(`/api/jobs/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setJob(d.job);
        setProposals(d.proposals || []);
        if (d.job?.budget_etb) setBid(String(d.job.budget_etb));
      });
  }

  useEffect(() => {
    load();
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setMe(d.user));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function propose(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/proposals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        job_id: id,
        bid_amount_etb: Number(bid),
        duration_days: Number(days),
        cover_letter: letter,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Failed");
      return;
    }
    setMsg("Proposal submitted successfully!");
    setLetter("");
    load();
  }

  async function accept(proposalId: string) {
    setBusy(true);
    const res = await fetch(`/api/proposals/${proposalId}/accept`, { method: "POST" });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Failed");
      return;
    }
    window.location.href = `/contracts/${data.contract.id}`;
  }

  if (!job) {
    return <div className="mx-auto max-w-6xl px-4 py-20 text-center text-slate-400">Loading project scope…</div>;
  }

  const isClient = me?.id === job.client_id;
  const isFreelancer = me?.profile.role === "freelancer";
  const myProposal = proposals.find((p) => p.freelancer_id === me?.id);

  // Fee calculation helper
  const bidNum = Number(bid) || 0;
  const platformFee = Math.round(bidNum * 0.07);
  const netEarnings = bidNum - platformFee;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Breadcrumb & Action Bar */}
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/jobs"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Project Requests</span>
        </Link>

        <button
          type="button"
          onClick={copyShareLink}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition shadow-sm"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Share2 className="h-3.5 w-3.5 text-slate-500" />}
          <span>{copied ? "Link Copied!" : "Share RFP"}</span>
        </button>
      </div>

      {/* Main Job Overview Card */}
      <div className="mt-5 card-surface rounded-3xl border border-slate-200/90 p-8 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="badge-brand">
                {job.category}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold uppercase text-emerald-800">
                <ShieldCheck className="h-3 w-3" />
                Escrow Protected
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">{job.title}</h1>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>Posted {relativeTime(job.created_at)} by</span>
              <strong className="text-slate-900">{job.profiles?.full_name || "Verified Client"}</strong>
              {job.profiles?.is_verified ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                  <span>Verified Client / የተረጋገጠ ደንበኛ</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                  <span>Standard Member</span>
                </span>
              )}
              {job.profiles?.created_at && (
                <>
                  <span className="text-slate-300">&middot;</span>
                  <span className="inline-flex items-center gap-1 text-slate-600 font-medium">
                    <Calendar className="h-3 w-3 text-brand" />
                    <span>Member since {formatMemberSince(job.profiles.created_at)}</span>
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Allocated Budget
            </span>
            <p className="text-3xl font-extrabold text-slate-900 font-mono">{formatEtb(job.budget_etb)}</p>
            <span className="text-xs text-emerald-700 font-semibold capitalize">
              Status: {job.status.replace("_", " ")}
            </span>
          </div>
        </div>

        {/* Detailed Scope */}
        <div className="mt-6 border-t border-slate-100 pt-6">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Scope &amp; Specifications
          </h2>
          <div className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-600">
            {job.description}
          </div>
        </div>

        {/* Skills Pills */}
        <div className="mt-6 flex flex-wrap gap-2">
          {(job.skills || []).map((s) => (
            <span
              key={s}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700"
            >
              #{s}
            </span>
          ))}
        </div>
      </div>

      {/* When Freelancer already submitted a proposal */}
      {isFreelancer && myProposal && (
        <div className="mt-8 card-surface rounded-3xl border-2 border-emerald-500/30 bg-emerald-50/40 p-6 sm:p-8 space-y-5 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <h2 className="text-base font-bold text-slate-900">Your Bid Proposal Has Been Submitted</h2>
            </div>
            <span className="rounded-full border border-emerald-300 bg-emerald-100 px-3 py-1 text-[11px] font-bold text-emerald-800 uppercase font-mono">
              Status: {myProposal.status}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-3.5 bg-white rounded-2xl border border-emerald-200/80 shadow-sm">
              <span className="text-slate-500 text-[11px]">Proposed Price</span>
              <p className="text-base font-extrabold text-slate-900 mt-0.5">{formatEtb(myProposal.bid_amount_etb)}</p>
            </div>
            <div className="p-3.5 bg-white rounded-2xl border border-emerald-200/80 shadow-sm">
              <span className="text-slate-500 text-[11px]">Turnaround</span>
              <p className="text-base font-extrabold text-slate-900 mt-0.5">{myProposal.duration_days} Days</p>
            </div>
            <div className="p-3.5 bg-white rounded-2xl border border-emerald-200/80 shadow-sm col-span-2 sm:col-span-1">
              <span className="text-slate-500 text-[11px]">Net Payout (93%)</span>
              <p className="text-base font-extrabold text-emerald-600 mt-0.5">
                {formatEtb(Math.round(myProposal.bid_amount_etb * 0.93))}
              </p>
            </div>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-emerald-200/80 text-xs text-slate-700 space-y-1">
            <span className="font-bold uppercase tracking-wider text-[10px] text-slate-400">
              Your Technical Approach &amp; Cover Letter:
            </span>
            <p className="mt-1 whitespace-pre-line leading-relaxed text-slate-600">{myProposal.cover_letter}</p>
          </div>
        </div>
      )}

      {/* Proposal Submission for Freelancers without prior proposal */}
      {isFreelancer && !myProposal && job.status === "open" && (
        <form onSubmit={propose} className="mt-8 card-surface rounded-3xl border border-brand/20 p-8 shadow-sm space-y-5 bg-gradient-to-br from-amber-50/30 via-white to-orange-50/20">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-brand" />
            <h2 className="text-lg font-bold text-slate-900">Submit a Bid &amp; Proposal</h2>
          </div>
          <p className="text-xs text-slate-600">
            Submit your proposed price and delivery timeline. If the client accepts, a contract workspace is created so you can confirm scope before work begins.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
                Bid Amount (ETB)
              </label>
              <input
                className="input-field text-xs font-mono font-bold"
                type="number"
                min={50}
                value={bid}
                onChange={(e) => setBid(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
                Estimated Delivery (Days)
              </label>
              <input
                className="input-field text-xs font-medium"
                type="number"
                min={1}
                value={days}
                onChange={(e) => setDays(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Real-time Fee Transparency Breakdown */}
          {bidNum > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs space-y-1.5 font-mono">
              <div className="flex justify-between text-slate-500">
                <span>Client Bid Total:</span>
                <span className="font-bold text-slate-900">{formatEtb(bidNum)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Platform Commission (7%):</span>
                <span className="text-rose-600 font-semibold">-{formatEtb(platformFee)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1.5 font-bold text-emerald-700 text-sm">
                <span>Net Telebirr Payout:</span>
                <span>{formatEtb(netEarnings)}</span>
              </div>
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">Cover Letter &amp; Technical Approach</label>
            <textarea
              className="input-field min-h-[120px] text-xs leading-relaxed"
              placeholder="Outline your approach, tech stack, relevant domain experience, and portfolio samples..."
              value={letter}
              onChange={(e) => setLetter(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}
          {msg && <p className="text-xs font-semibold text-emerald-700">{msg}</p>}

          <button
            type="submit"
            disabled={busy}
            className="btn-primary !text-xs !py-3.5 !px-7 font-bold shadow-ochre"
          >
            {busy ? "Submitting Proposal…" : "Submit Formal Bid Proposal"}
          </button>
        </form>
      )}

      {!me && (
        <div className="mt-8 card-surface rounded-3xl border border-slate-200/90 p-6 text-center text-xs text-slate-600">
          Want to submit a proposal?{" "}
          <Link href="/login" className="font-bold text-brand hover:underline">
            Sign in as a freelancer
          </Link>{" "}
          to bid on this project.
        </div>
      )}

      {/* When another client views this project */}
      {me && me.profile.role === "client" && !isClient && (
        <div className="mt-8 card-surface rounded-3xl border border-slate-200/90 p-6 text-center text-xs text-slate-600 space-y-3">
          <p className="text-slate-900 font-semibold text-sm">Looking for talent for your own company?</p>
          <p className="max-w-md mx-auto leading-relaxed">
            This project request was posted by {job.profiles?.full_name || "another client"}. As a client on MudayHub, you can post your own requirements to receive proposals from professionals.
          </p>
          <div>
            <Link
              href="/jobs/new"
              className="btn-primary !text-xs !py-2.5 !px-5 inline-flex items-center gap-1.5 shadow-ochre font-bold"
            >
              <Plus className="h-4 w-4" />
              <span>Post Your Project Request</span>
            </Link>
          </div>
        </div>
      )}

      {/* Proposals Review for the Client */}
      {isClient && (
        <div className="mt-10 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">
              Submitted Proposals ({proposals.length})
            </h2>
            <span className="text-xs text-slate-500">Accepting a proposal creates an escrow contract</span>
          </div>

          {proposals.length === 0 ? (
            <div className="card-surface rounded-3xl p-12 text-center text-xs text-slate-500 border border-slate-200">
              No proposals submitted yet. Freelancers will appear here as they submit bids.
            </div>
          ) : (
            <div className="grid gap-4">
              {proposals.map((p) => (
                <div
                  key={p.id}
                  className="card-surface rounded-3xl border border-slate-200/90 p-6 space-y-4 hover:border-brand/40 transition shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-brand to-terracotta text-sm font-bold text-white shadow-sm shrink-0">
                        {(p.profiles?.full_name || "S").charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-slate-900">
                            {p.profiles?.full_name || p.freelancer_id.slice(0, 8)}
                          </h3>
                          <Link
                            href={`/profiles/${p.freelancer_id}`}
                            className="text-[11px] font-bold text-brand hover:underline"
                          >
                            View Profile &rarr;
                          </Link>
                        </div>
                        <p className="text-xs text-brand-dark font-semibold mt-0.5 font-mono">
                          Bid: {formatEtb(p.bid_amount_etb)} · Turnaround: {p.duration_days} days
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-700">
                      {p.status}
                    </span>
                  </div>

                  <p className="text-xs leading-relaxed text-slate-600 whitespace-pre-line">{p.cover_letter}</p>

                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <Link
                      href={`/profiles/${p.freelancer_id}`}
                      className="btn-secondary !text-xs !py-2 !px-3 font-semibold inline-flex items-center gap-1"
                    >
                      <span>Inspect Candidate Credentials</span>
                    </Link>

                    {p.status === "pending" && job.status === "open" && (
                      <button
                        type="button"
                        disabled={busy}
                        className="btn-primary !text-xs !py-2 !px-5 font-bold shadow-ochre flex items-center gap-2"
                        onClick={() => accept(p.id)}
                      >
                        <Wallet className="h-4 w-4" />
                        <span>Accept Bid &amp; Create Workspace ({formatEtb(p.bid_amount_etb)})</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
