"use client";

import Link from "next/link";
import {
  BadgeCheck,
  FileCheck2,
  Sparkles,
  Plus,
  Users,
  Briefcase,
  Wallet,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { formatEtb } from "@/lib/utils";
import type { Contract, Gig, Job, Profile, Proposal } from "@/lib/types";
import { computeFreelancerLevel } from "@/lib/levels";
import type { EngagementsSubTab } from "./EngagementsWorkspace";

interface TalentItem {
  profile: Profile;
  completed_contracts: number;
  active_gigs: number;
  reviews_count: number;
}

interface Props {
  isClient: boolean;
  isFreelancer: boolean;
  isAdmin?: boolean;
  earnedOrSpentEtb: number;
  totalEscrowVolume: number;
  activeContracts: Contract[];
  contracts: Contract[];
  proposals: Proposal[];
  myJobs: Job[];
  myGigs: Gig[];
  recommendedJobs: Job[];
  recommendedTalent: TalentItem[];
  recommendedGigs: Gig[];
  onOpenEngagements?: (subTab: EngagementsSubTab) => void;
  onOpenContracts: () => void;
}

export function OverviewTab({
  isClient,
  isFreelancer,
  isAdmin,
  earnedOrSpentEtb,
  totalEscrowVolume,
  activeContracts,
  contracts,
  proposals,
  myJobs,
  myGigs,
  recommendedJobs,
  recommendedTalent,
  recommendedGigs,
  onOpenEngagements,
  onOpenContracts,
}: Props) {
  const postingsCount = isClient ? myJobs.length : myGigs.length;

  return (
    <div className="space-y-6">
      {/* Tactical Quick Action Launcher */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {isAdmin ? (
          <>
            <Link
              href="/admin/disputes"
              className="card-surface p-3.5 rounded-2xl border border-slate-200/90 hover:border-slate-300 transition shadow-sm flex items-center gap-3 group bg-white"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 group-hover:bg-slate-900 group-hover:text-white transition shrink-0">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">Dispute Center</p>
                <p className="text-[10px] text-slate-500 truncate">Arbitrate escrow</p>
              </div>
            </Link>
            <Link
              href="/contracts"
              className="card-surface p-3.5 rounded-2xl border border-slate-200/90 hover:border-slate-300 transition shadow-sm flex items-center gap-3 group bg-white"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 group-hover:bg-slate-900 group-hover:text-white transition shrink-0">
                <FileCheck2 className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">All Contracts</p>
                <p className="text-[10px] text-slate-500 truncate">Platform escrows</p>
              </div>
            </Link>
            <Link
              href="/jobs/new"
              className="card-surface p-3.5 rounded-2xl border border-slate-200/90 hover:border-slate-300 transition shadow-sm flex items-center gap-3 group bg-white"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 group-hover:bg-slate-900 group-hover:text-white transition shrink-0">
                <Plus className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">Post Project</p>
                <p className="text-[10px] text-slate-500 truncate">Create project RFP</p>
              </div>
            </Link>
            <Link
              href="/talent"
              className="card-surface p-3.5 rounded-2xl border border-slate-200/90 hover:border-slate-300 transition shadow-sm flex items-center gap-3 group bg-white"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 group-hover:bg-slate-900 group-hover:text-white transition shrink-0">
                <Users className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">Talent Directory</p>
                <p className="text-[10px] text-slate-500 truncate">Browse specialists</p>
              </div>
            </Link>
          </>
        ) : isClient ? (
          <>
            <Link
              href="/jobs/new"
              className="card-surface p-3.5 rounded-2xl border border-slate-200/90 hover:border-slate-300 transition shadow-sm flex items-center gap-3 group bg-white"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 group-hover:bg-slate-900 group-hover:text-white transition shrink-0">
                <Plus className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">Post Project RFP</p>
                <p className="text-[10px] text-slate-500 truncate">Receive bids</p>
              </div>
            </Link>
            <Link
              href="/talent"
              className="card-surface p-3.5 rounded-2xl border border-slate-200/90 hover:border-slate-300 transition shadow-sm flex items-center gap-3 group bg-white"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 group-hover:bg-slate-900 group-hover:text-white transition shrink-0">
                <Users className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">Find Specialists</p>
                <p className="text-[10px] text-slate-500 truncate">Vetted talent</p>
              </div>
            </Link>
            <Link
              href="/gigs"
              className="card-surface p-3.5 rounded-2xl border border-slate-200/90 hover:border-slate-300 transition shadow-sm flex items-center gap-3 group bg-white"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 group-hover:bg-slate-900 group-hover:text-white transition shrink-0">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">Catalog Services</p>
                <p className="text-[10px] text-slate-500 truncate">Instant delivery</p>
              </div>
            </Link>
            <Link
              href="/verify"
              className="card-surface p-3.5 rounded-2xl border border-slate-200/90 hover:border-slate-300 transition shadow-sm flex items-center gap-3 group bg-white"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 group-hover:bg-slate-900 group-hover:text-white transition shrink-0">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">Verify Deeds</p>
                <p className="text-[10px] text-slate-500 truncate">SHA-256 seal</p>
              </div>
            </Link>
          </>
        ) : (
          <>
            <Link
              href="/gigs/new"
              className="card-surface p-3.5 rounded-2xl border border-slate-200/90 hover:border-slate-300 transition shadow-sm flex items-center gap-3 group bg-white"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 group-hover:bg-slate-900 group-hover:text-white transition shrink-0">
                <Plus className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">Publish Service</p>
                <p className="text-[10px] text-slate-500 truncate">3-tier package</p>
              </div>
            </Link>
            <Link
              href="/jobs"
              className="card-surface p-3.5 rounded-2xl border border-slate-200/90 hover:border-slate-300 transition shadow-sm flex items-center gap-3 group bg-white"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 group-hover:bg-slate-900 group-hover:text-white transition shrink-0">
                <Briefcase className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">Browse RFPs</p>
                <p className="text-[10px] text-slate-500 truncate">Open briefs</p>
              </div>
            </Link>
            <Link
              href="/escrow"
              className="card-surface p-3.5 rounded-2xl border border-slate-200/90 hover:border-slate-300 transition shadow-sm flex items-center gap-3 group bg-white"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 group-hover:bg-slate-900 group-hover:text-white transition shrink-0">
                <Wallet className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">Protected Escrow</p>
                <p className="text-[10px] text-slate-500 truncate">Status ledger</p>
              </div>
            </Link>
            <Link
              href="/verify"
              className="card-surface p-3.5 rounded-2xl border border-slate-200/90 hover:border-slate-300 transition shadow-sm flex items-center gap-3 group bg-white"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 group-hover:bg-slate-900 group-hover:text-white transition shrink-0">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">Verify Deeds</p>
                <p className="text-[10px] text-slate-500 truncate">SHA-256 seal</p>
              </div>
            </Link>
          </>
        )}
      </div>

      {/* ULTRA-ATTRACTIVE TACTICAL STATS HUD */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Settlement Volume */}
        <div className="card-surface relative overflow-hidden rounded-2xl p-4 sm:p-5 border border-slate-200/90 bg-white shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {isClient ? "Escrow Capital Funded" : "Net Earnings Disbursed"}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-700">
              {earnedOrSpentEtb > 0 ? "Active Capital" : "Vault Protected"}
            </span>
          </div>
          <div className="my-2.5">
            <p className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
              {formatEtb(earnedOrSpentEtb)}
            </p>
          </div>
          <p className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-slate-500" />
            <span>Telebirr &amp; CBE settlement rail</span>
          </p>
        </div>

        {/* Card 2: Active Escrows (Clickable) */}
        <button
          type="button"
          onClick={() => onOpenEngagements ? onOpenEngagements("contracts") : onOpenContracts()}
          className="card-surface relative overflow-hidden rounded-2xl p-4 sm:p-5 border border-slate-200/90 hover:border-slate-300 transition shadow-sm flex flex-col justify-between text-left group bg-white cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Active Escrow Rooms
            </span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
          </div>
          <div className="my-2.5">
            <p className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight group-hover:text-brand transition-colors">
              {activeContracts.length}
            </p>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span className="font-mono font-bold text-slate-700">{formatEtb(totalEscrowVolume)}</span>
            <span className="text-slate-700 font-bold group-hover:text-brand flex items-center gap-0.5">
              <span>View</span>
              <ArrowRight className="h-2.5 w-2.5" />
            </span>
          </div>
        </button>

        {/* Card 3: Postings / RFPs (Clickable) */}
        <button
          type="button"
          onClick={() => onOpenEngagements ? onOpenEngagements("postings") : undefined}
          className="card-surface relative overflow-hidden rounded-2xl p-4 sm:p-5 border border-slate-200/90 hover:border-slate-300 transition shadow-sm flex flex-col justify-between text-left group bg-white cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {isClient ? "My Active RFPs" : "Published Services"}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-700">
              Marketplace
            </span>
          </div>
          <div className="my-2.5">
            <p className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight group-hover:text-brand transition-colors">
              {postingsCount}
            </p>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>{isClient ? "Client Briefs" : "Live Catalog"}</span>
            <span className="text-slate-700 font-bold group-hover:text-brand flex items-center gap-0.5">
              <span>Manage</span>
              <ArrowRight className="h-2.5 w-2.5" />
            </span>
          </div>
        </button>

        {/* Card 4: Proposals Pipeline (Clickable) */}
        <button
          type="button"
          onClick={() => onOpenEngagements ? onOpenEngagements("proposals") : undefined}
          className="card-surface relative overflow-hidden rounded-2xl p-4 sm:p-5 border border-slate-200/90 hover:border-slate-300 transition shadow-sm flex flex-col justify-between text-left group bg-white cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {isClient ? "Candidate Proposals" : "Submitted Bids"}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-700">
              Pipeline
            </span>
          </div>
          <div className="my-2.5">
            <p className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight group-hover:text-brand transition-colors">
              {proposals.length}
            </p>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>Awaiting Review</span>
            <span className="text-slate-700 font-bold group-hover:text-brand flex items-center gap-0.5">
              <span>Review</span>
              <ArrowRight className="h-2.5 w-2.5" />
            </span>
          </div>
        </button>
      </div>

      {/* Recent Escrow Engagements Summary */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileCheck2 className="h-4 w-4 text-brand" />
            <span>Active Escrow Rooms</span>
          </h2>
          <button
            onClick={() => onOpenEngagements ? onOpenEngagements("contracts") : onOpenContracts()}
            className="text-xs text-brand hover:underline font-bold"
          >
            All Contracts ({contracts.length}) →
          </button>
        </div>

        {contracts.length === 0 ? (
          <div className="card-surface rounded-2xl p-6 text-center text-xs text-slate-500 border border-slate-200 bg-white">
            {isClient
              ? "No active contracts. Hire a specialist on an RFP or order a service package."
              : "No active client contracts right now. Submit proposals to start winning engagements."}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {contracts.slice(0, 3).map((c) => {
              const contractTitle = c.gigs?.title || c.jobs?.title || "Contract Engagement";
              return (
                <div
                  key={c.id}
                  className="card-surface rounded-2xl p-4 border border-slate-200/90 hover:border-slate-300 transition shadow-sm flex flex-col justify-between space-y-3 bg-white"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="badge-c2sa text-[10px]">
                        {c.package_tier ? `${c.package_tier} Service` : "Project Escrow"}
                      </span>
                      <span className="font-semibold text-[10px] text-emerald-700 capitalize">
                        {c.escrow_status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <h3 className="text-xs font-bold text-slate-900 line-clamp-1">{contractTitle}</h3>
                    <p className="text-[11px] font-mono text-slate-500">
                      Amount: <strong className="text-slate-900">{formatEtb(c.total_amount_etb)}</strong>
                    </p>
                  </div>
                  <Link
                    href={`/contracts/${c.id}`}
                    className="btn-c2sa w-full !py-1.5 !text-xs font-bold text-center block"
                  >
                    Open Escrow Room →
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Curated Feed (Compact, High-Signal, No Bloat) */}
      {isFreelancer ? (
        <div className="space-y-3 pt-3 border-t border-slate-200">
          <div className="flex items-center justify-between pb-1">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-brand" />
              <span>Curated RFPs For You</span>
            </h2>
            <Link href="/jobs" className="text-xs text-brand hover:underline font-bold">
              Browse All ({recommendedJobs.length}) →
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {recommendedJobs.slice(0, 4).map((job) => (
              <div
                key={job.id}
                className="card-surface rounded-2xl p-4 border border-slate-200/90 hover:border-slate-300 transition shadow-sm flex flex-col justify-between space-y-3 bg-white"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="badge-c2sa text-[10px]">{job.category}</span>
                    <span className="font-mono text-xs font-bold text-slate-900">
                      {formatEtb(job.budget_etb)}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-slate-900 line-clamp-1 hover:text-brand">
                    <Link href={`/jobs/${job.id}`}>{job.title}</Link>
                  </h3>

                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                    {job.description}
                  </p>

                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {job.skills.slice(0, 3).map((s) => (
                      <span key={s} className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-[10px] text-emerald-700 font-bold">✓ Open RFP</span>
                  <Link
                    href={`/jobs/${job.id}`}
                    className="btn-secondary !py-1 !px-3 text-xs font-bold hover:border-slate-400 hover:text-slate-900"
                  >
                    Submit Bid →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3 pt-3 border-t border-slate-200">
          <div className="flex items-center justify-between pb-1">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-brand" />
              <span>Recommended Specialists &amp; Packages</span>
            </h2>
            <Link href="/talent" className="text-xs text-brand hover:underline font-bold">
              Browse Specialists →
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {recommendedTalent.slice(0, 2).map((t) => (
              <div
                key={t.profile.id}
                className="card-surface rounded-2xl p-4 border border-slate-200/90 hover:border-slate-300 transition shadow-sm flex flex-col justify-between space-y-3 bg-white"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-xs font-black text-white">
                        {t.profile.full_name?.slice(0, 2).toUpperCase() || "SP"}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 flex items-center gap-1">
                          {t.profile.full_name}
                          {t.profile.is_verified && <BadgeCheck className="h-3.5 w-3.5 text-emerald-600" />}
                        </p>
                        <p className="text-[10px] text-slate-500 font-medium">
                          ★ {Number(t.profile.rating).toFixed(1)} · {t.completed_contracts} completed
                        </p>
                      </div>
                    </div>
                    {(() => {
                      const lvl = computeFreelancerLevel(Number(t.profile.rating), t.completed_contracts);
                      return (
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-bold ${lvl.bgClass} ${lvl.colorClass} ${lvl.borderClass}`}>
                          {lvl.badgeLabel}
                        </span>
                      );
                    })()}
                  </div>

                  <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                    {t.profile.bio || "Available for client contract engagements."}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-[10px] text-emerald-700 font-bold">✓ Vetted Talent</span>
                  <Link
                    href={`/profiles/${t.profile.id}`}
                    className="btn-secondary !py-1 !px-3 text-xs font-bold hover:border-slate-400 hover:text-slate-900"
                  >
                    View Profile →
                  </Link>
                </div>
              </div>
            ))}

            {recommendedGigs.slice(0, 2).map((g) => (
              <div
                key={g.id}
                className="card-surface rounded-2xl p-4 border border-slate-200/90 hover:border-slate-300 transition shadow-sm flex flex-col justify-between space-y-3 bg-white"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="badge-c2sa text-[10px]">{g.category}</span>
                    <span className="font-mono text-xs font-bold text-slate-900">
                      From {formatEtb(g.packages.basic.price_etb)}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-slate-900 line-clamp-1 hover:text-brand">
                    <Link href={`/gigs/${g.id}`}>{g.title}</Link>
                  </h3>

                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                    {g.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-[10px] text-emerald-700 font-bold">✓ Ready Package</span>
                  <Link
                    href={`/gigs/${g.id}`}
                    className="btn-c2sa !py-1 !px-3 text-xs font-bold"
                  >
                    Order Service →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
