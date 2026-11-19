"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  FileText, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Calendar,
  Sparkles,
  BadgeCheck,
} from "lucide-react";
import { proposalsApi } from "@/lib/api";
import { useSession } from "@/components/SessionProvider";
import { formatEtb } from "@/lib/utils";
import type { Proposal } from "@/lib/types";

export default function ProposalsPage() {
  const { user, loading } = useSession();
  const router = useRouter();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [tab, setTab] = useState<"all" | "pending" | "accepted" | "rejected">("all");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      const t = sp.get("tab") as ("all" | "pending" | "accepted" | "rejected") | null;
      if (t && ["all", "pending", "accepted", "rejected"].includes(t)) {
        setTab(t);
      }
    }
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    proposalsApi.mine().then((d) => setProposals(d.proposals || [])).catch(() => undefined);
  }, [user, loading, router]);

  function switchTab(newTab: "all" | "pending" | "accepted" | "rejected") {
    setTab(newTab);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", newTab);
      window.history.replaceState({}, "", url.toString());
    }
  }

  const isClient = user?.role === "client";

  const filtered = proposals.filter((p) => {
    if (tab === "pending") return p.status === "pending";
    if (tab === "accepted") return p.status === "accepted";
    if (tab === "rejected") return p.status === "rejected";
    return true;
  });

  const acceptedCount = proposals.filter((p) => p.status === "accepted").length;
  const pendingCount = proposals.filter((p) => p.status === "pending").length;

  return (
    <div className="mx-auto w-full max-w-[1680px] px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-8 md:flex-row md:items-end">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-brand/20 bg-brand/10 px-3.5 py-1 text-xs font-bold text-brand-dark">
            <Sparkles className="h-3.5 w-3.5 text-brand" />
            <span>MudayHub · {isClient ? "Hiring Hub" : "Talent Bids"}</span>
          </div>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
            {isClient ? "Candidate Proposals & Applicants" : "My Submitted Bids & Proposals"}
          </h1>
          <p className="mt-2 max-w-2xl text-xs sm:text-sm text-slate-600 leading-relaxed">
            {isClient
              ? "Review proposals submitted for your project briefs. Accept a proposal to create a workspace and confirm the final scope."
              : "Track the real-time status of your bids submitted on client briefs. When a client accepts your proposal, a protected escrow contract is initiated automatically."}
          </p>
        </div>

        <div>
          {isClient ? (
            <Link
              href="/jobs/new"
              className="btn-c2sa !py-2.5 !px-5 text-xs font-bold flex items-center gap-2"
            >
              <span>+ Post Project Request</span>
            </Link>
          ) : (
            <Link
              href="/jobs"
              className="btn-c2sa !py-2.5 !px-5 text-xs font-bold"
            >
              Browse Open Projects
            </Link>
          )}
        </div>
      </div>

      {/* Status filters */}
      <div className="mt-8 flex flex-wrap items-center gap-2 border-b border-slate-200 pb-4">
        <span className="mr-2 text-xs font-semibold text-slate-500">Filter</span>
        {([
          ["all", "All", proposals.length],
          ["pending", "Pending", pendingCount],
          ["accepted", "Accepted", acceptedCount],
          ["rejected", "Not selected", proposals.filter((p) => p.status === "rejected").length],
        ] as const).map(([key, label, count]) => (
          <button
            key={key}
            type="button"
            onClick={() => switchTab(key)}
            className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
              tab === key
                ? "border-c2sa-crimson bg-c2sa-crimson text-white shadow-sm font-bold"
                : "border-slate-200 bg-white text-slate-600 hover:border-c2sa-crimson/40 hover:text-slate-900"
            }`}
          >
            {label}<span className="ml-2 opacity-80 font-mono font-bold">{count}</span>
          </button>
        ))}
      </div>

      {/* Stats Summary Strip */}
      <div className="mt-8 grid grid-cols-1 divide-y divide-slate-200 border-y border-slate-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <div className="py-4 sm:px-5">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {isClient ? "Total Applicants Received" : "Total Proposals Sent"}
          </p>
          <p className="mt-2 text-2xl font-extrabold text-slate-900 font-mono">{proposals.length}</p>
          <p className="mt-1 text-[11px] text-slate-500">{isClient ? "Across your project requests" : "Across client project briefs"}</p>
        </div>

        <div className="py-4 sm:px-5">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {isClient ? "Awaiting Your Review" : "Pending Client Decision"}
          </p>
          <p className="mt-2 text-2xl font-extrabold text-amber-600 font-mono">{pendingCount}</p>
          <p className="mt-1 text-[11px] text-slate-500">
            {isClient ? "Ready for interview or acceptance" : "Awaiting client review"}
          </p>
        </div>

        <div className="py-4 sm:px-5">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {isClient ? "Awarded & Hired" : "Accepted & Awarded"}
          </p>
          <p className="mt-2 text-2xl font-extrabold text-emerald-700 font-mono">{acceptedCount}</p>
          <p className="mt-1 text-[11px] text-slate-500">
            {isClient ? "Active or completed escrow contracts" : "Converted into funded contracts"}
          </p>
        </div>
      </div>

      {/* Active Filter Indicator */}
      <div className="mt-8 flex items-center justify-between text-xs text-slate-500 pb-3 border-b border-slate-200">
        <div>
          Showing <span className="font-bold text-slate-900 font-mono">{filtered.length}</span>{" "}
          {tab === "all"
            ? "bids across all statuses"
            : `${tab === "pending" ? "under review" : tab} bids`}
        </div>
        {tab !== "all" && (
          <button
            type="button"
            onClick={() => switchTab("all")}
            className="text-xs text-c2sa-crimson hover:underline font-bold"
          >
            Show all ({proposals.length})
          </button>
        )}
      </div>

      {/* Main Content Area: Clean List */}
      <div className="mt-6 space-y-4">
        {filtered.length === 0 ? (
          <div className="card-surface rounded-3xl p-12 text-center border border-slate-200">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <FileText className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-900">No proposals found</h3>
            <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
              {tab !== "all"
                ? `No ${tab.replace("_", " ")} proposals match this filter.`
                : isClient
                ? "You haven't received any proposals yet. Make sure your project requests have clear scopes and budgets."
                : "You haven't submitted any project proposals yet. Explore available client briefs to submit your bid."}
            </p>
            <div className="mt-5">
              <Link href="/jobs" className="btn-c2sa !text-xs !py-2.5 !px-5 font-bold inline-block">
                {isClient ? "View Open Projects" : "Find Open Opportunities"}
              </Link>
            </div>
          </div>
        ) : (
          filtered.map((p) => {
            const jobTitle =
              (p as Proposal & { jobs?: { title: string } }).jobs?.title ||
              `Project Listing #${p.job_id.slice(0, 8)}`;
            const freelancerName =
              (p as Proposal & { profiles?: { full_name?: string; is_verified?: boolean } }).profiles?.full_name ||
              "Specialist";
            const isVerified =
              (p as Proposal & { profiles?: { is_verified?: boolean } }).profiles?.is_verified;

            const statusBadge =
              p.status === "accepted" ? (
                <span className="badge-escrow">
                  <CheckCircle2 className="h-3 w-3" />
                  {isClient ? "Awarded & Hired" : "Accepted & Awarded"}
                </span>
              ) : p.status === "rejected" ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-rose-300 bg-rose-50 px-2.5 py-0.5 text-[11px] font-bold text-rose-700">
                  <XCircle className="h-3 w-3" />
                  Not Selected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                  <Clock className="h-3 w-3" />
                  {isClient ? "Awaiting Decision" : "Under Review"}
                </span>
              );

            return (
              <Link
                key={p.id}
                href={`/jobs/${p.job_id}`}
                className="card-surface group flex flex-col justify-between gap-4 rounded-3xl p-6 transition-all duration-200 hover:border-c2sa-crimson/40 hover:shadow-sm sm:flex-row sm:items-center border border-slate-200/90"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {statusBadge}
                    {p.duration_days && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] text-slate-700 font-medium">
                        <Calendar className="h-3 w-3" />
                        {p.duration_days} Days Delivery
                      </span>
                    )}
                    {isClient && (
                      <span className="badge-c2sa">
                        Applicant: {freelancerName}
                        {isVerified && <BadgeCheck className="h-3 w-3 text-emerald-600 ml-0.5" />}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900 transition group-hover:text-c2sa-crimson">
                    {jobTitle}
                  </h3>

                  <p className="line-clamp-2 text-xs text-slate-600 max-w-2xl leading-relaxed">
                    {p.cover_letter}
                  </p>

                  {isClient && (
                    <div className="pt-0.5">
                      <Link
                        href={`/profiles/${p.freelancer_id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-[11px] font-bold text-brand hover:underline inline-flex items-center gap-1"
                      >
                        <span>Inspect Applicant Profile &amp; Deeds &rarr;</span>
                      </Link>
                    </div>
                  )}

                  <p className="text-[11px] text-slate-400 font-mono">
                    {isClient ? "Applicant submitted on" : "You submitted on"}{" "}
                    {new Date(p.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-6 border-t border-slate-100 pt-4 sm:border-0 sm:pt-0">
                  <div className="text-left sm:text-right">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      {isClient ? "Proposed Bid" : "Your Bid"}
                    </p>
                    <p className="text-xl font-extrabold text-slate-900 font-mono">
                      {formatEtb(p.bid_amount_etb)}
                    </p>
                  </div>

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-500 transition group-hover:border-c2sa-crimson group-hover:bg-c2sa-crimson group-hover:text-white">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
